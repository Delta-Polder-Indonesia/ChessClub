---
name: kci-anti-slop
description: Audit dan larangan anti AI-slop internal untuk UI KCI. Use bersama kci-frontend saat membuat, mengubah, atau meninjau halaman/komponen visual di src/, index.html, atau public/; mencakup tipografi, warna, layout, card, gambar, motion, copy, aksesibilitas, dan pemeriksaan terhadap DESIGN.md tanpa menciptakan design system kedua.
metadata:
  project: chessclub-kci
  area: frontend-quality
---

# Anti AI-Slop KCI

Skill ini adalah **filter audit internal KCI**, bukan design system dan bukan izin untuk merombak UI. Aturannya menjadi prinsip proyek agar kesalahan visual yang sama tidak terus berulang.

## 1. Urutan aturan yang wajib dipakai

Jangan menggabungkan aturan yang bertentangan. Gunakan urutan berikut:

1. Permintaan eksplisit pengguna untuk tugas yang sedang dikerjakan.
2. `AGENTS.md` untuk cakupan, persetujuan, dan proses kerja.
3. `DESIGN.md` untuk seluruh keputusan visual: font, ukuran, warna, radius, spacing, dan identitas KCI.
4. `kci-frontend` untuk arsitektur dan cara implementasi frontend.
5. Skill ini untuk mendeteksi pola slop dan cacat kualitas.
6. Implementasi existing yang sesuai `DESIGN.md` sebagai contoh konkret.
7. Referensi eksternal hanya sebagai inspirasi, tidak boleh menimpa aturan di atas.

Jika dua dokumen berbeda:

- jangan mengambil nilai yang paling disukai;
- ikuti dokumen yang lebih tinggi dalam urutan;
- untuk kode existing yang menyimpang dari `DESIGN.md`, jangan menyalin penyimpangannya ke kode baru;
- jangan memperbaiki penyimpangan di luar cakupan tanpa persetujuan;
- laporkan konflik yang belum dapat diselesaikan.

## 2. Cara menggunakan filter ini

Sebelum menulis UI:

1. Baca `DESIGN.md` dan bagian `kci-frontend` yang relevan.
2. Cari komponen/pola KCI yang paling dekat.
3. Tentukan tujuan informasi setiap bagian.
4. Gunakan token dan komponen resmi; jangan membuat nilai visual ad-hoc.
5. Periksa hasil dengan daftar audit di bagian akhir.

Temuan detector adalah alasan untuk memeriksa konteks, bukan perintah restyling otomatis. Pengecualian hanya sah bila fungsional, sempit, dan terdokumentasi.

## 3. Tipografi yang dilarang

- Ukuran font di luar skala `DESIGN.md` tanpa alasan yang disetujui.
- Body text terlalu kecil; konten bacaan mengikuti ukuran body resmi dan UI tidak boleh di bawah minimum resmi.
- Line-height rapat yang membuat teks tampak gepeng atau baris sulit diikuti.
- Letter-spacing negatif pada body atau judul kecil; tracking lebar pada paragraf.
- Hierarki datar: heading, subheading, dan body nyaris sama.
- Display headline terlalu besar hingga memenuhi layar dan menyingkirkan konteks.
- Paragraf panjang dalam uppercase.
- Teks rata kiri-kanan (`justify`) yang menciptakan celah kata tidak merata.
- Baris bacaan melebihi ukuran nyaman sekitar 65–75 karakter.
- Level heading dilompati, misalnya H1 langsung H3.
- Label kecil di atas heading yang hanya mengulang heading.
- Badge/pill di atas H1 yang tidak memuat status atau informasi penting.
- Nomor kecil pada section yang bukan urutan nyata.
- Mengganti font brand hanya karena font tersebut dianggap tren atau anti-tren.

KCI memakai serif untuk bacaan utama, Geist untuk kontrol fungsional, dan mono untuk notasi sesuai `DESIGN.md`. Larangan umum terhadap Geist tidak berlaku ketika dipakai dalam peran resminya.

