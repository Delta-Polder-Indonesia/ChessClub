# Animasi bidak "seperti roket" — apa yang terukur, apa yang diperbaiki

Tanggal: 15 Okt 2026 · Cabang: `arena/4b1602dd-chessclub`
Referensi kebenaran: **isepic-chess-ui** (`_animatePiece`, `_CFG.animationTime`)

---

## 1. Ringkasan

Permintaan: luncuran bidak harus terasa seperti isepic-chess-ui, bukan
"melesat seperti roket, kaku".

Yang saya lakukan: **mengukur animasinya di peramban sungguhan** (Chromium
153, bukan jsdom, bukan pembacaan kode), membandingkannya satu-per-satu
dengan isepic, menelusuri riwayat commit untuk mencari sumber gayanya, lalu
memperbaiki sisa papan yang masih memakai gaya "roket" + menambah uji penjaga
supaya tidak bisa kembali.

Hasil pengukuran satu run (skrip yang sama, peramban yang sama):

| | Papan kita (`/papan-interaktif`) | isepic-chess-ui |
| --- | --- | --- |
| Durasi transisi CSS | `0.3s` | `0.3s` |
| Kurva CSS | `ease` | `ease` |
| Durasi terukur (frame) | **295 ms** | **294 ms** |
| Jarak | 119,3 px (2,27 petak) | 135,1 px (1,99 petak) |
| Kurva p(t) | 46ms=11% · 112ms=58% · 178ms=85% · 245ms=97% | 60ms=22% · 127ms=67% · 194ms=89% · 260ms=99% |
| Vonis | ✓ sama dengan isepic | ✓ (referensi) |

→ Pada kode `main` hari ini, luncuran papan bersama **sudah identik** dengan
isepic. Karena itu keluhan "roket" tidak bisa dijelaskan oleh kode `main`
sekarang — penjelasan yang cocok dengan riwayat ada di §3.

---

## 2. Bagaimana ini diukur (bisa Anda ulangi)

Satu skrip, satu peramban, kedua situs sekaligus:

```bash
CHROME_EXE=/usr/bin/google-chrome node docs/riset-isepic/ukur-animasi-peramban.mjs \
  http://localhost:5173/papan-interaktif http://localhost:5173/isepic/index.html
```

Skrip membuka halaman, mengklik `e2` lalu `e4` dengan event mouse asli,
mencatat posisi elemen luncuran **setiap frame** (`requestAnimationFrame`),
lalu melaporkan durasi, kurva, jarak, kecepatan puncak, dan grafik p(t).
Ada juga snippet tempel-di-Console (`docs/riset-isepic/cek-animasi-konsol.js`)
untuk mengukur langsung di perangkat Anda. Petunjuk: lihat
`docs/riset-isepic/VERIFIKASI-ANIMASI.md`.

Dua uji tambahan yang saya jalankan:

- **Setelan sistem "kurangi gerak"**: dengan `prefers-reduced-motion: reduce`
  dipaksa, luncuran tetap `0.3s` dan menempuh 119,3 px selama 286 ms — jadi
  komentar di kode ("tidak dipangkas oleh setelan kurangi gerak") **benar**,
  dan setelan ini bukan penyebab keluhan.
- **Pemeriksaan tiap frame**: selama penerbangan, klon muncul di petak asal
  sejak frame pertama, tiba di petak tujuan pada frame ke-317 ms, lalu bidak
  asli muncul pada frame ke-338 ms — tidak ada frame kosong, tidak ada bidak
  ganda, tidak ada lompatan (laporan: `docs/riset-isepic/`+ skrip di §6).

---

## 3. Kenapa ia pernah terasa seperti roket — jejak commit

Riwayat berkas `src/halaman/TekaTeki/animasiBidak.js` (via GitHub API):

