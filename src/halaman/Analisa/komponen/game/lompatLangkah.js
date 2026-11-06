/**
 * Hitung nomor langkah tujuan untuk muatan "buka di langkah ini".
 *
 * Dipakai saat peninjau mengklik salah satu sorotan distribusi manusia:
 * panel mengirim `lompatKe` (indeks setengah-langkah) bersama PGN-nya, dan
 * papan melompat ke sana SETELAH parse selesai — sebelumnya panjang partai
 * belum diketahui, jadi jepitan hanya bisa dilakukan di sini.
 *
 * `null` berarti "jangan melompat": nilai bukan bilangan bulat positif
 * (mis. muatan biasa dari Basis Data/Impor) atau partai kosong.
 */
export function langkahLompat(lompatKe, jumlahLangkah) {
  if (!Number.isInteger(lompatKe) || lompatKe <= 0) return null;
  const akhir = Math.max(0, Number(jumlahLangkah) - 1 || 0);
  return Math.min(lompatKe, akhir);
}
