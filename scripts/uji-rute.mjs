/**
 * Pastikan daftar rute di plugins/performa.js selaras dengan App.jsx
 * supaya setiap halaman publik mendapat HTML route-specific di Vercel.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { RUTE_ALIH, RUTE_PUBLIK } from "../plugins/performa.js";

const app = await readFile(path.resolve("src/App.jsx"), "utf8");
const diApp = [...app.matchAll(/\["(\/[^"]*)",\s*\w+\]/g)].map((m) => m[1]);
// Rute dinamis (mis. "/media-dan-informasi/berita/:id") tidak bisa
// dipra-render menjadi berkas HTML statis — penanganannya diserahkan
// ke fallback SPA Vercel. Jangan diuji di sini.
const publikApp = diApp.filter((r) => r !== "/" && !r.includes(":"));
/*
 * Rute pengalihan (`RUTE_ALIH`) tetap harus terdaftar di App.jsx supaya
 * navigasi di dalam aplikasi ikut terarah, tetapi TIDAK boleh ikut
 * RUTE_PUBLIK — kalau ikut, ia dipra-render dan masuk sitemap sebagai
 * duplikat alamat kanoniknya.
 */
const kurang = publikApp.filter(
  (r) => !RUTE_PUBLIK.includes(r) && !Object.hasOwn(RUTE_ALIH, r)
);
const lebih = RUTE_PUBLIK.filter((r) => !publikApp.includes(r));
const alihSalah = Object.entries(RUTE_ALIH).filter(
  ([dari, ke]) => !publikApp.includes(dari) || !RUTE_PUBLIK.includes(ke) || RUTE_PUBLIK.includes(dari)
);

if (kurang.length || lebih.length || alihSalah.length) {
  console.error("Rute tidak selaras antara App.jsx dan plugins/performa.js");
  if (kurang.length) console.error("  kurang di performa.js:", kurang);
  if (lebih.length) console.error("  lebih di performa.js:", lebih);
  for (const [dari, ke] of alihSalah) {
    console.error(`  pengalihan tidak sah: ${dari} → ${ke}`);
  }
  process.exit(1);
}

console.log(
  `OK — ${RUTE_PUBLIK.length} rute publik + ${Object.keys(RUTE_ALIH).length} rute pengalihan selaras.`
);
