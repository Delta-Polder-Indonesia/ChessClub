---
name: kci-standar-kode
description: Standar kualitas kode KCI (anti "AI slop") - pola yang dilarang (duplikasi logika catur, fungsi raksasa, komentar redundan, impor mati, eror yang ditelan), pemisahan logika inti catur dari UI dan jaringan, batas kinerja render serta engine worker, dan validasi masukan di sisi server. Untuk metodologi peninjauan (pin-down scope, verifikasi temuan, tingkat keparahan, format laporan) dan daftar pola bug spesifik proyek, gunakan kci-review. Use when writing code in any area or before a change is declared ready.
metadata:
  project: chessclub-kci
  area: quality
---

# Standar Kualitas Kode KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo**. Untuk alur uji per area, buka
`.agents/skills/kci-pengujian/references/alur-uji-per-area.md`.

Skill ini menetapkan standar mutu, bukan izin memperluas cakupan. Audit kebersihan berkas di luar
permintaan tetap butuh persetujuan pengguna (lihat "Scope and approval gate" di `AGENTS.md`).

Skill ini lintas area; aturan spesifik tetap tinggal di tempatnya:
`kci-frontend` (visual, markup, Lighthouse), `kci-backend` (modul server, skema, env),
`kci-pengujian` (uji minimum per area), `RADIX-UI.md` (komponen interaktif). Jangan menyalin
isi skill lain ke sini — tunjuk berkasnya.

## 1. Pola yang dilarang

| Pola | Aturan konkret di repo ini |
| --- | --- |
| **Duplikasi fungsi** | Aturan catur, pembungkus engine, dan pembaca PGN sudah ada: pustaka `chess.js`, lalu `src/lib/engineCatur.js`, `src/lib/pgnRingan.js`, `src/lib/skakmat.js`, `src/lib/tekaTeki.js`, dan modul murni di `src/halaman/Analisa/mesin/`. Pakai yang ada; jangan menulis ulang pembangkit langkah, deteksi skakmat, atau pembaca SAN/PGN. Catatan penting: `server/src/chess.js` adalah klien API publik Chess.com, bukan modul aturan catur. |
| **Fungsi raksasa** | Satu fungsi = satu tanggung jawab. Pecah begitu ada `if` bersarang lebih dari dua tingkat, atau ketika nama fungsi butuh kata sambung ("dan", "lalu"). Ekstrak ke fungsi bernama Bahasa Indonesia di modul yang sama; jangan menaruh helper baru di dalam komponen UI. |
| **Komentar redundan** | Komentar menjelaskan **mengapa** dan jebakan yang tidak terbaca dari kode — bukan mengulang barisnya (`// inisialisasi state`, `// return true`). Gaya repo: blok `/** ... */` di kepala modul yang menerangkan alasan modul itu ada, plus komentar pendek di titik rawan (urutan startup, tulis atomik, jebakan protokol engine). Tanpa komentar penanda-selesai dan tanpa blok `@param` yang mengulang nama parameter. |
| **Impor dan dependensi berlebih** | Hapus impor yang tidak terpakai sebelum PR. Jangan menambah dependensi npm tanpa persetujuan pengguna: server hanya boleh mengimpor `bcryptjs`, `jsonwebtoken`, `zod`, `@supabase/supabase-js` dan modul bawaan Node (lihat `kci-backend`); frontend memakai `lucide-react`, `react-helmet-async`, `pdfjs-dist`, `chess.js`, `zod` (lihat `kci-frontend`). Pustaka besar untuk satu fungsi kecil tidak diterima. |
| **Eror ditelan** | `try-catch` tanpa penanganan logis dilarang. Pilih satu: teruskan galat (`throw`), balas galat yang bermakna lewat kelas yang sudah ada (`GalatAplikasi`, `GalatChess`, `GalatAwan`, `GalatVerifikasi` — masing-masing dengan status dan keterangan), atau catat jejak aksi penting di `server/src/audit.js`/`riwayat-masuk.js`. Bila galat memang boleh diabaikan, kembalikan nilai netral yang eksplisit dan tulis alasannya di komentar. Server tetap fail-closed sesuai `periksaProduksi()`; jangan menutup galat konfigurasi agar server "tetap jalan". |

## 2. Tiga pilar

### A. Modularitas dan pemisahan tanggung jawab

