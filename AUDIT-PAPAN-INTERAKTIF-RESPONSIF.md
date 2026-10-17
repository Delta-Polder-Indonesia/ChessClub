# Audit Papan Interaktif — Responsivitas & Kualitas

Tanggal: 2026-10-17 · Basis: cabang `arena/a3ae6f1e-chessclub` (dari `main` @ `9e3c5d8`)
Cakupan: `/papan-interaktif/*` — halaman Analisa papan (`PapanInteraktif.jsx`), tata letak
`Workspace.jsx`, `LayarPengaturan`, dialog, panel kanan, dan **satu keluarga komponen
bersama** (`PapanInteraktif/bersama/*`) yang juga dipakai mode Manusia vs Mesin,
Latihan Repertoar, Hand & Brain, dan Turing Test.

Dokumen ini adalah hasil **review + audit** dengan fokus **optimal kualitas agar responsif**
(desain responsif lintas layar + keterjangkauan UI di layar sempit), lalu diperbarui dengan
status perbaikan — semua temuan prioritas di bawah sudah dikerjakan pada hari yang sama (§7).

---

## 1. Ringkasan

| ID | Prioritas | Inti | Berkas | Status |
| --- | --- | --- | --- | --- |
| **R-1** | **P1** | Di layar portrait, panel kanan (navigasi langkah + tombol Baru/Simpan/Tinjau/Bagikan) **terpotong `overflow-hidden`** tanpa jalan menggulir — satu-satunya halaman di keluarga papan yang tidak punya alur gulir mobile | `PapanInteraktif.jsx` baris konten | **DIPERBAIKI** |
| **R-2** | **P1** | Tombol kontrol papan (gear/suara/flip) **menumpuk vertikal + `pt-14`** di mobile (~180 px tinggi terbuang), mendorong panel makin jauh ke bawah layar | `PapanInteraktif.jsx` | **DIPERBAIKI** |
| **R-3** | **P2** | Dialog **Input PGN/FEN** dan **Pengaturan Papan** tidak dapat digulir di layar pendek (tinggi isi > viewport → terpotong, tanpa `max-h`/scroll) | `MasukanPgn.jsx`, `PopupPengaturan.jsx` | **DIPERBAIKI** |
| **R-4** | **P2** | Label tab panel ("Penjelajah") bisa **meluber horizontal** di layar ≤ 320 px (kata panjang, `min-width: auto` flex) lalu terpotong `overflow-hidden` | `PapanInteraktif.jsx` tablist | **DIPERBAIKI** |
| **R-5** | **P2** | Dialog PGN memakai **teks keras Indonesia** ("Batal", "Muat", pesan galat, placeholder) — pengguna EN melihat campuran bahasa | `MasukanPgn.jsx` + kamus | **DIPERBAIKI** |
| **R-6** | **P2** | Layar Pengaturan: **kartu engine 128 px + form dua kolom** membuat input menyempit ±58 px di HP | `LayarPengaturan.jsx` | **DIPERBAIKI** |
| **K-1** | P3 | Kode mati + CPU mubazir: `_giliranKini` **membangun objek `Chess` tiap render** untuk hasil yang tak dipakai; `_salinFen`+state `fenTersalin`, `_statTampil`, `_jumlahNama` mati | `PapanInteraktif.jsx` | DIPERBAIKI |
| **K-2** | P3 | `npm run lint` gagal (helper tak terpakai `jumlahPapan`) | `docs/riset-isepic/uji-isepic-klik.mjs` | DIPERBAIKI |
| **K-3** | P3 | Label a11y `PratinjauLangkah` keras Indonesia | `PratinjauLangkah.jsx`, `DaftarRiwayat.jsx` | DIPERBAIKI |
| **U-1** | P3 | Regresi e2e: tombol aksi panel harus dapat dijangkau di viewport sempit (muat ATAU berada di wadah yang menggulir pengguna) + tanpa overflow horizontal | `tests/e2e/pembukaan.spec.js` | DITAMBAHKAN |

Yang **tidak** bermasalah (sudah diperiksa, §5): pola gulir mobile empat halaman mode lain,
papan `PapanTekaTeki` (`aspect-square`, `touch-action` saat seret), alignment bilah evaluasi
(`w-9` ↔ `pl-[42px]`), tabel panel dengan `overflow-x-auto`, sidebar Workspace, restart engine
hanya saat konfigurasi engine berubah, dan `useDialog` (focus trap + Escape + restore).

---

## 2. Cakupan & metode

