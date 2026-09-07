# Cara Kerja Halaman Analisa — Penjelasan Menyeluruh

Dokumen ini ditulis setelah membaca **seluruh** berkas di `src/halaman/Analisa/`
(97 berkas terlacak Git, ±12.000 baris kode tanpa menghitung data SVG) plus
seluruh dependensinya (`src/lib/engineCatur.js`, `src/lib/pgnRingan.js`,
`src/lib/pemainCatur.js`, `src/lib/suara.js`, `src/components/chess/ChessPiece.jsx`,
`src/lib/i18n.jsx`, kamus `src/lib/terjemahan/{id,en}/analisa.js`) dan keempat
skrip ujinya.

Isinya: peta berkas → lapisan arsitektur → state → 5 alur utama yang diurai
langkah demi langkah → kontrak mesin/penilaian → penyimpanan → hal-hal yang
tidak boleh diubah → temuan & risiko.

> Status pengujian saat dokumen ini ditulis (semuanya hijau):
> `uji-analisa.mjs` **30/30**, `uji-analisa-ui.mjs` **54/54**,
> `uji-basisdata.mjs` **34/34**, `uji-i18n.mjs` **1463 kunci ID = 1463 kunci EN**.

---

## 1. Apa sebenarnya halaman ini

`/program-kami/analisa` adalah **alat bedah partai catur yang berjalan
sepenuhnya di peramban**. Tidak ada satu pun PGN yang dikirim ke server.

Tampilannya adalah **port UI dari Brilliant-Chess** (MIT, © 2025 Delo). Dua
bagian sengaja **tidak** ikut dipindah:

| Bagian upstream | Nasib di ChessClub |
|---|---|
| Worker Stockfish sendiri, `hardwareConcurrency`, `public/engine/*` | **dibuang** |
| Komunikasi UCI mentah (`addEventListener` + parsing teks) | **diganti** `src/lib/engineCatur.js` |
| `howler` + berkas MP3 Lichess (AGPL) | diganti `public/SoundChess/standard/` lewat `src/lib/suara.js` |
| Penilaian langkah (klasifikasi) | **dipertahankan**, diterjemahkan ke `mesin/penilaian.js` |
| Papan, panah, sorot, animasi, tata letak | **dipertahankan** (port) |

Karena itu berkas hasil port selalu diawali komentar:
`/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */`

---

## 2. Peta berkas

```
src/halaman/Analisa/
├── Analisa.jsx               ← gerbang halaman: tinggi area kerja + susunan provider
├── analisa.css               ← variabel tema --analisa-* (HANYA di dalam .analisa-root)
├── konstanta.js              ← breakpoint (navTop 516 / maxVertical 1100 / reduceSummary 1669)
│                                + tangga KEDALAMAN 10/13/16/20 (bawaan 13)
├── penyimpanan.js            ← localStorage aman, awalan "kci-analisa-"
├── basisData.js       (1094) ← IndexedDB: partai + koleksi, paginasi kursor, revisi, cache
│
├── konteks/
│   ├── config.jsx            ← tema papan, usedRatings, panah, animasi, suara
│   ├── errors.jsx            ← daftar notifikasi (toast)
│   ├── mesin.jsx             ← PEMILIK SATU worker Stockfish (status mati|memuat|siap|gagal)
│   └── analyze.jsx    (202)  ← JANTUNG STATE: data, pageState, game[], moveNumber, customLine, depth, akun
│
├── mesin/
│   ├── engine.js      (475)  ← EngineAnalisis + parsePGN/parseMove/parsePosition + jam
│   ├── penilaian.js   (454)  ← klasifikasi langkah + isSacrifice + isForced (MURNI)
│   ├── buku.js               ← unduh public/data/buku-analisa.json (1,3 MB), cache modul
│   ├── kunciFen.js           ← FEN → 4 bidang pertama (kunci tabel pembukaan)
│   └── cekWasm.js            ← deteksi WebAssembly + ukuran tabel hash
│
├── komponen/
│   ├── Gambar.jsx            ← pengganti <Image> Next.js
│   ├── suaraPapan.js         ← pembungkus tipis ber-API mirip Howl → lib/suara.js
│   ├── boardMenu/boardMenu.jsx   ← tombol roda gigi (dropdown Pengaturan) + balik papan
│   ├── errors/pageErrors.jsx     ← toast kanan-bawah, pushPageError/pushPageWarning
│   ├── game/
│   │   ├── game.jsx   (682)  ← ORKESTRATOR: handlePGN, handleFEN, analyzeMove, ukur papan
│   │   ├── board.jsx  (632)  ← 64 kotak, SVG bidak, panah, sorot, drag, animasi, promosi
│   │   ├── evaluation.jsx    ← bilah evaluasi vertikal/horizontal
│   │   ├── name.jsx          ← baris nama pemain + avatar + bidak yang dimakan
│   │   ├── clock.jsx         ← jam pemain
│   │   └── capturedPieces.jsx← ikon bidak yang dimakan (set Chess.com)
│   ├── loading/              ← DualRingSpinner (dipakai), ConicGradientRing (TIDAK dipakai)
│   ├── menu/
│   │   ├── menu.jsx          ← panel kanan: tab Ringkasan | Langkah + keadaan kosong
│   │   ├── loading/loading.jsx + loadingBar.jsx   ← layar "menganalisa…" + tombol Batal
│   │   └── analysis/
│   │       ├── gameButtons.jsx        ← pemutar partai (awal/mundur/putar/maju/akhir)
│   │       ├── gameChart.jsx          ← grafik evaluasi (bisa diklik)
│   │       ├── moves/moves.jsx        ← daftar langkah bernomor + label
│   │       ├── moves/comments.jsx     ← kartu komentar + FormatEval
│   │       ├── moves/overallGameComment.jsx ← kalimat pembuka (escape HTML!)
│   │       └── summary/               ← summary.jsx, playersAccuracy.jsx, ratingCount.jsx,
│   │                                     gameRating.jsx, ratingBox.jsx
│   ├── areaKerja.jsx (141) ← PEMILIH LAYAR: <main> papan + lapisan layar aktif
│   ├── nav/
│   │   ├── nav.jsx    (300)← bilah kiri: Bermain, Baru, Akun, Database, Impor + Source/Atribusi
│   │   ├── PanelLayar.jsx    ← kerangka LAYAR (bukan modal): kepala + isi, tanpa Esc/overlay
│   │   ├── layarAkun.jsx     ← layar akun: daftar akun | dashboard statistik
│   │   ├── layarDatabase.jsx (1876) ← basis data lokal: tabel partai/pemain/event + alat
│   │   └── layarImpor.jsx    ← impor PGN | Online (TCN Chess.com / ekspor Lichess) | FEN
│   ├── pengaturan/           ← themes, ratings, moves, bestMoves, mesin (5 tab)
│   └── svg/                  ← 31 berkas ikon/bidak (rating.jsx 1272 b, piece.jsx 573 b)
│
├── akun/
│   ├── daftarAkun.js         ← daftar akun tersimpan (localStorage)
│   ├── DaftarAkun.jsx        ← kolom kiri layar akun
│   ├── FormulirAkun.jsx      ← form "Tambah akun" INLINE (dulu modal popupAkun.jsx)
│   ├── KartuAkun.jsx         ← kartu akun (rating, progress unduhan, hapus/refresh)
│   ├── DashboardAkun.jsx(426)← statistik: Overview / Ratings / Openings
│   ├── muatPartaiAkun.js     ← tarik SELURUH arsip chess.com + pengaman antrean
│   └── statsAkun.js          ← fungsi statistik MURNI (bisa diuji tanpa DOM)
│
├── README.md                 ← konvensi wajib baca
├── Rencana-pekerjaan-analisa.md ← pekerjaan aktif: "cache sesi" (BELUM dikerjakan)
└── db/                       ← 13,9 MB contoh data yang TIDAK dipakai kode mana pun
```

