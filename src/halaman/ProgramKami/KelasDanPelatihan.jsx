import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function KelasDanPelatihan() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("kelas.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("kelas.deskripsi")}
      next={{ to: "/program-kami/coaching-clinic", judul: t("kelas.nextJudul") }}
    >
      <PageArtikel title={t("kelas.artikel")}>
        <p>{t("kelas.p1")}</p>
        <ol>
          <li>
            <strong>{t("kelas.l1a")}</strong> {t("kelas.l1b")}
          </li>
          <li>
            <strong>{t("kelas.l2a")}</strong> {t("kelas.l2b")}
          </li>
          <li>
            <strong>{t("kelas.l3a")}</strong> {t("kelas.l3b")}
          </li>
        </ol>
        <p>{t("kelas.p2")}</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
