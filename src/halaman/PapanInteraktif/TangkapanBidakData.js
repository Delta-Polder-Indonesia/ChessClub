import { Chess } from "chess.js";

const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Hitung bidak yang ditangkap tiap sisi dari riwayat SAN. "olehPutih" berisi
 * bidak Hitam yang ditangkap Putih (tampil di baris Putih), "olehHitam"
 * sebaliknya. Hasil diurutkan dari bidak paling berharga, dengan jumlah per jenis.
 *
 * @param {string[]} daftarSan deret SAN dari posisi `dasar`
 * @param {string} [dasar] FEN posisi awal replay (untuk partai dari FEN kustom)
 */
export function susunTangkapan(daftarSan, dasar) {
  const kantongPutih = {}; // bidak hitam yang ditangkap Putih
  const kantongHitam = {}; // bidak putih yang ditangkap Hitam
  let game;
  try {
    game = dasar ? new Chess(dasar) : new Chess();
  } catch {
    return { olehPutih: [], olehHitam: [] };
  }
  for (const san of daftarSan) {
    let pindah;
    try {
      pindah = game.move(san);
    } catch {
      break;
    }
    if (!pindah || !pindah.captured) continue;
    const kantong = pindah.color === "w" ? kantongPutih : kantongHitam;
    kantong[pindah.captured] = (kantong[pindah.captured] || 0) + 1;
  }
  const rapikan = (kantong, warnaTampil) =>
    Object.entries(kantong)
      .sort((a, b) => NILAI_BIDAK[b[0]] - NILAI_BIDAK[a[0]])
      .map(([jenis, jumlah]) => ({
        huruf: warnaTampil === "w" ? jenis.toUpperCase() : jenis,
        jumlah,
      }));
  return {
    olehPutih: rapikan(kantongPutih, "b"),
    olehHitam: rapikan(kantongHitam, "w"),
  };
}