---

## 3. Enam lapisan arsitektur

```
┌─ LAPIS 1 · HALAMAN ───────────────────────────────────────────────┐
│ Analisa.jsx — mengukur tinggi area kerja, menyusun provider,       │
│ memasang .analisa-root (tema gelap)                                │
└───────────────────────────────────────────────────────────────────┘
┌─ LAPIS 2 · KONTEKS (state bersama) ───────────────────────────────┐
│ ConfigContext  → tema, usedRatings, panah, animasi, suara          │
│ ErrorsContext  → daftar toast                                      │
│ MesinProvider  → SATU worker Stockfish (status, ganti, setop)      │
│ AnalyzeContext → data, pageState, game[], moveNumber, customLine,   │
│                  depth, akun, progress, analyzingMove               │
└───────────────────────────────────────────────────────────────────┘
┌─ LAPIS 3 · ORKESTRASI ────────────────────────────────────────────┐
│ komponen/game/game.jsx — mengubah "input apa pun" menjadi `data`,   │
│ lalu `data` menjadi `game[]` lewat mesin                            │
└───────────────────────────────────────────────────────────────────┘
┌─ LAPIS 4 · MESIN ─────────────────────────────────────────────────┐
│ mesin/engine.js   → parsePGN / parseMove / parsePosition (I/O async)│
│ mesin/penilaian.js→ getMoveRating / isSacrifice / isForced (MURNI)  │
│ mesin/buku.js     → nama pembukaan dari FEN                         │
└───────────────────────────────────────────────────────────────────┘
┌─ LAPIS 5 · ENGINE ────────────────────────────────────────────────┐
│ src/lib/engineCatur.js → Worker Stockfish WASM, protokol UCI,      │
│ antrean 1-permintaan, janji yang TIDAK PERNAH menggantung          │
└───────────────────────────────────────────────────────────────────┘
┌─ LAPIS 6 · PENYIMPANAN ───────────────────────────────────────────┐
│ basisData.js (IndexedDB + fallback memori/localStorage)            │
│ penyimpanan.js (preferensi) · akun/daftarAkun.js · lib/pemainCatur │
└───────────────────────────────────────────────────────────────────┘
```

**Aturan arah yang konsisten:** UI tidak pernah bicara UCI; UI bicara ke
`mesin/engine.js`; `mesin/engine.js` yang bicara ke `EngineCatur`;
`mesin/penilaian.js` tidak tahu apa-apa tentang engine.

---

## 4. State: `AnalyzeContext` adalah jantungnya

`konteks/analyze.jsx` menyimpan **semuanya**. Yang paling penting:

