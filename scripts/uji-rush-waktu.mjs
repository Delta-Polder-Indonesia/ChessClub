/**
 * Uji penghitung waktu Teka-Teki Rush (regresi BEBAS_WAKTU).
 *
 * Mengapa perlu: `BEBAS_WAKTU` sempat dinyalakan saat modif markup dan lupa
 * dimatikan — penghitung 3/5 menit berhenti berjalan dan sesi tidak pernah
 * berakhir karena waktu. Uji ini mengunci perilaku yang benar dari sisi
 * pengguna, mengikuti PuzzleDash asli (github.com/sggts04/PuzzleDash):
 *   1. setelah "Mulai Rush", tampilan waktu berjalan turun (03:00 → 02:59 …);
 *   2. sisa ≤ 30 detik → timer berubah merah + bunyi peringatan sekali
 *      (di aslinya: timer merah + LowTime.mp3);
 *   3. saat waktu habis, sesi berakhir dan layar hasil menampilkan
 *      "Waktu habis" (pemain "di-kick" dari papan, sesuai desain).
 *
 * Penghitung komponen berbasis tenggat absolut (Date.now), jadi uji
 * mempercepat WAKTU (stub Date.now berjalan ±20×) alih-alih mempercepat
 * interval — 3 menit selesai ±9 detik nyata, tanpa mengubah logika komponen.
 *
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-rush-waktu.mjs
 */
import { readFileSync } from "node:fs";
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

/** Date.now asli — dipakai batas waktu uji agar tak terpengaruh stub. */
const kiniAsli = Date.now.bind(Date);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** Polling sampai kondisi terpenuhi (anti gagal-palsu di mesin lambat). */
async function tungguHingga(kondisi, batasMs = 15000, jedaMs = 25) {
  const mulai = kiniAsli();
  while (!kondisi()) {
    if (kiniAsli() - mulai > batasMs) return false;
    await tunggu(jedaMs);
  }
  return true;
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("\nlewati uji render — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  console.log(`\n${lulus} lulus, ${gagal} gagal`);
  process.exit(gagal ? 1 : 0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

/* ------------------------------------------------ bundel komponen (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import TekaTekiRush from "./src/halaman/TekaTekiRush/TekaTekiRush.jsx";

export function mount(el) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/teka-teki-rush"]}>
        <I18nProvider>
          <TekaTekiRush />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-rush-waktu.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-rush-waktu-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` (dipakai ChessPiece) dipecah oleh shim yang sama dengan
  // Node loader, bukan diganti fungsi kosong: `define` menghapus jejak makro dari
  // sumber sehingga skrip ini buta terhadap bentuk yang tidak di-expand Vite.
  plugins: [pluginGlobAset()],
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
class WorkerPalsu {
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  terminate() {}
}

/** Audio palsu pencatat alamat — tanpa AudioContext, modul suara memakai
 *  jalur cadangan `new Audio(alamat)` sehingga bunyi yang diputar bisa
 *  diperiksa dari alamatnya. */
const audioDiputar = [];
class AudioPalsu {
  constructor(src) {
    this.src = String(src);
    audioDiputar.push(this.src);
  }
  load() {}
  play() {
    return Promise.resolve();
  }
  pause() {}
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/teka-teki-rush",
  pretendToBeVisual: true,
});

function siapkanGlobal(window) {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.Worker = WorkerPalsu;
  window.Audio = AudioPalsu;
  // Tanpa AudioContext → modul suara jatuh ke jalur `new Audio` (tercatat).
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.Worker = WorkerPalsu;
  globalThis.Audio = AudioPalsu;
  for (const nama of [
    "HTMLElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "CustomEvent",
  ]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
}

/** Sajikan berkas /public dari disk; permintaan keluar ditolak. */
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
    } catch {
      return Promise.reject(new Error(`berkas tidak tersedia di uji: ${relatif}`));
    }
  };
}

siapkanGlobal(dom.window);
pasangFetch(dom.window);
globalThis.fetch = dom.window.fetch;

const modul = require(berkasBundel);
const dok = dom.window.document;

const pesanGalat = [];
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

/* ------------------------------------------------------------------ ujian */

