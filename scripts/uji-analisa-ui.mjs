/**
 * Uji asap halaman Analisis Partai (fitur Analisa).
 *
 * Mengapa perlu: komponen port Brilliant-Chess banyak yang mengandalkan
 * `import.meta.env`, `localStorage`, dan API DOM. Sintaksisnya bisa lolos
 * padahal render pertama langsung crash (mis. `t` lupa diimpor di satu file).
 * Uji ini mem-mount halaman sungguhan di jsdom, menempelkan PGN, lalu
 * membiarkan alur analisis berjalan dengan engine UCI palsu — jadi yang
 * diperiksa adalah rangkaiannya (provider, hook, terjemahan, tab), bukan
 * perhitungan engine (itu ditangani scripts/uji-analisa.mjs).
 *
 * Skrip gagal keras bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-analisa-ui.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("GAGAL: tidak dapat menjalankan uji UI Analisa — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");
const { Chess } = require("chess.js");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import Analisa from "./src/halaman/Analisa/Analisa.jsx";
import ConfigContextProvider from "./src/halaman/Analisa/konteks/config.jsx";
import ErrorsContextProvider from "./src/halaman/Analisa/konteks/errors.jsx";
import AnalyzeContextProvider from "./src/halaman/Analisa/konteks/analyze.jsx";
import { AnalyzeContext, normalisasiPemain } from "./src/halaman/Analisa/konteks/analyzeKonteks.js";
import { BoardContext } from "./src/halaman/Analisa/konteks/boardKonteks.js";
import { ImportContext } from "./src/halaman/Analisa/konteks/importKonteks.js";
import { MesinProvider } from "./src/halaman/Analisa/konteks/mesin.jsx";
import Game from "./src/halaman/Analisa/komponen/game/game.jsx";
import Name from "./src/halaman/Analisa/komponen/game/name.jsx";
import { formatPlayerLabel } from "./src/halaman/Analisa/komponen/game/getMoves.js";
import SelectChessComGame from "./src/halaman/Analisa/komponen/menu/analyze/selectChessCom.jsx";
import SelectLichessOrgGame from "./src/halaman/Analisa/komponen/menu/analyze/selectLichessOrg.jsx";
import * as basisData from "./src/halaman/Analisa/basisData.js";
import RatingSVG from "./src/halaman/Analisa/komponen/svg/rating.jsx";
import LoadingBar from "./src/halaman/Analisa/komponen/menu/loading/loadingBar.jsx";
import { persenProgres } from "./src/halaman/Analisa/komponen/menu/loading/persenProgres.js";
import LayarWawasan from "./src/halaman/Analisa/komponen/nav/layarWawasan.jsx";
import KartuProfilWawasan from "./src/halaman/Analisa/komponen/nav/wawasan/kartuProfil.jsx";
import LencanaGelar from "./src/halaman/Analisa/komponen/LencanaGelar.jsx";
import { BATAS_IMPOR, ambilPgn, susunPgnDariTcn, uraikanTautanPartai, validasiFen, validasiPgn } from "./src/halaman/Analisa/komponen/nav/validasiImpor.js";
import PemilihRentang from "./src/halaman/Analisa/akun/PemilihRentang.jsx";
import {
  bagianTanggal,
  geserBulan,
  PRESET_RENTANG,
  rentangPreset,
  susunGridBulan,
  tambahHari,
} from "./src/halaman/Analisa/akun/rentangTanggal.js";
import { renderToStaticMarkup } from "react-dom/server";

export { basisData, persenProgres, BATAS_IMPOR, ambilPgn, susunPgnDariTcn, uraikanTautanPartai, validasiFen, validasiPgn };

/** Geometri grafik eval yang tetap terpasang selama loading dan Ringkasan. */
export { jalurGrafik, tinggiEval, xGrafik } from "./src/halaman/Analisa/komponen/menu/analysis/grafikEval.js";

/**
 * Markup bar kemajuan kartu analisa (tanpa DOM). Kartu ini mengadopsi kartu
 * progres WintrChess: jalur penuh + isian selebar persentase + atribut
 * aksesibilitas.
 */
export function markupBar(progress, transitionTime = 100) {
  return renderToStaticMarkup(<LoadingBar progress={progress} transitionTime={transitionTime} />);
}

/**
 * Markup satu ikon label (tanpa DOM) — dipakai uji kosakata visual: label
 * "critical" harus memakai ikon "best" yang sudah ada, bukan ikon baru.
 */
export function markupIkon(rating, size = 18) {
  return renderToStaticMarkup(<RatingSVG rating={rating} size={size} />);
}

/**
 * Markup lencana gelar FIDE (tanpa DOM). Dipakai mengunci bentuk SVG-nya:
 * kotak #A62424 dengan huruf putih, dan gelar tiga huruf (WGM, WIM, WFM)
 * diperkecil supaya tidak meluber keluar kotak.
 */
export function markupLencanaGelar(gelar) {
  return renderToStaticMarkup(<LencanaGelar gelar={gelar} />);
}

/**
 * Markup baris nama pemain di atas papan (tanpa DOM). Gelar di sini juga
 * memakai lencana SVG — uji ini mengunci fakta itu.
 */
export function markupBarisNama(gelar, namaPemain) {
  return renderToStaticMarkup(<Name title={gelar} white>{namaPemain}</Name>);
}

export { PRESET_RENTANG, bagianTanggal, geserBulan, rentangPreset, susunGridBulan, tambahHari };

/**
 * Pemilih rentang tanggal panel Akun dalam keadaan terpasang. Nilai yang
 * dipilih ditulis ke <output> agar uji bisa membacanya seperti pengguna
 * membaca ringkasannya.
 */
export function mountPemilihRentang(el, awal = "30hari") {
  function PemilihUji({ presetAwal }) {
    const [nilai, setNilai] = React.useState(() => ({
      preset: presetAwal,
      ...rentangPreset(presetAwal),
    }));
    return (
      <I18nProvider>
        <PemilihRentang
          preset={nilai.preset}
          dari={nilai.dari}
          sampai={nilai.sampai}
          onPilih={(baru) => setNilai((lama) => ({ ...lama, ...baru }))}
        />
        <output data-uji="nilai-rentang">{JSON.stringify(nilai)}</output>
      </I18nProvider>
    );
  }
  const root = createRoot(el);
  root.render(<PemilihUji presetAwal={awal} />);
  return root;
}

/**
 * Render pemilih partai satu platform. Dipakai uji regresi: komponen ini
 * pernah melempar ReferenceError ("platform is not defined") sehingga
 * seluruh halaman mati begitu pengguna menekan "Daftar partai".
 */
export function mountPemilih(el, platform, stopSelecting = () => {}) {
  const Pemilih = platform === "lichessOrg" ? SelectLichessOrgGame : SelectChessComGame;
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/program-kami/analisa"]}>
        <I18nProvider>
          <ConfigContextProvider>
            <ErrorsContextProvider>
              <AnalyzeContextProvider>
                <Pemilih username="contoh" depth={10} stopSelecting={stopSelecting} />
              </AnalyzeContextProvider>
            </ErrorsContextProvider>
          </ConfigContextProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}

/**
 * Jembatan uji Fase 2c.
 *
 * Sejak konteks dipecah, komponen papan membaca BoardContext dan komponen
 * muatan PGN membaca ImportContext. Fixture di bawah ini menyuntik nilai
 * lewat AnalyzeContext saja (pola lama), jadi tanpa jembatan nilai suntikan
 * tidak sampai ke komponen yang sudah pindah — uji tetap hijau tetapi tidak
 * lagi menguji apa pun. Jembatan ini memetakan nilai AnalyzeContext ke dua
 * konteks sempit, sehingga fixture tetap sah dan cakupannya utuh.
 */
function JembatanKonteks({ nilai, children }) {
  const board = {
    game: nilai.game,
    players: nilai.players,
    moveNumber: nilai.moveNumber,
    forward: nilai.forward,
    white: nilai.white,
    animation: nilai.animation,
    playing: nilai.playing,
    time: nilai.time,
    materialAdvantage: nilai.materialAdvantage,
    result: nilai.result,
    tab: nilai.tab,
    customLine: nilai.customLine,
    returnedToNormalGame: nilai.returnedToNormalGame,
    depth: nilai.depth,
    tampilan: nilai.tampilan,
    gameController: nilai.gameController,
  };
  const impor = {
    data: nilai.data,
    pageState: nilai.pageState,
    progress: nilai.progress,
    analyzeController: nilai.analyzeController,
    analyzingMove: nilai.analyzingMove,
    langkahSementara: nilai.langkahSementara,
  };
  return (
    <BoardContext.Provider value={board}>
      <ImportContext.Provider value={impor}>{children}</ImportContext.Provider>
    </BoardContext.Provider>
  );
}

function GameDenganPemainKosong() {
  const nilaiBawaan = React.useContext(AnalyzeContext);
  const nilai = {
    ...nilaiBawaan,
    pageState: ["default", () => {}],
    players: [[], () => {}],
  };
  return (
    <AnalyzeContext.Provider value={nilai}>
      <JembatanKonteks nilai={nilai}>
        <Game />
      </JembatanKonteks>
    </AnalyzeContext.Provider>
  );
}

function GameDenganPemutar({ playing }) {
  const nilaiBawaan = React.useContext(AnalyzeContext);
  const nilai = {
    ...nilaiBawaan,
    pageState: ["default", () => {}],
    playing: [playing, () => {}],
  };
  return (
    <AnalyzeContext.Provider value={nilai}>
      <JembatanKonteks nilai={nilai}>
        <Game />
      </JembatanKonteks>
    </AnalyzeContext.Provider>
  );
}

/**
 * Game dengan nilai 'playing' yang DIBERIKAN uji. Dipakai membuktikan tombol
 * pemutar (GameButtons) benar-benar menerima nilai dari konteks — bukan
 * diam-diam memakai nilai bawaan BoardContext.
 */
export function mountGameDenganPemutar(el, playing) {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <ConfigContextProvider>
        <ErrorsContextProvider>
          <MesinProvider>
            <GameDenganPemutar playing={playing} />
          </MesinProvider>
        </ErrorsContextProvider>
      </ConfigContextProvider>
    </I18nProvider>
  );
  return root;
}

/** Regresi untuk state pemain kosong yang dahulu merobohkan render Game. */
export function mountGameDenganPemainKosong(el) {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <ConfigContextProvider>
        <ErrorsContextProvider>
          <MesinProvider>
            <GameDenganPemainKosong />
          </MesinProvider>
        </ErrorsContextProvider>
      </ConfigContextProvider>
    </I18nProvider>
  );
  return root;
}

function GameDenganPageState({ pageState }) {
  const nilaiBawaan = React.useContext(AnalyzeContext);
  const nilai = { ...nilaiBawaan, pageState: [pageState, () => {}] };
  return (
    <AnalyzeContext.Provider value={nilai}>
      <JembatanKonteks nilai={nilai}>
        <Game />
      </JembatanKonteks>
    </AnalyzeContext.Provider>
  );
}

/** P2: kerangka papan hanya bergantung pada pageState milik konteks. */
export function mountGameDenganPageState(el, pageState = "loading") {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <ConfigContextProvider>
        <ErrorsContextProvider>
          <MesinProvider>
            <GameDenganPageState pageState={pageState} />
          </MesinProvider>
        </ErrorsContextProvider>
      </ConfigContextProvider>
    </I18nProvider>
  );
  return root;
}

export { formatPlayerLabel, normalisasiPemain };

function WawasanDenganAkun({ platform, username, gameMoves }) {
  const nilaiBawaan = React.useContext(AnalyzeContext);
  const nilai = {
    ...nilaiBawaan,
    akun: [{ platform, username }, () => {}],
    game: [gameMoves ?? nilaiBawaan.game[0], () => {}],
    players: [[{ name: "AkunWawasan" }, { name: "Lawan" }], () => {}],
  };
  return (
    <AnalyzeContext.Provider value={nilai}>
      <LayarWawasan />
    </AnalyzeContext.Provider>
  );
}

/**
 * Kartu profil Wawasan saja (tanpa papan). Dipakai menguji lencana gelar
 * pada tempat ia benar-benar dipakai — bukan sekadar markup komponennya.
 */
export function mountKartuProfil(el, platform, username, locale = "id") {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/program-kami/analisa/papan"]}>
        <I18nProvider>
          <KartuProfilWawasan username={username} platform={platform} t={(k) => k} locale={locale} />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
  return root;
}