| State | Arti |
|---|---|
| `data` | `{ format: "pgn" \| "fen", string }` — **satu-satunya pintu masuk partai** |
| `pageState` | `"default"` (kosong) → `"loading"` → `"analyze"` (partai) \| `"analyzeCustom"` (posisi FEN) |
| `game[]` | hasil analisis: `game[0]` = **posisi awal** (bukan langkah), `game[1..]` = per langkah |
| `moveNumber` | indeks di `game[]` yang sedang tampil |
| `customLine` | `{ moveNumber, moves[], arrows{} }` — cabang variasi buatan pengguna |
| `depth` | kedalaman ply, dibaca dari `kci-analisa-kedalaman`, bawaan 13 |
| `akun` | `{ platform, username }` akun yang sedang dibuka |
| `tampilan` | layar area kerja: `bermain` \| `akun` \| `database` \| `impor` (konstanta `TAMPILAN_ANALISA`) |
| `analyzingMove` | **kunci papan**; selama `true` semua tombol & tombol panah dibekukan |
| `progress` | 0–100 untuk bilah muat |
| `analyzeController` | `AbortController` untuk tombol Batal |

`gameController` (back/forward/first/last/play/pause) membaca `moveNumberRef`,
`customLineRef`, dan `gameLengthRef` — **bukan** state langsung — supaya
pemanggil yang terpasang sekali tidak membaca nilai basi.

`players` dilewatkan ke komponen dalam bentuk `playersAman` hasil
`normalisasiPemain()`: kontraknya **selalu** dua pemain dengan `.name` dan
`.elo`, karena state lama dari Vite Fast Refresh / metadata PGN yang tidak
lengkap pernah membuat papan membaca `.name` dari `undefined`.

---

## 5. Enam alur utama

### 5.1 Alur A — Menganalisis PGN (alur yang paling penting)

```
Pengguna menempel PGN di layar Impor
  layarImpor.jsx: imporPgnKeBasisData(pgn)   ← simpan permanen ke IndexedDB (koleksi "impor:default")
  layarImpor.jsx: onImpor({ format:"pgn", string: pgn })
  areaKerja.jsx : muatPartai() → setData(...) + setTampilan("bermain") ← kembali ke papan
        ↓
  areaKerja.jsx: muatPartai(data) → setData(data) + setTampilan("bermain")
        ↓
  AnalyzeContext.data berubah (referensi baru → useEffect jalan)
        ↓
  game.jsx: useEffect([data]) → switch(data.format) → handlePGN(string, depth)
        ↓
  setPageState("loading")                    ← Menu menampilkan layar "menganalisa…"
  mesin = await siapkan()                    ← unduh Stockfish ~7 MB, hanya sekali
        ↓
  parsePGN(mesin, pgn, depth, openings, setProgress, signal)
     ├─ muatPgn(): loadPgn mentah; gagal → coba versi bersih (buang {…} dan baris %)
     ├─ galat → throw GALAT_PGN  ("pgn")
     ├─ metadata: pemain, waktu (TimeControl "300+3" → 300), hasil
     ├─ ekstrakDaftarClock(): sisa jam per langkah dari tag [%clk H:MM:SS]
     ├─ mesin.gameBaru()      → "ucinewgame" (buang tabel hash)
     ├─ parsePosition()       → entri game[0] (posisi awal dianalisis dulu agar
     │                          langkah pertama punya pembanding evaluasi)
     └─ loop: parseMove() per langkah
           ├─ posisi mati/remis → TIDAK dikirim ke engine (["mate"] / ["cp","0"])
           ├─ mesin.cari(fen, { kedalaman: depth, sinyal })
           ├─ isSacrifice(move) + isForced(move)
           ├─ getMoveRating({...}) → { moveRating, commentKey, commentIndex }
           ├─ simpan hanya 4 evaluasi terakhir (previousStaticEvals.slice(0,4))
           └─ setProgress((i+1)/riwayat.length * 100)
        ↓
  setGame(moves) · setResult · setArrows(createArrowsObject) · setMoveNumber(0)
  setPageState("analyze")                    ← Menu membuka tab Ringkasan
```

**Kegagalan dipetakan dengan sengaja** (ini pernah jadi bug "tombol mati"):

| Kunci galat | Aksi |
|---|---|
| `"pgn"` | toast "PGN tidak terbaca" |
| `"canceled"` | buat `AbortController` baru, tanpa toast |
| `"mesin"` | toast "Engine gagal dimuat" |
| lain | toast "Analisis gagal" + pesan aslinya |

`GALAT_MESIN` **tidak boleh** ditelan sebagai pembatalan — kalau ditelan,
halaman kembali ke formulir tanpa pesan apa pun.

### 5.2 Alur B — FEN / papan bebas

`handleFEN(fen)`:

- **FEN kosong** → papan bebas dari posisi awal, `game = [movement e2e4 palsu
  dengan eval `["cp","-30"]`]`, `pageState = "default"`.
- **FEN terisi** → `parsePosition()` → `game = [satu entri]` →
  `pageState = "analyzeCustom"`.

Di mode `analyzeCustom`, setiap langkah yang diseret pengguna masuk ke
`customLine.moves`, dan panel Langkah menampilkan `[game[0], ...customLine.moves]`.

### 5.3 Alur C — Ganti layar (model Pengurus)

Sejak popup dihapus, area kerja bekerja seperti `src/halaman/Pengurus/
Dashboard.jsx`: bilah samping menyetel satu state, `<main>` merender panel
yang sesuai. Beda nama saja — `tab` di sana, `tampilan` di sini — dan
`tampilan` hidup di `AnalyzeContext` karena Nav dan `areaKerja.jsx`
berjauhan di pohon komponen.

```
Nav (tombol) ──setTampilan("akun"|"database"|"impor"|"bermain")──▶ AnalyzeContext
                                                                        │
areaKerja.jsx ──────────────────────────────────────────────────────────┘
  ├─ <main ref={wadahRef}>  papan + BoardMenu + Menu      ← SELALU terpasang
  │        kelas tambahan "invisible" saat bukan layar papan
  └─ tampilan !== "bermain"
        └─ <div data-uji="layar-…" class="absolute inset-0 z-[900]">
              LayarAkun | LayarDatabase | LayarImpor
```

