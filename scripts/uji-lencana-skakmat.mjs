/**
 * Uji lencana skakmat di papan teka-teki (dan papan interaktif).
 *
 * Mengapa perlu: papan menampilkan ikon klasifikasi langkah (brilian/terbaik/
 * blunder, …) di pojok petak tujuan, tetapi sampai sekarang tidak ada tanda
 * apa pun di atas raja lawan yang termat. Lencana skakmat baru
 * (`ikonSkakmat`, memakai ikon "defeat" dari set hasil Analisa) gampang lepas
 * saat papan di-refactor, jadi
 * uji ini menguncinya dari dua sisi:
 *   1. logika `petakRajaTermat` (chess.js) — posisi skakmat/seri/bukan;
 *   2. render sungguhan `PapanTekaTeki` di jsdom — lencana harus nempel di
 *      petak raja yang termat, dan ikon langkah lama tetap utuh;
 *   3. alur penuh halaman TekaTeki — mainkan langkah terakhir satu soal
 *      "Mate in One" dari basis data, lalu pastikan lencananya muncul.
 *
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-lencana-skakmat.mjs
 */
import { readFileSync } from "node:fs";
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

/* ------------------------------------------- 1. logika petakRajaTermat */

const { petakRajaTermat } = await import("../src/lib/skakmat.js");

// Soal asli Lichess (problemid 6, "Mate in One"): hitam jalan, Rd1# → raja
// putih di g1 termat.
const FEN_SOAL = "3r1k2/p5pp/2p2p2/P7/2R5/8/1P3PPP/6K1 b - - 0 32";
const { Chess } = require("chess.js");
const FEN_MAT = new Chess(FEN_SOAL).move("d8-d1").after;
// Skak biasa (bukan mat): menteri putih menyerang raja hitam di sepanjang lajur e.
const FEN_SKAK = "4k3/8/8/8/8/8/4Q3/4K3 b - - 0 1";
// Seri karena buntu (stalemate): hitam Kh8, putih Qf7 didukung Kg6.
const FEN_BUNTU = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

console.log("logika petakRajaTermat:");
uji("sanity: FEN_SOAL memang jadi skakmat", new Chess(FEN_MAT).isCheckmate());
uji("posisi skakmat → petak raja yang termat (g1)", petakRajaTermat(FEN_MAT) === "g1");
uji("posisi sebelum langkah mat → null", petakRajaTermat(FEN_SOAL) === null);
uji("posisi skak (bukan mat) → null", petakRajaTermat(FEN_SKAK) === null);
uji("posisi buntu/seri → null", petakRajaTermat(FEN_BUNTU) === null);
uji("posisi awal → null", petakRajaTermat(FEN_AWAL) === null);
uji("FEN rusak / kosong → null (tidak melempar)", petakRajaTermat("bukan-fen") === null && petakRajaTermat("") === null);

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("\nlewati uji render — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  console.log(`\n${lulus} lulus, ${gagal} gagal`);
  process.exit(gagal ? 1 : 0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

/* ------------------------------------------------ bundel komponen (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";
import TekaTeki from "./src/halaman/TekaTeki/TekaTeki.jsx";

/** Papan saja — dipakai untuk memeriksa posisi lencana di dalam petak. */
export function mountPapan(el, { fen, orientasi = "w", ikonLangkah = null, ikonSkakmat = null }) {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <PapanTekaTeki
        fen={fen}
        orientasi={orientasi}
        ikonLangkah={ikonLangkah}
        ikonSkakmat={ikonSkakmat}
        onKlik={() => {}}
      />
    </I18nProvider>
  );
  return root;
}

/** Halaman teka-teki penuh — soal dipilih lewat ?id= agar deterministik. */
export function mountTekaTeki(el, id) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[\`/teka-teki?id=\${id}\`]}>
        <I18nProvider>
          <TekaTeki />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-lencana-skakmat.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-lencana-skakmat-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` hanya ada di Vite (dipakai ChessPiece untuk memuat SVG
  // bidak). Di luar Vite diganti fungsi kosong — bidak tidak tergambar, tapi
  // lencana/petak yang diuji tetap ter-render.
  banner: { js: "function __globPalsu() { return {}; }" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    "import.meta.glob": "__globPalsu",
  },
  logLevel: "error",
});

/* ------------------------------------------------------- lingkungan jsdom */

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/** Worker palsu — halaman teka-teki hanya memakainya bila engine dinyalakan. */
class WorkerPalsu {
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  terminate() {}
}

function siapkanGlobal(window) {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.Worker = WorkerPalsu;
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
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.Worker = WorkerPalsu;
  for (const nama of ["HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent"]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
}

/** Sajikan berkas /public dari disk; permintaan keluar (tablebase) ditolak. */
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

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/teka-teki?id=6",
  pretendToBeVisual: true,
});
siapkanGlobal(dom.window);
pasangFetch(dom.window);
// Kode bundel memanggil `fetch` bebas — di Node itu fetch bawaan (undici) yang
// benar-benar menembak jaringan, jadi global-nya ikut diarahkan ke stub lokal.
globalThis.fetch = dom.window.fetch;
const domSiap = dom.window.document;

