# Kajian WintrChess untuk Bagian Analisa

Dokumen ini menilai repo referensi **WintrChess**
(`WintrCat/wintrchess`, branch `master`, dibaca 2026-09-23) untuk menjawab
satu pertanyaan: **apa yang layak diambil untuk meng-upgrade halaman Analisa
ChessClub?**

Sifat dokumen: **kajian + catatan pelaksanaan**. Bagian 1–8 ditulis sebelum
ada perubahan kode; bagian 9 adalah usulan urutan; bagian 10 mencatat apa yang
benar-benar dikerjakan (2026-09-23: P2 & P4, 2026-09-24: P1) dan apa yang
sengaja belum, beserta alasannya.

Status ringkas: **P1 (bagian penyerang tersembunyi), P2, dan P4 sudah
dikerjakan** — label `critical`, ekspor PGN beranotasi, dan perbaikan baterai/
x-ray pada `isSacrifice`. **P3 belum**, dan itu keputusan sadar — bukan karena
kelupaan; alasannya ada di bagian 6.

---

## 0. Ringkasan keputusan

| # | Item | Verdict | Alasan singkat |
|---|---|---|---|
| P1 | Deteksi brilliant berbasis **keselamatan bidak** (`getAttackingMoves` transfektif, `getDefendingMoves`, `isPieceSafe`, `isPieceTrapped`, `hasDangerLevels`) | **SEBAGIAN — SELESAI 2026-09-24** | Yang diambil hanya penyerang **transfektif** (baterai/x-ray), dan dipakai HANYA untuk membatalkan pengecualian "satu penyerang" — bukan untuk menghidupkan aturan lain. `isPieceSafe`/`isPieceTrapped`/`hasDangerLevels`/`isPieceSafe` tetap **tidak** diambil: lihat bagian 4 & 10 |
| P2 | Label **CRITICAL** dari kandidat MultiPV | **AMBIL — SELESAI 2026-09-23** | Datanya **sudah ada** di `daftarKandidat` (`MULTI_PV = 5`), cuma belum dipakai untuk label |
| P3 | Ambang klasifikasi di **ruang peluang** + matriks transisi `mate ↔ cp` | **PERTIMBANGKAN** | Ide bagus, tapi mengubah label yang sudah terbit + uji-uji lama harus disetel ulang |
| P4 | **Ekspor PGN beranotasi** (`classifNags` `$1`–`$6`) | **AMBIL — SELESAI 2026-09-23** | Panel Basis Data hanya menyimpan PGN mentah, jadi kartu ekspor dipasang di Ringkasan |
| N1 | MultiPV / multi-baris | **JANGAN** | Kita **sudah** MultiPV 5; WintrChess hanya 2 |
| N2 | Akurasi | **JANGAN** | Punya kita (lichess/en-croissant) lebih maju daripada milik mereka |
| N3 | Estimasi rating | **JANGAN** | Milik mereka masih hardcode `2000`/`1000` |
| N4 | Label `RISKY` | **JANGAN** | Di WintrChess itu **kode mati** — tidak pernah dikembalikan `classify()` |
| N5 | Analisis sisi server + kuota token | **JANGAN** | Bertabrakan langsung dengan janji privasi halaman Analisa kita |
| N6 | Model `StateTreeNode` + `pickEngineLines` multi-sumber | **JANGAN (sekarang)** | Perombakan model data besar, nilainya kecil untuk kebutuhan kita |

**Kesimpulan satu kalimat:** yang benar-benar berharga dari WintrChess adalah
**modul `shared/src/lib/reporter/`** (± 700 baris) — khususnya cara mereka
menentukan apakah sebuah bidak aman/terkunci, yang jauh lebih berprinsip
daripada `isSacrifice` kita. Sisanya (UI, arsitektur, akurasi, MultiPV)
sudah kita miliki atau justru lebih lemah.

---

## 1. Batas lisensi — baca ini lebih dulu

Ini pembatas terpenting dalam seluruh kajian, dan mengubah **cara** mengambil,
bukan sekadar apa yang diambil.

| Proyek | Lisensi | Bukti |
|---|---|---|
| **WintrChess** | **GPL-3.0** | Berkas `LICENSE` = "GNU GENERAL PUBLIC LICENSE Version 3"; `gh repo view` → `licenseInfo.key = "gpl-3.0"` |
| **ChessClub** | **MIT** | `LICENSE` repo ini, plus catatan atribusi pihak ketiga di bawahnya |
| Brilliant-Chess (port lama kita) | MIT | Karena itu port lama kita sah dilakukan apa adanya |

**Konsekuensinya:**

