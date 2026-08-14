import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function SyaratDanKetentuan() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("syarat.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("syarat.deskripsi")}
      next={{
        to: "/keberlanjutan/kode-etik-komunitas",
        judul: t("syarat.nextJudul"),
      }}
    >
      <PageArtikel title={t("syarat.artikel")}>
        <ol>
          <li>{t("syarat.l1")}</li>
          <li>{t("syarat.l2")}</li>
          <li>{t("syarat.l3")}</li>
          <li>{t("syarat.l4")}</li>
          <li>{t("syarat.l5")}</li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