| Waktu (UTC) | Commit | Perubahan |
| --- | --- | --- |
| 26 Sep 2026 08:50 | `af3d5799` | Papan bersama: bidak meluncur saat langkah (bukan berkedip) |
| 26 Sep 2026 09:00 | `3544cad5` | Luncuran dibuat lebih santai (180 ms → 320 ms) |
| **8 Okt 2026 21:32** | **`ee2a3319`** | **"Papan Interaktif: luncuran bidak memakai gaya Report Analisa"** — inilah gaya `duration: 150, easing: "linear"`: dua kali lebih cepat dan **tanpa melandai** (kaku, terasa "dilesatkan") |
| 15 Okt 2026 02:49 | `ab906ebd` | "samakan luncuran isepic (300ms ease) di **semua mode**" — dibalik |
| 15 Okt 2026 03:57 | `a6a1c6fd` | Merge PR #190 → `main`; Vercel melaporkan sukses 03:58 UTC |

Kata "roket, terlalu cepat, kaku" adalah deskripsi tepat untuk
`150 ms linear`: kecepatan rata-ratanya dua kali lipat, dan karena kurvanya
linear ia mulai melesat seketika tanpa naik-turun kecepatan. Gaya itu hidup di
papan bersama sejak 8 Okt sampai merge hari ini (± 10:58 WIB).

**Yang belum diperbaiki oleh merge itu:** papan Report Analisa
(`src/halaman/Analisa/komponen/game/board.jsx`) masih memakai
`{ duration: 150, easing: "linear" }` di `animateMove` — papan sumber dari
gaya roket itu sendiri masih roket. Itu yang saya perbaiki sekarang.

---

## 4. Perubahan yang dibuat

1. **`src/halaman/TekaTeki/animasiBidak.js`**
   - Konstanta baru `GESER_ISEPIC = { durasi: 300, kurva: "ease" }` sebagai
     **satu-satunya sumber** kecepatan luncuran bidak untuk seluruh situs,
     dengan catatan sejarah mengapa nilainya dikunci.
   - `GAYA_ANALISA` (150 ms linear) ditandai **warisan**: disimpan sebagai
     rujukan gaya, tanpa pemanggil produksi.

2. **`src/halaman/TekaTeki/PapanTekaTeki.jsx`**
   - Klon luncuran kini menulis kurva **eksplisit**:
     `transition: top 300ms ease, left 300ms ease` (sebelumnya tanpa kurva,
     mengandalkan nilai bawaan CSS). Efek visualnya sama, tetapi nilainya jadi
     kebal terhadap perubahan/hilangnya bawaan akibat CSS global atau setelan
     peramban, dan terbaca jelas di DevTools.
   - Durasi & timer pengaman membaca `GESER_ISEPIC`.

3. **`src/halaman/Analisa/komponen/game/board.jsx`** (papan Report Analisa)
   - `animateMove`: `duration: 150, easing: "linear"` →
     `duration: GESER_ISEPIC.durasi, easing: GESER_ISEPIC.kurva` (300 ms ease).
   - Ini papan terakhir di situs yang masih memakai gaya roket.

4. **`scripts/uji-animasi-bidak.mjs` — penjaga baru "anti-roket" (seksi A2)**
   - Menolak animasi bidak berdurasi < 300 ms, menolak kurva `linear`, dan
     menolak lewat if ada halaman yang memaksa prop `gayaGeser="analisa"`.
   - Diuji juga bahwa kedua berkas papan benar-benar membaca `GESER_ISEPIC`.
   - Sifatnya statis (membaca sumber) sehingga menangkap penyimpangan yang
     tidak terlihat oleh uji render jsdom.

5. **Alat verifikasi baru** (dipakai untuk seluruh angka di laporan ini)
   - `docs/riset-isepic/ukur-animasi-peramban.mjs` — ukur peramban sungguhan.
   - `docs/riset-isepic/cek-animasi-konsol.js` — tempel di DevTools Console.
   - `docs/riset-isepic/VERIFIKASI-ANIMASI.md` — cara pakai + arti vonis.

---

## 5. Yang TIDAK bisa saya buktikan dari sini (supaya tidak ada tebakan)

- **Bundel yang dimuat peramban Anda.** Sandbox saya tidak bisa membuka
  `*.vercel.app` (koneksi ditolak), jadi saya **tidak** bisa mengklaim isi
  bundel produksi baris per baris. Yang saya tahu pasti: Vercel melaporkan
  deployment commit `a6a1c6fd` sukses pada 03:58 UTC (≈10:58 WIB) — dan
  `a6a1c6fd` sudah memuat luncuran 300 ms ease.
