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
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-analisa-ui.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  console.log("lewati uji UI Analisa — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");
const { Chess } = require("chess.js");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import Analisa from "./src/halaman/Analisa/Analisa.jsx";

export function mount(el) {
  return createRoot(el).render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/program-kami/analisa"]}>
        <I18nProvider>
          <Analisa />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
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
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
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
 * dan `bestmove` dari langkah legal pertama posisi saat ini. Angka skornya
 * acak kecil supaya penilaian langkah (best/mistake/…) ikut terlatih.
 */
class WorkerPalsu {
  constructor() {
    this.fen = null;
  }

  postMessage(perintah) {
    setTimeout(() => this.eksekusi(String(perintah)), 0);
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
      let langkah = null;
      try {
        const catur = new Chess(this.fen ?? undefined);
        langkah = catur.moves({ verbose: true })[0] ?? null;
      } catch {
        langkah = null;
      }
      const uci = langkah ? `${langkah.from}${langkah.to}${langkah.promotion ?? ""}` : "e2e4";
      const skor = Math.floor(Math.random() * 480) - 240;
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
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.HTMLElement.prototype.scrollTo = function scrollTo() {};
  window.Element.prototype.scrollTo = function scrollTo() {};
  window.innerWidth = 1440;
  window.innerHeight = 900;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.AudioContext = AudioContextPalsu;
  globalThis.Worker = WorkerPalsu;
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
  url: "https://uji.test/program-kami/analisa",
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

const domSiap = dom.window.document;
const awal = teksBagus();

uji("kerangka halaman terpasang", !!domSiap.querySelector(".analisa-root"));
uji("judul & tagline terjemahan", awal.includes("Analisis Partai") && awal.includes("Stockfish"));
uji("janji privasi tampil", awal.includes("tidak dikirim ke server"));
uji("papan ter-render (svg bidak)", domSiap.querySelectorAll(".analisa-root svg").length > 20);
uji("formulir analisis tersedia", !!domSiap.querySelector("textarea"));
uji("nama pemain bawaan terjemahan", awal.includes("Putih") || awal.includes("Hitam"));

/* --- alur: tempel PGN lalu kirim --- */
const kotak = domSiap.querySelector("textarea");
const pengeset = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value").set;
pengeset.call(kotak, PGN_UJI);
kotak.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
await tunggu(300);

const formulir = kotak.closest("form");
formulir.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
await tunggu(1600);

const setelahKirim = teksBagus();
uji("PGN diterima (tanpa galat parse)", !setelahKirim.includes("PGN tidak terbaca"));
uji("engine siap dipakai", !setelahKirim.includes("Engine gagal dimuat"));
uji("papan pindah ke mode analisis", /Ringkasan/.test(setelahKirim) && /Langkah/.test(setelahKirim));
uji("panel langkah memakai bahasa Indonesia", /adalah langkah|Langkah|Ringkasan/.test(setelahKirim));

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

/* --- alur kedua: analisis posisi FEN --- */
const tabBaru = [...domSiap.querySelectorAll('button[role="tab"]')].find((b) => /Analisis/.test(b.textContent ?? ""));
uji("tab analisis baru ada", !!tabBaru);
if (tabBaru) tabBaru.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
await tunggu(200);
const pemilihFormat = [...domSiap.querySelectorAll("button")].find((b) => /Chess\.com|Lichess\.org|PGN|FEN/i.test(b.textContent ?? ""));
uji("tombol pilihan format ada", !!pemilihFormat);
if (pemilihFormat) {
  pemilihFormat.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  await tunggu(120);
  const opsiFen = [...domSiap.querySelectorAll("button")].find((b) => /^FEN/i.test((b.textContent ?? "").trim()));
  uji("opsi FEN tersedia", !!opsiFen);
  if (opsiFen) {
    opsiFen.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await tunggu(120);
    const kotakFen = domSiap.querySelector("textarea");
    pengeset.call(kotakFen, "8/8/8/4k3/8/4K3/5P2/8 w - - 0 1");
    kotakFen.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    await tunggu(200);
    kotakFen.closest("form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
    await tunggu(1400);
    const fen = teksBagus();
    uji("FEN diterima (tanpa galat parse)", !fen.includes("FEN tidak terbaca"));
    uji("mode analisis posisi aktif", /Langkah|Ringkasan/.test(fen));
  }
}

/* --- navigasi papan lewat papan ketik --- */
const tabLangkah2 = tab(/Langkah/);
if (tabLangkah2) tabLangkah2.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
await tunggu(200);
for (let i = 0; i < 3; i++) {
  dom.window.document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  await tunggu(60);
}
uji("navigasi papan ketik tidak merobohkan halaman", !!domSiap.querySelector(".analisa-root"));

const fatal = pesanGalat.filter((p) => /ReferenceError|TypeError|is not a function|not defined|Minified React error/.test(p) && !/jaringan|tidak tersedia di uji/.test(p));
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
