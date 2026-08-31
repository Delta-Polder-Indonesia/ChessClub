#!/usr/bin/env node
/**
 * optimumkan-gambar.mjs — pangkas gambar yang PageSpeed Insights / Lighthouse
 * laporkan "lebih besar daripada yang dibutuhkan" (audit "Improve image
 * delivery") dan tulis peta ukurannya ke src/data/ukur-gambar.js.
 *
 * Konvensi nama varian (sama seperti sumberHero() di src/lib/asets.js):
 *
 *     /images/x.webp   →   /images/x-640.webp, /images/x-828.webp, …
 *
 * Angka di belakang nama = lebar piksel varian. Berkas ASAL tidak diubah,
 * hanya ditambah saudaranya yang lebih kecil, jadi pemanggil lama tetap
 * bekerja dan yang baru cukup menyebar `srcSet`.
 *
 * Manifest src/data/ukur-gambar.js mencatat ukuran asli + varian yang
 * BENAR-BENAR ADA di public/. Komponen membacanya lewat sumberGambar(),
 * sehingga tidak mungkin ada srcset yang menunjuk berkas kosong.
 *
 * Pemakaian:
 *   node scripts/optimumkan-gambar.mjs           # buat varian yang belum ada
 *   node scripts/optimumkan-gambar.mjs --paksa   # buat ulang semuanya
 *   node scripts/optimumkan-gambar.mjs --cek     # periksa, jangan menulis
 *
 * Mode --cek tidak menulis apa pun dan tidak butuh ImageMagick; ia dipakai
 * scripts/uji-gambar.mjs (npm run uji:gambar) supaya gambar baru tidak ada
 * yang lolos tanpa varian responsif / manifest yang diperbarui.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(fileURLToPath(import.meta.url), "../..");
export const PUB = path.join(AKAR, "public");
export const MANIFEST = path.join(AKAR, "src", "data", "ukur-gambar.js");

/**
 * Daftar kerja — satu entri per berkas atau per folder gambar:
 *   jalur     berkas/folder di public/
 *   pola      hanya berkas dengan nama ini (untuk folder)
 *   varian    lebar piksel yang dibuat (kosong = daftarkan varian yang sudah ada)
 *   kualitas   kualitas WebP awal; diturunkan otomatis bila hasilnya masih
 *              tidak lebih ringan dari aslinya
 */
// Sejak pembersihan gambar ganda, setiap gambar di public/images hanya
// disimpan SATU berkas (varian terkecil hasil optimasi yang dijadikan nama
// dasar). Tidak ada lagi varian responsif (-320/-640/-828/…), jadi daftar ini
// sengaja kosong: skrip cukup menyinkronkan manifest (UKUR/DILEWATI jadi
// kosong) dan uji-gambar tidak lagi menagih varian.
//
// Kalau suatu saat ada gambar BARU yang berat dan ingin dipecah lagi jadi
// varian responsif, tambahkan entrinya di sini (mis.
//   { jalur: "images/foto-baru.webp", varian: [640, 828], kualitas: 78 }
// ), pasang ImageMagick dengan dukungan WebP, lalu jalankan:
//   node scripts/optimumkan-gambar.mjs
export const TARGET = [];

/* -------------------------------------------------------------- util WebP */

/**
 * Lebar & tinggi gambar WebP tanpa alat eksternal — cukup baca header RIFF.
 * Kenal VP8 (lossy), VP8L (lossless), dan VP8X (berbingkai/ikon).
 */