Dibaca penuh: `PapanInteraktif.jsx` (±2.050 baris), `Workspace.jsx`, `LayarPengaturan.jsx`,
`PopupPengaturan.jsx`, `MasukanPgn.jsx`, `BukuPembukaan.jsx`, `KartuArtikelPembukaan.jsx`,
`DaftarRiwayat.jsx`, `LangkahExplorer.jsx`, `PanelBasisDataAwan.jsx`, `PratinjauLangkah.jsx`,
seluruh `bersama/*` (BarisProfil, BilahEvaluasi, TangkapanBidak(+Data), Tombol*, IkonTab,
PengaturanKonteks, gunakanDialog, gunakanPengaturanPapan, konstanta, utilPapan), pembanding
layout `ManusiaVsMesin.jsx`, `LatihanRepertoar.jsx`, `HandBrain.jsx`, `TuringTest/*`,
`src/lib/gunakanEngineCatur.js`, `tests/e2e/pembukaan.spec.js`, dan `scripts/uji-mobile.mjs`
(rumus ukuran papan Analisa sebagai pembanding).

Metode: audit statis rantai layout flex/overflow per breakpoint (mobile portrait 320–430 px,
tablet 768–1024, laptop pendek 1366×600), kalkulasi tinggi isi vs tinggi tersedia (mis. Pixel
5 393×851: isi ±817 px vs tersedia ±684 px sebelum perbaikan → terpotong ±133 px), pemeriksaan
konsistensi pola dengan empat halaman mode, lalu validasi suite jsdom + lint + build.

---

## 3. Temuan & bukti

### R-1 (P1) — Panel terpotong di mobile portrait, TANPA jalan menggulir

Rantai wadah `PapanInteraktif.jsx` memakai `overflow-hidden` di SEMUA breakpoint
(`main` → kolom `h-full` → baris konten → panel), sementara di <lg tata letaknya bertumpuk
vertikal:

- kolom papan `shrink-0`: ±419 px (papan 319 + dua baris profil) pada lebar 393 px;
- kolom kontrol `flex-col pt-14`: ±180 px (lihat R-2);
- panel (min-content tab bar + bottom bar): ±170 px;
- total ±817 px vs tinggi baris konten ±684 px (851 − sidebar 119 − `py-6` 48).

Akibatnya seluruh bottom bar panel (navigasi ◀▶ dan grid Baru/Simpan/Tinjau/Bagikan) terpotong
di luar layar dan **mustahil digulir** (overflow-hidden bukan wadah gulir pengguna). Empat
halaman mode (MvM, Repertoar, HandBrain, Turing) sudah benar: `overflow-x-hidden overflow-y-auto
… lg:overflow-hidden` pada kontainer grid mereka — halaman utama adalah satu-satunya yang lupa.

**Perbaikan:** baris konten memperoleh `overflow-x-hidden overflow-y-auto … lg:overflow-hidden`
(sepakat dengan pola mode lain). Di ≥lg perilaku identik dengan sebelumnya (tetap muat di
1366×600 & 1024×768 tanpa gulir — dijaga e2e lama `lajurBergulir === false`).

### R-2 (P1) — Kontrol papan menumpuk vertikal + padding desktop bocor ke mobile

`flex flex-col items-center gap-2 pt-14 lg:-ml-3` — di mobile tiga tombol (gear/suara/flip)
berdiri vertikal di bawah papan dengan `pt-14` (56 px ruang mati yang dimaksudkan untuk
penjajaran desktop), total ±180 px.

**Perbaikan:** `flex flex-row items-center justify-center gap-2 lg:-ml-3 lg:flex-col
lg:justify-start lg:pt-14` — bilah mendatar ±36 px di mobile; di ≥lg kelas menghasilkan susunan
yang **persis** sama dengan sebelumnya (kolom vertikal `pt-14`, `-ml-3`, rata tengah).

### R-3 (P2) — Dialog tidak dapat digulir di layar pendek

`MasukanPgn` & `PopupPengaturan`: overlay `fixed inset-0 flex items-center justify-center`
tanpa padding, dialog tanpa `max-h`. Isi `PopupPengaturan` (set bidak + 4 sakelar + kartu
komentator + tombol) melebihi tinggi viewport HP landscape / saat keyboard terbuka → terpotong.
Dialog MvM sudah memakai pola `p-4` pada overlay.

**Perbaikan:** overlay + `p-4`; dialog `max-h-[90dvh] overflow-y-auto` (terpusat saat muat,
menggulir sendiri saat tidak). Struktur `PopupPengaturan` sekalian dirapikan (indentasi acak).

