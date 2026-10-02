#!/usr/bin/env node
/**
 * Uji kontrak RENDER BIDAK: dari berkas di `src/asets/` sampai `<img>` yang
 * benar-benar muncul di papan.
 *
 * Mengapa ada: penjaga `uji:glob-aset` mengunci bentuk makro `import.meta.glob`
 * dan perilaku shim, bukan kontrak render. Masih ada lubang yang gejalanya selalu
 * sama: papan tampil kosong, tanpa galat. Commit 85ddcfa (PR #167) membungkus
 * makro itu dengan guard `typeof`, Vite tidak meng-expandnya, peta aset jadi `{}`,
 * dan `ChessPiece` yang berisi `if (!sumber) return null;` menghapus seluruh
 * bidak tanpa satu pun pesan. Tidak satu pun langkah lain `npm run uji`
 * menangkapnya; yang menangkap akhirnya Playwright di CI setelah ~9 menit dan 8
 * tes gagal.
 *
 * Uji ini menutup lubang itu dalam hitungan detik, dengan empat lapis:
 *
 *   A. Kontrak peta aset (murni, tanpa DOM) — untuk setiap pasangan set × bidak,
 *      `jalurAset` harus mengembalikan jalur yang benar-benar ada di disk, dan
 *      jumlah berkas di `src/asets/` harus sama dengan jumlah pasangan terpetakan.
 *      Menangkap aset yang dihapus atau di-rename, pemetaan `KODE_ASET` yang
 *      salah, dan set baru yang ditambahkan tanpa folder asetnya.
 *   B. Kontrak pemuatan — `muatSet` harus mengembalikan 12 aset untuk tiap set,
 *      set tak dikenal jatuh ke set bawaan, dan pemanggilan kedua memakai cache.
 *      Menangkap bug cache `muatSet`/`syncCache`.
 *   C. Render papan sungguhan di jsdom — 64 petak dan 32 `<img>` dengan src dan
 *      alt terisi; `[data-petak="e2"] img` = 1 dan `[data-petak="e4"] img` = 0.
 *      Cerminan assertion `tests/e2e/pembukaan.spec.js:289` yang gagal di CI,
 *      diulang untuk set non-default `chesscom` (cabang `.png` pada `jalurAset`).
 *   D. Papan mini halaman Pembukaan — papan pertama berisi 64 petak dan 32
 *      `<img>`. Cerminan assertion `tests/e2e/pembukaan.spec.js:104` yang juga
 *      gagal di CI. `PapanMini` tidak diekspor, jadi halaman dirender lewat
 *      default export `Pembukaan()` tanpa menyentuh `src/`.
 *
 * Lapis A dan B dilewati bila esbuild tidak terpasang; lapis C dan D juga bila
 * jsdom tidak terpasang — keduanya bukan dependensi runtime situs.
 *
 * C dan D sengaja tidak berhenti di branch "modul gagal dimuat": keduanya harus
 * ikut melapor gagal saat regresi 85ddcfa membuat peta aset kosong, karena di
 * situlah bug itu muncul tanpa satu pun pesan galat.
 *
 * Jalankan: node scripts/uji-render-bidak.mjs  |  npm run uji:render-bidak
 */
import { createRequire, register } from "node:module";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));
const DIR_BIDAK = path.join(ROOT, "src/components/chess");
const POLA_ASET = "../../asets/*/*.{svg,png}";
/** Batas bawah jumlah aset: tanpa ini, folder aset yang kosong membuat A lulus hampa. */
const MINIMAL_ASET = 100;
/**
 * Kode bidak dipakai `NAMA_BIDAK` di ChessPiece.jsx. Konstantanya tidak
 * diekspor, jadi daftarnya dicerminkan di sini; lapis B mengunci jumlah 12,
 * sehingga bidak baru yang ditambahkan di sana akan menggagalkan uji ini.
 */
const KODE_BIDAK = ["K", "Q", "R", "B", "N", "P", "k", "q", "r", "b", "n", "p"];
const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let lulus = 0;
let gagal = 0;
let dilewati = 0;
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
function lewati(nama, alasan) {
  dilewati++;
  console.log(`  – ${nama} DILEWATI: ${alasan}`);
}
/** Ringkas daftar masalah jadi satu baris keterangan yang masih terbaca. */
function ringkas(daftar, batas = 8) {
  const unik = [...new Set(daftar)];
  const isi = unik.slice(0, batas).join(" | ");
  return unik.length > batas ? `${isi} | ... dan ${unik.length - batas} lagi` : isi;
}
function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

