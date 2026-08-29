# Batasan Vercel Serverless — Komunitas Catur Indonesia

Dokumen ini merangkum hal yang **tidak** berlaku seperti VPS biasa ketika
backend dijalankan sebagai Serverless Function (`api/[...jalur].js`).

> **PENTING:** Direktori `/tmp` di Vercel **tidak persisten**.
> Setiap cold start, instance baru, atau redeploy dapat menghapus isinya.

`KCI_DIR_DATA` bawaan di Vercel = `/tmp/kci-data` (lihat `server/src/konfigurasi.js`).
Berkas JSON yang ditulis saat runtime (anggota baru, turnamen, pesan, admin
tambahan, jejak audit) **akan hilang**.

Data `data/*.json` yang di-commit ke Git disalin ke `/tmp` sebagai benih
saat function dingin — itu satu-satunya data yang “awet” di FULL VERCEL.

---

## Ringkasan

| Aspek | Perilaku | Dampak |
| ----- | -------- | ------ |
| Cold start | ~1–3 detik request pertama | Dapat diterima untuk situs komunitas |
| `/tmp` | Ephemeral per instance | **Tidak OK** untuk data produksi |
| Rate-limit / CSRF / sesi OAuth | Hidup di memori function | Reset saat instance berganti |
| CPU / durasi | Hobby: hingga 10 detik default; function ini `maxDuration: 60` | Sinkron roster Chess.com harus muat |
| Ukuran function | Termasuk `server/` + `data/*.json` benih | Jangan masukkan dump besar |

---

## Jalur migrasi (pilih satu)

**A. Vercel frontend + Render backend + Persistent Disk** (disarankan)
lihat `PANDUAN-DEPLOY-VERCEL-RENDER.md`.

**B. Vercel KV (Redis)** untuk sesi, rate-limit, dan cache; data anggota
tetap butuh store terpisah.

**C. PostgreSQL** (Neon, Railway, Supabase) — lihat `DATABASE-MIGRATION.md`.

Jangan deploy FULL VERCEL sebagai satu-satunya backend jika dashboard
pengurus, pesan, atau hasil turnamen harus bertahan antar-hari.

---

## Workaround operasional

- Ubah kredensial admin lewat **Environment Variables** Vercel, bukan menu
  Pengaturan dashboard (tulisan ke `admins.json` di `/tmp` tidak awet).
- Rate-limit brute-force login **lebih longgar** di serverless; password
  admin harus kuat dan unik.
- OAuth Chess.com (PKCE state di memori) bisa gagal jika callback mendarat
  di instance lain. Untuk OAuth stabil, pakai backend persisten.
