# Panduan FULL VERCEL — Frontend + Backend Aktif dalam Satu Proyek

> Backend TIDAK perlu Render lagi. Seluruh aplikasi (frontend React + backend
> Node) berjalan dalam **satu proyek Vercel**:
>
> ```
> Browser ──> Vercel
>              ├── /            → frontend statis (dist/, gratis)
>              └── /api/*       → Serverless Function api/[...jalur].js
>                                 (menjalankan server/src/index.js apa adanya)
> ```

Backend **tidak diubah perilakunya** — mode `node server/src/index.js`
(Render/VPS/lokal) tetap berfungsi persis seperti sebelumnya. Yang ditambahkan
hanya titik masuk serverless:

| Berkas baru/diubah            | Fungsi                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| `api/[...jalur].js`           | Serverless Function — meneruskan semua `/api/*` ke router     |
| `server/src/index.js`         | Ekspor `tangani`; `listen()` dilewati saat `VERCEL` terdeteksi |
| `server/src/konfigurasi.js`   | Bawaan cerdas di Vercel: data → `/tmp/kci-data`, proxy → 1    |
| `vercel.json`                 | `/api/*` dilayani function lokal (bukan proxy ke Render)      |
| `.vercelignore`               | `server/` ikut diunggah (dibutuhkan function)                 |

---

## 1. Siapkan rahasia (jalankan sekali, simpan baik-baik)