const pesanGalat = [];
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** Semua lencana skakmat yang ter-render di dalam wadah. */
function lencanaSkakmat(wadah) {
  return [...wadah.querySelectorAll('[title^="Skakmat"]')];
}

/* --------------------------------------------- 2. render PapanTekaTeki */

console.log("\nrender PapanTekaTeki:");
{
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  modul.mountPapan(wadah, {
    fen: FEN_MAT,
    orientasi: "b",
    ikonSkakmat: { petak: "g1" },
  });
  await tunggu(250);
  const lencana = lencanaSkakmat(wadah);
  uji("lencana skakmat ter-render tepat satu", lencana.length === 1);
  uji(
    "lencana nempel di petak raja yang termat (g1)",
    lencana[0]?.closest('[data-petak="g1"]') !== null
  );
  uji(
    "lencana memakai ikon hasil Analisa (defeat, merah) — bukan kotak kosong",
    (lencana[0]?.innerHTML || "").includes("e02828") &&
      lencana[0].querySelectorAll("svg path, svg rect").length >= 3
  );
  wadah.remove();
}

{
  // Regresi: ikon klasifikasi langkah yang lama tidak boleh berubah/hilang,
  // dan lencana skakmat tidak boleh muncul sendiri tanpa skakmat.
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  modul.mountPapan(wadah, {
    fen: FEN_SOAL,
    orientasi: "b",
    ikonLangkah: { petak: "d4", rating: "best" },
  });
  await tunggu(250);
  uji("ikon 'langkah terbaik' tetap tampil", !!wadah.querySelector('[title="Langkah terbaik"]'));
  uji("tanpa skakmat → tanpa lencana skakmat", lencanaSkakmat(wadah).length === 0);
  wadah.remove();
}

{
  // Kedua lencana bisa tampil bersamaan (petak tujuan ≠ petak raja).
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  modul.mountPapan(wadah, {
    fen: FEN_MAT,
    orientasi: "b",
    ikonLangkah: { petak: "d1", rating: "best" },
    ikonSkakmat: { petak: "g1" },
  });
  await tunggu(250);
  uji(
    "ikon langkah + lencana skakmat tampil berdampingan",
    !!wadah.querySelector('[title="Langkah terbaik"]') &&
      lencanaSkakmat(wadah)[0]?.closest('[data-petak="g1"]') !== null
  );
  wadah.remove();
}

/* ---------------------------------------------- 3. alur penuh halaman */

console.log("\nalur halaman TekaTeki (soal Mate in One, id=6):");
const wadahHalaman = domSiap.getElementById("root");
modul.mountTekaTeki(wadahHalaman, 6);
await tunggu(1200);

uji("papan teka-teki ter-render", wadahHalaman.querySelectorAll("[data-petak]").length === 64);
uji("belum ada lencana sebelum langkah mat", lencanaSkakmat(wadahHalaman).length === 0);

/** Klik satu petak (alur klik-pilih → klik-tujuan, sama seperti pengguna). */
function klikPetak(petak) {
  const el = wadahHalaman.querySelector(`[data-petak="${petak}"]`);
  el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, button: 0 }));
}

klikPetak("d8"); // pilih benteng hitam
await tunggu(200);
klikPetak("d1"); // Rd1#
await tunggu(600);

const lencanaAkhir = lencanaSkakmat(wadahHalaman);
uji("lencana skakmat muncul setelah langkah mat", lencanaAkhir.length === 1);
uji(
  "lencananya di atas raja lawan yang termat (g1)",
  lencanaAkhir[0]?.closest('[data-petak="g1"]') !== null
);
uji(
  "soal tercatat terpecahkan (langkah mat diterima)",
  /terpecahkan|Terpecahkan|Skakmat/i.test(wadahHalaman.textContent.replace(/\s+/g, " "))
);

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
