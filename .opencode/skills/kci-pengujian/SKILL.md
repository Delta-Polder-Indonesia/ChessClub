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

**Arah yang tidak perlu ditebak: `npm run peta`** menulis `docs/PETA-KODE.md` — tabel
area → berkas → uji penjaga → halaman peta navigasi, dan tabel berkas uji → skrip npm
yang menjalankannya. Jalankan itu lebih dulu sebelum menelusuri repo secara manual.
Rincian per area (frontend, analisa, backend, konten, e2e) ada di
`references/alur-uji-per-area.md`.

- `npm run uji` — 28 langkah berurutan (`&&`, berhenti di kegagalan pertama): `uji:rute`, `uji:peta`,
  `uji:seo`, `uji:i18n`, `uji:tools`, `uji:komentator`, `uji:basisdata-awan`, `uji:analisa`, `uji:analisa-ui`, `uji:engine`,
  `uji:analisa-menyeluruh`, `uji:suara`, `uji:basisdata`, `uji:akun-database`, `uji:tarik-api`,
  `uji:buku-analisa`, `uji:lencana-skakmat`, `uji:tanda-papan`, `uji:tekateki-solusi`, `uji:rush`,
  `uji:gambar`, `uji-identitas` (node langsung), `uji:skema`, `uji-ebook` (node langsung),
  `uji-ebook-pembaca` (node langsung), `uji-nama-pembukaan` (node langsung),
  `uji-artikel-wikipedia` (node langsung), `uji:pendaftaran-ui`. Urutan ini selalu bisa dilihat
  segar di bagian 1 `docs/PETA-KODE.md`.
- `npm run uji:backend && npm run uji:verifikasi` — backend menyala sementara dan diuji end-to-end
  (auth JWT, verifikasi Chess.com, e-book).
- `npm run uji:e2e` — Playwright smoke test halaman publik (butuh `npx playwright install chromium`).
- `npm run uji:konfigurasi-keamanan` — konfigurasi keamanan server (wajib lulus bila menyentuh
  `server/src/konfigurasi.js`/`server/src/http.js`; CI selalu menjalankannya).
- Di luar rantai `npm run uji` ada 17 skrip:
  - dipanggil CI: `uji:backend`, `uji:verifikasi`, `uji:pendaftaran`, `uji:konfigurasi-keamanan`,
    `uji:auth-jwt`, `uji:klasemen`, `uji:quiz`, `uji:keamanan-admin`, `uji:e2e`.
  - pintasan topik (anggotanya sudah ada di rantai): `uji:ebook`, `uji:artikel`,
    `uji:nama-pembukaan`, `uji:anticheat`, `uji:seret-bidak`, `uji:jsonld`, `uji:rekor-rush`.
  - perlu kredensial atau jaringan: `uji:supabase` (butuh `SUPABASE_URL` +
    `SUPABASE_SERVICE_ROLE_KEY`; sengaja di luar CI).
- `npm run uji:peta` — penjaga dokumentasi arah: memastikan tidak ada `key_files` mati, semua
  skrip `uji:*` tercatat di berkas ini, tidak ada berkas uji yatim, setiap folder
  `src/halaman/*` terdaftar, cermin `.agents` ⇄ `.opencode` serta `quality.yml` tetap identik,
  dan `docs/PETA-KODE.md` mutakhir. Ikut berjalan di dalam `npm run uji` dan CI.

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
- Uji e-book menerima PDF asli (`%PDF`) atau pointer Git LFS yang formatnya sah. PDF di
  `public/ebooks/` kini blob Git biasa (`.gitattributes` kosong), jadi `git lfs pull` tidak perlu.

## Samakan dengan CI

`.github/workflows/quality.yml` (berjalan pada setiap PR dan push ke `main`, Node 22, checkout
biasa tanpa `lfs: true`) menjalankan berurutan:

1. "Run logic and backend tests": `npm run uji && npm run uji:backend && npm run uji:verifikasi && npm run uji:konfigurasi-keamanan`
2. "Build production bundle": `npm run build`
3. "Install Chromium for Playwright": `npx playwright install --with-deps chromium`
4. "Run public browser smoke tests": `npm run uji:e2e`

Pekerjaan belum selesai sebelum langkah-langkah yang relevan lulus secara lokal.