const wadah = dok.getElementById("root");
modul.mount(wadah);

// Tunggu menu mulai (data soal termuat).
const siapMenu = await tungguHingga(
  () => [...dok.querySelectorAll("button")].some((b) => /Mulai Rush/i.test(b.textContent))
);
uji("menu mulai tampil (data soal termuat)", siapMenu);
if (!siapMenu) {
  console.log(`\n${lulus} lulus, ${gagal} gagal`);
  process.exit(1);
}

// Isi nama pemain lalu mulai sesi 3 menit (durasi bawaan).
const isianNama = dok.querySelector('input[placeholder*="sernam" i], input[type="text"]');
if (isianNama) {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
  setter.call(isianNama, "Penguji");
  isianNama.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await tunggu(50);
}
const tombolMulai = [...dok.querySelectorAll("button")].find((b) => /Mulai Rush/i.test(b.textContent));
tombolMulai.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

// Sesi dimulai setelah jeda 700 ms → tunggu papan + tampilan waktu.
const papanMuncul = await tungguHingga(
  () => wadah.querySelectorAll("[data-petak]").length === 64,
  10000
);
uji("sesi berjalan: papan 64 petak tampil", papanMuncul);

/** Elemen penghitung mundur (font-mono "MM:SS"). */
const elWaktu = () =>
  [...dok.querySelectorAll(".font-mono")].find((e) => /^\d{2}:\d{2}$/.test(e.textContent.trim()));
const bacaWaktu = () => {
  const el = elWaktu();
  return el ? el.textContent.trim() : null;
};
const detik = (teks) => {
  if (!teks) return null;
  const [m, d] = teks.split(":").map(Number);
  return m * 60 + d;
};

uji(
  "waktu awal 03:00 (durasi 3 menit)",
  bacaWaktu() === "03:00" || bacaWaktu() === "02:59"
);

/* Percepat berjalannya waktu ±20× — penghitung komponen berbasis tenggat
 * absolut (Date.now), jadi yang dipercepat jamnya, bukan intervalnya.
 * 3 menit (180 dtk) selesai ±9 detik nyata. */
const FAKTOR = 20;
let offsetWaktu = 0;
const setIntervalAsli = globalThis.setInterval.bind(globalThis);
const penggerakWaktu = setIntervalAsli(() => {
  offsetWaktu += 1000 * (FAKTOR - 1);
}, 1000);
Date.now = () => kiniAsli() + offsetWaktu;

let merahTerlihat = false;
let bunyiPeringatan = false;
try {
  // Penghitung harus TURUN — dulu (BEBAS_WAKTU=true) angkanya beku di 03:00.
  await tungguHingga(() => {
    const s = detik(bacaWaktu());
    return s !== null && s < 179;
  }, 5000);
  uji("penghitung mundur berjalan (turun dari 03:00)", (() => {
    const s = detik(bacaWaktu());
    return s !== null && s < 179;
  })());

  // Sisa ≤ 30 dtk → timer merah (warnaLow) + bunyi peringatan sekali.
  merahTerlihat = await tungguHingga(
    () => !!elWaktu() && /red-/.test(elWaktu().className),
    15000
  );
  uji("timer berubah merah saat sisa ≤ 30 detik", merahTerlihat);
  bunyiPeringatan = await tungguHingga(
    () => audioDiputar.some((s) => s.includes("tenseconds")),
    5000
  );
  uji("bunyi peringatan waktu menipis diputar", bunyiPeringatan);

  // Waktu habis → sesi berakhir & layar hasil menyebut "Waktu habis".
  const selesai = await tungguHingga(
    () => /Waktu habis/i.test(wadah.textContent || ""),
    30000
  );
  uji('sesi berakhir karena waktu (layar hasil "Waktu habis")', selesai);
  uji(
    "papan tidak lagi aktif setelah waktu habis (kembali ke menu/hasil)",
    wadah.querySelectorAll("[data-petak]").length === 0 ||
      /Waktu habis/i.test(wadah.textContent || "")
  );
} finally {
  Date.now = kiniAsli;
  clearInterval(penggerakWaktu);
}

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
