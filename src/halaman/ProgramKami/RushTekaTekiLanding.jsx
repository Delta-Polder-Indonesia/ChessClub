import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Landing page untuk mode latihan taktik berjangka waktu.
 * Penjelasan dan label tersedia dalam kamus i18n; alat interaktif berada di
 * /teka-teki-rush. Tata letak mengikuti palet dan tipografi situs.
 */
const RUTE_ALAT = "/teka-teki-rush";
const HERO_IMAGE = "/images/ProgramKami/rush-teka-teki-hero.webp";

export default function RushTekaTekiLanding() {
  const { t } = useI18n();
  const fitur = [
    { judul: t("rushLanding.fitur1Judul"), isi: t("rushLanding.fitur1Isi") },
    { judul: t("rushLanding.fitur2Judul"), isi: t("rushLanding.fitur2Isi") },
    { judul: t("rushLanding.fitur3Judul"), isi: t("rushLanding.fitur3Isi") },
  ];

  return (
    <HalamanIsi
      title={t("rushLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("rushLanding.deskripsi")}
      metaDescription={t("rushLanding.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: "/program-kami/kuis-catur", judul: t("kuisLanding.judul") }}
    >
      <div className="font-serif">
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-8 md:py-18">
            <h2 className="font-serif font-light text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.08] tracking-normal text-grey-800">
              {t("rushLanding.introJudul")}
            </h2>
            <div className="mt-8 grid gap-y-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:gap-x-12">
              <div className="flex max-w-[62ch] flex-col gap-y-5 text-[1rem] leading-[1.8] text-pretty text-grey-600">
                <p className="m-0">{t("rushLanding.intro1")}</p>
                <p className="m-0">{t("rushLanding.intro2")}</p>
              </div>
              <div className="mx-auto w-full max-w-[480px] md:justify-self-end">
                <img
                  src={gambar("/images/ProgramKami/rush-teka-teki-illustration.svg")}
                  alt={t("rushLanding.introGambarAlt")}
                  width="1200"
                  height="760"
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full rounded border border-grey-200"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-14 md:px-8 md:py-18">
            <h2 className="font-serif font-light text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.08] tracking-normal text-grey-800">
              {t("rushLanding.fiturJudul")}
            </h2>
            <dl className="mt-9 grid gap-x-12 gap-y-8 border-t border-grey-200 pt-8 sm:grid-cols-3">
              {fitur.map((f) => (
                <div key={f.judul} className="flex flex-col gap-y-2">
                  <dt className="font-serif text-[1.0625rem] font-semibold leading-[1.35] text-balance text-grey-800">
                    {f.judul}
                  </dt>
                  <dd className="m-0 max-w-[42ch] font-serif text-sm leading-[1.7] text-pretty text-grey-600">
                    {f.isi}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-6 py-14 md:px-8 md:py-16">
            <h2 className="font-serif font-light text-[clamp(1.9rem,3vw,2.7rem)] leading-[1.1] text-grey-800">
              {t("rushLanding.ctaJudul")}
            </h2>
            <p className="m-0 max-w-[62ch] text-base leading-[1.8] text-pretty text-grey-600">
              {t("rushLanding.ctaIsi")}
            </p>
            <TombolConten to={RUTE_ALAT}>{t("rushLanding.cta")}</TombolConten>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
