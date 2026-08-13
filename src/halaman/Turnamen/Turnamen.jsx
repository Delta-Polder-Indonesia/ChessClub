import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Turnamen() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("turnamen.judul")}
      description={t("turnamen.deskripsi")}
      next={{ to: "/turnamen/turnamen-bulanan", judul: t("turnamen.nextJudul") }}
    >
      <PageArtikel title={t("turnamen.artikel")}>
        <p className="ql-align-justify">{t("turnamen.p1")}</p>
        <p>{t("turnamen.p2")}</p>
        <ol>
          <li className="ql-align-justify">
            <Link to="/turnamen/turnamen-bulanan">
              {t("nav.turnamenBulanan")}
            </Link>
            : {t("turnamen.l1")}
          </li>
          <li className="ql-align-justify">
            <Link to="/turnamen/liga-musiman">{t("nav.ligaMusiman")}</Link>:{" "}
            {t("turnamen.l2")}
          </li>
          <li className="ql-align-justify">
            <Link to="/turnamen/turnamen-terbuka">
              {t("nav.turnamenTerbuka")}
            </Link>
            : {t("turnamen.l3")}
          </li>
          <li className="ql-align-justify">
            <Link to="/turnamen/liga-antar-komunitas">
              {t("nav.ligaAntarKomunitas")}
            </Link>
            : {t("turnamen.l4")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
