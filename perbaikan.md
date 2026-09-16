# Prompt Perbaikan Menyeluruh: Pendaftaran Anggota ChessClub

> Dokumen ini adalah instruksi kerja untuk agent coding. Jangan langsung mengubah `main`. Kerjakan pada branch/PR yang sedang ditugaskan.

## Peran

Anda bertindak sebagai senior full-stack engineer, application-security reviewer, dan QA engineer untuk ChessClub, aplikasi React + Vite dengan backend Node.js.

Fokus pekerjaan: memperbaiki alur pendaftaran anggota pada folder:

- `src/halaman/PendaftaranAnggota/`
- `src/components/VerifikasiAkun.jsx`
- `src/lib/api/anggota.js`
- `src/lib/api/core.js`
- `src/lib/identitas.js`
- `server/src/keanggotaan.js`
- `server/src/oauth.js`
- `server/src/verifikasi-profil.js`
- `server/src/rute.js`
- `server/src/skema.js`
- `server/src/konfigurasi.js`
- file i18n/terjemahan yang berkaitan
- test yang relevan

Jangan melakukan refactor besar, perubahan desain visual yang tidak diminta, penggantian framework, atau penghapusan file yang tidak berkaitan.

---

## Tujuan utama

Pastikan pendaftaran anggota:

1. Memiliki alur yang jelas dari awal sampai berhasil.
2. Tidak menganggap pengguna telah memiliki akun Chess.com hanya karena mengetik ulang kode.
3. Tidak mempercayai status sukses dari frontend sebagai bukti keamanan.
4. Memastikan verifikasi yang diwajibkan benar-benar divalidasi server.
5. Memastikan tiket verifikasi terikat pada username yang didaftarkan.
6. Mencegah replay tiket.
7. Menangani kegagalan, timeout, refresh, dan sesi kedaluwarsa dengan jelas.
8. Menolak duplikasi username dan data tidak valid secara konsisten.
9. Tidak menghilangkan data pengguna secara diam-diam ketika parsing atau request gagal.
10. Mempertahankan tampilan dan pengalaman pengguna yang sudah ada sejauh tidak bertentangan dengan keamanan.

---

## Temuan audit yang harus diperiksa dan diperbaiki

### 1. Verifikasi cepat/manual tidak boleh dianggap sebagai bukti kepemilikan

Pada `src/components/VerifikasiAkun.jsx`, jalur `handleCepat` saat ini membandingkan kode yang diketik pengguna dengan kode yang sedang ditampilkan di UI. Kode tersebut bukan bukti bahwa pengguna menguasai akun Chess.com.

Masalah:

- pengguna dapat mengetik ulang kode yang terlihat;
- tidak ada login ke Chess.com;
- tidak ada pemeriksaan profil Chess.com;
- tidak ada penerbitan tiket server;
- status frontend dapat berubah menjadi sukses.

Perbaikan yang diharapkan:

- jangan gunakan istilah `terverifikasi` atau `sukses` untuk jalur ini;
- ubah menjadi `pengajuan manual`, `menunggu pemeriksaan pengurus`, atau hapus jalur tersebut;
- jika jalur manual dipertahankan, statusnya harus `pending`, bukan `verified`;
- backend tidak boleh menganggap jalur manual sebagai bukti kepemilikan;
- jangan memberikan tiket verifikasi sah untuk jalur manual tanpa pemeriksaan pengurus yang benar-benar tercatat.

### 2. Verifikasi profil publik harus memiliki kontrak server yang jelas

Jalur verifikasi profil membaca profil Chess.com dari browser dan mencari kode pada profil. Periksa apakah hasil ini benar-benar mengakibatkan penerbitan tiket server.

Perbaikan yang diharapkan:

- frontend hanya mengirim permintaan verifikasi ke server;
- server mengambil atau memvalidasi data profil yang diperlukan, atau setidaknya menerima hasil browser hanya sebagai input yang belum dipercaya;
- server menerbitkan tiket melalui fungsi resmi seperti `terbitkanTiket()` setelah verifikasi berhasil;
- frontend menyimpan tiket yang diterbitkan server;
- submit pendaftaran mengirim tiket tersebut;
- backend memanggil `pakaiTiket(tiket, username)` dan menolak jika tidak cocok;
- jangan menerima field seperti `mode`, `sumber`, `kode`, atau `profil` dari frontend sebagai bukti keamanan tanpa validasi server.

