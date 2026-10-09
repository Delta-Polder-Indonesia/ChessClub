export function avg(arr) {
  // Tanpa penjagaan ini, daftar kosong menghasilkan 0/0 = NaN dan panel
  // ringkasan menampilkan "NaN" alih-alih angka akurasi.
  if (!arr?.length) return NaN;
  const sum = arr.reduce((acc, cur) => acc + cur, 0);
  return sum / arr.length;
}
