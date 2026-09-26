#!/usr/bin/env node
/**
 * Uji ANIMASI GESER BIDAK pada papan bersama `PapanTekaTeki`
 * (dipakai Teka-teki, Teka-teki Rush, Papan Interaktif, Manusia vs Mesin,
 * dan Latihan Repertoar).
 *
 * Mengapa ada: papan dirender ulang dari FEN, sehingga tanpa animasi bidak
 * "berkedip" — hilang di petak asal, muncul seketika di petak tujuan. Papan
 * kini menyimpulkan perpindahan dari selisih dua FEN
 * (`src/halaman/TekaTeki/animasiBidak.js`) lalu meluncurkan bidaknya. Uji ini
 * mengunci dua hal yang mudah rusak diam-diam:
 *
 *   A. Logika murni penyimpul langkah: langkah biasa, pukulan, rokade,
 *      en passant, promosi, navigasi mundur, dan — yang terpenting — posisi
 *      yang DIGANTI (soal baru / muat FEN) harus TIDAK menghasilkan luncuran.
 *   B. Papan sungguhan di atas jsdom: `element.animate()` benar-benar
 *      dipanggil pada bidak di petak tujuan dengan pergeseran awal yang tepat,
 *      dan TIDAK dipanggil saat posisi diganti atau papan dibalik.
 *
 * Bagian B melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-animasi-bidak.mjs  |  npm run uji:animasi-bidak
 */
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DURASI_GESER,
  DURASI_GESER_MINIM,
  durasiGeser,
  geseranDariFen,
  geseranPiksel,
  posisiLayar,
} from "../src/halaman/TekaTeki/animasiBidak.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

/* ============================ A. logika murni ============================ */

console.log("A. penyimpul langkah dari selisih FEN");

const AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const SETELAH_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

{
  const g = geseranDariFen(AWAL, SETELAH_E4);
  uji(
    "langkah biasa (e2-e4) → satu luncuran e2→e4",
    g.length === 1 && g[0].dari === "e2" && g[0].ke === "e4" && g[0].bidak === "P",
    JSON.stringify(g)
  );
}

{
  // Navigasi mundur di daftar langkah: pion kembali, tetap meluncur.
  const g = geseranDariFen(SETELAH_E4, AWAL);
  uji(
    "navigasi mundur (e4-e2) tetap meluncur",
    g.length === 1 && g[0].dari === "e4" && g[0].ke === "e2",
    JSON.stringify(g)
  );
}

{
  // Pukulan: kuda c3 memukul bidak di d5.
  const sebelum = "rnbqkbnr/ppp1pppp/8/3p4/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 1";
  const sesudah = "rnbqkbnr/ppp1pppp/8/3N4/8/8/PPPPPPPP/R1BQKBNR b KQkq - 0 1";
  const g = geseranDariFen(sebelum, sesudah);
  uji(
    "pukulan (Nc3xd5) → satu luncuran c3→d5",
    g.length === 1 && g[0].dari === "c3" && g[0].ke === "d5" && g[0].bidak === "N",
    JSON.stringify(g)
  );
}

{
  // Rokade pendek putih: raja e1→g1 DAN benteng h1→f1.
  const sebelum = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1";
  const sesudah = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1RK1 b kq - 1 1";
  const g = geseranDariFen(sebelum, sesudah);
  const raja = g.find((x) => x.bidak === "K");
  const benteng = g.find((x) => x.bidak === "R" && x.dari === "h1");
  uji(
    "rokade pendek → dua luncuran (raja e1→g1, benteng h1→f1)",
    g.length === 2 && raja?.dari === "e1" && raja?.ke === "g1" && benteng?.ke === "f1",
    JSON.stringify(g)
  );
}

{
  // En passant: pion putih e5 memukul d5, mendarat di d6.
  const sebelum = "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3";
  const sesudah = "rnbqkbnr/ppp1pppp/3P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3";
  const g = geseranDariFen(sebelum, sesudah);
  uji(
    "en passant → satu luncuran e5→d6",
    g.length === 1 && g[0].dari === "e5" && g[0].ke === "d6",
    JSON.stringify(g)
  );
}

{
  // Promosi: pion b7 menjadi menteri di b8.
  const sebelum = "8/1P6/8/8/8/8/8/K6k w - - 0 1";
  const sesudah = "1Q6/8/8/8/8/8/8/K6k b - - 0 1";
  const g = geseranDariFen(sebelum, sesudah);
  uji(
    "promosi (b7-b8=Q) → luncuran b7→b8",
    g.length === 1 && g[0].dari === "b7" && g[0].ke === "b8" && g[0].bidak === "Q",
    JSON.stringify(g)
  );
}

{
  // Posisi diganti (soal baru): tidak ada luncuran sama sekali.
  const soal = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";
  uji("posisi diganti → tanpa luncuran", geseranDariFen(AWAL, soal).length === 0);
}

