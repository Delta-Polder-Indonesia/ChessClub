/**
 * Utilitas URL situs — satu sumber kebenaran untuk origin produksi.
 *
 * Dipakai oleh meta tag kanonikal/Open Graph DAN data terstruktur JSON-LD
 * agar URL yang dikirim ke Google konsisten di semua tempat.
 */

/**
 * Origin situs tanpa garis miring penutup.
 *
 * Mengambil VITE_SITE_URL saat tersedia (produksi/pratinjau), lalu jatuh ke
 * origin peramban saat pengembangan lokal. Pengecekan `import.meta.env`
 * dibuat defensif agar berkas ini tetap bisa diimpor dari uji Node (pola
 * yang sama dipakai engineCatur.js).
 *
 * @returns {string} mis. "https://chess-club-weld.vercel.app"
 */
export function asalSitus() {
  const situsEnv =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env.VITE_SITE_URL
      : "";
  return (situsEnv || window.location.origin).replace(/\/+$/, "");
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
