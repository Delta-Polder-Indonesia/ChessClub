import { Helmet } from "react-helmet-async";
import { asalSitus, urlAbsolut } from "../lib/urlSitus.js";

/**
 * Atur meta tag per halaman — judul, deskripsi, canonical, OG tags, dan robots.
 *
 * Identitas brand utama situs adalah Blunder Skuad.
 * "Komunitas Catur Indonesia" dipakai sebagai descriptor, bukan nama brand utama.
 */
export default function MetaHalaman({
  title,
  description,
  robots = "index, follow",
  image = "/images/landing-hero.webp",
  imageWidth = 828,
  imageHeight = 462,
  /**
   * Jalur kanonik eksplisit. Dipakai halaman yang alamatnya punya variasi
   * (mis. `/teka-teki/problem/<nomor>`): seluruh variasi menunjuk SATU
   * halaman resmi, jadi mesin pencari tidak melihatnya sebagai halaman
   * terpisah. Bila kosong, pathname saat ini yang dipakai (perilaku lama).
   */
  path,
}) {
  const namaKomunitas = "Blunder Skuad";

  // Bila title sudah mengandung "|", anggap sudah lengkap.
  const judulLengkap =
    title && title.includes("|") ? title : `${title || "Beranda"} | ${namaKomunitas}`;

  const deskripsi =
    description ||
    "Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan bertumbuh bagi pecatur.";

  // Pakai URL situs produksi bila tersedia; fallback ke origin saat lokal.
  // Pathname dipakai tanpa query string dan hash agar canonical tetap bersih.
  const situs = asalSitus();
  const jalurKanonik = path || window.location.pathname || "/";
  const canonicalUrl = `${situs}${jalurKanonik.startsWith("/") ? "" : "/"}${jalurKanonik}`;
  const gambarUrl = urlAbsolut(image);

  return (
    <Helmet>
      <title>{judulLengkap}</title>
      <meta name="description" content={deskripsi} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={judulLengkap} />
      <meta property="og:description" content={deskripsi} />
      <meta property="og:image" content={gambarUrl} />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={judulLengkap} />
      <meta name="twitter:description" content={deskripsi} />
      <meta name="twitter:image" content={gambarUrl} />
    </Helmet>
  );
}
