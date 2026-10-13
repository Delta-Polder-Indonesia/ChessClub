# Papan Interaktif — Satu Tata Letak, Satu Halaman per Mode

> Panduan lengkap: `.agents/skills/kci-papan-interaktif/SKILL.md` (identik dengan `.opencode/skills/kci-papan-interaktif/SKILL.md`).

**Sidebar berisi enam tautan rute (dulu enam tab dalam satu halaman):**
1. **Analisa** — papan bebas/Opening Book (`PapanInteraktif.jsx`), tampil saat `/papan-interaktif` dibuka; bukan tautan ke Report Analisa (`/program-kami/analisa`).
2. **Manusia vs Mesin** (`src/halaman/ManusiaVsMesin/`, rute `/papan-interaktif/manusia-vs-mesin`) — permainan melawan mesin lokal dengan tiga tangga: sunfish yang dilemahkan (pemula–menengah), **Maia 3** (menengah–Maia, meniru gaya manusia, rating 1100–1900), lalu Stockfish (lanjut–master). Worker single-thread hanya dimulai saat mesin harus bergerak dan dihentikan saat mode/partai selesai. Rincian Maia ada di `docs/MAIA3.md`.
3. **Latihan Repertoar** (`src/halaman/LatihanRepertoar/`, rute `/papan-interaktif/latihan-repertoar`) — tambahkan jalur pembukaan, latih langkah sisi pilihan, nilai tingkat kesulitan untuk jadwal pengulangan, dan simpan progres lokal di IndexedDB.
4. **Hand & Brain** (`src/halaman/HandBrain/`, rute `/papan-interaktif/hand-brain`) — varian lokal dua pemain di satu perangkat: tiap giliran sistem mengundi satu jenis bidak dari bidak yang punya langkah legal, dan pemain hanya boleh memindahkan bidak jenis itu. Aturan murni ada di `HandBrain/handBrainLogika.js` (uji: `npm run uji:hand-brain`). Papan memakai `PapanTekaTeki`; klik bidak sendiri masuk lewat `onSelesaiSeret` karena papan menangkap pointer saat seret.
5. **Turing test** (`src/halaman/TuringTest/`, rute `/papan-interaktif/turing-test`) — pemain menempel PGN partai manusia; tiap soal menampilkan dua langkah, satu dari partai manusia dan satu dari Stockfish (`EngineCatur.cari`, kedalaman 10) pada posisi yang sama. Pemain menebak langkah mana yang manusia. Logika murni di `TuringTest/turingLogika.js` (uji: `npm run uji:turing`). Sumber partai: PGN tempel, atau impor akun Lichess lewat `TuringTest/turingLichess.js` (endpoint dan parameter mengikuti `muatPartaiLichessInti`; uji: `npm run uji:turing`). Impor Lichess hanya bisa dicoba dari browser yang punya internet; e2e memakai `page.route`. Papan hanya untuk ditonton (`terkunci`).
6. **Pengaturan** (`LayarPengaturan.jsx`, rute `/papan-interaktif/pengaturan`) — pengaturan papan dan engine analisa. State-nya disediakan `PenyediaPengaturanPapan` (`bersama/PengaturanKonteks.jsx`) di tata letak `Workspace.jsx`, sehingga tidak hilang saat berpindah halaman mode.

**Milik bersama** (`PapanInteraktif/bersama/`): `BarisProfil.jsx`, tombol navigasi langkah, `BilahEvaluasi`, `TangkapanBidak`, `konstanta.js`, `utilPapan.js`, `gunakanPengaturanPapan.js`, `gunakanDialog.js`, `IkonTab.jsx`, dan `ikon/` (salinan ikon SVG yang dulu diimpor dari folder Analisa). Mode yang butuh komponen bersama mengimpor dari sini — jangan mengimpor dari folder mode lain.

Buku Pembukaan juga dapat dibuka melalui tombol **Jelajah Buku Pembukaan** di Latihan Repertoar (tautan ke `/papan-interaktif`); panel kanan `Analisa | Buku | Penjelajah | Partai` tetap menjadi detail papan, bukan menu Report Analisa.

**Arsitektur:** `Workspace.jsx` adalah tata letak rute (sidebar + `<Outlet/>`); tiap mode adalah rute absolut bersarang di `App.jsx` (`RUTE_PAPAN`) dengan chunk lazy sendiri. Pastikan papan dan panel muat di tinggi layar laptop tanpa scrollbar halaman/papan; jangan menambah teks pengantar atau bilah di atas papan. Jangan menjalankan engine ketika mode permainan tidak aktif atau memuat katalog pembukaan sebelum pengguna masuk ke alur yang memerlukannya.

**Jangan duplikasi:** fitur Report Analisa, Teka-teki, Teka-teki Rush, database PGN, ekspor PGN, dan statistik akun yang sudah ada. Pencarian kartu hanya memakai jalur opening lokal yang dipilih pengguna.

**Referensi:** En Croissant digunakan sebagai sumber konsep UX. Jangan menyalin kode/aset GPL-3.0 ke proyek MIT; implementasikan pola sesuai stack dan batas browser ChessClub. Jangan menambah ide antarmuka atau mode yang tidak diminta pengguna.

**Jika pengguna meminta pemulihan:** [PR #146](https://github.com/Delta-Polder-Indonesia/ChessClub/pull/146) pada `arena/01a0d842-chessclub` adalah snapshot sebelum Papan Interaktif dimodifikasi. Riset/ambil snapshot itu sebagai acuan untuk mengembalikan **seluruh area Papan Interaktif** ke perilaku lama, bukan untuk menimpa fitur lain atau melakukan rollback otomatis. Lihat langkah dan batas persetujuan di skill lengkap.

**Uji:** `npm run uji:repertoar`, `npm run uji:i18n`, `npm run uji:rute`, `npm run uji:maia`, `npm run uji:sunfish`, `npm run uji:evaluasi-manusia-vs-mesin`, dan `npm run build`; lihat skill lengkap untuk uji regresi papan/engine.
