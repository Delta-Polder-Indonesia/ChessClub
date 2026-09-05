# E-Book & Panduan

Folder ini berisi file PDF yang ditampilkan di halaman `/program-kami/ebook-panduan`.

## Penting: berkas ini disimpan lewat Git LFS

Seluruh PDF di folder ini dilacak Git LFS (lihat `.gitattributes`). Di repositori,
yang tersimpan hanya *pointer* kecil (132 byte) — isi aslinya diunduh dari server
LFS GitHub saat checkout dengan Git LFS aktif.

- **Klon lokal** (perlu `git-lfs` terpasang sekali):
  ```bash
  git lfs install
  git clone https://github.com/Delta-Polder-Indonesia/ChessClub.git
  # atau di klon yang sudah ada:
  git lfs pull
  ```
  Cek hasilnya: `head -c 4 "public/ebooks/Sicilian Defense.pdf"` harus mencetak `%PDF`.
- **Deploy GitHub Pages**: workflow `.github/workflows/deploy.yml` sudah memakai
  `actions/checkout` dengan `lfs: true` dan memverifikasi `dist/ebooks/*.pdf`
  berisi PDF asli sebelum menerbitkan situs. Tanpa `lfs: true`, situs akan
  menyajikan pointer teks sebagai pengganti PDF — tombol Baca/Unduh rusak.
- **Menambah e-book baru**: letakkan PDF asli di folder ini lalu `git add` seperti
  biasa (Git LFS otomatis menangani). Jangan commit *pointer* hasil klon tanpa LFS.
- **Ingin lepas dari LFS** (PDF disimpan sebagai berkas Git biasa):
  `bash scripts/keluar-dari-lfs.sh --periksa` lalu tanpa `--periksa`.
  Baca untung-ruginya di `PANDUAN-EBOOK-STORAGE.md`.

## Cara menambah e-book baru

1. Taruh file PDF di folder ini, misal `nama-file.pdf`
2. Buka `src/halaman/Beranda/ebook-data.js`
3. Tambah entri baru di array `DAFTAR_EBOOK`.

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
5. Agar sampul tampil tanpa ikon PDF pengganti, taruh gambar di `public/images/E-Books/` lalu daftarkan id buku di object `COVER` (file yang sama, `src/halaman/Beranda/ebook-data.js`).

File di folder ini otomatis bisa diakses via `/ebooks/nama-file.pdf` karena berada di `public/`.

## Bagaimana tombol "Baca" mengambil berkasnya

Situs tidak membaca `/ebooks/*.pdf` secara langsung, melainkan lewat proxy
`/api/ebook-preview?file=<nama>.pdf` (`api/ebook-preview.js` di Vercel,
`plugins/ebook-preview.js` saat `npm run dev`). Proxy mencoba beberapa sumber
berurutan — object storage (`EBOOK_BASE`) → berkas statis hasil build →
isi Git LFS di GitHub Media — dan hanya memakai sumber yang benar-benar
diawali `%PDF`, lalu mengirimnya dengan `Content-Disposition: inline`.

Jadi kalau di lokal berkas masih berupa pointer LFS, tombol **Baca** tetap
bekerja selama ada koneksi ke GitHub. Untuk membaca offline: `git lfs pull`.