export function mountWawasan(el, platform, username, gameMoves, bahasa = "id") {
  localStorage.setItem("kci-bahasa", bahasa);
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/program-kami/analisa/papan"]}>
        <I18nProvider>
          <ConfigContextProvider>
            <ErrorsContextProvider>
              <AnalyzeContextProvider>
                <WawasanDenganAkun platform={platform} username={username} gameMoves={gameMoves} />
              </AnalyzeContextProvider>
            </ErrorsContextProvider>
          </ConfigContextProvider>
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
  return root;
}

export function mount(el) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/program-kami/analisa/papan"]}>
        <I18nProvider>
          <Analisa />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}
`;

const PGN_UJI = '[Event "Kelas Catur Komunitas"]\n[White "Andini"]\n[Black "Bagas"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0';

/* ------------------------------------------------ bundel halaman (esbuild) */

const berkasBundel = path.join(tmpdir(), "kci-uji-analisa-ui.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-analisa-ui-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` (dipakai ChessPiece — sejak panel bidak tertangkap
  // Analisa memakai set gambar Chess.com — untuk memuat aset bidak) dipecah
  // oleh shim yang sama dengan Node loader, bukan diganti fungsi kosong:
  // `define` menghapus seluruh jejak makro dari sumber sehingga skrip ini
  // buta terhadap bentuk tak langsung yang tidak di-expand Vite.
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    // `VITE_SITE_URL` wajib ada: `asalSitus()` tidak lagi jatuh ke
    // `window.location.origin`, melainkan ke origin produksi. Tanpa nilai
    // ini, kanonik/JSON-LD di uji akan menunjuk domain produksi yang nyata
    // dan pernyataan di bawah (uji.test) menjadi tidak berlaku.
    "import.meta.env": JSON.stringify({
      BASE_URL: "/",
      MODE: "test",
      DEV: true,
      PROD: false,
      VITE_SITE_URL: "https://uji.test",
    }),
  },
  logLevel: "error",
});

/* ------------------------------------------------------- lingkungan jsdom */

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * Engine UCI palsu. Menirukan yang dibutuhkan EngineCatur: `uci` → uciok,
 * `isready` → readyok, lalu untuk setiap `go` satu baris `info ... score cp`
 * dan `bestmove` dari langkah legal pertama posisi saat ini. Setiap `go`
 * ditunda supaya uji bisa menangkap grafik sebelum dan sesudah evaluasi masuk.
 */
class WorkerPalsu {
  constructor() {
    this.fen = null;
  }

  postMessage(perintah) {
    setTimeout(() => this.eksekusi(String(perintah)), String(perintah).startsWith("go") ? 100 : 0);
  }

  eksekusi(perintah) {
    const kirim = (baris) => this.onmessage?.({ data: baris });
    if (perintah === "uci") {
      kirim("id name EngineUji 1");
      kirim("uciok");
      return;
    }
    if (perintah === "isready") {
      kirim("readyok");
      return;
    }
    if (perintah.startsWith("position fen ")) {
      this.fen = perintah.slice("position fen ".length).trim();
      return;
    }
    if (perintah.startsWith("go")) {
      let langkah;
      try {
        const catur = new Chess(this.fen ?? undefined);
        langkah = catur.moves({ verbose: true })[0] ?? null;
      } catch {
        langkah = null;
      }
      const uci = langkah ? `${langkah.from}${langkah.to}${langkah.promotion ?? ""}` : "e2e4";
      const skor = this.fen?.includes(" b ") ? -120 : 90;
      kirim(`info depth 13 score cp ${skor} nodes 24000 nps 4800 time 10 pv ${uci}`);
      kirim(`bestmove ${uci}`);
    }
  }

  addEventListener() {}
  removeEventListener() {}
  terminate() {}
}

function siapkanGlobal(window) {
  class AudioContextPalsu {
    constructor() {
      this.destination = {};
      this.state = "running";
    }

    currentTime() {
      return 0;
    }

    createBuffer() {
      return { getChannelData: () => new Float32Array(8) };
    }

    createBufferSource() {
      return { connect: () => {}, start: () => {}, stop: () => {}, buffer: null, playbackRate: { value: 1 } };
    }

    resume() {
      return Promise.resolve();
    }
  }

  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.AudioContext = AudioContextPalsu;
  window.webkitAudioContext = AudioContextPalsu;
  window.Worker = WorkerPalsu;
  window.matchMedia = window.matchMedia ?? ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.requestAnimationFrame = window.requestAnimationFrame ?? ((callback) => setTimeout(() => callback(Date.now()), 0));
  window.cancelAnimationFrame = window.cancelAnimationFrame ?? ((id) => clearTimeout(id));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.HTMLElement.prototype.scrollTo = function scrollTo() {};
  window.Element.prototype.scrollTo = function scrollTo() {};
  window.innerWidth = 1440;
  window.innerHeight = 900;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  // Di peramban `sessionStorage` juga global; kode aplikasi memakainya tanpa
  // prefiks `window` (lihat src/lib/titipanAnalisa.js).
  globalThis.sessionStorage = window.sessionStorage;
  // Node >= 21 sudah punya `navigator` global, Node 20 belum. react-dom
  // membacanya saat modulnya dimuat, jadi tanpa baris ini uji ini lulus di
  // mesin pengembang (Node 22+) tapi mati di CI Node 20 dengan
  // "ReferenceError: navigator is not defined". Pakai milik jsdom.
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.AudioContext = AudioContextPalsu;
  globalThis.Worker = WorkerPalsu;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  // Radix Presence (dipakai Tabs di panel Akun) memanggil getComputedStyle
  // sebagai global saat memasang ref, bukan lewat window.
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  for (const nama of ["HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent"]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
}

/* sajikan berkas /public dari disk (buku pembukaan & data analisis sungguhan) */
function pasangFetch(window) {
  window.fetch = (url) => {
    const relatif = String(url).replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
    try {
      const isi = readFileSync(path.join(ROOT, "public", relatif), "utf8");
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(isi),
        json: () => Promise.resolve(JSON.parse(isi)),
      });
    } catch (e) {
      return Promise.reject(new Error(`berkas tidak tersedia di uji: ${relatif} (${dom ? "" : ""}${e.message})`));
    }
  };
}

/* ------------------------------------------------------------------- jalankan */

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/program-kami/analisa/papan",
  pretendToBeVisual: true,
});
siapkanGlobal(dom.window);
pasangFetch(dom.window);

const pesanGalat = [];
const consoleErrorAsli = console.error;
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

const modul = require(berkasBundel);
modul.mount(dom.window.document.getElementById("root"));

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));
await tunggu(900);

/**
 * Tunggu sampai `pemeriksa` terpenuhi (atau habis batas). Mengganti jeda
 * tetap yang flaky: di mesin lambat rantai fetch pemilih belum tuntas dalam
 * waktu tetap, di mesin cepat/CI menunggu lebih lama dari perlu. Pemeriksa
 * dievaluasi tiap 60ms sampai benar (maks 8s) sebelum lanjut; hasilnya
 * boolean: benar bila kondisi tercapai, salah bila waktu habis.
 */
const tungguSampai = (pemeriksa, batasMs = 8000, selangMs = 60) =>
  new Promise((selesai) => {
    const mulai = Date.now();
    const cek = () => {
      if (pemeriksa()) selesai(true);
      else if (Date.now() - mulai >= batasMs) selesai(false);
      else setTimeout(cek, selangMs);
    };
    cek();
  });

function teksBagus() {
  return dom.window.document.body.textContent.replace(/\s+/g, " ");
}

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi) {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}`);
  }
}

/* --- batas impor dan allowlist URL --- */
{
  const { BATAS_IMPOR, ambilPgn, susunPgnDariTcn, uraikanTautanPartai, validasiFen, validasiPgn } = modul;
  const tangkapKode = (aksi) => {
    try {
      aksi();
      return null;
    } catch (e) {
      return e?.code ?? null;
    }
  };
  const lichess = uraikanTautanPartai("https://lichess.org/abcdefgh/white");
  const chesscom = uraikanTautanPartai("https://www.chess.com/game/live/12345678");
  uji("URL resmi Lichess dikenali dan hanya mengekstrak ID game", lichess.platform === "lichess" && lichess.id === "abcdefgh");
  uji("URL resmi Chess.com dikenali", chesscom.platform === "chesscom" && chesscom.tipe === "live" && chesscom.id === "12345678");
  uji("URL Chess.com tanpa tipe game memakai live", uraikanTautanPartai("https://chess.com/game/123").tipe === "live");
  uji("tautan HTTP ditolak", tangkapKode(() => uraikanTautanPartai("http://lichess.org/abcdefgh")) === "tautan");
  uji("domain tiruan Lichess ditolak", tangkapKode(() => uraikanTautanPartai("https://lichess.org.attacker.example/abcdefgh")) === "tautan");
  uji("host lain dengan teks chess.com di path ditolak", tangkapKode(() => uraikanTautanPartai("https://attacker.example/chess.com/game/123")) === "tautan");
  uji("URL dengan userinfo ditolak", tangkapKode(() => uraikanTautanPartai("https://lichess.org@attacker.example/abcdefgh")) === "tautan");
  uji("URL permainan di port alternatif ditolak", tangkapKode(() => uraikanTautanPartai("https://lichess.org:8443/abcdefgh")) === "tautan");
  uji("PGN valid diterima oleh parser analisis", validasiPgn(PGN_UJI).riwayat.length === 6);
  uji("PGN rusak ditolak sebelum analisis", tangkapKode(() => validasiPgn("teks yang bukan PGN")) === "pgn");
  uji("PGN melebihi 1 MiB ditolak", tangkapKode(() => validasiPgn("x".repeat(BATAS_IMPOR.bytePGN + 1))) === "ukuran");
  const caturPanjang = new Chess();
  const sanPanjang = [];
  for (let i = 0; i < BATAS_IMPOR.ply + 1; i++) {
    const san = caturPanjang.move(["Nf3", "Nf6", "Ng1", "Ng8"][i % 4]).san;
    sanPanjang.push(i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ${san}` : san);
  }
  uji("PGN melebihi batas 500 ply ditolak sebelum analisis engine", tangkapKode(() => validasiPgn(`${sanPanjang.join(" ")} *`)) === "langkah");
  uji("FEN awal diterima",  validasiFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1").includes(" w "));
  uji("FEN rusak ditolak", tangkapKode(() => validasiFen("bukan-fen")) === "fen");
  const pgnTCN = susunPgnDariTcn({ White: "Andini", Black: "Bagas", Result: "1-0" }, "mC0K");
  uji("TCN Chess.com dikonversi menjadi langkah PGN yang sah", pgnTCN.includes("1. e4 e5") && validasiPgn(pgnTCN).riwayat.length === 2);
  uji("TCN ganjil/rusak ditolak", tangkapKode(() => susunPgnDariTcn({}, "m")) === "tcn");
  uji("TCN di atas batas ply ditolak sebelum decoding", tangkapKode(() => susunPgnDariTcn({}, "mC".repeat(BATAS_IMPOR.ply + 1))) === "langkah");
  uji("nama header yang dapat menyuntik format PGN ditolak", tangkapKode(() => susunPgnDariTcn({ "White]\\n[Result": "1-0" }, "mC")) === "respons");
  uji("baris baru pada nilai header ditolak", tangkapKode(() => susunPgnDariTcn({ White: "Andini\n[Result 0-1]" }, "mC")) === "respons");

  const fetchAsli = globalThis.fetch;
  let alamatDiminta = "";
  let opsiDiminta;
  globalThis.fetch = async (alamat, opsi) => {
    alamatDiminta = String(alamat);
    opsiDiminta = opsi;
    return {
      ok: true,
      headers: { get: () => null },
      text: async () => PGN_UJI,
    };
  };
  try {
    const hasil = await ambilPgn("https://lichess.org/abcdefgh", { signal: new AbortController().signal });
    uji("permintaan impor dibangun ke endpoint resmi Lichess", alamatDiminta === "https://lichess.org/game/export/abcdefgh");
    uji("permintaan impor meneruskan sinyal dan menolak redirect", !!opsiDiminta?.signal && opsiDiminta.redirect === "error");
    uji("PGN hasil fetch dibatasi dan dikembalikan", hasil === PGN_UJI);

    globalThis.fetch = async () => ({
      ok: true,
      headers: { get: (nama) => nama === "content-length" ? String(BATAS_IMPOR.byteRespons + 1) : null },
      text: async () => { throw new Error("body tidak boleh dibaca bila Content-Length sudah melewati batas"); },
    });
    let kodeUkuranRespons = null;
    try { await ambilPgn("https://lichess.org/abcdefgh"); } catch (e) { kodeUkuranRespons = e?.code; }
    uji("respons online yang ukurannya melewati batas ditolak sebelum dibaca", kodeUkuranRespons === "ukuran");

    let alamatChessCom = "";
    globalThis.fetch = async (alamat) => {
      alamatChessCom = String(alamat);
      return {
        ok: true,
        headers: { get: () => null },
        text: async () => JSON.stringify({ game: {
          pgnHeaders: { White: "Andini", Black: "Bagas", Result: "1-0" },
          moveList: "mC0K",
        } }),
      };
    };
    const hasilChessCom = await ambilPgn("https://www.chess.com/game/live/12345678");
    uji("Chess.com hanya diminta melalui callback resmi dan TCN lolos validasi", alamatChessCom === "https://www.chess.com/callback/live/game/12345678" && hasilChessCom.includes("1. e4 e5") && validasiPgn(hasilChessCom).riwayat.length === 2);
  } finally {
    globalThis.fetch = fetchAsli;
  }
}

