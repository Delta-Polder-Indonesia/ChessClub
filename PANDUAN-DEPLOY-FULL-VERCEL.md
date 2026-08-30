# Panduan FULL VERCEL — Frontend + Backend Aktif dalam Satu Proyek

> Backend tidak perlu Render untuk mode ini. Seluruh aplikasi berjalan dalam
> **satu proyek Vercel**:
>
> ```text
> Browser ──> Vercel
>              ├── /            → frontend React statis (dist/)
>              └── /api/*       → Serverless Function api/[...jalur].js
>                                 (menjalankan server/src/index.js)
> ```
>
> **Dashboard pengurus ada di `/pengurus`** dan login memakai
> **username + password**, bukan alamat `/dashboard-pengurus`.

---

## 1. Siapkan rahasia login dan hashing

Jalankan sekali di terminal lokal, lalu simpan hasilnya di password manager.
Jangan pernah menaruh nilai asli di Git.

```bash
# Pepper — untuk hashing identitas anggota (minimal 16 karakter)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Password pengurus/master yang kuat
node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"

# Opsional: token legacy pengurus (masih didukung sebagai password alternatif)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

> **Penting:** `KCI_PEPPER` tidak boleh diganti setelah ada data anggota/
> larangan. Jika pepper berubah, hash identitas lama tidak cocok lagi.

---

## 2. Deploy ke Vercel

### Cara A — lewat dashboard Vercel (disarankan)

1. Buka [vercel.com](https://vercel.com) → **Add New… → Project** → pilih
   repositori GitHub `ChessClub`.
2. Framework Preset akan terbaca sebagai **Vite**. Konfigurasi sudah ada di
   `vercel.json`:
   - `buildCommand`: `VITE_BASE_PUBLIC=/ npm run build`
   - `outputDirectory`: `dist`
   - `/api/*`: dilayani oleh `api/[...jalur].js`
3. Sebelum menekan **Deploy**, isi **Settings → Environment Variables**:

   | Key                  | Nilai                              | Wajib?     | Catatan                                                                    |
   | -------------------- | ---------------------------------- | ---------- | -------------------------------------------------------------------------- |
   | `KCI_PEPPER`         | hasil generate langkah 1           | **WAJIB**  | Minimal 16 karakter, jangan diganti setelah ada data                       |
   | `KCI_ADMIN_USER`     | `admin` atau username pilihan      | disarankan | Username login dashboard `/pengurus`                                       |
   | `KCI_ADMIN_PASSWORD` | password kuat langkah 1            | **WAJIB**  | Server produksi menolak bawaan `admin123`                                  |
   | `KCI_ASAL_DIIZINKAN` | `https://<nama-proyek>.vercel.app` | **WAJIB**  | Tambahkan domain kustom juga bila ada, pisahkan koma, tanpa trailing slash |
   | `KCI_TOKEN_ADMIN`    | token legacy langkah 1             | opsional   | Hanya bila ingin kompatibilitas token lama                                 |
   | `KCI_LOG_PERMINTAAN` | `1`                                | disarankan | Log ringkas tanpa body/token/IP                                            |
   | `KCI_CHESS_KLUB`     | `blunder-skuad`                    | opsional   | Bawaan sudah benar                                                         |

   Untuk domain kustom, contoh:

   ```text
   KCI_ASAL_DIIZINKAN=https://nama-proyek.vercel.app,https://komunitasmu.id
   ```

   > **Alamat kanonik (SEO).** `MetaHalaman`, `sitemap.xml`, `robots.txt`, dan
   > `llms.txt` memakai satu alamat situs. Build mencarinya berurutan:
   > `VITE_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` →
   > default `https://delta-polder-indonesia.github.io/ChessClub/`. Di Vercel
   > dua variabel pertama sudah diisi sendiri, jadi tidak perlu diatur; kalau
   > suatu saat memakai domain kustom, set `VITE_SITE_URL=https://komunitasmu.id`
   > supaya canonical tidak menunjuk host lama. Tanpa itu Lighthouse SEO
   > menandai deploy Vercel sebagai duplikat GitHub Pages.

   **Jangan isi `VITE_API_DASAR` untuk FULL VERCEL.** Biarkan kosong/tidak ada
   agar frontend memanggil `/api/...` di domain Vercel yang sama. Jika variabel
   ini masih berisi URL Render lama, dashboard akan mencoba login ke backend
   lama dan bisa gagal.

4. Tekan **Deploy** dan tunggu selesai. Jika mengubah Environment Variables
   setelah deploy pertama, buka tab **Deployments** → pilih deployment terbaru
   → **Redeploy**.

### Cara B — lewat Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link

vercel env add KCI_PEPPER production
vercel env add KCI_ADMIN_USER production
vercel env add KCI_ADMIN_PASSWORD production
vercel env add KCI_ASAL_DIIZINKAN production
# Opsional legacy:
vercel env add KCI_TOKEN_ADMIN production

vercel --prod
```

---

## 3. Verifikasi backend dan login pengurus

Ganti domain di bawah dengan domain Vercel milikmu.

```bash
DOMAIN=https://nama-proyek.vercel.app
ADMIN_USER=admin
ADMIN_PASSWORD='isi-password-KCI_ADMIN_PASSWORD'

# 1) Backend hidup — harus balas {"status":"sehat",...}
curl "$DOMAIN/api/kesehatan"

# 2) CSRF tersedia — harus balas {"token":"..."}
curl "$DOMAIN/api/csrf-token"

# 3) Endpoint pengurus terkunci — harus 401, bukan 404
curl -s -o /dev/null -w "%{http_code}\n" \
  "$DOMAIN/api/pengurus/verifikasi"

# 4) Login dashboard — harus 200 dan memuat {"ok":true,...}
curl -s -X POST "$DOMAIN/api/auth/login" \
  -H "Content-Type: application/json" \
  --data "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASSWORD\"}"

# 5) Token hasil login/password dapat membuka endpoint pengurus — harus 200
curl -s "$DOMAIN/api/pengurus/verifikasi" \
  -H "X-Admin-User: $ADMIN_USER" \
  -H "X-Token-Admin: $ADMIN_PASSWORD"

# 6) Ringkasan dashboard (akar /api/pengurus, bukan 404)
curl -s "$DOMAIN/api/pengurus" \
  -H "Authorization: Bearer $ADMIN_PASSWORD"
```

Jika langkah 1–5 sesuai, buka:

```text
https://nama-proyek.vercel.app/pengurus
```

Masuk dengan:

```text
Username: nilai KCI_ADMIN_USER
Password: nilai KCI_ADMIN_PASSWORD
```

Akun pertama adalah **Master Admin**. Setelah masuk, Master dapat membuka menu
profil kanan atas → **Pengaturan** untuk menambah Admin Pengurus, tetapi baca
catatan persistensi Vercel di bawah sebelum dipakai produksi.

---

## 4. Catatan khusus dashboard pengurus di Vercel

1. **Alamat benar:** `/pengurus`. Alamat lama `/dashboard-pengurus` tidak
   dipakai.
2. **Login utama:** `KCI_ADMIN_USER` + `KCI_ADMIN_PASSWORD`.
3. **Token lama:** `KCI_TOKEN_ADMIN` masih diterima sebagai password alternatif
   untuk kompatibilitas, tetapi tidak wajib bila password admin sudah kuat.
4. **Perubahan admin lewat dashboard tidak permanen di FULL VERCEL** *jika
   Supabase belum diaktifkan.* Vercel hanya mengizinkan penulisan runtime ke
   `/tmp`. Jadi ganti password/tambah admin dari menu Pengaturan dapat hilang
   saat cold start/redeploy. Untuk kredensial permanen di FULL VERCEL:
   - matikan Supabase, **ubah `KCI_ADMIN_PASSWORD`/`KCI_TOKEN_ADMIN` di
     Environment Variables Vercel lalu redeploy**; atau
   - **aktifkan Supabase (Bagian 9)** sehingga perubahan admin ikut tersimpan
     di `kci_storage` dan awet.
5. **Session login tersimpan di tab browser saja** (`sessionStorage`). Jika tab
   ditutup, pengurus perlu login ulang.

---

## 5. Login OAuth Chess.com (opsional untuk verifikasi anggota)

Jika client_id Chess.com sudah disetujui, tambahkan env vars berikut:

| Key                       | Nilai                                                     |
| ------------------------- | --------------------------------------------------------- |
| `KCI_CHESS_CLIENT_ID`     | dari Chess.com                                            |
| `KCI_CHESS_CLIENT_SECRET` | dari Chess.com, jika tersedia                             |
| `KCI_CHESS_REDIRECT_URI`  | `https://<nama-proyek>.vercel.app/api/auth/chess/kembali` |

Daftarkan redirect URI itu persis sama di Chess.com. Tanpa OAuth, jalur
cadangan kode profil (`KCI-XXXXXX` di kolom Location profil Chess.com) tetap
berfungsi.

---

## 6. Batasan serverless FULL VERCEL

> **PENTING: Vercel Serverless `/tmp` tidak persistent!**
>
> `KCI_DIR_DATA` bawaan di Vercel adalah `/tmp/kci-data`. Isinya hilang
> setelah cold start, instance baru, atau redeploy. Ini **blocker** jika
> FULL VERCEL dipakai sebagai backend produksi dengan data tulis — **kecuali**
> Supabase diaktifkan (Bagian 9). Dengan Supabase, seluruh data tulis masuk
> ke PostgreSQL dan awet.
>
> Solusi A (disarankan): Supabase bawaan — `db/supabase-schema.sql` + env
> `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (Bagian 9).
> Solusi B: Render + Persistent Disk untuk backend (`PANDUAN-DEPLOY-VERCEL-RENDER.md`)
> Solusi C: Vercel KV (Redis) untuk sesi/cache
> Solusi D: PostgreSQL relasional penuh (Neon/Railway) — `DATABASE-MIGRATION.md`
>
> Rincian: `VERCEL-LIMITATIONS.md`.

1. **Data seed dari Git tetap permanen; tulisan runtime awet bila Supabase
   aktif.** Berkas `data/*.json` yang di-commit ikut dibundle; saat Supabase
   aktif dan baris belum ada, isinya otomatis di-seed ke `kci_storage` sehingga
   data publik tetap tampil. Tanpa Supabase, tulisan runtime (pesan, riwayat
   masuk, perubahan konten/admin) disimpan di `/tmp` dan dapat hilang saat
   instance dingin atau redeploy.
2. **State memori per instance.** CSRF token, tiket verifikasi, sesi OAuth,
   dan rate-limit hidup di memori function. Frontend sudah otomatis mengambil
   CSRF baru saat token lama ditolak.
3. **OAuth Chess.com bisa kurang stabil di serverless.** State PKCE disimpan di
   memori instance yang memulai login; callback kadang mendarat di instance
   lain. Jika OAuth wajib stabil, gunakan backend persistent (Render/VPS).
4. **Cold start.** Request pertama setelah lama tidak dipakai bisa butuh 1–3
   detik; sinkronisasi roster Chess.com pertama bisa lebih lama.

---

## 7. Gambar responsif (saat menambah/mengganti foto)

`public/images/` berisi berkas asli (tidak pernah diubah) dan varian kecil
berakhiran `-<lebar>.webp` yang dihasilkan skrip. Setelah menambah foto:

```bash
npm run gambar:optimum   # buat varian + tulis ulang src/data/ukur-gambar.js
npm run uji:gambar      # pastikan manifest & berkas cocok
```

`src/data/ukur-gambar.js` adalah hasil generate — jangan disunting tangan.
Komponen membaca peta itu lewat `sumberGambar()`/`sumberHero()`
(`src/lib/asets.js`) untuk memasang `srcset` + `sizes` + `width`/`height`;
gambar yang tidak terdaftar di manifest tampil seperti dulu (tidak mungkin
404 karena manifesto kelebihan entri). Keduanya harus di-commit bersamaan.

Header, hero, dan CSP juga ikut dibaca saat build: `vercel.json` mengirim
`Content-Security-Policy`, `X-Frame-Options`, `Permissions-Policy`, dan
`Cache-Control` untuk `/images` + `/engines` (Stockfish ± 1 MB, dulu
dihitung ulang sebagai byte "tidak ter-cache" oleh PageSpeed).

---

## 8. Troubleshooting akses dashboard pengurus

| Gejala                                                                              | Sebab paling umum                                                                                        | Solusi                                                                            |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Membuka `/dashboard-pengurus` gagal/404                                             | Alamat lama                                                                                              | Gunakan `https://domainmu/pengurus`                                               |
| Login 401 “Username atau password salah”                                            | `KCI_ADMIN_USER`/`KCI_ADMIN_PASSWORD` salah, belum redeploy, atau env dipasang di environment yang salah | Cek env Production di Vercel, pastikan tanpa spasi tambahan, lalu **Redeploy**    |
| Semua `/api/*` balas `500 FUNCTION_INVOCATION_FAILED`                               | Env produksi belum lengkap, terutama `KCI_PEPPER`, `KCI_ADMIN_PASSWORD`, atau `KCI_ASAL_DIIZINKAN`       | Buka Vercel → Deployments → Runtime Logs, lengkapi env sesuai pesan log, redeploy |
| POST/login balas `403 {"pesan":"Asal permintaan tidak diizinkan."}`                 | Domain tidak ada di `KCI_ASAL_DIIZINKAN`                                                                 | Tambahkan domain Vercel dan domain kustom, tanpa trailing slash, pisah koma       |
| Frontend hidup tetapi dashboard selalu gagal login                                  | `VITE_API_DASAR` masih menunjuk backend lama                                                             | Hapus/kosongkan `VITE_API_DASAR` di Vercel untuk FULL VERCEL, redeploy            |
| Setelah ganti password di dashboard, beberapa waktu kemudian balik ke password lama | Perubahan tersimpan di `/tmp` serverless                                                                 | Ubah `KCI_ADMIN_PASSWORD` di Environment Variables Vercel, lalu redeploy          |
| Data (pendaftaran, turnamen, pesan) tidak tersimpan / hilang setelah redeploy        | Backend menulis ke `/tmp` yang ephemeral; Supabase belum diaktifkan                                        | Aktifkan Supabase (lihat **Bagian 9**), lalu redeploy                            |
| `Token CSRF tidak valid` sesekali                                                   | Instance function berganti                                                                               | Normal di serverless; frontend akan ambil CSRF baru dan ulangi request            |
| `/api/anggota` lama balas                                                           | Sinkronisasi roster Chess.com pertama                                                                    | Tunggu sampai 60 detik; request berikutnya memakai cache                          |
| `502 ... Chess.com sedang tidak dapat dihubungi`                                    | API Chess.com sedang bermasalah                                                                          | Coba lagi nanti; bukan galat login pengurus                                       |

---

## 9. Membuat data produksi AWET dengan Supabase (disarankan)

FULL VERCEL memakai Serverless Function yang **menulis data ke `/tmp`** —
direktori itu **hilang** setiap cold start / redeploy. Itulah penyebab
“data tidak tersimpan”: pendaftaran anggota, hasil turnamen, pesan, admin
tambahan, dan jejak audit lenyap.

Aplikasi ini sekarang **mendukung Supabase langsung**. Dengan mengaktifkannya,
seluruh data runtime disimpan ke PostgreSQL sehingga **benar-benar awet**
tanpa perlu Render/VPS. Caranya:

1. **Buat tabel.** Buka [Supabase](https://supabase.com) → proyekmu →
   **SQL Editor** → **New query**, tempel isi berkas `db/supabase-schema.sql`,
   lalu **Run**. Ini membuat tabel `kci_storage`.
2. **Set Environment Variables** di Vercel (**Settings → Environment
   Variables**). Bila proyek Vercel sudah terhubung lewat integrasi Supabase
   di Vercel Marketplace, `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`
   sudah otomatis ada — cukup pastikan keduanya terisi.
   | Key                        | Nilai (`<proyek>` = id proyek Supabase)  |
   | -------------------------- | ----------------------------------------- |
   | `SUPABASE_URL`             | `https://<proyek>.supabase.co`            |
   | `SUPABASE_SERVICE_ROLE_KEY`| kunci **service role** (jangan anon key)  |
3. **Redeploy** proyek Vercel (Deployments → Deployment terbaru → **Redeploy**).
4. Periksa log: harus muncul
   `Penyimpanan Supabase dikonfigurasi — data akan TERSIMPAN`.

Setelah itu semua data ditulis ke PostgreSQL dan bertahan terhadap redeploy.
Data publik awal (anggota, turnamen, berita, pengumuman) yang di-commit ke Git
otomatis di-seed ke database saat pertama kali dibaca, jadi situs tetap tampil
normal.

> **Catatan keamanan:** gunakan `SUPABASE_SERVICE_ROLE_KEY` untuk backend
> (melewati Row Level Security). Jangan menaruh anon key di frontend — data
> `kci_storage` berisi kontak pribadi & admin.

### Menguji bahwa data tersimpan

Setelah mengaktifkan, daftarkan satu anggota baru di situs, lalu di Supabase
jalankan:

```sql
select id, length(data) as ukuran, updated_at from public.kci_storage
order by updated_at desc limit 10;
```

Harus ada baris `anggota.json` (dan `rahasia/kontak.json`) yang terbarui.

---

Jika **tidak** memakai Supabase, dan tetap ingin data awet, pakai salah satu
opsi berikut:

- **Vercel frontend + Render Starter + Persistent Disk** — lihat
  `PANDUAN-DEPLOY-VERCEL-RENDER.md`.
- **VPS** dengan `KCI_DIR_DATA` di disk permanen.

---

## 10. Ringkasan biaya

| Bagian                        | Tempat                     | Biaya                  |
| ----------------------------- | -------------------------- | ---------------------- |
| Frontend (`dist/`)            | Vercel Hobby               | Rp 0 dalam kuota Hobby |
| Backend (`api/[...jalur].js`) | Vercel Serverless Function | Rp 0 dalam kuota Hobby |
| Total uji coba                |                            | Rp 0                   |
