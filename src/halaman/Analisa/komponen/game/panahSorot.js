/**
 * Panah untuk langkah yang disorot panel distribusi manusia.
 *
 * Papan menyimpan panah sebagai `arrows[nomorLangkah] = [[{col,row},{col,row}]]`
 * (`formatSquare` di `mesin/engine.js`), bukan notasi UCI. Modul ini yang
 * menerjemahkan `uci` dari sorotan Maia ("e2e4", "e7e8q") ke bentuk itu,
 * supaya pengait muat partai tidak perlu tahu detail papan.
 *
 * Fungsi murni: uji bisa memeriksanya tanpa React maupun papan.
 */
import { formatSquare } from "../../mesin/engine.js";

// UCI sah: dua kotak, promosi opsional (q/r/b/n).
const POLA_UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/**
 * Ubah satu langkah UCI menjadi panah papan.
 *
 * @param {string} uci mis. `"e2e4"` atau `"e7e8q"`.
 * @returns {[{col: number, row: number}, {col: number, row: number}]|null}
 *   `null` bila bukan UCI yang sah — lebih baik tanpa panah daripada panah
 *   yang menunjuk kotak acak.
 */
export function panahSorot(uci) {
  const teks = typeof uci === "string" ? uci.trim().toLowerCase() : "";
  if (!POLA_UCI.test(teks)) return null;
  return [formatSquare(teks.slice(0, 2)), formatSquare(teks.slice(2, 4))];
}

/**
 * Peta panah siap-merge untuk satu nomor langkah.
 *
 * @param {number} indeks nomor langkah (indeks `moves`) tempat panah tampil.
 * @param {string} uci langkah yang disorot.
 * @returns {Record<number, Array>} `{}` bila indeks atau UCI tidak sah, supaya
 *   pemanggil boleh menyebarkannya ke peta panah tanpa memeriksa lagi.
 */
export function petaPanahSorot(indeks, uci) {
  const panah = panahSorot(uci);
  if (!panah || !Number.isInteger(indeks) || indeks <= 0) return {};
  return { [indeks]: [panah] };
}
