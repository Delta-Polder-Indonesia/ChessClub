import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Pengadaan() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("pengadaan.judul")}
      description={t("pengadaan.deskripsi")}
    >
      <PageArtikel title={t("pengadaan.artikel")}>
        <p className="ql-align-justify">{t("pengadaan.p1")}</p>
        <p className="ql-align-justify">{t("pengadaan.p2")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
