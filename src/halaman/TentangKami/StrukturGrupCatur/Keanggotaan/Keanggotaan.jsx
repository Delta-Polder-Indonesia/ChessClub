import { PageArtikel } from "../../../../components/PageBagian.jsx";
import DaftarAnggota from "./DaftarAnggota.jsx";
import TingkatanRating from "./TingkatanRating.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";

/**
 * Konten tab Keanggotaan pada halaman Struktur Grup Catur.
 * Komponen ini sengaja tidak memiliki HalamanIsi sendiri agar keanggotaan
 * tidak muncul sebagai halaman publik terpisah.
 */
export default function Keanggotaan() {
  const { t } = useI18n();

  return (
    <PageArtikel title={t("keanggotaan.artikel")}>
      <p className="ql-align-justify">{t("keanggotaan.intro")}</p>
      <DaftarAnggota />
      <TingkatanRating />
    </PageArtikel>
  );
}
