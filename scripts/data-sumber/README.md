# Data Sumber Generator Luring (`scripts/data-sumber/`)

Folder ini berisi indeks dan arsip mentah yang **hanya** dibaca oleh skrip generator luring di `scripts/` dan dikecualikan dari unggahan deployment produksi lewat `.vercelignore`.

## Berkas

1. `puzzle-all.json`
   - Masukan bagi `scripts/buat-teka-teki-video.mjs` (`npm run buat:teka-teki-video`) untuk membangun `public/data/teka-teki-video.json`.
   - Berisi arsip posisi teka-teki harian beserta PGN solusi dan tautan video pembahasan `.mp4` resmi pada domain `media.chesscomfiles.com` / `chesscom-videos.s3.amazonaws.com` yang telah diizinkan pada `CSP media-src`.
   - Dipindahkan dari `public/data/puzzle/all.json` agar arsip mentah berukuran besar tidak ikut disajikan sebagai aset statis publik.

2. `valdemar-komentar-mentah.json`
   - Masukan bagi `scripts/buat-komentator-master.mjs` (`npm run buat:komentator-master`) untuk membangun `public/data/komentator-master.json`.
   - Hanya menyimpan indeks transisi langkah faktual `{ epd, san, ply, freq }` yang diekstrak dari pohon permainan PGN pada repositori `https://github.com/ValdemarOrn/Chess` (`Annotated Games/*.pgn` dan `TestData/HumansVsComputers.pgn`).

## Catatan Sumber & Lisensi Data Komentator

- Repositori `ValdemarOrn/Chess` tidak menyertakan berkas `LICENSE` sumber terbuka di akar repositori (hanya lisensi paket pihak ketiga `NUnit` di `packages/`), dan komentar teks `{ ... }` di dalam berkas PGN-nya menghimpun anotasi prosa pihak ketiga dari berbagai situs/penulis.
- Dalam hukum hak cipta, notasi langkah catur, posisi FEN/EPD, dan frekuensi langkah dalam pohon partai merupakan fakta permainan yang tidak dilindungi hak cipta, sedangkan prosa anotasi pihak ketiga dilindungi hak cipta.
- Oleh karena itu, `valdemar-komentar-mentah.json` **tidak menyimpan salinan teks komentar berbahasa Inggris pihak ketiga**, melainkan hanya indeks posisi-langkah faktual `(epd, san, ply, freq)`. Seluruh kalimat komentar dwibahasa `[id, en]` di `public/data/komentator-master.json` ditulis secara orisinal di repositori ini oleh `scripts/buat-komentator-master.mjs` berdasarkan kurasi pembukaan/tabiya dan verifikasi taktis-posisional `chess.js`.
