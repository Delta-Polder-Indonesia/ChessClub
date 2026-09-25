# Papan Interaktif — ONLY Opening Book

> Skill lokal. Sumber utama: `.agents/skills/kci-papan-interaktif/SKILL.md`

**Tujuan:** belajar pembukaan saja, bukan main vs engine.

**File:** `PapanInteraktif.jsx` (~1800 baris — komponen halaman; kode folder ini juga dipecah ke `konstanta.js`, `utilPapan.js`, `gunakanDialog.js`, dan komponen pembantu `IkonTab.jsx`, `BukuPembukaan.jsx`, `KartuArtikelPembukaan.jsx`, `DaftarRiwayat.jsx`, `TangkapanBidak.jsx`, `MasukanPgn.jsx`, `LangkahExplorer.jsx`, `PanelBasisDataAwan.jsx`, `PopupPengaturan.jsx`)

**Data:** `public/data/buku-pembukaan.json` (lichess-org/chess-openings, CC0) → `pohonDariDaftar()` → tree `{n, c}`

**Fitur inti:**
- Telusur jalur `e2e4` / `e4` → nama ECO + saran 8 langkah + stat games/winrate/rating
- Katalog ECO group per keluarga (`:` split)
- Explorer table + winrate bar + artikel Wikibooks (fetch hanya tab explorer, cache session)
- Riwayat SAN + FEN + PGN/FEN loader + tangkapan bidak + orientasi

**Batasan:**
- DILARANG tambah mode pve/pvp/swap/skill/elo/depth — itu di Analisa
- DILARANG ganti board ke cm-chessboard/chessground/react-chessboard
- DILARANG tambah openings.bin Polyglot atau COOP/COEP multi-thread
- Engine optional hanya untuk eval bar, bukan mode tanding

**Uji:** `uji:nama-pembukaan`, `uji:artikel-wikipedia`, `uji:rute`, `uji:i18n`, `build`

Lihat skill lengkap di `.agents/skills/kci-papan-interaktif/SKILL.md`
