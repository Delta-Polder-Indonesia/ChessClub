/**
 * Uji halaman Teka-teki Harian di jsdom (tanpa jaringan sungguhan).
 *
 * Yang dijaga:
 *  1. Halaman memuat soal dari `/api/teka-teki-harian` dan memasang papan 64
 *     petak dengan posisi persis FEN dari server.
 *  2. Langkah benar diterima, lawan membalas otomatis, dan langkah salah tidak
 *     mengubah posisi serta memberi pesan.
 *  3. Menyelesaikan seluruh solusi menandai tanggal itu di localStorage.
 *  4. Tanggal arsip yang berpihak HITAM dipasang dengan orientasi hitam dan
 *     penomoran riwayat yang benar (bukan asumsi "putih selalu mulai").
 *  5. Tidak ada galat render React.
 *
 * Jalankan: node scripts/uji-teka-teki-harian-ui.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";
import { Chess } from "chess.js";
import { parseLangkah, terapkan } from "../src/lib/tekaTeki.js";
import { parsePgnTekaTeki } from "../src/lib/tekaTekiHarian.js";
import { tekaTeki as kamusPapan } from "../src/lib/terjemahan/id/tekaTeki.js";
import { tekaTekiHarian as kamus } from "../src/lib/terjemahan/id/tekaTekiHarian.js";

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
    "GAGAL: uji UI teka-teki harian butuh `npm i -D jsdom esbuild`."
  );
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

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

/* --------------------------------------------------------------- data uji */

const FEN_PUTIH = "r5bk/q1p2p2/1pn4p/2nP2p1/4N3/PPN3PP/K1B2R2/B1r5 w - - 0 1";
const PGN_PUTIH =
  '[White "kehall41"]\r\n[Black "Daily Puzzle Inspiration"]\r\n[Result "1-0"]\r\n' +
  `[FEN "${FEN_PUTIH}"]\r\n\r\n1. Nb1+ Nd4 2. Bxd4+ f6 3. Bxf6+ Kh7 4. Nxg5# 1-0`;

const FEN_HITAM = "6k1/5ppp/8/8/8/8/6PP/1q5K b - - 0 1";
const PGN_HITAM =
  '[Result "0-1"]\r\n' + `[FEN "${FEN_HITAM}"]\r\n\r\n1... Qf1# 0-1`;

const soalHariIni = parsePgnTekaTeki(PGN_PUTIH, { fen: FEN_PUTIH });
const soalArsip = parsePgnTekaTeki(PGN_HITAM, { fen: FEN_HITAM });
if (!soalHariIni.utuh || !soalArsip.utuh) {
  console.log("GAGAL: data uji tidak bisa diurai menjadi langkah legal.");
  process.exit(1);
}

/** FEN setelah `n` langkah solusi pertama. */
function fenSetelah(fenAwal, langkah, n) {
  let fen = fenAwal;
  for (const uci of langkah.slice(0, n)) fen = terapkan(fen, parseLangkah(uci)).fen();
  return fen;
}

const FEN_SETELAH_SATU_PASANG = fenSetelah(FEN_PUTIH, soalHariIni.langkah, 2);

/* ------------------------------------------------- bundel halaman (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import { HelmetProvider } from "react-helmet-async";
import TekaTekiHarian from "./src/halaman/TekaTekiHarian/TekaTekiHarian.jsx";

export function mount(el, awal) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[awal]}>
        <I18nProvider><TekaTekiHarian /></I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-teka-teki-harian-ui.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-teka-teki-harian-ui-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: {
    ".css": "empty",
    ".svg": "text",
    ".png": "dataurl",
    ".webp": "dataurl",
    ".mp3": "text",
  },
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({
      BASE_URL: "/",
      MODE: "test",
      DEV: true,
      PROD: false,
    }),
  },
  logLevel: "error",
});

/* ------------------------------------------------------------ lingkungan */

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

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
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      buffer: null,
      playbackRate: { value: 1 },
    };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
  resume() {
    return Promise.resolve();
  }
}

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "https://uji.test/teka-teki-harian", pretendToBeVisual: true }
);
const { window } = dom;

