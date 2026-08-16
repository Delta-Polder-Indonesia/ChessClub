import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function SekolahCatur() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("sekolahCatur.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("sekolahCatur.deskripsi")}
      next={{
        to: "/program-kami/sekolah-catur/cara-bermain-catur",
        judul: t("nav.caraBermainCatur"),
      }}
    >
      <PageArtikel title={t("sekolahCatur.artikel")}>
        <p>{t("sekolahCatur.p1")}</p>
        <p>{t("sekolahCatur.p2")}</p>
        <p>{t("sekolahCatur.p3")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