1. **Dilarang menyalin kode WintrChess apa adanya.** Menyalin kode GPL-3.0 ke
   proyek MIT membuat karya gabungannya wajib didistribusikan sebagai GPL-3.0.
   Situs ini menyatakan dirinya MIT (halaman Atribusi, `LICENSE`), jadi
   menyalin akan melanggar lisensi sekaligus membuat pernyataan MIT-nya salah.
2. **Yang boleh diambil adalah idenya, bukan tulisannya.** Algoritma, rumus
   matematika, dan konsep (mis. "baterai harus dibuka untuk melihat penyerang
   di belakangnya") tidak dilindungi hak cipta; yang dilindungi adalah
   ekspresi kodenya. Jadi: pelajari perilakunya, lalu **tulis implementasi
   sendiri** dengan penamaan dan gaya repo ini (Indonesia, komentar
   penjelasan, murni/tanpa React).
3. **Kalau nanti tetap ada bagian yang dikutip**, itu wajib: (a) tercatat di
   halaman `src/halaman/Atribusi/Atribusi.jsx`, dan (b) disadari mengubah
   lisensi distribusi jadi GPL-3.0. Untuk P1–P4 di dokumen ini, jalur
   **tulis ulang** sudah cukup dan tidak menuntut perubahan lisensi apa pun.
4. Catatan tambahan: WintrChess **tidak punya satu pun berkas uji**
   (tidak ada `*.test.*`, `*.spec.*`, maupun konfigurasi test). Jadi meniru
   repo itu tidak memberi jaring pengaman apa pun; uji harus kita tulis
   sendiri (`scripts/uji-*.mjs`) seperti kebiasaan repo ini.

---

## 2. Peta kedua repo

| Aspek | ChessClub (kita) | WintrChess |
|---|---|---|
| Bentuk | Situs komunitas lengkap | Monorepo aplikasi analisa (`client`/`server`/`shared`) |
| Lokasi logika analisa | `src/halaman/Analisa/mesin/` | `shared/src/lib/reporter/` |
| Bahasa | JavaScript | TypeScript |
| Basis data langkah | Entri pipih: `daftar[i]` dengan `staticEval`, `previousStaticEvals`, `kandidat`, `sacrifice` | Pohon: `StateTreeNode` + `engineLines[]` per simpul |
| Engine | Stockfish WASM lokal (`src/lib/engineCatur.js`), **MultiPV 5** | Worker sendiri, **2 baris**, plus Lichess cloud |
| Klasifikasi | Port Brilliant-Chess, **ruang centipawn** | Sendiri, **ruang peluang (expected points)** |
| Keamanan bidak | `isSacrifice()` — 90 baris aturan per jenis bidak | 6 modul berprinsip (`attackers`, `defenders`, `pieceSafety`, `pieceTrapped`, `dangerLevels`, `criticalMove`) |
| Akurasi | lichess/en-croissant (win chance + rata-rata harmonik) | Kurva sendiri + rata-rata aritmetik |
| Uji | `uji-klasifikasi.mjs` (350 b), `uji-sacrifice.mjs` (236 b), dll. | Tidak ada |

Berkas WintrChess yang relevan (semuanya di `shared/src/lib/reporter/`):

```
classify.ts                  urutan keputusan label
classification/pointLoss.ts  ambang per transisi tipe eval (inti P3)
classification/brilliant.ts  syarat brilliant (inti P1)
classification/critical.ts   syarat critical (inti P2)
expectedPoints.ts            kurva cp → peluang menang
accuracy.ts                  akurasi per langkah + agregat partai
utils/attackers.ts           penyerang langsung + TRANSFEKTIF (inti P1)
utils/defenders.ts           pembela via simulasi ambil-ulang terkecil
utils/pieceSafety.ts         isPieceSafe / getUnsafePieces (inti P1)
utils/pieceTrapped.ts        bidak terkunci (inti P1)
utils/dangerLevels.ts        ancaman balasan (inti P1)
utils/criticalMove.ts        prasyarat critical/brilliant
utils/opening.ts             nama pembukaan (kita sudah punya `buku.js`)
```

---

## 3. Yang sudah kita miliki atau justru lebih baik — jangan diambil

### N1. MultiPV / multi-baris

Dokumen internal `PERBANDINGAN-FITUR-ANALISA.md` menyatakan kita belum punya
MultiPV. **Itu sudah tidak akurat.** `src/halaman/Analisa/mesin/engine.js:84`
menetapkan `export const MULTI_PV = 5;`, dan `parseMove` merekam
`daftarKandidat` (peringkat, uci, cp, mate, wdl) untuk setiap posisi.
`antiCheat.js` bahkan sudah punya metrik turunannya: `peringkatLangkahDalam`,
`kerugianKandidatCp`, `kehilanganMenangPermille`, `ketajamanKandidat`.
WintrChess memakai 2 baris; kita 5. **Tidak ada yang perlu diambil di sini.**
Dokumen itu layak diperbarui terpisah (bukan bagian kajian ini).

### N2. Akurasi

`akurasi.js` kita memakai acuan lichess/en-croissant: win chance
`2/(1+exp(-0.00368208·cp))-1`, kurva akurasi
`103.1668·exp(-0.04354·winDiff)-3.1669`, lalu **rata-rata harmonik**. Milik
WintrChess:

- kurva per langkah `103.16·exp(-4·pointLoss)-3.17` — keluarga yang sama,
  kemiringannya nyaris identik (`-4` per satuan peluang vs `-0.04354` per
  poin persen = `-4` per satuan peluang juga);
- **tanpa** bonus ketidakpastian `+1` yang dipakai lichess;
- agregat partai memakai `meanBy` lodash = **rata-rata aritmetik**, sedangkan
  lichess dan en-croissant memakai rata-rata harmonik.

Satu ide mereka yang justru **layak dicatat** (bukan dikopi): di WintrChess,
skakmat dipetakan langsung ke peluang 0/1
(`expectedPoints.ts`) sehingga tidak perlu "ceiling" ±1000 cp. Itu lebih
bersih daripada pendekatan kita di `cpBaku()` yang memotong skakmat ke
`±CP_CEILING` lalu memperlakukannya sebagai centipawn besar. Tapi ini
penyempurnaan internal, bukan alasan mengganti `akurasi.js`.

### N3. Estimasi rating

`report.ts` WintrChess mengembalikan `estimatedRatings: { white: 2000, black: 1000 }`
secara hardcode — itu placeholder, bukan hasil hitungan. Kita sudah punya
`KALIBRASI_RATING` dan `skorKecurigaan()` di `antiCheat.js`. Tidak ada yang
bisa diambil.

### N4. Label `RISKY` — kode mati di sana

`Classification.RISKY` dideklarasikan, punya warna, punya ikon, punya NAG,
dan dihitung di `ClassificationCountCard` — **tetapi `classify()` tidak
pernah mengembalikannya**. Di seluruh `client`, `server`, dan `shared`,
tidak ada satu pun jalur yang menetapkan label itu ke sebuah langkah.
Mengimpor daftar label mereka mentah-mentah berarti ikut membawa label hantu.
Kalau kita ingin `risky`, itu keputusan desain kita sendiri, bukan warisan.

### N5. THEORY / FORCED / book

Kita sudah punya semuanya: `forced` lewat `isForced()`, `book` lewat
`buku.js` + `kunciFen.js` (kunci FEN 4 bidang — sama persis dengan cara
`opening.ts` mereka memakai `fen.split(" ").at(0)`).

---

## 4. P1 — Deteksi brilliant berbasis keselamatan bidak (paling berharga)

### Kondisi kita sekarang

`penilaian.js` menandai sebuah langkah "brilliant" bila
`isSacrifice(move) === true`. Isi `isSacrifice` adalah pemindaian papan
dengan **aturan khusus per jenis bidak**:

| Jenis bidak | Aturan di `isSacrifice` |
|---|---|
| Kuda / gajah | diserang pion lawan, tanpa `move.captured` |
| Benteng | punya penyerang, kecuali kasus tertentu "1 penyerang ratu/benteng + ada pembela" |
| Ratu | punya penyerang, kecuali "1 penyerang ratu + ada pembela" |
| lainnya | tanpa pembela tapi ada penyerang, kecuali hasil makan bidak non-pion |

Semua penyerang/pembela diambil dari `chess.attackers(kotak, warna)`.

### Celah yang sudah dibuktikan (bukan dugaan)

Saya menjalankan uji langsung dengan `chess.js@1.4.0` (versi yang dipakai
repo ini, lihat `package.json`) pada posisi baterai:

```
FEN:  q5k1/8/8/8/8/8/R7/R5K1 w - - 0 1     (Ra1 di belakang Ra2, Q hitam di a8)
attackers('a8','w')                      -> [ 'a2' ]
apakah a1 (x-ray di belakang a2) ikut?   -> false
setelah a2 dihapus                       -> [ 'a1' ]
```

Artinya: **`chess.js` tidak melaporkan penyerang di belakang baterai.**
Akibatnya `isSacrifice` kita buta terhadap semua pola di mana bidak yang
dikorbankan baru "benar-benar diserang" setelah bidak di depannya dipindahkan
— justru salah satu pola korbannya yang paling khas (mis. pengorbanan
pertukaran yang membuka jalur bidak lain). Ini bukan bug yang saya karang dari
teori: perilakunya sudah saya jalankan dan hasilnya di atas.

### Ide yang diambil dari WintrChess

Bukan menyalin kodenya, tapi **memakai cara berpikirnya**, yang jauh lebih
berprinsip daripada daftar pengecualian per jenis bidak:

1. **Penyerang transfektif** (`attackers.ts`). Untuk setiap penyerang langsung,
   mereka membuang bidak terdepan lalu membandingkan himpunan penyerang
   sebelum/sesudah (mirip XOR). Yang muncul sebagai selisih = penyerang yang
   tadinya tertutup. Diterapkan berantai (rekursif) sampai tidak ada yang baru.
   Raja tidak boleh menjadi bidak terdepan baterai.
2. **Pembela** (`defenders.ts`). Bukan sekadar `attackers(kotak, warna sendiri)`:
   mereka mensimulasikan setiap penyerang merebut kotak itu, lalu menghitung
   **himpunan pembalas terkecil** — dan bila tidak ada penyerang sama sekali,
   warna bidak dibalik supaya hitungannya tetap bermakna.
3. **`isPieceSafe`** (`pieceSafety.ts`) — mirip SEE sederhana, dengan urutan
   keputusan: pengecualian pengorbanan yang menguntungkan (benteng ditukar dua
   bidak ringan) → ada penyerang langsung bernilai lebih rendah? tidak aman →
   jumlah penyerang ≤ jumlah pembela? aman → bandingkan nilai penyerang
   terendah → pembela bernilai lebih rendah dari penyerang terendah, atau ada
   pembela pion? aman.
4. **`isPieceTrapped`** (`pieceTrapped.ts`). Bidak disebut terkunci hanya bila
   tidak aman **di kotak sekarang** DAN tidak aman **di semua kotak yang bisa
   ia tuju**.
5. **`hasDangerLevels` / `moveCreatesGreaterThreat`** (`dangerLevels.ts`).
   Membandingkan ancaman sebelum/sesudah langkah: kalau semua langkah yang
   tersedia justru membuka ancaman balasan yang lebih besar, bidak itu dianggap
   tidak punya jalan keluar.
6. **Syarat brilliant** (`brilliant.ts`) akhirnya menjadi: kandidat kritis
   (lihat P2) + bukan promosi + tidak sekadar menyelamatkan bidak + tidak semua
   bidak tidak-aman terlindungi ancaman balasan + jumlah bidak terkunci
   bertambah + masih ada bidak tidak-aman. Ini menutup banyak kasus "kelihatan
   seperti korban padahal cuma memindahkan bidak ke tempat aman".

### Rencana di ChessClub

- Modul baru: `src/halaman/Analisa/mesin/keamananBidak.js` (murni, tanpa React,
  mengikuti gaya `penilaian.js`/`akurasi.js`), memuat: penyerang transfektif,
  pembela, `bidakAman`, `bidakTerkunci`, `ancamanBalasan`. Berbasis `chess.js`
  seperti kode kita yang ada, bukan porting TypeScript mereka.
- `penilaian.js` tetap menjadi pemilik keputusan label; `isSacrifice` diarahkan
  untuk memakai modul baru (atau diganti pemakaiannya) setelah hasilnya setara
  atau lebih baik pada kasus uji.
- **Jangan** sekaligus mengubah ambang label lain di langkah yang sama.

### Biaya dan risiko (jujur)

- WintrChess memakai `lodash-es` (`minBy`, `xorWith`, `isEqual`) dan punya
  `chess.js` yang mengembalikan `FEN` dari `move()`; kita menulis ulang dengan
  gaya repo ini — jadi tidak ada dependensi baru.
- Ini modul yang secara komputasi **berat**: setiap pemanggilan melakukan
  banyak `new Chess(...)` + `moves()`. `isSacrifice` sekarang dipanggil sekali
  per langkah pada seluruh partai (`engine.js:392`). Untuk partai 80 langkah
  dengan MultiPV 5, biaya ini bisa terasa. **Karena itu P1 wajib disertai
  pengukuran waktu** sebelum diterima, bukan hanya "label-nya lebih pintar".
- Uji: `scripts/uji-sacrifice.mjs` (236 baris) sudah ada dan harus tetap hijau
  atau diperbarui secara sadar; tambahan uji baterai/x-ray wajib dibuat karena
  justru itu kasus yang tadinya tidak terdeteksi.

### Hasil yang akhirnya diambil (2026-09-24)

Yang dikerjakan **hanya butir 1 di atas** (penyerang transfektif), dan tidak
dipasang seperti rencana awal: penyerang tersembunyi **tidak** dimasukkan ke
daftar penyerang. Alasannya persis risiko yang sudah ditulis di bagian 10 —
daftar penyerang dipakai oleh banyak aturan sekaligus, jadi menambahkan x-ray
ke situ akan menyalakan aturan "tanpa pembela tapi ada penyerang" pada posisi
yang belum benar-benar terserang. Sudah dibuktikan saat mengukur: varian itu
menandai rook g8 Hitam pada posisi `6rk/ppp2p2/7p/5P1K/4NP2/1P4R1/3r3P/6R1`
(padahal Putih sedang disekak, jadi tidak ada satu pun penyerang legal untuk
g8) dan rook Hitam c1 pada `8/2R4p/6pk/5pP1/2rP1K1P/4PP2/8/2r5` (padahal
benteng pembukanya, c4, tidak punya langkah legal).

Bentuk akhirnya: hitungan penyerang **legal** tetap dipakai untuk syarat
keberadaan, dan baterai hanya dipakai membatalkan pengecualian "satu penyerang"
untuk benteng/ratu. Efeknya diukur pada 15824 langkah solusi puzzle: 15817
identik (99,96%), 7 berubah (semuanya `false→true`, tak satu pun di langkah
penutup), biaya tambahan tidak terukur. Rincian + ujinya ada di
`src/halaman/Analisa/README.md` bagian "Penyerang tersembunyi (baterai/x-ray)
pada `isSacrifice`". Butir 2–6 (pembela gaya WintrChess, `isPieceSafe`,
`isPieceTrapped`, `hasDangerLevels`, syarat brilliant baru) tetap **tidak**
diambil — manfaatnya lebih kecil daripada risiko mengubah label yang sudah
terbit, dan itu tidak berubah oleh hasil ini.

