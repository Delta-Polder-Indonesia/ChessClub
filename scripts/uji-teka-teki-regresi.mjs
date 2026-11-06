#!/usr/bin/env node
/**
 * Uji REGRESI audit halaman Teka-Teki.
 *
 * Setiap pemeriksaan di sini mengunci satu temuan audit yang sudah diperbaiki
 * pada refactor ini, supaya tidak kembali diam-diam:
 *
 *   C1  Efek pemuatan tidak boleh berjalan ulang saat aplikasi menulis URL.
 *       → dataset `teka-teki.json` hanya diunduh SEKALI walau pemain berpindah
 *         soal (dulu setiap penulisan URL memicu unduhan + pemasangan ulang).
 *   C2  Papan tidak boleh memuat soal lama saat soal baru dipasang.
 *   C3  `localStorage` hanya boleh disentuh `services/puzzleStorage.js`
 *       (dulu ditulis di dalam updater `setState`).
 *   C4  Posisi soal koleksi kurasi (id ≥ 5487) tetap tersimpan — dulu ditolak
 *       penjaga `id <= jumlah dataset Lichess`.
 *   C5  Status akhir permainan tampil di wilayah `aria-live`.
 *   +   Tidak ada lagi `eslint-disable react-hooks/exhaustive-deps`, dan
 *       halaman tidak lagi berupa satu berkas 2.987 baris.
 *
 * Jalankan: node scripts/uji-teka-teki-regresi.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
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
const DIR_HALAMAN = path.join(ROOT, "src", "halaman", "TekaTeki");

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

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.error(
    "GAGAL: jalankan uji regresi teka-teki — pasang `npm i -D jsdom esbuild` lebih dulu."
  );
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

const { problems } = JSON.parse(
  readFileSync(path.join(ROOT, "public", "data", "teka-teki.json"), "utf8")
);
const { problems: kekayaan } = JSON.parse(
  readFileSync(path.join(ROOT, "public", "data", "teka-teki-video.json"), "utf8")
);

/** Semua berkas sumber di bawah `src/halaman/TekaTeki/` (rekursif). */
function daftarBerkasSumber() {
  const hasil = [];
  const jelajah = (dir) => {
    for (const nama of readdirSync(dir)) {
      const penuh = path.join(dir, nama);
      if (statSync(penuh).isDirectory()) {
        jelajah(penuh);
      } else if (/\.(jsx?|mjs)$/.test(nama)) {
        hasil.push(penuh);
      }
    }
  };
  jelajah(DIR_HALAMAN);
  return hasil;
}

const relatif = (penuh) => path.relative(ROOT, penuh).replaceAll(path.sep, "/");

/* ------------------------------------------------------- pemeriksaan statis */