Tiga keputusan di baliknya, masing-masing punya alasan yang bisa diuji:

1. **Papan TIDAK pernah dilepas.** Kalau `Game` dibongkar, `useEffect([data])`
   di `game.jsx` menjalankan `handlePGN()` lagi saat dipasang kembali —
   artinya setiap kali pengguna bolak-balik dari Basis Data, seluruh partai
   dianalisis ulang dari nol. Selain itu `arrows` (panah yang digambar
   pengguna) adalah state LOKAL `Game` dan ikut lenyap.
2. **`invisible`, bukan `hidden`.** `visibility:hidden` tetap punya kotak
   ukur, jadi `updateBoardSize()` masih membaca `offsetHeight`/`clientWidth`
   yang benar dan papan tidak perlu dihitung ulang saat layar kembali.
   `display:none` (`hidden`) membuat semua ukuran nol dan merusak papan
   sampai ada `resize`. Bonus: isi `visibility:hidden` tidak bisa difokus,
   jadi tombol Tab tidak menyelinap ke balik lapisan.
3. **Pintasan papan digate.** Pendengar `keydown` di `game.jsx` dipasang
   sekali (`[]`) dan membaca `tampilanRef.current`. Tanpa penjaga itu,
   mengetik di kotak cari Basis Data atau menekan panah untuk menggulir
   tabel partai akan menggerakkan papan di baliknya.

`z-[900]` sengaja di bawah `PageErrors` (`z-[999]`) supaya pesan galat
analisis tetap tampil di atas layar mana pun.

Keluar dari sebuah layar kembali ke papan lewat tiga jalan: tombol
**Bermain**, tombol **Batal** di layar Impor, atau memilih partai (data PGN
dilempar ke konteks lalu `setTampilan("bermain")` oleh `muatPartai`).

### 5.4 Alur D — Tarik akun Chess.com / Lichess

```
Nav → tombol "Akun" → setTampilan("akun") → areaKerja.jsx merender layarAkun.jsx

layarAkun.jsx (dua kolom, mengisi seluruh area kerja):
  kiri  = DaftarAkun → KartuAkun (avatar, rating Bullet/Blitz/Rapid,
          "terunduh/total", terakhir diperbarui, tombol refresh/tarik/hapus)
          + tombol "+ Tambahkan akun" → FormulirAkun tampil SEJAJAR di kolom ini
  kanan = DashboardAkun (Overview | Ratings | Openings)

Sumber data DashboardAkun:
  1. cache sesi `cachePartai` (koleksiId → { revisi, daftar }) — hanya METADATA
  2. IndexedDB lewat ambilDaftarPartai({ sertakanPgn: false })
  3. kalau kosong & pengguna menekan "Tarik data" → muatPartaiAkun.js
        ├─ GET /pub/player/{user}/games/archives
        ├─ arsip dibalik (terbaru dulu), diambil 4 bulan bersamaan (ANTREAN_ARSIP)
        ├─ jumlah langkah dihitung RINGAN (lib/pgnRingan.js), bukan loadPgn
        └─ simpanBanyakPartai() → IndexedDB

Tab "Openings" saja yang menarik teks PGN penuh (nama pembukaan ada di header),
dan langsung dibuang lagi saat pindah tab / pindah akun.
```

**Pengaman unduhan** di `muatPartaiAkun.js`:
- `sedangMengunduh` (Map) — ganti layar bolak-balik saat unduhan berjalan
  **tidak** menembakkan unduhan paralel kedua; pemanggung ikut menunggu
  janji yang sama.
- `kegagalanTerakhir` (Map) + jeda 60 detik — jaringan mati tidak membuat
  setiap buka layar menembak ulang. Tombol "Tarik data" (`paksa: true`)
  menerobos jeda.

**Pengaman unduhan** di `muatPartaiAkun.js`:
- `sedangMengunduh` (Map) — ganti layar bolak-balik saat unduhan berjalan
  **tidak** menembakkan unduhan paralel kedua; pemanggung ikut menunggu
  janji yang sama.
- `kegagalanTerakhir` (Map) + jeda 60 detik — jaringan mati tidak membuat
  setiap buka layar menembak ulang. Tombol "Tarik data" (`paksa: true`)
  menerobos jeda.

### 5.5 Alur E — Layar Basis Data

```
Kiri:  daftar koleksi (cari, kartu: jumlah partai + ukuran)
Kanan: mode "data"  → ringkasan (Games/Players/Events), Jelajahi,
                      gabung pemain, hapus duplikat/kosong,
                      ekspor PGN, impor PGN, hapus koleksi, hapus semua
       mode "tabel" → tab Partai | Pemain | Event
                      Partai: tabel 50 baris/halaman, urut, filter hasil & waktu,
                              klik baris → analisis; klik ikon → salin PGN
```

Yang membuatnya cepat (semua sudah diuji di `uji-basisdata.mjs`):

- **Satu koneksi IndexedDB singleton** (`koneksiDB`), bukan `indexedDB.open()`
  di setiap kueri.
- **Indeks gabungan berwaktu** (`platformWaktu`, `usernameWaktu`,
  `kombinasiWaktu`, `koleksiWaktu`) → kursor `advance(offset)` melompat tanpa
  membaca baris yang dilewati.