const domSiap = dom.window.document;
const layarAwalAkun = await tungguSampai(
  () => domSiap.querySelector("[data-layar]")?.getAttribute("data-layar") === "akun"
);
const awal = teksBagus();

uji("kerangka halaman terpasang", !!domSiap.querySelector(".analisa-root"));
uji("layar awal adalah Akun, bukan papan", layarAwalAkun);
uji(
  "menu Akun ditandai aktif di awal",
  domSiap.querySelector('[data-uji="nav-akun"]')?.getAttribute("aria-current") === "true"
);
uji("judul terpasang di dokumen", domSiap.title.includes("Analisis") || !!domSiap.querySelector(".analisa-root"));
uji(
  "papan boleh diindeks (index, follow)",
  domSiap.querySelector('meta[name="robots"]')?.content === "index, follow"
);
uji("canonical papan memakai pathname papan", domSiap.querySelector('link[rel="canonical"]')?.href === "https://uji.test/program-kami/analisa/papan");
uji("Open Graph papan memakai gambar Analisa", domSiap.querySelector('meta[property="og:image"]')?.content.endsWith("/images/PapanAnalysa.webp"));
uji("Twitter Card papan memakai kartu gambar besar", domSiap.querySelector('meta[name="twitter:card"]')?.content === "summary_large_image");
uji("papan ter-render (svg bidak)", domSiap.querySelectorAll(".analisa-root svg").length > 20);
uji("panel awal menampilkan ajakan tanpa form lama", /Belum ada data permainan/.test(awal));
uji("nama pemain bawaan terjemahan", awal.includes("Putih") || awal.includes("Hitam"));

/* --- regresi: metadata/state pemain kosong tidak boleh merobohkan Game --- */
{
  const pemain = modul.normalisasiPemain([undefined], ["Putih", "Hitam"]);
  uji(
    "konteks melengkapi kedua pemain yang hilang",
    pemain.length === 2 && pemain[0].name === "Putih" && pemain[1].name === "Hitam"
  );
  uji(
    "label pemain mengabaikan metadata kosong",
    modul.formatPlayerLabel(undefined, "Hitam") === "Hitam" &&
      modul.formatPlayerLabel({ name: "Andini", elo: "NOELO" }, "Putih") === "Andini"
  );

  const galatSebelum = pesanGalat.length;
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  const root = modul.mountGameDenganPemainKosong(wadah);
  await tunggu(250);
  const teksPemain = wadah.textContent ?? "";
  const galatPemain = pesanGalat.slice(galatSebelum).join("\n");
  uji(
    "Game ter-render dengan pemain kosong tanpa TypeError",
    teksPemain.includes("Putih") && teksPemain.includes("Hitam") &&
      !/Cannot read properties of undefined.*name/.test(galatPemain)
  );
  root.unmount();
  wadah.remove();
}

/* --- Fase 2c: nilai suntikan harus sampai ke komponen yang pindah konteks --- */
{
  const galatSebelumPemutar = pesanGalat.length;
  const ambilMarkup = async (playing) => {
    const wadahPemutar = domSiap.createElement("div");
    domSiap.body.appendChild(wadahPemutar);
    const rootPemutar = modul.mountGameDenganPemutar(wadahPemutar, playing);
    await tunggu(250);
    const html = wadahPemutar.innerHTML;
    rootPemutar.unmount();
    wadahPemutar.remove();
    return html;
  };
  const markupMati = await ambilMarkup(false);
  const markupHidup = await ambilMarkup(true);
  uji(
    "tombol pemutar menerima `playing` dari konteks (bukan nilai bawaan)",
    markupMati.length > 0 && markupMati !== markupHidup
  );
  uji(
    "Game dengan `playing` suntikan tidak menghasilkan galat render",
    !/TypeError|ReferenceError/.test(pesanGalat.slice(galatSebelumPemutar).join("\n"))
  );
}

/* --- alur: impor PGN lewat popup Impor di bilah kiri --- */
const klik = (el) => el?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
const pengeset = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set;
const layarAktif = () => domSiap.querySelector("[data-layar]")?.getAttribute("data-layar") ?? null;
const bukaImpor = async () => {
  klik(domSiap.querySelector('[data-uji="nav-impor"]'));
  await tunggu(250);
  return layarAktif() === "impor";
};
uji("layar Impor menggantikan papan (tanpa popup)", await bukaImpor());
const kotakPgn = domSiap.querySelector('[data-uji="impor-pgn"]');
uji("area tempel PGN tersedia", !!kotakPgn);
let grafikSelamaMuat = null;
if (kotakPgn) {
  pengeset.call(kotakPgn, "x".repeat(modul.BATAS_IMPOR.bytePGN + 1));
  kotakPgn.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await tunggu(60);
  klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
  await tunggu(60);
  uji("PGN terlalu besar ditolak dengan pesan terlokalisasi", /terlalu besar/i.test(domSiap.querySelector('[data-uji="galat-impor"]')?.textContent ?? ""));
  uji("galat impor diumumkan sebagai alert", domSiap.querySelector('[data-uji="galat-impor"]')?.getAttribute("role") === "alert");

  pengeset.call(kotakPgn, "bukan PGN");
  kotakPgn.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await tunggu(40);
  klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
  await tunggu(60);
  uji("PGN rusak ditolak sebelum papan/engine berpindah", /PGN tidak valid/i.test(domSiap.querySelector('[data-uji="galat-impor"]')?.textContent ?? "") && layarAktif() === "impor");

  pengeset.call(kotakPgn, PGN_UJI);
  kotakPgn.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await tunggu(200);
  klik(domSiap.querySelector('[data-uji="kirim-impor"]'));

  // Seperti WintrChess: seluruh posisi sudah ada saat progres masih 0%; grafik
  // tetap di bawah progres (bukan di dalam kartunya) hingga Ringkasan selesai.
  const grafikSiap = await tungguSampai(() => {
    const kartu = domSiap.querySelector('[data-uji="kartu-progres-analisa"]');
    const area = domSiap.querySelector('[data-uji="grafik-analisa"]');
    grafikSelamaMuat = area?.querySelector('svg[role="img"]');
    return kartu && grafikSelamaMuat?.querySelector("path") && !kartu.contains(grafikSelamaMuat)
      && (grafikSelamaMuat.querySelector("path").getAttribute("d").match(/L /g)?.length ?? 0) === 9;
  }, 1500, 15);
  const kartu = domSiap.querySelector('[data-uji="kartu-progres-analisa"]');
  const bar = kartu?.querySelector("[role='progressbar']");
  const jurusAwal = grafikSelamaMuat?.querySelector("path")?.getAttribute("d") ?? "";
  const titikX = (d) => [...d.matchAll(/L ([\d.]+) ([\d.]+)/g)].slice(0, 7).map((m) => Number(m[1]));

  uji(
    "kartu progres tampil di atas grafik (persentase + tombol Batal)",
    grafikSiap && !!bar && kartu.textContent.includes("Batal") && kartu.textContent.includes("Kalau prosesnya terasa lama")
      && [...domSiap.querySelectorAll('button[role="tab"]')].some((b) => b.textContent.includes("Ringkasan")),
  );
  uji(
    "grafik memuat tujuh posisi sejak awal, bukan menunggu langkah kedua",
    grafikSiap && grafikSelamaMuat?.getAttribute("aria-label") === "Grafik evaluasi yang tumbuh selama analisa berjalan"
      && titikX(jurusAwal).length === 7 && !jurusAwal.includes("NaN"),
    jurusAwal.slice(0, 120),
  );

  // Tunggu sebuah nilai selesai dinilai. X tiap titik harus tetap, hanya Y
  // yang berubah, sementara bar progres belum mencapai 100%.
  const bertambah = await tungguSampai(() => {
    const d = grafikSelamaMuat?.querySelector("path")?.getAttribute("d");
    const nilai = Number(bar?.getAttribute("aria-valuenow"));
    return d && d !== jurusAwal && nilai > 0 && nilai < 100;
  }, 1500, 15);
  const jurusBerjalan = grafikSelamaMuat?.querySelector("path")?.getAttribute("d") ?? "";
  uji(
    "kurva bertambah dengan sumbu X tetap selama analisa",
    bertambah && jurusBerjalan !== jurusAwal && titikX(jurusAwal).every((x, i) => x === titikX(jurusBerjalan)[i]),
    `${jurusAwal.slice(0, 80)} -> ${jurusBerjalan.slice(0, 80)}`,
  );
  grafikSelamaMuat?.dispatchEvent(new dom.window.MouseEvent("mousemove", { bubbles: true, clientX: 200 }));
  await tunggu(20);
  uji("tooltip grafik memuat SAN selama analisa", domSiap.querySelector('[data-uji="grafik-analisa"] [role="tooltip"]')?.textContent.includes("Nf3"));
  grafikSelamaMuat?.dispatchEvent(new dom.window.MouseEvent("mouseleave", { bubbles: true }));

  await tunggu(1900);
}

const setelahKirim = teksBagus();
uji("PGN diterima (tanpa galat parse)", !setelahKirim.includes("PGN tidak terbaca"));
uji("engine siap dipakai", !setelahKirim.includes("Engine gagal dimuat"));
uji("papan pindah ke mode analisis", /Ringkasan/.test(setelahKirim) && /Langkah/.test(setelahKirim));
uji("panel langkah memakai bahasa Indonesia", /adalah langkah|Langkah|Ringkasan/.test(setelahKirim));
uji(
  "grafik yang sama berlanjut ke Ringkasan tanpa dibongkar",
  !!grafikSelamaMuat && domSiap.querySelector('[data-uji="grafik-analisa"] svg[role="button"]') === grafikSelamaMuat
    && !domSiap.querySelector('[data-uji="kartu-progres-analisa"]'),
);

/* --- tab ringkasan --- */
const tab = (pola) => [...domSiap.querySelectorAll('button[role="tab"]')].find((b) => pola.test(b.textContent ?? ""));
const tabRingkasan = tab(/Ringkasan/i);
uji("tab Ringkasan ada", !!tabRingkasan);
if (tabRingkasan) {
  tabRingkasan.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await tunggu(400);
  const ringkasan = teksBagus();
  uji("ringkasan: akurasi + fase berbahasa Indonesia", /Akurasi/.test(ringkasan) && /Pembukaan/.test(ringkasan) && /Menengah/.test(ringkasan) && !/Middlegame/.test(ringkasan));
  uji("ringkasan: perincian penilaian", /Brilian|Blunder/.test(ringkasan));
  /*
   * Kartu ekspor PGN beranotasi (mesin/pgnAnotasi.js). Yang diperiksa di sini
   * bukan isi berkasnya (itu tugas scripts/uji-pgn-anotasi.mjs), melainkan
   * bahwa kartunya benar-benar terpasang di Ringkasan dan tombolnya aman
   * diklik: `URL.createObjectURL` tidak ada di jsdom, jadi jalur gagal
   * halusnya ikut teruji — dulu cukup untuk merobohkan seluruh panel.
   */
  /*
   * Kosakata visual: label `critical` sengaja TIDAK punya ikon/warna sendiri.
   * Halaman ini memakai ikon yang sudah ada (bintang `best`) supaya terasa
   * sama dengan chess.com; kalau suatu saat ada yang menambahkan ikon baru
   * lagi, uji ini yang menahan.
   */
  uji(
    "ringkasan: tidak ada baris label 'Kritis' (critical tampil sebagai Terbaik)",
    /Terbaik/.test(ringkasan) && !/\bKritis\b/.test(ringkasan)
  );
  uji(
    "ringkasan: kartu ekspor PGN beranotasi tidak ditampilkan",
    !/Ekspor PGN beranotasi/.test(ringkasan)
  );
  const tombolEkspor = [...domSiap.querySelectorAll("button")].find((b) => /Unduh \.pgn/.test(b.textContent ?? ""));
  uji("ringkasan: tombol unduh PGN tidak ditampilkan", !tombolEkspor);
}

