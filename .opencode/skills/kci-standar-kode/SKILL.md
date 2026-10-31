---
name: kci-standar-kode
description: Standar kualitas kode KCI (anti "AI slop") - pola yang dilarang (duplikasi logika catur, fungsi raksasa, komentar redundan, impor mati, eror yang ditelan), pemisahan logika inti catur dari UI dan jaringan, batas kinerja render serta engine worker, validasi masukan di sisi server, dan alur review lewat pull request (PR-only, paritas Lighthouse, bersih-bersih sebelum merge). Use when writing or reviewing code in any area, or before a change is declared ready.
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

## 3. Alur review

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

## Bukti yang menyertai PR

Saat mengajukan atau meninjau PR, sertakan hal yang bisa diverifikasi — bukan klaim:

- Perintah uji yang dijalankan beserta hasilnya (bagian yang relevan dari `kci-pengujian`),
  termasuk `npm run build` untuk perubahan yang menyentuh bundel.
- Perubahan perilaku yang disengaja, dan penjelasan singkat untuk perilaku lama yang sengaja
  dipertahankan.
- Dampak performa bila menyentuh aset, halaman, atau engine: apa yang diukur dan dengan alat apa.
- Berkas lain yang ikut tersentuh karena cermin dokumentasi (skill `.agents` ⇄ `.opencode`).
- Sisa keterbatasan atau hal yang belum diverifikasi, dinyatakan apa adanya.
