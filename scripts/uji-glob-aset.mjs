#!/usr/bin/env node
/**
 * Uji pemuatan aset bidak lewat makro `import.meta.glob` Vite.
 *
 * Mengapa ada: renderer bidak memuat gambar per set lewat
 * `import.meta.glob("asets/<set>/<gambar>", { query: "?url" })`. Glob itu
 * makro compile-time — kalau tidak ter-expand, hasilnya `{}` dan SELURUH papan
 * tampil tanpa bidak, tanpa galat, tanpa satu pun uji yang gagal. Itulah yang
 * terjadi di commit 85ddcfa (PR #167): `import.meta.glob` dibungkus guard
 * `typeof`, sehingga Vite tidak meng-expandnya dan produksi ikut kosong.
 *
 * Tiga lapis penjaga, dari yang paling murah:
 *
 *   A. Bentuk sumber — setiap kemunculan `import.meta.glob` di `src/` WAJIB
 *      berupa panggilan langsung `import.meta.glob("pola", { … })`. Alias,
 *      `typeof`, dan panggilan tidak langsung ditolak.
 *   B. Shim loader uji — `scripts/loader-jsx.mjs` (dipakai 12 skrip uji lain)
 *      tidak boleh menelan glob diam-diam, dan peta yang dihasilkannya harus
 *      memuat seluruh berkas yang benar-benar ada di disk.
 *   C. Vite sungguhan — modul pemuat bidak (pemuatBidak.js) di-transform dengan pipeline Vite
 *      asli; `import.meta.glob` harus hilang dari hasil transform dan jumlah
 *      kunci aset harus sama dengan jumlah berkas di disk.
 *
 * Jalankan: node scripts/uji-glob-aset.mjs  |  npm run uji:glob-aset
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BERKAS_BIDAK = "src/components/chess/pemuatBidak.js";
const POLA_BIDAK = "../../asets/*/*.{svg,png}";
/** Lantai safety: tanpa ini, folder aset kosong membuat A/B/C lulus hampa. */
const MINIMAL_ASET = 100;

let lulus = 0;
let gagal = 0;
let dilewati = 0;
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
function lewati(nama, alasan) {
  dilewati++;
  gagal++;
  process.exitCode = 1;
  console.error(`  ✗ ${nama} TIDAK BERJALAN: ${alasan}`);
}

/** Semua berkas .js/.jsx di bawah `src/`. */
function berkasSrc(dir = path.join(ROOT, "src"), hasil = []) {
  for (const entri of readdirSync(dir, { withFileTypes: true })) {
    const penuh = path.join(dir, entri.name);
    if (entri.isDirectory()) berkasSrc(penuh, hasil);
    else if (/\.(js|jsx)$/.test(entri.name)) hasil.push(penuh);
  }
  return hasil;
}

/* ============ A. import.meta.glob harus panggilan langsung ============ */

console.log("\nA. bentuk sumber: import.meta.glob dipanggil langsung");

const adaEsbuild = existsSync(path.join(ROOT, "node_modules/esbuild/package.json"));
if (!adaEsbuild) {
  lewati("A. bentuk sumber", "esbuild tidak terpasang");
} else {
  // Aturan yang sama dengan shim loader dipakai ulang, bukan ditulis ulang:
  // `periksaGlobLangsung` membuang komentar lebih dulu, jadi dokumentasi yang
  // menyebut makro ini tidak salah dituduh.
  const { periksaGlobLangsung } = await import("./loader-jsx.mjs");
  const bermasalah = [];
  let kemunculan = 0;
  let pakaiBidak = false;
  for (const berkas of berkasSrc()) {
    const source = readFileSync(berkas, "utf8");
    const n = [...source.matchAll(/import\.meta\.glob/g)].length;
    if (!n) continue;
    kemunculan += n;
    if (path.relative(ROOT, berkas).split(path.sep).join("/") === BERKAS_BIDAK) pakaiBidak = true;
    try {
      periksaGlobLangsung(source, pathToFileURL(berkas).href);
    } catch {
      bermasalah.push(path.relative(ROOT, berkas).split(path.sep).join("/"));
    }
  }
  uji(
    `setiap import.meta.glob di src/ adalah panggilan langsung (${kemunculan} kemunculan)`,
    kemunculan > 0 && bermasalah.length === 0,
    bermasalah.join(", ")
  );
  uji(`renderer bidak masih memakai import.meta.glob (${BERKAS_BIDAK})`, pakaiBidak);
}