---

## 5. P2 — Label CRITICAL dari kandidat MultiPV yang sudah ada

### Kenapa ini murah

WintrChess mendefinisikan langkah **kritis** sebagai: langkah yang
mempertahankan keunggulan, padahal alternatif terbaik kedua sudah
menjatuhkannya. Ambangnya di `critical.ts`: kehilangan peluang ≥ 0,1
(skala 0–1) antara **baris terbaik** dan **baris terbaik kedua** pada posisi
yang sama. Prasyarat di `criticalMove.ts`: bukan posisi sudah menang mutlak
(≥ 700 cp), bukan posisi kalah, bukan promosi ratu, bukan langkah wajib keluar
dari sekak.

**Kita sudah menyimpan data yang tepat untuk itu.** Komentar di
`engine.js:455` menyatakan sendiri: *"Pada entri `i`, langkah pemain
`daftar[i].uci` dibandingkan dengan `daftar[i - 1].kandidat`"*. Jadi pasangan
kandidat #1 dan #2 posisi **sebelum** langkah sudah tersedia lengkap dengan
`cp`/`mate` dari **satu pencarian yang sama** (kedalaman identik) — persis
yang dibutuhkan, dan justru lebih andal daripada pembanding antar-posisi.
Kandidat #1 dan #2 bahkan sudah dipakai di `antiCheat.js`
(`kerugianKandidatCp`, `kehilanganMenangPermille`).