Jika verifikasi profil memang tidak dapat dibuat aman secara server-side, ubah statusnya menjadi pengajuan manual dan jangan menyebutnya verifikasi otomatis.

### 3. Pastikan konfigurasi `wajibVerifikasi` tidak membuat verifikasi menjadi dekoratif

Periksa seluruh konfigurasi yang mengatur mode:

- `off`;
- `opsional`;
- `wajib`.

Pastikan perilaku UI dan backend konsisten.

Jika UI mengatakan verifikasi wajib:

- backend harus menolak pendaftaran tanpa tiket sah;
- tiket harus terikat dengan username;
- tiket palsu, kedaluwarsa, sudah dipakai, atau milik username lain harus ditolak.

Jika mode `opsional` memang sengaja dipertahankan:

- UI harus menjelaskan bahwa verifikasi tidak wajib;
- jangan menampilkan seolah-olah pendaftaran sudah diverifikasi;
- jangan memberikan label anggota terverifikasi kepada pendaftar tanpa tiket.

Jangan mengubah default konfigurasi secara sembarangan. Dokumentasikan keputusan yang dipilih.

### 4. Samakan aturan username frontend dan backend

Saat ini terdapat perbedaan pola validasi:

- frontend menerima `[A-Za-z0-9_-]{3,30}`;
- backend menerima `[a-z0-9_-]{3,25}`.

Buat satu aturan kanonik yang digunakan bersama atau pastikan kedua sisi identik.

Tentukan dan dokumentasikan:

- panjang minimum;
- panjang maksimum;
- karakter yang diizinkan;
- apakah huruf kapital diperbolehkan;
- bagaimana normalisasi dilakukan;
- bagaimana username disimpan;
- bagaimana username dibandingkan.

Rekomendasi:

- normalisasi dengan `trim()` dan `toLowerCase()`;
- validasi setelah normalisasi;
- gunakan hasil normalisasi untuk pencarian, tiket, duplikasi, dan penyimpanan;
- jangan sampai username lolos frontend tetapi ditolak backend.

Tambahkan test untuk:

- username kapital;
- username dengan spasi awal/akhir;
- username 25, 26, dan 30 karakter;
- karakter terlarang;
- username kosong;
- username yang sama dengan perbedaan kapitalisasi.

### 5. Validasi JWT OAuth harus lebih ketat

Pada `server/src/oauth.js`, periksa klaim berikut:

- `alg` harus `RS256`;
- `kid` harus cocok dengan kunci publik yang tersedia;
- tanda tangan harus valid;
- `iss` harus ada dan sesuai dengan issuer Chess.com;
- `aud` harus ada dan mencakup client ID aplikasi;
- `exp` harus ada, berupa angka yang valid, dan belum kedaluwarsa;
- `nbf` jika ada harus dihormati;
- `sub` atau identitas utama harus ada;
- `preferred_username`/`username` harus divalidasi dan dinormalisasi.

Jangan hanya melakukan pemeriksaan jika klaim tersedia. Untuk klaim yang diwajibkan, ketiadaan klaim harus menyebabkan token ditolak.

Jangan meneruskan detail token mentah atau isi exception teknis ke pengguna.

### 6. Periksa ketahanan penyimpanan tiket OAuth

Saat ini sesi OAuth dan tiket disimpan di `Map` memori proses.

Evaluasi deployment aktual:

- apakah backend hanya satu proses;
- apakah dapat berjalan pada beberapa instance/serverless;
- apakah restart menghilangkan tiket;
- apakah request callback dan submit dapat masuk ke instance berbeda.

Jika sistem memang satu proses, dokumentasikan keterbatasannya.