- **`sertakanPgn: false`** pada tabel — teks PGN hanya diambil per partai saat
  dianalisis/di-salin (`ambilPartai(id)`).
- **`revisiBasis`** — penghitung yang naik pada setiap tulis; semua cache
  (ringkasan layar, rekap pemain/event, cache sesi dashboard) menyimpan revisi
  dan otomatis basi saat data berubah.
- **Debounce 300 ms** pada kotak cari.
- **Token `tokenPartai` / `tokenMetadata`** — pemicu beruntun tidak bisa
  membuat hasil lama menimpa yang baru.

### 5.6 Alur F — Cabang variasi manual (seret bidak)

```
board.jsx: mousedown pada bidak → drag.id
         : klik/lepas pada kotak legal → handleMovePiece(e, squareId)
             ├─ bidak pion ke baris 1/8 → Coronation (pilih Q/N/R/B)
             └─ analyzeMove(fen, {from,to[,promotion]}, sacrifice,
                            previousStaticEvals, animation, bestMoveSan)
game.jsx: analyzeMove()
  1. buat entri "belum dinilai" langsung (gerak + sorot tidak menunggu engine)
  2. setCustomLine(moveNumber + 1) dengan entri itu
  3. setAnalyzingMove(true)      ← papan & tombol terkunci
  4. parseMove(...) — pakai engine yang SUDAH ada (ambilMesin()), jangan unduh baru
  5. finally { setAnimation(false); setAnalyzingMove(false) }   ← WAJIB
  6. ganti entri terakhir dengan hasil bernilai
```

`finally` di langkah 5 bukan hiasan: bila `analyzingMove` tertinggal `true`,
satu-satunya jalan keluar pengguna adalah memuat ulang halaman.

---

## 6. Kontrak mesin & penilaian

### 6.1 Konvensi skor (kontrak paling mudah dilanggar)

`staticEval` selalu berbentuk `["cp", "34"]` atau `["mate", "2"]`,
**relatif terhadap pihak yang bergilir** (konvensi UCI), persis seperti
keluaran Stockfish. Yang menormalkannya ke sudut pandang Putih ada di tiga
tempat, dan ketiganya harus tetap sepakat:

| Tempat | Normalisasi |
|---|---|
| `game/evaluation.jsx` | `Number(eval[1]) * (whiteMoving ? 1 : -1)` — `whiteMoving` dari `move.color` |
| `menu/analysis/moves/comments.jsx` (`FormatEval`) | `Number(eval[1])/100 * (white ? 1 : -1)` |
| `menu/analysis/gameChart.jsx` | `Number(eval[1]) * (whiteMoving ? 1 : -1)` — `whiteMoving` dari **paritas indeks** |

`move.color` yang disimpan `parseMove` adalah `invertColor(mover)` = **pihak
yang bergilir setelah langkah itu**. Karena itu:

- `playersAccuracy.jsx`: pemilik rating = `move.color === "w" ? "b" : "w"`;
- `ratingCount.jsx`: pemilik rating = `i % 2 === 0 ? "b" : "w"`.

### 6.2 Hierarki klasifikasi (`mesin/penilaian.js`)

Diuji per urutan; yang pertama cocok dipakai:

```
book      → posisi ada di tabel buku (nama pembukaan jadi `comment`)
brilliant → pengorbanan + excellent, atau pengorbanan yang memulai/melanjutkan skakmat
great     → excellent yang menghukum blunder/inaccuracy lawan
best      → SAN langkah == SAN usulan engine untuk posisi sebelumnya
excellent → skakmat sudah pasti / memulai / melanjutkan rangkaian skakmat
good      → menunda skakmat lawan, atau mempercepat skakmat sendiri
miss      → melewatkan skakmat, atau melewatkan advantage
mistake   → kehilangan advantage ≥2, memberikan advantage, mulai terserang skakmat
blunder   → menyerahkan skakmat
(inaccuracy / excellent) → jatuh ke getStandardRating(diff):
                           diff ≥ 0.4 → good, ≥ 0.8 → inaccuracy, ≥ 4 → blunder
                           selain itu → excellent
forced    → hanya satu langkah legal di posisi sebelumnya (dicek SEBELUM penilaian)
```

**Komentar tidak dibekukan sebagai teks.** `penilaian.js` hanya menyimpan
`commentKey` + `commentIndex` (acak 0–2 dari 3 varian kalimat); teksnya diambil
dari kamus saat render — sehingga bahasa bisa diganti tanpa menganalisis ulang.

### 6.3 `EngineCatur` — mengapa tidak pernah menggantung

Empat jalur keluar yang semuanya diuji:

| Skenario | Perilaku |
|---|---|
| Worker `onerror` | janji pemuatan ditolak **dan** pencarian aktif ditolak + `tamat()` |
| `tamat()` | `gagalkanPencarian()` dijalankan **sebelum** `worker.terminate()` |
| Permintaan baru saat mencari | yang lama di-`stop`, pemanggilnya ditolak `"permintaan digantikan"` |
| Pemuatan gagal | `janjiSiap` direset (`catch` menjaga `this.janjiSiap === dijaga`) agar "Coba lagi" benar-benar mencoba ulang |

`EngineAnalisis.cari()` menunggu **`bestmove`**, bukan sekadar baris `info`,
supaya pencarian berikutnya memakai tabel hash yang sudah panas.

### 6.4 Tabel hash & kedalaman

- `cekWasm.js → hashUntukEngine()`: ponsel 16 MB, ≤2 GiB 32 MB, ≤4 GiB 64 MB,
  selainnya 128 MB. (Upstream memakai `memori/4` → worker sering mati di ponsel.)
