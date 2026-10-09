/**
 * Kemajuan analisa (0–100, dari `setProgress` di `mesin/engine.js`) untuk
 * ditampilkan sebagai satu angka di belakang koma — sama seperti kartu progres
 * WintrChess (`ProgressReporter`, `(progress * 100).toFixed(1)`). Nilai di luar
 * 0–100 atau bukan angka dijinakkan supaya kartu tidak pernah menulis "NaN%".
 */
export function persenProgres(progress) {
  const angka = Number(progress);
  if (!Number.isFinite(angka)) return "0.0";
  return Math.min(Math.max(angka, 0), 100).toFixed(1);
}
