import { Link } from"react-router-dom";
import { HalamanIsi, PageArtikel, MastheadEditorial } from"../../components/PageBagian.jsx";
import { useI18n } from"../../lib/i18n.jsx";

export default function MediaDanInformasi() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("media.judul")}
      description={t("media.deskripsi")}
      next={{
        to:"/media-dan-informasi/berita-komunitas",
        judul: t("media.nextJudul"),
      }}
    >
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <MastheadEditorial
          judul={t("media.artikel")}
          subjudul={t("media.deskripsi")}
        />

        {/* ═══ Konten Paragraf Utama ═══ */}
        <div className="flex w-full flex-col gap-y-4 pt-1 font-serif text-base leading-[1.6] text-grey-800">
          <p className="m-0">
            {t("media.p1")}
          </p>
          <p className="m-0">{t("media.p2")}</p>

          <ol>
            <li className="ql-align-justify">
              <Link to="/media-dan-informasi/berita-komunitas">
                {t("nav.beritaKomunitas")}
              </Link>
              : {t("media.l1")}
            </li>
            <li className="ql-align-justify">
              <Link to="/media-dan-informasi/galeri">{t("nav.galeri")}</Link>:{""}
              {t("media.l2")}
            </li>
          </ol>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}