/**
 * HARNESS B — perilaku klik-langkah papan ChessClub (komponen ASLI di jsdom).
 *
 * Me-mount `PapanInteraktif` sungguhan (esbuild + jsdom, pola sama dengan
 * scripts/uji-lencana-skakmat.mjs), memberi tata letak sintetis +
 * elementFromPoint buatan, LALU memodelkan browser nyata:
 *
 *   - `setPointerCapture` jsdom tidak ada; di sini di-emulasi. Selama capture
 *     aktif (papan memanggilnya saat mulai menyeret bidak sendiri), pointerup
 *     dan `click` RETARGET ke elemen papan — persis Chromium/Firefox — bukan ke
 *     tombol petak.
 *   - `click` dikirim ke nenek-moyang bersama dari target pointerdown &
 *     pointerup (aturan UI Events), seperti yang dilakukan browser.
 *
 * Tanpa dua hal itu, jsdom membuat papan tampak berperilaku lain daripada di
 * browser (klik pada bidak sendiri seolah membatalkan pilihan).
 *
 * Jalankan: node uji-papan-klik.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pluginGlobAset } from "../../scripts/loader-jsx.mjs";

/** Akar repositori ini (docs/riset-isepic/ → ../..). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

const KELUARAN = path.join(ROOT, "docs/riset-isepic");
mkdirSync(KELUARAN, { recursive: true });

const KOTAK = 80;
const KIRI = 120;
const ATAS = 60;

/* ------------------------------------------------------------ bundel React */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import PapanInteraktif from "./src/halaman/PapanInteraktif/PapanInteraktif.jsx";

