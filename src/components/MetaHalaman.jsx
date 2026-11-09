import { Helmet } from "react-helmet-async";
import { urlAbsolut, urlKanonik } from "../lib/urlSitus.js";
import Kanonik from "./Kanonik.jsx";

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

  // Selalu origin produksi — bukan host yang sedang melayani halaman —
  // dengan path yang sudah dinormalisasi (tanpa query, hash, dan garis
  // miring penutup). Kanonikalnya sendiri ditulis <Kanonik />: Helmet
  // menambah tag baru tanpa menghapus milik index.html, sehingga halaman
  // ini sempat mengirim dua kanonikal sekaligus.
  const canonicalUrl = urlKanonik(path);
  const gambarUrl = urlAbsolut(image);

  return (
    <>
      <Kanonik path={path} />
      <Helmet>
        <title>{judulLengkap}</title>
        <meta name="description" content={deskripsi} />
        <meta name="robots" content={robots} />
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
    </>
  );
}
