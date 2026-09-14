/**
 * Uji tabel "langkah buku" halaman Analisa (`mesin/buku.js` + label "book").
 *
 * Regresi yang dikunci — pernah membuat "di awal langkah tidak ada notif
 * basis opening book":
 *
 *  1. Pencarian nama pembukaan dari FEN (posisi sungguhan → nama + ECO).
 *  2. Kegagalan unduh TIDAK di-cache: analisis berikutnya mencoba lagi
 *     (dulu janji gagal tersimpan selamanya → label buku hilang seharian).
 *  3. `getMoveRating` memberi label "book" + nama pembukaan sebagai komentar
 *     untuk langkah yang posisinya ada di buku.
 *
 * Catatan: balapan "analisis mulai sebelum buku selesai diunduh" diperbaiki
 * di `game.jsx` (handlePGN/analyzeMove menunggu janji buku yang sama sebelum
 * menilai) — perilaku komponennya tidak diuji di sini, yang diuji adalah
 * janji bersama + logika labelnya.
 *
 * Jalankan: node scripts/uji-buku-analisa.mjs
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bukuAsli = JSON.parse(await readFile(path.join(ROOT, "public/data/buku-analisa.json"), "utf8"));

let lulus = 0;
let gagal = 0;

async function uji(nama, jalan) {
  try {
    await jalan();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal++;
    console.error(`  ✗ ${nama}\n    ${galat?.message ?? galat}`);
    process.exitCode = 1;
  }
}

/* fetch tiruan: gagal dulu (simulasi unduhan pertama putus), lalu berhasil. */
let hitungFetch = 0;
let modeGagal = true;
globalThis.fetch = async () => {
  hitungFetch++;
  if (modeGagal) throw new Error("jaringan putus");
  return { ok: true, json: async () => bukuAsli };
};

const { muatBuku, cariNamaPembukaan } = await import("../src/halaman/Analisa/mesin/buku.js");
const { getMoveRating } = await import("../src/halaman/Analisa/mesin/penilaian.js");

console.log("Tabel buku analisa");

await uji("unduhan gagal mengembalikan peta kosong (analisis tetap jalan)", async () => {
  const peta = await muatBuku();
  assert.deepEqual(peta, {});
  assert.equal(hitungFetch, 1);
});

await uji("kegagalan tidak di-cache: panggilan berikut mengunduh ulang", async () => {
  modeGagal = false;
  const peta = await muatBuku();
  assert.ok(Object.keys(peta).length > 10000);
  assert.equal(hitungFetch, 2);
});

await uji("posisi sungguhan dikenali (Ruy Lopez)", async () => {
  const cari = await cariNamaPembukaan();
  assert.equal(typeof cari, "function");
  // FEN sesudah 1.e4 e5 2.Nf3 Nc6 3.Bb5 (lengkap dengan penghitung langkah).
  const fen = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";
  assert.equal(cari(fen), "Ruy Lopez (C60)");
});

await uji("penghitung langkah diabaikan (posisi sama, nomor beda, tetap kena)", async () => {
  const cari = await cariNamaPembukaan();
  const fen = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 99 45";
  assert.equal(cari(fen), "Ruy Lopez (C60)");
});

await uji("posisi di luar buku mengembalikan undefined", async () => {
  const cari = await cariNamaPembukaan();
  assert.equal(cari("4k3/8/8/8/8/8/8/4K3 w - - 0 1"), undefined);
});

console.log("\nLabel langkah buku");

await uji("langkah di buku → rating 'book' + nama pembukaan sebagai komentar", () => {
  const cari = (fen) => bukuAsli[String(fen).trim().split(/\s+/).slice(0, 4).join(" ")];
  const hasil = getMoveRating({
    staticEval: ["cp", "20"],
    previousStaticEvals: [["cp", "25"]],
    bestMoveSan: "e4",
    moveSan: "e4",
    // FEN persis keluaran chess.js sesudah 1.e4 (petak en passant "-").
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    color: "w",
    sacrifice: false,
    previousSacrifice: false,
    openings: cari,
  });
  assert.equal(hasil.moveRating, "book");
  assert.equal(hasil.comment, "King's Pawn Game (B00)");
});

await uji("tanpa buku ({}) → rating normal, bukan 'book'", () => {
  const hasil = getMoveRating({
    staticEval: ["cp", "20"],
    previousStaticEvals: [["cp", "25"]],
    bestMoveSan: "e4",
    moveSan: "e4",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    color: "w",
    sacrifice: false,
    previousSacrifice: false,
    openings: {},
  });
  assert.notEqual(hasil.moveRating, "book");
});

console.log(`\n${lulus} lulus, ${gagal} gagal.`);
if (gagal > 0) process.exitCode = 1;
