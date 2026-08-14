import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function KodeEtikKomunitas() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("kodeEtik.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("kodeEtik.deskripsi")}
      next={{
        to: "/keberlanjutan/pertanyaan-umum",
        judul: t("kodeEtik.nextJudul"),
      }}
    >
      <PageArtikel title={t("kodeEtik.artikel")}>
        <ol>
          <li>{t("kodeEtik.l1")}</li>
          <li>{t("kodeEtik.l2")}</li>
          <li>{t("kodeEtik.l3")}</li>
          <li>{t("kodeEtik.l4")}</li>
          <li>{t("kodeEtik.l5")}</li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
