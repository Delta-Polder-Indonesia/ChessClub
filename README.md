# Komunitas Catur Indonesia — Website "Tentang Kami"

Website komunitas catur (klub Chess.com) yang dibangun dengan **Vite + React + Tailwind CSS v4**.
Struktur halaman, markup (nama class), tipografi, warna, dan perilaku (header, sticky menu, carousel,
footer) dibuat **meniru halaman "Tentang Kami" PT Pertamina** di `https://www.pertamina.com/id/tentang-kami`.

## Menjalankan

```bash
npm install
npm run dev      # development server
npm run build    # build produksi ke /dist
npm run preview  # pratinjau hasil build
```

## Struktur Halaman (identik dengan Pertamina)

| Blok Pertamina                 | Blok di website ini              |
| ------------------------------ | -------------------------------- |
| Header + top bar + dropdown    | `src/components/Header.jsx`      |
| Hero (breadcrumb, H1, deskripsi) | `src/components/Hero.jsx`      |
| Sticky submenu (scroll-spy)    | `src/components/StickyMenu.jsx`  |
| Sekilas Pertamina              | `src/components/Sekilas.jsx`     |
| Tonggak Sejarah (Swiper)       | `src/components/Tonggak.jsx`     |
| Visi, Misi, & Tata Nilai       | `src/components/VisiMisi.jsx`    |
| Makna Logo                     | `src/components/MaknaLogo.jsx`   |
| Struktur Grup Catur            | `src/halaman/TentangKami/StrukturGrupCatur/` |
| Navigasi "Selanjutnya"         | `src/components/PageBagian.jsx` (`PageSelanjutnya`) |
| Footer (kolom + sosial media)  | `src/components/Footer.jsx`      |

## Desain

- Font: **Plus Jakarta Sans** (self-hosted, tanpa Google Fonts), body 16px/24px
- Warna primary biru `#0B2F9F`, hero `#021624`, teks artikel `#374151`, footer `#F8FAFC`
- Judul H2 30px semibold, H1 hero putih 38px bold — nilai diambil langsung dari computed style situs Pertamina
- Tanpa emoji, tanpa efek animasi yang tidak perlu (hanya transisi hover halus dan progress bar carousel yang meniru aslinya)
- Foto-foto bertema catur di-generate khusus di `public/images/` (WebP, srcset 828/1280)

## Performa (PageSpeed)

Situs dioptimasi agar Lighthouse mobile/desktop menuju 100 pada keempat kategori:

- Font Plus Jakarta Sans di-host sendiri (tanpa `fonts.googleapis.com`)
- Foto dikompresi WebP + `srcset`; logo 14 KiB (sebelumnya ~100 KiB)
- Gambar LCP (`hero-about`) di-preload dan dilukis dari HTML awal (`#boot-hero`)
- CSS di-inline; setiap rute publik punya `index.html` agar GitHub Pages mengembalikan HTTP 200
- `BrowserRouter` memakai `basename` `/ChessClub/` supaya homepage tidak jatuh ke 404

Setelah merge ke `main`, GitHub Actions akan men-deploy. Ulangi tes di [PageSpeed Insights](https://pagespeed.web.dev/).

## Backend (keanggotaan, verifikasi, turnamen)

Situs terdiri dari **dua bagian**: frontend statis (repo ini) dan backend
Node tanpa dependensi di `server/` (`node server/src/index.js`). Backend
menyediakan API `/api/*` untuk anggota, verifikasi Chess.com, turnamen,
konten, dan pesan — detail lengkap ada di `server/README.md` dan
`PANDUAN-DEPLOY.md`. Saat frontend di-deploy ke GitHub Pages (tanpa proxy),
backend harus dicapai langsung lewat `VITE_API_DASAR` — sudah diatur
otomatis oleh workflow deploy.

## Fitur

- **Menu tab di atas selalu terlihat**: header menempel (sticky) di atas — transparan di atas hero, berubah putih dengan teks gelap saat halaman di-scroll (seperti situs Pertamina). Terdapat 5 tab menu utama: Tentang Kami, Program Kami, Turnamen, Media & Informasi, Keberlanjutan. Keanggotaan hanya tampil sebagai tab di dalam Struktur Grup Catur pada menu Tentang Kami.
- **Daftar anggota otomatis dari Chess.com**: backend mengambil roster publik [BLUNDER SKUAD](https://www.chess.com/club/blunder-skuad), menyatukan kelompok aktivitasnya, lalu memperkaya profil dan rating pemain. Roster Chess.com sendiri diperbarui maksimal tiap 12 jam.
- Dropdown menu hover + drawer menu mobile
- Overlay pencarian (mirip halaman pencarian Pertamina) dengan hasil dari daftar halaman
- Sticky submenu dengan scroll-spy (IntersectionObserver) + smooth scroll, menempel tepat di bawah header
- Carousel Tonggak Sejarah: autoplay 7 detik, progress bar per slide, navigasi label tahun yang bisa diklik
- Footer dengan kolom akordeon di mobile + ikon media sosial
- Responsif penuh (desktop, tablet, mobile)
