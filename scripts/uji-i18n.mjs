/**
 * Uji konsistensi terjemahan (tanpa jaringan).
 *
 * Memastikan tiga hal yang paling mudah lolos saat menyunting kamus:
 *  1. Kunci ID dan EN persis sama — kunci yang hilang akan tampil mentah
 *     ("nav.beranda") di situs.
 *  2. Semua kunci yang dipakai lewat t("…") di src/ ada di kamus.
 *  3. Tidak ada nilai terjemahan kosong.
 *
 * Jalankan: node scripts/uji-i18n.mjs  (keluar 1 bila ada ketidakcocokan)
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ID, EN } from "../src/lib/terjemahan.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const rata = (obj, awalan = "") => {
  const keluar = [];
  for (const [k, v] of Object.entries(obj)) {
    const kunci = awalan ? `${awalan}.${k}` : k;
    if (v && typeof v === "object") keluar.push(...rata(v, kunci));
    else keluar.push([kunci, v]);
  }
  return keluar;
};

const petaId = new Map(rata(ID));
const petaEn = new Map(rata(EN));

let gagal = 0;
const lapor = (pesan) => {
  gagal++;
  console.error(`  ✗ ${pesan}`);
};

/* 1 — paritas kunci ID ⇄ EN */
for (const k of petaId.keys()) {
  if (!petaEn.has(k)) lapor(`kunci "${k}" ada di ID tetapi hilang di EN`);
}
for (const k of petaEn.keys()) {
  if (!petaId.has(k)) lapor(`kunci "${k}" ada di EN tetapi hilang di ID`);
}

/* 2 — tidak ada nilai kosong */
for (const [k, v] of petaId) {
  if (typeof v !== "string" || !v.trim()) lapor(`nilai ID "${k}" kosong`);
}
for (const [k, v] of petaEn) {
  if (typeof v !== "string" || !v.trim()) lapor(`nilai EN "${k}" kosong`);
}

/* 3 — semua kunci t("…") yang dipakai di src/ ada di kamus */
const dipakai = new Set();
(function pindai(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      pindai(p);
      continue;
    }
    if (!/\.(jsx?|tsx?)$/.test(f.name)) continue;
    const isi = readFileSync(p, "utf8");
    // t("kunci.statik") dan t(`kunci.${dinamis}`) — yang kedua diambil
    // prefiksnya saja; keberadaan akhirnya diverifikasi lewat paritas.
    for (const m of isi.matchAll(/\bt\(\s*["'`]([a-zA-Z0-9_.]+?)["'`]/g)) {
      dipakai.add(m[1]);
    }
    for (const m of isi.matchAll(/\bt\(\s*`([a-zA-Z0-9_.]+)\.\$\{/g)) {
      dipakai.add(`${m[1]}.$`);
    }
  }
})(path.join(AKAR, "src"));

for (const k of dipakai) {
  if (k === "a.b.c") continue; // contoh di komentar i18n.jsx
  if (k.endsWith(".$")) {
    const prefiks = k.slice(0, -1);
    const adaTurunan = [...petaId.keys()].some((kk) => kk.startsWith(prefiks));
    if (!adaTurunan) lapor(`prefiks "${prefiks}…" dipakai tetapi tidak ada di kamus`);
    continue;
  }
  if (!petaId.has(k)) lapor(`kunci "${k}" dipakai di kode tetapi tidak ada di kamus`);
}

if (gagal) {
  console.error(`\n${gagal} masalah terjemahan ditemukan.`);
  process.exit(1);
}
console.log(
  `OK — ${petaId.size} kunci ID = ${petaEn.size} kunci EN; ${dipakai.size} kunci terpakai semuanya ada.`
);
