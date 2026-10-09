/* Bunyi papan dibuat dengan Web Audio (lihat ../suaraPapan.js) — tanpa
   dependensi howler dan tanpa berkas MP3 berlisensi copyleft. */
import { buatSuara } from "../suaraPapan.js";

export const gameStartSound = buatSuara("game-start");
