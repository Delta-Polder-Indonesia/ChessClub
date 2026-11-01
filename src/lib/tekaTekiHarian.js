/**
 * Logika Teka-teki Harian Chess.com yang dipakai halaman
 * `src/halaman/TekaTekiHarian/TekaTekiHarian.jsx`.
 *
 * Semua fungsi di sini MURNI (tanpa React/DOM) supaya bisa diuji langsung dari
 * Node: `scripts/uji-teka-teki-harian.mjs`.
 *
 * Alur data:
 *   server (/api/teka-teki-harian) → { fen, pgn, … }
 *   pgn → parsePgnTekaTeki() → { fen, langkah: ["e2e4", …] }
 *   halaman memainkan langkah[0] (pemain), lalu langkah[1] (balasan lawan), …
 *
 * Format langkah internal mengikuti basis data teka-teki situs ini:
 * `e2-e4` dan `e7-e8q` (aturan "from-to" + huruf promosi) supaya bisa langsung
 * dimakan `parseLangkah()` di `src/lib/tekaTeki.js`.
 */
import { Chess } from "chess.js";

const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Tanggal UTC hari ini (`YYYY-MM-DD`) — sama dengan yang dipakai server. */
export function tanggalHariIni(sekarang = new Date()) {
  return sekarang.toISOString().slice(0, 10);
}

/** Apakah `nilai` tanggal kalender sah berformat `YYYY-MM-DD`? */
export function tanggalSah(nilai) {
  if (typeof nilai !== "string") return false;
  const cocok = POLA_TANGGAL.exec(nilai);
  if (!cocok) return false;
  const [, tahun, bulan, hari] = cocok.map(Number);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  return (
    tanggal.getUTCFullYear() === tahun &&
    tanggal.getUTCMonth() === bulan - 1 &&
    tanggal.getUTCDate() === hari
  );
}

/** Geser tanggal `YYYY-MM-DD` sebanyak `hari` (boleh negatif). */
export function geserTanggal(nilai, hari) {
  if (!tanggalSah(nilai)) return null;
  const langkah = Number(hari);
  if (!Number.isFinite(langkah)) return null;
  const [tahun, bulan, tanggal] = nilai.split("-").map(Number);
  return new Date(Date.UTC(tahun, bulan - 1, tanggal + langkah))
    .toISOString()
    .slice(0, 10);
}

/** Format `YYYY-MM-DD` → teks tanggal yang enak dibaca (Intl, locale `id-ID`). */
export function tanggalTerbaca(nilai, locale = "id-ID") {
  if (!tanggalSah(nilai)) return nilai || "";
  const [tahun, bulan, hari] = nilai.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(tahun, bulan - 1, hari)));
  } catch {
    return nilai;
  }
}

/**
 * Ambil tag header PGN (`[FEN "..."]`) bila ada.
 * Dipakai sebagai cadangan ketika server tidak mengirim `fen` sendiri.
 */
export function fenDariPgn(pgn) {
  if (typeof pgn !== "string") return null;
  const cocok = /\[\s*FEN\s+"([^"]+)"\s*\]/i.exec(pgn);
  return cocok ? cocok[1].trim() : null;
}

/**
 * Buang bagian PGN yang bukan langkah: komentar `{…}`, variasi `(…)`
 * (bersarang pun dihabiskan), NAG `$n`, nomor langkah, dan hasil partai.
 * Hasilnya deretan token SAN.
 */