export function mountPapanInteraktif(el) {
  const root = createRoot(el);
  root.render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/program-kami/papan-interaktif"]}>
        <I18nProvider>
          <PapanInteraktif />
        </I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
  return root;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-bandingkan-papan.cjs");
await build({
  stdin: { contents: MASUK, resolveDir: ROOT, loader: "jsx", sourcefile: "bandingkan-entry.jsx" },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

/* -------------------------------------------------------------- lingkungan */

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

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: "https://uji.test/program-kami/papan-interaktif",
  pretendToBeVisual: true,
});
const win = dom.window;
const doc = win.document;

win.ResizeObserver = PengamatPalsu;
win.IntersectionObserver = PengamatPalsu;
win.Worker = WorkerPalsu;
win.matchMedia =
  win.matchMedia ?? ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
win.scrollTo = () => {};
win.HTMLMediaElement.prototype.play = function () {};
win.HTMLMediaElement.prototype.pause = function () {};
win.Element.prototype.scrollIntoView = function () {};
win.HTMLElement.prototype.scrollTo = function () {};
win.Element.prototype.scrollTo = function () {};
win.requestAnimationFrame = win.requestAnimationFrame ?? ((cb) => setTimeout(() => cb(Date.now()), 0));
win.cancelAnimationFrame = win.cancelAnimationFrame ?? ((id) => clearTimeout(id));

/* Emulasi pointer capture — jsdom tidak menyediakannya. */
let captureAktif = null;
win.Element.prototype.setPointerCapture = function setPointerCapture() {
  captureAktif = this;
};
win.Element.prototype.releasePointerCapture = function releasePointerCapture() {
  captureAktif = null;
};
win.Element.prototype.hasPointerCapture = function hasPointerCapture() {
  return captureAktif === this;
};

for (const [k, v] of Object.entries({
  window: win,
  document: doc,
  localStorage: win.localStorage,
  ResizeObserver: PengamatPalsu,
  IntersectionObserver: PengamatPalsu,
  Worker: WorkerPalsu,
  requestAnimationFrame: win.requestAnimationFrame,
  cancelAnimationFrame: win.cancelAnimationFrame,
})) {
  Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
}
if (!globalThis.navigator) {
  Object.defineProperty(globalThis, "navigator", { value: win.navigator, configurable: true });
}
for (const nama of [
  "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "Element", "Node",
  "Event", "MouseEvent", "KeyboardEvent", "CustomEvent",
]) {
  if (win[nama]) Object.defineProperty(globalThis, nama, { value: win[nama], configurable: true, writable: true });
}

/** Sajikan /public dari disk; permintaan luar (chessdb.cn dsb.) ditolak. */
win.fetch = (url) => {
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
globalThis.fetch = win.fetch;

/* ------------------------------------------- tata letak sintetis + pencacah */

function rectPetak(bos) {
  const kolom = bos.charCodeAt(0) - 97;
  const baris = 8 - Number(bos[1]);
  return {
    left: KIRI + kolom * KOTAK,
    top: ATAS + baris * KOTAK,
    width: KOTAK,
    height: KOTAK,
    right: KIRI + (kolom + 1) * KOTAK,
    bottom: ATAS + (baris + 1) * KOTAK,
    x: KIRI + kolom * KOTAK,
    y: ATAS + baris * KOTAK,
  };
}
const PAPAN_RECT = {
  left: KIRI, top: ATAS, width: KOTAK * 8, height: KOTAK * 8,
  right: KIRI + KOTAK * 8, bottom: ATAS + KOTAK * 8, x: KIRI, y: ATAS,
};

const pencacah = { getBoundingClientRect: 0, elementFromPoint: 0, panggilanSetPointerCapture: 0 };
win.Element.prototype.getBoundingClientRect = function () {
  pencacah.getBoundingClientRect += 1;
  if (this.dataset?.petak) return rectPetak(this.dataset.petak);
  if (this.querySelector?.(":scope > [data-petak]")) return PAPAN_RECT;
  return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0 };
};
const setCaptureAsli = win.Element.prototype.setPointerCapture;
win.Element.prototype.setPointerCapture = function (id) {
  pencacah.panggilanSetPointerCapture += 1;
  return setCaptureAsli.call(this, id);
};

doc.elementFromPoint = (x, y) => {
  pencacah.elementFromPoint += 1;
  for (const el of doc.querySelectorAll("[data-petak]")) {
    const r = rectPetak(el.dataset.petak);
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
  }
  return doc.body;
};

/* ---------------------------------------------------------------- mounting */

const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function tungguHingga(kondisi, batasMs = 30000, jedaMs = 25) {
  const mulai = Date.now();
  while (!kondisi()) {
    if (Date.now() - mulai > batasMs) return false;
    await tunggu(jedaMs);
  }
  return true;
}

const wadah = doc.createElement("div");
doc.body.appendChild(wadah);
modul.mountPapanInteraktif(wadah);
if (!(await tungguHingga(() => wadah.querySelectorAll("[data-petak]").length === 64))) {
  console.error("GAGAL: papan tidak ter-render (pohon buku pembukaan tidak termuat).");
  process.exit(1);
}

/* ------------------------------------------------------------- observasi */

const petakEl = (sq) => wadah.querySelector(`[data-petak="${sq}"]`);
const papanAkar = () => petakEl("e2")?.closest(".aspect-square") ?? null;

/** Tanda tangan posisi: "e2:P e4:P …" (huruf besar = putih). */
function posisi() {
  return [...wadah.querySelectorAll("[data-petak]")]
    .map((el) => [el.dataset.petak, el.querySelector("[data-bidak]")?.dataset.bidak])
    .filter(([, b]) => b)
    .map(([s, b]) => `${s}:${b}`)
    .sort()
    .join(" ");
}

function terpilih() {
  return [...wadah.querySelectorAll("[data-petak]")]
    .filter((el) => [...el.querySelectorAll("span")].some((s) => s.style.backgroundColor === "rgba(255, 255, 0, 0.45)"))
    .map((el) => el.dataset.petak);
}

function sasaran() {
  return [...wadah.querySelectorAll("[data-petak]")]
    .filter((el) => el.querySelector("span.rounded-full"))
    .map((el) => el.dataset.petak)
    .sort();
}

function salah() {
  return [...wadah.querySelectorAll("[data-petak]")]
    .filter((el) => [...el.querySelectorAll("span")].some((s) => s.style.backgroundColor === "rgba(216, 60, 60, 0.55)"))
    .map((el) => el.dataset.petak);
}

const dialogPromosi = () => wadah.querySelector('[role="dialog"][aria-modal="true"]');
const jumlahOpsiPromosi = () => {
  const d = dialogPromosi();
  return d ? d.querySelectorAll("button").length - 1 : 0;
};

/** Ringkasan posisi hanya untuk petak tertentu (untuk melacak satu bidak). */
const bidakDi = (sq) => petakEl(sq)?.querySelector("[data-bidak]")?.dataset.bidak ?? null;

/* ------------------------------------------------- pendorong event (browser) */

/** Nenek-moyang bersama — target `click` menurut spesifikasi UI Events. */
function nenekMoyangBersama(a, b) {
  if (!a || !b) return doc.body;
  const leluhurA = new Set();
  for (let el = a; el; el = el.parentElement) leluhurA.add(el);
  for (let el = b; el; el = el.parentElement) if (leluhurA.has(el)) return el;
  return doc.body;
}

let targetAwal = null;
let targetLepas = null;

function kejadian(nama, el, { button = 0, clientX, clientY }) {
  const e = new win.MouseEvent(nama, { bubbles: true, cancelable: true, button, clientX, clientY });
  Object.defineProperty(e, "pointerId", { value: 1 });
  Object.defineProperty(e, "pointerType", { value: "mouse" });
  Object.defineProperty(e, "buttons", { value: nama === "pointerup" ? 0 : button === 2 ? 2 : 1 });
  el.dispatchEvent(e);
}

/** pointerdown pada petak: capture dipasang papan hanya jika seret dimulai. */
async function tekan(bos, { button = 0 } = {}) {
  captureAktif = null;
  targetAwal = petakEl(bos);
  const r = rectPetak(bos);
  kejadian("pointerdown", targetAwal, { button, clientX: r.left + KOTAK / 2, clientY: r.top + KOTAK / 2 });
  await tunggu(40);
}

/** pointerup: RETARGET ke elemen capture bila capture aktif (aturan browser). */
async function lepas({ bos = null, diLuar = false, button = 0 } = {}) {
  const el = captureAktif ?? (diLuar ? doc.body : petakEl(bos));
  targetLepas = el;
  const koordinat = bos && !diLuar ? rectPetak(bos) : null;
  kejadian("pointerup", el, {
    button,
    clientX: diLuar ? 5000 : koordinat.left + KOTAK / 2,
    clientY: diLuar ? 5000 : koordinat.top + KOTAK / 2,
  });
  await tunggu(40);
}

/** `click` bawaan browser menyusul pasangan down/up di atas. */
async function klikBawaan() {
  const target = nenekMoyangBersama(targetAwal, targetLepas);
  kejadian("click", target, { clientX: 0, clientY: 0 });
  await tunggu(80);
}

/** Satu klik penuh seperti pengguna (down → up → click bawaan). */
async function klik(bos) {
  await tekan(bos);
  await lepas({ bos });
  await klikBawaan();
}

async function rekam(nama, langkah) {
  const t0 = { ...pencacah };
  const jejak = [];
  const catat = (label) =>
    jejak.push({
      tahap: label,
      terpilih: terpilih(),
      sasaran: sasaran(),
      salah: salah(),
      opsiPromosi: jumlahOpsiPromosi(),
      e2: bidakDi("e2"),
      e4: bidakDi("e4"),
    });
  const hasil = await langkah({ catat });
  return {
    nama,
    getBoundingClientRect: pencacah.getBoundingClientRect - t0.getBoundingClientRect,
    elementFromPoint: pencacah.elementFromPoint - t0.elementFromPoint,
    ...hasil,
    jejak,
  };
}

/** Reset ke posisi awal lewat tombol "Baru" (label kamus `papan.baru`). */
const POSISI_AWAL = posisi();
async function reset() {
  const tombol = [...wadah.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Baru");
  if (!tombol) throw new Error('tombol "Baru" (reset papan) tidak ditemukan');
  kejadian("click", tombol, { clientX: 0, clientY: 0 });
  if (!(await tungguHingga(() => posisi() === POSISI_AWAL, 5000))) {
    throw new Error(`reset gagal.\n  awal : ${POSISI_AWAL}\n  kini : ${posisi()}`);
  }
  await tunggu(60);
}

const hasil = [];

/* ============ 1. klik-move (klik petak asal → klik petak tujuan) ========== */

await reset();
hasil.push(
  await rekam("1. klik-move: klik e2 → tekan e4 → lepas e4 → click e4", async ({ catat }) => {
    catat("sebelum apa-apa");
    await tekan("e2");
    catat("pointerdown e2 (tekan bidak sendiri)");
    await lepas({ bos: "e2" });
    catat("pointerup e2 (retarget ke papan karena capture)");
    await klikBawaan();
    catat("click bawaan (di papan)");
    await tekan("e4");
    const bidakE4SetelahTekan = bidakDi("e4");
    catat("pointerdown e4 (tekan petak tujuan) — BELUM dilepas");
    await lepas({ bos: "e4" });
    catat("pointerup e4 (belum ada click)");
    await klikBawaan();
    catat("click e4 (target = tombol petak)");
    return {
      langkahTerjadiDi: bidakE4SetelahTekan ? "pointerdown tujuan" : "click tujuan",
      pindah: bidakDi("e4") && !bidakDi("e2") ? "e2-e4" : "tidak ada",
    };
  })
);

/* ============== 2. tekan tujuan lalu lepas di luar papan ================== */

await reset();
hasil.push(
  await rekam("2. klik e2 → tekan e4 → lepas DI LUAR papan", async ({ catat }) => {
    await klik("e2");
    catat("setelah klik e2");
    await tekan("e4");
    catat("pointerdown e4");
    await lepas({ diLuar: true });
    await klikBawaan();
    catat("pointerup + click di luar papan");
    return { pindah: bidakDi("e4") ? "ya" : "tidak (dibatalkan)", terpilihAkhir: terpilih() };
  })
);

/* ================================ 3. seret bidak ========================== */

await reset();
hasil.push(
  await rekam("3. seret: tekan e2 → gerak ke e4 → lepas e4", async ({ catat }) => {
    await tekan("e2");
    catat("pointerdown e2");
    const elGerak = captureAktif ?? petakEl("e4");
    const r = rectPetak("e4");
    kejadian("pointermove", elGerak, { clientX: r.left + KOTAK / 2, clientY: r.top + KOTAK / 2 });
    await tunggu(60);
    catat("pointermove ke e4 (bidak asal disembunyikan)");
    await lepas({ bos: "e4" });
    catat("pointerup e4");
    await klikBawaan();
    catat("click bawaan (di papan)");
    return { pindah: bidakDi("e4") && !bidakDi("e2") ? "e2-e4" : "tidak ada", terpilihAkhir: terpilih() };
  })
);

/* ==================== 4. klik bidak yang sama dua kali =================== */

await reset();
hasil.push(
  await rekam("4. klik e2 → klik e2 lagi (batal pilih)", async ({ catat }) => {
    await klik("e2");
    catat("setelah klik pertama e2");
    await klik("e2");
    catat("setelah klik kedua e2");
    return { terpilihAkhir: terpilih(), sasaran: sasaran() };
  })
);

/* ===================== 5. pindah pilihan ke bidak lain =================== */

await reset();
hasil.push(
  await rekam("5. klik e2 → klik d2 (bidak sendiri lain)", async ({ catat }) => {
    await klik("e2");
    catat("setelah klik e2");
    await klik("d2");
    catat("setelah klik d2");
    return { terpilihAkhir: terpilih(), sasaran: sasaran() };
  })
);

/* ==================== 6. tujuan tidak sah: petak kosong ================== */

await reset();
hasil.push(
  await rekam("6. klik e2 → klik e5 (tidak sah, petak kosong)", async ({ catat }) => {
    await klik("e2");
    catat("setelah klik e2");
    await klik("e5");
    catat("setelah klik e5");
    return { pindah: bidakDi("e4") ? "ya" : "tidak", terpilihAkhir: terpilih(), salah: salah() };
  })
);

/* ==================== 7. tujuan tidak sah: bidak lawan =================== */

await reset();
hasil.push(
  await rekam("7. klik e2 → klik e7 (bidak lawan, tidak sah)", async ({ catat }) => {
    await klik("e2");
    await klik("e7");
    catat("setelah klik e7");
    return { pindah: bidakDi("e4") ? "ya" : "tidak", terpilihAkhir: terpilih(), salah: salah() };
  })
);

/* =============== 8. seret ke petak ilegal (umpan balik galat) ============ */

await reset();
hasil.push(
  await rekam("8. seret e2 → lepas di e5 (ilegal)", async ({ catat }) => {
    await tekan("e2");
    const elGerak = captureAktif ?? petakEl("e5");
    const r = rectPetak("e5");
    kejadian("pointermove", elGerak, { clientX: r.left + KOTAK / 2, clientY: r.top + KOTAK / 2 });
    await tunggu(50);
    await lepas({ bos: "e5" });
    catat("pointerup di e5");
    await klikBawaan();
    const salahSaat = salah();
    catat("tepat setelah lepas (kesalahan 700 ms)");
    await tunggu(900);
    return {
      pindah: bidakDi("e4") ? "ya" : "tidak",
      salahSaatLepas: salahSaat,
      salahSetelah700ms: salah(),
      terpilihAkhir: terpilih(),
    };
  })
);

/* ============================ 9. promosi klik ============================= */

await reset();
{
  // Muat FEN promosi lewat dialog "Tinjau" (jalur resmi pengguna).
  const tombolTinjau = [...wadah.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Tinjau");
  let fenTermuat = false;
  if (tombolTinjau) {
    kejadian("click", tombolTinjau, { clientX: 0, clientY: 0 });
    await tunggu(200);
    const area = wadah.querySelector("textarea");
    const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, "value").set;
    setter.call(area, "8/P7/8/8/8/8/8/K6k w - - 0 1");
    area.dispatchEvent(new win.Event("input", { bubbles: true }));
    await tunggu(80);
    const tombolMuat = [...wadah.querySelectorAll("button")].find((b) => b.textContent.trim() === "Muat");
    kejadian("click", tombolMuat, { clientX: 0, clientY: 0 });
    await tunggu(400);
    fenTermuat = !!petakEl("a7")?.querySelector("[data-bidak]");
  }

  hasil.push(
    await rekam("9. promosi: klik a7 → tekan a8 → lepas a8 → click a8", async ({ catat }) => {
      await klik("a7");
      catat("setelah klik a7 (pion)");
      await tekan("a8");
      const opsiSetelahTekan = jumlahOpsiPromosi();
      catat("pointerdown a8");
      const opsiSetelahLepas = (await lepas({ bos: "a8" }), await klikBawaan(), jumlahOpsiPromosi());
      catat("pointerup + click a8");
      const dialog = dialogPromosi();
      if (dialog) {
        const pilihan = [...dialog.querySelectorAll("button")].filter((b) => !/batal/i.test(b.textContent || ""));
        kejadian("click", pilihan[0], { clientX: 0, clientY: 0 });
        await tunggu(200);
      }
      catat("setelah memilih bidak promosi");
      return {
        fenTermuat,
        opsiDiTekan: opsiSetelahTekan,
        opsiDiLepas: opsiSetelahLepas,
        langkahTerjadiDi: opsiSetelahTekan > 0 ? "dialog promosi (menunggu pilihan)" : "langsung",
        bidakA8: bidakDi("a8"),
        bidakA7: bidakDi("a7"),
      };
    })
  );
}

/* ============ 10. satu klik tertelan setelah seret dibatalkan (batal) ==== */

await reset();
hasil.push(
  await rekam("10. pointercancel saat menyeret → klik tombol Baru", async ({ catat }) => {
    // Mainkan 1.e4 dulu supaya tombol Baru punya efek yang terlihat.
    await klik("e2");
    await klik("e4");
    catat("setelah 1.e4");

    // Pengguna mulai menyeret lalu gesture OS / gulir sentuh membatalkannya
    // (pointercancel) — browser TIDAK mengirim `click` setelahnya.
    // Setelah 1.e4 giliran HITAM — seret pion hitam d7 (bukan e2/d2 milik putih,
    // karena papan menolak menyeret bidak yang bukan gilirannya).
    await tekan("d7");
    kejadian("pointercancel", captureAktif ?? papanAkar(), { clientX: 0, clientY: 0 });
    await tunggu(150);
    catat("setelah pointercancel");

    const tombol = [...wadah.querySelectorAll("button")].find((b) => (b.textContent || "").trim() === "Baru");
    kejadian("click", tombol, { clientX: 0, clientY: 0 });
    await tunggu(350);
    const setelahKlik1 = posisi();
    const tertelan = setelahKlik1 !== POSISI_AWAL;
    catat("setelah klik Baru ke-1");
    kejadian("click", tombol, { clientX: 0, clientY: 0 });
    await tunggu(350);
    catat("setelah klik Baru ke-2");
    return {
      klikPertamaTertelan: tertelan,
      klikKeduaBerhasil: posisi() === POSISI_AWAL,
    };
  })
);

/* =========================== ringkasan + simpan ========================== */

console.log("=== CHESSCLUB (PapanInteraktif) — perilaku klik, komponen asli (jsdom) ===\n");
for (const h of hasil) {
  console.log(`▸ ${h.nama}`);
  for (const j of h.jejak ?? []) {
    console.log(
      `    ${String(j.tahap).padEnd(48)} pilih=[${j.terpilih.join(",")}] sasaran=[${j.sasaran
        .slice(0, 4)
        .join(",")}${j.sasaran.length > 4 ? ",…" : ""}]${j.salah.length ? ` SALAH=[${j.salah.join(",")}]` : ""}${
        j.opsiPromosi ? ` promosi=${j.opsiPromosi}` : ""
      } e2=${j.e2 ?? "-"} e4=${j.e4 ?? "-"}`
    );
  }
  for (const kunci of [
    "langkahTerjadiDi", "pindah", "terpilihAkhir", "sasaran", "salahSaatLepas", "salahSetelah700ms",
    "opsiDiTekan", "opsiDiLepas", "bidakA8", "bidakA7", "fenTermuat", "klikPertamaTertelan", "klikKeduaBerhasil",
  ]) {
    if (h[kunci] !== undefined) console.log(`    → ${kunci}: ${JSON.stringify(h[kunci])}`);
  }
  console.log(`    → getBoundingClientRect: ${h.getBoundingClientRect}× | elementFromPoint: ${h.elementFromPoint}×`);
  console.log("");
}

writeFileSync(
  path.join(KELUARAN, "hasil-chessclub.json"),
  JSON.stringify(
    {
      komponen: "src/halaman/PapanInteraktif/PapanInteraktif.jsx + src/halaman/TekaTeki/PapanTekaTeki.jsx",
      catatan: "pointer capture diemulasi (retarget pointerup + click ala browser)",
      hasil,
    },
    null,
    2
  )
);
console.log(`Hasil JSON: ${path.join(KELUARAN, "hasil-chessclub.json")}`);
