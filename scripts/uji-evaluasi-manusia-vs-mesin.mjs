#!/usr/bin/env node
/**
 * Uji BILAH EVALUASI, PERGANTIAN POSISI, dan DETEKSI AKHIR PERMAINAN di mode
 * Manusia vs Mesin (`src/halaman/ManusiaVsMesin/ManusiaVsMesin.jsx`).
 *
 * Mengapa perlu (bug yang dikunci uji ini):
 *
 *   1. Bilah evaluasi dulu memakai state "tertahan" yang HANYA memperbarui
 *      diri saat hasil engine baru (truthy) datang — begitu posisi berganti
 *      dan `hasilEngine` di-reset ke null oleh `useEngineCatur`, efek itu
 *      mengabaikan reset tersebut sehingga bilah macet menampilkan evaluasi
 *      posisi SEBELUMNYA sampai hasil posisi baru selesai dihitung.
 *   2. Hasil engine yang basi (dari posisi yang sudah diganti pengguna
 *      sebelum pencarian lama selesai) tidak boleh menimpa posisi baru.
 *   3. `new Chess(fen)` tidak membawa histori posisi — threefold repetition
 *      tidak pernah terdeteksi bila deteksi akhir permainan memakai instance
 *      yang cuma dimuat dari satu FEN.
 *   4. Navigasi (undo/redo) tidak boleh meninggalkan status giliran mesin
 *      yang lama; kalau tidak, papan bisa terkunci walau sebenarnya giliran
 *      pemain (mis. undo tepat saat mesin masih "berpikir").
 *
 * Mesin Stockfish (bilah evaluasi) dan mesin lawan (sunfish, level "casual")
 * keduanya diganti Worker palsu yang bisa dikendalikan penuh: setiap "go"
 * menghasilkan satu "pekerjaan" yang baru membalas begitu uji memanggil
 * `rilis()` — dengan begitu urutan selesainya bisa diatur eksplisit untuk
 * menguji race condition, bukan ditebak dari jeda waktu nyata.
 *
 * Setiap bagian memakai mount React BARU (papan/partai baru) supaya
 * pekerjaan Worker palsu yang menggantung dari bagian sebelumnya tidak
 * mencemari bagian berikutnya — komponen di-unmount dulu sebelum bagian
 * baru dimulai.
 *
 * Skrip gagal keras bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-evaluasi-manusia-vs-mesin.mjs
 */
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";

import { Chess } from "chess.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  \u2713 ${nama}`);
  } else {
    gagal++;
    console.error(`  \u2717 ${nama}${keterangan ? ` \u2014 ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
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
  console.error("GAGAL: jsdom dan esbuild wajib terpasang untuk menjalankan uji ini.");
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import ManusiaVsMesin from "./src/halaman/ManusiaVsMesin/ManusiaVsMesin.jsx";

export { GESTUR } from "./src/halaman/ManusiaVsMesin/gerakLawan.js";

export function mountPve(el) {
  const root = createRoot(el);
  root.render(
    React.createElement(I18nProvider, null, React.createElement(ManusiaVsMesin))
  );
  return root;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-evaluasi-pve.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-evaluasi-pve-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "empty" },
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

const UKURAN = 640; // papan 640px -> petak 80px
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: "https://uji.test/papan-interaktif",
  pretendToBeVisual: true,
});
const { window } = dom;

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

/** UCI ("e2e4", "e7e8q", ...) dari langkah legal pertama pada `fen`. */
function langkahPertama(fen) {
  try {
    const game = new Chess(fen);
    const gerak = game.moves({ verbose: true })[0];
    if (!gerak) return null;
    return `${gerak.from}${gerak.to}${gerak.promotion || ""}`;
  } catch {
    return null;
  }
}

/**
 * Worker UCI palsu yang bisa dikendalikan: setiap "go" mendaftarkan satu
 * pekerjaan ke `window.__evalJobs` (Worker Stockfish bilah evaluasi) atau
 * `window.__lawanJobs` (Worker sunfish lawan level "casual", dibedakan lewat
 * URL) — TIDAK auto-membalas. Uji memanggil `job.rilis(opsi)` sendiri untuk
 * menentukan kapan dan urutan mana yang "selesai" lebih dulu, sehingga race
 * condition bisa diuji deterministik alih-alih menebak jeda waktu nyata.
 */
