#!/usr/bin/env node
/**
 * Kontrak arsitektur tooltip: satu API Radix untuk komponen bersama, Analisa,
 * dan Teka-Teki; tanpa mesin global DOM atau title native pada area migrasi.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baca = (nama) => readFileSync(path.join(ROOT, nama), "utf8");

const komponenBersama = [
  "src/components/PanelEngine.jsx",
  "src/components/Hero.jsx",
  "src/components/Footer.jsx",
  "src/components/Header.jsx",
  "src/components/RecruitmentCareer.jsx",
  "src/components/KartuKomentator.jsx",
  "src/components/VerifikasiAkun.jsx",
  "src/components/ui/sidebar.jsx",
];

for (const nama of komponenBersama) {
  const isi = baca(nama);
  const polaNative = nama === "src/components/RecruitmentCareer.jsx"
    ? /<img[^>]*\btitle\s*=/
    : /\btitle\s*=/;
  assert.doesNotMatch(isi, polaNative, `${nama}: masih memakai title native sebagai jalur tooltip`);
}

for (const nama of [
  "src/components/PanelEngine.jsx",
  "src/components/KartuKomentator.jsx",
  "src/components/VerifikasiAkun.jsx",
  "src/components/ui/sidebar.jsx",
]) {
  assert.match(baca(nama), /TooltipLabel/, `${nama}: tooltip interaktif belum memakai pintu bersama`);
}

const komponenAnalisa = [
  "src/halaman/Analisa/komponen/svg/play.jsx",
  "src/halaman/Analisa/komponen/svg/pause.jsx",
  "src/halaman/Analisa/komponen/svg/nextMove.jsx",
  "src/halaman/Analisa/komponen/svg/skipGame.jsx",
  "src/halaman/Analisa/komponen/svg/rating.jsx",
  "src/halaman/Analisa/komponen/svg/result.jsx",
  "src/halaman/Analisa/komponen/svg/simplePiece.jsx",
  "src/halaman/Analisa/komponen/svg/piece.jsx",
  "src/halaman/Analisa/komponen/Gambar.jsx",
  "src/halaman/Analisa/akun/KartuAkun.jsx",
  "src/halaman/PapanInteraktif/DaftarRiwayat.jsx",
];

for (const nama of komponenAnalisa) {
  const isi = baca(nama);
  assert.match(isi, /components\/ui\/tooltip\.jsx/, `${nama}: belum memakai tooltip Radix bersama`);
  assert.doesNotMatch(isi, /\btitle\s*=/, `${nama}: masih membuat tooltip native melalui atribut title`);
}

const komponenPengurus = [
  "src/halaman/Pengurus/Sidebar.jsx",
  "src/halaman/Pengurus/PanelEbook/Kode.jsx",
  "src/halaman/Pengurus/RingkasanDashboard.jsx",
  "src/halaman/Pengurus/PanelEbook/Unduhan.jsx",
  "src/halaman/Pengurus/PanelEbook/Permintaan.jsx",
  "src/halaman/Pengurus/Dashboard.jsx",
  "src/halaman/Pengurus/Larangan.jsx",
  "src/halaman/Pengurus/RiwayatMasuk.jsx",
  "src/halaman/Pengurus/Anggota.jsx",
  "src/halaman/Pengurus/PanelTurnamen/Rincian.jsx",
];

assert.doesNotMatch(
  baca("src/halaman/Pengurus/ui.jsx"),
  /TooltipLabel/,
  "Facade TooltipLabel lokal Pengurus masih menjadi pintu kedua",
);

for (const nama of komponenPengurus) {
  const isi = baca(nama);
  assert.ok(
    isi.includes('import { TooltipLabel } from "@/components/ui/tooltip.jsx";'),
    `${nama}: belum mengimpor TooltipLabel pusat secara langsung`,
  );
  const pemicu = isi.match(/<TooltipLabel[^>]*>/g) || [];
  assert.ok(
    pemicu.length > 0 && pemicu.every((tag) => tag.includes('side="right"')),
    `${nama}: default posisi tooltip Pengurus belum dipertahankan`,
  );
}

const komponenTekaTeki = [
  "src/halaman/TekaTeki/PapanTekaTeki.jsx",
  "src/halaman/TekaTeki/komponen/KontrolLangkah.jsx",
  "src/halaman/TekaTeki/komponen/SidebarTekaTeki.jsx",
  "src/halaman/TekaTeki/komponen/PanelUtama.jsx",
  "src/halaman/TekaTeki/komponen/PanelVideo.jsx",
  "src/halaman/TekaTeki/komponen/PromotionDialog.jsx",
];

const pusat = baca("src/components/ui/tooltip.jsx");
assert.doesNotMatch(baca("src/MainApp.jsx"), /GlobalTitleTooltip/, "Root aplikasi masih memasang mesin tooltip global");
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

console.log("OK — tooltip Radix dipakai komponen bersama, Analisa, dan Teka-Teki; mesin global dihapus dan panah diuji.");
