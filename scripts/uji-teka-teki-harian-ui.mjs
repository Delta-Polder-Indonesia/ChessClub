/**
 * Uji halaman Teka-teki Harian di jsdom (tanpa jaringan sungguhan).
 *
 * Yang dijaga:
 *  1. Halaman memuat soal dari RUTE API (`/api/teka-teki-harian`), dan saat API
 *     tidak terjangkau ia jatuh ke SNAPSHOT STATIS `data/teka-teki-harian/…`
 *     sambil memberi tahu bahwa soalnya dari arsip; papan tetap 64 petak.
 *  2. Langkah benar diterima, lawan membalas otomatis, dan langkah salah tidak
 *     mengubah posisi serta memberi pesan.
 *  3. Menyelesaikan seluruh solusi menandai tanggal itu di localStorage.
 *  4. Tanggal arsip yang berpihak HITAM dipasang dengan orientasi hitam dan
 *     penomoran riwayat yang benar (bukan asumsi "putih selalu mulai").
 *  5. Tanggal yang tidak ada di snapshot menampilkan keadaan kosong, bukan papan
 *     kosong atau galat.
 *  6. Widget "Teka-teki Hari Ini" di landing BISA DIMAINKAN memakai arsip lokal
 *     (tanpa API), dibatasi 5 soal per hari, lalu memunculkan dialog ajakan
 *     bergabung ke Blunder Skuad yang menuju `/pendaftaran-anggota`.
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
import { papan as kamusAtribusi } from "../src/lib/terjemahan/id/papan.js";
import { tekaTekiHarian as kamus } from "../src/lib/terjemahan/id/tekaTekiHarian.js";
import { geserTanggal, tanggalHariIni, warnaGiliran } from "../src/lib/tekaTekiHarian.js";
import { hitungMateriBidak } from "../src/lib/materiBidak.js";
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

/**
 * PGN solusi untuk satu soal, diturunkan dari snapshot (urutannya sama).
 * Sengaja dibungkus seperti balasan server: header `[FEN "…"]` + SAN + hasil
 * partai, supaya parser halaman benar-benar diuji membuang bagian non-langkah.
 */
function pgnDariPaket(paket) {
  const game = new Chess(paket.fen);
  const san = paket.langkah.map((uci) => {
    const { from, to, promo } = parseLangkah(uci);
    return game.move({ from, to, promotion: promo || undefined }).san;
  });
  return `[FEN "${paket.fen}"]\n\n${san.join(" ")} 1-0`;
}

/** Balasan `GET /api/teka-teki-harian` yang sehat, untuk satu paket soal. */
function jawabanApi(paket, judul = "Uji harian dari API") {
  return {
    status: 200,
    body: {
      tersedia: true,
      tanggal: paket.tanggal,
      judul,
      fen: paket.fen,
      pgn: pgnDariPaket(paket),
      url: `https://www.chess.com/daily-chess-puzzle/${paket.tanggal}`,
    },
  };
}

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
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

/**
 * Widget yang sama, tetapi di dalam tabel rute: dipakai membuktikan tombol
 * "Gabung Blunder Skuad" benar-benar berpindah ke /pendaftaran-anggota.
 * Penanda data-uji sengaja bukan teks kamus supaya uji tidak rapuh.
 */
