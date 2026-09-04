import { Helmet } from "react-helmet-async";
import { useI18n } from "../lib/i18n.jsx";

/**
 * Atur meta tag per halaman — judul, deskripsi, canonical, OG tags.
 *
 * Identitas brand utama situs adalah Blunder Skuad.
 * "Komunitas Catur Indonesia" dipakai sebagai descriptor, bukan nama brand utama.
 */
export default function MetaHalaman({ title, description }) {
  const { t } = useI18n();
  const namaKomunitas = "Blunder Skuad";

  // Bila title sudah mengandung "|", anggap sudah lengkap.
  const judulLengkap =
    title && title.includes("|") ? title : `${title || "Beranda"} | ${namaKomunitas}`;

  const deskripsi =
    description ||
    "Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan bertumbuh bagi pecatur.";

  // Canonical selalu mengikuti URL publik yang sedang dibuka.
  // Buang query string dan hash agar canonical tetap bersih.
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <Helmet>
      <title>{judulLengkap}</title>
      <meta name="description" content={deskripsi} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={judulLengkap} />
      <meta property="og:description" content={deskripsi} />
      <meta name="twitter:title" content={judulLengkap} />
      <meta name="twitter:description" content={deskripsi} />
    </Helmet>
  );
}