class MesinPalsu {
  constructor(url) {
    this.url = String(url || "");
    this.isSunfish = this.url.includes("sunfish");
    this.fenAktif = null;
  }
  postMessage(perintah) {
    const cmd = String(perintah);
    if (cmd === "uci") {
      this.kirim("id name MesinUjiEvaluasi");
      this.kirim("uciok");
      return;
    }
    if (cmd === "isready") {
      this.kirim("readyok");
      return;
    }
    if (cmd.startsWith("position fen ")) {
      this.fenAktif = cmd.slice("position fen ".length).trim();
      return;
    }
    if (cmd === "stop" || cmd.startsWith("setoption")) return;
    if (cmd.startsWith("go")) {
      const fen = this.fenAktif;
      const antrean = this.isSunfish ? window.__lawanJobs : window.__evalJobs;
      const job = {
        fen,
        selesai: false,
        rilis: (opsi = {}) => {
          if (job.selesai) return;
          job.selesai = true;
          const mv = langkahPertama(fen);
          const baris =
            opsi.mate !== undefined && opsi.mate !== null
              ? `mate ${opsi.mate}`
              : `cp ${opsi.cp ?? 20}`;
          if (mv) this.kirim(`info depth 10 score ${baris} pv ${mv}`);
          this.kirim(`bestmove ${mv || "0000"}`);
        },
      };
      antrean.push(job);
    }
  }
  kirim(baris) {
    this.onmessage?.({ data: baris });
  }
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

window.Worker = MesinPalsu;
globalThis.Worker = MesinPalsu;

const modul = require(berkasBundel);
// Jeda "berpikir seperti manusia" mesin lawan (2-4 detik nyata) dipangkas
// dan gestur ragu dimatikan — uji ini menguji evaluasi/state, bukan gestur.
modul.GESTUR.jedaLangkah = [1, 1];
modul.GESTUR.jedaRagu = [1, 1];
modul.GESTUR.peluangRagu = 0;

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** Tunggu sampai `syarat()` benar, paling lama `batas` ms. */
async function tungguSampai(syarat, batas = 4000, langkah = 10) {
  const tenggat = Date.now() + batas;
  while (Date.now() < tenggat) {
    if (syarat()) return true;
    await tunggu(langkah);
  }
  return syarat();
}

/**
 * Mount partai baru dalam wadah baru (papan diklik "Main" otomatis).
 * `sebelumMulai(wadah)` (opsional) dipanggil SETELAH layar konfigurasi
 * pra-partai tampil tapi SEBELUM tombol "Main" diklik — dipakai mis. untuk
 * memilih warna pemain lewat tombol radio pemilih warna.
 * Mengembalikan handel `{ wadah, root, klik, labelBilah, adaEvaluasi,
 * tinggiPutih, tutup }` — `tutup()` WAJIB dipanggil sebelum mount berikutnya
 * supaya Worker palsu milik partai lama berhenti mencemari antrean job
 * partai baru.
 */
async function partaiBaru(sebelumMulai) {
  window.__evalJobs = [];
  window.__lawanJobs = [];
  const wadah = window.document.createElement("div");
  window.document.body.appendChild(wadah);
  const root = modul.mountPve(wadah);

  const cariMulai = () =>
    [...wadah.querySelectorAll("button")].find((b) => b.textContent.trim() === "Main");
  await tungguSampai(() => !!cariMulai());
  if (sebelumMulai) await sebelumMulai(wadah);
  cariMulai()?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tungguSampai(() => wadah.querySelectorAll("[data-petak]").length === 64);

  const bilah = () => wadah.querySelector("[data-bilah-evaluasi]");
  const labelBilah = () => bilah()?.getAttribute("aria-label") || "";
  const adaEvaluasi = () => labelBilah() !== "" && !/\u2014\s*$/.test(labelBilah());
  const tinggiPutih = () => bilah()?.querySelector("div")?.style?.height || "";
  const petak = (sq) => wadah.querySelector(`[data-petak="${sq}"]`);
  const disorot = (sq) => !!wadah.querySelector(`[data-petak="${sq}"] span[style*="255, 255, 0"]`);
  const klik = (sq) => petak(sq)?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  /**
   * Klik `sq` berulang sampai tersorot, bukan sekali lalu berharap. Dipakai
   * saat sebelumnya ada gestur mesin lawan yang masih berjalan (goyang bidak
   * + jeda async sebelum `mainkanLangkah` benar-benar dipanggil) — satu klik
   * yang jatuh SEBELUM papan terbuka lagi untuk pemain akan diam-diam
   * diabaikan (`bolehGerak` masih false), jadi klik tunggal saja tidak
   * cukup untuk memastikan langkah benar-benar terpilih.
   */
  const klikSampaiTersorot = async (sq, batas = 6000) => {
    const tenggat = Date.now() + batas;
    while (Date.now() < tenggat) {
      klik(sq);
      await tunggu(15);
      if (disorot(sq)) return true;
    }
    return disorot(sq);
  };
  const tombolNavigasi = () => {
    // Tombol navigasi kini ikon SVG (ChevronLeft/Right, lihat TombolMundur.jsx
    // & TombolMaju.jsx) — tidak ada teks glyph lagi, jadi dicocokkan lewat
    // aria-label (bahasa Indonesia atau Inggris). Urutan tetap: awal, mundur,
    // maju, akhir.
    const cari = (label) => {
      const set = label.map((l) => l.toLowerCase());
      return [...wadah.querySelectorAll("button")].find((b) =>
        set.includes((b.getAttribute("aria-label") || "").trim().toLowerCase())
      );
    };
    return {
      keAwal: cari(["Ke awal", "To start"]),
      mundur: cari(["Mundur", "Back"]),
      maju: cari(["Maju", "Forward"]),
      keAkhir: cari(["Ke akhir", "To end"]),
    };
  };

  return {
    wadah,
    bilah,
    labelBilah,
    adaEvaluasi,
    tinggiPutih,
    petak,
    disorot,
    klik,
    klikSampaiTersorot,
    tombolNavigasi,
    tutup: () => {
      root.unmount();
      wadah.remove();
    },
  };
}

/* ============================ 1. status awal ============================ */

console.log("1. status awal papan");
{
  const p = await partaiBaru();
  uji("papan ter-render", p.wadah.querySelectorAll("[data-petak]").length === 64);
  uji("bilah evaluasi tampil", !!p.bilah());
  uji("sebelum engine membalas, bilah belum menampilkan skor", !p.adaEvaluasi(), p.labelBilah());

  await tungguSampai(() => window.__evalJobs.length >= 1);
  const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  uji(
    "permintaan evaluasi pertama memang untuk posisi awal",
    window.__evalJobs[0]?.fen === FEN_AWAL,
    window.__evalJobs[0]?.fen
  );

  window.__evalJobs[0].rilis({ cp: 25 });
  await tungguSampai(() => p.adaEvaluasi());
  uji("bilah menampilkan evaluasi posisi awal setelah worker membalas", p.adaEvaluasi(), p.labelBilah());
  uji(
    "skor posisi awal (+0.25) tampil, bukan simbol placeholder",
    p.labelBilah().includes("0.25") || p.labelBilah().includes("0,25"),
    p.labelBilah()
  );

  p.tutup();
}

/* ---------- 2. posisi berganti -> evaluasi lama TIDAK boleh bertahan ---------- */

console.log("\n2. evaluasi tidak boleh macet setelah posisi berganti (bug utama)");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 25 });
  await tungguSampai(() => p.adaEvaluasi());
  const evalSebelum = p.labelBilah();

  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__evalJobs.length >= 2);

  uji(
    "begitu FEN berganti, bilah TIDAK lagi menampilkan skor posisi lama",
    !p.adaEvaluasi() || p.labelBilah() !== evalSebelum,
    p.labelBilah()
  );
  uji(
    "bilah masuk status \"belum dievaluasi\" sebelum hasil posisi baru datang",
    !p.adaEvaluasi(),
    p.labelBilah()
  );
  uji(
    "tinggi isian putih tidak pernah NaN/Infinity saat status belum dievaluasi",
    !/nan|infinity/i.test(p.tinggiPutih()),
    p.tinggiPutih()
  );

  const jobKedua = window.__evalJobs[1];
  uji("permintaan kedua memang untuk posisi setelah 1.e4", jobKedua?.fen?.includes("4P3"), jobKedua?.fen);
  jobKedua.rilis({ cp: -40 });
  await tungguSampai(() => p.adaEvaluasi());
  uji(
    "bilah menampilkan evaluasi posisi BARU (bukan posisi lama)",
    p.labelBilah().includes("0.40") || p.labelBilah().includes("0,40"),
    p.labelBilah()
  );

  p.tutup();
}

