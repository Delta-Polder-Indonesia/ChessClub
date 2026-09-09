---
name: kci-deploy
description: Deployment guidance for the KCI ChessClub site - three schemes (FULL VERCEL with the api/[...jalur].js serverless backend, Vercel frontend plus Render backend with persistent disk, GitHub Pages), required KCI_* and SUPABASE_* environment variables, fail-closed production startup, and the admin dashboard. Use when changing vercel.json, render.yaml, deploy workflows, or environment variables.
metadata:
  project: chessclub-kci
  area: deployment
---

# Deploy KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

## Tiga skema

| Skema | Kapan dipakai | Berkas kunci |
| ----- | ------------- | ------------ |
| **FULL VERCEL** — frontend + backend serverless | bawaan, Rp 0 | `vercel.json`, `api/[...jalur].js`, panduan `PANDUAN-DEPLOY-FULL-VERCEL.md` |
| Vercel (frontend) + Render (backend ber-disk) | data produksi harus awet tanpa Supabase | `render.yaml`, `PANDUAN-DEPLOY-VERCEL-RENDER.md` |
| GitHub Pages / Netlify / VPS | statis saja atau VPS penuh | `PANDUAN-DEPLOY.md`, `.github/workflows/deploy.yml` |

Catatan cepat: `varcel.md` adalah ringkasan akses dashboard; `VERCEL-LIMITATIONS.md` menjelaskan batasan
`/tmp` yang ephemeral.

## Env var wajib produksi (fail-closed)

`server/src/konfigurasi.js` **menolak menjalankan** mode produksi bila:

- `KCI_PEPPER` kosong atau < 16 karakter (hash identitas — jangan pernah diganti setelah ada data),
- `KCI_ADMIN_PASSWORD` masih bawaan `admin123`,
- `KCI_JWT_SECRET` kosong.

Mode produksi aktif bila `NODE_ENV=production` **ATAU** `KCI_ASAL_DIIZINKAN` terisi.

## Env var lain yang sering dipakai

- `KCI_ASAL_DIIZINKAN` — origin frontend, dipisah koma, tanpa trailing slash.
- `KCI_ADMIN_USER` — username dashboard `/pengurus`; `KCI_TOKEN_ADMIN` — opsional (legacy).
- `KCI_JUMLAH_PROXY` — `0` lokal, otomatis `1` di Vercel; `KCI_DIR_DATA` — di Vercel `/tmp/kci-data`.
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — wajib diisi agar data awet di FULL VERCEL
  (skema: `db/supabase-schema.sql`).
- `VITE_API_DASAR` — **kosongkan** di FULL VERCEL agar frontend memakai `/api` same-origin.
- `KCI_CHESS_CLIENT_ID` / `KCI_CHESS_CLIENT_SECRET` — OAuth Chess.com; callback
  `/api/auth/chess/kembali` harus persis dengan yang terdaftar.

Daftar lengkap beserta komentarnya ada di `.env.contoh`.

## Detail yang sering salah

- `vercel.json`: build memakai `VITE_BASE_PUBLIC=/`; rewrite SPA `/(.*)` (non-`api/`) → `/index.html`;
  function `api/[...jalur].js` menyertakan `data/*.json` (`includeFiles`) dengan `maxDuration` 60.
  Jangan dipecah tanpa memahami konsekuensinya.
- Tanpa Supabase, data di Vercel hilang saat cold start/redeploy (baca `VERCEL-LIMITATIONS.md`).
- GitHub Pages: router memakai `basename` `/ChessClub/` dan setiap rute publik punya `index.html`
  agar deep link mengembalikan HTTP 200.
- Dashboard pengurus: `<domain>/pengurus`; cek kesehatan: `GET /api/kesehatan`.
- Setelah mengubah Environment Variable di Vercel → wajib **Redeploy**.

## Workflow GitHub

- `.github/workflows/quality.yml` — uji + build + Playwright pada setiap PR/push `main` (lihat skill
  `kci-pengujian`).
- `.github/workflows/deploy.yml` dan `health.yml` — deploy Pages dan pengecekan kesehatan.
- `quality.yml` di akar repo adalah salinan isi workflow untuk diterapkan saat token tidak punya izin
  `workflows` — salin ke `.github/workflows/quality.yml` (hapus ekstensi `.md`), commit, push.