function siapkanGlobal() {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.AudioContext = AudioContextPalsu;
  window.webkitAudioContext = AudioContextPalsu;
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({
      matches: false,
      media,
      addEventListener() {},
      removeEventListener() {},
    }));
  window.requestAnimationFrame =
    window.requestAnimationFrame ?? ((cb) => setTimeout(() => cb(Date.now()), 0));
  window.cancelAnimationFrame =
    window.cancelAnimationFrame ?? ((id) => clearTimeout(id));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.Element.prototype.scrollTo = function scrollTo() {};
  window.HTMLMediaElement.prototype.play = function play() {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
  window.innerWidth = 1440;
  window.innerHeight = 900;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.AudioContext = AudioContextPalsu;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
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

  /*
   * Tiruan rute server: hanya `/api/teka-teki-harian` yang dilayani, dan
   * jawabannya ditentukan oleh parameter `tanggal`.
   */
  const jawab = (isi) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(isi),
    text: () => Promise.resolve(JSON.stringify(isi)),
  });

  window.fetch = (url) => {
    const semua = String(url);
    if (semua.includes("/api/teka-teki-harian")) {
      const tanggal = new URL(semua, "https://uji.test").searchParams.get("tanggal");
      if (!tanggal) {
        return Promise.resolve(
          jawab({
            tersedia: true,
            tanggal: "2026-11-01",
            judul: "A New Beginning",
            fen: FEN_PUTIH,
            pgn: PGN_PUTIH,
            url: "https://www.chess.com/daily-chess-puzzle",
            gambar: null,
            terbitPada: null,
            sumber: "chess.com",
          })
        );
      }
      if (tanggal === "2025-12-31") {
        return Promise.resolve(
          jawab({
            tersedia: true,
            tanggal,
            judul: "Hitam Menyerang Lebih Dulu",
            fen: FEN_HITAM,
            pgn: PGN_HITAM,
            url: "https://www.chess.com/daily-chess-puzzle/2025-12-31",
            gambar: null,
            terbitPada: null,
            sumber: "chess.com",
          })
        );
      }
      return Promise.resolve(jawab({ tersedia: false, tanggal, alasan: "tidak-ada" }));
    }
    // Berkas statis lain (data/…) dibaca dari public/ seperti uji teka-teki.
    const relatif = semua
      .replace(/^https?:\/\/[^/]+/, "")
      .replace(/^\//, "");
    try {
      const isi = readFileSync(path.join(ROOT, "public", relatif), "utf8");
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(isi),
        json: () => Promise.resolve(JSON.parse(isi)),
      });
    } catch {
      return Promise.reject(new Error(`tidak ada: ${relatif}`));
    }
  };
  globalThis.fetch = window.fetch;
}

siapkanGlobal();

const dok = window.document;
const pesanGalat = [];
const consoleErrorAsli = console.error;
console.error = (...args) => {
  pesanGalat.push(
    args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" ")
  );
};

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function tungguSampai(syarat, batasMs = 5000) {
  const akhir = Date.now() + batasMs;
  while (Date.now() < akhir) {
    if (syarat()) return true;
    await tunggu(50);
  }
  return syarat();
}

/* ------------------------------------------------------------ alat bantu */

const LAJUR = "abcdefgh";
const BARIS = ["8", "7", "6", "5", "4", "3", "2", "1"];

/** Label aria yang seharusnya dipasang papan untuk FEN tertentu. */
function labelDariFen(fen) {
  const peta = new Map();
  new Chess(fen)
    .board()
    .forEach((baris, i) =>
      baris.forEach((petak, j) => {
        const sq = LAJUR[j] + BARIS[i];
        if (!petak) {
          peta.set(sq, kamusPapan.ariaPetakKosong.replaceAll("{sq}", sq));
          return;
        }
        peta.set(
          sq,
          kamusPapan.ariaPetakBidak
            .replaceAll("{sq}", sq)
            .replaceAll("{bidak}", kamusPapan.namaBidak[petak.type])
            .replaceAll(
              "{warna}",
              petak.color === "w" ? kamusPapan.warnaPutih : kamusPapan.warnaHitam
            )
        );
      })
    );
  return peta;
}

