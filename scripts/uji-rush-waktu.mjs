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
 * Skrip gagal keras bila jsdom/esbuild tidak
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
  console.log("\nGAGAL: tidak dapat menjalankan uji render — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  console.log(`\n${lulus} lulus, ${gagal} gagal`);
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

/* ------------------------------------------------ bundel komponen (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
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

let merahTerlihat;
let bunyiPeringatan;
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

/* ------------------------------------------------------------------ ujian regresi kolam soal & jaringan */
console.log("\nRegresi mode soal (Skakmat Klasik <-> Taktik Campuran), balapan unduhan, & kegagalan jaringan:");
{
  const dataUtamaAsli = JSON.parse(readFileSync(path.join(ROOT, "public", "data", "teka-teki.json"), "utf8"));
  const dataVideoAsli = JSON.parse(readFileSync(path.join(ROOT, "public", "data", "teka-teki-video.json"), "utf8"));
  // Satu soal skakmat ber-rating tinggi (2200) vs satu soal taktik ber-rating awal (400):
  // saat Rush mulai (targetRating=400), kolam 'skakmat' pasti memuat soalSkakmat,
  // sedangkan kolam 'campuran' pasti memilih soalTaktik di pita 400±100.
  const soalSkakmatUji = { ...dataUtamaAsli.problems[0], problemid: 1, rating: 2200 };
  const soalTaktikUji = {
    ...dataVideoAsli.problems.find((p) => p.fen !== soalSkakmatUji.fen),
    problemid: 5487,
    rating: 400,
  };

  const dom2 = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "https://uji.test/teka-teki-rush",
    pretendToBeVisual: true,
  });
  siapkanGlobal(dom2.window);
  const dok2 = dom2.window.document;
  const wadah2 = dok2.getElementById("root");

  let gagalUtama = true;
  let gagalTambahan = true;
  let tundaTambahan = null;

  dom2.window.fetch = (url) => {
    const u = String(url);
    if (u.includes("teka-teki-video.json")) {
      if (gagalTambahan) {
        return Promise.reject(new Error("gagal unduh teka-teki-video.json"));
      }
      const muatan = { problems: [soalTaktikUji] };
      const respon = {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(muatan)),
        json: () => Promise.resolve(muatan),
      };
      if (tundaTambahan) {
        return new Promise((resolve) => {
          tundaTambahan = () => resolve(respon);
        });
      }
      return Promise.resolve(respon);
    }
    if (u.includes("teka-teki.json")) {
      if (gagalUtama) {
        return Promise.reject(new Error("gagal unduh teka-teki.json"));
      }
      const muatan = { problems: [soalSkakmatUji] };
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(muatan)),
        json: () => Promise.resolve(muatan),
      });
    }
    return Promise.reject(new Error(`offline: ${u}`));
  };
  globalThis.fetch = dom2.window.fetch;

  delete require.cache[berkasBundel];
  const akar2 = require(berkasBundel).mount(wadah2);

  // 1) Kegagalan unduh awal teka-teki.json menampilkan tombol Coba lagi & tidak macet
  const tampilCobaLagi = await tungguHingga(
    () => [...dok2.querySelectorAll("button")].some((b) => /Coba lagi|Try again/i.test(b.textContent)),
    4000
  );
  uji("gagal muat teka-teki.json menampilkan layar galat + tombol Coba lagi", tampilCobaLagi);

  gagalUtama = false;
  const tombolCobaLagi = [...dok2.querySelectorAll("button")].find((b) =>
    /Coba lagi|Try again/i.test(b.textContent)
  );
  tombolCobaLagi.dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));

  const pulihMenu = await tungguHingga(
    () => !!dok2.querySelector('[data-mode-rush="skakmat"]'),
    4000
  );
  uji("klik Coba lagi memulihkan menu Rush setelah jaringan kembali", pulihMenu);

  // Isi nama pemain untuk uji mulai sesi
  const inputNama2 = dok2.querySelector('input[type="text"]');
  const setterInput2 = Object.getOwnPropertyDescriptor(dom2.window.HTMLInputElement.prototype, "value").set;
  setterInput2.call(inputNama2, "PengujiMode");
  inputNama2.dispatchEvent(new dom2.window.Event("input", { bubbles: true }));
  await tunggu(40);

  // 2) Kegagalan unduh teka-teki-video.json jatuh mulus kembali ke Skakmat Klasik
  const btnSkakmat = () => dok2.querySelector('[data-mode-rush="skakmat"]');
  const btnCampuran = () => dok2.querySelector('[data-mode-rush="campuran"]');
  const btnMulai = () =>
    [...dok2.querySelectorAll("button")].find((b) => /Mulai Rush|Memuat paket/i.test(b.textContent));

  btnCampuran().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  const jatuhKeSkakmat = await tungguHingga(
    () =>
      !!dok2.querySelector('[data-galat-campuran="1"]') &&
      btnSkakmat()?.getAttribute("aria-pressed") === "true" &&
      btnMulai()?.disabled === false,
    4000
  );
  uji(
    "gagal unduh teka-teki-video.json menampilkan peringatan & mengembalikan mode Skakmat tanpa macet",
    jatuhKeSkakmat
  );

  // 3) Balapan: klik Campuran (unduhan ditahan) lalu kembali ke Skakmat sebelum selesai
  gagalTambahan = false;
  tundaTambahan = true;
  btnCampuran().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  await tungguHingga(() => btnMulai()?.disabled === true, 2000);
  // Batalkan dan pilih Skakmat selagi unduhan masih menggantung
  btnSkakmat().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  await tunggu(50);
  uji(
    "beralih balik ke Skakmat saat unduhan Campuran berjalan langsung membuka tombol Mulai",
    btnSkakmat()?.getAttribute("aria-pressed") === "true" && btnMulai()?.disabled === false
  );
  // Selesaikan unduhan terlambat: kolam aktif TIDAK boleh tertimpa Campuran
  if (typeof tundaTambahan === "function") tundaTambahan();
  tundaTambahan = null;
  await tunggu(120);

  const bacaPetakBidak = () =>
    [...wadah2.querySelectorAll("[data-petak]")]
      .filter((el) => el.querySelector("img"))
      .map((el) => el.getAttribute("data-petak"))
      .sort()
      .join(",");
  const jejakFen = (fen) => {
    const peta = [];
    const baris = fen.split(" ")[0].split("/");
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of baris[r]) {
        if (/\d/.test(ch)) c += Number(ch);
        else {
          peta.push(`${"abcdefgh"[c]}${8 - r}`);
          c++;
        }
      }
    }
    return peta.sort().join(",");
  };

  btnMulai().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  const masukSkakmat = await tungguHingga(
    () => wadah2.querySelectorAll("[data-petak]").length === 64,
    5000
  );
  uji(
    "setelah balapan unduhan, sesi Skakmat benar-benar memakai kolam Skakmat murni",
    masukSkakmat && bacaPetakBidak() === jejakFen(soalSkakmatUji.fen)
  );
  akar2.unmount();

  // 4) Pergantian mode sesudah dataset termuat (Skakmat -> Campuran -> mulai Campuran)
  const akar3 = require(berkasBundel).mount(wadah2);
  await tungguHingga(() => !!dok2.querySelector('[data-mode-rush="campuran"]'), 4000);
  const inputNama3 = dok2.querySelector('input[type="text"]');
  setterInput2.call(inputNama3, "PengujiCampuran");
  inputNama3.dispatchEvent(new dom2.window.Event("input", { bubbles: true }));
  await tunggu(30);

  btnCampuran().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  await tungguHingga(
    () => btnCampuran()?.getAttribute("aria-pressed") === "true" && btnMulai()?.disabled === false,
    4000
  );
  btnMulai().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  const masukCampuran = await tungguHingga(
    () => wadah2.querySelectorAll("[data-petak]").length === 64,
    5000
  );
  uji(
    "pergantian ke Taktik Campuran sesudah unduh memakai kolam soal gabungan",
    masukCampuran && bacaPetakBidak() === jejakFen(soalTaktikUji.fen)
  );
  akar3.unmount();

  // 5) Pergantian bolak-balik sesudah dataset termuat (Skakmat -> Campuran -> Skakmat -> mulai Skakmat)
  const akar4 = require(berkasBundel).mount(wadah2);
  await tungguHingga(() => !!dok2.querySelector('[data-mode-rush="campuran"]'), 4000);
  const inputNama4 = dok2.querySelector('input[type="text"]');
  setterInput2.call(inputNama4, "PengujiBalik");
  inputNama4.dispatchEvent(new dom2.window.Event("input", { bubbles: true }));
  await tunggu(30);

  btnCampuran().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  await tungguHingga(
    () => btnCampuran()?.getAttribute("aria-pressed") === "true" && btnMulai()?.disabled === false,
    4000
  );
  btnSkakmat().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  await tunggu(40);
  btnMulai().dispatchEvent(new dom2.window.MouseEvent("click", { bubbles: true }));
  const masukSkakmatLagi = await tungguHingga(
    () => wadah2.querySelectorAll("[data-petak]").length === 64,
    5000
  );
  uji(
    "pergantian kembali Campuran -> Skakmat sesudah dataset termuat mengembalikan kolam Skakmat murni",
    masukSkakmatLagi && bacaPetakBidak() === jejakFen(soalSkakmatUji.fen)
  );
  akar4.unmount();
}

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
