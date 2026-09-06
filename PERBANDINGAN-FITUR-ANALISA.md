# Perbandingan Fitur Analisa — ChessClub vs ChessAnalysis

Dokumen ini membandingkan halaman **Analisa** di repo Anda
(`Delta-Polder-Indonesia/ChessClub`) dengan repo referensi
**ChessAnalysis** (`DanielTomaro13/ChessAnalysis`) untuk menemukan
fitur yang ada di referensi tetapi belum ada / belum terintegrasi di
repo Anda.

---

## 1. Peta singkat kedua proyek

| Aspek | ChessClub (Anda) | ChessAnalysis (Referensi) |
| --- | --- | --- |
| Jenis situs | Situs komunitas lengkap (many pages) | Aplikasi analisa murni (all-in-one) |
| Halaman analisa | `/program-kami/analisa` | Landasan utama |
| Basis kode UI Analisa | Port **Brilliant-Chess** (MIT, Delo) | Ditulis sendiri |
| Engine | Stockfish WASM situs (`src/lib/engineCatur.js`) | Stockfish WASM (`public/engine/`) |
| Multi-langkah (MultiPV) | ❌ tidak ada | ✅ ada (2 baris) |
| Cache analisa (IndexedDB) | ❌ hanya simpan partai | ✅ cache hasil analisa |
| Label langkah | ✅ sangat lengkap (bukan port penilaian upstream) | ✅ lengkap |
| Eval bar / grafik | ✅ ada | ✅ ada |
| Teka-teki | Halaman TekaTeki terpisah (Mate in N) | Puzzle trainer + Rush + My Mistakes + Stats |

---

## 2. Fitur yang ADA di referensi tapi TIDAK ADA di Analisa Anda

Inilah fitur yang Anda lihat "di punya dia" dan belum ada di punya
Anda. Saya urutkan dari yang paling relevan & paling mengena untuk
"bagian analisa":

### A. Multi-line (MultiPV) engine
- Referensi menjalankan Stockfish dengan `MultiPV 2` — menampilkan
  2 baris terbaik untuk tiap posisi (skor utama, skor kedua,
  langkah terbaik, pv). Berguna untuk menentukan "only move".
- **Analisa Anda**: engine hanya menganalisis 1 baris. Tidak ada
  panel multi-line.

### B. Cache hasil analisa (IndexedDB)
- Referensi menyimpan hasil analisa (`analysis.js` + `cache.js`) di
  IndexedDB sehingga membuka ulang partai **instan** tanpa menjalankan
  Stockfish lagi.
- **Analisa Anda**: `basisData.js` menyimpan **partai mentah**
  (PGN) agar tidak refetch, tetapi **hasil analisa dihitung ulang**
  setiap kali dibuka.

### C. Insights — Dashboard statistik pemain
- Referensi (`Insights.jsx` + `insights.js`) membuat dashboard besar
  dari **800 partai / 6 bulan** seorang pemain:
  - Skor, W/D/L (bar berwarna), rating trend **sparkline**,
    akurasi rata-rata.
  - **Kekuatan & kelemahan**, per warna, per kontrol waktu.
  - **Pembukaan** paling sering dimainkan + W/D/L + akurasi.
  - **Repertoire** (langkah pertama sebagai Putih vs Hitam),
    bagaimana partai berakhir, kekuatan lawan, kecenderungan
    (rata-rata panjang partai, rokade, kalah <20 langkah, kalah
    waktu), aktivitas per hari, dan posisi blunder tersimpan.
  - **Kartu profil pemain** (avatar, bendera, title, rating
    Bullet/Blitz/Rapid).
- **Analisa Anda**: hanya menampilkan akurasi & rating satu partai;
  tidak ada dashboard statistik agregat pemain.

### D. Key moments
- Referensi (`KeyMoments.jsx`) menampilkan chip yang bisa diklik
  untuk **melompat** ke tiap momen penting (blunder, mistake, miss,
  brilliant, great).
- **Analisa Anda**: punya `GameChart` dengan titik yang bisa diklik
  di grafik, tetapi tidak ada daftar chip "momen penting" yang
  terstruktur (seperti sidebar).

### E. Explore panel (openings explorer)
- Referensi (`ExplorePanel.jsx` + `openings.js`) membuka **buku
  pembukaan offline** (teori lanjutan + nama pembukaan), menyeret
  bidak ke cabang variasi, dan menampilkan kelanjutan teori.
