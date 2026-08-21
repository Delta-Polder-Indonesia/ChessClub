/**
 * Bangun data buku pembukaan (public/data/buku-pembukaan.json).
 *
 * Sumber : data/pembukaan/{a,b,c,d,e}.tsv — unduhan dari repo
 *          https://github.com/lichess-org/chess-openings (lisensi CC0).
 * Format tiap baris TSV : eco<TAB>nama<TAB>pgn
 * Contoh              : C60<TAB>Ruy Lopez<TAB>1. e4 e5 2. Nf3 Nc6 3. Bb5
 *
 * Keluaran berupa pohon langkah (trie) ber-key SAN:
 *   node = { "n"?: [ [eco, nama], ... ], "c"?: { "<san>": node, ... } }
 * - `n`  : nama(-nama) pembukaan yang "berakhir" tepat di posisi ini.
 * - `c`  : anak pohon = langkah lanjutan yang dikenal.
 *
 * Dari pohon ini frontend bisa:
 *   1. Menebak nama pembukaan dari deret langkah yang dimainkan (telusur
 *      pohon; simpul ber-`n` terdalam adalah nama paling spesifik).
 *   2. Menyarankan langkah berikutnya (kunci `c` pada simpul terakhir).
 *   3. Menyusun katalog (DFS mengumpulkan tiap simpul ber-`n`).
 *
 * Jalankan : node scripts/bangun-pembukaan.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUMBER = ["a", "b", "c", "d", "e"].map((f) =>
  path.join(AKAR, "data", "pembukaan", `${f}.tsv`)
);
const TUJUAN = path.join(AKAR, "public", "data", "buku-pembukaan.json");

/** Pohon pembukaan. */
const akar = {};

let baris = 0;
let simpul = 0;
let dilewati = 0;

for (const berkas of SUMBER) {
  const isi = readFileSync(berkas, "utf8");
  const barisIsi = isi.split(/\r?\n/).slice(1); // lewati baris tajuk
  for (const bar of barisIsi) {
    if (!bar.trim()) continue;
    const [eco, nama, pgn] = bar.split("\t");
    if (!pgn || !nama) {
      dilewati++;
      continue;
    }
    const game = new Chess();
    try {
      game.loadPgn(pgn, { sloppy: true });
    } catch {
      dilewati++;
      continue;
    }
    const langkah = game.history(); // SAN ternormalisasi
    if (!langkah.length) {
      dilewati++;
      continue;
    }
    baris++;
    let simpulKini = akar;
    for (const san of langkah) {
      if (!simpulKini.c) simpulKini.c = {};
      if (!simpulKini.c[san]) {
        simpulKini.c[san] = {};
        simpul++;
      }
      simpulKini = simpulKini.c[san];
    }
    // Simpan nama di simpul akhir baris ini (mendukung beberapa nama).
    if (!simpulKini.n) simpulKini.n = [];
    if (!simpulKini.n.some(([e, n]) => e === eco && n === nama)) {
      simpulKini.n.push([eco, nama]);
    }
  }
}

writeFileSync(TUJUAN, JSON.stringify(akar), "utf8");

const ukuran = Buffer.byteLength(JSON.stringify(akar), "utf8");
console.log(`baris diproses : ${baris}`);
console.log(`simpul pohon   : ${simpul}`);
console.log(`dilewati       : ${dilewati}`);
console.log(
  `ditulis         : ${path.relative(AKAR, TUJUAN)} (${(ukuran / 1024).toFixed(1)} KB)`
);
