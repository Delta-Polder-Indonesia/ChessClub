/**
 * Uji ALAMAT halaman teka-teki (SEO pass: `/teka-teki/problem/<nomor>`).
 *
 * Yang dikunci skrip ini — semuanya lewat router sungguhan (App.jsx), bukan
 * pembacaan berkas:
 *
 *   1. Alamat lama `/teka-teki/1` dialihkan ke `/teka-teki/problem/1`, dan
 *      soal #1 benar-benar termuat di alamat baru (bukan cuma URL-nya berubah).
 *   2. `/teka-teki` (alamat lama tanpa nomor) dialihkan ke `/teka-teki/problem`.
 *   3. Id bukan angka (`/teka-teki/abc`) tidak menghasilkan URL aneh — cukup
 *      diarahkan ke halaman kanonik.
 *   4. Tautan lama berquery (`/teka-teki/problem?id=7`) tetap dinormalkan ke
 *      segmen path `/teka-teki/problem/7`.
 *   5. Deep-link `/teka-teki/problem/3747` memuat soal #3747 yang benar.
 *   6. Di SEMUA variasi itu, `<link rel="canonical">` menunjuk satu halaman
 *      resmi `/teka-teki/problem` dan meta robots `index, follow` — inilah yang
 *      mencegah 5.486 URL soal bersaing sebagai halaman terpisah di Google.
 *
 * Mengapa jsdom + App sungguhan: pengalihan terjadi di router (bukan server),
 * jadi hanya menjalankan routernya yang bisa membuktikannya. jsdom/esbuild
 * wajib terpasang; keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-teka-teki-rute.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tekaTeki as kamus } from "../src/lib/terjemahan/id/tekaTeki.js";
// Shim `import.meta.glob` (makro compile-time Vite) — sama dengan harness lain
// supaya aset bidak tetap terpecah seperti di produksi.
import { pluginGlobAset } from "./loader-jsx.mjs";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let lulus = 0;
let gagal = 0;

function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal += 1;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

function judul(teks) {
  console.log(`\n${teks}`);
}

const { problems } = JSON.parse(
  readFileSync(path.join(ROOT, "public", "data", "teka-teki.json"), "utf8")
);
const soal3747 = problems.find((p) => p.problemid === 3747) || problems[3746];

/* ------------------------------------------------------------- bundel app */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import App from "./src/App.jsx";

/**
 * Perekam jejak alamat. React Router tidak menyentuh window.location di
 * MemoryRouter, jadi setiap alamat yang benar-benar dikunjungi dicatat di sini
 * (termasuk alamat titik masuk dan hasil pengalihannya).
 */
function PerekamJalur() {
  const { pathname } = useLocation();
  const daftar = (window.__jalurDikunjungi = window.__jalurDikunjungi || []);
  if (daftar[daftar.length - 1] !== pathname) daftar.push(pathname);
  return null;
}

export function mount(el, jalur) {
  return createRoot(el).render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[jalur]}>
        <PerekamJalur />
        <I18nProvider><App /></I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-tekateki-rute.cjs");
const { build } = require("esbuild");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-tekateki-rute-entry.jsx",
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

/* ------------------------------------------------------------------ jsdom */

const { JSDOM } = require("jsdom");

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class AudioContextPalsu {
  constructor() {
    this.destination = {};
    this.currentTime = 0;
    this.state = "running";
  }
  createGain() {
    return { gain: { value: 0 }, connect() {}, disconnect() {} };
  }
  createBufferSource() {
    return { buffer: null, connect() {}, start() {}, stop() {} };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
  resume() {
    return Promise.resolve();
  }
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/teka-teki/problem/1",
  pretendToBeVisual: true,
});
const { window } = dom;
const dok = window.document;

window.ResizeObserver = PengamatPalsu;
window.IntersectionObserver = PengamatPalsu;
window.AudioContext = AudioContextPalsu;
window.webkitAudioContext = AudioContextPalsu;
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
window.innerWidth = 1440;
window.innerHeight = 900;

