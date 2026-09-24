/**
 * Pengambilan basis data awan (Chess Cloud Database) untuk papan interaktif.
 *
 * Browser TIDAK memanggil chessdb.cn langsung — CSP situs membatasi
 * `connect-src` dan cdb.php tidak mengirim header CORS. Semua permintaan
 * lewat backend kita (`/api/basisdata-awan`, lihat server/src/basisDataAwan.js)
 * yang juga menyimpan cache per posisi.
 *
 * Modul ini menjaga dua hal di sisi klien:
 * - cache memori singkat, supaya menelusuri langkah bolak-balik (undo/redo)
 *   tidak memanggil server berulang kali untuk posisi yang sama;
 * - pembatalan lewat AbortSignal, supaya jawaban posisi lama tidak menimpa
 *   posisi yang sedang ditampilkan.
 */
import { urlApi } from "./api/core.js";

/** Cache klien: posisi -> { kedaluwarsa, nilai?, galat? }. Server sudah punya
 * cache sendiri yang jauh lebih panjang; ini hanya menghemat perjalanan
 * bolak-balik. Kegagalan disimpan SEBENTAR (30 detik) supaya satu layanan yang
 * sedang tidak terjangkau tidak dipanggil ulang tiap langkah — dan konsol
 * browser tidak dipenuhi galat jaringan yang sama berulang-ulang. */
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;
const TTL_GAGAL_MS = 30 * 1000;
const CACHE_MAKS = 200;

/**
 * Ambil daftar langkah basis data awan untuk satu posisi.
 *
 * @param {string} fen posisi (FEN; bidang yang kurang akan dilengkapi server)
 * @param {{signal?: AbortSignal, segarkan?: boolean}} [opsi] `segarkan`
 *        melewati cache klien (tombol "Coba lagi") — kegagalan yang tersimpan
 *        30 detik tidak boleh menghalangi percobaan yang diminta pengguna.
 * @returns {Promise<{sumber:string, posisi:string, diketahui:boolean,
 *                    akhir:string|null, langkah:Array<object>,
 *                    jumlahDinilai:number, jumlahBelumDinilai:number}>}
 * @throws {Error} bila jaringan gagal, dibatalkan (name = "AbortError"),
 *                 atau server membalas non-2xx. `kode` (bila ada) = kode
 *                 penyebab dari server, mis. "awan-tidak-terjangkau".
 */
export async function ambilBasisDataAwan(fen, { signal, segarkan = false } = {}) {
  const posisi = String(fen || "").trim();
  if (!posisi) throw new Error("Posisi kosong.");

  const tersimpan = cache.get(posisi);
  if (!segarkan && tersimpan && Date.now() < tersimpan.kedaluwarsa) {
    if (tersimpan.galat) throw buatGalat(tersimpan.galat, tersimpan.kode);
    return tersimpan.nilai;
  }

  // Tidak ada koneksi: jangan buang waktu pengguna dengan permintaan yang
  // pasti gagal (juga menghindari galat jaringan di konsol).
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const pesan = "Tidak ada koneksi internet.";
    simpanGagal(posisi, pesan, "offline");
    throw buatGalat(pesan, "offline");
  }

  try {
    const res = await fetch(urlApi(`/api/basisdata-awan?fen=${encodeURIComponent(posisi)}`), {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      // Teruskan pesan + kode server apa adanya: "menjawab 503" saja tidak
      // membantu siapa pun mendiagnosis masalah di produksi.
      let isi = null;
      try {
        isi = await res.json();
      } catch {
        isi = null;
      }
      throw buatGalat(
        typeof isi?.pesan === "string" && isi.pesan
          ? isi.pesan
          : `Basis data awan menjawab ${res.status}.`,
        typeof isi?.kode === "string" ? isi.kode : `http-${res.status}`
      );
    }

    const nilai = await res.json();
    simpanNilai(posisi, nilai);
    return nilai;
  } catch (e) {
    // Pembatalan bukan kegagalan layanan — jangan di-cache.
    if (e?.name !== "AbortError") simpanGagal(posisi, e?.message || String(e), e?.kode || null);
    throw e;
  }
}

function buangKelebihan() {
  while (cache.size > CACHE_MAKS) cache.delete(cache.keys().next().value);
}

function simpanNilai(posisi, nilai) {
  cache.set(posisi, { nilai, kedaluwarsa: Date.now() + TTL_MS });
  buangKelebihan();
}

function buatGalat(pesan, kode) {
  const galat = new Error(pesan);
  galat.kode = kode || null;
  return galat;
}

function simpanGagal(posisi, pesan, kode) {
  cache.set(posisi, { galat: pesan, kode, kedaluwarsa: Date.now() + TTL_GAGAL_MS });
  buangKelebihan();
}

/** Kosongkan cache klien (dipakai uji). */
export function bersihkanCacheAwanKlien() {
  cache.clear();
}

/**
 * Intip cache klien saja — TANPA kueri jaringan. Dipakai tinjauan pasca-
 * langkah komentator (data posisi sebelum langkah terakhir) supaya tidak ada
 * permintaan tambahan ke chessdb.cn: posisi itu baru saja tampil, hampir
 * selalu sudah tersimpan (TTL 5 menit). `null` bila tidak ada / kedaluwarsa.
 */
export function intipBasisDataAwan(fen) {
  const posisi = String(fen || "").trim();
  const tersimpan = cache.get(posisi);
  if (!tersimpan || Date.now() >= tersimpan.kedaluwarsa || tersimpan.galat) return null;
  return tersimpan.nilai;
}

/**
 * Skor langkah tertentu (dicocokkan lewat SAN) dari data awan sebuah posisi —
 * sumber ekspresi karakter komentator untuk langkah yang BARU dimainkan.
 * `null` bila langkah tidak ada di data, belum dinilai ("??"), atau skor
 * mat paksa (tidak muat skala pion).
 */
export function skorLangkahAwan(data, san) {
  const target = String(san || "").trim();
  const langkah = data?.langkah?.find((l) => l?.dinilai !== false && l.san === target);
  return langkah && Number.isFinite(langkah.skorCp) ? langkah.skorCp : null;
}

/**
 * Skor sentipion (sudut pandang pihak yang jalan) → teks siap tampil,
 * mis. `-121` → "-1.2", `35` → "+0.4". `null` bila tidak ada skor.
 */
export function formatSkorAwan(skorCp) {
  if (!Number.isFinite(skorCp)) return null;
  // Dibulatkan lewat bilangan bulat (bukan toFixed) supaya 35 sentipion
  // menjadi 0.4 — toFixed(1) atas 0.35 menghasilkan 0.3 karena representasi
  // biner, dan skor catur lebih enak dibaca setelah dibulatkan.
  const pion = Math.round(skorCp / 10) / 10;
  const teks = Number.isInteger(pion) ? String(pion) : pion.toFixed(1);
  return `${pion > 0 ? "+" : ""}${teks}`;
}

/**
 * Saran terbaik basis data awan untuk kalimat komentator.
 * HANYA memakai langkah yang sudah dinilai (`dinilai` true) — langkah "??"
 * belum punya skor dan tidak boleh pernah jadi saran komentator. Mengembalikan
 * `{ san, nilai }` (nilai sudah diformat) atau null bila langkah teratas tidak
 * punya SAN/skor — komentator hanya menyebut saran yang jelas.
 */
export function saranAwanKomentator(data) {
  const langkah = data?.langkah?.find((l) => l?.dinilai !== false);
  if (!langkah || !langkah.san) return null;
  const nilai = formatSkorAwan(langkah.skorCp);
  if (!nilai) return null;
  return { san: langkah.san, nilai };
}
