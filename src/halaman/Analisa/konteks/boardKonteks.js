/**
 * Kontrak BoardContext — state PAPAN & navigasi langkah.
 *
 * Konteks ini memuat state yang berubah karena interaksi papan (klik langkah,
 * play/pause, balik papan, garis kustom) plus preferensi yang menempel pada
 * papan (kedalaman analisis, tampilan area kerja). Yang SENGAJA tidak ada di
 * sini: `progress`, `pageState`, `analyzingMove`, `langkahSementara`,
 * `data`, dan `analyzeController` — itu milik `ImportContext` karena berubah
 * jauh lebih sering (per langkah analisis / per muatan PGN).
 *
 * Bentuk nilai mengikuti konvensi lama: setiap field adalah pasangan
 * `[nilai, setter]`, satu-satunya pengecualian `gameController` yang berupa
 * objek stabil berisi `back/forward/first/last/togglePlay/play/pause`.
 *
 * CATATAN FASE 2: konteks ini belum dipakai komponen mana pun. Seluruh
 * komponen lama tetap membaca `AnalyzeContext` (lapisan kompatibilitas),
 * sehingga tidak ada perubahan perilaku. Migrasi konsumen ke `useBoard()`
 * dikerjakan bertahap pada fase berikutnya.
 */
import { createContext, useContext } from "react";

const PEMAIN_KOSONG = Object.freeze([
  Object.freeze({ name: "", elo: "NOELO" }),
  Object.freeze({ name: "", elo: "NOELO" }),
]);

const TIDAK_ADA = () => {};

/**
 * Nilai bawaan sengaja "netral": komponen yang (keliru) dirender di luar
 * `BoardProvider` tetap mendapat bentuk yang aman, bukan `undefined`.
 */
export const BoardContext = createContext({
  game: [[], TIDAK_ADA],
  players: [PEMAIN_KOSONG, TIDAK_ADA],
  moveNumber: [0, TIDAK_ADA],
  forward: [true, TIDAK_ADA],
  white: [true, TIDAK_ADA],
  animation: [false, TIDAK_ADA],
  playing: [false, TIDAK_ADA],
  time: [0, TIDAK_ADA],
  materialAdvantage: [0, TIDAK_ADA],
  result: ["", TIDAK_ADA],
  tab: ["analyze", TIDAK_ADA],
  customLine: [{ moveNumber: -1, moves: [], arrows: {} }, TIDAK_ADA],
  returnedToNormalGame: [null, TIDAK_ADA],
  depth: [13, TIDAK_ADA],
  tampilan: ["bermain", TIDAK_ADA],
  gameController: {
    back: TIDAK_ADA,
    forward: TIDAK_ADA,
    first: TIDAK_ADA,
    last: TIDAK_ADA,
    togglePlay: TIDAK_ADA,
    play: TIDAK_ADA,
    pause: TIDAK_ADA,
  },
});

/** Baca BoardContext. Setara `useContext(BoardContext)` dengan nama pendek. */
export function useBoard() {
  return useContext(BoardContext);
}