### R-4 (P2) — Label tab panel meluber di layar sangat sempit

Empat tab `flex-1` dengan ikon + label kata panjang ("Penjelajah"); item flex punya
`min-width: auto` sehingga tidak bisa menyusut di bawah min-content → pada lebar ≤320 px
tablist meluber dan terpotong `overflow-hidden` induknya.

**Perbaikan:** `min-w-0` pada tombol + label dibungkus `<span class="min-w-0 truncate">`;
ikondiberi `shrink-0`. Normal tampil penuh; ekstrem memendek anggun ("Penjelaja…") alih-alih
terpotong kaku.

### R-5 (P2) — Dialog PGN tidak ter-i18n

"Batal", "Muat", "PGN/FEN tidak dapat dimuat — periksa kembali isinya.", dan placeholder PGN
ditulis keras di JSX.

**Perbaikan:** kunci baru `papan.pgnBatal`, `papan.pgnMuat`, `papan.pgnGalat`,
`papan.pgnPlaceholder` (+ `papan.pratinjauLabel` untuk K-3) di kamus id & en;
`uji:i18n` lulus (2.697 kunci ID = EN, 1.337 terpakai semua ada).

### R-6 (P2) — Form pengaturan engine menyempit di HP

Kartu engine `flex-row` berisi gambar `h-32 w-32 shrink-0` + form dua kolom: di 320 px sisa
±124 px untuk dua kolom input (±58 px/ekor).

**Perbaikan:** `flex flex-col items-stretch gap-3 sm:flex-row sm:items-start` — di <sm form
lebar penuh dan gambar turun ke bawah; di ≥sm persis seperti semula.

### K-1 (P3) — Kode mati + satu konstruksi `Chess` mubazir per render

- `_giliranKini`: `new Chess(fen).turn()` di badan komponen tiap render, hasilnya tak dipakai;
- `_salinFen` + `useState` `fenTersalin` (tak pernah dirender/dipanggil);
- `_statTampil` (useMemo statistik) dan `_jumlahNama` tak pernah dipakai.

Dihapus — mengurangi kerja per render pada halaman yang memang menahan render demi animasi.

### K-2/K-3 (P3)

`npm run lint` merah karena `jumlahPapan(papanEl)` tak terpakai di riset isepic — dihapus.
`PratinjauLangkah` menerima prop `label` (bawaan tetap ada untuk kompatibilitas uji) dan
`DaftarRiwayat` meneruskan `t("papan.pratinjauLabel")`.

### U-1 (P3) — Regresi e2e

`pembukaan.spec.js` kini memeriksa (project desktop + mobile, id + en): tombol aksi panel
("Baru"/"New") harus **dapat dijangkau pengguna** — muat di viewport, atau berada di dalam
wadah dengan `overflow-y: auto|scroll` (bukan `visible`/`hidden` yang terpotong) — plus
`documentElement.scrollWidth <= innerWidth`. Pemeriksaan gagal pada kode lama (mode
"terpotong") dan lolos pada kode baru, tanpa bergantung pada angka tinggi pasti.

---

## 4. Perhitungan tinggi (Pixel 5, 393×851 — bahan bukti R-1/R-2)

| Elemen | Sebelum | Sesudah |
| --- | --- | --- |
| Baris profil hitam + papan + baris profil putih | 419 px (`shrink-0`) | 419 px |
| Jarak antar kolom (`gap-6` × 2) | 48 px | 48 px |
| Kontrol gear/suara/flip | 180 px (vertikal + pt-14) | 36 px (bilah mendatar) |
| Panel (tab bar + bottom bar minimum) | ±170 px | ±170 px |
| **Total isi** | **±817 px** | **±673 px** |
| Tinggi baris tersedia | ±684 px | ±684 px |
| Hasil | **terpotong ±133 px, tak tergulir** | **muat** (kelebihan pun kini menggulir) |

Di 375×667 (iPhone SE) isi sesudah ±655 px vs tersedia ±500 px → baris konten menggulir
vertikal (dapat di-scroll pengguna), persis pola empat halaman mode.

---

## 5. Pemeriksaan yang bersih (tidak perlu diulang)

1. **Empat halaman mode** (MvM, Latihan Repertoar, Hand & Brain, Turing Test) sudah memakai
   `grid … overflow-y-auto … lg:overflow-hidden` + papan `max-w-[520px]` dengan rumus
   `lg:w-[min(520px,calc(100dvh-140px),calc(100vw-634px))]` — responsif dan konsisten.
