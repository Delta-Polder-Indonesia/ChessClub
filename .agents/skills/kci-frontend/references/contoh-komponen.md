# Contoh komponen frontend KCI

Dokumen ini adalah katalog rujukan implementasi. Agent wajib membuka source file sebelum meniru pola; jangan mengandalkan deskripsi ini sebagai pengganti kode existing.

## Aturan penggunaan

1. Tentukan kebutuhan UI.
2. Cari contoh yang paling dekat di katalog.
3. Buka file sumbernya dan baca konteks markup serta class.
4. Tiru pola existing dengan perubahan seminimal mungkin.
5. Jika tidak ada contoh yang cocok, jangan mengarang design pattern baru tanpa persetujuan pengguna.

## Halaman acuan aktif

`src/halaman/ProgramKami/ProgramKami.jsx` adalah acuan pertama untuk halaman informasi/program. Halaman ini menunjukkan penggunaan `BagianKonten`, `TeksPembuka`, `GambarKonten`, measure bacaan, daftar definisi program, tautan tindakan, serta media ilustratif yang disebut jujur sebagai ilustrasi. Acuan ini tidak otomatis berlaku untuk berita, panduan langkah, tabel data, atau workspace.

## Referensi utama

| Kebutuhan | Implementasi rujukan | Pola |
| --- | --- | --- |
| Kerangka halaman publik | `src/components/PageLayout.jsx` | Header/footer standar |
| Kerangka halaman isi | `src/components/PageBagian.jsx` | `HalamanIsi`, hero, breadcrumb, next page |
| Artikel | `src/components/PageBagian.jsx` | `PageArtikel` + `prose-kci` |
| Bagian konten standar | `src/components/PageBagian.jsx` | `BagianKonten` |
| Lead/pengantar | `src/components/PageBagian.jsx` | `TeksPembuka` |
| Gambar informatif + caption | `src/components/PageBagian.jsx` | `GambarKonten` |
| Kutipan bersumber | `src/components/PageBagian.jsx` | `KutipanKonten` |
| Catatan pendukung | `src/components/PageBagian.jsx` | `CatatanKonten` |
| Tombol konten | `src/components/konten/AksiKonten.jsx` | `AksiKonten` dengan varian domain konten |
| Tautan aksi konten | `src/components/konten/AksiKonten.jsx` | `TautanKonten` |
| Tabel artikel | `src/components/konten/TabelKonten.jsx` | keluarga tabel semantik untuk bacaan |
| Media/catatan/kutipan | `src/components/PageBagian.jsx` | komponen konten resmi |
| Form fitur | komponen domain pemilik fitur | jangan memaksakan form artikel ke fitur |
| Empty/loading state | `src/components/ui/{empty,spinner,skeleton}.jsx` | state resmi sesuai jenis proses |
| Link bergaya aksi | `src/components/ui/button.jsx` | `Button asChild` + `Link` |
| Halaman panjang | `src/halaman/TentangKami/TentangKami.jsx` | section + `StickyMenu` |
| Halaman bertab | `src/halaman/TentangKami/StrukturGrupCatur/StrukturGrupCatur.jsx` | pola tab existing |
| Daftar konten | `src/components/DaftarKontenMedia.jsx` dan `src/halaman/MediaDanInformasi/` | daftar konten KCI |
| Quick links | `Button asChild variant="text"` + `Link` | ikon resmi opsional, bukan SVG inline |

## Tombol konten

Halaman konten memakai `AksiKonten` atau `TautanKonten` dari `src/components/konten/AksiKonten.jsx`. Program Kami non-catur dan Pengurus memakai pintu domainnya. Seluruh antarmuka catur—termasuk Papan Interaktif, Teka-teki, Quiz, dan Rush—mengambil komponen reusable dari `src/halaman/Analisa/komponen/`.

## Form

Form bukan pola umum artikel. Gunakan komponen domain pemilik alur: fitur belajar tetap di Program Kami, kontrol permainan tetap di domain permainan, dan form operasional tetap di Pengurus/`components/ui`.

## Tabel konten

Artikel memakai keluarga `TabelKonten`. Dashboard dan fitur memakai tabel domainnya sendiri. Jangan membuat div-grid menyerupai tabel atau mengubah data tabular menjadi card hanya untuk estetika.

## Halaman

Untuk halaman publik baru, mulai dari `HalamanIsi` dan `PageArtikel`. Untuk halaman panjang, gunakan `TentangKami.jsx` sebagai pembanding. Untuk konten media, gunakan implementasi di `MediaDanInformasi` sebagai pembanding.

## Prinsip peniruan

`DESIGN.md` dan primitif resmi adalah sumber kebenaran. Source existing hanya contoh jika masih sesuai keduanya. Jika implementasi lama berbeda, jangan menyalinnya ke kode baru dan jangan memigrasikannya di luar cakupan yang disetujui.
