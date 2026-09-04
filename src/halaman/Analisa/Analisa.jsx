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
 *
 * Kerangka dalam mengikuti upstream: bilah navigasi kiri (Nav — logo,
 * Pengaturan, Source Code, Atribusi) sebagai saudara <main>, dan panel
 * Pengaturannya berupa dropdown yang menempel di kanan bilah itu.
 */
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import ConfigContextProvider from "./konteks/config.jsx";
import ErrorsContextProvider from "./konteks/errors.jsx";
import AnalyzeContextProvider from "./konteks/analyze.jsx";
import { MesinProvider } from "./konteks/mesin.jsx";
import PageErrors from "./komponen/errors/pageErrors.jsx";
import Game from "./komponen/game/game.jsx";
import BoardMenu from "./komponen/boardMenu/boardMenu.jsx";
import Menu from "./komponen/menu/menu.jsx";
import GameButtons from "./komponen/menu/analysis/gameButtons.jsx";
import Nav from "./komponen/nav/nav.jsx";
import "./analisa.css";

export default function Analisa() {
  const { t, bahasa } = useI18n();
  const wadahRef = useRef(null);
  const [tinggi, setTinggi] = useState(0);

  useEffect(() => {
    document.title = `${t("analisa.metaJudul")} | ${t("common.namaKomunitas")}`;
  }, [t, bahasa]);

  /*
   * Area kerja = seluruh tinggi layar (header & footer situs disembunyikan
   * di halaman ini, lihat PageLayout). Dihitung via `window.innerHeight`
   * dan diulang setelah font muat supaya tidak ada lompatan layout.
   */
  useEffect(() => {
    function ukur() {
      setTinggi(Math.round(window.innerHeight));
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

  return (
    <div className="h-screen w-full overflow-hidden">
      <ConfigContextProvider>
        <ErrorsContextProvider>
          <MesinProvider>
            <div className="h-full w-full">
              {/*
                Area kerja = kerangka ala upstream: bilah navigasi kiri
                (logo, Source Code, Atribusi) berdampingan dengan papan.
                Tema gelap & variabel CSS dipasang di div ini
                (.analisa-root) supaya ikut mengcover bilah navigasi;
                pengukuran tinggi/lebar papan tetap membaca <main> di
                bawahnya — lebarnya otomatis dikurangi bilah navigasi.
              */}
              <div
                style={{ height: tinggi || undefined }}
                className="analisa-root relative flex w-full select-none flex-col overflow-hidden rounded-none navTop:flex-row"
              >
                <AnalyzeContextProvider>
                  <PageErrors />
                  <Nav />
                  <main
                    ref={wadahRef}
                    className="relative h-full w-full overflow-y-auto overflow-x-hidden"
                  >
                    <div className="flex h-full w-full flex-col items-center justify-start gap-4 overflow-y-auto p-2 vertical:flex-row vertical:justify-start vertical:gap-2 vertical:overflow-visible vertical:p-4">
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
                  </main>
                </AnalyzeContextProvider>
              </div>
            </div>
          </MesinProvider>
        </ErrorsContextProvider>
      </ConfigContextProvider>
    </div>
  );
}
