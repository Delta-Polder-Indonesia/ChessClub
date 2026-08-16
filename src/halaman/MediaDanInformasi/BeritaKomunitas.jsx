import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function BeritaKomunitas() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("berita.judul")}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={t("berita.deskripsi")}
      next={{
        to: "/media-dan-informasi/pengumuman",
        judul: t("nav.pengumuman"),
      }}
    >
      <PageArtikel title={t("berita.artikel")}>
        <ol>
          <li className="ql-align-justify">
            <strong>{t("berita.n1a")}</strong> {t("berita.n1b")}
          </li>
          <li className="ql-align-justify">
            <strong>{t("berita.n2a")}</strong> {t("berita.n2b")}
          </li>
          <li className="ql-align-justify">
            <strong>{t("berita.n3a")}</strong> {t("berita.n3b")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
