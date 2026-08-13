import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function LigaAntarKomunitas() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("ligaAntar.judul")}
      parent={t("nav.turnamen")}
      parentPath="/turnamen"
      description={t("ligaAntar.deskripsi")}
      next={{ to: "/media-dan-informasi", judul: t("ligaAntar.nextJudul") }}
    >
      <PageArtikel title={t("ligaAntar.artikel")}>
        <p>{t("ligaAntar.p1")}</p>
        <p>{t("ligaAntar.p2")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
