# Memindahkan E-Book ke Object Storage (Supabase)

E-book PDF di `public/ebooks/` (±500 MB) selama ini disimpan lewat **Git LFS**.
Ini bekerja, tapi punya dua kelemahan:

- Setiap deploy mengunduh ulang ±500 MB → cepat menghabiskan **bandwidth LFS
  gratis GitHub (1 GiB/bulan)**.
- Kalau checkout deploy tidak menarik LFS (mis. `lfs: true` terlewat, atau
  Git LFS mati di Vercel), situs menyajikan *pointer teks* 132 byte sehingga
  tombol **Baca/Unduh rusak** ("Gagal memuat dokumen PDF").

Solusi di repo ini: **unggah PDF ke Supabase Storage** lalu frontend membaca
dari URL storage (dengan *fallback* otomatis ke berkas lokal bila belum
diunggah).

## Sekali jalan (migrasi)

1. **Pastikan PDF asli ada di mesin lokal** (bukan pointer LFS):
   ```bash
   git lfs install && git lfs pull
   head -c 4 "public/ebooks/Sicilian Defense.pdf"   # harus mencetak %PDF
   ```

2. **Unggah ke Supabase Storage** (pakai kunci *service role*):
   ```bash
   SUPABASE_URL=https://<proyek>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<kunci-service-role> \
   npm run ebook:unggah
   ```
   Skrip ini:
   - membuat bucket publik `ebooks` (bila belum ada),
   - mengunggah semua PDF (mendukung file besar lewat *signed upload*),
   - menulis basis URL ke `src/data/ebook-storage.js`.

3. **Commit & deploy ulang**:
   ```bash
   git add src/data/ebook-storage.js package.json
   git commit -m "e-book: layani PDF dari Supabase Storage"
   git push
   ```
   Lalu **Redeploy** di Vercel (dan GitHub Pages bila dipakai).

4. **Cek**: buka halaman *Program Kami → E-Book & Panduan* → klik **Baca**.
   PDF seharusnya tampil di pratinjau, dan **Unduh** menambahkan `?download`
   agar browser langsung mengunduh.

## Bagaimana ini bekerja

| Berkas | Peran |
| --- | --- |
| `scripts/unggah-ebook.mjs` | Mengunggah `public/ebooks/*.pdf` ke bucket Supabase `ebooks`. |
| `src/data/ebook-storage.js` | Menyimpan `EBOOK_BASE` (basis URL storage). Kosong = mode lama (lokal/LFS). |
| `src/lib/asets.js` → `urlEbook()` | Mengembalikan URL storage bila `EBOOK_BASE` terisi; selain itu URL lokal. |
| `src/halaman/ProgramKami/EbookPanduan.jsx` | Memakai `urlEbook()` untuk iframe Baca, tombol Unduh, dan "buka di tab baru". |
| `index.html` + `vercel.json` | CSP `frame-src` ditambah `https://*.supabase.co` agar iframe Baca diizinkan. |

## Bila memakai penyedia lain (R2 / S3 / B2)

Skrip di atas khusus Supabase. Untuk S3-compatible lain, unggah manual dengan
AWS CLI, lalu isi `EBOOK_BASE` di `src/data/ebook-storage.js`:

```bash
aws s3 cp public/ebooks s3://bucket/ebooks/ --recursive --exclude "*" --include "*.pdf"
```

Kemudian:
- Set `EBOOK_BASE` = URL publik bucket (mis. `https://pub-<hash>.r2.dev/ebooks`).
- Tambahkan origin bucket ke `frame-src` di `index.html` **dan** `vercel.json`.
- Pastikan bucket menyajikan `Content-Type: application/pdf` dan, untuk tombol
  Unduh, dukung `Content-Disposition: attachment` (R2: setel lewat metadata
  `Content-Disposition` pada objek).

## Kembali ke mode lama (opsional)

Kosongkan `EBOOK_BASE` di `src/data/ebook-storage.js` (jadikan `""`), lalu
build ulang — situs otomatis kembali membaca `public/ebooks/*.pdf`.
