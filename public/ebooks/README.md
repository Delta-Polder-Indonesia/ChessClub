# E-Book & Panduan

Folder ini berisi file PDF yang ditampilkan di halaman `/beranda/ebook-panduan`.

## Cara menambah e-book baru

1. Taruh file PDF di folder ini, misal `nama-file.pdf`
2. Buka `src/halaman/Beranda/EbookPanduan.jsx`
3. Tambah entri baru di array `DAFTAR_EBOOK`:

```js
{
  id: "id-unik",
  judul: "Judul Dokumen",
  deskripsi: "Deskripsi singkat",
  file: "/ebooks/nama-file.pdf",
  kategori: "Dasar | Regulasi | Strategi | Taktik",
  ukuran: "1,2 MB",
  halaman: "24 hal",
  tahun: "2025",
  tersedia: true
}
```

4. Jika `tersedia: false`, tombol Baca & Unduh otomatis nonaktif (untuk dokumen yang segera hadir).

File di folder ini otomatis bisa diakses via `/ebooks/nama-file.pdf` karena berada di `public/`.
