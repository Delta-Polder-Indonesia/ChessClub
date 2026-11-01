import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import PapanStatis from "../../components/PapanStatis.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman "Teka-teki & Tips" (/program-kami/teka-teki).
 *
 * Pintu masuk ke alat latihan taktik di /teka-teki. Isinya satu seksi
 * pengantar: judul, narasi, CTA, dan papan statis berisi posisi soal #1927
 * dari public/data/teka-teki.json ("Mate in Two", rating 1095).
 *
 * Mengikuti DESIGN.md: serif untuk bacaan, sans untuk kontrol, mono untuk
 * notasi serta angka; garis 1px datar tanpa gradien/glow; tata letak
 * asimetris, bukan grid kartu kembar.
 */

/**
 * Alamat kanonik alat teka-teki. `/teka-teki` masih berfungsi (dialihkan),
 * tetapi tautan internal diarahkan langsung ke alamat resmi agar mesin
 * pencari dan pemain tidak melewati satu pengalihan.
 */
const RUTE_ALAT = "/teka-teki/problem";
const RUTE_RUSH = "/program-kami/rush-teka-teki";
/** Teka-teki harian resmi Chess.com — soal baru setiap hari. */
const RUTE_HARIAN = "/teka-teki-harian";
const HERO_IMAGE = "/images/ProgramKami/teka-teki-hero.webp";
/**
 * Papan pengantar — posisi statis soal #1927 dari public/data/teka-teki.json
 * ("Mate in Two", rating 1095). Hiasan kolom kanan, tanpa pemutar langkah.
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
      next={{ to: RUTE_RUSH, judul: t("nav.tekaTekiRush") }}
    >
      <div className="font-serif">
        {/* ═══ Pengantar — kiri: judul, narasi & CTA; kanan: papan statis ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("tipsTekaTeki.introJudul")}
            </h2>
            <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:items-start md:gap-x-12">
              <div className="flex max-w-[62ch] flex-col gap-y-5 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                <p className="m-0">{t("tipsTekaTeki.intro1")}</p>
                <p className="m-0">{t("tipsTekaTeki.intro2")}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-4 font-sans">
                  <TombolConten to={RUTE_ALAT}>{t("tipsTekaTeki.ctaUtama")}</TombolConten>
                  <TombolConten to={RUTE_HARIAN}>
                    {t("tipsTekaTeki.ctaHarian")}
                  </TombolConten>
                </div>
              </div>

              <div className="w-full">
                <PapanStatis
                  fen={PAPAN_PENGENAL}
                  terakhir={null}
                  ariaLabel={t("tipsTekaTeki.pengantarAriaPapan")}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
