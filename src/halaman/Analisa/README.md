# Halaman Analisis Partai (`/program-kami/analisa`)

> **STATUS: DIBEKUKAN (v1) sejak 2026-09-10** — lihat bagian
> [Bekukan fitur Analisa v1](#bekukan-fitur-analisa-v1-2026-09-10) di bawah
> sebelum mengubah halaman ini.

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
| Suara papan (berkas `.mp3` Lichess, AGPL) | diganti MP3 `public/SoundChess` | `komponen/suaraPapan.js` → `src/lib/suara.js` |
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

Tata letak tombol burger (bilah menciut) mengikuti blok sidebar contoh di
`src/components/ui/sidebar.jsx`, tanpa memindahkan bilah ini ke komponen itu:
lajur menciut 3rem (`w-12`) dengan bantalan 8px, setiap tombol — termasuk
burger — menjadi kotak 2rem (`w-8 h-8`) yang bantalannya tetap 8px, sehingga
ikon duduk tepat di tengah lajur dan tidak bergeser saat bilah dibuka/ditutup.
Yang menyusut hanya lebar tombol, gap, label menu, dan wordmark `BlunderSkuad`
(keduanya max-width + opacity); `title`/`aria-label` tetap jadi pengganti
tooltip saat label hilang.

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
- Berkas suara `.mp3` Lichess (AGPL-3.0) sengaja **tidak** disalin. Suara papan
  memakai set MP3 di `public/SoundChess/standard/` (asal: set suara Chess.com,
  hak cipta pemiliknya) lewat modul bersama `src/lib/suara.js`;
  `komponen/suaraPapan.js` kini hanya pembungkus tipis ber-API mirip Howl.
  Atribusinya tampil di halaman Atribusi.

## Pengaturan & keterbatasan yang diketahui

- Analisis sepenuhnya berjalan di peramban; tidak ada partai yang dikirim ke
  server kami. Nama pemain dari PGN hanya dipakai untuk menampilkan teks
  pembuka (di-escape lebih dulu).
- Daftar partai Chess.com diambil langsung dari `api.chess.com` dan bisa
  diblokir kebijakan CORS/privasi peramban — kalau itu terjadi muncul
  peringatan galat di panel pemilih.
- Bilah kiri (`komponen/nav/nav.jsx`) memilih LAYAR area kerja — **Bermain**
  (papan), **Baru** (kosongkan papan), **Akun**, **Basis Data**, **Impor**.
  Tidak ada popup sama sekali: polanya sama dengan halaman Pengurus
  (`src/halaman/Pengurus/Dashboard.jsx`), yaitu bilah samping menyetel satu
  state (`tampilan` di `AnalyzeContext`) dan `komponen/areaKerja.jsx`
  merender layar yang dipilih di dalam area kerja.
  Layar Akun = daftar akun (Chess.com/Lichess) + statistik; formulir
  "Tambah akun" tampil sejajar di dalam layar itu
  (`akun/FormulirAkun.jsx`). Layar Impor = PGN / Online / FEN; Online
  menerima tautan partai: Lichess lewat `lichess.org/game/export/{id}`,
  Chess.com lewat callback publik yang moveList-nya berformat TCN
  (diterjemahkan ke SAN memakai chess.js). Layar Basis Data =
  `komponen/nav/layarDatabase.jsx`.
  Karena menu ini memicu konteks data, `AnalyzeContextProvider` membungkus
  seluruh `.analisa-root` (termasuk Nav) dan state "akun" hidup di konteks.
  CSP harus mengizinkan `https://www.chess.com` selain
  `https://api.chess.com`.
- **Papan catur tidak pernah dilepas saat layar berganti.** `areaKerja.jsx`
  menutupi `<main>` dengan lapisan `absolute inset-0` dan menyembunyikan
  papan memakai `invisible` (`visibility:hidden`), BUKAN `hidden`
  (`display:none`). Alasan: (1) `visibility:hidden` tetap punya kotak ukur,
  jadi `updateBoardSize()` di `game.jsx` tidak perlu menghitung ulang;
  (2) komponen `Game` tidak dibongkar, sehingga `useEffect([data])` tidak
  menjalankan `handlePGN()` ulang — setiap bolak-balik layar tidak
  menganalisis ulang partai dari nol dan panah yang digambar pengguna
  tidak hilang. Pintasan papan digate lewat `tampilanRef` di `game.jsx`
  supaya tombol panah di layar lain tidak menggerakkan papan.

- Pemilihan sumber PGN/FEN via form di panel samping SUDAH DIHAPUS
  (`komponen/menu/analyze/form.jsx` dibuang). Panel samping sekarang hanya
  etalase data: ajakan awal, tabel partai akun, atau Ringkasan/Langkah hasil
  analisis. Semua cara memasukkan partai lewat layar Akun / Impor / Basis Data
  di bilah kiri (lihat butir sebelumnya), dan **kedalaman analisis dipindah ke panel
  Pengaturan** (roda gigi BoardMenu → tab "Mesin", `komponen/pengaturan/
  mesin.jsx`); daftar kedalaman tersimpan di `komponen/../konstanta.js`.

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

## Aset pemain & daftar partai yang ringan

- **Daftar partai tidak mem-parse PGN.** Jumlah langkah (ply) pada tabel
  partai dihitung dengan `src/lib/pgnRingan.js` (`hitungPlyPgn`) dari teks
  PGN tanpa menyusun ulang papan. Sebelumnya tiap partai lewat
  `new Chess().loadPgn()` pada seluruh akun — itulah penyebab pemuatan
  Chess.com/Lichess terasa berat. PGN tetap di-parse penuh saat sebuah
  partai **dibuka** untuk dianalisis (wajar & wajib).
- **Kartu profil pemain.** Avatar, gelar, bendera, dan rating
  Bullet/Blitz/Rapid diambil dari API publik chess.com / lichess.org via
  `src/lib/pemainCatur.js` (`ambilKartuPemain` + `useKartuPemain`), dengan
  cache Map + `localStorage` per (platform, username). Ditampilkan di samping
  papan (`name.jsx`) dan pada kotak pemain di Ringkasan (`playersAccuracy.jsx`).
  Pemanggilan hanya aktif saat partai dimuat, dan nama bawaan/anonim dilewati.
- **Dashboard statistik akun** (gaya en-croissant). Setelah akun dipilih,
  panel menampilkan kartu akun (avatar + rating Bullet/Blitz/Rapid + jumlah
  partai + pembaruan terakhir) dan empat tab: **Ringkasan** (total, W/D/L,
  partai per tahun), **Peringkat** (grafik riwayat rating + rentang
  7 hari/30 hari/90 hari/1 tahun/selamanya), **Pembukaan** (daftar
  pembukaan + W/D/L per warna), dan **Deteksi engine** (indikasi agregat
  pemakaian engine lintas riwayat — lihat bagian berikutnya). Data dibaca dari
  `basisData` (IndexedDB); bila belum ada, ditarik dari API chess.com /
  lichess.org lewat `akun/muatPartaiAkun.js` (`muatPartaiChessCom` /
  `muatPartaiLichess`) lalu disimpan. Statistik dihitung di
  `akun/statsAkun.js` (murni). Pengguna bisa berpindah ke tabel partai
  untuk memilih & menganalisis lewat toggle di panel.

## Deteksi engine (anti-cheat) — indikasi, bukan vonis

Dua tingkat perhitungan, keduanya membaca output engine yang sudah ada —
tidak ada logika engine baru:

| Tingkat | Berkas | Isi |
| --- | --- | --- |
| Per partai | `mesin/antiCheat.js` → `hitungSkorKecurigaan(moves)` | metrik + skor 0–100 per warna, dirender kartu `summary/deteksiEngine.jsx` di panel Ringkasan |
| Agregat riwayat | `mesin/antiCheat.js` → `agregatSkorPemain(…)` | gabungan lintas partai, dirender tab **Deteksi engine** pada `akun/DashboardAkun.jsx` |

Metrik (langkah `moveRating === "forced"` dan langkah buku TIDAK dihitung):

- **`engineMatchRate`** — persen langkah yang SAN-nya sama dengan usulan engine.
  **Jebakan:** usulan untuk langkah pada `moves[i]` ada di
  `moves[i - 1].bestMoveSan`, karena `moves[i].bestMoveSan` dihitung dari
  `moves[i].fen` (posisi SESUDAH langkah) sehingga milik pemain berikutnya.
  Membandingkan `san` dengan `bestMoveSan` pada entri yang sama berarti
  mengadu langkah Putih dengan saran untuk Hitam.
- **`acpl`** — rata-rata kerugian centipawn dari `previousStaticEvals`.
  Dengan konvensi UCI (eval relatif terhadap pihak yang bergilir),
  `previousStaticEvals[0]` = eval sesudah langkah dan `[1]` = eval sebelum,
  sehingga kerugian = `cp[1] + cp[0]` untuk KEDUA warna. Skor `mate`
  diperlakukan setara ±10 000 cp dan kerugian satu langkah dipotong di
  1 000 cp supaya kehilangan menteri tidak mendominasi rata-rata.
- **`konsistensiWaktu`** — dibaca dari `move.clock` (`{white, black}`) yang
  ditempel `parsePGN`; dilewati bila `clock` null atau selisihnya negatif
  (increment lebih besar dari waktu pikir). Nilainya 0–1 dari koefisien
  variasi waktu pikir, minimum 8 sampel.
- **`perFase`** — metrik yang sama dipilah opening/middlegame/endgame lewat
  `mesin/fase.js`.

**Metrik generasi 2 — kandidat MultiPV.** `parsePGN` menganalisis setiap
posisi dengan `MULTI_PV` (5) kandidat terbaik engine; setiap entri `moves[i]`
membawa `uci` (langkah yang dimainkan) dan `moves[i].kandidat` — kandidat
posisi SEBELUMNYA, pola yang sama dengan `bestMoveSan`. Dari situ dihitung:

- **`rataPeringkat`** — peringkat rata-rata langkah pemain di antara kandidat
  (1 = selalu langkah terbaik engine; di luar daftar = `MULTI_PV + 1`).
  Sinyal paling sulit dipalsukan secara alami dan jauh lebih halus daripada
  top-1: langkah peringkat 2 dengan selisih 8 cp tidak lagi dihitung sama
  dengan langkah buruk.
- **`kecocokanTop3` / `kecocokanTop5`** — persen langkah di dalam 3/5 kandidat
  terbaik (penyebut = `kandidatSampel`, jumlah langkah yang punya data).
- **`acplKandidat`** — kerugian centipawn langsung terhadap kandidat terbaik
  pada pencarian yang SAMA (depth/hash identik, lebih konsisten daripada ACPL
  antarposisi).
- **`rataKehilanganMenang`** — kehilangan permille WDL terhadap kandidat
  terbaik (membutuhkan `UCI_ShowWDL`, yang dinyalakan `engineCatur.js`).
  Hanya laporan, tidak masuk skor.

Semua metrik generasi 2 bernilai `null` bila kandidat tidak ada (analisis
lama/cache lama, atau `multiPv: 1`) dan bobot skor otomatis ternormalisasi
ulang — perilaku lama tetap utuh.

**Metrik kondisional (laporan peninjau, bukan komponen skor).** Skor tetap
empat komponen agar maknanya stabil; tiga sinyal perilaku berikut ditampilkan
mentah di sampingnya untuk memperkuat/melemahkan bacaan:

- **`kecocokanSulit` / `kecocokanMudah`** — kecocokan top-1 dipilah
  menurut ketajaman posisi (`ketajamanKandidat` = selisih cp kandidat #1
  vs #3): sulit ≤ `AMBANG.kandidatSulit` (20 cp), mudah ≥
  `AMBANG.kandidatMudah` (100 cp), sisanya netral. Pemakai engine justru
  paling sempurna pada posisi sulit; manusia sebaliknya. Pola
  "sempurna-saat-sulit, hancur-saat-mudah" adalah tanda khas.
- **`streakTerpanjang`** — rentetan peringkat-1 beruntun terpanjang dalam
  satu partai. Manusia yang jujur nyaris tidak pernah merangkai 20+ langkah
  terbaik engine berturut-turut.
- **`korelasiWaktuKualitas`** — korelasi Spearman waktu pikir ↔ peringkat
  kandidat (`korelasiSpearman`), minimum
  `AMBANG.korelasiSampelMinimum` (12) pasangan. Manusia: makin lama
  berpikir makin baik langkahnya → NEGATIF. Pemakai engine: kualitas tidak
  bergantung waktu → ≈ 0 atau positif. Agregat lintas partai dirata-rata
  berbobot jumlah sampel.

Skor 0–100 = rata-rata berbobot empat komponen (kecocokan 0,30 · peringkat
0,25 · ACPL 0,25 · waktu 0,20; bobot dinormalkan ulang bila sebuah metrik
tidak tersedia), lalu disusutkan `n / (n + 12)` menurut jumlah langkah yang
dinilai. Komponen peringkat memetakan rata-rata peringkat 1 → 100 secara
linear sampai 0 pada `MULTI_PV + 1`. Level: `rendah` < 35 ≤ `sedang` < 70 ≤
`tinggi`. Ambangnya ada di `AMBANG` dan direkam `scripts/uji-anticheat.mjs` —
mengubahnya berarti mengubah makna angka yang sudah dibaca orang.

**`mesin/fase.js` adalah modul bersama.** `isEndOpening`/`isEndMiddlegame`
dipindah apa adanya dari `playersAccuracy.jsx` supaya Akurasi dan Deteksi
Engine memakai batas fase yang identik; jangan menggandakannya lagi. Satu
perbedaan yang disengaja: anti-cheat memajukan fase pada SETIAP langkah yang
FEN-nya terbaca, sedangkan Akurasi melewati langkah tanpa rating (perilaku v1
dipertahankan). Selisihnya hanya beberapa ply dan hanya muncul bila ada
langkah paksa tepat di batas fase.

**Bahasa UI wajib probabilistik.** Keluaran ini untuk ditinjau manusia, bukan
tuduhan: kecocokan langkah naik secara alami seiring kekuatan pemain, kontrol
waktu panjang, dan akhirpartai sederhana. Sanggahan ditampilkan permanen di
bawah angka (bukan di tooltip) pada kartu partai maupun tab agregat, dan
metrik mentah selalu ikut ditampilkan supaya peninjau bisa menilai sendiri.

Batas performa tab agregat (`akun/antiCheatRiwayat.js`), karena `parsePGN`
menjalankan Stockfish sekali per langkah:

- maksimal `BATAS_PARTAI` (12) partai terbaru tempat username benar-benar
  bermain, diambil dengan `ambilDaftarPartai({ limit: 12, sertakanPgn: true })`
  — bukan `limit: 0` yang menarik seluruh arsip ke memori;
- kedalaman `KEDALAMAN_AGGREGAT` (8) ply, lebih dangkal dari analisis tunggal;
  setiap posisi direkam `MULTI_PV` (5) kandidat terbaik untuk metrik peringkat;
- cache sesi per `id partai + kedalaman + MultiPV` (pola `cachePartai`), jadi
  berpindah tab atau mengulang analisis tidak membayar dua kali, dan hasil
  lama tanpa kandidat tidak pernah tercampur dengan hasil ber-kandidat;
- progres + tombol Batal (`AbortController`, pola `selectChessCom.jsx`);
  partai yang sudah selesai diurai tetap dipakai, yang dibatalkan hanya
  partai berikutnya;
- analisis TIDAK berjalan otomatis saat tab dibuka — pengguna menekan tombol.

## Roadmap anti-cheat — status & langkah selanjutnya

Bagian ini dokumen serah-terima: kalau suatu saat ingin melanjutkan, cukup
tunjuk bagian ini — semua konteks teknis untuk melanjutkan ada di sini dan di
file-file yang disebut.

### Status terkini (selesai, 2026-09-14)

- **Fase 1 — peringkat kandidat MultiPV + WDL.** Setiap posisi direkam
  `MULTI_PV` (5) kandidat terbaik (`engineCatur.js` → `mesin/engine.js`);
  metrik `rataPeringkat`, `kecocokanTop3/Top5`, `acplKandidat`,
  `rataKehilanganMenang` (WDL) di `mesin/antiCheat.js`; skor 4 komponen
  (kecocokan 0,30 · peringkat 0,25 · ACPL 0,25 · waktu 0,20).
- **Fase 2 — metrik kondisional perilaku.** `kecocokanSulit`/`kecocokanMudah`
  (keranjang ketajaman 20/100 cp), `streakTerpanjang`,
  `korelasiWaktuKualitas` (Spearman waktu pikir ↔ peringkat). Laporan
  peninjau, bukan komponen skor — sengaja, agar makna skor stabil.
- **Fase 3 — kelengkapan operasional.**
  - *Kalibrasi per rating*: `KALIBRASI_RATING` + `pilihKalibrasi` menggeser
    `kecocokanDasar`/`acplAcuan` menurut band Elo; rating dibaca dari
    metadata PGN (`ratingDariMetadata`), agregat memakai **median** rating
    partai (`agregat.rating`). Tanpa rating → ambang global (perilaku lama).
    ANGKA TABEL MASIH TAKSIRAN — kalibrasi ulang dengan korpus lokal
    sebelum dipakai untuk keputusan serius.
  - *Laporan peninjauan*: `mesin/laporanPeninjauan.js` — teks + JSON siap
    lampir berita acara, sanggahan wajib menyertai; tombol unduh di tab
    Deteksi engine (`DashboardAkun.jsx`).
  - *Pengukuran biaya*: `analisisRiwayatAntiCheat` mengembalikan
    `durasi: { totalMs, rataMs, perPartai }` — dasar berbasis angka untuk
    menaikkan/menurunkan kedalaman atau `MULTI_PV`; ditampilkan di UI.
  - *Cache lintas-sesi*: hasil per partai ditulis-lulus ke localStorage
    (`kci-anticheat-cache-v2`, kunci memuat `d<kedalaman>|mp<MULTI_PV>`),
    dimuat ulang otomatis saat sesi baru; `bersihkanCacheAntiCheat`
    menghapus memori + localStorage.
  - *Fondasi deviasi-manusia (siap-Maia)*: `mesin/deviasiManusia.js`
    menghitung kejutan bit + peringkat distribusi manusia dari
    `Map<fen, {uci: prob}>` — penyedia prediksi (host model + onnxruntime)
    tinggal dipasang tanpa menyentuh `parsePGN`.
- Uji: `scripts/uji-anticheat.mjs` (301) dan `scripts/uji-engine-uci.mjs`
  (59, termasuk MultiPV pada Stockfish asli) — semua wajib tetap hijau
  sebelum dan sesudah langkah berikutnya.

### Langkah berikutnya (urut prioritas)

1. **Penyedia prediksi manusia (Maia) — satu-satunya bagian fase 3 yang
   belum ada.** Metriknya sudah siap (`mesin/deviasiManusia.js`); yang
   tersisa: host file model ONNX (40–90 MB — JANGAN masuk repo; Supabase
   Storage/R2), loader `onnxruntime-web` + peta langkah, lalu pasang hasilnya
   sebagai `Map<fen, {uci: prob}>` per partai. Lisensi bobot per model wajib
   dicek (kode maia-chess GPL-3.0, setara Stockfish yang sudah di-bundle).
2. **Kalibrasi ulang tabel `KALIBRASI_RATING` dengan korpus lokal.** Kumpulkan
   distribusi metrik partai jujur per band 400-poin dari basis data kalian,
   ganti angka taksiran, dan pertimbangkan interpolasi halus antarband.
3. **Cache agregat di server (opsional).** Saat ini cache peramban
   (memori + localStorage) sudah lintas-sesi; bila analisis rutin dipakai
   banyak pengurus, simpan `hitungSkorKecurigaan` per id partai ke
   `kci_storage` dengan kunci `anticheat|<id>|d8|mp5` — pola sama dengan
   kunci cache sesi.
4. **(Jauh) model kombinasi.** Setelah korpus lokal cukup besar, latih
   penggabung komponen (logistik sederhana pun cukup) alih-alih bobot
   manual `BOBOT` — tetap sertakan metrik mentah di UI untuk peninjau.

### Catatan untuk pelanjut

- Semua metrik baru wajib null-safe terhadap partai lama tanpa `kandidat`
  (lihat pola `komponen?.peringkat ?? null` di `mesin/antiCheat.js`).
- Kunci cache agregat ada di `akun/antiCheatRiwayat.js` →
  `kunciCachePartai`; bila hasil analisis berubah bentuk, selipkan penanda
  versi baru (pola `mp5`, simpanan `kci-anticheat-cache-v2`) agar cache lama
  tidak tercampur.
- UI metrik: kartu `summary/deteksiEngine.jsx` + tab agregat
  `akun/DashboardAkun.jsx`; kunci kamus di
  `lib/terjemahan/{id,en}/analisa.js` (wajib seimbang — `npm run uji:i18n`).
- Bahasa UI tetap probabilistik: indikasi untuk ditinjau manusia, bukan
  vonis — jangan pernah menulis "terbukti curang".

## Periksa sendiri

`jsdom` + `esbuild` sekarang ada di `devDependencies`. Sebelumnya tidak, dan
`uji-analisa-ui.mjs` melewatkan dirinya sendiri (keluar 0) di mesin yang belum
memasangnya — sehingga uji UI tampak "lulus" padahal tidak pernah berjalan.

```bash
node scripts/uji-analisa.mjs        # kontrak engine + penilaian + ketahanan worker
node scripts/uji-analisa-ui.mjs     # render halaman di jsdom + engine UCI palsu
node scripts/uji-anticheat.mjs      # anti-cheat: metrik, agregat, cache/batal, kartu UI
npm run uji:i18n                    # kunci analisa.* harus ada di ID dan EN
node scripts/generasi-buku-analisa.mjs   # bangun ulang tabel buku pembukaan
```

## Catatan perbaikan (polish layar Database & Akun)

Perbaikan dilakukan bertahap per sesi; daftar ini mencatat perubahan dan
alasannya supaya tidak di-"rapikan" ulang secara tak sengaja.

1. **Satu pintu masuk tarik data = tombol "Tarik data"**. Partai hanya
   diunduh lewat `muatPartaiChessCom` dengan `paksa: true`, satu-satunya dari
   `DashboardAkun.muatData` (dipanggil tombol Tarik / refresh manual). Tidak ada
   tarik otomatis saat layar dibuka. Setelah ditarik sekali, semua halaman
   membaca data yang sama dari `basisData` (IndexedDB) — tanpa refresh ulang.
2. **Bar "Games terunduh / total" tidak reset saat ganti layar.** `KartuAkun`
   menyimpan hasil baca basis + `total` (dari kartu profil) di cache sesi
   level modul (`cacheInfo`, `cacheTotal`, kunci `koleksiId`) yang divalidasi
   `bacaRevisiBasis()`; state di-init sinkron dari cache (pola sama dengan
   `cachePartai` di `DashboardAkun`). Sebelumnya tiap kartu di-mount ulang
   dimulai dari `{ games: 0 }` sehingga bar tampak "menarik ulang" setiap pindah
   menu.
3. **Mode & tab Database bertahan lintas navigasi.** State `mode` dan
   `tampilan` disimpan di variabel modul `layarDatabase.jsx`
   (`modeTersimpan`, `tampilanTersimpan`) dan di-init sinkron dari situ, jadi
   keluar-lalu-kembali ke layar Database tidak kembali ke tampilan awal.
4. **Tabel & rekap tidak ditarik ulang bila tidak berubah.** `cacheTabelPartai`
   adalah cache sesi kueri tabel Partai (kunci = koleksi + cari + filter +
   urut + halaman, plus cek revisi). Guard tambahan mencegah fetch transisi
   saat `koleksiTerpilih === ""` tetapi daftar koleksi masih dimuat (di
   `muatPartai` dan effect rekap Pemain/Event).
5. **Kotak pencarian hadir di semua tab.** Di tab Pemain & Event, pencarian
   menyaring hasil langsung di memori (`daftarPemainTampil`/
   `daftarEventTampil` dari `cari` mentah); pesan kosong memakai `tidakCocok`
   bila ada kata kunci, selain itu `tidakAda`.
6. **Label koleksi tanpa penanda tengah.** Format label di `simpanKoleksi`
   (`basisData.js`) kini `${username} ${nama Platform}` (mis. `trian
   Chess.com`) tanpa titik penanda; kolom "Pemain" memakai terjemahan
   `basisData.pemain` ("Pemain"/"Players"), bukan "Hitam Putih"/"Black White".
7. **Ukuran judul header Database menyesuaikan.** Teks nama + brand memakai
   `text-2xl leading-8` agar seukuran tombol Back (`h-8`).
8. **Daftar perubahan lain yang ikut di-commit:** ikon `svg/{back,refresh,
   download,trash,impor,pion}.jsx`, spinner pemuatan (DualRing) di panel
   dashboard/engine dan tab Pemain/Event, refresh manual, dan kunci
   terjemahan `basisData.cariPlaceholder`, `partai.tidakCocok`,
   `partai.tidakAda`, `basisData.memuatData`.

## Bekukan fitur Analisa v1 (2026-09-10)

Sejak commit bertag **`analisa-v1-frozen`**, fitur Analisa dibekukan sebagai
**v1 stabil**: impor/pemindaian PGN, analisis per langkah (label, komentar,
top line, variasi manual), navigasi langkah, hasil analisa (Ringkasan: grafik
evaluasi, jumlah label, akurasi, rating, fase, komentar partai), dan tata
letak papan mobile/tablet/desktop dianggap selesai.

Aturan saat beku:

- Perubahan pada halaman ini **wajib** menjalankan
  `npm run uji:analisa-menyeluruh` (bagian dari `npm run uji`) dan tidak boleh
  memregresikan perilaku yang direkam suite di bawah.
- Suite berikut adalah **uji regresi hidup** perilaku v1 — bila perilaku
  memang sengaja diubah, ekspektasi di berkasnya diperbarui dalam perubahan
  yang sama (jangan dilewati/dimatikan).
- **Kartu tambahan di `summary/summary.jsx` wajib dipasang paling bawah.**
  Dua kartu tambahan saat ini: `deteksiEngine.jsx` lalu `eksporPgn.jsx`.
  `uji-hasil.mjs` mencari baris Ringkasan lewat teks labelnya
  (`spans.find(s => s.textContent === …)`) sehingga baris PERTAMA yang cocok
  yang menang; kartu baru yang menyisip di tengah — atau yang memakai ulang
  label "Pembukaan"/"Menengah"/"Akhir" — akan membajak pencarian itu. Itulah
  alasan `deteksiEngine.jsx` berada setelah `GameRating` dan memakai label
  fase sendiri (`analisa.antiCheat.fase.*`, "Kecocokan pembukaan", …).

| Suite | Cakupan | Pemeriksaan |
| --- | --- | --- |
| `scripts/uji-klasifikasi.mjs` | label langkah (brilliant…blunder) + ambang poin | 45 |
| `scripts/uji-langkah-kritis.mjs` | label `critical`: kurva kandidat MultiPV, tujuh syaratnya satu per satu, batas "hanya di cabang best", dan rantai `parsePGN` entri i ← kandidat entri i−1 | 54 |
| `scripts/uji-pgn-anotasi.mjs` | ekspor PGN beranotasi: konvensi eval sudut Putih, peta NAG, tag header (termasuk PGN tanpa tag), dan bahwa berkas hasilnya tetap PGN sah saat dimuat ulang | 60 |
| `scripts/uji-akurasi.mjs` | akurasi keseluruhan & per fase, rumus rating partai | 31 |
| `scripts/uji-komentar.mjs` | komentar langkah, FormatEval (cp/mate), komentar partai keseluruhan | 31 |
| `scripts/uji-variasi.mjs` | top line (bestMove + panah) & variasi manual (seret bidak via event mouse) | 28 |
| `scripts/uji-seret-bidak.mjs` | geometri seret bidak di atas tata letak sintetis (desktop/mobile/`<main>` di-scroll): pusat bidak = kursor, clamp tepi papan, cincin kotak tujuan, klik bidak sama = on/off, bidak lawan tidak terangkat, pembersihan listener saat unmount | 27 |
| `scripts/uji-hasil.mjs` | panel Ringkasan end-to-end (grafs, jumlah label, rating, fase, interaksi) | 27 |
| `scripts/uji-mobile.mjs` | ukuran papan 3 mode (mobile < 516px / tablet < 1100px / desktop) | 14 |
| `scripts/uji-panel.mjs` | panel samping: tab awal Ringkasan + loncatan ke Langkah | 11 |
| `scripts/uji-anticheat.mjs` | anti-cheat: konvensi eval, pengecualian forced/book, partai jujur vs engine, kandidat MultiPV (peringkat/top-3/WDL), metrik kondisional (sulit/mudah, streak, korelasi waktu↔kualitas), kalibrasi per rating, laporan peninjauan, deviasi manusia, durasi & cache lintas-sesi, agregat riwayat, kartu UI + tab DashboardAkun, parsing MultiPV `EngineCatur` | 245 |

Infrastruktur bersama: `scripts/lingkungan-jsdom.mjs` (global jsdom +
polyfill `ResizeObserver`/`Element.prototype.scrollTo`) dan
`scripts/loader-jsx.mjs` (transform JSX via esbuild + shim
`import.meta.glob` untuk Node).

Perbaikan yang masuk bersamaan dengan pembekuan (perilaku berubah dibanding
build sebelumnya — dicatat agar tidak dianggap regresi):

1. **Seret bidak batal oleh event-nya sendiri** (`komponen/game/board.jsx`).
   Listener `mousedown` di `document` didaftarkan di tengah perambatan event
   yang sama yang memulai drag, sehingga `pieceDragCancel` langsung membatalkannya
   — membuat variasi manual (seret bidak ke kotak) tidak pernah mungkin.
   Perbaikan: `pieceDragCancel` mengabaikan `e.nativeEvent` milik event
   pemulainya; klik berikutnya di mana pun tetap membatalkan drag.
2. **Analisis selalu membuka tab "Langkah"** (`komponen/menu/menu.jsx`).
   Efek "loncat ke langkah → tab Langkah" (dependensi `[moveNumber,
   pageState]`, dideklarasikan belakangan) ikut berjalan di commit masuk
   "analyze" dan menimpa efek "buka Ringkasan lebih dulu". Perbaikan: efek
   loncat hanya merespons perubahan langkah saat SUDAH berada di mode
   analisis, sehingga panel kembali terbuka di Ringkasan.
3. **`bersihkanPgn`** (`mesin/engine.js`): komentar `%` yang tidak di awal
   baris (dan komentar `{…}` di mana pun) kini dibuang dengan benar tanpa
   merusak teks header yang dikutip.

## Perbaikan seret bidak (2026-09-18)

Laporan pengguna: saat memegang bidak, bidaknya tidak lagi di tengah kursor —
ia tertinggal / "terangkat jauh" dari kursor. Semua penyebabnya ada di
`komponen/game/board.jsx` (komponen `Piece`) dan semuanya warisan upstream:
logika drag di `src/components/game/board.tsx` (wdeloo/Brilliant-Chess,
commit `56e8c48`) identik — clamp `offsetLeft/offsetTop`, `opacity: "100"`,
cek `e.button` pada `mousemove`, tanpa pembersih saat unmount. Jadi ini bukan
regresi hasil port. Diuji `scripts/uji-seret-bidak.mjs` (22 pemeriksaan; 9 di
antaranya gagal pada kode lama).

1. **Clamp drag memakai ruang koordinat yang salah.** Batas seret dihitung
   dari `board.offsetLeft/offsetTop`, yaitu koordinat terhadap *offsetParent*
   terdekat — di situs ini `<main className="relative">` di `areaKerja.jsx` —
   sementara pembandingnya `e.clientX/clientY` selalu koordinat *viewport*.
   `offset*` tidak memuat jarak `<main>` ke tepi viewport (lebar bilah kiri
   `nav.jsx`: `w-12`/`w-[210px]` di desktop, tinggi bilah mendatar di mobile)
   dan tidak berkurang saat `<main>` di-scroll. Akibatnya kursor "di-clamp"
   lebih awal dan bidak tertahan: terukur **165px** di belakang kursor saat
   menyeret ke kolom paling kanan dengan bilah kiri terbuka, **59px** saat
   papan di-scroll 160px. Perbaikan: batas dibaca dari
   `boardRef.current.getBoundingClientRect()` (viewport, sama seperti kursor),
   tanpa clamp bila rect masih kosong (papan belum diukur / jsdom).
2. **Cincin penanda kotak tujuan tidak pernah muncul.** Gaya inline-nya
   `opacity: "100"` — bukan nilai CSS yang sah (opacity 0..1), jadi dibuang
   peramban dan kelas `opacity-0` yang menang. Ditambah `border-opacity-65`
   yang sudah dihapus di Tailwind v4 (diperiksa dengan compiler Tailwind
   4.3.3 milik repo: kelas itu tidak menghasilkan CSS apa pun). Kini
   `opacity: 1` + `border-white/65`.
3. **`mousemove` diperiksa lewat `e.button`.** Nilai itu tidak berarti apa-apa
   pada `mousemove`; yang bisa diandalkan `e.buttons`. Sekarang `buttons === 0`
   (mouseup terlewat karena tombol dilepas di luar jendela/tab) mengakhiri
   drag, bukan membiarkan bidak terus menempel pada kursor.
4. **Bidak lawan bisa diangkat.** chess.js tidak menghasilkan langkah untuk
   bidak yang bukan giliran, jadi drag-nya buntu: bidak melompat lalu balik
   sendiri dan kotaknya tetap tersorot sebagai "terpilih" sampai FEN berganti
   (efek pembersih di `Board` hanya jalan saat `fen` berubah). Ditutup di
   pintu masuk lewat prop `bolehSeret={pieceColor === chess.turn()}`.
5. **Listener drag bocor saat komponen dilepas.** Tiga listener `document` +
   `document.body.style.cursor = "grabbing"` hanya dibersihkan oleh
   `mouseup`/`mousedown` berikutnya; bila bidak dilepas di tengah drag
   (partai baru, komponen dibongkar) kursor situs terkunci "grabbing" sampai
   reload. Sekarang `cleanUp` disimpan di ref dan dipanggil efek pembersih
   saat unmount.

6. **Klik bidak yang sama tidak selalu mematikan titik petunjuk.** Port lama
   memutuskan "ini klik, bukan seret" dari jarak piksel terhadap TENGAH kotak
   (`|movement| <= squareSize/2`) dengan `startPosition` dibaca dari
   `getBoundingClientRect()` bidak. Rect bidak ikut bergeser selama animasi
   langkah (150 ms, `transform` WAAPI di `animateMove`), jadi klik kedua di
   tempat yang sama terhitung "pindah" dan titik petunjuk tetap menyala; lepas
   di luar papan juga tidak pernah membatalkan pilihan. Aturan yang dipakai
   sekarang = aturan chessground (lihat di bawah), membandingkan KOTAK asal
   dengan kotak di bawah kursor saat tombol dilepas (`kotakDariKursor` di
   `Board`) — tidak bergantung pada rect bidak sama sekali.

**Acuan perilaku klik/seret (dicek ke sumbernya, bukan ingatan):**
`@lichess-org/chessground` — library papan yang dipakai Lichess dan
[en-croissant](https://github.com/franciscoBSalgueiro/en-croissant)
(`package.json`: `"@lichess-org/chessground": "^10.1.1"`, dirender lewat
`src/chessground/Chessground.tsx`). Di `src/drag.ts` → `end()`, sama pada tag
v10.1.1 maupun master:

```ts
if ((cur.orig === cur.previouslySelected || cur.keyHasChanged) && (cur.orig === dest || !dest))
  board.unselect(s);
```

dan di `src/board.ts` → `selectSquare()`:

```ts
if (state.selected === key && !state.draggable.enabled) { unselect(state); … }
```

Jadi "klik bidak → titik muncul, klik bidak yang sama → titik hilang
(on/off)" memang perilaku standar, dan itulah yang sekarang ditiru papan
Analisa.

**Batas yang belum diubah (sengaja):** drag masih jalur mouse
(`mousedown`/`mousemove`/`mouseup`), bukan Pointer Events — di layar sentuh
bidak tidak bisa diseret, tapi ketuk-bidak → ketuk-kotak tetap jalan lewat
event mouse emulasi peramban. Memindah ke pointer events berarti menyentuh
juga `handleMovePiece` di dua overlay kotak legal dan `handleMouseDown` papan
(gambar panah), dan tidak bisa diverifikasi di sini (tidak ada browser sungguhan
di lingkungan uji: `npx playwright install chromium` gagal mengunduh, dan
jsdom tidak mengimplementasikan `PointerEvent`). Dicatat supaya pengganti
berikutnya tahu apa yang tersisa.

## Metrik akurasi/ACPL sepadan platform lain (2026-09-18)

Ditambahkan setelah pertanyaan: *bagaimana en-croissant menghitung ACPL/CP,
supaya angka kita sama untuk analisa pemain cheat?* Penelusuran lengkap
(rumus, sumber, tabel perbandingan, contoh angka) ada di
**`docs/PERBANDINGAN-METRIK-AKURASI.md`** — baca itu sebelum menyentuh angka
di bagian ini.

- Modul baru **`mesin/akurasi.js`** (murni): `peluangMenang` (kurva win
  chance 50 + 50·(2/(1+e^(−0.00368208·cp))−1)), `cpBaku` (eval dipotong
  ±1000, mate = ±1000), `akurasiLangkah` (103.1668·e^(−0.04354·Δwin%) − 3.1669
  + 1, dibatasi [0,100]), `kerugianLangkah`, `anotasiLangkah` (ambang win%
  20/10/5 + aturan pengorbanan), `rataHarmonik`, `CP_CEILING = 1000`,
  `CP_AWAL = 15`. Angka-angkanya SALINAN PERSIS en-croissant
  `src/utils/score.ts` + `src/utils/misc.ts`; asal-usulnya lichess
  (`scalachess/…/eval.scala`, `lila/…/AccuracyPercent.scala`).
- `mesin/antiCheat.js` menambahkan empat keluaran per warna (per partai, per
  fase, dan di agregat): **`akurasi`** (harmonic mean — cara en-croissant
  merangkum akurasi partai), **`akurasiAritmetik`** (pembanding),
  **`acplBaku`** (ACPL konvensi lichess), dan **`anotasi`** (hitungan
  `?? ? ?! !! ! !?`). Harmonic mean diagregasi dari jumlah mentah
  (`akurasiSampel`, `akurasiInversJumlah` → `harmonikDariJumlah`), BUKAN
  dengan merata-rata nilai per partai.
- Tampil di panel `summary/deteksiEngine.jsx` (dua baris + catatan metode),
  `akun/DashboardAkun.jsx`, dan `mesin/laporanPeninjauan.js` (teks + JSON,
  `versi` dinaikkan 2 → 3; bentuk lama tetap terbaca).
- **Yang lama tidak dihapus dan tidak dipakai ulang untuk skor kecurigaan.**
  `acpl` (clamp 1000 cp/langkah, mate = 10000) tetap menjadi masukan
  `skorKecurigaan` karena `AMBANG.acplAcuan` dan seluruh
  `KALIBRASI_RATING` dikalibrasi terhadap konvensi itu; menukarnya tanpa
  kalibrasi ulang akan menggeser semua skor. Akurasi panel Ringkasan
  (`summary/playersAccuracy.jsx`, peta label port Brilliant-Chess) juga tidak
  disentuh — halaman ini beku, dan angka itu sudah lama dilihat pengguna.
- **en-croissant tidak punya model skor kecurangan.** Panel "Report" mereka
  hanya menampilkan ACPL + akurasi + hitungan anotasi + eval chart; metrik
  kecocokan top-1/top-3, peringkat MultiPV, konsistensi jam, korelasi
  Spearman, dan skor 0–100 adalah tambahan kita sendiri dan tidak punya
  padanan upstream.
- Uji: `scripts/uji-anticheat.mjs` seksi 14 mengunci **nilai emas dari suite
  uji en-croissant sendiri** (`src/utils/tests/score.test.ts`) —
  `peluangMenang(100) ≈ 59.1`, `akurasiLangkah(0, −500) ≈ 19.07`,
  `kerugianLangkah(mate −1 → 0, hitam) = 1000`, anotasi −500/−200/−100/−50 →
  `??`/`?`/`?!`/"". Kalau salah satu angka itu berubah, rumus kita sudah
  menyimpang dari acuan. Suite: 245 → **301** pemeriksaan.

## Label `critical` & ekspor PGN beranotasi (2026-09-23)

Dua tambahan yang **bukan** hasil port Brilliant-Chess. Keduanya lahir dari
kajian repo **WintrChess** (`WintrCat/wintrchess`) — lihat
`KAJIAN-WINTRCHESS-ANALISA.md` di akar repo. Gagasannya dipakai, kodenya
TIDAK: WintrChess berlisensi **GPL-3.0**, sedangkan repo ini MIT, jadi kode
yang diambil dari sana akan memaksa lisensi karya gabungannya berpindah.
Semua implementasi di bawah ditulis dengan konvensi ChessClub sendiri.

### 1. Label `critical` — langkah yang wajib ditemukan

`penilaian.js` menilai langkah dari selisih eval sebelum/sesudah, sehingga
langkah "terbaik" dan langkah "satu-satunya yang menang" tampak sama. Label
`critical` membedakannya dengan membandingkan kandidat **#1 dan #2 MultiPV
pada posisi yang SEBELUM langkah** — data yang sejak lama sudah direkam
`engine.js` (`MULTI_PV = 5`, dipakai metrik peringkat di `antiCheat.js`)
tetapi belum pernah dipakai untuk label.

- Modul baru **`mesin/langkahKritis.js`** (murni): `cpKandidat`,
  `kerugianPeluangKandidat`, `apakahLangkahKritis`. Ambang: kerugian peluang
  ≥ 10 poin persen (`AMBANG_KERUGIAN_KRITIS`) dan "sudah menang mutlak" pada
  ≥ 700 cp (`AMBANG_UNGGUL_MUTLAK_CP`). Kurva peluangnya meminjam
  `peluangMenang`/`cpBaku` dari `mesin/akurasi.js` — tidak ada rumus baru.
- Syaratnya: langkah itu usulan engine, kandidat #2 ada (tanpa MultiPV label
  tidak muncul sama sekali — bukan menebak), kandidat #2 belum menang
  mutlak, pemain tidak kalah sesudahnya, bukan promosi ratu, pemain tidak
  sedang disekak, dan kandidat #2 benar-benar merugikan.
- Labelnya hanya keluar di cabang `isBest` `getMoveRating`, jadi
  brilliant/great/book/forced dan semua label buruk tidak pernah tertimpa.
- `parseMove` menerima parameter ke-12 `previousKandidat` (`moves[i−1].kandidat`);
  `parsePGN` meneruskannya, dan jalur variasi manual mengalirkannya lewat prop
  `kandidat` di `board.jsx` → `game.jsx`.
- UI: ikon `Critical` di `komponen/svg/rating.jsx` (kotak, `#8f7ee7` — warna
  ini satu-satunya ungu di daftar label, sengaja, dan dipilih setelah
  dibandingkan pada ukuran tampil 18px), warna `--analisa-highlightCritical`,
  ikon/warna di daftar Langkah + grafik + sorot papan, baris tersendiri di
  perincian penilaian, dan kalimat komentar di kamus ID/EN.
- Akurasi panel Ringkasan: label ini diperlakukan seperti `best` (100 poin),
  bukan peta baru — angka akurasi lama tidak bergeser.

### 2. Kartu "Ekspor PGN beranotasi" (`summary/eksporPgn.jsx`)

Sebelumnya satu-satunya jalan membawa hasil keluar halaman adalah PGN
**mentah** dari panel Basis Data — dan panel itu memang hanya menyimpan teks
PGN, bukan labelnya. Kartu ini menyusun ulang PGN dari `moves` hasil analisis:

- Modul baru **`mesin/pgnAnotasi.js`** (murni, kecuali `unduhPgnBeranotasi`):
  `evalKeTeks` (eval mentah UCI → sudut Putih, skakmat sebagai `#n`),
  `bangunPgnBeranotasi`, `NAG_LABEL`, `tanpaAnotasi`.
- Peta NAG sengaja tidak lengkap: `brilliant $3`, `critical $1`,
  `inaccuracy $6`, `miss/mistake $2`, `blunder $4`; label netral
  (`best`/`excellent`/`good`/`book`/`forced`) tidak ditandai supaya tidak
  setiap langkah menjadi `$1`.
- Komentar `{ [%eval x.xx] }` ditulis per langkah (mematikan opsinya lewat
  tombol "Tanpa eval"). Tag hander disalin dari PGN asli; PGN tanpa tag —
  termasuk pengisian `"?"` bawaan chess.js — jatuh ke nama pemain halaman,
  jadi berkasnya tidak pernah berbunyi `[White "?"]`.
- Nama berkas: `<Putih> vs <Hitam>-<tanggal>.pgn`; kegagalan menyiapkan
  unduhan (mis. `URL.createObjectURL` tidak ada) mengembalikan `false` dan
  tidak merobohkan panel.
- Kartu dipasang **paling bawah** Ringkasan, mengikuti aturan beku yang sama
  dengan `deteksiEngine.jsx`.

### Yang belum dikerjakan (jangan dikira sudah)

- **`isSacrifice` masih buta terhadap baterai/x-ray.** `chess.js`
  `attackers()` tidak melaporkan penyerang di belakang bidak lain; sudah
  dibuktikan: FEN `q5k1/8/8/8/8/8/R7/R5K1 w` → `attackers("a8","w")` = `["a2"]`,
  `a1` tidak disebut (setelah `a2` dibuang baru muncul). WintrChess menutup
  ini dengan penyerang **transfektif** + pemisahan penyerang langsung vs
  menyeluruh; menyalin pendekatan itu berarti merombak `isSacrifice`, sehingga
  **sengaja tidak dikerjakan** di perubahan ini. Rinciannya (termasuk alasan
  dan risikonya) ada di `KAJIAN-WINTRCHESS-ANALISA.md` bagian 4.
- **Ambang klasifikasi di ruang peluang** (matriks `mate↔cp` ala WintrChess)
  juga belum: itu mengubah label yang sudah terbit dan menuntut seluruh
  ekspektasi `uji-klasifikasi.mjs` disetel ulang.