## 4. Warna dan permukaan yang dilarang

- Gradien dekoratif, terutama ungu–biru/pink, gradient text, aurora, spotlight, dan halo radial.
- Glassmorphism, frosted card, neon edge, dan glow tanpa fungsi layering nyata.
- Warna, font, radius, atau shadow di luar token `DESIGN.md`.
- Teks abu-abu di atas bidang berwarna jika kontrasnya buruk.
- Teks berkontras di bawah WCAG AA: 4.5:1 untuk teks biasa dan 3:1 untuk teks besar/UI.
- Menggunakan beige/cream, dark-neon, atau palet tren sebagai pengganti identitas KCI.
- Overlay yang hampir menutup gambar sehingga gambar kehilangan fungsi.
- Decorative grid atau repeating stripes yang tidak membantu tugas.

Gunakan warna untuk identitas, hierarki, atau status yang nyata. Jangan menambah warna hanya untuk mengisi ruang.

### 4b. Larangan keras: warna semantik di dashboard Pengurus

Halaman Pengurus (`src/halaman/Pengurus/`) adalah antarmuka operasional, bukan
halaman pemasaran. Di sana warna **tidak boleh** menjadi penanda status atau peran.

Dilarang, tanpa perkecualian:

- Lencana, pill, chip, atau badge berwarna untuk status (`Publik`, `Draf`,
  `Terverifikasi`, `Terblokir`, `MASTER`, `PENGURUS`, `Aktif`, `Selesai`).
  Contoh yang dilarang: `bg-emerald-50 text-emerald-700`, `bg-red-50 text-red-700`,
  `bg-amber-50`, `bg-blue-50` sebagai penanda status.
- Angka statistik berwarna (merah untuk larangan, hijau untuk konten, biru untuk
  anggota). Angka memakai `text-slate-900`.
- Tombol destruktif berwarna merah. Bobot aksi dibedakan lewat ketebalan border
  dan teks `slate-900`, bukan hue.
- Latar berwarna muda sebagai penanda kondisi kartu.

Yang tetap boleh: aksen brand `--color-primary #0B2F9F` untuk tautan aktif, tombol
utama, dan garis sorotan; teks `slate` untuk seluruh hierarki; ikon status yang
sudah menjadi komponen bersama di luar Pengurus (mis. `LencanaBan`) tidak diubah
dari sini karena dipakai halaman publik.

Status ditulis sebagai teks. Warna bukan satu-satunya penanda status
(`DESIGN.md` §10). Bila butuh membedakan, gunakan teks, ketebalan huruf, atau
posisi, bukan hue.

Efek mengambang juga dilarang di Pengurus. Tidak ada `shadow-*` pada kartu,
tabel, tombol, dialog, dropdown, atau menu. Batas bidang dibuat dengan garis 1px;
dialog dan dropdown memakai border lebih tegas di atas latar gelap transparan.

Kotak berlatar abu juga dilarang di Pengurus. Elemen yang memakai latar
`bg-slate-50/100/200` bersama `rounded-lg` dan `border` dianggap kotak terisi dan
ditolak. Konten tampil pada bidang putih dengan garis tipis; latar abu hanya sah
sebagai state interaksi (`hover:`, `focus:`, `active:`, `disabled:`) atau bagian
struktur tabel (kepala tabel, footer pagination). Tindakan cepat ditulis sebagai
baris terbuka dengan pemisah tipis, bukan kartu berisi.

Ketiga larangan ini diuji `scripts/uji-standar-desain.mjs` **sebelum** mekanisme
baseline, jadi tidak bisa diredam dengan `npm run desain:baseline`. Pemeriksa
membaca `className` termasuk template literal dan kelas yang terpecah beberapa
baris, menolak warna hex arbitrer, menolak `boxShadow` pada style inline, dan
menolak nilai warna literal pada atribut SVG (kecuali `none`, `currentColor`,
`transparent`, `inherit`). Memindahkan gaya ke CSS juga tidak menyelamatkan:
berkas `.css` di area itu ikut dipindai aturan hex global. Memperlunak
atau menghapus pemeriksaannya butuh persetujuan pemilik repo.

