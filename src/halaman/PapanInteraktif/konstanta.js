/**
 * Konstanta Papan Interaktif — nilai baku yang dibagikan ke komponen-komponen
 * di folder ini (dipisah dari PapanInteraktif.jsx agar berkasnya mudah dirawat).
 */
export const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
export const PILIHAN_PROMOSI = ["q", "r", "b", "n"];
export const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};

/** Tab panel kanan — urutan & label (ikon digambar lokal, tanpa pustaka ikon). */
export const TAB_PANEL = [
  { id: "analisa", labelKey: "papan.tabAnalisa" },
  { id: "books", labelKey: "papan.tabBuku" },
  { id: "explorer", labelKey: "papan.tabPenjelajah" },
  { id: "games", labelKey: "papan.tabPartai" },
];

/** Pilihan warna papan (nilai + kunci terjemahan), mengikuti opsi pengaturan. */
export const PILIHAN_WARNA_PAPAN = [
  ["blue", "papan.warnaBiru"],
  ["brown", "papan.warnaCokelat"],
  ["orange", "papan.warnaOranye"],
  ["green", "papan.warnaHijau"],
  ["grey", "papan.warnaAbu"],
  ["light-blue", "papan.warnaBiruMuda"],
  ["dark-blue", "papan.warnaBiruTua"],
  ["wood", "papan.warnaKayu"],
  ["marble-brown", "papan.warnaMarmerCokelat"],
  ["marble-green", "papan.warnaMarmerHijau"],
  ["metal", "papan.warnaMetal"],
];