/* --- ikon label: `critical` = `best`, bukan ikon baru --- */
{
  const markup = (rating) => modul.markupIkon(rating);
  uji(
    "ikon `critical` identik dengan ikon `best` (tanpa ikon baru)",
    markup("critical") === markup("best") && markup("best").includes("<svg")
  );
  uji(
    "ikon lama tidak tersentuh (blunder & brilliant masih punya markup sendiri)",
    markup("blunder") !== markup("best") && markup("brilliant") !== markup("best")
  );
}

/* --- geometri grafik eval (dipakai grafik Ringkasan & grafik kartu muat) --- */
{
  const cp = (nilai) => ({ previousStaticEvals: [["cp", String(nilai)]] });
  uji(
    "grafik: eval 0 = tengah, putih unggul naik, hitam unggul turun",
    modul.tinggiEval(cp(0), 0) === 0.5
      && modul.tinggiEval(cp(400), 0) === 0.925
      && modul.tinggiEval(cp(-400), 0) === 0.075
  );
  uji(
    "grafik: eval ekstrem dijepit di dalam ruang gambar (tanpa kurva keluar bingkai)",
    modul.tinggiEval(cp(99999), 0) === 0.925 && modul.tinggiEval(cp(-99999), 0) === 0.075
  );
  uji(
    "grafik: giliran bicara (indeks ganjil = hitam jalan) membalik arah nilai",
    modul.tinggiEval(cp(100), 1) === modul.tinggiEval(cp(-100), 0)
  );
  uji(
    "grafik: skakmat menempel di tepi sesuai pihak yang unggul",
    modul.tinggiEval({ previousStaticEvals: [["mate", "3"]] }, 0) === 1
      && modul.tinggiEval({ previousStaticEvals: [["mate", "-3"]] }, 0) === 0
      && modul.tinggiEval({ color: "b", previousStaticEvals: [["mate"]] }, 0) === 1
      && modul.tinggiEval({ color: "w", previousStaticEvals: [["mate", "0"]] }, 1) === 0
  );
  uji(
    "grafik: PGN yang dimulai saat Hitam jalan memakai warna dari FEN, bukan paritas",
    modul.tinggiEval({ color: "b", previousStaticEvals: [["cp", "100"]] }, 0) === modul.tinggiEval(cp(-100), 0)
  );

  const jalur = modul.jalurGrafik([cp(0), cp(0)], 400, 96);
  uji(
    "grafik: entri eval tak lengkap tidak menghasilkan NaN di kurva",
    modul.tinggiEval({ previousStaticEvals: [["cp"]] }, 0) === 0.5
      && modul.tinggiEval({ previousStaticEvals: [["cp", "abc"]] }, 0) === 0.5
      && !modul.jalurGrafik([cp(0), { previousStaticEvals: [["cp"]] }], 400, 96).includes("NaN")
  );
  uji(
    "grafik: jalur 2 titik sah dan menutup area (tanpa NaN)",
    jalur === "M 0 48 L 0 48 L 400 48 L 400 96 L 0 96",
    jalur
  );
  uji(
    "grafik: daftar kosong/satu entri tetap menghasilkan jalur sah",
    !modul.jalurGrafik([], 400, 96).includes("NaN") && !modul.jalurGrafik([cp(0)], 400, 96).includes("NaN")
  );
  const kerangka = Array.from({ length: 7 }, (_, i) => ({ color: i % 2 ? "b" : "w" }));
  const awal = modul.jalurGrafik(kerangka, 400, 96);
  const masuk = modul.jalurGrafik(kerangka.map((posisi, i) => i < 2
    ? { ...posisi, previousStaticEvals: [["cp", String(i ? -100 : 80)]] } : posisi), 400, 96);
  const titikX = (d) => [...d.matchAll(/L ([\d.]+) ([\d.]+)/g)].slice(0, 7).map((m) => m[1]);
  uji(
    "grafik: tujuh titik sejak awal, posisi X tetap ketika dua skor masuk",
    titikX(awal).length === 7 && masuk !== awal && titikX(awal).every((x, i) => x === titikX(masuk)[i])
  );
}

/* --- kartu progres analisa (adopsi kartu progres WintrChess) --- */
{
  uji("progres: persentase satu angka di belakang koma", modul.persenProgres(42.5) === "42.5");
  uji(
    "progres: nilai di luar 0-100 atau bukan angka dijinakkan (kartu tak pernah menulis NaN%)",
    modul.persenProgres(-5) === "0.0"
      && modul.persenProgres(180) === "100.0"
      && modul.persenProgres(undefined) === "0.0"
      && modul.persenProgres("bukan angka") === "0.0"
  );

  const markup = modul.markupBar(42.5);
  uji(
    "progres: bar punya peran aksesibilitas yang benar",
    markup.includes('role="progressbar"')
      && markup.includes('aria-valuemin="0"')
      && markup.includes('aria-valuemax="100"')
      && markup.includes('aria-valuenow="43"')
  );
  uji("progres: lebar isian mengikuti persentase", markup.includes("width:42.5%"));
  uji(
    "progres: bar berisi & tidak pernah melebihi jalurnya",
    modul.markupBar(250).includes("width:100%") && modul.markupBar(-1).includes("width:0%")
  );
}

const tabLangkah = tab(/Langkah/);
if (tabLangkah) {
  tabLangkah.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await tunggu(400);
  const langkah = teksBagus();
  uji("komentar keseluruhan partai menyebut kedua pemain", langkah.includes("Andini") && langkah.includes("Bagas"));
  uji("daftar langkah memuat SAN", /e4/.test(langkah) && /Nf3|Bb5/.test(langkah));
  uji("saran engine tampil", /langkah terbaik/.test(langkah));
}

/* --- regresi: layar Akun/Basis Data/Impor harus tetap bisa dibuka SETELAH
 * partai dimuat. `layarAkun.jsx` dulu memantau `data` dan langsung memanggil
 * onTutup() saat komponen dipasang; karena `data.format` masih "pgn" sesudah
 * pengguna menganalisis partai, layar Akun memantul balik ke papan dan
 * mustahil dibuka. Dulu tertutupi karena membuka menu Akun selalu
 * mengosongkan `data` lebih dulu — itu sudah tidak dilakukan lagi.
 */
{
  const bukti = () => /Ringkasan/.test(teksBagus()) && /Andini/.test(teksBagus());
  uji("prasyarat: partai PGN sedang dianalisis saat layar dibuka", bukti());

  for (const [tombol, layar] of [
    ["nav-akun", "akun"],
    ["nav-deteksi-engine", "deteksi-engine"],
    ["nav-database", "database"],
    ["nav-impor", "impor"],
  ]) {
    klik(domSiap.querySelector(`[data-uji="${tombol}"]`));
    await tunggu(280);
    uji(`layar ${layar} tetap terbuka walau partai PGN sudah dimuat`, layarAktif() === layar);
  }

  klik(domSiap.querySelector('[data-uji="nav-play"]'));
  await tunggu(250);
  uji(
    "kembali ke papan setelah membuka keempat layar, analisis utuh",
    !domSiap.querySelector("[data-layar]") && bukti()
  );
}

/* --- regresi: tombol "Bermain" tidak boleh membuang analisis ---
 * Tombol Bermain di bilah kiri dimaksudkan sebagai jalan keluar cepat dari
 * popup (Database/Impor/Akun) kembali ke papan. Versi pertamanya memanggil
 * reset penuh (data, akun, pageState), sehingga menekannya sesudah mereview
 * partai membuang seluruh hasil analisis. Di sini: buka popup Database saat
 * analisis aktif, tekan Bermain, lalu pastikan popup tertutup DAN analisisnya
 * masih ada.
 */
{
  const sebelum = teksBagus();
  const bukti = (teks) =>
    /Ringkasan/.test(teks) && /Andini/.test(teks) && !/Belum ada data permainan/.test(teks);
  uji("prasyarat: partai PGN sedang dianalisis", bukti(sebelum));

  klik(domSiap.querySelector('[data-uji="nav-database"]'));
  await tunggu(300);
  uji("layar Basis Data menggantikan papan", !!domSiap.querySelector('[data-layar="database"]'));
  uji(
    "papan disembunyikan (invisible), bukan dibongkar",
    /invisible/.test(domSiap.querySelector("main")?.className ?? "") &&
      !!domSiap.querySelector("main [data-uji], main svg")
  );

  klik(domSiap.querySelector('[data-uji="nav-play"]'));
  await tunggu(350);
  const sesudah = teksBagus();

  uji("tombol Bermain mengembalikan papan", !domSiap.querySelector("[data-layar]"));
  uji("tombol Bermain mempertahankan analisis yang sedang direview", bukti(sesudah));
  uji("papan tetap utuh setelah tombol Bermain", !!domSiap.querySelector(".analisa-root"));

  // Sudah berada di papan: Bermain tidak boleh diam-diam mereset analisis.
  klik(domSiap.querySelector('[data-uji="nav-play"]'));
  await tunggu(300);
  const lagi = teksBagus();
  uji("Bermain di layar papan tidak mereset analisis", bukti(lagi));

  /*
   * Regresi inti: papan tidak boleh dianalisis ulang setiap kali pengguna
   * bolak-balik layar. Dulu kalau papan ikut dibongkar, useEffect([data])
   * di game.jsx menjalankan handlePGN() lagi dari nol — buang waktu CPU
   * dan buang panah yang sudah digambar.
   */
  const teksSebelum = teksBagus();
  for (const tombol of ["nav-database", "nav-play", "nav-impor", "nav-play", "nav-deteksi-engine", "nav-play"]) {
    klik(domSiap.querySelector(`[data-uji="${tombol}"]`));
    await tunggu(220);
  }
  const teksSesudah = teksBagus();
  uji(
    "bolak-balik layar tidak memicu analisis ulang",
    /Andini/.test(teksSesudah) && /Bagas/.test(teksSesudah) && /Ringkasan/.test(teksSesudah)
  );
  uji(
    "bolak-balik layar tidak mengubah hasil analisis",
    (teksSesudah.match(/Brilian|Blunder/g) || []).length ===
      (teksSebelum.match(/Brilian|Blunder/g) || []).length
  );
}

/* --- tombol "Baru" tidak lagi ada di daftar menu bilah navigasi --- */
{
  uji("nav Baru tidak ada di daftar menu", !domSiap.querySelector('[data-uji="nav-baru"]'));
}

/* --- alur kedua: analisis posisi FEN lewat popup Impor --- */
{
  uji("layar Impor terbuka (untuk FEN)", await bukaImpor());
  const kartuFen = [...domSiap.querySelectorAll("button")].find((b) => (b.textContent ?? "").trim() === "FEN");
  uji("kartu FEN tersedia di layar Impor", !!kartuFen);
  if (kartuFen) {
    klik(kartuFen);
    await tunggu(150);
    const kotakFen = domSiap.querySelector('[data-uji="impor-fen"]');
    uji("isi FEN tersedia", !!kotakFen);
    if (kotakFen) {
      pengeset.call(kotakFen, "bukan-FEN");
      kotakFen.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      await tunggu(60);
      klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
      await tunggu(60);
      uji("FEN rusak ditolak dan pengguna tetap di layar Impor", /FEN tidak valid/i.test(domSiap.querySelector('[data-uji="galat-impor"]')?.textContent ?? "") && layarAktif() === "impor");

      pengeset.call(kotakFen, "8/8/8/4k3/8/4K3/5P2/8 w - - 0 1");
      kotakFen.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      await tunggu(150);
      klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
      await tunggu(1800);
      const fen = teksBagus();
      uji("FEN diterima (tanpa galat parse)", !fen.includes("FEN tidak terbaca"));
      uji("mode analisis posisi aktif", /Langkah|Ringkasan/.test(fen));
    }
  }
}

const tabLangkah2 = tab(/Langkah/);
if (tabLangkah2) tabLangkah2.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
await tunggu(200);
for (let i = 0; i < 3; i++) {
  dom.window.document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  await tunggu(60);
}
uji("navigasi papan ketik tidak merobohkan halaman", !!domSiap.querySelector(".analisa-root"));

