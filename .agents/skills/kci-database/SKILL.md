---
name: kci-database
description: Aturan pengelolaan data KCI - Supabase kci_storage sebagai penyimpanan runtime awet (satu tabel key-value, RLS aktif tanpa policy anon, hanya service role dari server), batas antara penyimpanan server dan IndexedDB peramban, kolom eksplisit pada kueri, validasi identitas JWT milik server sebelum data sensitif, dan jalur migrasi relasional yang belum berlaku di DATABASE-MIGRATION.md. Use when touching db/, server/src/storage-supabase.js, server/src/simpanan.js, Supabase configuration/env, backup, or any data persistence decision.
metadata:
  project: chessclub-kci
  area: database
---

# Pengelolaan Data & Supabase KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Skill ini menetapkan aturan data. Detail modul server ada di `kci-backend`, env produksi di
`kci-deploy`, dan uji minimum di `kci-pengujian`.

## 1. Tiga "basis data" yang berbeda — jangan tertukar

Nama di repo mudah tertukar; pastikan yang disentuh memang yang dimaksud:

| Nama | Apa itu | Rumah kode | Uji penjaga |
| --- | --- | --- | --- |
| `kci_storage` (Supabase / PostgreSQL) | Penyimpanan runtime server: anggota, turnamen, berita, pengumuman, pesan, daftar hitam, admins, jejak audit, rekor Rush — satu baris per "berkas" | `server/src/storage-supabase.js` lewat `server/src/simpanan.js` | `npm run uji:supabase` (butuh kredensial, sengaja di luar CI) |
| IndexedDB peramban | Data milik pengguna di peramban: partai hasil tarikan/impor untuk Analisa, progres latihan repertoar | `src/halaman/Analisa/basisData.js`, modus repertoar | `npm run uji:basisdata`, `npm run uji:basisdata-galat`, `npm run uji:repertoar` |
| Basis Data Awan Catur (chessdb.cn) | Layanan pihak ketiga penilaian posisi, bukan milik kita | `server/src/basisDataAwan.js` | `npm run uji:basisdata-awan` |

Jebakan: `uji:basisdata-awan` menguji chessdb.cn dan `uji:basisdata` menguji IndexedDB — keduanya
tidak menyentuh Supabase. Jangan memakai salah satunya sebagai bukti bahwa jalur Supabase aman.

## 2. RLS dan skema

- **Satu tabel, satu berkas skema.** Yang ada sekarang hanya `public.kci_storage`, dibuat oleh
  `db/supabase-schema.sql` (idempoten: `create table if not exists`, indeks `updated_at desc`).
  Skema hanya boleh hidup di berkas itu — bukan hanya di SQL Editor dashboard — supaya
  bisa ditinjau, dijalankan ulang, dan dicatat di Git.
- **RLS wajib aktif, dan untuk `kci_storage` tanpa policy `anon`.** Backend memakai
  `SUPABASE_SERVICE_ROLE_KEY` yang melewati RLS. Komentar di `db/supabase-schema.sql` menyatakan
  alasannya: siapa pun yang memegang anon key bisa membaca/menulis anggota, kontak pribadi,
  `rahasia/admins.json`, dan jejak audit bila policy anon dibuka.
- **Tabel baru** (termasuk yang diusulkan `DATABASE-MIGRATION.md`) mengikuti aturan:
  `alter table ... enable row level security` ditulis di `db/supabase-schema.sql` yang sama;
  baca publik hanya untuk data yang memang publik (mis. klasemen dan rekor); tulis hanya oleh
  pemilik data. Selama proyek belum memakai Supabase Auth (bagian 4), pemilik berarti "backend
  setelah identitas diverifikasi", bukan klien.
- **Klien peramban tidak pernah bicara ke tabel.** Satu-satunya hal dari Supabase yang boleh
  diakses browser adalah bucket publik `ebooks` (PDF, lewat `EBOOK_BASE` di
  `src/data/ebook-storage.js`, diunggah `npm run ebook:unggah`). Origin baru tetap harus
  terdaftar di CSP `vercel.json` (`connect-src`/`frame-src` sudah memuat `https://*.supabase.co`).

## 3. Kueri dan jalur tulis

- **Kolom eksplisit, tanpa `select("*")`.** Pola yang berlaku di `storage-supabase.js`:
  `select("id")` untuk cek kesiapan tabel dan `select("id,data")` untuk membaca satu baris.
  Kolom `data` bisa memuat berkas besar (anggota, jejak audit) — jangan menarik seluruh tabel
  atau seluruh kolom ke memori hanya untuk mengambil satu kunci.
- **Semua baca/tulis data aplikasi lewat `server/src/simpanan.js`** (`bacaJson`, `tulisJson`,
  `tambahBaris`, `buatRepo`, `berurutan`). Tulis atomik (tmp + rename) dan antrean tulis serial
  adalah jaminan yang tidak boleh dilewati: modul domain baru tidak memanggil
  `storage-supabase.js` secara langsung, tetapi menambah fungsi di lapisan `simpanan.js`.
