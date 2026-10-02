/**
 * Uji kebijakan langkah penutup Teka-teki: harus persis solusi.
 *
 * Mengapa perlu: `cobaLangkah` dulu punya cabang `if (sisa.length === 1)` yang
 * menerima skakmat legal APA PUN sebagai langkah penutup, berbeda dari Rush
 * yang menuntut solusi persis (docs/REVIEW-PERBAIKAN-LATIHAN.md A1). Uji ini
 * mengunci perilaku baru: pada posisi langkah terakhir, mate alternatif
 * ditolak, dan hanya langkah solusi yang menuntaskan soal.
 *
 * Caranya: halaman TekaTeki sungguhan dipasang di jsdom dengan `fetch` palsu
 * yang membaca dari `public/`. Langkah dimainkan lewat klik petak
 * (`klikPetak`), bukan seret: jalur seret memakai `cariPetak(clientX,
 * clientY)` yang butuh tata letak, sedangkan jsdom tidak menghitungnya.
 * Posisi papan dibaca dari `aria-label` tiap `[data-petak]`, jadi tidak
 * bergantung pada gambar bidak. Aset bidak tetap dipecah oleh shim
 * `import.meta.glob` yang sama dengan Node loader, sehingga skrip ini ikut
 * gagal kalau pemanggilan glob di `ChessPiece` berubah bentuk dan tidak
 * lagi di-expand Vite.
 *
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-tekateki-solusi.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";
import { Chess } from "chess.js";
import { parseLangkah, terapkan } from "../src/lib/tekaTeki.js";
import { tekaTeki as kamus } from "../src/lib/terjemahan/id/tekaTeki.js";

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
  console.log("lewati uji solusi teka-teki — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(0);
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

/* ------------------------------------------------------------- soal uji */

const { problems } = JSON.parse(readFileSync(path.join(ROOT, "public", "data", "teka-teki.json"), "utf8"));

/**
 * Soal pertama (dari 400 soal pertama) yang punya mate alternatif di langkah
 * terakhir, yaitu skakmat legal yang bukan langkah solusi. Soal inilah yang
 * dulu bisa dituntaskan tanpa menemukan solusinya. Langkah promosi dihindari
 * supaya dialog promosi tidak ikut diuji di sini.
 */
function cariSoal() {
  for (const soal of problems.slice(0, 400)) {
    const langkah = String(soal.moves || "").split(";").filter(Boolean);
    if (langkah.length < 3 || langkah.length % 2 === 0) continue;
    if (langkah.some((teks) => parseLangkah(teks).promo)) continue;

    let fen = soal.fen;
    try {
      for (const teks of langkah.slice(0, -1)) fen = terapkan(fen, parseLangkah(teks)).fen();
    } catch {
      continue;
    }

    const solusi = parseLangkah(langkah[langkah.length - 1]);
    let papan;
    try {
      papan = new Chess(fen);
    } catch {
      continue;
    }

    for (const m of papan.moves({ verbose: true })) {
      if (m.promotion) continue;
      if (m.from === solusi.from && m.to === solusi.to) continue;
      try {
        const ujiPapan = new Chess(fen);
        ujiPapan.move({ from: m.from, to: m.to });
        if (ujiPapan.isCheckmate()) {
          return {
            soal,
            fenAkhir: fen,
            solusi,
            alternatif: { from: m.from, to: m.to },
            pertama: parseLangkah(langkah[0]),
          };
        }
      } catch {
        /* langkah tidak dapat diterapkan: bukan kandidat */
      }
    }
  }
  return null;
}

const soalUji = cariSoal();
uji("data punya soal dengan mate alternatif di langkah terakhir", !!soalUji);
if (!soalUji) {
  console.log("\ntidak ada soal uji yang cocok; batal.");
  process.exit(1);
}

