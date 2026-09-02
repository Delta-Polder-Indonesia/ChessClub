#!/usr/bin/env node
/**
 * Unggah e-book PDF (public/ebooks/*.pdf) ke Supabase Storage.
 *
 * Mengapa: PDF e-book (±500 MB) selama ini disimpan lewat Git LFS, yang
 * membebani bandwidth LFS GitHub dan membuat situs menyajikan "pointer"
 * bila checkout tidak menarik LFS. Dengan object storage, PDF dilayani
 * langsung dari Supabase — bebas dari Git LFS.
 *
 * Jalankan SATU KALI dari mesin yang sudah punya PDF asli
 * (pastikan `git lfs pull` sudah dijalankan; cek: berkas harus diawali %PDF):
 *   SUPABASE_URL=https://<proyek>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<kunci-service-role> \
 *   npm run ebook:unggah
 *
 * Skrip ini:
 *   1. Memastikan bucket publik `ebooks` tersedia (dibuat bila belum ada).
 *   2. Mengunggah tiap PDF (lewat signed upload = mendukung file besar).
 *   3. Menulis basis URL ke src/data/ebook-storage.js agar frontend
 *      otomatis memakai URL storage pada build berikutnya.
 *
 * Env dibaca dari process.env atau berkas .env (tanpa menimpa env yang ada).
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_EBOOK = path.join(AKAR, "public", "ebooks");
const BERKAS_STORAGE = path.join(AKAR, "src", "data", "ebook-storage.js");
const BUCKET = "ebooks";

/* -- Muat berkas .env bila ada (tidak menimpa env yang sudah disetel). -- */
function muatEnv() {
  const berkas = path.join(AKAR, ".env");
  if (!existsSync(berkas)) return;
  const isi = readFileSync(berkas, "utf8");
  for (const baris of isi.split("\n")) {
    const s = baris.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const i = s.indexOf("=");
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function gagal(teks) {
  console.error(`\n✗ ${teks}\n`);
  process.exit(1);
}

muatEnv();

const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
if (!url) {
  gagal(
    "SUPABASE_URL belum diisi. Set di .env atau sebagai environment variable, lalu jalankan lagi."
  );
}
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!kunci) {
  gagal(
    "SUPABASE_SERVICE_ROLE_KEY belum diisi. Pakai kunci service role dari Project Settings → API."
  );
}

const supabase = createClient(url, kunci, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* 1) Pastikan bucket publik `ebooks` tersedia. */
let bucketAda = false;
const { data: daftar, error: errDaftar } = await supabase.storage.listBuckets();
if (!errDaftar) {
  bucketAda = (daftar || []).some((b) => b.name === BUCKET);
}
if (!bucketAda) {
  const { error: errBuat } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "1GB",
    allowedMimeTypes: ["application/pdf"],
  });
  if (errBuat && !/already exists/i.test(errBuat.message)) {
    gagal(`Gagal membuat bucket "${BUCKET}": ${errBuat.message}`);
  }
  console.log(`✓ Bucket publik "${BUCKET}" siap.`);
} else {
  console.log(`✓ Bucket "${BUCKET}" sudah ada.`);
}

/* 2) Daftar PDF lokal yang berisi PDF asli (bukan pointer LFS). */
const berkas = (await readdir(DIR_EBOOK))
  .filter((f) => f.toLowerCase().endsWith(".pdf"))
  .sort();

let sukses = 0;
let dilewati = 0;
let gagalCount = 0;

for (const nama of berkas) {
  const jalur = path.join(DIR_EBOOK, nama);
  const isi = await readFile(jalur);
  const kepala = isi.slice(0, 4).toString("utf8");
  if (kepala !== "%PDF") {
    console.log(`  ~ lewati ${nama}: bukan PDF asli (pointer LFS?) — jalankan "git lfs pull" dulu.`);
    dilewati++;
    continue;
  }

  const { data: tanda, error: errTanda } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(nama, { upsert: true });
  if (errTanda || !tanda?.signedUrl) {
    console.error(`  ✗ ${nama}: gagal membuat tautan unggah — ${errTanda?.message || "tanpa tautan"}`);
    gagalCount++;
    continue;
  }

  const { error: errUnggah } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(tanda.path, tanda.token, isi, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (errUnggah) {
    console.error(`  ✗ ${nama}: ${errUnggah.message}`);
    gagalCount++;
    continue;
  }
  console.log(`  ✓ ${nama} (${(isi.length / 1048576).toFixed(1)} MB)`);
  sukses++;
}

console.log(
  `\nRingkasan: ${sukses} berhasil, ${dilewati} dilewati, ${gagalCount} gagal.`
);
if (gagalCount) {
  gagal("Ada berkas yang gagal diunggah — perbaiki penyebabnya lalu jalankan ulang (idempoten).");
}

/* 3) Tulis basis URL ke konfigurasi frontend. */
const basis = `${url}/storage/v1/object/public/${BUCKET}`;
let teks = await readFile(BERKAS_STORAGE, "utf8");
if (!/export const EBOOK_BASE = "[^"]*";/.test(teks)) {
  gagal(`Pola EBOOK_BASE tidak ditemukan di ${BERKAS_STORAGE}`);
}
teks = teks.replace(/export const EBOOK_BASE = "[^"]*";/, `export const EBOOK_BASE = "${basis}";`);
await writeFile(BERKAS_STORAGE, teks, "utf8");

console.log(`\n✓ ${BERKAS_STORAGE} diperbarui dengan:`);
console.log(`    ${basis}`);
console.log("\nLangkah selanjutnya:");
console.log("  1. Commit perubahan (khususnya src/data/ebook-storage.js), lalu push.");
console.log("  2. Redeploy Vercel (dan/atau GitHub Pages).");
console.log("  3. Buka halaman E-Book & Panduan → klik Baca untuk memastikan PDF tampil.");
console.log("\nCatatan: CSP frame-src di index.html & vercel.json sudah mengizinkan");
console.log("https://*.supabase.co. Bila Anda memakai penyedia lain, tambahkan origin-nya di sana.");
