import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
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

export default function AnalisaLanding() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("analisaLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("analisaLanding.deskripsi")}
      metaDescription={t("analisaLanding.metaDeskripsi")}
      image={gambar("/images/PapanAnalysa.webp")}
      imageWidth={1600}
      imageHeight={1200}
      next={{ to: RUTE_PAPAN_ANALISA, judul: t("analisa.judul") }}
    >
      <PageArtikel lebar>
        {/* ═══ Hero — penambahan -mt-8 md:-mt-12 untuk menaikkan posisi konten ═══ */}
        <section aria-labelledby="analisa-pengantar" className="-mt-8 md:-mt-12 relative w-full overflow-hidden bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
            <div className="relative mb-4 border-b-4 border-double border-gray-900 pb-3 text-center">
              <p className="mb-1 font-sans text-xs font-bold tracking-widest text-gray-900 uppercase">
                {t("analisaLanding.judul")}
              </p>
              <h2 id="analisa-pengantar" className="mb-2 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
                {t("analisaLanding.p1Judul")}
              </h2>
              <p className="m-0 text-sm text-gray-900 italic">
                {t("analisaLanding.deskripsi")}
              </p>
            </div>
            <div className="flex w-full flex-col items-stretch gap-6 md:flex-row md:gap-8">
              <div className="flex min-w-0 w-full flex-col justify-between gap-y-3 md:w-1/2">
                <div className="flex flex-col gap-y-3 font-serif text-sm leading-relaxed text-justify text-gray-800">
                  <p className="m-0">{t("analisaLanding.p1")}</p>
                </div>

                <Link
                  to={RUTE_PAPAN_ANALISA}
                  className="mt-1 inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded border border-black bg-transparent px-6 py-2.5 text-sm font-bold text-black no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <span>{t("analisaLanding.mulai")}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
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
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,_#ffffff_0%,_rgba(255,255,255,0.7)_35%,_rgba(255,255,255,0.15)_100%)]" />
                </div>
                <figcaption className="mt-2 border-l-2 border-gray-900 pl-3 text-xs leading-relaxed text-gray-800">
                  <span className="block font-bold uppercase text-gray-900">{t("analisaLanding.demoJudul")}</span>
                  <span className="block">{t("analisaLanding.demoTantangan")}</span>
                  <span className="block italic">{t("analisaLanding.demoFooter")}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ═══ Kelanjutan — paragraf 2 & 3 ═══ */}
        <div className="flex w-full flex-col gap-y-3 pt-2">
          <p className="m-0 font-serif text-sm leading-relaxed text-justify text-gray-800">
            {t("analisaLanding.p1b")}
          </p>
          <p className="m-0 font-serif text-sm leading-relaxed text-justify text-gray-800">
            {t("analisaLanding.p2")}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          {FITUR.map((f) => (
            <div key={f.judul} className="rounded border border-gray-400 bg-white p-4">
              <h3 className="m-0 border-b border-gray-900 pb-1 text-xs font-bold tracking-wide uppercase text-gray-900">
                {t(f.judul)}
              </h3>
              <p className="m-0 mt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
                {t(f.isi)}
              </p>
            </div>
          ))}
        </div>

        <section aria-labelledby="analisa-belajar" className="pt-5">
          <p className="mb-1 text-xs font-bold tracking-widest uppercase text-gray-900">
            {t("analisaLanding.belajarLabel")}
          </p>
          <h2 id="analisa-belajar" className="m-0 mb-4 border-b border-gray-900 pb-1 text-base font-black tracking-tight uppercase text-gray-900">
            {t("analisaLanding.belajarJudul")}
          </h2>

          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded border border-gray-400 bg-white p-4">
              <h3 className="m-0 border-b border-gray-900 pb-1 text-xs font-bold tracking-wide uppercase text-gray-900">
                {t("analisaLanding.pgnJudul")}
              </h3>
              <p className="m-0 mt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
                {t("analisaLanding.pgnIsi")}
              </p>
            </article>
            <article className="rounded border border-gray-400 bg-white p-4">
              <h3 className="m-0 border-b border-gray-900 pb-1 text-xs font-bold tracking-wide uppercase text-gray-900">
                {t("analisaLanding.mesinJudul")}
              </h3>
              <p className="m-0 mt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
                {t("analisaLanding.mesinIsi")}
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="analisa-grade" className="pt-5">
          <div className="text-center">
            <h2 id="analisa-grade" className="m-0 mb-2 inline-block border-b border-gray-900 pb-1 text-base font-black tracking-tight uppercase text-gray-900">
              {t("analisaLanding.gradeJudul")}
            </h2>
          </div>
          <p className="m-0 mb-3 text-center font-serif text-sm leading-relaxed text-gray-800">
            {t("analisaLanding.gradeP")}
          </p>

          <ul className="!m-0 grid w-full !list-none grid-cols-1 gap-x-8 gap-y-3 !p-0 md:grid-cols-2">
            {GRADE.map((g) => (
              <li key={g.label} className="!m-0 flex items-start gap-3 border-b border-gray-300 py-2">
                <img
                  src={berkasPublik(`/images/MoveEvaluation/${encodeURIComponent(g.gambar)}`)}
                  alt={t(g.label)}
                  width={36}
                  height={36}
                  loading="lazy"
                  className="mt-0.5 h-9 w-9 shrink-0 rounded object-contain"
                />
                <div>
                  <span className="block font-serif text-sm font-bold leading-relaxed text-gray-900">
                    {t(g.label)}
                  </span>
                  <span className="block font-serif text-sm leading-relaxed text-gray-800">
                    {t(g.ket)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t-2 border-b-2 border-gray-900 p-4">
            <h3 className="mb-2 text-center font-sans text-sm font-bold tracking-wide text-gray-900 uppercase">
              ! {t("analisaLanding.gradePenutupJudul")} !
            </h3>
            <p className="m-0 font-serif text-sm leading-relaxed text-justify text-gray-900">
              {t("analisaLanding.gradePenutupP")}
            </p>
            <p className="m-0 mt-3 font-serif text-sm leading-relaxed text-justify text-gray-900">
              {t("analisaLanding.gradePenutupKompas")}
            </p>
            <p className="m-0 mt-3 font-serif text-sm leading-relaxed text-justify text-gray-900">
              {t("analisaLanding.gradeTujuan")}
            </p>
          </div>
        </section>
      </PageArtikel>
    </HalamanIsi>
  );
}