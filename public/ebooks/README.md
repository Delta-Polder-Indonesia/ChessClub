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
- **Deploy Vercel**: `dist/ebooks/*.pdf` mungkin ikut ter-bundle dari repo, tetapi
  akses publik langsung `/ebooks/*` tetap ditutup oleh rewrite dan endpoint
  bertiket. Untuk menghindari ukuran deploy besar, pindahkan koleksi ke bucket
  privat Supabase sesuai `PANDUAN-EBOOK-STORAGE.md` (`npm run ebook:unggah`).
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

Berkas di folder ini adalah sumber checkout lokal, bukan URL publik yang boleh
langsung dibagikan. Middleware Vite memblokir `/ebooks/*` saat dev/preview dan
rewrite Vercel mengarahkannya ke proxy bertiket.

## Bagaimana tombol "Baca" mengambil berkasnya

Situs selalu memakai proxy `/api/ebook-preview?file=<nama>.pdf&tiket=<tiket>`
(`api/ebook-preview.js` di Vercel, `plugins/ebook-preview.js` saat `npm run
dev`). Tiket diterbitkan setelah redemption kode akses. Dalam production proxy
hanya memakai storage privat; berkas checkout, GitHub Media, dan `EBOOK_BASE`
tidak menjadi fallback. Mode lokal dapat memakai berkas checkout atau sumber
cadangan setelah tiket sah, dan hanya memakai PDF yang diawali `%PDF`, lalu
mengirimkannya dengan `Content-Disposition: inline`.
