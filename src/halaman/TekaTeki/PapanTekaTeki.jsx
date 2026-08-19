import React from "react";
import { ChessPiece } from "../Beranda/ChessPieceSvg.jsx";

const FILE = ["a", "b", "c", "d", "e", "f", "g", "h"];

const NAMA_BIDAK = {
  p: "bidak",
  n: "kuda",
  b: "gajah",
  r: "benteng",
  q: "menteri",
  k: "raja",
};

/** Ubah bagian posisi FEN menjadi peta petak → huruf bidak. */
function petaBidak(fen) {
  const peta = {};
  const posisi = fen.split(" ")[0];
  let baris = 8;
  let kolom = 0;
  for (const ch of posisi) {
    if (ch === "/") {
      baris -= 1;
      kolom = 0;
    } else if (ch >= "1" && ch <= "8") {
      kolom += Number(ch);
    } else {
      peta[FILE[kolom] + baris] = ch;
      kolom += 1;
    }
  }
  return peta;
}

/** 64 petak dalam urutan tampilan: orientasi "w" = putih di bawah. */
function daftarPetak(orientasi) {
  const petak = [];
  const baris =
    orientasi === "w"
      ? ["8", "7", "6", "5", "4", "3", "2", "1"]
      : ["1", "2", "3", "4", "5", "6", "7", "8"];
  for (const b of baris) {
    const lajur = orientasi === "w" ? FILE : [...FILE].reverse();
    for (const l of lajur) petak.push(l + b);
  }
  return petak;
}

/**
 * Papan catur interaktif untuk teka-teki.
 * Interaksi klik-klik (pilih bidak → pilih tujuan) — ramah layar sentuh.
 */
export default function PapanTekaTeki({
  fen,
  orientasi = "w",
  terpilih = null,
  sasaran = [],
  petunjuk = null,
  kesalahan = null,
  langkahAkhir = null,
  nonaktif = false,
  onKlik,
}) {
  const peta = petaBidak(fen);
  const petak = daftarPetak(orientasi);

  return (
    <div className="relative w-full aspect-square select-none overflow-hidden rounded-lg shadow-lg ring-1 ring-black/10">
      {/* Animasi goyang saat langkah salah. */}
      <style>{`
        @keyframes kci-goyang {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .kci-goyang { animation: kci-goyang 0.16s ease-in-out 3; }
      `}</style>

      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {petak.map((sq, i) => {
          const baris = Math.floor(i / 8);
          const kolom = i % 8;
          const terang = (baris + kolom) % 2 === 0;
          const bidak = peta[sq] || "";
          const dipilih = terpilih === sq;
          const jadiSasaran = sasaran.includes(sq);
          const jadiPetunjuk = petunjuk && (petunjuk.from === sq || petunjuk.to === sq);
          const jadiSalah = kesalahan && (kesalahan.from === sq || kesalahan.to === sq);
          const jadiAkhir = langkahAkhir && (langkahAkhir.from === sq || langkahAkhir.to === sq);

          const warnaLabel = terang ? "text-[#8a5a3b]" : "text-[#f3e7d3]";

          return (
            <button
              key={sq}
              type="button"
              aria-label={`petak ${sq}${bidak ? `, ${NAMA_BIDAK[bidak.toLowerCase()]} ${bidak === bidak.toUpperCase() ? "putih" : "hitam"}` : ", kosong"}`}
              onClick={() => onKlik && onKlik(sq)}
              className={`relative flex items-center justify-center border-0 p-0 outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500 ${
                terang ? "bg-[#ecd9b4]" : "bg-[#a2734f]"
              }`}
            >
              {jadiAkhir && <span className="absolute inset-0 bg-[#f5d76e]/45" aria-hidden="true" />}
              {jadiPetunjuk && <span className="absolute inset-0 bg-yellow-300/60" aria-hidden="true" />}
              {jadiSalah && <span className="kci-goyang absolute inset-0 bg-red-400/60" aria-hidden="true" />}
              {dipilih && <span className="absolute inset-0 bg-emerald-400/50" aria-hidden="true" />}

              {/* Koordinat: huruf lajur di baris bawah, angka baris di kolom kiri. */}
              {baris === 7 && (
                <span className={`absolute bottom-0.5 right-1 text-[9px] md:text-[10px] font-bold leading-none ${warnaLabel}`}>
                  {sq[0]}
                </span>
              )}
              {kolom === 0 && (
                <span className={`absolute top-0.5 left-1 text-[9px] md:text-[10px] font-bold leading-none ${warnaLabel}`}>
                  {sq[1]}
                </span>
              )}

              {bidak && (
                <span className="relative z-10 flex h-[84%] w-[84%] items-center justify-center drop-shadow pointer-events-none">
                  <ChessPiece piece={bidak} className="h-full w-full" />
                </span>
              )}

              {/* Penanda petak tujuan legal. */}
              {jadiSasaran && !bidak && (
                <span className="absolute z-10 h-[30%] w-[30%] rounded-full bg-black/25" aria-hidden="true" />
              )}
              {jadiSasaran && bidak && (
                <span className="absolute inset-[3%] z-10 rounded-full border-4 border-black/30" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      {nonaktif && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
