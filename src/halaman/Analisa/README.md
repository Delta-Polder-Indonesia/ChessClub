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
| Bilah navigasi kiri (logo, Pengaturan, Source Code, Atribusi) | port | `komponen/nav/nav.jsx` |
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

Bilah navigasi kiri (`komponen/nav/nav.jsx`) adalah port `nav.tsx` upstream:
logo + wordmark di atas, tombol Pengaturan yang membuka dropdown tema/panah/
rating di sisi kanan bilah, dan tautan Source Code + Atribusi yang menunjuk ke
repo upstream (sekalian atribusi MIT). Panel pengaturan versi lama
(`PanelSamping.jsx`) sudah dihapus sejak Nav ini dipasang — tombol gear di
BoardMenu tetap membuka dropdown yang sama lewat `boardMenuSettingsRef`.
Dua kelas disesuaikan dari upstream (`navTop:h-screen`→`navTop:h-full`,
`w-screen`→`w-full`) karena di sini bilah tinggal di dalam area kerja yang
diukur, bukan menempel ke `body`.

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
  (`boardTheme`, `usedRatings`, `kedalaman`, `engine`, `format`, `chesscom`,
  `lichessorg`). Aksesnya WAJIB lewat `penyimpanan.js` — `localStorage`
  melempar (bukan sekadar mengembalikan null) di mode penyamaran Safari dan
  saat cookie diblokir, dan pemanggilan langsung di dalam komponen pernah
  merobohkan seluruh halaman. Awalannya ditambahkan oleh helper, jadi kode
  pemanggil hanya menyebut nama pendeknya (`tulis("kedalaman", 13)`).
- **Kegagalan engine bukan pembatalan.** `mesin/engine.js` melempar
  `GALAT_MESIN` bila worker mati di tengah analisis; hanya `AbortSignal`
  pengguna yang boleh ditelan sebagai `GALAT_BATAL`. Menelan keduanya membuat
  halaman kembali ke formulir tanpa pesan apa pun — persis seperti tombol
  yang tidak berfungsi.
- **Setiap jalur keluar `analyzeMove` harus melepas `analyzingMove`** (pakai
  `finally`). Bendera itu mengunci papan dan seluruh tombol navigasi; bila
  tertinggal `true`, satu-satunya jalan keluar bagi pengguna adalah memuat
  ulang halaman.
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
  diblokir kebijakan CORS/privasi peramban — kalau itu terjadi muncul
  peringatan galat di panel pemilih.
- Bilah kiri (`komponen/nav/nav.jsx`) kini punya tombol **Akun** dan
  **Impor permainan** ala en-croissant, masing-masing membuka popup
  (`komponen/nav/Popup.jsx`, `popupAkun.jsx`, `popupImpor.jsx`). Popup
  Akun = pilih situs (Chess.com/Lichess) + nama pengguna → langsung muat
  seluruh partai. Popup Impor = PGN / Online / FEN; Online menerima tautan
  partai: Lichess lewat `lichess.org/game/export/{id}`, Chess.com lewat
  callback publik yang moveList-nya berformat TCN (diterjemahkan ke SAN
  memakai chess.js). Karena popup ini memicu konteks data, `AnalyzeContextProvider`
  kini membungkus seluruh `.analisa-root` (termasuk Nav) dan state "akun"
  dipindah dari Menu ke konteks (`akun`). CSP harus mengizinkan
  `https://www.chess.com` selain `https://api.chess.com`.

- Form sumber partai (`komponen/menu/analyze/form.jsx`) mengikuti gaya
  "Import game"/"Add account" en-croissant: kartu pilihan **Akun / PGN /
  FEN** dengan tepi aksen; akun memakai kartu logo Chess.com & Lichess
  plus nama pengguna dengan saran riwayat (localStorage `kci-analisa-
  riwayat-*`); FEN divalidasi inline sebelum dikirim. Kedalaman analisis
  tetap ada di bawah dan dipakai panel Pengaturan.

- Pemilih Chess.com TIDAK membuka bulan satu per satu: semua arsip bulan
  diambil otomatis (antrean 4 permintaan + progres + batal) lalu disajikan
  sebagai satu tabel terperinci yang bisa dicari, diurutkan (Pemain, Hasil,
  Tanggal, Langkah), dan dihalaman 100 baris. Klik baris untuk langsung
  menganalisis PGN-nya — sama seperti sebelumnya. Pemilih Lichess tetap
  per bulan dan memakai komponen tabel yang sama.
- **CSP wajib mengizinkan kedua platform.** `connect-src` di `index.html`
  DAN `vercel.json` harus memuat `https://api.chess.com` serta
  `https://lichess.org`. Keduanya harus diubah bersamaan: yang di `<meta>`
  dipakai host statis, yang di `vercel.json` dikirim sebagai header dan
  menang di produksi. Sempat hanya Chess.com yang terdaftar, sehingga fitur
  Lichess selalu gagal di produksi walau berjalan normal di `npm run dev`.
- Engine pertama kali diunduh saat diperlukan (7 MB, sekali, lalu dicache);
  saat mesin belum siap, statusnya terlihat di panel muat dan di pengaturan.

## Periksa sendiri

`jsdom` + `esbuild` sekarang ada di `devDependencies`. Sebelumnya tidak, dan
`uji-analisa-ui.mjs` melewatkan dirinya sendiri (keluar 0) di mesin yang belum
memasangnya — sehingga uji UI tampak "lulus" padahal tidak pernah berjalan.

```bash
node scripts/uji-analisa.mjs        # kontrak engine + penilaian + ketahanan worker
node scripts/uji-analisa-ui.mjs     # render halaman di jsdom + engine UCI palsu
npm run uji:i18n                    # kunci analisa.* harus ada di ID dan EN
node scripts/generasi-buku-analisa.mjs   # bangun ulang tabel buku pembukaan
```
