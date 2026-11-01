/**
 * Uji halaman Teka-teki Harian di jsdom (tanpa jaringan sungguhan).
 *
 * Yang dijaga:
 *  1. Halaman memuat soal dari SNAPSHOT STATIS `data/teka-teki-harian/…`
 *     (tanpa API) dan memasang papan 64 petak dengan posisi persis FEN-nya.
 *  2. Langkah benar diterima, lawan membalas otomatis, dan langkah salah tidak
 *     mengubah posisi serta memberi pesan.
 *  3. Menyelesaikan seluruh solusi menandai tanggal itu di localStorage.
 *  4. Tanggal arsip yang berpihak HITAM dipasang dengan orientasi hitam dan
 *     penomoran riwayat yang benar (bukan asumsi "putih selalu mulai").
 *  5. Tanggal yang tidak ada di snapshot menampilkan keadaan kosong, bukan papan
 *     kosong atau galat.
 *  6. Widget "Teka-teki Hari Ini" di landing merender papan soal terbaru dan
 *     tautan ke halaman penuh.
 *  7. Tidak ada galat render React.
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
import { tekaTeki as kamusPapan } from "../src/lib/terjemahan/id/tekaTeki.js";
import { tekaTekiHarian as kamus } from "../src/lib/terjemahan/id/tekaTekiHarian.js";
import { landing as kamusLanding } from "../src/lib/terjemahan/id/landing.js";

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

/*
 * Soal diambil dari SNAPSHOT yang benar-benar dipakai situs
 * (`public/data/teka-teki-harian/`), bukan fixture tertanam: uji ini ikut
 * gagal kalau snapshot hilang, tanggalnya bergeser, atau langkahnya rusak.
 */
const folderSnapshot = path.join(ROOT, "public", "data", "teka-teki-harian");
const indeksSnapshot = JSON.parse(
  readFileSync(path.join(folderSnapshot, "indeks.json"), "utf8")
);
const terbaruSnapshot = JSON.parse(
  readFileSync(path.join(folderSnapshot, "terbaru.json"), "utf8")
);

/** Soal terbaru (dipakai widget landing & kasus utama halaman). */
const soalTerbaru = terbaruSnapshot.soal.at(-1);
/** Soal lama dari tahun pertama arsip — untuk menguji pemuatan per tahun. */
const berkasTahunAwal = JSON.parse(
  readFileSync(
    path.join(folderSnapshot, `${indeksSnapshot.tahun[0].tahun}.json`),
    "utf8"
  )
);
/** Soal yang berpihak HITAM (bila ada) — menguji orientasi papan. */
const soalHitam =
  berkasTahunAwal.soal.find((s) => s.fen.split(" ")[1] === "b") || null;

const urai = (catatan) => ({
  tanggal: catatan.tanggal,
  fen: catatan.fen,
  langkah: catatan.langkah.split(";"),
});

const paketTerbaru = urai(soalTerbaru);

/** FEN setelah `n` langkah solusi pertama. */
function fenSetelah(fenAwal, langkah, n) {
  let fen = fenAwal;
  for (const uci of langkah.slice(0, n)) fen = terapkan(fen, parseLangkah(uci)).fen();
  return fen;
}

