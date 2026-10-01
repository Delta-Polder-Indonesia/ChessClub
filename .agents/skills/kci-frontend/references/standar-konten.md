# Standar konten halaman KCI

Dokumen ini menerjemahkan `DESIGN.md` menjadi keputusan implementasi. Jika nilainya berbeda, `DESIGN.md` yang berlaku.

## 1. Pilih jenis halaman sebelum menulis

| Jenis | Kerangka utama | Lebar bacaan | Visual wajib ketika |
| --- | --- | --- | --- |
| Informasi organisasi/program | `HalamanIsi` + `PageArtikel` | 65–75ch | membahas struktur, kegiatan, fasilitas, atau hasil |
| Artikel edukasi | `HalamanIsi` + `PageArtikel` | 65–75ch | konsep membutuhkan contoh, diagram, posisi, atau perbandingan |
| Berita kegiatan | kerangka media existing | 65–75ch | selalu ada dokumentasi utama jika berita membahas kegiatan nyata |
| Panduan | `HalamanIsi` + langkah bernomor | 65–75ch | langkah bergantung pada tampilan atau kontrol aplikasi |
| Daftar/tabel | kerangka halaman + area lebar | teks 65–75ch; tabel boleh lebar | data lebih jelas lewat tabel, grafik, atau legenda |
| Galeri/visual | kerangka Galeri (`references/standar-galeri.md`) | lebar visual | visual adalah isi utama |
| Workspace/alat | kerangka fitur khusus | sesuai ruang kerja | gambar bukan pengganti kontrol interaktif |

Jangan memakai kerangka workspace untuk artikel atau memaksa artikel menjadi grid card.

## 2. Skala tipografi konten

Gunakan peran, bukan memilih ukuran berdasarkan selera.

| Peran | Mobile | Desktop | Leading | Catatan |
| --- | --- | --- | --- | --- |
| Judul display (H1 hero dan H2 bagian) | 38px | 54px | 1.04 | `font-serif font-light`, satu skala untuk H1 dan H2 alike; hierarki dari warna dan posisi, bukan ukuran |
| Subjudul dalam `.prose-kci` | 24px | 24px | 1.33 | hasil `.prose-kci h2`; `text-*` pada h2 di dalam wrapper ini kalah specificity |
| H3 subseksi | 18px | 20px | 1.35–1.45 | label kartu ringkas boleh 14px |
| H4 kelompok | 16px | 18px | 1.4 | hanya jika ada H3 induk |
| Lead | 17px | 18px | 1.6 | satu pengantar ringkas |
| Body/list | 16px | 16px | 1.6 | serif, rata kiri |
| Caption/meta | 13px | 13px | 1.5 | tetap terbaca, bukan teks dekoratif |
| UI padat | 12px minimum | 12px minimum | 1.4 | hanya kontrol/label, bukan paragraf |

Judul display **wajib diletakkan di luar `.prose-kci`**: lewat slot `title` pada `PageArtikel`,
atau `h2` yang menjadi saudara `prose-kci` pada komponen seksi (`Sekilas`, `VisiMisi`,
`MaknaLogo`, `Tonggak`, `CorporateSection`). Alasannya struktural — `.prose-kci h2` specificity
(0,1,1) menang atas kelas utilitas seperti `text-xl`, jadi `text-*` pada `h2` di dalam wrapper
itu adalah kode mati. Gaya display persis: `font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800`.

Aturan:

- Body tidak memakai tracking; gunakan default font.
- Tracking negatif hanya dapat dipakai pada display besar yang telah diuji.
- Maksimum tiga weight dalam satu halaman: 400, 500/600, dan 700 bila benar-benar diperlukan.
- Paragraf tidak memakai `text-*`, `leading-*`, warna, atau weight lokal jika sudah berada dalam `.prose-kci`.
- Jangan memakai `text-[…]` baru untuk teks konten. Tambahkan peran ke design system jika kebutuhan nyata belum tercakup.
- Teks di bawah 12px dilarang.

## 3. Lebar dan container

