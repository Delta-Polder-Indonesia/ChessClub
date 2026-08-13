import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Pengumuman() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("pengumuman.judul")}
      description={t("pengumuman.deskripsi")}
      next={{ to: "/media-dan-informasi/galeri", judul: t("pengumuman.nextJudul") }}
    >
      <PageArtikel title={t("pengumuman.artikel")}>
        <ol>
          <li>
            <strong>{t("pengumuman.p1a")}</strong>
            {t("pengumuman.p1b")}
          </li>
          <li>
            <strong>{t("pengumuman.p2a")}</strong>
            {t("pengumuman.p2b")}
          </li>
          <li>
            <strong>{t("pengumuman.p3a")}</strong>
            {t("pengumuman.p3b")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
