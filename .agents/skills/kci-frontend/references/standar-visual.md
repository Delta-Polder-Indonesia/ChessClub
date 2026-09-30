# Standar visual halaman KCI

Dokumen ini melengkapi `standar-markup.md`. Tujuannya bukan membuat design system baru, tetapi mencatat pola visual yang sudah dipakai KCI agar agent meniru implementasi existing, bukan menciptakan gaya UI baru.

## Prinsip utama

1. Cari implementasi existing yang paling dekat sebelum menulis class baru.
2. Utamakan keterbacaan, hierarki informasi, whitespace, dan konsistensi.
3. Tampilan harus terasa tenang, profesional, informatif, dan berwibawa.
4. Jangan mengejar tren visual yang tidak punya padanan di kode KCI.
5. Jika pola visual yang dibutuhkan belum punya contoh existing, berhenti pada tahap analisis dan tanyakan pengguna sebelum menciptakan pola baru.

## Warna

Gunakan token yang sudah ada, bukan warna acak per komponen:

- Aksen utama: `#0b2f9f` melalui `text-primary` / `bg-primary`.
- Teks utama: `text-grey-800`.
- Teks sekunder, deskripsi, metadata, dan caption: `text-grey-600`.
- Garis: `border-grey-200` / `border-guide` sesuai implementasi resmi.
- Jangan memakai `text-gray-*`, `text-slate-*`, atau hex langsung untuk teks konten baru; jika kode lama masih memakainya, jangan salin penyimpangan itu.
- Latar hero: `bg-hero`.
- State sukses/peringatan/error: ikuti kelas yang sudah dipakai implementasi existing; jangan membuat palet status baru tanpa kebutuhan.

Hindari gradient, glow, glassmorphism, neon, background dekoratif, dan banyak warna aksen.

## Typography

- Pertahankan tipografi global KCI.
- Konten artikel wajib menggunakan `prose-kci` melalui `PageArtikel`.
- Jangan menambahkan ukuran, warna, atau weight per paragraf jika `prose-kci` sudah mengaturnya.
- Heading harus mengikuti hierarki semantik. Jangan membesarkan H1/H2 hanya untuk efek visual.
- Hindari display text raksasa, huruf kapital dekoratif, dan kombinasi font yang tidak digunakan KCI.

## Layout dan spacing

- Gunakan container dan batas lebar yang sudah diberikan komponen halaman KCI.
- Prioritaskan whitespace dan pemisah 1px daripada kartu bertumpuk.
- Gunakan gap/padding yang konsisten dengan halaman pembanding.
- Jangan membuat section penuh viewport hanya untuk efek dramatis.
- Responsive harus mempertahankan hierarki informasi; pada layar kecil, konten boleh menumpuk secara natural.

## Tombol dan aksi

### Tombol utama

Halaman konten memakai `AksiKonten` dan `TautanKonten` dari `src/components/konten/AksiKonten.jsx`.

Aturan:

- Pilih varian `utama`, `sekunder`, atau `teks` berdasarkan fungsi.
- Halaman konten tidak menentukan ulang warna, border, radius, padding, tinggi, focus, atau disabled state.
- Ikon hanya ditambahkan bila memperjelas arah atau jenis tindakan.
- Program Kami non-catur dan Pengurus mengikuti pintu domainnya; seluruh kontrol catur reusable berasal dari `src/halaman/Analisa/komponen/`.

### Aksi sekunder

Gunakan pola text/border yang sudah ada pada halaman pembanding. Aksi sekunder tidak boleh memiliki bobot visual yang mengalahkan aksi utama.

### Larangan

- gradient button
- glow button
- floating action button dekoratif tanpa kebutuhan
- ikon dekoratif di setiap tombol
- animasi scale/bounce berlebihan

## Card, blok, dan section

Default KCI adalah konten terbuka dengan whitespace dan garis pemisah. Jangan mengubah setiap kelompok informasi menjadi card dengan shadow.

Halaman konten tidak memakai card operasional dari `components/ui`. Gunakan section terbuka, `CatatanKonten`, spacing, atau divider sesuai makna.

- Hindari `shadow-*` untuk section/blok konten biasa.
- Card khusus fitur tetap berada di domain fitur dan tidak menjadi contoh artikel.

## Form

Form mengikuti keluarga alurnya, bukan standar artikel. Halaman konten biasa tidak membuat form dekoratif. Program non-catur, pendaftaran, dan Pengurus mempertahankan komponen domainnya; kontrol catur reusable berasal dari `Analisa/komponen/`.

## Tabel dan data

Artikel memakai keluarga `TabelKonten` dari `src/components/konten/TabelKonten.jsx`. Dashboard dan fitur memakai tabel domainnya sendiri. Jangan mengganti tabel informatif menjadi card grid hanya untuk alasan estetika.

## Navigasi dan tautan

- Gunakan pola header/footer `PageLayout`.
- Gunakan `StickyMenu` untuk halaman panjang yang memang membutuhkan scroll-spy.
- Tautan utama menggunakan `text-primary` dan hover yang sederhana.
- Jangan menambahkan underline/ikon/animasi jika tidak ada padanan pada pola existing.

## Motion

Motion adalah pendukung informasi, bukan dekorasi utama.

- Jangan menambahkan animasi ke semua elemen.
- Hindari stagger animation, parallax, floating objects, bouncing, glow pulse, dan entrance animation berlebihan.
- Untuk state interaktif, gunakan transition sederhana yang sudah lazim di kode existing.
- Jika sebuah halaman sudah bekerja tanpa motion, jangan menambahkan motion hanya untuk membuatnya terlihat modern.

## Anti-AI-slop checklist

Sebelum menyelesaikan perubahan visual, pastikan tidak ada:

- gradient yang tidak punya referensi existing
- glassmorphism / blur dekoratif
- shadow besar pada card
- pill button yang tidak punya referensi
- heading raksasa tanpa kebutuhan informasi
- emoji atau ikon dekoratif berlebihan
- banyak warna aksen
- animasi pada hampir semua elemen
- section yang hanya ada untuk dekorasi
- class warna/ukuran ad-hoc yang bertentangan dengan token KCI

Jika pengguna meminta halaman dibuat lebih `berwibawa`, interpretasi defaultnya adalah **lebih jelas, tenang, proporsional, dan konsisten dengan implementasi KCI existing**, bukan menambah efek visual.
