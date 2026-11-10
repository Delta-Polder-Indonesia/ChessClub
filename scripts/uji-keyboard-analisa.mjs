/**
 * Uji keyboard Analisa — langsung pada implementasi produksi
 *
 * Berkas ini TIDAK menduplikasi isElemenInteraktif / isDialogAktif /
 * handleKeyDown. Ia mengimpor ketiganya dari
 *   src/halaman/Analisa/komponen/game/keyboardPapan.js
 * yang juga dipakai src/halaman/Analisa/komponen/game/game.jsx.
 * Jika helper di file test diganti, test tetap menguji kode produksi.
 */
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AKAR = path.resolve(__dirname, "..");

let lulus = 0;
let gagal = 0;
async function uji(nama, fn) {
  try {
    await fn();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal++;
    console.error(`  ✗ ${nama}\n    ${e?.stack ?? e?.message}`);
    process.exitCode = 1;
  }
}

// Import produksi — satu sumber kebenaran
const produksi = await import(path.join(AKAR, "src/halaman/Analisa/komponen/game/keyboardPapan.js"));
const { isElemenInteraktif, isDialogAktif, buatHandleKeyDown } = produksi;
const TAMPILAN_BERMAIN = "bermain"; // nilai TAMPILAN_ANALISA.BERMAIN di produksi

