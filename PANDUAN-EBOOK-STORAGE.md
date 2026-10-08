# Memindahkan E-Book ke Object Storage (Supabase)

**Status sekarang:** e-book PDF di `public/ebooks/` (32 berkas, ±484 MB) disimpan
sebagai **blob Git biasa**, sejak `scripts/keluar-dari-lfs.sh` dijalankan dan
`.gitattributes` dikosongkan. Bagian LFS di bawah tinggal latar belakang; langkah
object storage tetap berlaku, dan justru makin relevan karena repo sekarang ikut
membawa seluruh koleksi setiap kali diklon atau di-deploy.

Dua kelemahan saat koleksi masih lewat **Git LFS**:

- Setiap deploy mengunduh ulang ±500 MB → cepat menghabiskan **bandwidth LFS
  gratis GitHub (1 GiB/bulan)**.
- Kalau checkout deploy tidak menarik LFS (mis. `lfs: true` terlewat, atau
  Git LFS mati di Vercel), situs menyajikan *pointer teks* 132 byte sehingga
  tombol **Baca/Unduh rusak** ("Gagal memuat dokumen PDF").

Solusi di repo ini: **unggah PDF ke bucket privat Supabase** lalu frontend
meminta PDF melalui proxy same-origin setelah kode akses ditebus. Credential
storage tidak pernah masuk bundle browser dan production fail-closed bila
storage privat belum dikonfigurasi.

## Sekali jalan (migrasi)

1. **Pastikan PDF asli ada di mesin lokal** (klon biasa sudah cukup sejak repo
   tidak lagi memakai Git LFS):
   ```bash
   head -c 4 "public/ebooks/Sicilian Defense.pdf"   # harus mencetak %PDF
   ```
   Hanya untuk checkout lama yang isinya masih pointer: unduh isinya lebih dulu
   (`git lfs install && git lfs pull`) sebelum mengunggah apa pun.

2. **Unggah ke Supabase Storage** (pakai kunci *service role*):
   ```bash
   SUPABASE_URL=https://<proyek>.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=<kunci-service-role> \
   npm run ebook:unggah
   ```
   Skrip ini:
   - membuat bucket privat `ebooks-private` (bila belum ada),
   - mengunggah semua PDF (mendukung file besar lewat *signed upload*),
   - tidak menulis URL atau credential ke bundle frontend.

3. **Commit & deploy ulang**:
   ```bash
   git add src/data/ebook-storage.js package.json
   git commit -m "e-book: layani PDF dari Supabase Storage"
   git push
   ```
   Lalu **Redeploy** di Vercel.

4. **Cek**: buka halaman *Program Kami → E-Book & Panduan* → klik **Baca**.
   Pembaca PDF terbuka **tanpa kode** (mode baca bebas). **Unduh** wajib kode
   akses pengurus: isi data redemption, lalu unduhan dipaksa
   `Content-Disposition: attachment` memakai tiket hasil penebusan.

5. **Cek gerbang unduhan**: `?unduh=1` tanpa tiket harus ditolak (403), baik di
   dev maupun production. Mode baca (`/ebooks/<nama>.pdf` dan
   `/api/ebook-preview?file=<nama>`) sengaja terbuka supaya pengunjung bisa
   menilai isi buku dulu.

## Bagaimana ini bekerja

