import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";

/**
 * Halaman landing "Kuis Catur" (/program-kami/kuis-catur).
 *
 * Halaman penjelas untuk kuis pilihan ganda; menautkan ke alat interaktif di
 * /quiz-catur. Mengikuti DESIGN.md: serif, palet abu/biru/putih, garis 1px,
 * tanpa gradien/glow. Konten dari `kuisLanding.*` dan kategori dari `quiz.*`.
 */

const RUTE_ALAT = "/quiz-catur";

const KATEGORI = [
  "peraturan",
  "bidak",
  "skakmat",
  "taktik",
  "pembukaan",
  "strategi",
  "endgame",
  "notasi",
  "sejarah",
  "umum",
];

export default function KuisCaturLanding() {
  const { t } = useI18n();

  const langkah = [
    t("kuisLanding.langkah1"),
    t("kuisLanding.langkah2"),
    t("kuisLanding.langkah3"),
    t("kuisLanding.langkah4"),
  ];

  return (
    <HalamanIsi
      title={t("kuisLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("kuisLanding.deskripsi")}
      metaDescription={t("kuisLanding.metaDeskripsi")}
      next={{ to: "/program-kami/pembukaan", judul: t("nav.pembukaan") }}
    >
      <div className="font-serif">
        {/* ═══ Pengantar — intro asimetris: judul (5) + narasi (7) ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="grid gap-x-16 gap-y-8 lg:grid-cols-12">
              <h2 className="text-pretty text-2xl font-semibold leading-snug text-grey-800 md:text-3xl lg:col-span-5">
                {t("kuisLanding.introJudul")}
              </h2>
              <div className="flex max-w-[68ch] flex-col gap-y-5 text-[15px] leading-relaxed text-grey-600 md:text-base lg:col-span-7">
                <p className="m-0">{t("kuisLanding.intro1")}</p>
                <p className="m-0">{t("kuisLanding.intro2")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Sepuluh kategori — daftar dua/lima kolom ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {t("kuisLanding.kategoriJudul")}
            </h2>
            <ul className="mt-10 grid list-none gap-x-8 gap-y-4 border-t border-grey-200 p-0 pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {KATEGORI.map((k) => (
                <li
                  key={k}
                  className="flex items-center gap-3 border-b border-grey-200 pb-3 text-[15px] font-medium text-grey-800 md:text-base"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`quiz.kategori.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══ Cara bermain — daftar bernomor ═══ */}
        <section className="w-full border-t border-grey-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
              {t("kuisLanding.caraJudul")}
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

        {/* ═══ Ajakan mulai — panel datar + tautan ke alat ═══ */}
        <section className="w-full bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="rounded-lg border border-grey-200 p-8 md:p-10">
              <h2 className="text-balance text-2xl font-semibold leading-snug text-grey-800 md:text-3xl">
                {t("kuisLanding.ctaJudul")}
              </h2>
              <p className="mt-4 max-w-[68ch] text-pretty text-[15px] leading-relaxed text-grey-600 md:text-base">
                {t("kuisLanding.ctaIsi")}
              </p>
              <div className="mt-7">
                <Link
                  to={RUTE_ALAT}
                  className="inline-flex items-center justify-center gap-2 rounded border border-primary bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("kuisLanding.cta")}
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
