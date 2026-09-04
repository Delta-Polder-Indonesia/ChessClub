/**
 * Uji alur halaman Papan Interaktif (tanpa jaringan, jsdom).
 *
 * Mengapa perlu: halaman ini satu-satunya papan yang memakai PapanTekaTeki
 * sekaligus punya logika sendiri (seret, promosi, undo/redo, dialog Review,
 * tab panel). Dua hal yang paling mudah regresi saat halaman dirombak:
 *   1. klik yang "dimakan" — penanda abaikan-klik yang tidak pernah dibersihkan
 *      membuat satu klik setelah seretan hilang (pengguna harus klik dua kali);
 *   2. alur muat PGN/FEN dan promosi yang bergantung pada banyak state.
 *
 * Skrip melewatkan dirinya (exit 0) bila jsdom/esbuild tidak terpasang —
 * keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-papan-interaktif.mjs
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
function uji(nama, kondisi, info = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${info ? ` — ${info}` : ""}`);
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("lewati uji Papan Interaktif — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

/* ------------------------------------------------- bundel komponen (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import PapanInteraktif from "./src/halaman/PapanInteraktif/PapanInteraktif.jsx";

export function mountPapanInteraktif(el) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/papan-interaktif"]}>
        <I18nProvider>
          <PapanInteraktif />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-papan-interaktif.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-papan-interaktif-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  banner: { js: "function __globPalsu() { return {}; }" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    "import.meta.glob": "__globPalsu",
  },
  logLevel: "error",
});

/* --------------------------------------------------------- lingkungan jsdom */

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

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/papan",
  pretendToBeVisual: true,
});
const W = dom.window;

W.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
W.cancelAnimationFrame = (id) => clearTimeout(id);
W.ResizeObserver = PengamatPalsu;
W.IntersectionObserver = PengamatPalsu;
W.Worker = WorkerPalsu;
W.scrollTo = () => {};
W.Element.prototype.scrollIntoView = function () {};
W.HTMLElement.prototype.scrollTo = function () {};
W.Element.prototype.scrollTo = function () {};

globalThis.window = W;
globalThis.document = W.document;
globalThis.localStorage = W.localStorage;
globalThis.requestAnimationFrame = W.requestAnimationFrame;
globalThis.cancelAnimationFrame = W.cancelAnimationFrame;
globalThis.ResizeObserver = PengamatPalsu;
globalThis.IntersectionObserver = PengamatPalsu;
globalThis.Worker = WorkerPalsu;
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
  if (W[nama]) globalThis[nama] = W[nama];
}

