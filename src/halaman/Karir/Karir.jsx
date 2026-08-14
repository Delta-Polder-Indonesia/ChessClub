import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Karir() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("karir.judul")}
      description={t("karir.deskripsi")}
      next={{ to: "/hubungi-kami", judul: t("karir.nextJudul") }}
    >
      <PageArtikel title={t("karir.artikel")}>
        <ol>
          <li>
            <strong>{t("karir.l1a")}</strong>
            {t("karir.l1b")}
          </li>
          <li>
            <strong>{t("karir.l2a")}</strong>
            {t("karir.l2b")}
          </li>
          <li>
            <strong>{t("karir.l3a")}</strong>
            {t("karir.l3b")}
          </li>
        </ol>
        <p>{t("karir.kirim")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