Komitmen: pola lencana berwarna di dashboard Pengurus tidak dibuat lagi pada
perubahan berikutnya, termasuk oleh agen yang membaca skill ini. Bila menemukan
pola lama seperti itu, laporkan dan ganti dengan teks netral sebelum menambah
gaya baru.


## 5. Layout dan card yang dilarang

- Copy-paste landing page: hero generik, metrik besar, lalu grid fitur identik.
- Semua informasi dibungkus card (`cardocalypse`).
- Card di dalam card tanpa kebutuhan hierarki.
- Grid card identik yang memberi semua informasi bobot sama.
- Ikon dalam kotak rounded di atas setiap judul fitur.
- Garis aksen tebal di sisi card biasa seolah-olah semuanya alert.
- Border tipis dan shadow lebar dipakai bersamaan untuk mendefinisikan tepi yang sama.
- Radius ekstrem yang mengubah card kecil menjadi blob.
- Spacing monoton; jarak terkait dan jarak antarkelompok harus berbeda.
- Heading lebih dekat ke bagian sebelumnya daripada isi bagiannya.
- Kolom pembuka sangat tidak seimbang tanpa tujuan.
- Body menyentuh tepi viewport atau padding dalam card terlalu sempit.
- Konten meluber, menyebabkan scroll horizontal, atau memotong menu/popover.
- Angka/metrik besar tanpa konteks dan bukti.

Default KCI adalah konten terbuka, whitespace, dan pemisah tipis. Card dipakai hanya jika batas kelompok atau interaksi memang diperlukan.

## 6. Gambar dan ilustrasi

Visual harus menjelaskan isi, bukan sekadar membuat halaman tampak penuh.

Wajib menyediakan visual yang relevan ketika pembaca perlu melihat:

- bentuk fitur atau halaman;
- langkah penggunaan;
- posisi/pola catur;
- objek, buku, lokasi, atau tokoh;
- kegiatan dan hasil nyata;
- struktur, data, perubahan, atau perbandingan.

Dilarang:

- foto stok yang dipresentasikan sebagai dokumentasi KCI;
- ilustrasi generik dari lingkaran/blok yang tidak mengatakan sesuatu yang spesifik;
- SVG/mascot kasar hanya untuk mengisi ruang;
- `src` kosong, aset rusak, atau placeholder yang dikirim sebagai hasil final;
- jagged/organic mask buatan yang tidak rapi;
- zoom, rotate, atau gerakan gambar pada hover tanpa fungsi;
- `object-cover` untuk diagram/screenshot ketika detailnya terpotong;
- gambar informatif tanpa `alt`, dimensi/rasio, dan konteks yang memadai;
- caption yang hanya mengulang `alt`.

Gunakan `<figure>` dan `<figcaption>` untuk gambar berketerangan. `alt` mendeskripsikan informasi visual; caption menjelaskan hubungan gambar dengan pembahasan. Jika aset penting belum tersedia, laporkan kebutuhan aset dan jangan mengarang dokumentasi.

## 7. Motion dan interaksi yang dilarang

- Semua elemen fade/slide saat masuk.
- Pulse pada status yang tidak berubah.
- Cursor berkedip pada teks statis.
- Marquee logo/teks otomatis tanpa kontrol.
- Bounce atau elastic easing untuk dialog dan tugas rutin.
- Animasi width/height/padding yang menggeser layout jika transform/opacity mencukupi.
- Hover scale pada setiap card atau gambar.
- Konten default `opacity: 0` yang hilang bila JavaScript gagal.
- Transisi lambat atau dekoratif yang tidak memberi feedback.
- Tidak menyediakan `prefers-reduced-motion`.

Motion hanya untuk menjelaskan perubahan keadaan, hubungan ruang, atau feedback langsung. Konten harus tetap tersedia ketika motion dimatikan.

