import { HalamanIsi } from "../../components/PageBagian.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { sumberGambar } from "../../lib/asets.js";

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

  const fitur = [
    { judul: t("rushLanding.fitur1Judul"), isi: t("rushLanding.fitur1Isi") },
    { judul: t("rushLanding.fitur2Judul"), isi: t("rushLanding.fitur2Isi") },
    { judul: t("rushLanding.fitur3Judul"), isi: t("rushLanding.fitur3Isi") },
  ];

  const gambarRush = sumberGambar("/images/RushPuzzle.webp");

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
        {/* ═══ Pengantar — kiri: judul & narasi; kanan: infografis ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("rushLanding.ctaJudul")}
            </h2>
            <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:items-start md:gap-x-12">
              <div className="flex max-w-[62ch] flex-col gap-y-5 font-serif text-[1rem] leading-[1.8] text-pretty text-grey-600">
                <p className="m-0">{t("rushLanding.intro2")}</p>
                <div className="mt-3">
                  <Tombol to={RUTE_ALAT} variant="garis">
                    {t("rushLanding.cta")}
                    <ArrowRightIcon className="size-4" />
                  </Tombol>
                </div>
              </div>

              <div className="w-full">
                <img
                  {...gambarRush}
                  alt={t("rushLanding.introGambarAlt")}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded border border-slate-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Yang membuatnya melatih — daftar definisi ═══ */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("rushLanding.fiturJudul")}
            </h2>
            <dl className="mt-10 grid gap-x-12 gap-y-9 border-t border-grey-200 pt-10 sm:grid-cols-3">
              {fitur.map((f) => (
                <div key={f.judul} className="flex flex-col gap-y-2">
                  <dt className="font-serif text-[1.0625rem] font-semibold leading-[1.35] text-balance text-grey-800">
                    {f.judul}
                  </dt>
                  <dd className="m-0 max-w-[42ch] font-serif text-sm leading-[1.6] text-pretty text-grey-600">
                    {f.isi}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
