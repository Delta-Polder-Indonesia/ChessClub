# Panduan Deploy — Frontend + Backend

Situs ini kini terdiri dari **dua bagian** yang berjalan terpisah:

| Bagian | Isi | Contoh alamat |
| ------ | --- | ------------- |
| Frontend | React statis (`npm run build` → `dist/`) | `https://delta-polder-indonesia.github.io/ChessClub/` |
| Backend | Server Node (`server/src/index.js`) | `https://kci-api.onrender.com` |

> **Penting:** GitHub Pages hanya bisa menyajikan berkas statis — ia tidak
> dapat menjalankan backend. Backend harus di-hosting terpisah.

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
   | `KCI_CHESS_KLUB` | `blunder-skuad` |
   | `KCI_DIR_DATA` | `/var/data` |

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

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now kci-api
sudo systemctl status kci-api
```

Nginx di depannya:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

> `X-Forwarded-For` penting — tanpa itu semua pengunjung terlihat berasal
> dari satu IP dan rate limit akan salah sasaran.

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

### Bila frontend tetap di GitHub Pages

GitHub Pages tidak mendukung proxy, jadi frontend harus memanggil backend
secara langsung. Tambahkan berkas `.env.production`:

```
VITE_API_DASAR=https://kci-api.onrender.com
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
| `data/rahasia/kontak.json` | **Data pribadi** — jaga kerahasiaannya |

Plus **pepper**. Kehilangan pepper = daftar hitam tidak bisa dipakai lagi.

```bash
# contoh cadangan harian di VPS
0 2 * * * tar czf /backup/kci-$(date +\%F).tar.gz /srv/chessclub/data
```
