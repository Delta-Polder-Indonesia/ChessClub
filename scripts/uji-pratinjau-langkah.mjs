/**
 * Uji helper `rincianTiapLangkah` (src/halaman/PapanInteraktif/bersama/utilPapan.js)
 * yang menyuplai pratinjau papan di riwayat langkah.
 *
 * Yang dikunci:
 *   1. FEN per langkah cocok dengan replay chess.js;
 *   2. petak asal & tujuan benar untuk langkah biasa, makan, rokade, dan en passant;
 *   3. langkah tidak sah menghentikan replay (sisanya null), tanpa melempar galat.
 *
 * Jalankan: node scripts/uji-pratinjau-langkah.mjs
 */
import { Chess } from "chess.js";
import { rincianTiapLangkah } from "../src/halaman/PapanInteraktif/bersama/utilPapan.js";

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi) {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}`);
  }
}

console.log("rincian tiap langkah:");
{
  const san = ["e4", "e5", "Nf3", "Nc6"];
  const r = rincianTiapLangkah(san);
  const ref = new Chess();
  let cocok = true;
  san.forEach((s, i) => {
    ref.move(s);
    if (r[i].fen !== ref.fen()) cocok = false;
  });
  uji("FEN tiap langkah cocok dengan replay chess.js", cocok && r.length === 4);
  uji("langkah biasa: e2→e4", r[0].dari === "e2" && r[0].ke === "e4");
  uji("langkah biasa: g1→f3", r[2].dari === "g1" && r[2].ke === "f3");
}

console.log("petak asal & tujuan:");
{
  const makan = rincianTiapLangkah(["e4", "d5", "exd5"]);
  uji("makan: exd5 dari e4 ke d5", makan[2].dari === "e4" && makan[2].ke === "d5");

  const rokade = rincianTiapLangkah(["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "O-O"]);
  uji("rokade pendek: asal e1, tujuan g1", rokade[6].dari === "e1" && rokade[6].ke === "g1");

  // En passant: bidak yang dimakan di d5 (bukan di tujuan) — asal/tujuan tetap e5→d6.
  const ep = rincianTiapLangkah(["e4", "a6", "e5", "d5", "exd6"]);
  uji("en passant: asal e5, tujuan d6", ep[4].dari === "e5" && ep[4].ke === "d6");
  const refEp = new Chess();
  ["e4", "a6", "e5", "d5", "exd6"].forEach((s) => refEp.move(s));
  uji("en passant: FEN sama dengan replay chess.js", ep[4].fen === refEp.fen());
  uji("en passant: pion d5 yang dimakan sudah hilang", refEp.get("d5") === undefined);
}

console.log("langkah tidak sah:");
{
  const r = rincianTiapLangkah(["e4", "e4", "e5"]);
  uji("langkah ke-2 ilegal: fen & petak null", r[1].fen === null && r[1].dari === null);
  uji("sisa setelah langkah ilegal ikut null", r[2].fen === null);
  uji("langkah sah sebelum galat tetap terisi", r[0].fen !== null);
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
