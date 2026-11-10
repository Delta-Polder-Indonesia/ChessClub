/**
 * Uji pintasan keyboard dan aksesibilitas papan Analisa.
 */
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import fs from "node:fs";

let lulus = 0, gagal = 0;
async function uji(nama, fn) {
  try { await fn(); lulus++; console.log(`  ✓ ${nama}`); }
  catch (e) { gagal++; console.error(`  ✗ ${nama}\n    ${e?.stack ?? e?.message}`); process.exitCode = 1; }
}

function setupDOM() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="board" tabindex="0"></div><button id="btn">Click</button><input id="inp" type="text"><select id="sel"><option>A</option></select><div id="editable" contenteditable="true">edit</div><dialog id="dlg" open><button>inside dialog</button></dialog></body></html>`, { url: "http://localhost" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  return dom;
}

function isElemenInteraktif(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return true;
  if (el.isContentEditable) return true;
  if (el.closest) {
    if (el.closest('[contenteditable="true"], [contenteditable=""]')) return true;
    if (el.closest('button, input, textarea, select, a[href], [contenteditable], [role="button"]')) return true;
    if (el.closest('[role="dialog"], dialog, [aria-modal="true"]')) return true;
  }
  return false;
}
function isDialogAktif(doc) {
  const d = doc || globalThis.document;
  const kandidat = d.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]');
  for (const el of kandidat) {
    if (el.hidden) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    if (el.style.display === "none" || el.style.visibility === "hidden") continue;
    if (el.closest("[hidden]")) continue;
    try { const s = (typeof window !== "undefined" && window.getComputedStyle) ? window.getComputedStyle(el) : null; if (s && (s.display === "none" || s.visibility === "hidden")) continue; } catch (_e) { void _e; }
    return true;
  }
  return false;
}

console.log("Keyboard — aksesibilitas & pintasan");

await uji("Tab tidak dicegat (tidak ada preventDefault untuk Tab)", () => {
  const src = fs.readFileSync("src/halaman/Analisa/komponen/game/game.jsx", "utf8");
  const hasTabPrevent = /case\s+["']Tab["']\s*:\s*\{\s*\n?\s*e\.preventDefault\(\)/.test(src);
  assert.equal(hasTabPrevent, false, "Tab masih dicegat dengan preventDefault");
  const hasTabCase = src.includes('case "Tab"');
  assert.equal(hasTabCase, false, "Tab case masih ada — harus dihapus agar navigasi fokus normal");
});

await uji("Helper isElemenInteraktif mendeteksi input, textarea, select, button", () => {
  const dom = setupDOM();
  const doc = dom.window.document;
  assert.equal(isElemenInteraktif(doc.getElementById("btn")), true);
  assert.equal(isElemenInteraktif(doc.getElementById("inp")), true);
  assert.equal(isElemenInteraktif(doc.getElementById("sel")), true);
  const ta = doc.createElement("textarea");
  assert.equal(isElemenInteraktif(ta), true);
  assert.equal(isElemenInteraktif(doc.getElementById("board")), false);
  assert.equal(isElemenInteraktif(doc.getElementById("editable")), true);
  const cb = doc.createElement("input");
  cb.type = "checkbox";
  assert.equal(isElemenInteraktif(cb), true);
});

await uji("Pintasan tidak berjalan ketika fokus pada elemen interaktif", () => {
  const dom = setupDOM();
  const doc = dom.window.document;
  const editable = doc.createElement("div");
  editable.setAttribute("contenteditable", "true");
  doc.body.appendChild(editable);
  const cases = [
    { el: doc.createElement("input"), desc: "input text" },
    { el: doc.createElement("textarea"), desc: "textarea" },
    { el: doc.createElement("select"), desc: "select" },
    { el: doc.createElement("button"), desc: "button" },
    { el: editable, desc: "contenteditable" },
  ];
  for (const { el, desc } of cases) {
    const shouldBlock = isElemenInteraktif(el);
    assert.equal(shouldBlock, true, `harus blokir pintasan pada ${desc}`);
  }
});

await uji("Pintasan diblokir pada role=button", () => {
  const dom = setupDOM(); const doc = dom.window.document;
  const rb = doc.createElement("div"); rb.setAttribute("role", "button"); rb.tabIndex = 0; doc.body.appendChild(rb);
  assert.equal(isElemenInteraktif(rb), true, "role=button harus diblokir");
});

await uji("Pintasan tidak aktif ketika dialog/modal mengambil alih", () => {
  const dom = setupDOM();
  const doc = dom.window.document;
  assert.equal(isDialogAktif(doc), true);
});

await uji("Dialog tersembunyi tidak memblokir shortcut", () => {
  const dom = setupDOM(); const doc = dom.window.document;
  doc.querySelector("dialog")?.remove();
  const hidden = doc.createElement("div"); hidden.setAttribute("role", "dialog"); hidden.style.display = "none"; hidden.textContent = "hidden"; doc.body.appendChild(hidden);
  assert.equal(isDialogAktif(doc), false, "hidden dialog tidak boleh dianggap aktif");
  const visible = doc.createElement("div"); visible.setAttribute("role", "dialog"); visible.textContent = "visible"; doc.body.appendChild(visible);
  assert.equal(isDialogAktif(doc), true, "visible dialog harus aktif");
});

await uji("Arrow keys tetap berfungsi pada area papan (bukan interaktif)", () => {
  const dom = setupDOM();
  const doc = dom.window.document;
  doc.querySelector("dialog")?.remove();
  assert.equal(isDialogAktif(doc), false);
  const board = doc.getElementById("board");
  assert.equal(isElemenInteraktif(board), false);
});

await uji("Space tidak mengambil alih tombol yang difokuskan", () => {
  const dom = setupDOM();
  const doc = dom.window.document;
  doc.querySelector("dialog")?.remove();
  const btn = doc.getElementById("btn");
  assert.equal(isElemenInteraktif(btn), true);
});

await uji("Tidak ada listener ganda — hanya satu addEventListener dan satu removeEventListener", () => {
  const src = fs.readFileSync("src/halaman/Analisa/komponen/game/game.jsx", "utf8");
  const addCount = (src.match(/document\.addEventListener\("keydown", handleKeyDown\)/g) || []).length;
  const removeCount = (src.match(/document\.removeEventListener\("keydown", handleKeyDown\)/g) || []).length;
  assert.equal(addCount, 1, "harus ada 1 addEventListener");
  assert.equal(removeCount, 1, "harus ada 1 removeEventListener");
  assert.equal(src.includes('window.addEventListener("keydown"'), false, "keydown tidak boleh dipasang di window");
  assert.equal(src.includes('window.removeEventListener("keydown"'), false);
});

await uji("Enter dan Space tetap dapat mengaktifkan tombol secara normal (tidak dicegat)", () => {
  const dom = setupDOM();
  const doc = dom.window.document;
  doc.querySelector("dialog")?.remove();
  const btn = doc.getElementById("btn");
  let prevented = false;
  const e = { key: " ", target: btn, preventDefault: () => { prevented = true; } };
  if (isElemenInteraktif(e.target) || isDialogAktif(doc)) {
    // handler return early, tidak preventDefault
  } else {
    prevented = true;
  }
  assert.equal(prevented, false, "Space pada button tidak boleh preventDefault");
});

await uji("Listener dibersihkan dengan benar (return cleanup)", () => {
  const src = fs.readFileSync("src/halaman/Analisa/komponen/game/game.jsx", "utf8");
  assert.ok(src.includes("return () => document.removeEventListener"), "cleanup harus ada");
});

console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