/* --- regresi: pemilih partai Chess.com/Lichess pernah crash ---
 * Komponen pemilih merender t("analisa.partai.judul", { platform }) padahal
 * variabel `platform` tidak pernah dideklarasikan (yang ada konstanta
 * PLATFORM). Begitu daftar bulan tampil, ReferenceError menjatuhkan seluruh
 * halaman. Di sini kedua pemilih dirender dengan API platform di-stub agar
 * daftar bulannya benar-benar sampai ke tahap render.
 */
{
  const galatSebelum = pesanGalat.length;

  // Komponen memanggil fetch global (bukan window.fetch), jadi keduanya
  // harus di-stub agar deterministik tanpa jaringan.
  const fetchAsli = globalThis.fetch;
  const fetchPalsu = (url) => {
    const u = String(url);
    if (u.includes("api.chess.com")) {
      if (u.includes("/games/archives")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ archives: ["https://api.chess.com/pub/player/contoh/games/2026/01"] }),
          text: () => Promise.resolve(""),
        });
      }
      // Satu arsip bulan berisi dua partai: cukup untuk menguji render baris
      // tabel agregat (nama pemain, tanggal, jumlah langkah) tanpa jaringan.
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          games: [
            {
              pgn: PGN_UJI,
              time_class: "blitz",
              end_time: 1767225600,
              white: { username: "contoh", rating: 1420, result: "win" },
              black: { username: "lawanuji", rating: 1380, result: "checkmated" },
            },
            {
              pgn: PGN_UJI,
              time_class: "rapid",
              end_time: 1767312000,
              white: { username: "putihuji", rating: 1500, result: "win" },
              black: { username: "contoh", rating: 1420, result: "checkmated" },
            },
          ],
        }),
        text: () => Promise.resolve(""),
      });
    }
    if (u.includes("lichess.org")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ createdAt: Date.UTC(2026, 0, 1) }),
        text: () => Promise.resolve(""),
      });
    }
    return fetchAsli(url);
  };
  dom.window.fetch = fetchPalsu;
  globalThis.fetch = fetchPalsu;

  const teksPemilih = {};
  for (const platform of ["chessCom", "lichessOrg"]) {
    const wadah = domSiap.createElement("div");
    domSiap.body.appendChild(wadah);
    modul.mountPemilih(wadah, platform);
    const teks = () => (wadah.textContent ?? "").replace(/\s+/g, " ");
    // Tunggu pemuatan selesai (bukan jeda tetap 500ms) — baris tabel agregat
    // Chess.com baru tampil setelah dua permintaan API, daftar bulan Lichess
    // setelah dua permintaan `createdAt`. Bila tidak kunjung selesai, uji di
    // bawah tetap menandai kegagalan dengan teks yang sesungguhnya.
    const selesaiMemuat = platform === "chessCom"
      ? () => teks().includes("lawanuji") && teks().includes("putihuji") && teks().includes("contoh")
      : () => /\b2026\b/.test(teks());
    if (!(await tungguSampai(selesaiMemuat))) {
      console.log(`DEBUG pemuat belum selesai ${platform}:`, JSON.stringify(teks()).slice(0, 400));
    }
    teksPemilih[platform] = teks();
  }
  dom.window.fetch = fetchAsli;
  globalThis.fetch = fetchAsli;
  uji(
    "tabel agregat Chess.com memuat baris partai dari arsip bulan",
    teksPemilih.chessCom?.includes("lawanuji") &&
      teksPemilih.chessCom?.includes("putihuji") &&
      teksPemilih.chessCom?.includes("contoh") &&
      !/Tidak ada permainan/.test(teksPemilih.chessCom ?? "")
  );
  uji(
    "pemilih Lichess tetap memuat daftar bulan",
    /2026/.test(teksPemilih.lichessOrg ?? "")
  );

  const galatBaru = pesanGalat.slice(galatSebelum).join("\n");
  uji(
    "pemilih partai Chess.com/Lichess ter-render tanpa ReferenceError",
    !/platform is not defined|ReferenceError/.test(galatBaru)
  );
}

