#!/usr/bin/env node
/**
 * Audit fail-closed untuk seluruh alat uji repo.
 *
 * Mengapa ada: uji yang keluar 0 ketika prasyaratnya hilang membuat CI hijau
 * tanpa menjalankan kontrak yang dijanjikan. Penjaga ini memeriksa struktur
 * semua berkas uji yang didaftarkan di package.json dan menolak pola fail-open
 * yang pernah ada: dependency wajib hilang tetapi exit 0, catch kosong, berkas
 * uji yatim, atau rantai utama yang tidak menjalankan audit ini lebih dulu.
 *
 * Jalankan: node scripts/uji-integritas-suite.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const paket = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
let lulus = 0;
let gagal = 0;

function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
  }
}

const perintahUji = Object.entries(paket.scripts).filter(([nama]) => nama.startsWith("uji"));
const berkasTerdaftar = new Set();
for (const [, perintah] of perintahUji) {
  for (const cocok of perintah.matchAll(/(?:node\s+)?((?:scripts|server\/uji)\/uji-[\w-]+\.mjs)/g)) {
    berkasTerdaftar.add(cocok[1]);
  }
}

uji("ada perintah uji yang diaudit", perintahUji.length >= 50, `${perintahUji.length} perintah`);
uji("ada berkas uji yang diaudit", berkasTerdaftar.size >= 60, `${berkasTerdaftar.size} berkas`);

const hilang = [...berkasTerdaftar].filter((berkas) => !existsSync(path.join(ROOT, berkas)));
uji("semua berkas uji terdaftar ada di disk", hilang.length === 0, hilang.join(", "));

const tanpaJalurGagal = [];
const catchKosong = [];
const lolosTanpaDependency = [];
for (const berkas of berkasTerdaftar) {
  const sumber = readFileSync(path.join(ROOT, berkas), "utf8");
  if (!/(?:process\.exit(?:Code)?\s*=|process\.exit\(|throw\s+new|assert(?:\.|\()|gagal\s*\+\+|gagal\s*\+=)/.test(sumber)) {
    tanpaJalurGagal.push(berkas);
  }
  if (/catch\s*(?:\([^)]*\))?\s*\{\s*\}/s.test(sumber)) catchKosong.push(berkas);

  // Tangkap blok pemeriksaan prasyarat yang mengaku melewati uji dan sukses.
  const blokPrasyarat = /if\s*\([^)]*(?:ada\(|existsSync|resolve)[\s\S]{0,300}?process\.exit\(0\)/g;
  if (blokPrasyarat.test(sumber)) lolosTanpaDependency.push(berkas);
}

uji(
  "setiap berkas uji memiliki jalur kegagalan",
  tanpaJalurGagal.length === 0,
  tanpaJalurGagal.join(", ")
);
uji("tidak ada catch kosong yang menelan galat", catchKosong.length === 0, catchKosong.join(", "));
uji(
  "dependency uji yang hilang tidak boleh menghasilkan exit 0",
  lolosTanpaDependency.length === 0,
  lolosTanpaDependency.join(", ")
);

/*
 * Vercel mengunggah repo menurut `.vercelignore`, sedangkan checkout lokal dan
 * CI selalu lengkap. Perintah yang dijalankan npm saat build karena itu wajib
 * menunjuk berkas yang IKUT diunggah: kalau tidak, build lokal dan CI tetap
 * hijau sementara deployment Vercel gagal dengan "Cannot find module" — kelas
 * kegagalan yang tidak bisa dilihat dari mesin pengembang. Ini pernah terjadi
 * pada `scripts/salin-ort.mjs` yang dipanggil `prebuild`.
 */
const jalurVercel = path.join(ROOT, ".vercelignore");
const polaAbaikan = (existsSync(jalurVercel) ? readFileSync(jalurVercel, "utf8") : "")
  .split("\n")
  .map((baris) => baris.trim())
  .filter((baris) => baris && !baris.startsWith("#") && !baris.startsWith("!"));

const berkasBuild = new Set();
for (const nama of ["prebuild", "predev"]) {
  for (const cocok of (paket.scripts[nama] ?? "").matchAll(/\b((?:scripts|tests|server|api)\/[\w./-]+|playwright\.config\.js)/g)) {
    berkasBuild.add(cocok[1]);
  }
}
const tercoret = [...berkasBuild].filter((berkas) =>
  polaAbaikan.some((pola) => (pola.endsWith("/") ? berkas.startsWith(pola) : berkas === pola || berkas.startsWith(`${pola}/`)))
);
uji(
  "berkas yang dipanggil perintah build ikut diunggah ke Vercel",
  berkasBuild.size > 0 && tercoret.length === 0,
  tercoret.length ? `dikecualikan .vercelignore: ${tercoret.join(", ")}` : `${berkasBuild.size} berkas diperiksa`
);

const rantaiUtama = paket.scripts.uji ?? "";
uji(
  "audit integritas berjalan paling awal dalam npm run uji",
  rantaiUtama.startsWith("npm run uji:integritas-suite &&"),
  rantaiUtama.slice(0, 80)
);
uji(
  "gerbang rilis menjalankan rantai uji utama",
  /npm run uji(?:\s|&&)/.test(paket.scripts["uji:rilis:v1"] ?? "")
);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
