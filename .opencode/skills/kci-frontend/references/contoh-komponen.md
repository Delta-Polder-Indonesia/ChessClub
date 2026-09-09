# Contoh komponen frontend KCI

Dokumen ini adalah katalog rujukan implementasi. Agent wajib membuka source file sebelum meniru pola; jangan mengandalkan deskripsi ini sebagai pengganti kode existing.

## Aturan penggunaan

1. Tentukan kebutuhan UI.
2. Cari contoh yang paling dekat di katalog.
3. Buka file sumbernya dan baca konteks markup serta class.
4. Tiru pola existing dengan perubahan seminimal mungkin.
5. Jika tidak ada contoh yang cocok, jangan mengarang design pattern baru tanpa persetujuan pengguna.

## Referensi utama

| Kebutuhan | Implementasi rujukan | Pola |
| --- | --- | --- |
| Kerangka halaman publik | `src/components/PageLayout.jsx` | Header/footer standar |
| Kerangka halaman isi | `src/components/PageBagian.jsx` | `HalamanIsi`, hero, breadcrumb, next page |
| Artikel | `src/components/PageBagian.jsx` | `PageArtikel` + `prose-kci` |
| Tombol utama | `src/components/DaftarTurnamen.jsx` | `bg-primary`, padding sederhana, semibold, hover opacity |
| Tombol submit/disabled | `src/components/DaftarTurnamen.jsx` | tombol primary + `disabled:opacity-40` |
| Aksi sekunder | `src/components/DaftarTurnamen.jsx` | text action, tanpa card dekoratif |
| Form input | `src/components/DaftarTurnamen.jsx` | border tipis, background putih, focus border primary |
| Blok form | `src/components/DaftarTurnamen.jsx` | border-y + background slate sederhana |
| Tabel data | `src/components/DaftarTurnamen.jsx` | `tabel-kci tabel-peringkat` |
| Empty/loading state | `src/components/DaftarTurnamen.jsx` | teks singkat, tenang, tanpa ilustrasi dekoratif |
| Link utama | `src/components/DaftarTurnamen.jsx` | `text-primary` + hover underline bila sesuai konteks |
| Halaman panjang | `src/halaman/TentangKami/TentangKami.jsx` | section + `StickyMenu` |
| Halaman bertab | `src/halaman/TentangKami/StrukturGrupCatur/StrukturGrupCatur.jsx` | pola tab existing |
| Daftar konten | `src/components/DaftarKontenMedia.jsx` dan `src/halaman/MediaDanInformasi/` | daftar konten KCI |
| Quick links | `src/halaman/Turnamen/Turnamen.jsx` | heading + ikon inline + Link |

## Tombol

Sebelum membuat tombol baru, buka `src/components/DaftarTurnamen.jsx` dan cari `bg-primary`. Gunakan struktur existing sebagai baseline. Jangan menambahkan radius, shadow, gradient, icon, atau motion hanya karena dianggap lebih modern.

## Form

Sebelum membuat form baru, buka bagian `form` di `src/components/DaftarTurnamen.jsx`. Pertahankan label, input, border, focus state, spacing, dan disabled state yang relevan. Perubahan hanya boleh dilakukan jika kebutuhan form memang berbeda.

## Tabel

Sebelum membuat tabel baru, cari `tabel-kci` dan `tabel-peringkat`. Pertahankan sistem tabel existing dan jangan mengganti bentuk data hanya untuk estetika.

## Halaman

Untuk halaman publik baru, mulai dari `HalamanIsi` dan `PageArtikel`. Untuk halaman panjang, gunakan `TentangKami.jsx` sebagai pembanding. Untuk konten media, gunakan implementasi di `MediaDanInformasi` sebagai pembanding.

## Prinsip peniruan

Source code existing adalah sumber kebenaran untuk detail yang belum ditulis di dokumen ini. Jika dokumen dan implementasi existing tampak berbeda, jangan menebak: baca implementasi terbaru dan laporkan perbedaannya sebelum melakukan perubahan besar.
