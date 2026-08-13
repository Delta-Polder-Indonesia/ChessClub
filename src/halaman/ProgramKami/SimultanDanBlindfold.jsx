import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function SimultanDanBlindfold() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("simultan.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("simultan.deskripsi")}
      next={{ to: "/program-kami/sekolah-catur", judul: t("simultan.nextJudul") }}
    >
      <PageArtikel title={t("simultan.artikel")}>
        <p>{t("simultan.p1")}</p>
        <p>{t("simultan.p2")}</p>
        <p>{t("simultan.p3")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
