import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, berkasPublik } from "../../lib/asets.js";

/**
 * Halaman landing "Kuis Catur" (/program-kami/kuis-catur).
 *
 * Halaman penjelas untuk kuis pilihan ganda; menautkan ke alat interaktif di
 * /quiz-catur. Mengikuti DESIGN.md: serif, palet abu/biru/putih, garis 1px,
 * tanpa gradien/glow. Konten dari `kuisLanding.*`.
 */

const RUTE_ALAT = "/quiz-catur";
const HERO_IMAGE = "/images/ProgramKami/kuis-catur-hero.webp";

export default function KuisCaturLanding() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("kuisLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("kuisLanding.deskripsi")}
      metaDescription={t("kuisLanding.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: "/program-kami/pembukaan", judul: t("nav.pembukaan") }}
    >
      <div className="font-serif">
        {/* ═══ Pengantar — judul di atas, narasi di bawahnya ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-y-8">
              <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
                {t("kuisLanding.introJudul")}
              </h2>
              <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-12">
                <div className="flex max-w-[62ch] flex-col gap-y-5 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                  <p className="m-0">{t("kuisLanding.intro1")}</p>
                  <p className="m-0">{t("kuisLanding.intro2")}</p>
                  <div>
                    <TombolConten to={RUTE_ALAT}>{t("kuisLanding.cta")}</TombolConten>
                  </div>
                </div>
                <img
                  src={berkasPublik("/images/ProgramKami/kuis-open-book.svg")}
                  alt=""
                  draggable="false"
                  width={962}
                  height={678}
                  className="w-full max-w-[440px] shrink-0 lg:w-[40%]"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
