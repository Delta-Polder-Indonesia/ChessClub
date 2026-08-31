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
 *      punya varian responsif — kalau ada, jalankan skrip optimumkan;
 *   4. src/lib/asets.js bisa dijalankan dan srcset yang dihasilkannya
 *      menunjuk berkas yang sungguh ada.
 */
import { execFileSync } from "node:child_process";
import {
  bangunRencana,
  berkasTarget,
  namaVarian,
} from "./optimumkan-gambar.mjs";
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

/**
 * (4) Jalankan helper srcset sungguhan — tanpa browser.
 *
 * `sumberGambar()` dipakai langsung oleh <img> di banyak komponen, dan
 * kesalahan di dalamnya (variabel tak ter-declare, kunci manifest salah
 * bentuk) tidak terlihat oleh `vite build`: modul tetap terkompresi, halaman
 * baru putih saat dibuka. Jadi modulnya di-bundle lewat esbuild dengan
 * import.meta.env ditambal, lalu datanya diperiksa — sekaligus setiap URL yang
 * akan dikirim ke browser harus benar-benar ada di public/.
 */
async function periksaHelper(peta) {
  let esbuild;
  try {
    esbuild = await import("esbuild");
  } catch {
    console.log("  (helper asets.js dilewati — esbuild tidak tersedia)");
    return [];
  }
  const { outputFiles } = await esbuild.build({
    absWorkingDir: AKAR,
    entryPoints: [path.join(AKAR, "src", "lib", "asets.js")],
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    define: {
      "import.meta.env": JSON.stringify({
        BASE_URL: "/",
        DEV: false,
        PROD: true,
      }),
    },
  });
  const kode = Buffer.from(outputFiles[0].text).toString("utf8");
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(kode).toString("base64")}`
  );

  const salah = (teks) => `sumberGambar(): ${teks}`;
  const ada = (url) => existsSync(path.join(PUB, decodeURIComponent(url)));

  // Gambar yang tidak terdaftar di manifest → <img> biasa, tanpa srcset.
  const asing = mod.sumberGambar("/images/tidak-terdaftar.jpg");
  if (asing.srcSet || asing.width) {
    return [salah("gambar tak terdaftar tidak boleh diberi srcset/width")];
  }
  if (asing.src !== "/images/tidak-terdaftar.webp") {
    return [salah(`ekstensi gambar tak terdaftar salah: ${asing.src}`)];
  }

  const hasil = [];
  for (const [kunci, [lebar, tinggi, varian = []]] of Object.entries(
    peta.UKUR,
  )) {
    const s = mod.sumberGambar(kunci.replace(/\.webp$/i, ".jpg"));
    if (s.src !== kunci) hasil.push(salah(`${kunci}: src = ${s.src}`));
    if (s.width !== lebar || s.height !== tinggi) {
      hasil.push(
        salah(`${kunci}: dimensi ${s.width}×${s.height} ≠ ${lebar}×${tinggi}`),
      );
    }
    const url = String(s.srcSet || "")
      .split(",")
      .map((bagian) => bagian.trim().split(/\s+/)[0])
      .filter(Boolean);
    if (url.length !== varian.filter((l) => l < lebar).length + 1) {
      hasil.push(
        salah(
          `${kunci}: srcset punya ${url.length} kandidat, seharusnya ${varian.length + 1}`,
        ),
      );
    }
    for (const u of url)
      if (!ada(u))
        hasil.push(salah(`${kunci}: srcset menunjuk ${u} yang tidak ada`));
    if (!ada(s.src))
      hasil.push(salah(`${kunci}: src ${s.src} tidak ada di public/`));
  }

  const hero = mod.sumberHero("/images/tonggak-2015.jpg");
  if (hero.srcSet || hero.sizes) {
    hasil.push(salah("hero tak boleh menjanjikan srcSet (varian sudah tidak ada)"));
  }
  if (hero.src !== "/images/tonggak-2015.webp" || !ada(hero.src)) {
    hasil.push(salah(`hero menunjuk ${hero.src}, bukan berkas yang ada`));
  }
  return hasil;
}

async function utama() {
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

  // (4) Helper srcset harus benar-benar berjalan dan hanya menunjuk berkas
  //     yang ada — lihat dokumen fungsi di atas.
  try {
    galat.push(...(await periksaHelper(peta)));
  } catch (e) {
    galat.push(`helper asets.js gagal dievaluasi: ${e.message}`);
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

await utama();
