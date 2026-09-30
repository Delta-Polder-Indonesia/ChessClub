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
- Teks utama: token palet situs `text-grey-800` (utama) / `text-grey-600` (sekunder) — lihat `DESIGN.md` §1.
- Teks sekunder: `text-gray-500` / `text-gray-600`.
- Garis: `border-grey-200` / `border-guide`.
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

Implementasi existing yang menjadi referensi saat ini menggunakan pola sederhana seperti `bg-primary px-4 py-2 text-xs font-semibold text-white` dengan hover opacity dan tanpa radius dekoratif. Lihat `src/components/DaftarTurnamen.jsx`.

Aturan:

- Gunakan `bg-primary` untuk aksi utama.
- Teks putih, weight semibold.
- Padding mengikuti implementasi existing.
- Hover sederhana (`opacity` atau pola existing), bukan transform, glow, atau animasi berlebihan.
- Jangan membuat tombol pill/full-rounded hanya karena tren.

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

Jika sebuah blok memang sudah berupa card pada implementasi existing, cari komponen/halaman tersebut dan tiru struktur serta tokennya.

- Hindari `shadow-*` untuk section/card biasa.
- Gunakan `border-t`, `border-b`, atau `border-guide` jika pola existing menggunakannya.
- Radius hanya jika implementasi existing yang relevan memang menggunakannya.

## Form

Gunakan label yang jelas, input sederhana, border tipis, background yang tenang, dan focus state berbasis `border-primary` seperti pola existing. Jangan membuat field bergaya glass/neumorphism.

Referensi konkret: `src/components/DaftarTurnamen.jsx`.

## Tabel dan data

Untuk data terstruktur, cari tabel existing terlebih dahulu. Referensi saat ini adalah `tabel-kci` dan `tabel-peringkat` di `src/components/DaftarTurnamen.jsx`.

Jangan mengganti tabel informatif menjadi card grid hanya untuk alasan estetika.

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
