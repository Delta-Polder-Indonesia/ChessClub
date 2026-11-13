import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, sumberGambar } from "../../lib/asets.js";

/**
 * Halaman landing "Rush Teka-teki" (/program-kami/rush-teka-teki).
 *
 * Halaman penjelas untuk mode latihan taktik berjangka waktu; menautkan ke
 * alat interaktif di /teka-teki-rush. Mengikuti DESIGN.md: serif, palet
 * abu/biru/putih, garis 1px datar tanpa gradien/glow, tanpa tumpukan kartu.
 */

const RUTE_ALAT = "/teka-teki-rush";
const RUTE_TEKA_TEKI = "/teka-teki/problem";
const RUTE_ANALISA = "/program-kami/analisa/papan";
const HERO_IMAGE = "/images/ProgramKami/rush-teka-teki-hero.webp";

export default function RushTekaTekiLanding() {
  const { t } = useI18n();

  const langkahSesi = [
    t("rushLanding.langkah1"),
    t("rushLanding.langkah2"),
    t("rushLanding.langkah3"),
    t("rushLanding.langkah4"),
  ];

  const fitur = [
    { judul: t("rushLanding.fitur1Judul"), isi: t("rushLanding.fitur1Isi") },
    { judul: t("rushLanding.fitur2Judul"), isi: t("rushLanding.fitur2Isi") },
    { judul: t("rushLanding.fitur3Judul"), isi: t("rushLanding.fitur3Isi") },
  ];

  const gambarRush = sumberGambar("/images/RushPuzzle.webp", {
    sizes: "(min-width: 1024px) 520px, (min-width: 768px) 46vw, 92vw",
  });

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
        {/* Pengantar — kiri: judul, narasi & aksi utama; kanan: ilustrasi fotografis */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("rushLanding.ctaJudul")}
            </h2>
            <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:items-start md:gap-x-12">
              <div className="flex max-w-[65ch] flex-col gap-y-5 font-serif text-base leading-relaxed text-pretty text-grey-600">
                <p className="m-0">{t("rushLanding.intro1")}</p>
                <p className="m-0">{t("rushLanding.intro2")}</p>
                <div className="mt-2 font-sans">
                  <TombolConten to={RUTE_ALAT}>{t("rushLanding.cta")}</TombolConten>
                </div>
              </div>

              <figure className="m-0 w-full border border-grey-200 bg-paper p-1.5">
                <img
                  {...gambarRush}
                  alt={t("rushLanding.introGambarAlt")}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  className="aspect-[1280/698] w-full object-cover object-center"
                />
                <figcaption className="mt-2 px-1.5 pb-1 text-[13px] leading-relaxed text-grey-600">
                  {t("rushLanding.introGambarCaption")}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Dua mode soal — perbandingan terbuka berbasis garis 1px */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("rushLanding.modeJudul")}
            </h2>
            <p className="mt-5 mb-0 max-w-[65ch] text-base leading-relaxed text-pretty text-grey-600">
              {t("rushLanding.modeLead")}
            </p>

            <dl className="mt-10 grid gap-x-12 gap-y-9 border-t border-grey-200 pt-10 md:grid-cols-2">
              <div className="flex flex-col gap-y-2.5">
                <dt className="font-serif text-lg font-semibold leading-snug text-balance text-grey-800">
                  {t("rushLanding.modeSkakmatJudul")}
                </dt>
                <dd className="m-0 max-w-[60ch] text-base leading-relaxed text-pretty text-grey-600">
                  {t("rushLanding.modeSkakmatIsi")}
                </dd>
              </div>
              <div className="flex flex-col gap-y-2.5">
                <dt className="font-serif text-lg font-semibold leading-snug text-balance text-grey-800">
                  {t("rushLanding.modeCampuranJudul")}
                </dt>
                <dd className="m-0 max-w-[60ch] text-base leading-relaxed text-pretty text-grey-600">
                  {t("rushLanding.modeCampuranIsi")}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Aturan sesi & disiplin ritme — urutan bernomor + panduan praktis */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("rushLanding.caraJudul")}
            </h2>

            <div className="mt-10 grid gap-x-12 gap-y-10 border-t border-grey-200 pt-10 md:grid-cols-2">
              <div>
                <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                  {t("rushLanding.caraSubjudul")}
                </h3>
                <ol className="mt-4 mb-0 flex list-decimal flex-col gap-y-3.5 pl-5 text-base leading-relaxed text-pretty text-grey-600">
                  {langkahSesi.map((langkah, idx) => (
                    <li key={idx} className="pl-1">
                      {langkah}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex max-w-[62ch] flex-col gap-y-4">
                <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                  {t("rushLanding.strategiSubjudul")}
                </h3>
                <p className="m-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("rushLanding.strategi1")}
                </p>
                <p className="m-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("rushLanding.strategi2")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Yang dilatih & keterkaitan dengan alat latihan lain */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("rushLanding.fiturJudul")}
            </h2>
            <dl className="mt-10 grid gap-x-12 gap-y-9 border-t border-grey-200 pt-10 sm:grid-cols-3">
              {fitur.map((f) => (
                <div key={f.judul} className="flex flex-col gap-y-2">
                  <dt className="font-serif text-lg font-semibold leading-snug text-balance text-grey-800">
                    {f.judul}
                  </dt>
                  <dd className="m-0 max-w-[42ch] font-serif text-sm leading-relaxed text-pretty text-grey-600">
                    {f.isi}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12 border-t border-grey-200 pt-8">
              <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                {t("rushLanding.penutupJudul")}
              </h3>
              <p className="mt-3 mb-0 max-w-[68ch] text-base leading-relaxed text-pretty text-grey-600">
                {t("rushLanding.penutupAwal")}{" "}
                <Link
                  to={RUTE_TEKA_TEKI}
                  className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("nav.tekaTeki")}
                </Link>{" "}
                {t("rushLanding.penutupTengah")}{" "}
                <Link
                  to={RUTE_ANALISA}
                  className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("rushLanding.tautanAnalisa")}
                </Link>{" "}
                {t("rushLanding.penutupAkhir")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
