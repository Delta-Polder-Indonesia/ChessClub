#!/usr/bin/env node
/**
 * naikkan-kualitas-gambar.mjs — upscale + rekompresi kualitas tinggi untuk
 * gambar-gambar yang ditampilkan besar (full-width/hero bagian) sehingga
 * tampilan tidak lagi pecah.
 *
 * Pendekatan: gambar asli hanya ada dalam versi kecil (dulu dikompresi
 * terlalu agresif). Kita upscale lanczos ke ukuran tampilan yang wajar dan
 * re-encode WebP dengan kualitas 87 (tidak terlalu tinggi agar ukuran tetap
 * wajar) lalu tulis ulang berkas asalnya.
 *
 * Pemakaian:
 *   node scripts/naikkan-kualitas-gambar.mjs
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const AKAR = path.resolve(fileURLToPath(import.meta.url), "../..");
const PUB_IMAGES = path.join(AKAR, "public", "images");

/** Gambar yang tampil besar → target lebar upscale (px). */
const TARGET_LEBAR = {
  "sekilas.webp": 1280,
  "tata-nilai.webp": 1280,
  "landing-sorotan-media.webp": 900,
  "landing-sorotan-program.webp": 900,
  "landing-sorotan-turnamen.webp": 900,
  "hero-about.webp": 1280,
  "harapan-terima-kasih.webp": 900,
  "landing-hero.webp": 1280,
};

/** Kualitas WebP hasil akhir. 87 = kualitas tinggi tapi tidak boros. */
const KUALITAS = 87;

function cariBerkas(rel) {
  const penuh = path.join(PUB_IMAGES, rel);
  try {
    if (statSync(penuh).isFile()) return [penuh, rel];
  } catch {}
  const dir = path.join(PUB_IMAGES, path.posix.dirname(rel));
  let ditemukan = null;
  try {
    for (const n of readdirSync(dir, { withFileTypes: true })) {
      if (!n.isFile()) continue;
      const nama = path.posix.basename(rel);
      const [core, ext] = nama.split(".");
      if (
        n.name.startsWith(core) &&
        !/-\d+\.webp$/.test(n.name) &&
        n.name.endsWith(ext ?? ".webp")
      ) {
        const dasar = nama.replace(/\.[^.]+$/, "");
        if (new RegExp("^" + dasar + "\\.|^" + dasar + "$").test(n.name)) {
          ditemukan = path.join(dir, n.name);
          break;
        }
      }
    }
  } catch {}
  return ditemukan ? [ditemukan, path.posix.join(path.posix.dirname(rel), path.posix.basename(ditemukan))] : null;
}

async function utamanya() {
  let diproses = 0;
  let dilewati = 0;
  for (const [rel, targetLebar] of Object.entries(TARGET_LEBAR)) {
    const hit = cariBerkas(rel);
    if (!hit) {
      console.log(`  ! ${rel} tidak ditemukan`);
      dilewati++;
      continue;
    }
    const [abs, relKeFile] = hit;
    const lebarAsli = await sharp(readFileSync(abs)).metadata();
    const { width } = lebarAsli;
    if (!width) {
      console.log(`  ! ${relKeFile} tidak bisa dibaca`);
      dilewati++;
      continue;
    }
    // Hanya upscale bila gambar memang lebih kecil dari target tampilan.
    if (width >= targetLebar) {
      console.log(`  = ${relKeFile} sudah ${width}px >= ${targetLebar}px, lewati`);
      dilewati++;
      continue;
    }
    const buf = await sharp(readFileSync(abs))
      .resize(targetLebar, null, { kernel: sharp.kernel.lanczos3 })
      .webp({ quality: KUALITAS, effort: 6 })
      .toBuffer();
    const lama = Math.round(readFileSync(abs).length / 1024) || 0;
    writeFileSync(abs, buf);
    const baru = Math.round(buf.length / 1024);
    console.log(
      `  + ${relKeFile}: ${width}px -> ${targetLebar}px, ${lama}KB -> ${baru}KB (q${KUALITAS})`
    );
    diproses++;
  }
  console.log(
    `\n${diproses} gambar dinaikkan kualitasnya, ${dilewati} dilewati.`
  );
}

utamanya().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