export function sanDariPgn(pgn) {
  if (typeof pgn !== "string") return [];

  let teks = pgn
    // Header tag: [Nama "Nilai"] — satu baris penuh.
    .replace(/^\s*\[[^\]]*\]\s*$/gm, " ")
    // Komentar kurung kurawal.
    .replace(/\{[^}]*\}/g, " ")
    .replace(/;[^\n]*/g, " ");

  // Variasi bersarang: buang dari kurung terdalam keluar.
  let sebelumnya;
  do {
    sebelumnya = teks;
    teks = teks.replace(/\([^()]*\)/g, " ");
  } while (teks !== sebelumnya);

  return teks
    .replace(/\$\d+/g, " ")
    .replace(/\d+\s*\.\s*\.\s*\./g, " ")
    .replace(/\d+\s*\./g, " ")
    .replace(/\b(1-0|0-1|1\/2-1\/2|\*)\b/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Ubah PGN teka-teki menjadi daftar langkah UCI yang sudah diverifikasi legal.
 *
 * `fen` dari server dipakai sebagai posisi awal; bila tidak ada, FEN di dalam
 * PGN yang dipakai. Langkah yang tidak legal menghentikan proses (bukan
 * dilempar) supaya halaman tetap bisa menampilkan posisi walau data Chess.com
 * berubah bentuk.
 *
 * @returns {{ fen: string|null, langkah: string[], utuh: boolean, galat: string|null }}
 *   `langkah` berisi notasi `from-to` (mis. `g1-f3`, `e7-e8q`).
 *   `utuh` = seluruh token PGN berhasil dimainkan sampai akhir.
 */
export function parsePgnTekaTeki(pgn, { fen } = {}) {
  const fenAwal = (typeof fen === "string" && fen.trim()) || fenDariPgn(pgn);
  const hasil = { fen: fenAwal || null, langkah: [], utuh: false, galat: null };

  if (!fenAwal) {
    hasil.galat = "fen-tidak-ada";
    return hasil;
  }

  let game;
  try {
    game = new Chess(fenAwal);
  } catch {
    hasil.galat = "fen-tidak-sah";
    return hasil;
  }
  hasil.fen = game.fen();

  const token = sanDariPgn(pgn);
  for (const san of token) {
    let langkah;
    try {
      langkah = game.move(san);
    } catch {
      // Token pertama bisa berupa nomor langkah yang lolos pembersihan atau
      // simbol anotasi yang tidak dikenal. Berhenti di sini: sisa token tidak
      // lagi bisa dipastikan urutannya.
      hasil.galat = hasil.langkah.length ? "langkah-tidak-legal" : "san-tidak-dikenal";
      return hasil;
    }
    if (!langkah) {
      hasil.galat = "langkah-tidak-legal";
      return hasil;
    }
    hasil.langkah.push(
      `${langkah.from}-${langkah.to}${langkah.promotion || ""}`
    );
  }

  hasil.utuh = hasil.langkah.length > 0;
  if (!hasil.utuh) hasil.galat = "tanpa-langkah";
  return hasil;
}

/**
 * Susun langkah SAN menjadi baris riwayat `{ nomor, putih, hitam }`.
 *
 * `warnaPertama` penting: teka-teki Chess.com bisa berpihak pada HITAM, dan
 * pada kasus itu langkah hitam adalah langkah nomor 1 sementara balasan putih
 * masuk nomor 2 — bukan kolom yang tertukar seperti pada pengelompokan
 * dua-dua buta.
 */
export function pasanganLangkah(langkah = [], warnaPertama = "w") {
  const baris = [];
  const perNomor = new Map();
  let nomor = 1;
  let warna = warnaPertama === "b" ? "b" : "w";

  for (const san of langkah) {
    if (!san) continue;
    let barisIni = perNomor.get(nomor);
    if (!barisIni) {
      barisIni = { nomor, putih: null, hitam: null };
      perNomor.set(nomor, barisIni);
      baris.push(barisIni);
    }
    if (warna === "w") {
      barisIni.putih = san;
      warna = "b";
    } else {
      barisIni.hitam = san;
      warna = "w";
      nomor += 1;
    }
  }
  return baris;
}

/* ====================================================================== */
/* Snapshot statis (tanpa API)                                            */
/* ====================================================================== */

/*
 * Situs ini TIDAK memanggil Chess.com setiap kali halaman dibuka. Snapshot
 * dibuat oleh `scripts/ambil-teka-teki-harian.mjs` dan disajikan sebagai
 * berkas statis:
 *
 *   public/data/teka-teki-harian/indeks.json      daftar tahun + rentang
 *   public/data/teka-teki-harian/terbaru.json     7 soal terakhir (widget)
 *   public/data/teka-teki-harian/<tahun>.json     semua soal tahun itu
 *
 * Isi satu soal hanya `{ tanggal, fen, langkah }` — tanpa judul, penulis,
 * atau media. Dengan begitu halaman tetap hidup walau Chess.com sedang
 * gangguan, dan tidak ada permintaan ke pihak ketiga saat pengunjung memakai
 * situs.
 */

/** Ubah `"e2-e4;e7-e5"` → `["e2-e4", "e7-e5"]`. */
export function langkahDariTeks(teks) {
  if (Array.isArray(teks)) return teks.filter(Boolean);
  return String(teks || "")
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Samakan satu catatan snapshot menjadi bentuk yang dipakai halaman. */
export function soalDariCatatan(catatan) {
  const tanggal = tanggalSah(catatan?.tanggal) ? catatan.tanggal : null;
  const fen = typeof catatan?.fen === "string" ? catatan.fen.trim() : "";
  if (!tanggal || !fen) return null;
  const langkah = langkahDariTeks(catatan?.langkah);
  if (!langkah.length) return null;
  return {
    tanggal,
    fen,
    langkah,
    orientasi: warnaGiliran(fen),
    url: `https://www.chess.com/daily-chess-puzzle/${tanggal}`,
    sumber: "chess.com",
  };
}

/**
 * Pilih soal untuk satu tanggal dari snapshot tahunan.
 *
 * Penelusuran arsip sengaja bertingkat supaya tidak mengunduh 20 berkas
 * sekaligus:
 *  1. `terbaru.json` (±2 KB) → cukup untuk hari ini dan beberapa hari terakhir;
 *  2. berkas tahun tanggal itu (±40 KB) → untuk tanggal yang lebih lama.
 *
 * @returns {Promise<object|null>} soal atau `null` bila tanggal itu tidak ada.
 */
export async function ambilSoalTanggal(tanggal, { muat } = {}) {
  if (!tanggalSah(tanggal)) return null;
  const baca = muat || muatJson;

  const terbaru = await baca("data/teka-teki-harian/terbaru.json").catch(() => null);
  const dariTerbaru = (terbaru?.soal || [])
    .map(soalDariCatatan)
    .find((s) => s && s.tanggal === tanggal);
  if (dariTerbaru) return dariTerbaru;

  const tahun = tanggal.slice(0, 4);
  const berkasTahun = await baca(`data/teka-teki-harian/${tahun}.json`).catch(
    () => null
  );
  return (
    (berkasTahun?.soal || [])
      .map(soalDariCatatan)
      .find((s) => s && s.tanggal === tanggal) || null
  );
}

/** Indeks snapshot: tahun mana saja yang tersedia, rentang, dan jumlah soal. */
export async function ambilIndeksSnapshot({ muat } = {}) {
  const baca = muat || muatJson;
  const indeks = await baca("data/teka-teki-harian/indeks.json").catch(() => null);
  if (!indeks || !Array.isArray(indeks.tahun)) return null;
  return indeks;
}

/** Soal terbaru (7 buah) — dipakai widget di halaman Landing. */
export async function ambilSoalTerbaru({ muat } = {}) {
  const baca = muat || muatJson;
  const terbaru = await baca("data/teka-teki-harian/terbaru.json").catch(() => null);
  return (terbaru?.soal || []).map(soalDariCatatan).filter(Boolean).reverse();
}

/**
 * `fetch` JSON relatif terhadap akar situs. Dipisah sebagai parameter
 * (`muat`) supaya uji bisa menyuntikkan pembaca palsu tanpa DOM.
 */
async function muatJson(jalur) {
  const dasar =
    (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
  const res = await fetch(`${dasar}${String(jalur).replace(/^\//, "")}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} untuk ${jalur}`);
  return res.json();
}

/** Warna pemain yang harus melangkah pada FEN ini (sama dengan `fen.split`). */
export function warnaGiliran(fen) {
  const bagian = String(fen || "").split(/\s+/);
  return bagian[1] === "b" ? "b" : "w";
}
