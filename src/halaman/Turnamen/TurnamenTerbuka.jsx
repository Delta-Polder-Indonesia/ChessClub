import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function TurnamenTerbuka() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("turnamenTerbuka.judul")}
      parent={t("nav.turnamen")}
      parentPath="/turnamen"
      description={t("turnamenTerbuka.deskripsi")}
      next={{
        to: "/turnamen/liga-antar-komunitas",
        judul: t("turnamenTerbuka.nextJudul"),
      }}
    >
      <PageArtikel title={t("turnamenTerbuka.artikel")}>
        <p>{t("turnamenTerbuka.p1")}</p>
        <p>{t("turnamenTerbuka.p2")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