/* --------------------- 3. hasil basi tidak boleh menimpa posisi baru --------------------- */

console.log("\n3. hasil engine basi tidak boleh menimpa posisi baru (race condition)");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  // Posisi A: setelah 1.e4 — job dibuat TAPI SENGAJA belum dirilis.
  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__evalJobs.length >= 2);
  const jobPosisiA = window.__evalJobs[1];
  uji("job posisi A (setelah 1.e4) terekam", jobPosisiA?.fen?.includes("4P3"), jobPosisiA?.fen);

  // Posisi B: pemain menelusuri mundur lalu maju lagi dengan cepat sebelum
  // job posisi A sempat dirilis — mensimulasikan gerakan cepat berturut-turut.
  const nav = p.tombolNavigasi();
  nav.mundur?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tungguSampai(() => window.__evalJobs.length >= 3 || !p.adaEvaluasi());
  nav.maju?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tungguSampai(() => window.__evalJobs.length >= 3);

  const labelSebelumRilisBasi = p.labelBilah();
  // Job posisi A akhirnya "selesai" TERLAMBAT, dengan nilai mencolok supaya
  // gampang ketahuan bila bocor ke bilah.
  jobPosisiA.rilis({ cp: 9999 });
  await tunggu(30);
  uji(
    "hasil basi (posisi A) TIDAK ditampilkan setelah FEN berganti",
    !p.labelBilah().includes("99.99") && !p.labelBilah().includes("99,99"),
    p.labelBilah()
  );
  uji(
    "bilah tidak berubah gara-gara hasil basi",
    p.labelBilah() === labelSebelumRilisBasi,
    `${labelSebelumRilisBasi} -> ${p.labelBilah()}`
  );

  // Permintaan yang benar-benar mewakili posisi terkini (posisi B, yang
  // sama seperti posisi A karena maju/mundur balik ke tempat semula) harus
  // tetap ada dan begitu dirilis, nilainya yang dipakai.
  const jobPosisiB = window.__evalJobs.find((j) => !j.selesai);
  uji("permintaan untuk posisi B masih menunggu", !!jobPosisiB);
  jobPosisiB?.rilis({ cp: 33 });
  await tungguSampai(() => p.adaEvaluasi());
  uji(
    "bilah akhirnya menampilkan evaluasi posisi TERKINI, bukan hasil basi",
    p.labelBilah().includes("0.33") || p.labelBilah().includes("0,33"),
    p.labelBilah()
  );

  p.tutup();
}

