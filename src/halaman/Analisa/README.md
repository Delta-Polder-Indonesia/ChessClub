# Halaman Analisis Partai (`/program-kami/analisa`)

Alat analisis partai berbasis web: tempel PGN, ambil daftar partai dari
Chess.com/Lichess lewat nama pengguna, atau mulai dari satu posisi FEN. Setiap
langkah diberi label (brilian, terbaik, layak, keliru, blunder, …), disertai
langkah saran, grafik evaluasi, ringkasan akurasi, dan papan latihan.

Tampilannya dipindah dari **[Brilliant-Chess](https://github.com/wdeloo/Brilliant-Chess)**
(MIT, © 2025 Delo). **Bagian engine-nya tidak ikut dipindah** — itu bagian yang
diketahui bermasalah, dan di proyek ini diganti dengan engine milik ChessClub
sendiri. Dokumen ini mencatat batas keduanya supaya tidak kabur saat sunting
berikutnya.

## Yang dipindah, yang ditukar

| Bagian | Status | Berkas |
| --- | --- | --- |
| Papan, bidak, panah, sorot, animasi | port | `komponen/game/board.jsx` |
| Tata letak papan + panel + menu | port (disesuaikan) | `komponen/game/game.jsx`, `komponen/menu/**` |
| Penilaian langkah, komentar, akurasi, sacrifice/forced | port | `mesin/penilaian.js` |
| Ringkasan (grafik, fase, rating pemain) | port | `komponen/menu/analysis/summary/**` |
| Pengambilan partai Chess.com/Lichess | port + teks kamus | `komponen/menu/analyze/select*.jsx` |
| **Worker Stockfish, `hardwareConcurrency`, `public/engine/*`** | **dibuang** | — |
| **Komunikasi UCI** | **engine ChessClub** | `mesin/engine.js` → `src/lib/engineCatur.js` |
| Suara papan (berkas `.mp3` Lichess, AGPL) | diganti sintesis Web Audio | `komponen/suaraPapan.js` |
| `howler` | tidak dipakai lagi | — |

`mesin/engine.js` mempertahankan bentuk fungsi upstream (`parsePGN`,
`parseMove`, `parsePosition`, `formatSquare`, `moveToSan`, `COMMENTS`, …) agar
komponen UI tidak perlu ditulis ulang; yang berubah hanya cara engine bicara:
satu instance `EngineAnalisis` (bungkus `EngineCatur`) dipakai bersama seluruh
halaman, diarahkan `position fen …` lalu `go depth …`, dan dibaca lewat
`infoTerakhir`/bestmove yang dijanjikan `EngineCatur`. Build engine diambil dari
`public/engines/` milik situs ini — default `stockfish-18-lite-single`.

## Konvensi penting

- **Skor engine** (`staticEval`) selalu sudut pandang putih relatif terhadap
  pihak yang bergilir sesuai UCI; `mesin/penilaian.js` yang mengubahnya jadi
  label. Jangan menormalkannya ulang di UI.
- **Komentar langkah tidak dibekukan sebagai teks.** `penilaian.js` menyimpan
  `commentKey` + `commentIndex`; teksnya diambil dari kamus saat render, jadi
  bahasa bisa diganti tanpa menganalisis ulang.
- **Buku pembukaan** memakai tabel internal `public/data/buku-analisa.json`
  (kunci = 4 kolom pertama FEN, lihat `mesin/kunciFen.js`), dibuat oleh
  `scripts/generasi-buku-analisa.mjs` dari `public/data/buku-pembukaan.json`.
  Tabel FEN penuh milik upstream tidak cocok karena ikut memuat jam/halfmove
  sehingga tidak pernah kena.
- **Kedalaman analisis**: 10/13/16/20, bawaan 13. Build engine situs ini
  single-thread, jadi angka upstream (15/18/21) terlalu lambat.
- **Kunci penyimpanan lokal** selalu berawalan `kci-analisa-*`
  (`boardTheme`, `usedRatings`, `depth`, `engine`, `chesscom`, `lichessorg`).
- **Ukuran papan** dihitung dari `wadahRef` milik halaman (`Analisa.jsx`), bukan
  `window.innerHeight`; halaman menetapkan tingginya sendiri sebesar sisa layar
  di bawah header situs, dan `Game` mengukur wadah itu lewat `ResizeObserver`.
- **Tema warna** dideklarasikan di `analisa.css` (variabel `--analisa-*` di
  dalam `.analisa-root`) dan dipetakan ke utilitas Tailwind lewat
  `@theme inline` di `src/index.css`. Jangan memindahkannya ke `:root` —
  seluruh situs akan ikut gelap.

## Aset & lisensi

- Ikon/svg bidak & papan: karya **Cburnett**, lisensi **CC BY-SA 3.0**
  (dipakai lewat `public/images/analisa/` dan `komponen/svg/`).
- Data pembukaan: olahan **lichess-org/chess-openings** (CC0) yang sudah ada di
  repositori ini.
- Engine: **Stockfish** (GPL-3.0) dalam distribusi `nmrugg/stockfish.js`;
  berkasnya sudah ada di `public/engines/` dan tidak disalin dari proyek hulu.
- Kode UI yang dipindah: **MIT © 2025 Delo** — header
  `/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */`
  menandai berkas hasil port. Ringkasan teks atribusi juga ditampilkan di panel
  pengaturan (`komponen/atribusi.jsx`).
- Berkas suara `.mp3` Lichess (AGPL-3.0) sengaja **tidak** disalin; suara papan
  sekarang disintesis (`komponen/suaraPapan.js`).

## Pengaturan & keterbatasan yang diketahui

- Analisis sepenuhnya berjalan di peramban; tidak ada partai yang dikirim ke
  server kami. Nama pemain dari PGN hanya dipakai untuk menampilkan teks
  pembuka (di-escape lebih dulu).
- Daftar partai Chess.com diambil langsung dari `api.chess.com` dan bisa
  diblokir kebijakan CORS/privasi peramban — karena itu ada peringatan
  "mungkin dibatasi" di bawah tabel, persis seperti upstream.
- Engine pertama kali diunduh saat diperlukan (7 MB, sekali, lalu dicache);
  saat mesin belum siap, statusnya terlihat di panel muat dan di pengaturan.

## Periksa sendiri

```bash
node scripts/uji-analisa.mjs        # 22 pemeriksaan kontrak engine + penilaian
node scripts/uji-analisa-ui.mjs     # render halaman di jsdom + engine UCI palsu
npm run uji:i18n                    # kunci analisa.* harus ada di ID dan EN
node scripts/generasi-buku-analisa.mjs   # bangun ulang tabel buku pembukaan
```