- **Halaman mana yang Anda uji.** Kalau yang Anda uji adalah Report Analisa,
  penyebabnya jelas dan sudah diperbaiki. Kalau `/papan-interaktif` dan
  halamannya dimuat dari bundel lama (tab lama, cache), penyebabnya bundel
  itu — bukan kode `main`.
- **Selera.** isepic sendiri memakai 300 ms ease untuk semua langkah. Jadi
  kalau setelah muat ulang paksa gerakannya tetap terasa cepat, itu bukan
  penyimpangan dari isepic — melainkan permintaan gaya yang berbeda. Sebutkan
  angkanya (mis. 400 ms), dan itu perubahan sadar **menyimpang** dari isepic.

---

## 6. Langkah untuk Anda (2 menit)

1. Buka halaman papannya, tekan `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac).
2. Tempel `docs/riset-isepic/cek-animasi-konsol.js` di DevTools Console, lalu
   klik `e2` → `e4`.
3. Kirim ke saya baris vonis + tabelnya.
   - `✓ 300 ms ease` → sudah benar; bila masih terasa cepat, sebutkan durasi
     yang Anda mau.
   - `⚠ MENYIMPANG / 150 ms / linear` → berarti peramban masih memuat bundel
     lama; saya perlu tahu halaman + peramban + apakah dev server atau
     produksi.
   - `✗ tidak ada luncuran` → kasus baru, kirim hasilnya, saya telusuri.

Kalau ingin membandingkan langsung dengan isepic di komputer Anda:

```bash
git clone --depth 1 https://github.com/ajax333221/isepic-chess-ui.git /tmp/isepic-src
CHROME_EXE=/usr/bin/google-chrome node docs/riset-isepic/ukur-animasi-peramban.mjs \
  http://localhost:5173/papan-interaktif http://localhost:5173/isepic/index.html