/* ============ B. shim loader uji ============ */

console.log("\nB. shim loader: peta aset tidak boleh telat");

if (!adaEsbuild) {
  lewati("B. shim loader", "esbuild tidak terpasang");
} else {
  const { shimGlobVite, temukanBerkasGlob } = await import("./loader-jsx.mjs");
  const urlBidak = pathToFileURL(path.join(ROOT, BERKAS_BIDAK)).href;
  const dirBidak = path.join(ROOT, "src/components/chess");
  const diDisk = temukanBerkasGlob(POLA_BIDAK, dirBidak);

  uji(
    `pola ${POLA_BIDAK} menemukan ${diDisk.length} berkas di disk`,
    diDisk.length >= MINIMAL_ASET,
    `minimal ${MINIMAL_ASET}`
  );

  const source = readFileSync(path.join(ROOT, BERKAS_BIDAK), "utf8");
  const shim = shimGlobVite(source, urlBidak);
  const kunciShim = new Set(
    [...shim.matchAll(/"([^"]*\/[^"]*)": \(\) => Promise\.resolve/g)].map((m) => m[1])
  );
  uji(
    `shim memuat seluruh ${diDisk.length} aset bidak`,
    kunciShim.size === diDisk.length,
    `shim ${kunciShim.size} vs disk ${diDisk.length}`
  );

  const rusak = [
    'const glob = typeof import.meta.glob === "function" ? import.meta.glob : null;',
    'if (glob) PEMUAT_ASET = glob("../../asets/x/*.svg", {});',
  ].join("\n");
  let melempar = false;
  let pesan = "";
  try {
    shimGlobVite(rusak, urlBidak);
  } catch (e) {
    melempar = true;
    pesan = e.message;
  }
  uji("shim melempar galat untuk pemanggilan import.meta.glob tidak langsung", melempar, pesan.slice(0, 80));

  const denganKomentar = "// CATATAN: `import.meta.glob` adalah makro compile-time Vite.\nconst a = 1;";
  let salahTuduh = false;
  try {
    shimGlobVite(denganKomentar, urlBidak);
  } catch {
    salahTuduh = true;
  }
  uji("komentar yang menyebut import.meta.glob tidak dianggap pemanggilan", !salahTuduh);
}

/* ============ C. pipeline Vite sungguhan ============ */

console.log("\nC. transform Vite: makro benar-benar ter-expand");

if (!existsSync(path.join(ROOT, "node_modules/vite/package.json"))) {
  lewati("C. transform Vite", "vite tidak terpasang");
} else {
  const { createServer } = await import("vite");
  const server = await createServer({
    root: ROOT,
    appType: "custom",
    logLevel: "error",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  let kode;
  try {
    const hasil = await server.transformRequest(`/${BERKAS_BIDAK}`);
    kode = hasil ? hasil.code : "";
  } finally {
    await server.close();
  }

  uji("transform Vite berhasil", kode.length > 0, "hasil transform kosong");
  // Yang dicari adalah PEMANGGILAN (`import.meta.glob(`). Teks yang sama di
  // komentar tetap ada di hasil transform Vite dan tidak berarti makro gagal.
  uji(
    "import.meta.glob hilang dari hasil transform (makro ter-expand)",
    kode.length > 0 && !/import\.meta\.glob\s*\(/.test(kode)
  );

  const kunciVite = new Set([...kode.matchAll(/"([^"]*\/[^"]*\.(?:svg|png))"/g)].map((m) => m[1]));
  const { temukanBerkasGlob } = await import("./loader-jsx.mjs");
  const diDisk = temukanBerkasGlob(POLA_BIDAK, path.join(ROOT, "src/components/chess"));
  const kunciRelatif = new Set(diDisk.map((f) => f.relatif));
  const benar = [...kunciVite].filter((k) => kunciRelatif.has(k));

  uji(
    `Vite menghasilkan kunci aset untuk ${diDisk.length} berkas yang ada di disk`,
    kunciVite.size >= MINIMAL_ASET && benar.length === diDisk.length,
    `vite ${kunciVite.size} (cocok ${benar.length}) vs disk ${diDisk.length}`
  );
}

/* ============================ Ringkasan ============================ */

console.log(
  `\n${gagal === 0 ? "LULUS" : "GAGAL"}: ${lulus} lulus, ${gagal} gagal` +
    (dilewati ? `, ${dilewati} dilewati` : "") +
    "."
);
if (gagal) process.exit(1);