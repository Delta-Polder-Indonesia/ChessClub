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
| Open Graph + Twitter Card | judul, deskripsi, gambar `landing-hero-828.webp` | Pratinjau saat link dibagikan (WhatsApp, X, Facebook) |
| JSON-LD (Organization + WebSite) | nama, logo, kontak, bahasa | Data terstruktur untuk rich result |
| `robots.txt` + `sitemap.xml` | 31 URL halaman | Peta situs agar Google tahu semua halaman |

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
3. **Verifikasi kepemilikan — kedua token sudah terpasang di repo:**

   | Metode | Yang dipasang | Di mana Google mencarinya |
   | --- | --- | --- |
   | **HTML tag** | `<meta name="google-site-verification" content="bWdpNEop…ULP0">` di `<head>` `index.html` (setelah tag viewport) | Halaman beranda situs. Karena `plugins/performa.js` menyalin `index.html` ke `404.html` dan ke setiap rute, tag ini ada di 62 berkas HTML hasil build |
   | **Upload berkas HTML** | `public/google800ae0ab9c9d6db7.html` berisi satu baris `google-site-verification: google800ae0ab9c9d6db7.html` | URL `…/google800ae0ab9c9d6db7.html` persis seperti yang ditulis wizard. Isi & nama berkas **tidak boleh diubah** (Google menolak bila berbeda); hanya newline di akhir yang diizinkan |

   Catatan per host, karena keduanya memasang situs di path berbeda:

   - **Vercel** (`https://chess-club-weld.vercel.app`, `VITE_BASE_PUBLIC=/`):
     berkas ada di akar domain → cocok untuk metode upload berkas. Rewrite
     SPA `"/((?!api/).*)"` di `vercel.json` tidak menimpanya, karena Vercel
     memeriksa berkas statis lebih dulu sebelum menerapkan rewrite.
   - **GitHub Pages** (`https://delta-polder-indonesia.github.io/ChessClub/`):
     berkas ikut ter-deploy, tapi berada di `…/ChessClub/google800ae0ab9c9d6db7.html`,
     yaitu path prefix — bukan akar `github.io`. Pakai metode **HTML tag**
     untuk property ini (atau daftarkan property dengan URL prefix
     `https://delta-polder-indonesia.github.io/ChessClub/` agar alamat
     berkasnya cocok dengan yang diminta wizard).

   Bila kelak ada property lain (mis. domain kustom) dengan token berbeda,
   **tambahkan** satu baris `<meta>` lagi — jangan menimpa token yang ada.
   (Alternatif lain: metode **DNS TXT** di provider domain, lebih rapi
   karena tidak perlu commit ke repo.)
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
   node -e 'import("./plugins/performa.js").then(({RUTE_PUBLIK})=>{const fs=require("fs");const sm=fs.readFileSync("public/sitemap.xml","utf8");const locs=[...sm.matchAll(/<loc>%%SITE_URL%%([^<]*)<\/loc>/g)].map(m=>"/"+m[1]).filter(p=>p!=="/");const r=RUTE_PUBLIK.slice().sort(),l=locs.slice().sort();console.log("rute:",r.length,"sitemap:",l.length);console.log("kurang di sitemap:",r.filter(x=>!l.includes(x)));console.log("lebih di sitemap:",l.filter(x=>!r.includes(x)));})'
   ```

   Output yang benar: `rute: 30 sitemap: 30` dan kedua daftar kosong.

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
Blunder Skuad | Komunitas Catur Indonesia
chess-club-weld.vercel.app
Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan
bertumbuh bagi pecatur. Ikuti jadwal turnamen, peringkat anggota, kelas
pelatihan, dan kabar komunitas terbaru.
```

Catatan: ejaan resmi nama klub adalah **"Blunder Skuad"** (bukan
"Blunder Sekuad"), sesuai klub Chess.com `chess.com/club/blunder-skuad`.