### Rencana

- Fungsi murni baru di `penilaian.js` (atau modul kecil terpisah), mis.
  `apakahKritis(kandidat, konteks)` → boolean, memakai `peluangMenang` +
  `cpBaku` dari `akurasi.js` (modul itu sudah murni dan sudah punya kurvanya —
  tidak perlu menulis kurva baru).
- Label ini **aditif**: tidak mengubah label yang sudah ada kecuali pada
  langkah yang saat ini berlabel `best`/`excellent` dan memenuhi syarat kritis.
  Perlu keputusan pemilik produk: apakah `critical` menggantikan `best`, atau
  menjadi label tersendiri (WintrChess menjadikannya label tersendiri dengan
  bobot setara `best`).
- Berkas yang tersentuh: `penilaian.js`, `KUNCI_KOMENTAR` + kamus
  `src/lib/terjemahan/{id,en}/analisa.js`, komponen komentar/ringkasan, dan
  kemungkinan ikon label. Ini yang membuatnya "medium", bukan "kecil".
- Prasyarat teknis: hanya jalan bila analisis memakai `multiPv > 1`. Saat
  pengguna mematikan MultiPV, label ini harus hilang dengan sendirinya
  (kandidat cuma 1 baris) — bukan menampilkan label palsu.
- Verifikasi: `uji-klasifikasi.mjs` + `uji-komentar.mjs` + `uji-i18n.mjs`
  (kunci ID harus sama banyak dengan EN).