export function mountWidgetRute(el) {
  return bungkus(
    el,
    "/",
    <Routes>
      <Route path="/" element={<TekaTekiHarianLanding />} />
      <Route
        path="/pendaftaran-anggota"
        element={<p data-uji="rute-gabung">daftar anggota</p>}
      />
    </Routes>
  );
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
  // Radix (dialog ajakan bergabung) memanggil getComputedStyle tanpa awalan
  // `window`; di jsdom fungsi itu tidak diekspor ke globalThis.
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  // Radix juga mengamati perubahan DOM untuk mengunci fokus di dalam dialog.
  globalThis.MutationObserver = window.MutationObserver;
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
   * Dua jalur data, persis seperti di produksi:
   *  - berkas statis `public/` dibaca dari disk (snapshot widget & cadangan);
   *  - `/api/teka-teki-harian` dilayani `stubApi` yang diatur tiap bagian uji.
   *    Bila `stubApi` kosong, permintaan API DITOLAK (mensimulasikan Chess.com
   *    / server tidak terjangkau) sehingga jalur cadangan ikut teruji.
   */
  window.fetch = (url, opsi) => {
    const alamat = String(url).replace(/^https?:\/\/[^/]+/, "");
    if (alamat.includes("/api/teka-teki-harian")) {
      permintaanApi.push(alamat);
      if (!stubApi) return Promise.reject(new Error("jaringan mati"));
      let hasil;
      try {
        hasil = stubApi(alamat, opsi);
      } catch (galat) {
        return Promise.reject(galat);
      }
      const isi = JSON.stringify(hasil?.body ?? {});
      return Promise.resolve({
        ok: (hasil?.status ?? 200) < 400,
        status: hasil?.status ?? 200,
        text: () => Promise.resolve(isi),
        json: () => Promise.resolve(JSON.parse(isi)),
      });
    }
    const relatif = alamat.replace(/^\//, "");
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

/**
 * Stub rute API teka-teki harian. `null` = API dianggap TIDAK terjangkau
 * (permintaan ditolak), sehingga halaman harus jatuh ke snapshot lokal.
 * Setiap bagian uji mengatur sendiri nilai ini sebelum memasang komponen.
 */
let stubApi = null;
/** Alamat API yang diminta — dipakai memastikan halaman benar-benar ke API. */
const permintaanApi = [];

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

const { mount, mountWidget, mountWidgetRute } = require(berkasBundel);

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
      // PapanTekTeki menaruh `data-bidak` pada elemen bidak di dalam petak
      // (PapanStatis menaruhnya langsung pada petak) — dukung keduanya.
      const nilai =
        el.getAttribute("data-bidak") ??
        el.querySelector("[data-bidak]")?.getAttribute("data-bidak") ??
        "";
      if (nilai !== harapBidak) return false;
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

console.log(`\nA. soal terbaru lewat API (${paketTerbaru.tanggal}):`);
stubApi = () => jawabanApi(paketTerbaru);
permintaanApi.length = 0;
const akarA = akarBaru();
const rootA = mount(akarA, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);

uji(
  "papan 64 petak tampil",
  await tungguSampai(() => dok.querySelectorAll("[data-petak]").length === 64)
);
uji("posisi awal sesuai FEN yang dikirim API", papanSama(paketTerbaru.fen));
uji("halaman meminta rute API (bukan langsung ke berkas arsip)", permintaanApi.length > 0);
uji(
  "tanggal dikirim sebagai kueri ke API",
  permintaanApi.some((a) => a.includes(`tanggal=${paketTerbaru.tanggal}`))
);
uji("judul dari API tampil di panel", teksHalaman().includes("Uji harian dari API"));
uji(
  "tidak ada peringatan \"dilayani dari arsip\" saat API sehat",
  !teksHalaman().includes(kamus.dariArsip)
);
/* Halaman ini berdiri sendiri sebagai alat papan: sidebar sendiri dengan
 * brand + label mode, dan TIDAK lagi bernaung di bawah Teka-teki Catur. */
uji(
  "memakai kerangka keluarga papan (brand BlunderSkuad di sidebar)",
  teksHalaman().includes("BlunderSkuad")
);
uji(
  "label mode tampil sebagai judul halaman di sidebar",
  Boolean(dok.querySelector("h1")) &&
    teksHalaman().includes(kamus.judul)
);
uji(
  "tidak ada lagi tautan kembali ke Teka-teki Catur",
  !dok.querySelector('a[href="/teka-teki/problem"]')
);
uji(
  "hanya satu papan (papan milik halaman ini sendiri)",
  dok.querySelectorAll("[data-petak]").length === 64
);
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

console.log("\nB. API tidak terjangkau → cadangan snapshot (soal berpihak hitam):");
// `stubApi = null` membuat permintaan API DITOLAK: halaman wajib jatuh ke
// snapshot lokal, menampilkan papan, dan memberi tahu bahwa soalnya dari arsip.
stubApi = null;
permintaanApi.length = 0;
if (soalHitam) {
  const paketHitam = urai(soalHitam);
  const akarB = akarBaru();
  const rootB = mount(
    akarB,
    `/teka-teki-harian?tanggal=${paketHitam.tanggal}`
  );
  uji(
    "soal arsip termuat setelah API gagal",
    await tungguSampai(() => papanSama(paketHitam.fen))
  );
  uji("API memang dicoba lebih dulu", permintaanApi.length > 0);
  uji(
    "peringatan \"dilayani dari arsip lokal\" tampil",
    teksHalaman().includes(kamus.dariArsip)
  );
  uji(
    "halaman tidak menampilkan keadaan galat",
    !teksHalaman().includes(kamus.coba)
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

console.log("\nC. tanggal yang tidak ada (API: tersedia:false):");
{
  // Jawaban sah tetapi soalnya memang belum terbit — BUKAN kegagalan jaringan,
  // jadi halaman tidak boleh jatuh ke snapshot maupun menampilkan tombol ulang.
  stubApi = () => ({
    status: 200,
    body: { tersedia: false, tanggal: "2007-05-07", alasan: "tidak-ada" },
  });
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
    "tombol kembali ke hari ini ditawarkan",
    teksHalaman().includes(kamus.keHariIni)
  );
  uji(
    "tidak ada peringatan arsip (API menjawab, bukan gagal)",
    !teksHalaman().includes(kamus.dariArsip)
  );
  rootC.unmount();
  akarC.remove();
}

/* ------------------------------------------- D. widget landing */

console.log("\nD. widget landing: bisa dimainkan, dibatasi 5 soal:");

/** Kunci progres harian widget (lihat `KUNCI_PROGRES` di komponennya). */
const KUNCI_PROGRES = "kci-harian-landing";
const hariIni = tanggalHariIni();
/** Soal yang dipakai widget: snapshot terbaru, urut terbaru-dulu, maksimal 5. */
const daftarWidget = [...terbaruSnapshot.soal].reverse().slice(0, 5);

function progresWidget() {
  try {
    return JSON.parse(window.localStorage.getItem(KUNCI_PROGRES) || "{}");
  } catch {
    return {};
  }
}

function setProgresWidget(selesai) {
  window.localStorage.setItem(
    KUNCI_PROGRES,
    JSON.stringify({ tanggal: hariIni, selesai })
  );
}

/** Teks kamus dengan placeholder `{n}`/`{total}` sudah diisi. */
const teksNomorSoal = (n, total = 5) =>
  kamusLanding.harianNomorSoal.replace("{n}", String(n)).replace("{total}", String(total));
const teksKemajuan = (n, total = 5) =>
  kamusLanding.harianKemajuan.replace("{n}", String(n)).replace("{total}", String(total));
const teksTerkunci = (total = 5) =>
  kamusLanding.harianTerkunciJudul.replace("{total}", String(total));
const teksDialog = (total = 5) =>
  kamusLanding.harianDialogJudul.replace("{total}", String(total));

/** Klik tombol berdasarkan teksnya (dipakai untuk pemilih promosi & dialog). */
async function klikTombolTeks(teks) {
  const tombol = [...dok.querySelectorAll("button")].filter((b) =>
    (b.textContent || "").includes(teks)
  );
  const el = tombol.at(-1);
  if (!el) throw new Error(`tombol "${teks}" tidak ada`);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

/**
 * Selesaikan satu soal widget: mainkan setiap langkah pemain (indeks genap),
 * pilih promosi bila diminta, dan tunggu balasan lawan.
 */
async function selesaikanSoalWidget(catatan) {
  const paket = urai(catatan);
  const langkahPemain = paket.langkah.filter((_, i) => i % 2 === 0);
  for (const uci of langkahPemain) {
    const { from, to, promo } = parseLangkah(uci);
    await mainkan(from, to);
    if (promo) {
      await tunggu(120);
      await klikTombolTeks(kamus.promosiMenteri);
    }
    await tunggu(700);
  }
}

/* D1 — kunjungan pertama */
{
  window.localStorage.removeItem(KUNCI_PROGRES);
  // Widget WAJIB memakai arsip lokal: API dibiarkan mati sepanjang bagian ini.
  stubApi = null;
  permintaanApi.length = 0;

  const akarD = akarBaru();
  const rootD = mountWidget(akarD);
  const paketPertama = urai(daftarWidget[0]);

  uji(
    "papan soal terbaru dari arsip dipasang",
    await tungguSampai(() => papanSamaData(paketPertama.fen), 5000)
  );
  uji("widget tidak memanggil API sama sekali", permintaanApi.length === 0);
  uji("judul seksi dari kamus tampil", teksHalaman().includes(kamusLanding.harianJudul));
  uji(
    "edisi menyebut tanggal soal terbaru",
    teksHalaman().includes(daftarWidget[0].tanggal)
  );
  uji("penomoran \"Soal 1 dari 5\"", teksHalaman().includes(teksNomorSoal(1)));
  uji("jatah harian 0/5 ditampilkan", teksHalaman().includes(teksKemajuan(0)));
  const tautan = [...dok.querySelectorAll("a")].map((a) => a.getAttribute("href"));
  uji("ada tautan ke halaman teka-teki harian", tautan.includes("/teka-teki-harian"));
  uji(
    "ada tautan ke halaman asli Chess.com",
    tautan.some((h) => h && h.includes("chess.com/daily-chess-puzzle"))
  );

  /* D2 — langkah salah lalu langkah benar */
  console.log("\nD2. langkah salah, lalu langkah benar:");
  const langkahPertama = parseLangkah(paketPertama.langkah[0]);
  const salah = cariLangkahSalah(paketPertama.fen, langkahPertama);
  if (salah) {
    await mainkan(salah.from, salah.to);
    await tunggu(400);
    uji("posisi tidak berubah setelah langkah salah", papanSamaData(paketPertama.fen));
    uji("pesan \"belum tepat\" tampil", teksHalaman().includes(kamusLanding.harianSalah));
  } else {
    uji("(posisi hanya punya satu langkah legal — kasus salah dilewati)", true);
  }

  await mainkan(langkahPertama.from, langkahPertama.to);
  if (paketPertama.langkah.length > 1) {
    uji(
      "lawan membalas otomatis setelah langkah benar",
      await tungguSampai(
        () => papanSamaData(fenSetelah(paketPertama.fen, paketPertama.langkah, 2)),
        4000
      )
    );
  } else {
    uji("(soal satu langkah — balasan lawan tidak ada)", true);
  }
  uji(
    "jatah belum berkurang sebelum soal tuntas",
    progresWidget().selesai === 0 || progresWidget().selesai === undefined
  );

  rootD.unmount();
  akarD.remove();
}

/* D3 — soal kelima menutup jatah lalu memunculkan ajakan bergabung */
{
  console.log("\nD3. menyelesaikan soal kelima:");
  // Empat soal sebelumnya dianggap sudah dimainkan hari ini.
  setProgresWidget(4);
  const akarE = akarBaru();
  const rootE = mountWidget(akarE);
  const paketKelima = urai(daftarWidget[4]);

  uji(
    "widget melanjutkan dari soal kelima",
    await tungguSampai(() => teksHalaman().includes(teksNomorSoal(5)), 5000)
  );
  uji(
    "papan soal kelima dipasang",
    await tungguSampai(() => papanSamaData(paketKelima.fen), 5000)
  );
  uji("jatah 4/5 ditampilkan", teksHalaman().includes(teksKemajuan(4)));
  uji("dialog ajakan belum muncul", !teksHalaman().includes(teksDialog()));

  await selesaikanSoalWidget(daftarWidget[4]);

  uji(
    "progres tersimpan 5/5 setelah soal kelima selesai",
    await tungguSampai(() => progresWidget().selesai === 5, 8000)
  );
  uji(
    "dialog ajakan bergabung muncul",
    await tungguSampai(() => teksHalaman().includes(teksDialog()), 6000)
  );
  uji(
    "dialog menyebut tombol gabung Blunder Skuad",
    teksHalaman().includes(kamusLanding.harianGabung)
  );
  uji(
    "dialog menyediakan pilihan \"nanti saja\"",
    teksHalaman().includes(kamusLanding.harianDialogNanti)
  );
  uji("tidak lanjut ke soal keenam", !teksHalaman().includes(teksNomorSoal(6)));

  // Menutup dialog → panel jatah habis (bukan papan yang bisa dimainkan).
  await klikTombolTeks(kamusLanding.harianDialogNanti);
  await tunggu(300);
  uji(
    "setelah dialog ditutup muncul panel jatah habis",
    await tungguSampai(() => teksHalaman().includes(teksTerkunci()), 4000)
  );
  uji("papan dilepas saat jatah habis", dok.querySelectorAll("[data-petak]").length === 0);

  rootE.unmount();
  akarE.remove();
}

/* D4 — kunjungan ulang hari yang sama */
{
  console.log("\nD4. kunjungan ulang setelah jatah habis:");
  const akarF = akarBaru();
  const rootF = mountWidget(akarF);
  uji(
    "jatah habis tetap berlaku setelah halaman dimuat ulang",
    await tungguSampai(() => teksHalaman().includes(teksTerkunci()), 5000)
  );
  uji("tidak ada papan yang bisa dimainkan", dok.querySelectorAll("[data-petak]").length === 0);
  uji(
    "jatah terpakai dilaporkan 5/5",
    teksHalaman().includes(teksKemajuan(5))
  );
  rootF.unmount();
  akarF.remove();
}

/* D5 — tombol gabung menuju pendaftaran anggota */
{
  console.log("\nD5. tombol gabung diarahkan ke pendaftaran anggota:");
  const akarG = akarBaru();
  const rootG = mountWidgetRute(akarG);
  uji(
    "panel jatah habis tampil",
    await tungguSampai(() => teksHalaman().includes(teksTerkunci()), 5000)
  );
  await klikTombolTeks(kamusLanding.harianGabung); // buka dialog dari panel
  uji(
    "dialog terbuka dari panel jatah habis",
    await tungguSampai(() => teksHalaman().includes(teksDialog()), 4000)
  );
  await klikTombolTeks(kamusLanding.harianGabung); // aksi di dalam dialog
  uji(
    "aksi dialog berpindah ke /pendaftaran-anggota",
    await tungguSampai(() => Boolean(dok.querySelector('[data-uji="rute-gabung"]')), 4000)
  );
  rootG.unmount();
  akarG.remove();
}

/* --------------------------------- E. panel kanan & kontrol langkah */

console.log("\nE1. panel kanan (susunan ChessCompass):");
{
  stubApi = () => jawabanApi(paketTerbaru);
  const akarE = akarBaru();
  const rootE = mount(akarE, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);

  uji(
    "panel kanan dimuat bersama papan",
    await tungguSampai(() => papanSamaData(paketTerbaru.fen), 6000)
  );

  const tab = [...akarE.querySelectorAll('[role="tab"]')];
  uji("panel punya tiga tab", tab.length === 3);
  uji(
    "tab Main aktif secara bawaan",
    akarE.querySelector('[role="tab"][data-tab="utama"]')?.getAttribute("aria-selected") ===
      "true"
  );

  const strip = [...akarE.querySelectorAll("[data-hari]")];
  uji("strip kalender berisi tujuh hari", strip.length === 7);
  uji(
    "hari terakhir strip adalah tanggal yang sedang dibuka",
    strip.at(-1)?.getAttribute("data-hari") === paketTerbaru.tanggal
  );
  uji(
    "hari yang sedang dibuka ditandai aria-current",
    akarE
      .querySelector(`[data-hari="${paketTerbaru.tanggal}"]`)
      ?.getAttribute("aria-current") === "date"
  );
  uji(
    "indikator giliran memakai sisi yang melangkah",
    teksHalaman().includes(
      warnaGiliran(paketTerbaru.fen) === "w"
        ? kamus.giliranPutih
        : kamus.giliranHitam
    )
  );
  uji(
    "tombol aksi utama + dua ikon tersedia",
    Boolean(akarE.querySelector(`button[aria-label="${kamus.ulangi}"]`)) &&
      Boolean(akarE.querySelector(`button[aria-label="${kamus.balikPapan}"]`))
  );
  uji(
    "baris kontrol langkah lengkap (⏮ ◀ ▶ ⏭)",
    [
      kamus.langkahPertama,
      kamus.langkahSebelumnya,
      kamus.langkahBerikutnya,
      kamus.langkahTerakhir,
    ].every((label) => Boolean(akarE.querySelector(`button[aria-label="${label}"]`)))
  );
  uji(
    "kontrol langkah nonaktif selama belum ada langkah",
    akarE
      .querySelector(`button[aria-label="${kamus.langkahSebelumnya}"]`)
      ?.hasAttribute("disabled")
  );

  // Tab kalender
  const tabKalender = akarE.querySelector('[role="tab"][data-tab="kalender"]');
  tabKalender.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(120);
  const selKalender = [...akarE.querySelectorAll("[data-kalender-hari]")];
  const jumlahHari = new Date(
    Date.UTC(
      Number(paketTerbaru.tanggal.slice(0, 4)),
      Number(paketTerbaru.tanggal.slice(5, 7)),
      0
    )
  ).getUTCDate();
  uji(
    "tab Kalender menampilkan seluruh hari pada bulan itu",
    selKalender.length === jumlahHari,
    `${selKalender.length} sel, seharusnya ${jumlahHari}`
  );
  uji(
    "tanggal setelah hari ini tidak bisa dibuka",
    [...selKalender]
      .filter((el) => el.getAttribute("data-kalender-hari") > hariIni)
      .every((el) => el.hasAttribute("disabled"))
  );

  // Tab info
  akarE
    .querySelector('[role="tab"][data-tab="info"]')
    .dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(120);
  uji(
    "tab Info menjelaskan cara kerja teka-teki",
    teksHalaman().includes(kamus.caraKerjaPoin1)
  );

  rootE.unmount();
  akarE.remove();
}

/* E2 — strip kalender benar-benar berpindah tanggal */
console.log("\nE2. memilih tanggal dari strip kalender:");
{
  stubApi = () => jawabanApi(paketTerbaru, "Uji harian dari API");
  permintaanApi.length = 0;
  const akarF = akarBaru();
  const rootF = mount(akarF, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);
  await tungguSampai(() => papanSamaData(paketTerbaru.fen), 6000);

  const kemarin = geserTanggal(paketTerbaru.tanggal, -1);
  const tombolHari = akarF.querySelector(`[data-hari="${kemarin}"]`);
  uji("hari kemarin ada di strip", Boolean(tombolHari));
  permintaanApi.length = 0;
  tombolHari?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(250);
  uji(
    "halaman meminta tanggal hasil klik ke API",
    permintaanApi.some((a) => a.includes(`tanggal=${kemarin}`)),
    permintaanApi.join(", ")
  );
  // Panel kiri tidak lagi memuat pemilih tanggal (dihapus atas permintaan,
  // karena panel kanan sudah mewakilinya) — jadi perubahan tanggal dibuktikan
  // lewat penanda aria-current di strip.
  uji(
    "hari yang baru dibuka ditandai aria-current di strip",
    akarF
      .querySelector(`[data-hari="${kemarin}"]`)
      ?.getAttribute("aria-current") === "date"
  );

  rootF.unmount();
  akarF.remove();
}

/* E3 — tinjauan langkah, orientasi tetap, dan Ulangi */
console.log("\nE3. kontrol langkah, orientasi, dan Ulangi:");
{
  stubApi = () => jawabanApi(paketTerbaru);
  const akarG = akarBaru();
  const rootG = mount(akarG, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);
  await tungguSampai(() => papanSamaData(paketTerbaru.fen), 6000);

  const petakPertama = () =>
    akarG.querySelector("[data-petak]")?.getAttribute("data-petak");
  uji("orientasi awal mengikuti sisi yang melangkah", petakPertama() === "a8");

  // Satu langkah pemain (+ balasan lawan) — dua setengah-langkah.
  const langkahSatu = parseLangkah(paketTerbaru.langkah[0]);
  await mainkan(langkahSatu.from, langkahSatu.to);
  const harapDua =
    paketTerbaru.langkah.length > 1
      ? fenSetelah(paketTerbaru.fen, paketTerbaru.langkah, 2)
      : fenSetelah(paketTerbaru.fen, paketTerbaru.langkah, 1);
  await tungguSampai(() => papanSamaData(harapDua), 4000);

  uji(
    "orientasi papan TIDAK berputar setelah langkah dimainkan",
    petakPertama() === "a8"
  );

  const klikTombol = async (label) => {
    akarG
      .querySelector(`button[aria-label="${label}"]`)
      ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await tunggu(150);
  };

  await klikTombol(kamus.langkahPertama);
  uji(
    "tombol ⏮ mengembalikan papan ke posisi awal",
    papanSamaData(paketTerbaru.fen)
  );
  uji(
    "pesan tinjauan menampilkan nomor langkah",
    teksHalaman().includes(
      kamus.tinjauLangkah.replace("{n}", "0").replace("{total}", paketTerbaru.langkah.length > 1 ? "2" : "1")
    )
  );

  // Saat meninjau, papan terkunci: klik bidak tidak memunculkan pilihan.
  await klikPetak(parseLangkah(paketTerbaru.langkah[0]).from);
  await tunggu(120);
  uji(
    "papan terkunci selama meninjau (tidak ada bidak terpilih)",
    akarG.querySelectorAll("[data-bantu-pilih]").length === 0
  );

  await klikTombol(kamus.langkahBerikutnya);
  uji("tombol ▶ maju satu langkah", papanSamaData(fenSetelah(paketTerbaru.fen, paketTerbaru.langkah, 1)));

  await klikTombol(kamus.langkahTerakhir);
  uji("tombol ⏭ kembali ke posisi terkini", papanSamaData(harapDua));

  // Regresi: dulu "Ulangi" menghapus papan karena membaca `soal.fen` yang kosong.
  await klikTombol(kamus.ulangi);
  uji(
    "Ulangi mengembalikan posisi ke awal (papan tidak hilang)",
    papanSamaData(paketTerbaru.fen)
  );
  uji(
    "papan tetap terpasang setelah Ulangi",
    akarG.querySelectorAll("[data-petak]").length === 64
  );

  await klikTombol(kamus.balikPapan);
  uji(
    "tombol Balik papan membalik orientasi",
    akarG.querySelector("[data-petak]")?.getAttribute("data-petak") === "h1"
  );

  rootG.unmount();
  akarG.remove();
}

/* E4 — panel kiri tidak lagi menduplikasi isi panel kanan */
console.log("\nE4. panel kiri tanpa duplikasi panel kanan:");
{
  stubApi = () => jawabanApi(paketTerbaru, "Uji harian dari API");
  const akarH = akarBaru();
  const rootH = mount(akarH, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);
  await tungguSampai(() => papanSamaData(paketTerbaru.fen), 6000);

  const sidebar = akarH.querySelectorAll("aside")[0];
  uji("sidebar kiri tetap ada", Boolean(sidebar));
  const teksSidebar = sidebar?.textContent || "";
  uji(
    "tidak ada lagi pemilih tanggal di panel kiri",
    !sidebar?.querySelector('input[type="date"]') &&
      !teksSidebar.includes(kamus.pilihTanggal)
  );
  uji(
    "tidak ada lagi label Hari ini · tanggal di panel kiri",
    !teksSidebar.includes(kamus.hariIni)
  );
  uji(
    "tidak ada lagi indikator giliran di panel kiri",
    !teksSidebar.includes(kamus.giliranMelangkah)
  );
  uji(
    "tidak ada lagi tombol Petunjuk di panel kiri",
    !Array.from(sidebar?.querySelectorAll("button") || []).some(
      (b) => (b.textContent || "").trim() === kamus.petunjuk
    )
  );
  uji(
    "umpan balik langkah (aria-live) tetap ada di panel kiri",
    Boolean(sidebar?.querySelector('[aria-live="polite"]'))
  );
  uji(
    "Lisensi tetap ada di kaki panel kiri",
    (sidebar?.textContent || "").includes(kamusAtribusi.menuAtribusi)
  );

  rootH.unmount();
  akarH.remove();
}

/* E5 — panel selisih materi di samping papan */
console.log("\nE5. selisih materi di samping papan:");
{
  stubApi = () => jawabanApi(paketTerbaru, "Uji harian dari API");
  const akarI = akarBaru();
  const rootI = mount(akarI, `/teka-teki-harian?tanggal=${paketTerbaru.tanggal}`);
  await tungguSampai(() => papanSamaData(paketTerbaru.fen), 6000);

  const rel = akarI.querySelector("[data-selisih]");
  uji("panel selisih materi tampil", Boolean(rel));
  const dihitung = hitungMateriBidak(paketTerbaru.fen);
  uji(
    "nilainya mengikuti FEN yang ditampilkan",
    rel?.getAttribute("data-selisih") === String(dihitung.selisih)
  );
  uji(
    "daftar bidak tertangkap ikut ditampilkan",
    rel?.getAttribute("data-keping") === dihitung.keping.map((k) => k.bidak).join("")
  );
  uji(
    "panel berada di sebelah papan, bukan di panel kanan",
    rel?.parentElement?.tagName === "SECTION" &&
      (rel.parentElement.querySelectorAll("[data-petak]").length === 64 ||
        papanSamaData(paketTerbaru.fen)) &&
      !rel.closest("aside")
  );
  uji(
    "punya label aksesibel selisih materi",
    (rel?.getAttribute("aria-label") || "").startsWith(
      kamus.materiAria.split("{teks}")[0].trim()
    )
  );
  rootI.unmount();
  akarI.remove();
}
{
  // Posisi buatan: putih punya ratu lebih, jadi angkanya harus +9 — membuktikan
  // nilainya dihitung dari papan, bukan angka tetap.
  const paketRatu = {
    tanggal: paketTerbaru.tanggal,
    fen: "4k3/8/8/8/8/8/8/4KQ2 w - - 0 1",
    langkah: ["f1-f7", "e8-d8", "f7-f8"],
  };
  stubApi = () => jawabanApi(paketRatu, "Soal ratu lebih");
  const akarJ = akarBaru();
  const rootJ = mount(akarJ, `/teka-teki-harian?tanggal=${paketRatu.tanggal}`);
  await tungguSampai(() => papanSamaData(paketRatu.fen), 6000);
  const rel = akarJ.querySelector("[data-selisih]");
  uji("posisi ratu lebih: hitungan +9", rel?.getAttribute("data-selisih") === "9");
  uji(
    "label menyebut putih unggul 9",
    (rel?.getAttribute("aria-label") || "").includes(
      kamus.materiPutihUnggul.replace("{n}", "9")
    )
  );
  rootJ.unmount();
  akarJ.remove();
}

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.error = consoleErrorAsli;
console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
