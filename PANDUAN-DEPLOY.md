# Panduan Deploy — Vercel Production

Deployment production resmi ChessClub adalah **FULL VERCEL**: frontend React,
Serverless Function `/api/*`, dan domain canonical berjalan dalam satu proyek
Vercel.

- Domain production: `https://chess-club-weld.vercel.app`
- Build: `VITE_BASE_PUBLIC=/ npm run build`
- Output: `dist/`
- API: `api/[...jalur].js`
- Panduan lengkap: [`PANDUAN-DEPLOY-FULL-VERCEL.md`](./PANDUAN-DEPLOY-FULL-VERCEL.md)

## Langkah ringkas

1. Vercel → Add New → Project → Import repository `ChessClub`.
2. Biarkan framework terdeteksi sebagai Vite.
3. Isi environment production di Vercel:
   - `KCI_PEPPER`
   - `KCI_ADMIN_USER`
   - `KCI_ADMIN_PASSWORD`
   - `KCI_JWT_SECRET`
   - `KCI_ASAL_DIIZINKAN=https://chess-club-weld.vercel.app`
   - `VITE_SITE_URL=https://chess-club-weld.vercel.app`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Jangan mengisi `VITE_API_DASAR`; frontend memakai rewrite `/api` same-origin.
5. Deploy dan jalankan pemeriksaan berikut:

```bash
DOMAIN=https://chess-club-weld.vercel.app
curl "$DOMAIN/api/kesehatan"
curl "$DOMAIN/robots.txt"
curl "$DOMAIN/sitemap.xml"
curl -I "$DOMAIN/program-kami/analisa"
curl -I "$DOMAIN/program-kami/analisa/papan"
```

6. Buka `/pengurus` dan uji login dengan kredensial production.
7. Setelah mengubah environment variable, lakukan Redeploy dari Vercel.

## Data production

Vercel Serverless memakai `/tmp` yang ephemeral. Agar pendaftaran, turnamen,
berita, pesan, admin, dan jejak audit persisten, buat tabel
`db/supabase-schema.sql`, isi environment Supabase, lalu redeploy.
Baca [VERCEL-LIMITATIONS.md](./VERCEL-LIMITATIONS.md) dan
[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md).

## CI

GitHub Actions tetap menjalankan quality check dan health check. Deployment
production dikelola oleh integrasi Git repository Vercel.