/* --- permintaan Lichess dibatalkan saat pemilih ditutup --- */
{
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  const fetchSebelum = globalThis.fetch;
  let signalLichess;
  let jumlahTutup = 0;
  const fetchLichessTertahan = (url, opsi = {}) => {
    if (String(url).includes("lichess.org/api/games/user/contoh?sort=dateAsc")) {
      signalLichess = opsi.signal;
      return new Promise((_, tolak) => {
        signalLichess?.addEventListener("abort", () => tolak(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }
    return fetchSebelum(url, opsi);
  };
  dom.window.fetch = fetchLichessTertahan;
  globalThis.fetch = fetchLichessTertahan;
  const root = modul.mountPemilih(wadah, "lichessOrg", () => { jumlahTutup++; });
  await tungguSampai(() => !!signalLichess);
  root.unmount();
  await tunggu(0);
  dom.window.fetch = fetchSebelum;
  globalThis.fetch = fetchSebelum;
  uji(
    "menutup pemilih Lichess membatalkan fetch dan tidak memicu galat basi",
    !!signalLichess?.aborted && jumlahTutup === 0,
  );

  const wadahPartai = domSiap.createElement("div");
  domSiap.body.appendChild(wadahPartai);
  let signalArsip;
  const fetchArsipTertahan = (url, opsi = {}) => {
    const alamat = String(url);
    if (alamat.includes("sort=dateAsc") || alamat.includes("sort=dateDesc")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ createdAt: Date.UTC(2026, 0, 1) }) });
    }
    if (alamat.includes("lichess.org/api/games/user/contoh?since=")) {
      signalArsip = opsi.signal;
      return new Promise((_, tolak) => {
        signalArsip?.addEventListener("abort", () => tolak(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }
    return fetchSebelum(url, opsi);
  };
  dom.window.fetch = fetchArsipTertahan;
  globalThis.fetch = fetchArsipTertahan;
  const rootPartai = modul.mountPemilih(wadahPartai, "lichessOrg", () => { jumlahTutup++; });
  await tungguSampai(() => [...wadahPartai.querySelectorAll("button")].some((tombol) => tombol.textContent.includes("2026")));
  [...wadahPartai.querySelectorAll("button")].find((tombol) => tombol.textContent.includes("2026"))?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await tungguSampai(() => !!signalArsip);
  rootPartai.unmount();
  await tunggu(0);
  dom.window.fetch = fetchSebelum;
  globalThis.fetch = fetchSebelum;
  uji(
    "menutup pemilih Lichess membatalkan fetch daftar partai yang sedang dipilih",
    !!signalArsip?.aborted && jumlahTutup === 0,
  );
}

/* --- layar Akun, Deteksi engine, Database & Impor menggantikan area kerja --- */
{
  const klik = (el) => el?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const navAkun = domSiap.querySelector('[data-uji="nav-akun"]');
  const navDeteksi = domSiap.querySelector('[data-uji="nav-deteksi-engine"]');
  const navDatabase = domSiap.querySelector('[data-uji="nav-database"]');
  const navImpor = domSiap.querySelector('[data-uji="nav-impor"]');
  uji("bilah kiri punya tombol Akun, Deteksi engine, Database, & Impor", !!navAkun && !!navDeteksi && !!navDatabase && !!navImpor);

  klik(navAkun);
  await tunggu(250);
  uji("layar Akun tampil, bukan popup", !!domSiap.querySelector('[data-layar="akun"]'));
  uji("tidak ada lagi modal di halaman", !domSiap.querySelector('[data-uji="popup"]'));

  // Formulir tambah akun kini SEJAJAR di dalam layar Akun. Belum ada akun
  // tersimpan, jadi yang tampil dulu tombol ajakan di keadaan kosong.
  klik(domSiap.querySelector('[data-uji="tambah-akun-kosong"]'));
  await tunggu(200);
  uji(
    "formulir tambah akun tampil sejajar (dua kartu situs + isian nama)",
    domSiap.querySelectorAll('[data-uji="kartu-situs"]').length === 2 &&
      !!domSiap.querySelector('[data-uji="nama-akun"]') &&
      !domSiap.querySelector('[data-uji="popup"]')
  );

  klik(domSiap.querySelector('[data-uji="nav-play"]'));
  await tunggu(200);
  uji("layar Akun digantikan papan", !domSiap.querySelector("[data-layar]"));

  klik(navDeteksi);
  await tunggu(250);
  uji("menu baru membuka layar Deteksi engine", !!domSiap.querySelector('[data-layar="deteksi-engine"]'));
  uji("sidebar menandai Deteksi engine aktif", navDeteksi.getAttribute("aria-current") === "true");
  uji("layar deteksi memakai delapan kontrol pengaturan", domSiap.querySelectorAll('[data-layar="deteksi-engine"] select, [data-layar="deteksi-engine"] input').length === 8);
  klik(domSiap.querySelector('[data-uji="nav-play"]'));
  await tunggu(200);
  uji("layar Deteksi engine digantikan papan", !domSiap.querySelector("[data-layar]"));

  klik(navDatabase);
  await tunggu(250);
  uji("layar Basis Data tampil, bukan popup", !!domSiap.querySelector('[data-layar="database"]'));
  const teksDb = teksBagus();
  uji("layar Basis Data menampilkan judul & kolom pencarian", /Basis Data|Database/.test(teksDb));
  klik(domSiap.querySelector('[data-uji="nav-play"]'));
  await tunggu(200);
  uji("layar Basis Data digantikan papan", !domSiap.querySelector("[data-layar]"));

  klik(navImpor);
  await tunggu(250);
  // Jangan mengandalkan textContent tombol untuk memilih tipe: bahasa dapat
  // berubah dan ikon/branding Online bisa menambah teks anak. Kontrak UI yang
  // stabil adalah tiga toggle button dengan aria-pressed.
  const kartuTipe = [...domSiap.querySelectorAll('button[aria-pressed]')];
  uji("layar Impor memuat PGN/Online/FEN", kartuTipe.length >= 3);
  const kartuOnline = kartuTipe[1];
  klik(kartuOnline);
  await tunggu(150);
  const kotakOnline = domSiap.querySelector('[data-uji="impor-online"]');
  uji("isian tautan Online tersedia", !!kotakOnline);

  if (kotakOnline) {
    // Stub ekspor Lichess; URL tidak resmi harus ditolak sebelum fetch dipanggil.
    const fetchAsli2 = globalThis.fetch;
    let jumlahFetch = 0;
    globalThis.fetch = (url, opts) => {
      const u = String(url);
      if (u === "https://lichess.org/game/export/abcdefgh") {
        jumlahFetch++;
        return Promise.resolve({ ok: true, status: 200, headers: { get: () => null }, text: () => Promise.resolve(PGN_UJI) });
      }
      return fetchAsli2(url, opts);
    };
    const pengesetInput = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
    pengesetInput.call(kotakOnline, "https://lichess.org.attacker.example/abcdefgh");
    kotakOnline.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await tunggu(80);
    klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
    await tunggu(80);
    uji("tautan domain tiruan ditolak sebelum permintaan jaringan", jumlahFetch === 0 && /tautan HTTPS/i.test(domSiap.querySelector('[data-uji="galat-impor"]')?.textContent ?? ""));

    pengesetInput.call(kotakOnline, "https://lichess.org/abcdefgh");
    kotakOnline.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await tunggu(120);
    klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
    await tunggu(2000);
    globalThis.fetch = fetchAsli2;
    const setelahImpor = teksBagus();
    uji(
      "impor Online (Lichess) langsung menganalisis partai",
      jumlahFetch === 1 &&
      /Ringkasan/.test(setelahImpor) &&
      /Andini/.test(setelahImpor) &&
      // impor sukses = papan langsung mengambil alih area kerja
      !domSiap.querySelector("[data-layar]")
    );
  }
}

/* --- permintaan online dapat dibatalkan saat layar Impor ditutup --- */
{
  await bukaImpor();
  klik([...domSiap.querySelectorAll('button[aria-pressed]')][1]);
  await tunggu(80);
  const input = domSiap.querySelector('[data-uji="impor-online"]');
  const inputSetter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  let signalPermintaan = null;
  const fetchAsli = globalThis.fetch;
  globalThis.fetch = (_url, opsi) => new Promise((_resolve, reject) => {
    signalPermintaan = opsi.signal;
    signalPermintaan.addEventListener("abort", () => reject(new DOMException("AbortError", "AbortError")), { once: true });
  });
  inputSetter.call(input, "https://lichess.org/abcdefgh");
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await tunggu(50);
  klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
  await tunggu(50);
  const batal = [...domSiap.querySelectorAll('[data-layar="impor"] button')].find((b) => b.textContent.trim() === "Batal");
  klik(batal);
  await tunggu(100);
  uji("menutup layar Impor membatalkan fetch aktif", !!signalPermintaan?.aborted && !domSiap.querySelector('[data-layar="impor"]'));
  globalThis.fetch = fetchAsli;
}

/* --- timeout fetch ditampilkan sebagai galat yang dapat dipulihkan --- */
{
  await bukaImpor();
  klik([...domSiap.querySelectorAll('button[aria-pressed]')][1]);
  await tunggu(80);
  const input = domSiap.querySelector('[data-uji="impor-online"]');
  const inputSetter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  const fetchAsli = globalThis.fetch;
  const setTimeoutAsli = dom.window.setTimeout.bind(dom.window);
  globalThis.fetch = (_url, opsi) => new Promise((_resolve, reject) => {
    opsi.signal.addEventListener("abort", () => reject(new DOMException("AbortError", "AbortError")), { once: true });
  });
  dom.window.setTimeout = (callback, delay, ...args) =>
    delay === modul.BATAS_IMPOR.waktuMs
      ? setTimeoutAsli(callback, 0, ...args)
      : setTimeoutAsli(callback, delay, ...args);
  inputSetter.call(input, "https://lichess.org/abcdefgh");
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await tunggu(50);
  klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
  const timeoutTampil = await tungguSampai(
    () => /melewati batas waktu/i.test(domSiap.querySelector('[data-uji="galat-impor"]')?.textContent ?? ""),
    1000,
    10,
  );
  uji("timeout fetch menghentikan permintaan dan menampilkan galat khusus", timeoutTampil && layarAktif() === "impor");
  dom.window.setTimeout = setTimeoutAsli;
  globalThis.fetch = fetchAsli;
  klik([...domSiap.querySelectorAll('[data-layar="impor"] button')].find((b) => b.textContent.trim() === "Batal"));
  await tunggu(80);
}

/* --- membatalkan evaluasi menghapus grafik dan mencegah hasil tertunda --- */
{
  klik(domSiap.querySelector('[data-uji="nav-impor"]'));
  await tunggu(150);
  klik(domSiap.querySelectorAll('button[aria-pressed]')[0]); // PGN
  await tunggu(60);
  const kotak = domSiap.querySelector('[data-uji="impor-pgn"]');
  if (kotak) {
    pengeset.call(kotak, PGN_UJI);
    kotak.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await tunggu(100);
    klik(domSiap.querySelector('[data-uji="kirim-impor"]'));
    const berjalan = await tungguSampai(() =>
      !!domSiap.querySelector('[data-uji="grafik-analisa"] svg[role="img"]')
      && !!domSiap.querySelector('[data-uji="kartu-progres-analisa"] button'), 1000, 10);
    const tombolBatal = [...domSiap.querySelectorAll('[data-uji="kartu-progres-analisa"] button')]
      .find((b) => b.textContent === "Batal");
    klik(tombolBatal);
    const bersih = await tungguSampai(() =>
      !domSiap.querySelector('[data-uji="grafik-analisa"]')
      && !domSiap.querySelector('[data-uji="kartu-progres-analisa"]'), 1000, 10);
    uji("Batal menutup grafik dan progres selama engine aktif", berjalan && !!tombolBatal && bersih);
    await tunggu(1100);
    uji("hasil dari evaluasi yang dibatalkan tidak tampil lagi", !domSiap.querySelector('[data-uji="grafik-analisa"]'));
  } else {
    uji("isian PGN tersedia untuk uji pembatalan", false);
  }
}

/* --- uji fungsi unit basis data (IndexedDB/fallback) --- */
{
  const { basisData } = modul;
  if (basisData) {
    const pgnPemain = '[Event "Kelas Catur"]\n[White "PemainA"]\n[Black "PemainB"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0';
    const hasilSimpan = await basisData.simpanBanyakPartai([
      {
        pgn: pgnPemain,
        whiteName: "PemainA",
        blackName: "PemainB",
        whiteElo: 1500,
        blackElo: 1450,
        result: "white",
        timestamp: 1725500000000,
        timeClass: "blitz",
      },
    ], { platform: "chessCom", username: "pemaina" });

    uji("basisData: simpanBanyakPartai berhasil", hasilSimpan?.tersimpan > 0);

    const hasilAmbil = await basisData.ambilDaftarPartai({ platform: "chessCom", username: "pemaina" });
    uji("basisData: ambilDaftarPartai mengembalikan partai tersimpan", hasilAmbil?.partai?.length > 0 && hasilAmbil.partai[0].whiteName === "PemainA");

    const st = await basisData.hitungStatistikBasisData();
    uji("basisData: hitungStatistikBasisData akurat", st?.totalPartai >= 1);

    const pgnTeks = await basisData.eksporPgnKoleksi({ platform: "chessCom", username: "pemaina" });
    uji("basisData: eksporPgnKoleksi memuat PGN lengkap", pgnTeks.includes("PemainA") && pgnTeks.includes("1. e4"));

    /* --- Wawasan → Pembukaan Teratas: tab Semua/Putih/Hitam, tanpa batas 5, semua partai akun, ber-scrollbar --- */
    const daftarPartaiWawasan = [];
    for (let i = 0; i < 60; i++) {
      const sebagaiPutih = i % 2 === 0;
      const urutanWarna = Math.floor(i / 2); // 0..29 untuk Putih maupun Hitam
      const indeksPembukaan = urutanWarna < 26 ? (urutanWarna % 6) : 6 + (urutanWarna % 2); // indeks 6 & 7 hanya di partai ke-53..60 (>50)
      const namaPembukaan = indeksPembukaan === 0
        ? "Scandinavian Defense"
        : (sebagaiPutih ? `Pembukaan Putih ${indeksPembukaan}` : `Pembukaan Hitam ${indeksPembukaan}`);
      const kodeEco = indeksPembukaan === 0
        ? "B01"
        : (sebagaiPutih ? `C0${indeksPembukaan}` : `B0${indeksPembukaan}`);
      // Partai ke-2 sengaja tanpa [Opening] untuk menguji fallback [ECOUrl].
      // ECOUrl menunjuk nama pembukaan yang sama dengan partai lain berkode C01,
      // sehingga fixture tetap punya 8 pembukaan unik per warna, bukan 9 label
      // akibat metadata tidak lengkap yang sebenarnya merujuk pembukaan sama.
      const tagOpening = i === 2
        ? '[ECOUrl "https://www.chess.com/openings/Pembukaan-Putih-1"]\n'
        : `[Opening "${namaPembukaan}"]\n`;
      daftarPartaiWawasan.push({
        pgn: `[Event "Uji Wawasan ${i}"]\n[White "${sebagaiPutih ? "AkunWawasan" : "Lawan"}"]\n[Black "${sebagaiPutih ? "Lawan" : "AkunWawasan"}"]\n[Result "1-0"]\n[ECO "${kodeEco}"]\n${tagOpening}\n1. e4 e5 2. Nf3 Nc6 ${i + 3}. Bc4 Bc5 1-0`,
        whiteName: sebagaiPutih ? "AkunWawasan" : "Lawan",
        blackName: sebagaiPutih ? "Lawan" : "AkunWawasan",
        whiteElo: 1600,
        blackElo: 1580,
        result: "white",
        timestamp: 1730000000000 - i * 60_000,
        timeClass: "rapid",
      });
    }
    await basisData.simpanBanyakPartai(daftarPartaiWawasan, {
      platform: "chessCom",
      username: "akunwawasan",
    });

    const wadahWawasan = domSiap.createElement("div");
    domSiap.body.appendChild(wadahWawasan);
    const movesTooltipWawasan = [
      { color: "w" },
      {
        color: "b",
        san: "e4",
        previousStaticEvals: [["cp", "-100"], ["cp", "0"]],
        kandidat: [{ peringkat: 1, wdl: [600, 300, 100] }],
      },
      {
        color: "w",
        san: "e5",
        previousStaticEvals: [["cp", "20"], ["cp", "100"]],
        kandidat: [{ peringkat: 1, wdl: [100, 800, 100] }],
      },
    ];
    const rootWawasan = modul.mountWawasan(wadahWawasan, "chessCom", "AkunWawasan", movesTooltipWawasan);
    await tungguSampai(
      () =>
        !!wadahWawasan.querySelector('[data-uji="wawasan-pembukaan"]')
        && !!wadahWawasan.querySelector('[data-uji="dashboard-akun-overview"]')
        && !!wadahWawasan.querySelector('[data-uji="wawasan-akurasi-partai"]'),
      2000,
    );

    const kartuAkurasiPartai = wadahWawasan.querySelector('[data-uji="wawasan-akurasi-partai"]');
    const titikAkurasi = kartuAkurasiPartai?.querySelector('circle[tabindex="0"]');
    titikAkurasi?.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true }));
    await tunggu(0);
    uji(
      "wawasan grafik CP menampilkan tooltip langkah/evaluasi saat diarahkan",
      /1\. e4/.test(kartuAkurasiPartai?.querySelector('[role="tooltip"]')?.textContent ?? "")
        && /Keunggulan: \+1\.00/.test(kartuAkurasiPartai?.querySelector('[role="tooltip"]')?.textContent ?? ""),
    );

    const svgAkurasi = kartuAkurasiPartai?.querySelector("svg");
    if (svgAkurasi) {
      svgAkurasi.getBoundingClientRect = () => ({ left: 0, top: 0, width: 720, height: 190, right: 720, bottom: 190 });
      const sentuh = new dom.window.MouseEvent("pointerdown", { bubbles: true, clientX: 712, clientY: 95 });
      Object.defineProperty(sentuh, "pointerType", { value: "touch" });
      svgAkurasi.dispatchEvent(sentuh);
      await tunggu(0);
    }
    uji(
      "wawasan grafik memilih langkah terdekat dengan pointer sentuh",
      /1\.\.\. e5/.test(kartuAkurasiPartai?.querySelector('[role="tooltip"]')?.textContent ?? ""),
    );

    const wadahWawasanEn = domSiap.createElement("div");
    domSiap.body.appendChild(wadahWawasanEn);
    modul.mountWawasan(wadahWawasanEn, "chessCom", "AkunWawasan", movesTooltipWawasan, "en");
    await tungguSampai(() => {
      const kartuEn = wadahWawasanEn.querySelector('[data-uji="wawasan-akurasi-partai"]');
      return /Accuracy/.test(kartuEn?.querySelector("h3")?.textContent ?? "");
    }, 3000);
    const kartuAkurasiEn = wadahWawasanEn.querySelector('[data-uji="wawasan-akurasi-partai"]');
    kartuAkurasiEn?.querySelector('circle[tabindex="0"]')?.dispatchEvent(new dom.window.MouseEvent("mouseover", { bubbles: true }));
    await tunggu(0);
    uji(
      "wawasan kartu akurasi dan tooltip mengikuti bahasa Inggris",
      /Accuracy/.test(kartuAkurasiEn?.querySelector("h3")?.textContent ?? "")
        && /Evaluation type/.test(kartuAkurasiEn?.querySelector('[role="group"]')?.getAttribute("aria-label") ?? "")
        && /Advantage: \+1\.00/.test(kartuAkurasiEn?.querySelector('[role="tooltip"]')?.textContent ?? "")
        && /White advantage/.test(kartuAkurasiEn?.textContent ?? ""),
    );
    localStorage.setItem("kci-bahasa", "id");

    const barisAkun = wadahWawasan.querySelector('[data-uji="wawasan-baris-akun"]');
    const profilWawasan = wadahWawasan.querySelector('[data-uji="wawasan-profil"]');
    uji(
      "wawasan profil menampilkan rating Classical yang tersedia dari API",
      !!profilWawasan && /Classical/.test(profilWawasan.textContent ?? ""),
    );

    const kartuAkun = wadahWawasan.querySelector('[data-uji="dashboard-akun"]');
    const tabAkunRingkasan = wadahWawasan.querySelector('[data-uji="dashboard-akun-tab-overview"]');
    const tabAkunPeringkat = wadahWawasan.querySelector('[data-uji="dashboard-akun-tab-ratings"]');
    const tabAkunPembukaan = wadahWawasan.querySelector('[data-uji="dashboard-akun-tab-openings"]');

    uji(
      "wawasan baris atas: pemilih Situs berada satu baris dengan Pilih akun",
      !!barisAkun
        && !!barisAkun.querySelector('[data-uji="wawasan-situs"]')
        && !!barisAkun.querySelector('[data-uji="wawasan-akun"]'),
    );
    uji(
      "wawasan kartu akun: menampilkan kartu Ringkasan & Peringkat tanpa judul nama akun maupun kontrol Situs/Waktu sendiri",
      !!kartuAkun
        && !!tabAkunRingkasan
        && !!tabAkunPeringkat
        && !tabAkunPembukaan
        && kartuAkun.querySelectorAll("select").length === 0
        && !/AkunWawasan/.test(kartuAkun.textContent ?? "")
        && /60 partai/.test(wadahWawasan.textContent ?? ""),
    );

    if (tabAkunPeringkat) {
      tabAkunPeringkat.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      await tunggu(50);
      uji(
        "wawasan kartu akun: tab Peringkat menampilkan grafik riwayat dan batas Terendah/Tertinggi tanpa tombol rentang ganda",
        !!wadahWawasan.querySelector('[data-uji="dashboard-akun-ratings"]')
          && kartuAkun.querySelectorAll("button").length === 2
          && /Terendah/.test(wadahWawasan.querySelector('[data-uji="dashboard-akun-ratings"]')?.textContent ?? "")
          && /Tertinggi/.test(wadahWawasan.querySelector('[data-uji="dashboard-akun-ratings"]')?.textContent ?? ""),
      );
    }

    const tabSemua = wadahWawasan.querySelector('[data-uji="wawasan-pembukaan-tab-all"]');
    const tabPutih = wadahWawasan.querySelector('[data-uji="wawasan-pembukaan-tab-white"]');
    const tabHitam = wadahWawasan.querySelector('[data-uji="wawasan-pembukaan-tab-black"]');
    const kotakDaftar = wadahWawasan.querySelector('[data-uji="wawasan-pembukaan-daftar"]');

    uji(
      "wawasan pembukaan: menampilkan tab Semua, Putih, dan Hitam dengan Semua aktif bawaan",
      !!tabSemua
        && !!tabPutih
        && !!tabHitam
        && tabSemua.getAttribute("aria-selected") === "true",
    );
    uji(
      "wawasan pembukaan: tab Semua menampilkan tampilan Pembukaan Akun 2 kolom (Putih & Hitam) untuk seluruh partai akun (8 + 8 = 16 baris)",
      !!wadahWawasan.querySelector('[data-uji="pembukaan-akun-grid"]')
        && wadahWawasan.querySelectorAll('[data-uji="pembukaan-akun-kolom-putih"] [data-uji="pembukaan-akun-baris"]').length === 8
        && wadahWawasan.querySelectorAll('[data-uji="pembukaan-akun-kolom-hitam"] [data-uji="pembukaan-akun-baris"]').length === 8
        && /Pembukaan Putih 1/.test(wadahWawasan.querySelector('[data-uji="pembukaan-akun-grid"]')?.textContent ?? ""),
    );
    const kontainerGulirPembukaan = kotakDaftar?.querySelector(".overflow-y-auto");

    uji(
      "wawasan pembukaan: kontainer daftar dibatasi tingginya dan memiliki scrollbar vertikal",
      !!kotakDaftar
        && (
          // Tampilan Semua memakai daftar dua kolom dengan area gulir internal.
          (!!kontainerGulirPembukaan
            && kontainerGulirPembukaan.className.includes("max-h-[34rem]")
            && kontainerGulirPembukaan.className.includes("overflow-y-auto"))
          // Tampilan satu warna mempertahankan tabel dengan area gulir sendiri.
          || (kotakDaftar.className.includes("max-h-[34rem]")
            && kotakDaftar.className.includes("overflow-y-auto"))
        ),
    );

    if (tabPutih) {
      tabPutih.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      await tunggu(50);
      uji(
        "wawasan pembukaan: tab Putih menampilkan semua 8 pembukaan Putih tanpa dipotong 5",
        tabPutih.getAttribute("aria-selected") === "true"
          && wadahWawasan.querySelectorAll('[data-uji="wawasan-pembukaan"] tbody tr').length === 8
          && /Pembukaan Putih 1/.test(wadahWawasan.querySelector('[data-uji="wawasan-pembukaan-daftar"]')?.textContent ?? ""),
      );
    }

    if (tabHitam) {
      tabHitam.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      await tunggu(50);
      uji(
        "wawasan pembukaan: tab Hitam menampilkan semua 8 pembukaan Hitam tanpa dipotong 5",
        tabHitam.getAttribute("aria-selected") === "true"
          && wadahWawasan.querySelectorAll('[data-uji="wawasan-pembukaan"] tbody tr').length === 8,
      );
    }

    rootWawasan.unmount();
    wadahWawasan.remove();
  }
}

const fatal = pesanGalat.filter((p) => /ReferenceError|TypeError|is not a function|not defined|Minified React error/.test(p) && !/jaringan|tidak tersedia di uji/.test(p));
/* ------------------------- P2: kerangka papan selama partai belum siap */

/**
 * Papan analisa merender grid 8 kolom dengan lebar petak eksplisit. Dipakai
 * sebagai penanda "papan posisi benar-benar tampil" — kerangka tidak pernah
 * memakai grid ini.
 */
const papanTampil = (wadah) =>
  [...wadah.querySelectorAll("div")].some((d) =>
    /repeat\(8,/.test(d.style?.gridTemplateColumns || "")
  );

{
  // (a) Gerbang `pageState`: `loading` → kerangka, papan tidak dirender.
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  const root = modul.mountGameDenganPageState(wadah, "loading");
  await tunggu(250);
  uji(
    "[P2] pageState=loading menampilkan kerangka papan",
    !!wadah.querySelector("[data-kerangka-papan]")
  );
  uji("[P2] pageState=loading tidak merender papan posisi awal", !papanTampil(wadah));
  root.unmount();
  wadah.remove();

  // (b) Kontrol: keadaan normal tetap menampilkan papan (tanpa regresi).
  const wadahNormal = domSiap.createElement("div");
  domSiap.body.appendChild(wadahNormal);
  const rootNormal = modul.mountGameDenganPageState(wadahNormal, "default");
  await tunggu(250);
  uji(
    "[P2] pageState=default tetap menampilkan papan",
    papanTampil(wadahNormal) && !wadahNormal.querySelector("[data-kerangka-papan]")
  );
  rootNormal.unmount();
  wadahNormal.remove();
}

{
  // (c) Alur sungguhan: PGN titipan dengan FEN khusus (posisi soal). Papan
  // harus SUDAH tampil selama dianalisis — kotak kosong selama puluhan detik
  // adalah keluhan yang memicu perubahan ini — dan yang digambar harus posisi
  // soal, bukan posisi awal standar.
  const FEN_SOAL = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
  const PGN_SOAL = `[Event "Soal"]\n[White "Andini"]\n[Black "Bagas"]\n[Result "*"]\n[FEN "${FEN_SOAL}"]\n[SetUp "1"]\n\n1. Kd2 Kd7 *`;
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  dom.window.sessionStorage.setItem("kci-analisa-impor-awal", PGN_SOAL);
  const galatSebelum = pesanGalat.length;
  const root = modul.mount(wadah);
  const rekam = { papanMuat: false, fenMuat: new Set(), posisiStandar: false, papanSiap: false };
  const mulai = Date.now();
  while (Date.now() - mulai < 12000) {
    const papan = papanTampil(wadah);
    const siap = /Andini/.test(wadah.textContent || "");
    const fen = wadah.querySelector("[data-papan-fen]")?.getAttribute("data-papan-fen") ?? null;
    if (papan && !siap) {
      rekam.papanMuat = true;
      if (fen) rekam.fenMuat.add(fen);
      if (fen && fen.startsWith("rnbqkbnr/pppppppp")) rekam.posisiStandar = true;
    }
    if (papan && siap) {
      rekam.papanSiap = true;
      break;
    }
    await tunggu(15);
  }
  uji("[P2] papan tampil selama partai titipan dianalisis", rekam.papanMuat);
  uji(
    "[P2] yang digambar selama memuat adalah posisi soal, bukan papan kosong",
    rekam.fenMuat.has(FEN_SOAL)
  );
  uji("[P2] posisi awal standar tidak dipakai untuk soal ber-FEN", !rekam.posisiStandar);
  uji("[P2] posisi partai titipan akhirnya tampil", rekam.papanSiap);
  uji("[P2] kerangka hilang setelah partai siap", !wadah.querySelector("[data-kerangka-papan]"));
  uji(
    "[P2] tidak ada galat render selama impor titipan",
    pesanGalat.slice(galatSebelum).length === 0
  );
  root.unmount();
  wadah.remove();
}


/* ------------------------- lencana gelar FIDE (kartu profil Wawasan) ------ */

/*
 * Lencana diuji dua kali: di sini pada kartu profil sungguhan (gelar datang
 * dari API chess.com), lalu di bawah pada markup komponennya sendiri untuk
 * mengunci bentuk SVG-nya.
 */
{
  const fetchSebelum = globalThis.fetch;
  const fetchPemain = async (alamat) => {
    const u = String(alamat);
    const berjudul = u.includes("berjudul");
    if (!u.includes("api.chess.com")) return fetchSebelum(alamat);
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: () => Promise.resolve(""),
      json: () => (u.includes("/stats")
        ? Promise.resolve({})
        : Promise.resolve({
            name: berjudul ? "Masruri Rahman" : "Tanpa Gelar",
            title: berjudul ? "IM" : null,
            country: "https://api.chess.com/country/ID",
            joined: 1500000000,
          })),
    };
  };
  dom.window.fetch = fetchPemain;
  globalThis.fetch = fetchPemain;

  const wadahBerjudul = domSiap.createElement("div");
  domSiap.body.appendChild(wadahBerjudul);
  const akarBerjudul = modul.mountKartuProfil(wadahBerjudul, "chessCom", "berjudul");
  await tungguSampai(() => !!wadahBerjudul.querySelector('[data-uji="lencana-gelar"]'), 4000);

  const lencana = wadahBerjudul.querySelector('[data-uji="lencana-gelar"]');
  uji(
    "kartu profil Wawasan: gelar dari API (IM) dirender sebagai lencana SVG, bukan teks berbingkai",
    lencana?.tagName?.toLowerCase() === "svg"
      && lencana.getAttribute("data-gelar") === "IM"
      && lencana.getAttribute("aria-label") === "IM"
      && /Masruri Rahman/.test(wadahBerjudul.textContent ?? "")
      && lencana.querySelector("rect")?.getAttribute("fill") === "#A62424",
    `markup: ${wadahBerjudul.innerHTML.slice(0, 200)}`
  );
  uji(
    "kartu profil Wawasan: teks lencana lama (span berbingkai) sudah tidak ada",
    !/<span[^>]*border[^>]*>\s*IM\s*<\/span>/.test(wadahBerjudul.innerHTML)
  );
  akarBerjudul.unmount();

  const wadahTanpa = domSiap.createElement("div");
  domSiap.body.appendChild(wadahTanpa);
  const akarTanpa = modul.mountKartuProfil(wadahTanpa, "chessCom", "tanagelar");
  await tungguSampai(() => /Tanpa Gelar/.test(wadahTanpa.textContent ?? ""), 4000);
  uji(
    "kartu profil Wawasan: pemain tanpa gelar tidak punya lencana apa pun",
    wadahTanpa.querySelector('[data-uji="lencana-gelar"]') === null
  );
  akarTanpa.unmount();

  dom.window.fetch = fetchSebelum;
  globalThis.fetch = fetchSebelum;
}

{
  const gm = modul.markupLencanaGelar("GM");
  const im = modul.markupLencanaGelar("im");
  const wgm = modul.markupLencanaGelar("WGM");
  const afm = modul.markupLencanaGelar("AFM");

  uji(
    "lencana gelar: SVG kotak #A62424 dengan huruf putih tebal",
    /<svg[^>]*viewBox="0 0 400 250"/.test(gm)
      && /<rect[^>]*rx="50"[^>]*fill="#A62424"/.test(gm)
      && /fill="#FFFFFF"/.test(gm)
      && /font-weight="bold"/.test(gm),
    `markup: ${gm.slice(0, 120)}`
  );

  /*
   * Huruf digeser turun 0.37em, bukan ditengahkan lewat
   * `dominant-baseline="middle"`: itu menengahkan kotak em sehingga huruf
   * duduk ~5% tinggi lencana terlalu tinggi (terukur dari piksel tinta).
   */
  uji(
    "lencana gelar: huruf digeser 0.37em agar tinta tepat di tengah kotak",
    /dy="0.37em"/.test(gm)
      && /y="125"/.test(gm)
      && !/dominant-baseline/.test(gm)
  );

  uji(
    "lencana gelar: hurufnya adalah gelar itu sendiri, kapital, dan jadi nama aksesibel",
    />GM</.test(gm)
      && /aria-label="GM"/.test(gm)
      && /aria-label="IM"/.test(im)
      && />IM</.test(im)
  );

  uji(
    "lencana gelar: huruf diperkecil menurut panjang gelar (GM 140, WGM 112, cadangan 4 huruf 92)",
    /font-size="140"/.test(gm)
      && /font-size="112"/.test(wgm)
      && /font-size="112"/.test(afm)
      && /font-size="92"/.test(modul.markupLencanaGelar("ABCD"))
      && />WGM</.test(wgm)
  );

  uji(
    "lencana gelar: tanpa gelar tidak merender apa pun",
    modul.markupLencanaGelar("") === "" && modul.markupLencanaGelar(null) === ""
  );

  const barisNama = modul.markupBarisNama("IM", "Masruri Rahman");
  const barisKosong = modul.markupBarisNama(null, "Tanpa Gelar");
  uji(
    "baris nama di atas papan: gelar juga berupa lencana SVG, bukan <em> teks",
    /<svg[^>]*data-uji="lencana-gelar"[^>]*data-gelar="IM"/.test(barisNama)
      && !/<em[^>]*>IM<\/em>/.test(barisNama)
      && /Masruri Rahman/.test(barisNama),
    `markup: ${barisNama.slice(0, 160)}`
  );
  uji(
    "baris nama di atas papan: tinggi lencana mengikuti ukuran huruf baris (em) dan tanpa gelar tidak ada lencana",
    /class="mr-1 h-\[1\.1em\] w-auto shrink-0 align-\[-0\.2em\]"/.test(barisNama)
      && !/lencana-gelar/.test(barisKosong)
      && /Tanpa Gelar/.test(barisKosong)
  );
}

/* --------------------- pemilih rentang tanggal (panel Akun) -------------- */

/* Hitungan murni dulu: preset dan grid bulan, semuanya di UTC. */
{
  const r = (preset, hariIni) => JSON.stringify(modul.rentangPreset(preset, hariIni));
  uji(
    "rentang preset: semua preset dihitung inklusif di UTC",
    r("hariIni", "2026-11-08") === JSON.stringify({ dari: "2026-11-08", sampai: "2026-11-08" })
      && r("kemarin", "2026-11-08") === JSON.stringify({ dari: "2026-11-07", sampai: "2026-11-07" })
      && r("7hari", "2026-11-08") === JSON.stringify({ dari: "2026-11-02", sampai: "2026-11-08" })
      && r("30hari", "2026-11-08") === JSON.stringify({ dari: "2026-10-10", sampai: "2026-11-08" })
      && r("bulanIni", "2026-11-08") === JSON.stringify({ dari: "2026-11-01", sampai: "2026-11-08" })
      && r("bulanLalu", "2026-11-08") === JSON.stringify({ dari: "2026-10-01", sampai: "2026-10-31" })
      && r("tahunIni", "2026-11-08") === JSON.stringify({ dari: "2026-01-01", sampai: "2026-11-08" })
      && r("tahunLalu", "2026-11-08") === JSON.stringify({ dari: "2025-01-01", sampai: "2025-12-31" })
      && r("semua") === JSON.stringify({ dari: "", sampai: "" }),
  );

  uji(
    "rentang preset: bulan lalu di Januari mundur ke Desember tahun sebelumnya",
    r("bulanLalu", "2026-01-15") === JSON.stringify({ dari: "2025-12-01", sampai: "2025-12-31" })
      && r("tahunLalu", "2026-01-15") === JSON.stringify({ dari: "2025-01-01", sampai: "2025-12-31" })
      && r("bulanIni", "2026-01-01") === JSON.stringify({ dari: "2026-01-01", sampai: "2026-01-01" }),
  );

  const gridId = modul.susunGridBulan(2026, 10, 1); // November 2026, minggu mulai Senin
  const gridEn = modul.susunGridBulan(2026, 10, 0); // minggu mulai Minggu
  uji(
    "grid bulan: 42 sel, awal minggu mengikuti bahasa, hari luar ditandai",
    gridId.length === 42
      && gridId[0].kunci === "2026-10-26"
      && gridId[0].luar === true
      && gridId[6].kunci === "2026-11-01"
      && gridId[6].luar === false
      && gridId[41].kunci === "2026-12-06"
      && gridEn[0].kunci === "2026-11-01",
  );

  uji(
    "geser bulan: mundur dari Januari ke Desember tahun lalu, maju dari Desember ke Januari",
    JSON.stringify(modul.geserBulan(2026, 0, -1)) === JSON.stringify({ tahun: 2025, bulan: 11 })
      && JSON.stringify(modul.geserBulan(2026, 11, 1)) === JSON.stringify({ tahun: 2027, bulan: 0 })
      && modul.tambahHari("2026-03-01", -1) === "2026-02-28"
      && modul.tambahHari("2024-02-28", 1) === "2024-02-29",
  );
}

/* Terpasang di jsdom: preset, kalender, pin ujung rentang, dan keyboard. */
{
  const HARI_INI = new Date().toISOString().slice(0, 10);
  const kemarin = modul.tambahHari(HARI_INI, -1);

  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  const akar = modul.mountPemilihRentang(wadah, "30hari");
  await tungguSampai(() => !!wadah.querySelector('[data-uji="pemilih-rentang"]'), 4000);

  const tombolPreset = [...wadah.querySelectorAll('[data-uji^="preset-"]')];
  uji(
    "pemilih rentang: sembilan preset berlabel Indonesia dan preset aktif ditandai",
    tombolPreset.length === modul.PRESET_RENTANG.length
      && tombolPreset[0].textContent.trim() === "Hari ini"
      && tombolPreset[2].textContent.trim() === "7 hari terakhir"
      && tombolPreset[8].textContent.trim() === "Semua arsip"
      && wadah.querySelector('[data-uji="preset-30hari"]')?.getAttribute("aria-pressed") === "true"
      && wadah.querySelector('[data-uji="preset-hariIni"]')?.getAttribute("aria-pressed") === "false",
    `preset: ${tombolPreset.map((b) => b.textContent.trim()).join(" | ")}`
  );

  uji(
    "pemilih rentang: hari setelah hari ini tak bisa dipilih, hari ini bisa",
    [...wadah.querySelectorAll("button[data-tanggal]")]
      .filter((b) => b.dataset.tanggal > HARI_INI)
      .every((b) => b.disabled)
      && wadah.querySelector(`button[data-tanggal="${HARI_INI}"]`)?.disabled === false,
  );

  wadah.querySelector('[data-uji="preset-kemarin"]').click();
  await tunggu(0);
  const nilaiKemarin = JSON.parse(wadah.querySelector('[data-uji="nilai-rentang"]').textContent);
  uji(
    "pemilih rentang: preset Kemarin mengisi kedua ujung rentang",
    nilaiKemarin.preset === "kemarin" && nilaiKemarin.dari === kemarin && nilaiKemarin.sampai === kemarin,
  );
  uji(
    "pemilih rentang: rentang sehari ditandai sebagai ujung tunggal, tanpa pin",
    wadah.querySelector(`[data-tanggal="${kemarin}"]`)?.getAttribute("data-posisi") === "tunggal"
      && !/after:w-3/.test(wadah.querySelector(`[data-tanggal="${kemarin}"]`)?.className ?? ""),
  );

  /* Mundur sebulan: seluruh bulan itu sudah lewat, jadi aman dipakai uji. */
  wadah.querySelector('[data-uji="bulan-mundur"]').click();
  await tunggu(0);
  const mundur = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1));
  const th = mundur.getUTCFullYear();
  const bl = String(mundur.getUTCMonth() + 1).padStart(2, "0");
  const kunciHariKe = (hari) => `${th}-${bl}-${String(hari).padStart(2, "0")}`;

  uji(
    "pemilih rentang: tombol bulan mengganti bulan yang ditampilkan",
    new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" })
      .format(mundur) === wadah.querySelector('[data-uji="nama-bulan"]')?.textContent?.trim(),
    `judul: ${wadah.querySelector('[data-uji="nama-bulan"]')?.textContent}`,
  );

  wadah.querySelector(`button[data-tanggal="${kunciHariKe(5)}"]`).click();
  await tunggu(0);
  wadah.querySelector(`button[data-tanggal="${kunciHariKe(7)}"]`).click();
  await tunggu(0);
  const nilaiRentang = JSON.parse(wadah.querySelector('[data-uji="nilai-rentang"]').textContent);
  const selAwal = wadah.querySelector(`[data-tanggal="${kunciHariKe(5)}"]`);
  const selTengah = wadah.querySelector(`[data-tanggal="${kunciHariKe(6)}"]`);
  const selAkhir = wadah.querySelector(`[data-tanggal="${kunciHariKe(7)}"]`);

  uji(
    "pemilih rentang: dua klik pada kalender membentuk rentang kustom",
    nilaiRentang.preset === "kustom"
      && nilaiRentang.dari === kunciHariKe(5)
      && nilaiRentang.sampai === kunciHariKe(7),
  );
  uji(
    "pemilih rentang: ujung rentang ditandai pin (awal ke kanan, akhir ke kiri) dan hari di antaranya ikut diarsir",
    selAwal?.getAttribute("data-posisi") === "awal"
      && selTengah?.getAttribute("data-posisi") === "tengah"
      && selAkhir?.getAttribute("data-posisi") === "akhir"
      && /after:right-0/.test(selAwal?.className ?? "")
      && /after:w-3/.test(selAwal?.className ?? "")
      && /after:left-0/.test(selAkhir?.className ?? "")
      && /bg-backgroundBoxBoxHighlighted\/25/.test(selTengah?.className ?? ""),
    `awal: ${selAwal?.className} | akhir: ${selAkhir?.className}`,
  );

  /* Klik lagi setelah rentang lengkap → rentang baru, bukan diperpanjang. */
  wadah.querySelector(`button[data-tanggal="${kunciHariKe(9)}"]`).click();
  await tungguSampai(() => domSiap.activeElement?.dataset?.tanggal === kunciHariKe(9), 2000);
  const nilaiBaru = JSON.parse(wadah.querySelector('[data-uji="nilai-rentang"]').textContent);
  uji(
    "pemilih rentang: klik berikutnya memulai rentang baru, bukan memperpanjang",
    nilaiBaru.dari === kunciHariKe(9) && nilaiBaru.sampai === "",
  );

  const tombolHari = wadah.querySelector(`button[data-tanggal="${kunciHariKe(15)}"]`);
  tombolHari.focus();
  tombolHari.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  await tungguSampai(() => domSiap.activeElement?.dataset?.tanggal === kunciHariKe(14), 2000);
  uji(
    "pemilih rentang: panah kiri memindahkan fokus ke hari sebelumnya",
    domSiap.activeElement?.dataset?.tanggal === kunciHariKe(14),
    `fokus: ${domSiap.activeElement?.dataset?.tanggal}`,
  );
  domSiap.activeElement?.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  await tunggu(0);
  const nilaiKeyboard = JSON.parse(wadah.querySelector('[data-uji="nilai-rentang"]').textContent);
  uji(
    "pemilih rentang: Enter pada hari yang difokus melengkapi rentang yang sudah punya awal",
    nilaiKeyboard.dari === kunciHariKe(9) && nilaiKeyboard.sampai === kunciHariKe(14),
    JSON.stringify(nilaiKeyboard),
  );

  wadah.querySelector('[data-uji="preset-semua"]').click();
  await tunggu(0);
  const nilaiSemua = JSON.parse(wadah.querySelector('[data-uji="nilai-rentang"]').textContent);
  uji(
    "pemilih rentang: Semua arsip mengosongkan rentang dan tak menyisakan tanda ujung",
    nilaiSemua.preset === "semua"
      && nilaiSemua.dari === ""
      && nilaiSemua.sampai === ""
      && wadah.querySelectorAll('[data-posisi]:not([data-posisi=""])').length === 0
      && /Semua arsip/.test(wadah.querySelector('[data-uji="ringkasan-rentang"]')?.textContent ?? ""),
  );

  akar.unmount();
  wadah.remove();

  /* Label dan awal minggu mengikuti bahasa. */
  localStorage.setItem("kci-bahasa", "en");
  const wadahEn = domSiap.createElement("div");
  domSiap.body.appendChild(wadahEn);
  const akarEn = modul.mountPemilihRentang(wadahEn, "7hari");
  await tungguSampai(
    () => /Last 7 days/.test(wadahEn.textContent ?? ""),
    4000,
  );
  const judulHari = [...wadahEn.querySelectorAll('[role="columnheader"]')].map((k) => k.textContent.trim());
  uji(
    "pemilih rentang: bahasa Inggris memakai label Inggris dan minggu mulai Minggu",
    wadahEn.querySelector('[data-uji="preset-7hari"]')?.textContent?.trim() === "Last 7 days"
      && wadahEn.querySelector('[data-uji="preset-semua"]')?.textContent?.trim() === "All available"
      && judulHari.length === 7
      && judulHari[0] === "Sun",
    `judul: ${judulHari.join(",")}`,
  );
  akarEn.unmount();
  wadahEn.remove();
  localStorage.setItem("kci-bahasa", "id");
}

uji("tidak ada galat render", fatal.length === 0);
if (fatal.length) console.log(fatal.slice(0, 3).map((p) => `    ! ${p.split("\n")[0]}`).join("\n"));

console.error = consoleErrorAsli;

dom.window.close();
console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
if (gagal) {
  writeFileSync(path.join(tmpdir(), "kci-uji-analisa-ui.html"), domSiap.documentElement?.innerHTML ?? "");
  process.exit(1);
}
process.exit(0);