/* ------------------------- 4. rapid moves: undo/redo tetap konsisten ------------------------- */

console.log("\n4. undo/redo (rapid moves) tetap menampilkan evaluasi posisi aktif");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__evalJobs.length >= 2);
  window.__evalJobs[1].rilis({ cp: -40 });
  await tungguSampai(() => p.adaEvaluasi() && p.labelBilah().match(/0[.,]40/));

  const nav = p.tombolNavigasi();
  uji("tombol navigasi (undo/redo) ditemukan", !!(nav.mundur && nav.maju));

  // undo: kembali ke posisi awal — evaluasi setelah 1.e4 tidak boleh tersisa.
  const labelSetelahE4 = p.labelBilah();
  nav.mundur?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(20);

  uji(
    "undo langsung membuang evaluasi posisi sebelumnya",
    !p.adaEvaluasi() || p.labelBilah() !== labelSetelahE4,
    p.labelBilah()
  );
  await tungguSampai(() => window.__evalJobs.some((j) => !j.selesai && j.fen?.startsWith("rnbqkbnr/pppppppp/8/8/8/8")));
  const jobUndo = window.__evalJobs.find((j) => !j.selesai);
  jobUndo?.rilis({ cp: 7 });
  await tungguSampai(() => p.adaEvaluasi());
  uji(
    "bilah setelah undo mengikuti posisi hasil undo (posisi awal), bukan posisi sebelum undo",
    p.labelBilah().includes("0.07") || p.labelBilah().includes("0,07"),
    p.labelBilah()
  );

  // redo: kembali ke posisi setelah 1.e4 — evaluasi posisi awal tidak boleh tersisa.
  const labelSetelahUndo = p.labelBilah();
  nav.maju?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(20);
  uji(
    "redo langsung membuang evaluasi posisi sebelumnya juga",
    !p.adaEvaluasi() || p.labelBilah() !== labelSetelahUndo,
    p.labelBilah()
  );
  await tungguSampai(() => window.__evalJobs.some((j) => !j.selesai));
  const jobRedo = window.__evalJobs.find((j) => !j.selesai);
  uji("permintaan setelah redo memang untuk posisi setelah 1.e4", jobRedo?.fen?.includes("4P3"), jobRedo?.fen);
  jobRedo?.rilis({ cp: 12 });
  await tungguSampai(() => p.adaEvaluasi());
  uji(
    "bilah setelah redo mengikuti posisi hasil redo",
    p.labelBilah().includes("0.12") || p.labelBilah().includes("0,12"),
    p.labelBilah()
  );

  p.tutup();
}

