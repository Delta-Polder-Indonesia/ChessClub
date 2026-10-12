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
| Pekerjaan latar belakang | Function DIBEKUKAN setelah respons terkirim; janji yang tidak ditunggu jadi pekerjaan yatim | Dulu membuat snapshot roster anggota tertinggal berhari-hari (daftar anggota berbeda dengan Chess.com, foto profil tidak berubah). Sekarang penyegaran didaftarkan lewat `waitUntil` runtime (`server/src/latar-belakang.js`) DAN dibatasi `KCI_CHESS_KLUB_SNAPSHOT_TUNGGU`: snapshot yang terlalu tua disegarkan di dalam permintaan, jadi tidak bisa tertinggal |
| `/tmp` | Ephemeral per instance | **Tidak OK** untuk data produksi |
| Rate-limit / CSRF | Hidup di memori function | Reset saat instance berganti. Penolakan CSRF membawa `kode: "token-csrf"` dan klien memulihkan diri (token baru + satu pengiriman ulang); rate-limit tetap longgar di serverless |
| State OAuth & tiket verifikasi | Token tanpa keadaan bertanda tangan (HMAC dari `KCI_JWT_SECRET`) — sah di instance mana pun, bertahan cold start |
| Tantangan "kode di profil" | Berkas `data/rahasia/verifikasi-tantangan.json` melalui lapisan data yang sama dengan berkas anggota | Bertahan restart dan lintas instance **hanya bila `kci_storage` (Supabase) terpasang**; tanpa itu `/tmp` milik tiap instance dan hasilnya penolakan (gagal aman), bukan lolos verifikasi |
| Ledger "tiket sudah dipakai" | Hidup di memori function | Berlaku sekali-pakai HANYA dalam satu instance: TIDAK bertahan cold start dan TIDAK dibagikan antar-instance, jadi replay lintas instance masih mungkin selama tiket belum kedaluwarsa. Dampaknya dibatasi cek duplikasi username secara atomik (lihat `PANDUAN-VERIFIKASI-AKUN.md` §3) |
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
- Yang masih per-instance: ledger "tiket sudah dipakai", rate-limit, dan
  token CSRF.
  - Token CSRF: penolakannya membawa `kode: "token-csrf"`, dan klien memulihkan
    dirinya sendiri (minta token baru lalu kirim ulang satu kali), jadi
    berpindah instance tidak membuat pendaftaran gagal permanen.
  - Ledger "tiket sudah dipakai" sengaja TIDAK dipindah ke `kci_storage`:
    lapisan itu hanya upsert kunci-nilai (tanpa pembaruan bersyarat), jadi
    sekali-pakai di atasnya tetap bersifat terbaik, bukan jaminan. Pencegahan
    replay penuh butuh Vercel KV `add` / Redis `SETNX` / tabel dengan
    `UNIQUE(jti)` — belum dibuat karena volume situs belum membutuhkannya.
    Dampak replay dibatasi: tiket terikat satu username dan antrean tulis
    anggota menolak duplikasi username secara atomik.
- Roster anggota: penyusunan snapshot bersifat inkremental (rotasi
  `KCI_CHESS_KLUB_SAPU` profil per penyusunan, anggaran
  `KCI_CHESS_KLUB_PENGAYAAN_MS`), sehingga satu permintaan tidak pernah
  mengunduh ratusan profil. Tombol **Segarkan dari Chess.com** di dashboard
  pengurus memaksa pengambilan ulang daftar anggota + profil.
- Tantangan kode profil ikut lapisan penyimpanan data (bukan `Map` milik
  proses), jadi tanpa Supabase ia tetap berada di `/tmp` milik instance.
  `npm run uji:verifikasi` membuktikan kedua sisinya: instance baru dengan
  penyimpanan bersama masih melihat tantangan yang sama, instance dengan
  penyimpanan terpisah menolaknya (`tantangan-tidak-ada`) alih-alih
  meloloskan verifikasi.
