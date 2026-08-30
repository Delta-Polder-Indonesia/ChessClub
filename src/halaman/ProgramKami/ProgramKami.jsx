import { HalamanIsi } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Bilik teks + gambar background.
 *
 * - `min-h-[420px]` menjaga tinggi minimum agar gambar tidak terpotong
 *   saat teks sedikit.
 * - Saat teks banyak, section membesar secara alami (wajar).
 * - Gambar selalu `object-cover` penuh setinggi section.
 */
function Bilik({ gelap, drawKiri, gambarKecil, judul, children, tanpaOverlay = false }) {
  const overlay =
    drawKiri && gelap
      ? "bg-[linear-gradient(270deg,_#021624_0%,_rgba(2,22,36,0.6)_30%,_rgba(2,22,36,0.2)_100%)]"
      : drawKiri && !gelap
        ? "bg-[linear-gradient(270deg,_#ffffff_0%,_rgba(255,255,255,0.7)_35%,_rgba(255,255,255,0.15)_100%)]"
        : !drawKiri && gelap
          ? "bg-[linear-gradient(90deg,_#021624_0%,_rgba(2,22,36,0.6)_30%,_rgba(2,22,36,0.2)_100%)]"
          : "bg-[linear-gradient(90deg,_#ffffff_0%,_rgba(255,255,255,0.7)_35%,_rgba(255,255,255,0.15)_100%)]";

  return (
    <section
      className={`relative w-full min-h-[420px] overflow-hidden ${
        gelap ? "bg-hero" : "bg-white"
      }`}
    >
      {/* Gambar background — selalu penuh setinggi section */}
      <div
        className={`absolute inset-y-0 w-full md:w-1/2 ${
          drawKiri ? "left-0" : "right-0"
        }`}
      >
        <img
          src={gambarKecil}
          alt=""
          draggable="false"
          decoding="async"
          loading="lazy"
          className="h-full w-full object-cover object-center"
        />
        {!tanpaOverlay && <div className={`absolute inset-0 ${overlay}`} />}
      </div>

      {/* Konten teks */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 xl:px-0 py-12 md:py-16">
        <div
          className={`flex w-full flex-col items-center gap-8 md:gap-0 ${
            drawKiri ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          <div className="w-full md:w-1/2 flex flex-col gap-y-4">
            <h2
              className={`font-semibold text-2xl md:text-3xl ${
                gelap ? "text-white" : "text-slate-900"
              }`}
            >
              {judul}
            </h2>
            <div
              className={`flex flex-col gap-y-4 leading-7 ${
                gelap ? "text-white/70" : "text-slate-600"
              }`}
            >
              {children}
            </div>
          </div>

          {/* Kolom penyeimbang */}
          <div className="hidden md:block md:w-1/2" />
        </div>
      </div>
    </section>
  );
}

function Triptych({ t }) {
  const strong = (gelap) =>
    `font-semibold ${gelap ? "text-white" : "text-slate-900"}`;

  return (
    <>
      {/* ═══ Hero — gelap, gambar kanan ═══ */}
      <section className="relative w-full min-h-[420px] bg-hero text-white overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2">
          <img
            src={gambar("/images/hero-about.webp")}
            alt=""
            draggable="false"
            decoding="async"
            loading="lazy"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_#021624_0%,_rgba(2,22,36,0.6)_30%,_rgba(2,22,36,0.2)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 xl:px-0 py-12 md:py-16">
          <div className="flex w-full flex-col items-center gap-8 md:flex-row">
            <div className="w-full md:w-1/2 flex flex-col gap-y-4">
              <h2 className="font-bold text-3xl md:text-5xl leading-tight">
                {t("bermainCatur.judul")}
              </h2>
              <h3 className="text-lg md:text-xl text-white/80 font-medium">
                {t("bermainCatur.slogan")}
              </h3>
              <p className="text-white/70 leading-7">
                {t("bermainCatur.p1")}
              </p>
              <p className="text-white/70 leading-7">
                {t("bermainCatur.p2")}
              </p>
            </div>
            <div className="hidden md:block md:w-1/2" />
          </div>
        </div>
      </section>

      {/* ═══ Bilik 1 — terang, gambar kiri, daftar butir ═══ */}
      <Bilik
        gelap={false}
        drawKiri
        gambarKecil={gambar("/images/landing-sorotan-program.webp")}
        judul={t("bermainCatur.f1Judul")}
      >
        <p>{t("bermainCatur.f1P")}</p>
        <ul className="list-none p-0 m-0 flex flex-col gap-y-2.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n}>
              <strong className={strong(false)}>
                {t(`bermainCatur.f1Item${n}Judul`)}
              </strong>{" "}
              {t(`bermainCatur.f1Item${n}Isi`)}
            </li>
          ))}
        </ul>
      </Bilik>

      {/* ═══ Bilik 2 — gelap, gambar kanan ═══ */}
      <Bilik
        gelap
        drawKiri={false}
        gambarKecil={gambar("/images/landing-sorotan-turnamen.webp")}
        judul={t("bermainCatur.f2Judul")}
      >
        <p>{t("bermainCatur.f2P")}</p>
      </Bilik>

      {/* ═══ Bilik 3 — terang, gambar kiri ═══ */}
      <Bilik
        gelap={false}
        drawKiri
        gambarKecil={gambar("/images/landing-sorotan-media.webp")}
        judul={t("bermainCatur.f3Judul")}
      >
        <p>{t("bermainCatur.f3P")}</p>
      </Bilik>

      {/* ═══ Bilik 4 — terang, gambar kanan, tanpa overlay ═══ */}
      <Bilik
        gelap={false}
        drawKiri={false}
        gambarKecil={gambar("/images/ProgramKami/chess_4_2.webp")}
        judul={t("bermainCatur.f4Judul")}
        tanpaOverlay
      >
        <p>{t("bermainCatur.f4P1")}</p>
        <p>{t("bermainCatur.f4P2")}</p>
      </Bilik>

      {/* ═══ Bilik 5 — gelap, gambar kiri ═══ */}
      <Bilik
        gelap
        drawKiri
        gambarKecil={gambar("/images/tata-nilai.webp")}
        judul={t("bermainCatur.f5Judul")}
      >
        <p>{t("bermainCatur.f5P")}</p>
      </Bilik>

      {/* ═══ Bilik 6 — terang, gambar kanan ═══ */}
      <Bilik
        gelap={false}
        drawKiri={false}
        gambarKecil={gambar("/images/hero-about.webp")}
        judul={t("bermainCatur.f6Judul")}
      >
        <p>{t("bermainCatur.f6P1")}</p>
        <p>{t("bermainCatur.f6P2")}</p>
        <p className={strong(false)}>
          {t("bermainCatur.f6P3")}
        </p>
      </Bilik>
    </>
  );
}

export default function ProgramKami() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{
        to: "/program-kami/sekolah-catur/cara-bermain-catur",
        judul: t("nav.caraBermainCatur"),
      }}
    >
      <Triptych t={t} />
    </HalamanIsi>
  );
}