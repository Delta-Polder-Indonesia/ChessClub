/**
 * Validasi daftar soal quiz catur (src/halaman/QuizCatur/daftar.js).
 * Dijalankan lewat: npm run uji:quiz
 */
import { SOAL_CATUR, DAFTAR_KATEGORI } from "../src/halaman/QuizCatur/daftar.js";

const idKategori = new Set(DAFTAR_KATEGORI.map((k) => k.id));
let gagal = 0;
const cek = (kondisi, pesan) => {
  if (kondisi) return;
  gagal++;
  console.error(`  ❌ ${pesan}`);
};
const okCount = (pesan) => console.log(`  ✅ ${pesan}`);

console.log(`\nMemeriksa ${SOAL_CATUR.length} soal…`);

SOAL_CATUR.forEach((s, i) => {
  const n = i + 1;
  cek(s && typeof s.soal === "string" && s.soal.trim().length > 0, `[${n}] soal kosong.`);
  cek(Array.isArray(s.pilihan) && s.pilihan.length >= 2, `[${n}] harus punya minimal 2 pilihan.`);
  cek(
    typeof s.kunci === "number" &&
      Number.isInteger(s.kunci) &&
      s.kunci >= 0 &&
      s.kunci < (s.pilihan?.length || 0),
    `[${n}] "kunci" (${s.kunci}) harus indeks pilihan yang sah (0–${(s.pilihan?.length || 1) - 1}).`
  );
  cek(
    idKategori.has(s.kategori),
    `[${n}] kategori "${s.kategori}" tidak ada di DAFTAR_KATEGORI.`
  );
  // Pastikan tidak ada pilihan ganda (pertanyaan ambigu).
  if (Array.isArray(s.pilihan)) {
    const set = new Set(s.pilihan.map((p) => String(p).trim()));
    cek(set.size === s.pilihan.length, `[${n}] ada pilihan yang duplikat.`);
  }
});

// Kategori tanpa soal? (opsional — beri tahu saja)
const dipakai = new Set(SOAL_CATUR.map((s) => s.kategori));
for (const k of DAFTAR_KATEGORI) {
  if (!dipakai.has(k.id)) console.log(`  ℹ️  Kategori "${k.id}" belum ada soalnya.`);
}

if (gagal) {
  console.log(`\nQuiz: ${gagal} masalah ditemukan. Perbaiki daftar.js dulu.\n`);
  process.exit(1);
}
okCount(`${SOAL_CATUR.length} soal valid.`);
console.log(`\nQuiz: semua soal lolos validasi.\n`);