---

## 6. P3 — Ambang klasifikasi di ruang peluang

### Inti persoalan

`getStandardRating(diff)` kita memakai **selisih centipawn** dengan ambang
tetap: `≥ 0,4` good, `≥ 0,8` inaccuracy, `≥ 4` blunder. Padahal makna satu
pion tidak seragam: jatuh dari +5,0 ke +4,2 hampir tidak berarti, sedangkan
jatuh dari +0,5 ke −0,3 adalah bencana. WintrChess menyelesaikan ini dengan
mengubah dulu ke **peluang menang**, baru membandingkan, dan ambangnya pun
khas per transisi:

| Transisi tipe eval | Perlakuan WintrChess |
|---|---|
| cp → cp | rugi peluang `<0,01` best, `<0,045` excellent, `<0,08` okay, `<0,12` inaccuracy, `<0,22` mistake, sisanya blunder |
| mate → mate | hilang skakmat → mistake/blunder; mempertahankan → best/excellent/okay/inaccuracy menurut selisih langkah mat |
| mate → cp | menurut nilai sisa: ≥800 excellent, ≥400 okay, ≥200 inaccuracy, ≥0 mistake, sisanya blunder |
| cp → mate | menang → best; terserang: `≥-2` blunder, `≥-5` mistake, sisanya inaccuracy |