const adaEsbuild = ada("esbuild");
const adaJsdom = ada("jsdom");

/**
 * Shim glob menolak bentuk `import.meta.glob` yang tidak di-expand Vite, jadi
 * modul bidak gagal di-eval ketika petanya kosong. Kegagalan itu lebih cepat
 * dan lebih eksplisit daripada render kosong, tetapi tetap harus dilaporkan
 * sebagai kegagalan kontrak render — bukan dibiarkan menjadi galat tak
 * tertangani yang menghentikan skrip di tengah jalan.
 */
const modulBidak = { dimuat: null, galat: null };
if (adaEsbuild) {
  register(new URL("./loader-jsx.mjs", import.meta.url));
  try {
    modulBidak.dimuat = await import("../src/components/chess/ChessPiece.jsx");
  } catch (e) {
    modulBidak.galat = e;
  }
}
const PETA_KOSONG = modulBidak.galat
  ? `peta aset kosong — ${String(modulBidak.galat.message).split("\n")[0]}`
  : "";

/* ============================ A. kontrak peta aset ============================ */

console.log("\nA. kontrak peta aset (murni, tanpa DOM)");

if (modulBidak.galat) {
  uji("modul bidak termuat dan peta aset terpecah", false, PETA_KOSONG);
} else if (!modulBidak.dimuat) {
  lewati("A. kontrak peta aset", "esbuild tidak terpasang");
} else {
  const { DAFTAR_SET, jalurAset } = modulBidak.dimuat;
  // Namespace loader diakses lewat anggota, bukan destructuring: pada skrip ini
  // `const { x } = await import("./loader-jsx.mjs")` menghasilkan `undefined`
  // meski kunci exports-nya ada, karena modul itu dimuat lewat rantai loader yang
  // baru terdaftar. Akses anggota menghindari hal itu.
  const loaderUji = await import("./loader-jsx.mjs");
  const diDisk = loaderUji.temukanBerkasGlob(POLA_ASET, DIR_BIDAK);
  const jalurDiDisk = new Set(diDisk.map((f) => f.relatif));

  const tanpaJalur = [];
  const takAdaDiDisk = [];
  const terpetakan = new Set();
  for (const set of DAFTAR_SET) {
    for (const kode of KODE_BIDAK) {
      const jalur = jalurAset(set.id, kode);
      if (typeof jalur !== "string" || !jalur) {
        tanpaJalur.push(`${set.id}/${kode} → jalurAset mengembalikan ${JSON.stringify(jalur)}`);
        continue;
      }
      terpetakan.add(jalur);
      if (!existsSync(path.resolve(DIR_BIDAK, jalur))) {
        takAdaDiDisk.push(`${set.id}/${kode} → ${jalur} tidak ada di disk`);
      }
    }
  }
  const totalPasangan = DAFTAR_SET.length * KODE_BIDAK.length;

  uji(`jalurAset mengembalikan jalur untuk ${totalPasangan} pasangan set x bidak`, tanpaJalur.length === 0, ringkas(tanpaJalur));
  uji(`kedua ${totalPasangan} jalur itu benar-benar ada di disk`, takAdaDiDisk.length === 0, ringkas(takAdaDiDisk));
  uji(
    `tidak ada aset yatim di src/asets (${diDisk.length} berkas, minimal ${MINIMAL_ASET})`,
    diDisk.length >= MINIMAL_ASET,
    `hanya ${diDisk.length} berkas`
  );
  const yatim = [...jalurDiDisk].filter((j) => !terpetakan.has(j));
  uji(`tidak ada pemetaan yang menunjuk berkas hantu (${terpetakan.size} jalur)`, yatim.length === 0, ringkas(yatim));
  const hantu = [...terpetakan].filter((j) => !jalurDiDisk.has(j));
  uji(
    `jumlah pasangan terpetakan sama dengan jumlah berkas di disk (${totalPasangan} = ${diDisk.length})`,
    hantu.length === 0 && totalPasangan === diDisk.length,
    ringkas(hantu)
  );
}

/* ============================ B. kontrak pemuatan ============================ */

console.log("\nB. kontrak pemuatan muatSet");

