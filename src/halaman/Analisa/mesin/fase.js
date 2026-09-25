/**
 * Deteksi fase permainan (pembukaan → menengah → akhir) untuk fitur Analisa.
 *
 * Kedua pembanding di bawah ini dipindah apa adanya dari
 * `komponen/menu/analysis/summary/playersAccuracy.jsx` supaya perhitungan
 * anti-cheat (`./antiCheat.js`) memakai batas fase yang SAMA PERSIS dengan
 * panel Akurasi. Dua salinan ambang ini akan pelan-pelan menyimpang begitu
 * salah satunya disunting, dan akibatnya angka "per fase" di Ringkasan dan di
 * Deteksi Engine saling bertentangan untuk partai yang sama.
 *
 * Semua fungsi murni: menerima papan hasil `new Chess(fen).board()`
 * (8 baris × 8 kotak, `null` untuk kotak kosong) dan mengembalikan boolean.
 * Gaya mengikuti ./penilaian.js — tanpa React, tanpa DOM.
 *
 * KONTRAK URUTAN (dipegang dua pemindai): langkah yang sedang diperiksa
 * dicatat ke fase yang SEDANG AKTIF lebih dulu, BARU fasenya dimajukan
 * berdasarkan papan langkah itu. `playersAccuracy.jsx` (panel Akurasi) dan
 * `antiCheat.js` (via `faseBerikutnya`) memakai urutan yang sama — kalau
 * salah satunya dibalik, angka "per fase" di Ringkasan dan di Deteksi
 * Engine saling bertentangan untuk partai yang sama. Paritasnya dikunci
 * `scripts/uji-evaluasi.mjs` (seksi "paritas fase").
 */

import { Chess } from "chess.js";

/** Kunci fase yang dipakai seluruh halaman Analisa (urutan: awal → akhir). */
export const FASE_PEMBUKAAN = "opening";
export const FASE_MENENGAH = "middlegame";
export const FASE_AKHIR = "endgame";

/** Urutan fase tetap — dipakai untuk merender tabel per fase. */
export const DAFTAR_FASE = [FASE_PEMBUKAAN, FASE_MENENGAH, FASE_AKHIR];

/**
 * Pembukaan dianggap selesai bila salah satu sisi sudah mengembangkan
 * perwira ringannya (menteri + 2 gajah + 2 kuda = 5 perwira "bisa keluar").
 * Ambang asimetris (3/2, 4) berasal dari upstream dan dipertahankan supaya
 * akurasi per fase tidak bergeser.
 */
export function isEndOpening(position) {
  let nonDeveloppedBlack = 0,
    nonDeveloppedWhite = 0;
  for (const square of position[0]) {
    if (square?.color === "w") continue;
    if (square?.type === "n" || square?.type === "b" || square?.type === "q") nonDeveloppedBlack++;
  }
  for (const square of position[position.length - 1]) {
    if (square?.color === "b") continue;
    if (square?.type === "n" || square?.type === "b" || square?.type === "q") nonDeveloppedWhite++;
  }
  const developpedBlack = 5 - nonDeveloppedBlack;
  const developpedWhite = 5 - nonDeveloppedWhite;
  if (developpedBlack >= 3 && developpedWhite >= 2) return true;
  if (developpedWhite >= 3 && developpedBlack >= 2) return true;
  if (developpedBlack >= 4) return true;
  if (developpedWhite >= 4) return true;
  // Nilai kembalian eksplisit: pemakai bersama (anti-cheat) memakai hasil ini
  // dalam ekspresi boolean, dan `undefined` mudah terselip jadi bug.
  return false;
}

/** Menengah selesai bila material berat tinggal sedikit di kedua sisi. */
export function isEndMiddlegame(position) {
  let whitePieces = 0,
    blackPieces = 0;
  for (const row of position) {
    for (const square of row) {
      if (square?.type === "r" || square?.type === "n" || square?.type === "b" || square?.type === "q") {
        if (square.color === "w") whitePieces++;
        else blackPieces++;
      }
    }
  }
  if (whitePieces <= 2 && blackPieces <= 2) return true;
  if (whitePieces <= 1 || blackPieces <= 1) return true;
  return false;
}

/**
 * Majukan fase satu langkah. Transisi hanya satu arah
 * (pembukaan → menengah → akhir), sama seperti pemindaian Akurasi, dan
 * dipanggil SETELAH langkah yang sedang diperiksa dicatat ke fasenya sendiri.
 */
export function faseBerikutnya(fase, position) {
  if (!position) return fase;
  if (fase === FASE_PEMBUKAAN && isEndOpening(position)) return FASE_MENENGAH;
  if (fase === FASE_MENENGAH && isEndMiddlegame(position)) return FASE_AKHIR;
  return fase;
}

/** Papan `chess.js` dari FEN; `null` bila FEN kosong/rusak. */
export function papanDariFen(fen) {
  if (!fen) return null;
  try {
    return new Chess(fen).board();
  } catch {
    return null;
  }
}
