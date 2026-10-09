/**
 * Uji permukaan yang dibaca Googlebot.
 *
 * Alasan adanya uji ini: semua rute publik disalin dari index.html, dan hanya
 * rute tertentu yang metadatanya diganti saat build. Rute yang tidak diganti
 * mengirim <title>, deskripsi, dan rel=canonical milik beranda — Google
 * membacanya sebagai duplikat dan tidak mengindeksnya ("Dirayapi - saat ini
 * tidak diindeks"). Uji ini mengunci aturan yang mencegah gejala itu balik lagi:
 *
 *  1. setiap rute publik punya entri META_RUTE dengan judul + deskripsi sendiri;
 *  2. HTML hasil injeksi per rute benar-benar beda dari beranda (kanonikal
 *     menunjuk ke rutenya sendiri, bukan ke "/");
 *  3. sitemap.xml memuat persis rute yang boleh diindeks, lengkap dengan
 *     <lastmod>; robots.txt tidak memblokir;
 *  4. dua metode verifikasi Search Console (meta tag + berkas html) utuh.
 *  5. rute layar-penuh gelap tidak lagi mewarisi `#boot-hero`/preload gambar
 *     hero beranda, dan sudah membawa latar `#262421` inline (anti-kedipan);
 *  6. rute teka-teki memuat preload `as=fetch` untuk data/teka-teki.json
 *     (unduhan mulai bersamaan dengan parse HTML — render elemen LCP tidak
 *     menunggu React), tidak bocor ke rute gelap lain, dan
 *     .well-known/ai-catalog.json memuat `specVersion` di root.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  RUTE_PUBLIK,
  RUTE_ALIH,
  RUTE_LATAR_GELAP,
  PRELOAD_JSON_RUTE,
  META_RUTE,
  metadataRute,
  metadataUntukRute,
  kerangkaRute,
} from "../plugins/performa.js";

const SEMUA_RUTE_BANGUN = ["/", ...RUTE_PUBLIK];
const GALAT = [];
const PERINGATAN = [];
const gagal = (pesan) => GALAT.push(pesan);

const baca = (rel) => readFile(path.resolve(rel), "utf8");
const html = await baca("index.html");
const situs = "https://chess-club-weld.vercel.app/";

/* ------------------------------------------------ 1. tabel metadata rute */

const ruteTanpaMeta = [...SEMUA_RUTE_BANGUN].filter((r) => !META_RUTE[r]);
if (ruteTanpaMeta.length) {
  gagal(`META_RUTE tidak punya entri untuk: ${ruteTanpaMeta.join(", ")}.`);
}
const entriAsing = Object.keys(META_RUTE).filter((r) => !SEMUA_RUTE_BANGUN.includes(r));
if (entriAsing.length) {
  gagal(`META_RUTE punya entri untuk rute yang tidak ada: ${entriAsing.join(", ")}.`);
}
const metaPerRute = new Map();
for (const rute of SEMUA_RUTE_BANGUN) {
  try {
    metaPerRute.set(rute, metadataUntukRute(rute));
  } catch (e) {
    gagal(e.message);
  }
}

const SEMUA_RUTE = ["/", ...RUTE_PUBLIK];
const judulBeranda = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
const judulTerpakai = new Map();
for (const [rute, meta] of metaPerRute) {
  if (!meta.judul.includes("|")) gagal(`Judul rute ${rute} tidak memakai akhiran brand.`);
  // Beranda memang pemilik judul di index.html; rute lain tidak boleh menirunya.
  if (rute !== "/" && meta.judul === judulBeranda) gagal(`Judul rute ${rute} sama dengan judul beranda.`);
  if (meta.deskripsi.length < 40) gagal(`Deskripsi rute ${rute} terlalu pendek (${meta.deskripsi.length} karakter).`);
  if (meta.deskripsi.length > 320) gagal(`Deskripsi rute ${rute} terlalu panjang (${meta.deskripsi.length} karakter).`);
  if (meta.deskripsi.length > 160) PERINGATAN.push(`Deskripsi rute ${rute} ${meta.deskripsi.length} karakter — dipotong di hasil pencarian.`);
  if (meta.robots !== "index, follow" && meta.robots !== "noindex, follow") {
    gagal(`Rute ${rute} memakai meta robots tak lazim: "${meta.robots}".`);
  }
  judulTerpakai.set(meta.judul, [...(judulTerpakai.get(meta.judul) || []), rute]);
}
for (const [judul, rute] of judulTerpakai) {
  if (rute.length > 1) gagal(`Judul "${judul}" dipakai lebih dari satu rute: ${rute.join(", ")}.`);
}

