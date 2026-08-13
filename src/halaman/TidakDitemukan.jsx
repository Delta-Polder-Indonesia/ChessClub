import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { PageArtikel } from "../components/PageBagian.jsx";
import { useI18n } from "../lib/i18n.jsx";

export default function TidakDitemukan() {
  const { t } = useI18n();
  return (
    <>
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
