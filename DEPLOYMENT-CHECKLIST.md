# Checklist Pra-Deploy — Komunitas Catur Indonesia

Gunakan daftar ini **sebelum** setiap rilis produksi. Jangan deploy jika ada
butir wajib yang belum dicentang. Untuk audit dan definition of done v1, lihat
[`V1-READINESS.md`](./V1-READINESS.md). Panduan lengkap:

- [PANDUAN-DEPLOY-FULL-VERCEL.md](./PANDUAN-DEPLOY-FULL-VERCEL.md)
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
| `KCI_JUMLAH_PROXY` | hati-hati | `1` di Serverless Function Vercel. Salah nilai → IP bisa di-spoof lewat `X-Forwarded-For`. |

Generate rahasia:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. Keamanan berkas

- [ ] Data sensitif hanya disimpan melalui storage production yang dikonfigurasi di Vercel.
- [ ] `admin.json` / `data/rahasia/admins.json` **tidak** ada di Git.
  Cek: `git log --all -- data/rahasia/admin.json`
- [ ] Berkas `.env`, `.env.local`, `server/.env` **tidak** ada di Git.
  Cek: `git check-ignore -v .env.local data/rahasia/kontak.json`
- [ ] `*.log` tidak ikut commit.

## 2b. E-book PDF

- [ ] PDF di `public/ebooks/` = blob Git biasa (Git LFS sudah tidak dipakai,
      `.gitattributes` kosong), jadi deploy Vercel tidak perlu menarik LFS.
- [ ] Semua berkas berisi PDF asli sebelum menjalankan migrasi storage.
      Cek: `head -c 4 public/ebooks/*.pdf` → semuanya diawali `%PDF`
      (kalau tercetak `vers`, itu checkout lama yang masih pointer — `git pull`).
- [ ] Unggah koleksi ke bucket privat `ebooks-private` dengan
      `npm run ebook:unggah`; isi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
      dan `KCI_EBOOK_PRIVATE_BUCKET` di Vercel, lalu redeploy.
- [ ] Jika memakai gateway lain, isi `KCI_EBOOK_PRIVATE_BASE` dan token server;
      jangan memakai URL bucket publik atau `EBOOK_BASE` di frontend.
- [ ] `GET /ebooks/<nama>.pdf` tanpa tiket ditolak 403; preview dan unduhan
      hanya berhasil setelah redemption.
- [ ] `npm run uji:ebook` dan `npm run uji:backend` lolos — termasuk konsistensi
      entri `ebook-data.js` ↔ berkas di `public/ebooks/` serta tiket e-book.

---

## 3. Khusus platform

### Vercel (FULL VERCEL)

- [ ] Env vars diisi lewat **dashboard**, bukan di kode/`vercel.json`.
- [ ] `VITE_API_DASAR` **kosong** (frontend memanggil `/api` di domain yang sama).
- [ ] Baca [VERCEL-LIMITATIONS.md](./VERCEL-LIMITATIONS.md): `/tmp` **ephemeral**.
  Data JSON runtime (pesan, admin baru, hasil turnamen) **akan hilang** setelah cold start.
- [ ] **Agar data awet:** jalankan `db/supabase-schema.sql` di Supabase, isi
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` di Vercel, lalu redeploy.

---

## 4. Uji pasca-deploy (staging dulu)

Sebelum deploy, jalankan release gate lokal yang sama dengan CI:

```bash
npm run uji:rilis:v1
npm run uji:e2e
```

Sesudah deploy staging:

```bash
DOMAIN=https://staging.contoh.id
KCI_API_URL="$DOMAIN" KCI_HEALTH_REQUIRE_SUPABASE=1 npm run operasi:kesehatan

curl -sS "$DOMAIN/api/kesehatan"     # harus 200 {"status":"sehat",...}
curl -sS "$DOMAIN/api/v1/kesehatan" # alias versi, perilaku sama
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