/* --------------------------------------- 2. hasil injeksi metadata ke HTML */

for (const rute of SEMUA_RUTE_BANGUN) {
  const hasil = metadataRute(html, rute, situs);
  const kanonikal = (hasil.match(/<link rel="canonical" href="([^"]*)" \/>/) || [])[1];
  const kanonikalHarapan = rute === "/" ? situs : `${situs.replace(/\/+$/, "")}${rute}`;
  if (kanonikal !== kanonikalHarapan) {
    gagal(`Rute ${rute}: kanonikal "${kanonikal}" bukan alamat rute itu sendiri.`);
  }
  // Setiap rute harus mengirim HTML yang BEDA dari beranda — kalau identik,
  // Google melihatnya sebagai duplikat "/" dan tidak mengindeksnya.
  if (rute !== "/" && hasil === html) {
    gagal(`Injeksi metadata tidak mengubah apa pun untuk rute ${rute}.`);
  }
  if (rute === "/" && (hasil.match(/<title>([^<]*)<\/title>/) || [])[1] !== judulBeranda) {
    gagal("Beranda: metadataRute justru mengubah <title> index.html.");
  }
  const robots = (hasil.match(/<meta name="robots" content="([^"]*)" \/>/) || [])[1];
  const seharusnya = metaPerRute.get(rute)?.robots;
  if (seharusnya && robots !== seharusnya) {
    gagal(`Rute ${rute}: meta robots "${robots}", seharusnya "${seharusnya}".`);
  }
  const ogUrl = (hasil.match(/<meta property="og:url" content="([^"]*)" \/>/) || [])[1];
  if (ogUrl !== kanonikal) gagal(`Rute ${rute}: og:url "${ogUrl}" tidak sama dengan kanonikal.`);
}

/* -------------------------------- 2b. kerangka rute berlatar gelap */

/*
 * Bug yang dijaga: rute layar-penuh gelap masih mewarisi `#boot-hero` + preload
 * gambar hero beranda dari index.html, sehingga pengunjung melihat foto beranda
 * dulu lalu layar berganti gelap (kedipan sekali). Membuangnya tanpa latar
 * inline `#262421` menukar kedipan itu dengan kedipan putih — karenanya dua
 * pemeriksaan di bawah berpasangan dan tidak boleh dipisah.
 */
const ruteGelapAsing = RUTE_LATAR_GELAP.filter((r) => !RUTE_PUBLIK.includes(r));
if (ruteGelapAsing.length) {
  gagal(
    `RUTE_LATAR_GELAP memuat rute yang tidak dipra-render: ${ruteGelapAsing.join(", ")}.`,
  );
}
for (const rute of RUTE_LATAR_GELAP) {
  const hasil = kerangkaRute(metadataRute(html, rute, situs), rute);
  if (hasil.includes('id="boot-hero"')) {
    gagal(`Rute gelap ${rute}: #boot-hero masih ada di HTML hasil build.`);
  }
  if (hasil.includes("/images/tonggak-2015.webp")) {
    gagal(`Rute gelap ${rute}: preload gambar hero beranda masih ada.`);
  }
  if (!hasil.includes('<body style="background-color:#262421">')) {
    gagal(`Rute gelap ${rute}: <body> tanpa latar gelap inline #262421.`);
  }
}
// Rute ber-kerangka (dan beranda) WAJIB mempertahankan boot-hero untuk LCP.
for (const rute of ["/", "/program-kami/teka-teki", "/turnamen"]) {
  const hasil = metadataRute(html, rute, situs);
  if (!hasil.includes('id="boot-hero"')) {
    gagal(`Rute ${rute}: #boot-hero hilang — LCP beranda ikut rusak.`);
  }
}

/* ------------------------- 2c. preload JSON rute teka-teki ---------------- */