2. **`PapanTekaTeki`** — `w-full aspect-square`, grid 8×8 proporsional, `touchAction: "none"`
   hanya saat seret aktif, koordinat petak relatif terhadap kotak papan (aman saat digulir).
3. **BilahEvaluasi ↔ baris profil** — `w-9` (36 px) + `gap-1.5` (6 px) = `pl-[42px]` yang
   dipakai `BarisProfil` dan dua baris profil inline; sejajar di semua lebar.
4. **Tabel panel** (`LangkahExplorer` `min-w-[510px]`, `PanelBasisDataAwan` `min-w-[420px]`)
   sudah dibungkus `overflow-x-auto`.
5. **Workspace** — `h-dvh`, nav mobile `grid-cols-5` + `truncate` (e2e `menuMeluap === false`),
   sidebar 220 px di lg; `HalamanPapanBuku` lazy.
6. **`useEngineCatur`** — efek bergantung pada primitif (`kunciEngine` string), jadi ganti
   warna papan/bidak/komentator TIDAK me-restart worker engine (kekhawatiran `opsiEngine`
   beridentitas baru tiap `ubah()` tidak beralasan).
7. **`gunakanDialog`** — fokus awal `[data-autofokus]`, jebakan Tab, Escape (capture), restore
   fokus pemicu; dipakai konsisten oleh dua dialog.
8. **Navigasi keyboard** (←→↑↓ untuk langkah) menghormati input/textarea/select/tab/dialog.
9. **Pemuatan data malas & sesuai kebutuhan** — buku pembukaan hanya saat dipakai, artikel
   Wikibooks hanya saat tab Penjelajah aktif (dibatalkan saat pindah tab), chessdb.cn hanya
   setelah keluar buku dan bila terlihat.
10. **`BukuPembukaan`** — pencarian termemoisasi, header grup `sticky`, nama terpotong anggun.

---

## 6. Catatan / rekomendasi lanjutan (belum dikerjakan)

| ID | Catatan |
| --- | --- |
| N-1 | `BilahEvaluasi` memakai `transition: height 1.5s` — terasa lambat; pemangkasan ke ±0,4 s akan lebih "hidup", tetapi durasi panjang mungkin disengaja untuk meredam kedip hasil engine sementara. Butuh keputusan UX, jadi tidak diubah. |
| N-2 | Beberapa teks lama `text-[10px]/[11px]` (baris profil, tabel, sidebar) kini tercatat di baseline standar desain; pertimbangkan menaikkan ke `text-xs` bertahap. |
| N-3 | Baris `TangkapanBidak` memotong bila tangkapan sangat banyak (mirip chess.com) — diterima, tetapi bisa diberi `title` ringkasan nilai material. |
| N-4 | Uji e2e browser tidak dapat dijalankan di lingkungan audit ini (unduhan browser Playwright diblokir); regresi U-1 divalidasi secara sintaks + logika dan menunggu jalannya CI/lokal. |

---

## 7. Status perbaikan & verifikasi

Semua temuan R-1…R-6, K-1…K-3, dan U-1 **sudah dikerjakan** pada cabang ini.

Suite yang dijalankan setelah perubahan — **semua LULUS, 0 gagal**:

- `npm run lint` (kini bersih, termasuk perbaikan K-2)
- `node scripts/uji-i18n.mjs` — 2.697 kunci ID = EN, 1.337 kunci terpakai ada
- `node scripts/uji-standar-desain.mjs` — tanpa penyimpangan baru (149 temuan lama di baseline)
- `node scripts/uji-rute.mjs` — 45 rute publik + 1 pengalihan selaras
- `npm run uji:repertoar`, `uji:hand-brain`, `uji:turing`, `uji:maia`, `uji:sunfish`
- `npm run uji:pratinjau-langkah`, `uji:animasi-bidak`, `uji:tanda-papan`, `uji:tanda-bantu`,
  `uji:bantuan-langkah`, `uji:lencana-skakmat`, `uji:suara`, `uji:gestur-lawan`,
  `uji:evaluasi-manusia-vs-mesin`
- `npm run uji:tekateki-solusi`, `uji:tekateki-alur`, `uji:tekateki-rute` (papan bersama)
- `npm run uji:kerangka-penuh`, `npm run uji:integritas-suite`
- `npm run build` — sukses (±21 dtk)

Uji e2e (`pembukaan.spec.js`, project `desktop-chromium` + `mobile-chromium`) menunggu
lingkungan dengan browser Playwright; penambahan U-1 dirancang tidak bergantung timing/ukuran
pasti sehingga aman untuk CI.
