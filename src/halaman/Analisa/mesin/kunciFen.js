/** Kunci pencarian untuk tabel pembukaan (lihat scripts/generasi-buku-analisa.mjs). */

/**
 * FEN lengkap → kunci tabel buku: papan, giliran, rokade, dan en passant.
 * Penghitung setengah-langkah/penuh dibuang supaya posisi yang sama dari
 * partai mana pun tetap dikenali sebagai langkah buku.
 */
export function kunciFen(fen) {
  return String(fen ?? "").trim().split(/\s+/).slice(0, 4).join(" ");
}