Tabel itu adalah bagian yang paling rapi dari seluruh repo mereka: **semua
transisi ditangani eksplisit**, tidak ada kasus yang "jatuh ke cabang terakhir
lalu diberi label apa saja".

### Kenapa ini hanya "pertimbangkan", bukan "ambil"

Ini **mengubah label yang sudah terbit**. `uji-klasifikasi.mjs` (350 baris,
memuat skenario blunder/mistake/miss/great/brilliant deterministik) dan
`uji-komentar.mjs` akan gagal, dan setiap perubahan label yang terlihat
pengguna harus disetujui pemilik produk — bukan diputuskan diam-diam oleh
agen. Nilainya nyata (label lebih adil di posisi menang besar), tapi biaya
verifikasinya juga nyata.

Satu kabar baik: **kurvanya tidak perlu diimpor dari mereka.** `akurasi.js`
kita sudah memuat `peluangMenang(cp)`, `cpBaku()`, dan `batasiCp()` — jadi
"berpikir di ruang peluang" bisa dilakukan dengan modul kita sendiri. Itu
sekaligus menghindari persoalan lisensi di bagian 1.

---

## 7. P4 — Ekspor PGN beranotasi

Kita sudah punya `eksporPgnKoleksi()` (`basisData.js:1213`) dan tombolnya di
`layarDatabase.jsx`, tapi keluarannya PGN mentah. `akurasi.js` kita sudah
menghitung anotasi NAG (`??` `?` `?!` `!!` `!` `!?`), hanya belum dipetakan ke
token PGN.

WintrChess punya peta siap pakai di `Classification.ts`:

```
brilliant $3   critical $1   inaccuracy $6   mistake $2   blunder $4   risky $5
```

(Perhatikan: `risky` tidak pernah muncul — lihat N4. Pemetaan itu kita pakai
hanya untuk label yang benar-benar kita hasilkan.) Ini penambahan kecil dan
terisolasi: satu fungsi penyusun PGN beranotasi + opsi di UI ekspor + uji baru.
Tidak menyentuh klasifikasi sama sekali, jadi risikonya rendah.

---

## 8. Yang sengaja TIDAK diambil

### N5. Analisis sisi server dengan kuota token

WintrChess menaruh klasifikasi di server (`server/src/routes/api/analysis/analyse.ts`)
dan melindunginya dengan cookie sesi yang punya penghitung `actions` di
MongoDB (`AnalysisSession`) yang dikurangi satu tiap permintaan. Itu masuk akal
untuk produk berbayar/berkuota.

**Kita tidak bisa meniru ini.** `ARSITEKTUR-ANALISA.md` menyatakan janji
halaman kita secara eksplisit: *"alat bedah partai catur yang berjalan
sepenuhnya di peramban. Tidak ada satu pun PGN yang dikirim ke server."*
Memindahkan klasifikasi ke server akan membatalkan janji itu — dan itu
keputusan produk, bukan keputusan teknis yang boleh diambil agen.

### N6. Model `StateTreeNode` + `pickEngineLines`

WintrChess menyimpan analisis sebagai **pohon** simpul dengan daftar
`engineLines` per simpul, dan bisa mencampur beberapa sumber (Stockfish lokal +
Lichess cloud) pada beberapa kedalaman, lalu memilih himpunan baris terbaik via
`pickEngineLines(fen, lines, { count, depth, source })`.