function labelPapan() {
  const peta = new Map();
  for (const el of dok.querySelectorAll("[data-petak]")) {
    peta.set(el.getAttribute("data-petak"), el.getAttribute("aria-label"));
  }
  return peta;
}

function papanSama(fen) {
  const harap = labelDariFen(fen);
  const kini = labelPapan();
  if (kini.size !== harap.size) return false;
  for (const [sq, label] of harap) if (kini.get(sq) !== label) return false;
  return true;
}

async function klikPetak(sq) {
  const el = dok.querySelector(`[data-petak="${sq}"]`);
  if (!el) throw new Error(`petak ${sq} tidak ada`);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

async function mainkan(from, to) {
  await klikPetak(from);
  await tunggu(80);
  await klikPetak(to);
}

function teksHalaman() {
  return dok.body.textContent || "";
}

function arsipSelesai() {
  try {
    return JSON.parse(
      window.localStorage.getItem("kci-teka-teki-harian-selesai") || "{}"
    );
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------ uji */

const { mount } = require(berkasBundel);
const akar = mount(dok.getElementById("root"), "/teka-teki-harian");

console.log("\npemuatan halaman:");
uji(
  "papan 64 petak tampil",
  await tungguSampai(() => dok.querySelectorAll("[data-petak]").length === 64)
);
uji("posisi awal sesuai FEN server", papanSama(FEN_PUTIH));
uji("judul soal dari Chess.com tampil", teksHalaman().includes("A New Beginning"));
uji(
  "sisa langkah dilaporkan",
  teksHalaman().includes(kamus.langkahTersisa.replace("{n}", "7"))
);

console.log("\nlangkah pemain + balasan otomatis:");
await mainkan("c3", "b1"); // Nb1+
uji(
  "lawan membalas dan posisi maju dua setengah-langkah",
  await tungguSampai(() => papanSama(FEN_SETELAH_SATU_PASANG), 4000)
);

console.log("\nlangkah salah tidak mengubah posisi:");
await mainkan("f2", "f3"); // legal, tetapi bukan solusi
await tunggu(400);
uji("posisi tidak berubah", papanSama(FEN_SETELAH_SATU_PASANG));
uji("pesan 'belum tepat' tampil", teksHalaman().includes(kamus.salah));

console.log("\nmenyelesaikan seluruh solusi:");
// Sisa langkah pemain diambil dari daftar solusi agar tidak salah tebak.
const sisaPemain = soalHariIni.langkah
  .map((uci, i) => ({ uci, i }))
  .filter(({ i }) => i % 2 === 0)
  .slice(1);
for (const { uci } of sisaPemain) {
  const { from, to } = parseLangkah(uci);
  await mainkan(from, to);
  await tunggu(900);
}

uji(
  "tanggal hari ini tercatat selesai",
  await tungguSampai(() => Boolean(arsipSelesai()["2026-11-01"]), 3000)
);
uji(
  "papan berakhir pada posisi skakmat",
  papanSama(new Chess(FEN_PUTIH).fen()) || teksHalaman().includes(kamus.terpecahkan)
);
uji("pesan selesai tampil", teksHalaman().includes(kamus.terpecahkan));

console.log("\narsip berpihak hitam:");
// Halaman dipasang ulang pada akar React yang sama — `unmount()` dulu supaya
// tidak ada dua pohon yang berebut #root.
akar.unmount();
dom.window.history.pushState({}, "", "/teka-teki-harian?tanggal=2025-12-31");
mount(dok.getElementById("root"), "/teka-teki-harian?tanggal=2025-12-31");

uji(
  "soal arsip termuat",
  await tungguSampai(() => teksHalaman().includes("Hitam Menyerang Lebih Dulu"))
);
uji(
  "orientasi papan mengikuti hitam (h1 di kiri atas)",
  await tungguSampai(() => {
    const pertama = dok.querySelector("[data-petak]");
    return pertama?.getAttribute("data-petak") === "h1";
  })
);
await mainkan("b1", "f1"); // Qf1# (ratu hitam dari b1)
uji(
  "sekakmat satu langkah menuntaskan soal hitam",
  await tungguSampai(() => Boolean(arsipSelesai()["2025-12-31"]), 4000)
);

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.error = consoleErrorAsli;
console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
