import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function ProgramKami() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{ to: "/program-kami/kelas-dan-pelatihan", judul: t("program.nextJudul") }}
    >
      <PageArtikel title={t("program.artikel")}>
        <p className="ql-align-justify">{t("program.p1")}</p>
        <p>{t("program.p2")}</p>
        <ol>
          <li className="ql-align-justify">
            <Link to="/program-kami/kelas-dan-pelatihan">
              {t("nav.kelasPelatihan")}
            </Link>
            : {t("program.l1")}
          </li>
          <li className="ql-align-justify">
            <Link to="/program-kami/coaching-clinic">
              {t("nav.coachingClinic")}
            </Link>
            : {t("program.l2")}
          </li>
          <li className="ql-align-justify">
            <Link to="/program-kami/simultan-dan-blindfold">
              {t("nav.simultanBlindfold")}
            </Link>
            : {t("program.l3")}
          </li>
          <li className="ql-align-justify">
            <Link to="/program-kami/sekolah-catur">
              {t("nav.sekolahCatur")}
            </Link>
            : {t("program.l4")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
