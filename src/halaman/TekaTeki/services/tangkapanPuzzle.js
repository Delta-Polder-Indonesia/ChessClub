import { Chess } from "chess.js";

/**
 * Kumpulkan bidak yang dimakan tiap pemain dari jalur posisi teka-teki.
 * `jalurFen` berisi posisi awal dan tiap posisi sesudah langkah, termasuk saat
 * pengguna sedang mundur/maju dalam mode tinjau. Material yang sudah hilang
 * sebelum posisi puzzle dimulai diperkirakan dari inventaris standar karena
 * FEN tidak memuat riwayat PGN; transisi setelahnya dicocokkan ke langkah legal
 * chess.js agar en passant dan promosi tetap dihitung dengan benar.
 *
 * @param {string[]} jalurFen
 * @returns {{ olehPutih: string[], olehHitam: string[] }}
 */
export function hitungTangkapanPuzzle(jalurFen = []) {
  const hasil = { olehPutih: [], olehHitam: [] };
  const awal = jalurFen[0];

  // Dataset teka-teki hanya menyediakan FEN (bukan riwayat PGN sebelum soal),
  // jadi material yang sudah hilang saat posisi awal dimulai diestimasi dari
  // inventaris standar. Tangkapan setelah FEN awal dihitung persis di bawah.
  if (awal) {
    const jumlahAwal = { w: {}, b: {} };
    const inventaris = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const papan = awal.split(" ")[0];
    for (const kode of papan) {
      if (!/[prnbqk]/i.test(kode)) continue;
      const warna = kode === kode.toLowerCase() ? "b" : "w";
      const jenis = kode.toLowerCase();
      jumlahAwal[warna][jenis] = (jumlahAwal[warna][jenis] || 0) + 1;
    }
    for (const [jenis, total] of Object.entries(inventaris)) {
      for (let i = jumlahAwal.b[jenis] || 0; i < total; i += 1) {
        hasil.olehPutih.push(jenis);
      }
      for (let i = jumlahAwal.w[jenis] || 0; i < total; i += 1) {
        hasil.olehHitam.push(jenis);
      }
    }
  }

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