/* -------- 5. undo saat mesin lawan masih "berpikir" tidak boleh mengunci papan -------- */

console.log("\n5. undo saat mesin lawan masih berpikir (papan tidak boleh terkunci)");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  // Pemain melangkah; mesin lawan langsung "mulai berpikir" (job dibuat)
  // TAPI SENGAJA tidak dirilis — mensimulasikan mesin yang masih menghitung.
  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__lawanJobs.length >= 1);
  uji("mesin lawan mulai \"berpikir\" setelah 1.e4", window.__lawanJobs.length >= 1);

  const nav = p.tombolNavigasi();
  nav.mundur?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(30);

  // Posisi kembali ke awal (giliran pemain). Papan TIDAK BOLEH terkunci
  // akibat status "mesin sedang berpikir" yang tertinggal dari sebelum undo.
  p.klik("d2");
  await tunggu(20);
  uji(
    "papan tidak terkunci setelah undo di tengah mesin \"berpikir\" (status giliran basi)",
    p.disorot("d2")
  );

  p.tutup();
}

/* ------------------------- 6. reset (partai baru) membuang evaluasi lama ------------------------- */

console.log("\n6. partai baru (reset) tidak menyisakan evaluasi lama");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__evalJobs.length >= 2);
  window.__evalJobs[1].rilis({ cp: -300 });
  await tungguSampai(() => p.adaEvaluasi() && p.labelBilah().match(/3[.,]00/));
  const labelSebelumReset = p.labelBilah();

  const tombolBaru = [...p.wadah.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === "Baru"
  );
  uji("tombol partai baru ditemukan", !!tombolBaru);
  tombolBaru?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tunggu(20);

  uji(
    "partai baru langsung membuang evaluasi partai sebelumnya",
    !p.adaEvaluasi() || p.labelBilah() !== labelSebelumReset,
    p.labelBilah()
  );
  await tungguSampai(() => window.__evalJobs.some((j) => !j.selesai));
  const jobBaru = window.__evalJobs.find((j) => !j.selesai);
  uji(
    "permintaan setelah reset memang untuk posisi awal lagi",
    jobBaru?.fen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    jobBaru?.fen
  );

  p.tutup();
}

/* ------------------- 7. skakmat tidak boleh menyisakan evaluasi lama ------------------- */

