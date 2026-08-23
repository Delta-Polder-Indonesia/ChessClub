# GitHub Actions

Folder ini berisi workflow yang **aktif** dijalankan GitHub:

| File | Fungsi | Pemicu |
| --- | --- | --- |
| `deploy.yml` | Build frontend dan terbitkan ke GitHub Pages | Push ke `main` |
| `quality.yml` | Uji logika + backend, build produksi, smoke test Playwright | Pull request & push ke `main` |
| `health.yml` | Health check API publik | Jadwal tiap 6 jam & manual (workflow_dispatch) |

## Prasyarat

1. **GitHub Pages**: Settings → Pages → Source = **GitHub Actions**.
2. **Repository variables** (Settings → Secrets and variables → Actions → Variables):
   - `KCI_API_URL` — URL backend untuk build Pages dan health check. Wajib
     diisi agar `health.yml` aktif; tanpa itu job health sengaja dilewati.
   - `KCI_CHESS_KLUB` — slug klub Chess.com frontend (opsional; bawaan
     `blunder-skuad`). Samakan dengan `KCI_CHESS_KLUB` di backend.

Template systemd untuk server produksi tersedia di `.github/systemd/`.
Panduan lengkap: `PANDUAN-DEPLOY.md` dan `CHECKLIST-IMPLEMENTASI-LOKAL.md`.
