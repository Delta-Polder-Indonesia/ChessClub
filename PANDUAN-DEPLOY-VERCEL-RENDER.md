# Panduan Cepat — Deploy Vercel (Frontend) + Render Free/Starter (Backend)

> Untuk uji coba, gunakan Vercel (frontend gratis) + Render **Free** (backend).
> Untuk produksi dengan data yang awet, upgrade backend ke **Starter + Persistent
> Disk** setelah pengujian selesai.
> **Nol perubahan kode** di `server/` — backend jalan apa adanya.

> ⚠️ Render Free tidak memiliki Persistent Disk. Data JSON dapat hilang saat
> instance restart/deploy, sehingga paket ini hanya untuk demo dan pengujian.

---

## Ringkasan arsitektur & biaya

```
Browser ──> Vercel (frontend statis, gratis) ──/api/*──> Render.com (backend node)
```

| Bagian | Tempat | Biaya |
| ------ | ------ | ----- |
| Frontend (React → `dist/`) | **Vercel** | **Rp 0** |
| Backend (`server/src/index.js`) | **Render.com Starter + Disk** | **~Rp 112–117k/bin** |
| **Total** | | **~Rp 112–117k/bin** |

> Kenapa bukan Free tier Render? Free tier **tidak mendukung Persistent Disk**,
> jadi `data/*.json` bisa hilang saat service tidur/restart. Backend komunitas
> butuh data yang **awet**, sehingga Render **Starter** (satu-satunya tier
> murah ber-disk) adalah pilihan yang tepat. Lihat `PANDUAN-DEPLOY.md`.

File yang sudah disiapkan di repo:
- `vercel.json` — build Vite + proxy `/api/*` ke backend.
- `.vercelignore` — mengabaikan `server/`, `scripts/`, `tests/`, `.github/`,
  `data/` saat unggah ke Vercel (frontend statis saja).
- `render.yaml` — blueprint Render.com Free untuk pengujian (tanpa disk + env vars).

---

## 1. Siapkan rahasia (jalankan sekali, simpan baik-baik)