if (modulBidak.galat) {
  uji("muatSet mengembalikan seluruh aset setiap set", false, PETA_KOSONG);
} else if (!modulBidak.dimuat) {
  lewati("B. kontrak pemuatan", "esbuild tidak terpasang");
} else {
  const { DAFTAR_SET, muatSet } = modulBidak.dimuat;
  const petaBawaan = await muatSet("bidak");

  for (const set of DAFTAR_SET) {
    let peta = null;
    let galat = null;
    try {
      peta = await muatSet(set.id);
    } catch (e) {
      galat = e;
    }
    if (galat) {
      uji(`muatSet("${set.id}") mengembalikan 12 aset`, false, `peta aset kosong — ${galat.message}`);
      continue;
    }
    const kunci = Object.keys(peta);
    const kosong = kunci.filter((k) => !peta[k]);
    uji(
      `muatSet("${set.id}") mengembalikan 12 aset tanpa nilai kosong`,
      kunci.length === 12 && kosong.length === 0,
      kosong.length ? `${kosong.length} entri kosong` : `${kunci.length} entri`
    );
  }

  let bawaan = null;
  let melempar = null;
  try {
    bawaan = await muatSet("set-yang-tidak-ada");
  } catch (e) {
    melempar = e;
  }
  uji(
    'muatSet("set-yang-tidak-ada") jatuh ke set bawaan "bidak", bukan melempar',
    !melempar && bawaan === petaBawaan,
    melempar ? `melempar: ${melempar.message}` : "hasil bukan set bawaan"
  );

  const sekali = await muatSet("merida");
  const duaKali = await muatSet("merida");
  uji("pemanggilan kedua untuk set yang sama memakai cache (referensi identik)", sekali === duaKali);
}

/* ============ Bundel uji: PapanTekaTeki dan halaman Pembukaan ============ */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/i18n.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Pembukaan from "./src/halaman/ProgramKami/Pembukaan.jsx";

export function mountPapan(el, fen, setBidak) {
  const akar = createRoot(el);
  akar.render(
    <I18nProvider>
      <PapanTekaTeki fen={fen} setBidak={setBidak} onKlik={() => {}} />
    </I18nProvider>
  );
  return () => akar.unmount();
}

