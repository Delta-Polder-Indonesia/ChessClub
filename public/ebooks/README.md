# E-Book & Panduan

Folder ini berisi file PDF yang ditampilkan di halaman `/program-kami/ebook-panduan`.

## Penyimpanan: PDF biasa di Git (Git LFS sudah tidak dipakai)

Seluruh PDF di folder ini adalah blob Git biasa — `public/ebooks/` berisi
32 berkas, ±484 MB. `.gitattributes` sudah kosong (tidak ada satu pun pola
`filter=lfs`), jadi `git clone` reguler langsung menghasilkan PDF asli.
`git lfs install` dan `git lfs pull` tidak diperlukan lagi.

Cara memastikan (harus mencetak `%PDF`; kalau yang tercetak `vers` itu berarti
masih pointer LFS dari checkout lama):

```bash
head -c 4 "public/ebooks/Sicilian Defense.pdf"
npm run uji:ebook
```

- **Klon lokal**: `git clone` biasa sudah cukup. Karena PDF ikut di dalam repo,
  klon pertama besar dan setiap PDF yang diganti menyimpan salinan penuh baru di
  riwayat — ukuran `.git` tidak bisa dikecilkan tanpa menulis ulang riwayat.
- **Deploy Vercel**: `dist/ebooks/*.pdf` ikut ter-bundle dari repo. Kalau koleksi
  terus bertambah, pindahkan ke Supabase Storage sesuai `PANDUAN-EBOOK-STORAGE.md`
  (`npm run ebook:unggah` + `EBOOK_BASE`) supaya deploy tidak mengangkut ±484 MB.
- **Menambah e-book baru**: taruh PDF asli di folder ini lalu `git add` seperti
  biasa. GitHub MENOLAK berkas >= 100 MB dan memberi peringatan mulai 50 MB
  (terbesar saat ini `Ruy Lopez_Anti Berlin (id).pdf` ±75 MB) — kompres lebih dulu:
  `gs -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -sOutputFile=keluar.pdf masuk.pdf`.
- **Riwayat LFS**: commit lama masih berisi *pointer* dan itu disengaja —
  `scripts/keluar-dari-lfs.sh` tidak menulis ulang riwayat. Sumber GitHub Media di
  `src/data/ebook-sumber.js` dibiarkan hanya sebagai cadangan checkout lama.

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
GitHub Media (cadangan untuk checkout lama yang isinya masih pointer LFS) —
dan hanya memakai sumber yang benar-benar diawali `%PDF`, lalu mengirimnya
dengan `Content-Disposition: inline`.

Karena isi PDF sudah ada di repo, hampir selalu berkas statis yang terpakai:
tombol **Baca** dan baca offline sama-sama jalan tanpa Git LFS.
