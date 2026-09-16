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
| Rate-limit / CSRF | Hidup di memori function | Reset saat instance berganti |
| State OAuth & tiket verifikasi | Token tanpa keadaan bertanda tangan (HMAC dari `KCI_JWT_SECRET`) |-instance tetap sah setelah cold start |
| Ledger \"tiket sudah dipakai\" | Hidup di memori function | Pencegahan replay best-effort lintas instance; dampak dibatasi cek duplikasi username (lihat `PANDUAN-VERIFIKASI-AKUN.md` §3) |
| CPU / durasi | Hobby: hingga 10 detik default; function ini `maxDuration: 60` | Sinkron roster Chess.com harus muat |
| Ukuran function | Termasuk `server/` + `data/*.json` benih | Jangan masukkan dump besar |

---

## Jalur migrasi (pilih satu)

**A. Supabase bawaan (paling mudah untuk FULL VERCEL).** Aplikasi sudah punya
lapisan penyimpanan `kci_storage` (key-value per-berkas) yang menulis ke
PostgreSQL bila env `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` diisi.
Cukup jalankan `db/supabase-schema.sql` dan redeploy — lihat
`PANDUAN-DEPLOY-FULL-VERCEL.md` Bagian 9. Data dashboard, pesan, turnamen,
admin, dan jejak audit menjadi awet.

**B. Vercel KV (Redis)** untuk sesi, rate-limit, dan cache; data anggota
tetap butuh store terpisah.

**C. PostgreSQL relasional penuh** (Neon, Railway, Supabase) dengan tabel
per-entitas — lihat `DATABASE-MIGRATION.md`. Ini migrasi yang lebih besar;
untuk kebutuhan saat ini, opsi **A** sudah memadai.

> Keterbatasan yang tersisa: operasi baca-ubah-tulis tetap memakai antrean
> *per-instance*, sehingga dua instance menulis ke kunci yang sama pada
> detik yang sama berisiko saling menimpa (sama seperti desain berkas-nya).
> Ini dampaknya kecil untuk situs komunitas ber-volume rendah.

---

## Workaround operasional

- Ubah kredensial admin lewat **Environment Variables** Vercel, bukan menu
  Pengaturan dashboard (tulisan ke `admins.json` di `/tmp` tidak awet).
- Rate-limit brute-force login **lebih longgar** di serverless; password
  admin harus kuat dan unik.
- OAuth Chess.com TIDAK lagi menyimpan state di memori: state dan tiket
  berupa token bertanda tangan, sehingga callback boleh mendarat di
  instance berbeda. Syaratnya satu: `KCI_JWT_SECRET` harus diisi dan sama
  di semua instance (tanpa itu, penandatohan gagal dan pendaftaran tanpa
  bukti verifikasi ditolak — fail-closed, bukan longgar).
- Yang masih per-instance: ledger \"tiket sudah dipakai\", rate-limit, dan
  token CSRF. Untuk pencegahan replay penuh, pindahkan ledger ke Vercel KV
  atau Supabase (belum dibuat: volume situs belum membutuhkannya).