Tiga lapis, jangan dicampur:

1. **Logika inti** — aturan catur, klasifikasi, penilaian, tata kelola PGN. Modul murni
   (`src/halaman/Analisa/mesin/*`, `src/lib/*`), boleh diimpor Node tanpa DOM.
2. **Antarmuka** — komponen React di `src/components/` dan `src/halaman/*/komponen/`.
   Menyusun tampilan; tidak menyimpan aturan main.
3. **Jaringan/API** — klien browser di `src/lib/api/`, server di `server/src/`.

- Modul lapis 1 tidak boleh memanggil `fetch`, `window`, atau React. Itu yang membuatnya bisa
  diuji lewat skrip `uji-*` tanpa peramban.
- Angka, pola, dan aturan yang dipakai bersama browser + server hanya boleh punya satu rumah.
  Contoh yang sudah berlaku: `POLA_USERNAME` di `src/lib/identitas.js` dipakai `server/src/skema.js`,
  dan `server/src/identitas-server.js` mengimpor modul frontend alih-alih menduplikasinya.
- Fungsi bantu yang dipakai lintas halaman ditaruh di rumah bersama (`src/lib/`), bukan disalin
  per halaman.

#### Rumah data, konten, aset, dan konfigurasi

Jangan buat folder baru (`src/services/`, `src/constants/`, `src/config/`, `src/layouts/`,
`src/components/common/`) tanpa persetujuan; rumah-rumah itu sudah ada dengan nama yang
berbeda. Ikuti pembagian berikut:

| Jenis isi | Rumah di repo ini | Catatan |
| --- | --- | --- |
| Peta menu/navigasi | `src/menu.js` | `MENU_UTAMA`, `MENU_ATAS`, `semuaHalaman()` dipakai Header, StickyMenu, pencarian, dan sitemap. Jangan buat `navigation.js` kedua. |
| Konten editorial JSX | Komponen halaman di `src/halaman/<Halaman>/` atau `src/components/konten/` | Jangan pindahkan teks/copy/JSX ke `src/data/*.js`; itu memaksa konten kembali jadi string dan menghilangkan struktur JSX/`.prose-kci`. |
| Data terstruktur hasil skrip (ukuran gambar, peta eBook, konstanta bersama) | `src/data/` (hasil `scripts/optimumkan-gambar.mjs` dan sejenisnya) atau `src/lib/` (konstanta dipakai bersama browser+server). | File di `src/data/` adalah artefak skrip, bukan tempat menulis konten editorial tangan. |
| Terjemahan (ID/EN) | `src/lib/terjemahan/{id,en}/*.js` | Semua teks antarmuka yang diterjemahkan lewat `t(...)`; jangan hardcode salinan bahasa di komponen. |
| Klien API internal KCI | `src/lib/api/` (bukan `src/services/`) | `anggota.js`, `ebook.js`, `konten.js`, `pengurus.js`, dll. Setiap endpoint backend lewat sini; CSRF token dan header umum ditangani bersama. |
| Hook | `src/lib/gunakan*.js` (konvensi Bahasa Indonesia `gunakan*`) atau berdampingan dengan komponen yang memakainya; hook dari Radix/shadcn boleh memakai `use*` dan diletakkan sesuai sumbernya. | Ekstrak ke hook **ketika** logic dipakai ≥2 tempat atau sudah terbukti kompleks; jangan ekstrak spekulatif. |
| Helper/pustaka lintas halaman (non-React, non-API) | `src/lib/` | `engineCatur.js`, `pgnRingan.js`, `skakmat.js`, `identsitas.js`, `waktu.js`, `utils.js`, `assets.js`, dll. |
| Helper aset (URL gambar, PDF, srcset) | `src/lib/asets.js` + `src/data/ukur-gambar.js` | Pakai `gambar()`, `berkasPublik()`, `sumberGambar()`; jangan menulis `/images/x.webp` mentah di JSX. Path aset baru harus lolos `npm run uji:gambar`. |
| Warna dan token desain | CSS variables di `src/index.css` blok `@theme` (`--color-primary`, `--color-grey-*`, `--color-paper`, `--color-hero`, `--chart-*`, `--shadow-*`). | Jangan menulis hex brand (`#0B2F9F`, `#4D7CF5`, `#021624`) di kelas Tailwind arbitrary atau di string JS; pakai `text-primary`, `bg-primary`, `border-primary`, `accent-primary`, `ring-primary`, atau `var(--color-primary)`. `npm run uji:desain` mendeteksi pelanggaran ini di seluruh `src/`. Warna dalam ikon SVG (atribut `fill`/`stroke`/`<path>`) diizinkan bila memang bagian dari ikon; warna state success/error/warning di objek JS (mis. spinner) boleh memakai hex fungsional selama bukan token brand. |
| Kerangka tata letak | `src/components/PageLayout.jsx` (Header + Footer + Outlet + daftar `TANPA_KERANGKA`); area beranda memakai `src/halaman/Beranda/TataLetakBeranda.jsx`; halaman konten memakai `src/components/PageBagian.jsx` (`HalamanIsi`, `PageArtikel`). | Jangan buat `MainLayout.jsx` kedua atau `components/common/Section.jsx` generik; kerangka generik akan menambah sistem komponen kedua yang dilarang `DESIGN.md §12`. |
| UI primitives (Radix + shadcn-style) | `src/components/ui/` dan `src/components/Tombol.jsx` (tombol primer KCI). | Jangan membuat tombol, input, dialog, atau varian Radix baru di dalam berkas halaman. |
| Visual catur (papan, bidak, jam, evaluasi, ikon catur) | `src/halaman/Analisa/komponen/` | Semua mode catur (Papan Interaktif, Teka-teki, Teka-Teki Harian, Rush, Quiz, Manusia vs Mesin, Hand & Brain, Turing, Latihan Repertoar) mengambil visual catur dari rumah ini; mode masing-masing hanya menyimpan orkestrasi, state, dan logika mode. Jangan menyalin komponen papan/bidak ke folder mode. |
| Ikon non-catur | `lucide-react` + `src/components/icons.jsx` | Ikon catur tetap dari `src/halaman/Analisa/komponen/svg/`. |
| Konfigurasi server | `server/src/konfigurasi.js` | Satu-satunya modul yang membaca `process.env`; modul lain mengimpor dari sini. |