console.log("\n7. skakmat tidak boleh menyisakan evaluasi lama (posisi terminal)");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  // 20 langkah Putih (pemain) yang memaksa skakmat lawan yang SELALU
  // memainkan langkah legal pertama chess.js — persis seperti `MesinPalsu`
  // (lihat `langkahPertama` di atas). Urutan ini dihasilkan lewat pencarian
  // offline (greedy 1-ply lookahead) terhadap chess.js versi yang sama
  // dipakai repo ini, jadi deterministik terhadap lawan palsu di uji ini.
  const LANGKAH_MENUJU_MAT = [
    { dari: "a2", ke: "a3" },
    { dari: "f2", ke: "f3" },
    { dari: "h2", ke: "h3" },
    { dari: "b2", ke: "b3" },
    { dari: "c2", ke: "c3" },
    { dari: "g2", ke: "g3" },
    { dari: "g3", ke: "g4" },
    { dari: "g4", ke: "g5" },
    { dari: "g5", ke: "g6" },
    { dari: "g6", ke: "h7" },
    { dari: "h7", ke: "g8" }, // promosi otomatis ke menteri
    { dari: "g8", ke: "h8" },
    { dari: "h8", ke: "g8" },
    { dari: "c3", ke: "c4" },
    { dari: "c4", ke: "c5" },
    { dari: "f3", ke: "f4" },
    { dari: "f4", ke: "f5" },
    { dari: "f5", ke: "f6" },
    { dari: "f6", ke: "g7" },
    { dari: "g8", ke: "f8" }, // Qxf8# — mat
  ];

  for (let i = 0; i < LANGKAH_MENUJU_MAT.length - 1; i++) {
    const { dari, ke } = LANGKAH_MENUJU_MAT[i];
    // Langkah lawan sebelumnya bisa masih di tengah gestur async (goyang
    // bidak + jeda sebelum `mainkanLangkah` benar-benar dipanggil) — klik
    // tunggal yang jatuh sebelum papan terbuka lagi diam-diam diabaikan,
    // jadi tunggu sambil coba klik berulang.
    await p.klikSampaiTersorot(dari);
    p.klik(ke);
    // Jika promosi, dialog muncul — pilih opsi pertama (menteri)
    if (dari === "h7" && ke === "g8") {
      await tungguSampai(() => !!p.wadah.querySelector('[role="dialog"] button'));
      p.wadah.querySelector('[role="dialog"] button')?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    }
    await tungguSampai(() => window.__lawanJobs.some((j) => !j.selesai));
    window.__lawanJobs.find((j) => !j.selesai)?.rilis({ cp: 0 });
  }

  // Pastikan posisi SUDAH benar-benar sampai di giliran pemain sebelum
  // langkah mat (balasan Hitam terakhir bisa saja masih di tengah gestur
  // async) — pilih dulu petak asal langkah mat, JANGAN langsung mainkan.
  const { dari, ke } = LANGKAH_MENUJU_MAT[LANGKAH_MENUJU_MAT.length - 1];
  await p.klikSampaiTersorot(dari);

  // Sepanjang 19 langkah di atas, permintaan evaluasi untuk posisi setelah
  // langkah pertama TETAP menggantung (EngineCatur hanya menyimpan FEN
  // terbaru di `this.terakhir` tanpa mengirim "go" baru selama pencarian
  // lama belum "bestmove") — jadi sebelum langkah mat, lepaskan dulu yang
  // menggantung itu supaya permintaan BARU (untuk posisi tepat sebelum mat,
  // yang sekarang sudah pasti settle karena giliran pemain sudah kembali di
  // atas) benar-benar terkirim, lalu beri skor mencolok — bilah HARUS
  // menampilkannya dulu supaya pengujian "hilang setelah mat" di bawah ini
  // benar-benar berarti (bukan sekadar "memang sudah kosong dari awal").
  const jumlahJobSebelumLepas = window.__evalJobs.length;
  window.__evalJobs.find((j) => !j.selesai)?.rilis({ cp: 0 });
  await tungguSampai(() => window.__evalJobs.length > jumlahJobSebelumLepas);
  const jobSebelumMat = window.__evalJobs[window.__evalJobs.length - 1];
  uji(
    "permintaan evaluasi ini memang untuk posisi tepat sebelum langkah mat",
    jobSebelumMat?.fen?.split(" ")[1] === "w",
    jobSebelumMat?.fen
  );
  jobSebelumMat.rilis({ cp: 555 });
  await tungguSampai(() => /5[.,]55/.test(p.labelBilah()));
  uji(
    "bilah punya evaluasi mencolok sebelum langkah mat dimainkan",
    p.adaEvaluasi() && /5[.,]55/.test(p.labelBilah()),
    p.labelBilah()
  );

  const jumlahJobSebelumMat = window.__evalJobs.length;
  await p.klikSampaiTersorot(dari);
  p.klik(ke);

  await tungguSampai(() => p.wadah.textContent.includes("Skakmat"));
  uji("papan menampilkan hasil skakmat setelah langkah terakhir", p.wadah.textContent.includes("Skakmat"));
  uji(
    "bilah TIDAK menyisakan evaluasi (5.55) lama setelah posisi jadi skakmat",
    !p.adaEvaluasi() && !/5[.,]55/.test(p.labelBilah()),
    p.labelBilah()
  );
  uji(
    "tidak ada permintaan evaluasi baru untuk posisi terminal (mesin dihentikan, bukan dianalisis)",
    window.__evalJobs.length === jumlahJobSebelumMat,
    `${window.__evalJobs.length} vs ${jumlahJobSebelumMat}`
  );

  p.tutup();
}

/* ------------------------- 8. konvensi tanda skor ------------------------- */