export function dimensiWebP(buf) {
  if (buf.length < 30 || buf.toString("latin1", 0, 4) !== "RIFF") return null;
  if (buf.toString("latin1", 8, 12) !== "WEBP") return null;
  const fourcc = buf.toString("latin1", 12, 16);

  if (fourcc === "VP8X") {
    return {
      lebar: 1 + buf.readUIntLE(24, 3),
      tinggi: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (fourcc === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { lebar: (bits & 0x3fff) + 1, tinggi: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === "VP8 ") {
    // Kode sinkron frame kunci 9d 01 2a, diikuti dua bilangan 14-bit.
    for (let i = 20; i < 26; i += 1) {
      if (buf[i] === 0x9d && buf[i + 1] === 0x01 && buf[i + 2] === 0x2a) {
        return {
          lebar: buf.readUInt16LE(i + 3) & 0x3fff,
          tinggi: buf.readUInt16LE(i + 5) & 0x3fff,
        };
      }
    }
  }
  return null;
}

/** "/images/x.webp" + 640 → "/images/x-640.webp" */
export function namaVarian(jalur, lebar) {
  return jalur.replace(/\.webp$/i, `-${lebar}.webp`);
}

/** Lebar dari nama varian ("-828.webp" → 828); null untuk berkas asal. */
function lebarDariNama(nama) {
  const cocok = nama.match(/-(\d{2,4})\.webp$/i);
  return cocok ? Number(cocok[1]) : null;
}

/** Semua WebP asli (tanpa varian) di sebuah folder public/, terurut nama. */
export function daftarWebP(dirRelatif, pola) {
  const dir = path.join(PUB, dirRelatif);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(
      (n) =>
        /\.webp$/i.test(n) &&
        lebarDariNama(n) === null &&
        (!pola || pola.test(n)),
    )
    .sort()
    .map((n) => `${dirRelatif}/${n}`);
}

/** Lebar varian yang terpasang di samping sebuah berkas (termasuk yang cacat). */
function lebarVarianTerpasang(jalurRel) {
  const dirAbs = path.join(PUB, path.posix.dirname(jalurRel));
  const dasar = path.posix.basename(jalurRel).replace(/\.webp$/i, "");
  if (!existsSync(dirAbs)) return [];
  const hasil = [];
  for (const nama of readdirSync(dirAbs)) {
    if (!nama.startsWith(`${dasar}-`) || !/\.webp$/i.test(nama)) continue;
    const lebar = lebarDariNama(nama);
    if (lebar) hasil.push(lebar);
  }
  return [...new Set(hasil)].sort((a, b) => a - b);
}

function ukuranBerkas(jalurAbs) {
  return existsSync(jalurAbs) ? statSync(jalurAbs).size : 0;
}

function kiB(n) {
  return `${(n / 1024).toFixed(1)} KiB`;
}

/**
 * Varian hanya berguna bila jelas lebih ringan dari berkas aslinya. Batas 90%
 * membuat skrip ini juga MEMPERBAIKI varian lama yang dulu dibuat dengan
 * kualitas kelewat tinggi — sekilas-828.webp pernah 83 KiB untuk berkas asal
 * 84 KiB, jadi tidak menghemat apa pun.
 */
function varianBerguna(jalurRel, lebar) {
  const asal = ukuranBerkas(path.join(PUB, jalurRel));
  const varian = ukuranBerkas(path.join(PUB, namaVarian(jalurRel, lebar)));
  return varian > 0 && varian < asal * 0.9;
}

/* ------------------------------------------------------------- ImageMagick */

function jalankan(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 24 });
}

/** IM7 (`magick`) lebih disukai; IM6 cukup `convert`. Harus bisa WebP. */
function pilihIM() {
  for (const cmd of ["magick", "convert"]) {
    try {
      if (/\bWEBP\b/.test(jalankan(cmd, ["-list", "format"]))) return cmd;
    } catch {
      /* coba binari berikutnya */
    }
  }
  return null;
}

function tulisVarian(im, jalurRel, lebar, kualitas) {
  const keluaranAbs = path.join(PUB, namaVarian(jalurRel, lebar));
  mkdirSync(path.dirname(keluaranAbs), { recursive: true });
  const args = [
    path.join(PUB, jalurRel),
    "-auto-orient",
    "-strip",
    "-filter",
    "lanczos",
    "-resize",
    `${lebar}x>`,
    "-quality",
    String(kualitas),
    "-define",
    "webp:method=6",
    "-define",
    "webp:exact=1",
    keluaranAbs,
  ];
  jalankan(im, im === "magick" ? ["convert", ...args] : args);
  return keluaranAbs;
}

/**
 * Buat varian dengan kualitas tertinggi yang masih worth it: kalau hasil
 * kompresi belum cukup lebih kecil dari aslinya, kualitas diturunkan
 * beberapa langkah; kalau masih juga tidak, varian tidak dibuat sama sekali.
 */
function varianTerbaik(im, jalurRel, lebar, kualitas) {
  const ukuranAsal = ukuranBerkas(path.join(PUB, jalurRel));
  const keluaranAbs = path.join(PUB, namaVarian(jalurRel, lebar));
  for (const q of [
    kualitas,
    kualitas - 8,
    kualitas - 16,
    kualitas - 24,
    kualitas - 32,
  ]) {
    if (q < 30) break;
    tulisVarian(im, jalurRel, lebar, q);
    const hasil = ukuranBerkas(keluaranAbs);
    if (hasil > 0 && hasil < ukuranAsal * 0.9)
      return { kualitas: q, ukuran: hasil };
  }
  if (existsSync(keluaranAbs)) rmSync(keluaranAbs);
  return null;
}

/* ---------------------------------------------------------------- manifest */

const KEPALA = `/**
 * Peta ukuran gambar publik — dihasilkan oleh \`node scripts/optimumkan-gambar.mjs\`.
 * JANGAN disunting tangan; jalankan ulang skripnya kalau ada gambar baru.
 *
 *   UKUR["/images/x.webp"] = [lebarAsli, tinggiAsli, [lebarVarian…]]
 *
 * Varian disimpan sebagai lebarnya saja: berkasnya selalu di samping aslinya
 * dengan nama "x-<lebar>.webp" (konvensi yang sama dipakai sumberHero()).
 * src/lib/asets.js → sumberGambar() membaca peta ini untuk membentuk srcSet,
 * jadi tidak ada kandidat gambar yang menunjuk berkas kosong.
 *
 *   DILEWATI["/images/y.webp"] = [640]
 *
 * Lebar yang sudah dicoba tetapi sengaja TIDAK dibuatkan variannya karena
 * berkas aslinya sudah lebih ramping daripada hasil kompresi ulang.
 */
`;

/** Parse peta dari modul manifest (tanpa import, supaya skrip tetap sinkron). */
function bacaManifestLama() {
  const kosong = { UKUR: {}, DILEWATI: {} };
  if (!existsSync(MANIFEST)) return kosong;
  const teks = readFileSync(MANIFEST, "utf8");
  const ambil = (nama) => {
    const mulai = teks.indexOf(`${nama} = {`);
    if (mulai < 0) return {};
    const awal = teks.indexOf("{", mulai);
    let dalam = 0;
    for (let i = awal; i < teks.length; i += 1) {
      if (teks[i] === "{") dalam += 1;
      else if (teks[i] === "}" && --dalam === 0) {
        try {
          return JSON.parse(
            teks.slice(awal, i + 1).replace(/,\s*([}\]])/g, "$1"),
          );
        } catch {
          return {};
        }
      }
    }
    return {};
  };
  return { UKUR: ambil("UKUR"), DILEWATI: ambil("DILEWATI") };
}

