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
| `meta google-site-verification` | `bWdpNEop…ULP0` | Bukti kepemilikan (metode **HTML tag**) untuk Google Search Console |
| `google800ae0ab9c9d6db7.html` | `google-site-verification: google800ae0ab9c9d6db7.html` | Bukti kepemilikan (metode **upload berkas HTML**) untuk Google Search Console |
| `link canonical` + `og:url` | `https://chess-club-weld.vercel.app/` | Alamat resmi, hasil tidak terpecah |
| Open Graph + Twitter Card | judul, deskripsi, gambar `landing-hero.webp` | Pratinjau saat link dibagikan (WhatsApp, X, Facebook) |
| JSON-LD (Organization + WebSite) | nama, logo, kontak, bahasa | Data terstruktur untuk rich result |
| JSON-LD BreadcrumbList (halaman dalam) | hierarki nama + URL tiap remah | Breadcrumb di hasil Google |
| `robots.txt` + `sitemap.xml` | 34 URL halaman, tiap entri berisi `<lastmod>` | Peta situs agar Google tahu semua halaman |

Catatan jujur: **Google mengabaikan tag `keywords`** untuk pemeringkatan.
Yang membuat hasil pencarian "terlihat" adalah `<title>` + `meta description`
di atas. Tag keywords tetap dipertahankan untuk mesin pencari lain
(Bing, Yandex) dan dokumentasi isi situs.

Setiap halaman dalam (Tentang Kami, Turnamen, Teka-Teki, dll.) memakai
`MetaHalaman` sehingga judul & deskripsinya berbeda-beda per halaman — bagus
untuk ranking kata kunci tiap topik. `MetaHalaman` baru bekerja **setelah
JavaScript dijalankan**. Google membaca HTML mentahnya lebih dulu, jadi tabel
`META_RUTE` di `plugins/performa.js` menulis judul, deskripsi, kanonikal, dan
tag Open Graph yang sama ke dalam HTML setiap rute. Menambah halaman baru =
menambah satu entri di `META_RUTE`; kalau lupa, `npm run uji:seo` gagal.

Halaman dalam juga memasang JSON-LD `BreadcrumbList` lewat komponen
`BreadcrumbJsonLd`. Properti `item` setiap remah WAJIB URL absolut
(http/https) — Google memperlakukannya sebagai `@id`, dan URL relatif seperti
`"/"` atau `"/program-kami"` memicu laporan Search Console "URL di kolom 'id'
tidak valid". Selalu buat remah dari path relatif (mis. `to: "/program-kami"`)
; komponen mengabsahkannya lewat helper `urlAbsolut` di `src/lib/urlSitus.js`.
Aturan ini dikunci oleh `scripts/uji-jsonld.mjs` (ikut dalam `npm run
uji:seo`).

## 2. Mendaftarkan situs ke Google (WAJIB — ini langkah yang menentukan)

Meta tag saja tidak cukup; Google harus **tahu dan memverifikasi** situs.
Sekali saja, ikuti langkah ini:

1. Buka **https://search.google.com/search-console** → masuk dengan akun
   Google klub.
2. Klik **Add property** → pilih **URL prefix** → isi
   `https://chess-club-weld.vercel.app` (tanpa slash akhir).
3. **Verifikasi kepemilikan — kedua token sudah terpasang di repo:**

   | Metode | Yang dipasang | Di mana Google mencarinya |
   | --- | --- | --- |
   | **HTML tag** | `<meta name="google-site-verification" content="bWdpNEop…ULP0">` di `<head>` `index.html` (setelah tag viewport) | Halaman beranda situs. Karena `plugins/performa.js` menyalin `index.html` ke `404.html` dan ke dua salinan setiap rute (`<rute>.html` dan `<rute>/index.html`), tag ini ada di 70 berkas HTML hasil build |
   | **Upload berkas HTML** | `public/google800ae0ab9c9d6db7.html` berisi satu baris `google-site-verification: google800ae0ab9c9d6db7.html` | URL `…/google800ae0ab9c9d6db7.html` persis seperti yang ditulis wizard. Isi & nama berkas **tidak boleh diubah** (Google menolak bila berbeda); hanya newline di akhir yang diizinkan |

   Deployment production resmi adalah **Vercel** (`https://chess-club-weld.vercel.app`,
   `VITE_BASE_PUBLIC=/`). Berkas verifikasi berada di akar domain dan rewrite
   SPA `"/((?!api/).*)"` tidak menimpanya karena Vercel memeriksa berkas statis
   lebih dulu.

   Bila kelak memakai domain kustom dengan token berbeda, **tambahkan** satu
   baris `<meta>` lagi — jangan menimpa token yang ada. Alternatif lain adalah
   metode **DNS TXT** di provider domain.
