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
| `KCI_TOKEN_ADMIN` | Ya | Acak minimal 24 karakter; hanya untuk pengurus. |
| `KCI_ASAL_DIIZINKAN` | Ya | Origin frontend persis, mis. `https://domain-anda.id,https://delta-polder-indonesia.github.io` |
| `KCI_JUMLAH_PROXY` | Ya | `1` di belakang Nginx/Render satu proxy; `0` bila server langsung. |
| `KCI_DIR_DATA` | Ya | Direktori persisten di luar repository, mis. `/var/lib/kci`. |
| `KCI_CHESS_KLUB` | Ya | Slug klub Chess.com, mis. `blunder-skuad`. |
| `KCI_DIR_BACKUP` | Untuk backup | Lokasi privat di luar repo, mis. `/var/backups/kci`. |
| `KCI_RETENSI_BACKUP` | Disarankan | Jumlah arsip terakhir, mis. `14`. |
| `KCI_LOG_PERMINTAAN` | Disarankan | `1` untuk log JSON ringkas tanpa body/token/IP. |
| `VITE_API_DASAR` | GH Pages | URL backend tanpa trailing slash, mis. `https://api.domain-anda.id`. |
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
| `deploy/github-workflows/*.yml.md` | Template workflow; setelah merge, salin/ubah ekstensi menjadi `.github/workflows/*.yml` dari komputer lokal. |

### Data aplikasi

- **Tambah berita, pengumuman, turnamen, peserta, dan hasil melalui Dashboard Pengurus**. Ini menjaga validasi, audit trail, CSRF, dan tulis atomik tetap berjalan.
- Jangan mengedit `data/rahasia/`, `data/pesan.json`, atau hash identitas secara manual.
- Jangan menyalin data produksi ke Git, screenshot publik, atau folder berbagi.
- Bila mengubah klub Chess.com, setel **dua nilai**: `KCI_CHESS_KLUB` di backend dan `VITE_CHESS_KLUB` saat build frontend.

## 4. Konfigurasi GitHub

Di **Settings → Secrets and variables → Actions → Variables**, set:

| Variable | Fungsi |
| --- | --- |
| `KCI_API_URL` | URL backend untuk build GitHub Pages dan health check. |
| `KCI_CHESS_KLUB` | Slug klub frontend (opsional; default `blunder-skuad`). |

Setelah `KCI_API_URL` tersedia, workflow health check berjalan setiap 6 jam. Pastikan endpoint berikut dapat diakses publik:

```text
GET https://api.domain-anda.id/api/kesehatan
```

## 5. Data persisten dan backup

1. Pastikan `$KCI_DIR_DATA` berada pada disk persisten.
2. Pastikan `$KCI_DIR_BACKUP` berada di luar repository dan hanya bisa dibaca user service.
3. Jalankan backup manual pertama:

```bash
KCI_DIR_DATA=/var/lib/kci KCI_DIR_BACKUP=/var/backups/kci npm run operasi:backup
```

4. Uji restore ke folder sementara—jangan menimpa server produksi:

```bash
mkdir /tmp/kci-restore
tar xzf /var/backups/kci/kci-data-TANGGAL.tar.gz -C /tmp/kci-restore
```

5. Simpan pepper secara terpisah dan aman. Backup tanpa pepper tidak cukup untuk pemulihan penuh sistem identitas.

Template systemd untuk service dan timer backup tersedia di `deploy/systemd/`.

## 6. Pemeriksaan sebelum rilis

```bash
API=https://api.domain-anda.id
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
- [ ] Token pengurus tidak dibagikan di grup/chat dan diganti jika pernah terekspos.

## 7. Rutinitas operasional

| Frekuensi | Tindakan |
| --- | --- |
| Harian | Pastikan backup baru tersedia dan health check hijau. |
| Sebelum turnamen | Jalankan pemindaian fair-play dari dashboard. |
| Mingguan | Tinjau pesan masuk, pengajuan peserta, dan konten publik. |
| Bulanan | Uji restore backup; periksa log server dan kapasitas disk. |
| Saat pergantian pengurus | Rotasi `KCI_TOKEN_ADMIN`; jangan rotasi pepper tanpa rencana migrasi data. |

Lihat `PANDUAN-DEPLOY.md` untuk instruksi host Render/VPS secara lengkap.