{
  // Lompat dua langkah sekaligus (klik jauh di daftar langkah).
  const dua = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
  uji("lompat dua langkah → tanpa luncuran", geseranDariFen(AWAL, dua).length === 0);
  uji("FEN sama → tanpa luncuran", geseranDariFen(AWAL, AWAL).length === 0);
  uji("FEN kosong → tanpa luncuran", geseranDariFen("", AWAL).length === 0);
}

{
  // Pergeseran piksel mengikuti orientasi papan (petak 80px).
  const g = { dari: "e2", ke: "e4", bidak: "P" };
  const putih = geseranPiksel(g, "w", 80);
  const hitam = geseranPiksel(g, "b", 80);
  uji(
    "pergeseran putih di bawah: naik 160px",
    putih.x === 0 && putih.y === -160,
    JSON.stringify(putih)
  );
  uji(
    "papan dibalik: arah ikut terbalik",
    hitam.x === 0 && hitam.y === 160,
    JSON.stringify(hitam)
  );
  const a8 = posisiLayar("a8", "w");
  uji("a8 = pojok kiri-atas saat putih di bawah", a8.kolom === 0 && a8.baris === 0);
}

{
  // Kecepatan luncuran: diminta "santai", bukan sentakan cepat.
  uji("durasi bawaan santai (>= 300 ms)", DURASI_GESER >= 300, String(DURASI_GESER));
  uji("tanpa setelan kurangi gerak: durasi penuh", durasiGeser() === DURASI_GESER);
  const matchMediaAsli = globalThis.matchMedia;
  globalThis.matchMedia = (media) => ({ matches: media.includes("reduced-motion"), media });
  uji(
    "setelan kurangi gerak mempersingkat luncuran, bukan mematikannya",
    durasiGeser() === DURASI_GESER_MINIM && DURASI_GESER_MINIM > 0,
    String(durasiGeser())
  );
  globalThis.matchMedia = matchMediaAsli;
}

/* ====================== B. papan sungguhan (jsdom) ====================== */

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("\nB. dilewati — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  console.log(`\n${lulus} lulus, ${gagal} gagal`);
  process.exit(gagal ? 1 : 0);
}

console.log("\nB. papan PapanTekaTeki di atas jsdom");

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/i18n.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";