4. Setelah terverifikasi: menu **Sitemaps** → ketik
   `https://chess-club-weld.vercel.app/sitemap.xml` → **Submit**.
   Lihat penjelasan lengkap di bagian 2a.
5. Menu **URL Inspection** → tempel URL beranda → **Request indexing**.

## 2a. Apa maksud "menu Sitemaps → submit sitemap.xml"

**Sitemap** = berkas XML berisi daftar URL situs (`public/sitemap.xml`,
di-build ke `dist/sitemap.xml` dengan `%%SITE_URL%%` diganti alamat situs
oleh plugin `inject-site-url` di `vite.config.js`). Isinya 31 URL publik —
beranda + 30 rute di `RUTE_PUBLIK`.

**"Submit" di Search Console** berarti memberi tahu Google: "ini daftar
halaman saya, silakan di-crawl." Tanpa langkah ini Google tetap bisa
menemukan situs lewat tautan, tetapi lebih lambat dan bisa melewatkan
halaman yang tidak banyak ditautkan.

Langkahnya:

1. Search Console → pilih property → menu **Sitemaps** (kolom kiri, di
   bawah "Indexing").
2. Pada kolom **Add a new sitemap**, isi **path akhirnya saja**:
   `sitemap.xml` — bukan URL penuh. Kolom depannya sudah terisi alamat
   property (`https://chess-club-weld.vercel.app/`), sehingga hasil
   akhirnya `https://chess-club-weld.vercel.app/sitemap.xml`.
3. Klik **Submit**. Statusnya harus berubah jadi **Success** dengan kolom
   "Discovered pages" terisi (mis. `31/31`).
4. Bila statusnya **Couldn't fetch**: buka URL-nya di tab incognito.
   Penyebab umum di repo ini: `sitemap.xml` belum ikut ter-deploy, atau
   `robots.txt` memblokir. Keduanya sudah benar di repo — `robots.txt`
   berisi `Allow: /` dan sudah menunjuk ke `sitemap.xml` lewat direktif
   `Sitemap:`, jadi Google juga menemukannya sendiri saat crawling.
5. Cek ulang tiap kali menambah halaman baru: tambahkan URL-nya di
   `public/sitemap.xml` **dan** di `RUTE_PUBLIK` (`plugins/performa.js`).
   Skrip cek cepat agar keduanya tidak melenceng:

   ```bash
   npm run uji:seo
   ```

   Uji itu memeriksa sitemap ↔ `RUTE_PUBLIK` ↔ `META_RUTE`, `<lastmod>`,
   `robots.txt`, dan kedua metode verifikasi Search Console sekaligus.
   Output yang benar: `OK — 39 rute publik punya metadata sendiri, 40 URL
   sitemap selaras, robots.txt & verifikasi Search Console utuh.`
   Rute bertanda `noindex` memang tidak boleh muncul di sitemap — dan
   sebaliknya, setiap rute `index, follow` **wajib** ada di sitemap. Saat ini
   seluruh rute publik sudah `index, follow`; satu-satunya halaman `noindex`
   adalah halaman 404 (`src/halaman/TidakDitemukan.jsx`) yang memang tidak
   pernah masuk daftar rute publik.
   `/program-kami/analisa/papan` **dipromosikan menjadi `index, follow`**
   (papan analisa adalah fitur publik yang berdiri sendiri), jadi entrinya
   kini ada di `public/sitemap.xml` dan metadata rutenya di
   `plugins/performa.js` harus tetap sejalan.

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
   (Variabel ini dipakai `vite.config.js` untuk canonical, og:url, og:image,
   sitemap, robots.txt, dan llms.txt — canonical/og di `index.html` ditulis
   ulang saat build oleh `metadataRute`. Contoh ada di `.env.contoh`.)
   Yang masih alamat absolut di `index.html`: blok JSON-LD `Organization` dan
   `WebSite` — ganti manual bila pindah domain.
2. Di Search Console, tambah property domain baru + verifikasi,
   submit sitemap-nya.
3. (Opsional) buat redirect 301 dari domain lama di Vercel.

## 5. Cek cepat hasil pencarian (setelah terindeks)

