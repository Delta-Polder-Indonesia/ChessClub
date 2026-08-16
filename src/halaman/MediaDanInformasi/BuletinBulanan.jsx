import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function BuletinBulanan() {
  const { t } = useI18n();

  const EDISI = [
    { bulan: t("buletin.b1"), isi: t("buletin.e1") },
    { bulan: t("buletin.b2"), isi: t("buletin.e2") },
    { bulan: t("buletin.b3"), isi: t("buletin.e3") },
  ];

  return (
    <HalamanIsi
      title={t("buletin.judul")}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={t("buletin.deskripsi")}
      next={{ to: "/keberlanjutan", judul: t("nav.keberlanjutan") }}
    >
      <PageArtikel title={t("buletin.artikel")}>
        <p>{t("buletin.p1")}</p>
        <ol>
          {EDISI.map((e) => (
            <li key={e.bulan}>
              <strong>{e.bulan}.</strong> {e.isi}
            </li>
          ))}
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
