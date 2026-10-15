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
// 1. e4 e6 — dipakai untuk menguji balasan cepat (mesin/autoplay) yang tiba
// saat luncuran pemain masih di udara.
const SETELAH_E4_E6 = "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";

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
    "gaya bawaan persis isepic: 300 ms ease tanpa pudar",
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
// pengukuran DOM pola isepic (asal/tujuan/elemen asli) bisa diperiksa.
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
 * Semua klon bidak terbang milik sebuah papan.
 *
 * Klon penerbangan sengaja ditempel di `document.body` (posisi `fixed`, pola
 * isepic: tidak ikut tata letak kisi papan) dan ditandai `data-papan-terbang`
 * dengan id papan pemiliknya — jadi di dokumen yang punya dua papan (ui utama
 * + Manusia vs Mesin) klon tidak tertukar.
 */
const klonTerbang = (wadahEl) => {
  const id = wadahEl.querySelector("[data-papan]")?.getAttribute("data-papan");
  if (!id) return [];
  return [...wadahEl.ownerDocument.querySelectorAll(`[data-papan-terbang="${id}"]`)];
};
/**
 * Hitung setiap klon penerbangan yang DITAMBAHKAN ke dokumen, per petak tujuan.
 *
 * Uji lain hanya melihat "berapa klon yang ada sekarang" — cukup untuk
 * memastikan tidak ada klon ganda SESUAI, tapi buta terhadap klon kedua yang
 * muncul sesaat lalu hilang sendiri (mis. dibuat ulang saat posisi baru
 * dirender, lalu dibersihkan jaring pengaman). Perilaku itu terlihat oleh
 * pemain sebagai "langkahnya berulang dua kali", jadi harus dihitung.
 */
function hitungPenerbangan(wadahEl) {
  const id = wadahEl.querySelector("[data-papan]")?.getAttribute("data-papan");
  const catat = { total: 0, perPetak: {}, urut: [] };
  const pengamat = new window.MutationObserver((daftar) => {
    for (const mutasi of daftar) {
      for (const simpul of mutasi.addedNodes) {
        if (simpul.nodeType !== 1) continue;
        const kePetak = simpul.getAttribute?.("data-klon-terbang");
        if (!kePetak || simpul.getAttribute("data-papan-terbang") !== id) continue;
        catat.total++;
        catat.perPetak[kePetak] = (catat.perPetak[kePetak] || 0) + 1;
        catat.urut.push(kePetak);
      }
    }
  });
  pengamat.observe(wadahEl.ownerDocument.body, { childList: true, subtree: false });
  catat.hentikan = () => pengamat.disconnect();
  return catat;
}

/** Paksa semua klon mendarat (transitionend) seperti transisi CSS selesai. */
function daratkanKlon(wadahEl) {
  for (const klon of klonTerbang(wadahEl)) klon.dispatchEvent(new window.Event("transitionend"));
}

/** Catatan setiap pemanggilan `element.animate()` beserta petak tujuannya.
 *  Bidak terbang kini klon di lapisan atas papan (pola isepic), jadi petak
 *  tujuannya dibaca dari `data-terbang-ke`, bukan dari petak induknya. */