| Berkas | Peran |
| --- | --- |
| `scripts/unggah-ebook.mjs` | Mengunggah `public/ebooks/*.pdf` ke bucket privat Supabase `ebooks-private`. |
| `src/data/ebook-storage.js` | Konfigurasi legacy mode lokal; production tidak memakainya. |
| `server/src/ebook-storage.js` | Membentuk kandidat storage privat custom atau Supabase authenticated object endpoint. |
| `src/lib/asets.js` → `urlEbook()` | Menunjuk proxy same-origin `/api/ebook-preview`; `unduh: true` + `tiket` untuk unduhan. |
| `src/lib/asets.js` → `sumberEbook()` | Sumber BACA: berkas statis `/ebooks/<nama>.pdf` dulu, lalu proxy tanpa tiket. URL storage/GitHub tidak masuk bundle browser. |
| `api/ebook-preview.js` | Membaca bebas; `?unduh=1` wajib tiket. Memilih sumber di server (storage privat → berkas statis → cadangan) lalu menyajikan PDF `inline`/`attachment` dengan `Range`. |
| `plugins/ebook-preview.js` | Endpoint yang sama saat `npm run dev` / `npm run preview`; `/ebooks/*` diteruskan ke berkas statis. |
| `src/components/PembacaPdf.jsx` | Pembaca PDF berbasis pdf.js (canvas) — dibuka tombol **Baca** tanpa kode. |
| `vercel.json` | Menyajikan `/ebooks/*` sebagai berkas statis (mode baca) dengan cache publik. |

## Kenapa tombol "Baca" tidak lagi mengunduh berkas

Dulu pratinjau memakai `<iframe src="…pdf">`. Cara itu bergantung pada
penampil PDF bawaan browser — dan penampil itu **tidak ada** di Chrome/Firefox
Android maupun peramban dalam aplikasi, sehingga berkas justru terunduh. Kini
halaman digambar sendiri oleh pdf.js ke `<canvas>`, lengkap dengan navigasi
halaman dan zoom, jadi perilakunya sama di semua perangkat.

Sisi server memeriksa magic bytes `%PDF` sebelum meneruskan sumber. Dalam
production hanya storage privat yang dicoba; berkas `public/ebooks/`, GitHub
Media, dan `EBOOK_BASE` tidak menjadi fallback. Mode lokal tetap mendukung
berkas checkout dan sumber cadangan agar pengembangan offline tetap berjalan.

## Bila memakai penyedia privat lain (R2 / S3 / B2)

Skrip di atas khusus Supabase. Untuk gateway storage privat lain, unggah
manual dengan AWS CLI atau mekanisme penyedia tersebut:

```bash
aws s3 cp public/ebooks s3://bucket/ebooks/ --recursive --exclude "*" --include "*.pdf"
```

Kemudian isi environment server, bukan `EBOOK_BASE` frontend:

```bash
KCI_EBOOK_PRIVATE_BASE=https://storage-internal.example/ebooks
KCI_EBOOK_PRIVATE_TOKEN=<token-server>
```

Basis URL harus hanya dapat dijangkau oleh endpoint server dan gateway wajib
mengembalikan `Content-Type: application/pdf`. Jangan membuat bucket publik,
dan jangan menambahkan origin storage privat ke CSP browser.

## Mode lokal

Mode dev/preview memakai PDF di `public/ebooks/` (berkas statis untuk mode
baca) dan jatuh ke proxy bila berkas tidak ada. Production mencoba storage
privat lebih dulu, lalu berkas statis hasil build — sehingga koleksi tetap
bisa dibaca sebelum migrasi storage selesai.

### Rahasia tiket harus sama di dua proses

Tiket unduhan ditebus dan ditandatangani backend (port 8787), lalu
**diverifikasi proses lain** yang melayani `/api/ebook-preview` (middleware Vite
saat `npm run dev` / `npm run preview`). Bila `KCI_JWT_SECRET` tidak diisi,
kedua proses otomatis memakai rahasia pengembangan yang sama, jadi alur
`npm run dev` + backend langsung berfungsi.

Kalau Anda mengisi `KCI_JWT_SECRET` (mis. untuk meniru produksi), isi di KEDUA
proses. Bila hanya salah satu, unduhan dengan kode yang benar selalu ditolak
403 — gejalanya: kode akses diterima di modal, tetapi berkasnya gagal diambil.

```bash
KCI_JWT_SECRET="kalimat-acak-panjang" npm run dev          # proses pratinjau
KCI_JWT_SECRET="kalimat-acak-panjang" node server/src/index.js   # backend
```

## Pilihan lain: keluar dari Git LFS (PDF disimpan biasa di repo)

