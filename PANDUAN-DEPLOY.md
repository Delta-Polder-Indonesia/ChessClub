# Panduan Deploy — Frontend + Backend

Situs ini kini terdiri dari **dua bagian** yang berjalan terpisah:

| Bagian | Isi | Contoh alamat |
| ------ | --- | ------------- |
| Frontend | React statis (`npm run build` → `dist/`) | `https://delta-polder-indonesia.github.io/ChessClub/` |
| Backend | Server Node (`server/src/index.js`) | `https://kci-api.onrender.com` |

> **Penting:** GitHub Pages hanya bisa menyajikan berkas statis — ia tidak
> dapat menjalankan backend. Backend harus di-hosting terpisah.

> 🟢 **Jalur yang direkomendasikan untuk produksi:** **Vercel** (frontend) +
> **Render.com Starter + persistent disk** (backend). Panduan langkah demi
> langkah yang ringkas ada di
> [`PANDUAN-DEPLOY-VERCEL-RENDER.md`](./PANDUAN-DEPLOY-VERCEL-RENDER.md).
> Render **Free** tidak mendukung persistent disk sehingga data pembahasan
> seluruhnya dapat hilang — untuk komunitas nyata gunakan **Starter**.

---

## 1. Siapkan rahasia

Jalankan sekali, lalu **simpan hasilnya baik-baik**:

```bash
# Pepper — untuk hashing identitas
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Token pengurus
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> Pepper **tidak boleh diganti** setelah ada data. Semua hash lama akan
> menjadi tak cocok dan daftar hitam berhenti berfungsi. Server mendeteksi
> hal ini dan menolak pendaftaran (galat 503) daripada meloloskan pemain
> terlarang secara diam-diam.

---

## 2. Deploy backend

### Pilihan A — Render.com (gratis, paling mudah)

1. Buka [render.com](https://render.com) → **New** → **Web Service**
2. Sambungkan repositori GitHub ini
3. Isi:
   - **Runtime**: Node
   - **Build Command**: *(kosongkan)*
   - **Start Command**: `node server/src/index.js`
4. Tambahkan Environment Variables:

   | Key | Value |
   | --- | ----- |
   | `NODE_ENV` | `production` |
   | `KCI_PEPPER` | hasil generate di atas |
   | `KCI_TOKEN_ADMIN` | hasil generate di atas |
   | `KCI_ASAL_DIIZINKAN` | `https://delta-polder-indonesia.github.io` |
   | `KCI_JUMLAH_PROXY` | `1` (lihat catatan di bawah) |
   | `KCI_CHESS_KLUB` | `blunder-skuad` |
   | `KCI_DIR_DATA` | `/var/data` |

   > Render (dan kebanyakan PaaS) meletakkan satu reverse proxy di depan
   > aplikasi. Setel `KCI_JUMLAH_PROXY=1` agar server membaca IP klien
   > dari `X-Forwarded-For` dengan benar. Biarkan `0` bila server
   > terhubung langsung ke internet tanpa proxy.

5. **Wajib**: tambahkan **Disk** (Advanced → Add Disk), mount path `/var/data`.
   Tanpa disk, data anggota hilang setiap kali server restart.

> Daftar anggota publik tidak perlu diimpor manual: backend mengambil roster
> `BLUNDER SKUAD` dari Chess.com. Chess.com memperbarui roster itu maksimal
> setiap 12 jam; biarkan `KCI_CHESS_KLUB_CACHE=43200` kecuali ada alasan kuat
> untuk mengubahnya.

### Pilihan B — VPS sendiri (systemd)

```ini
# /etc/systemd/system/kci-api.service
[Unit]
Description=Backend Komunitas Catur Indonesia
After=network.target

[Service]
Type=simple
User=kci
WorkingDirectory=/srv/chessclub
ExecStart=/usr/bin/node server/src/index.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=8787
Environment=KCI_PEPPER=isi-pepper-di-sini
Environment=KCI_TOKEN_ADMIN=isi-token-di-sini
Environment=KCI_CHESS_KLUB=blunder-skuad
Environment=KCI_ASAL_DIIZINKAN=https://catur.example.id
# Data (anggota, larangan, kontak, pesan, jejak audit) ditulis DI LUAR
# folder repo — tanpa ini data PII bisa ikut ter-commit/backup repo.
Environment=KCI_DIR_DATA=/var/lib/kci
# Nginx adalah satu-satunya proxy tepercaya di depan aplikasi.
Environment=KCI_JUMLAH_PROXY=1

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now kci-api
sudo systemctl status kci-api
```

> Template yang lebih ketat (service hardening + backup timer) tersedia di
> `.github/systemd/`. Salin `kci-api.env.example` sebagai `/etc/kci/kci-api.env`,
> isi nilai asli, lalu batasi izinnya (`chmod 640`, pemilik `root:kci`). Setelah
> menyesuaikan path, pasang semua unit dengan:
>
> ```bash
> sudo cp .github/systemd/kci-*.service .github/systemd/kci-*.timer /etc/systemd/system/
> sudo systemctl daemon-reload
> sudo systemctl enable --now kci-api.service kci-backup.timer
> systemctl list-timers kci-backup.timer
> ```
>
> Pastikan `/var/lib/kci` dan `/var/backups/kci` dimiliki user `kci`; lihat
> `CHECKLIST-IMPLEMENTASI-LOKAL.md` sebelum mengaktifkan backup.

