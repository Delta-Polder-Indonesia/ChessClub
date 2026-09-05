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
| `src/lib/asets.js` → `urlEbook()` | Selalu menunjuk proxy same-origin `/api/ebook-preview`; endpoint itu yang memilih sumber sebenarnya. |
| `src/lib/asets.js` → `sumberEbook()` | Daftar URL cadangan (proxy → berkas statis → storage → GitHub Media) untuk pembaca di browser. |
| `api/ebook-preview.js` | Memilih sumber yang benar-benar berisi PDF (cek `%PDF`), lalu menyajikannya `inline` + dukung `Range`. |
| `plugins/ebook-preview.js` | Menyediakan endpoint yang sama saat `npm run dev` / `npm run preview`. |
| `src/components/PembacaPdf.jsx` | Pembaca PDF berbasis pdf.js (canvas) — dipakai tombol **Baca** (ikon mata). |
| `plugins/pdfjs-aset.js` | Menyajikan/menyalin cMaps & font standar pdf.js ke `/vendor/pdfjs/`. |
| `index.html` + `vercel.json` | CSP `connect-src` ditambah `media.githubusercontent.com` & `*.supabase.co` agar sumber cadangan boleh diambil pdf.js. |

## Kenapa tombol "Baca" tidak lagi mengunduh berkas

Dulu pratinjau memakai `<iframe src="…pdf">`. Cara itu bergantung pada
penampil PDF bawaan browser — dan penampil itu **tidak ada** di Chrome/Firefox
Android maupun peramban dalam aplikasi, sehingga berkas justru terunduh. Kini
halaman digambar sendiri oleh pdf.js ke `<canvas>`, lengkap dengan navigasi
halaman dan zoom, jadi perilakunya sama di semua perangkat.

Sisi server pun tidak lagi menganggap satu sumber selalu benar: pointer Git LFS
(132 byte teks) otomatis dilewati dan diganti isi asli dari GitHub Media atau
object storage.

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

## Pilihan lain: keluar dari Git LFS (PDF disimpan biasa di repo)

Kalau Anda ingin PDF asli benar-benar ada di repositori — supaya Vercel
menyajikannya langsung dari `dist/ebooks/` tanpa kuota LFS — pakai skrip:

```bash
bash scripts/keluar-dari-lfs.sh --periksa   # cek dulu, tidak mengubah apa pun
bash scripts/keluar-dari-lfs.sh             # migrasi + commit
git push origin <nama-branch-anda>
```

Yang dilakukan skrip:

1. `git lfs pull` — memastikan isi asli ada di mesin Anda (bukan pointer).
2. Memverifikasi setiap berkas diawali `%PDF` dan **< 100 MB** (GitHub menolak
   berkas ≥ 100 MB, dan memberi peringatan mulai 50 MB).
3. Menghapus baris `*.pdf filter=lfs …` dari `.gitattributes`.
4. `git add --renormalize` — commit berikutnya menyimpan PDF sebagai blob Git
   biasa. **Riwayat lama tidak ditulis ulang**, jadi tidak perlu force push.

Kondisi koleksi saat ini: **24 berkas, ±394 MB**, terbesar
`Ruy Lopez_Anti Berlin (id).pdf` ±72 MB (aman, tapi kena peringatan >50 MB).

Konsekuensi yang perlu disadari:

- Ukuran `.git` bertambah ±400 MB dan **tidak bisa dikecilkan** tanpa menulis
  ulang riwayat; setiap kali satu PDF diganti, salinan penuhnya tersimpan lagi.
- `git clone` (termasuk clone yang dilakukan Vercel/GitHub Actions setiap
  deploy) ikut mengunduh semua berkas itu → build lebih lambat.
- GitHub Pages punya batas lunak 1 GB per situs; 394 MB PDF memakan sebagian
  besar jatah itu.

Karena itu, sebelum migrasi sebaiknya kompres dulu:

```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.5 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile="keluar.pdf" "masuk.pdf"
```

### Ringkasan tiga opsi

| Opsi | Repo tetap ringan | Butuh layanan luar | Kuota LFS terpakai | Cocok bila |
| --- | --- | --- | --- | --- |
| Object storage (`npm run ebook:unggah`) | ✅ | Supabase/R2/S3 | ❌ | koleksi terus bertambah besar |
| PDF biasa di Git (`scripts/keluar-dari-lfs.sh`) | ❌ (+394 MB) | ❌ | ❌ | ingin semuanya di satu repo |
| Tetap Git LFS | ✅ | ❌ | ✅ 1 GiB/bulan | jumlah pembaca masih kecil |

Apa pun pilihannya, tombol **Baca** tetap bekerja: proxy `/api/ebook-preview`
otomatis memilih sumber yang benar-benar berisi PDF.
