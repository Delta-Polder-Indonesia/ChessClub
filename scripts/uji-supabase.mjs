#!/usr/bin/env node
/**
 * Uji integrasi Supabase secara nyata.
 *
 * Menjalankan KODE PENYIMPANAN yang sama dengan backend (storage-supabase.js)
 * untuk memastikan:
 *   1. Env SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY terisi.
 *   2. Tabel `kci_storage` bisa diakses.
 *   3. Proses tulis → baca → hapus (round-trip) benar-benar bekerja.
 *
 * Gunakan:  npm run uji:supabase
 *
 * Nilai env dibaca dari `process.env` atau berkas `.env` (jika ada).
 * Untuk atur cepat:
 *   SUPABASE_URL=https://<proyek>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<kunci-service-role> \
 *   npm run uji:supabase
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* -- Muat berkas .env bila ada (tanpa menimpa env yang sudah disetel). -- */
function muatEnv() {
  const berkas = path.join(AKAR, ".env");
  if (!fs.existsSync(berkas)) return;
  for (const baris of fs.readFileSync(berkas, "utf8").split("\n")) {
    const s = baris.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const i = s.indexOf("=");
    const k = s.slice(0, i).trim();
    let v = s.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

function gagal(teks) {
  console.error(`\n✗ ${teks}\n`);
  process.exit(1);
}
function sukses(teks) {
  console.log(`✓ ${teks}`);
}

muatEnv();
process.env.NODE_ENV = process.env.NODE_ENV || "development";

/* Bare setelah env siap agar konfigurasi terbaca saat import. */
const { kesehatanSupabase, tulisJsonSupabase, bacaJsonSupabase, hapusJsonSupabase } =
  await import("../server/src/storage-supabase.js");
const { konfigurasi } = await import("../server/src/konfigurasi.js");

console.log("Uji integrasi Supabase — tabel kci_storage\n");

if (!konfigurasi.supabase.url) {
  gagal(
    "SUPABASE_URL belum diisi. Set di Vercel/Environment Variables atau di .env, lalu jalankan lagi."
  );
}
if (!konfigurasi.supabase.serviceRole && !konfigurasi.supabase.anon) {
  gagal(
    "SUPABASE_SERVICE_ROLE_KEY (atau SUPABASE_ANON_KEY) belum diisi. Gunakan kunci service role untuk produksi."
  );
}

const status = await kesehatanSupabase();
if (!status.terpasang) {
  gagal("Variabel env Supabase belum lengkap.");
}
if (!status.siap) {
  gagal(
    `Tabel "${status.tabel}" belum dapat diakses. Jalankan db/supabase-schema.sql di SQL Editor Supabase, lalu ulangi.`
  );
}
sukses(`Terhubung ke Supabase; tabel "${status.tabel}" tersedia.`);

/* Round-trip: tulis → baca → hapus. */
const kunci = "_uji-supabase.json";
const berkas = path.join(konfigurasi.dirData, kunci);
const nilai = { uji: true, waktu: new Date().toISOString() };

try {
  await tulisJsonSupabase(berkas, nilai);
  const kembali = await bacaJsonSupabase(berkas, null);
  if (!kembali || kembali.uji !== true) {
    await hapusJsonSupabase(berkas).catch(() => {});
    gagal("Round-trip tulis → baca gagal (nilai tidak kembali).");
  }
  sukses(`Round-trip OK: menulis & membaca kembali kunci "${kunci}" berhasil.`);
} catch (e) {
  await hapusJsonSupabase(berkas).catch(() => {});
  gagal(`Round-trip gagal: ${e?.message || e}`);
}

await hapusJsonSupabase(berkas).catch(() => {});
sukses("Baris uji dibersihkan. Integrasi Supabase AMAN digunakan — data akan tersimpan permanen.");
console.log("");
