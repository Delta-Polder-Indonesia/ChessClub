# Standar visual halaman KCI

Dokumen ini melengkapi `standar-markup.md`. Tujuannya bukan membuat design system baru, tetapi mencatat pola visual yang sudah dipakai KCI agar agent meniru implementasi existing, bukan menciptakan gaya UI baru.

## Prinsip utama

1. Cari implementasi existing yang paling dekat sebelum menulis class baru.
2. Utamakan keterbacaan, hierarki informasi, whitespace, dan konsistensi.
3. Tampilan harus terasa tenang, profesional, informatif, dan berwibawa.
4. Jangan mengejar tren visual yang tidak punya padanan di kode KCI.
5. Jika pola visual belum ada di KCI, cari padanan pada repo referensi yang ditunjuk pengguna (`DESIGN.md` §14); jika belum ada contoh yang relevan di kedua sumber, berhenti dan konfirmasi sebelum menciptakan pola baru.
6. Untuk halaman baru dengan referensi eksternal, telaah komponen sumber beserta markup, CSS, perilaku, dan responsivitasnya; susun urutan konten dahulu, lalu adaptasikan pola yang relevan ke primitif dan token KCI—jangan styling berdasarkan tebakan.

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
- Heading harus mengikuti hierarki semantik dan memakai satu skala display yang sudah ditetapkan (38–54px `font-serif font-light`, di luar `.prose-kci`). Jangan mengarang ukuran heading baru per halaman, dan jangan menaikkan ukuran hanya demi efek visual.
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

### Rating & ulasan

- Kartu ulasan bergaya datar: tanpa `shadow-*` atau efek mengambang.
- Waktu relatif (contoh: “2 hari yang lalu”) adalah teks biasa, bukan badge/chip/pill dan tanpa latar khusus.
- Tombol suka/tidak suka tidak memakai latar kapsul/kartu pada state normal, hover, maupun aktif. State aktif ditunjukkan lewat warna ikon jempol dan angka; ring fokus keyboard tetap boleh digunakan.

## Form

Form mengikuti keluarga alurnya, bukan standar artikel. Halaman konten biasa tidak membuat form dekoratif. Program non-catur, pendaftaran, dan Pengurus mempertahankan komponen domainnya; kontrol catur reusable berasal dari `Analisa/komponen/`.

## Notifikasi dan validasi form

- Sebelum menambah toast/notifikasi, gunakan pola atau primitive bersama yang sudah ada; jangan menempatkannya secara acak di alur konten.
- Notifikasi sementara harus berada pada lapisan overlay yang konsisten dan tidak mengubah tinggi/posisi layout, menutupi header, CTA, navigasi, atau kontrol penting.
- **Error validasi field wajib inline di samping field terkait; jangan tampilkan kartu/banner merah terpisah untuk error yang spesifik pada field.** Hindari kotak besar seperti “Silakan pilih bintang terlebih dahulu” yang disisipkan di antara field dan tombol submit atau di ruang kosong form.
- Tampilan inline yang diperbolehkan: label field bermasalah berwarna error; border kontrol terkait berwarna error; textarea boleh memakai latar error yang sangat pucat; pesan teks error biasa berada tepat di bawah kontrol atau kelompok kontrol (misalnya di bawah baris bintang). Pesan tidak memakai panel/kartu, border kotak, shadow, ikon dekoratif, atau latar merah pekat.
- Pesan harus menjelaskan masalah dan cara memperbaikinya; jangan mengandalkan warna saja. Hubungkan pesan ke input dengan `aria-describedby`, tandai `aria-invalid="true"`, dan pilih `role="alert"`/live region yang sesuai. Kelompok kontrol non-input harus memiliki nama aksesibel dan asosiasi pesan error.
- Tampilkan setelah aksi validasi (mis. submit), bersihkan error hanya ketika field terkait sudah valid, dan jangan menghapus kesalahan field lain yang belum diperbaiki.
- Sisakan slot stabil bila validasi muncul dinamis. Jangan menimpa label, input, helper, atau penghitung; teks panjang boleh menambah tinggi alami pada layar kecil tetapi tidak boleh menyebabkan overflow horizontal.
- Jangan menggandakan validasi field sebagai toast/banner global. Error non-field yang benar-benar global harus memakai pola status bersama yang telah ditetapkan.
- Uji desktop dan ponsel; pesan tidak boleh keluar layar atau menimbulkan overflow. Saat memodifikasi halaman, periksa notifikasi yang ada. Perbaiki gangguan lokal yang aman; jika perlu perubahan lintas halaman atau berisiko mengubah alur di luar tugas, laporkan temuan dan dampaknya sebelum memperluas cakupan.

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
- heading dengan ukuran di luar skala display yang ditetapkan
- emoji atau ikon dekoratif berlebihan
- banyak warna aksen
- animasi pada hampir semua elemen
- section yang hanya ada untuk dekorasi
- class warna/ukuran ad-hoc yang bertentangan dengan token KCI

Jika pengguna meminta halaman dibuat lebih `berwibawa`, interpretasi defaultnya adalah **lebih jelas, tenang, proporsional, dan konsisten dengan implementasi KCI existing**, bukan menambah efek visual.
