/**
 * Anti-cheat — lapisan KALIBRASI: tabel `KALIBRASI_RATING`, pemilihan ambang
 * per rating, dan komponen skor 0–100 per metrik.
 *
 * Semua fungsi di sini murni dan hanya bergantung pada `./dasar.js`.
 */
import { AMBANG, LEVEL_RENDAH, LEVEL_SEDANG, LEVEL_TINGGI, batasi01 } from "./dasar.js";

/* ------------------------------------------------------------- skor 0-100 */

/**
 * Kalibrasi ambang per rentang rating (Elo).
 *
 * Tabel ini dipertahankan hanya untuk kompatibilitas data/laporan lama dan
 * tidak digunakan oleh skor deteksi. Kebijakan deteksi saat ini pukul rata:
 * rating, gelar, nama, atau identitas tidak mengubah ambang skor. Setiap partai
 * dinilai dengan ambang global `AMBANG`; kalibrasi empiris tetap diperlukan
 * sebelum skor dipakai sebagai bukti keputusan turnamen.
 */
export const KALIBRASI_RATING = Object.freeze([
  { batas: 800, kecocokanDasar: 40, acplAcuan: 70 },
  { batas: 1200, kecocokanDasar: 45, acplAcuan: 55 },
  { batas: 1600, kecocokanDasar: 50, acplAcuan: 45 },
  { batas: 2000, kecocokanDasar: 55, acplAcuan: 38 },
  { batas: 2400, kecocokanDasar: 60, acplAcuan: 32 },
  { batas: Number.POSITIVE_INFINITY, kecocokanDasar: 65, acplAcuan: 27 },
]);

/** Pilih band kalibrasi untuk satu rating; `null`/NaN → ambang global. */
export function pilihKalibrasi(rating) {
  if (!Number.isFinite(rating)) {
    return { kecocokanDasar: AMBANG.kecocokanDasar, acplAcuan: AMBANG.acplAcuan };
  }
  return KALIBRASI_RATING.find((k) => rating <= k.batas) ?? KALIBRASI_RATING[KALIBRASI_RATING.length - 1];
}

/**
 * Rating Putih/Hitam dari metadata `parsePGN` (`players[].elo` — bisa angka,
 * "NOELO", atau hilang). Non-finite atau ≤0 → null.
 */
export function ratingDariMetadata(metadata) {
  const pemain = metadata?.players;
  if (!Array.isArray(pemain)) return { w: null, b: null };
  const ambil = (p) => {
    const n = Number(p?.elo);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  return { w: ambil(pemain[0]), b: ambil(pemain[1]) };
}

/** Skor komponen 0–100 untuk tingkat kecocokan langkah dengan engine. */
export function komponenKecocokan(engineMatchRate, dasar = AMBANG.kecocokanDasar) {
  if (!Number.isFinite(engineMatchRate)) return null;
  const acuan = Number.isFinite(dasar) ? dasar : AMBANG.kecocokanDasar;
  const skala = (engineMatchRate - acuan) / (100 - acuan);
  return Math.round(batasi01(skala) * 100);
}

/**
 * Skor komponen 0–100 untuk peringkat rata-rata MultiPV: 1 → 100 (selalu
 * memilih langkah terbaik engine), linear turun sampai 0 pada
 * `AMBANG.peringkatJenuh` (= MULTI_PV + 1, rata-rata di luar daftar).
 */
export function komponenPeringkat(rataPeringkat) {
  if (!Number.isFinite(rataPeringkat)) return null;
  const skala = (AMBANG.peringkatJenuh - rataPeringkat) / (AMBANG.peringkatJenuh - 1);
  return Math.round(batasi01(skala) * 100);
}

/** Skor komponen 0–100 untuk ACPL (makin kecil makin mencurigakan). */
export function komponenAcpl(acpl, acuan = AMBANG.acplAcuan) {
  if (!Number.isFinite(acpl)) return null;
  const batas = Number.isFinite(acuan) && acuan > 0 ? acuan : AMBANG.acplAcuan;
  return Math.round(batasi01((batas - acpl) / batas) * 100);
}

/** Skor komponen 0–100 untuk konsistensi waktu pikir. */
export function komponenWaktu(konsistensiWaktu) {
  if (!Number.isFinite(konsistensiWaktu)) return null;
  return Math.round(batasi01(konsistensiWaktu) * 100);
}

/** Skor 0–100 → "rendah" | "sedang" | "tinggi" (null bila skor tidak ada). */
export function tingkatDariSkor(skor) {
  if (!Number.isFinite(skor)) return null;
  if (skor >= AMBANG.tinggi) return LEVEL_TINGGI;
  if (skor >= AMBANG.sedang) return LEVEL_SEDANG;
  return LEVEL_RENDAH;
}