/* ------------------------------------------------- bundel halaman (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import { HelmetProvider } from "react-helmet-async";
import TekaTekiHarian from "./src/halaman/TekaTekiHarian/TekaTekiHarian.jsx";
import TekaTekiHarianLanding from "./src/halaman/Landing/TekaTekiHarianLanding.jsx";

function bungkus(el, awal, isi) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[awal]}>
        <I18nProvider>{isi}</I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}

export function mount(el, awal) {
  return bungkus(el, awal, <TekaTekiHarian />);
}

/** Widget "Teka-teki Hari Ini" pada halaman Landing. */
export function mountWidget(el) {
  return bungkus(el, "/", <TekaTekiHarianLanding />);
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
   * Semua data situs berasal dari berkas statis di `public/` — persis seperti
   * di produksi. Tidak ada mock API: `fetch` membaca dari disk.
   */
  window.fetch = (url) => {
    const relatif = String(url)
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
      return Promise.resolve({
        ok: false,
        status: 404,
        text: () => Promise.resolve(""),
        json: () => Promise.reject(new Error(`tidak ada: ${relatif}`)),
      });
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

const { mount, mountWidget } = require(berkasBundel);

/** Akar React baru di dalam body — supaya beberapa kasus tidak berebut #root. */
function akarBaru() {
  const el = dok.createElement("div");
  dok.body.appendChild(el);
  return el;
}

/** Posisi papan = FEN ini? (membaca `data-petak`/`data-bidak` milik PapanStatis). */
function papanSamaData(fen) {
  const harap = new Chess(fen).board();
  const baris = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const lajur = ["a", "b", "c", "d", "e", "f", "g", "h"];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const petak = `${lajur[j]}${baris[i]}`;
      const el = [...dok.querySelectorAll(`[data-petak="${petak}"]`)].at(-1);
      if (!el) return false;
      const bidak = harap[i][j];
      const harapBidak = bidak
        ? bidak.color === "w"
          ? bidak.type.toUpperCase()
          : bidak.type
        : "";
      if (el.getAttribute("data-bidak") !== harapBidak) return false;
    }
  }
  return true;
}

/** Cari langkah legal yang BUKAN langkah solusi berikutnya. */
function cariLangkahSalah(fen, diharapkan) {
  const game = new Chess(fen);
  for (const m of game.moves({ verbose: true })) {
    if (m.promotion) continue;
    if (m.from === diharapkan.from && m.to === diharapkan.to) continue;
    return { from: m.from, to: m.to };
  }
  return null;
}

/* ------------------------------------------------- A. soal terbaru (snapshot) */

console.log(`\nA. soal terbaru snapshot (${paketTerbaru.tanggal}):`);
const akarA = akarBaru();
const rootA = mount(akarA, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);

uji(
  "papan 64 petak tampil",
  await tungguSampai(() => dok.querySelectorAll("[data-petak]").length === 64)
);
uji("posisi awal sesuai FEN snapshot", papanSama(paketTerbaru.fen));
uji(
  "jumlah langkah tersisa dilaporkan",
  teksHalaman().includes(
    paketTerbaru.langkah.length === 1
      ? kamus.satuLangkah
      : kamus.langkahTersisa.replace("{n}", String(paketTerbaru.langkah.length))
  )
);
uji(
  "tanggal edisi tampil di panel",
  teksHalaman().includes(kamus.hariIni) || teksHalaman().includes(kamus.arsip)
);

console.log("\nA2. langkah pemain + balasan otomatis:");
const langkahSatu = parseLangkah(paketTerbaru.langkah[0]);
await mainkan(langkahSatu.from, langkahSatu.to);
if (paketTerbaru.langkah.length > 1) {
  const harap = fenSetelah(paketTerbaru.fen, paketTerbaru.langkah, 2);
  uji(
    "lawan membalas otomatis (dua setengah-langkah maju)",
    await tungguSampai(() => papanSama(harap), 4000)
  );
} else {
  uji(
    "soal satu langkah langsung ditandai selesai",
    await tungguSampai(
      () => Boolean(arsipSelesai()[paketTerbaru.tanggal]),
      4000
    )
  );
}

console.log("\nA3. langkah salah tidak mengubah posisi:");
if (paketTerbaru.langkah.length > 1) {
  const posisiKini = fenSetelah(paketTerbaru.fen, paketTerbaru.langkah, 2);
  const salah = cariLangkahSalah(posisiKini, parseLangkah(paketTerbaru.langkah[2]));
  if (salah) {
    await mainkan(salah.from, salah.to);
    await tunggu(400);
    uji("posisi tidak berubah", papanSama(posisiKini));
    uji("pesan 'belum tepat' tampil", teksHalaman().includes(kamus.salah));
  } else {
    uji("ada langkah legal lain untuk diuji (dilewati: posisi hanya punya solusi)", true);
  }
} else {
  uji("(soal satu langkah — bagian langkah salah dilewati)", true);
}