- Engine selalu build **single-thread**, jadi tidak butuh header COOP/COEP.
- `KEDALAMAN = [10, 13, 16, 20]`, bawaan 13. Dulu upstream 15/18/21 — terlalu
  lambat untuk build satu utas.

---

## 7. Penyimpanan

### 7.1 IndexedDB (`basisData.js`)

- DB `kci_catur_database_v1`, **versi 2** (versi 2 menambah indeks berwaktu).
- Store: `partai` (kunci `id`) dan `koleksi` (kunci `id = "platform:username"`).
- Fallback: bila `indexedDB` tidak ada (mode penyamaran ketat, jsdom) →
  `Map` di memori + localStorage (`kci-analisa-db-koleksi`, `kci-analisa-db-partai`,
  maksimal 100 partai terbaru).
- `id` partai deterministik → tidak ada duplikat walau diunduh berulang.
- `koleksiId` selalu **`username` huruf kecil** — inilah sebabnya
  `pilihIndeks()` mendahulukan `koleksiWaktu` daripada `[platform, username]`
  (akun ber-huruf besar dulu membuat tabel tampak kosong).
- `revisiBasis` + `bacaRevisiBasis()` = mekanisme pembatalan cache bersama.

### 7.2 Kunci localStorage yang benar-benar dipakai

Melalui `penyimpanan.js` (awalan otomatis `kci-analisa-`):
`boardTheme`, `usedRatings`, `highlightByRating`, `showArrows`, `arrowAfterMove`,
`showLegalMoves`, `animateMoves`, `boardSounds`, `engine`, `kedalaman`,
`chesscom`, `lichessorg`, `riwayat-chesscom`, `riwayat-lichessorg`, `daftar-akun`.

Di luar itu: `kci-analisa-db-koleksi|partai` (fallback) dan
`kci-analisa-pemain-<user>` (cache kartu profil).

### 7.3 Mengapa semua akses harus lewat `penyimpanan.js`

Di mode penyamaran Safari, kuota penuh, atau cookie diblokir, **bahkan
`getItem` melempar `SecurityError`**. Komponen hasil port memanggil
`localStorage` langsung di dalam `useEffect`/`onClick`; satu lemparan
merobohkan seluruh halaman, bukan sekadar fitur simpan-pilihan.

---

## 8. Tema, i18n, suara, pintasan

- **Tema.** Semua variabel ada di `.analisa-root` (`analisa.css`), lalu
  dipetakan ke utilitas Tailwind lewat `@theme inline` di `src/index.css`
  (baris ~1048+). **Jangan pindahkan ke `:root`** — seluruh situs akan ikut gelap.
- **Breakpoint.** Nilai di `konstanta.js` harus sama dengan
  `--breakpoint-*` di `src/index.css`, karena dipakai CSS **dan** JS
  (pengukuran papan).
- **i18n.** Semua teks lewat `t("analisa.…")`. Kamus divalidasi
  `npm run uji:i18n` (paritas ID/EN, tidak ada nilai kosong, semua kunci yang
  dipakai di `src/` ada). Komentar langkah: `analisa.komentar.<kunci>.<0|1|2>`.
  Nama pemain yang disuntik ke kalimat pembuka **di-escape** (`escapeHtml`)
  karena dirender dengan `dangerouslySetInnerHTML`.
- **Suara.** `komponen/suaraPapan.js` → `src/lib/suara.js` →
  `public/SoundChess/standard/*.mp3`. Set bunyi dipanaskan saat modul dimuat;
  kegagalan audio ditelan (analisis tidak boleh gagal karena bunyi).
- **Pintasan papan** (`game.jsx`, dipasang sekali di `document`):
  ←/→ mundur/maju, ↑/↓ awal/akhir, spasi putar/jeda, Tab ganti panel.
  Semua **diabaikan** saat `pageState === "default"` (biarkan halaman
  menggulir), saat fokus di input/textarea, saat sedang menyeret, dan saat
  `analyzingMove`. Ada jeda minimum 25 ms antar-tekan.

---

## 9. Kontrak uji (empat skrip)

| Skrip | Perintah | Isi |
|---|---|---|
| `scripts/uji-analisa.mjs` | `npm run uji:analisa` | 30 pemeriksaan: kotak, metadata PGN, jam, `parsePosition/parseMove/parsePGN`, klasifikasi, **ketahanan `EngineCatur`** (worker mati / digantikan / `tamat()` / coba lagi) |
| `scripts/uji-analisa-ui.mjs` | `npm run uji:analisa-ui` | 59 pemeriksaan jsdom + esbuild + engine UCI palsu: mount halaman, impor PGN → analisis, tab Ringkasan/Langkah, tombol Bermain & Baru, FEN, pemilih Chess.com/Lichess, layar Akun/Database/Impor, bolak-balik layar tidak menganalisis ulang, basisData |
| `scripts/uji-basisdata.mjs` | `npm run uji:basisdata` | 34 pemeriksaan IndexedDB (`fake-indexeddb`): paginasi, **tidak memakai `getAll`**, `sertakanPgn`, filter, statistik, satu koneksi, pengaman unduhan |
| `scripts/uji-i18n.mjs` | `npm run uji:i18n` | 1463 kunci ID = 1463 kunci EN; 689 kunci terpakai ada semua |
| `scripts/generasi-buku-analisa.mjs` | manual | bangun `public/data/buku-analisa.json` (1,3 MB) dari `public/data/buku-pembukaan.json` |

