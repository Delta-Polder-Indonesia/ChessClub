/**
 * Bangun tabel "langkah buku" untuk halaman Analisa.
 *
 * Halaman Analisa menandai langkah yang masih berada dalam teori pembukaan
 * dengan label "book" + nama pembukaannya. Data sumbernya adalah buku
 * pembukaan yang sudah dipakai situs ini (public/data/buku-pembukaan.json,
 * hasil olahan lichess-org/chess-openings, CC0) — tabel FEN pihak ketiga
 * tidak jadi dipakai karena cocoknya memakai FEN lengkap termasuk penghitung
 * langkah, sehingga nyaris tidak pernah kena.
 *
 * Hasil: public/data/buku-analisa.json — peta "4 bidang pertama FEN" → nama,
 * mis. "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq" →
 * "Italian Game". Penghitung setengah-langkah/penuh sengaja dibuang supaya
 * posisi yang sama dari partai mana pun tetap dikenali.
 *
 * Jalankan: node scripts/generasi-buku-analisa.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Chess } from "chess.js";

import { kunciFen } from "../src/halaman/Analisa/mesin/kunciFen.js";

const AKAR = path.resolve(import.meta.dirname, "..");
const SUMBER = path.join(AKAR, "public/data/buku-pembukaan.json");
const TUJUAN = path.join(AKAR, "public/data/buku-analisa.json");

const daftar = JSON.parse(await readFile(SUMBER, "utf8"));

const permainan = new Chess();
const terbaik = new Map();
let gagal = 0;

for (const entri of daftar) {
  const langkah = String(entri.moves ?? "").trim().split(/\s+/).filter(Boolean);
  if (!langkah.length) continue;

  permainan.reset();
  let rusak = false;
  for (const uci of langkah) {
    try {
      permainan.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
    } catch {
      rusak = true;
      break;
    }
  }
  if (rusak) {
    gagal++;
    continue;
  }

  const kunci = kunciFen(permainan.fen());
  const jumlah = Number(entri.games ?? 0);
  const lama = terbaik.get(kunci);
  // Satu posisi bisa muncul dari beberapa varian; pakai nama varian yang
  // paling sering dimainkan supaya labelnya paling mudah dikenali pembaca.
  if (!lama || jumlah > lama.games) {
    terbaik.set(kunci, { nama: entri.opening, eco: entri.eco, games: jumlah });
  }
}

const keluaran = {};
for (const [kunci, nilai] of [...terbaik.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  keluaran[kunci] = nilai.eco ? `${nilai.nama} (${nilai.eco})` : nilai.nama;
}

const json = JSON.stringify(keluaran);
await writeFile(TUJUAN, json, "utf8");

console.log(
  `Tabel buku analisis: ${terbaik.size} posisi dari ${daftar.length} entri ` +
    `(${(json.length / 1024 / 1024).toFixed(2)} MB) → ${path.relative(AKAR, TUJUAN)}` +
    (gagal ? ` — ${gagal} entri dilewati (langkah tidak legal)` : "")
);
