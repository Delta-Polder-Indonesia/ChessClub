import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function LigaMusiman() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("ligaMusiman.judul")}
      parent={t("nav.turnamen")}
      parentPath="/turnamen"
      description={t("ligaMusiman.deskripsi")}
      next={{ to: "/turnamen/turnamen-terbuka", judul: t("ligaMusiman.nextJudul") }}
    >
      <PageArtikel title={t("ligaMusiman.artikel")}>
        <p>{t("ligaMusiman.p1")}</p>
        <p>{t("ligaMusiman.p2")}</p>
        <p>{t("ligaMusiman.p3")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
