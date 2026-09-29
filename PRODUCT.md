# Product — Komunitas Catur Indonesia (KCI)

## Platform

web

Rancangan: React 18, Vite 6, Tailwind CSS v4, react-router-dom v7. Stack ini
sudah dijawab oleh basis kode (`package.json`) dan tidak lagi dicatat sebagai
keputusan produk.

## Users

1. **Pecatur & Komunitas (Umum):** Pemula hingga master yang mencari materi belajar, e-book panduan, teka-teki taktik catur, dan jadwal turnamen.
2. **Pemain Interaktif & Analisa:** Pengguna alat analisa catur Stockfish/Sunfish, papan interaktif, dan kuis catur.
3. **Pengurus & Penyelenggara:** Mengelola jadwal turnamen, keanggotaan, sertifikasi, dan publikasi media.

## Product Purpose

KCI menyediakan portal resmi, sarana edukasi, dan arena digital catur terpadu untuk komunitas catur di Indonesia. Portal ini mengintegrasikan repositori materi pembelajaran catur berstandar tinggi, alat analisa catur berbasis web yang ringan dan cepat, serta pusat informasi kegiatan resmi.

## Positioning

Situs resmi komunitas dan organisasi catur dengan gaya **Editorial Formal / Academic Journal / Restrained Corporate**. Bukan sekadar situs SaaS modern dengan animasi kosong, melainkan platform yang tenang, terpercaya, berwibawa, dan cepat diakses di berbagai perangkat di seluruh Indonesia.

## Operating Context & Visitor Modes

- **Persuade (`/`, `/tentang-kami`, `/pendaftaran-anggota`):**
  Meyakinkan calon anggota, peserta turnamen, dan mitra. Menampilkan profil
  komunitas, program utama, dan ajakan bergabung yang lugas. Galeri foto masih
  berupa tata letak contoh dan belum menampilkan dokumentasi kegiatan nyata.
- **Operate (`/papan-interaktif`, `/program-kami/analisa`, `/teka-teki`, `/quiz-catur`):**
  Mengutamakan efisiensi ruang papan catur, kejelasan tombol kontrol langkah, respons instan engine catur, dan minim gangguan visual.
- **Read (`/program-kami/ebook-panduan`, `/media-dan-informasi`):**
  Mengutamakan kenyamanan membaca artikel dan buku catur. Menggunakan lebar kontainer teks ideal (45–75 karakter per baris), tipografi tegas, dan navigasi daftar isi yang jelas.

## Capabilities and Constraints

**Permukaan yang ada**

- **Alat catur interaktif:**
  - Papan interaktif (`/papan-interaktif`) dengan tiga mode: Analisa, Manusia vs
    Mesin, dan Latihan Repertoar.
  - Analisa partai (`/program-kami/analisa`, papan layar penuh di
    `/program-kami/analisa/papan`): impor PGN/FEN, mesin Stockfish 17/18 (lite &
    single) dan Sunfish di `public/engines/`, klasifikasi dan sacrifice, langkah
    kritis, komentar, variasi, deteksi kecurangan, laporan ACPL & akurasi, serta
    basis data partai peramban.
  - Teka-teki skakmat (`/teka-teki`, 5.486 soal) dan mode berjangka
    (`/teka-teki-rush`) dengan papan, gestur, tanda, dan animasi bidak yang sama.
  - Kuis catur trivia (`/quiz-catur`).
  - Buku Pembukaan: 18.713 jalur dari `lichess-org/chess-openings` (CC0), pohon
    langkah pertama, katalog keluarga pembukaan yang bisa dicari.
  - Perpustakaan e-book: 32 PDF di `public/ebooks/` (`/program-kami/ebook-panduan`).