#### Protokol "cari reuse dulu"

Sebelum membuat komponen, hook, atau file baru:

1. Cari komponen serupa di `src/components/`, `src/components/konten/`, `src/components/ui/`,
   dan `src/halaman/Analisa/komponen/`.
2. Cari hook serupa di `src/lib/gunakan*.js` atau hook yang berdampingan dengan komponen yang
   sudah memakai pola yang sama.
3. Cari konstanta/konfigurasi serupa di `src/lib/` atau `src/data/`.
4. Cari helper/data serupa di `src/lib/api/` (API) atau `src/lib/asets.js` (aset).
5. Pakai yang ada terlebih dahulu. Bila reuse ada, dilarang membuat file baru dengan nama
   berbeda tanpa alasan yang bisa dibuktikan.

#### Batas ukuran file

Tidak ada batas jumlah baris yang kaku. Ukuran file yang besar (1.500–2.000+ baris) pada
berkas orkestrasi mode catur bukan tanda masalah dengan sendirinya. Sebaliknya, **pecah**
ketika:

- Satu fungsi sudah punya `if` bersarang lebih dari dua tingkat.
- Nama fungsi/komponen membutuhkan kata sambung ("dan", "lalu", "serta") untuk menjelaskan
  apa yang dilakukannya.
- Satu komponen mengurusi dua tanggung jawab yang tidak berkaitan (mis. orkestrasi papan
  sekaligus menggambar ikon SVG rating 1.200 baris — yang terakhir dipindah ke komponen
  ikon sendiri).

Sebaliknya, jangan memecah berkas hanya demi "lebih kecil" ketika pecahan-pecahan itu
selalu dipakai bersama dan tidak punya makna sendiri (file SVG path ikon yang panjang
misalnya tetap satu kesatuan).

### B. Kinerja render dan engine

- Aturan teknisnya tinggal di satu tempat: `kci-frontend` (bagian "Komponen, state, dan render" serta
  "Performa"), dan `kci-papan-interaktif` untuk siklus hidup worker per mode. Jangan diduplikasi di sini.
- **Klaim kinerja wajib diukur** (React Profiler, Lighthouse, ukuran bundel), bukan diperkirakan; ukur
  sebelum dan sesudah bila perubahannya berisiko menurunkan skor.
