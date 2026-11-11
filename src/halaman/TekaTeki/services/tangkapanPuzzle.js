import { Chess } from "chess.js";

/**
 * Kumpulkan bidak yang dimakan tiap pemain dari jalur posisi teka-teki.
 * `jalurFen` berisi posisi awal dan tiap posisi sesudah langkah, termasuk saat
 * pengguna sedang mundur/maju dalam mode tinjau. Karena setiap transisi
 * dicocokkan ke langkah legal chess.js, en passant dan promosi tetap benar.
 *
 * @param {string[]} jalurFen
 * @returns {{ olehPutih: string[], olehHitam: string[] }}
 */
export function hitungTangkapanPuzzle(jalurFen = []) {
  const hasil = { olehPutih: [], olehHitam: [] };

  for (let i = 1; i < jalurFen.length; i += 1) {
    let game;
    try {
      game = new Chess(jalurFen[i - 1]);
    } catch {
      continue;
    }

    const fenTujuan = jalurFen[i].split(" ").slice(0, 4).join(" ");
    for (const langkah of game.moves({ verbose: true })) {
      try {
        const dimainkan = game.move({
          from: langkah.from,
          to: langkah.to,
          promotion: langkah.promotion,
        });
        const cocok = game.fen().split(" ").slice(0, 4).join(" ") === fenTujuan;
        if (cocok) {
          if (dimainkan.captured) {
            const sisi = dimainkan.color === "w" ? "olehPutih" : "olehHitam";
            hasil[sisi].push(dimainkan.captured);
          }
          break;
        }
        game.undo();
      } catch {
        // Langkah tak dapat diterapkan: coba langkah legal berikutnya.
      }
    }
  }

  return hasil;
}
