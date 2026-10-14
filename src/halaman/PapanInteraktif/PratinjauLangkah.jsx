/**
 * Pratinjau papan kecil untuk satu langkah di riwayat — pola "moveTooltip"
 * dari isepic-chess-ui: saat kursor diarahkan ke langkah, tampil posisi
 * SETELAH langkah itu, lengkap dengan sorotan langkah terakhir dan raja yang
 * sedang diskak.
 *
 * Komponen ini statis (tanpa listener global, tanpa state) sehingga aman
 * dirender ulang setiap kali kursor pindah antarlangkah.
 */
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { petaBidak } from "../TekaTeki/animasiBidak.js";
import { TEMA_PAPAN } from "../TekaTeki/temaPapan.js";

const FILE = ["a", "b", "c", "d", "e", "f", "g", "h"];

/** Posisi raja (`K` / `k`) dari peta bidak, untuk menandai skak. */
function posisiRaja(peta, warna) {
  const kode = warna === "w" ? "K" : "k";
  for (const [petak, bidak] of Object.entries(peta)) {
    if (bidak === kode) return petak;
  }
  return null;
}

export default function PratinjauLangkah({
  fen,
  dari = null,
  ke = null,
  skak = false,
  giliran = "w",
  tema = "hijau",
  setBidak = "merida",
  ukuran = 250,
}) {
  const peta = petaBidak(fen);
  const palet = TEMA_PAPAN[tema] || TEMA_PAPAN.hijau;
  const rajaSkak = skak ? posisiRaja(peta, giliran) : null;

  // Baris dari rank 8 ke 1 (sama dengan papan utama, orientasi putih di bawah).
  const petak = [];
  for (let baris = 8; baris >= 1; baris--) {
    for (let kolom = 0; kolom < 8; kolom++) {
      petak.push({ sq: `${FILE[kolom]}${baris}`, terang: (8 - baris + kolom) % 2 === 0 });
    }
  }

  return (
    <div
      role="img"
      aria-label="Pratinjau posisi setelah langkah"
      className="pointer-events-none grid grid-cols-8 grid-rows-8 overflow-hidden rounded shadow-lg ring-1 ring-black/40"
      style={{ width: ukuran, height: ukuran }}
    >
      {petak.map(({ sq, terang }) => {
        const bidak = peta[sq] || "";
        const sorot = sq === dari || sq === ke;
        return (
          <div
            key={sq}
            className="relative flex items-center justify-center"
            style={{ backgroundColor: terang ? palet.terang : palet.gelap }}
          >
            {sorot && (
              <span
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(205, 210, 106, 0.5)" }}
                aria-hidden="true"
              />
            )}
            {sq === rajaSkak && (
              <span
                className="absolute inset-0"
                style={{ background: "radial-gradient(circle, rgba(255,0,0,0.85) 0%, rgba(255,0,0,0) 70%)" }}
                aria-hidden="true"
              />
            )}
            {bidak && (
              <span className="relative z-10 flex h-[88%] w-[88%] items-center justify-center drop-shadow">
                <ChessPiece piece={bidak} set={setBidak} className="h-full w-full" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
