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
// Parameter OPSIONAL (mis. "/teka-teki/problem/:id?") membuka dua alamat:
// alamat polosnya (`/teka-teki/problem`) tetap rute publik yang harus
// dipra-render, sedangkan bagian bernomornya ditangani fallback SPA.
const publikApp = diApp.flatMap((r) => {
  const polos = r.replace(/\/:[^/]+\?$/, "");
  if (polos !== r) return polos && polos !== "/" ? [polos] : [];
  return r === "/" || r.includes(":") ? [] : [r];
});
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

/*
 * Penjaga arsitektur: empat mode papan (Manusia vs Mesin, Latihan Repertoar,
 * Hand & Brain, Turing test) adalah halaman mandiri — rutenya harus terdaftar
 * di `RUTE_HALAMAN`, bukan di `RUTE_PAPAN` (tata letak Workspace). Alamatnya
 * sendiri tidak berubah, jadi uji ini mengunci keduanya sekaligus.
 */
const MODE_MANDIRI = [
  "/papan-interaktif/manusia-vs-mesin",
  "/papan-interaktif/latihan-repertoar",
  "/papan-interaktif/hand-brain",
  "/papan-interaktif/turing-test",
];
const blokRute = (nama) => {
  const mulai = app.indexOf(`const ${nama} = [`);
  if (mulai < 0) return "";
  const selesai = app.indexOf("\n];", mulai);
  return selesai < 0 ? "" : app.slice(mulai, selesai);
};
const hal = blokRute("RUTE_HALAMAN");
const papan = blokRute("RUTE_PAPAN");

const workspace = await readFile(
  path.resolve("src/halaman/PapanInteraktif/Workspace.jsx"),
  "utf8"
);
const menuMulai = workspace.indexOf("const MENU_PAPAN = [");
const menuSelesai = workspace.indexOf("\n];", menuMulai);
const tautanSidebar = [
  ...workspace
    .slice(menuMulai < 0 ? 0 : menuMulai, menuSelesai < 0 ? undefined : menuSelesai)
    .matchAll(/\bke:\s*"(\/papan-interaktif[^"]*)"/g),
].map((m) => m[1]);

const salahTempat = MODE_MANDIRI.filter(
  (r) => !hal.includes(`"${r}"`) || papan.includes(`"${r}"`)
);
const sidebarBocor = tautanSidebar.filter((r) => MODE_MANDIRI.includes(r));

if (salahTempat.length || sidebarBocor.length || tautanSidebar.length === 0) {
  console.error("Arsitektur mode papan tidak sesuai pola mandiri");
  if (!hal) console.error("  RUTE_HALAMAN tidak ditemukan di App.jsx");
  if (tautanSidebar.length === 0) console.error("  MENU_PAPAN Workspace.jsx tidak terbaca");
  for (const r of salahTempat) console.error(`  ${r}: harus di RUTE_HALAMAN, bukan RUTE_PAPAN`);
  for (const r of sidebarBocor) console.error(`  ${r}: masih jadi item sidebar Workspace`);
  process.exit(1);
}

console.log(
  `OK — ${RUTE_PUBLIK.length} rute publik + ${Object.keys(RUTE_ALIH).length} rute pengalihan selaras.`
);
console.log(
  `OK — ${MODE_MANDIRI.length} mode papan mandiri di RUTE_HALAMAN; sidebar Workspace ${tautanSidebar.length} tautan (${tautanSidebar.join(", ")}).`
);
