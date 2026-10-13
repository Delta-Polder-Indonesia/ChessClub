/**
 * Salin runtime onnxruntime-web dari node_modules ke public/engines/ort/.
 *
 * Mengapa tidak langsung mengimpor dari node_modules: worker Maia adalah
 * skrip klasik di `public/` yang memakai `importScripts`, sehingga runtime
 * ONNX harus tersedia sebagai berkas statis di origin sendiri (CSP
 * `script-src 'self'`). Dengan disalin ke `public/`, ia juga ikut aturan
 * cache `/engines/(.*)` di vercel.json dan tidak pernah masuk ke bundle
 * JavaScript aplikasi.
 *
 * Berkas hasil salinan TIDAK di-commit (lihat .gitignore) — ia dibuat ulang
 * oleh `predev`/`prebuild` dari `node_modules`, jadi tidak mungkin ketinggalan
 * versi paketnya.
 *
 * Dipakai: `predev`, `prebuild`, atau langsung `npm run salin:ort`.
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TUJUAN = path.join(AKAR, "public", "engines", "ort");

/**
 * Berkas yang dibutuhkan worker:
 *  - ort.wasm.min.js      — perekat UMD, dimuat lewat importScripts
 *  - ort-wasm-simd.wasm   — binari wasm satu utas dengan SIMD (utama)
 *  - ort-wasm.wasm        — cadangan untuk peramban tanpa WebAssembly SIMD
 *
 * Mengapa versi onnxruntime-web DIKUNCI di 1.18.0 (lihat package.json, tanpa
 * tanda ^): sejak 1.19 paket ini hanya mengirim build "threaded", dan build
 * itu membuat `new WebAssembly.Memory({ shared: true })` tanpa syarat —
 * bahkan untuk satu utas. Memori bersama menuntut `crossOriginIsolated`, yang
 * hanya ada bila server mengirim COOP **dan** COEP. Repo ini sengaja tidak
 * mengirim COEP (vercel.json): mengaktifkannya akan memblokir gambar dan
 * berkas pihak ketiga yang tidak mengirim header CORP. Jadi 1.18.0 adalah
 * versi terakhir yang benar-benar bisa berjalan satu utas tanpa COEP —
 * di situlah `env.wasm.numThreads = 1` memilih `ort-wasm-simd.wasm`.
 *
 * Kalau kelak COEP diaktifkan, versi bisa dinaikkan dan berkasnya diganti ke
 * varian `-simd-threaded` (lihat `uji-maia.mjs`, uji akan mengingatkan).
 */
const BERKAS = ["ort.wasm.min.js", "ort-wasm-simd.wasm", "ort-wasm.wasm"];

function cariBerkas() {
  const require = createRequire(import.meta.url);
  // `onnxruntime-web/package.json` tidak ikut diekspor (peta "exports" hanya
  // membuka entri runtime), jadi resolved lewat entri utamanya lalu diambil
  // folder `dist/`-nya.
  try {
    const entri = require.resolve("onnxruntime-web");
    let folder = path.dirname(entri);
    if ("dist" === path.basename(folder)) folder = path.dirname(folder);
    return folder;
  } catch {
    return null;
  }
}

const pangkal = cariBerkas();
if (!pangkal) {
  console.error("  ✗ onnxruntime-web belum terpasang. Jalankan `npm install` dulu.");
  process.exit(1);
}

const sumber = path.join(pangkal, "dist");
const hilang = BERKAS.filter((nama) => !existsSync(path.join(sumber, nama)));
if (hilang.length) {
  console.error(`  ✗ berkas runtime tidak ditemukan di ${sumber}: ${hilang.join(", ")}`);
  process.exit(1);
}

mkdirSync(TUJUAN, { recursive: true });
let total = 0;
for (const nama of BERKAS) {
  const dari = path.join(sumber, nama);
  const ke = path.join(TUJUAN, nama);
  const ukuran = statSync(dari).size;
  const sudahAda = existsSync(ke) && statSync(ke).size === ukuran;
  if (!sudahAda) copyFileSync(dari, ke);
  total += ukuran;
}
console.log(
  `  ✓ runtime onnxruntime-web siap di public/engines/ort (${BERKAS.length} berkas, ${(total / 1024 / 1024).toFixed(1)} MB)`
);
