import { useEffect, useState } from "react";

/**
 * Renderer bidak catur dengan pemuatan aset per-set.
 *
 * Vite membuat chunk terpisah untuk setiap SVG, sehingga pengguna hanya
 * mengunduh 12 aset dari gaya bidak yang dipilih—bukan seluruh 13 set.
 */
const PEMUAT_ASET = import.meta.glob("../../asets/*/*.{svg,png}", {
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
  { id: "chesscom", nama: "Chess.com" },
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
/* Set yang SUDAH selesai dimuat, dalam bentuk siap pakai (bukan Promise).
   Dipakai langsung pada render pertama sebuah bidak: tanpa ini, setiap bidak
   yang baru muncul di sebuah petak menunggu satu putaran efek sebelum
   gambarnya terpasang — terlihat sebagai kedipan saat bidak meluncur ke petak
   tujuan. */
const setSiap = new Map();

function idSet(set) {
  return DAFTAR_SET.some((item) => item.id === set) ? set : "bidak";
}

function jalurAset(set, piece) {
  if (set === "bidak") return `../../asets/bidak/${KODE_CHESSNUT[piece]}.svg`;
  if (set === "chesscom")
    return `../../asets/ChessCom/${KODE_ASET[piece].toLowerCase()}.png`;
  const kode = KODE_ASET[piece];
  return kode ? `../../asets/${set}/${kode}.svg` : null;
}

function muatSet(set) {
  const id = idSet(set);
  if (!cacheSet.has(id)) {
    const tugas = Object.keys(NAMA_BIDAK).map(async (piece) => {
      const pemuat = PEMUAT_ASET[jalurAset(id, piece)];
      if (!pemuat) throw new Error(`Aset bidak tidak ditemukan: ${id}/${piece}`);
      return [piece, await pemuat()];
    });
    cacheSet.set(
      id,
      Promise.all(tugas).then((entri) => {
        const peta = Object.fromEntries(entri);
        setSiap.set(id, peta);
        return peta;
      })
    );
  }
  return cacheSet.get(id);
}

export function ChessPiece({ piece, set = "merida", className = "w-full h-full" }) {
  const id = idSet(set);
  const [, tandaiMuat] = useState(0);

  useEffect(() => {
    if (setSiap.has(id)) return undefined;
    let aktif = true;
    muatSet(id)
      .then(() => { if (aktif) tandaiMuat((n) => n + 1); })
      .catch(() => { if (aktif) tandaiMuat((n) => n + 1); });
    return () => { aktif = false; };
  }, [id]);

  const peta = setSiap.get(id) || null;
  const sumber = piece ? peta?.[piece] : null;
  if (!sumber) return null;
  return <img src={sumber} alt={NAMA_BIDAK[piece]} className={className} draggable={false} />;
}
