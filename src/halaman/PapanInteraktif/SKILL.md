# Papan Interaktif — Workspace Modular

> Panduan lengkap: `.agents/skills/kci-papan-interaktif/SKILL.md` (identik dengan `.opencode/skills/kci-papan-interaktif/SKILL.md`).

**Sidebar tahap ini berisi tepat empat pilihan:**
1. **Analisa** — mode papan bebas/Opening Book lama, langsung tampil saat `/papan-interaktif` dibuka; bukan tautan ke Report Analisa (`/program-kami/analisa`).
2. **Manusia vs Mesin** — permainan melawan Stockfish lokal. Worker single-thread hanya dimulai saat mesin harus bergerak dan dihentikan saat mode/partai selesai.
3. **Latihan Repertoar** — tambahkan jalur pembukaan, latih langkah sisi pilihan, nilai tingkat kesulitan untuk jadwal pengulangan, dan simpan progres lokal di IndexedDB.
4. **Pengaturan** — pengaturan papan dan engine analisa. State-nya hidup di `Workspace.jsx` (`gunakanPengaturanPapan.js`) dan terhubung langsung ke Papan Interaktif, sehingga tidak hilang saat berpindah tab.

Buku Pembukaan juga dapat dibuka melalui tombol **Jelajah Buku Pembukaan** di Latihan Repertoar; tombol itu kembali ke mode papan Analisa tanpa bilah tambahan di atas papan. Panel kanan `Analisa | Buku | Penjelajah | Partai` tetap menjadi detail papan, bukan menu Report Analisa.

**Arsitektur:** `Workspace.jsx` memuat satu mode aktif; papan Opening Book tampil langsung, sedangkan Manusia vs Mesin dan Latihan Repertoar dimuat malas. Pastikan papan dan panel muat di tinggi layar laptop tanpa scrollbar halaman/papan; jangan menambah teks pengantar atau bilah di atas papan. Jangan menjalankan engine ketika mode permainan tidak aktif atau memuat katalog pembukaan sebelum pengguna masuk ke alur yang memerlukannya.

**Jangan duplikasi:** fitur Report Analisa, Teka-teki, Teka-teki Rush, database PGN, ekspor PGN, dan statistik akun yang sudah ada. Pencarian kartu hanya memakai jalur opening lokal yang dipilih pengguna.

**Referensi:** En Croissant digunakan sebagai sumber konsep UX. Jangan menyalin kode/aset GPL-3.0 ke proyek MIT; implementasikan pola sesuai stack dan batas browser ChessClub. Jangan menambah ide antarmuka atau mode yang tidak diminta pengguna.

**Jika pengguna meminta pemulihan:** [PR #146](https://github.com/Delta-Polder-Indonesia/ChessClub/pull/146) pada `arena/01a0d842-chessclub` adalah snapshot sebelum Papan Interaktif dimodifikasi. Riset/ambil snapshot itu sebagai acuan untuk mengembalikan **seluruh area Papan Interaktif** ke perilaku lama, bukan untuk menimpa fitur lain atau melakukan rollback otomatis. Lihat langkah dan batas persetujuan di skill lengkap.

**Uji:** `npm run uji:repertoar`, `npm run uji:i18n`, `npm run uji:rute`, dan `npm run build`; lihat skill lengkap untuk uji regresi papan/engine.
