import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function TurnamenBulanan() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("turnamenBulanan.judul")}
      parent={t("nav.turnamen")}
      parentPath="/turnamen"
      description={t("turnamenBulanan.deskripsi")}
      next={{ to: "/turnamen/liga-musiman", judul: t("turnamenBulanan.nextJudul") }}
    >
      <PageArtikel title={t("turnamenBulanan.artikel")}>
        <p>{t("turnamenBulanan.p1")}</p>
        <ol>
          <li>{t("turnamenBulanan.l1")}</li>
          <li>{t("turnamenBulanan.l2")}</li>
          <li>{t("turnamenBulanan.l3")}</li>
        </ol>
        <p>{t("turnamenBulanan.p2")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
