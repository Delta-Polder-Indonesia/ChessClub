# Papan Interaktif — Workspace Modular

> Panduan lengkap: `.agents/skills/kci-papan-interaktif/SKILL.md` (identik dengan `.opencode/skills/kci-papan-interaktif/SKILL.md`).

**Sidebar tahap ini berisi tepat tiga pilihan:**
1. **Analisa** — tautan ke halaman `/program-kami/analisa`; tidak menggandakan fitur.
2. **Manusia vs Mesin** — permainan melawan Stockfish lokal. Worker single-thread hanya dimulai saat mesin harus bergerak dan dihentikan saat mode/partai selesai.
3. **Latihan Repertoar** — tambahkan jalur pembukaan, latih langkah sisi pilihan, nilai tingkat kesulitan untuk jadwal pengulangan, dan simpan progres lokal di IndexedDB.

Buku Pembukaan yang ada tetap tersedia melalui tombol **Jelajah Buku Pembukaan** di Latihan Repertoar, bukan sebagai item sidebar keempat. Panel kanan `Analisa | Buku | Penjelajah | Partai` tetap menjadi detail Buku Pembukaan.

**Arsitektur:** `Workspace.jsx` memuat satu mode aktif; Manusia vs Mesin, Latihan Repertoar, dan tampilan Buku Pembukaan dimuat malas. Jangan menjalankan engine ketika mode permainan tidak aktif atau memuat katalog pembukaan sebelum pengguna masuk ke alur yang memerlukannya.

**Jangan duplikasi:** fitur Analisa, Teka-teki, Teka-teki Rush, database PGN, ekspor PGN, dan statistik akun yang sudah ada. Pencarian kartu hanya memakai jalur opening lokal yang dipilih pengguna.

**Referensi:** En Croissant digunakan sebagai sumber konsep UX. Jangan menyalin kode/aset GPL-3.0 ke proyek MIT; implementasikan pola sesuai stack dan batas browser ChessClub.

**Uji:** `npm run uji:repertoar`, `npm run uji:i18n`, `npm run uji:rute`, `npm run uji:peta`, dan `npm run build`; lihat skill lengkap untuk uji regresi papan/engine.