- **Benih dibaca dari `KCI_DIR_SEED`** (data publik dari Git `data/`) saat baris belum ada, lalu
  ditulis sekali. Jangan menaruh data rahasia di direktori seed, dan jangan menghapus baris
  produksi sebagai cara "reset".
- **Kegagalan tidak boleh ditelan, tetapi juga tidak boleh menjatuhkan situs:** `supabaseSiap()`
  melaporkan tidak siap dan penyimpanan berkas dipakai sebagai cadangan; status itu harus terlihat
  di `/api/kesehatan` (`kesehatanSupabase()`) dan log `[kci]`, bukan diabaikan diam-diam.
- **Backup sebelum perubahan berisiko:** `npm run operasi:backup` (arsip data) dan
  `npm run operasi:backup-s3` bila dikonfigurasi. Operasi destruktif pada data produksi
  (delete/hapus tabel/ubah skema yang menghilangkan kolom) butuh persetujuan eksplisit pengguna.

## 4. Identitas dan JWT

- **Proyek ini tidak memakai Supabase Auth.** JWT diterbitkan dan diverifikasi server sendiri:
  `jsonwebtoken` di `server/src/http.js` dengan `KCI_JWT_SECRET` (fail-closed, minimal 24 karakter
  di produksi). Klien Supabase backend justru mematikan sesi —
  `persistSession: false`, `autoRefreshToken: false` — karena yang dipakai service role,
  bukan sesi pengguna. Jangan menambahkan `signIn`/sesi Supabase Auth tanpa keputusan pengguna.
- **Verifikasi dulu, baru percaya:** identitas tidak sah tanpa `jwt.verify` memakai rahasia server;
  `username` atau `role` dari body/klien bukan bukti. Sebelum data sensitif (kontak pribadi,
  `rahasia/admins.json`, jejak audit, daftar hitam) dibaca atau ditulis, lewati
  `pastikanAdmin`/`pastikanMaster`, lalu catat jejaknya di `audit.js`/`riwayat-masuk.js`.
- **Rahasia hanya di `server/src/konfigurasi.js`.** `SUPABASE_SERVICE_ROLE_KEY` adalah kredensial
  produksi dan harus tetap rahasia; `SUPABASE_ANON_KEY` hanya cadangan pengembangan dan dengan RLS
  tanpa policy anon memang tidak bisa menulis — jangan dijadikan solusi produksi. Tidak ada
  variabel ini yang berprefiks `VITE_`, jadi tidak ikut ter-bundle ke peramban; jangan menambah
  prefiks itu.

## 5. Logika berat tetap di Node, bukan RPC

Agregasi dan peringkat dihitung modul Node murni yang sudah punya uji sendiri:
`susunPeringkat` dan `server/src/rekor-rush.js` (papan peringkat Rush), `hitungKlasemen`/
`klasemenTim` (`server/src/turnamen.js`), serta modul `src/halaman/Analisa/mesin/*` untuk metrik
catur. Uji: `npm run uji:klasemen`, `npm run uji:rush`, `npm run uji:quiz`.

Alasannya bukan selera: modul murni bisa diuji tanpa database dan tanpa peramban, satu sumber logika
dipakai browser dan server, dan `kci_storage` bukan skema relasional — memindahkan agregasi ke
fungsi PostgreSQL sekarang berarti menambah kode baru yang harus dijaga tanpa manfaat terukur.

Jangan menambah `.rpc(` atau objek SQL baru kecuali ketiganya terpenuhi: skema relasional benar-benar
diterapkan, ada persetujuan pengguna, dan ada uji yang menjalankannya (`npm run uji:supabase`).

## 6. Jalur migrasi relasional (belum berlaku)

`DATABASE-MIGRATION.md` memuat usulan tabel relasional (`members`, `member_contacts`, `blacklist`,
`tournaments`, `results`) yang **belum dijalankan** — jangan memakai nama tabel itu seolah sudah ada,
dan jangan menulis kode yang mengasumsikannya. Bila nanti dikerjakan, syarat yang sudah ditetapkan
dokumen itu tetap berlaku: impor dalam satu transaksi, validasi jumlah baris, arsip `tar.gz` sebelum
cutover, dual-run lalu bandingkan, dan JSON lama tidak dihapus sebelum retensi 14 hari. Tambahan dari
skill ini: hash identitas dan kontak pribadi di kolom terpisah yang tidak ikut SELECT publik, RLS
beserta policy ditulis di `db/supabase-schema.sql`, dan kredensial (`DATABASE_URL`) hanya lewat env.

## Verifikasi minimum

- Perubahan penyimpanan/skema → `npm run uji:skema && npm run uji:backend && npm run uji:basisdata`
  (tanpa kredensial Supabase, jalur cadangan berkas ikut teruji).
- Dengan kredensial Supabase → `npm run uji:supabase` (round-trip tulis → baca → hapus pada
  `kci_storage`).
- Identitas/JWT/admin → `npm run uji:auth-jwt && npm run uji:konfigurasi-keamanan && npm run uji:keamanan-admin`.
- Peringkat/klasemen → `npm run uji:klasemen && npm run uji:rush`.
- Struktur berkas atau skrip uji berubah → `npm run peta`, lalu `npm run uji:peta`.