judul("struktur & higiene kode (statis)");
{
  const berkas = daftarBerkasSumber();

  uji(
    "berkas halaman tidak lagi monolit",
    berkas.length >= 15,
    `${berkas.length} berkas`
  );

  const halaman = readFileSync(path.join(DIR_HALAMAN, "TekaTeki.jsx"), "utf8");
  const jumlahBaris = halaman.split("\n").length;
  uji(
    "TekaTeki.jsx di bawah 700 baris (dulu 2.987)",
    jumlahBaris < 700,
    `${jumlahBaris} baris`
  );

  // Hanya arahan yang benar-benar aktif — sebutan di dalam komentar penjelas
  // (mis. "tidak perlu eslint-disable …") tidak dihitung.
  const arahanDisable = /(?:^|\n)[ \t]*(?:\/\/|\/\*)[ \t]*eslint-disable[^\n]*react-hooks\/exhaustive-deps/;
  const disableDeps = berkas.filter((penuh) =>
    arahanDisable.test(readFileSync(penuh, "utf8"))
  );
  uji(
    "tidak ada eslint-disable react-hooks/exhaustive-deps",
    disableDeps.length === 0,
    disableDeps.map(relatif).join(", ")
  );

  // C3: satu pintu penyimpanan. Pengecualian: modul penyimpanan itu sendiri.
  const penulisStorage = berkas.filter((penuh) => {
    if (relatif(penuh).endsWith("services/puzzleStorage.js")) return false;
    return /\blocalStorage\b/.test(readFileSync(penuh, "utf8"));
  });
  uji(
    "localStorage hanya diakses services/puzzleStorage.js",
    penulisStorage.length === 0,
    penulisStorage.map(relatif).join(", ")
  );

  // Komponen hasil ekstraksi wajib memakai sistem ikon. Dua berkas dikecualikan
  // karena isinya dipindahkan apa adanya dari berkas lama (`PapanTekaTeki.jsx`
  // sudah ada sebelumnya, avatar `AreaPapan.jsx` memakai siluet pemain yang
  // sudah dibatasi baseline desain).
  const komponenBaru = berkas.filter(
    (penuh) =>
      relatif(penuh).includes("/komponen/") &&
      !relatif(penuh).endsWith("komponen/AreaPapan.jsx")
  );
  const svgInline = komponenBaru.filter((penuh) => /<svg\b/.test(readFileSync(penuh, "utf8")));
  uji(
    "komponen baru memakai sistem ikon, bukan <svg> inline",
    svgInline.length === 0,
    svgInline.map(relatif).join(", ")
  );

  uji(
    "komponen hasil ekstraksi tersedia",
    [
      "komponen/TekaTekiShell.jsx",
      "komponen/SidebarTekaTeki.jsx",
      "komponen/PanelTab.jsx",
      "komponen/PanelVideo.jsx",
      "komponen/PanelPengaturan.jsx",
      "komponen/PromotionDialog.jsx",
      "komponen/BilahEvaluasi.jsx",
      "hooks/usePuzzleGame.js",
      "hooks/usePuzzleSession.js",
      "hooks/usePuzzleReview.js",
      "hooks/usePuzzleSettings.js",
      "reducers/tekaTekiReducer.js",
      "services/puzzleStorage.js",
      "services/puzzleSelection.js",
      "services/puzzleFilter.js",
      "services/puzzleEvaluation.js",
    ].every((nama) => berkas.some((penuh) => relatif(penuh).endsWith(nama)))
  );

  /*
   * Pemasangan papan di halaman dipicu `versiSoal` (nomor pasang dari sesi),
   * bukan identitas `masalah`. `masalah` ikut berubah setiap `soal` dihitung
   * ulang — mis. saat koleksi kurasi selesai diunduh — sehingga pemicu berbasis
   * `masalah` memasang papan dua kali untuk satu soal dan mengembalikan posisi
   * ke awal tepat setelah pemain mengklik bidak pertama (gejala uji alur yang
   * dulu hilang-timbul).
   */
  uji(
    "efek pemasangan papan memakai penanda versi soal",
    /const versiTerpasangRef = useRef\(0\);/.test(halaman) &&
      /versiTerpasangRef\.current === versiSoal/.test(halaman) &&
      /if \(versiSoal === 0\) return;/.test(halaman)
  );
  // Penjaga versi harus diperiksa SEBELUM papan dipasang, dan pemasangan hanya
  // boleh punya satu pintu di halaman.
  const posisiPenjaga = halaman.indexOf("versiTerpasangRef.current === versiSoal");
  const posisiPasang = halaman.indexOf("pasangSoal(masalah)");
  uji(
    "penjaga versi diperiksa sebelum papan dipasang",
    posisiPenjaga !== -1 &&
      posisiPasang !== -1 &&
      posisiPenjaga < posisiPasang &&
      halaman.split("pasangSoal(masalah)").length === 2
  );
}

/* ------------------------------------------------- tata letak: baris profil */