Nginx di depannya:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

> `X-Forwarded-For` penting — tanpa itu semua pengunjung terlihat berasal
> dari satu IP dan rate limit akan salah sasaran. **Jangan** menambah
> `KCI_JUMLAH_PROXY` bila server tidak berada di balik proxy; header itu
> dapat dipalsukan dan akan melumpuhkan pembatasan laju.

---

## 3. Sambungkan frontend ke backend

Frontend memakai URL relatif `/api/…`. Cara mengarahkannya berbeda per host:

### Bila frontend di Netlify / Vercel (disarankan)

Buat `netlify.toml` di akar proyek:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://kci-api.onrender.com/api/:splat"
  status = 200
  force = true
```

Cara ini paling rapi: browser tetap memanggil domain yang sama, jadi tidak
ada masalah CORS sama sekali.

#### Khusus Vercel — `vercel.json`

Vercel memakai berkas `vercel.json` di akar proyek (sudah disertakan di repo):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "npm ci",
  "buildCommand": "VITE_BASE_PUBLIC=/ npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://kci-api.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Yang perlu diperhatikan:

- **`VITE_BASE_PUBLIC=/`**: tanpa ini, `vite.config.js` akan memakai dasar
  `/ChessClub/` (untuk GitHub Pages) saat `NODE_ENV=production`, sehingga aset
  gagal termuat di Vercel.
- **Proxy `/api`**: frontend selalu memakai URL relatif `/api/…`; rewrite
  pertama meneruskannya ke backend (Render) secara server-side, jadi tidak
  ada masalah CORS. Ganti `https://kci-api.onrender.com` bila backend pindah.
  Jaga agar rewrite ini **diletakkan sebelum** rewrite SPA `/(.*)`.
- **Rewrite SPA `/(.*)`**: memastikan rute frontend yang tidak punya berkas
  statis (mis. panel `/pengurus`) tetap mengembalikan `index.html` dengan
  status 200. Rute yang sudah dibangkitkan statis tetap dilayani langsung.
- **Jangan setel `VITE_API_DASAR`** di Vercel — biarkan kosong agar panggilan
  tetap relatif `/api/…` dan lewat proxy. Bila diisi, proxy di atas harus
  dihapus.
- **Tambahkan domain Vercel ke `KCI_ASAL_DIIZINKAN`** di backend (Render).
  Meski API diproksi, header `Origin` dari browser tetap domain Vercel dan
  diperiksa server.
- **Environtment variable** (Settings → Environment Variables) di project
  Vercel: tidak wajib untuk frontend. Vercel tidak membaca `.env`; semua
  `KCI_*` adalah urusan backend (Render), bukan Vercel.
- **Ukuran**: `public/engines/` berisi berkas mesin catur (Stockfish) yang
  besar (ratusan MB). Jika deploy melebihi batas kuota Hobby, kurangi varian
  mesin atau pindahkan ke penyimpanan eksternal (mis. CDN), lalu gunakan
  `VITE_*`/URL dinamis.
- **URL kanonikal/OG**: `index.html` meng-hardcode alamat
  `https://delta-polder-indonesia.github.io/ChessClub/` untuk `canonical`,
  `og:url`, dan JSON-LD. Untuk SEO yang benar di domain Vercel, ganti alamat
  tersebut (mis. lewat substitusi `%VITE_*%` di HTML) sesuai domain Vercel.

Untuk menghubungkan repositori: **Vercel → Add New → Project → Import Git
Repository**, pilih root proyek. Biarkan framework terdeteksi **Vite**
(atau tetapkan `framework: "vite"`), build `npm run build`, dan output `dist`.

### Bila frontend tetap di GitHub Pages

GitHub Pages tidak mendukung proxy, jadi frontend harus memanggil backend
secara langsung. Workflow deploy (`.github/workflows/deploy.yml`)
menyetel `VITE_API_DASAR` otomatis — bawaan `https://kci-api.onrender.com`.
Perubahan pada workflow membutuhkan akun/koneksi GitHub dengan izin
`workflows` (workflow scope) agar push diterima.
Untuk alamat backend yang berbeda, atur repository variable `KCI_API_URL`
di GitHub (Settings → Secrets and variables → Actions → Variables); nilai
itu dipakai menggantikan bawaan.

Untuk build manual di luar workflow, set variabel pada perintah build:

```bash
VITE_API_DASAR=https://kci-api.onrender.com npm run build
```

Lalu pastikan `KCI_ASAL_DIIZINKAN` di backend memuat
`https://delta-polder-indonesia.github.io`, jika tidak permintaan akan
ditolak CORS.

---

## 4. Verifikasi setelah deploy

