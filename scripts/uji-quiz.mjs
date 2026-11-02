/**
 * Validasi daftar soal quiz catur (src/halaman/QuizCatur/daftar.js).
 * Dijalankan lewat: npm run uji:quiz
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";
import { SOAL_CATUR, DAFTAR_KATEGORI, IKON_KATEGORI } from "../src/halaman/QuizCatur/daftar.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const idKategori = new Set(DAFTAR_KATEGORI.map((k) => k.id));
const pertanyaan = new Set();
const distribusiDiharapkan = {
  peraturan: 13,
  bidak: 13,
  skakmat: 9,
  taktik: 10,
  pembukaan: 10,
  strategi: 10,
  endgame: 10,
  notasi: 10,
  sejarah: 8,
  umum: 7,
  grandmaster: 15,
};
let gagal = 0;
const cek = (kondisi, pesan) => {
  if (kondisi) return;
  gagal++;
  console.error(`  ❌ ${pesan}`);
};
const okCount = (pesan) => console.log(`  ✅ ${pesan}`);

console.log(`\nMemeriksa ${SOAL_CATUR.length} soal…`);
cek(DAFTAR_KATEGORI.length === 11, `Jumlah kategori harus 11, saat ini ${DAFTAR_KATEGORI.length}.`);
cek(SOAL_CATUR.length === 115, `Jumlah soal harus tepat 115, saat ini ${SOAL_CATUR.length}.`);

const jumlahPerKategori = new Map();

SOAL_CATUR.forEach((s, i) => {
  const n = i + 1;
  cek(s && typeof s.soal === "string" && s.soal.trim().length > 0, `[${n}] soal kosong.`);
  cek(Array.isArray(s.pilihan) && s.pilihan.length >= 2 && s.pilihan.length <= 6, `[${n}] harus punya 2–6 pilihan.`);
  cek(
    typeof s.kunci === "number" &&
      Number.isInteger(s.kunci) &&
      s.kunci >= 0 &&
      s.kunci < (s.pilihan?.length || 0),
    `[${n}] "kunci" (${s.kunci}) harus indeks pilihan yang sah.`
  );
  cek(idKategori.has(s.kategori), `[${n}] kategori "${s.kategori}" tidak ada di DAFTAR_KATEGORI.`);

  if (typeof s.soal === "string") {
    const normal = s.soal.trim().toLowerCase().replace(/\s+/g, " ");
    cek(!pertanyaan.has(normal), `[${n}] pertanyaan duplikat.`);
    pertanyaan.add(normal);
  }

  if (Array.isArray(s.pilihan)) {
    const set = new Set(s.pilihan.map((p) => String(p).trim().toLowerCase()));
    cek(set.size === s.pilihan.length, `[${n}] ada pilihan yang duplikat.`);
  }

  if (s.fen !== undefined) {
    let papan;
    try {
      papan = new Chess(s.fen);
    } catch {
      papan = null;
    }
    cek(Boolean(papan), `[${n}] FEN diagram kuis tidak sah.`);
    if (papan && Array.isArray(s.pilihan)) {
      const langkahLegal = new Set(papan.moves());
      for (const san of s.pilihan) {
        cek(langkahLegal.has(san), `[${n}] pilihan "${san}" bukan langkah legal pada FEN soal.`);
      }
      if (s.langkahBenar) {
        const detail = papan
          .moves({ verbose: true })
          .find((m) => m.san === s.pilihan[s.kunci]);
        cek(
          Boolean(detail) &&
            detail.from === s.langkahBenar.from &&
            detail.to === s.langkahBenar.to,
          `[${n}] langkahBenar tidak cocok dengan jawaban kunci "${s.pilihan[s.kunci]}".`
        );
      }
    }
  }

  jumlahPerKategori.set(s.kategori, (jumlahPerKategori.get(s.kategori) || 0) + 1);
});

for (const k of DAFTAR_KATEGORI) {
  const aktual = jumlahPerKategori.get(k.id) || 0;
  const diharapkan = distribusiDiharapkan[k.id];
  cek(aktual === diharapkan, `Kategori "${k.id}": ${aktual} soal, diharapkan ${diharapkan}.`);
}

/*
 * Ikon kategori: dahulu empat kategori (taktik, strategi, endgame, notasi)
 * tidak punya entri sehingga `berkasPublik(undefined)` menghasilkan src kosong
 * dan ikonnya hilang di 40 dari 100 soal. Penjaga ini memastikan setiap id
 * kategori punya ikon DAN berkasnya benar-benar ada di `public/`.
 */
for (const k of DAFTAR_KATEGORI) {
  const ikon = IKON_KATEGORI[k.id];
  cek(typeof ikon === "string" && ikon.length > 0, `Kategori "${k.id}" belum punya ikon di IKON_KATEGORI.`);
  if (typeof ikon === "string" && ikon.startsWith("/")) {
    const berkas = path.join(AKAR, "public", ikon.replace(/^\//, ""));
    cek(existsSync(berkas), `Berkas ikon kategori "${k.id}" tidak ada: public${ikon}.`);
  }
}
cek(
  typeof IKON_KATEGORI.semua === "string" && IKON_KATEGORI.semua.length > 0,
  "Ikon cadangan IKON_KATEGORI.semua wajib ada."
);

if (gagal) {
  console.log(`\nQuiz: ${gagal} masalah ditemukan. Perbaiki daftar.js dulu.\n`);
  process.exit(1);
}
okCount(`${SOAL_CATUR.length} soal valid.`);
console.log(`\nQuiz: semua soal lolos validasi.\n`);
