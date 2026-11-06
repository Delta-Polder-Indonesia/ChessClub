/**
 * Pilihan tampilan papan yang dipakai bersama halaman papan catur
 * (Teka-Teki, Rush, Papan Interaktif) — sebelumnya daftar ini disalin di
 * masing-masing halaman.
 */

/** Pilihan warna papan (nilai + kunci terjemahan). */
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

/** Urutan pilihan bidak promosi (menteri, benteng, gajah, kuda). */
export const PILIHAN_PROMOSI = ["q", "r", "b", "n"];

/** Kunci kamus nama bidak promosi. */
export const KUCI_NAMA_PROMOSI = {
  q: "tekaTeki.promosiMenteri",
  r: "tekaTeki.promosiBenteng",
  b: "tekaTeki.promosiGajah",
  n: "tekaTeki.promosiKuda",
};
