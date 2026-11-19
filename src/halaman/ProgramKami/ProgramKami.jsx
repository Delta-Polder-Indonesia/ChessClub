import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { sumberGambar } from "../../lib/asets.js";

// Cuplikan notasi menghiasi kartu, bukan kontrol papan interaktif.
const PROGRAM = [
  ["clinic", "♘", "Nf3 · d5 · g3"],
  ["sekolah", "♙", "e4 · e5 · Nf3"],
  ["panduan", "♗", "Bc4 · Bc5", "ebook-panduan"],
  ["simultan", "♔", "1. d4 · 1. e4"],
  ["tekaTeki", "♕", "Qh5 · Qxf7#", "teka-teki"],
  ["manusiaVsMesin", "♜", "1. e4 · c5", "manusia-vs-mesin"],
  ["latihanRepertoar", "♞", "d4 · Nf6 · c4", "latihan-repertoar"],
  ["handBrain", "♖", "Ra1 · Re1", "hand-brain"],
  ["turingTest", "♟", "e4 · c6 · d4", "turing-test"],
  ["tekaTekiHarian", "♛", "Qd8#", "teka-teki-harian"],
];

export default function ProgramKami() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{
        to: "/program-kami/teka-teki",
        judul: t("nav.tekaTeki"),
      }}
    >
      <section aria-labelledby="program-unggulan" className="mx-auto w-full max-w-6xl px-4 py-12 md:px-8 md:py-16">
        <header className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 id="program-unggulan" className="text-balance font-serif text-4xl text-grey-800 md:text-5xl">
            {t("program.programJudul")}
          </h2>
          <p className="text-lg text-grey-600">{t("program.pengantarKatalog")}</p>
        </header>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="relative isolate flex min-h-80 items-end overflow-hidden rounded-3xl bg-grey-800 sm:col-span-2 lg:row-span-2">
            <img
              {...sumberGambar("/images/landing-sorotan-program.webp", { sizes: "(min-width: 1024px) 65vw, 100vw" })}
              alt={t("program.sorotanAlt")} width={640} height={427} loading="lazy" decoding="async"
              className="absolute inset-0 -z-10 size-full object-cover"
            />
            <div className="w-full bg-black/80 p-6 text-white sm:p-8">
              <h3 className="font-serif text-3xl">{t("program.kartu.kelas.judul")}</h3>
              <p className="mt-2 max-w-lg leading-relaxed">{t("program.kartu.kelas.deskripsi")}</p>
            </div>
          </li>
          {PROGRAM.map(([kunci, bidak, notasi, jalur]) => (
            <li key={kunci} className="flex min-w-0 flex-col gap-4 rounded-3xl border border-grey-200 bg-grey-50 p-6">
              <div aria-hidden="true" className="flex items-center justify-between gap-2 rounded-2xl border border-grey-200 bg-white p-4">
                <span className="grid size-12 place-items-center rounded-xl bg-grey-100 text-3xl text-slate-800">{bidak}</span>
                <span className="font-mono text-sm text-grey-600">{notasi}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-grey-800">{t(`program.kartu.${kunci}.judul`)}</h3>
                <p className="mt-1 leading-relaxed text-grey-600">{t(`program.kartu.${kunci}.deskripsi`)}</p>
              </div>
              {jalur && (
                <Link to={`/program-kami/${jalur}`} className="mt-auto inline-flex w-fit items-center gap-2 rounded text-sm font-semibold text-slate-800 hover:underline focus-visible:ring-2 focus-visible:ring-slate-800">
                  {t("common.selengkapnya")}<span className="sr-only">: {t(`program.kartu.${kunci}.judul`)}</span>
                  <ArrowRightIcon className="size-4" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </HalamanIsi>
  );
}