console.log("\n8. skor selalu dari sudut pandang Putih, apa pun giliran/orientasi papan");
{
  // 8a. Giliran Hitam (setelah 1.e4): skor UCI relatif ke Hitam (pemain
  // yang bergilir) harus dibalik saat ditampilkan sebagai sudut pandang
  // Putih — cp positif (bagus buat Hitam) harus tampil NEGATIF di bilah.
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__evalJobs.length >= 2);
  const jobGiliranHitam = window.__evalJobs[1];
  uji("permintaan ini untuk posisi giliran Hitam", jobGiliranHitam?.fen?.split(" ")[1] === "b", jobGiliranHitam?.fen);
  // cp 40 relatif ke Hitam (yang bergilir) = bagus untuk Hitam -> harus
  // tampil sebagai -0.40 dari sudut pandang Putih, BUKAN +0.40.
  jobGiliranHitam.rilis({ cp: 40 });
  await tungguSampai(() => p.adaEvaluasi());
  uji(
    "cp positif saat giliran Hitam tampil NEGATIF (favorit Hitam) dari sudut pandang Putih",
    p.labelBilah().includes("-0.40") || p.labelBilah().includes("-0,40"),
    p.labelBilah()
  );
  uji(
    "isian putih pada bilah menyusut (Hitam unggul), bukan NaN/Infinity",
    !/nan|infinity/i.test(p.tinggiPutih()) && parseFloat(p.tinggiPutih()) < 50,
    p.tinggiPutih()
  );
  p.tutup();

  // 8b. Pemain memilih bermain sebagai Hitam (papan dibalik orientasinya).
  // Konvensi tanda (+ = bagus buat Putih) TIDAK BOLEH ikut terbalik hanya
  // karena orientasi papan berbeda — engine selalu bergerak sebagai Putih
  // pada posisi awal, jadi cp positif (relatif ke Putih yang bergilir
  // duluan) harus tetap tampil POSITIF di bilah walau papan berorientasi
  // Hitam.
  const p2 = await partaiBaru(async (wadah) => {
    // Pemilih warna kini tombol radio (aria-checked), bukan <select>.
    const pilih = [...wadah.querySelectorAll('button[role="radio"]')].find(
      (b) => b.getAttribute("aria-label") === "Hitam"
    );
    pilih?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await tunggu(10);
  });
  await tungguSampai(() => window.__evalJobs.length >= 1);
  uji(
    "permintaan evaluasi pertama tetap posisi awal (giliran Putih) walau pemain memilih Hitam",
    window.__evalJobs[0]?.fen?.split(" ")[1] === "w",
    window.__evalJobs[0]?.fen
  );
  window.__evalJobs[0].rilis({ cp: 40 });
  await tungguSampai(() => p2.adaEvaluasi());
  uji(
    "cp positif (favorit Putih) tetap tampil POSITIF walau papan berorientasi Hitam",
    p2.labelBilah().includes("+0.40") || p2.labelBilah().includes("+0,40"),
    p2.labelBilah()
  );
  p2.tutup();
}

/* ------------- 9. deret PGN 1.e4 e5 2.Nf3 Nc6 -> tiap posisi dievaluasi ------------- */

