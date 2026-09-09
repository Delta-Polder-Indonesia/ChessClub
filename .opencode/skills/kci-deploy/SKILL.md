---
name: kci-deploy
description: Deployment guidance for the KCI ChessClub site - Vercel production with the api/[...jalur].js serverless backend, required KCI_* and SUPABASE_* environment variables, fail-closed production startup, and the admin dashboard. Use when changing vercel.json, Vercel environment variables, or CI workflows.
metadata:
  project: chessclub-kci
  area: deployment
---

# Deploy KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

## Skema production Vercel

| Skema | Kapan dipakai | Berkas kunci |
| ----- | ------------- | ------------ |
| **FULL VERCEL** — frontend + backend serverless | satu-satunya jalur production | `vercel.json`, `api/[...jalur].js`, `PANDUAN-DEPLOY-FULL-VERCEL.md` |

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
- Dashboard pengurus: `<domain>/pengurus`; cek kesehatan: `GET /api/kesehatan`.
- Setelah mengubah Environment Variable di Vercel → wajib **Redeploy**.

## Workflow GitHub

- `.github/workflows/quality.yml` — uji + build + Playwright pada setiap PR/push `main` (lihat skill
  `kci-pengujian`).
- `.github/workflows/health.yml` — pengecekan kesehatan API; deployment production dikelola Vercel.
- `quality.yml` di akar repo adalah salinan isi workflow untuk diterapkan saat token tidak punya izin
  `workflows` — salin ke `.github/workflows/quality.yml` (hapus ekstensi `.md`), commit, push.