Jika deployment multi-instance atau serverless, gunakan storage bersama yang sesuai. Jangan membuat solusi kompleks tanpa bukti kebutuhan. Apa pun keputusan akhirnya, tambahkan penjelasan di dokumentasi dan test perilaku kedaluwarsa/restart jika memungkinkan.

### 7. Tangani tiket kedaluwarsa dan kegagalan submit

Skenario yang harus ditangani:

- tiket kedaluwarsa;
- tiket sudah dipakai;
- tiket tidak cocok dengan username;
- server restart setelah tiket diterbitkan;
- database gagal setelah tiket berhasil dipakai;
- pengguna menekan tombol submit dua kali;
- koneksi terputus;
- pengguna membuka dua tab.

Frontend harus menampilkan pesan yang spesifik dan dapat ditindaklanjuti, misalnya:

> Sesi verifikasi telah kedaluwarsa. Silakan ulangi verifikasi akun Chess.com.

Jangan menampilkan pesan umum yang menyembunyikan penyebab utama.

Jika tiket memang sekali pakai dan dihapus sebelum penyimpanan selesai, dokumentasikan konsekuensinya dan sediakan alur verifikasi ulang.

### 8. Jangan mempercayai field keamanan dari frontend

Periksa apakah backend menggunakan field berikut sebagai sumber kebenaran:

- `mode`;
- `sumber`;
- `kode`;
- `profil`;
- `terverifikasi`;
- `usernameVerifikasi`;
- `tiketVerifikasi`.

Hanya `tiketVerifikasi` yang diterbitkan server boleh menjadi bukti verifikasi otomatis. Field lain boleh dipakai sebagai metadata tampilan, tetapi tidak boleh menentukan keputusan keamanan.

### 9. Periksa validasi tanggal lahir dan umur

Audit `src/lib/identitas.js` serta validasi backend.

Pastikan:

- format tanggal konsisten;
- tanggal masa depan ditolak;
- tanggal tidak valid ditolak;
- tanggal kabisat ditangani benar;
- perhitungan umur tidak bergantung secara keliru pada timezone;
- umur frontend dan backend sama;
- nilai kosong, `null`, dan string aneh ditangani jelas;
- umur di luar rentang kebijakan ditolak dengan pesan yang tepat.

Jangan hanya mengandalkan validasi frontend.

### 10. Periksa duplikasi dan race condition pendaftaran

Audit apakah dua request bersamaan dapat mendaftarkan username yang sama.

Pastikan:

- pengecekan duplikasi dilakukan di backend;
- penyimpanan memiliki mekanisme unik atau pemeriksaan atomik jika storage mendukung;
- dua klik submit tidak membuat dua anggota;
- perbedaan kapitalisasi tidak menghasilkan duplikasi;
- respons duplikasi memiliki status HTTP yang sesuai, misalnya `409`.

### 11. Periksa daftar hitam dan urutan validasi

Pastikan pendaftar yang masuk daftar hitam tidak dapat mendaftar melalui variasi:

- kapitalisasi berbeda;
- spasi awal/akhir;
- username dengan format berbeda;
- request langsung ke API tanpa UI.

Pastikan validasi keamanan dilakukan sebelum data disimpan.

### 12. Periksa CSRF, rate limit, dan abuse control

Audit endpoint `POST /api/anggota` dan mekanisme umum di `server/src/http.js` atau `src/lib/api/core.js`.

Pastikan:

- request POST memerlukan CSRF token jika arsitektur menggunakannya;
- token CSRF tidak dapat dipakai sebagai tiket verifikasi;
- endpoint pendaftaran memiliki rate limit;
- error tidak membocorkan data internal;
- request terlalu besar ditolak;
- input tidak dapat menyebabkan injection atau penyimpanan HTML berbahaya;
- username dan teks profil di-escape saat ditampilkan.

### 13. Perbaiki lifecycle timer dan effect React

Audit:

- timer toast;
- timer status salin kode;
- timer navigasi;
- effect pengambilan profil;
- perubahan bahasa/i18n;
- unmount komponen;
- request yang selesai setelah komponen ditutup.

Masalah yang harus diperbaiki:

