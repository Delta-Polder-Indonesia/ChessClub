import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import DaftarAnggota from "./DaftarAnggota.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Keanggotaan() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("keanggotaan.judul")}
      description={t("keanggotaan.deskripsi")}
      next={{
        to: "/keanggotaan/pendaftaran-anggota",
        judul: t("keanggotaan.nextJudul"),
      }}
    >
      <PageArtikel title={t("keanggotaan.artikel")}>
        <p className="ql-align-justify">{t("keanggotaan.intro")}</p>
        <DaftarAnggota />
      </PageArtikel>
    </HalamanIsi>
  );
}
