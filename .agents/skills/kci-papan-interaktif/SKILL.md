---
name: kci-papan-interaktif
description: Panduan halaman Papan Interaktif (/papan-interaktif/*) - Workspace.jsx sebagai tata letak rute dengan sidebar lima tautan (papan buku, Latihan Repertoar, Hand & Brain, Turing test, Pengaturan); Manusia vs Mesin adalah rute mandiri di luar tata letak dengan sidebar miliknya sendiri (pola Teka-teki/Rush); tiap mode di rumah foldernya sendiri (ManusiaVsMesin, LatihanRepertoar, HandBrain, TuringTest), komponen bersama di PapanInteraktif/bersama/, Buku Pembukaan (PapanInteraktif.jsx), worker Stockfish on-demand, dan penyimpanan latihan di IndexedDB. Batasnya adalah tidak menduplikasi Analisa/Teka-teki/Teka-teki Rush; En Croissant hanya referensi konsep. Use when editing /papan-interaktif/*, board practice modes, opening book explorer, or running npm run uji:repertoar and npm run uji:bantuan-langkah.
metadata:
  project: chessclub-kci
  area: frontend
  halaman: papan-interaktif
---

# Papan Interaktif — Satu Tata Letak, Satu Halaman per Mode

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo**.

## Rumah komponen catur

`src/halaman/Analisa/komponen/` adalah satu pintu komponen visual untuk seluruh bagian catur, bukan hanya halaman Report Analisa. Sebelum membuat papan, bidak, jam, evaluasi, identitas pemain, indikator hasil, tombol langkah, atau SVG baru, cari implementasi di sana dan gunakan/perluas komponen tersebut.

Folder `src/halaman/PapanInteraktif/` menyimpan tata letak rute, halaman papan buku, halaman pengaturan, dan `bersama/` (komponen/state yang dipakai lintas mode). Tiap mode latihan punya rumah foldernya sendiri (`ManusiaVsMesin/`, `LatihanRepertoar/`, `HandBrain/`, `TuringTest/`) dan dilarang mengimpor dari rumah mode lain atau dari `Analisa/` — kebutuhan bersama diambil dari `PapanInteraktif/bersama/` (termasuk `bersama/ikon/`). Folder ini tidak menjadi design system catur kedua. Teka-teki, Quiz, dan Rush mengikuti batas yang sama: alur boleh khusus, komponen visual catur reusable tetap tinggal di `Analisa/komponen/`.

Jangan memindahkan komponen catur ke `src/components/konten/` atau memaksanya memakai bentuk halaman artikel.

## Baca dulu sebelum menyentuh `/papan-interaktif`

| Kebutuhan | Berkas |
| --- | --- |
| Tata letak rute dan sidebar lima tautan | `src/halaman/PapanInteraktif/Workspace.jsx` (`TataLetakPapan` + `<Outlet/>`) |
| Pengaturan papan & engine (konteks bersama di tata letak) | `src/halaman/PapanInteraktif/LayarPengaturan.jsx`, `bersama/gunakanPengaturanPapan.js`, `bersama/PengaturanKonteks.jsx` |
| Mode yang ada (tiap mode satu rute + satu folder) | `src/halaman/{ManusiaVsMesin,LatihanRepertoar,HandBrain,TuringTest}/*.jsx` |
| Logika dan penyimpanan repertoar | `src/halaman/LatihanRepertoar/{repertoarLogika,repertoarStorage}.js` |
| Buku pembukaan (halaman `/papan-interaktif`) | `src/halaman/PapanInteraktif/PapanInteraktif.jsx` |
| Utilitas papan/riwayat + komponen bersama | `src/halaman/PapanInteraktif/bersama/` (`utilPapan.js`, `BarisProfil.jsx`, tombol langkah, `BilahEvaluasi`, `TangkapanBidak`, `konstanta.js`, `ikon/`) |
| Ringkasan halaman | `src/halaman/PapanInteraktif/SKILL.md` |

## Arah produk

`/papan-interaktif/*` adalah area papan catur modular: satu tata letak dengan sidebar lima tautan, tiap mode adalah rute sendiri:
1. **Analisa** (`/papan-interaktif`) — papan bebas/Opening Book; tampil langsung saat halaman dibuka, bukan pintasan ke Report Analisa.
2. **Latihan Repertoar** (`/papan-interaktif/latihan-repertoar`) — latihan mengingat jalur pembukaan dengan pengulangan terjadwal, bukan bank soal taktik kedua.
3. **Hand & Brain** (`/papan-interaktif/hand-brain`) — varian lokal dua pemain di satu perangkat.
4. **Turing test** (`/papan-interaktif/turing-test`) — tebak langkah manusia vs langkah mesin.
5. **Pengaturan** (`/papan-interaktif/pengaturan`) — layar pengaturan papan (set bidak, warna papan, suara, panah engine, bantuan langkah, tampilan basis data awan, komentator) dan engine analisa (mesin, kedalaman, threads, hash, MultiPV, skill level). Nilainya terhubung langsung ke Papan Interaktif dan tetap ada saat berpindah halaman mode.

**Teka-teki Harian** (`/teka-teki-harian`, folder `src/halaman/TekaTekiHarian/`) juga anggota keluarga ini: ia memakai kerangka sidebar sendiri (brand + label mode + kontrol halaman + Lisensi) dan tidak lagi bernaung di bawah Teka-teki Catur — tidak ada bilah "Kembali ke Teka-teki Catur". Di menu, dropdown Program Kami tetap **daftar datar** (tanpa submenu bertingkat) dengan Teka-teki Harian sebagai salah satu barisnya — jangan menambahkan grup/submenu bersarang di sana. Data soalnya berasal dari API `/api/teka-teki-harian` dengan snapshot lokal sebagai cadangan; detailnya di `PANDUAN-TEKA-TEKI-HARIAN.md`.

**Manusia vs Mesin** (`/papan-interaktif/manusia-vs-mesin`) tetap satu keluarga dengan mode di atas tetapi **rute mandiri di luar `TataLetakPapan`** (terdaftar di `RUTE_HALAMAN` `src/App.jsx`, bukan `RUTE_PAPAN`): ia membawa sidebar miliknya sendiri dengan pola yang sama seperti Teka-teki dan Teka-teki Rush — brand BlunderSkuad + label mode, tombol Partai baru/Tanding ulang/Pengaturan permainan, dan Lisensi & Atribusi di bawah. Karena di luar `PenyediaPengaturanPapan`, pengaturan pannya jatuh ke fallback lokal halaman.

Jangan menambahkan item sidebar keenam tanpa permintaan terpisah. Buku Pembukaan yang sudah ada tetap dipertahankan di mode Analisa, bukan item sidebar tersendiri. Tab `Analisa | Buku | Penjelajah | Partai` adalah tab detail panel kanan papan, bukan pilihan sidebar atau Report Analisa.

Sebelum membangun tiap mode baru, bandingkan dengan halaman Report Analisa, Teka-teki, Teka-teki Rush, Database PGN, dan fitur yang sudah ada. Gunakan kembali bagian yang relevan tanpa menautkan sidebar Papan Interaktif ke fitur lain atau membuat salinannya. Daftar menu ini membatasi pilihan navigasi, bukan izin untuk mengimplementasikan semua perilaku mode sekaligus.

## Batas produk: jangan menduplikasi halaman lain

### Report Analisa (`/program-kami/analisa`)

Halaman Report Analisa sudah memiliki impor dan pemindaian PGN, engine Stockfish, MultiPV, klasifikasi langkah termasuk mistake/blunder, evaluasi dan grafik, statistik akun, basis data PGN lokal, serta ekspor PGN beranotasi. Menu `Analisa` di sidebar Papan Interaktif **tetap di dalam workspace** dan menampilkan papan Opening Book lama, bukan halaman laporan tersebut.

Report Analisa v1 ditandai dibekukan di `src/halaman/Analisa/README.md`. Perubahan di halaman itu perlu dianggap sebagai rencana v2 dan tetap menjaga seluruh uji regresinya.

### Teka-teki dan Teka-teki Rush

Bank soal taktik/skakmat, filter, alur menyelesaikan teka-teki, dan Rush sudah ada. Jangan menyalin bank soal atau mode Rush ke Papan Interaktif. Latihan repertoar pembukaan hanya boleh fokus pada mengingat jalur opening, bukan menjadi bank teka-teki taktik kedua.

## Referensi adopsi: En Croissant

- Repo acuan: [`franciscoBSalgueiro/en-croissant`](https://github.com/franciscoBSalgueiro/en-croissant).
- Gunakan sebagai referensi **konsep produk dan pola UX**: pemisahan workspace, repertoire practice dengan spaced repetition, pencarian posisi, dan penggunaan engine.
- En Croissant adalah aplikasi desktop lintas platform. Jangan menyalin arsitektur Tauri/Rust, TypeScript, Mantine, Zustand/Jotai, atau mengasumsikan akses desktop ke engine dan berkas pengguna tersedia di browser.
- README En Croissant mencantumkan lisensi GPL-3.0. Jangan menyalin kode/asetnya ke proyek MIT ini tanpa pemeriksaan lisensi dan kewajiban atribusi. Utamakan implementasi baru yang mengikuti pola proyek ChessClub.

## Arsitektur

- `Workspace.jsx` adalah tata letak rute: sidebar kiri (tautan `NavLink`) + `<Outlet/>`. `src/App.jsx` memuat tata letak dan tiap halaman mode secara lazy; daftar rutenya ada di `RUTE_PAPAN` (format pasangan `[jalur, Komponen]` agar terbaca `scripts/uji-rute.mjs`). Manusia vs Mesin terdaftar di `RUTE_HALAMAN` karena rutenya mandiri di luar `TataLetakPapan`.
- **State pengaturan disediakan tata letak** lewat `PenyediaPengaturanPapan` (`bersama/PengaturanKonteks.jsx`, memakai `usePengaturanPapan()` dari `bersama/gunakanPengaturanPapan.js`), sehingga tidak hilang saat berpindah halaman mode. Tiap halaman membacanya lewat `usePengaturanBersama()` (prop `pengaturan`/`{ nilai, ubah }` tetap didukung sebagai override). Jangan kembali menyimpan pengaturan ini sebagai state lokal di halaman mode.
- Pengaturan engine diteruskan ke `useEngineCatur(fen, opsi)` (`src/lib/gunakanEngineCatur.js`): `url`, `hash`, `threads`, `skill` membuat ulang worker; `kedalaman` dan `multiPv` dipakai per analisis. Suara dan komentator tetap tersimpan di localStorage (`useSuara()`, `usePreferensiKomentator()`).
- `Analisa` memilih papan Opening Book di area kerja; Report Analisa (`/program-kami/analisa`) tetap terpisah di menu Program Kami.
- Tiap mode adalah chunk lazy sendiri (`ManusiaVsMesin/`, `LatihanRepertoar/`, `HandBrain/`, `TuringTest/`). Jangan render atau memuat worker mode lain saat pengguna berpindah halaman.
- `PapanInteraktif.jsx` mempertahankan pengalaman Buku Pembukaan yang ada; ia adalah isi rute `/papan-interaktif` (dibungkus `HalamanPapanBuku`) dan tujuan tautan **Jelajah Buku Pembukaan** dari Latihan Repertoar. Jangan pasang teks pengantar atau bilah kembali di atas papan.
- Panel kanan `analisa | books | explorer | games` tetap menjadi tab detail di tampilan Buku Pembukaan, bukan navigasi global.
- State khusus tiap mode tetap terisolasi. Buat util bersama hanya bila benar-benar dipakai lebih dari satu mode dan kontraknya teruji.
- Pertahankan papan React custom dan set bidak proyek sebagai pilihan awal. En Croissant boleh menjadi acuan interaksi, tetapi bukan alasan otomatis untuk mengganti papan ke Chessground atau menyalin board desktop.

## Batas performa dan penyimpanan

- **Engine hanya berjalan saat dibutuhkan.** Mode Manusia vs Mesin menyediakan lawan Sunfish,
  Maia 3, dan Stockfish sesuai konfigurasi level di `ManusiaVsMesin/mesinLemah.js`. Stockfish
  memakai worker lokal single-thread; mulai saat dibutuhkan, batalkan pencarian saat posisi berubah,
  dan hentikan worker saat partai selesai atau mode ditinggalkan. Jangan menyalakan worker analisis
  dan worker permainan bersamaan tanpa kebutuhan yang terukur.
- Gunakan engine single-thread yang sudah disediakan. Jangan menambah installer multi-engine, binary engine besar, COOP/COEP, atau multi-thread WASM sebagai bagian default tanpa kajian dan persetujuan terpisah.
- Untuk latihan repertoar dan koleksi, simpan metadata/posisi yang diperlukan di IndexedDB yang sudah dipakai proyek. Jangan menyalin ulang seluruh PGN atau engine ke setiap kartu latihan; jangan memakai cookie untuk data latihan.
- Pencarian posisi dibatasi ke koleksi lokal/yang diimpor terlebih dahulu. Jangan memuat seluruh PGN atau korpus besar ke memori sekaligus; rancang indeks, paginasi, dan pemuatan bertahap bila fitur disetujui.
- Uji ukuran bundel awal, waktu load engine, pembatalan worker, pergantian mode, dan perangkat mobile sebelum menyatakan fitur tidak membebani browser. Jangan membuat klaim ukuran/performa tanpa pengukuran.

## Mode yang ada: Buku Pembukaan

### Data dan aturan inti yang harus dipertahankan

- Buku utama: `public/data/buku-pembukaan.json`, turunan dari `lichess-org/chess-openings` (CC0), berbentuk daftar `{ eco, opening, moves }` dan diproses melalui `pohonDariDaftar()`.
- Pertahankan dukungan pohon flat maupun bentuk tree lama melalui `normalkanPohonPembukaan()`; pertahankan deteksi mode kunci `koordinat` (`e2e4`) atau `san` (`e4`).
- `jalur` menelusuri pohon; `infoPembukaan` menentukan nama ECO dan saran. `masihDiBuku` mensyaratkan posisi cocok dan masih punya saran; bila buku habis, basis data awan mengambil alih.
- Konversi SAN melalui `sanDiPosisi()`; pertahankan `riwayat`, `riwayatLengkap`, `fen`, `fenAwal`, FEN/PGN loader, undo/redo, orientasi, dan daftar riwayat.
- Statistik pembukaan tetap memakai `statTurunan()`: jumlah partai, win rate putih/hitam, draw rate, dan rating rata-rata.
- Artikel Wikibooks hanya diambil saat tab Penjelajah aktif; pertahankan debounce, cache, dan pembatalan request.
- Bantuan langkah yang sudah ada tetap opsional dan mati secara bawaan. Pertahankan worker kedua yang khusus untuk bantuan seret; jangan campur dengan worker analisis utama atau kueri basis data awan.

### UI saat ini

- Panel kanan: `analisa | books | explorer | games` (label ID/EN melalui `papan.*`).
- `books`: daftar jalur/saran pembukaan; `explorer`: artikel pembukaan; `games`: statistik/kelanjutan buku atau basis data awan; `analisa`: panel posisi pembukaan yang sudah ada.
- Sidebar kiri `TataLetakPapan` berisi lima tautan rute: Analisa (papan Opening Book, langsung tampil), Latihan Repertoar, Hand & Brain, Turing test, dan Pengaturan. Manusia vs Mesin berdiri sendiri dengan sidebar halamannya (Partai baru, Tanding ulang, Pengaturan permainan, Atribusi). Tautan Jelajah Buku Pembukaan di Repertoar kembali ke halaman Analisa; tidak menambah item sidebar keenam atau tautan ke fitur lain.
- Pada laptop, papan dan panel tampil dalam satu layar tanpa scrollbar halaman/papan. Konten panjang pada tab panel kanan boleh digulir di dalam panel agar fiturnya tetap terjangkau.
- Manusia vs Mesin mendukung pilihan warna, tingkat waktu Stockfish, partai baru, papan interaktif, dan riwayat langkah; pengaturan pannya disimpan lokal di halaman (fallback `pengaturanLokal`). Tidak menampilkan panah best-move saat pemain sedang bermain.
- Latihan Repertoar mencari jalur dari buku CC0, membangun kartu hanya untuk warna yang dipilih, menilai lagi/sulit/baik/mudah, dan menyimpan jadwal lokal ke IndexedDB (dengan fallback browser).
- Tema papan gelap dan aksen hijau adalah identitas mode ini. Pertahankan selama tidak ada permintaan restyling.

## Batasan mode baru

- PvE hanya berada di mode **Manusia vs Mesin**. Jangan mengubah Buku Pembukaan menjadi mode lawan engine.
- Jangan membuat fitur yang sudah ada di Report Analisa atau Teka-teki dengan nama/antarmuka baru.
- Jangan menambah PvP daring, sinkronisasi cloud, fitur sosial, engine tambahan, atau korpus PGN besar tanpa permintaan dan rancangan terpisah.
- Jangan menghapus atau melemahkan pengujian/guardrail fitur Buku Pembukaan saat menambah mode.

## Acuan pemulihan atas permintaan pengguna

- [PR #146](https://github.com/Delta-Polder-Indonesia/ChessClub/pull/146), cabang `arena/01a0d842-chessclub` (head `9121768334e9a6820850a2f3978b3b53613e5e98`), adalah snapshot repo **sebelum Papan Interaktif dimodifikasi menjadi workspace mode baru**. PR itu sendiri tentang teks komentator, bukan implementasi mode papan.
- Jika pengguna kelak meminta riset atau pengembalian karena fitur papan baru tidak sesuai, ambil/clone snapshot PR #146 **sebagai referensi** dan bandingkan kode, tampilan, serta uji Papan Interaktif. Tujuannya memulihkan **seluruh perubahan Papan Interaktif** ke perilaku sebelum modifikasi, bukan menghapus perubahan pada fitur situs lain. Jangan melakukan rollback otomatis; tunggu permintaan dan persetujuan eksplisit untuk langkah pemulihan.
- Jangan menambah mode, teks pengantar, atau ide antarmuka baru tanpa rujukan perilaku fitur yang sudah ada dan persetujuan pengguna. Hindari desain "AI slop" yang menyimpang dari referensi pengguna.

## i18n, pengujian, dan urutan kerja

- Semua label UI memakai `t("papan.xxx")`; terjemahan ID dan EN harus sinkron.
- Sebelum membuat mode baru: inventaris fitur existing, tulis tujuan dan batas mode, lalu implementasikan satu mode secara vertikal dari UI hingga data dan uji. Jangan mulai beberapa mode dalam satu perubahan besar.
- Pemeriksaan dasar: `npm run uji:rute`, `npm run uji:i18n`, `npm run uji:repertoar`, `npm run uji:nama-pembukaan`, `npm run uji:artikel`, `npm run uji:bantuan-langkah`, `npm run uji:sunfish` (lawan level pemula Manusia vs Mesin), dan `npm run build` sesuai area yang berubah.
- Bila menyentuh engine atau alur Analisa, jalankan uji engine/UI/regresi yang sesuai; perubahan Analisa mengikuti aturan v2 di atas.
- Perubahan skill ini harus tetap identik antara `.agents/skills/` dan `.opencode/skills/`.

## Panduan Arsitektur & Logika Aplikasi Catur (Chess.com Standard)

Dokumen ini berisi cetak biru (blueprint) seluruh perilaku catur, aturan legalitas, status permainan, dan fitur aplikasi yang harus diimplementasikan agar sistem memiliki struktur kode yang kuat, valid, dan minim bug.

### 1. Core Board & State Management (Manajemen Papan)

Mengatur bagaimana papan catur direpresentasikan dalam memori dan bagaimana status permainan disimpan.

- **Square Coordinate System**: Representasi papan menggunakan koordinat grid 8x8 (A1 hingga H8) atau array 1-dimensi (64 kotak).
- **Piece Representation**: Sistem identifikasi bidak berdasarkan tipe (Pawn, Knight, Bishop, Rook, Queen, King) dan warna (White, Black).
- **Turn Management**: Sistem pelacakan giliran jalan yang ketat (Putih selalu pertama, lalu bergantian).
- **FEN (Forsyth-Edwards Notation) Parser/Generator**: Kemampuan membaca dan menghasilkan string FEN untuk menyimpan *state* papan secara instan (contoh: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`).
- **Move History Tracker (PGN)**: Mencatat setiap langkah ke dalam format notasi catur standar (misal: `1. e4 e5 2. Nf3 Nc6`) untuk dianalisis ulang.

### 2. Basic Movement Rules (Gerakan Dasar Bidak)

Logika validasi untuk memastikan setiap bidak hanya melangkah sesuai karakteristik aslinya.

- **Pion (Pawn)**:
  - Maju 1 kotak ke depan (jika kotak kosong).
  - Maju 2 kotak ke depan khusus dari baris awal (baris 2 untuk Putih, baris 7 untuk Hitam).
  - Menangkap bidak lawan 1 kotak secara diagonal ke depan.
  - *Constraint*: Tidak bisa melompati bidak lain.
- **Kuda (Knight)**:
  - Bergerak membentuk pola "L" (2 kotak vertikal + 1 horizontal, atau 2 kotak horizontal + 1 vertikal).
  - *Special*: Satu-satunya bidak yang bisa melompati bidak lain (baik kawan maupun lawan).
- **Gajah (Bishop)**:
  - Bergerak secara diagonal tanpa batas kotak.
  - *Constraint*: Tidak bisa melompati bidak lain dan jalurnya harus bersih hingga kotak tujuan.
- **Benteng (Rook)**:
  - Bergerak secara vertikal atau horizontal tanpa batas kotak.
  - *Constraint*: Tidak bisa melompati bidak lain dan jalurnya harus bersih.
- **Menteri/Ratu (Queen)**:
  - Gabungan kemampuan Benteng dan Gajah (bebas bergerak ke segala arah: vertikal, horizontal, diagonal).
  - *Constraint*: Tidak bisa melompati bidak lain.
- **Raja (King)**:
  - Bergerak 1 kotak ke segala arah (vertikal, horizontal, diagonal).
  - *Constraint*: Tidak boleh melangkah ke kotak yang sedang diancam/dijaga oleh bidak lawan.

### 3. Advanced & Special Moves (Gerakan Khusus)

Logika tingkat lanjut yang sering memicu *bug* jika tidak ditangani dengan teliti.

- **Pawn Promotion (Promosi Pion)**:
  - Memicu menu pilihan (Ratu, Benteng, Gajah, Kuda) ketika pion mencapai baris ujung lawan (baris 8 untuk Putih, baris 1 untuk Hitam).
  - Menghapus pion dari papan dan menggantinya dengan bidak pilihan secara instan.
- **En Passant (Menangkap Lewat)**:
  - Mengizinkan pion menangkap pion lawan yang baru saja maju 2 kotak, seolah-olah pion lawan hanya maju 1 kotak.
  - *Constraint*: Hanya valid dilakukan **tepat satu langkah** setelah lawan maju 2 kotak tersebut. Jika dilewatkan, hak En Passant hangus.
- **Castling (Rokade)**:
  - Menggeser Raja 2 kotak ke arah Benteng, dan Benteng melompati Raja ke kotak sebelahnya (berlaku untuk *Kingside* maupun *Queenside*).
  - *Validation Flags (Syarat Ketat)*:
    - Raja belum pernah bergerak sama sekali.
    - Benteng yang bersangkutan belum pernah bergerak sama sekali.
    - Tidak ada bidak lain di antara Raja dan Benteng.
    - Raja tidak sedang dalam posisi **Skak (Check)**.
    - Raja tidak melewati kotak yang sedang diancam oleh bidak lawan.
    - Raja tidak mendarat di kotak yang sedang diancam oleh bidak lawan.

### 4. Check & Game Over Conditions (Kondisi Skak & Selesai)

Sistem validasi akhir untuk menentukan pemenang atau hasil remis seperti di chess.com.

- **Check Detection (Deteksi Skak)**: Mencari tahu apakah Raja salah satu pihak sedang di bawah ancaman langsung oleh bidak lawan.
- **Absolute Pin Validation**: Memastikan pemain *tidak boleh* melangkahkan bidak lain jika langkah tersebut menyebabkan Rajanya sendiri menjadi ter-skak.
- **Checkmate Detection (Skakmat)**: Terjadi jika Raja sedang di-skak, DAN tidak ada satu pun langkah legal yang bisa menyelamatkan Raja (Putih/Hitam menang).
- **Draw - Stalemate (Remis Gantung)**: Terjadi jika giliran seorang pemain melangkah, Rajanya **tidak sedang di-skak**, tetapi pemain tersebut **tidak memiliki satu pun langkah legal** di papan.
- **Draw - Insufficient Material (Kurang Bidak)**: Otomatis remis jika sisa bidak di papan tidak memungkinkan terjadinya skakmat. Kombinasi:
  - Raja vs Raja.
  - Raja + Gajah vs Raja.
  - Raja + Kuda vs Raja.
  - Raja + Gajah vs Raja + Gajah (dengan gajah berada di warna kotak yang sama).
- **Draw - Threefold Repetition**: Otomatis atau opsi remis jika posisi susunan papan yang sama persis terjadi sebanyak 3 kali dalam satu permainan.
- **Draw - 50-Move Rule**: Otomatis atau opsi remis jika dalam 50 langkah beruntun tidak ada pion yang maju dan tidak ada bidak yang dimakan.
- **Timeout (Kehabisan Waktu)**: Pemain kalah jika waktu pada jam catur habis, dengan syarat lawan masih memiliki materi yang cukup untuk melakukan skakmat. Jika tidak cukup materi, hasilnya **Timeout vs Insufficient Material (Remis)**.

### 5. UI/UX & Interaction Behavior (Antarmuka & Pengalaman Pengguna)

Standar kenyamanan bermain yang meniru interaksi modern chess.com.

- **Drag & Drop + Click-Click Move**: Mendukung pemindahan bidak dengan cara digeser (*drag*) maupun diklik kotak asal lalu diklik kotak tujuan.
- **Legal Moves Highlighting**: Saat sebuah bidak dipilih/diklik, kotak-kotak yang legal untuk dituju akan memunculkan indikator visual (titik abu-abu/lingkaran).
- **Last Move Indicator**: Memberikan warna latar belakang yang berbeda (misal: kuning muda) pada kotak asal dan kotak tujuan dari langkah terakhir yang baru saja dilakukan.
- **Check Warning**: Memberikan efek visual merah/flashing pada kotak Raja yang sedang dalam posisi ter-skak.
- **Move Sound Effects**: Memisahkan efek suara yang berbeda untuk: langkah biasa, memakan bidak (*capture*), posisi skak, rokade, dan permainan berakhir.
- **Premoves (Opsional Tingkat Lanjut)**: Mengizinkan pemain melakukan langkah berikutnya sebelum giliran lawan selesai (ditandai dengan warna merah/hijau pada kotak).

### 6. Engine & Sistem Multiplayer (Konektivitas)

Komponen backend agar game bisa dimainkan melawan komputer atau orang lain.

- **Local Pass-and-Play**: Mode bermain dua orang di satu perangkat fisik yang sama secara bergantian.
- **UCI Protocol Support**: Sistem komunikasi untuk menghubungkan antarmuka visual Anda dengan catur engine pihak ketiga (seperti Stockfish).
- **Real-time WebSockets Sync**: Sinkronisasi data langkah antar-pemain via internet secara instan tanpa *delay* yang besar.
