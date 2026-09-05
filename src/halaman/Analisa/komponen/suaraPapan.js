/**
 * Suara papan untuk halaman Analisa.
 *
 * Berkasnya MP3 dari `public/SoundChess/standard/` — sama dengan yang dipakai
 * Papan Interaktif dan Teka-Teki lewat `src/lib/suara.js`, supaya seluruh
 * situs berbunyi seragam dan berkasnya dimuat sekali saja.
 *
 * API-nya tetap meniru subset Howl yang dipakai komponen papan, jadi
 * `komponen/game/board.jsx` tidak perlu diubah:
 *   const suara = buatSuara("capture"); suara.play();
 *
 * Nama yang diterima = nama berkas MP3 tanpa ekstensi ("move-self",
 * "capture", …). Bila peramban tidak mendukung audio, semua panggilan jadi
 * noop — analisis tetap berjalan, hanya tanpa bunyi.
 */

import { mainkanSuara, panaskanSuara } from "../../../lib/suara.js";

/** Bunyi yang dipakai papan analisa — dipanaskan saat modul dimuat. */
const DIPAKAI = [
  "move-self",
  "move-opponent",
  "capture",
  "castle",
  "move-check",
  "game-start",
  "game-end",
  "illegal",
];

if (typeof window !== "undefined") {
  // Unduh + decode di latar; pemutarannya sendiri tetap menunggu gestur
  // pengguna sesuai kebijakan autoplay peramban.
  panaskanSuara(DIPAKAI);
}

/**
 * Buat satu "sound". Argumen `volume` mengikuti opsi Howl sehingga pemanggil
 * lama tidak perlu diubah.
 */
export class Suara {
  // volume dibiarkan undefined bila tak disetel, agar kekerasan bawaan
  // per-bunyi di lib/suara.js yang dipakai.
  constructor(nama, { volume } = {}) {
    this.nama = nama;
    this.volume = volume;
  }

  play() {
    try {
      mainkanSuara(this.nama, { volume: this.volume });
    } catch {
      /* audio tidak tersedia — abaikan, analisis tidak boleh gagal karena bunyi */
    }
  }

  stop() {
    /* bunyi sengaja singkat: tidak ada yang perlu dihentikan */
  }
}

export function buatSuara(nama, opsi) {
  return new Suara(nama, opsi);
}
