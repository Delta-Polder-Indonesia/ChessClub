# Pola Bug yang Sering Jeblok di KCI

Daftar periksa spesifik proyek untuk dijalankan saat meninjau. Berpasangan dengan
enam kategori umum di `SKILL.md §4`. Pola di sini ditulis berdasarkan regresi yang pernah
terjadi (lihat pesan commit dan riwayat skrip `uji-*`) — bila Anda menemukan pola baru,
tambahkan ke daftar ini agar tertangkap di tinjauan berikutnya.

---

## Frontend — React, Vite, Tailwind, Radix

1. **`import.meta.glob` tanpa guard `typeof`** — glob Vite adalah ekspansi waktu kompilasi;
   bila jalur tidak cocok, hasilnya `{}` dan papan tampil tanpa bidak tanpa galat
   (regresi PR #167, commit 85ddcfa). Skrip `uji:glob-aset` menegakkan ini — pastikan
   pemanggilan baru memakai guard yang sama dan skrip glob-aset ikut memeriksanya.
2. **State papan diangkat ke konteks global** — perubahan state tak terkait (bahasa,
   tab terbuka, tema, notifikasi) memaksa papan dan bidak dirender ulang. Baca aturan
   pemisahan state di `kci-frontend` "Komponen, state, dan render".
3. **`React.memo` ditaburkan tanpa pengukuran** — repo ini belum memakai `React.memo`;
   `useMemo`/`useCallback` hanya dipakai bila profiler menunjukkan biaya nyata. Peninjau
   harus menanyakan bukti ukur bila ada penambahan memo baru.
4. **`prose-kci` menimpa utilitas judul** — `<h2>` di dalam `.prose-kci` punya
   specificity (0,1,1) yang mengalahkan kelas utilitas seperti `text-xl`; judul
   display harus diletakkan di luar wrapper (lihat `DESIGN.md §2` "Aturan Satu Suara").
5. **Membuat komponen `Hero`/`Section`/`Card`/`Tombol` versi sendiri** — harus memakai
   kerangka yang ada (`PageBagian.jsx`, `konten/*`, `Tombol.jsx`, primitif `ui/`).
   Penyimpangan dari kerangka adalah temuan desain (bukan gaya).
6. **`VITE_*` env var baru yang berisi hal sensitif** — semua yang berprefiks `VITE_`
   ter-bundle ke peramban dan dapat dibaca siapa pun.
7. **Lupa `React.lazy` untuk komponen berat** — `GrafikTools` dan `pdfjs-dist` harus
   dimuat dinamis; pemuatan statis akan menaikkan ukuran bundel awal dan merusak
   target Lighthouse 100.
8. **Hardcode `localhost` atau domain absolut di kode klien** — API harus memakai
   `VITE_API_DASAR` (kosong = same-origin `/api`).
9. **Kunci terjemahan hanya ditambah di satu bahasa** — harus ada di `id/` dan `en/`;
   `npm run uji:i18n` akan gagal jika tidak.
10. **Gambar tanpa dimensi (`width`/`height` atau `aspect-ratio`)** — menyebabkan
    *layout shift*; patuhi `DESIGN.md §9` dan `uji:gambar`.
11. **Teks di bawah 12px, `rounded-3xl`, gradien dekoratif, glow/`shadow-[0_0_...]`,
    emoji di UI** — semuanya ditolak oleh guardrail desain (`DESIGN.md` dan
    `kci-anti-slop`); `npm run uji:desain` mendeteksi banyak di antaranya.
12. **Progress bar Tonggak tidak merah** — `AGENTS.md` mewajibkan `text-[red]`/
    `border-[red]`; jangan ganti warna.

---

## Papan catur, engine, dan mode interaktif

1. **Payload klien (SAN/UCI/FEN/langkah) dipercaya tanpa verifikasi ulang** — server
   dan logika inti harus membangun ulang lewat `chess.js` (en passant, rokade, promosi,
   petak jalan dua langkah bidak). Jangan pernah menyimpan langkah dari klien sebagai
   kebenaran.
2. **Promosi tanpa tentukan buah** — `chess.move({ from, to })` pada promosi melempar;
   selalu tentukan `promotion` bila bidak masuk ke baris akhir.
3. **Worker UCI tidak dibersihkan saat unmount** — `terminate()` worker dan batalkan
   pesan yang sedang terbang (`AbortController`/flag `dibatalkan`) agar tidak ada
   pesan datang ke komponen yang sudah lepas (memory leak dan state update di
   unmounted component).
4. **Komentator klasifikasi dimuat ulang di setiap render** — komentator master
    (`data:komentator-master`) dipakai bersama; `npm run uji:komentator` memeriksa
    integrasinya.
5. **`setTimeout`/`tunggu(ms)` dengan durasi tetap di uji jsdom** — DOM kadang belum
    selesai menulis; pakai `tungguSampai(predikat, tenggat)` seperti di
    `uji-ebook-pembaca` dan `uji-animasi-bidak`.
6. **Navigasi riwayat langkah yang mematahkan `chess.move()`** — membangun ulang
    posisi dari FEN lebih aman daripada memutar ulang langkah saat loncat banyak
    langkah (lihat `PapanTekaTeki` dan `PapanInteraktif`).
7. **Aset bidak jalur relatif tidak cocok** — `muatSet` harus mengembalikan 12 aset
    tanpa nilai kosong dan jatuh ke set bawaan untuk set tak dikenal
    (`npm run uji:render-bidak`).
8. **Mode Manusia vs Mesin tidak menunggu balasan mesin** — interaksi harus menunggu
    `engine.move()` selesai sebelum menerima klik pemain berikutnya (dideteksi
    `uji:animasi-bidak` dan `uji:analisa-e2e`).

---

## Backend — Node, Supabase, auth, rute

1. **Endpoint baru tanpa skema zod di `server/src/skema.js`** — daftarkan di
   `server/src/rute.js` dan gunakan `pastikanAdmin`/`pastikanMaster` untuk aksi pengurus.
2. **Membaca `process.env` di luar `server/src/konfigurasi.js`** — semua konfigurasi
   harus lewat satu modul itu.
3. **`VITE_` env atau rahasia di file yang masuk bundel** — `SUPABASE_SERVICE_ROLE_KEY`,
   `JWT_SECRET`, kredensia pihak ketiga hanya boleh ada di server.
4. **Aksi tulis tanpa CSRF token** — permintaan yang mengubah keadaan harus menyertakan
   `X-CSRF-Token` (`npm run uji:api-csrf`).
5. **ID pengguna diambil dari parameter, bukan sesi** — IDOR: selalu ambil id dari
   JWT/sesi terverifikasi, bukan dari body/query.
6. **Rute terdaftar tetapi tidak diperbarui di daftar uji/rute** — `npm run uji:rute`
   memeriksa rute publik terdaftar dan tidak 404; tambahkan rute baru ke peta uji.
7. **`bersihkanFen()` tidak dipakai sebelum meneruskan ke layanan luar/Stockfish** —
   FEN tidak sah diteruskan ke API luar atau engine berperilaku tidak terduga.
8. **Percabangan `periksaProduksi()` yang dilonggarkan** — server tetap fail-closed;
   jangan "buat jalan" agar server tetap hidup dengan konfigurasi rusak.
9. **Kesegaran daftar klub** — snapshot yang melewati `KCI_CHESS_KLUB_SNAPSHOT_TUNGU`
   harus disegarkan di dalam permintaan (serverless membekukan pekerjaan latar belakang
   setelah respons terkirim); `npm run uji:roster-segar` menegakkan ini.
10. **JWT tidak diverifikasi di setiap rute pengurus/master** — jangan mengandalkan
    frontend menyembunyikan tautan; middleware/handler harus memverifikasi.
11. **Dependensi produksi baru tanpa persetujuan** — server hanya boleh mengimpor
    `bcryptjs`, `jsonwebtoken`, `zod`, `@supabase/supabase-js`, dan modul bawaan Node
    (lihat `kci-standar-kode §1`).

## Basis data dan penyimpanan

1. **Migrasi kolom NOT NULL tanpa backfill baris lama** — gunakan default atau isi
   ulang sebelum menerapkan NOT NULL.
2. **Penyimpanan dua kebenaran untuk turunan posisi** — FEN aktif, daftar langkah,
   bidak tertangkap, dan katalog pembukaan adalah turunan dari state posisi/riwayat;
   jangan simpan sebagai state terpisah yang bisa melenceng.
3. **Tulis tanpa transaksi saat multi-tabel harus atomik** — gunakan transaksi
   Supabase/Postgres atau tulis berurutan dengan rollback bila langkah awal gagal.
4. **IndexedDB menolak versi skema baru** — perubahan skema Basis Data Lokal harus
   menambah versi dan migrasi; `npm run uji:basisdata` memeriksa.

## CSP, jaringan, dan deployment

1. **Domain API/gambar/font baru tidak masuk `connect-src`/`img-src`/`font-src`**
   di `vercel.json` — CSP adalah *allowlist* tertutup; `npm run uji:konfigurasi-keamanan`
   dan tes muat halaman akan mendeteksi.
2. **URL canonical menunjuk ke domain preview/localhost** — canonical harus dari
   variabel server-only.
3. **Redirect loop atau API menunjuk ke domain yang sama setelah DNS cutover**.
4. **Mixed content (http:// di dalam halaman https://)**.
5. **`/public/google800ae0ab9c9d6db7.html` atau verifikasi Search Engine lain terhapus**
   — jangan hapus file verifikasi yang dibutuhkan.
6. **Cache header terlalu agresif pada aset yang berubah** — aset statis memakai
   *content hash* dari Vite; konten dinamis jangan di-cache terlalu lama.
7. **Percobaan ulang ke layanan pihak ketiga (Chess.com, Lichess, Supabase) tanpa
   *backoff* dan batas** — bisa memicu rate limit dan blokir IP server.

## Konten, desain, dan aksesibilitas

1. **Placeholder kontak `+62 61 123 4567` atau `info@komunitascatur.or.id` dianggap
   asli** — itu placeholder, harus diganti sebelum rilis (belum ada uji otomatis;
   waspada saat tinjauan halaman kontak).
2. **Teks meta/alt/caption berbahaya (mengarang nama, tanggal, testimoni)** —
   `DESIGN.md §5` melarang metrik/testimonial/dokumentasi karangan.
3. **Heading yang melompati level** (H1 → H3 tanpa H2), atau lebih dari satu H1 per
   halaman.
4. **`justify` pada teks isi** — `DESIGN.md §2` mewajibkan rata kiri (start).
5. **Warna sebagai satu-satunya penanda status** — harus ada indikator lain
   (ikon, teks, pola).
6. **`prefers-reduced-motion` diabaikan** — semua animasi harus mematuhi preferensi.
7. **Tidak ada focus state yang terlihat** — seluruh kontrol harus dapat dipakai
   keyboard.

## Tooling dan cermin skill

1. **Menyunting `.agents/skills/*` tanpa memperbarui `.opencode/skills/*`** — dua
   folder harus identik (`diff -rq .agents/skills .opencode/skills`).
2. **Skrip `uji:*` baru tidak ditambahkan ke rantai `npm run uji` atau ke CI
   `.github/workflows/quality.yml`** — akibatnya uji baru tidak pernah berjalan otomatis.
3. **Menambah aturan ESLint yang tidak diberlakukan (`warn` padahal seharusnya
   `error`)** — proyek memakai `--max-warnings 0`; level `warn` efektif menjadi
   wajib, jadi pastikan aturan baru memang siap dinyalakan di seluruh repo.
4. **File yang dibaca `import.meta.glob` tidak ikut ter-*bundle*** — pastikan pola
   glob sesuai dengan ekstensi dan lokasi aset.