- **Analisa Anda**: **sudah** bisa seret bidak → cabang variasi
  (`customLine`), dan sudah ada deteksi nama pembukaan via
  `mesin/buku.js`. Tapi **tidak ada panel explorer yang menampilkan
  kelanjutan teori + nama pembukaan secara interaktif di papan**.

### F. Library partai tersimpan (Saved games)
- Referensi (`SavedGames.jsx` + `library.js`): tanda bintang
  (star) pada partai/PGN, simpan ke daftar "Saved", buka lagi.
- **Analisa Anda**: `basisData.js` menyimpan partai akun/import ke
  IndexedDB dan ada popup **Database**, tetapi belum ada konsep
  "library favorit / saved" dengan bintang.

### G. Head-to-head vs lawan
- Referensi (`HeadToHeadModal.jsx` + `headToHead.js`): rekam jejak
  Anda vs tiap lawan (W/D/L), klik untuk memfilter partainya.
- **Analisa Anda**: belum ada.

### H. Annotated PGN export
- Referensi (`exportPgn.js`): ekspor PGN beranotasi (NAG + eval)
  yang bisa dibuka di aplikasi catur lain.
- **Analisa Anda**: panel Database bisa ekspor PGN mentah, tapi
  tidak ada ekspor beranotasi.

### I. Shareable deep links
- Referensi (`share.js`): tautan yang bisa dibagikan langsung ke
  partai pada posisi tertentu, dan ke puzzle.
- **Analisa Anda**: belum ada.

### J. Paket puzzle lengkap
- Referensi: **Puzzle Trainer** (5.769 soal Lichess, rating
  500–2800, filter tema), **Puzzle Rush** (3 menit), **My Mistakes**
  (blunder Anda dijadikan soal), **Stats/XP/level/lencana**.
- **Analisa Anda**: ada halaman **Teka-Teki** terpisah (Mate in
  One/Two/Three dengan engine), tapi belum terhubung dengan analisa
  dan tidak punya Rush / My Mistakes / XP / lencana.

---

## 3. Yang SUDAH ADA dan BAGUS di Analisa Anda (jangan diubah)

- Label langkah lengkap: Brilliant, Great, Best, Excellent, Good,
  Book, Inaccuracy, Mistake, Miss, Blunder, **Forced** + deteksi
  pengorbanan (sacrifice) & mate — port penilaian Brilliant-Chess,
  sangat matang.
- Eval bar **plus** grafik evaluasi yang bisa diklik.
- Ringkasan akurasi per pemain + estimasi rating partai.
- **Seret bidak** untuk membuat cabang variasi (custom line).
- Deteksi nama pembukaan dari tabel internal.
- Pengambilan partai **Chess.com & Lichess** (multi-bulan untuk
  Chess.com, antrean + progres + batal).
- Impor **PGN / Online / FEN** lewat popup.
- **Basis Data lokal IndexedDB** untuk menyimpan partai (dengan
  fallback localStorage), pencarian, filter, ekspor.
- i18n ID/EN, tema, suara, pengaturan kedalaman & engine.

---

## 4. Saran prioritas

Kalau tujuan utamanya "upgrade bagian analisa", urutan yang paling
bernilai (dan relatif murah untuk dikerjakan di dalam halaman Analisa
yang sudah ada):

1. **Multi-line (MultiPV)** — menambah kedalaman analisa, "only move",
   dan membuka panel multi-line. (Kontrak engine + UI.)
2. **Cache hasil analisa (IndexedDB)** — membuka ulang partai instan.
3. **Key moments** — daftar momen penting yang bisa diklik.
4. **Ekspor PGN beranotasi** (NAG + eval).
5. **Deep links** (partai + posisi tertentu).
6. **Insights / dashboard statistik pemain** (lebih besar, tapi sangat
   menarik bagi pengguna; menambah nilai besar).
7. **Library saved (bintang) + head-to-head + sparkline.**

Fitur puzzle (Rush / My Mistakes / XP) sebagian besar sudah
terpisah di halaman Teka-Teki — mengintegrasikannya ke analisa adalah
proyek besar tersendiri.

> Semua fitur ini dapat disalin logika dari ChessAnalysis, tetapi
> harus dinormalisasi ke antarmuka & konvensi yang sudah dipakai
> ChessClub (i18n, `penyimpanan.js`, `engineCatur.js`, tema
> `.analisa-root`, dan jangan mengubah mesin `penilaian.js`).
