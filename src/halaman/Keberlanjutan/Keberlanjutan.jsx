import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function Keberlanjutan() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("keberlanjutan.judul")}
      description={t("keberlanjutan.deskripsi")}
      next={{ to: "/keanggotaan/syarat-dan-ketentuan", judul: t("keberlanjutan.nextJudul") }}
    >
      <PageArtikel title={t("keberlanjutan.artikel")}>
        <ol>
          <li>
            <Link to="/keanggotaan/syarat-dan-ketentuan">
              {t("nav.syaratKetentuan")}
            </Link>
            {t("keberlanjutan.l1b")}
          </li>
          <li>
            <Link to="/keanggotaan/kode-etik-komunitas">
              {t("nav.kodeEtik")}
            </Link>
            {t("keberlanjutan.l2b")}
          </li>
          <li>
            <Link to="/keanggotaan/pertanyaan-umum">
              {t("nav.pertanyaanUmum")}
            </Link>
            {t("keberlanjutan.l3b")}
          </li>
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
