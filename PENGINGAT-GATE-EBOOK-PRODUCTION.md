# Pengingat Gate E-Book Production

Dokumen ini adalah checklist lanjutan setelah implementasi gate e-book.
Credential tidak boleh ditulis di file ini atau dikirim lewat chat.

## Status kode

Implementasi kode sudah selesai dan tervalidasi:

- Preview dan unduhan PDF wajib memakai tiket redemption.
- Tombol **Baca** melakukan redemption sebelum membuka pembaca PDF.
- Production hanya membaca storage privat.
- Production tidak memakai `public/ebooks`, GitHub Media, atau `EBOOK_BASE` sebagai fallback.
- Akses langsung `/ebooks/*` diblokir di Vite dan dirutekan ke proxy di Vercel.
- Skrip unggah memakai bucket privat `ebooks-private`.
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
curl -i "https://<domain>/ebooks/Sicilian%20Defense.pdf"
```

Hasil yang diharapkan tanpa tiket:

```text
HTTP 403
```

Lalu uji dari UI:

- Buka Program Kami → E-Book & Panduan.
- Klik **Baca**.
- Isi data dan kode akses.
- Pastikan modal redemption selesai sebelum pembaca PDF terbuka.
- Pastikan PDF tampil melalui proxy same-origin.
- Klik **Unduh** dan pastikan respons berupa attachment.
- Pastikan tombol unduh dari pembaca memakai tiket yang sudah diterbitkan.

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
