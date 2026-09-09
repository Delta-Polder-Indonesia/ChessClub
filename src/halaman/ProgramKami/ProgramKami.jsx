import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Bilik Teks + Gambar Editorial.
 *
 * Menggunakan komposisi layout berselang-seling (editorial layout) dengan 
 * spacing yang lapang, garis aksen tipis, dan tipografi berlapis (serif + sans).
 */
function Bilik({ gelap, drawKiri, gambarKecil, judul, children, tanpaOverlay = false }) {
  return (
    <section
      className={`relative w-full border-b border-gray-200 transition-colors duration-200 ${
        gelap ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-900"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24 xl:px-0">
        <div
          className={`flex flex-col gap-12 lg:gap-16 items-center ${
            drawKiri ? "lg:flex-row-reverse" : "lg:flex-row"
          }`}
        >
          {/* Kolom Teks / Narasi */}
          <div className="w-full lg:w-1/2 flex flex-col gap-y-6">
            <div className="flex items-center gap-x-3">
              <span
                className={`h-px w-8 ${
                  gelap ? "bg-amber-400/60" : "bg-stone-800"
                }`}
              />
              <span
                className={`font-sans text-xs tracking-widest uppercase font-bold ${
                  gelap ? "text-amber-400/90" : "text-stone-600"
                }`}
              >
                Program &amp; Inisiatif
              </span>
            </div>

            <h2
              className={`font-serif text-2xl md:text-3xl leading-snug tracking-tight font-black ${
                gelap ? "text-white" : "text-stone-900"
              }`}
            >
              {judul}
            </h2>

            <div
              className={`flex flex-col gap-y-4 font-serif text-sm md:text-base leading-relaxed text-justify ${
                gelap ? "text-stone-300" : "text-stone-700"
              }`}
            >
              {children}
            </div>
          </div>

          {/* Kolom Visual / Bingkai Foto Organik */}
          <div className="w-full lg:w-1/2">
            <div
              className={`relative overflow-hidden rounded-sm border p-2 ${
                gelap
                  ? "border-stone-800 bg-stone-950/40"
                  : "border-stone-300 bg-white shadow-sm"
              }`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-200">
                <img
                  src={gambarKecil}
                  alt=""
                  draggable="false"
                  decoding="async"
                  loading="lazy"
                  className="h-full w-full object-cover object-center filter grayscale-[15%] hover:grayscale-0 transition-all duration-500"
                />
                {!tanpaOverlay && (
                  <div
                    className={`absolute inset-0 pointer-events-none mix-blend-multiply opacity-30 ${
                      gelap ? "bg-stone-900" : "bg-amber-100/40"
                    }`}
                  />
                )}
              </div>
              <div className="mt-2 flex justify-between items-center px-1 font-sans text-[10px] tracking-wider text-stone-500 uppercase">
                <span>Arsip Komunitas</span>
                <span>Blunder Skuad</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Triptych({ t }) {
  const strong = (gelap) =>
    `font-semibold font-sans text-sm tracking-wide ${
      gelap ? "text-amber-300" : "text-stone-900"
    }`;

  return (
    <div className="w-full">
      {/* ═══ Hero Header — Gaya Koran / Editorial Press ═══ */}
      <section className="relative w-full border-b-2 border-stone-900 bg-stone-900 text-stone-100 pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 md:px-8 xl:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-y-6">
              <div className="inline-flex items-center gap-2 border-b border-amber-400/40 pb-2 w-max">
                <span className="font-sans text-xs uppercase tracking-widest text-amber-400 font-bold">
                  Manifes Operasional
                </span>
              </div>

              <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
                {t("bermainCatur.judul")}
              </h1>

              <p className="font-serif text-lg md:text-xl text-amber-100/90 italic border-l-2 border-amber-400 pl-4 py-1">
                {t("bermainCatur.slogan")}
              </p>

              <div className="flex flex-col gap-y-4 font-serif text-sm md:text-base leading-relaxed text-stone-300 text-justify">
                <p className="m-0 first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-black first-letter:leading-none first-letter:text-amber-400">
                  {t("bermainCatur.p1")}
                </p>
                <p className="m-0">{t("bermainCatur.p2")}</p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative border border-stone-700 bg-stone-800 p-3 shadow-2xl">
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src={gambar("/images/hero-about.webp")}
                    alt=""
                    draggable="false"
                    decoding="async"
                    loading="lazy"
                    className="h-full w-full object-cover object-center filter contrast-105 brightness-95"
                  />
                </div>
                <p className="mt-3 m-0 text-center font-serif text-xs italic text-stone-400">
                  Aktivitas komunal dan ruang pembelajaran catur berkelanjutan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Bilik 1 — Terang, Gambar Kiri, Daftar Butir Editorial ═══ */}
      <Bilik
        gelap={false}
        drawKiri
        gambarKecil={gambar("/images/landing-sorotan-program.webp")}
        judul={t("bermainCatur.f1Judul")}
      >
        <p className="m-0">{t("bermainCatur.f1P")}</p>
        <ul className="list-none p-0 m-0 flex flex-col gap-y-3.5 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <li
              key={n}
              className="border-l-2 border-stone-800 pl-4 py-0.5 text-stone-800"
            >
              <strong className={strong(false)}>
                {t(`bermainCatur.f1Item${n}Judul`)} —
              </strong>{" "}
              <span className="font-serif text-stone-700">
                {t(`bermainCatur.f1Item${n}Isi`)}
              </span>
            </li>
          ))}
        </ul>
      </Bilik>

      {/* ═══ Bilik 2 — Gelap, Gambar Kanan ═══ */}
      <Bilik
        gelap
        drawKiri={false}
        gambarKecil={gambar("/images/landing-sorotan-turnamen.webp")}
        judul={t("bermainCatur.f2Judul")}
      >
        <p className="m-0">{t("bermainCatur.f2P")}</p>
      </Bilik>

      {/* ═══ Bilik 3 — Terang, Gambar Kiri ═══ */}
      <Bilik
        gelap={false}
        drawKiri
        gambarKecil={gambar("/images/landing-sorotan-media.webp")}
        judul={t("bermainCatur.f3Judul")}
      >
        <p className="m-0">{t("bermainCatur.f3P")}</p>
      </Bilik>

      {/* ═══ Bilik 4 — Terang, Gambar Kanan, Tanpa Overlay ═══ */}
      <Bilik
        gelap={false}
        drawKiri={false}
        gambarKecil={gambar("/images/ProgramKami/chess_4_2.webp")}
        judul={t("bermainCatur.f4Judul")}
        tanpaOverlay
      >
        <p className="m-0">{t("bermainCatur.f4P1")}</p>
        <p className="m-0">{t("bermainCatur.f4P2")}</p>
      </Bilik>

      {/* ═══ Bilik 5 — Gelap, Gambar Kiri ═══ */}
      <Bilik
        gelap
        drawKiri
        gambarKecil={gambar("/images/tata-nilai.webp")}
        judul={t("bermainCatur.f5Judul")}
      >
        <p className="m-0">{t("bermainCatur.f5P")}</p>
      </Bilik>

      {/* ═══ Bilik 6 — Terang, Gambar Kanan ═══ */}
      <Bilik
        gelap={false}
        drawKiri={false}
        gambarKecil={gambar("/images/hero-about.webp")}
        judul={t("bermainCatur.f6Judul")}
      >
        <p className="m-0">{t("bermainCatur.f6P1")}</p>
        <p className="m-0">{t("bermainCatur.f6P2")}</p>
        <div className="mt-2 p-4 bg-stone-200/60 border-l-4 border-stone-900">
          <p className={`${strong(false)} m-0 italic`}>
            {t("bermainCatur.f6P3")}
          </p>
        </div>
      </Bilik>

      {/* ═══ Footer Aksen Editorial ═══ */}
      <div className="border-t-2 border-b-2 border-stone-900 bg-stone-100 py-6 text-center">
        <strong className="block font-sans text-xs font-black tracking-widest uppercase text-stone-900">
          Blunder Skuad
        </strong>
        <span className="block font-serif text-xs italic text-stone-600 mt-0.5">
          Program &amp; Inisiatif Berkelanjutan
        </span>
      </div>
    </div>
  );
}

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
      <Triptych t={t} />
    </HalamanIsi>
  );
}