/**
 * Uji regresi GlobalTitleTooltip: pergantian target, fokus keyboard,
 * relasi aria-describedby, callback RAF basi, target yang dilepas, dan cleanup.
 * Jalankan: node scripts/uji-global-title-tooltip.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));
const { build } = require("esbuild");
const { JSDOM } = require("jsdom");
const Modul = require("node:module");
process.env.NODE_PATH = [process.env.NODE_PATH, path.join(ROOT, "node_modules")].filter(Boolean).join(path.delimiter);
Modul._initPaths();

const TMP = mkdtempSync(path.join(tmpdir(), "uji-global-title-tooltip-"));
const BUNDLE = path.join(TMP, "global-title-tooltip.cjs");
const DOM = new JSDOM("<!doctype html><html><body><main id=\"app\"></main></body></html>", {
  pretendToBeVisual: true,
  url: "https://uji.test/",
});

const rafTertunda = new Map();
let nomorFrame = 0;
globalThis.window = DOM.window;
globalThis.document = DOM.window.document;
globalThis.MutationObserver = DOM.window.MutationObserver;
globalThis.HTMLElement = DOM.window.HTMLElement;
globalThis.Element = DOM.window.Element;
globalThis.Node = DOM.window.Node;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: DOM.window.navigator,
});
globalThis.requestAnimationFrame = (callback) => {
  const id = ++nomorFrame;
  rafTertunda.set(id, callback);
  return id;
};
globalThis.cancelAnimationFrame = (id) => rafTertunda.delete(id);
DOM.window.requestAnimationFrame = globalThis.requestAnimationFrame;
DOM.window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
DOM.window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });

Object.defineProperty(DOM.window.HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get() {
    return this.getAttribute("role") === "tooltip" ? 120 : 0;
  },
});
Object.defineProperty(DOM.window.HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  get() {
    return this.getAttribute("role") === "tooltip" ? 36 : 0;
  },
});

function kirimPointer(jenis, target, relatedTarget) {
  const peristiwa = new DOM.window.Event(jenis, { bubbles: true });
  Object.defineProperty(peristiwa, "relatedTarget", { value: relatedTarget });
  target.dispatchEvent(peristiwa);
}

function jalankanFrame() {
  const callbacks = [...rafTertunda.values()];
  rafTertunda.clear();
  callbacks.forEach((callback) => callback(0));
}

function tombol(teks, deskripsi) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = teks;
  el.setAttribute("title", teks);
  if (deskripsi) el.setAttribute("aria-describedby", deskripsi);
  el.getBoundingClientRect = () => ({
    left: 100,
    top: 100,
    right: 160,
    bottom: 130,
    width: 60,
    height: 30,
  });
  document.querySelector("main").appendChild(el);
  return el;
}

function tunggu(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let gagal = 0;
function pastikan(kondisi, pesan) {
  try {
    assert.ok(kondisi, pesan);
  } catch (error) {
    gagal += 1;
    console.error(`  GAGAL: ${pesan}`);
    console.error(`         ${error.message}`);
  }
}

try {
  await build({
    stdin: {
      contents: `
        import React from "react";
        import { createRoot } from "react-dom/client";
        import { act } from "react";
        import GlobalTitleTooltip from "./src/components/GlobalTitleTooltip.jsx";
        export { React, act, createRoot, GlobalTitleTooltip };
      `,
      resolveDir: ROOT,
      sourcefile: "uji-global-title-tooltip.jsx",
      loader: "jsx",
    },
    bundle: true,
    format: "cjs",
    platform: "node",
    outfile: BUNDLE,
    jsx: "automatic",
    external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
    alias: { "@": path.join(ROOT, "src") },
    logLevel: "silent",
  });

  const { React, act, createRoot, GlobalTitleTooltip } = require(BUNDLE);
  const akar = createRoot(document.getElementById("app"));
  await act(async () => {
    akar.render(React.createElement(GlobalTitleTooltip));
  });

  const a = tombol("Keterangan A", "deskripsi-a");
  const b = tombol("Keterangan B", "deskripsi-b");

  kirimPointer("pointerover", a, document.body);
  jalankanFrame();
  const tooltip = document.querySelector('[role="tooltip"]');
  const idTooltip = tooltip?.id;

  pastikan(Boolean(tooltip), "elemen tooltip dibuat saat pointer masuk");
  pastikan(tooltip?.textContent === "Keterangan A", "teks tooltip mengikuti target A");
  pastikan(tooltip?.style.visibility === "visible" && tooltip?.style.opacity === "1", "tooltip tampil setelah posisi dihitung");
  pastikan(!a.hasAttribute("title") && a.getAttribute("data-title-saved") === "Keterangan A", "title A disimpan sementara");
  pastikan(a.getAttribute("aria-describedby") === `deskripsi-a ${idTooltip}`, "aria-describedby lama dipertahankan dan tooltip ditautkan");

  kirimPointer("pointerout", a, b);
  kirimPointer("pointerover", b, a);
  jalankanFrame();
  pastikan(a.getAttribute("title") === "Keterangan A" && !a.hasAttribute("data-title-saved"), "title A dipulihkan ketika target berganti");
  pastikan(a.getAttribute("aria-describedby") === "deskripsi-a", "aria-describedby A dipulihkan ketika target berganti");
  pastikan(tooltip?.textContent === "Keterangan B", "tooltip berpindah ke target B");
  pastikan(b.getAttribute("aria-describedby") === `deskripsi-b ${idTooltip}`, "deskripsi yang sudah ada pada B tidak hilang");

  kirimPointer("pointerout", b, document.body);
  pastikan(b.getAttribute("title") === "Keterangan B" && !b.hasAttribute("data-title-saved"), "title B dipulihkan saat pointer keluar");
  pastikan(b.getAttribute("aria-describedby") === "deskripsi-b", "aria-describedby B dipulihkan saat pointer keluar");
  pastikan(tooltip?.style.opacity === "0", "tooltip mulai disembunyikan saat pointer keluar");
  await tunggu(130);
  pastikan(tooltip?.style.visibility === "hidden", "tooltip disembunyikan setelah transisi");

  b.focus();
  jalankanFrame();
  pastikan(tooltip?.textContent === "Keterangan B" && tooltip?.style.visibility === "visible", "tooltip tampil saat target menerima fokus keyboard");
  pastikan(b.getAttribute("aria-describedby")?.includes(idTooltip), "relasi ARIA tersedia saat fokus");
  b.blur();
  pastikan(b.getAttribute("title") === "Keterangan B" && b.getAttribute("aria-describedby") === "deskripsi-b", "title dan deskripsi dipulihkan setelah fokus keluar");

  kirimPointer("pointerover", a, document.body);
  kirimPointer("pointerout", a, document.body);
  jalankanFrame();
  pastikan(tooltip?.style.opacity === "0", "callback RAF yang dibatalkan tidak menampilkan tooltip basi");
  pastikan(a.getAttribute("title") === "Keterangan A", "target tetap dipulihkan setelah RAF dibatalkan");

  const c = tombol("Keterangan C");
  kirimPointer("pointerover", c, document.body);
  jalankanFrame();
  c.remove();
  await tunggu(0);
  pastikan(c.getAttribute("title") === "Keterangan C", "target yang dilepas dari DOM memulihkan title");
  pastikan(!c.hasAttribute("aria-describedby"), "target yang dilepas membersihkan relasi ARIA");

  const d = tombol("Keterangan D", "deskripsi-d");
  kirimPointer("pointerover", d, document.body);
  pastikan(rafTertunda.size > 0, "ada RAF tertunda sebelum cleanup");
  await act(async () => {
    akar.unmount();
  });
  pastikan(d.getAttribute("title") === "Keterangan D", "cleanup React memulihkan title target aktif");
  pastikan(d.getAttribute("aria-describedby") === "deskripsi-d", "cleanup React memulihkan aria-describedby");
  pastikan(!document.querySelector('[role="tooltip"]'), "cleanup React menghapus elemen tooltip");
  pastikan(rafTertunda.size === 0, "cleanup membatalkan seluruh requestAnimationFrame tertunda");

  const css = readFileSync(path.join(ROOT, "src/gaya/tooltip.css"), "utf8");
  pastikan(css.includes("--tooltip-bg: #2E333A;"), "warna tooltip sesuai spesifikasi PR #287");

  if (gagal) {
    console.error(`\n${gagal} pemeriksaan GlobalTitleTooltip gagal.`);
    process.exitCode = 1;
  } else {
    console.log("OK — GlobalTitleTooltip: pointer, fokus, pergantian target, ARIA, RAF, target terlepas, cleanup, dan warna.");
  }
} catch (error) {
  console.error("GAGAL: uji GlobalTitleTooltip tidak dapat dijalankan.");
  console.error(error);
  process.exitCode = 1;
} finally {
  DOM.window.close();
  try {
    rmSync(TMP, { recursive: true, force: true });
  } catch {
    // Berkas sementara yang terkunci tidak mengubah hasil uji.
  }
}
