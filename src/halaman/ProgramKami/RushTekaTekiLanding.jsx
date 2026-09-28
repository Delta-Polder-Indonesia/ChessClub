import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";

/**
 * Halaman landing "Rush Teka-teki" (/program-kami/rush-teka-teki).
 *
 * Halaman penjelas untuk mode latihan taktik berjangka waktu; menautkan ke
 * alat interaktif di /teka-teki-rush. Mengikuti DESIGN.md: serif, palet
 * abu/biru/putih, garis 1px, tanpa gradien/glow. Konten dari `rushLanding.*`.
 */

const RUTE_ALAT = "/teka-teki-rush";

export default function RushTekaTekiLanding() {
  const { t } = useI18n();

  const langkah = [
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

  return (
    <HalamanIsi
      title={t("rushLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("rushLanding.deskripsi")}
      metaDescription={t("rushLanding.metaDeskripsi")}
      next={{ to: "/program-kami/kuis-catur", judul: t("kuisLanding.judul") }}
    >
      <div className="font-serif">
        {/* ═══ Pengantar — intro asimetris: judul (5) + narasi (7) ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-x-16 gap-y-8 lg:grid-cols-12">
              <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl lg:col-span-5">
                {t("rushLanding.introJudul")}
              </h2>
              <div className="flex max-w-[68ch] flex-col gap-y-5 text-[15px] leading-relaxed text-grey-600 md:text-base lg:col-span-7">
                <p className="m-0">{t("rushLanding.intro1")}</p>
                <p className="m-0">{t("rushLanding.intro2")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Cara bermain — daftar bernomor ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {t("rushLanding.caraJudul")}
            </h2>
            <ol className="mt-10 grid list-none gap-x-12 gap-y-8 border-t border-grey-200 p-0 pt-10 sm:grid-cols-2">
              {langkah.map((teks, i) => (
                <li key={teks} className="flex gap-4">
                  <span className="shrink-0 text-lg font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-grey-600 md:text-base">
                    {teks}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══ Yang membuatnya melatih — daftar definisi ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {t("rushLanding.fiturJudul")}
            </h2>
            <dl className="mt-10 grid gap-x-12 gap-y-9 border-t border-grey-200 pt-10 sm:grid-cols-3">
              {fitur.map((f) => (
                <div key={f.judul} className="flex flex-col gap-y-2">
                  <dt className="text-lg font-semibold leading-snug text-grey-800">
                    {f.judul}
                  </dt>
                  <dd className="m-0 max-w-[42ch] text-pretty text-[15px] leading-relaxed text-grey-600">
                    {f.isi}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ═══ Ajakan mulai — panel datar + tautan ke alat ═══ */}
        <section className="w-full bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="rounded-lg border border-grey-200 p-8 md:p-10">
              <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
                {t("rushLanding.ctaJudul")}
              </h2>
              <p className="mt-4 max-w-[68ch] text-pretty text-[15px] leading-relaxed text-grey-600 md:text-base">
                {t("rushLanding.ctaIsi")}
              </p>
              <div className="mt-7">
                <Link
                  to={RUTE_ALAT}
                  className="inline-flex items-center justify-center gap-2 rounded border border-primary bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("rushLanding.cta")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
