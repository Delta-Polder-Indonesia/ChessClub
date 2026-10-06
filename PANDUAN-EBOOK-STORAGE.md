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
   Masukkan data redemption dan kode akses; PDF baru dibuka setelah tiket
   berhasil diterbitkan. **Unduh** memakai tiket yang sama dan memaksa
   `Content-Disposition: attachment`.

5. **Cek penutupan akses**: permintaan langsung ke
   `/ebooks/<nama>.pdf` tanpa `tiket` harus ditolak (403), baik di dev maupun
   production.

## Bagaimana ini bekerja

| Berkas | Peran |
| --- | --- |
| `scripts/unggah-ebook.mjs` | Mengunggah `public/ebooks/*.pdf` ke bucket privat Supabase `ebooks-private`. |
| `src/data/ebook-storage.js` | Konfigurasi legacy mode lokal; production tidak memakainya. |
| `server/src/ebook-storage.js` | Membentuk kandidat storage privat custom atau Supabase authenticated object endpoint. |
| `src/lib/asets.js` → `urlEbook()` | Selalu menunjuk proxy same-origin `/api/ebook-preview` dan membawa tiket. |
| `src/lib/asets.js` → `sumberEbook()` | Hanya mengembalikan proxy bertiket; URL storage/GitHub tidak masuk bundle browser. |
| `api/ebook-preview.js` | Memeriksa tiket, memilih storage privat di production, lalu menyajikan PDF `inline`/`attachment` dengan `Range`. |
| `plugins/ebook-preview.js` | Menyediakan endpoint bertiket dan memblokir `/ebooks/*` saat `npm run dev` / `npm run preview`. |
| `src/components/PembacaPdf.jsx` | Pembaca PDF berbasis pdf.js (canvas) — dipakai tombol **Baca** setelah redemption. |
| `vercel.json` | Merutekan `/ebooks/*` ke endpoint bertiket dan memasang header `no-store`. |

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

Mode dev/preview tetap boleh memakai PDF di `public/ebooks/` atau
`EBOOK_BASE`, tetapi akses langsung `/ebooks/*` tetap diblokir middleware dan
endpoint tetap meminta tiket. Production tidak memakai fallback tersebut.

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