- timer lama menghapus toast baru;
- timer tetap berjalan setelah komponen unmount;
- navigasi tetap terjadi setelah pengguna membatalkan;
- request lama menimpa hasil request baru;
- dependency `useEffect` tidak lengkap, termasuk fungsi `t` jika memang digunakan;
- state loading atau error menjadi tidak konsisten.

Gunakan cleanup effect, `clearTimeout`, dan mekanisme pembatalan request jika diperlukan. Jangan membuat memory leak.

### 14. Perbaiki sessionStorage hasil OAuth

Saat membaca `kci-hasil-verifikasi`:

- jangan menghapus item sebelum JSON berhasil diparse;
- gunakan `try/catch`;
- validasi struktur data;
- pastikan username dan tiket tersedia serta bertipe string;
- hapus item setelah data valid berhasil diproses;
- jika data rusak, hapus dengan aman dan tampilkan pesan yang sesuai;
- jangan menganggap data sessionStorage sebagai bukti keamanan tanpa tiket server.

### 15. Periksa fallback roster dan error masking

Audit fallback `ambilDaftarAnggota()` atau `ambilRosterPublikChess`.

Pastikan:

- roster publik Chess.com tidak otomatis dianggap sebagai anggota resmi ChessClub;
- anggota resmi dan data eksternal diberi label berbeda;
- kegagalan backend tidak disamarkan seolah-olah sistem sehat;
- admin/pengguna mendapat informasi bahwa data yang tampil adalah fallback atau snapshot lama;
- fallback tidak memengaruhi keputusan pendaftaran, leaderboard, atau hak anggota.

### 16. Periksa penggunaan parameter `platform`

Jika fungsi menerima `platform`, pastikan perilakunya benar-benar mendukung platform yang disebutkan.

Jika hanya Chess.com yang didukung:

- jangan memberi kesan Lichess atau platform lain sudah didukung;
- gunakan nama parameter yang jelas;
- dokumentasikan batasan tersebut.

---

## Kontrak alur yang diharapkan

### Jalur OAuth

```text
Pengguna memilih login Chess.com
    -> server membuat state + PKCE
    -> pengguna login di Chess.com
    -> callback server menerima code + state
    -> server menukar code dengan token
    -> server memvalidasi JWT secara ketat
    -> server mengambil username terverifikasi
    -> server menerbitkan tiket sekali pakai
    -> frontend menerima username + tiket
    -> pengguna mengisi formulir
    -> frontend mengirim tiket bersama username normalisasi
    -> backend memvalidasi tiket dan username
    -> backend memvalidasi seluruh data
    -> backend menyimpan anggota
    -> backend mengembalikan sukses
```

### Jalur verifikasi profil

Gunakan salah satu desain yang benar:

1. Server memverifikasi profil dan menerbitkan tiket; atau
2. jalur dinyatakan sebagai pengajuan manual/pending dan tidak menghasilkan status verified.

Jangan membuat status verified hanya berdasarkan callback frontend.

### Jalur manual

Jika dipertahankan:

```text
Pengguna mengirim pengajuan
    -> status pending
    -> pengurus memeriksa secara terpisah
    -> pengurus menyetujui/menolak
    -> status resmi diperbarui di backend
```

Mengetik ulang kode yang ditampilkan tidak boleh dianggap sebagai verifikasi kepemilikan.

---

## Persyaratan UX

- Jangan mengubah tampilan besar-besaran.
- Pertahankan bahasa Indonesia yang natural dan jelas.
- Bedakan status:
  - belum diverifikasi;
  - sedang memverifikasi;
  - berhasil diverifikasi;
  - menunggu pemeriksaan manual;
  - verifikasi kedaluwarsa;
  - verifikasi gagal.
- Tombol submit harus disabled saat request berjalan.
- Tampilkan error di dekat bagian yang relevan.
- Jangan menghapus input pengguna tanpa alasan.
- Setelah error jaringan, pengguna dapat mencoba lagi tanpa mengisi ulang semuanya.
- Jangan menampilkan token tiket kepada pengguna kecuali memang diperlukan untuk debugging lokal.

---

## Persyaratan test