```

---

## 7. Uji yang dijalankan (semua hijau)

| Perintah | Hasil |
| --- | --- |
| `node scripts/uji-animasi-bidak.mjs` | 56 lulus, 0 gagal (termasuk 7 pemeriksaan penjaga A2 baru) |
| `npm run uji:integritas-suite` | 9 lulus, 0 gagal |
| `npm run uji:analisa-ui` | 101 pemeriksaan lulus |
| `npm run uji:render-bidak` | 70 lulus, 0 gagal |
| `npm run uji:pratinjau-langkah` | 11 lulus, 0 gagal |
| `npm run uji:tanda-papan` | 26 lulus, 0 gagal |
| `npm run uji:gestur-lawan` | 47 lulus, 0 gagal |
| `npm run build` | sukses; bundel tidak lagi memuat animasi bidak 150 ms linear |

Artefak pengukuran mentah: jalankan skrip §2 dengan `--json=hasil-animasi.json`
di komputer Anda; di sandbox, angka di laporan ini datang dari run nyata yang
sama.

---

## 8. Temuan baru: luncuran DIPOTONG saat posisi berubah lagi (diperbaiki)

Setelah laporan di atas, keluhan berlanjut ("masih melesat, tidak halus"). Penelusuran
lanjutan lewat perekaman di peramban menemukan cacat yang sebelumnya terlewat:

**Kode lama** (`PapanTekaTeki.jsx`):

```js
// FEN benar-benar berubah: tidak boleh ada sisa klon dari langkah
// sebelumnya (satu langkah = satu penerbangan, seperti isepic).
if (fenLama !== fen) batalkanKlonTerbang();
```

Setiap perubahan posisi membuang **semua** klon yang sedang terbang dan
langsung menampilkan bidak aslinya. Jadi begitu ada pembaruan posisi kedua
(balasan mesin, langkah kedua, penyesuaian analisa) yang tiba **di tengah
luncuran 300 ms**, luncuran itu dipotong dan bidak "dilempar" ke petak
tujuannya — bagian paling halus dari kurva `ease` (pendaratan yang melandai)
hilang. Terukur di peramban: luncuran yang seharusnya 300 ms hanya bertahan
**184 ms** (≈41 fps terasa seperti lompatan).

isepic tidak berperilaku begitu: klon-nya hidup di DOM dan menyelesaikan
`_CFG.animationTime`-nya sendiri, tidak peduli render berikutnya.

**Perbaikan:**

- Klon yang sedang terbang **tidak lagi dipotong** oleh posisi baru.
- Klon hanya diselesaikan lebih awal bila petak tujuannya kini berisi bidak
  **lain** (bidaknya tertangkap/diganti) — supaya tidak mendarat di atas bidak
  yang salah.
- Bila posisi diganti sepenuhnya (soal baru / muat FEN, tanpa luncuran yang
  sah), semua klon tetap dibuang seperti sebelumnya.
- Bidak asli di petak tujuan disembunyikan ulang pada **setiap render** —
  React bisa mengganti elemen bidak di tengah luncuran, dan elemen baru itu
  harus ikut tersembunyi (kalau tidak, bidak tampak sudah "sampai" padahal
  klonnya masih di udara).
- Bila dua penerbangan menuju petak yang sama tumpang tindih, yang lama
  diselesaikan lebih dulu.

**Bukti:** uji baru di `scripts/uji-animasi-bidak.mjs` ("balasan cepat TIDAK
memotong luncuran yang sedang berjalan") **gagal 2 pemeriksaan pada kode lama**
dan lulus pada kode baru — jadi cacatnya nyata dan terjaga. Setelah perbaikan,
perekaman di peramban (MutationObserver + `transitionend`) menunjukkan klon
hidup **310 ms** penuh (tambah 363,8 ms → hapus 674,1 ms), bukan 184 ms.

Timing rinci di mesin pengembangan (Chromium, /papan-interaktif):

| Skenario | Sebelum | Sesudah |
| --- | --- | --- |
| Klik e2→e4, mesin mati | 288–303 ms (utuh) | 288–303 ms (utuh) |
| Klik e2→e4, mesin nyala (posisi diperbarui lagi < 300 ms) | **184 ms (terpotong)** | **310 ms (utuh)** |
| Uji jsdom "balasan cepat" | 2 gagal | 62 lulus, 0 gagal |

Catatan jujur: pemotongan ini bergantung waktu (butuh pembaruan posisi kedua
yang tiba < 300 ms). Kalau di peramban Anda luncuran **masih** terasa melesat
saat mesin mati dan papan diam, penyebabnya bukan cacat ini — jalankan
`docs/riset-isepic/cek-animasi-konsol.js` (lihat `VERIFIKASI-ANIMASI.md`) dan
kirim tabelnya; itu memuat durasi, kurva, dan `prefers-reduced-motion` persis
dari peramban Anda.

## 9. Akar "bling" (bidak seperti berkedip, tidak terlihat pindah) — terukur & diperbaiki

Keluhan: *"e2 mau ke e4 itu seperti bling, kaya tidak seperti bidaknya pindah"*.
Bukan soal durasi atau kurva (keduanya sudah 300 ms / `ease` persis isepic),
melainkan **urutan kerja di main thread** saat klik.

### 9.1 Rantai sebab (semua angka hasil ukur, bukan dugaan)

Alat ukur baru (di `/tmp/browser`, tidak ikut ke repo):
`ukur-klon.cjs` (mengikuti **satu** klon yang ditandai, mencatat juga
`getAnimations().currentTime`), `jejak-klik.cjs` (trace DevTools),
`profil-slice.cjs` (bagi waktu main thread per kelompok), dan `lihat-layar.cjs`
(membaca **frame screencast dari compositor** — sumber kebenaran apa yang
benar-benar terlihat di layar).

1. **Jam transisi baru mulai pada frame pertama setelah gaya dipasang.**
   Eksperimen kendali (`uji-komit.cjs`, halaman kosong, transisi 300 ms +
   tugas sibuk 300 ms): setelah tugas selesai `currentTime` animasi masih **0**
   — luncuran tidak berjalan selama tidak ada frame yang dicat.
2. **Klik e2→e4 memicu tugas sinkron besar.** Trace DevTools CPU 1x:
   `performWorkUntilDeadline` (React) **57 ms dalam satu potong**, plus
   tata letak/cat halaman. Di CPU 6x potongan itu menjadi **287–416 ms**.
   Pembagian waktu (CPU 1x, jendela 0–900 ms): native (layout/cat/GC) 80,8 ms,
   React 48,9 ms, chess.js 30,7 ms, kode kita 15,8 ms.
3. **Sebagian tugas itu dulu disebabkan kode kita sendiri:** `void offsetWidth`
   (paksa-reflow) di `mulaiTerbang` memaksa browser menghitung ulang gaya +
   tata letak SELURUH `/papan-interaktif` (~39 ms di CPU 1x). isepic memakai
   trik itu di halaman yang sangat ringan; di halaman seberat ini ia justru
   menjadi bagian terbesar dari tugas yang membekukan luncuran.
4. **Akibatnya**: frame screencast CPU 6x menunjukkan bidak **beku total**
   selama tugas 287 ms (0 frame berubah), baru bergerak setelah tugas selesai
   — itulah yang mata baca sebagai "bling/kedip", bukan "pindah".

### 9.2 Yang dihapus / diubah

| Sebelum | Sesudah |
| --- | --- |
| `void klon.offsetWidth` (paksa-reflow seluruh halaman) di dalam handler klik | **dihapus**; klon dicat dulu di petak asal, gaya tujuan dipasang di frame berikutnya (dua `requestAnimationFrame`) |
| Kerja berat halaman berjalan satu frame setelah klik | **tiga frame** (klon tercat + transisi berjalan & di-commit) baru induk dipersilakan bekerja |
| Jaring pengaman dihitung dari klon dibuat | dihitung dari **saat gerak benar-benar mulai** (`+250 ms`), supaya tidak memotong luncuran yang tersendat |
| Klon langsung dibuang saat `transitionend` | klon yang **mendarat** tetap tinggal di petak tujuan sampai bidak aslinya dirender (mencegah kedipan baru saat render ditahan) |
| `/papan-interaktif`: render berat halaman berjalan di tengah luncuran | render **ditahan** (`tahanRenderSampaiRef`) + posisi **logis** (`fenLogisRef`) dipakai logika; state dirender setelah luncuran mendarat; interaksi apa pun melepas penahanan |

### 9.3 Hasil ukur sesudahnya (klon yang sama, CPU dilambatkan)

| Ukuran (CPU 6x) | Sebelum | Sesudah |
| --- | --- | --- |
| Frame klon terlihat (bergerak > 0,4 px) | 4 | **17** |
| Celah antar frame maks | 232–370 ms | **47 ms** |
| Tugas panjang di jendela luncuran | 160–416 ms **di tengah luncuran** | 340–530 ms **setelah luncuran** (≥ +456 ms) |
| Frame screencast yang berubah **saat tugas panjang** | 0 | **6** |
| Posisi akhir klon | `translate3d(0px, -119.5px, 0)` (petak e4) | sama |

Bandingkan isepic pada alat yang sama (CPU 6x): 16 frame bergerak, celah
sekitar 21 ms. Uji perilaku: pemain cepat (klik e2e4 lalu e7e5 dalam 120 ms)
tetap benar — dua langkah masuk, tidak ada bidak tersembunyi, tidak ada klon
tersisa (`cek-langkah-cepat.cjs`). Undo/redo juga tetap mulus.

### 9.4 Batas yang masih ada (jujur)

* Di ponsel/laptop yang sangat lambat, render berat halaman tetap ada — hanya
  saja sekarang ia berjalan **setelah** luncuran mendarat, bukan di tengahnya.
* Penahanan render dilepas begitu pemain menyentuh layar (klik/tekan
  apa pun): kehalusan luncuran mengalah demi ketepatan langkah pemain.
* Baris konsol `[kci] ErrorBoundary menangkap error:` dari sesi Anda masih
  belum bisa dilacak tanpa teks lengkap barisnya.