/** Papan dengan induk tiruan; \`kendali.atur\` mengganti FEN/orientasi. */
export function mountPapan(el, { fen, orientasi = "w", kendali }) {
  function Harness() {
    const [posisi, setPosisi] = React.useState({ fen, orientasi });
    kendali.atur = setPosisi;
    return (
      <PapanTekaTeki
        fen={posisi.fen}
        orientasi={posisi.orientasi}
        onKlik={() => {}}
      />
    );
  }
  return createRoot(el).render(
    <I18nProvider>
      <Harness />
    </I18nProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-animasi-bidak.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-animasi-bidak-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` hanya ada di Vite (dipakai ChessPiece). Di luar Vite
  // diganti fungsi kosong: gambar bidak tidak termuat, tetapi pembungkus
  // `[data-bidak]` yang dianimasikan tetap ter-render.
  banner: { js: "function __globPalsu() { return {}; }" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    "import.meta.glob": "__globPalsu",
  },
  logLevel: "error",
});

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/teka-teki",
  pretendToBeVisual: true,
});
const { window } = dom;

const UKURAN = 640; // papan 640px → petak 80px
window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return { x: 0, y: 0, left: 0, top: 0, right: UKURAN, bottom: UKURAN, width: UKURAN, height: UKURAN };
};

/** Catatan setiap pemanggilan `element.animate()` beserta petak tujuannya. */
const catatan = [];
window.Element.prototype.animate = function animate(keyframes, opsi) {
  catatan.push({
    petak: this.closest("[data-petak]")?.getAttribute("data-petak") || null,
    bidak: this.getAttribute("data-bidak"),
    keyframes,
    opsi,
  });
  return {
    finished: Promise.resolve(),
    cancel() {},
    set oncancel(_) {},
  };
};

window.ResizeObserver = PengamatPalsu;
window.IntersectionObserver = PengamatPalsu;
window.matchMedia =
  window.matchMedia ??
  ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
window.scrollTo = () => {};
window.Element.prototype.scrollIntoView = function scrollIntoView() {};
window.HTMLElement.prototype.scrollTo = function scrollTo() {};
window.Element.prototype.scrollTo = function scrollTo() {};

globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
if (!globalThis.navigator) globalThis.navigator = window.navigator;
globalThis.matchMedia = window.matchMedia;
globalThis.ResizeObserver = PengamatPalsu;
globalThis.IntersectionObserver = PengamatPalsu;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
for (const nama of ["HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent"]) {
  if (window[nama]) globalThis[nama] = window[nama];
}

const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

const wadah = window.document.getElementById("root");
const kendali = {};
modul.mountPapan(wadah, { fen: AWAL, orientasi: "w", kendali });
await tunggu(80);

uji("papan ter-render (64 petak)", wadah.querySelectorAll("[data-petak]").length === 64);
uji("render pertama tidak menganimasikan apa pun", catatan.length === 0);

async function aturPosisi(posisi) {
  catatan.length = 0;
  kendali.atur(posisi);
  await tunggu(80);
}

await aturPosisi({ fen: SETELAH_E4, orientasi: "w" });
{
  const panggilan = catatan[0];
  const awal = panggilan?.keyframes?.[0]?.transform || "";
  uji("langkah e2-e4 memanggil animate tepat sekali", catatan.length === 1, `${catatan.length} panggilan`);
  uji("yang dianimasikan adalah bidak di petak tujuan", panggilan?.petak === "e4", String(panggilan?.petak));
  uji(
    "luncuran dimulai dari posisi petak asal (160px di bawah e4)",
    awal === "translate(-0px, 160px)" || awal === "translate(0px, 160px)",
    awal
  );
  uji(
    "durasi memakai tetapan bersama (santai)",
    panggilan?.opsi?.duration === DURASI_GESER,
    String(panggilan?.opsi?.duration)
  );
}

// Posisi diganti sepenuhnya (soal baru / muat FEN) → langsung, tanpa luncuran.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", orientasi: "w" });
uji("ganti posisi tidak menganimasikan", catatan.length === 0, `${catatan.length} panggilan`);

// Papan dibalik bersamaan dengan perubahan posisi → tidak menganimasikan.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 b - - 1 1", orientasi: "b" });
uji("papan dibalik tidak menganimasikan", catatan.length === 0, `${catatan.length} panggilan`);

// Setelah papan dibalik, langkah berikutnya meluncur lagi (arah ikut terbalik).
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 b - - 1 1", orientasi: "b" });
await aturPosisi({ fen: "5k2/5ppp/8/8/8/8/5PPP/1R4K1 w - - 2 2", orientasi: "b" });
{
  const panggilan = catatan[0];
  uji("langkah pada papan terbalik tetap meluncur", catatan.length === 1 && panggilan?.petak === "f8");
}

// Rokade: dua bidak meluncur dalam satu perubahan FEN.
await aturPosisi({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1", orientasi: "w" });
await aturPosisi({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1RK1 b kq - 1 1", orientasi: "w" });
{
  const petak = catatan.map((c) => c.petak).sort();
  uji(
    "rokade menganimasikan raja dan benteng",
    catatan.length === 2 && petak[0] === "f1" && petak[1] === "g1",
    JSON.stringify(petak)
  );
}

/* =================== C. mode Manusia vs Mesin (jsdom) =================== */

/*
 * Mode Manusia vs Mesin memakai papan yang sama, tetapi alurnya sendiri:
 * langkah pemain lewat klik ATAU seret, dan langkah mesin dijalankan sebagai
 * "klik lawan" (src/halaman/PapanInteraktif/modus/gerakLawan.js) sebelum FEN
 * berganti. Uji ini memasang mesin UCI palsu lalu memeriksa bidak benar-benar
 * meluncur di mode itu — termasuk aturan bahwa bidak yang DISERET pemain tidak
 * diluncurkan ulang, sementara balasan mesin tetap meluncur.
 */

console.log("\nC. mode Manusia vs Mesin");

const MASUK_PVE = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/i18n.jsx";
import ManusiaVsMesin from "./src/halaman/PapanInteraktif/modus/ManusiaVsMesin.jsx";

export function mountPve(el) {
  return createRoot(el).render(
    <I18nProvider>
      <ManusiaVsMesin />
    </I18nProvider>
  );
}
`;

const berkasPve = path.join(tmpdir(), "kci-uji-animasi-pve.cjs");
await build({
  stdin: {
    contents: MASUK_PVE,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-animasi-pve-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasPve,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "empty" },
  banner: { js: "function __globPalsu() { return {}; }" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    "import.meta.glob": "__globPalsu",
  },
  logLevel: "error",
});

/**
 * Mesin UCI palsu — jawabannya dipilih dari FEN supaya selalu SAH: 1...e5
 * selama pion e7 masih di tempat, sesudah itu 2...Nc6.
 */
class MesinPalsu {
  postMessage(perintah) {
    const cmd = String(perintah);
    if (cmd === "uci") {
      this.kirim("id name MesinUji");
      this.kirim("uciok");
      return;
    }
    if (cmd === "isready") {
      this.kirim("readyok");
      return;
    }
    if (cmd.startsWith("position fen ")) {
      this.fen = cmd.slice("position fen ".length).trim();
      return;
    }
    if (cmd.startsWith("go")) {
      const langkah = String(this.fen || "").includes("4p3") ? "b8c6" : "e7e5";
      this.timer = setTimeout(() => {
        this.kirim(`info depth 8 score cp 20 pv ${langkah}`);
        this.kirim(`bestmove ${langkah}`);
      }, 10);
    }
  }
  kirim(baris) {
    this.onmessage?.({ data: baris });
  }
  terminate() {
    clearTimeout(this.timer);
  }
  addEventListener() {}
  removeEventListener() {}
}

window.Worker = MesinPalsu;
globalThis.Worker = MesinPalsu;

/** Petak di titik layar — jsdom tidak punya tata letak, jadi dihitung sendiri. */
function pasangElementFromPoint(papan) {
  window.document.elementFromPoint = (x, y) => {
    const kolom = Math.floor(x / (UKURAN / 8));
    const baris = Math.floor(y / (UKURAN / 8));
    if (kolom < 0 || kolom > 7 || baris < 0 || baris > 7) return null;
    const sq = "abcdefgh"[kolom] + (8 - baris);
    return papan.querySelector(`[data-petak="${sq}"]`);
  };
}

/** Titik tengah sebuah petak pada tata letak sintetis (papan 640px). */
function titikPetak(sq) {
  const kolom = "abcdefgh".indexOf(sq[0]);
  const baris = 8 - Number(sq[1]);
  const kotak = UKURAN / 8;
  return { x: kolom * kotak + kotak / 2, y: baris * kotak + kotak / 2 };
}

function kirimEvent(el, jenis, titik, tambahan = {}) {
  el.dispatchEvent(
    new window.MouseEvent(jenis, {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: titik.x,
      clientY: titik.y,
      ...tambahan,
    })
  );
}

const wadahPve = window.document.createElement("div");
window.document.body.appendChild(wadahPve);
const modulPve = require(berkasPve);
modulPve.mountPve(wadahPve);
await tunggu(120);

const tombolMulai = [...wadahPve.querySelectorAll("button")].find(
  (b) => b.textContent.trim() === "Mulai partai"
);
uji("tombol mulai partai ada", !!tombolMulai);
tombolMulai?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await tunggu(60);

uji("papan mode Manusia vs Mesin ter-render", wadahPve.querySelectorAll("[data-petak]").length === 64);
pasangElementFromPoint(wadahPve);

const petakPve = (sq) => wadahPve.querySelector(`[data-petak="${sq}"]`);

// 1. Langkah pemain lewat KLIK petak (keluhan asli: "klik move langsung blink").
catatan.length = 0;
petakPve("e2")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await tunggu(20);
petakPve("e4")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await tunggu(40);
{
  const panggilan = catatan.filter((c) => c.petak === "e4");
  uji(
    "klik move pemain meluncurkan bidak ke e4",
    panggilan.length === 1,
    `${catatan.length} panggilan: ${JSON.stringify(catatan.map((c) => c.petak))}`
  );
  const awal = panggilan[0]?.keyframes?.[0]?.transform || "";
  uji("luncuran pemain dimulai dari e2 (160px di bawah)", awal.includes("160px"), awal);
}

// 2. Balasan mesin (lewat "klik lawan" + jeda acak 180-320 ms) juga meluncur.
catatan.length = 0;
await tunggu(700);
{
  const panggilan = catatan.filter((c) => c.petak === "e5");
  uji(
    "balasan mesin meluncur ke e5",
    panggilan.length === 1,
    `${catatan.length} panggilan: ${JSON.stringify(catatan.map((c) => c.petak))}`
  );
}

// 3. Langkah pemain lewat SERET: bidaknya sudah dilepas di petak tujuan, jadi
//    tidak diluncurkan ulang — tetapi balasan mesin berikutnya tetap meluncur.
catatan.length = 0;
kirimEvent(petakPve("g1"), "pointerdown", titikPetak("g1"));
await tunggu(20);
kirimEvent(petakPve("f3"), "pointermove", titikPetak("f3"), { buttons: 1 });
kirimEvent(petakPve("f3"), "pointerup", titikPetak("f3"));
await tunggu(60);
{
  const diseret = catatan.filter((c) => c.petak === "f3");
  const pindah = wadahPve.querySelector('[data-petak="f3"] [data-bidak]');
  uji("seret benar-benar menjalankan langkah (kuda sampai di f3)", !!pindah);
  uji(
    "bidak yang diseret tidak diluncurkan ulang",
    diseret.length === 0,
    JSON.stringify(catatan.map((c) => c.petak))
  );
}

catatan.length = 0;
await tunggu(700);
uji(
  "balasan mesin setelah seret tetap meluncur (Nc6)",
  catatan.some((c) => c.petak === "c6"),
  JSON.stringify(catatan.map((c) => c.petak))
);

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
