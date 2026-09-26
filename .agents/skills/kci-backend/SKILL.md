---
name: kci-backend
description: Rules for the KCI backend - a no-framework Node.js server in server/ (keanggotaan, verifikasi Chess.com, turnamen, e-book, pesan) plus its Vercel serverless entry api/[...jalur].js. Covers module architecture with Indonesian identifiers, route registration in server/src/rute.js, atomic serialized storage in server/src/simpanan.js, validation contracts in server/src/skema.js, fail-closed production config, admin/CSRF auth in server/src/http.js, and KCI_* environment variables. Use when editing server/, api/, db/, or backend data, auth, and storage behavior, or when running npm run uji:backend.
metadata:
  project: chessclub-kci
  area: backend
---

# Backend KCI (kci-server)

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo** (`server/src/…`, `api/…`, `db/…`).

## Baca dulu sebelum menyentuh `server/`

| Kebutuhan | Berkas |
| --- | --- |
| Titik masuk dan urutan startup | `server/src/index.js` |
| Registrasi seluruh rute HTTP | `server/src/rute.js` |
| Kontrak validasi masukan | `server/src/skema.js` |
| Baca/tulis data | `server/src/simpanan.js` |
| Environment dan gerbang fail-closed | `server/src/konfigurasi.js` |
| Titik masuk serverless Vercel | `api/[...jalur].js` |

## Prinsip

- **Tanpa framework HTTP.** Router, CORS, parsing body, rate limit, dan CSRF adalah kode sendiri
  di `server/src/http.js` dan `permintaan.js`. Jangan menambah Express/Fastify/dependensi baru.
  Satu-satunya dependensi npm yang boleh diimpor server adalah yang sudah ada di `package.json` akar:
  `bcryptjs`, `jsonwebtoken`, `zod`, `@supabase/supabase-js` — selain itu hanya modul bawaan Node.
- Nama berkas dan identifier Bahasa Indonesia: `keanggotaan.js`, `turnamen.js`, `simpanan.js`, `jalur-api.js`.
- Modul frontend boleh dipakai ulang server (contoh: `identitas-server.js` mengimpor `src/lib/identitas.js`)
  — jangan diduplikasi.

## Arsitektur (server/src/)

- `index.js` — titik masuk: muat admin file → daftarkan rute → `periksaProduksi()` → dengarkan port.
  Bila env `VERCEL` terdeteksi, tidak membuka port dan mengekspor `tangani(req, res)` untuk
  `api/[...jalur].js`. Jaga urutan startup ini.
- `konfigurasi.js` — **satu-satunya tempat membaca environment variable.** Fail-closed lewat
  `periksaProduksi()`: pada mode produksi (`NODE_ENV=production` ATAU `KCI_ASAL_DIIZINKAN` terisi) server
  menolak jalan bila `KCI_PEPPER` < 16 karakter, `KCI_JWT_SECRET` < 24 karakter, `KCI_ADMIN_PASSWORD`
  bawaan/< 6 karakter, atau `KCI_TOKEN_ADMIN` diisi < 24 karakter. `index.js` memperketat lagi:
  `KCI_ADMIN_PASSWORD` wajib >= 12 karakter di produksi.
- `rute.js` — satu-satunya tempat registrasi rute HTTP; handler domain tetap di modul masing-masing
  (`keanggotaan.js`, `turnamen.js`, `konten.js`, `pesan.js`, `ebook.js`, `oauth.js`,
  `verifikasi-profil.js`, `rekor-rush.js`, `chess.js`, `klub.js`).
- `jalur-api.js` — normalisasi jalur: `/api/v1/*` dipetakan ke `/api/*`; rute `/api/pengurus/*` ditandai
  `adalahJalurPengurus()`.
- `http.js` — auth admin (username/password → JWT), CSRF token, `pastikanAdmin`/`pastikanMaster`,
  pencatatan percobaan login, pembatasan laju. Header `X-Forwarded-For` hanya dihormati bila
  `KCI_JUMLAH_PROXY > 0`.
- `simpanan.js` — lapisan penyimpanan tunggal: Supabase bila dikonfigurasi, selain itu berkas JSON dengan
  **tulis atomik (tmp + rename) dan antrean tulis serial**. Jangan pernah menulis berkas JSON data
  langsung di luar modul ini.
- `storage-supabase.js` + `db/supabase-schema.sql` — persistensi awet untuk FULL VERCEL
  (tabel `kci_storage`; benih dibaca dari `KCI_DIR_SEED`, tidak pernah ditulis).
- `audit.js` / `riwayat-masuk.js` — jejak audit wajib untuk aksi pengurus dan login.

## Aturan penting

- Endpoint baru: daftarkan di `rute.js`, validasi body dengan skema zod di `skema.js`,
  dan tambahkan uji di `server/uji/` (lihat skill `kci-pengujian`).
- Aksi admin baru wajib lewat `pastikanAdmin`/`pastikanMaster` + pencatatan audit.
- Jangan mengubah cara hashing `KCI_PEPPER` — semua hash identitas lama menjadi tak cocok.
- `KCI_DIR_DATA` (dapat tulis) vs `KCI_DIR_SEED` (baca-saja dari Git `data/`); di Vercel tulisan hanya ke
  `/tmp/kci-data` yang ephemeral.
- Serverless parity: setiap perubahan harus bekerja tanpa port dan tanpa disk persisten —
  verifikasi dengan `npm run uji:backend`.
