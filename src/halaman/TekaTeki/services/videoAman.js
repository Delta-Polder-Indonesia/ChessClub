/**
 * Validasi runtime media koleksi Teka-Teki.
 *
 * URL `<video src>` dan tanggal sumber berasal dari dataset publik; keduanya
 * harus tetap disaring di klien supaya berkas data yang keliru (atau diganti
 * di masa depan) tidak pernah menjadi URL pemutar/tanggal bebas.
 */

/** Hanya domain media Chess.com yang sah (selaras CSP halaman). */
export const POLA_URL_VIDEO_SAH =
  /^https:\/\/(media\.chesscomfiles\.com|chesscom-videos\.s3\.amazonaws\.com)\/[^\s"<>]+\.mp4$/i;

export const POLA_TANGGAL_VIDEO_SAH = /^\d{4}-\d{2}-\d{2}$/;

export function urlVideoSah(url) {
  const bersih = typeof url === "string" ? url.trim() : "";
  return POLA_URL_VIDEO_SAH.test(bersih) ? bersih : "";
}

export function tanggalVideoSah(tanggal) {
  const bersih = typeof tanggal === "string" ? tanggal.trim() : "";
  return POLA_TANGGAL_VIDEO_SAH.test(bersih) ? bersih : "";
}

/** Tautan sumber Chess.com untuk sebuah tanggal harian (atau beranda puzzle). */
export function tautanSumberVideo(tanggal) {
  const aman = tanggalVideoSah(tanggal);
  return aman
    ? `https://www.chess.com/daily-chess-puzzle/${aman}`
    : "https://www.chess.com/daily-chess-puzzle";
}