Menarik, tapi: (a) kita menyimpan entri pipih (`daftar[i]`) yang sudah dipakai
banyak modul (`antiCheat`, `laporanPeninjauan`, `basisData`, cache), jadi
menggantinya adalah perombakan besar; (b) kebutuhan "campur beberapa sumber
engine" belum ada di kita. Tidak diambil sekarang. Kalau suatu hari kita ingin
menampilkan langkah kedua/ketiga **di papan secara realtime**, `getLineGroupSibling`
dan `getTopEngineLine` mereka (mencocokkan `depth` + `source` + `index`) adalah
referensi desain yang bagus.

---

## 9. Usulan urutan pengerjaan

Urutan di bawah disusun supaya tiap langkah bisa diverifikasi sendiri dan
tidak ada langkah yang menyentuh dua hal sensitif sekaligus.

| Tahap | Isi | Berkas utama | Uji | Risiko |
|---|---|---|---|---|
| 1 | P2 — label `critical` dari kandidat MultiPV | `penilaian.js`, kamus i18n, `uji-klasifikasi.mjs` | `uji:klasifikasi`, `uji:komentar`, `uji:i18n` | sedang (tambah label + i18n) |
| 2 | P4 — ekspor PGN beranotasi NAG | `basisData.js`, `layarDatabase.jsx`, uji baru | uji baru + `uji:basisdata` | rendah (aditif, terisolasi) |
| 3 | P1 — penyerang tersembunyi (baterai/x-ray) saja, brilliant lebih tajam **tidak** diambil | modul baru `keamananBidak.js`, `penilaian.js` | `uji:sacrifice` + uji baru baterai, **ukur waktu** | ~~tinggi~~ → rendah setelah diukur (biaya tak terukur; SEE penuh 2,6× ditolak) — SELESAI 2026-09-24 |
| 4 | P3 — ambang di ruang peluang | `penilaian.js`, `uji-klasifikasi.mjs` | seluruh `uji:analisa-menyeluruh` | tinggi (mengubah label terbit) |

Tahap 1 dan 2 bisa dikerjakan lebih dulu karena keduanya **tidak menghapus
perilaku yang ada**. Tahap 3 dan 4 sebaiknya dipisah, karena keduanya
menyentuh inti `penilaian.js` — menggabungkannya membuat penyebab setiap
perubahan label sulit dilacak.

---

## 10. Pelaksanaan (2026-09-23 & 2026-09-24)

### Yang dikerjakan

**P2 — label `critical`.** Modul baru `src/halaman/Analisa/mesin/langkahKritis.js`
(murni) + sambungan ke `getMoveRating` (hanya di cabang `isBest`), `parseMove`
(parameter ke-12 `previousKandidat`), `parsePGN`, dan prop `kandidat` pada jalur
variasi manual. UI: ikon `Critical` (kotak, satu-satunya ungu di daftar label),
warna `--analisa-highlightCritical`, baris di perincian penilaian, penanda di
daftar Langkah/grafik/sorot papan, kamus ID/EN. Uji baru
`scripts/uji-langkah-kritis.mjs` (54 pemeriksaan).

Alasan label ini **terpisah** dari `best` (bukan menggantikannya): "langkah
wajib ditemukan" adalah informasi tambahan, bukan koreksi penilaian kualitas —
dan dengan begitu tidak ada satu pun label lama yang berubah makna.

**P4 — ekspor PGN beranotasi.** Modul baru
`src/halaman/Analisa/mesin/pgnAnotasi.js` (murni kecuali fungsi unduh) + kartu
`summary/eksporPgn.jsx` yang dipasang paling bawah Ringkasan. Peta NAG
mengikuti gagasan `classifNags` WintrChess tetapi sengaja lebih hemat
(brilliant `$3`, critical `$1`, inaccuracy `$6`, miss/mistake `$2`, blunder
`$4`; label netral tidak ditandai). Uji baru `scripts/uji-pgn-anotasi.mjs`
(60 pemeriksaan), termasuk pemeriksaan bahwa berkas hasilnya **masih PGN sah**
saat dimuat ulang dan menghasilkan langkah yang identik.

