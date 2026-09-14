/**
 * Orkestrasi analisis anti-cheat lintas riwayat pemain.
 *
 * Dipakai tab "Deteksi engine" pada `DashboardAkun.jsx`. Perhitungan angkanya
 * ada di `../mesin/antiCheat.js` (murni); berkas ini hanya mengurus bagian
 * yang mahal dan berurusan dengan dunia luar:
 *
 *  1. MEMBATASI KERJA — `parsePGN` menjalankan Stockfish sekali per langkah,
 *     jadi menganalisis seluruh arsip akun berarti ribuan pencarian. Yang
 *     dianalisis hanya `BATAS_PARTAI` partai terbaru tempat `username`
 *     benar-benar bermain, pada `KEDALAMAN_AGGREGAT` ply (lebih dangkal dari
 *     kedalaman analisis tunggal) — cukup untuk metrik statistik, jauh lebih
 *     cepat.
 *  2. CACHE per id partai + kedalaman + MultiPV (pola `cachePartai`):
 *     memori sesi + penulisan-lulus ke localStorage sehingga mengulang
 *     analisis di kunjungan berikutnya tidak membayar dua kali (bisa
 *     dibersihkan lewat `bersihkanCacheAntiCheat`).
 *  3. BATAL — `AbortSignal` diteruskan ke `parsePGN` (pola tombol Batal di
 *     `selectChessCom.jsx`). Pembatalan menghentikan loop, tetapi hasil partai
 *     yang sudah selesai TETAP dikembalikan: sebagian gambaran lebih berguna
 *     daripada tidak sama sekali.
 *  4. PROGRES + WAKTU — callback `progres({ jenis, ke, total, … })` untuk
 *     bilah muat, dan pengukuran durasi per partai (dasar keputusan
 *     menaikkan/menurunkan kedalaman atau MULTI_PV — lihat README).
 *
 * `parserPgn` dan `cariBuku` bisa disuntikkan; uji memakai pemalsu agar tidak
 * perlu memuat worker Stockfish.
 */

import { GALAT_BATAL, MULTI_PV, parsePGN } from "../mesin/engine.js";
import { cariNamaPembukaan } from "../mesin/buku.js";
import { agregatSkorPemain, hitungSkorKecurigaan, ratingDariMetadata, warnaPemainDariMetadata } from "../mesin/antiCheat.js";

/** Jumlah maksimum partai yang dianalisis dalam satu jalan. */
export const BATAS_PARTAI = 12;

/**
 * Kedalaman untuk mode agregat. Analisis tunggal memakai 10–20 ply; di sini
 * yang dibutuhkan adalah perbandingan langkah-pemain vs langkah-engine dan
 * selisih eval, keduanya sudah stabil pada kedalaman rendah, sementara
 * waktunya turun drastis karena dikalikan jumlah partai.
 */
export const KEDALAMAN_AGGREGAT = 8;

/*
 * Cache sesi hasil per partai. Kuncinya menyertakan kedalaman dan MULTI_PV
 * karena hasil pada 8 ply dan 13 ply memang berbeda, dan hasil tanpa
 * kandidat MultiPV (analisis generasi lama) tidak boleh tercampur dengan
 * hasil ber-kandidat — menyimpan keduanya terpisah lebih jujur daripada
 * menimpa dan berpura-pura setara.
 */
const cacheHasilPartai = new Map();

export function kunciCachePartai(id, kedalaman) {
  return `${id ?? ""}|d${kedalaman}|mp${MULTI_PV}`;
}

/*
 * Lapisan localStorage — cache lintas kunjungan. Kunci simpanan menyertakan
 * penanda versi (`v2`) karena bentuk hasil ikut berubah saat metrik baru
 * ditambahkan; hasil lama yang tidak punya field baru TIDAK boleh tercampur.
 * Semua akses dibungkus try/catch: localStorage bisa penuh, dinonaktifkan,
 * atau tidak ada (SSR/uji) — cache itu optimalisasi, bukan kebutuhan benar.
 */
const KUNCI_SIMPANAN_CACHE = "kci-anticheat-cache-v2";

function bacaSimpananCache() {
  try {
    if (typeof localStorage === "undefined") return {};
    const mentah = localStorage.getItem(KUNCI_SIMPANAN_CACHE);
    const urai = mentah ? JSON.parse(mentah) : null;
    return urai && typeof urai === "object" ? urai : {};
  } catch {
    return {};
  }
}

function tulisSimpananCache(objek) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KUNCI_SIMPANAN_CACHE, JSON.stringify(objek));
  } catch {
    /* penuh/dinonaktifkan — cache memori tetap jalan */
  }
}

let cacheSudahDimuat = false;

function pastikanCacheDimuat() {
  if (cacheSudahDimuat) return;
  cacheSudahDimuat = true;
  const tersimpan = bacaSimpananCache();
  for (const [kunci, nilai] of Object.entries(tersimpan)) {
    if (!cacheHasilPartai.has(kunci) && nilai && typeof nilai === "object") {
      cacheHasilPartai.set(kunci, nilai);
    }
  }
}

export function bacaCachePartai(id, kedalaman) {
  pastikanCacheDimuat();
  return cacheHasilPartai.get(kunciCachePartai(id, kedalaman)) ?? null;
}

