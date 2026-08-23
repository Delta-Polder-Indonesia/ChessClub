import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function ProgramKami() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{
        to: "/program-kami/sekolah-catur/cara-bermain-catur",
        judul: t("nav.caraBermainCatur"),
      }}
    >
      <PageArtikel title={t("program.artikel")}>
        <p className="ql-align-justify">{t("program.p1")}</p>
        <p>{t("program.p2")}</p>
        <h3>{t("program.h1")}</h3>
        <p>
          {t("program.p3a")}{" "}
          <Link to="/program-kami/sekolah-catur/cara-bermain-catur">
            {t("nav.caraBermainCatur")}
          </Link>{" "}
          {t("program.p3b")}{" "}
          <Link to="/teka-teki">{t("tekaTeki.judul")}</Link>{" "}
          {t("program.p3c")}
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
