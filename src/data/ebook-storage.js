/**
 * Konfigurasi penyimpanan e-book (object storage).
 *
 * EBOOK_BASE = basis URL tempat PDF e-book asli disimpan, mis.
 *   https://<proyek>.supabase.co/storage/v1/object/public/ebooks
 *
 * Bila KOSONG (bawaan), situs membaca PDF dari berkas lokal
 * public/ebooks/*.pdf (mode lama lewat Git LFS). Setelah menjalankan
 * `npm run ebook:unggah`, skrip mengisi nilai ini otomatis.
 *
 * Catatan CSP: bila Anda pindah ke penyedia lain (R2/S3/B2), jangan lupa
 * menambahkan origin penyimpanan itu ke `frame-src` di index.html dan
 * vercel.json, supaya pratinjau "Baca" (iframe) tetap diizinkan.
 */
export const EBOOK_BASE = "";
