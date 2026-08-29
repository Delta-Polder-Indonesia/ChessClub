import { Helmet } from "react-helmet-async";
import { useI18n } from "../lib/i18n.jsx";

/**
 * Atur meta tag per halaman — judul, deskripsi, OG tags.
 *
 * Pakai:
 *   <MetaHalaman
 *     title="Turnamen"
 *     description="Jadwal turnamen catur bulanan dan liga musiman."
 *   />
 *
 * Bila `title` hanya bagian judul, ia otomatis digabung dengan
 * nama komunitas. Bila `title` sudah lengkap (ada "|"), tidak digabung.
 */
export default function MetaHalaman({ title, description }) {
  const { t } = useI18n();
  const namaKomunitas = t("common.namaKomunitas") || "Komunitas Catur Indonesia";

  // Bila title sudah mengandung "|", anggap sudah lengkap.
  const judulLengkap =
    title && title.includes("|") ? title : `${title || "Beranda"} | ${namaKomunitas}`;

  const deskripsi =
    description ||
    "Komunitas Catur Indonesia — wadah bermain, belajar, dan bertumbuh bagi pecatur.";

  return (
    <Helmet>
      <title>{judulLengkap}</title>
      <meta name="description" content={deskripsi} />
      <meta property="og:title" content={judulLengkap} />
      <meta property="og:description" content={deskripsi} />
      <meta name="twitter:title" content={judulLengkap} />
      <meta name="twitter:description" content={deskripsi} />
    </Helmet>
  );
}