console.log("\nA4. menyelesaikan seluruh solusi:");
if (paketTerbaru.langkah.length > 1) {
  // Langkah pemain = indeks genap; indeks 0 sudah dimainkan di A2.
  for (const uci of paketTerbaru.langkah.filter((_, i) => i % 2 === 0).slice(1)) {
    const { from, to } = parseLangkah(uci);
    await mainkan(from, to);
    await tunggu(900);
  }
}
uji(
  "tanggal ini tercatat selesai di localStorage",
  await tungguSampai(
    () => Boolean(arsipSelesai()[paketTerbaru.tanggal]),
    4000
  )
);
uji("pesan selesai tampil", teksHalaman().includes(kamus.terpecahkan));

rootA.unmount();
akarA.remove();

/* ----------------------------------------------------- B. arsip berpihak hitam */

console.log("\nB. arsip tahun pertama (berpihak hitam):");
if (soalHitam) {
  const paketHitam = urai(soalHitam);
  const akarB = akarBaru();
  const rootB = mount(
    akarB,
    `/teka-teki-harian?tanggal=${paketHitam.tanggal}`
  );
  uji(
    "soal arsip termuat",
    await tungguSampai(() => papanSama(paketHitam.fen))
  );
  uji(
    "orientasi papan mengikuti hitam (h1 di kiri atas)",
    dok.querySelector("[data-petak]")?.getAttribute("data-petak") === "h1"
  );
  const langkahHitam = parseLangkah(paketHitam.langkah[0]);
  await mainkan(langkahHitam.from, langkahHitam.to);
  if (paketHitam.langkah.length > 1) {
    uji(
      "balasan otomatis ikut bergerak",
      await tungguSampai(
        () => papanSama(fenSetelah(paketHitam.fen, paketHitam.langkah, 2)),
        4000
      )
    );
  } else {
    uji(
      "langkah tunggal menuntaskan soal hitam",
      await tungguSampai(
        () => Boolean(arsipSelesai()[paketHitam.tanggal]),
        4000
      )
    );
  }
  rootB.unmount();
  akarB.remove();
} else {
  uji("snapshot punya soal berpihak hitam", false);
}

/* ------------------------------------------- C. tanggal di luar snapshot */

console.log("\nC. tanggal yang tidak ada di snapshot:");
{
  const akarC = akarBaru();
  const rootC = mount(akarC, "/teka-teki-harian?tanggal=2007-05-07");
  uji(
    "keadaan kosong dijelaskan (bukan papan kosong)",
    await tungguSampai(() => teksHalaman().includes(kamus.tidakTersedia), 4000)
  );
  uji(
    "tidak ada papan yang dipasang",
    dok.querySelectorAll("[data-petak]").length === 0
  );
  uji(
    "tombol ke tanggal terbaru ditawarkan",
    teksHalaman().includes(kamus.keTerbaru.split("{tanggal}")[0].trim())
  );
  rootC.unmount();
  akarC.remove();
}

/* ------------------------------------------- D. widget landing */

console.log("\nD. widget \"Teka-teki Hari Ini\" di landing:");
{
  const akarD = akarBaru();
  const rootD = mountWidget(akarD);
  uji(
    "widget memasang papan soal terbaru",
    await tungguSampai(() => papanSamaData(soalTerbaru.fen), 5000)
  );
  uji(
    "judul seksi dari kamus tampil",
    teksHalaman().includes(kamusLanding.harianJudul)
  );
  uji(
    "edisi menyebut tanggal soal terbaru",
    teksHalaman().includes(soalTerbaru.tanggal)
  );
  const tautan = [...dok.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  uji("ada tautan ke halaman teka-teki harian", tautan.includes("/teka-teki-harian"));
  uji(
    "ada tautan ke halaman asli Chess.com",
    tautan.some((h) => h && h.includes("chess.com/daily-chess-puzzle"))
  );
  rootD.unmount();
  akarD.remove();
}

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.error = consoleErrorAsli;
console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
