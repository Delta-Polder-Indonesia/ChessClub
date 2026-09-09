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
 * Pengaturan, Source Code, Atribusi) sebagai saudara area kerja.
 *
 * Area kerja itu sendiri kini meniru halaman Pengurus: bilah kiri memilih
 * LAYAR (papan / akun / basis data / impor) dan isinya berganti di tempat,
 * tanpa popup. Papan catur tidak pernah dilepas — lihat
 * komponen/areaKerja.jsx. Pengukuran tinggi/lebar papan tetap membaca
 * <main> di dalam AreaKerja, jadi `wadahRef` sudah pindah ke sana.
 */
import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { gambar } from "../../lib/asets.js";
import ConfigContextProvider from "./konteks/config.jsx";
import ErrorsContextProvider from "./konteks/errors.jsx";
import AnalyzeContextProvider from "./konteks/analyze.jsx";
import { MesinProvider } from "./konteks/mesin.jsx";
import PageErrors from "./komponen/errors/pageErrors.jsx";
import AreaKerja from "./komponen/areaKerja.jsx";
import Nav from "./komponen/nav/nav.jsx";
import "./analisa.css";

export default function Analisa() {
  const { t } = useI18n();
  const [tinggi, setTinggi] = useState(0);

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
      <MetaHalaman
        title={t("analisa.metaJudul")}
        description={t("analisa.metaDeskripsi")}
        robots="noindex, follow"
        image={gambar("/images/PapanAnalysa.webp")}
        imageWidth={1600}
        imageHeight={1200}
      />
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
                  <AreaKerja />
                </AnalyzeContextProvider>
              </div>
            </div>
          </MesinProvider>
        </ErrorsContextProvider>
      </ConfigContextProvider>
    </div>
  );
}
