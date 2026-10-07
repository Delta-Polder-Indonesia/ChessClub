# Audit Bagian 6 — Enam Sub-halaman Program Kami

**Tanggal:** 2026-10-06 · **Cabang:** `arena/da3663c0-chessclub` · **Commit acuan:** `6a27c25`
**Prioritas pass ini:** **Teka-teki Catur** (baca 100%, cari bug, verifikasi dengan uji), lalu Rush Teka-teki,
Kuis Catur, Report Analisa, Pembukaan, dan E-Book & Panduan.
**Putaran 2 — 2026-10-07.** Keputusan produk ditutup dan langsung dikerjakan: **A14** (pesan khusus untuk skakmat
alternatif; penilaian tetap ketat), **A15** (badge tipe soal di baris status), **A16** (sakelar "Ingat posisi" +
pemberitahuan posisi dipulihkan), **B3** (token CSRF disegarkan lalu POST diulang sekali), dan **F2** (sesi pemohon
e-book: tiket per berkas + tiket kedaluwarsa tidak lagi menghasilkan unduhan gagal). Seluruh nomor baris di dokumen
ini sudah di-anchor ulang ke kondisi berkas sekarang; jumlah kunci kamus kini **2.554** (ID = EN).

Dokumen ini adalah **hasil audit** — setiap temuan disertai lokasi berkas/baris, dampak, dan bukti. Temuan yang
sudah diperbaiki ditandai **✅ diperbaiki**; temuan yang sengaja hanya dilaporkan (keputusan produk atau butuh
konfirmasi) ditandai **⚠️ dilaporkan**. Tidak ada klaim "sudah beres" tanpa perintah yang bisa dijalankan ulang
(bagian [11](#11-cara-verifikasi-ulang)).

---

## 1. Ringkasan

| # | Halaman | Rute | Temuan diperbaiki | Temuan dilaporkan | Uji baru |
| :-: | --- | --- | :-: | :-: | --- |
| A | Teka-teki Catur | `/teka-teki`, `/teka-teki/:id` | 16 | 3 | `uji:tekateki-alur` (66 pemeriksaan), `uji:tekateki-solusi` (10) |
| B | Rush Teka-teki | `/teka-teki-rush` | 3 (+2 diperiksa) | 0 | `uji:api-csrf` (6 pemeriksaan, baru) |
| C | Kuis Catur | `/quiz-catur` | 6 | 1 | `uji:quiz` diperluas (ikon kategori) |
| D | Report Analisa (landing) | `/program-kami/analisa` | 0 | 0 | — |
| E | Pembukaan | `/program-kami/pembukaan` | 0 | 0 | — |
| F | E-Book & Panduan | `/program-kami/ebook` | 2 | 0 | `uji:sesi-ebook` (14 pemeriksaan, baru) |
| — | Kerangka layar penuh (lintas halaman) | semua rute di atas | 1 | 0 | `uji:kerangka-penuh` (12 pemeriksaan) |

**Ringkasan bukti uji (dijalankan pada pass ini, bukan diasumsikan):**

| Perintah | Hasil (jalankan terakhir, seluruh perubahan sudah masuk) |
| --- | --- |
| `npm run uji` (rantai penuh, 40+ perintah) | **EXIT=0** — penutup rantai `66 lulus, 0 gagal` (putaran 2, 2026-10-07) |
| `npm run build` | **EXIT=0** — `✓ built in 13.68s` |
| `node scripts/uji-teka-teki-alur.mjs` | **66 lulus, 0 gagal** (naik dari 54: badge tipe, sakelar "Ingat posisi", skakmat alternatif) |
| `node scripts/uji-tekateki-solusi.mjs` | **10 lulus, 0 gagal** (kebijakan pesan mate alternatif) |
| `node scripts/uji-sesi-ebook.mjs` (baru) | **14 lulus, 0 gagal** |
| `node scripts/uji-api-csrf.mjs` (baru) | **6 lulus, 0 gagal** |
| `node scripts/uji-ebook-pembaca.mjs` (diperluas) | **22 lulus, 0 gagal** (callback `padaGagal`, tanpa muat ulang berulang) |
| `node scripts/uji-kerangka-layar-penuh.mjs` (baru) | **12 lulus, 0 gagal** |
| `npm run uji:quiz` (diperluas) | 100 soal valid + seluruh kategori punya berkas ikon |
| `npm run uji:i18n` | `OK — 2554 kunci ID = 2554 kunci EN; 1237 kunci terpakai semuanya ada` |
| `npm run uji:peta` | `LULUS: 14 lulus, 0 gagal` (peta kode + SKILL pengujian disinkronkan) |
| `node scripts/uji-integritas-suite.mjs` | `Hasil: 8 lulus, 0 gagal` (rantai `uji` memuat semua penjaga baru) |

Temuan dengan dampak pengguna terbesar pada pass 1: **15 teks UI yang tidak melewati kamus** sehingga pengguna
mode Inggris melihat teks Indonesia (dan sebaliknya satu tombol berbahasa Inggris pada halaman Indonesia),
**lencana "book" yang bisa hilang**, **panel Syzygy yang diam tanpa penjelasan**, serta **satu soal Kuis yang
jawabannya ambigu secara faktual**. Pada putaran 2 dampak terbesar ada pada alur berulang: **368 soal yang
skakmat alternatifnya tidak dijelaskan**, **"Ingat posisi" yang tidak bisa dimatikan**, **skor Rush yang gagal
dikirim setelah server di-restart**, dan **gerbang e-book yang meminta nama/akun/kode dari awal pada setiap buku
dan setiap muat ulang halaman**.

---

## 2. Metode & batasan

**Cara kerja.** Berkas dibaca penuh (bukan cuplikan): `TekaTeki.jsx` (2.422 baris saat pass 1; 2.513 setelah
putaran 2), `PapanTekaTeki.jsx` (1.025),
`animasiBidak.js`, `src/lib/tekaTeki.js`, `src/lib/skakmat.js`, `TekaTekiRush.jsx` (1.472), `QuizCatur.jsx` (650) +
`daftar.js` (692), `EbookPanduan.jsx` (475), `ModalUnduhEbook.jsx` (466), `FiturEbook.jsx` (51), `Pembukaan.jsx` (479),
`AnalisaLanding.jsx`, `TekaTekiKonten.jsx`, `RushTekaTekiLanding.jsx`, `KuisCaturLanding.jsx`,
`PembacaPdf.jsx` (397), `src/lib/sesiUnduhEbook.js` (182, baru), kamus
`src/lib/terjemahan/{id,en}/*.js` yang relevan, serta kode server untuk Rush (`server/src/rute.js`,
`server/src/rekor-rush.js`, `server/src/oauth.js`).

**Verifikasi.** Tiga lapis — (1) uji otomatis repo (`npm run uji`, `npm run build`); (2) dua *harness* jsdom baru
yang menjalankan halaman Teka-teki sungguhan dari data sampai interaksi; (3) pemeriksaan data langsung dengan
`chess.js` atas 5.486 soal.

**Batasan yang harus diketahui pembaca** (jangan dianggap sudah diuji):

- **Peramban sungguhan tidak tersedia di lingkungan ini.** `npx playwright install chromium` gagal (langkah apt
  dan unduhan peramban), tidak ada Chrome/Chromium sistem. Karena itu **uji e2e Playwright belum dijalankan pada
  pass ini** — jalankan `npm run uji:e2e` di mesin dengan peramban sebelum rilis.
- **Seret-lepas bidak tidak bisa diuji di jsdom** (`document.elementFromPoint` tidak ada); harness menguji jalur
  klik-petak, sedangkan seret hanya tertutup uji lencana/animasi.
- Kanal Syzygy (tablebase Lichess) dan Stockfish diuji sebagai *permintaan/keadaan UI*, bukan terhadap jawaban
  engine sungguhan.

---

## 3. A. Teka-teki Catur — prioritas pass ini

Berkas: `src/halaman/TekaTeki/TekaTeki.jsx`, `PapanTekaTeki.jsx`, `animasiBidak.js`, `src/lib/tekaTeki.js`,
`public/data/teka-teki.json`.

### 3.1 Temuan yang diperbaiki

| # | Temuan | Lokasi | Dampak | Prioritas | Status |
| :-: | --- | --- | --- | :-: | :-: |
| A1 | **Rute `/teka-teki/<id>` kehilangan kerangka layar penuh.** `TANPA_KERANGKA` adalah `Set` yang dicocokkan **persis**, sedangkan halaman ini menulis ulang URL-nya sendiri ke `/teka-teki/<id>` (dan tautan dalam/share juga berbentuk itu). Akibatnya `<header>` + `<footer>` situs disuntikkan mengelilingi papan teka-teki. | `src/components/PageLayout.jsx:24` (fungsi `tanpaKerangkaPath`), `:43` (pemakaian) | Tata letak rusak (papan terjepit di antara header/footer) pada URL yang justru dibagikan pemain | **Tinggi** | ✅ |
| A2 | Tombol petunjuk berlabel **`Hint`** mentah, padahal kamus sudah punya `tekaTeki.petunjuk` ("Petunjuk"). | `TekaTeki.jsx:1787, 1795` (`t("tekaTeki.petunjuk")`) | Halaman Indonesia menampilkan satu kata Inggris di tengah UI Indonesia | Sedang | ✅ |
| A3 | Panel pengaturan: judul `Pengaturan` + label `Bidak`, `Suara papan`, `Warna papan` ditulis mentah (Indonesia), padahal kuncinya ada (`tekaTeki.pengaturan`, `papan.setBidak`, `papan.suara`, `papan.warnaPapan`). | `TekaTeki.jsx:2023-2024, 2059-2063, 2072, 2091, 2146` | Pengguna EN melihat pengaturan berbahasa Indonesia | Sedang | ✅ |
| A4 | Baris giliran: `Putih`/`Hitam` + `melangkah` ditulis mentah, padahal `tekaTeki.giliranPutih/giliranHitam` ada. | `TekaTeki.jsx:2273-2274` | Idem A3 | Sedang | ✅ |
| A5 | **Lencana level** memakai peta `NAMA_LEVEL` berbahasa Indonesia, sedangkan *selector* Level memakai kamus ("Very easy"…). Dua sumbu yang sama menampilkan bahasa berbeda di layar yang sama. | `TekaTeki.jsx:58-64` (`KUNCI_LEVEL`), `:1497` | Pengguna EN melihat "Sangat Mudah" di samping filter "Very easy" | Sedang | ✅ |
| A6 | Label tab atribusi `Hasil Karya Bintang Toba (2026)` ditulis mentah; kunci `tekaTeki.sumber` yang tersedia justru **tidak terpakai** (kandidat kode mati). | `TekaTeki.jsx:1631` → kunci baru `tekaTeki.tabAtribusi` | Idem A3 | Rendah | ✅ |
| A7 | Tombol `Mainkan saran (…)` ditulis mentah dan **tidak punya kunci kamus**. | `TekaTeki.jsx:2381` → kunci baru `tekaTeki.mainkanSaran` | Idem A3 | Sedang | ✅ |
| A8 | Tooltip lencana papan (`Langkah brilian`, `Blunder (langkah salah)`, `Satu-satunya langkah`, `Skakmat — raja lawan…`, `Menang — raja pemenang`, dst.) ditulis mentah di komponen papan yang **dipakai bersama** Teka-teki dan Papan Interaktif. | `PapanTekaTeki.jsx:255` (helper `labelIkonLangkah`), `903`, dan pemakaian di lencana langkah → `papan.ikonLangkah.*`, `papan.ikonSkakmat`, `papan.ikonMahkota` | Tooltip berbahasa Indonesia pada mode EN (dan sebaliknya tidak bisa diterjemahkan sama sekali) | Sedang | ✅ |
| A9 | **Lencana "book" bisa hilang.** `ikonLangkahAkhir` di-`useMemo` dengan dependensi `[jalurFen]`, padahal ia membaca buku pembukaan lewat *ref*. Kenaikan pemicu `paksaHitungUlang` tidak berpengaruh karena memo mengembalikan nilai cache — jadi posisi yang sedang tampil tidak dihitung ulang saat buku selesai dimuat. | `TekaTeki.jsx:359-387` → dependensi `[jalurFen, versiBuku]` | Bila pemain melangkah sebelum buku selesai dimuat, lencana pada posisi itu salah ("best"/"forced", bukan "book") sampai langkah berikutnya | Sedang | ✅ |
| A10 | **Panel Syzygy tidak pernah menjelaskan apa pun.** Tidak ada status memuat/gagal, dan permintaan ke `tablebase.lichess.ovh` tetap dikirim untuk posisi >7 bidak — yang pasti ditolak (batas tablebase standar), padahal dua kunci kamus (`tekaTeki.syzygyMenganalisis`, `tekaTeki.syzygyGagal`) sudah disiapkan dan **menganggur**. | `TekaTeki.jsx:176, 574` | Pemain melihat "—" tanpa penjelasan; permintaan jaringan yang pasti gagal terus dikirim | Sedang | ✅ |
| A11 | **Lanjut otomatis menyerobot peninjauan.** Setelah skakmat, timer 3 detik tetap berjalan walau pemain menekan `\|< ◀ ▶ ▶\|` atau meminta petunjuk — papan berpindah soal tepat saat pemain sedang menelusuri solusi. | `TekaTeki.jsx:851-853` + pembatal `929, 964, 973, 1018, 1049` (termasuk di petunjuk) | Kehilangan konteks saat meninjau; pemain harus mencari soal itu lagi | Rendah | ✅ |
| A12 | **Petunjuk bisa membocorkan langkah lawan.** `bisaHint` hanya memeriksa `!selesai && sisa.length > 0`, sehingga selama jeda 700 ms balasan mesin tombol petunjuk masih menyala dan `tampilPetunjuk` mengambil `sisa[0]` — yaitu langkah **lawan**. | `TekaTeki.jsx:1570` + gerbang di `LayoutTekaTeki` | Pemain mengintip balasan terbaik lawan; perilaku tidak sesuai niat fitur | Sedang | ✅ |
| A20 | **Badge tipe soal menampilkan kunci mentah.** Implementasi pertama A15 mengisi `KUNCI_TIPE` dengan `"skakmat1"`, sedangkan `t()` menuntut kunci lengkap (`tekaTeki.skakmat1`) — badge akan berbunyi `skakmat1`. Tertangkap oleh pemeriksaan baru di `uji:tekateki-alur` sebelum dirilis. | `TekaTeki.jsx:48-52` | Pengguna melihat nama kunci internal, bukan label | Sedang | ✅ |
| A13 | Promosi: `terapkan(fen, { …, promo: diharapkan.promo })` memakai huruf promosi **dari data**, bukan pilihan pemain, bila data menulis promosi tanpa huruf. | `TekaTeki.jsx:790` → `diharapkan.promo \|\| promo` | **Laten**, bukan bug aktif: seluruh 92 langkah promosi di data selalu membawa huruf (`q`) — lihat §3.3. Dipertahankan sebagai penjagaan bila format data berubah | Rendah | ✅ |

### 3.2 Lencana "book": bukti sebelum/sesudah

`uji-teka-teki-alur` memuat halaman, membuka soal, lalu melangkah **tanpa menunggu** buku pembukaan
(`public/data/buku-pembukaan.json`, 18.713 entri) selesai dimuat. Sebelum perbaikan, memo tidak dihitung ulang
saat `bukuSiap.current` terisi karena dependensinya hanya `jalurFen`; sesudah perbaikan, kenaikan `versiBuku`
memaksa perhitungan ulang. Sekarang `paksaHitungUlang` tidak lagi menjadi kode mati di berkas ini.

### 3.3 Pemeriksaan data (bukan asumsi)

Dijalankan dengan `chess.js` atas `public/data/teka-teki.json`:

| Pemeriksaan | Hasil |
| --- | --- |
| Jumlah soal | **5.486** — Mate in One 1.377 · Mate in Two 2.991 · Mate in Three 1.118 |
| Panjang garis solusi | maksimum **5 ply** (selalu ganjil → langkah penutup selalu milik pemain) |
| Legalitas | **0** langkah ilegal dari 15.940 langkah |
| Akhir garis | **0** garis yang tidak berakhir skakmat |
| Promosi | **92** langkah promosi, **92** membawa huruf (`q`), **0** tanpa huruf |
| Skakmat alternatif di langkah penutup | **368 soal (6,71%)** — Mate in One 47 · Mate in Two 215 · Mate in Three 106 |

### 3.4 Temuan yang dilaporkan (A14–A16 sudah dikerjakan pada putaran 2, lihat §3.6)

| # | Temuan | Lokasi | Kenapa belum diubah | Prioritas |
| :-: | --- | --- | --- | :-: |
| A14 | ~~**Skakmat alternatif dihitung salah.**~~ **Sudah diputuskan & dikerjakan pada putaran 2 — lihat §3.6.** Keputusan produk: penilaian **tetap ketat** (harus persis solusi, sama dengan Rush dan sama dengan penilaian daring pada umumnya), tetapi pemain **diberi tahu** bahwa langkahnya memang skakmat, hanya bukan langkah yang dinilai data. | `TekaTeki.jsx:810-814`; kunci `tekaTeki.mateAlternatif` (kamus `id/en/tekaTeki.js:44`) | — | Sedang–Tinggi | ✅ |
| A15 | ~~**Tipe soal tidak pernah ditampilkan.**~~ **Dikerjakan pada putaran 2:** badge tipe tampil di baris status memakai `KUNCI_TIPE` (kode mati + 3 kunci kamus menganggur kini terpakai). | `TekaTeki.jsx:48-52, 1498` (kirim) dan `:2255-2259` (render) | — | Sedang | ✅ |
| A16 | ~~**"Ingat posisi" tanpa UI.**~~ **Dikerjakan pada putaran 2:** sakelar di panel pengaturan + baris keterangan saat posisi dipulihkan; saat dimatikan, posisi tersimpan dibuang. | `TekaTeki.jsx:40, 223, 296, 325-326, 485, 522, 647-657, 1560-1567, 2119-2131` | — | Rendah | ✅ |
| A17 | **Kode mati kecil:** prop `sedangSeret` dikirim ke `PapanTekaTeki` tetapi tidak pernah dipakai di sana (`grep -rn sedangSeret` = definisi + pemakaian saja); label bilah aksi `Engine` masih literal (kunci `papan.engine` = "Analisis Engine" terlalu panjang untuk lencana). | `TekaTeki.jsx:315, 1317` (prop `sedangSeret`), `:2462` (label `Engine`) | Kebersihan; tidak berdampak | Rendah |
| A18 | **Perubahan parameter rute setelah mount tidak mengganti soal.** `/teka-teki/5` → `/teka-teki/50` lewat navigasi klien tidak memuat soal lain (efek pemuatan sengaja tidak memantau `idPath`). | efek pemuatan + komentar "dependensi yang sengaja dilepas" | Tidak ada tautan dalam aplikasi yang melakukan ini (navigasi selalu `replace`), jadi dampaknya praktis nol; dilaporkan agar tidak "diperbaiki" tanpa memahami alasannya | Rendah |
| A19 | **Penomoran relatif terhadap saringan.** "Soal #3 dari 12" mengikuti daftar tersaring, sedangkan URL memakai `problemid` absolut. Placeholder sudah dinamis (perbaikan putaran 1); perubahan berikutnya (menomori absolut) adalah keputusan produk. | `TekaTeki.jsx` (input nomor + label) | Konsistensi; butuh keputusan | Rendah |

### 3.5 Perbaikan lapisan kerangka (lintas halaman)

`PageLayout.jsx` sekarang memakai daftar awalan + fungsi `tanpaKerangkaPath()` (cocok persis **atau**
`<awalan>/…`), sehingga `/teka-teki/1`, `/teka-teki/2500`, `/teka-teki-rush`, `/quiz-catur`,
`/papan-interaktif`, dan `/program-kami/analisa/papan` konsisten tanpa `<header>`/`<footer>` situs, sementara
rute biasa tetap memakai kerangka. Bukti: `uji:kerangka-penuh` **12 lulus** (sebelum perbaikan, dua rute
`/teka-teki/<id>` gagal).

### 3.6 Putaran 2 — keputusan produk dikerjakan (A14, A15, A16)

**A14 — skakmat alternatif: pesan menjelaskan, penilaian tetap ketat.**
Alasan mempertahankan penilaian ketat: Rush menilai persis solusi, seluruh mode ujian lain di situs ini juga, dan
menerima "skakmat apa pun" pada 368 soal akan membuat sebagian soal lebih mudah daripada yang dimaksud penulisnya.
Yang diubah adalah **informasinya** — pemain yang menemukan skakmat sah di luar data diberi tahu bahwa langkahnya
memang skakmat, hanya bukan langkah yang dinilai:

> `tekaTeki.mateAlternatif` (ID): "Skakmat! Namun soal ini dinilai dari langkah solusi data — tekan Petunjuk bila
> buntu." · (EN): "Checkmate! But this puzzle is scored on the recorded solution move — use Hint if you are stuck."

Cara kerjanya: fungsi murni baru `apakahSkakmat(fen, {from,to,promo})` di `src/lib/tekaTeki.js:65` diterapkan hanya
ketika langkah salah **dan** tinggal satu langkah (`sisa.length === 1`) — `TekaTeki.jsx:810-814`. Pembatasan itu
bukan asumsi: pengukuran ulang atas 5.486 soal (skrip sementara, dijalankan dengan `chess.js`) menemukan **0 soal**
yang mengizinkan skakmat lebih awal dari langkah penutup, jadi tidak ada skakmat sah di tengah garis yang bisa
disalah-tandai.

Bukti uji: `uji:tekateki-alur` (pemeriksaan baru "pesan khusus skakmat alternatif muncul", soal hasil pencarian
otomatis) **dan** `uji:tekateki-solusi` yang diubah agar menuntut dua hal sekaligus — pesan `mateAlternatif` muncul,
pesan "belum tepat" **tidak** muncul, dan soal tetap belum tercatat terpecahkan sampai langkah solusi dimainkan
(10 lulus, 0 gagal).

**A15 — badge tipe soal.** `KUNCI_TIPE` kini lengkap berawalan grup kamus dan dipakai:
`teksTipe={t(KUNCI_TIPE[masalah.type] || "")}` (`TekaTeki.jsx:1498`) dirender di baris status
(`TekaTeki.jsx:2255-2259`) dengan gaya lencana yang sama seperti tab atribusi. Tiga kunci `tekaTeki.skakmat1/2/3`
yang sebelumnya menganggur kini terpakai. Pemeriksaan baru di `uji:tekateki-alur` memasang ulang DOM ke locale ID
dan menuntut label kamus ("Skakmat dalam 1 Langkah") muncul — inilah yang menangkap bug A20 (kunci tanpa awalan).

**A16 — "Ingat posisi" bisa dimatikan & diberitahukan.** Preferensi `kci-teka-teki-ingat-posisi`
(`TekaTeki.jsx:40`, pembaca `:223`) default **aktif** (perilaku lama tidak berubah bagi yang tidak menyentuhnya).
Saat dinonaktifkan: posisi tidak lagi disimpan (`:485`), posisi lama dibuang (`:647-657`), dan pemulihan saat memuat
halaman dilewati (`:522`). UI: sakelar di panel pengaturan (`:2119`) + baris keterangan `tekaTeki.posisiTersimpan` /
`tekaTeki.ingatNonaktif` (`:2128-2131`) — dua kunci yang sebelumnya menganggur. Pemeriksaan baru menuntut ketiganya:
sakelar awalnya aktif, klik menyimpan `"0"`, dan "Lewati" **tidak** menulis posisi selama dinonaktifkan.

---

## 4. B. Rush Teka-teki

| # | Temuan | Lokasi | Dampak | Prioritas | Status |
| :-: | --- | --- | --- | :-: | :-: |
| B1 | Label tombol suara `"Suara menyala"`/`"Suara mati"` ditulis mentah, padahal `papan.suaraNyala`/`papan.suaraMati` sudah ada dan dipakai halaman lain. | `TekaTekiRush.jsx:899` | Mode EN menampilkan label Indonesia | Sedang | ✅ |
| B2 | Tombol **Mulai** menunda `mulai()` 700 ms lewat `setTimeout` **tanpa pembersihan**; bila pengguna meninggalkan halaman dalam jeda itu, sesi tetap dimulai di komponen yang sudah lepas. | `TekaTekiRush.jsx:1086-1089` | Timer nyasar + rasa "tombol tidak merespons"; juga bisa memicu dua sesi saat klik ganda | Rendah | ✅ |
| B3 | **CSRF basi tidak diulang.** `kirimSkorRush` (dan POST non-pengurus lain) memakai token CSRF dari `sessionStorage`; token itu hidup di memori server (24 jam) dan **hilang saat server di-restart**, sedangkan hanya `pengurus.js` yang menyegarkan token otomatis setelah 403 berpesan CSRF. | `src/lib/api/rekorRush.js` (fungsi `kirimSkorRush`) vs `src/lib/api/pengurus.js` (`segarkanCsrfToken`) | Setelah server di-restart, pengiriman skor gagal terus ("Gagal menyimpan skor…") sampai tab ditutup; pesan galat tidak menyebut penyebabnya | Sedang | ✅ putaran 2 |
| B4 | `key={b.username}` pada daftar peringkat. | `TekaTekiRush.jsx` (papan peringkat) | **Bukan bug**: server menyusun satu baris per username (`server/src/rush*`/`rute.js` → `susunPeringkat`), jadi kunci unik. Dicatat agar tidak dilaporkan sebagai temuan palsu | — | ✅ (diperiksa) |
| B5 | Batas & anti-curang sisi server | `server/src/rekor-rush.js:22-25, 47, 62`, `rute.js:246-300` | **Terverifikasi benar**: tampil 20 / simpan 100 teratas, `MAKS_SKOR = {3: 90, 5: 120}`, POST wajib tiket Chess.com sekali-pakai (`pakaiTiket`), anggota roster, skor ≥ 0 & berhingga, durasi hanya 3/5 → 401/403/400/422 | — | ✅ (diperiksa) |

**Patch B3 yang diterapkan (putaran 2).** Pola yang sudah dipakai `anggota.js`, `ebook.js`, `pengurus.js`, dan
`pesan.js` disalin ke dua modul yang tertinggal — `kirimSkorRush` (`src/lib/api/rekorRush.js`) dan
`ajukanPesertaTurnamen` (`src/lib/api/turnamen.js`):

```js
const kirim = (token) => fetch(url, { method: "POST", headers: { …, "X-CSRF-Token": token }, body });
let res = await kirim(tokenSesi);
if (res.status === 403) {
  const salinan = await res.clone().json().catch(() => null);
  if (salinan?.kode === "token-csrf" || /csrf/i.test(String(salinan?.error ?? ""))) {
    sessionStorage.removeItem("kci-csrf-token");        // buang salinan basi
    res = await kirim(await ambilCsrfToken());          // sekali saja
  }
}
```

Audit menyeluruh memastikan hanya dua modul ini yang memasang `X-CSRF-Token` tanpa jalur retry. Bukti:
`node scripts/uji-api-csrf.mjs` → **6 lulus, 0 gagal** dengan `fetch` tiruan yang merekam jejak permintaan —
(1) 403-CSRF diulang sekali dengan token baru; (2) 403 non-CSRF **tidak** diulang dan pesannya diteruskan;
(3) dua kali 403-CSRF berhenti setelah 2 POST (tidak berputar); (4) `ajukanPesertaTurnamen` sama di keempat arah.
Skrip ini masuk rantai `npm run uji`, jadi jalur retry kini punya penjaga otomatis (keberatan yang dulu menahan
patch ini sudah tidak berlaku).

---

## 5. C. Kuis Catur

| # | Temuan | Lokasi | Dampak | Prioritas | Status |
| :-: | --- | --- | --- | :-: | :-: |
| C1 | **Huruf pilihan tidak cocok dengan urutan tampil.** Opsi diacak (`acakOpsi`), tetapi labelnya `String.fromCharCode(65 + indeks)` memakai indeks **asli**. Jadi opsi pertama di layar bisa berlabel "C", dan dua soal yang sama bisa berlabel berbeda tiap kali dimainkan. | `QuizCatur.jsx:543, 561` → `posisiTampil` | Membingungkan saat menjawab & saat menyebut jawaban ("jawabannya C") | Sedang | ✅ |
| C2 | `URUTAN_KATEGORI.indexOf(…) ?? 99` — `indexOf` mengembalikan `-1`, bukan `null/undefined`, sehingga `?? 99` tidak pernah berlaku: kategori tak dikenal justru diurut **paling atas**. | `QuizCatur.jsx:123-127` | Laten (semua kategori kini dikenal), tetapi menjebak saat menambah kategori baru | Rendah | ✅ |
| C3 | **Soal #98 faktual ambigu:** "Kontrol waktu **10 menit** tanpa increment umumnya dikategorikan sebagai?" dengan kunci **Blitz**. FIDE menyebut 10 menit blitz, tetapi Chess.com/Lichess menyebutnya **Rapid** — dan pilihan "Rapid" tersedia sebagai pengecoh. | `daftar.js:676-678` → diubah menjadi "**5 menit** tanpa increment" | Soal mengajarkan istilah yang bisa dinilai salah oleh pemain dari dua platform terbesar | **Sedang** | ✅ |
| C4 | Definisi **skewer terbalik**: "menyerang bidak bernilai tinggi **di belakang** bidak yang lebih rendah". Pada skewer, bidak bernilai tinggi yang diserang ada di **depan**, bidak bernilai rendah di belakangnya yang menjadi sasaran. | `daftar.js:298` → kalimat diperbaiki (kunci jawaban tetap "Skewer") | Soal menguji pemahaman dengan definisi yang salah | Sedang | ✅ |
| C5 | Teks mentah `Lisensi & Atribusi` dan `versi: 0.1.0 Beta` (tanpa kamus, tanpa kunci). | `QuizCatur.jsx:335, 337` → `papan.menuAtribusi`, kunci baru `quiz.versi` | Mode EN menampilkan teks Indonesia | Rendah | ✅ |
| C6 | Ekspresi mati `benarSekarang ? benar + 1 : benar` berada di cabang yang selalu `false` (`!benarSekarang`) — menyesatkan pembaca berikutnya. | `QuizCatur.jsx:174` → `catatHasil(benar, …)` | Kebersihan/kejelasan | Rendah | ✅ |
| C7 | `uji:quiz` hanya memvalidasi soal (tidak memeriksa ikon) dan **tidak ikut rantai `npm run uji`** (hanya di gerbang rilis) — padahal temuan Tinggi audit sebelumnya (C1 lama: 4 kategori tanpa ikon → 40 soal tanpa ikon) lahir dari celah ini. | `scripts/uji-quiz.mjs`, `package.json` | Regresi ikon tidak tertangkap di CI utama | Sedang | ✅ `uji:quiz` diperluas (setiap kategori wajib punya ikon + berkasnya ada di `public/`) dan dimasukkan ke rantai `uji` |
| C8 | **Terverifikasi benar**: 100 soal / 10 kategori, distribusi per kategori sesuai, tidak ada pertanyaan duplikat, `kunci` selalu indeks sah, pilihan tidak duplikat. Seluruh 100 soal dibaca isinya; hanya #37 (kini C4) dan #98 (kini C3) yang bermasalah. | `daftar.js`, `scripts/uji-quiz.mjs` | — | — | ✅ (diperiksa) |
| C9 | Papan peringkat Kuis masih **lokal** (`localStorage`), berbeda dari Rush yang punya API + tiket. | `QuizCatur.jsx:12, 180-190` | Bukan bug; catatan desain yang sudah dilaporkan audit sebelumnya (C5 lama) dan belum diputuskan | Rendah | ⚠️ dilaporkan |

---

## 6. D. Report Analisa (landing)

`src/halaman/ProgramKami/AnalisaLanding.jsx` (6,9 KB) sudah sepenuhnya lewat kamus (`analisaLanding.*`),
asetnya ada (`ProgramKami/analisa-hero.webp`, `PapanAnalysa.webp`, `MoveEvaluation/*.png`), dan CTA mengarah ke
`/program-kami/analisa/papan`. **Tidak ada temuan baru** pada berkas ini.

Catatan cakupan: mesin Analisa yang sesungguhnya (`PapanInteraktif.jsx` + `gunakanEngineCatur.js`, ribuan baris)
**bukan** bagian pass ini; ia sudah punya rangkaian ujinya sendiri (`uji:analisa`, `uji:analisa-ui`,
`uji:engine`, `uji:analisa-menyeluruh`) yang semuanya lulus di rantai `npm run uji`. Bila ingin pembacaan 100%
seperti Teka-teki, itu pass tersendiri.

---

## 7. E. Pembukaan

| # | Pemeriksaan | Hasil |
| :-: | --- | --- |
| E1 | Katalog 72 baris di `Pembukaan.jsx` (`KATALOG`) vs `public/data/buku-pembukaan.json` | **0 ketidakcocokan** untuk 72 keluarga teratas; berkas JSON memuat 18.713 jalur / 155 keluarga (subset yang dipublikasikan — bukan bug) |
| E2 | Papan `cg-*` buatan sendiri (`<cg-container>`, `<cg-board>`, `<piece>`) | **Bergaya benar** — `src/index.css:1522-1589` mendefinisikan `.cg-wrap`, `cg-board` (papan catur 8×8 lewat `repeating-conic-gradient`), `cg-board > piece` (12,5% + `position:absolute`), dan citra bidak per warna/jenis. Hipotesis "papan tanpa gaya" **tertutup** |
| E3 | Temuan audit sebelumnya D1–D3 (`Sejarah` hardcode, kandidat langkah hardcode, matriks Ruy Lopez manual) | Sudah tidak relevan: halaman ini sudah ditulis ulang — 22 pemanggilan `t("bukuPembukaan.*")`, tidak ada simpul teks Indonesia. Matriks `POSISI_MINI`/`POSISI_UTAMA` kini murni **dekoratif** (posisi rancangan, bukan FEN sah), jadi usulan lama "parse dengan chess.js" tidak berlaku |
| E4 | Uji rute & jumlah 36 papan mini | `npm run uji:rute` (39 rute) + `tests/e2e/pembukaan.spec.js` ada; e2e belum dijalankan di lingkungan ini (lihat batasan) |

---

## 8. F. E-Book & Panduan

| # | Temuan | Lokasi | Dampak | Prioritas | Status |
| :-: | --- | --- | --- | :-: | :-: |
| F1 | Placeholder formulir gerbang unduh ditulis mentah berbahasa Indonesia: `cth. Budi Santoso`, `cth. budichess99`, `cth. EBK-7F3K2M9Q` — dan grup kamus `unduhEbook` **tidak punya kunci placeholder sama sekali**. | `ModalUnduhEbook.jsx:318, 335, 353` → kunci baru `unduhEbook.placeholderNama/placeholderAkun/placeholderKode` | Mode EN menampilkan contoh berbahasa Indonesia | Sedang | ✅ |
| F2 | **Tiket & identitas tidak dipersistensi.** Setelah `tebusUnduhanEbook` berhasil, tiket hanya hidup di state (`pdfAktif.tiketUnduh`) dan nama/akun pemohon langsung dibuang; tidak ada `localStorage`/`sessionStorage` di modul E-Book mana pun. | `EbookPanduan.jsx`, `ModalUnduhEbook.jsx` → modul baru `src/lib/sesiUnduhEbook.js` | Setiap buku & setiap muat ulang halaman meminta nama, akun, dan kode lagi; alur "Baca → tutup → Baca buku lain" terasa berulang | Sedang | ✅ putaran 2 |
| F3 | Hipotesis "komponen `FiturEbook` tidak ada" | **Salah** — berkasnya ada (`FiturEbook.jsx`, 8,3 KB) dan dipakai di `EbookPanduan.jsx:340`, seluruh teksnya lewat kamus `fiturEbook.*` | — | — | ✅ (dibersihkan) |
| F4 | Alur gerbang & pembaca | Terverifikasi dari kode: `unduhDenganTiket` hanya melewati gerbang bila `buku.tiketUnduh` ada (kalau tidak → popup), `Esc` hanya menutup pembaca PDF sementara popup unduh terbuka, `sumberEbook`/`urlEbook` selalu membawa tiket (proxy same-origin), dan uji repo (`uji-ebook` 32 entri/32 PDF, `uji-ebook-pembaca` 22 pemeriksaan, termasuk callback `padaGagal`) lulus | — | — | ✅ (diperiksa) |

**F2 dikerjakan (putaran 2).** Modul baru `src/lib/sesiUnduhEbook.js` (182 baris, bebas DOM) menyimpan di
`sessionStorage` — hilang saat tab ditutup, sesuai umur tiket:
`kci-ebook-pemohon` = `{nama, akun}`, dan `kci-ebook-tiket:<berkas>` = tiket HMAC per berkas. Sasaran yang dicapai:

1. **Tiket dipakai ulang, bukan diperbarui tanpa henti.** Umur tiket dibaca dari muatan token
   (`kci-ebook-v1.<base64url>.<ttd>`, berlaku 15 menit — `server/src/tiket-ebook.js`). Tiket dengan sisa <60 detik
   dianggap tidak layak, sehingga server tidak pernah menolak unduhan di tengah jalan.
2. **"Baca" pada buku yang tiketnya masih hidup tidak lagi menembus gerbang kode** — tidak ada pengetikan ulang
   dan tidak ada penambahan hitungan unduhan di dashboard pengurus untuk kode yang sama. Nama/akun tetap terisi
   dari sesi. "Unduh" sengaja **tetap** melewati gerbang agar setiap pengunduhan tercatat.
3. **Kegagalan tiket punya jalan keluar.** `PembacaPdf` kini punya callback `padaGagal` (`PembacaPdf.jsx`) yang
   dipanggil tepat sekali setelah **semua** sumber gagal; halaman e-book memakainya untuk membuang tiket sesi yang
   basi, sehingga percobaan berikutnya langsung menuju gerbang kode. Callback ini **tidak** mengubah `sumber`
   (prop yang juga menjadi dependensi efek pemuatan) — kalau diubah, pemuatan akan berputar tanpa henti; uji
   menuntut tepat 2 percobaan (satu per sumber) walau `padaGagal` sudah dipanggil.
4. **Unduh dari dalam pembaca tidak lagi mengirim tautan mati.** `unduhDenganTiket` memverifikasi dulu
   (`tiketBelumKedaluwarsa` → tiket sesi), baru mengunduh; kalau tiket sudah habis ia membuka gerbang kode alih-alih
   mengirim berkas JSON galat 403 ke peramban pemain.

Catatan privasi: yang disimpan hanyalah nama tampilan + akun Chess.com yang sudah diketik pemain sendiri, di
`sessionStorage` (bukan `localStorage`), dan hanya untuk berkas yang benar-benar dibuka. Kode akses **tidak pernah**
disimpan.

---

## 9. Status temuan audit sebelumnya (`docs/REVIEW-PERBAIKAN-LATIHAN.md`, commit `6a97a59`)

Diverifikasi satu per satu terhadap kode saat ini:

| # | Temuan lama | Status sekarang | Bukti |
| --- | --- | --- | --- |
| A1 | Langkah penutup menerima skakmat apa pun | Berubah (kini **ketat**: harus persis solusi) → lihat temuan baru A14 | Komentar + kode `TekaTeki.jsx:741-752` |
| A2 | `parseLangkah`/`terapkan` terduplikasi | **Beres** | `src/lib/tekaTeki.js` dipakai kedua halaman |
| A3/B2 | `catch {}` senyap pada `localStorage` | **Beres** | helper `coba(…)` di `src/lib/utils.js`, dipakai kedua halaman |
| A4 | `keAwalLangkah` menyalin 14 setter | **Beres** | `terapkanSoal(m, { pertahankanSelesai })` |
| A5 | `eslint-disable exhaustive-deps` tanpa alasan | **Beres** | setiap `disable` kini disertai daftar dependensi tersembunyi |
| A6 | `bukaPengaturan` state mati (Tinggi) | **Beres** | state di komponen halaman, dikirim ke layout; pintasan panah terkunci (`blokir`) |
| B1 | Logika inti Rush paralel | **Sebagian** — `parseLangkah`/`terapkan`/`apakahLangkahSesuai` dibagi; `cobaLangkah` sengaja terpisah (kebijakan skor/nyawa) | `src/lib/tekaTeki.js` (komentar kebijakan) |
| B3 | Dependensi `promo` tak terpakai di Rush | Belum diverifikasi ulang di pass ini (di luar prioritas) | — |
| C1 | 4 kategori tanpa ikon (Tinggi) | **Beres** | `daftar.js:43-54` lengkap 10 kategori + fallback `IKON_KATEGORI.semua`; kini dijaga `uji:quiz` |
| C2 | Penulisan `localStorage` ganda | **Beres** | `catatHasil` hanya memperbarui state; efek persistensi menulis |
| C3 | Dedup peringkat di dua tempat | **Beres** | `src/lib/peringkatKuis.js` (`gabungPeringkat`) |
| C6 | `uji:quiz` tak ikut rantai `uji` | **Beres di pass ini** | `package.json` + pemeriksaan ikon baru |
| D1–D3 | Teks Pembukaan hardcode | **Beres / tidak relevan** | halaman ditulis ulang (lihat §7 E3) |

---

## 10. Perubahan berkas pada pass ini

| Berkas | Isi perubahan |
| --- | --- |
| `src/components/PageLayout.jsx` | `TANPA_KERANGKA` → daftar awalan + `tanpaKerangkaPath()` (A1) |
| `src/halaman/TekaTeki/TekaTeki.jsx` | Label kamus (A2–A7), lencana buku (A9), Syzygy (A10), lanjut otomatis (A11), gerbang petunjuk (A12), promosi defensif (A13), `KUNCI_LEVEL`, `versiBuku`, `jumlahBidakFen`, prop baru `nilaiTotalSoal`/`syzygyMemuat`/`syzygyGagal` |
| `src/halaman/TekaTeki/PapanTekaTeki.jsx` | Tooltip lencana lewat kamus (A8) + helper `labelIkonLangkah` |
| `src/halaman/TekaTekiRush/TekaTekiRush.jsx` | Label suara dari kamus, tombol Mulai tanpa `setTimeout` nyasar (B1, B2) |
| `src/halaman/QuizCatur/QuizCatur.jsx` | Huruf opsi ikut urutan tampil, `indexOf ?? 99`, label kamus, ekspresi mati (C1, C2, C5, C6) |
| `src/halaman/QuizCatur/daftar.js` | Soal #98 (10 → 5 menit) dan definisi skewer (C3, C4) |
| `src/halaman/ProgramKami/ModalUnduhEbook.jsx` | Placeholder lewat kamus (F1) |
| `src/lib/terjemahan/{id,en}/tekaTeki.js` | Kunci baru `mainkanSaran`, `tabAtribusi` |
| `src/lib/terjemahan/{id,en}/papan.js` | Kunci baru `ikonLangkah.*`, `ikonSkakmat`, `ikonMahkota` |
| `src/lib/terjemahan/{id,en}/quiz.js` | Kunci baru `versi` |
| `src/lib/terjemahan/{id,en}/program.js` | Kunci baru `unduhEbook.placeholderNama/placeholderAkun/placeholderKode` |
| `scripts/uji-teka-teki-alur.mjs` | **Baru** — alur halaman Teka-teki (54 pemeriksaan) |
| `scripts/uji-kerangka-layar-penuh.mjs` | **Baru** — header/footer per rute (12 pemeriksaan) |
| `scripts/uji-quiz.mjs` | Pemeriksaan ikon kategori + keberadaan berkasnya (C7) |
| `package.json` | `uji:tekateki-alur`, `uji:kerangka-penuh`; keduanya + `uji:quiz` masuk rantai `uji` |
| `docs/PETA-KODE.md`, `.agents/skills/…`, `.opencode/skills/…` | Regenerasi peta kode + pencatatan dua skrip uji baru (penjaga `uji:peta`) |

**Yang diuji `uji-teka-teki-alur.mjs`** (ringkas): pemuatan data & soal pertama; 64 petak terbaca dari
`aria-label`; langkah benar → balasan mesin → skakmat; soai salah → pesan; promosi lewat dialog; petunjuk;
navigasi `|< ◀ ▶ >|` + papan ketik; saringan Level/Tema/Giliran/Langkah; input nomor (rentang dinamis, aria);
Lewati/Acak; soal salah → pesan; **tidak menembak tablebase untuk posisi >7 bidak** dan tetap menembak untuk ≤7 bidak; lanjut
otomatis tidak menyerobot peninjauan; locale EN bebas teks Indonesia; 0 galat render React sepanjang alur.

### 10.1 Putaran 2 (2026-10-07)

| Berkas | Isi perubahan |
| --- | --- |
| `src/lib/tekaTeki.js` | Fungsi murni `apakahSkakmat(fen, {from,to,promo})` (A14) |
| `src/halaman/TekaTeki/TekaTeki.jsx` | `KUNCI_TIPE` berawalan kamus + badge tipe (A15/A20), pesan skakmat alternatif (A14), preferensi & UI "Ingat posisi" (A16) |
| `src/lib/terjemahan/{id,en}/tekaTeki.js` | Kunci baru `mateAlternatif` (paritas 2.554 = 2.554) |
| `src/lib/api/rekorRush.js`, `src/lib/api/turnamen.js` | Retry sekali pada 403 `token-csrf` (B3) |
| `src/lib/sesiUnduhEbook.js` | **Baru** — sesi pemohon e-book: `{nama, akun}` + tiket per berkas dengan pemeriksaan umur (F2) |
| `src/components/PembacaPdf.jsx` | Prop opsional `padaGagal` (dipanggil tepat sekali setelah semua sumber gagal) (F2) |
| `src/halaman/ProgramKami/EbookPanduan.jsx` | Tiket sesi membuka pembaca langsung, `padaGagal` membuang tiket basi, `unduhDenganTiket` memverifikasi tiket (F2) |
| `src/halaman/ProgramKami/ModalUnduhEbook.jsx` | Mode "sudah punya tiket", isian nama/akun dari sesi, simpan sesi setelah tebus/minta kode (F2) |
| `scripts/uji-teka-teki-alur.mjs` | +12 pemeriksaan: badge tipe, sakelar "Ingat posisi", pesan skakmat alternatif (54 → 66) |
| `scripts/uji-tekateki-solusi.mjs` | Kebijakan pesan mate alternatif (8 → 10 pemeriksaan) |
| `scripts/uji-ebook-pembaca.mjs` | `padaGagal` tepat sekali + tanpa pemuatan berulang (F2) |
| `scripts/uji-api-csrf.mjs` | **Baru** — 6 pemeriksaan jalur 403-CSRF (B3) |
| `scripts/uji-sesi-ebook.mjs` | **Baru** — 14 pemeriksaan modul sesi e-book (F2) |
| `package.json` | `uji:api-csrf` dan `uji:sesi-ebook` masuk rantai `uji` + gerbang rilis |
| `docs/PETA-KODE.md`, `.agents/skills/…`, `.opencode/skills/…` | Peta kode diregenerasi; nama dua skrip uji baru dicatat (penjaga `uji:peta` 14 lulus) |

---

## 11. Cara verifikasi ulang

```bash
npm ci                                     # lingkungan bersih
node scripts/uji-teka-teki-alur.mjs        # harap: "66 lulus, 0 gagal"
node scripts/uji-tekateki-solusi.mjs       # harap: "10 lulus, 0 gagal"
node scripts/uji-kerangka-layar-penuh.mjs  # harap: "12 lulus, 0 gagal"
node scripts/uji-api-csrf.mjs              # harap: "6 lulus, 0 gagal"
node scripts/uji-sesi-ebook.mjs            # harap: "14 lulus, 0 gagal"
node scripts/uji-ebook-pembaca.mjs         # harap: "22 lulus, 0 gagal"
node scripts/uji-integritas-suite.mjs      # harap: "8 lulus, 0 gagal"
npm run uji:quiz                           # harap: "100 soal valid" + ikon lengkap
npm run uji                                # rantai penuh, harap EXIT=0
npm run uji:i18n                           # harap: 2554 kunci ID = 2554 kunci EN
npm run uji:peta                           # harap: "LULUS: 14 lulus, 0 gagal"
npm run build                              # harap EXIT=0
npm run uji:e2e                            # WAJIB di mesin berperamban (belum dijalankan di sini)
```

---

## 12. Langkah berikutnya (usulan urutan)

**Sudah selesai pada putaran 2:** A14, A15, A16 (Teka-teki), B3 (CSRF), F2 (sesi e-book). Yang tersisa bersifat
keputusan produk atau pass tersendiri, bukan cacat yang menghalangi:

2. **Kuis: keputusan C9** (peringkat lokal vs daring) — pola Rush (`rekor-rush.js` + tiket) sudah tersedia bila
   ingin dijadikan daring.
3. **Rapikan sisa literal rendah risiko:** label `Engine` di `TekaTeki.jsx:2462`, `Blunder`/`Skuad` di
   `TekaTekiRush.jsx`/`QuizCatur.jsx`, dan prop `sedangSeret` yang tidak terpakai (A17) — hanya kebersihan.
4. **A18/A19** (soal tidak berganti saat parameter rute diubah; penomoran mengikuti saringan) — perlu keputusan
   produk, dampaknya praktis nol karena navigasi internal selalu memakai `replace`.
5. **Jalankan `npm run uji:e2e`** di mesin berperamban. Lingkungan ini tidak punya Chromium (unduhan diblokir),
   jadi seluruh bukti di dokumen ini berasal dari lapisan jsdom + kode — jangan menggantikan e2e daring.
6. Bila diinginkan kedalaman yang sama untuk **Report Analisa**, jadwalkan pass tersendiri atas
   `PapanInteraktif.jsx` + `gunakanEngineCatur.js` (mesin Analisa, berkas terbesar di repo ini).