## 8. Copy dan isi yang dilarang

- Klaim generik seperti “supercharge”, “world-class”, “next-generation”, “pengalaman terbaik”, atau “solusi masa depan”.
- Slogan kontras paksa seperti “Bukan fitur. Sebuah platform.”
- Menyebut sesuatu “teater” atau buruk tanpa menjelaskan masalah faktualnya.
- Em dash berulang sebagai pola setiap kalimat.
- Teks yang sama diulang dalam heading, label, deskripsi, dan card.
- Testimonial, angka, jumlah pengguna, atau bukti sosial yang dikarang.
- Emoji sebagai ikon, bullet, heading, atau dekorasi.
- Lorem ipsum dan placeholder yang lolos ke hasil final.

Tulis fakta: siapa, melakukan apa, kapan, dengan fitur atau data apa. Satu informasi ditulis sekali di tempat terkuatnya.

## 9. Kualitas dan aksesibilitas wajib

- HTML semantik lebih dahulu: heading, list, table, button, link, figure, dialog.
- Focus state terlihat dan seluruh kontrol dapat dipakai dengan keyboard.
- Label form terhubung; error/success dijelaskan lewat teks, bukan warna saja.
- Gambar mempunyai `alt` yang sesuai fungsi.
- Kontras lolos WCAG AA.
- Heading tidak meloncat.
- Dialog mengelola fokus dan dapat ditutup dengan keyboard.
- Target sentuh, padding, loading, empty, error, dan disabled state tetap terbaca.
- Tidak ada error JavaScript, aset rusak, overlap, clipping, atau overflow pada hasil render.

## 10. Pemeriksaan terhadap design system

Audit kode dan hasil render terhadap `DESIGN.md`. Pemeriksaan minimum mencakup font, warna,
radius, ukuran teks, panjang baris, overflow, clipping, kontras, state interaksi, serta tampilan
mobile dan desktop. Gunakan skrip proyek yang tersedia; jangan menambah dependency atau mengubah
CI tanpa persetujuan.

Temuan otomatis tetap harus dinilai berdasarkan konteks. Jangan mematikan aturan secara global
untuk satu false positive; catat pengecualian yang sempit dan beralasan.

## 11. Audit sebelum selesai

### Identitas dan token

- [ ] Semua font, warna, ukuran, radius, dan spacing mengikuti `DESIGN.md`.
- [ ] Tidak ada gradien, glow, glass, neon, atau dekorasi tren tanpa fungsi.
- [ ] Tidak ada nilai arbitrary baru jika token/komponen resmi tersedia.

### Tipografi

- [ ] Hierarki H1/H2/H3 jelas dan semantik.
- [ ] Body nyaman dibaca, tidak gepeng, tidak terlalu kecil, dan tidak justify.
- [ ] Panjang baris serta padding mobile terkendali.
- [ ] Label, heading, dan deskripsi tidak mengulang informasi.

### Layout

- [ ] Spacing menunjukkan hubungan informasi, bukan satu gap untuk semua.
- [ ] Tidak ada card berlapis, grid identik tanpa alasan, overflow, atau clipping.
- [ ] Satu elemen dominan per bagian; sisanya mendukung isi.

### Media

- [ ] Konsep yang perlu dilihat memiliki visual yang relevan.
- [ ] Gambar bukan dekorasi palsu dan bukan dokumentasi karangan.
- [ ] `alt`, ukuran/rasio, mode crop, caption, dan loading sesuai fungsi.

### Interaksi dan kualitas

- [ ] Focus, keyboard, reduced-motion, contrast, dan seluruh state tersedia.
- [ ] Tidak ada motion dekoratif, aset rusak, error JavaScript, atau konten tersembunyi.
- [ ] Hasil diperiksa pada mobile dan desktop yang relevan.

Jika sebuah pilihan tidak dapat dijelaskan melalui kebutuhan konten, identitas KCI, aksesibilitas, atau fungsi interaksi, hapus pilihan tersebut atau gunakan pola resmi yang lebih sederhana.
