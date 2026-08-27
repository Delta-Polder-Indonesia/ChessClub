/**
 * Gulir jendela ke atas secara INSTAN (tanpa animasi).
 *
 * CSS global `html { scroll-behavior: smooth }` membuat semua gulir
 * programatik — termasuk window.scrollTo(0, 0) — ikut beranimasi mulus.
 * Enak untuk jangkar di dalam halaman, tetapi justru buruk saat pindah
 * halaman: pengguna melihat halaman lama/placeholder "meluncur" pelan ke
 * atas selagi chunk halaman tujuan masih diunduh, sehingga transisi
 * terasa mentok/tersendat. Fungsi ini mematikan animasi sesaat supaya
 * pergantian halaman langsung berada di posisi awal.
 */
export function gulirKeAtasInstan() {
  if (typeof window === "undefined") return;
  const akar = document.documentElement;
  const simpan = akar.style.scrollBehavior;
  akar.style.scrollBehavior = "auto";
  // Paksa gaya dihitung ulang sebelum menggulir agar nilai "auto" yang
  // baru benar-benar dipakai scrollTo — bukan nilai "smooth" yang lama.
  void getComputedStyle(akar).scrollBehavior;
  window.scrollTo(0, 0);
  akar.style.scrollBehavior = simpan;
}