```bash
# Pepper — untuk hashing identitas (min. 16 karakter)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Token pengurus (min. 24 karakter)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> ⚠️ **Pepper tidak boleh diganti** setelah ada data. Kehilangan pepper =
> daftar hitam tidak bisa dipakai lagi. Simpan di password manager,
> **jangan pernah** di-commit ke Git.

---

## 2. Deploy ke Vercel

### Cara A — lewat dashboard (disarankan)

1. Buka [vercel.com](https://vercel.com) → **Add New… → Project** → pilih
   repositori GitHub `ChessClub`.
2. Framework Preset terdeteksi otomatis: **Vite** (dari `vercel.json`).
   Build Command, Output Directory, dan routing `/api/*` sudah benar —
   **tidak perlu mengubah apa pun** di langkah Configure Project.
3. Sebelum menekan **Deploy**, buka **Environment Variables** dan isi:

   | Key                  | Nilai                              | Wajib?        |
   | -------------------- | ---------------------------------- | ------------- |
   | `KCI_PEPPER`         | hasil generate langkah 1           | **WAJIB**     |
   | `KCI_TOKEN_ADMIN`    | hasil generate langkah 1           | **WAJIB**     |
   | `KCI_ASAL_DIIZINKAN` | `https://<nama-proyek>.vercel.app` | **WAJIB**     |
   | `KCI_LOG_PERMINTAAN` | `1`                                | disarankan    |
   | `KCI_CHESS_KLUB`     | `blunder-skuad`                    | bawaan sudah benar |

   > Tanpa `KCI_PEPPER` / `KCI_TOKEN_ADMIN`, function **menolak menyala**
   (Vercel otomatis menyetel `NODE_ENV=production`). Ini fail-closed yang
   disengaja — lihat bagian Troubleshooting.

4. Tekan **Deploy** → tunggu build selesai.

### Cara B — lewat CLI

```bash
npm i -g vercel
vercel login
vercel link                 # hubungkan folder ini ke proyek Vercel
vercel env add KCI_PEPPER production
vercel env add KCI_TOKEN_ADMIN production
vercel env add KCI_ASAL_DIIZINKAN production    # isi: https://<proyek>.vercel.app
vercel --prod
```

> Vercel juga otomatis men-deploy ulang setiap push ke `main`
> (Git integration aktif secara bawaan).

---

## 3. Verifikasi backend AKTIF

Setelah deploy, uji langsung (ganti `kci.vercel.app` dengan domain-mu):

```bash
# 1) Kesehatan — harus balas {"status":"sehat",...}
curl https://kci.vercel.app/api/kesehatan

# 2) CSRF — harus balas {"token":"..."}
curl https://kci.vercel.app/api/csrf-token

# 3) Endpoint pengurus terlindungi — harus balas 401 (BUKAN 404)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "X-Token-Admin: salah" https://kci.vercel.app/api/pengurus/ringkasan

# 4) Frontend menyala di alamat yang sama
curl -s -o /dev/null -w "%{http_code}\n" https://kci.vercel.app/
```

Kalau (1) `sehat`, (2) ada token, (3) `401`, dan (4) `200` →
**backend aktif dan frontend hidup dalam satu domain**. ✅

Dashboard pengurus: masuk dengan `KCI_TOKEN_ADMIN` di halaman
`/dashboard-pengurus` situs yang sama.

---

## 4. Login OAuth Chess.com (opsional)

Bila client_id Chess.com sudah disetujui, tambahkan env vars:

| Key                     | Nilai                                                  |
| ----------------------- | ------------------------------------------------------ |
| `KCI_CHESS_CLIENT_ID`   | dari Chess.com                                         |
| `KCI_CHESS_CLIENT_SECRET` | dari Chess.com (opsional, PKCE tetap jalan)          |
| `KCI_CHESS_REDIRECT_URI` | `https://<nama-proyek>.vercel.app/api/auth/chess/kembali` |

Callback OAuth kini berada di **domain Vercel yang sama** — daftarkan URI
tersebut persis di formulir Chess.com. Tanpa OAuth, jalur cadangan
(kode `KCI-XXXXXX` di kolom Location profil Chess.com) tetap berfungsi.

---

## 5. Batasan serverless (baca sebelum dipakai produksi)

Backend berjalan sebagai Serverless Function — ada 3 konsekuensi yang perlu
diketahui, semuanya setara dengan Render Free:

1. **Data sementara.** Berkas data (`anggota.json`, `daftar-hitam.json`,
   `turnamen.json`, pesan, berita) disimpan di `/tmp/kci-data` yang hidup
   hanya selama instance function hangat. Data **bisa hilang** saat instance
   dingin kembali. Cocok untuk demo/uji coba; untuk data permanen gunakan
   Render **Starter + Persistent Disk** (lihat
   `PANDUAN-DEPLOY-VERCEL-RENDER.md`) atau DB eksternal (Turso/Supabase/Neon).

2. **State dalam memori per instance.** Token CSRF, tiket verifikasi, sesi
   OAuth, dan hitungan rate-limit hidup di memori. Frontend sudah punya
   pemulihan otomatis (403 CSRF → ambil token baru → ulang sekali), jadi
   pengguna normal tidak terdampak. Hanya saja:

   > ⚠️ **OAuth 2.0 Chess.com** bisa gagal sesekali di serverless (state PKCE
   > disimpan di memori instance yang memulai login; callback kadang mendarat
   > di instance lain). Jalur kode profil tidak terdampak. Bila OAuth wajib
   > stabil → pakai Render/VPS.

3. **Cold start.** Permintaan pertama setelah lama tidur butuh 1–3 detik.
   Sinkronisasi roster anggota pertama (`/api/anggota`) bisa memakan waktu
   lebih lama; setelahnya di-cache.

Rate-limit per IP tetap bekerja: di Vercel, bawaan `KCI_JUMLAH_PROXY=1`
dipakai otomatis sehingga IP klien dibaca dari `X-Forwarded-For`.

---

## 6. Kembali ke mode Vercel (frontend) + Render (backend)

Tidak suka serverless? Cukup kembalikan rewrite di `vercel.json` ke backend
Render (dan hapus folder `api/` bila mau):

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://kci-api.onrender.com/api/:path*" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

---

## 7. Troubleshooting

| Gejala | Sebab | Solusi |
| ------ | ----- | ------ |
| `500 FUNCTION_INVOCATION_FAILED` di semua `/api/*` | `KCI_PEPPER`/`KCI_TOKEN_ADMIN` kosong/terlalu pendek (server menolak menyala di mode produksi) | Isi env vars di Vercel → Settings → Environment Variables, lalu **Redeploy** |
| `403 {"pesan":"Asal permintaan tidak diizinkan."}` saat POST | Domain frontend belum terdaftar di `KCI_ASAL_DIIZINKAN` | Tambahkan `https://<proyek>.vercel.app` (dan domain kustom) dipisah koma |
| `{"pesan":"Token CSRF tidak valid."}` sesekali | Instance function berganti (state memori hilang) | Normal di serverless — frontend otomatis mengulang sekali; biarkan |
| `429 Terlalu banyak permintaan` | Rate limit per IP kena (bawaan 100 req/15 mnt/IP) | Tunggu; naikkan `KCI_BATAS_UMUM` bila perlu |
| `/api/anggota` lama balas | Sinkronisasi roster pertama ke Chess.com | Tunggu (maxDuration function 60 detik); kunjungan berikutnya cepat (cache) |
| `502 …Chess.com sedang tidak dapat dihubungi` | API Chess.com padam/diblokir | Coba lagi nanti; bukan galat konfigurasi |
| Function log: `Konfigurasi produksi belum lengkap` | Env vars belum lengkap | Lengkap sesuai pesan di log Vercel → Deployments → Runtime Logs |

---

## 8. Ringkasan biaya

| Bagian | Tempat | Biaya |
| ------ | ------ | ----- |
| Frontend (React → `dist/`) | Vercel Hobby | **Rp 0** |
| Backend (`api/[...jalur].js` serverless) | Vercel Hobby | **Rp 0** (dalam kuota Hobby) |
| **Total** | | **Rp 0** untuk uji coba |

Batasan Hobby: 100 GB-bandwidth/bulan dan eksekusi function terbatas.
Untuk klub dengan trafik kecil–menengah ini umumnya cukup; monitor di
tab Usage dashboard Vercel.