> `jsdom` + `esbuild` ada di `devDependencies`. Dulu tidak ada, sehingga
> `uji-analisa-ui.mjs` **melewati dirinya sendiri (exit 0)** dan uji UI tampak
> lulus padahal tidak pernah jalan.

---

## 10. Yang TIDAK boleh diubah tanpa membaca ulang

1. **Konvensi tanda skor** — `staticEval` relatif terhadap pihak bergilir.
   Jangan dinormalkan ulang di UI.
2. **`move.color` = pihak bergilir setelah langkah** — dipakai penilaian,
   bilah evaluasi, dan akurasi.
3. **`analyzingMove` harus dilepas di `finally`.**
4. **`GALAT_MESIN` ≠ pembatalan.**
5. **Tema di `.analisa-root`**, bukan `:root`.
6. **Ukuran papan dihitung dari `wadahRef`** (kini milik
   `komponen/areaKerja.jsx`, dulu `Analisa.jsx`) — bukan `window.innerHeight`
   — lewat `ResizeObserver`.
7. **Kunci `kci-analisa-kedalaman`** — hurufnya harus sama persis dengan yang
   ditulis `komponen/pengaturan/mesin.jsx` dan dibaca `konteks/analyze.jsx`.
8. **Akses localStorage hanya lewat `penyimpanan.js`.**
9. **CSP harus mengizinkan `api.chess.com` DAN `lichess.org`**, di
   `index.html` **dan** di `vercel.json` sekaligus.
10. **Jangan sunting massal berkas ber-header "Port dari Brilliant-Chess"** —
    bedakan dulu mana warisan upstream dan mana perbaikan lokal (komentarnya
    biasanya menyebut alasannya).
11. **Papan catur tidak boleh dilepas saat layar berganti.** Sembunyikan
    dengan `invisible` (visibility:hidden), bukan `hidden` (display:none) dan
    bukan pembongkaran komponen. Melanggar ini = setiap bolak-balik layar
    menganalisis ulang partai dari nol dan panah pengguna hilang.
12. **Tidak ada popup di fitur Analisa.** Menu bilah kiri memilih layar;
    kalau butuh dialog, pakai `window.confirm` (milik peramban), bukan modal
    React. Modal pernah merebut tombol Escape dari pintasan papan.

---

## 11. Temuan & risiko

Tidak ada yang memecahkan halaman hari ini (semua uji hijau), tetapi ini
hal-hal yang saya catat sambil membaca. Urut dari yang paling perlu diputuskan.

### A. `handleFEN("")` menggantung selamanya — janji yang tak pernah selesai

`komponen/game/game.jsx`, blok `if (!fen?.trim())` (baris 346–363):

```js
move3 = await new Promise(async (resolve, reject) => {
  ...
  if (!fen?.trim()) {
    setGame([move5]);
    setPageState("default");
    return;            // ← keluar dari executor TANPA resolve/reject
  }
  ...
});
if (!move3) { setPageState("default"); return; }
setGame([...]); setPageState("analyzeCustom");   // ← tidak pernah tercapai
```

Executor `async` yang `return` tanpa `resolve` membuat janji luar **tidak
pernah settle** (sudah saya buktikan dengan replikasi: `Promise.race` dengan
timeout 500 ms mengembalikan `__GANTUNG__`).

Dampak hari ini: secara visual benar (papan bebas tampil, `pageState` sudah
`"default"`), karena semua `setState` yang perlu terjadi **sebelum** `return`.
Jalur ini justru yang paling sering dilalui — `data` awal adalah
`{ format:"fen", string:"" }`, jadi ia terjadi **setiap kali halaman dibuka**,
dan juga setiap kali tombol "Baru"/"Bermain" dipakai.

Yang rawan: siapa pun yang menambahkan kode setelah `await` itu (atau
membersihkan sesuatu di akhir `handleFEN`) akan melihatnya "tidak pernah
jalan" pada jalur papan bebas. Perbaikannya kecil: `resolve(null)` sebelum
`return`, atau pindahkan jalur FEN-kosong ke luar `new Promise`.

### B. `hapusKoleksi()` memakai `getAll()` — melanggar aturan berkasnya sendiri

`basisData.js:833`. `hapusKoleksi` membaca **seluruh** store `partai` (semua
koleksi, lengkap dengan teks PGN) ke memori hanya untuk membuang yang
`koleksiId`-nya cocok. Padahal `gabungkanPemain()` di berkas yang sama sudah
memakai kursor indeks `koleksiWaktu`, dan komentar di `ambilDaftarPartai`
(baris ~626) secara eksplisit menyebut `getAll()` sebagai regresi yang
dihapus. Tidak ada uji yang menempel `hapusKoleksi`, jadi ini tidak ketahuan.

### C. Tiga hal kecil di `simpanBanyakPartai()`

- `dibuatPada: Date.now()` (baris 404) menimpa nilai lama setiap kali koleksi
  diunduh ulang — padahal jalur fallback memori (baris 378) **mempertahankan**
  `dibuatPada` lama. Dua jalur berperilaku berbeda.
- `reqCount.onerror` tidak ditangani. Bila `count()` gagal, `onsuccess` tidak
  pernah jalan → **metadata koleksi tidak pernah ditulis** → koleksi tidak
  muncul di daftar layar Basis Data, padahal partai-partainya tersimpan.
- Nilai `total` beda arti: jalur IndexedDB mengembalikan jumlah partai dalam
  **batch ini**, jalur fallback mengembalikan jumlah partai **seluruh koleksi**.

