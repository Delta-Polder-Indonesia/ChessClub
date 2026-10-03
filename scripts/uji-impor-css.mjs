#!/usr/bin/env node
/**
 * Uji target `@import` di seluruh berkas CSS dalam `src/`.
 *
 * Mengapa ada: commit 1f5f10a menghapus paket `shadcn` karena pencarian
 * referensi hanya menyasar JavaScript, padahal `src/index.css` masih memuat
 * `@import "shadcn/tailwind.css"`. Build Vercel lalu gagal karena target itu
 * tidak dapat di-resolve. PR #169 (commit 08723e1) memperbaikinya dengan
 * menyalin CSS yang dibutuhkan ke repo; uji ini menjaga kelas bug yang sama
 * agar tidak lolos lagi.
 *
 * Jalankan: node scripts/uji-impor-css.mjs  |  npm run uji:impor-css
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
/** Lantai safety: tanpa ini, pemindai yang rusak dapat lulus hampa. */
const MINIMAL_IMPOR = 1;
const paketJson = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const paketTerdaftar = new Set([
  ...Object.keys(paketJson.dependencies ?? {}),
  ...Object.keys(paketJson.devDependencies ?? {}),
]);

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

function berkasCss(dir = SRC, hasil = []) {
  for (const entri of readdirSync(dir, { withFileTypes: true })) {
    if (entri.isDirectory() && ["node_modules", "dist", "public"].includes(entri.name)) continue;
    const penuh = path.join(dir, entri.name);
    if (entri.isDirectory()) berkasCss(penuh, hasil);
    else if (entri.isFile() && entri.name.endsWith(".css")) hasil.push(penuh);
  }
  return hasil;
}

/** Buang isi komentar tetapi pertahankan baris dan posisi karakter. */
function tanpaKomentarBlok(sumber) {
  return sumber.replace(/\/\*[\s\S]*?\*\//g, (komentar) => komentar.replace(/[^\n]/g, " "));
}

function temukanImpor(berkas) {
  const sumber = tanpaKomentarBlok(readFileSync(berkas, "utf8"));
  const pola = /@import\s+(?:url\(\s*)?(?:(["'])(.*?)\1|([^\s;)]+))\s*\)?/gim;
  return [...sumber.matchAll(pola)].map((cocok) => ({
    target: cocok[2] ?? cocok[3],
    baris: sumber.slice(0, cocok.index).split("\n").length,
    berkas,
  }));
}

function namaPaket(target) {
  const bagian = target.split("/");
  return target.startsWith("@") ? bagian.slice(0, 2).join("/") : bagian[0];
}

function berkasAda(jalur) {
  try {
    return statSync(jalur).isFile();
  } catch {
    return false;
  }
}

function bisaResolve(target, paket, berkasPengimpor) {
  const induk = pathToFileURL(berkasPengimpor).href;
  try {
    const hasil = import.meta.resolve(target, induk);
    if (hasil.startsWith("file:")) return berkasAda(fileURLToPath(hasil));
    return true;
  } catch {
    // createRequire menghormati `exports` paket, termasuk pemetaan subpath CSS.
  }
  try {
    const hasil = createRequire(berkasPengimpor).resolve(target);
    return berkasAda(hasil);
  } catch {
    // Fallback untuk paket CSS lama yang tidak mengekspos subpath-nya.
  }
  const subpath = target.startsWith("@")
    ? target.split("/").slice(2).join("/")
    : target.split("/").slice(1).join("/");
  const akarPaket = path.join(ROOT, "node_modules", paket);
  const manifest = path.join(akarPaket, "package.json");
  if (!existsSync(manifest)) return false;

  // Node tidak mengaktifkan kondisi `style`, sedangkan bundler CSS melakukannya.
  // Baca pemetaan ekspor persisnya sebelum memakai fallback jalur langsung.
  const data = JSON.parse(readFileSync(manifest, "utf8"));
  const kunci = subpath ? `./${subpath}` : ".";
  let tujuan = data.exports?.[kunci];
  while (tujuan && typeof tujuan === "object") {
    tujuan = tujuan.style ?? tujuan.default ?? tujuan.import ?? tujuan.require;
  }
  if (!subpath && !tujuan) tujuan = data.style ?? data.main;
  if (typeof tujuan === "string" && berkasAda(path.resolve(akarPaket, tujuan))) return true;
  return Boolean(subpath) && berkasAda(path.join(akarPaket, subpath));
}

const semuaImpor = berkasCss().flatMap(temukanImpor);
const perBerkas = new Map();
for (const impor of semuaImpor) {
  const relatif = path.relative(ROOT, impor.berkas).split(path.sep).join("/");
  perBerkas.set(relatif, (perBerkas.get(relatif) ?? 0) + 1);

  const lokasi = `${relatif}:${impor.baris}`;
  const nama = `${lokasi} mengimpor ${JSON.stringify(impor.target)}`;
  if (/^(?:https?:)?\/\//i.test(impor.target)) {
    console.log(`  – ${nama} DILEWATI: URL absolut`);
  } else if (impor.target.startsWith(".") || impor.target.startsWith("/")) {
    const targetPenuh = path.resolve(path.dirname(impor.berkas), impor.target);
    uji(nama, berkasAda(targetPenuh), `berkas relatif tidak ditemukan: ${impor.target}`);
  } else {
    const paket = namaPaket(impor.target);
    const terdaftar = paketTerdaftar.has(paket);
    const terselesaikan = terdaftar && bisaResolve(impor.target, paket, impor.berkas);
    const alasan = !terdaftar
      ? `paket ${JSON.stringify(paket)} tidak terdaftar di dependencies atau devDependencies`
      : `target paket tidak dapat di-resolve dari disk: ${impor.target}`;
    uji(nama, terdaftar && terselesaikan, alasan);
  }
}

uji(
  `pemindai menemukan minimal ${MINIMAL_IMPOR} @import (${semuaImpor.length} terdeteksi)`,
  semuaImpor.length >= MINIMAL_IMPOR,
  "tidak ada @import yang ditemukan di src/**/*.css"
);

console.log("\n@import terdeteksi per berkas:");
for (const [berkas, jumlah] of [...perBerkas].sort()) console.log(`  ${berkas}: ${jumlah}`);
console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