const catatan = [];
window.Element.prototype.animate = function animate(keyframes, opsi) {
  catatan.push({
    petak:
      this.closest("[data-petak]")?.getAttribute("data-petak") ||
      this.getAttribute("data-terbang-ke") ||
      null,
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
 * palsu + gestur mesin + render React), dan runner CI jauh lebih lambat dari
 * mesin pengembang. `await tunggu(700)` yang tetap membuat uji ini kadang
 * gagal di GitHub Actions padahal lulus di lokal.
 */
async function tungguSampai(syarat, batas = 8000, langkah = 25) {
  const tenggat = Date.now() + batas;
  while (Date.now() < tenggat) {
    if (syarat()) return true;
    await tunggu(langkah);
  }
  return syarat();
}

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

await aturPosisi({ fen: SETELAH_E4, orientasi: "w", langkahAkhir: { from: "e2", to: "e4" } });
{
  const klon = klonTerbang(wadah);
  const asliE4 = wadah.querySelector('[data-petak="e4"] [data-bidak]');
  uji("langkah e2-e4 membuat tepat satu klon terbang", klon.length === 1, `${klon.length} klon`);
  uji("klon menuju petak tujuan e4 (data eksplisit e2→e4)", klon[0]?.getAttribute("data-klon-terbang") === "e4", klon[0]?.getAttribute("data-klon-terbang") || "");
  uji("klon adalah cloneNode bidak asli di e4 (huruf P)", klon[0]?.getAttribute("data-bidak") === "P", klon[0]?.getAttribute("data-bidak") || "");
  uji("bidak asli di e4 disembunyikan selama klon terbang", asliE4?.style?.visibility === "hidden", asliE4?.style?.visibility || "");
  uji(
    "durasi & kurva klon sama dengan isepic (300 ms, ease)",
    (klon[0]?.style?.transition || "").includes("300ms") &&
      (klon[0]?.style?.transition || "").includes("ease") &&
      !(klon[0]?.style?.transition || "").includes("linear"),
    klon[0]?.style?.transition || ""
  );
  uji(
    "luncuran dijalankan lewat transform (compositor), bukan top/left",
    (klon[0]?.style?.transition || "").startsWith("transform") &&
      (klon[0]?.style?.willChange || "") === "transform",
    `${klon[0]?.style?.transition} | will-change: ${klon[0]?.style?.willChange}`
  );
  uji(
    "klon position fixed dan ditempel di body (di luar kisi papan)",
    klon[0]?.style?.position === "fixed" && klon[0]?.parentElement === window.document.body,
    `${klon[0]?.style?.position} @ ${klon[0]?.parentElement?.tagName}`
  );
  uji(
    "bayangan dibuang dari klon (mahal digambar ulang tiap frame)",
    klon[0]?.style?.filter === "none",
    klon[0]?.style?.filter || ""
  );
  // Petak e2 = (320, 480) dan bidak berukuran 70,4 px terpusat → klon mulai di
  // (324.8, 484.8); bidak asli di e4 berada di (324.8, 324.8), jadi luncurannya
  // adalah translate3d(0, -160px).
  uji(
    "klon mulai tepat di bidak petak asal e2 (324.8px, 484.8px)",
    klon[0]?.style?.left === "324.8px" && klon[0]?.style?.top === "484.8px",
    `${klon[0]?.style?.left}, ${klon[0]?.style?.top}`
  );
  uji(
    "transform mengantar klon tepat ke bidak asli e4 (0, -160px)",
    /^translate3d\(0px, -160px, 0(px)?\)$/.test(klon[0]?.style?.transform || ""),
    klon[0]?.style?.transform || ""
  );
  daratkanKlon(wadah);
  uji("setelah transitionend klon dibuang", klonTerbang(wadah).length === 0);
  uji("setelah mendarat bidak asli tampil lagi", wadah.querySelector('[data-petak="e4"] [data-bidak]')?.style?.visibility === "");
}

// Balasan cepat (mesin/autoplay) TIDAK boleh memotong luncuran yang berjalan.
// Dulu setiap perubahan FEN membuang SEMUA klon terbang: luncuran 300 ms
// terpangkas di tengah (terukur di peramban sungguhan: 184 ms) sehingga bidak
// terasa "melesat" dan pendaratan lembut kurva `ease` hilang. isepic membiarkan
// tiap klon menyelesaikan 300 ms-nya sendiri.
await aturPosisi({ fen: AWAL, orientasi: "w" });
await aturPosisi({ fen: SETELAH_E4, orientasi: "w", langkahAkhir: { from: "e2", to: "e4" } });
{
  const klonE4 = klonTerbang(wadah);
  uji("balasan cepat: luncuran e2→e4 sudah di udara", klonE4.length === 1, `${klonE4.length} klon`);
  await tunggu(120); // balasan mesin tiba jauh sebelum 300 ms selesai
  await aturPosisi({ fen: SETELAH_E4_E6, orientasi: "w", langkahAkhir: { from: "e7", to: "e6" } });
  const sesudah = klonTerbang(wadah);
  uji(
    "balasan cepat TIDAK memotong luncuran yang sedang berjalan",
    sesudah.includes(klonE4[0]),
    `${sesudah.length} klon: ${sesudah.map((k) => k.getAttribute("data-klon-terbang")).join(",")}`
  );
  uji(
    "balasan mesin ikut terbang (klon e7→e6)",
    sesudah.some((k) => k.getAttribute("data-klon-terbang") === "e6"),
    sesudah.map((k) => k.getAttribute("data-klon-terbang")).join(",")
  );
  uji(
    "bidak asli di e4 dan e6 tetap tersembunyi selama kedua klon terbang",
    wadah.querySelector('[data-petak="e4"] [data-bidak]')?.style?.visibility === "hidden" &&
      wadah.querySelector('[data-petak="e6"] [data-bidak]')?.style?.visibility === "hidden"
  );
  daratkanKlon(wadah);
  uji("setelah mendarat semua klon dibuang", klonTerbang(wadah).length === 0);
  uji(
    "setelah mendarat bidak asli tampil lagi (e4 dan e6)",
    wadah.querySelector('[data-petak="e4"] [data-bidak]')?.style?.visibility === "" &&
      wadah.querySelector('[data-petak="e6"] [data-bidak]')?.style?.visibility === ""
  );
}

// Posisi diganti sepenuhnya (soal baru / muat FEN) → langsung, tanpa luncuran.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", orientasi: "w" });
uji("ganti posisi tidak menganimasikan", klonTerbang(wadah).length === 0, `${klonTerbang(wadah).length} klon`);

// Papan dibalik bersamaan dengan perubahan posisi → tidak menganimasikan.
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 b - - 1 1", orientasi: "b" });
uji("papan dibalik tidak menganimasikan", klonTerbang(wadah).length === 0, `${klonTerbang(wadah).length} klon`);

// Setelah papan dibalik, langkah berikutnya meluncur lagi (arah ikut terbalik).
await aturPosisi({ fen: "6k1/5ppp/8/8/8/8/5PPP/1R4K1 b - - 1 1", orientasi: "b" });
await aturPosisi({ fen: "5k2/5ppp/8/8/8/8/5PPP/1R4K1 w - - 2 2", orientasi: "b" });
{
  const klon = klonTerbang(wadah);
  uji("langkah pada papan terbalik tetap meluncur", klon.length === 1 && klon[0]?.getAttribute("data-klon-terbang") === "f8");
  daratkanKlon(wadah);
}

// Rokade: dua bidak meluncur dalam satu perubahan FEN.
await aturPosisi({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R w KQkq - 0 1", orientasi: "w" });
await aturPosisi({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1RK1 b kq - 1 1", orientasi: "w" });
{
  const petak = klonTerbang(wadah).map((k) => k.getAttribute("data-klon-terbang")).sort();
  uji(
    "rokade menerbangkan raja dan benteng (dua klon)",
    petak.length === 2 && petak[0] === "f1" && petak[1] === "g1",
    JSON.stringify(petak)
  );
  daratkanKlon(wadah);
}

/* =================== C. mode Manusia vs Mesin (jsdom) =================== */

/*
 * Mode Manusia vs Mesin memakai papan yang sama, tetapi alurnya sendiri:
 * langkah pemain lewat klik ATAU seret, dan langkah mesin dijalankan sebagai
 * "klik lawan" (src/halaman/ManusiaVsMesin/gerakLawan.js) sebelum FEN
 * berganti. Uji ini memasang mesin UCI palsu lalu memeriksa bidak benar-benar
 * meluncur di mode itu — termasuk aturan bahwa bidak yang DISERET pemain tidak
 * diluncurkan ulang, sementara balasan mesin tetap meluncur.
 */

console.log("\nC. mode Manusia vs Mesin");

const MASUK_PVE = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import ManusiaVsMesin from "./src/halaman/ManusiaVsMesin/ManusiaVsMesin.jsx";

export { GESTUR } from "./src/halaman/ManusiaVsMesin/gerakLawan.js";

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
  // Shim glob yang sama dengan Node loader; lihat catatan build pertama.
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
// Gestur "seperti manusia" milik mesin menunggu 2-4 detik sebelum melangkah.
// Untuk uji, jeda itu dipangkas dan gestur ragu dimatikan supaya bagian ini
// tetap mengukur animasi luncuran, bukan lamanya mesin berpikir.
modulPve.GESTUR.jedaLangkah = [10, 10];
modulPve.GESTUR.jedaRagu = [5, 5];
modulPve.GESTUR.peluangRagu = 0;
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

// 1. Langkah pemain lewat KLIK petak (keluhan asli: "klik move langsung blink").
petakPve("e2")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
// Tunggu sorotan kuning petak terpilih muncul, bukan menebak dengan jeda tetap.
await tungguSampai(() => !!wadahPve.querySelector('[data-petak="e2"] span[style*="255, 255, 0"]'), 2000);
petakPve("e4")?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await tungguSampai(() => klonTerbang(wadahPve).some((k) => k.getAttribute("data-klon-terbang") === "e4"));
{
  const klon = klonTerbang(wadahPve);
  const klonE4 = klon.filter((k) => k.getAttribute("data-klon-terbang") === "e4");
  uji(
    "klik move pemain menerbangkan tepat satu klon ke e4",
    klonE4.length === 1,
    `${klon.length} klon: ${JSON.stringify(klon.map((k) => k.getAttribute("data-klon-terbang")))}`
  );
  // Luncuran baru dipasang di frame berikutnya (sengaja: klon dicat dulu di
  // petak asal, tanpa paksa-reflow — lihat catatan di `mulaiTerbang`).
  await tungguSampai(() => (klon[0]?.style?.transition || "").includes("300ms"), 1000);
  uji(
    "klon pemain memakai luncuran transform 300 ms (durasi & kurva isepic)",
    (klon[0]?.style?.transition || "").includes("transform") &&
      (klon[0]?.style?.transition || "").includes("300ms") &&
      (klon[0]?.style?.transition || "").includes("ease"),
    klon[0]?.style?.transition || ""
  );
  uji(
    "gaya tujuan baru dipasang setelah klon dicat (bukan di handler klik)",
    (klon[0]?.style?.transform || "").includes("translate3d") &&
      (klon[0]?.style?.transform || "") !== "translate3d(0, 0, 0)",
    klon[0]?.style?.transform || ""
  );
  daratkanKlon(wadahPve);
}

// 2. Balasan mesin (klik lawan + goyang + jeda "berpikir") juga meluncur.
await tungguSampai(() => klonTerbang(wadahPve).some((k) => k.getAttribute("data-klon-terbang") === "e5"));
{
  const klon = klonTerbang(wadahPve).filter((k) => k.getAttribute("data-klon-terbang") === "e5");
  uji(
    "balasan mesin menerbangkan klon ke e5",
    klon.length === 1,
    `${klon.length} klon e5`
  );
  daratkanKlon(wadahPve);
}

// 3. Langkah pemain lewat SERET: bidaknya sudah dilepas di petak tujuan, jadi
//    tidak diterbangkan ulang — tetapi balasan mesin berikutnya tetap meluncur.
kirimEvent(petakPve("g1"), "pointerdown", titikPetak("g1"));
await tunggu(20);
kirimEvent(petakPve("f3"), "pointermove", titikPetak("f3"), { buttons: 1 });
kirimEvent(petakPve("f3"), "pointerup", titikPetak("f3"));
// Satu jendela pengamatan untuk seret DAN balasannya: dengan jeda gestur yang
// dipangkas, mesin bisa menjawab sebelum jendela kedua sempat dibuka.
await tungguSampai(() => klonTerbang(wadahPve).some((k) => k.getAttribute("data-klon-terbang") === "c6"));
{
  const diseret = klonTerbang(wadahPve).filter((k) => k.getAttribute("data-klon-terbang") === "f3");
  const pindah = wadahPve.querySelector('[data-petak="f3"] [data-bidak]');
  uji("seret benar-benar menjalankan langkah (kuda sampai di f3)", !!pindah);
  uji(
    "bidak yang diseret tidak diterbangkan ulang",
    diseret.length === 0,
    JSON.stringify(klonTerbang(wadahPve).map((k) => k.getAttribute("data-klon-terbang")))
  );
  uji(
    "balasan mesin setelah seret tetap meluncur (Nc6)",
    klonTerbang(wadahPve).some((k) => k.getAttribute("data-klon-terbang") === "c6"),
    JSON.stringify(klonTerbang(wadahPve).map((k) => k.getAttribute("data-klon-terbang")))
  );
  daratkanKlon(wadahPve);
}

/* ============ D. luncuran dimulai saat KLIK (sebelum induk memproses) ============
 *
 * Cacat yang dijaga di sini: dulu klon penerbangan baru dibuat di efek FEN,
 * yaitu SETELAH induk memproses langkah dan menjalankan pekerjaan beratnya
 * (buku pembukaan, daftar langkah, analisa). Terukur di peramban: satu tugas
 * sinkron ±200-240 ms mendarat tepat di awal luncuran, sehingga rAF hanya
 * kebagian 6-8 frame dengan lompatan 61-113 ms — mata membacanya sebagai bidak
 * MELOMPAT/teleport. isepic memulai animasinya saat mousedown petak tujuan.
 *
 * Uji ini membuktikan klon sudah ada pada saat handler induk dipanggil.
 */

console.log("\nD. luncuran mulai saat klik (harness seperti halaman asli)");

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
      // Tanda bukti per klik: berapa klon yang sudah terbang SAAT induk mulai
      // bekerja, dan petak apa yang induk lihat terpilih waktu itu. Daftar
      // (bukan satu angka) supaya klik pertama — memilih bidak — tidak terbaca
      // sebagai hasil klik langkah.
      window.__catatanKlik = window.__catatanKlik || [];
      window.__catatanKlik.push({
        sq,
        t: Math.round(performance.now()),
        klon: document.querySelectorAll("[data-klon-terbang]").length,
        terpilih: pos.terpilih,
      });
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

const MASUK_TUNDA = `
import React from "react";
import { createRoot } from "react-dom/client";
import { Chess } from "chess.js";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";

/**
 * Harness seperti HALAMAN BERAT (PapanInteraktif): klik papan langsung
 * menerbangkan bidak, tetapi posisi barunya baru diterapkan ke props setelah
 * jeda (\`tundaInduk\`) — selama jeda itu papan masih memegang props lama
 * (petak terpilih & daftar sasaran yang sudah basi).
 */
export function mountPapanKlik(el, { fen, tundaInduk = 0 }) {
  const game = new Chess(fen);
  function Harness() {
    const [pos, setPos] = React.useState({ fen: game.fen(), terpilih: null, sasaran: [], langkahAkhir: null });
    // Ref: pemrosesan yang ditunda harus membaca posisi TERBARU, bukan posisi
    // dari render saat klik terjadi.
    const posRef = React.useRef(pos);
    posRef.current = pos;

    const klik = (sq) => {
      window.__catatanKlik = window.__catatanKlik || [];
      window.__catatanKlik.push({
        sq,
        t: Math.round(performance.now()),
        tunda: tundaInduk,
        klon: document.querySelectorAll("[data-klon-terbang]").length,
        terpilih: posRef.current.terpilih,
      });
      const terapkan = () => {
        const kini = posRef.current;
        if (kini.terpilih) {
          const sah = game.moves({ square: kini.terpilih, verbose: true }).find((m) => m.to === sq);
          if (sah) {
            const m = game.move({ from: kini.terpilih, to: sq });
            setPos({ fen: game.fen(), terpilih: null, sasaran: [], langkahAkhir: { from: m.from, to: m.to } });
            return;
          }
        }
        const bidak = game.get(sq);
        if (bidak && bidak.color === game.turn()) {
          setPos({ ...kini, terpilih: sq, sasaran: game.moves({ square: sq, verbose: true }).map((m) => m.to) });
        } else {
          setPos({ ...kini, terpilih: null, sasaran: [] });
        }
      };
      // Hanya PEMROSESAN LANGKAH yang ditunda (itu bagian berat di halaman
      // asli: render panel + tata letak). Memilih bidak tetap seketika —
      // persis seperti halaman asli.
      const dipilih = posRef.current.terpilih;
      const sebuahLangkah =
        !!dipilih && game.moves({ square: dipilih, verbose: true }).some((m) => m.to === sq);
      if (tundaInduk > 0 && sebuahLangkah) window.setTimeout(terapkan, tundaInduk);
      else terapkan();
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
const berkasTunda = path.join(tmpdir(), "kci-uji-animasi-tunda.cjs");
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

await build({
  stdin: { contents: MASUK_TUNDA, resolveDir: ROOT, loader: "jsx", sourcefile: "uji-animasi-tunda-entry.jsx" },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasTunda,
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

// 1) klik petak asal: memilih, belum ada penerbangan
klikPetak("e2");
await tunggu(60);
uji("klik petak asal belum menerbangkan apa pun", klonTerbang(wadahKlik).length === 0);

// 2) klik petak tujuan: klon HARUS sudah terbang SEBELUM induk memproses
const sebelumKlik = (window.__catatanKlik || []).length;
klikPetak("e4");
{
  // (a) bukti SINKRON: tepat setelah event klik selesai, klon sudah ada —
  //     sementara induk BELUM dipanggil (pemrosesan langkah ditunda satu frame
  //     supaya klon sempat dicat di petak asal lebih dulu; kalau induk langsung
  //     bekerja, browser baru mencat klon setelah kerja beratnya selesai dan
  //     bidak terlihat "berkedip" di tempat).
  const klonSinkron = klonTerbang(wadahKlik).filter((k) => k.getAttribute("data-klon-terbang") === "e4");
  uji(
    "klon sudah terbang tepat saat klik diproses — induk belum jalan",
    klonSinkron.length === 1 && (window.__catatanKlik || []).length === sebelumKlik,
    `${klonSinkron.length} klon e4; pemanggilan induk: ${(window.__catatanKlik || []).length - sebelumKlik}`
  );

  // (b) induk menyusul di frame berikutnya, dan saat itu pun klon sudah ada.
  await tungguSampai(() => (window.__catatanKlik || []).length > sebelumKlik);
  const catatLangkah = (window.__catatanKlik || [])[sebelumKlik];
  uji(
    "induk dipanggil setelah klon terbang (luncuran tidak menunggu kerja induk)",
    catatLangkah?.klon >= 1,
    `klon saat induk dipanggil: ${catatLangkah?.klon}`
  );
  uji(
    "induk melihat petak terpilih e2 saat memproses langkah",
    catatLangkah?.terpilih === "e2",
    `terpilih: ${JSON.stringify(catatLangkah?.terpilih)}`
  );

  const klon = klonTerbang(wadahKlik).filter((k) => k.getAttribute("data-klon-terbang") === "e4");
  uji("tetap tepat satu klon menuju e4 (efek FEN tidak membuat klon kedua)", klon.length === 1, `${klon.length} klon e4`);
  uji(
    "klon menempuh jarak dari e2 (tidak mulai di tujuan)",
    /^translate3d\(0px, -160px, 0(px)?\)$/.test(klon[0]?.style?.transform || ""),
    klon[0]?.style?.transform || ""
  );

  // (c) biarkan induk merender FEN baru dulu (di halaman asli: ±16 ms, jauh
  //     sebelum luncuran 300 ms berakhir), baru klonnya "mendarat" seperti
  //     transisi CSS selesai.
  await tungguSampai(() => wadahKlik.querySelector('[data-petak="e4"] [data-bidak]'));
  daratkanKlon(wadahKlik);
  await tungguSampai(() => {
    const b = wadahKlik.querySelector('[data-petak="e4"] [data-bidak]');
    return b && b.style.visibility === "";
  });
  uji(
    "setelah mendarat, bidak di e4 tampil",
    wadahKlik.querySelector('[data-petak="e4"] [data-bidak]')?.style?.visibility === ""
  );
  uji("tidak ada klon tersisa setelah mendarat", klonTerbang(wadahKlik).length === 0, `${klonTerbang(wadahKlik).length} klon`);
}

// 3) klik petak tidak sah: tidak ada penerbangan, dan tidak ada bidak tersembunyi
klikPetak("a1");
await tunggu(60);
uji("klik petak kosong tak sah tidak menerbangkan bidak", klonTerbang(wadahKlik).length === 0);
uji(
  "bidak di a1 tetap tampil setelah klik tak sah",
  wadahKlik.querySelector('[data-petak="a1"] [data-bidak]')?.style?.visibility !== "hidden"
);


/* ============ E. klon yang mendarat menunggu bidak aslinya ============
 *
 * Di halaman berat (PapanInteraktif) render posisi baru SENGAJA ditahan sampai
 * luncuran selesai, jadi saat klon mendarat belum ada bidak di petak tujuan.
 * Klon itu harus tetap tinggal di sana sebagai pengganti visualnya; kalau
 * langsung dibuang, bidaknya "berkedip" — hilang sekejap sebelum React
 * merender posisi barunya (keluhan "bling"). Uji ini mengunci urutan itu.
 */

console.log("\nE. klon mendarat menunggu bidak asli (jalur render yang ditahan)");

const wadahTunda = window.document.createElement("div");
window.document.body.appendChild(wadahTunda);
const modulTunda = require(berkasTunda);
modulTunda.mountPapanKlik(wadahTunda, { fen: AWAL, tundaInduk: 600 });
await tungguSampai(() => wadahTunda.querySelectorAll("[data-petak]").length === 64);

const klikTunda = (sq) => {
  const el = wadahTunda.querySelector(`[data-petak="${sq}"]`);
  el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
};

klikTunda("e2");
await tunggu(60);
klikTunda("e4");
await tungguSampai(() => klonTerbang(wadahTunda).some((k) => k.getAttribute("data-klon-terbang") === "e4"));
{
  const klonE4 = () => klonTerbang(wadahTunda).filter((k) => k.getAttribute("data-klon-terbang") === "e4");
  uji("langkah dalam penerbangan sebelum induk menerapkannya", klonE4().length === 1, `${klonE4().length} klon`);
  // Klon mendarat, tetapi induk belum menerapkan langkahnya (belum ada bidak di e4).
  daratkanKlon(wadahTunda);
  await tunggu(40);
  uji(
    "klon yang sudah mendarat TIDAK dicabut sebelum bidak aslinya muncul",
    klonE4().length === 1 && !wadahTunda.querySelector('[data-petak="e4"] [data-bidak]'),
    `${klonE4().length} klon; bidak e4: ${!!wadahTunda.querySelector('[data-petak="e4"] [data-bidak]')}`
  );
  uji(
    "klon yang mendarat berhenti tepat di petak tujuan",
    /^translate3d\(0px, -160px, 0(px)?\)$/.test(klonE4()[0]?.style?.transform || ""),
    klonE4()[0]?.style?.transform || ""
  );
  // Induk akhirnya menerapkan posisi barunya.
  await tungguSampai(() => wadahTunda.querySelector('[data-petak="e4"] [data-bidak]'), 2000);
  await tungguSampai(() => klonE4().length === 0, 2000);
  uji("setelah posisi baru dirender, klon dibersihkan", klonE4().length === 0, `${klonE4().length} klon`);
  uji(
    "bidak di e4 tampil (tidak tertinggal tersembunyi)",
    wadahTunda.querySelector('[data-petak="e4"] [data-bidak]')?.style?.visibility === ""
  );
  uji(
    "tidak ada bidak tersembunyi yang tertinggal",
    [...wadahTunda.querySelectorAll("[data-bidak]")].every((el) => el.style.visibility !== "hidden")
  );
}

/* ============ F. satu langkah = tepat SATU penerbangan ============
 *
 * Cacat yang dijaga: saat posisi baru akhirnya dirender (klon pesanan klik
 * sudah mendarat), efek FEN sempat membersihkan klon yang mendarat LEBIH DULU
 * sebelum memeriksa "langkah ini sudah diterbangkan?" — akibatnya papan
 * membuat klon KEDUA untuk langkah yang sama: bidaknya meluncur dua kali.
 *
 * Bedanya dengan bagian E: di sini yang diuji bukan "berapa klon yang ada",
 * melainkan "berapa kali papan MEMBUAT klon" selama satu langkah.
 */

console.log("\nF. satu langkah = tepat satu penerbangan (tanpa luncuran berulang)");

const wadahHitung = window.document.createElement("div");
window.document.body.appendChild(wadahHitung);
const modulHitung = require(berkasTunda);
modulHitung.mountPapanKlik(wadahHitung, { fen: AWAL, tundaInduk: 600 });
await tungguSampai(() => wadahHitung.querySelectorAll("[data-petak]").length === 64);

const hitung = hitungPenerbangan(wadahHitung);
// Jejak: siapa & kapan membuat klon (untuk diagnosis bila ada ganda).
const klikHitung = (sq) => {
  const el = wadahHitung.querySelector(`[data-petak="${sq}"]`);
  el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
};

klikHitung("e2");
await tunggu(60);
klikHitung("e4");
await tungguSampai(() => hitung.perPetak.e4 === 1, 2000);
{
  // Klon pesanan klik mendarat dulu, baru posisi baru dirender oleh induk.
  daratkanKlon(wadahHitung);
  await tungguSampai(() => wadahHitung.querySelector('[data-petak="e4"] [data-bidak]'), 3000);
  await tunggu(150); // beri kesempatan efek FEN membuat klon kedua bila memang cacat
  uji(
    "jalur klik: langkah e2→e4 diterbangkan tepat SATU kali",
    hitung.perPetak.e4 === 1,
    `${hitung.perPetak.e4 ?? 0} penerbangan ke e4 (urut: ${hitung.urut.join(", ")})`
  );
  uji(
    "tidak ada penerbangan lain yang ikut tercipta",
    hitung.total === 1,
    `total penerbangan: ${hitung.total} (${hitung.urut.join(", ")})`
  );
  uji(
    "bidak e4 tampil, tanpa bidak tersembunyi yang tertinggal",
    wadahHitung.querySelector('[data-petak="e4"] [data-bidak]')?.style?.visibility === "" &&
      [...wadahHitung.querySelectorAll("[data-bidak]")].every((el) => el.style.visibility !== "hidden")
  );
  hitung.hentikan();
}

// Klik DOBEL di petak tujuan (pemain tidak sabar): tetap satu langkah.
{
  const wadahDobel = window.document.createElement("div");
  window.document.body.appendChild(wadahDobel);
  const modulDobel = require(berkasTunda);
  modulDobel.mountPapanKlik(wadahDobel, { fen: AWAL, tundaInduk: 600 });
  await tungguSampai(() => wadahDobel.querySelectorAll("[data-petak]").length === 64);

  const hitungDobel = hitungPenerbangan(wadahDobel);
  // Penanda `__catatanKlik` dipakai bersama semua harness di berkas ini —
  // nolkan supaya yang dihitung hanya pemanggilan induk pada skenario ini.
  window.__catatanKlik = [];
  const klikDobel = (sq) => {
    const el = wadahDobel.querySelector(`[data-petak="${sq}"]`);
    el?.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  };
  klikDobel("e2");
  await tunggu(60);
  klikDobel("e4");
  await tunggu(60);
  klikDobel("e4"); // klik kedua — jangan sampai memproses langkah kedua
  await tungguSampai(() => wadahDobel.querySelector('[data-petak="e4"] [data-bidak]'), 3000);
  await tunggu(200);

  const panggilanE4 = (window.__catatanKlik || []).filter((c) => c.sq === "e4").length;
  uji(
    "klik dobel di petak tujuan: induk hanya dipanggil SEKALI untuk langkah itu",
    panggilanE4 === 1,
    `${panggilanE4} pemanggilan induk untuk e4 — induk: ${JSON.stringify(window.__catatanKlik)}`
  );
  uji(
    "klik dobel di petak tujuan: tetap satu penerbangan",
    hitungDobel.perPetak.e4 === 1,
    `${hitungDobel.perPetak.e4 ?? 0} penerbangan ke e4 (urut: ${hitungDobel.urut.join(", ")})`
  );
  hitungDobel.hentikan();
}

// Lanjutan: langkah kedua yang datang dari LUAR (jalur FEN) juga satu penerbangan.
{
  const hitung2 = hitungPenerbangan(wadahHitung);
  // e7→e5 lewat jalur FEN murni: klik petak e7 lalu e5 (induk menunda 600 ms).
  klikHitung("e7");
  await tunggu(60);
  klikHitung("e5");
  await tungguSampai(() => wadahHitung.querySelector('[data-petak="e5"] [data-bidak]'), 3000);
  daratkanKlon(wadahHitung);
  await tunggu(200);
  uji(
    "langkah kedua (hitam) juga tepat satu penerbangan ke e5",
    hitung2.perPetak.e5 === 1,
    `${hitung2.perPetak.e5 ?? 0} penerbangan ke e5 (urut: ${hitung2.urut.join(", ")})`
  );
  hitung2.hentikan();
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