export function simpanCachePartai(id, kedalaman, hasil) {
  if (!id || !hasil) return;
  pastikanCacheDimuat();
  cacheHasilPartai.set(kunciCachePartai(id, kedalaman), hasil);
  const cermin = bacaSimpananCache();
  cermin[kunciCachePartai(id, kedalaman)] = hasil;
  tulisSimpananCache(cermin);
}

export function bersihkanCacheAntiCheat() {
  cacheHasilPartai.clear();
  cacheSudahDimuat = true;
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(KUNCI_SIMPANAN_CACHE);
  } catch {
    /* abaikan */
  }
}

export function ukuranCacheAntiCheat() {
  pastikanCacheDimuat();
  return cacheHasilPartai.size;
}

/** Warna `username` pada satu partai, dari metadata basis data. */
export function warnaPemainPadaPartai(partai, username) {
  const nama = String(username ?? "").trim().toLowerCase();
  if (!nama) return null;
  if (String(partai?.whiteName ?? "").trim().toLowerCase() === nama) return "w";
  if (String(partai?.blackName ?? "").trim().toLowerCase() === nama) return "b";
  return null;
}

/**
 * Pilih partai yang layak dianalisis: punya teks PGN, `username` ikut bermain,
 * terbaru lebih dulu, maksimal `batas` partai.
 */
export function pilihPartaiUntukAnalisis(partai, username, { batas = BATAS_PARTAI } = {}) {
  const nama = String(username ?? "").trim().toLowerCase();
  const layak = (Array.isArray(partai) ? partai : []).filter((p) => {
    if (!p || typeof p.pgn !== "string" || !p.pgn.trim()) return false;
    return nama ? warnaPemainPadaPartai(p, username) !== null : true;
  });
  const terbaru = [...layak].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  return Number.isFinite(batas) && batas > 0 ? terbaru.slice(0, batas) : terbaru;
}

/**
 * Jalankan analisis agregat atas riwayat pemain.
 *
 * @returns {Promise<{agregat: object, dianalisis: number, total: number,
 *   dariCache: number, dibatalkan: boolean, galat: object[]}>}
 */
export async function analisisRiwayatAntiCheat({
  partai,
  username = "",
  mesin,
  kedalaman = KEDALAMAN_AGGREGAT,
  sinyal = null,
  progres = null,
  parserPgn = parsePGN,
  cariBuku = cariNamaPembukaan,
} = {}) {
  const daftar = pilihPartaiUntukAnalisis(partai, username);
  const hasilPartai = [];
  const galat = [];
  let dariCache = 0;
  // Pengukuran durasi per partai (di luar cache) — lihat README roadmap.
  const durasiPerPartai = [];
  let totalDurasiMs = 0;

  // Tabel buku dipakai untuk menandai langkah "book" agar tidak ikut dinilai.
  // Kegagalan unduh tidak boleh menggagalkan seluruh analisis.
  let openings = {};
  try {
    openings = (await cariBuku?.()) ?? {};
  } catch {
    openings = {};
  }

  for (let i = 0; i < daftar.length; i++) {
    if (sinyal?.aborted) break;
    const p = daftar[i];
    const warna = warnaPemainPadaPartai(p, username) ?? null;
    const tersimpan = bacaCachePartai(p.id, kedalaman);
    let hasil = tersimpan;

    if (!hasil) {
      const mulai = Date.now();
      try {
        const { metadata, moves } = await parserPgn(mesin, p.pgn, kedalaman, openings, () => {}, sinyal, {
          multiPv: MULTI_PV,
        });
        const rating = ratingDariMetadata(metadata);
        hasil = { metadata, hasil: hitungSkorKecurigaan(moves, { rating }) };
        const ms = Date.now() - mulai;
        durasiPerPartai.push({ id: p.id, ms });
        totalDurasiMs += ms;
        simpanCachePartai(p.id, kedalaman, hasil);
      } catch (e) {
        if (sinyal?.aborted || e?.kunci === GALAT_BATAL) break;
        galat.push({ id: p.id, pesan: e?.message ?? String(e) });
        progres?.({ jenis: "galat", ke: i + 1, total: daftar.length, id: p.id, pesan: galat[galat.length - 1].pesan });
        continue;
      }
    } else {
      dariCache++;
    }

    /*
     * Partai ini SUDAH selesai diurai — hasilnya disimpan apa pun yang terjadi
     * sesudahnya. Tombol Batal menghentikan partai BERIKUTNYA, bukan membuang
     * kerja yang sudah dibayar; sebagian gambaran tetap lebih berguna daripada
     * tidak sama sekali.
     */
    hasilPartai.push({
      id: p.id,
      timestamp: p.timestamp,
      timeClass: p.timeClass,
      warna: warna ?? warnaPemainDariMetadata(hasil.metadata, username),
      metadata: hasil.metadata,
      hasil: hasil.hasil,
    });
    progres?.({
      jenis: "progres",
      ke: hasilPartai.length,
      total: daftar.length,
      id: p.id,
      dariCache: Boolean(tersimpan),
    });

    if (sinyal?.aborted) break;
  }

  return {
    agregat: agregatSkorPemain(hasilPartai, username),
    dianalisis: hasilPartai.length,
    total: daftar.length,
    dariCache,
    dibatalkan: Boolean(sinyal?.aborted),
    galat,
    durasi: {
      totalMs: totalDurasiMs,
      rataMs: durasiPerPartai.length ? Math.round(totalDurasiMs / durasiPerPartai.length) : null,
      perPartai: durasiPerPartai,
    },
  };
}
