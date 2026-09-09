# GitHub Actions

Folder ini berisi workflow CI yang tetap dijalankan GitHub:

| File | Fungsi | Pemicu |
| --- | --- | --- |
| `quality.yml` | Uji logika + backend, build produksi, dan smoke test Playwright | Pull request & push ke `main` |
| `health.yml` | Health check API produksi | Jadwal tiap 6 jam & manual |

Deployment production frontend dan Serverless Function dilakukan oleh integrasi
Git Vercel, bukan GitHub Actions. Setelah push ke branch production, Vercel
membangun dan menerbitkan proyek sesuai `vercel.json`.

## Prasyarat

1. **Vercel**: hubungkan repository ke project Vercel, lalu isi environment
   production sesuai `PANDUAN-DEPLOY-FULL-VERCEL.md`.
2. **Repository variables** (Settings → Secrets and variables → Actions → Variables):
   - `KCI_API_URL` — URL API produksi untuk health check; bila kosong, job
     health check sengaja dilewati.
   - `KCI_CHESS_KLUB` — slug klub Chess.com frontend (opsional; bawaan
     `blunder-skuad`).

Template systemd untuk backup dan service lokal tersedia di `.github/systemd/`.
Panduan lengkap ada di `PANDUAN-DEPLOY-FULL-VERCEL.md` dan
`VERCEL-LIMITATIONS.md`.
