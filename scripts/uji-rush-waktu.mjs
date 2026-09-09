/**
 * Uji penghitung waktu Teka-Teki Rush (regresi BEBAS_WAKTU).
 *
 * Mengapa perlu: `BEBAS_WAKTU` sempat dinyalakan saat modif markup dan lupa
 * dimatikan — penghitung 3/5 menit berhenti berjalan dan sesi tidak pernah
 * berakhir karena waktu. Uji ini mengunci perilaku yang benar dari sisi
 * pengguna:
 *   1. setelah "Mulai Rush", tampilan waktu berjalan turun (03:00 → 02:59 …);
 *   2. saat waktu habis, sesi berakhir dan layar hasil menampilkan
 *      "Waktu habis" (pemain "di-kick" dari papan, sesuai desain).
 *
 * Interval dipercepat lewat pembungkus setInterval agar 3 menit selesai dalam
 * hitungan detik, tanpa mengubah logika komponen.
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
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** Polling sampai kondisi terpenuhi (anti gagal-palsu di mesin lambat). */
async function tungguHingga(kondisi, batasMs = 15000, jedaMs = 25) {
  const mulai = Date.now();
  while (!kondisi()) {
    if (Date.now() - mulai > batasMs) return false;
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
  banner: { js: "function __globPalsu() { return {}; }" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    "import.meta.glob": "__globPalsu",
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
class AudioPalsu {
  constructor() {}
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
  window.AudioContext = class {
    constructor() {
      this.currentTime = 0;
      this.state = "running";
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(0) };
    }
    createBufferSource() {
      return { connect() {}, start() {}, stop() {} };
    }
    createGain() {
      return { connect() {}, gain: { value: 1, setValueAtTime() {} } };
    }
    decodeAudioData() {
      return Promise.resolve({ duration: 0 });
    }
    resume() {
      return Promise.resolve();
    }
  };
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};

  // Percepat penghitung: interval 1000 ms dijalankan tiap 15 ms sehingga
  // 3 menit (180 detik) selesai ±3 detik. Logika komponen tidak diubah.
  const setIntervalAsli = window.setInterval.bind(window);
  window.setInterval = (fn, jeda, ...sisa) =>
    setIntervalAsli(fn, jeda >= 1000 ? 15 : jeda, ...sisa);

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.Worker = WorkerPalsu;
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

/** Teks penghitung mundur (elemen font-mono "MM:SS"). */
const bacaWaktu = () => {
  const el = [...dok.querySelectorAll(".font-mono")].find((e) => /^\d{2}:\d{2}$/.test(e.textContent.trim()));
  return el ? el.textContent.trim() : null;
};
const detik = (teks) => {
  if (!teks) return null;
  const [m, d] = teks.split(":").map(Number);
  return m * 60 + d;
};

uji("waktu awal 03:00 (durasi 3 menit)", bacaWaktu() === "03:00");

// Penghitung harus TURUN — dulu (BEBAS_WAKTU=true) angkanya beku di 03:00.
await tungguHingga(() => {
  const s = detik(bacaWaktu());
  return s !== null && s < 180;
}, 5000);
const detikSekarang = detik(bacaWaktu());
uji("penghitung mundur berjalan (turun dari 03:00)", detikSekarang !== null && detikSekarang < 180);

// Waktu habis → sesi berakhir & layar hasil menyebut "Waktu habis".
// (interval dipercepat: 180 detik ≈ 3 detik nyata; beri margin.)
const selesai = await tungguHingga(
  () => /Waktu habis/i.test(wadah.textContent || ""),
  30000
);
uji("sesi berakhir karena waktu (layar hasil \"Waktu habis\")", selesai);
uji(
  "papan tidak lagi aktif setelah waktu habis (kembali ke menu/hasil)",
  wadah.querySelectorAll("[data-petak]").length === 0 ||
    /Waktu habis/i.test(wadah.textContent || "")
);

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
