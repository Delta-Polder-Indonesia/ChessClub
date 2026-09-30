# Standar media konten KCI

Media adalah bagian dari penjelasan. Gambar tidak ditambahkan untuk mengisi ruang.

## 1. Kapan media wajib

Sertakan visual di dekat pembahasan ketika pembaca perlu melihat:

- tampilan fitur atau halaman;
- langkah yang bergantung pada posisi kontrol;
- posisi, pola, atau variasi catur;
- orang, tempat, buku, peralatan, atau objek tertentu;
- dokumentasi kegiatan dan hasil nyata;
- struktur, data, perubahan, atau perbandingan.

Paragraf konseptual yang sudah jelas tidak wajib diberi gambar dekoratif.

## 2. Jenis media

| Jenis | Rasio/default | Fit | Penggunaan |
| --- | --- | --- | --- |
| Gambar pembuka | 16:9 atau 3:2 | cover untuk foto | memperkenalkan objek/topik utama |
| Foto dokumentasi | rasio asli/3:2 | cover hanya jika subjek aman | bukti kegiatan nyata |
| Screenshot | rasio asli | contain | menjelaskan UI; detail tidak boleh terpotong |
| Diagram/infografik | rasio asli | contain | hubungan, struktur, atau proses |
| Posisi catur | 1:1 | contain | papan dan koordinat harus terbaca |
| Sampul buku | rasio asli | contain | identifikasi buku |
| Thumbnail daftar | rasio konsisten per daftar | cover | pemindaian cepat; bukan gambar utama |
| Perbandingan | kedua sisi konsisten | contain/cover sesuai jenis | sebelum-sesudah atau dua alternatif |
| Galeri | satu sorotan + pendukung | sesuai isi | rangkaian visual dengan alur |

Rasio tidak boleh dipilih hanya agar semua gambar tampak seragam. Foto boleh di-crop; diagram, papan, sampul, dan screenshot umumnya tidak.

## 3. Penempatan

- Tempatkan gambar setelah paragraf yang pertama kali memperkenalkan objeknya.
- Jangan memisahkan teks rujukan dan gambar dengan bagian lain.
- Setelah gambar, caption menjelaskan konteks; paragraf berikutnya boleh membahas detail yang terlihat.
- Media lebar boleh keluar dari measure bacaan hingga batas container halaman.
- Jangan menyisipkan gambar di antara judul dan paragraf pembuka kecuali gambar itu memang pembuka bagian.

## 4. Alt dan caption

`alt` dan caption memiliki pekerjaan berbeda:

- `alt`: menyampaikan informasi visual yang diperlukan ketika gambar tidak terlihat.
- caption: menjelaskan konteks, waktu, sumber, atau hubungan gambar dengan artikel.

Aturan:

- Jangan mengawali alt dengan “gambar dari”.
- Alt dekoratif memakai `alt=""`; gambar dekoratif sebisa mungkin tidak ditambahkan.
- Jangan menyalin caption ke alt.
- Jangan memasukkan informasi penting hanya ke dalam gambar.
- Foto kegiatan menyebut aktivitas yang terlihat; caption dapat menyebut acara, tempat, dan tanggal yang terverifikasi.

## 5. Integritas

- Dilarang mengarang dokumentasi KCI.
- Foto stok tidak boleh disajikan sebagai kegiatan nyata.
- Gambar hasil generatif tidak boleh dianggap bukti peristiwa, tokoh, tempat, atau produk nyata.
- Placeholder harus ditandai sebagai sementara dan tidak boleh lolos sebagai hasil final.
- Jika aset penting belum tersedia, laporkan kebutuhan aset; jangan menggantinya diam-diam dengan gambar tidak relevan.
- Sumber dan izin penggunaan aset harus jelas sebelum publikasi.

## 6. Teknis

- Tetapkan `width` dan `height`, atau aspect ratio yang mencegah layout shift.
- Gunakan WebP untuk foto bila alur aset proyek mendukungnya.
- Gunakan `loading="lazy"` untuk gambar di bawah fold; gambar LCP mengikuti strategi khusus halaman.
- Gunakan `decoding="async"` jika sesuai.
- Gunakan `srcset`/`sizes` untuk gambar besar sesuai utilitas proyek.
- Kompres melalui alur aset existing dan jalankan `npm run uji:gambar`.
- Tombol lightbox harus dapat dioperasikan dengan keyboard, mengelola fokus, dan mempunyai label.

## 7. Tata letak Galeri sebagai referensi

Ambil prinsip Galeri, bukan seluruh ukurannya:

1. Pengantar menjelaskan apa yang akan dilihat.
2. Satu visual dapat menjadi fokus utama.
3. Visual pendukung dikelompokkan berdasarkan topik.
4. Perbedaan ukuran menunjukkan prioritas, bukan dekorasi acak.
5. Keterangan menjelaskan perbedaan atau hubungan visual.
6. Mobile mempertahankan urutan dan akses, bukan sekadar mengecilkan grid desktop.

Container 1560px dan heading display pada halaman Galeri bukan default artikel.

## 8. Pemeriksaan media

- Media menjawab kebutuhan pemahaman yang nyata.
- Aset benar, tersedia, dan tidak menyesatkan.
- Crop tidak menghilangkan informasi.
- Alt dan caption tidak berulang.
- Dimensi/rasio mencegah layout shift.
- Detail tetap terbaca pada mobile.
- Gambar tidak bergerak saat hover tanpa fungsi.
- Tidak ada overlay yang menyembunyikan isi gambar.
