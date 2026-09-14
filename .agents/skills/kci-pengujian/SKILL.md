---
name: kci-pengujian
description: How to test the KCI ChessClub project - the Indonesian-named npm scripts (uji:*) for frontend logic, content, backend, schema, security config, and Playwright smoke tests, plus exactly what CI (.github/workflows/quality.yml) runs so a change never breaks the pipeline. Use before finishing any change, when adding tests, or when investigating CI failures.
metadata:
  project: chessclub-kci
  area: testing
---

# Pengujian KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

## Peta cepat

- `npm run uji` — gabungan uji frontend + konten: `uji:rute`, `uji:seo`, `uji:i18n`, `uji:tools`,
  `uji:komentator`, `uji:analisa`, `uji:analisa-ui`, `uji:engine`, `uji:analisa-menyeluruh`, `uji:suara`,
  `uji:basisdata`, `uji:lencana-skakmat`, `uji:tanda-papan`, `uji:tekateki-solusi`, `uji:rush`, `uji:gambar`,
  `uji:identitas`, `uji:skema`, `uji:ebook`, `uji:ebook-pembaca`, `uji:nama-pembukaan`, `uji:artikel-wikipedia`.
- `npm run uji:backend && npm run uji:verifikasi` — backend menyala sementara dan diuji end-to-end
  (auth JWT, verifikasi Chess.com, e-book).
- `npm run uji:e2e` — Playwright smoke test halaman publik (butuh `npx playwright install chromium`).
- `npm run uji:konfigurasi-keamanan` — konfigurasi keamanan server (wajib lulus bila menyentuh
  `konfigurasi.js`/`http.js`; CI selalu menjalankannya).

## Kapan menjalankan apa (aturan minimum)

- Komponen/halaman → `npm run uji:rute && npm run uji:i18n` lalu `npm run build`.
- Logika frontend → uji topik terkait (lihat blok `"scripts"` di `package.json`; penamaan sudah
  menjelaskan isinya).
- `server/` atau `api/` → `npm run uji:backend && npm run uji:skema && npm run uji:verifikasi`
  (+ `uji:konfigurasi-keamanan` bila relevan; CI selalu menjalankannya).
- Konten/data (`data/`, e-book, gambar, suara) → uji sesuai jenis (`uji:ebook`, `uji:gambar`,
  `uji:basisdata`, `uji:suara`).

## Konvensi menambah uji

- Berkas uji bernama `uji-<topik>.mjs`, ditaruh di `scripts/` (frontend/konten) atau `server/uji/`
  (backend), lalu didaftarkan sebagai skrip npm `uji:<topik>` dan (bila termasuk gabungan) ditambahkan
  ke rantai `npm run uji`.
- Uji backend memakai alat bantu `server/uji/alat-uji.mjs`; boleh memakai dependensi akar (`zod`, dll.)
  tetapi tetap tanpa framework dan tanpa dependensi baru.
- Uji e-book membutuhkan berkas PDF asli dari Git LFS (`git lfs pull`) — pointer LFS 132 byte membuat
  uji gagal dengan pesan PDF tidak valid.

## Samakan dengan CI

`.github/workflows/quality.yml` (berjalan pada setiap PR dan push ke `main`, Node 22, checkout LFS)
menjalankan berurutan:

1. "Run logic and backend tests": `npm run uji && npm run uji:backend && npm run uji:verifikasi && npm run uji:konfigurasi-keamanan`
2. "Build production bundle": `npm run build`
3. "Install Chromium for Playwright": `npx playwright install --with-deps chromium`
4. "Run public browser smoke tests": `npm run uji:e2e`

Pekerjaan belum selesai sebelum langkah-langkah yang relevan lulus secara lokal.
