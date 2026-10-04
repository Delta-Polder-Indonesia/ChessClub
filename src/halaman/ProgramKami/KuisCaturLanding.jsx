import { HalamanIsi } from "../../components/PageBagian.jsx";
import { Tombol } from "../../components/Tombol.jsx";
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
        {/* ═══ Pengantar — judul di atas, narasi di bawahnya ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-y-8">
              <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
                {t("kuisLanding.introJudul")}
              </h2>
              <div className="flex max-w-[62ch] flex-col gap-y-5 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                <p className="m-0">{t("kuisLanding.intro1")}</p>
                <p className="m-0">{t("kuisLanding.intro2")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Sepuluh kategori — daftar dua/lima kolom ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("kuisLanding.kategoriJudul")}
            </h2>
            <ul className="mt-10 grid list-none gap-x-8 gap-y-4 border-t border-grey-200 p-0 pt-10 sm:grid-cols-2 lg:grid-cols-3">
              {KATEGORI.map((k) => (
                <li
                  key={k}
                  className="flex items-center gap-3 border-b border-grey-200 pb-3 font-serif text-sm font-medium leading-[1.6] text-pretty text-grey-800"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                  {t(`quiz.kategori.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══ Cara bermain — daftar bernomor ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("kuisLanding.caraJudul")}
            </h2>
            <ol className="mt-10 grid list-none gap-x-12 gap-y-8 border-t border-grey-200 p-0 pt-10 sm:grid-cols-2">
              {langkah.map((teks, i) => (
                <li key={teks} className="flex gap-4">
                  <span className="shrink-0 text-lg font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="m-0 max-w-[52ch] font-serif text-sm leading-[1.6] text-pretty text-grey-600">
                    {teks}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ═══ Ajakan mulai — panel datar + tautan ke alat ═══ */}
        <section className="w-full bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <div className="rounded-lg border border-grey-200 p-8 md:p-10">
              <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
                {t("kuisLanding.ctaJudul")}
              </h2>
              <p className="mt-4 max-w-[62ch] font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                {t("kuisLanding.ctaIsi")}
              </p>
              <div className="mt-8">
                <Tombol to={RUTE_ALAT} variant="garis">
                  {t("kuisLanding.cta")}
                  <ArrowRightIcon className="size-4" />
                </Tombol>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
