#!/usr/bin/env node
/**
 * Kontrak arsitektur tooltip: satu mesin Radix, tanpa tooltip global berbasis
 * DOM atau atribut title native pada komponen Teka-Teki yang telah dimigrasi.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baca = (nama) => readFileSync(path.join(ROOT, nama), "utf8");

const komponenTekaTeki = [
  "src/halaman/TekaTeki/PapanTekaTeki.jsx",
  "src/halaman/TekaTeki/komponen/KontrolLangkah.jsx",
  "src/halaman/TekaTeki/komponen/SidebarTekaTeki.jsx",
  "src/halaman/TekaTeki/komponen/PanelUtama.jsx",
  "src/halaman/TekaTeki/komponen/PanelVideo.jsx",
  "src/halaman/TekaTeki/komponen/PromotionDialog.jsx",
];

const pusat = baca("src/components/ui/tooltip.jsx");
assert.match(pusat, /@radix-ui\/react-tooltip/, "Tooltip bersama harus memakai Radix UI");
assert.match(pusat, /TooltipPrimitive\.Arrow/, "Tooltip bersama harus selalu menyediakan panah");
assert.match(pusat, /function TooltipLabel/, "TooltipLabel harus menjadi API ringkas bersama");

for (const nama of komponenTekaTeki) {
  const isi = baca(nama);
  assert.match(isi, /components\/ui\/tooltip\.jsx/, `${nama}: belum memakai komponen tooltip bersama`);
  assert.doesNotMatch(isi, /\btitle\s*=/, `${nama}: masih membuat tooltip native melalui atribut title`);
}

for (const nama of [
  "src/halaman/Analisa/komponen/menu/analysis/summary/gameRating.jsx",
  "src/halaman/Analisa/komponen/menu/analysis/summary/playersAccuracy.jsx",
]) {
  assert.doesNotMatch(baca(nama), /\btitle\s*=/, `${nama}: title native menduplikasi TooltipLabel`);
}

assert.equal(
  existsSync(path.join(ROOT, "src/components/GlobalTitleTooltip.jsx")),
  false,
  "Implementasi tooltip global lama harus dihapus",
);
assert.equal(
  existsSync(path.join(ROOT, "scripts/uji-global-title-tooltip.mjs")),
  false,
  "Uji untuk implementasi tooltip lama harus dihapus",
);

const pkg = JSON.parse(baca("package.json"));
assert.equal(pkg.scripts["uji:global-title-tooltip"], undefined, "Perintah uji lama masih terdaftar");
assert.equal(
  pkg.scripts["uji:tooltip-satu-pintu"],
  "node scripts/uji-tooltip-satu-pintu.mjs",
  "Perintah uji arsitektur tooltip belum terdaftar",
);
assert.match(pkg.scripts["uji:tools"], /uji:tooltip-satu-pintu/, "Gerbang uji tools belum menjalankan kontrak tooltip");

const ujiBrowser = baca("tests/e2e/analisa-tooltip.spec.js");
assert.match(ujiBrowser, /data-slot="tooltip-arrow"/, "Uji browser harus memverifikasi elemen panah Radix");

console.log("OK — satu mesin tooltip Radix, pemanggil Teka-Teki terhubung, atribut title duplikat dihapus, dan panah diuji.");
