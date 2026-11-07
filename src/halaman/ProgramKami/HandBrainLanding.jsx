import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/** Halaman penjelas "Hand & Brain" (/program-kami/hand-brain). */
const RUTE_ALAT = "/papan-interaktif/hand-brain";
const HERO_IMAGE = "/images/ProgramKami/analisa-hero.webp";

export default function HandBrainLanding() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("handBrainLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("handBrainLanding.deskripsi")}
      metaDescription={t("handBrainLanding.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: RUTE_ALAT, judul: t("handBrainLanding.judul") }}
    >
      <div className="font-serif">
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-y-8">
              <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
                {t("handBrainLanding.introJudul")}
              </h2>
              <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-12">
                <div className="flex max-w-[62ch] flex-col gap-y-5 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                  <p className="m-0">{t("handBrainLanding.intro1")}</p>
                  <p className="m-0">{t("handBrainLanding.intro2")}</p>
                  <div>
                    <TombolConten to={RUTE_ALAT}>
                      {t("handBrainLanding.cta")}
                    </TombolConten>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
