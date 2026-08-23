import { useEffect, useState } from "react";

/**
 * Renderer bidak catur dengan pemuatan aset per-set.
 *
 * Vite membuat chunk terpisah untuk setiap SVG, sehingga pengguna hanya
 * mengunduh 12 aset dari gaya bidak yang dipilih—bukan seluruh 13 set.
 */
const PEMUAT_ASET = import.meta.glob("../../asets/*/*.svg", {
  query: "?url",
  import: "default",
});

export const DAFTAR_SET = [
  { id: "bidak", nama: "Chessnut" },
  { id: "alpha", nama: "Alpha" },
  { id: "california", nama: "California" },
  { id: "cardinal", nama: "Cardinal" },
  { id: "cburnett", nama: "CBurnett" },
  { id: "dubrovny", nama: "Dubrovny" },
  { id: "gioco", nama: "Gioco" },
  { id: "governor", nama: "Governor" },
  { id: "icpieces", nama: "ICPieces" },
  { id: "maestro", nama: "Maestro" },
  { id: "merida", nama: "Merida" },
  { id: "staunty", nama: "Staunty" },
  { id: "tatiana", nama: "Tatiana" },
];

const NAMA_BIDAK = {
  K: "Raja putih", Q: "Menteri putih", R: "Benteng putih", B: "Gajah putih", N: "Kuda putih", P: "Bidak putih",
  k: "Raja hitam", q: "Menteri hitam", r: "Benteng hitam", b: "Gajah hitam", n: "Kuda hitam", p: "Bidak hitam",
};
const KODE_ASET = { K: "wK", Q: "wQ", R: "wR", B: "wB", N: "wN", P: "wP", k: "bK", q: "bQ", r: "bR", b: "bB", n: "bN", p: "bP" };
const KODE_CHESSNUT = {
  K: "raja-putih", Q: "ratu-putih", R: "benteng-putih", B: "gajah-putih", N: "kuda-putih", P: "bidak-putih",
  k: "raja-hitam", q: "ratu-hitam", r: "benteng-hitam", b: "gajah-hitam", n: "kuda-hitam", p: "bidak-hitam",
};

const cacheSet = new Map();

function jalurAset(set, piece) {
  const kode = set === "bidak" ? KODE_CHESSNUT[piece] : KODE_ASET[piece];
  return kode ? `../../asets/${set}/${kode}.svg` : null;
}

function muatSet(set) {
  const id = DAFTAR_SET.some((item) => item.id === set) ? set : "bidak";
  if (!cacheSet.has(id)) {
    const tugas = Object.keys(NAMA_BIDAK).map(async (piece) => {
      const pemuat = PEMUAT_ASET[jalurAset(id, piece)];
      if (!pemuat) throw new Error(`Aset bidak tidak ditemukan: ${id}/${piece}`);
      return [piece, await pemuat()];
    });
    cacheSet.set(id, Promise.all(tugas).then((entri) => Object.fromEntries(entri)));
  }
  return cacheSet.get(id);
}

export function ChessPiece({ piece, set = "merida", className = "w-full h-full" }) {
  const [peta, setPeta] = useState(null);

  useEffect(() => {
    let aktif = true;
    muatSet(set)
      .then((hasil) => { if (aktif) setPeta(hasil); })
      .catch(() => { if (aktif) setPeta(null); });
    return () => { aktif = false; };
  }, [set]);

  const sumber = piece ? peta?.[piece] : null;
  if (!sumber) return null;
  return <img src={sumber} alt={NAMA_BIDAK[piece]} className={className} draggable={false} />;
}