```bash
# Pepper — untuk hashing identitas
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Token pengurus
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> **Pepper tidak boleh diganti** setelah ada data. Kehilangan pepper =
> daftar hitam tidak bisa dipakai lagi. Simpan di tempat yang aman,
> **jangan pernah** di-commit ke Git.

---

## 2. Deploy backend ke Render.com

> **Dua cara**: (A) **Blueprint `render.yaml`** — satu klik, konfigurasi sudah
> terdokumentasi di repo; (B) **Web Service manual** — isi lewat dashboard.
> Keduanya menghasilkan service yang sama. Pilih salah satu.

### 2.0 — Uji coba GRATIS dulu (Free tier, tanpa kartu kredit) — DISARANKAN

Render memiliki **Free tier**: kamu bisa membuat web service **$0/bulan**
tanpa memasukkan kartu kredit. Gunakan ini untuk membuktikan bahwa situs dan
API **benar-benar berjalan** sebelum memutuskan membayar Starter.

> **Ingat:** Free tier **TIDAK punya persistent disk** → data `data/*.json`
> hilang saat service tidur/restart, dan service **tidur setelah 15 menit**
> tanpa trafik (cold start 30–60 detik saat dibuka lagi). Untuk **uji coba**
> itu tidak masalah. Data hanya jadi benar-benar awet setelah naik ke
> **Starter + disk**.

Langkah uji coba gratis:

1. **Render → New → Web Service** → sambungkan repositori ini.
2. Isi:
   - **Runtime**: `Node`
   - **Build Command**: *(kosongkan)*
   - **Start Command**: `node server/src/index.js`
   - **Instance Type**: **Free** ← pilih ini ($0, tidak ada kartu)
3. **JANGAN tambahkan disk** (Free tidak mendukung).
4. Tambahkan Environment Variables (penting — tanpa ini server **menolak start**
   dalam mode produksi):

   | Key | Value |
   | --- | ----- |
   | `NODE_ENV` | `production` |
   | `KCI_PEPPER` | hasil generate di langkah 1 (≥16 karakter) |
   | `KCI_TOKEN_ADMIN` | hasil generate di langkah 1 (≥24 karakter) |
   | `KCI_ASAL_DIIZINKAN` | `https://<nama-proyek>.vercel.app` *(domain Vercel-mu)* |
   | `KCI_DIR_DATA` | `/tmp/kci-data` *(ephemeral di free)* |
   | `KCI_CHESS_KLUB` | `blunder-skuad` |

   > Server menganggap mode **produksi** bila `NODE_ENV=production` ATAU
   > `KCI_ASAL_DIIZINKAN` diisi. Dalam mode itu ia **menolak start** bila
   > `KCI_PEPPER`/`KCI_TOKEN_ADMIN` kosong. Ini perilaku yang disengaja
   > (mencegah pepper pengembangan ter-publish), bukan bug.

5. **Deploy** → tunggu selesai. Catat URL (mis. `https://kci-api.onrender.com`).
6. **Verifikasi** dengan `curl` (lihat bagian 4 di bawah). Kalau `kesehatan`
   mengembalikan `{"status":"sehat",...}` dan endpoint pengurus balas `401`,
   berarti backend **berjalan** — silakan lanjut bayar Starter.
7. Bila sudah yakin, **upgrade ke Starter + pasang disk** (lihat Cara B),
   lalu tambahkan data produksi.

Untuk kenyamanan menguji tanpa harus mengetik env setiap kali, kamu juga bisa
mengeset variabel pada **Web Service manually** seperti di atas, atau membuat
Blueprint terpisah ber-`plan: free` (tanpa `disk`) bila ingin memakai satu akun
Render untuk kedua fase.

### Cara A — Blueprint `render.yaml` (disarankan, otomatis)

`render.yaml` sudah disiapkan di repo dan berisi service `kci-api`, plan
**Free**, tanpa Persistent Disk, perintah mulai `node server/src/index.js`,
health-check `/api/kesehatan`, dan deklarasi `KCI_PEPPER`, `KCI_TOKEN_ADMIN`,
`KCI_ASAL_DIIZINKAN` dengan `sync: false`.

1. Buka [render.com](https://render.com) → **New** → **Blueprint**.
2. Pilih repositori ini → biarkan Render membaca `render.yaml`.
3. Saat diminta, isi nilai untuk variabel ber-`sync: false`:
   - `KCI_PEPPER` → hasil generate di langkah 1.
   - `KCI_TOKEN_ADMIN` → hasil generate di langkah 1.
   - `KCI_ASAL_DIIZINKAN` → `https://<nama-proyek>.vercel.app` *(domain Vercel-mu)*.
4. Klik **Apply** → Render membuat service Free dan env vars otomatis.
5. Setelah selesai, buka `https://kci-api.onrender.com/api/kesehatan`.

> Jika ingin data permanen, upgrade service ini ke Starter dan ubah
> `KCI_DIR_DATA` menjadi `/var/data`, lalu tambahkan Persistent Disk.

> Semua nilai `sync: false` hanya diminta saat **pembuatan pertama**. Saat
> update Blueprint berikutnya Render mengabaikannya — tambahkan/revisi nilai
> rahasia secara manual lewat dashboard bila perlu.

### Cara B — Web Service manual

1. Buka [render.com](https://render.com) → **New** → **Web Service**.
2. **Sambungkan** repositori GitHub ini (pilih branch produksi, mis. `main`).
3. Isi pengaturan:
   - **Name**: `kci-api` (bebas)
   - **Region**: pilih yang terdekat / sesuai (mis. `Singapore` atau `Jakarta` bila tersedia)
   - **Runtime**: `Node`
   - **Build Command**: *(kosongkan)*
   - **Start Command**: `node server/src/index.js`
   - **Instance Type**: **Starter** ← penting (mendukung persistent disk)

4. **Wajib — tambahkan Persistent Disk** (ke bawah → *Advanced* → *Add Disk*):
   - **Mount Path**: `/var/data`
   - **Size**: 1 GB (cukup untuk data anggota; bisa dinaikkan nanti)
   - Tanpa disk ini data `data/*.json` **hilang** setiap kali service restart.

5. **Tambahkan Environment Variables** (Settings → Environment):

   | Key | Value |
   | --- | ----- |
   | `NODE_ENV` | `production` |
   | `KCI_PEPPER` | hasil generate di langkah 1 |
   | `KCI_TOKEN_ADMIN` | hasil generate di langkah 1 |
   | `KCI_ASAL_DIIZINKAN` | `https://<nama-proyek>.vercel.app` *(ganti dengan domain Vercel-mu)* |
   | `KCI_JUMLAH_PROXY` | `1` *(Render menaruh 1 proxy di depan)* |
   | `KCI_DIR_DATA` | `/var/data` |
   | `KCI_CHESS_KLUB` | `blunder-skuad` |
   | `KCI_CHESS_KLUB_CACHE` | `43200` |

   > `KCI_JUMLAH_PROXY=1` wajib agar server membaca IP klien dari
   > `X-Forwarded-For` dengan benar (untuk rate limit).

6. **Deploy** → tunggu build + start selesai. Catat **URL service**-nya
   (mis. `https://kci-api.onrender.com`).

---

## 3. Deploy frontend ke Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New** → **Project** → **Import** repositori ini.
2. Root proyek = akar repo. Biarkan framework terdeteksi **Vite** (atau
   set `framework: "vite"`), build `npm run build`, output `dist`.
3. **Pastikan** di `vercel.json` (sudah ada di repo) URL backend menunjuk ke
   Render yang benar:

   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://kci-api.onrender.com/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

   > Ganti `https://kci-api.onrender.com` dengan URL Render-mu bila berbeda.
   > **Jangan setel `VITE_API_DASAR`** di Vercel — biarkan kosong supaya
   > panggilan tetap relatif `/api/…` dan lewat proxy.
   > Rewrite `/api` **harus diletakkan sebelum** rewrite SPA `/(.*)`.

4. **Deploy**. Catat **domain Vercel**-mu (mis. `https://nama-proyek.vercel.app`),
   lalu kembali ke Render dan pastikan domain itu ada di `KCI_ASAL_DIIZINKAN`.

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

Uji juga **lewat domain Vercel** (frontend → proxy):

```bash
# Contoh: health check melalui Vercel (proxy /api)
curl https://nama-proyek.vercel.app/api/kesehatan
```

---

## 5. Rutinitas pengurus

Semua request POST juga butuh token CSRF — ambil sekali dari
`GET /api/csrf-token` (berlaku 24 jam, boleh dipakai ulang).

```bash
API=https://kci-api.onrender.com
TOKEN=token-anda
CSRF=$(curl -s $API/api/csrf-token | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token))")

# Pindai ban fair play
curl -X POST -H "X-Token-Admin: $TOKEN" -H "X-CSRF-Token: $CSRF" $API/api/pengurus/pindai

# Blokir pemain
curl -X POST -H "X-Token-Admin: $TOKEN" -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"username":"namauser","keterangan":"Terbukti memakai engine."}' \
  $API/api/pengurus/blokir

# Cek nomor HP
curl -X POST -H "X-Token-Admin: $TOKEN" -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"hp":"0812-3456-7890"}' $API/api/pengurus/cek-nomor
```

Untuk pemakaian lokal, `scripts/pengurus.mjs` tetap tersedia.

---

## 6. Cadangkan data

Berkas di `data/` (di `/var/data` di Render) adalah data produksi yang
**wajib dicadangkan**:

| Berkas | Isi |
| ------ | --- |
| `anggota.json` | Metadata formulir anggota |
| `daftar-hitam.json` | Daftar larangan |
| `turnamen.json` | Turnamen, peserta, hasil, klasemen |
| `berita.json`, `pengumuman.json` | Konten komunitas |
| `rahasia/kontak.json` | **Data pribadi** — jaga kerahasiaannya |
| `rahasia/jejak-audit.jsonl` | Jejak aksi pengurus |

> **Simpan backup di lokasi berbeda dari server utama** (object storage privat
> atau server cadangan). Jangan pernah mengunggah backup/pepper ke Git,
> artifact CI, atau chat.

Untuk skema backup terjadwal yang aman (arsip 0600, retensi otomatis,
menolak backup di folder sumber), lihat `PANDUAN-DEPLOY.md` bagian "Backup
terjadwal".

---

## Kalau terjadi masalah

- **Data hilang / halaman anggota kosong** → pastikan Render **Starter + Disk**
  terpasang dan `KCI_DIR_DATA=/var/data`. Free tier tidak punya disk.
- **`/api` di Vercel balas 404** → cek urutan rewrite di `vercel.json`
  (proxy `/api` harus sebelum SPA fallback) dan pastikan URL Render benar.
- **CORS ditolak** → tambahkan domain Vercel ke `KCI_ASAL_DIIZINKAN` di Render.
- **Start gagal** (server menolak jalan) → pastikan `KCI_PEPPER` ≥ 16 karakter
  dan `KCI_TOKEN_ADMIN` ≥ 24 karakter terpasang; Render berjalan sebagai
  `NODE_ENV=production` sehingga keduanya **wajib**.