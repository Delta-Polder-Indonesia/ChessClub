/**
 * Utilitas URL situs — satu sumber kebenaran untuk origin produksi.
 *
 * Dipakai oleh meta tag kanonikal/Open Graph DAN data terstruktur JSON-LD
 * agar URL yang dikirim ke Google konsisten di semua tempat.
 */

/**
 * Origin kanonik — satu-satunya host yang boleh muncul di kanonikal.
 *
 * Mengapa fallback-nya BUKAN `window.location.origin`: satu build yang sama
 * dihidangkan Vercel di banyak host sekaligus — alias produksi
 * (`chess-club-weld.vercel.app`), alias cabang
 * (`…-git-<cabang>-….vercel.app`), dan URL deployment
 * (`…-<hash>-….vercel.app`). Bila kanonik mengikuti host yang sedang
 * melayani, tiap host mengkanonikalkan dirinya sendiri dan Google
 * melaporkan "Duplikat, tanpa ada versi kanonis pilihan pengguna" pada
 * seluruh keluarga `*.vercel.app`. Karena itu bila `VITE_SITE_URL` kosong
 * (build lokal, berkas `dist` yang dipindah, atau uji Node), nilai produksi
 * ini yang dipakai.
 */
const ASAL_PRODUKSI = "https://chess-club-weld.vercel.app";

/**
 * Origin situs tanpa garis miring penutup.
 *
 * Mengambil VITE_SITE_URL saat tersedia (produksi/pratinjau), lalu jatuh ke
 * `ASAL_PRODUKSI`. Pengecekan `import.meta.env` dibuat defensif agar berkas
 * ini tetap bisa diimpor dari uji Node (pola yang sama dipakai
 * engineCatur.js).
 *
 * @returns {string} mis. "https://chess-club-weld.vercel.app"
 */
export function asalSitus() {
  const situsEnv =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_SITE_URL
      : "";
  return String(situsEnv || ASAL_PRODUKSI).replace(/\/+$/, "");
}

/**
 * Bersihkan path menjadi bentuk kanonik: query string dan hash dibuang,
 * `/index.html` dilenyapkan, garis miring penutup dihapus (kecuali akar),
 * dan satu garis miring di awal dijamin ada. Bila `path` kosong, pathname
 * halaman saat ini yang dipakai.
 */
export function jalurKanonik(path) {
  const bawaan =
    typeof window !== "undefined" && window.location ? window.location.pathname || "/" : "/";
  const mentah = String(path ?? bawaan).trim() || "/";
  const tanpaQuery = mentah.split("#")[0].split("?")[0];
  let jalur = tanpaQuery.replace(/\/index\.html$/, "/").replace(/(.+?)\/+$/, "$1");
  if (!jalur) jalur = "/";
  return jalur.startsWith("/") ? jalur : `/${jalur}`;
}

/**
 * URL kanonik absolut sebuah halaman — dipakai `components/Kanonik.jsx` dan
 * `og:url`. Selalu absolut dan selalu memakai origin produksi, berapa pun
 * host yang melayani halamannya.
 */
export function urlKanonik(path) {
  return `${asalSitus()}${jalurKanonik(path)}`;
}

/**
 * Ubah path relatif (mis. "/program-kami" atau "/") menjadi URL absolut.
 *
 * Google mewajibkan URL absolut untuk properti `item` (alias `@id`) pada
 * BreadcrumbList — URL relatif seperti "/" atau "/tentang-kami" memicu
 * laporan "URL di kolom 'id' tidak valid" di Search Console.
 *
 * URL yang sudah absolut dikembalikan apa adanya, sehingga aman juga untuk
 * tautan eksternal.
 *
 * @param {string} path path relatif atau URL absolut
 * @returns {string} URL absolut
 */
export function urlAbsolut(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${asalSitus()}${path.startsWith("/") ? path : `/${path}`}`;
}