globalThis.window = window;
globalThis.document = dok;
globalThis.localStorage = window.localStorage;
if (!globalThis.navigator) globalThis.navigator = window.navigator;
globalThis.ResizeObserver = PengamatPalsu;
globalThis.IntersectionObserver = PengamatPalsu;
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);

// `fetch` palsu: data & buku pembukaan dibaca dari `public/`.
const bacaAjaxAsli = async (url) => {
  const jalur = String(url).replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
  return readFileSync(path.join(ROOT, "public", jalur), "utf8");
};
globalThis.fetch = async (url) => {
  try {
    const teks = await bacaAjaxAsli(url);
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(teks),
      text: async () => teks,
    };
  } catch (e) {
    return {
      ok: false,
      status: 404,
      json: async () => {
        throw e;
      },
      text: async () => String(e),
    };
  }
};
window.fetch = globalThis.fetch;

/* ------------------------------------------------------------- alat bantu */

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function tungguSampai(syarat, batasMs = 8000) {
  const akhir = Date.now() + batasMs;
  while (Date.now() < akhir) {
    if (syarat()) return true;
    await tunggu(25);
  }
  return syarat();
}

const LAJUR = "abcdefgh";
const BARIS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function labelDariFen(fen) {
  const peta = new Map();
  const barisPapan = [];
  const potongan = fen.split(" ")[0].split("/");
  for (const potong of potongan) {
    const isi = [];
    for (const karakter of potong) {
      if (/\d/.test(karakter)) {
        for (let i = 0; i < Number(karakter); i += 1) isi.push(null);
      } else {
        const warna = karakter === karakter.toUpperCase() ? "w" : "b";
        const jenis = { p: "p", n: "n", b: "b", r: "r", q: "q", k: "k" }[
          karakter.toLowerCase()
        ];
        isi.push({ color: warna, type: jenis });
      }
    }
    barisPapan.push(isi);
  }
  barisPapan.forEach((baris, i) =>
    baris.forEach((petak, j) => {
      const sq = LAJUR[j] + BARIS[i];
      if (!petak) {
        peta.set(sq, kamus.ariaPetakKosong.replaceAll("{sq}", sq));
        return;
      }
      peta.set(
        sq,
        kamus.ariaPetakBidak
          .replaceAll("{sq}", sq)
          .replaceAll("{bidak}", kamus.namaBidak[petak.type])
          .replaceAll("{warna}", petak.color === "w" ? kamus.warnaPutih : kamus.warnaHitam)
      );
    })
  );
  return peta;
}

/** Apakah papan yang tampil = posisi FEN ini? Dibandingkan lewat aria-label. */
function papanSama(akar, fen) {
  const harap = labelDariFen(fen);
  const kini = new Map();
  for (const el of akar.querySelectorAll("[data-petak]")) {
    kini.set(el.getAttribute("data-petak"), el.getAttribute("aria-label"));
  }
  if (kini.size !== 64 || harap.size !== 64) return false;
  for (const [sq, label] of harap) if (kini.get(sq) !== label) return false;
  return true;
}

const { mount } = require(berkasBundel);

/**
 * Pasang halaman di titik masuk `jalur`, tunggu sampai data soal termuat
 * (64 petak tampil), lalu kembalikan data yang dibutuhkan pemeriksaan.
 */
async function kunjungi(jalur, { tungguSoal = true } = {}) {
  window.__jalurDikunjungi = [];
  window.localStorage.clear();
  const akar = dok.createElement("div");
  akar.setAttribute("data-uji", jalur);
  dok.body.appendChild(akar);
  mount(akar, jalur);
  if (tungguSoal) {
    await tungguSampai(() => akar.querySelectorAll("[data-petak]").length === 64);
  } else {
    await tungguSampai(() => (window.__jalurDikunjungi || []).length >= 2, 3000);
  }
  await tunggu(80);
  return {
    akar,
    jejak: [...(window.__jalurDikunjungi || [])],
    kanonik: dok.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    robots: dok.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
    judul: dok.title || "",
    bersihkan: () => akar.remove(),
  };
}

