## 10. Semantik, State, dan Aksesibilitas

- Gunakan heading, list, table, figure, button, link, nav, dan dialog sesuai fungsi.
- Focus state harus terlihat dan seluruh kontrol dapat dipakai dengan keyboard.
- Warna tidak boleh menjadi satu-satunya penanda status.
- Form mempunyai label serta state error, success, disabled, dan loading yang jelas.
- Motion menghormati `prefers-reduced-motion`; konten tetap terlihat ketika animasi gagal atau dimatikan.
- Semua teks memenuhi WCAG AA.

### Penempatan notifikasi dan pola validasi form

- Toast/notifikasi sementara tidak boleh menambah tinggi alur dokumen, menggeser konten, atau menutupi kontrol penting. Gunakan pola notifikasi bersama yang sudah ada; tampilkan pada area overlay yang konsisten dan tidak bertumpuk dengan header, navigasi, CTA, atau kontrol mengambang.
- **Kesalahan validasi yang berasal dari field harus ditampilkan inline pada field tersebut, bukan sebagai kartu/banner terpisah untuk seluruh form.** Jangan menampilkan kotak merah berisi kalimat seperti “Silakan pilih bintang terlebih dahulu” di antara field dan tombol submit, di bagian atas/bawah form, atau di lokasi kosong lain. Error generik yang tidak terikat ke field adalah pengecualian dan harus memakai pola status bersama, tidak meniru validasi field.
- Pola inline yang diperbolehkan: label field yang bermasalah memakai warna error; border input/textarea atau kontrol terkait memakai warna error; untuk textarea boleh ada latar merah sangat pucat sebagai penanda halus; lalu pesan singkat berwarna error ditempatkan tepat setelah kontrol (di bawah input/textarea, atau di bawah kelompok kontrol seperti rating). Pesan berupa teks biasa—tanpa panel/kartu/banner, border kotak, bayangan, ikon dekoratif, atau latar merah yang kuat. Contoh: label “Ulasan Anda” dan tepi textarea berubah merah muda-merah, kemudian “Tulis ulasan Anda terlebih dahulu.” tampil di bawah textarea.
- Jangan mengandalkan warna saja: pesan harus menyebut masalah dan tindakan yang diperlukan. Hubungkan teks ke kontrol dengan `aria-describedby`, tandai kontrol invalid dengan `aria-invalid="true"`, dan gunakan `role="alert"` atau live region yang sesuai agar perubahan diumumkan tanpa mengganggu. Untuk kelompok non-input seperti rating, berikan nama aksesibel pada kelompok dan asosiasikan pesan error dengannya.
- Validasi hanya ditampilkan setelah ada aksi validasi yang sesuai (misalnya submit); hapus error field itu segera setelah nilainya valid. Jangan menghapus error field lain yang belum diperbaiki.
- Pesan validasi tidak boleh menimpa label, input, helper text, atau penghitung karakter. Sediakan slot/ruang minimum yang stabil bila pesan muncul dinamis agar layout tidak meloncat; jika pesan panjang membungkus pada layar sempit, biarkan tinggi slot bertambah secara alami tanpa overflow horizontal.
- Pastikan pesan tetap terlihat dan dapat digunakan pada desktop maupun ponsel, tidak keluar viewport, dan punya semantik aksesibel. Jangan menambahkan toast/banner untuk mengulang error yang sudah dijelaskan dekat field.
- Dilarang meletakkan notifikasi secara acak hanya karena ada ruang kosong. Pilih lokasi dengan hierarki dan whitespace yang rapi, konsisten, dan profesional.
- Pada setiap perubahan halaman, audit notifikasi yang tampil di halaman tersebut. Perbaiki notifikasi yang jelas menggeser, menutupi, atau merusak layout bila perbaikannya aman dan lokal. Jika perbaikan membutuhkan perubahan lintas halaman atau mengubah alur yang tidak terkait, laporkan temuan dan dampaknya kepada pengguna sebelum memperluas cakupan.

---

- **Batas permintaan (HTTP 429) tampil sebagai dialog, bukan baris teks.** Dashboard Pengurus memakai `DialogBatasPermintaan` di `ui.jsx`: ikon peringatan netral, judul, uraian, tombol Tutup dan Coba lagi. Hitungan mundur diambil dari header `Retry-After`, dan tombol Coba lagi nonaktif sampai hitungan habis. Tanpa warna merah/hijau dan tanpa bayangan. Dijaga `npm run uji:dialog-batas`.

## 11. Pengecualian Halaman Khusus

Analisa, Papan Interaktif, Teka-teki, Dashboard, pembaca e-book, grafik, tabel padat, dan Galeri boleh memakai kepadatan atau container khusus. Pengecualian:

- harus berasal dari kebutuhan tugas;
- hanya berlaku pada area tersebut;
- tidak boleh disalin ke artikel umum;
- tetap mematuhi minimum keterbacaan, semantik, keyboard, kontras, dan reduced-motion;
- harus tercatat di skill area atau komponen terkait.