### D. Paritas indeks vs `move.color`

`gameChart.jsx` dan `ratingCount.jsx` menentukan "siapa yang bergilir" dari
**paritas indeks** (`i % 2`), sedangkan `evaluation.jsx` dan
`playersAccuracy.jsx` memakai **`move.color` yang tersimpan**. Untuk partai
yang dimulai dari FEN dengan Hitam bergilir lebih dulu, keduanya tidak
sepakat — grafik dan perincian penilaian akan membalik warna. Kasus ini
memang jarang (butuh PGN/FEN khusus), tetapi kontraknya bercabang.

### E. Dua berkas `.jsx` berisi SVG mentah

`komponen/svg/impor.jsx` dan `komponen/svg/pion.jsx` adalah **berkas SVG
lengkap** (diawali `<?xml …?>`), bukan komponen React. Tidak ada yang
mengimpornya, jadi build tidak rusak — tetapi begitu ada yang mengimpornya,
esbuild/React akan gagal. `chats.jsx`, `pawn.jsx`, `simplePiece.jsx`, dan
`loading/ConicGradientRing.jsx` juga tidak dipakai di mana pun.

### F. `db/` = 13,9 MB contoh data yang tidak dipakai

`src/halaman/Analisa/db/` berisi `magnus_chesscom.db3` (7,7 MB),
`magnus_chesscom.ecsi` (5,6 MB), dua `.pgn`, dan `hikaru_chesscom.db3`
(225 KB). Kelimanya **terlacak Git** dan tidak direferensikan satu pun baris
kode (sudah saya periksa dengan grep di seluruh repo). Vite tidak
membundelnya karena tidak diimpor, jadi ukuran situs tidak terdampak — tetapi
setiap `git clone` memuat 13,9 MB yang tidak berguna.

### G. `selectChessCom.jsx` & `selectLichessOrg.jsx` hidup hanya untuk uji

Keduanya (543 + 143 baris) **tidak dirender oleh aplikasi lagi** — panel
samping sudah menjadi "etalase data" dan form pemilihan sudah dihapus.
Satu-satunya pemakai adalah `scripts/uji-analisa-ui.mjs`. Jadi 686 baris kode
ini dijalankan oleh uji, bukan oleh pengguna. Perlu diputuskan: hapus
(keduanya plus uji yang menyertainya), atau kembalikan ke UI. Perhatikan juga
`pengaturan/ratings.jsx` mengimpor `capitalizeFirst` dari `selectChessCom.jsx`
— jadi menghapusnya butuh memindahkan fungsi itu dulu.

### H. README sedikit basi

- Menyebut `komponen/atribusi.jsx` — **berkasnya tidak ada**; atribusi kini
  hidup di halaman `/program-kami/atribusi` (`src/halaman/Atribusi/Atribusi.jsx`).
- Daftar kunci penyimpanan masih menyertakan `format`, padahal `form.jsx`
  sudah dihapus dan kunci itu tidak dipakai lagi.

### I. Rencana "cache sesi" belum dikerjakan

`Rencana-pekerjaan-analisa.md` §2 (tandai unduhan sebagai cache sesi, bersihkan
saat unmount/mount, popup info sekali per peramban) sudah disepakati
desainnya tetapi **belum satu pun yang dikerjakan**: tidak ada
`tandaiKoleksiSesi` / `daftarKoleksiSesi` / `bersihkanKoleksiSesi` di
`basisData.js`, dan tidak ada `komponen/nav/infoCacheSesi.jsx`. Akibatnya
sampai sekarang semua unduhan Chess.com/Lichess tersimpan **permanen** di
perangkat pengunjung. Dua butir di §2.4 juga belum final (apakah Lichess ikut
ditandai, dan perlukah indikator "disimpan sementara").

### J. Hal-hal kecil lain

- `penyimpanan.js` mengekspor `bacaBoolean` / `tulisBoolean` yang tidak dipakai
  di mana pun (semua komponen memakai `bacaTeks`/`tulis` dengan `"0"`/`"1"`).
- `getRating(moveNumber, rating, prevRating, nextRating, lastBookMove)` di
  `moves.jsx:22` menerima `nextRating` tetapi tidak pernah memakainya.
- Tidak ada **cache hasil analisis**: partai yang sama dianalisis ulang dari
  nol setiap kali dibuka (sudah dicatat juga di `PERBANDINGAN-FITUR-ANALISA.md`
  butir B). Ini yang paling sering dirasakan pengguna sebagai "lama".
- Unduhan Chess.com **tidak** memakai `muatPartaiAkun.js` (punya pengaman
  antrean + jeda gagal). Bila pemilih itu dikembalikan ke UI kelak, dua
  implementasi pengambilan arsip ini sebaiknya disatukan.

---

## 12. Ringkasan satu napas

> **Input apa pun (PGN, FEN, tautan, baris tabel, seretan bidak) dikonversi
> menjadi satu objek `data = { format, string }`, diset ke `AnalyzeContext`.
> `game.jsx` memantaunya, memanggil `mesin/engine.js`, yang menanyakan satu
> posisi pada satu waktu ke satu worker Stockfish, lalu mengubah selisih
> evaluasi menjadi label lewat `mesin/penilaian.js`. Hasilnya berupa
> `game[]`, yang dipakai bersama oleh papan, daftar langkah, grafik evaluasi,
> dan ringkasan akurasi. Partai mentahnya disimpan di IndexedDB
> (`basisData.js`) supaya tidak perlu diunduh ulang.**