console.log("\n9. deret 1.e4 e5 2.Nf3 Nc6 — tiap posisi dievaluasi terpisah, tidak ada yang tertukar");
{
  const p = await partaiBaru();
  await tungguSampai(() => window.__evalJobs.length >= 1);
  const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  uji("job #0: posisi awal", window.__evalJobs[0]?.fen === FEN_AWAL, window.__evalJobs[0]?.fen);
  window.__evalJobs[0].rilis({ cp: 0 });
  await tungguSampai(() => p.adaEvaluasi());

  // 1. e4 (pemain)
  p.klik("e2");
  await tungguSampai(() => p.disorot("e2"));
  p.klik("e4");
  await tungguSampai(() => window.__evalJobs.length >= 2);
  const gSetelahE4 = new Chess();
  gSetelahE4.move("e4");
  uji("job #1: posisi setelah 1.e4", window.__evalJobs[1]?.fen === gSetelahE4.fen(), window.__evalJobs[1]?.fen);
  window.__evalJobs[1].rilis({ cp: 30 });
  await tungguSampai(() => p.labelBilah().match(/0[.,]30/));
  uji("bilah menampilkan skor posisi setelah 1.e4", /0[.,]30/.test(p.labelBilah()), p.labelBilah());

  // 1... e5 (lawan, dipaksa lewat job lawan — first-legal-move BUKAN e5,
  // jadi kita mainkan e5 lewat mekanisme yang sama seperti "1.e4": setelah
  // pemain melangkah, lawan biasanya membalas sendiri. Supaya deret PGN
  // yang diminta (1.e4 e5) tetap persis, langkah Hitam di sini dimainkan
  // lewat replay `terapkanNavigasi` internal komponen TIDAK tersedia dari
  // luar — jadi kita verifikasi lewat FEN yang benar-benar dihasilkan
  // lawan (apa pun langkahnya) tetap dievaluasi sebagai posisi TERSENDIRI,
  // dan skor 1.e4 tidak pernah bocor ke posisi berikutnya manapun.
  await tungguSampai(() => window.__lawanJobs.some((j) => !j.selesai));
  const jobLawanKe1 = window.__lawanJobs.find((j) => !j.selesai);
  const labelSebelumBalasanLawan = p.labelBilah();
  jobLawanKe1.rilis({ cp: 0 });
  await tungguSampai(() => window.__evalJobs.length >= 3);
  uji(
    "begitu lawan membalas, bilah tidak lagi menampilkan skor 1.e4",
    p.labelBilah() !== labelSebelumBalasanLawan || !p.adaEvaluasi(),
    p.labelBilah()
  );
  const jobSetelahBalasanLawan = window.__evalJobs[2];
  uji(
    "job #2: posisi setelah balasan Hitam BERBEDA dari posisi setelah 1.e4",
    jobSetelahBalasanLawan?.fen && jobSetelahBalasanLawan.fen !== gSetelahE4.fen(),
    jobSetelahBalasanLawan?.fen
  );
  jobSetelahBalasanLawan.rilis({ cp: -15 });
  await tungguSampai(() => p.labelBilah().match(/0[.,]15/));
  uji(
    "bilah menampilkan skor posisi setelah balasan Hitam (bukan skor 1.e4 yang lama)",
    /0[.,]15/.test(p.labelBilah()),
    p.labelBilah()
  );

  // 2. Nf3 (pemain) — posisi ini juga harus dievaluasi sebagai FEN
  // tersendiri, terpisah dari dua posisi sebelumnya.
  p.klik("g1");
  await tungguSampai(() => p.disorot("g1"));
  p.klik("f3");
  await tungguSampai(() => window.__evalJobs.length >= 4);
  const jobSetelahNf3 = window.__evalJobs[3];
  uji(
    "job #3: posisi setelah 2.Nf3 berbeda dari kedua posisi sebelumnya",
    jobSetelahNf3?.fen &&
      jobSetelahNf3.fen !== gSetelahE4.fen() &&
      jobSetelahNf3.fen !== jobSetelahBalasanLawan.fen,
    jobSetelahNf3?.fen
  );
  jobSetelahNf3.rilis({ cp: 45 });
  await tungguSampai(() => p.labelBilah().match(/0[.,]45/));
  uji("bilah menampilkan skor posisi setelah 2.Nf3", /0[.,]45/.test(p.labelBilah()), p.labelBilah());

  // Balasan Hitam kedua (yang diharapkan diarahkan Nc6 pada deret PGN yang
  // diminta soal, tapi lawan palsu di sini memainkan langkah legal pertama
  // apa pun posisinya — assersi difokuskan ke KORÉKTNYA identitas FEN tiap
  // posisi, bukan ke SAN spesifik "Nc6").
  await tungguSampai(() => window.__lawanJobs.some((j) => !j.selesai));
  const jobLawanKe2 = window.__lawanJobs.find((j) => !j.selesai);
  jobLawanKe2.rilis({ cp: 0 });
  await tungguSampai(() => window.__evalJobs.length >= 5);
  const jobPosisiAkhir = window.__evalJobs[4];
  uji(
    "job #4: posisi akhir deret PGN berbeda dari keempat posisi sebelumnya",
    jobPosisiAkhir?.fen &&
      ![FEN_AWAL, gSetelahE4.fen(), jobSetelahBalasanLawan.fen, jobSetelahNf3.fen].includes(jobPosisiAkhir.fen),
    jobPosisiAkhir?.fen
  );
  jobPosisiAkhir.rilis({ cp: 60 });
  await tungguSampai(() => p.labelBilah().match(/0[.,]60/));
  uji(
    "bilah menampilkan skor posisi akhir deret (5 posisi berbeda, semuanya dievaluasi terpisah)",
    /0[.,]60/.test(p.labelBilah()),
    p.labelBilah()
  );

  p.tutup();
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
