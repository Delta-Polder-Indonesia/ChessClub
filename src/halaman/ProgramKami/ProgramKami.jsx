import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { ArrowRightIcon, CloseIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman Program Kami.
 *
 * Diagram halaman mengikuti pola umum landing sebuah permainan — hero
 * gelap dengan ajakan bermain, pemilih tingkat kemampuan, lalu bilik teks
 * dan gambar yang diselang-selingkan antara terang dan gelap — tetapi
 * seluruh markah, komponen, dan teks ditulis dari nol untuk Komunitas
 * Catur Indonesia. Foto di setiap bilik hanyalah penempat sementara yang
 * siap diganti.
 */

/** Empat tingkat kemampuan; setiap tingkat menuju halaman yang cocok. */
const TINGKAT = [
  {
    id: "baru",
    judul: "bermainCatur.tingkatBaruJudul",
    isi: "bermainCatur.tingkatBaruIsi",
    ikon: "icon-Pawn.svg",
    to: "/program-kami/sekolah-catur/cara-bermain-catur",
  },
  {
    id: "pemula",
    judul: "bermainCatur.tingkatPemulaJudul",
    isi: "bermainCatur.tingkatPemulaIsi",
    ikon: "icon-Knight.svg",
    to: "/teka-teki",
  },
  {
    id: "menengah",
    judul: "bermainCatur.tingkatMenengahJudul",
    isi: "bermainCatur.tingkatMenengahIsi",
    ikon: "icon-Bishop.svg",
    to: "/program-kami/pembukaan",
  },
  {
    id: "mahir",
    judul: "bermainCatur.tingkatMahirJudul",
    isi: "bermainCatur.tingkatMahirIsi",
    ikon: "icon-Rook.svg",
    to: "/papan-interaktif",
  },
];

/** Lapisan pemilih tingkat — dibuka oleh setiap tombol "Mainkan sekarang". */
function PopupTingkat({ terbuka, tutup }) {
  const { t } = useI18n();

  // Kunci gulir halaman saat popup terbuka; tombol Esc ikut menutupnya.
  useEffect(() => {
    if (!terbuka) return undefined;
    const html = document.documentElement;
    const gulirSebelum = html.style.overflow;
    html.style.overflow = "hidden";
    const diEsc = (e) => {
      if (e.key === "Escape") tutup();
    };
    window.addEventListener("keydown", diEsc);
    return () => {
      html.style.overflow = gulirSebelum;
      window.removeEventListener("keydown", diEsc);
    };
  }, [terbuka, tutup]);

  if (!terbuka) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("bermainCatur.popupJudul")}
    >
      <button
        type="button"
        aria-label={t("common.tutup")}
        onClick={tutup}
        className="absolute inset-0 bg-black/70 cursor-pointer"
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8">
        <button
          type="button"
          aria-label={t("common.tutup")}
          onClick={tutup}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <CloseIcon className="size-5" />
        </button>

        <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
          {t("bermainCatur.popupJudul")}
        </h3>
        <p className="mt-2 text-slate-600">{t("bermainCatur.popupTanya")}</p>
        <p className="mt-1 text-sm text-slate-500">{t("bermainCatur.popupBantuan")}</p>

        <ul className="mt-6 flex flex-col gap-3">
          {TINGKAT.map((x) => (
            <li key={x.id}>
              <Link
                to={x.to}
                onClick={tutup}
                className="group flex items-center gap-4 border border-slate-200 rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <span className="flex-none w-12 h-12 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                  <img
                    src={gambar(`/images/IconBidak/${x.ikon}`)}
                    alt=""
                    draggable="false"
                    decoding="async"
                    loading="lazy"
                    className="w-8 h-8"
                  />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-slate-900 group-hover:text-primary transition-colors">
                    {t(x.judul)}
                  </span>
                  <span className="block text-sm text-slate-600 mt-0.5">
                    {t(x.isi)}
                  </span>
                </span>
                <ArrowRightIcon className="flex-none size-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-5 border-t border-slate-200 text-center">
          <Link
            to="/pendaftaran-anggota"
            onClick={tutup}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            {t("bermainCatur.daftar")}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Bilik teks + gambar selang-seling; `gelap` mengatur warna latar. */
function Bilik({
  gelap,
  drawKiri,
  gambarKecil,
  judul,
  children,
  cta,
  onMainkan,
}) {
  const { t } = useI18n();
  const labelMainkan = t("bermainCatur.mainkan");

  const panel = (
    <div>
      <img
        src={gambarKecil}
        alt=""
        width={1280}
        height={714}
        draggable="false"
        decoding="async"
        loading="lazy"
        className="w-full h-auto rounded-xl"
      />
    </div>
  );

  const teks = (
    <div className="flex flex-col gap-y-4">
      <h2
        className={`font-semibold text-2xl md:text-3xl ${
          gelap ? "text-white" : "text-black"
        }`}
      >
        {judul}
      </h2>
      <div
        className={`flex flex-col gap-y-3 leading-7 ${
          gelap ? "text-white/70" : "text-slate-600"
        }`}
      >
        {children}
      </div>
      {cta && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onMainkan}
            aria-haspopup="dialog"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            {labelMainkan}
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section
      className={`w-full px-6 md:px-8 xl:px-0 py-14 md:py-20 overflow-hidden ${
        gelap ? "bg-hero" : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-10 xl:gap-x-20 items-center">
        {drawKiri ? (
          <>
            {panel}
            {teks}
          </>
        ) : (
          <>
            {teks}
            {panel}
          </>
        )}
      </div>
    </section>
  );
}

/** Konten utama — hero gelap + bilik selang-seling seperti diagram prompt. */
function Triptych({ t, buka }) {
  const mainkan = t("bermainCatur.mainkan");
  const strong = (gelap) =>
    `font-semibold ${gelap ? "text-white" : "text-slate-900"}`;

  return (
    <>
      {/* Hero gelap — teks di kiri, gambar di kanan. */}
      <section className="w-full bg-hero text-white overflow-hidden">
        <div className="mx-auto max-w-[1080px] xl:max-w-7xl px-6 md:px-8 xl:px-0 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-y-10 lg:gap-x-10 xl:gap-x-20 items-center">
          <div className="flex flex-col gap-y-4">
            <h2 className="font-bold text-3xl md:text-5xl leading-tight">
              {t("bermainCatur.judul")}
            </h2>
            <h3 className="text-lg md:text-xl text-white/80 font-medium">
              {t("bermainCatur.slogan")}
            </h3>
            <p className="text-white/70 leading-7 max-w-2xl">
              {t("bermainCatur.p1")}
            </p>
            <p className="text-white/70 leading-7 max-w-2xl">
              {t("bermainCatur.p2")}
            </p>
            <button
              type="button"
              onClick={buka}
              aria-haspopup="dialog"
              className="mt-2 self-start inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              {mainkan}
              <ArrowRightIcon className="size-4" />
            </button>
          </div>
          <div>
            <img
              src={gambar("/images/landing-hero.webp")}
              alt=""
              width={1280}
              height={714}
              draggable="false"
              decoding="async"
              loading="lazy"
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Bilik 1 — terang, gambar kiri, daftar butir, tanpa tombol. */}
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

      {/* Bilik 2 — gelap, gambar kanan. */}
      <Bilik
        gelap
        drawKiri={false}
        gambarKecil={gambar("/images/landing-sorotan-turnamen.webp")}
        judul={t("bermainCatur.f2Judul")}
        cta
        onMainkan={buka}
      >
        <p>{t("bermainCatur.f2P")}</p>
      </Bilik>

      {/* Bilik 3 — terang, gambar kiri. */}
      <Bilik
        gelap={false}
        drawKiri
        gambarKecil={gambar("/images/landing-sorotan-media.webp")}
        judul={t("bermainCatur.f3Judul")}
        cta
        onMainkan={buka}
      >
        <p>{t("bermainCatur.f3P")}</p>
      </Bilik>

      {/* Bilik 4 — terang, gambar kanan. */}
      <Bilik
        gelap={false}
        drawKiri={false}
        gambarKecil={gambar("/images/sekilas.webp")}
        judul={t("bermainCatur.f4Judul")}
        cta
        onMainkan={buka}
      >
        <p>{t("bermainCatur.f4P1")}</p>
        <p>{t("bermainCatur.f4P2")}</p>
      </Bilik>

      {/* Bilik 5 — gelap, gambar kiri, tanpa tombol. */}
      <Bilik
        gelap
        drawKiri
        gambarKecil={gambar("/images/tata-nilai.webp")}
        judul={t("bermainCatur.f5Judul")}
      >
        <p>{t("bermainCatur.f5P")}</p>
      </Bilik>

      {/* Bilik 6 — terang, gambar kanan. */}
      <Bilik
        gelap={false}
        drawKiri={false}
        gambarKecil={gambar("/images/hero-about.webp")}
        judul={t("bermainCatur.f6Judul")}
        cta
        onMainkan={buka}
      >
        <p>{t("bermainCatur.f6P1")}</p>
        <p>{t("bermainCatur.f6P2")}</p>
        <p className={`font-semibold ${strong(false)}`}>
          {t("bermainCatur.f6P3")}
        </p>
      </Bilik>
    </>
  );
}

export default function ProgramKami() {
  const { t } = useI18n();
  const [popupTerbuka, setPopupTerbuka] = useState(false);

  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{
        to: "/program-kami/sekolah-catur/cara-bermain-catur",
        judul: t("nav.caraBermainCatur"),
      }}
    >
      <Triptych t={t} buka={() => setPopupTerbuka(true)} />
      <PopupTingkat
        terbuka={popupTerbuka}
        tutup={() => setPopupTerbuka(false)}
      />
    </HalamanIsi>
  );
}