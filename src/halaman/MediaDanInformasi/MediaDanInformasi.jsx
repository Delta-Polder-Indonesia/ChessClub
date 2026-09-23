import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel, MastheadEditorial } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function MediaDanInformasi() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("media.judul")}
      description={t("media.deskripsi")}
      next={{
        to: "/media-dan-informasi/berita-komunitas",
        judul: t("media.nextJudul"),
      }}
    >
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <MastheadEditorial
          kicker={t("media.judul")}
          judul={t("media.artikel")}
          subjudul={t("media.deskripsi")}
        />

        {/* ═══ Konten Paragraf Utama ═══ */}
        <div className="flex w-full flex-col gap-y-4 pt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
          <p className="m-0 first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-black first-letter:leading-none first-letter:text-gray-900">
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
              <Link to="/media-dan-informasi/galeri">{t("nav.galeri")}</Link>:{" "}
              {t("media.l2")}
            </li>
          </ol>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}