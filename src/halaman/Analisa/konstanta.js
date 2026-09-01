/**
 * Titik henti (breakpoint) tata letak halaman Analisa.
 *
 * Angka ini dipakai dua pihak dan harus tetap sama:
 *  - CSS/Tailwind: lihat blok `@theme` di src/index.css (`--breakpoint-*`).
 *  - JavaScript: pengukuran papan (lebar papan dihitung dari ukuran wadah).
 *
 * Asalnya dari tailwind.config.ts milik Brilliant-Chess (MIT), dipindah ke
 * berkas ini karena proyek ini memakai Tailwind v4 yang dikonfigurasi lewat CSS.
 */

/** Di bawah lebar ini navigasi pindah ke atas dan papan menjadi kolom. */
export const navTop = 516;

/** Di bawah lebar ini panel kanan (Ringkasan/Langkah) turun ke bawah papan. */
export const maxVertical = 1100;

/** Di bawah lebar ini ringkasan ditampilkan dalam versi ramping. */
export const reduceSummary = 1669;
