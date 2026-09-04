/**
 * Uji asap + regresi halaman Papan Interaktif (papan analisa gelap).
 *
 * Mengapa perlu: halaman ini menyimpan posisi papan di beberapa state
 * sekaligus (`fen`, `riwayat`, `riwayatLengkap`, `jalur`). Setiap kali
 * navigasi (mundur/maju/ke awal/ke akhir/klik daftar langkah) memutar ulang
 * langkah dari posisi awal, ada dua kelas bug yang gampang lolos review:
 *
 *   1. Cabang baru setelah "mundur" — riwayat lengkap berisi deret langkah
 *      yang tidak legal lagi, sehingga "ke akhir" melempar `Invalid move`
 *      dari chess.js dan seluruh halaman putih (React unmount).
 *   2. Posisi kustom dari dialog Review (FEN) — mundur/ke awal memutar ulang
 *      dari posisi standar sehingga posisi yang baru dimuat hilang.
 *
 * Skrip ini mem-mount halaman sungguhan di jsdom dengan buku pembukaan kecil
 * (bukan berkas 4,6 MB) lalu menggerakkan papan lewat klik DOM.
 *
 * Melewatkan dirinya (exit 0) bila jsdom/esbuild tidak terpasang.
 *
 * Jalankan: node scripts/uji-papan-interaktif.mjs
 */
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
  console.log(
    "lewati uji UI Papan Interaktif — pasang `npm i -D jsdom esbuild` untuk menjalankannya."
  );
  process.exit(0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import PapanInteraktif from "./src/halaman/PapanInteraktif/PapanInteraktif.jsx";

export function mount(el) {
  createRoot(el).render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/papan-interaktif"]}>
        <I18nProvider>
          <PapanInteraktif />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}
`;

/* Buku pembukaan mini berformat daftar rata (seperti data Lichess). */
const BUKU_MINI = [
  {
    eco: "B00",
    opening: "King's Pawn Game",
    moves: "e2e4",
    games: 1000,
    white_win_rate: 0.5,
    draw_rate: 0.1,
    black_win_rate: 0.4,
    avg_rating: 1500,
  },
  { eco: "C20", opening: "King's Pawn Game: King's Knight Opening", moves: "e2e4 e7e5" },
  { eco: "B20", opening: "Sicilian Defense", moves: "e2e4 c7c5" },
  { eco: "D00", opening: "Queen's Pawn Game", moves: "d2d4" },
  { eco: "A40", opening: "Queen's Pawn Game: Modern Defense", moves: "d2d4 g8f6" },
];

const berkasBundel = path.join(tmpdir(), "kci-uji-papan-interaktif.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-papan-interaktif-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    // ChessPiece memakai import.meta.glob (khas Vite) — di jsdom cukup
    // dikembalikan pemuat palsu supaya bidak tetap ter-render.
    "import.meta.glob": "globalThis.__globPalsu",
  },
  logLevel: "error",
});

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function siapkanGlobal(window) {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.Worker = class {
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    terminate() {}
  };
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.innerWidth = 1440;
  window.innerHeight = 900;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
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

function pasangFetch(window) {
  window.fetch = (url) => {
    const relatif = String(url).replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
    if (relatif.endsWith("buku-pembukaan.json")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(BUKU_MINI),
        text: () => Promise.resolve(JSON.stringify(BUKU_MINI)),
      });
    }
    return Promise.reject(new Error(`berkas tidak tersedia di uji: ${relatif}`));
  };
  globalThis.fetch = window.fetch;
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/papan-interaktif",
  pretendToBeVisual: true,
});
siapkanGlobal(dom.window);
pasangFetch(dom.window);

const pesanGalat = [];
const consoleErrorAsli = console.error;
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

globalThis.__globPalsu = () =>
  new Proxy(
    {},
    { get: () => () => Promise.resolve("data:image/svg+xml,%3Csvg/%3E") }
  );

const modul = require(berkasBundel);
modul.mount(dom.window.document.getElementById("root"));

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));
await tunggu(600);

const doc = dom.window.document;

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

const petak = (sq) => doc.querySelector(`[data-petak="${sq}"]`);
async function klikPetak(sq) {
  petak(sq)?.click();
  await tunggu(30);
}
async function langkah(dari, ke) {
  await klikPetak(dari);
  await klikPetak(ke);
}
function tombolLabel(label) {
  return [...doc.querySelectorAll("button")].find(
    (b) => (b.getAttribute("aria-label") || b.textContent || "").trim() === label
  );
}
function tombolTeks(teks, akar = doc) {
  return [...akar.querySelectorAll("button")].find((b) => b.textContent.trim() === teks);
}
function tombolJudul(judul) {
  return [...doc.querySelectorAll("button")].find((b) => b.getAttribute("title") === judul);
}
async function klikTombol(cari, label) {
  const el = cari(label);
  if (!el) throw new Error(`tombol "${label}" tidak ditemukan`);
  el.click();
  await tunggu(60);
}
/** Isi papan yang sedang tampil: peta petak → huruf bidak (FEN-style). */
function posisiPapan() {
  const peta = {};
  for (const el of doc.querySelectorAll("[data-petak]")) {
    const label = el.getAttribute("aria-label") || "";
    const sq = el.getAttribute("data-petak");
    const cocok = /^(.+?) di / .exec(label);
    peta[sq] = /kosong/i.test(label) ? "" : (cocok ? cocok[1] : label).trim();
  }
  return peta;
}
const teks = () => doc.body.textContent.replace(/\s+/g, " ");

/* ------------------------------------------------------------- uji dasar */
console.log("Papan Interaktif — render dasar:");
uji("papan 8×8 ter-render", doc.querySelectorAll("[data-petak]").length === 64);
uji(
  "panel tab tersedia (label dari kamus terjemahan)",
  /Analisa/.test(teks()) && /Penjelajah/.test(teks()) && /Partai/.test(teks())
);

/* -------------------------------------------- regresi 1: cabang baru */
console.log("navigasi setelah membuat cabang baru:");
await langkah("e2", "e4");
await langkah("e7", "e5");
uji("dua langkah tercatat di daftar langkah", /e4/.test(teks()) && /e5/.test(teks()));

await klikTombol(tombolLabel, "Mundur");
await langkah("c7", "c5"); // cabang berbeda dari e5

const sebelumKeAkhir = pesanGalat.length;
await klikTombol(tombolLabel, "Ke akhir");
await tunggu(120);

uji(
  "\"Ke akhir\" setelah cabang baru tidak merobohkan halaman",
  doc.querySelectorAll("[data-petak]").length === 64,
  "papan hilang → komponen crash"
);
uji(
  "tidak ada galat React/chess.js saat menelusuri cabang",
  pesanGalat.length === sebelumKeAkhir,
  pesanGalat.slice(sebelumKeAkhir).join(" | ").slice(0, 400)
);
uji(
  "langkah lama (e5) tidak tersisa di daftar setelah cabang baru",
  !/\be5\b/.test(teks()) || /c5/.test(teks()),
  teks().slice(0, 200)
);

/* --------------------------------- regresi 2: posisi kustom dari FEN */
console.log("posisi kustom lewat dialog Review (FEN):");
const FEN_UJI = "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1";
await klikTombol(tombolJudul, "Masukkan PGN / FEN");
const areaTeks = doc.querySelector("textarea");
if (!areaTeks) throw new Error("dialog Review tidak terbuka");
const setter = Object.getOwnPropertyDescriptor(
  dom.window.HTMLTextAreaElement.prototype,
  "value"
).set;
setter.call(areaTeks, FEN_UJI);
areaTeks.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
await tunggu(60);
const dialog = doc.querySelector('[role="dialog"]');
tombolTeks("Muat", dialog).click();
await tunggu(120);

const posisiKustom = posisiPapan();
uji(
  "FEN kustom termuat ke papan",
  posisiKustom.e2 !== "" && posisiKustom.a2 === "",
  JSON.stringify({ e2: posisiKustom.e2, a2: posisiKustom.a2 })
);

await langkah("e2", "e4");
await klikTombol(tombolLabel, "Mundur");
await tunggu(120);
const setelahUndo = posisiPapan();
uji(
  "mundur dari posisi kustom kembali ke posisi kustom (bukan posisi awal standar)",
  setelahUndo.a2 === "" && setelahUndo.e2 !== "",
  `a2=${JSON.stringify(setelahUndo.a2)} e2=${JSON.stringify(setelahUndo.e2)}`
);

/* ------------------------------------- navigasi papan lewat tombol panah */
console.log("pintasan papan:");
await langkah("e2", "e4"); // maju lagi dari posisi kustom
const sebelumPanah = posisiPapan();
doc.body.dispatchEvent(
  new dom.window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })
);
await tunggu(80);
const setelahPanah = posisiPapan();
uji(
  "panah kiri memundurkan langkah",
  sebelumPanah.e4 !== setelahPanah.e4,
  `${JSON.stringify(sebelumPanah.e4)} → ${JSON.stringify(setelahPanah.e4)}`
);

/* --------------------------------------------------------- ringkasan */
console.error = consoleErrorAsli;
const galatSerius = pesanGalat.filter(
  (p) => !/not wrapped in act|Warning: An update/i.test(p)
);
uji("tidak ada galat konsol serius", galatSerius.length === 0, galatSerius.join(" | ").slice(0, 600));

console.log(`\n${lulus} lulus, ${gagal} gagal.`);
process.exit(gagal ? 1 : 0);
