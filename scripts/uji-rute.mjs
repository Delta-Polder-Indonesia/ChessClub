/**
 * Pastikan daftar rute di plugins/performa.js selaras dengan App.jsx
 * supaya setiap halaman publik mendapat HTML 200 di GitHub Pages.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { RUTE_PUBLIK } from "../plugins/performa.js";

const app = await readFile(path.resolve("src/App.jsx"), "utf8");
const diApp = [...app.matchAll(/\["(\/[^"]*)",\s*\w+\]/g)].map((m) => m[1]);
const publikApp = diApp.filter((r) => r !== "/");
const kurang = publikApp.filter((r) => !RUTE_PUBLIK.includes(r));
const lebih = RUTE_PUBLIK.filter((r) => !publikApp.includes(r));

if (kurang.length || lebih.length) {
  console.error("Rute tidak selaras antara App.jsx dan plugins/performa.js");
  if (kurang.length) console.error("  kurang di performa.js:", kurang);
  if (lebih.length) console.error("  lebih di performa.js:", lebih);
  process.exit(1);
}

console.log(`OK — ${RUTE_PUBLIK.length} rute publik selaras.`);