**Sudah dijalankan di repo ini** — PDF sekarang blob Git biasa dan `.gitattributes`
kosong. Jangan ulangi skripnya; bagian berikut tinggal catatan cara kerjanya (dan
pegangan kalau koleksi pernah dikembalikan ke LFS).

Kalau Anda ingin PDF asli tetap ada di repositori untuk mode lokal atau
fallback pengembangan (akses production tetap melalui proxy bertiket), pakai skrip:

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

Kondisi koleksi saat ini: **32 berkas, ±484 MB**, terbesar
`Ruy Lopez_Anti Berlin (id).pdf` ±75 MB (aman, tapi kena peringatan >50 MB).

Konsekuensi yang perlu disadari:

- Ukuran `.git` bertambah ±484 MB dan **tidak bisa dikecilkan** tanpa menulis
  ulang riwayat; setiap kali satu PDF diganti, salinan penuhnya tersimpan lagi.
- `git clone` (termasuk clone yang dilakukan Vercel/GitHub Actions setiap
  deploy) ikut mengunduh semua berkas itu → build lebih lambat.
- Deployment Vercel tetap perlu memperhitungkan ukuran checkout dan waktu build;
  object storage menghindari pengiriman ulang koleksi PDF besar setiap deploy.

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
| PDF biasa di Git (`scripts/keluar-dari-lfs.sh`) — **status aktif** | ❌ (+484 MB) | ❌ | ❌ | ingin semuanya di satu repo |
| Tetap Git LFS | ✅ | ❌ | ✅ 1 GiB/bulan | jumlah pembaca masih kecil |

Apa pun pilihannya, tombol **Baca** tetap bekerja: proxy `/api/ebook-preview`
otomatis memilih sumber yang benar-benar berisi PDF.

## Audit artefak (dijalankan manual, bukan bagian `npm run uji`)

Dua audit ini memeriksa hal yang tak terlihat dari uji unit: berkas
sungguhan di disk dan hasil build. Jalankan dari akar repo dengan server
dev (`npm run dev`) hidup untuk bagian HTTP-nya.

1. **Koleksi & penyajian** — untuk setiap entri: berkas PDF benar-benar
   dibuka pdf.js (bukan sekadar berawalan `%PDF`), jumlah halamannya cocok
   dengan data, dimensi tiap sampul cocok dengan manifest `UKUR`, lalu
   setiap berkas diambil lewat HTTP — `/ebooks/*.pdf` (jalur baca statis),
   `/api/ebook-preview?file=…`, dan sampul `.webp`. URL dibuat persis
   seperti aplikasi (`berkasPublik()` tidak meng-encode nama; `urlEbook()`
   meng-encode penuh), karena perbedaan encoding itulah yang dulu membuat
   satu buku menerima HTML alih-alih PDF.
2. **Artefak build** — setelah `npm run build`, seluruh rujukan aset statis
   di `dist/**/*.js|css|html` dicocokkan dengan berkas yang benar-benar ada
   di `dist/`, termasuk 32 PDF, seluruh sampul + variannya, cMaps/font
   standar pdf.js, dan worker pdf.js.

Aturan yang dijaga uji otomatis (`npm run uji:ebook`, `uji:gambar`):

- nama berkas di `file:` tidak memakai escape yang mematikan penyajian
  statis (`%2C`, `%23`, `%3F`, `%26`, `%25`, `%2F`, `%5C`) — koma/spasi
  ditulis apa adanya (`,` dan `%20`);
- berkas bernomor (`cover-...-288.webp`) hanya dianggap **varian** kalau
  berkas dasarnya ada, kalau tidak ia gambar asli yang wajib terdaftar di
  manifest (kalau tidak: tanpa `width`/`height`, tata letak bergeser);
- buku bertanda `tersedia: false` **tidak boleh** punya berkas PDF di
  `public/ebooks/` — `/ebooks/*` disajikan apa adanya, jadi berkas yang
  sudah di-commit bisa dibaca siapa pun walau halaman menandainya
  "segera hadir".
