# Checklist Implementasi Lokal & Produksi

Dokumen ini adalah daftar kerja pemilik sistem sebelum situs benar-benar dipublikasikan. Simpan nilai rahasia di password manager atau secret manager—**jangan** kirim melalui chat dan jangan commit berkas `.env`.

## 1. Persiapan komputer lokal

```bash
# Node.js 20 LTS atau lebih baru
node --version
npm ci
npm run build
npm run uji
npm run uji:backend
npm run uji:verifikasi
```

Untuk browser test di komputer lokal, instal Chromium Playwright sekali saja:

```bash
npx playwright install --with-deps chromium
npm run uji:e2e
```

> Di Windows/macOS gunakan `npx playwright install chromium`; opsi `--with-deps` khusus Linux.

## 2. Berkas environment lokal

Salin template tanpa pernah mengubah template yang ada di Git:

```bash
cp .env.contoh .env
```

Isi nilai berikut untuk backend produksi/staging:

| Variabel | Wajib | Isi / tindakan |
| --- | :---: | --- |
| `NODE_ENV` | Ya | `production` |
| `KCI_PEPPER` | Ya | Acak minimal 16 karakter; buat dengan perintah pada `.env.contoh`. **Jangan diganti setelah ada data.** |
| `KCI_ADMIN_USER` | Ya | Username dashboard `/pengurus`, mis. `admin`. |
| `KCI_ADMIN_PASSWORD` | Ya | Password kuat dashboard `/pengurus`; jangan pakai `admin123` di publik. |
| `KCI_TOKEN_ADMIN` | Opsional | Token legacy minimal 24 karakter bila masih dipakai sebagai password alternatif. |
| `KCI_ASAL_DIIZINKAN` | Ya | Origin frontend Vercel persis, mis. `https://chess-club-weld.vercel.app` |
| `KCI_JUMLAH_PROXY` | Ya | `1` di Serverless Function Vercel; `0` saat lokal. |
| `KCI_DIR_DATA` | Lokal saja | Direktori data di luar repository; Vercel memakai `/tmp`, jadi production gunakan Supabase. |
| `KCI_CHESS_KLUB` | Ya | Slug klub Chess.com, mis. `blunder-skuad`. |
| `KCI_DIR_BACKUP` | Lokal saja | Lokasi privat di luar repo untuk backup lokal. |
| `KCI_RETENSI_BACKUP` | Lokal saja | Jumlah arsip terakhir, mis. `14`. |
| `KCI_LOG_PERMINTAAN` | Disarankan | `1` untuk log JSON ringkas tanpa body/token/IP. |
| `VITE_API_DASAR` | Vercel | Kosongkan untuk memakai rewrite `/api` same-origin. |
| `VITE_CHESS_KLUB` | Disarankan | Samakan dengan `KCI_CHESS_KLUB`. |

OAuth Chess.com opsional. Isi `KCI_CHESS_CLIENT_ID`, `KCI_CHESS_CLIENT_SECRET`, dan `KCI_CHESS_REDIRECT_URI` hanya setelah aplikasi OAuth disetujui Chess.com.

## 3. Data dan informasi yang perlu diganti manual

### Identitas organisasi

Periksa dan ganti data contoh berikut sebelum publikasi bila belum sesuai:

| Lokasi | Yang diperiksa |
| --- | --- |
| `src/halaman/HubungiKami/HubungiKami.jsx` | Alamat sekretariat, nomor telepon, dan email kontak. |
| `src/components/Footer.jsx` | Email dan alamat singkat footer. |
| `index.html` | Canonical URL, Open Graph URL/gambar, JSON-LD Organization. |
| `public/robots.txt` dan `public/sitemap.xml` | Domain canonical bila memakai domain sendiri. |
| `.github/workflows/*.yml` | Workflow CI quality dan health; deployment production dikelola Vercel. |

### Data aplikasi

- **Tambah berita, pengumuman, turnamen, peserta, dan hasil melalui Dashboard Pengurus**. Ini menjaga validasi, audit trail, CSRF, dan tulis atomik tetap berjalan.
- Jangan mengedit `data/rahasia/`, `data/pesan.json`, atau hash identitas secara manual.
- Jangan menyalin data produksi ke Git, screenshot publik, atau folder berbagi.
- Bila mengubah klub Chess.com, setel **dua nilai**: `KCI_CHESS_KLUB` di backend dan `VITE_CHESS_KLUB` saat build frontend.

## 4. Konfigurasi GitHub

Di **Settings → Secrets and variables → Actions → Variables**, set:

| Variable | Fungsi |
| --- | --- |
| `KCI_API_URL` | `https://chess-club-weld.vercel.app` untuk health check production. |
| `KCI_CHESS_KLUB` | Slug klub frontend (opsional; default `blunder-skuad`). |

Setelah `KCI_API_URL` tersedia, workflow health check berjalan setiap 6 jam. Pastikan endpoint berikut dapat diakses publik:

```text
GET https://chess-club-weld.vercel.app/api/kesehatan
```

## 5. Data persisten dan backup

Untuk production Vercel, jalankan `db/supabase-schema.sql`, isi
`SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di Vercel, lalu redeploy.
Baca `PANDUAN-DEPLOY-FULL-VERCEL.md`; `/tmp` tidak boleh dianggap sebagai
storage persisten.

Untuk pengembangan lokal atau service mandiri, bila backup file diperlukan:

```bash
KCI_DIR_DATA=/var/lib/kci KCI_DIR_BACKUP=/var/backups/kci npm run operasi:backup
mkdir /tmp/kci-restore
tar xzf /var/backups/kci/kci-data-TANGGAL.tar.gz -C /tmp/kci-restore
```

Simpan pepper secara terpisah dan aman. Backup tanpa pepper tidak cukup untuk
pemulihan penuh sistem identitas. Template systemd untuk service dan timer
backup lokal tersedia di `.github/systemd/`.

## 6. Pemeriksaan sebelum rilis

```bash
API=https://chess-club-weld.vercel.app
curl "$API/api/kesehatan"
curl -o /dev/null -w "%{http_code}\n" "$API/api/pengurus/ringkasan" # wajib 401
KCI_API_URL="$API" npm run operasi:kesehatan
```

Daftar keputusan rilis:

- [ ] Tidak ada `.env`, token, pepper, backup, atau data PII pada Git.
- [ ] `npm run build`, `npm run uji`, `npm run uji:backend`, dan `npm run uji:verifikasi` hijau.
- [ ] Workflow Quality checks dan Production health check hijau di GitHub.
- [ ] Pendaftaran anggota, Hubungi Kami, turnamen, dan dashboard diuji manual pada domain produksi.
- [ ] Backup harian aktif dan satu restore test sudah dilakukan.
- [ ] Origin CORS hanya berisi domain yang benar.
- [ ] Password/token pengurus tidak dibagikan di grup/chat dan diganti jika pernah terekspos.

## 7. Rutinitas operasional

| Frekuensi | Tindakan |
| --- | --- |
| Harian | Pastikan backup baru tersedia dan health check hijau. |
| Sebelum turnamen | Jalankan pemindaian fair-play dari dashboard. |
| Mingguan | Tinjau pesan masuk, pengajuan peserta, dan konten publik. |
| Bulanan | Uji restore backup; periksa log server dan kapasitas disk. |
| Saat pergantian pengurus | Rotasi `KCI_ADMIN_PASSWORD` dan/atau `KCI_TOKEN_ADMIN` legacy; jangan rotasi pepper tanpa rencana migrasi data. |

Lihat `PANDUAN-DEPLOY-FULL-VERCEL.md` untuk instruksi deployment production.
