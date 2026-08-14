import { PageArtikel } from "../../components/PageBagian.jsx";
import Struktur from "../../components/Struktur.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function StrukturOrganisasiCatur() {
  const { t } = useI18n();
  return (
    <>
      <PageArtikel title={t("strukturOrganisasiCatur.artikel")}>
        <p>{t("strukturOrganisasiCatur.p1")}</p>
      </PageArtikel>
      <Struktur />
    </>
  );
}
