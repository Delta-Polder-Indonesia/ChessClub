import { HalamanIsi, PageArtikel, PageGambar } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Galeri() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("galeri.judul")}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={t("galeri.deskripsi")}
      next={{
        to: "/media-dan-informasi/buletin-bulanan",
        judul: t("galeri.nextJudul"),
      }}
    >
      <PageArtikel title={t("galeri.artikel")}>
        <p className="ql-align-justify">{t("galeri.p1")}</p>
      </PageArtikel>

      <PageGambar
        src="/images/sekilas.jpg"
        alt={t("galeri.img1Alt")}
        caption={t("galeri.img1Caption")}
      />
      <PageGambar
        src="/images/tata-nilai.jpg"
        alt={t("galeri.img2Alt")}
        caption={t("galeri.img2Caption")}
      />
      <PageGambar
        src="/images/tonggak-2024.jpg"
        alt={t("galeri.img3Alt")}
        caption={t("galeri.img3Caption")}
      />
    </HalamanIsi>
  );
}
