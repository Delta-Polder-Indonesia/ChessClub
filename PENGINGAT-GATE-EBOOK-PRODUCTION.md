# Pengingat Gate E-Book Production

Dokumen ini adalah checklist lanjutan setelah implementasi gate e-book.
Credential tidak boleh ditulis di file ini atau dikirim lewat chat.

## Aturan gerbang: baca bebas, unduh pakai kode

Kebijakan halaman E-Book & Panduan (dipilih pemilik situs):

- **Baca (ikon mata) bebas tanpa kode.** Pengunjung bisa memeriksa isi PDF
  lebih dulu sebelum memutuskan mengunduh. Pembaca memuat berkas statis
  `/ebooks/<nama>.pdf` (cadangan: proxy `/api/ebook-preview`).
- **Unduh wajib kode akses pengurus.** Kode aktif 1 jam; tiket hasil tebus
  berlaku 15 menit, hanya untuk satu berkas PDF, dan hanya dipakai jalur
  unduhan (`?unduh=1`, `Content-Disposition: attachment`).

Konsekuensi yang harus disadari: karena mode baca mengirim isi PDF ke browser,
orang yang ngotot tetap bisa menyimpan berkasnya (mis. lewat menu simpan
peramban). Gerbang kode di sini berfungsi sebagai aturan perpustakaan —
pencatatan siapa mengunduh buku apa — bukan penguncian teknis.

Yang tetap WAJIB beres di production agar **unduhan** berfungsi:

1. `KCI_JWT_SECRET` terisi (tanpa itu tiket tidak bisa diterbitkan).
2. Berkas PDF tersedia: ikut ter-deploy di `public/ebooks/`, atau diunggah ke
   storage privat (lihat PANDUAN-EBOOK-STORAGE.md). Bila keduanya kosong,
   endpoint menjawab 503 dan di layar pembaca muncul "Berkas PDF-nya belum
   tersedia di server".

Langkah lengkapnya ada di bagian "Langkah operasional berikutnya" di bawah.

## Status kode

Implementasi kode sudah selesai dan tervalidasi:

- Membaca bebas (tanpa tiket); unduhan (`?unduh=1`) wajib tiket redemption.
- Tombol **Baca** langsung membuka pembaca PDF; tombol **Unduh** membuka
  gerbang kode akses.
- Production mencoba storage privat lebih dulu, lalu berkas statis hasil build,
  lalu sumber cadangan.
- `/ebooks/*` disajikan sebagai berkas statis dengan cache publik (mode baca);
  proxy `/api/ebook-preview` dipakai pembaca sebagai cadangan dan untuk unduhan.
- Skrip unggah memakai bucket privat `ebooks-private` (opsional).
- Test e-book, backend, build, audit, dan pemeriksaan sintaks sudah lulus.

## Langkah operasional berikutnya

### 1. Siapkan Supabase Storage privat

Gunakan project Supabase production. Bucket yang direkomendasikan:

```text
ebooks-private
```

Pastikan bucket tidak publik. Skrip unggah akan memastikan `public: false` pada
bucket yang dipakai.

### 2. Jalankan upload PDF

Jalankan dari mesin yang memiliki PDF asli di `public/ebooks/`:

```bash
SUPABASE_URL=https://<proyek>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run ebook:unggah
```

Alternatif dengan berkas `.env` lokal:

```text
SUPABASE_URL=https://<proyek>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
KCI_EBOOK_PRIVATE_BUCKET=ebooks-private
```

Jangan commit `.env` dan jangan memasukkan service-role key ke frontend.

### 3. Isi environment variable Vercel

Di Vercel Project Settings → Environment Variables, isi untuk environment yang
dipakai deployment:

```text
SUPABASE_URL=https://<proyek>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
KCI_EBOOK_PRIVATE_BUCKET=ebooks-private
```

`KCI_EBOOK_PRIVATE_BUCKET` boleh dihilangkan jika memakai nama default
`ebooks-private`.

Jika memakai gateway privat non-Supabase, gunakan ini sebagai gantinya:

```text
KCI_EBOOK_PRIVATE_BASE=https://storage-internal.example/ebooks
KCI_EBOOK_PRIVATE_TOKEN=<server-only-token>
```

Jangan gunakan URL bucket publik untuk `KCI_EBOOK_PRIVATE_BASE`.

### 4. Deploy ulang

Setelah environment variable tersimpan, lakukan redeploy Vercel. Jangan menghapus
PDF lokal dari repository sebelum verifikasi production selesai.

### 5. Verifikasi production

Ganti `<domain>` dengan domain production:

```bash
# Mode baca: harus 200 dan menampilkan PDF (inline).
curl -i -o /dev/null -w '%{http_code}\n' "https://<domain>/ebooks/Sicilian%20Defense.pdf"

# Unduhan tanpa tiket: harus 403.
curl -i "https://<domain>/api/ebook-preview?file=Sicilian%20Defense.pdf&unduh=1"
```

Lalu uji dari UI:

- Buka Program Kami → E-Book & Panduan.
- Klik **Baca** — pembaca PDF harus langsung terbuka tanpa kode.
- Klik **Unduh** — gerbang kode akses terbuka.
- Isi data redemption dan kode; unduhan harus berjalan sebagai attachment.
- Pastikan tombol unduh di bilah pembaca memakai tiket yang sudah diterbitkan
  (atau membuka gerbang kode lagi bila tiket sudah kedaluwarsa).

### 6. Periksa sumber publik lama

Jika sebelumnya pernah digunakan bucket publik `ebooks`, URL Supabase publik,
GitHub Media, CDN, atau cache lama:

- cabut akses publik bucket lama;
- hapus atau nonaktifkan URL publik lama;
- bersihkan cache CDN bila diperlukan;
- pastikan hanya bucket privat yang berisi koleksi production.

### 7. Setelah semua lulus

Baru pertimbangkan apakah PDF di `public/ebooks/` perlu dikeluarkan dari
repository. Penghapusan itu adalah perubahan terpisah dan destruktif; lakukan
hanya setelah private storage dan deployment production terbukti berjalan.

## Perintah validasi lokal

```bash
npm run uji:ebook
npm run uji:backend
npm run uji:rute
npm run uji:i18n
npm run build
npm audit --omit=dev --audit-level=moderate
git diff --check
```

## Kondisi saat ini

Pada saat dokumen ini dibuat, credential Supabase dan Vercel belum tersedia di
sandbox. Karena itu upload, pengaturan environment production, dan redeploy
belum dilakukan oleh agent.