| Area | Aturan |
| --- | --- |
| Bacaan panjang | 65–75ch; jangan `max-w-none` pada paragraf |
| Halaman konten | container 1080px dengan padding 24px mobile dan 32px desktop |
| Visual/tabel lebar | boleh keluar dari measure bacaan hingga container halaman |
| Galeri/alat | memakai kerangka khusus yang terdokumentasi |
| Full bleed | hanya media yang membutuhkan ruang; teks kembali ke measure bacaan |

Pada layar sempit, teks wajib memiliki padding lateral dan tidak boleh menyentuh tepi viewport.

## 4. Ritme vertikal

- Judul lebih dekat ke isi sesudahnya daripada blok sebelumnya.
- Elemen satu kelompok: 8–16px.
- Antarkelompok: 24–32px.
- Antarbagian utama: 64–80px.
- Paragraf berurutan: 20px.
- Paragraf ke gambar penjelas: 24–32px.
- Gambar ke caption: 8px.
- Caption ke teks lanjutan: 24px.
- H2 memiliki ruang atas lebih besar daripada ruang bawah.

Jangan memakai satu `gap` untuk seluruh halaman. Kedekatan menunjukkan hubungan informasi.

## 5. Anatomi halaman

### Informasi organisasi atau program

1. Hero: judul dan deskripsi faktual.
2. Lead: konteks dan tujuan.
3. Bagian utama: satu gagasan per H2.
4. Visual setelah objek/kegiatan pertama kali dijelaskan.
5. Data, daftar, atau tabel bila informasi terstruktur.
6. Halaman berikutnya.

### Artikel edukasi

1. Hero atau masthead.
2. Lead.
3. Gambar pembuka jika topik bersifat visual.
4. H2 untuk pokok bahasan.
5. H3 untuk rincian yang benar-benar berada di bawah H2.
6. Diagram, posisi catur, atau contoh di dekat penjelasan.
7. Penutup yang menyelesaikan pembahasan tanpa CTA generik.

### Berita kegiatan

1. Judul, tanggal, dan metadata yang benar.
2. Lead yang menjawab inti peristiwa.
3. Foto utama dokumentasi.
4. Isi kronologis atau tematis.
5. Foto lanjutan hanya jika menambah informasi.
6. Caption menyebut konteks yang dapat diverifikasi.

### Panduan

1. Tujuan dan hasil yang diharapkan.
2. Prasyarat.
3. Langkah bernomor dalam urutan nyata.
4. Screenshot setelah langkah yang memerlukan pengenalan visual.
5. State berhasil dan masalah umum.

### Daftar dan data

1. Pengantar singkat.
2. Filter hanya jika datanya memerlukan penyaringan.
3. Gunakan list untuk urutan/koleksi dan table untuk relasi baris-kolom.
4. Sediakan loading, empty, error, dan success state.
5. Jangan mengubah tabel menjadi card hanya untuk mobile; gunakan prioritas kolom atau overflow terkontrol.

## 6. Komponen dan markup

- Gunakan `HalamanIsi` untuk hero, metadata, breadcrumb, dan navigasi lanjutan.
- Gunakan `PageArtikel` untuk bacaan biasa.
- Gunakan `.prose-kci` untuk paragraf, heading internal, list, dan tautan artikel.
- Gunakan `<figure>` dan `<figcaption>` untuk media berketerangan.
- Gunakan `<ol>` hanya untuk urutan; `<ul>` untuk koleksi tanpa urutan.
- Gunakan `<table>` untuk data tabular, bukan div-grid tiruan.
- Gunakan `<button>` untuk aksi dan `<a>/<Link>` untuk navigasi.

Jangan menambahkan wrapper, card, label, atau ikon jika tidak menyampaikan hubungan atau tindakan baru.

## 7. Pemeriksaan sebelum selesai

- Jenis halaman dan kerangkanya jelas.
- H1 hanya satu; H2/H3 tidak meloncat.
- Semua paragraf memakai ukuran, leading, warna, dan measure resmi.
- Tidak ada teks konten di bawah 12px atau class ukuran arbitrary baru.
- Spacing membedakan elemen terkait dari bagian berbeda.
- Konsep visual memiliki media yang relevan atau kebutuhan asetnya dilaporkan.
- Mobile tidak overflow, tidak menyentuh tepi, dan tidak memotong teks/gambar penting.
