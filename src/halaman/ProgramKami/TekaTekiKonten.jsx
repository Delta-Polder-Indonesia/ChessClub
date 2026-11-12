import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import PapanStatis from "../../components/PapanStatis.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman "Teka-teki & Tips" (/program-kami/teka-teki).
 *
 * Pintu masuk ke alat latihan taktik tanpa batas waktu di /teka-teki/problem.
 * Mengikuti DESIGN.md dan halaman penjelas Program Kami lain: pembuka editorial
 * dua kolom bersama papan contoh statis dan satu aksi utama tunggal.
 */

const RUTE_ALAT = "/teka-teki/problem";
const RUTE_SOAL_CONTOH = "/teka-teki/problem/1927";
const RUTE_RUSH_LANDING = "/program-kami/rush-teka-teki";
const HERO_IMAGE = "/images/ProgramKami/teka-teki-hero.webp";

/**
 * Papan pengantar — posisi statis soal #1927 dari public/data/teka-teki.json
 * ("Mate in Two", rating 1095, French Defense: Normal Variation).
 */
const PAPAN_PENGENAL =
  "r2qrbk1/pb1n1pp1/1p1p1n1p/2pP2N1/2P5/2NBB3/PPQ2PPP/4RRK1 w - - 0 14";

export default function TekaTekiKonten() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("tipsTekaTeki.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("tipsTekaTeki.deskripsi")}
      metaDescription={t("tipsTekaTeki.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: RUTE_RUSH_LANDING, judul: t("nav.tekaTekiRush") }}
    >
      <div className="font-serif">
        {/* Pengantar — kiri: judul, narasi & aksi utama tunggal; kanan: papan contoh */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.introJudul")}
            </h2>
            <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:items-start md:gap-x-12">
              <div className="flex max-w-prose flex-col gap-y-5 font-serif text-base leading-relaxed text-pretty text-grey-600">
                <p className="m-0">{t("tipsTekaTeki.intro1")}</p>
                <p className="m-0">{t("tipsTekaTeki.intro2")}</p>
                <div className="mt-2 font-sans">
                  <TombolConten to={RUTE_ALAT}>{t("tipsTekaTeki.ctaUtama")}</TombolConten>
                </div>
              </div>

              <figure className="m-0 mx-auto w-full max-w-md border border-grey-200 bg-paper p-2.5 md:mr-0">
                <PapanStatis
                  fen={PAPAN_PENGENAL}
                  terakhir={null}
                  ariaLabel={t("tipsTekaTeki.pengantarAriaPapan")}
                />
                <figcaption className="mt-2.5 flex flex-col gap-y-1 px-1 pb-0.5 text-xs leading-relaxed text-grey-600">
                  <span>{t("tipsTekaTeki.pengantarCaption")}</span>
                  <Link
                    to={RUTE_SOAL_CONTOH}
                    className="w-fit font-sans font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("tipsTekaTeki.pengantarTautan")}
                  </Link>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
