/**
 * Tabel "langkah buku" (nama pembukaan) untuk halaman Analisa.
 *
 * Berkas datanya dibuat dari buku pembukaan milik situs ini sendiri:
 *   node scripts/generasi-buku-analisa.mjs → public/data/buku-analisa.json
 *
 * Dipuat sekali per kunjungan halaman dan di-cache di modul ini (bukan di
 * komponen) agar berpindah tab di panel kanan tidak memicu fetch ulang.
 * Bila berkasnya gagal diunduh, analisis tetap jalan — hanya label "book"
 * yang tidak muncul, jadi kegagalan sengaja ditelan diam-diam.
 */

import { kunciFen } from "./kunciFen.js";

let janji = null;

function unduh() {
  const dasar = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.BASE_URL : "/";
  return fetch(`${dasar}data/buku-analisa.json`)
    .then((respon) => (respon.ok ? respon.json() : {}))
    .catch(() => ({}));
}

/** Muat tabel buku (janji yang sama dikembalikan untuk panggilan berikutnya). */
export function muatBuku() {
  janji ||= unduh();
  return janji;
}

/**
 * Fungsi pencari nama pembukaan untuk sebuah FEN — bentuk yang dipakai
 * ./penilaian.js (`openings(fen)`), sekaligus tetap cocok bila yang diberikan
 * peta biasa.
 */
export async function cariNamaPembukaan() {
  const peta = await muatBuku();
  return (fen) => peta[kunciFen(fen)];
}