Galeri (`src/halaman/MediaDanInformasi/Galeri.jsx`) memakai skala tipografi dan grid
tersendiri yang diadopsi dari markup konten (bukan komponen catur) sebuah situs
galeri contoh — dicatat lengkap di
`.agents/skills/kci-frontend/references/standar-galeri.md`. Skala itu hanya berlaku
di kerangka Galeri dan tidak mengubah §2/§6 di atas untuk halaman lain.

Landing (`/`, `src/halaman/Landing/`) memilot judul seksi dan label kecil dari
adopsi yang sama (bukan grid/lightbox Galeri) lewat `src/halaman/Landing/gayaTeks.jsx`
— dicatat di `references/standar-galeri.md` §2b. Ini pilot satu halaman; belum
menjadi keputusan untuk mengubah skala H2 global.

---

## 12. Urutan Otoritas

1. Permintaan eksplisit pengguna untuk tugas aktif.
2. `AGENTS.md` untuk cakupan dan proses.
3. `DESIGN.md` ini untuk seluruh keputusan visual.
4. Skill `kci-frontend` untuk implementasi.
5. Skill `kci-anti-slop` untuk audit larangan.
6. Implementasi existing yang masih sesuai standar ini.

Dokumen atau kode lama yang bertentangan tidak menjadi preseden. Jangan memperbaikinya secara massal tanpa persetujuan cakupan.

---

## 13. Arsitektur Komponen Satu Pintu per Domain

“Satu pintu” berlaku **di dalam domain yang sama**, bukan satu bentuk untuk seluruh situs. Konten editorial, fitur belajar, papan catur, analisa, dan dashboard mempunyai kebutuhan serta karakter berbeda.

| Domain | Sumber resmi | Batas |
|---|---|---|
| Halaman konten publik | `src/components/PageBagian.jsx`, `src/components/konten/AksiKonten.jsx`, dan `src/components/konten/TabelKonten.jsx` | Tipografi, bagian, media, kutipan, catatan, aksi, serta tabel konten |
| Program dan fitur belajar non-catur | komponen di `src/halaman/ProgramKami/` | Tidak mengikuti bentuk artikel **maupun pintu CSS komponen**; pertahankan karakter fitur dan alurnya |
| Seluruh antarmuka catur | `src/halaman/Analisa/komponen/` | Satu rumah papan, bidak, jam, evaluasi, nama pemain, panel, indikator, dan ikon catur untuk Analisa, Papan Interaktif, Teka-teki, Quiz, serta Rush |
| Mode/alur catur | folder halaman masing-masing | Hanya orkestrasi, state, dan logika mode; jangan membuat ulang komponen visual catur yang sudah ada |
| Pengurus/dashboard | `src/components/ui/`, komponen Pengurus, dan pintu CSS `src/gaya/components/` | Tabel padat, form operasional, dialog, dan state administrasi |
| Ikon umum non-catur | `lucide-react` dan `src/components/icons.jsx` | Ikon catur tetap berasal dari `Analisa/komponen/svg/` |

### Pintu CSS komponen

`src/gaya/components/index.css` adalah satu-satunya sumber bentuk dasar tombol,
input, kartu, lencana, pesan, modal, dropdown, dan sejenisnya. Pintu itu dipasang
**sekali** di `src/index.css` (bukan per halaman) dan dijaga `scripts/uji-impor-css.mjs`.
Varian tombol: `btn-biasa`, `btn-utama`, `btn-padat`, `btn-bahaya`, ukuran
`btn-kecil`, `btn-rapat`, `btn-lebar`, `btn-ikon`. Status migrasi per gelombang ada di
`src/gaya/components/MIGRASI-1-PINTU.md`; panduan pemakaian di `PANDUAN-1-PINTU.md`.

Aturan:

- Halaman konten tidak menciptakan bentuk tombol, tabel, media, atau blok baru di setiap halaman; gunakan pintu konten.
- Tombol, input, dan kartu memakai kelas pintu CSS di atas; kelas Tailwind dipakai untuk tata letak, bukan untuk membentuk ulang visual komponen yang sudah ada di pintu.
- Komponen Program Kami, antarmuka catur, dan Pengurus tidak dipaksa memakai rupa halaman konten.
- Halaman Program Kami **tidak memakai kelas pintu CSS** (`btn`, `card`, `badge`, `alert`, `form-input`, dan sejenisnya). Pintu itu bentuk dasar antarmuka umum; Program Kami mempertahankan bentuk fiturnya sendiri. `uji:desain` menolak kelas pintu di `src/halaman/ProgramKami/`.
- Semua fitur catur mencari dan memperluas `src/halaman/Analisa/komponen/` sebelum membuat komponen visual lokal.
- Folder Papan Interaktif, Teka-teki, Quiz, dan Rush boleh menyimpan komponen orkestrasi yang khusus alur, tetapi bukan salinan papan, bidak, ikon, jam, evaluasi, atau kontrol catur umum.
- Komponen lintas domain boleh berbagi perilaku aksesibel, tetapi keluarga domain menentukan bentuk visualnya.
- Jangan memindahkan ikon atau komponen catur ke komponen halaman umum hanya demi menyatukan rupa.
- Kode lama dimigrasikan per domain; keberadaan pola lama bukan izin menambah variasi baru.