/* -------------------------------------------------- bundel halaman (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "./src/lib/i18n.jsx";
import TekaTeki from "./src/halaman/TekaTeki/TekaTeki.jsx";

export function mount(el) {
  return createRoot(el).render(
    <MemoryRouter initialEntries={["/teka-teki?id=__ID__"]}>
      <I18nProvider><TekaTeki /></I18nProvider>
    </MemoryRouter>
  );
}
`.replace("__ID__", String(soalUji.soal.problemid));

const berkasBundel = path.join(tmpdir(), "kci-uji-tekateki-solusi.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-tekateki-solusi-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "text" },
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
    return { connect: () => {}, start: () => {}, stop: () => {}, buffer: null, playbackRate: { value: 1 } };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
  resume() {
    return Promise.resolve();
  }
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/teka-teki",
  pretendToBeVisual: true,
});
const { window } = dom;

function siapkanGlobal() {
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
      return Promise.reject(new Error(`tidak ada: ${relatif}`));
    }
  };
  // Modul yang dibundel memanggil `fetch` bebas, bukan `window.fetch`.
  globalThis.fetch = window.fetch;
}

siapkanGlobal();

const domSiap = window.document;
const pesanGalat = [];
const consoleErrorAsli = console.error;
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function tungguSampai(syarat, batasMs = 3000) {
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

/** Peta petak → aria-label yang seharusnya dipasang halaman untuk FEN ini. */
function labelDariFen(fen) {
  const peta = new Map();
  new Chess(fen)
    .board()
    .forEach((baris, i) =>
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

function labelPapan() {
  const peta = new Map();
  for (const el of domSiap.querySelectorAll("[data-petak]")) {
    peta.set(el.getAttribute("data-petak"), el.getAttribute("aria-label"));
  }
  return peta;
}

/** Apakah papan di layar berisi bidak persis seperti FEN ini. */
function papanSama(fen) {
  const harap = labelDariFen(fen);
  const kini = labelPapan();
  if (kini.size !== harap.size) return false;
  for (const [sq, label] of harap) {
    if (kini.get(sq) !== label) return false;
  }
  return true;
}

/** Mainkan satu langkah lewat dua klik: pilih petak asal, lalu petak tujuan. */
async function mainkan(from, to) {
  const asal = domSiap.querySelector(`[data-petak="${from}"]`);
  const tujuan = domSiap.querySelector(`[data-petak="${to}"]`);
  if (!asal || !tujuan) throw new Error(`petak ${from}/${to} tidak ada di papan`);
  asal.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(80);
  tujuan.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

/** Daftar soal yang sudah ditandai terpecahkan halaman (localStorage). */
function terpecahkan() {
  try {
    return JSON.parse(window.localStorage.getItem("kci-teka-teki-terpecahkan") || "[]");
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ uji */

console.log(
  `\nsoal #${soalUji.soal.problemid} (${soalUji.soal.first}), langkah: ${soalUji.soal.moves}`
);
console.log(`mate alternatif yang dulu diterima: ${soalUji.alternatif.from}-${soalUji.alternatif.to}`);

const { mount } = require(berkasBundel);
mount(domSiap.getElementById("root"));

console.log("\npemuatan halaman:");
uji(
  "papan 64 petak tampil",
  await tungguSampai(() => domSiap.querySelectorAll("[data-petak]").length === 64, 5000)
);
uji("posisi awal sesuai data soal", papanSama(soalUji.soal.fen));

console.log("\nlangkah pemain pertama dan balasan komputer:");
await mainkan(soalUji.pertama.from, soalUji.pertama.to);
uji(
  "mencapai posisi langkah terakhir",
  await tungguSampai(() => papanSama(soalUji.fenAkhir), 4000)
);

console.log("\nlangkah penutup harus persis solusi:");
await mainkan(soalUji.alternatif.from, soalUji.alternatif.to);
await tunggu(400);
uji("mate alternatif tidak mengubah posisi", papanSama(soalUji.fenAkhir));
uji("pesan salah muncul untuk mate alternatif", domSiap.body.textContent.includes(kamus.salah));
uji("soal belum tercatat terpecahkan", !terpecahkan().includes(soalUji.soal.problemid));

await mainkan(soalUji.solusi.from, soalUji.solusi.to);
uji(
  "langkah solusi menuntaskan soal",
  await tungguSampai(() => terpecahkan().includes(soalUji.soal.problemid), 3000)
);

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.error = consoleErrorAsli;
console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