- Menambah engine, aset besar, atau dependensi runtime demi kenyamanan pengembangan tidak diterima tanpa
  persetujuan pengguna.

### C. Keamanan dan validasi masukan

- **Masukan klien tidak pernah dipercaya.** Endpoint baru: kontrak zod di `server/src/skema.js`,
  daftarkan di `server/src/rute.js`, dan aksi pengurus lewat `pastikanAdmin`/`pastikanMaster`.
- **Aturan langkah divalidasi ulang di logika inti**, termasuk en passant, castling, dan promosi
  bidak. Payload klien (SAN/UCI/FEN/urutan langkah) dianggap usulan, bukan kebenaran: bangun ulang
  dan verifikasi lewat pustaka `chess.js` sebelum dipakai atau disimpan. Pola yang sudah dipakai
  untuk masukan pihak ketiga: `bersihkanFen()` di `server/src/basisDataAwan.js` menolak FEN tidak
  sah sebelum diteruskan ke layanan luar — perlakukan posisi, langkah, dan PGN dengan sikap sama.
- **Konfigurasi hanya dari `server/src/konfigurasi.js`.** Jangan membaca `process.env` di modul
  lain, jangan menaruh rahasia di kode klien: apa pun yang berprefiks `VITE_` ikut ter-bundle ke
  peramban.
- **Permukaan jaringan adalah allowlist.** Domain baru untuk API/gambar/font wajib didaftarkan di
  CSP `connect-src` `vercel.json` (daftar yang diizinkan ada di `kci-frontend`).

## 3. Menyatakan perubahan siap

1. **Lewat pull request.** Perubahan tidak di-commit langsung ke `main`; kerjakan di cabang
   (sesi agen memakai cabang sesi) lalu ajukan PR dari cabang itu sesuai permintaan pengguna.
   Periksa status dan diff, stage hanya jalur terkait dengan `git add -- <jalur>`, lalu periksa
   `git diff --cached`. Jangan push tanpa perintah eksplisit; lihat `AGENTS.md` dan `kci-deploy`.
2. **Audit performa dan aksesibilitas** untuk setiap perubahan web: jamin `npm run build` lulus
   dan jangan menurunkan target Lighthouse 100 di keempat kategori (`kci-frontend`; laporan
   rujukan terakhir ada di `audit-vercel.json`). Penurunan skor atau perilaku yang butuh
   pengecualian wajib dilaporkan, bukan disembunyikan.
3. **Bersih-bersih sebelum PR siap.** Hapus impor dan dependensi tak terpakai, `console.log`
   diagnostik, komponen mati, dan berkas sementara; jangan meninggalkan kode yang dimatikan
   dengan komentar. Jejak audit dan riwayat masuk backend ditulis lewat `audit.js`/`riwayat-masuk.js`
   (tersimpan via `simpanan.js`); konsol hanya untuk diagnostik startup berprefiks `[kci]`,
   bukan pengganti jejak audit.
4. **Verifikasi.** Jalankan uji minimum area terkait (`kci-pengujian`) dan pastikan cermin
   `.agents` ⇄ `.opencode` tetap identik bila skill ikut tersentuh.

Untuk **metodologi peninjauan** yang runut (menentukan lingkup diff, membaca melampaui
hunk, membuktikan setiap temuan, matriks tingkat keparahan, pola bug spesifik KCI, dan
format laporan), gunakan skill **`kci-review`**. Bagian di atas adalah kewajiban sebelum
mengajukan perubahan; `kci-review` adalah cara meninjau perubahan orang lain atau
memeriksa kesiapan sebelum merge.

## Bukti yang menyertai PR

Saat mengajukan atau meninjau PR, sertakan hal yang bisa diverifikasi — bukan klaim:

- Perintah uji yang dijalankan beserta hasilnya (bagian yang relevan dari `kci-pengujian`),
  termasuk `npm run build` untuk perubahan yang menyentuh bundel.
- Perubahan perilaku yang disengaja, dan penjelasan singkat untuk perilaku lama yang sengaja
  dipertahankan.
- Dampak performa bila menyentuh aset, halaman, atau engine: apa yang diukur dan dengan alat apa.
- Berkas lain yang ikut tersentuh karena cermin dokumentasi (skill `.agents` ⇄ `.opencode`).
- Sisa keterbatasan atau hal yang belum diverifikasi, dinyatakan apa adanya.
