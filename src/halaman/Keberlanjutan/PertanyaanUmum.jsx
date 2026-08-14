import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function PertanyaanUmum() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("pertanyaan.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("pertanyaan.deskripsi")}
      next={{ to: "/hubungi-kami", judul: t("pertanyaan.nextJudul") }}
    >
      <PageArtikel title={t("pertanyaan.artikel")}>
        <ol>
          <li className="ql-align-justify">
            <strong>{t("pertanyaan.q1a")}</strong> {t("pertanyaan.q1b")}
          </li>
          <li className="ql-align-justify">
            <strong>{t("pertanyaan.q2a")}</strong> {t("pertanyaan.q2b")}
          </li>
          <li className="ql-align-justify">
            <strong>{t("pertanyaan.q3a")}</strong> {t("pertanyaan.q3b")}
          </li>
          <li className="ql-align-justify">
            <strong>{t("pertanyaan.q4a")}</strong> {t("pertanyaan.q4b")}
          </li>
          <li className="ql-align-justify">
            <strong>{t("pertanyaan.q5a")}</strong> {t("pertanyaan.q5b")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