export function mountPembukaan(el) {
  const akar = createRoot(el);
  akar.render(
    <HelmetProvider>
      <MemoryRouter>
        <I18nProvider>
          <Pembukaan />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return () => akar.unmount();
}
`;

let modul = null;
let galatBuild = null;
const berkasBundel = path.join(tmpdir(), "kci-uji-render-bidak.cjs");
if (modulBidak.galat) {
  galatBuild = PETA_KOSONG;
} else if (!adaEsbuild || !adaJsdom) {
  galatBuild = null;
} else {
  const loaderUji = await import("./loader-jsx.mjs");
  const { build } = require("esbuild");
  try {
    await build({
      stdin: {
        contents: MASUK,
        resolveDir: ROOT,
        loader: "jsx",
        sourcefile: "uji-render-bidak-entry.jsx",
      },
      bundle: true,
      format: "cjs",
      platform: "browser",
      outfile: berkasBundel,
      loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
      // Shim glob yang sama dengan Node loader: bentuk tak langsung yang tidak
      // di-expand Vite berhenti di sini, bukan jadi peta kosong yang senyap.
      plugins: [loaderUji.pluginGlobAset()],
      define: {
        "process.env.NODE_ENV": '"development"',
        "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
      },
      logLevel: "error",
    });
    modul = require(berkasBundel);
  } catch (e) {
    const pertama = e?.errors?.[0]?.text || String(e.message).split("\n")[0];
    galatBuild = `peta aset kosong — ${pertama}`;
  }
}

/** Satu lingkungan jsdom dipakai bersama oleh lapis C dan D. */
let wadah = null;
let lingkungan = null;
if (modul && !galatBuild) {
  class PengamatPalsu {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const { JSDOM } = require("jsdom");
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "https://uji.test/program-kami/pembukaan",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const UKURAN = 640;
  window.Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return { x: 0, y: 0, left: 0, top: 0, right: UKURAN, bottom: UKURAN, width: UKURAN, height: UKURAN };
  };
  window.Element.prototype.animate = function animate() {
    return { finished: Promise.resolve(), cancel() {}, set oncancel(_) {} };
  };
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};

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

  wadah = window.document.getElementById("root");
  lingkungan = { window };
}

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));
/** Tunggu sampai syarat terpenuhi; runner CI jauh lebih lambat dari mesin dev. */
async function tungguSampai(syarat, batas = 6000, langkah = 25) {
  const tenggat = Date.now() + batas;
  while (Date.now() < tenggat) {
    if (syarat()) return true;
    await tunggu(langkah);
  }
  return syarat();
}

/** Alasan lapis C/D dilewati; branch galat sudah ditangani terpisah di atas. */
const ALASAN_LEWAT = !adaEsbuild
  ? "esbuild tidak terpasang"
  : !adaJsdom
    ? "jsdom tidak terpasang"
    : "jsdom tidak disiapkan";

/* ================== C. render papan sungguhan di jsdom ================== */

console.log("\nC. render PapanTekaTeki di jsdom (cermin pembukaan.spec.js:289)");

if (modulBidak.galat) {
  uji("papan ter-render dengan 32 gambar bidak", false, PETA_KOSONG);
} else if (galatBuild) {
  uji("papan ter-render dengan 32 gambar bidak", false, galatBuild);
} else if (!lingkungan) {
  lewati("C. render papan", ALASAN_LEWAT);
} else {
  /** Cerminan assertion yang gagal di CI: 64 petak, 32 img, e2 berisi, e4 kosong. */
  async function periksaPapan(setBidak) {
    const lepas = modul.mountPapan(wadah, FEN_AWAL, setBidak);
    await tungguSampai(() => wadah.querySelectorAll("[data-petak] img").length >= 32);
    const petak = wadah.querySelectorAll("[data-petak]").length;
    const gambar = wadah.querySelectorAll("[data-petak] img");
    uji(`set ${setBidak}: papan ter-render dengan 64 petak`, petak === 64, `${petak} petak`);
    uji(`set ${setBidak}: tepat 32 gambar bidak`, gambar.length === 32, `${gambar.length} img`);
    const kosongSrc = [...gambar].filter((el) => !el.getAttribute("src")).length;
    const kosongAlt = [...gambar].filter((el) => !el.getAttribute("alt")).length;
    uji(
      `set ${setBidak}: setiap gambar punya src dan alt terisi`,
      kosongSrc === 0 && kosongAlt === 0,
      `src kosong ${kosongSrc}, alt kosong ${kosongAlt}`
    );
    const e2 = wadah.querySelectorAll('[data-petak="e2"] img').length;
    const e4 = wadah.querySelectorAll('[data-petak="e4"] img').length;
    uji(`set ${setBidak}: bidak di e2 tampil dan e4 kosong`, e2 === 1 && e4 === 0, `e2 ${e2}, e4 ${e4}`);
    lepas();
  }

  await periksaPapan("merida");
  await periksaPapan("chesscom");
}

/* =============== D. papan mini halaman Pembukaan =============== */

console.log("\nD. papan mini halaman Pembukaan (cermin pembukaan.spec.js:104)");

if (modulBidak.galat) {
  uji("papan mini berisi tepat 32 gambar bidak", false, PETA_KOSONG);
} else if (galatBuild) {
  uji("papan mini berisi tepat 32 gambar bidak", false, galatBuild);
} else if (!lingkungan) {
  lewati("D. papan mini", ALASAN_LEWAT);
} else {
  const lepas = modul.mountPembukaan(wadah);
  await tungguSampai(() => wadah.querySelector("[data-papan-mini] img"));
  const mini = wadah.querySelector("[data-papan-mini]");
  uji("papan mini pertama ter-render", Boolean(mini));
  if (mini) {
    const petak = mini.querySelectorAll("[data-petak]").length;
    const gambar = mini.querySelectorAll("img").length;
    uji("papan mini berisi 64 petak", petak === 64, `${petak} petak`);
    uji("papan mini berisi tepat 32 gambar bidak", gambar === 32, `${gambar} img`);
  } else {
    uji("papan mini berisi 64 petak", false, "[data-papan-mini] tidak ada");
    uji("papan mini berisi tepat 32 gambar bidak", false, "[data-papan-mini] tidak ada");
  }
  lepas();
}

if (lingkungan) rmSync(berkasBundel, { force: true });

/* ============================ Ringkasan ============================ */

console.log(
  `\n${gagal === 0 ? "LULUS" : "GAGAL"}: ${lulus} lulus, ${gagal} gagal` +
    (dilewati ? `, ${dilewati} dilewati` : "") +
    "."
);
if (gagal) process.exit(1);