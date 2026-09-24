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

/** Cache klien: posisi -> { kedaluwarsa, nilai }. Server sudah punya cache
 * sendiri yang jauh lebih panjang; ini hanya menghemat perjalanan bolak-balik. */
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;
const CACHE_MAKS = 200;

/**
 * Ambil daftar langkah basis data awan untuk satu posisi.
 *
 * @param {string} fen posisi (FEN; bidang yang kurang akan dilengkapi server)
 * @param {{signal?: AbortSignal}} [opsi]
 * @returns {Promise<{sumber:string, posisi:string, diketahui:boolean,
 *                    akhir:string|null, langkah:Array<object>}>}
 * @throws {Error} bila jaringan gagal, dibatalkan (name = "AbortError"),
 *                 atau server membalas non-2xx.
 */
export async function ambilBasisDataAwan(fen, { signal } = {}) {
  const posisi = String(fen || "").trim();
  if (!posisi) throw new Error("Posisi kosong.");

  const tersimpan = cache.get(posisi);
  if (tersimpan && Date.now() < tersimpan.kedaluwarsa) return tersimpan.nilai;

  const res = await fetch(urlApi(`/api/basisdata-awan?fen=${encodeURIComponent(posisi)}`), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Basis data awan menjawab ${res.status}.`);

  const nilai = await res.json();
  cache.set(posisi, { nilai, kedaluwarsa: Date.now() + TTL_MS });
  while (cache.size > CACHE_MAKS) cache.delete(cache.keys().next().value);
  return nilai;
}

/** Kosongkan cache klien (dipakai uji). */
export function bersihkanCacheAwanKlien() {
  cache.clear();
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
 * Mengembalikan `{ san, nilai }` (nilai sudah diformat) atau null bila langkah
 * pertama tidak punya SAN/skor — komentator hanya menyebut saran yang jelas.
 */
export function saranAwanKomentator(data) {
  const langkah = data?.langkah?.[0];
  if (!langkah || !langkah.san) return null;
  const nilai = formatSkorAwan(langkah.skorCp);
  if (!nilai) return null;
  return { san: langkah.san, nilai };
}
