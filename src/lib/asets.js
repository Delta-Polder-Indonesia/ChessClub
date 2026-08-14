/**
 * Alamat aset publik (gambar, favicon, dll).
 *
 * Vite mengganti import.meta.env.BASE_URL sesuai `base` pada vite.config.js
 * (mis. "/ChessClub/" di GitHub Pages). Dengan memakai helper ini, gambar
 * tidak lagi memakai jalur absolut "/images/..." yang patah saat situs
 * disajikan dari subfolder (GitHub Pages).
 */
export function gambar(jalur) {
  const bersih = String(jalur || "").replace(/^\//, "");
  return `${import.meta.env.BASE_URL}${bersih}`;
}