/* ------------------------------------------------------------------ kasus */

judul("alamat lama → alamat kanonik");
{
  const k = await kunjungi("/teka-teki/1");
  uji(
    "jejak alamat dimulai dari /teka-teki/1 (titik masuk dihormati)",
    k.jejak[0] === "/teka-teki/1",
    `jejak: ${k.jejak.join(" → ")}`
  );
  uji(
    "/teka-teki/1 dialihkan ke /teka-teki/problem/1",
    k.jejak.includes("/teka-teki/problem/1"),
    `jejak: ${k.jejak.join(" → ")}`
  );
  uji(
    "soal #1 benar-benar termuat di alamat baru",
    papanSama(k.akar, problems[0].fen),
    "papan tidak sesuai FEN soal #1"
  );
  k.bersihkan();
}

judul("alamat lama tanpa nomor & id bukan angka");
{
  const k = await kunjungi("/teka-teki");
  uji(
    "jejak melewati /teka-teki/problem",
    k.jejak.includes("/teka-teki/problem"),
    `jejak: ${k.jejak.join(" → ")}`
  );
  uji(
    "alamat akhir selalu berbentuk /teka-teki/problem/<nomor>",
    /^\/teka-teki\/problem\/\d+$/.test(k.jejak[k.jejak.length - 1]),
    `jejak: ${k.jejak.join(" → ")}`
  );
  k.bersihkan();
}
{
  const k = await kunjungi("/teka-teki/abc", { tungguSoal: false });
  uji(
    "id bukan angka diarahkan ke halaman kanonik (bukan URL aneh)",
    k.jejak.includes("/teka-teki/problem"),
    `jejak: ${k.jejak.join(" → ")}`
  );
  k.bersihkan();
}

judul("tautan lama berquery tetap dinormalkan");
{
  const k = await kunjungi("/teka-teki/problem?id=7");
  uji(
    "?id=7 menjadi /teka-teki/problem/7",
    k.jejak.includes("/teka-teki/problem/7"),
    `jejak: ${k.jejak.join(" → ")}`
  );
  k.bersihkan();
}

judul("deep-link nomor soal");
{
  const k = await kunjungi(`/teka-teki/problem/${soal3747.problemid}`);
  uji(
    "alamat nomor soal tidak dialihkan ke tempat lain",
    k.jejak[k.jejak.length - 1] === `/teka-teki/problem/${soal3747.problemid}`,
    `jejak: ${k.jejak.join(" → ")}`
  );
  uji(
    `soal #${soal3747.problemid} termuat sesuai nomor di alamat`,
    papanSama(k.akar, soal3747.fen),
    "papan tidak sesuai FEN soal yang diminta"
  );
  k.bersihkan();
}

judul("metadata satu halaman kanonik");
{
  const k = await kunjungi("/teka-teki/problem/2500");
  uji(
    "canonical menunjuk /teka-teki/problem, bukan nomor soal",
    k.kanonik.endsWith("/teka-teki/problem"),
    `canonical: ${k.kanonik}`
  );
  uji("robots = index, follow", k.robots === "index, follow", `robots: ${k.robots}`);
  uji(
    "judul dokumen memakai kamus metaJudul",
    k.judul.includes(kamus.metaJudul),
    `judul: ${k.judul}`
  );
  k.bersihkan();
}

/* ------------------------------------------------------------------ hasil */

console.log("");
if (gagal) {
  console.error(`${lulus} lulus, ${gagal} gagal — alamat teka-teki bermasalah.`);
  process.exit(1);
}
console.log(`${lulus} lulus, 0 gagal — alamat teka-teki aman.`);