/** Kumpulan [lebar, tinggi, [varian…]] untuk satu gambar. */
function entriGambar(jalurRel) {
  const d = dimensiWebP(readFileSync(path.join(PUB, jalurRel)));
  if (!d) return null;
  const varian = lebarVarianTerpasang(jalurRel).filter(
    (lebar) => lebar < d.lebar && varianBerguna(jalurRel, lebar),
  );
  return [d.lebar, d.tinggi, varian];
}

export function berkasTarget() {
  const hasil = new Set();
  for (const t of TARGET) {
    const abs = path.join(PUB, t.jalur);
    if (existsSync(abs) && statSync(abs).isFile()) {
      hasil.add(t.jalur);
      continue;
    }
    for (const berkas of daftarWebP(t.jalur, t.pola)) hasil.add(berkas);
  }
  return [...hasil].sort();
}

/**
 * Rencana kerja: lebar yang diminta TARGET, ditambah varian yang sudah
 * terpasang tetapi tidak berguna — supaya varian warisan yang dikompresi
 * asal-asalan ikut diperbaiki, bukan hanya yang baru.
 */
export function bangunRencana() {
  const rencana = new Map();
  for (const t of TARGET) {
    const abs = path.join(PUB, t.jalur);
    const berkasTunggal = existsSync(abs) && statSync(abs).isFile();
    const daftar = berkasTunggal ? [t.jalur] : daftarWebP(t.jalur, t.pola);
    for (const jalur of daftar) {
      const d = dimensiWebP(readFileSync(path.join(PUB, jalur)));
      if (!d) continue;
      const lebar = new Set([
        ...(t.varian ?? []),
        ...lebarVarianTerpasang(jalur),
      ]);
      for (const l of lebar) {
        // Tidak ada gunanya membuat varian selebar (atau lebih lebar dari) aslinya.
        if (d.lebar <= l * 1.05) continue;
        rencana.set(`${jalur}@${l}`, {
          jalur,
          lebar: l,
          kualitas: t.kualitas ?? 78,
        });
      }
    }
  }
  return [...rencana.values()];
}

function bangunManifest() {
  const { DILEWATI } = bacaManifestLama();
  const target = new Set(berkasTarget().map((j) => `/${j}`));
  const UKUR = {};
  const dilewati = {};
  for (const jalur of berkasTarget()) {
    const kunci = `/${jalur}`;
    const entri = entriGambar(jalur);
    // Gambar tanpa varian tidak mengubah apa pun di sisi browser, dan setiap
    // baris peta ini ikut masuk ke bundel — jadi hanya yang berguna disimpan.
    if (entri && entri[2].length) UKUR[kunci] = entri;
    // Keputusan "jangan buat varian ini" tetap dicatat (termasuk untuk gambar
    // yang akhirnya tidak punya entri), supaya --cek tidak menagihnya lagi.
    if (DILEWATI[kunci]?.length)
      dilewati[kunci] = [...DILEWATI[kunci]].sort((a, b) => a - b);
  }
  for (const kunci of Object.keys(DILEWATI)) {
    if (!target.has(kunci)) continue;
    dilewati[kunci] ??= [...DILEWATI[kunci]].sort((a, b) => a - b);
  }
  return { UKUR, DILEWATI: dilewati };
}

