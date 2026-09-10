import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { PageArtikel } from "../components/PageBagian.jsx";
import MetaHalaman from "../components/MetaHalaman.jsx";
import { useI18n } from "../lib/i18n.jsx";

export default function TidakDitemukan() {
  const { t } = useI18n();
  return (
    <>
      {/* Halaman ini juga dipakai fallback SPA di Vercel: URL apa pun yang
          tidak cocok dengan rute mengembalikan index.html dengan status 200
          (soft 404). noindex membuat Google membuang alamat ngawur itu alih-alih
          mengindeksnya sebagai halaman kosong. Status 404 asli butuh middleware
          Vercel — lihat PANDUAN-SEO.md bagian 6. */}
      <MetaHalaman
        title={t("t404.judul")}
        description={t("t404.deskripsi")}
        robots="noindex, follow"
      />
      <Hero
        title={t("t404.judul")}
        description={t("t404.deskripsi")}
        crumbs={[{ label: t("common.home"), to: "/" }, { label: "404" }]}
      />
      <PageArtikel title={t("t404.kembali")}>
        <p>
          {t("t404.p1")}
          <Link to="/">{t("t404.p2")}</Link>
          {t("t404.p3")}
        </p>
      </PageArtikel>
    </>
  );
}