Tambahkan atau perbarui test untuk minimal skenario berikut:

### Verifikasi

- kode manual tidak menghasilkan status verified;
- tiket kosong ditolak saat mode wajib;
- tiket palsu ditolak;
- tiket kedaluwarsa ditolak;
- tiket sudah dipakai ditolak;
- tiket milik username lain ditolak;
- tiket OAuth valid diterima;
- username kapital dan lowercase diperlakukan konsisten;
- frontend tidak dapat menentukan status verified hanya dengan field `mode` atau `sumber`.

### OAuth JWT

- signature salah ditolak;
- `kid` tidak dikenal ditolak;
- issuer salah ditolak;
- issuer kosong ditolak jika diwajibkan;
- audience salah ditolak;
- audience kosong ditolak;
- expiration hilang ditolak;
- token kedaluwarsa ditolak;
- algoritma selain RS256 ditolak;
- username tidak tersedia ditolak.

### Pendaftaran

- data valid berhasil;
- username duplikat ditolak;
- duplikasi beda kapitalisasi ditolak;
- data tanggal tidak valid ditolak;
- tanggal masa depan ditolak;
- umur di luar batas ditolak;
- daftar hitam ditolak;
- submit dua kali tidak membuat duplikasi;
- request tanpa CSRF ditolak jika CSRF diwajibkan;
- error database tidak menghilangkan kemampuan retry.

### Frontend lifecycle

- timer toast lama tidak menghapus toast baru;
- timer dibersihkan saat unmount;
- sessionStorage JSON rusak tidak menyebabkan crash;
- sessionStorage tidak dihapus sebelum parsing berhasil;
- request profil lama tidak menimpa request terbaru;
- perubahan bahasa tidak membuat pesan stale.

---

## Prosedur kerja wajib

1. Baca seluruh file terkait sebelum mengubah apa pun.
2. Petakan alur aktual frontend dan backend.
3. Pisahkan temuan menjadi:
   - terbukti dari kode;
   - potensi yang bergantung konfigurasi/deployment;
   - perlu test untuk konfirmasi.
4. Buat perubahan sekecil mungkin tetapi lengkap secara keamanan.
5. Jangan menghapus fitur tanpa memberikan alasan dan pengganti yang jelas.
6. Jangan mengubah `main` langsung.
7. Kerjakan pada branch baru.
8. Jalankan lint, unit test, build, dan test endpoint yang relevan.
9. Jika test tidak tersedia, buat test minimal untuk kasus keamanan utama.
10. Periksa diff agar tidak ada perubahan tidak terkait.
11. Buat ringkasan file yang berubah.
12. Jelaskan risiko yang masih tersisa.
13. Buat pull request dengan judul dan deskripsi yang jelas.

---

## Kriteria penerimaan

Pekerjaan dianggap selesai hanya jika:

- tidak ada lagi jalur yang menganggap ketik ulang kode sebagai bukti kepemilikan;
- status verified hanya berasal dari bukti yang divalidasi server;
- mode wajib benar-benar diwajibkan backend;
- tiket terikat username dan sekali pakai;
- aturan username frontend/backend konsisten;
- validasi JWT memiliki klaim wajib yang ketat;
- error kedaluwarsa dan retry ditangani;
- duplikasi dan race condition ditangani;
- test keamanan utama lulus;
- build dan lint lulus;
- tidak ada perubahan tidak terkait;
- dokumentasi PR menjelaskan keputusan desain dan batasan deployment.

---

## Format laporan akhir agent

Berikan laporan dengan struktur:

1. Ringkasan perubahan.
2. Temuan yang diperbaiki.
3. File yang diubah.
4. Perubahan perilaku pengguna.
5. Test yang dijalankan dan hasilnya.
6. Risiko atau keterbatasan yang masih ada.
7. Cara reviewer menguji secara manual.
8. Link atau nomor PR.

Jangan menyatakan aman secara mutlak. Gunakan istilah yang tepat seperti `diperbaiki berdasarkan test yang tersedia`, `belum dapat diverifikasi`, atau `masih bergantung pada konfigurasi deployment` jika memang demikian.