function serialManifest(peta = bangunManifest()) {
  const badan = `export const UKUR = ${JSON.stringify(peta.UKUR, null, 2)};\n\nexport const DILEWATI = ${JSON.stringify(peta.DILEWATI, null, 2)};\n`;
  return `${KEPALA}${badan}`;
}

function tulisManifest() {
  const peta = bangunManifest();
  mkdirSync(path.dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, serialManifest(peta), "utf8");
  return peta;
}

/** Catat "lebar ini sengaja tidak dibuat" agar --cek tidak menuntutnya lagi. */
function tandaiDilewati(jalurRel, lebar) {
  const peta = bangunManifest();
  const daftar = new Set(peta.DILEWATI[`/${jalurRel}`] ?? []);
  daftar.add(lebar);
  peta.DILEWATI[`/${jalurRel}`] = [...daftar].sort((a, b) => a - b);
  mkdirSync(path.dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, serialManifest(peta), "utf8");
}

/* -------------------------------------------------------------------- inti */

function utama() {
  const argv = process.argv.slice(2);
  const paksa = argv.includes("--paksa");
  const cek = argv.includes("--cek");

  if (cek) {
    const peta = bangunManifest();
    const kurang = [];
    for (const r of bangunRencana()) {
      const kunci = `/${r.jalur}`;
      const sudahDiputuskan = (peta.DILEWATI[kunci] ?? []).includes(r.lebar);
      const terdaftar = peta.UKUR[kunci]?.[2]?.includes(r.lebar);
      if (!terdaftar && !sudahDiputuskan)
        kurang.push(namaVarian(r.jalur, r.lebar));
    }
    for (const k of kurang) console.log(`  kurang: ${k}`);
    if (kurang.length) {
      console.error(
        `\n${kurang.length} varian responsif belum dibuat. Jalankan: ` +
          "node scripts/optimumkan-gambar.mjs",
      );
      process.exitCode = 1;
      return;
    }
    const lama = existsSync(MANIFEST) ? readFileSync(MANIFEST, "utf8") : "";
    if (lama !== serialManifest(peta)) {
      console.error(
        "src/data/ukur-gambar.js tidak sesuai dengan isi public/images/. " +
          "Jalankan: node scripts/optimumkan-gambar.mjs",
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      `Gambar responsif & manifest src/data/ukur-gambar.js selaras ` +
        `(${Object.keys(peta.UKUR).length} gambar terdaftar).`,
    );
    return;
  }

  const im = pilihIM();
  if (!im) {
    console.error(
      "ImageMagick dengan dukungan WebP tidak ditemukan, jadi varian tidak " +
        "bisa dibuat. Pasang `imagemagick` lalu jalankan ulang skrip ini.",
    );
    process.exitCode = 1;
    return;
  }

  let dibuat = 0;
  let hemat = 0;
  let dilewati = 0;
  for (const r of bangunRencana()) {
    const keluaranRel = namaVarian(r.jalur, r.lebar);
    if (!paksa && varianBerguna(r.jalur, r.lebar)) continue;
    const hasil = varianTerbaik(im, r.jalur, r.lebar, r.kualitas);
    if (!hasil) {
      tandaiDilewati(r.jalur, r.lebar);
      dilewati += 1;
      console.log(
        `  - ${keluaranRel} dilewati (tidak lebih ramping dari aslinya)`,
      );
      continue;
    }
    dibuat += 1;
    const selisih = ukuranBerkas(path.join(PUB, r.jalur)) - hasil.ukuran;
    hemat += selisih;
    console.log(
      `  + ${keluaranRel} (${kiB(hasil.ukuran)}, q${hasil.kualitas}, hemat ${kiB(selisih)})`,
    );
  }

  const peta = tulisManifest();
  const denganVarian = Object.values(peta.UKUR).filter(
    (e) => e[2].length,
  ).length;
  console.log(
    `\n${dibuat} varian dibuat, ${dilewati} dilewati; ${kiB(hemat)} byte tidak lagi ` +
      `diunduh ponsel. Manifest: src/data/ukur-gambar.js ` +
      `(${denganVarian} gambar tercatat punya varian).`,
  );
  console.log("Commit hasilnya: public/images/ dan src/data/ukur-gambar.js");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  utama();
}
