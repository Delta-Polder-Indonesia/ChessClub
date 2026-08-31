# Panduan SEO — Agar Situs Muncul di Pencarian Google

Tujuan: ketika seseorang mengetik **"blunder skuad"**, **"komunitas catur
Indonesia"**, **"catur"**, **"turnamen catur"**, atau **"belajar catur"**
di Google, hasil pencarian menampilkan situs kami dengan judul dan
deskripsi yang jelas — bukan cuma link mentah.

## 1. Yang sudah terpasang di situs (`index.html`)

| Elemen | Isi | Kegunaan |
| --- | --- | --- |
| `<title>` | `Beranda \| Komunitas Catur Indonesia` | Judul biru di hasil Google |
| `meta description` | "Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan bertumbuh bagi pecatur…" | Cuplikan abu-abu di bawah judul |
| `meta keywords` | blunder skuad, catur, komunitas catur, turnamen catur, belajar catur, sekolah catur, teka-teki, skakmat, pembukaan, e-book, Stockfish, dll. | Mesin pencari lain & katalog isi |
| `meta robots` | `index, follow` | Izin eksplisit di-crawl Google |
| `link canonical` + `og:url` | `https://chess-club-weld.vercel.app/` | Alamat resmi, hasil tidak terpecah |
| Open Graph + Twitter Card | judul, deskripsi, gambar `landing-hero-828.webp` | Pratinjau saat link dibagikan (WhatsApp, X, Facebook) |
| JSON-LD (Organization + WebSite) | nama, logo, kontak, bahasa | Data terstruktur untuk rich result |
| `robots.txt` + `sitemap.xml` | 30 URL halaman | Peta situs agar Google tahu semua halaman |

Catatan jujur: **Google mengabaikan tag `keywords`** untuk pemeringkatan.
Yang membuat hasil pencarian "terlihat" adalah `<title>` + `meta description`
di atas. Tag keywords tetap dipertahankan untuk mesin pencari lain
(Bing, Yandex) dan dokumentasi isi situs.

Setiap halaman dalam (Tentang Kami, Turnamen, Teka-Teki, dll.) sudah
menggunakan komponen `MetaHalaman` sehingga judul & deskripsinya
berbeda-beda per halaman — bagus untuk ranking kata kunci tiap topik.

## 2. Mendaftarkan situs ke Google (WAJIB — ini langkah yang menentukan)

Meta tag saja tidak cukup; Google harus **tahu dan memverifikasi** situs.
Sekali saja, ikuti langkah ini:

1. Buka **https://search.google.com/search-console** → masuk dengan akun
   Google klub.
2. Klik **Add property** → pilih **URL prefix** → isi
   `https://chess-club-weld.vercel.app` (tanpa slash akhir).
3. Verifikasi dengan metode **HTML tag**: Search Console memberi tag
   `<meta name="google-site-verification" content="…">`. Taruh tag itu di
   bagian `<head>` `index.html` (setelah tag viewport), commit, lalu deploy
   ulang di Vercel. Klik **Verify**.
   (Alternatif: metode **DNS TXT** — tambahkan record TXT di provider
   domain; lebih rapi karena tidak perlu commit ke repo.)
4. Setelah terverifikasi: menu **Sitemaps** → ketik
   `https://chess-club-weld.vercel.app/sitemap.xml` → **Submit**.
5. Menu **URL Inspection** → tempel URL beranda → **Request indexing**.

Setelah itu Google biasanya mulai mengindeks dalam **beberapa hari hingga
2–3 minggu**. Pantau menu **Coverage** di Search Console; jika muncul
peringatan merah, perbaiki sesuai pesannya.

## 3. Tips agar cepat & bagus tampil di Google

- **Konsisten**: jangan ganti-ganti `<title>` beranda; Google
  mempercayai situs yang stabil.
- **Isi konten**: halaman dengan teks asli (sejarah, jadwal, artikel)
  lebih mudah naik daripada halaman yang isinya hanya link.
- **Nama file gambar & teks alt** sudah informatif (dibaca Google Images).
- **Bagikan link** situs di WhatsApp/Grup Chess.com/media sosial — trafik
  eksternal mempercepat crawling.
- Cek hasil dengan mengetik di Google:
  `site:chess-club-weld.vercel.app` → daftar halaman yang sudah terindeks.

## 4. Bila pindah ke domain kustom (mis. `komunitascatur.or.id`)

1. Setel environment variable di Vercel (Settings → Environment
   Variables): `VITE_SITE_URL=https://komunitascatur.or.id` lalu Redeploy.
   (Variabel ini dipakai oleh `vite.config.js` untuk canonical, og:url,
   sitemap, robots.txt, dan JSON-LD. Contoh ada di `.env.contoh`.)
2. Di Search Console, tambah property domain baru + verifikasi,
   submit sitemap-nya.
3. (Opsional) buat redirect 301 dari domain lama di Vercel.

## 5. Cek cepat hasil pencarian (setelah terindeks)

Hasil Google akan tampil kira-kira:

```
Beranda | Komunitas Catur Indonesia
chess-club-weld.vercel.app
Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan
bertumbuh bagi pecatur. Ikuti jadwal turnamen, peringkat anggota, kelas
pelatihan, dan kabar komunitas terbaru.
```

Catatan: ejaan resmi nama klub adalah **"Blunder Skuad"** (bukan
"Blunder Sekuad"), sesuai klub Chess.com `chess.com/club/blunder-skuad`.
