#!/usr/bin/env node
/**
 * uji-gambar.mjs — pagar kecil untuk optimasi gambar.
 *
 * PageSpeed tidak bisa diperbaiki sekali lalu dilupakan: gambar baru yang
 * ditaruh di public/images tanpa varian responsif, atau srcset yang menunjuk
 * berkas yang tidak ada, diam-diam mengembalikan berat halaman. Skrip ini
 * memeriksa tiga hal (tanpa ImageMagick, bisa jalan di CI):
 *
 *   1. manifest src/data/ukur-gambar.js sesuai dengan isi public/images/
 *      (dipercayakan ke `optimumkan-gambar.mjs --cek`);
 *   2. setiap varian yang dijanjikan manifest benar-benar ada di public/;
 *   3. tidak ada berkas gambar > BATAS_KECIL di public/images yang belum
 *      punya varian responsif — kalau ada, jalankan skrip optimumkan.
 */
import { execFileSync } from "node:child_process";
import { bangunRencana, berkasTarget, namaVarian } from "./optimumkan-gambar.mjs";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(fileURLToPath(import.meta.url), "../..");
const PUB = path.join(AKAR, "public");
const MANIFEST = path.join(AKAR, "src", "data", "ukur-gambar.js");

/** Gambar sebesar ini (± 3× tampilan sampul e-book) harus punya varian. */
const BATAS_KECIL = 28 * 1024;

function muat() {
  if (!existsSync(MANIFEST)) return null;
  const teks = readFileSync(MANIFEST, "utf8");
  const potong = (nama) => {
    const mulai = teks.indexOf(`${nama} = {`);
    if (mulai < 0) return null;
    const awal = teks.indexOf("{", mulai);
    let dalam = 0;
    for (let i = awal; i < teks.length; i += 1) {
      if (teks[i] === "{") dalam += 1;
      else if (teks[i] === "}" && --dalam === 0) {
        return JSON.parse(
          teks.slice(awal, i + 1).replace(/,\s*([}\]])/g, "$1"),
        );
      }
    }
    return null;
  };
  const UKUR = potong("UKUR");
  const DILEWATI = potong("DILEWATI") ?? {};
  return UKUR ? { UKUR, DILEWATI } : null;
}

function webPAsli(dirRelatif) {
  const dir = path.join(PUB, dirRelatif);
  if (!existsSync(dir)) return [];
  const hasil = [];
  for (const nama of readdirSync(dir)) {
    const abs = path.join(dir, nama);
    if (statSync(abs).isDirectory()) {
      for (const n of webPAsli(path.posix.join(dirRelatif, nama)))
        hasil.push(n);
      continue;
    }
    if (!/\.webp$/i.test(nama) || /-\d{2,4}\.webp$/i.test(nama)) continue;
    hasil.push(`${dirRelatif}/${nama}`);
  }
  return hasil;
}

function utama() {
  const galat = [];
  // Gambar yang masuk daftar TARGET skrip optimumkan-gambar — satu sumber
  // aturan, jadi uji ini tidak bisa berbeda pendapat dengan generatornya.
  const TARGET_SET = new Set(berkasTarget().map((j) => `/${j}`));

  const peta = muat();
  if (!peta) {
    console.error(
      "src/data/ukur-gambar.js tidak ditemukan. Jalankan: node scripts/optimumkan-gambar.mjs",
    );
    process.exitCode = 1;
    return;
  }

  // (2) Varian yang dijanjikan TARGET & manifest harus ada di public/.
  const perlu = new Map();
  for (const r of bangunRencana()) {
    perlu.set(`${r.jalur}@${r.lebar}`, `/${namaVarian(r.jalur, r.lebar)}`);
  }
  for (const [kunci, entri] of Object.entries(peta.UKUR)) {
    const [, , varian = []] = entri;
    for (const lebar of varian) {
      const jalur = `/${namaVarian(kunci.slice(1), lebar)}`;
      perlu.set(`${kunci.slice(1)}@${lebar}`, jalur);
    }
  }
  for (const [kunci, jalur] of perlu) {
    const [jalurAsal, lebar] = kunci.split("@");
    if (peta.DILEWATI[`/${jalurAsal}`]?.includes(Number(lebar))) continue;
    if (!existsSync(path.join(PUB, jalur))) {
      galat.push(
        `${jalur} belum dibuat — jalankan: node scripts/optimumkan-gambar.mjs`,
      );
    }
  }

  // (3) Gambar besar yang dipakai komponen wajib punya varian atau keputusan
  //     "dilewati". Yang di luar daftar TARGET skrip dibiarkan: tidak semua
  //     berkas di public/images tampil pada ukuran kecil.
  const besarTanpaVarian = [];
  for (const jalur of webPAsli("images")) {
    const kunci = `/${jalur}`;
    if (!TARGET_SET.has(kunci)) continue;
    const ukuran = statSync(path.join(PUB, jalur)).size;
    if (ukuran <= BATAS_KECIL) continue;
    if (peta.UKUR[kunci]?.[2]?.length) continue;
    if (peta.DILEWATI[kunci]?.length) continue;
    besarTanpaVarian.push(`${kunci} (${(ukuran / 1024).toFixed(0)} KiB)`);
  }
  if (besarTanpaVarian.length) {
    galat.push(
      "gambar besar tanpa varian responsif:\n    " +
        besarTanpaVarian.join("\n    ") +
        "\n    jalankan: node scripts/optimumkan-gambar.mjs",
    );
  }

  if (galat.length) {
    for (const g of galat) console.error(`  ✗ ${g}`);
    process.exitCode = 1;
    return;
  }

  const total = Object.keys(peta.UKUR).length;
  const kandidat = Object.values(peta.UKUR).reduce(
    (a, e) => a + e[2].length,
    0,
  );
  console.log(
    `OK — ${total} gambar responsif, ${kandidat} varian terdaftar di public/.`,
  );

  // (1) Sinkron dengan disk — pakai skrip pembuatnya supaya aturannya satu sumber.
  execFileSync(
    process.execPath,
    [path.join(AKAR, "scripts", "optimumkan-gambar.mjs"), "--cek"],
    {
      stdio: "inherit",
    },
  );
}

utama();
