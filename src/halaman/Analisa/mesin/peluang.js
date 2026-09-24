/**
 * Kurva peluang menang — satu-satunya tempat rumusnya didefinisikan.
 *
 * Rumusnya adalah `getWinChance` en-croissant / `WinPercent.fromCentiPawns`
 * lichess (pengali kurva dari lichess PR #11148). Sebelumnya fungsi-fungsi ini
 * tinggal di ./akurasi.js; dipindahkan ke sini supaya ./penilaian.js (ambang
 * klasifikasi, lihat ./penilaian.js bagian `AMBANG_KERUGIAN_PELUANG`) bisa
 * memakai kurva yang SAMA tanpa impor melingkar — ./akurasi.js sendiri
 * mengimpor ./penilaian.js untuk `invertColor`.
 *
 * ./akurasi.js masih mengekspor ulang keempat nama di bawah, jadi pemanggil
 * lama (`antiCheat.js`, `langkahKritis.js`, uji) tidak perlu berubah.
 *
 * Angka-angka di sini TIDAK boleh disetel sembarangan: ./akurasi.js dan
 * ./antiCheat.js sudah divalidasi terhadap angka acuan lichess/en-croissant,
 * dan mengubahnya akan menggeser akurasi, ACPL, metrik anti-cheat, sekaligus
 * label langkah.
 */

/** `Cp.CEILING` lichess / `CP_CEILING` en-croissant: batas mutlak eval. */
export const CP_CEILING = 1000;

/** Pengali kurva win chance (lichess PR #11148). */
export const FAKTOR_PELUANG = -0.00368208;

/** Potong cp ke [-1000, 1000] — `minMax(cp, -CP_CEILING, CP_CEILING)`. */
export function batasiCp(cp) {
  return Math.min(CP_CEILING, Math.max(-CP_CEILING, cp));
}

/**
 * Peluang menang 0–100 dari centipawn — `getWinChance` en-croissant /
 * `WinPercent.fromCentiPawns` lichess. 0 cp → 50, +100 cp ≈ 59.1,
 * −500 cp ≈ 13.69.
 */
export function peluangMenang(cp) {
  const dibatasi = batasiCp(Number(cp) || 0);
  const mentah = 2 / (1 + Math.exp(FAKTOR_PELUANG * dibatasi)) - 1;
  return 50 + 50 * Math.min(1, Math.max(-1, mentah));
}
