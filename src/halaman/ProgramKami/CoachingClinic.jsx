import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function CoachingClinic() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("coaching.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("coaching.deskripsi")}
      next={{
        to: "/program-kami/simultan-dan-blindfold",
        judul: t("coaching.nextJudul"),
      }}
    >
      <PageArtikel title={t("coaching.artikel")}>
        <p>{t("coaching.p1")}</p>
        <p>{t("coaching.p2")}</p>
        <p>{t("coaching.p3")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