judul("tata letak: baris profil terpisah dari papan (regresi PR #228)");
{
  // Komentar penjelas menyebut pola lama (mis. `calc(100vh_-_106px)`), jadi
  // pemeriksaan hanya boleh melihat kode.
  const tanpaKomentar = (teks) =>
    teks.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  const areaPapan = tanpaKomentar(
    readFileSync(path.join(DIR_HALAMAN, "komponen", "AreaPapan.jsx"), "utf8")
  );
  const shell = tanpaKomentar(readFileSync(
    path.join(DIR_HALAMAN, "komponen", "TekaTekiShell.jsx"),
    "utf8"
  ));

  /*
   * Tinggi baris papan HARUS pasti. Dengan `grid-rows-[auto_minmax(0,1fr)_auto]`
   * baris papan punya tinggi sendiri, sehingga `max-h-full` pada kotak papan
   * berlaku dan papan tidak bisa meluber ke baris profil (dulu: kolom
   * `justify-between` + papan yang lebarnya menentukan tinggi → avatar dan nama
   * pemain tertimpa petak).
   */
  uji(
    "baris profil & papan memakai track grid eksplisit",
    /grid-rows-\[auto_minmax\(0,1fr\)_auto\]/.test(areaPapan) &&
      areaPapan.split('data-baris="profil-atas"').length === 2 &&
      areaPapan.split('data-baris="profil-bawah"').length === 2 &&
      areaPapan.split('data-baris="papan"').length === 2,
    "perlu tiga track: profil atas, papan, profil bawah"
  );

  uji(
    "baris papan boleh menyusut (min-h-0) tanpa memotong isinya",
    /data-baris="papan"\s*\n?\s*className="[^"]*min-h-0/.test(areaPapan) &&
      !/data-baris="papan"\s*\n?\s*className="[^"]*overflow-hidden/.test(areaPapan),
    "papan dibatasi ukurannya, jadi tidak perlu (dan tidak boleh) dipotong"
  );

  // Baris profil duduk di kolom yang SAMA dengan papan (kolom 2), jadi lebarnya
  // selalu sama dengan lebar papan — bukan selebar area papan.
  uji(
    "baris profil berbagi kolom dengan papan",
    (areaPapan.match(/col-start-2/g) || []).length >= 3 &&
      /col-start-2 row-start-2/.test(areaPapan)
  );
  uji(
    "baris profil tidak menyumbang lebar intrinsik",
    (areaPapan.match(/w-0 min-w-full/g) || []).length >= 2,
    "satu untuk tiap baris profil (atas & bawah)"
  );
  /*
   * Bilah evaluasi DIKAT ke kotak papan, bukan ke track baris. Tinggi track
   * lebih besar dari papan setiap kali papan dibatasi lebar (layar lebar),
   * sehingga bilah setinggi track selalu "melampaui" papan di atas dan bawah.
   */
  uji(
    "bilah evaluasi diikat ke kotak papan (inset-y-0 + right-full)",
    /absolute inset-y-0 right-full mr-2/.test(areaPapan) &&
      /absolute inset-y-0 right-full[^"]*w-9/.test(areaPapan)
  );
  uji(
    "grid menyediakan kolom bilah selebar bilah",
    /grid-cols-\[2\.25rem_/.test(areaPapan),
    "kolom 1 = 2.25rem (w-9) supaya bilah tidak mengurangi lebar papan"
  );
  uji(
    "kolom papan memakai sisi papan, bukan 1fr, di layar lebar",
    /lg:grid-cols-\[2\.25rem_var\(--sisi-papan\)\]/.test(areaPapan) &&
      /--sisi-papan:min\(calc\(100cqw-2\.75rem\),calc\(100cqh-6rem\)\)/.test(areaPapan),
    "tanpa ini baris profil bisa lebih lebar daripada papan saat papan dibatasi tinggi"
  );
  uji(
    "tidak ada lagi geseran pengimbang (translate) di grid",
    !/-translate-x-/.test(areaPapan) && !/\btranslate-y-/.test(areaPapan)
  );

  uji(
    "papan dibatasi dua sumbu di dalam pembungkus persegi",
    /aspect-square[^"]*max-w-full[^"]*lg:h-full/.test(areaPapan) &&
      /lg:h-full[^"]*lg:w-auto[^"]*lg:max-h-full/.test(areaPapan)
  );

  uji(
    "ada kotak papan (pembungkus) yang memusatkan papan",
    /relative flex min-h-0 min-w-0 flex-1 items-center justify-center/.test(areaPapan)
  );
  uji(
    "label level/rating disembunyikan di layar sempit",
    (areaPapan.match(/hidden whitespace-nowrap text-\[11px\][^"]*sm:inline/g) || []).length >= 2
  );
  uji(
    "nama pemain tidak didorong chip elo (min-w-0 + shrink-0)",
    /flex min-w-0 items-center gap-2/.test(areaPapan) &&
      (areaPapan.match(/shrink-0 text-xs font-medium text-gray-300/g) || []).length >= 2
  );

  // Baris profil tidak boleh memakai trik lapisan apa pun.
  const barisProfil = areaPapan
    .split('data-baris="profil-')
    .slice(1)
    .map((potongan) => potongan.slice(0, 400))
    .join("\n");
  uji(
    "baris profil bukan lapisan absolut / z-index / translate",
    barisProfil.length > 0 &&
      !/\babsolute\b/.test(barisProfil) &&
      !/\bz-\d/.test(barisProfil) &&
      !/translate/.test(barisProfil) &&
      !/-mt-/.test(barisProfil)
  );

  // Bilah evaluasi tidak boleh mengembalikan `null` saat mesin belum memberi
  // hasil: halaman selalu mengirim elemen, sehingga `null` di dalam elemen itu
  // membuat kolom bilah kosong (bilah "hilang" dari tata letak).
  const bilah = tanpaKomentar(
    readFileSync(path.join(DIR_HALAMAN, "komponen", "BilahEvaluasi.jsx"), "utf8")
  );
  uji(
    "bilah evaluasi selalu tampil (netral 50% tanpa hasil mesin)",
    !/if \(!hasil\) return null;/.test(bilah) && /hasil \|\| \{\}/.test(bilah)
  );

  uji(
    "baris profil punya tinggi minimum sendiri",
    areaPapan.split("min-h-10").length >= 3
  );

  /*
   * Panel kanan "Main": ringkasan giliran (ikon bidak, label, Elo) dan catatan
   * pelatih harus berbagi tinggi panel dengan pembagian yang TETAP. Dulu wadah
   * catatan baru dipasang saat `selesai` (dengan `flex-1`), sehingga paruh atas
   * menyusut dan ringkasan melompat naik ±112px begitu soal terpecahkan.
   */
  const panelUtama = tanpaKomentar(
    readFileSync(path.join(DIR_HALAMAN, "komponen", "PanelUtama.jsx"), "utf8")
  );
  uji(
    "ringkasan giliran & catatan berbagi tinggi panel secara tetap",
    /flex min-h-0 flex-1 items-center justify-center px-4 py-4/.test(panelUtama) &&
      /min-h-0 flex-1 overflow-y-auto p-4 space-y-3 text-sm/.test(panelUtama) &&
      !/\? "flex-1" : "hidden"/.test(panelUtama)
  );

  // Angka ajaib tinggi viewport tidak boleh lagi menanggung tata letak.
  uji(
    "tidak ada lagi kunci lebar berbasis calc(100vh)",
    !/calc\(100vh_-_106px\)/.test(areaPapan)
  );

  uji(
    "area papan memotong luapan di level pembungkus",
    /data-area="papan"[^>]*overflow-hidden/.test(areaPapan) &&
      /min-h-0 min-w-0 flex-1 overflow-hidden/.test(shell)
  );

  /*
   * Tidak ada chip status di layar: pesan permainan (dulu "Teka-teki
   * terpecahkan" di atas papan) hanya diumumkan lewat wilayah `sr-only`,
   * sehingga tidak ada teks yang muncul di area papan.
   */
  uji(
    "tidak ada chip status di atas papan (hanya pengumuman sr-only)",
    !/status=\{/.test(shell) &&
      /<div className="sr-only">/.test(shell) &&
      /<StatusTekaTeki pesan=\{pesan\} melayang=\{false\}/.test(shell) &&
      !/absolute inset-x-3 top-3/.test(shell) &&
      !/data-baris="papan"[\s\S]{0,400}?status/.test(areaPapan)
  );
  uji(
    "baris profil tidak lagi menampilkan hitungan terpecahkan",
    !/teksTerpecahkan/.test(areaPapan)
  );
}

/* --------------------------------------------------------------- bundel UI */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import TekaTeki from "./src/halaman/TekaTeki/TekaTeki.jsx";

export function mount(el, jalur) {
  return createRoot(el).render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[jalur]}>
        <I18nProvider><TekaTeki /></I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-tekateki-regresi.cjs");

await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-tekateki-regresi-entry.jsx",
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

/* ------------------------------------------------------------- lingkungan */

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

class AudioContextPalsu {
  constructor() {
    this.state = "running";
    this.destination = {};
  }
  createOscillator() {
    return {
      type: "sine",
      frequency: { value: 0, setValueAtTime() {} },
      connect() {},
      start() {},
      stop() {},
    };
  }
  createGain() {
    return {
      gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} },
      connect() {},
    };
  }
  createBufferSource() {
    return { buffer: null, connect() {}, start() {} };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
  resume() {
    return Promise.resolve();
  }
}

let window;
let dok;
const permintaanJaringan = [];

function pasangDomBaru(jalur, bahasa) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: `https://uji.test${jalur}`,
    pretendToBeVisual: true,
  });
  window = dom.window;
  dok = window.document;

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

  window.fetch = (url) => {
    permintaanJaringan.push(String(url));
    const bersih = String(url).replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
    try {
      const isi = readFileSync(path.join(ROOT, "public", bersih), "utf8");
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(isi),
        json: () => Promise.resolve(JSON.parse(isi)),
      });
    } catch (e) {
      return Promise.reject(new Error(`tidak ada: ${bersih} (${e.message})`));
    }
  };

  globalThis.window = window;
  globalThis.document = dok;
  globalThis.localStorage = window.localStorage;
  globalThis.fetch = window.fetch;
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
    "HTMLSelectElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "CustomEvent",
  ]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
  if (bahasa) window.localStorage.setItem("kci-bahasa", bahasa);
  return window.localStorage;
}

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function tungguSampai(syarat, batasMs = 6000) {
  const akhir = Date.now() + batasMs;
  while (Date.now() < akhir) {
    if (syarat()) return true;
    await tunggu(30);
  }
  return syarat();
}