/*
 * Rute teka-teki me-fetch data/teka-teki.json saat mount; tanpa preload di
 * HTML rute, unduhan baru mulai setelah React + chunk halaman siap sehingga
 * render elemen LCP (SVG bidak) tertunda (audit PageSpeed Desktop: rantai
 * kritis 2,49 detik). Pagar di bawah menjaga dua arah: preload harus ADA di
 * rute yang memakainya, dan tidak BOCOR ke rute gelap lain yang tidak
 * meng-fetch JSON itu (request terbuang di setiap halaman).
 */
const dasarPeta = process.env.VITE_BASE_PUBLIC || "/";
for (const [rute, json] of Object.entries(PRELOAD_JSON_RUTE)) {
  if (!RUTE_LATAR_GELAP.includes(rute)) {
    gagal(`PRELOAD_JSON_RUTE memuat rute ${rute} yang bukan rute layar-penuh (tidak lewat kerangkaRute).`);
    continue;
  }
  const hasil = kerangkaRute(metadataRute(html, rute, situs), rute);
  const tautan = `<link rel="preload" as="fetch" href="${dasarPeta}${json}" crossorigin />`;
  if (!hasil.includes(tautan)) {
    gagal(`Rute ${rute}: preload as=fetch ${json} tidak ada di HTML hasil build.`);
  }
}
for (const rute of RUTE_LATAR_GELAP.filter((r) => !(r in PRELOAD_JSON_RUTE))) {
  const hasil = kerangkaRute(metadataRute(html, rute, situs), rute);
  if (hasil.includes('rel="preload" as="fetch"')) {
    gagal(`Rute ${rute}: preload JSON bocor — rute ini tidak meng-fetch data/teka-teki.json.`);
  }
}

/* ------------------------------------------------- 3. sitemap & robots.txt */

const sitemap = await baca("public/sitemap.xml");
const ruteNoindex = RUTE_PUBLIK.filter((r) => metaPerRute.get(r)?.robots === "noindex, follow");
const diSitemap = [...sitemap.matchAll(/<loc>%%SITE_URL%%([^<]*)<\/loc>/g)]
  .map((m) => (m[1] ? `/${m[1]}` : "/"))
  .filter((p) => p !== "/");
const kurang = RUTE_PUBLIK.filter((r) => !ruteNoindex.includes(r) && !diSitemap.includes(r));
const lebih = diSitemap.filter((r) => !RUTE_PUBLIK.includes(r) || ruteNoindex.includes(r));
if (kurang.length) gagal(`Kurang di sitemap.xml: ${kurang.join(", ")}`);
if (lebih.length) gagal(`Lebih di sitemap.xml (atau seharusnya noindex): ${lebih.join(", ")}`);
if (!/%%SITE_URL%%<\/loc>/.test(sitemap)) gagal("sitemap.xml: <loc> tidak berformat %%SITE_URL%%…");
if (!sitemap.includes("<url>\n    <loc>%%SITE_URL%%</loc>")) {
  gagal("sitemap.xml: beranda (%%SITE_URL%%) harus menjadi entri pertama.");
}
const jumlahLoc = (sitemap.match(/<loc>/g) || []).length;
const jumlahLastmod = (sitemap.match(/<lastmod>%%LASTMOD%%<\/lastmod>/g) || []).length;
if (jumlahLastmod !== jumlahLoc) {
  gagal(`sitemap.xml: ${jumlahLastmod} <lastmod> untuk ${jumlahLoc} <loc> — tiap URL harus punya lastmod.`);
}

/* ------------------------------------------- 3b. rute yang dialihkan (308) -- */