/** Sajikan berkas /public dari disk; selain itu ditolak (uji tanpa jaringan). */
W.fetch = (url) => {
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
globalThis.fetch = W.fetch;

const pesanGalat = [];
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** Pasang halaman baru di wadah sendiri, dengan pembantu gerakan siap pakai. */
async function pasang() {
  const wadah = W.document.createElement("div");
  W.document.body.appendChild(wadah);
  modul.mountPapanInteraktif(wadah);
  await tunggu(1300); // tunggu pohon pembukaan (168 kB) dimuat

  const api = {
    wadah,
    petak: (sq) => wadah.querySelector(`[data-petak="${sq}"]`),
    bidak: (sq) => !!wadah.querySelector(`[data-petak="${sq}"] span.relative.z-10`),
    terpilih: () => wadah.querySelectorAll('[data-petak] span[style*="255, 255, 0"]').length,
    klik: (sq) => api.petak(sq)?.dispatchEvent(new W.MouseEvent("click", { bubbles: true, button: 0 })),
    tombol: (teks) => [...wadah.querySelectorAll("button")].find((b) => b.textContent.trim() === teks),
    hapus: () => wadah.remove(),
  };

  // `document.elementFromPoint` tidak diimplementasi jsdom — diarahkan ke
  // petak tujuan yang diinginkan agar seretan bisa diselesaikan.
  let sasaranEl = null;
  W.document.elementFromPoint = () => sasaranEl;
  api.seret = (dari, ke) => {
    const a = api.petak(dari);
    const b = api.petak(ke);
    a.dispatchEvent(new W.MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    sasaranEl = b;
    b.dispatchEvent(new W.MouseEvent("pointermove", { bubbles: true, button: 0, buttons: 1, clientX: 90, clientY: 90 }));
    b.dispatchEvent(new W.MouseEvent("pointerup", { bubbles: true, button: 0, clientX: 90, clientY: 90 }));
    // Browser mengirim `click` pada leluhur bersama setelah pointerup.
    a.parentElement.parentElement.dispatchEvent(new W.MouseEvent("click", { bubbles: true, button: 0 }));
  };
  api.seretLaluBatal = (dari, ke) => {
    const a = api.petak(dari);
    const b = api.petak(ke);
    a.dispatchEvent(new W.MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    sasaranEl = b;
    b.dispatchEvent(new W.MouseEvent("pointermove", { bubbles: true, button: 0, buttons: 1, clientX: 90, clientY: 90 }));
    b.dispatchEvent(new W.MouseEvent("pointermove", { bubbles: true, button: 0, buttons: 3, clientX: 90, clientY: 90 }));
    b.dispatchEvent(new W.MouseEvent("pointerup", { bubbles: true, button: 0, clientX: 90, clientY: 90 }));
    a.parentElement.parentElement.dispatchEvent(new W.MouseEvent("click", { bubbles: true, button: 0 }));
  };
  api.isiDialog = (nilai) => {
    const ta = wadah.querySelector("textarea");
    if (!ta) return false;
    const deskriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ta), "value");
    deskriptor.set.call(ta, nilai);
    ta.dispatchEvent(new W.Event("input", { bubbles: true }));
    return true;
  };
  return api;
}

/* ------------------------------------------------------------ 1. dasar papan */

console.log("render & langkah dasar:");
{
  const p = await pasang();
  uji("papan ter-render (64 petak)", p.wadah.querySelectorAll("[data-petak]").length === 64);
  uji("buku pembukaan dimuat (tanpa pesan gagal)", !/gagal dimuat/i.test(p.wadah.textContent));

  p.klik("e2");
  await tunggu(120);
  uji("klik bidak → petak terpilih", p.terpilih() === 1);
  p.klik("e4");
  await tunggu(250);
  uji("klik tujuan → langkah 1.e4 terjadi", p.bidak("e4") && !p.bidak("e2"));
  uji("langkah pembukaan ditandai ikon buku", !!p.wadah.querySelector('[title="Langkah buku (pembukaan)"]'));
  p.hapus();
}

/* ------------------------------------- 2. regresi: klik setelah seret hilang */

console.log("\nseret (drag) — klik berikutnya tidak boleh tertelan:");
{
  const p = await pasang();
  p.seret("e2", "e4");
  await tunggu(300);
  uji("seretan menghasilkan langkah", p.bidak("e4") && !p.bidak("e2"));

  // Setelah 1.e4 giliran Hitam — klik perdana harus memilih bidak Hitam.
  p.klik("e7");
  await tunggu(200);
  uji("klik pertama SETELAH seretan langsung memilih bidak", p.terpilih() === 1, `penanda=${p.terpilih()}`);
  p.hapus();
}

console.log("\nbatal seret (klik kanan) — klik berikutnya tidak boleh tertelan:");
{
  const p = await pasang();
  p.seretLaluBatal("e2", "e4");
  await tunggu(300);
  uji("seretan dibatalkan (bidak kembali ke e2)", p.bidak("e2") && !p.bidak("e4"));

  p.klik("d2");
  await tunggu(200);
  uji("klik pertama SETELAH batal seret langsung memilih bidak", p.terpilih() === 1, `penanda=${p.terpilih()}`);
  p.hapus();
}

/* --------------------------------------------------------- 3. undo / redo */

console.log("\nnavigasi undo / redo:");
{
  const p = await pasang();
  // 1. e4 e5 2. d4 (giliran berganti: Putih, Hitam, Putih)
  p.klik("e2"); await tunggu(120); p.klik("e4"); await tunggu(250);
  p.klik("e7"); await tunggu(120); p.klik("e5"); await tunggu(250);
  p.klik("d2"); await tunggu(120); p.klik("d4"); await tunggu(250);
  uji("tiga langkah tercatat", p.bidak("e4") && p.bidak("e5") && p.bidak("d4") && !p.bidak("e2"));

  p.tombol("◀")?.click();
  await tunggu(300);
  uji("undo menghapus langkah terakhir", p.bidak("d2") && !p.bidak("d4") && p.bidak("e5"));
  p.tombol("▶")?.click();
  await tunggu(300);
  uji("redo mengembalikan langkah", p.bidak("d4") && !p.bidak("d2"));

  p.tombol("⏮")?.click();
  await tunggu(300);
  uji("ke awal mengosongkan papan", p.bidak("e2") && p.bidak("e7") && !p.bidak("e4"));
  p.tombol("⏭")?.click();
  await tunggu(300);
  uji("ke akhir mengembalikan semua langkah", p.bidak("e4") && p.bidak("e5") && p.bidak("d4"));

  p.tombol("New")?.click();
  await tunggu(350);
  uji("New mengosongkan papan", p.bidak("e2") && !p.bidak("e4"));
  uji("New membuang riwayat (tombol Maju nonaktif)", p.tombol("▶")?.disabled === true);
  p.hapus();
}

/* --------------------------------------------------- 4. dialog Review (PGN) */

console.log("\ndialog Review — muat PGN & FEN:");
{
  const p = await pasang();
  p.tombol("Review")?.click();
  await tunggu(250);
  uji("dialog Review terbuka", !!p.wadah.querySelector("textarea"));

  p.isiDialog("1. e4 e5 2. Nf3 Nc6 3. Bb5");
  await tunggu(150);
  p.tombol("Muat")?.click();
  await tunggu(400);
  uji("PGN dimuat (3.Bb5 tampil di papan)", p.bidak("b5"));
  uji("dialog tertutup setelah PGN valid", !p.wadah.querySelector("textarea"));
  uji("nama pembukaan tampil", /Ruy Lopez/i.test(p.wadah.textContent));

  p.tombol("Review")?.click();
  await tunggu(250);
  p.isiDialog("1. e4 e5 2. Nf3 Zz9");
  await tunggu(150);
  p.tombol("Muat")?.click();
  await tunggu(300);
  uji("PGN tidak valid ditolak (dialog tetap terbuka)", !!p.wadah.querySelector("textarea"));
  uji("pesan galat tampil", /tidak dapat dimuat/i.test(p.wadah.textContent));
  uji("papan tidak berubah saat PGN ditolak", p.bidak("b5"));

  p.isiDialog("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  await tunggu(150);
  p.tombol("Muat")?.click();
  await tunggu(400);
  uji("FEN dimuat", !p.wadah.querySelector("textarea") && !p.bidak("b5"));
  p.hapus();
}

/* ------------------------------------------------------------- 5. promosi */

console.log("\npromosi pion:");
{
  const p = await pasang();
  p.tombol("Review")?.click();
  await tunggu(250);
  p.isiDialog("4k3/6P1/8/8/8/8/8/4K3 w - - 0 1");
  await tunggu(150);
  p.tombol("Muat")?.click();
  await tunggu(400);

  p.klik("g7"); await tunggu(120);
  p.klik("g8"); await tunggu(300);
  const dialog = p.wadah.querySelector('[role="dialog"]');
  uji("dialog promosi muncul", !!dialog);
  const pilihan = dialog ? [...dialog.querySelectorAll("button")] : [];
  uji("4 pilihan bidak + tombol batal", pilihan.length === 5, `(=${pilihan.length})`);
  const label = pilihan.map((b) => b.getAttribute("aria-label") || "").join(" ");
  uji("label promosi diterjemahkan (Menteri/Benteng/Gajah/Kuda)", /Menteri/.test(label) && /Kuda/.test(label), label);

  pilihan[0]?.click();
  await tunggu(350);
  uji("promosi diterapkan", !p.wadah.querySelector('[role="dialog"]') && p.bidak("g8") && !p.bidak("g7"));

  // Escape membatalkan promosi tanpa mengubah papan.
  p.klik("a1"); await tunggu(100);
  p.hapus();
}

console.log("\npromosi dibatalkan lewat Escape:");
{
  const p = await pasang();
  p.tombol("Review")?.click();
  await tunggu(250);
  p.isiDialog("4k3/6P1/8/8/8/8/8/4K3 w - - 0 1");
  await tunggu(150);
  p.tombol("Muat")?.click();
  await tunggu(400);
  p.klik("g7"); await tunggu(120);
  p.klik("g8"); await tunggu(300);
  W.document.dispatchEvent(new W.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await tunggu(300);
  uji("Escape menutup dialog promosi", !p.wadah.querySelector('[role="dialog"]'));
  uji("pion tetap di g7 (langkah dibatalkan)", p.bidak("g7") && !p.bidak("g8"));
  p.hapus();
}

/* ------------------------------------------------------------- 6. tab panel */

console.log("\ntab panel kanan:");
{
  const p = await pasang();
  p.tombol("Books")?.click();
  await tunggu(800);
  const baris = p.wadah.querySelectorAll("li button").length;
  uji("tab Books menampilkan katalog pembukaan", baris > 100, `(=${baris})`);

  const kolomCari = p.wadah.querySelector('input[type="search"]');
  uji("kolom pencarian tersedia", !!kolomCari);
  if (kolomCari) {
    const deskriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(kolomCari), "value");
    deskriptor.set.call(kolomCari, "najdorf");
    kolomCari.dispatchEvent(new W.Event("input", { bubbles: true }));
    await tunggu(400);
    const sisa = p.wadah.querySelectorAll("li button").length;
    uji("pencarian menyaring katalog", sisa > 0 && sisa < baris, `(=${sisa} dari ${baris})`);
  }

  p.tombol("Games")?.click();
  await tunggu(400);
  uji("tab Games menampilkan langkah lanjutan buku", /Langkah|langkah/i.test(p.wadah.textContent));
  p.hapus();
}

/* ------------------------------------------------------------ 7. kebersihan */

console.log("\nkebersihan konsol:");
{
  const galatRender = pesanGalat.filter(
    (p) => !/not wrapped in act|not implemented/i.test(p)
  );
  uji("tidak ada galat render React selama pengujian", galatRender.length === 0);
  if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
