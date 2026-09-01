/*
 * Halaman "Analisis Partai" — antarmuka analisis yang dipindah dari
 * Brilliant-Chess (MIT, © 2025 Delo) dengan engine milik ChessClub.
 *
 * Yang sengaja TIDAK ikut dipindah: worker Stockfish bawaan upstream
 * (public/engine/*.js + `new Worker` + navigator.hardwareConcurrency).
 * Seluruh komunikasi UCI kini lewat src/lib/engineCatur.js — engine yang sama
 * dengan halaman Teka-Teki dan Papan Interaktif — sehingga hanya ada satu
 * salinan Stockfish di situs ini dan build-nya bisa dipilih pengguna.
 *
 * Halaman ini juga yang memegang tinggi area kerja: papan port mengukur
 * kontainer induknya, sementara tinggi itu sendiri harus dikurangi header
 * situs. Lihat wadahRef + effect di bawah.
 */
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import Hero from "../../components/Hero.jsx";
import ConfigContextProvider from "./konteks/config.jsx";
import ErrorsContextProvider from "./konteks/errors.jsx";
import AnalyzeContextProvider from "./konteks/analyze.jsx";
import { MesinProvider } from "./konteks/mesin.jsx";
import PageErrors from "./komponen/errors/pageErrors.jsx";
import Game from "./komponen/game/game.jsx";
import BoardMenu from "./komponen/boardMenu/boardMenu.jsx";
import Menu from "./komponen/menu/menu.jsx";
import GameButtons from "./komponen/menu/analysis/gameButtons.jsx";
import PanelSamping from "./PanelSamping.jsx";
import "./analisa.css";

/** Tinggi minimum area analisis supaya papan tetap bisa dipakai. */
const TINGGI_MIN = 640;

export default function Analisa() {
  const { t, bahasa } = useI18n();
  const wadahRef = useRef(null);
  const [tinggi, setTinggi] = useState(0);

  useEffect(() => {
    document.title = `${t("analisa.metaJudul")} | ${t("common.namaKomunitas")}`;
  }, [t, bahasa]);

  /*
   * Area kerja = sisa tinggi layar di bawah header situs. `getBoundingClientRect`
   * dipakai alih-alih `100dvh - konstanta` karena tinggi hero/announcement bar
   * bisa berubah; pengukuran diulang lagi setelah font muat supaya tidak ada
   * lompatan layout pada kunjungan pertama.
   */
  useEffect(() => {
    const el = wadahRef.current;
    if (!el) return undefined;

    function ukur() {
      const atas = el.getBoundingClientRect().top;
      const tersedia = Math.round(window.innerHeight - atas);
      setTinggi(Math.max(TINGGI_MIN, tersedia));
    }

    ukur();
    window.addEventListener("resize", ukur);
    window.addEventListener("orientationchange", ukur);
    if (document.fonts?.ready) document.fonts.ready.then(ukur).catch(() => {});

    return () => {
      window.removeEventListener("resize", ukur);
      window.removeEventListener("orientationchange", ukur);
    };
  }, []);

  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("nav.programKami"), to: "/program-kami" },
    { label: t("nav.analisa") },
  ];

  return (
    <div className="bg-[#f5f5f5] pb-10">
      <Hero
        title={t("analisa.judul")}
        description={t("analisa.tagline")}
        crumbs={crumbs}
      />

      <ConfigContextProvider>
        <ErrorsContextProvider>
          <MesinProvider>
            <div className="mx-auto w-full max-w-[1500px] px-2 md:px-4">
              <p className="mx-auto mb-3 mt-4 inline-flex flex-row items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 md:text-sm">
                <span aria-hidden="true">🔒</span>
                {t("analisa.privasi")}
              </p>
              <main
                ref={wadahRef}
                style={{ height: tinggi || undefined }}
                className="analisa-root relative w-full overflow-y-auto overflow-x-hidden rounded-xl select-none"
              >
                <PageErrors />
                <AnalyzeContextProvider>
                  <div className="flex h-full w-full flex-col items-center justify-start gap-4 overflow-y-auto p-2 vertical:flex-row vertical:gap-2 vertical:overflow-visible vertical:p-4">
                    <div className="flex h-full w-min flex-col navTop:flex-row vertical:gap-[10px] gap-[6px]">
                      <Game wadah={wadahRef} />
                      <BoardMenu />
                      <div className="bg-backgroundBox flex-row justify-center rounded-borderRoundness w-full navTop:hidden flex h-12">
                        <div className="max-w-[500px] w-full flex flex-row justify-center scale-75">
                          <GameButtons />
                        </div>
                      </div>
                    </div>
                    <Menu />
                  </div>
                  <PanelSamping />
                </AnalyzeContextProvider>
              </main>
            </div>
            <p className="mx-auto mt-3 max-w-[1500px] px-4 text-xs leading-5 text-slate-500 md:px-8">
              {t("analisa.petunjuk")}
            </p>
          </MesinProvider>
        </ErrorsContextProvider>
      </ConfigContextProvider>
    </div>
  );
}
