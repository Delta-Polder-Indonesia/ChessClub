import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function MediaDanInformasi() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("media.judul")}
      description={t("media.deskripsi")}
      next={{
        to: "/media-dan-informasi/berita-komunitas",
        judul: t("media.nextJudul"),
      }}
    >
      <PageArtikel title={t("media.artikel")}>
        <p className="ql-align-justify">{t("media.p1")}</p>
        <p>{t("media.p2")}</p>
        <ol>
          <li className="ql-align-justify">
            <Link to="/media-dan-informasi/berita-komunitas">
              {t("nav.beritaKomunitas")}
            </Link>
            : {t("media.l1")}
          </li>
          <li className="ql-align-justify">
            <Link to="/media-dan-informasi/galeri">{t("nav.galeri")}</Link>:{" "}
            {t("media.l2")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
