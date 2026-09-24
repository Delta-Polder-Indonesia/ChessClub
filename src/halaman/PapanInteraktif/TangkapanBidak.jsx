import { Chess } from "chess.js";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";

const NILAI_BIDAK = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/**
 * Hitung bidak yang ditangkap tiap sisi dari riwayat SAN. "olehPutih" berisi
 * bidak Hitam yang ditangkap Putih (tampil di baris Putih), "olehHitam"
 * sebaliknya. Hasil diurutkan dari bidak paling berharga, dengan jumlah per jenis.
 */
export function susunTangkapan(daftarSan) {
  const kantongPutih = {}; // bidak hitam yang ditangkap Putih
  const kantongHitam = {}; // bidak putih yang ditangkap Hitam
  const game = new Chess();
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

/** Ikon bidak yang ditangkap: satu ikon per jenis + pengali bila lebih dari satu. */
export default function TangkapanBidak({ daftar, set }) {
  if (!daftar || daftar.length === 0) return null;
  return (
    <span className="flex items-center gap-1.5">
      {daftar.map(({ huruf, jumlah }) => (
        <span key={huruf} className="flex shrink-0 items-center">
          <ChessPiece piece={huruf} set={set} className="h-4 w-4 opacity-80" />
          {jumlah > 1 && (
            <span className="ml-0.5 text-[10px] font-semibold leading-none text-gray-500">
              {jumlah}×
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
