---
name: kci-papan-interaktif
description: Panduan halaman Papan Interaktif (/papan-interaktif) di src/halaman/PapanInteraktif/ sebagai workspace papan catur modular - Workspace.jsx dan sidebar tiga pilihan (Analisa, Manusia vs Mesin, Latihan Repertoar), modus/ManusiaVsMesin.jsx, modus/LatihanRepertoar.jsx beserta repertoarLogika.js dan repertoarStorage.js, Buku Pembukaan lama (PapanInteraktif.jsx, utilPapan.js), worker Stockfish on-demand, dan penyimpanan latihan di IndexedDB. Batasnya adalah tidak menduplikasi Analisa/Teka-teki/Teka-teki Rush; En Croissant hanya referensi konsep. Use when editing /papan-interaktif, board practice modes, opening book explorer, or running npm run uji:repertoar and npm run uji:bantuan-langkah.
metadata:
  project: chessclub-kci
  area: frontend
  halaman: papan-interaktif
---

# Papan Interaktif — Workspace Modular

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo**. Utamakan peta berkas
`docs/PETA-KODE.md` sebelum menelusuri `src/halaman/PapanInteraktif/` secara manual.

## Baca dulu sebelum menyentuh `/papan-interaktif`

| Kebutuhan | Berkas |
| --- | --- |
| Shell rute dan sidebar tiga pilihan | `src/halaman/PapanInteraktif/Workspace.jsx` |
| Mode yang ada | `src/halaman/PapanInteraktif/modus/{ManusiaVsMesin,LatihanRepertoar}.jsx` |
| Logika dan penyimpanan repertoar | `src/halaman/PapanInteraktif/modus/repertoarLogika.js`, `repertoarStorage.js` |
| Buku pembukaan (mode lama) | `src/halaman/PapanInteraktif/PapanInteraktif.jsx` |
| Utilitas papan dan riwayat | `src/halaman/PapanInteraktif/utilPapan.js` |
| Ringkasan halaman | `src/halaman/PapanInteraktif/SKILL.md` |

## Arah produk

`/papan-interaktif` berkembang bertahap menjadi workspace papan catur modular. Untuk tahap ini, sidebar kiri dibatasi **tepat tiga pilihan**:
1. **Analisa** — mode papan bebas/Opening Book lama; tampil langsung saat halaman dibuka, bukan pintasan ke Report Analisa.
2. **Manusia vs Mesin** — mode bermain baru yang terpisah; gunakan engine lokal situs secara on-demand.
3. **Latihan Repertoar** — latihan mengingat jalur pembukaan dengan pengulangan terjadwal, bukan bank soal taktik kedua.

Jangan menambahkan item sidebar lain dulu. Buku Pembukaan yang sudah ada tetap dipertahankan di mode Analisa, bukan item sidebar tersendiri. Tab `Analisa | Buku | Penjelajah | Partai` adalah tab detail panel kanan papan, bukan pilihan sidebar atau Report Analisa.

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

- `Workspace.jsx` adalah shell rute: sidebar kiri dan satu mode aktif. `src/App.jsx` memuat shell ini secara lazy.
- `Analisa` memilih papan Opening Book di area kerja; Report Analisa (`/program-kami/analisa`) tetap terpisah di menu Program Kami.
- `modus/ManusiaVsMesin.jsx` dan `modus/LatihanRepertoar.jsx` dipisahkan sebagai chunk lazy. Jangan render atau memuat worker mode lain saat pengguna berpindah.
- `PapanInteraktif.jsx` mempertahankan pengalaman Buku Pembukaan yang ada; muat saat masuk ke halaman sebagai mode bawaan atau saat pengguna memilih **Jelajah Buku Pembukaan** dari Latihan Repertoar. Jangan pasang teks pengantar atau bilah kembali di atas papan.
- Panel kanan `analisa | books | explorer | games` tetap menjadi tab detail di tampilan Buku Pembukaan, bukan navigasi global.
- State khusus tiap mode tetap terisolasi. Buat util bersama hanya bila benar-benar dipakai lebih dari satu mode dan kontraknya teruji.
- Pertahankan papan React custom dan set bidak proyek sebagai pilihan awal. En Croissant boleh menjadi acuan interaksi, tetapi bukan alasan otomatis untuk mengganti papan ke Chessground atau menyalin board desktop.

## Batas performa dan penyimpanan

- **Engine hanya berjalan saat dibutuhkan.** Mode Manusia vs Mesin memakai worker Stockfish lokal single-thread; unduh/start saat engine benar-benar mendapat giliran, batalkan pencarian saat posisi berubah, dan hentikan worker saat partai selesai atau mode ditinggalkan. Jangan menyalakan worker analisis dan worker permainan bersamaan tanpa kebutuhan yang terukur.
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
- Sidebar kiri berisi tepat tiga mode internal: Analisa (papan Opening Book lama, langsung tampil), Manusia vs Mesin, dan Latihan Repertoar. Tombol Jelajah Buku Pembukaan di Repertoar kembali ke mode Analisa; tidak menambah item sidebar keempat atau tautan ke fitur lain.
- Pada laptop, papan dan panel tampil dalam satu layar tanpa scrollbar halaman/papan. Konten panjang pada tab panel kanan boleh digulir di dalam panel agar fiturnya tetap terjangkau.
- Manusia vs Mesin mendukung pilihan warna, tingkat waktu Stockfish, partai baru, papan interaktif, dan riwayat langkah. Tidak menampilkan panah best-move saat pemain sedang bermain.
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
- Pemeriksaan dasar: `npm run uji:rute`, `npm run uji:i18n`, `npm run uji:repertoar`, `npm run uji:nama-pembukaan`, `npm run uji:artikel`, `npm run uji:bantuan-langkah`, dan `npm run build` sesuai area yang berubah.
- Bila menyentuh engine atau alur Analisa, jalankan uji engine/UI/regresi yang sesuai; perubahan Analisa mengikuti aturan v2 di atas.
- Perubahan skill ini harus tetap identik antara `.agents/skills/` dan `.opencode/skills/`; jalankan `npm run uji:peta`.