const vercel = JSON.parse(await baca("vercel.json"));
const sumberAlih = (vercel.redirects || []).map((r) => r.source);
for (const [dari, ke] of Object.entries(RUTE_ALIH)) {
  // Alamat lama tidak boleh lagi muncul sebagai halaman yang diindeks…
  if (diSitemap.includes(dari)) {
    gagal(`Sitemap memuat rute pengalihan ${dari} — alamat kanoniknya ${ke}.`);
  }
  // …dan tidak boleh dipra-render sebagai halaman berkanonik dirinya sendiri.
  if (RUTE_PUBLIK.includes(dari)) {
    gagal(`Rute pengalihan ${dari} ikut RUTE_PUBLIK — ia akan dipra-render sebagai duplikat.`);
  }
  // Pengalihan harus ada di dua lapis: config Vercel dan router React.
  if (!sumberAlih.includes(dari)) {
    gagal(`vercel.json tidak mengalihkan ${dari} ke ${ke} (pemuat halaman penuh).`);
  }
  const navigasiApp = await baca("src/App.jsx");
  if (!navigasiApp.includes(`to="${ke}"`) && !navigasiApp.includes(`to={\`` + ke)) {
    gagal(`src/App.jsx tidak mengalihkan ${dari} ke ${ke} (navigasi dalam aplikasi).`);
  }
}

/*
 * Deep-link soal (`/teka-teki/problem/<nomor>`) memakai HTML halaman kanonik,
 * bukan shell beranda: tanpa rewrite ini, kanonik yang dibaca Googlebot untuk
 * setiap nomor soal adalah alamat beranda.
 */
const rewrites = vercel.rewrites || [];
const rewriteSoal = rewrites.find((r) => r.source.startsWith("/teka-teki/problem/"));
if (!rewriteSoal) {
  gagal("vercel.json tidak merutekan /teka-teki/problem/<nomor> ke HTML halaman kanonik.");
} else {
  const indeksCatchAll = rewrites.findIndex((r) => r.destination === "/index.html");
  const indeksSoal = rewrites.indexOf(rewriteSoal);
  if (indeksCatchAll !== -1 && indeksSoal > indeksCatchAll) {
    gagal("rewrite deep-link soal berada SETELAH catch-all SPA sehingga tidak pernah terpakai.");
  }
}

const robots = await baca("public/robots.txt");
if (!/^Allow: \/$/m.test(robots)) gagal("robots.txt: tidak ada `Allow: /` untuk User-agent: *.");
if (/^Disallow: \/$/m.test(robots)) gagal("robots.txt: `Disallow: /` memblokir seluruh situs.");
if (!/^Sitemap: %%SITE_URL%%sitemap\.xml$/m.test(robots)) {
  gagal("robots.txt: baris `Sitemap: %%SITE_URL%%sitemap.xml` tidak ditemukan.");
}

/* -------------------------------------------- 4. verifikasi Search Console */

const token = (html.match(/name="google-site-verification"\s+content="([^"]*)"/) || [])[1] || "";
if (token.length < 40) gagal(`index.html: meta google-site-verification tidak lengkap ("${token}").`);
const berkasVerifikasi = "public/google800ae0ab9c9d6db7.html";
const isiVerifikasi = (await readFile(path.resolve(berkasVerifikasi), "utf8")).trim();
if (isiVerifikasi !== "google-site-verification: google800ae0ab9c9d6db7.html") {
  gagal(`Isi ${berkasVerifikasi} harus satu baris persis seperti yang ditulis wizard Google.`);
}
if (!/<meta name="robots" content="index, follow" \/>/.test(html)) {
  gagal("index.html: beranda tidak mengizinkan indeks (`meta robots` = index, follow).");
}

/* ---------------------------- 5. katalog agen AI (.well-known) ------------ */

// Validasi katalog (audit PageSpeed) menuntut `specVersion` di root; tanpa
// properti itu seluruh berkas ditolak, bukan hanya entrinya.
const katalogAI = JSON.parse(await baca("public/.well-known/ai-catalog.json"));
if (typeof katalogAI.specVersion !== "string" || !katalogAI.specVersion.trim()) {
  gagal('ai-catalog.json: properti wajib "specVersion" tidak ada di root.');
}

/* ------------------------------------------------------------------ hasil */

for (const p of PERINGATAN) console.warn(`PERINGATAN — ${p}`);
if (GALAT.length) {
  console.error(`uji-seo: ${GALAT.length} galat`);
  for (const g of GALAT) console.error(`  - ${g}`);
  process.exit(1);
}
console.log(
  `OK — ${RUTE_PUBLIK.length} rute publik punya metadata sendiri, ` +
    `${jumlahLoc} URL sitemap selaras, robots.txt & verifikasi Search Console utuh.` +
    (PERINGATAN.length ? ` (${PERINGATAN.length} peringatan)` : ""),
);
