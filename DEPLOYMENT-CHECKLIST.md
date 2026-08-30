# Checklist Pra-Deploy — Komunitas Catur Indonesia

Gunakan daftar ini **sebelum** setiap rilis produksi. Jangan deploy jika ada
butir wajib yang belum dicentang. Panduan lengkap:

- [PANDUAN-DEPLOY-FULL-VERCEL.md](./PANDUAN-DEPLOY-FULL-VERCEL.md)
- [PANDUAN-DEPLOY-VERCEL-RENDER.md](./PANDUAN-DEPLOY-VERCEL-RENDER.md)
- [VERCEL-LIMITATIONS.md](./VERCEL-LIMITATIONS.md)
- [server/README.md](./server/README.md)

---

## 1. Variabel lingkungan produksi

| Variabel | Wajib | Syarat |
| -------- | ----- | ------ |
| `KCI_PEPPER` | **ya** | Minimal 32 karakter acak. **Jangan diganti** setelah ada data anggota/larangan. |
| `KCI_ADMIN_PASSWORD` | **ya** | Bukan `admin123`. Minimal 12 karakter, acak. |
| `KCI_ADMIN_USER` | disarankan | Username dashboard `/pengurus` (bukan bawaan jika bisa). |
| `KCI_JWT_SECRET` | **ya** | Minimal 32 karakter acak. Tanpa ini JWT tidak aman. |
| `KCI_ASAL_DIIZINKAN` | **ya** | Daftar origin CORS, dipisah koma, **tanpa** trailing slash. |
| `KCI_CHESS_CLIENT_ID` | jika OAuth | Dari Chess.com. |
| `KCI_CHESS_CLIENT_SECRET` | jika OAuth | Rahasia aplikasi Chess.com. |
| `KCI_CHESS_REDIRECT_URI` | jika OAuth | Harus persis sama dengan yang didaftarkan. |
| `KCI_TOKEN_ADMIN` | opsional | Token legacy; bila diisi minimal 24 karakter. |
| `KCI_JUMLAH_PROXY` | hati-hati | `1` di belakang Vercel/Render. Salah nilai → IP bisa di-spoof lewat `X-Forwarded-For`. |

Generate rahasia:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Keamanan berkas

- [ ] Izin folder `data/rahasia/` = `0700` (hanya owner) di VPS/Render.
- [ ] `admin.json` / `data/rahasia/admins.json` **tidak** ada di Git.
  Cek: `git log --all -- data/rahasia/admin.json`
- [ ] Berkas `.env`, `.env.local`, `server/.env` **tidak** ada di Git.
  Cek: `git check-ignore -v .env.local data/rahasia/kontak.json`
- [ ] `*.log` tidak ikut commit.

## 2b. E-book PDF (Git LFS)

- [ ] Checkout deploy memakai `lfs: true` (sudah ada di `deploy.yml` — jangan
      dihapus). Tanpa itu `dist/ebooks/*.pdf` hanya berisi pointer LFS 132 byte.
- [ ] PDF lokal bukan pointer kosong.
      Cek: `head -c 4 public/ebooks/*.pdf` → semua diawali `%PDF`.
      Kalau pointer: `git lfs pull` (butuh `git-lfs` terpasang).
- [ ] Objek LFS masih tersedia di GitHub (kuota LFS gratis: 1 GB penyimpanan,
      1 GB bandwidth/bulan; total PDF ± 394 MB).
- [ ] `npm run uji` lolos — di dalamnya `scripts/uji-ebook.mjs` memeriksa
      konsistensi entri `ebook-data.js` ↔ berkas di `public/ebooks/`.

---

## 3. Khusus platform

### Vercel (FULL VERCEL)

- [ ] Env vars diisi lewat **dashboard**, bukan di kode/`vercel.json`.
- [ ] `VITE_API_DASAR` **kosong** (frontend memanggil `/api` di domain yang sama).
- [ ] Baca [VERCEL-LIMITATIONS.md](./VERCEL-LIMITATIONS.md): `/tmp` **ephemeral**.
  Data JSON runtime (pesan, admin baru, hasil turnamen) **akan hilang** setelah cold start.
- [ ] **Agar data awet:** jalankan `db/supabase-schema.sql` di Supabase, isi
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` di Vercel, redeploy. Alternatif:
  Render + Persistent Disk, Vercel KV, atau PostgreSQL relasional penuh.

### Render (backend + disk)

- [ ] Persistent Disk terpasang dan `KCI_DIR_DATA` menunjuk ke mount itu.
- [ ] Health check `GET /api/kesehatan` di Blueprint.

### GitHub Pages

- [ ] Artefak `dist/` bersih; backend **tidak** jalan di Pages.
- [ ] `VITE_API_DASAR` menunjuk ke backend Render/VPS.

---

## 4. Uji pasca-deploy (staging dulu)

```bash
DOMAIN=https://staging.contoh.id
npm run uji:backend   # atau: KCI_DASAR=$DOMAIN npm run uji:backend

curl -sS "$DOMAIN/api/kesehatan"   # harus 200 {"status":"sehat",...}
curl -sS "$DOMAIN/api/v1/kesehatan"  # alias versi, perilaku sama
```

- [ ] `GET /api/kesehatan` → 200 OK
- [ ] Login `/pengurus` dengan password produksi (bukan `admin123`)
- [ ] CORS: origin produksi ada di `KCI_ASAL_DIIZINKAN`

---

## 5. Peringatan keamanan

- Scanner (GitHub secret scanning, npm audit) **akan** menandai kredensial
  bawaan `admin123`. Jangan sampai lolos ke produksi.
- Rate-limit di Vercel **reset** setiap cold start (state di memori instance).
  Jangan andalkan ini sebagai satu-satunya pertahanan brute-force.
- `X-Forwarded-For` bisa dipalsukan jika `KCI_JUMLAH_PROXY` terlalu besar
  atau diisi di server yang tidak di belakang proxy.
- `KCI_PEPPER` yang berubah membuat hash identitas lama tidak cocok —
  daftar hitam identitas gagal mencocokkan.
