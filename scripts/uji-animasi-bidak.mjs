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
 *   A2. Penjaga statis "anti-roket": setiap papan yang menggerakkan bidak wajib
 *      membaca `GESER_ISEPIC` (300 ms, ease) dan tidak boleh memakai animasi
 *      150 ms / kurva linear — gaya yang dulu membuat bidak melesat kaku.
 *
 * Bagian B gagal keras bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-animasi-bidak.mjs  |  npm run uji:animasi-bidak
 */
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";

import {
  DURASI_GESER,
  DURASI_GESER_MINIM,
  GAYA_ANALISA,
  GESER_ISEPIC,
  KURVA_GESER,
  durasiGeser,
  geseranDariFen,
  geseranDenganAsalEksplisit,
  konfigurasiGeser,
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
  // Kecepatan luncuran: persis referensi isepic-chess-ui (animationTime: 300).
  uji("durasi bawaan persis isepic (300 ms)", DURASI_GESER === 300, String(DURASI_GESER));
  uji("kurva bawaan = easing CSS bawaan (ease)", KURVA_GESER === "ease", KURVA_GESER);
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

{
  // Asal eksplisit (konsep isepic: langkah membawa from/to): cocok dengan
  // simpulan FEN → simpulan dipakai (rokade membawa benteng pendamping);
  // basi → simpulan FEN tetap menang.
  const cocok = geseranDenganAsalEksplisit(AWAL, SETELAH_E4, { from: "e2", to: "e4" });
  uji(
    "asal eksplisit cocok → satu luncuran e2→e4",
    cocok.length === 1 && cocok[0].dari === "e2" && cocok[0].ke === "e4",
    JSON.stringify(cocok)
  );
  const basi = geseranDenganAsalEksplisit(AWAL, SETELAH_E4, { from: "g1", to: "f3" });
  uji(
    "asal eksplisit basi → simpulan FEN yang dipakai",
    basi.length === 1 && basi[0].dari === "e2" && basi[0].ke === "e4",
    JSON.stringify(basi)
  );
  const rokadeSebelum = "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1";
  const rokadeSesudah = "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4RK1 b kq - 1 1";
  const rokade = geseranDenganAsalEksplisit(rokadeSebelum, rokadeSesudah, { from: "e1", to: "g1" });
  uji(
    "asal eksplisit rokade → raja + benteng pendamping",
    rokade.length === 2 && rokade.some((g) => g.dari === "e1" && g.ke === "g1") && rokade.some((g) => g.dari === "h1" && g.ke === "f1"),
    JSON.stringify(rokade)
  );
  uji(
    "tanpa asal eksplisit → sama dengan simpulan FEN",
    JSON.stringify(geseranDenganAsalEksplisit(AWAL, SETELAH_E4, null)) === JSON.stringify(geseranDariFen(AWAL, SETELAH_E4))
  );
}

{
  // Gaya analisa (Report Analisa): 150 ms linear, tanpa pudar — tetap tersedia
  // lewat prop gayaGeser, tidak dipakai halaman mana pun.
  const analisa = konfigurasiGeser("analisa");
  uji("gaya analisa warisan: 150 ms linear tanpa pudar", analisa.durasi === 150 && analisa.kurva === "linear" && analisa.pudar === false, JSON.stringify(analisa));
  uji("gaya analisa cocok dengan konstanta GAYA_ANALISA", analisa.durasi === GAYA_ANALISA.durasi && analisa.kurva === GAYA_ANALISA.kurva);
  const bawaan = konfigurasiGeser("bawaan");
  uji(
    "gaya bawaan: 300 ms ease tanpa pudar (pola Report Analisa)",
    bawaan.durasi === DURASI_GESER && bawaan.kurva === "ease" && bawaan.pudar === false,
    JSON.stringify(bawaan)
  );
  uji(
    "GESER_ISEPIC (sumber tunggal semua papan): 300 ms ease",
    GESER_ISEPIC.durasi === 300 && GESER_ISEPIC.kurva === "ease",
    JSON.stringify(GESER_ISEPIC)
  );
}

/* ============ A2. penjaga "roket": setiap papan wajib selambat isepic ========
 *
 * Latar: pada 8 Okt 2026 papan-papan diubah memakai gaya Report Analisa
 * (150 ms `linear`) sehingga bidak terasa "melesat seperti roket, kaku".
 * Gaya itu dibalik 15 Okt 2026, tetapi papan Report Analisa sendiri masih
 * tertinggal di 150 ms sampai penjaga ini ditulis.
 *
 * Uji ini membaca SUMBER setiap papan yang menggerakkan bidak dan menolak:
 *   1. animasi bidak dengan durasi < 300 ms;
 *   2. kurva `linear` pada animasi bidak (kaku, tanpa melandai);
 *   3. halaman yang memaksa prop `gayaGeser="analisa"` ke papan bersama.
 * Penjaga STATIS ini melengkapi uji render di bawah: render membuktikan
 * papan memakai transisi 300 ms `ease`, penjaga ini memastikan tidak ada
 * papan lain yang menyimpang dari sumber tunggal `GESER_ISEPIC`.
 */

console.log("\nA2. penjaga kecepatan luncuran bidak (anti-roket)");

/** Semua berkas papan yang menggerakkan bidak + halaman pemakainya. */
const BERKAS_PAPAN = [
  "src/halaman/TekaTeki/PapanTekaTeki.jsx",
  "src/halaman/Analisa/komponen/game/board.jsx",
];

for (const berkas of BERKAS_PAPAN) {
  const sumber = readFileSync(path.join(ROOT, berkas), "utf8");
  const durasi150 = /duration:\s*150\b/.test(sumber);
  const linear = /easing:\s*"linear"/.test(sumber);
  uji(`${berkas}: tidak ada animasi bidak 150 ms`, !durasi150);
  uji(`${berkas}: tidak ada animasi bidak berkurva linear`, !linear);
  uji(
    `${berkas}: membaca sumber tunggal GESER_ISEPIC`,
    /GESER_ISEPIC/.test(sumber),
    "konstanta GESER_ISEPIC tidak dipakai di berkas ini"
  );
}

{
  // Halaman mana pun yang memaksa gaya "analisa" ke papan bersama = roket.
  const pemaksa = [];
  const tumpuk = ["src"];
  while (tumpuk.length) {
    const dir = tumpuk.pop();
    for (const isi of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const jalur = `${dir}/${isi.name}`;
      if (isi.isDirectory()) {
        tumpuk.push(jalur);
        continue;
      }
      if (!/\.(jsx?|mjs)$/.test(isi.name)) continue;
      const teks = readFileSync(path.join(ROOT, jalur), "utf8");
      if (/gayaGeser\s*=\s*"analisa"/.test(teks)) pemaksa.push(jalur);
    }
  }
  uji(
    'tidak ada halaman yang memaksa gayaGeser="analisa" (gaya roket)',
    pemaksa.length === 0,
    pemaksa.join(", ")
  );
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
  console.log("\nB. GAGAL — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(1);
}

console.log("\nB. papan PapanTekaTeki di atas jsdom");

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
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
        langkahAkhir={posisi.langkahAkhir || null}
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
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
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
// Rect per elemen dihitung dari petaknya: papan penuh 640px, petak 80px,
// bidak ([data-bidak]) kotak 88% terpusat di dalam petaknya — supaya
// pengukuran DOM pola `animateMove` (asal & tujuan) bisa diperiksa.
window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  const petakEl = this.closest?.("[data-petak]");
  if (petakEl) {
    const sq = petakEl.getAttribute("data-petak");
    const kiri = "abcdefgh".indexOf(sq[0]) * 80;
    const atas = (8 - Number(sq[1])) * 80;
    if (this.hasAttribute?.("data-bidak")) {
      return { x: kiri + 4.8, y: atas + 4.8, left: kiri + 4.8, top: atas + 4.8, right: kiri + 75.2, bottom: atas + 75.2, width: 70.4, height: 70.4 };
    }
    return { x: kiri, y: atas, left: kiri, top: atas, right: kiri + 80, bottom: atas + 80, width: 80, height: 80 };
  }
  return { x: 0, y: 0, left: 0, top: 0, right: UKURAN, bottom: UKURAN, width: UKURAN, height: UKURAN };
};

/**
 * Catatan setiap pemanggilan `element.animate()` — mekanisme luncuran kini
 * pola `animateMove` papan Report Analisa: elemen bidak ASLI yang sudah
 * dirender React di petak TUJUAN digeser dengan Web Animations API, tanpa klon.
 * `petak` = petak induk elemen bidak, `bidak` = huruf bidaknya.
 */
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

/**
 * Tunggu sampai `syarat()` benar, paling lama `batas` ms.
 *
 * Dipakai untuk menunggu balasan mesin: waktunya tidak pasti (pencarian engine
 * palsu + render React), dan runner CI jauh lebih lambat dari mesin pengembang.
 */
async function tungguSampai(syarat, batas = 8000, langkah = 25) {
  const tenggat = Date.now() + batas;
  while (Date.now() < tenggat) {
    if (syarat()) return true;
    await tunggu(langkah);
  }
  return syarat();
}

/** Bidak yang saat ini disembunyikan di sebuah papan — harus selalu kosong. */
const bidakTersembunyi = (wadahEl) =>
  [...wadahEl.querySelectorAll("[data-bidak]")].filter((el) => el.style.visibility === "hidden");

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

// Langkah biasa (e2-e4): satu animasi pada bidak ASLI di petak tujuan.
await aturPosisi({ fen: SETELAH_E4, orientasi: "w", langkahAkhir: { from: "e2", to: "e4" } });
{
  uji("langkah e2-e4 membuat tepat satu animasi", catatan.length === 1, `${catatan.length} animasi`);
  const a = catatan[0];
  uji(
    "animasi dijalankan pada bidak di petak tujuan e4 (huruf P)",
    a?.petak === "e4" && a?.bidak === "P",
    `${a?.petak}/${a?.bidak}`
  );
  uji(
    "durasi & kurva = GESER_ISEPIC (300 ms, ease)",
    a?.opsi?.duration === 300 && a?.opsi?.easing === "ease",
    JSON.stringify(a?.opsi)
  );
  // Petak e2 = (320, 480) dan e4 = (320, 320): elemen di e4 digeser ke posisi e2.
  uji(
    "bidak mulai dari petak asal e2 (translate 0px, 160px)",
    a?.keyframes?.[0]?.transform === "translate(0px, 160px)",
    JSON.stringify(a?.keyframes?.[0])
  );
  uji(
    "bidak berakhir di posisinya sendiri (translate 0px, 0px)",
    a?.keyframes?.[1]?.transform === "translate(0px, 0px)",
    JSON.stringify(a?.keyframes?.[1])
  );
  uji(
    "tidak ada elemen klon penerbangan (mekanisme lama sudah dibuang)",
    window.document.querySelectorAll("[data-klon-terbang]").length === 0
  );
  uji("tidak ada bidak yang disembunyikan selama luncuran", bidakTersembunyi(wadah).length === 0);
  uji(
    "pion hanya ada di e4, tidak ada sisa di e2",
    !!wadah.querySelector('[data-petak="e4"] [data-bidak]') && !wadah.querySelector('[data-petak="e2"] [data-bidak]')
  );
}

// Posisi diganti sepenuhnya (soal baru / muat FEN) → langsung, tanpa luncuran.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", orientasi: "w" });
uji("ganti posisi tidak menganimasikan", catatan.length === 0, `${catatan.length} animasi`);

// Papan dibalik bersamaan dengan perubahan posisi → tidak menganimasikan.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 b - - 1 1", orientasi: "b" });
uji("papan dibalik tidak menganimasikan", catatan.length === 0, `${catatan.length} animasi`);

// Setelah papan dibalik, langkah berikutnya tetap beranimasi.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 b - - 1 1", orientasi: "b" });
await aturPosisi({ fen: "5k2/5ppp/8/8/8/8/5PPP/1R4K1 w - - 2 2", orientasi: "b" });
uji(
  "langkah pada papan terbalik tetap beranimasi (tujuan f8)",
  catatan.length === 1 && catatan[0]?.petak === "f8",
  JSON.stringify(catatan.map((c) => c.petak))
);

// Rokade: dua bidak beranimasi dalam satu perubahan FEN.
await aturPosisi({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1", orientasi: "w" });
await aturPosisi({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1RK1 b kq - 1 1", orientasi: "w" });
{
  const petak = catatan.map((c) => c.petak).sort();
  uji(
    "rokade menganimasikan raja dan benteng (dua animasi: f1 & g1)",
    petak.length === 2 && petak[0] === "f1" && petak[1] === "g1",
    JSON.stringify(petak)
  );
}

/* =================== C. mode Manusia vs Mesin (jsdom) =================== */

/*
 * Mode Manusia vs Mesin memakai papan yang sama, tetapi alurnya sendiri:
 * langkah pemain lewat klik ATAU seret, dan langkah mesin langsung dijalankan
 * begitu hasil pencarian selesai. Uji ini memasang mesin UCI palsu lalu
 * memeriksa bidak benar-benar meluncur di mode itu — termasuk aturan bahwa
 * bidak yang DISERET pemain tidak diluncurkan ulang, sementara balasan mesin
 * tetap meluncur.
 */

console.log("\nC. mode Manusia vs Mesin");

const MASUK_PVE = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import ManusiaVsMesin from "./src/halaman/ManusiaVsMesin/ManusiaVsMesin.jsx";

export function mountPve(el) {
  return createRoot(el).render(
    // MemoryRouter: sidebar halaman memakai <Link> React Router.
    <MemoryRouter initialEntries={["/papan-interaktif/manusia-vs-mesin"]}>
      <I18nProvider>
        <ManusiaVsMesin />
      </I18nProvider>
    </MemoryRouter>
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
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
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
// Langkah mesin langsung dijalankan tanpa jeda gestur — bagian ini murni
// mengukur animasi luncuran, bukan lamanya mesin berpikir.
modulPve.mountPve(wadahPve);
const cariMulai = () =>
  // Label tombol mulai mengikuti kamus `pveMulai` ("Main").
  [...wadahPve.querySelectorAll("button")].find((b) => b.textContent.trim() === "Main");
await tungguSampai(() => !!cariMulai());

const tombolMulai = cariMulai();
uji("tombol main ada", !!tombolMulai);
tombolMulai?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await tungguSampai(() => wadahPve.querySelectorAll("[data-petak]").length === 64);

uji("papan mode Manusia vs Mesin ter-render", wadahPve.querySelectorAll("[data-petak]").length === 64);
uji(
  "bilah evaluasi tampil di kiri papan mode Manusia vs Mesin",
  !!wadahPve.querySelector("[data-bilah-evaluasi]")
);
await tungguSampai(
  () => !wadahPve.querySelector("[data-bilah-evaluasi]")?.getAttribute("aria-label")?.includes("—")
);
uji(
  "bilah evaluasi menerima skor nyata dari worker Stockfish terpisah",
  /[+-]\d/.test(wadahPve.querySelector("[data-bilah-evaluasi]")?.getAttribute("aria-label") || "")
);
pasangElementFromPoint(wadahPve);

const petakPve = (sq) => wadahPve.querySelector(`[data-petak="${sq}"]`);

// 1. Langkah pemain lewat KLIK petak.
catatan.length = 0;
petakPve("e2")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
// Tunggu sorotan kuning petak terpilih muncul, bukan menebak dengan jeda tetap.
await tungguSampai(() => !!wadahPve.querySelector('[data-petak="e2"] span[style*="255, 255, 0"]'), 2000);
petakPve("e4")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await tungguSampai(() => catatan.some((c) => c.petak === "e4"), 2000);
{
  const animE4 = catatan.filter((c) => c.petak === "e4");
  uji(
    "klik move pemain menganimasikan bidak ke e4",
    animE4.length === 1,
    JSON.stringify(catatan.map((c) => c.petak))
  );
  uji("bidak yang dianimasikan adalah pion kita (P), bukan bidak lawan", animE4[0]?.bidak === "P", animE4[0]?.bidak);
  uji(
    "luncuran pemain 300 ms ease",
    animE4[0]?.opsi?.duration === 300 && animE4[0]?.opsi?.easing === "ease",
    JSON.stringify(animE4[0]?.opsi)
  );
}

// 2. Balasan mesin (langsung, tanpa jeda gestur) juga meluncur.
catatan.length = 0;
await tungguSampai(() => catatan.some((c) => c.petak === "e5"), 4000);
{
  const animE5 = catatan.filter((c) => c.petak === "e5");
  uji(
    "balasan mesin menganimasikan bidak ke e5",
    animE5.length === 1,
    JSON.stringify(catatan.map((c) => c.petak))
  );
  uji("bidak mesin yang dianimasikan adalah pion hitam (p)", animE5[0]?.bidak === "p", animE5[0]?.bidak);
}

// 3. Langkah pemain lewat SERET: bidaknya sudah dilepas di petak tujuan, jadi
//    tidak dianimasikan ulang — tetapi balasan mesin berikutnya tetap meluncur.
catatan.length = 0;
kirimEvent(petakPve("g1"), "pointerdown", titikPetak("g1"));
await tunggu(20);
kirimEvent(petakPve("f3"), "pointermove", titikPetak("f3"), { buttons: 1 });
kirimEvent(petakPve("f3"), "pointerup", titikPetak("f3"));
await tungguSampai(() => catatan.some((c) => c.petak === "c6"), 4000);
{
  uji(
    "seret benar-benar menjalankan langkah (kuda sampai di f3)",
    !!wadahPve.querySelector('[data-petak="f3"] [data-bidak]')
  );
  uji(
    "bidak yang diseret tidak dianimasikan ulang (tanpa animasi ke f3)",
    !catatan.some((c) => c.petak === "f3"),
    JSON.stringify(catatan.map((c) => c.petak))
  );
  uji(
    "balasan mesin setelah seret tetap beranimasi (Nc6)",
    catatan.some((c) => c.petak === "c6"),
    JSON.stringify(catatan.map((c) => c.petak))
  );
}

/* ============ D. lewat KLIK: tepat satu animasi per langkah ============ */

console.log("\nD. jalur klik: satu langkah = tepat satu animasi");

const MASUK_KLIK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { Chess } from "chess.js";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";

/** Harness seperti halaman asli: klik = pilih lalu langkah (aturan chess.js). */
export function mountPapanKlik(el, { fen }) {
  const game = new Chess(fen);
  function Harness() {
    const [pos, setPos] = React.useState({ fen: game.fen(), terpilih: null, sasaran: [], langkahAkhir: null });
    const klik = (sq) => {
      if (pos.terpilih) {
        const sah = game.moves({ square: pos.terpilih, verbose: true }).find((m) => m.to === sq);
        if (sah) {
          const m = game.move({ from: pos.terpilih, to: sq });
          setPos({ fen: game.fen(), terpilih: null, sasaran: [], langkahAkhir: { from: m.from, to: m.to } });
          return;
        }
      }
      const bidak = game.get(sq);
      if (bidak && bidak.color === game.turn()) {
        setPos({ ...pos, terpilih: sq, sasaran: game.moves({ square: sq, verbose: true }).map((m) => m.to) });
      } else {
        setPos({ ...pos, terpilih: null, sasaran: [] });
      }
    };
    return (
      <PapanTekaTeki
        fen={pos.fen}
        orientasi="w"
        terpilih={pos.terpilih}
        sasaran={pos.sasaran}
        langkahAkhir={pos.langkahAkhir}
        onKlik={klik}
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

const berkasKlik = path.join(tmpdir(), "kci-uji-animasi-klik.cjs");
await build({
  stdin: { contents: MASUK_KLIK, resolveDir: ROOT, loader: "jsx", sourcefile: "uji-animasi-klik-entry.jsx" },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasKlik,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "empty" },
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

const wadahKlik = window.document.createElement("div");
window.document.body.appendChild(wadahKlik);
const modulKlik = require(berkasKlik);
modulKlik.mountPapanKlik(wadahKlik, { fen: AWAL });
await tungguSampai(() => wadahKlik.querySelectorAll("[data-petak]").length === 64);

const klikPetak = (sq) => {
  const el = wadahKlik.querySelector(`[data-petak="${sq}"]`);
  el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
};

uji("harness klik ter-render (64 petak)", wadahKlik.querySelectorAll("[data-petak]").length === 64);

// Klik e2 (pilih) lalu e4 (langkah): tepat satu animasi ke e4.
catatan.length = 0;
klikPetak("e2");
await tunggu(60);
uji("klik petak asal belum menganimasikan apa pun", catatan.length === 0, `${catatan.length} animasi`);
klikPetak("e4");
await tungguSampai(() => wadahKlik.querySelector('[data-petak="e4"] [data-bidak]'), 2000);
{
  uji(
    "langkah lewat klik menganimasikan tepat satu kali ke e4",
    catatan.filter((c) => c.petak === "e4").length === 1,
    JSON.stringify(catatan.map((c) => c.petak))
  );
  uji("tidak ada bidak tersembunyi yang tertinggal", bidakTersembunyi(wadahKlik).length === 0);
}

// Klik DOBEL di petak tujuan: tetap satu langkah, tidak menambah animasi.
{
  catatan.length = 0;
  klikPetak("e4"); // klik kedua — kini giliran hitam, jadi sekadar memilih-kosong
  await tunggu(80);
  uji(
    "klik dobel di petak tujuan tidak menambah animasi langkah",
    catatan.filter((c) => c.petak === "e4").length === 0,
    JSON.stringify(catatan.map((c) => c.petak))
  );
}

// Klik petak tak sah: tidak ada animasi, tidak ada bidak tersembunyi.
catatan.length = 0;
klikPetak("a1");
await tunggu(60);
uji("klik petak kosong tak sah tidak menganimasikan bidak", catatan.length === 0, `${catatan.length} animasi`);
uji(
  "bidak di a1 tetap tampil setelah klik tak sah",
  wadahKlik.querySelector('[data-petak="a1"] [data-bidak]')?.style?.visibility !== "hidden"
);

/* ============ E. langkah DITOLAK induk (salah/blunder) ============
 *
 * Langkah ditolak berarti FEN TIDAK berubah, jadi tidak ada animasi sama sekali
 * dan tidak boleh ada bidak yang tertinggal tersembunyi.
 */

console.log("\nE. langkah ditolak induk: tidak ada yang tertinggal");

const MASUK_DITOLAK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { Chess } from "chess.js";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";

/**
 * Induk tiruan yang MENOLAK langkah — persis cabang "salah" di halaman
 * Teka-Teki: posisi TIDAK berubah, pilihan dibersihkan, petak asal+tujuan
 * diberi tanda salah.
 */
export function mountPapanDitolak(el, { fen }) {
  function Harness() {
    const [pos, setPos] = React.useState({ terpilih: null, sasaran: [], kesalahan: null });
    const klik = (sq) => {
      if (pos.terpilih) {
        setPos({ terpilih: null, sasaran: [], kesalahan: { from: pos.terpilih, to: sq } });
        return;
      }
      const game = new Chess(fen);
      const bidak = game.get(sq);
      if (bidak && bidak.color === game.turn()) {
        setPos({ terpilih: sq, sasaran: game.moves({ square: sq, verbose: true }).map((m) => m.to), kesalahan: null });
      } else {
        setPos({ terpilih: null, sasaran: [], kesalahan: null });
      }
    };
    return (
      <PapanTekaTeki
        fen={fen}
        orientasi="w"
        terpilih={pos.terpilih}
        sasaran={pos.sasaran}
        kesalahan={pos.kesalahan}
        onKlik={klik}
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

const berkasDitolak = path.join(tmpdir(), "uji-animasi-ditolak.cjs");
await build({
  stdin: { contents: MASUK_DITOLAK, resolveDir: ROOT, loader: "jsx", sourcefile: "uji-animasi-ditolak.jsx" },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasDitolak,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "empty" },
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

const wadahDitolak = window.document.createElement("div");
window.document.body.appendChild(wadahDitolak);
const modulDitolak = require(berkasDitolak);
modulDitolak.mountPapanDitolak(wadahDitolak, { fen: AWAL });
await tungguSampai(() => wadahDitolak.querySelectorAll("[data-petak]").length === 64);

const klikDitolak = (sq) => {
  const el = wadahDitolak.querySelector(`[data-petak="${sq}"]`);
  el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
};

klikDitolak("e2");
await tunggu(60);
catatan.length = 0;
klikDitolak("e4");
await tunggu(80);
uji("langkah ditolak tidak menganimasikan apa pun", catatan.length === 0, JSON.stringify(catatan.map((c) => c.petak)));
uji(
  "bidak di petak asal e2 terlihat lagi",
  wadahDitolak.querySelector('[data-petak="e2"] [data-bidak]')?.style?.visibility === ""
);
uji(
  "tidak ada bidak tersembunyi yang tertinggal di papan",
  bidakTersembunyi(wadahDitolak).length === 0,
  bidakTersembunyi(wadahDitolak).map((el) => el.getAttribute("data-bidak")).join(", ")
);

/* ============ F. langkah TANGKAP: yang dianimasikan bidak kita ============
 *
 * Luncuran memakai elemen bidak ASLI di petak tujuan. Pada langkah tangkap,
 * setelah FEN baru dirender petak tujuan berisi bidak KITA — jadi yang meluncur
 * adalah bidak kita, bukan gambar bidak lawan yang baru saja dimakan. Bidak
 * lawan tetap tampil sebagai rangka sementara (`data-tertangkap`) sampai
 * penyerang mendarat.
 */

console.log("\nF. langkah tangkap: yang dianimasikan bidak kita");

{
  const FEN_TANGKAP = "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w - - 0 2";
  const wadahTangkap = window.document.createElement("div");
  window.document.body.appendChild(wadahTangkap);
  const modulTangkap = require(berkasKlik);
  modulTangkap.mountPapanKlik(wadahTangkap, { fen: FEN_TANGKAP });
  await tungguSampai(() => wadahTangkap.querySelectorAll("[data-petak]").length === 64);

  // Stub `animate` yang TIDAK langsung selesai, supaya keadaan "sedang meluncur"
  // (rangka bidak termakan) bisa diperiksa sebelum penyerang mendarat.
  const animateAsli = window.Element.prototype.animate;
  const tertunda = [];
  window.Element.prototype.animate = function animate(keyframes, opsi) {
    catatan.push({
      petak: this.closest("[data-petak]")?.getAttribute("data-petak") || null,
      bidak: this.getAttribute("data-bidak"),
      keyframes,
      opsi,
    });
    let selesai = () => {};
    const finished = new Promise((r) => {
      selesai = r;
    });
    const obj = { finished, cancel() {}, set oncancel(_) {}, selesai };
    tertunda.push(obj);
    return obj;
  };

  const klikTangkap = (sq) => {
    const el = wadahTangkap.querySelector(`[data-petak="${sq}"]`);
    el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  };
  catatan.length = 0;
  klikTangkap("e4");
  await tunggu(60);
  klikTangkap("d5");
  await tungguSampai(
    () => wadahTangkap.querySelector('[data-petak="d5"] [data-bidak]')?.getAttribute("data-bidak") === "P",
    2000
  );
  {
    const anim = catatan.filter((c) => c.petak === "d5");
    const rangka = wadahTangkap.querySelector('[data-petak="d5"] [data-tertangkap]');
    uji(
      "tangkap: tepat satu animasi ke petak tujuan d5",
      anim.length === 1,
      JSON.stringify(catatan.map((c) => c.petak))
    );
    uji(
      "tangkap: yang dianimasikan bidak KITA (P), bukan bidak lawan (p)",
      anim[0]?.bidak === "P",
      anim[0]?.bidak
    );
    uji("tangkap: bidak lawan tetap tampil selama penyerang meluncur", !!rangka);
    uji(
      "tangkap: rangka menampilkan bidak yang dimakan (p)",
      rangka?.getAttribute("data-tertangkap") === "p",
      rangka?.getAttribute("data-tertangkap")
    );
    uji(
      "tangkap: bidak kita berakhir di d5",
      wadahTangkap.querySelector('[data-petak="d5"] [data-bidak]')?.getAttribute("data-bidak") === "P"
    );
  }

  // Penyerang mendarat: rangka bidak lawan dilepas.
  for (const obj of tertunda) obj.selesai();
  await tunggu(60);
  uji(
    "tangkap: rangka bidak lawan dilepas setelah penyerang mendarat",
    !wadahTangkap.querySelector("[data-tertangkap]")
  );
  uji(
    "tangkap: tidak ada bidak tersembunyi yang tertinggal",
    bidakTersembunyi(wadahTangkap).length === 0
  );

  window.Element.prototype.animate = animateAsli;
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);