**P1 — penyerang tersembunyi (baterai/x-ray) pada `isSacrifice`.** Modul baru
`src/halaman/Analisa/mesin/keamananBidak.js` (`penyerangTersembunyi`), dipakai
`getAttackersDefenders` **hanya** untuk petak yang punya tepat satu penyerang
legal. Syarat keberadaan penyerang tetap memakai penyerang legal; baterai cuma
membatalkan pengecualian "satu penyerang" benteng/ratu (`satuPenyerang`).
Gerbang legalitas di modul itu wajib: baterai hanya bisa terbuka kalau bidak
terdepannya punya langkah legal. Pengukuran (15824 langkah solusi puzzle, objek
`move` utuh): 15817 identik, 7 berubah `false→true`, tak ada yang `true→false`,
tak satu pun di langkah penutup; biaya 1,470 → 1,465 ms/langkah (di bawah
derau). SEE penuh semua bidak diukur 3,19 ms/langkah (2,6×) dan **ditolak**.
Uji `scripts/uji-sacrifice.mjs` bertambah 39 → **65** pemeriksaan (bagian
KEAMANAN, BATERAI, PENJAGA).

Catatan metodologi yang penting untuk pelanjut: pengukuran pertama saya
memakai objek `move` tanpa `from`. Akibatnya `couldBeSaved` menerima petak
`undefined` dan selalu mengembalikan `true`, sehingga jumlah perubahan
menggelembung (8, dan salah satunya `Qxe8` yang sebenarnya **bukan**
perubahan: ratu Hitam terpaksa merebut untuk keluar dari skak, lalu jatuh ke
baterai — `couldBeSaved = false`, jadi bukan pengorbanan yang disengaja).
Selalu bawa `from`/`to` saat menyalin langkah dari PGN/puzzle.

### Yang sengaja TIDAK dikerjakan

**Sisa P1 (keamanan bidak gaya WintrChess).** Celah x-ray sudah ditutup, tetapi
perbaikan yang benar bukan sekadar menambahkan penyerang x-ray ke daftar
penyerang: `isSacrifice` memakai satu daftar penyerang untuk banyak aturan
yang berbeda (mis. "tanpa pembela tapi ada penyerang" = menggantung), dan
menambahkan x-ray ke daftar itu akan **menyalakan** aturan tersebut pada
posisi yang sebenarnya belum terserang — false positive baru. Model yang
benar (seperti WintrChess) memisahkan penyerang **langsung** dan penyerang
**menyeluruh**, lalu memakai keduanya untuk aturan yang berbeda. Itu berarti
merombak ulang `isSacrifice` — bagian yang justru paling matang di halaman
ini — beserta seluruh ekspektasi `uji-sacrifice.mjs` dan `uji-klasifikasi.mjs`.
Pekerjaan sebesar itu butuh keputusan pemilik produk, bukan diselundupkan
lewat perubahan ini. Hasil 2026-09-24 **tidak** mengubah kesimpulan itu: yang
diambil hanya penyerang transfektif, dan itupun hanya sebagai pembatal
pengecualian — bukan sebagai masukan aturan baru.

**P3 (ambang di ruang peluang).** Sama: mengubah label yang sudah dilihat
pengguna, dan menuntut seluruh ekspektasi suite beku disetel ulang. Manfaatnya
nyata tetapi tidak mendesak.

### Verifikasi yang dijalankan

- `npm run uji:analisa-menyeluruh` — 12 suite, semuanya lulus
  (45 + 54 + 60 + 65 + 31 + 31 + 28 + 27 + 27 + 14 + 11 + 301; angka `65` untuk
  `uji-sacrifice.mjs` adalah hasil 2026-09-24, sebelumnya 39).
- `npm run uji` (seluruh rantai, termasuk suite non-Analisa) — exit 0.
- `npm run uji:i18n` — 2405 kunci ID = 2405 kunci EN.
- `npm run build` — bundel produksi terbentuk.
- `scripts/uji-analisa-ui.mjs` +4 pemeriksaan baru: kartu ekspor terpasang di
  Ringkasan, tombolnya ada, dan mengkliknya di jsdom (tanpa
  `URL.createObjectURL`) tidak melempar serta tidak merobohkan halaman.

### Sisa yang layak dikerjakan berikutnya

1. **P3** (ambang klasifikasi di ruang peluang) — satu-satunya tahap dari
   rencana awal yang belum dikerjakan; menyentuh `penilaian.js` dan menuntut
   seluruh ekspektasi suite beku disetel ulang, jadi kerjakan sendiri.
2. **Sisa P1** hanya kalau ada bukti bahwa label brilliant masih salah pada
   kasus nyata: urutan yang paling murah adalah `isPieceTrapped` dulu (bidak
   terkunci), bukan merombak seluruh syarat brilliant.
3. Bila label `critical` terbukti jarang muncul pada analisis nyata
   (MultiPV 5 dengan kedalaman 13 di build single-thread), tinjau ambang
   `AMBANG_KERUGIAN_KRITIS` — angkanya sengaja dikumpulkan sebagai konstanta di
   satu tempat supaya mudah disetel.
