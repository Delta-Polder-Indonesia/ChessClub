/**
 * Uji kerangka layar penuh untuk halaman alat interaktif.
 *
 * `PageLayout` menyembunyikan Header/Footer untuk halaman yang harus tampil
 * penuh (`TANPA_KERANGKA`). Halaman Teka-teki MENULIS ULANG URL-nya menjadi
 * `/teka-teki/<problemid>` begitu soal pertama dimuat — jadi pemeriksaan
 * kerangka harus tahan terhadap segmen path tambahan, bukan hanya mencocokkan
 * path persis. Bug yang dijaga uji ini: menyematkan Header + Footer situs di
 * sekeliling papan teka-teki yang seharusnya penuh layar (dan juga pada
 * tautan dalam `/teka-teki/<id>` yang dibagikan pengguna).
 *
 * Jalankan: node scripts/uji-kerangka-layar-penuh.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

let lulus = 0;
let gagal = 0;
let galatRender = [];

function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

/** Rute alat yang WAJIB tampil penuh (tanpa Header/Footer situs). */
const RUTE_PENUH = [
  "/teka-teki",
  "/teka-teki/1",
  "/teka-teki/2500",
  "/teka-teki-rush",
  "/quiz-catur",
  "/papan-interaktif",
  "/program-kami/analisa/papan",
];

/** Rute biasa yang WAJIB tetap memakai kerangka (Header + Footer). */
const RUTE_KERANGKA = ["/", "/program-kami", "/program-kami/teka-teki", "/bantuan"];

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import App from "./src/App.jsx";

export function mount(el, jalur) {
  return createRoot(el).render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[jalur]}>
        <I18nProvider><App /></I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-kerangka-penuh.cjs");
const { build } = require("esbuild");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-kerangka-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "text" },
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

const { JSDOM } = require("jsdom");

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function siapkanGlobal(window) {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.requestAnimationFrame =
    window.requestAnimationFrame ?? ((cb) => setTimeout(() => cb(Date.now()), 0));
  window.cancelAnimationFrame = window.cancelAnimationFrame ?? ((id) => clearTimeout(id));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.Element.prototype.scrollTo = function scrollTo() {};
  window.HTMLMediaElement.prototype.play = function play() {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
  window.getComputedStyle =
    window.getComputedStyle || (() => ({ overflowY: "auto", overflowX: "auto", paddingTop: "0px" }));
  window.innerWidth = 1440;
  window.innerHeight = 900;
  window.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  for (const nama of ["HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent"]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
  globalThis.fetch = window.fetch;
  globalThis.getComputedStyle = window.getComputedStyle;
}

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function periksa(jalur, harapPenuh) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: `https://uji.test${jalur}`,
    pretendToBeVisual: true,
  });
  siapkanGlobal(dom.window);
  const consoleErrorAsli = console.error;
  console.error = (...args) => {
    galatRender.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
  };

  dom.window.HTMLCanvasElement.prototype.getContext = () => null;

  const berkas = new Map();
  for (const modul of ["react", "react-dom", "react-dom/client", "react-router-dom", "react/jsx-runtime"]) {
    berkas.set(modul, require.resolve(modul));
  }
  // Bundel memanggil React dari sandbox require ini.
  delete require.cache[berkasBundel];
  const { mount } = require(berkasBundel);
  mount(dom.window.document.getElementById("root"), jalur);
  await tunggu(400);
  console.error = consoleErrorAsli;

  const adaHeader = !!dom.window.document.querySelector("header");
  const adaFooter = !!dom.window.document.querySelector("footer");
  return { adaHeader, adaFooter, judul: dom.window.document.title };
}

console.log("\nRute alat interaktif harus tampil PENUH (tanpa Header/Footer)");
for (const jalur of RUTE_PENUH) {
  const { adaHeader, adaFooter } = await periksa(jalur, true);
  uji(
    `${jalur}: tanpa header & footer`,
    !adaHeader && !adaFooter,
    [adaHeader ? "header muncul" : "", adaFooter ? "footer muncul" : ""].filter(Boolean).join(", ")
  );
}

console.log("\nRute biasa harus tetap memakai kerangka situs");
for (const jalur of RUTE_KERANGKA) {
  const { adaHeader, adaFooter } = await periksa(jalur, false);
  uji(
    `${jalur}: header & footer ada`,
    adaHeader && adaFooter,
    [adaHeader ? "" : "header hilang", adaFooter ? "" : "footer hilang"].filter(Boolean).join(", ")
  );
}

const galatBersih = galatRender.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatBersih.length === 0);
if (galatBersih.length) console.log(galatBersih.slice(0, 4).join("\n"));

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