const LAJUR = "abcdefgh";
const BARIS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function labelDariFen(fen) {
  const peta = new Map();
  const papan = new Chess(fen).board();
  papan.forEach((baris, i) =>
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

function papanSama(fen) {
  const harap = labelDariFen(fen);
  const kini = new Map();
  for (const el of dok.querySelectorAll("[data-petak]")) {
    kini.set(el.getAttribute("data-petak"), el.getAttribute("aria-label"));
  }
  if (kini.size !== 64 || harap.size !== 64) return false;
  for (const [sq, label] of harap) if (kini.get(sq) !== label) return false;
  return true;
}

async function mainkan(from, to) {
  const asal = dok.querySelector(`[data-petak="${from}"]`);
  const tujuan = dok.querySelector(`[data-petak="${to}"]`);
  if (!asal || !tujuan) throw new Error(`petak ${from}/${to} tidak ada`);
  asal.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(40);
  tujuan.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(40);
}

/** Pasang halaman pada `jalur` dengan keadaan penyimpanan yang bersih. */
async function kunjungi(jalur) {
  const penyimpanan = pasangDomBaru(jalur);
  penyimpanan.clear();
  permintaanJaringan.length = 0;
  delete require.cache[berkasBundel];
  const modul = require(berkasBundel);
  modul.mount(dok.getElementById("root"), jalur);
  const siap = await tungguSampai(() => dok.querySelectorAll("[data-petak]").length === 64);
  await tunggu(120);
  return { siap, penyimpanan };
}

/* -------------------------------------------------------------- C1 & C2 */

judul("C1/C2: satu unduhan dataset, papan selalu soal yang diminta");
{
  const pertama = problems[3];
  const kedua = problems[7];
  const { siap } = await kunjungi(`/teka-teki/problem/${pertama.problemid}`);
  uji("halaman memuat soal pertama dari URL", siap && papanSama(pertama.fen));

  const jumlahUnduhan = permintaanJaringan.filter((url) =>
    String(url).includes("data/teka-teki.json")
  ).length;
  uji("dataset diunduh sekali saat mount", jumlahUnduhan === 1, `${jumlahUnduhan} unduhan`);

  // Pindah soal lewat input nomor: aplikasi menulis URL sendiri.
  const input = dok.querySelector('input[type="number"]');
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  setter.call(input, String(kedua.problemid));
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  input.closest("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

  uji(
    "papan berpindah ke soal kedua",
    await tungguSampai(() => papanSama(kedua.fen), 3000),
    `diharapkan #${kedua.problemid}`
  );
  const unduhanSetelah = permintaanJaringan.filter((url) =>
    String(url).includes("data/teka-teki.json")
  ).length;
  uji(
    "berpindah soal tidak mengunduh ulang dataset (C1)",
    unduhanSetelah === 1,
    `${unduhanSetelah} unduhan`
  );

  // C2: setelah papan berganti, soal pertama tidak boleh muncul lagi.
  uji("papan tidak memuat soal lama (C2)", !papanSama(pertama.fen));
}

/* ------------------------------------------------------------------- C4 */

judul("C4: posisi soal koleksi kurasi tetap tersimpan");
{
  const kurasi = kekayaan.find((p) => p.video);
  const { siap, penyimpanan } = await kunjungi(`/teka-teki/problem/${kurasi.problemid}`);
  uji("soal koleksi kurasi termuat dari URL", siap && papanSama(kurasi.fen));
  uji(
    "posisi tersimpan walaupun id ≥ jumlah dataset Lichess",
    penyimpanan.getItem("kci-teka-teki-posisi") === String(kurasi.problemid),
    `tersimpan: ${penyimpanan.getItem("kci-teka-teki-posisi")}`
  );
  uji(
    "koleksi posisi ikut tercatat",
    penyimpanan.getItem("kci-teka-teki-posisi-koleksi") === "video"
  );
}

/* ------------------------------------------------------------- C5 & alur */

judul("C5: umpan balik status & penuntasan soal");
{
  const soal = problems.find((p) => p.type === "Mate in One" && !p.moves.includes(";"));
  const { penyimpanan } = await kunjungi(`/teka-teki/problem/${soal.problemid}`);
  uji("soal satu langkah termuat", papanSama(soal.fen));

  const langkah = parseLangkah(soal.moves);
  await mainkan(langkah.from, langkah.to);
  const selesai = await tungguSampai(() => papanSama(terapkan(soal.fen, langkah).fen()), 4000);
  uji("langkah solusi menuntaskan soal", selesai);

  const wilayah = dok.querySelector("[aria-live]");
  uji("ada wilayah aria-live", !!wilayah);
  uji(
    "pesan tuntas muncul di wilayah live",
    !!wilayah && (wilayah.textContent || "").includes(kamus.terpecahkan),
    wilayah ? wilayah.textContent.trim().slice(0, 80) : "tidak ada wilayah"
  );
  uji(
    "soal tercatat terpecahkan di penyimpanan",
    JSON.parse(penyimpanan.getItem("kci-teka-teki-terpecahkan") || "[]").includes(
      soal.problemid
    )
  );
}

judul("langkah salah tidak mengubah papan dan tidak menuliskan pesan");
{
  const soal = problems.find(
    (p) => p.type === "Mate in Two" && p.moves.split(";").length >= 3 && !p.moves.includes("q;")
  );
  const { penyimpanan } = await kunjungi(`/teka-teki/problem/${soal.problemid}`);
  const solusi = parseLangkah(soal.moves.split(";")[0]);
  const salah = new Chess(soal.fen)
    .moves({ verbose: true })
    .find((m) => !(m.from === solusi.from && m.to === solusi.to));
  if (!salah) {
    uji("ada langkah salah untuk diuji", false);
  } else {
    await mainkan(salah.from, salah.to);
    await tunggu(200);
    uji("posisi tidak berubah oleh langkah salah", papanSama(soal.fen));
    uji(
      "soal tidak tercatat terpecahkan",
      !JSON.parse(penyimpanan.getItem("kci-teka-teki-terpecahkan") || "[]").includes(
        soal.problemid
      )
    );
    /*
     * Kontrak baru (audit aksesibilitas): pesan langkah salah TIDAK tampil di
     * layar, tetapi diumumkan ke pembaca layar lewat satu-satunya wilayah
     * `aria-live` yang disembunyikan visual (`.sr-only`).
     */
    const wilayahSalah = dok.querySelector('.sr-only [data-status-permainan="salah"]');
    uji(
      "pesan langkah salah diumumkan lewat wilayah sr-only",
      Boolean(wilayahSalah) && (wilayahSalah.textContent || "").includes(kamus.salah),
      wilayahSalah ? wilayahSalah.textContent.trim().slice(0, 40) : "tidak ada wilayah"
    );
    uji(
      "pesan langkah salah tidak tampil di layar",
      ![...dok.querySelectorAll("body *")].some(
        (el) =>
          el.children.length === 0 &&
          (el.textContent || "").includes(kamus.salah) &&
          !el.closest(".sr-only")
      )
    );
  }
}

judul("papan tidak ter-reset oleh pemasangan soal ganda (soal ber-video)");
{
  /*
   * Regresi "uji alur" yang paling sulit ditangkap: soal koleksi kurasi (id di
   * atas dataset Lichess) dulu dipasang DUA kali — sekali oleh efek pemuatan
   * dan sekali lagi oleh permintaan URL — sehingga papan kembali ke posisi awal
   * tepat setelah pemain mengklik bidak pertama. Pemeriksaan ini menahan papan
   * tetap di soal yang sama setelah semua efek selesai, lalu memastikan langkah
   * pertama pemain tidak dibatalkan oleh pemasangan susulan.
   */
  const kurasi = kekayaan.find((p) => p.video && p.moves.split(";").length >= 3);
  const langkah = kurasi.moves.split(";");
  const { siap } = await kunjungi(`/teka-teki/problem/${kurasi.problemid}`);
  uji("soal ber-video termuat dari URL", siap && papanSama(kurasi.fen));

  await tunggu(400);
  uji(
    "papan tetap di soal yang diminta setelah semua efek selesai",
    papanSama(kurasi.fen)
  );

  const pertama = parseLangkah(langkah[0]);
  const posisiSetelah = terapkan(kurasi.fen, pertama).fen();
  await mainkan(pertama.from, pertama.to);
  uji("langkah pertama pemain masuk ke papan", papanSama(posisiSetelah));

  await tunggu(300);
  uji(
    "papan tidak kembali ke posisi awal soal (tanpa pemasangan ganda)",
    !papanSama(kurasi.fen)
  );
}

judul("DOM: tiga baris tata letak papan (profil atas, papan, profil bawah)");
{
  const soal = problems[0];
  await kunjungi(`/teka-teki/problem/${soal.problemid}`);
  const barisAtas = dok.querySelector('[data-baris="profil-atas"]');
  const barisPapan = dok.querySelector('[data-baris="papan"]');
  const barisBawah = dok.querySelector('[data-baris="profil-bawah"]');
  uji(
    "tiga baris tata letak tersedia",
    Boolean(barisAtas && barisPapan && barisBawah)
  );

  // Struktur wajib vertikal: ketiganya bersaudara di satu kolom tata letak.
  uji(
    "baris profil dan papan bersaudara (struktur vertikal)",
    Boolean(
      barisAtas &&
        barisPapan &&
        barisBawah &&
        barisAtas.parentElement === barisPapan.parentElement &&
        barisPapan.parentElement === barisBawah.parentElement
    )
  );

  // Tidak boleh ada petak papan yang bersarang di baris profil — itulah bentuk
  // konkret dari keluhan "nama/avatar menutupi petak".
  const petakDiProfil =
    (barisAtas?.querySelectorAll("[data-petak]").length || 0) +
    (barisBawah?.querySelectorAll("[data-petak]").length || 0);
  uji("tidak ada petak papan di dalam baris profil", petakDiProfil === 0);
  uji(
    "seluruh 64 petak berada di baris papan",
    barisPapan?.querySelectorAll("[data-petak]").length === 64,
    `${barisPapan?.querySelectorAll("[data-petak]").length} petak`
  );

  // Tidak ada wilayah status yang tampil di area papan sama sekali.
  uji(
    "tidak ada wilayah status yang tampil di area papan",
    !dok.querySelector('[data-area="papan"] [data-status-permainan]'),
    "chip status tidak boleh muncul di layar"
  );
}

judul("panel kanan: posisi ringkasan giliran tetap saat soal selesai");
{
  /*
   * Keluhan: begitu soal terpecahkan, blok giliran (lingkaran bidak, "Giliran
   * hitam/putih", tingkat, Elo) melompat ke atas karena wadah catatan pelatih
   * baru ikut mengambil ruang. Pemeriksaan ini merekam struktur panel sebelum
   * dan sesudah penuntasan: jumlah anak, kelas pembungkus ringkasan, dan kelas
   * wadah catatan harus identik — itulah syarat agar posisinya tidak bergeser
   * (pembagian `flex-1` tidak boleh bergantung pada `selesai`).
   */
  // Soal satu langkah cukup untuk membalik keadaan `selesai` (pemicu pergeseran).
  const soal = problems.find((p) => p.type === "Mate in One" && !p.moves.includes(";"));
  const { siap, penyimpanan } = await kunjungi(`/teka-teki/problem/${soal.problemid}`);
  uji("soal satu langkah termuat untuk uji panel", siap && papanSama(soal.fen));

  const rekamStruktur = () => {
    const panel = dok.querySelector('[data-panel="main"]');
    const status = dok.querySelector('[data-testid="main-turn-status"]');
    const wadahCatatan = panel ? panel.lastElementChild : null;
    return {
      jumlahAnak: panel ? panel.children.length : -1,
      kelasRingkasan: status?.parentElement?.className || "",
      kelasCatatan: wadahCatatan?.className || "",
      adaRingkasan: Boolean(status),
    };
  };

  const sebelum = rekamStruktur();
  uji("panel Main menampilkan ringkasan giliran", sebelum.adaRingkasan);
  uji(
    "pembungkus ringkasan memakai flex-1 (bagi tinggi tetap)",
    /\bflex-1\b/.test(sebelum.kelasRingkasan),
    sebelum.kelasRingkasan
  );
  uji(
    "wadah catatan pelatih sudah ada sebelum soal selesai",
    /\bflex-1\b/.test(sebelum.kelasCatatan),
    sebelum.kelasCatatan
  );

  let fenAkhir = soal.fen;
  for (const gerak of soal.moves.split(";")) {
    const langkah = parseLangkah(gerak);
    await mainkan(langkah.from, langkah.to);
    await tunggu(140);
    fenAkhir = terapkan(fenAkhir, langkah).fen();
  }
  const tuntas = await tungguSampai(
    () =>
      papanSama(fenAkhir) &&
      JSON.parse(penyimpanan.getItem("kci-teka-teki-terpecahkan") || "[]").includes(
        soal.problemid
      ),
    4000
  );
  uji(
    "soal panel tuntas oleh langkah solusi",
    tuntas,
    `tercatat: ${penyimpanan.getItem("kci-teka-teki-terpecahkan")}`
  );

  const sesudah = rekamStruktur();
  uji(
    "struktur panel identik sebelum & sesudah selesai (tanpa pergeseran)",
    sebelum.jumlahAnak === sesudah.jumlahAnak &&
      sebelum.kelasRingkasan === sesudah.kelasRingkasan &&
      sebelum.kelasCatatan === sesudah.kelasCatatan,
    `${JSON.stringify(sebelum)} -> ${JSON.stringify(sesudah)}`
  );
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exitCode = 1;
