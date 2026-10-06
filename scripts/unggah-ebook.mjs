#!/usr/bin/env node
/**
 * Unggah e-book PDF (public/ebooks/*.pdf) ke Supabase Storage.
 *
 * Mengapa: PDF e-book (±484 MB) kini disimpan sebagai blob Git biasa di repo.
 * Itu membuat setiap klon/deploy ikut mengangkut seluruh koleksi, dan dulu
 * (saat masih Git LFS) situs menyajikan "pointer" bila checkout tidak menarik
 * LFS. Dengan object storage privat, PDF dilayani API dari Supabase dan repo
 * bisa berhenti menyimpan binari besar.
 *
 * Jalankan SATU KALI dari mesin yang sudah punya PDF asli (klon biasa sudah
 * cukup sejak PDF tidak lagi lewat Git LFS; cek: berkas harus diawali %PDF):
 *   SUPABASE_URL=https://<proyek>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<kunci-service-role> \
 *   npm run ebook:unggah
 *
 * Skrip ini:
 *   1. Memastikan bucket privat `ebooks-private` tersedia (dibuat bila belum ada).
 *   2. Mengunggah tiap PDF (lewat signed upload = mendukung file besar).
 *   3. Tidak menulis URL storage ke bundle frontend; API production membaca
 *      bucket ini memakai service-role key.
 *
 * Env dibaca dari process.env atau berkas .env (tanpa menimpa env yang ada).
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_EBOOK = path.join(AKAR, "public", "ebooks");
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

const BUCKET = (process.env.KCI_EBOOK_PRIVATE_BUCKET || "ebooks-private").trim();
const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
if (!url) {
  gagal(
    "SUPABASE_URL belum diisi. Set di .env atau sebagai environment variable, lalu jalankan lagi."
  );
}
const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!kunci) {
  gagal(
    "SUPABASE_SERVICE_ROLE_KEY belum diisi. Bucket e-book privat hanya boleh diubah dengan service role key dari Project Settings → API."
  );
}

const supabase = createClient(url, kunci, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* 1) Pastikan bucket privat tersedia. */
let bucketAda = false;
const { data: daftar, error: errDaftar } = await supabase.storage.listBuckets();
if (!errDaftar) {
  bucketAda = (daftar || []).some((b) => b.name === BUCKET);
}
if (!bucketAda) {
  const { error: errBuat } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: "1GB",
    allowedMimeTypes: ["application/pdf"],
  });
  if (errBuat && !/already exists/i.test(errBuat.message)) {
    gagal(`Gagal membuat bucket "${BUCKET}": ${errBuat.message}`);
  }
  console.log(`✓ Bucket privat "${BUCKET}" siap.`);
} else {
  const { error: errPrivat } = await supabase.storage.updateBucket(BUCKET, { public: false });
  if (errPrivat) {
    gagal(`Gagal memastikan bucket "${BUCKET}" privat: ${errPrivat.message}`);
  }
  console.log(`✓ Bucket privat "${BUCKET}" sudah ada.`);
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

console.log("\n✓ Semua PDF berada di bucket privat dan tidak ditulis ke bundle frontend.");
console.log("\nLangkah selanjutnya:");
console.log("  1. Set KCI_EBOOK_PRIVATE_BUCKET (bila bukan ebooks-private) di Vercel.");
console.log("  2. Pastikan SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY tersedia di Vercel.");
console.log("  3. Redeploy Vercel, lalu buka E-Book & Panduan → Baca.");
console.log("  4. Uji GET /ebooks/<nama>.pdf tanpa tiket — hasilnya harus 403.");
