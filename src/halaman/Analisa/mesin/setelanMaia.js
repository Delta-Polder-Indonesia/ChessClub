/**
 * Setelan khusus jalur Maia di panel "Distribusi manusia".
 *
 * Mengapa perlu: jalur ini TIDAK memakai kedalaman Stockfish — biayanya
 * ditentukan jumlah partai × langkah yang dinilai, dan tiap gelombang
 * inferensi menahan sejumlah posisi di memori ONNX sekaligus. Di ponsel,
 * batch 32 posisi bisa membuat tab tersendat, sementara di desktop 8 posisi
 * hanya memperlambat tanpa manfaat. Jadi ukuran kerja harus bisa diatur,
 * bukan diwarisi dari setelan Stockfish.
 *
 * Semua fungsi di sini murni (penyimpanan disuntik), supaya bisa diuji tanpa
 * peramban.
 */
import { RATING_MAKS, RATING_MIN } from "../../../lib/maia3.js";

/**
 * Preset kecepatan. `ukuranBatch` = posisi per gelombang inferensi;
 * `jumlahPartai` = banyaknya partai yang dinilai sekali jalan.
 */
export const PRESET_MAIA = Object.freeze({
  hemat: Object.freeze({ ukuranBatch: 8, jumlahPartai: 5 }),
  seimbang: Object.freeze({ ukuranBatch: 16, jumlahPartai: 10 }),
  cepat: Object.freeze({ ukuranBatch: 32, jumlahPartai: 20 }),
});

export const PRESET_BAWAAN = "seimbang";
export const BATAS_PARTAI_MIN = 1;
export const BATAS_PARTAI_MAKS = 50;

/** Kunci penyimpanan setelan di peramban (bertahan antar sesi). */
export const KUNCI_SETELAN_MAIA = "kci-maia-setelan-v1";

/**
 * Tebak preset yang pantas untuk perangkat ini.
 *
 * Heuristiknya sengaja konservatif: lebih baik terasa agak lambat di desktop
 * kuat daripada membuat ponsel 4 GB tersendat. Nilai yang tidak tersedia
 * (Safari tidak punya `deviceMemory`, dsb.) dianggap "tidak diketahui", bukan
 * dianggap kuat.
 *
 * @param {{hardwareConcurrency?: number, deviceMemory?: number, seluler?: boolean}} [perangkat]
 * @returns {"hemat"|"seimbang"|"cepat"}
 */
export function presetPerangkat({ hardwareConcurrency, deviceMemory, seluler } = {}) {
  const inti = Number(hardwareConcurrency);
  const memori = Number(deviceMemory);
  if (seluler === true) return "hemat";
  if (Number.isFinite(memori) && memori > 0 && memori <= 4) return "hemat";
  if (Number.isFinite(inti) && inti > 0 && inti <= 4) return "hemat";
  if (Number.isFinite(inti) && inti >= 8 && (!Number.isFinite(memori) || memori >= 8)) return "cepat";
  return "seimbang";
}

const jepit = (angka, bawah, atas) => Math.min(atas, Math.max(bawah, angka));

/**
 * Rapikan setelan dari masukan bebas (localStorage lama, isian pengguna).
 *
 * Semua nilai yang tidak masuk akal jatuh ke bawaan preset, bukan membuat
 * jalannya analisis gagal di tengah: setelan yang rusak tidak boleh
 * menyebabkan inferensi berjalan dengan angka aneh.
 *
 * @param {object} [nilai] setelan mentah.
 * @param {"hemat"|"seimbang"|"cepat"} [bawaan] preset bila `nilai.preset` tidak dikenal.
 * @returns {{preset: string, ukuranBatch: number, jumlahPartai: number,
 *   ratingMode: "otomatis"|"manual", ratingManual: number|null}}
 */
export function normalisasiSetelan(nilai = {}, bawaan = PRESET_BAWAAN) {
  const preset = Object.hasOwn(PRESET_MAIA, nilai?.preset) ? nilai.preset : bawaan;
  const dasar = PRESET_MAIA[preset];

  const n = Math.round(Number(nilai?.jumlahPartai));
  const jumlahPartai = Number.isFinite(n)
    ? jepit(n, BATAS_PARTAI_MIN, BATAS_PARTAI_MAKS)
    : dasar.jumlahPartai;

  const ratingMode = nilai?.ratingMode === "manual" ? "manual" : "otomatis";
  /*
   * `null` harus tetap `null`. Tanpa penjagaan ini `Number(null)` = 0 lolos
   * sebagai "angka sah" lalu dijepit menjadi 600 — pengguna yang belum pernah
   * mengisi rating manual tiba-tiba dinilai sebagai pemain 600.
   */
  const mentah = nilai?.ratingManual;
  const kosong = mentah === null || mentah === undefined || mentah === "";
  const r = kosong ? NaN : Math.round(Number(mentah));
  const ratingManual = Number.isFinite(r) ? jepit(r, RATING_MIN, RATING_MAKS) : null;

  return { preset, ukuranBatch: dasar.ukuranBatch, jumlahPartai, ratingMode, ratingManual };
}

/**
 * Baca setelan tersimpan; apa pun yang rusak menghasilkan bawaan.
 *
 * @param {Storage|null} [penyimpanan] `localStorage` (disuntik di uji).
 * @param {"hemat"|"seimbang"|"cepat"} [bawaan]
 */
export function bacaSetelan(penyimpanan, bawaan = PRESET_BAWAAN) {
  try {
    const mentah = penyimpanan?.getItem?.(KUNCI_SETELAN_MAIA);
    if (!mentah) return normalisasiSetelan({}, bawaan);
    return normalisasiSetelan(JSON.parse(mentah), bawaan);
  } catch {
    return normalisasiSetelan({}, bawaan);
  }
}

/** Simpan setelan; kegagalan penyimpanan (mode privat, kuota) diabaikan. */
export function simpanSetelan(setelan, penyimpanan) {
  try {
    penyimpanan?.setItem?.(KUNCI_SETELAN_MAIA, JSON.stringify(normalisasiSetelan(setelan)));
  } catch {
    /* penyimpanan penuh/diblokir — setelan tetap berlaku untuk sesi ini */
  }
}