- **Komunitas dan organisasi:**
  - Turnamen (bulanan, terbuka, liga musiman, liga antar komunitas) dengan
    pendaftaran, klasemen, dan daftar juara.
  - Media & Informasi: berita, pengumuman, galeri (57 sampel di
    `public/Galeri_sample/`).
  - Keberlanjutan: pendaftaran anggota, syarat dan ketentuan, kode etik, FAQ,
    bantuan, privasi.
  - Area pengurus `/pengurus`: dashboard terpisah tanpa navbar/footer publik,
    tidak ditautkan dari menu mana pun, dilindungi `ProtectedRoute` yang
    memverifikasi token ke server sebelum halaman dirender.

**Batasan teknis yang mengikat**

- Frontend dan backend produksi berjalan dalam satu proyek Vercel. Backend
  adalah kode Node tanpa framework di `server/`, diekspos lewat Serverless
  Function `api/[...jalur].js`; frontend memanggilnya relatif melalui `/api/*`.
- Penyimpanan runtime: Supabase `kci_storage` (satu tabel key-value, RLS aktif
  tanpa policy anon, hanya service role dari server) dengan fallback berkas JSON
  lokal. Latihan di sisi peramban memakai IndexedDB.
- Roster anggota diambil dari Published Data API Chess.com untuk klub
  [BLUNDER SKUAD](https://www.chess.com/club/blunder-skuad) dan di-cache
  maksimal sekali per 12 jam. Verifikasi kepemilikan akun Chess.com saat
  pendaftaran diatur environment `KCI_WAJIB_VERIFIKASI` (`off` / `opsional`
  bawaan / `wajib`).
- Skrip Stockfish dijalankan sebagai worker dan dimuat sesuai kebutuhan, bukan
  di dalam bundel awal.
- Seluruh rute dimuat malas dengan `React.lazy`; prefetch chunk berjalan saat
  tautan terlihat atau di-hover agar pindah halaman tidak menunggu unduhan.
- Bahasa antarmuka: Indonesia dan Inggris lewat kamus di `src/lib/terjemahan/`
  dan tombol ganti bahasa di header. Sumber konten berbahasa Indonesia lebih
  kaya daripada terjemahannya.

**Fakta produk yang belum diputuskan**

- Lisensi dan atribusi 5.486 soal teka-teki tidak tercatat di halaman Atribusi
  (`/program-kami/atribusi`), berbeda dari buku pembukaan yang lisensinya jelas
  (CC0) dan Stockfish (GPL-3.0). Future work tidak boleh mengarang lisensinya.
- `KCI_WAJIB_VERIFIKASI` masih `opsional` di produksi; belum ada keputusan
  apakah verifikasi akun menjadi syarat wajib pendaftaran.

## Brand Commitments & Voice

- **Nada Suara:** Berwibawa, jernih, faktual, tanpa basa-basi (*formal Indonesian, no SaaS buzzwords*).
- **Karakter Visual:** Rapi, berbobot, mengutamakan whitespace dan garis 1px tipis daripada tumpukan bayangan tebal.
- **Hindari AI Slop:** Dilarang menggunakan gradien warna ungu/pink, bayangan neon glow, 3 kartu identik klise, kicker berulang di atas setiap judul, emoji dekoratif, dan teks klaim palsu.
- **Nama dan kepemilikan:** "Komunitas Catur Indonesia (KCI)", dikembangkan dan
  dijalankan oleh Delta-Polder-Indonesia (Bintang Toba). Kode berlisensi MIT
  (© 2025–2026). KCI tidak berafiliasi dengan maupun didukung oleh Chess.com, LLC
  atau lichess.org; merek dan logo pihak ketiga muncul sebagai atribusi saja.
  Pernyataan ini sudah tercetak di halaman Atribusi dan tidak boleh dilonggarkan.
- **Atribusi sebagai produk, bukan catatan kaki:** halaman
  `/program-kami/atribusi` adalah halaman utuh, bukan popup. Setiap aset pihak
  ketiga yang dipakai (gambar bidak, buku pembukaan, engine, suara papan, logo)
  wajib punya entri di sana.

## Evidence on Hand

Konten nyata yang tersedia di repositori dan boleh dipakai sebagai bukti:

| Bukti | Lokasi | Jumlah |
| --- | --- | --- |
| Soal teka-teki skakmat | `public/data/teka-teki.json` | 5.486 |
| Jalur buku pembukaan (CC0) | `public/data/buku-pembukaan.json` | 18.713 |
| Peta posisi untuk Analisa | `public/data/buku-analisa.json` | 11.957 kunci FEN |
| PDF e-book | `public/ebooks/` | 32 |
| Mesin catur | `public/engines/` | Stockfish 17/18 (lite & single), Sunfish |
| Foto galeri sampel | `public/Galeri_sample/` | 57 |
| Gambar konten | `public/images/`, `public/gambar_comentator/` | — |
| Aset merek | `public/favicon.svg`, `public/favicon-32.png`, `public/favicon-64.png`, `public/apple-touch-icon.png` | — |
| Roster klub | Published Data API Chess.com (BLUNDER SKUAD), di-cache 12 jam | — |
| Dokumen akurasi | `docs/PERBANDINGAN-METRIK-AKURASI.md`, `docs/REVIEW-PERBAIKAN-LATIHAN.md` | — |
| Peta kode | `docs/PETA-KODE.md` (dijaga oleh `npm run uji:peta`) | — |

**Ketiadaan yang tidak boleh dikarang:** belum ada testimoni pengguna, nama
klien, studi kasus, angka pengguna, atau statistik penggunaan. Halaman mana pun
yang membutuhkan angka seperti itu harus menyatakan kekurangannya, bukan
mengisinya. Galeri saat ini berisi sampel, bukan dokumentasi kegiatan nyata yang
sudah berlabel.

## Product Principles

1. **Fakta mendahului gaya.** Nama fitur disebut langsung ("Papan Analisa
   Stockfish", "Buku Panduan PDF"), angka berasal dari data yang benar-benar ada
   di repositori, dan halaman yang belum punya bukti menyatakan kekurangannya.
2. **Tenang dan berwibawa, bukan ramai.** Whitespace, garis 1px, dan satu aksen
   warna mengalahkan gradien, glow, dan tumpukan bayangan.
3. **Papan adalah isi utama.** Di setiap permukaan catur, ruang untuk petak dan
   kejelasan kontrol langkah mendahulukan chrome, hiasan, dan promosi.
4. **Satu kebenaran, banyak bahasa.** Kamus terjemahan adalah satu-satunya sumber
   teks antarmuka, dan angka serta metrik memakai metode yang sama dengan acuan
   publik (lichess / en-croissant) supaya bisa dibandingkan.
5. **Cepat di jaringan lambat.** Lazy route, aset terkompresi, font self-hosted,
   dan engine on-demand adalah default; Lighthouse 100 adalah sasaran, bukan
   kebetulan.

## Accessibility & Inclusion

Standar yang mengikat: **WCAG 2.2 level AA** sebagai syarat produk, bukan
pilihan. Secara konkret:

- Kontras teks dan latar minimal 4.5:1 untuk teks biasa dan 3:1 untuk teks besar,
  termasuk state interaktif seperti tombol terpilih dan penanda langkah.
- Kontrol papan dan setiap kontrol kustom dapat dijangkau serta dioperasikan
  dengan keyboard, dengan fokus yang selalu terlihat; tombol ikonik seperti
  ganti bahasa dan ikon papan memakai `aria-label`.
- Struktur dokumen tetap bermakna: satu `<main>` per halaman, urutan heading
  berjenjang, dan atribut bahasa dokumen yang benar saat kamus Inggris aktif.
- Gerakan dan animasi menghormati `prefers-reduced-motion`.
- Tidak ada informasi yang disampaikan hanya lewat warna, gradien, atau posisi.
  Penanda langkah dan gerakan bidak harus tetap terbaca oleh pengguna dengan
  gangguan penglihatan warna, karena penanda catur tidak pernah menjadi satu-satunya
  pembawa makna.
- Bahasa Indonesia adalah bahasa utama produk, bukan terjemahan; istilah teknis
  catur (PGN, FEN, ECO, ACPL) dipertahankan dalam bentuk aslinya.
