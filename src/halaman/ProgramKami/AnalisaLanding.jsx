import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { berkasPublik, gambar } from "../../lib/asets.js";

const FITUR = [
  { judul: "analisaLanding.fitur1Judul", isi: "analisaLanding.fitur1Isi" },
  { judul: "analisaLanding.fitur2Judul", isi: "analisaLanding.fitur2Isi" },
  { judul: "analisaLanding.fitur3Judul", isi: "analisaLanding.fitur3Isi" },
];

const GRADE = [
  { label: "analisaLanding.gradeBrilian", ket: "analisaLanding.gradeBrilianKet", gambar: "Brilliant-Brilian.png" },
  { label: "analisaLanding.gradeTerbaik", ket: "analisaLanding.gradeTerbaikKet", gambar: "Best-Move-Langkah-Terbaik.png" },
  { label: "analisaLanding.gradeUnggul", ket: "analisaLanding.gradeUnggulKet", gambar: "Excellent-Sangat Bagus.png" },
  { label: "analisaLanding.gradeLayak", ket: "analisaLanding.gradeLayakKet", gambar: "Good-Bagus.png" },
  { label: "analisaLanding.gradeKeliru", ket: "analisaLanding.gradeKeliruKet", gambar: "Inaccuracy-Ketidakakuratan.png" },
  { label: "analisaLanding.gradeKesalahan", ket: "analisaLanding.gradeKesalahanKet", gambar: "Mistake-Kesalahan.png" },
  { label: "analisaLanding.gradeBlunder", ket: "analisaLanding.gradeBlunderKet", gambar: "Blunder.png" },
];

const RUTE_PAPAN_ANALISA = "/program-kami/analisa/papan";
const HERO_IMAGE = "/images/ProgramKami/analisa-hero.webp";

export default function AnalisaLanding() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("analisaLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("analisaLanding.deskripsi")}
      metaDescription={t("analisaLanding.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: RUTE_PAPAN_ANALISA, judul: t("analisa.judul") }}
    >
      <PageArtikel lebar title={t("analisaLanding.p1Judul")}>
        <div className="flex w-full flex-col items-stretch gap-6 md:flex-row md:gap-8">
          <div className="flex min-w-0 w-full flex-col justify-between gap-y-3 md:w-1/2">
            <div className="flex flex-col gap-y-3 font-serif">
              <p>{t("analisaLanding.p1")}</p>
            </div>

            <Tombol to={RUTE_PAPAN_ANALISA} variant="garis" className="mt-1 w-fit shrink-0">
              <span>{t("analisaLanding.mulai")}</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Tombol>
          </div>

          <figure className="w-full min-w-0 md:w-1/2 md:self-start">
            <div className="relative w-full min-h-0 aspect-[4/3] md:h-[220px] md:aspect-auto lg:h-[260px]">
              <img
                src={gambar("/images/PapanAnalysa.webp")}
                alt={t("analisaLanding.demoJudul")}
                width={1600}
                height={1200}
                draggable="false"
                decoding="async"
                loading="lazy"
                className="h-full w-full object-cover object-top"
              />
            </div>
            <figcaption className="mt-2 border-l-2 border-primary pl-3 text-xs leading-relaxed text-grey-600">
              <span className="block font-bold uppercase text-grey-800">{t("analisaLanding.demoJudul")}</span>
              <span className="block">{t("analisaLanding.demoTantangan")}</span>
              <span className="block italic">{t("analisaLanding.demoFooter")}</span>
            </figcaption>
          </figure>
        </div>

        <div className="flex w-full flex-col gap-y-3 pt-2 font-serif">
          <p>{t("analisaLanding.p1b")}</p>
          <p>{t("analisaLanding.p2")}</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          {FITUR.map((f) => (
            <div key={f.judul} className="rounded border border-grey-300 bg-paper p-4">
              <h3 className="m-0 border-b border-grey-200 pb-1 text-sm font-semibold text-grey-800">
                {t(f.judul)}
              </h3>
              <p className="m-0 mt-1 font-serif">{t(f.isi)}</p>
            </div>
          ))}
        </div>

        <section aria-labelledby="analisa-belajar" className="pt-5">
          <p className="mb-1 text-[13px] font-semibold text-primary">{t("analisaLanding.belajarLabel")}</p>
          <h2 id="analisa-belajar">{t("analisaLanding.belajarJudul")}</h2>

          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded border border-grey-300 bg-paper p-4">
              <h3 className="m-0 border-b border-grey-200 pb-1 text-sm font-semibold text-grey-800">
                {t("analisaLanding.pgnJudul")}
              </h3>
              <p className="m-0 mt-1 font-serif">{t("analisaLanding.pgnIsi")}</p>
            </article>
            <article className="rounded border border-grey-300 bg-paper p-4">
              <h3 className="m-0 border-b border-grey-200 pb-1 text-sm font-semibold text-grey-800">
                {t("analisaLanding.mesinJudul")}
              </h3>
              <p className="m-0 mt-1 font-serif">{t("analisaLanding.mesinIsi")}</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="analisa-grade" className="pt-5">
          <h2 id="analisa-grade" className="text-center">
            {t("analisaLanding.gradeJudul")}
          </h2>
          <p className="mb-3 text-center font-serif">{t("analisaLanding.gradeP")}</p>

          <ul className="!m-0 grid w-full !list-none grid-cols-1 gap-x-8 gap-y-3 !p-0 md:grid-cols-2">
            {GRADE.map((g) => (
              <li key={g.label} className="!m-0 flex items-start gap-3 border-b border-grey-300 py-2">
                <img
                  src={berkasPublik(`/images/MoveEvaluation/${encodeURIComponent(g.gambar)}`)}
                  alt={t(g.label)}
                  width={36}
                  height={36}
                  loading="lazy"
                  className="mt-0.5 h-9 w-9 shrink-0 rounded object-contain"
                />
                <div>
                  <span className="block font-serif text-sm font-bold leading-relaxed text-grey-800">
                    {t(g.label)}
                  </span>
                  <span className="block font-serif">{t(g.ket)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-grey-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-grey-800">
              {t("analisaLanding.gradePenutupJudul")}
            </h3>
            <p className="font-serif">{t("analisaLanding.gradePenutupP")}</p>
            <p className="font-serif">{t("analisaLanding.gradePenutupKompas")}</p>
            <p className="font-serif">{t("analisaLanding.gradeTujuan")}</p>
          </div>
        </section>
      </PageArtikel>
    </HalamanIsi>
  );
}
