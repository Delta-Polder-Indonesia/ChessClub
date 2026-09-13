/**
 * Papan peringkat Kuis Catur (halaman `src/halaman/QuizCatur/QuizCatur.jsx`).
 *
 * Satu entri berbentuk `{ nama, benar, total }`. Satu nama hanya boleh punya
 * satu baris: nilai terbaiknya yang disimpan, bukan hasil terakhir. Aturan itu
 * dipakai baik saat memuat data lama dari localStorage maupun saat mencatat
 * hasil baru, jadi keduanya memanggil fungsi yang sama di sini.
 */

/** Urutan papan peringkat: nilai `benar` tertinggi lebih dulu. */
function rapikanPeringkat(daftar) {
  return [...daftar].sort((a, b) => b.benar - a.benar);
}

/**
 * Gabungkan satu hasil baru ke papan peringkat.
 *
 * Nama yang sudah ada dipertahankan bila nilainya lebih baik (`benar` lebih
 * besar); nama baru ditambahkan. Hasilnya selalu terurut.
 *
 * @param {Array<{nama: string, benar: number, total: number}>} daftar
 * @param {{nama: string, benar: number, total: number}} masuk
 */
export function gabungPeringkat(daftar, masuk) {
  const ada = daftar.some((p) => p.nama === masuk.nama);
  const gabung = ada
    ? daftar.map((p) => (p.nama === masuk.nama && p.benar < masuk.benar ? masuk : p))
    : [...daftar, masuk];
  return rapikanPeringkat(gabung);
}