```bash
API=https://kci-api.onrender.com

# 1. Server hidup?
curl $API/api/kesehatan

# 2. Daftar anggota terbaca?
curl $API/api/anggota

# 3. Endpoint pengurus TERKUNCI? (harus 401)
curl -o /dev/null -w "%{http_code}\n" $API/api/pengurus/ringkasan

# 4. Dengan token benar (harus 200)
curl -H "X-Token-Admin: TOKEN_ANDA" $API/api/pengurus/ringkasan
```

Poin 3 wajib menghasilkan **401**. Bila menghasilkan 200, berarti
`KCI_TOKEN_ADMIN` belum terpasang — segera perbaiki.

---

## 5. Rutinitas pengurus

Semua request POST juga butuh token CSRF — ambil sekali dari
`GET /api/csrf-token` (berlaku 24 jam, boleh dipakai ulang).

```bash
API=https://kci-api.onrender.com
TOKEN=token-anda
CSRF=$(curl -s $API/api/csrf-token | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")

# Pindai ban fair play — jalankan sebelum tiap turnamen
curl -X POST -H "X-Token-Admin: $TOKEN" -H "X-CSRF-Token: $CSRF" \
  $API/api/pengurus/pindai

# Blokir pemain
curl -X POST -H "X-Token-Admin: $TOKEN" -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"username":"namauser","keterangan":"Terbukti memakai engine."}' \
  $API/api/pengurus/blokir

# Cek nomor HP sebelum menerima pemain
curl -X POST -H "X-Token-Admin: $TOKEN" -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"hp":"0812-3456-7890"}' $API/api/pengurus/cek-nomor
```

Untuk pemakaian lokal, `scripts/pengurus.mjs` tetap tersedia.

---

## 6. Cadangkan data

Berkas yang wajib dicadangkan rutin:

| Berkas | Isi |
| ------ | --- |
| `data/anggota.json` | Metadata formulir anggota (roster aktif dari Chess.com) |
| `data/daftar-hitam.json` | Daftar larangan |
| `data/turnamen.json` | Turnamen, peserta, hasil, klasemen |
| `data/berita.json`, `data/pengumuman.json` | Konten komunitas |
| `data/pesan.json` | Pesan dari form Hubungi Kami (nama/email/telepon) |
| `data/rahasia/kontak.json` | **Data pribadi** — jaga kerahasiaannya |
| `data/rahasia/jejak-audit.jsonl` | Jejak aksi pengurus |

> `data/pesan.json` dan `data/rahasia/` TIDAK ikut git — cadangkan lewat
> backup berkala direktori `$KCI_DIR_DATA`.

Plus **pepper**. Kehilangan pepper = daftar hitam tidak bisa dipakai lagi.

### Backup terjadwal yang aman

Gunakan skrip bawaan; skrip ini menolak backup yang disimpan di dalam direktori
sumber, membuat arsip dengan izin `0600`, dan otomatis menyisakan sejumlah
arsip terakhir (`KCI_RETENSI_BACKUP`, bawaan 14). Direktori backup harus berada
di disk privat/terenkripsi dan **bukan** folder repository.

```bash
# Sekali: siapkan lokasi privat yang hanya dapat dibaca user service.
sudo install -d -m 700 -o kci -g kci /var/backups/kci

# Uji manual sebagai user service.
sudo -u kci env \
  KCI_DIR_DATA=/var/lib/kci \
  KCI_DIR_BACKUP=/var/backups/kci \
  KCI_RETENSI_BACKUP=14 \
  npm --prefix /srv/chessclub run operasi:backup
```

Tambahkan cron harian (misalnya pukul 02:17):

```cron
17 2 * * * kci KCI_DIR_DATA=/var/lib/kci KCI_DIR_BACKUP=/var/backups/kci KCI_RETENSI_BACKUP=14 /usr/bin/npm --prefix /srv/chessclub run operasi:backup >> /var/log/kci-backup.log 2>&1
```

Uji restore di server/staging terpisah sebelum terjadi insiden:

```bash
mkdir /tmp/kci-restore && tar xzf /var/backups/kci/kci-data-TANGGAL.tar.gz -C /tmp/kci-restore
# Periksa isi /tmp/kci-restore tanpa pernah menimpa data produksi.
```

### Health check dan alert

Endpoint ringan `GET /api/kesehatan` dapat diuji secara manual:

```bash
KCI_API_URL=https://api-domain-anda.example npm run operasi:kesehatan
```

Workflow `.github/workflows/health.yml` menjalankannya setiap 6 jam
dan dapat dijalankan manual dari tab **Actions**. Atur repository variable
`KCI_API_URL` di GitHub agar workflow aktif. GitHub akan menandai workflow
merah bila API timeout, mengembalikan HTTP gagal, atau status selain `sehat`.

> Simpan backup di lokasi berbeda dari server utama (object storage privat atau
> server cadangan) secara berkala. Backup dan pepper adalah data rahasia:
> jangan pernah mengunggahnya ke Git, artifact CI, atau chat.
