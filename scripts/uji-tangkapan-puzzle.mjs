import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { hitungTangkapanPuzzle } from "../src/halaman/TekaTeki/services/tangkapanPuzzle.js";

function jalur(...san) {
  const game = new Chess();
  const fens = [game.fen()];
  for (const langkah of san) {
    game.move(langkah);
    fens.push(game.fen());
  }
  return fens;
}

assert.deepEqual(hitungTangkapanPuzzle(jalur("e4", "d5", "exd5", "Qxd5")), {
  olehPutih: ["p"],
  olehHitam: ["p"],
});

// En passant tetap dihitung walaupun petak tujuan kosong sebelum langkah.
assert.deepEqual(hitungTangkapanPuzzle(jalur("e4", "a6", "e5", "d5", "exd6")), {
  olehPutih: ["p"],
  olehHitam: [],
});

// Jalur tinjau yang dipotong hanya menampilkan tangkapan sampai posisi itu.
assert.deepEqual(hitungTangkapanPuzzle(jalur("e4", "d5", "exd5")), {
  olehPutih: ["p"],
  olehHitam: [],
});

console.log("OK — tangkapan teka-teki untuk kedua sisi, en passant, dan jalur tinjau.");