Hasil Google akan tampil kira-kira:

```
Blunder Skuad | Komunitas Catur Indonesia
chess-club-weld.vercel.app
Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan
bertumbuh bagi pecatur. Ikuti jadwal turnamen, peringkat anggota, kelas
pelatihan, dan kabar komunitas terbaru.
```

Catatan: ejaan resmi nama klub adalah **"Blunder Skuad"** (bukan
"Blunder Sekuad"), sesuai klub Chess.com `chess.com/club/blunder-skuad`.

## 6. Bila Search Console melaporkan "tidak terindeks"

Diagnosis 10 September 2026, sebelum perbaikan: `site:chess-club-weld.vercel.app`
menghasilkan **0 halaman**, padahal `robots.txt`, `sitemap.xml`, `meta robots`,
dan kedua metode verifikasi sudah benar di production. Penyebabnya bukan
blokir-memblokir, tapi HTML yang dikirim:

| Gejala di Search Console | Penyebab di repo | Yang diubah |
| --- | --- | --- |
| "Duplikat — kanonikal tidak dipilih pengguna", "Dirayapi - saat ini tidak diindeks" | `plugins/performa.js` hanya menukar metadata untuk 2 rute (`/program-kami/analisa*`). 32 rute lainnya menyalin `<title>`, deskripsi, dan `rel=canonical` beranda → 34 URL sitemap dibaca Google sebagai satu halaman | tabel `META_RUTE` kini berisi semua rute (+ beranda); `metadataRute()` menulis judul, deskripsi, kanonikal, `og:*`, `twitter:*`, dan `robots` ke setiap berkas HTML hasil build |
| "Terdeteksi - saat ini tidak diindeks" | `<body>` hanya berisi `<div id="root">`; seluruh isi muncul setelah React render | belum diubah. Langkah berikutnya: praserender isi halaman ke HTML (`react-dom/server`) — perubahan build, perlu persetujuan |
| Soft 404: URL tak dikenal dibalas 200 | rewrite SPA `"/((?!api/).*)"` → `/index.html`; `404.html` tidak dipakai Vercel | halaman 404 sekarang `noindex, follow`. Status 404 asli butuh Vercel Middleware (`middleware.js`) — belum dipasang karena tidak bisa diverifikasi tanpa deployment |
| Sitemap tanpa tanggal perubahan | tidak ada `<lastmod>` | setiap `<url>` berisi `<lastmod>%%LASTMOD%%</lastmod>`; `vite.config.js` mengisinya dengan tanggal commit terakhir yang menyentuh `src/`, `public/`, `index.html` (fallback: tanggal build) |
| Judul halaman tidak konsisten (`\| Blunder Skuad` vs `\| Komunitas Catur Indonesia`) | `MetaHalaman` dan `CorporatePage` memakai akhiran berbeda | tidak disatuhkan (mengubah copy situs). `META_RUTE` mengikuti akhiran yang sama dengan yang dipasang runtime agar HTML mentah dan hasil render tidak bertentangan |

### Cek hasil perbaikan tanpa Search Console

```bash
# 1. Kanonikal tiap rute harus alamat rute itu sendiri, bukan "/"
curl -s https://chess-club-weld.vercel.app/tentang-kami | grep -o '<link rel="canonical"[^>]*>'

# 2. ETag rute tidak boleh sama dengan ETag beranda — sama berarti HTML identik
curl -sI https://chess-club-weld.vercel.app/tentang-kami | grep -i etag
curl -sI https://chess-club-weld.vercel.app/ | grep -i etag

# 3. Kunci aturan di atas agar tidak melenceng lagi
npm run uji:seo
```

Sebelum perbaikan, `/tentang-kami` dan `/` berbagi ETag yang sama
(`e4dade6…`); hanya `/program-kami/analisa` yang berbeda (`8ed110d…`).
Setelah deploy, seluruh rute harus berbeda dari beranda.

Lalu di Search Console: **URL Inspection** → *Request indexing* untuk beranda
dan 5 halaman utama, pantau **Pages → Alasan** beberapa hari berikutnya.
"Dirayapi - saat ini tidak diindeks" untuk halaman tipis (Galeri, Atribusi)
itu normal dan tidak perlu dipaksakan.

Batas yang jujur: `*.vercel.app` adalah host bersama, dan Google memberikan
jadwal crawl lebih rendah di sana. Peringkat yang stabil praktis baru tercapai
setelah domain kustom (bagian 4).