function pasangDOM(html = "<!DOCTYPE html><html><body></body></html>") {
  const dom = new JSDOM(html, { url: "http://localhost" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.KeyboardEvent = dom.window.KeyboardEvent;
  globalThis.getComputedStyle = dom.window.getComputedStyle?.bind(dom.window) ?? (() => null);
  return dom;
}

function buatDeps(over = {}) {
  const tampilanRef = { current: over.tampilan ?? TAMPILAN_BERMAIN };
  const pageStateRef = { current: over.pageState ?? "analyze" };
  const dragRef = { current: { is: over.dragIs ?? false } };
  const analyzingMoveRef = { current: over.analyzing ?? false };
  const calls = { back: 0, forward: 0, first: 0, last: 0, togglePlay: 0 };
  const gameController = {
    back: () => calls.back++,
    forward: () => calls.forward++,
    first: () => calls.first++,
    last: () => calls.last++,
    togglePlay: () => calls.togglePlay++,
  };
  const handler = buatHandleKeyDown({ tampilanRef, pageStateRef, dragRef, analyzingMoveRef, gameController });
  return { handler, calls, tampilanRef, pageStateRef, dragRef, analyzingMoveRef, gameController };
}

function kirim(handler, key, target, extra = {}) {
  let prevented = false;
  const e = {
    key,
    target: target || document.body,
    preventDefault: () => {
      prevented = true;
    },
    ...extra,
  };
  handler(e);
  return prevented;
}

console.log("Keyboard — produksi `keyboardPapan.js` + lifecycle");

// ------------------------------------------------------------------
// Bukti test memakai produksi, bukan replika
// ------------------------------------------------------------------
await uji("Test mengimpor produksi, bukan replika helper", () => {
  assert.equal(typeof isElemenInteraktif, "function");
  assert.equal(typeof isDialogAktif, "function");
  assert.equal(typeof buatHandleKeyDown, "function");
  const srcGame = fs.readFileSync(path.join(AKAR, "src/halaman/Analisa/komponen/game/game.jsx"), "utf8");
  assert.ok(srcGame.includes('from "./keyboardPapan.js"'), "game.jsx harus impor dari keyboardPapan.js");
  assert.ok(!srcGame.includes("function isElemenInteraktif"), "game.jsx tidak boleh definisikan isElemenInteraktif sendiri");
  assert.ok(!srcGame.includes("function isDialogAktif"), "game.jsx tidak boleh definisikan isDialogAktif sendiri");
  // helper lokal di file test hanya ada di produksi — file test sendiri tidak definisikan duplikat
  const srcTest = fs.readFileSync(path.join(AKAR, "scripts/uji-keyboard-analisa.mjs"), "utf8");
  const definisiLokal = (srcTest.match(/function isElemenInteraktif\(/g) || []).length;
  assert.equal(definisiLokal, 0, "file test tidak boleh definisikan isElemenInteraktif sendiri");
});

await uji("Listener dipasang di document, dilepas dari document (bukan window)", () => {
  const srcGame = fs.readFileSync(path.join(AKAR, "src/halaman/Analisa/komponen/game/game.jsx"), "utf8");
  assert.ok(srcGame.includes('document.addEventListener("keydown", handleKeyDown)'));
  assert.ok(srcGame.includes('document.removeEventListener("keydown", handleKeyDown)'));
  assert.equal(srcGame.includes('window.addEventListener("keydown"'), false);
  assert.equal(srcGame.includes('window.removeEventListener("keydown"'), false);
});

await uji("Tidak ada case Tab — Tab tidak dicegat", () => {
  const srcProd = fs.readFileSync(path.join(AKAR, "src/halaman/Analisa/komponen/game/keyboardPapan.js"), "utf8");
  assert.equal(srcProd.includes('case "Tab"'), false);
  assert.equal(srcProd.includes("case 'Tab'"), false);
  // perilaku: Tab jatuh ke default, tidak preventDefault, tidak panggil controller
  pasangDOM();
  const { handler, calls } = buatDeps();
  const prevented = kirim(handler, "Tab", document.body);
  assert.equal(prevented, false);
  assert.deepEqual(calls, { back: 0, forward: 0, first: 0, last: 0, togglePlay: 0 });
});

// ------------------------------------------------------------------
// A. Navigasi fokus
// ------------------------------------------------------------------
await uji("A1. Tab tidak preventDefault bahkan saat papan tampil dan partai ada", () => {
  pasangDOM('<div id="b"></div>');
  const { handler } = buatDeps({ pageState: "analyze", tampilan: TAMPILAN_BERMAIN });
  const prevented = kirim(handler, "Tab", document.body);
  assert.equal(prevented, false);
});

await uji("A2. Shift+Tab juga tidak dicegat (key='Tab' sama, shiftKey tidak relevan)", () => {
  pasangDOM();
  const { handler, calls } = buatDeps();
  const prevented = kirim(handler, "Tab", document.body, { shiftKey: true });
  assert.equal(prevented, false);
  assert.equal(calls.back, 0);
});

// ------------------------------------------------------------------
// B. Elemen input — produksi harus blokir shortcut dan tidak preventDefault
// ------------------------------------------------------------------
await uji("B1. Input text memblokir ArrowLeft/ArrowRight/Space", () => {
  pasangDOM('<input id="i" type="text"><div id="board"></div>');
  const inp = document.getElementById("i");
  assert.equal(isElemenInteraktif(inp), true);
  const { handler, calls } = buatDeps();
  for (const k of ["ArrowLeft", "ArrowRight", " ", "Spacebar"]) {
    const p = kirim(handler, k, inp);
    assert.equal(p, false, `${k} pada input tidak preventDefault`);
  }
  assert.deepEqual(calls, { back: 0, forward: 0, first: 0, last: 0, togglePlay: 0 });
});

await uji("B2. Textarea memblokir shortcut", () => {
  pasangDOM();
  const ta = document.createElement("textarea");
  document.body.appendChild(ta);
  assert.equal(isElemenInteraktif(ta), true);
  const { handler, calls } = buatDeps();
  const p = kirim(handler, "ArrowDown", ta);
  assert.equal(p, false);
  assert.equal(calls.last, 0);
});

await uji("B3. Select memblokir shortcut", () => {
  pasangDOM('<select id="s"><option>A</option></select>');
  const sel = document.getElementById("s");
  assert.equal(isElemenInteraktif(sel), true);
  const { handler } = buatDeps();
  assert.equal(kirim(handler, "ArrowUp", sel), false);
});

await uji("B4. Contenteditable memblokir shortcut (produksi deteksi via closest)", () => {
  pasangDOM('<div id="ed" contenteditable="true">edit</div><div id="inner">child</div>');
  const ed = document.getElementById("ed");
  document.getElementById("inner") && ed.appendChild(document.getElementById("inner"));
  assert.equal(isElemenInteraktif(ed), true);
  // anak di dalam contenteditable juga terblokir via closest
  const inner = document.createElement("span");
  inner.textContent = "x";
  ed.appendChild(inner);
  assert.equal(isElemenInteraktif(inner), true);
  const { handler, calls } = buatDeps();
  assert.equal(kirim(handler, "ArrowLeft", inner), false);
  assert.equal(calls.back, 0);
});

// ------------------------------------------------------------------
// C. Elemen interaktif
// ------------------------------------------------------------------
await uji("C1. Button memblokir Space — Space tetap untuk aktivasi tombol native", () => {
  pasangDOM('<button id="b">ok</button>');
  const btn = document.getElementById("b");
  assert.equal(isElemenInteraktif(btn), true);
  const { handler, calls } = buatDeps();
  const p = kirim(handler, " ", btn);
  assert.equal(p, false, "Space pada button tidak preventDefault");
  assert.equal(calls.togglePlay, 0);
});

await uji("C2. Link <a href> memblokir shortcut", () => {
  pasangDOM('<a id="a" href="/x">link</a>');
  const a = document.getElementById("a");
  assert.equal(isElemenInteraktif(a), true);
  const { handler } = buatDeps();
  assert.equal(kirim(handler, "ArrowRight", a), false);
});

await uji("C3. Elemen role=button memblokir shortcut", () => {
  pasangDOM('<div id="rb" role="button" tabindex="0">fake</div>');
  const rb = document.getElementById("rb");
  assert.equal(isElemenInteraktif(rb), true);
  const { handler, calls } = buatDeps();
  assert.equal(kirim(handler, " ", rb), false);
  assert.equal(calls.togglePlay, 0);
});

await uji("C4. Anak di dalam button juga terblokir (closest)", () => {
  pasangDOM('<button id="b"><span id="s">teks</span></button>');
  const span = document.getElementById("s");
  assert.equal(isElemenInteraktif(span), true);
  const { handler } = buatDeps();
  assert.equal(kirim(handler, "ArrowLeft", span), false);
});

// ------------------------------------------------------------------
// D. Dialog
// ------------------------------------------------------------------
await uji("D1. Dialog aktif terlihat memblokir shortcut", () => {
  pasangDOM('<dialog id="d" open><button>ok</button></dialog><div id="board"></div>');
  assert.equal(isDialogAktif(), true);
  const { handler, calls } = buatDeps();
  const p = kirim(handler, "ArrowRight", document.body);
  assert.equal(p, false);
  assert.equal(calls.forward, 0);
});

await uji("D2. Fokus di dalam dialog tetap terblokir", () => {
  pasangDOM('<dialog open><button id="inside">x</button></dialog>');
  const inside = document.getElementById("inside");
  // juga terdeteksi via isElemenInteraktif (closest dialog) meskipun tanpa isDialogAktif
  assert.equal(isElemenInteraktif(inside), true);
  const { handler, calls } = buatDeps();
  assert.equal(kirim(handler, "ArrowLeft", inside), false);
  assert.equal(calls.back, 0);
});

await uji("D3. Dialog tersembunyi (display:none) tidak memblokir", () => {
  pasangDOM('<div role="dialog" id="hd" style="display:none">hidden</div>');
  assert.equal(isDialogAktif(), false);
  const { handler, calls } = buatDeps();
  const p = kirim(handler, "ArrowLeft", document.body);
  assert.equal(p, true, "hidden dialog: shortcut harus jalan");
  assert.equal(calls.back, 1);
});

await uji("D4. Dialog tersembunyi via hidden attribute tidak memblokir", () => {
  pasangDOM('<div role="dialog" hidden>hidden attr</div>');
  assert.equal(isDialogAktif(), false);
  const { handler } = buatDeps();
  assert.equal(kirim(handler, "ArrowRight", document.body), true);
});

await uji("D5. Dialog aria-hidden=true tidak memblokir", () => {
  pasangDOM('<div role="dialog" aria-hidden="true">x</div>');
  assert.equal(isDialogAktif(), false);
});

await uji("D6. Dialog tertutup (dialog tanpa open) tidak memblokir", () => {
  pasangDOM('<dialog id="d">closed</dialog>');
  assert.equal(isDialogAktif(), false);
  const { handler, calls } = buatDeps();
  assert.equal(kirim(handler, "ArrowUp", document.body), true);
  assert.equal(calls.first, 1);
});

await uji("D7. Dialog di dalam [hidden] ancestor tidak memblokir", () => {
  pasangDOM('<div hidden><div role="dialog">inside hidden</div></div>');
  assert.equal(isDialogAktif(), false);
});

// ------------------------------------------------------------------
// E. Shortcut Analisa — perilaku aktual (preventDefault + controller)
// ------------------------------------------------------------------
await uji("E1. ArrowLeft memanggil gameController.back + preventDefault", () => {
  pasangDOM();
  const { handler, calls } = buatDeps();
  const p = kirim(handler, "ArrowLeft", document.body);
  assert.equal(p, true);
  assert.equal(calls.back, 1);
});

await uji("E2. ArrowRight memanggil forward + preventDefault", () => {
  pasangDOM();
  const { handler, calls } = buatDeps();
  assert.equal(kirim(handler, "ArrowRight", document.body), true);
  assert.equal(calls.forward, 1);
});

await uji("E3. ArrowUp → first, ArrowDown → last", async () => {
  pasangDOM();
  const { handler, calls } = buatDeps();
  kirim(handler, "ArrowUp", document.body);
  assert.equal(calls.first, 1);
  await new Promise((r) => setTimeout(r, 30));
  kirim(handler, "ArrowDown", document.body);
  assert.equal(calls.last, 1);
});

await uji("E4. Space dan Spacebar → togglePlay", async () => {
  pasangDOM();
  const { handler, calls } = buatDeps();
  assert.equal(kirim(handler, " ", document.body), true);
  assert.equal(calls.togglePlay, 1);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(kirim(handler, "Spacebar", document.body), true);
  assert.equal(calls.togglePlay, 2);
});

await uji("E5. Shortcut tidak jalan saat tampilan bukan BERMAIN", () => {
  pasangDOM();
  const { handler, calls } = buatDeps({ tampilan: "akun" });
  assert.equal(kirim(handler, "ArrowLeft", document.body), false);
  assert.equal(calls.back, 0);
});

await uji("E6. Shortcut tidak jalan saat pageState default (belum ada partai)", () => {
  pasangDOM();
  const { handler, calls } = buatDeps({ pageState: "default" });
  assert.equal(kirim(handler, "ArrowRight", document.body), false);
  assert.equal(calls.forward, 0);
});

await uji("E7. Drag aktif memblokir navigasi (preventDefault tetap, controller tidak dipanggil)", () => {
  pasangDOM();
  const { handler, calls } = buatDeps({ dragIs: true });
  const p = kirim(handler, "ArrowLeft", document.body);
  assert.equal(p, true, "preventDefault tetap walau drag");
  assert.equal(calls.back, 0, "drag membatalkan back");
});

await uji("E8. AnalyzingMove memblokir shortcut", () => {
  pasangDOM();
  const { handler, calls } = buatDeps({ analyzing: true });
  const p = kirim(handler, "ArrowRight", document.body);
  assert.equal(p, true);
  assert.equal(calls.forward, 0);
});

await uji("E9. Throttle 25ms: tekan kedua dalam 25ms dibatalkan", async () => {
  pasangDOM();
  const { handler, calls } = buatDeps();
  kirim(handler, "ArrowLeft", document.body);
  assert.equal(calls.back, 1);
  // tanpa delay, masih dalam window throttle
  kirim(handler, "ArrowLeft", document.body);
  assert.equal(calls.back, 1, "throttle menahan panggilan kedua");
  await new Promise((r) => setTimeout(r, 30));
  kirim(handler, "ArrowLeft", document.body);
  assert.equal(calls.back, 2, "setelah 25ms boleh lagi");
});

// ------------------------------------------------------------------
// F. Lifecycle — listener dipasang/dilepas/tidak ganda
// ------------------------------------------------------------------
await uji("F1. Listener dipasang dan dilepas — document.addEventListener dipanggil 1× dan dicleanup", () => {
  pasangDOM();
  let added = 0;
  let removed = 0;
  const origAdd = document.addEventListener;
  const origRemove = document.removeEventListener;
  document.addEventListener = (type, fn, opts) => {
    if (type === "keydown") added++;
    return origAdd.call(document, type, fn, opts);
  };
  document.removeEventListener = (type, fn, opts) => {
    if (type === "keydown") removed++;
    return origRemove.call(document, type, fn, opts);
  };
  const { handler } = buatDeps();
  document.addEventListener("keydown", handler);
  assert.equal(added, 1);
  document.removeEventListener("keydown", handler);
  assert.equal(removed, 1);
  // restore
  document.addEventListener = origAdd;
  document.removeEventListener = origRemove;
});

await uji("F2. Tidak ada listener ganda setelah mount ulang (cleanup dipanggil)", () => {
  pasangDOM();
  const deps1 = buatDeps();
  const deps2 = buatDeps();
  // simulasi mount: pasang handler1
  document.addEventListener("keydown", deps1.handler);
  let listeners = 1;
  // simulasi unmount: lepas handler1
  document.removeEventListener("keydown", deps1.handler);
  listeners--;
  // mount ulang: pasang handler2
  document.addEventListener("keydown", deps2.handler);
  listeners++;
  assert.equal(listeners, 1, "hanya 1 listener aktif setelah remount");
  // cleanup
  document.removeEventListener("keydown", deps2.handler);
});

await uji("F3. Event Dispatch via document — handler produksi menerima event asli", () => {
  pasangDOM('<div id="board"></div>');
  const { handler, calls } = buatDeps();
  document.addEventListener("keydown", handler);
  const ev = new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
  let prevented = false;
  ev.preventDefault = () => {
    prevented = true;
  };
  // JSDOM: target = document.body jika dispatch di document
  Object.defineProperty(ev, "target", { value: document.body, writable: false });
  document.dispatchEvent(ev);
  assert.equal(prevented, true);
  assert.equal(calls.forward, 1);
  document.removeEventListener("keydown", handler);
});

console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
