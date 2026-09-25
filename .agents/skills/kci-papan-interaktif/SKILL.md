---
name: kci-papan-interaktif
description: Panduan khusus halaman Papan Interaktif - ONLY untuk belajar opening book, bukan untuk main vs engine. Mengatur sumber data buku pembukaan, logika pohon, explorer stats, artikel Wikibooks, dan batasan fitur agar tidak melebar ke mode PvE/analisa.
metadata:
  project: chessclub-kci
  area: frontend
  halaman: papan-interaktif
---

# Papan Interaktif — ONLY Opening Book

Skill ini mengunci tujuan halaman `src/halaman/PapanInteraktif/PapanInteraktif.jsx`: **hanya untuk belajar pembukaan**, bukan untuk bermain melawan Stockfish, bukan untuk analisa partai full.

Ikuti protokol di `AGENTS.md` dan `kci-frontend`. Perubahan di luar scope opening harus ditolak.

## Tujuan satu kalimat

User membuka papan kosong, memainkan langkah pembukaan, langsung melihat:
- nama ECO + varian,
- saran lanjutan dari buku,
- statistik games / winrate / rating,
- katalog pembukaan yang bisa dicari,
- artikel ringkasan Wikibooks Chess Opening Theory,
- riwayat langkah + FEN/PGN loader.

Tidak ada: vs engine, skill level, elo, depth slider, hint panah engine battle, side swap, PvP.

## Batasan keras — ONLY opening

### BOLEH
- Papan bebas dengan `chess.js` + `ChessPiece.jsx` (14 set bidak existing).
- Pohon pembukaan dari `public/data/buku-pembukaan.json` (format Lichess flat `[{eco, opening, moves: "e2e4 e7e5 ..."}]`).
- Normalisasi nama via `src/lib/namaPembukaan.js` (`normalkanPohonPembukaan`, `standarkanNamaPembukaan`).
- Mode kunci pohon: `koordinat` (`e2e4`) atau `san` (`e4`). Deteksi otomatis `modeDariPohon()`.
- Explorer stats: `games`, `white_win_rate`, `black_win_rate`, `draw_rate`, `avg_rating` via `statTurunan()`.
- Artikel Wikibooks via `src/lib/artikelWikipedia.js` (`ambilArtikelPembukaan`, `lihatArtikelTercache`) — hanya load saat tab Explorer aktif, debounce 300ms.
- Riwayat SAN, FEN, PGN loader sederhana (`MasukanPgn`), undo/redo, orientasi papan, tangkapan bidak (opsional, untuk konteks visual).
- Engine **opsional** hanya sebagai pembantu evaluasi posisi pembukaan (existing `gunakanEngineCatur` boleh tetap, tapi jangan jadikan mode utama). Jika engine nyala, hanya tampil eval bar + best line, bukan mode tanding.

### DILARANG
- Menambah mode `pve`, `pvp`, `analysis infinite`, `side swap`, `skill level 1-20`, `elo`, `move time` seperti di `stockfish-chess-web-gui`. Itu sudah ada di halaman Analisa.
- Mengganti board ke `cm-chessboard` / `chessground` / `react-chessboard`. Pertahankan board custom React existing agar konsisten dengan 14 set bidak.
- Menambah `PolyglotRunner` / `openings.bin` binary — buku JSON Lichess sudah cukup untuk opening trainer. Jika butuh, diskusi dulu.
- Menambah header COOP/COEP atau `coi-serviceworker.js` untuk multi-thread WASM. Build single-thread di `public/engines/` sengaja dipilih agar aman di Vercel.
- Menambah anotasi panah warna-warni right-click ala `RightClickAnnotator.js` kecuali diminta explicit — Analisa sudah punya.
- Mengubah Papan Interaktif menjadi full game review (klasifikasi brilliant/blunder) — itu ranah Analisa.

## Sumber data

- **Buku utama**: `public/data/buku-pembukaan.json` — copy dari `lichess-org/chess-openings` (CC0). Format flat harus dikonversi via `pohonDariDaftar()` menjadi `node = { n?: [[eco, nama, stat], ...], c?: { langkah: node } }`.
- **Fallback**: jika file objek pohon lama (key SAN), pakai langsung via `normalkanPohonPembukaan()`.
- **Statistik turunan**: `statTurunan(node)` cari `n` terdekat yang punya `games`.
- **Katalog**: `susunKatalog(pohon)` DFS kumpulkan `{eco, nama, langkah}` urut ECO lalu nama. Untuk dropdown, kelompokkan per keluarga (teks sebelum `:`).
- **Artikel**: Wikibooks `Chess Opening Theory` — cache di sessionStorage via `artikelWikipedia.js`. Jangan fetch jika tab bukan Explorer.

## Struktur file

```
src/halaman/PapanInteraktif/
  PapanInteraktif.jsx   ← satu file 2000+ baris, semua logic di sini
  SKILL.md              ← ringkasan lokal (opsional)
```

Dependensi yang dipakai:
- `chess.js` — validasi langkah, FEN, SAN
- `src/components/chess/ChessPiece.jsx` — render bidak
- `src/lib/namaPembukaan.js` — standarisasi nama
- `src/lib/artikelWikipedia.js` — fetch + cache artikel
- `src/lib/gunakanEngineCatur.js` — opsional, eval saja
- `src/lib/suara.js` — suara langkah (bagi dengan TekaTeki)
- `src/lib/i18n.jsx` — kunci `papan.*`

## Logika inti yang harus dipertahankan

1. **Muat pohon**: `fetch(BASE_URL + data/buku-pembukaan.json)` → Array? `pohonDariDaftar()` : `normalkanPohonPembukaan()`. Set `mode`.
2. **Telusur posisi**: `jalur` = array kunci pohon (koordinat atau SAN). `infoPembukaan` loop `jalur` → `node`, ambil `namaTerdalam` dan `saran` (max 8). `masihDiBuku = cocok && saran.length > 0` — buku dianggap SELESAI juga saat posisi cocok tetapi node-nya daun (16.218 dari 42.417 node buku adalah daun); di situlah basis data awan mengambil alih, jadi jangan kembali memakai `cocok` saja.
3. **Konversi SAN**: jika mode koordinat, `sanDiPosisi(game, k)` untuk tampil SAN manusia.
4. **Riwayat**: `riwayat` = SAN untuk PGN, `riwayatLengkap` untuk forward setelah undo, `fen` untuk board.
5. **PGN/FEN loader**: `sanDariPgn()` buang tag `[]`, komentar `{}`, `()`, nomor langkah, hasil. FEN langsung `new Chess(fen)`.
6. **Artikel**: effect tergantung `namaArtikel` + `riwayat` + `bahasa` + `tabPanel`. Batalkan request sebelumnya via `AbortController`.
7. **Snapshot eval** (jika engine dipakai): simpan per-FEN di `snapshotEvalRef` agar ikon klasifikasi tidak hilang saat navigasi.

## UI — yang ada sekarang, jangan dirusak

- Layout: board kiri, panel kanan tab `analisa | books | explorer | games`.
- Tab `books` = daftar saran langkah + nama pembukaan.
- Tab `explorer` = kartu `Tentang Pembukaan Ini` (blok judul/subjudul/paragraf dari `susunBlokArtikel`).
- Tab `games` = satu tempat untuk LANJUTAN langkah: tabel pembukuan `Langkah | Jumlah | Persen Putih/Seri/Hitam | Pembukaan` selama buku masih punya saran; setelah buku SELESAI (langkah keluar buku ATAU jalur buku habis di daun) tabel itu digantikan DAFTAR langkah basis data awan (chessdb.cn) dengan judul yang sama “Daftar Langkah”. Mode ringkas 1 baris hanya bila sakelar “tampilkan semua langkah” di Pengaturan Papan dimatikan (bawaannya nyala).
- Dialog Review = textarea PGN/FEN → `terapkanTeks`.
- DaftarRiwayat = baris nomor + tombol langkah putih/hitam bisa klik untuk lompat ply.
- Tangkapan bidak = `susunTangkapan(riwayat)` → ikon kecil per jenis.
- Bantuan langkah (assisted play, bawaan MATI): saat bidak diseret, `PapanTekaTeki` melaporkan petak tujuan yang dilintasi lewat `onLewatiPetak` → `gunakanBantuanSeret` menyusun FEN hipotetis (`susunFenHipotetis`), menilai dengan **worker engine KEDUA** (depth 8 / movetime 300, debounce 200 ms, cache per-FEN) → hijau/kuning/merah dari selisih nilai terhadap langkah terbaik posisi sekarang + panah merah balasan lawan (`bestmove` posisi hipotetis). Jangan pakai worker analisa utama untuk ini (bilah eval akan berkedip) dan jangan pindahkan ke chessdb/awan.

Styling: dark theme `#1e1c18` / `#262421` / `#312e2b`, aksen `#81b64c`, bukan tema akademik monokrom. Pertahankan — jangan paksa `Design-System-Reference.md` ke sini kecuali komponen baru benar-benar butuh.

## i18n

Semua label pakai `t("papan.xxx")`. Kunci baru wajib ada di `id` dan `en`. Cek:
- `papan.judul`, `papan.tabAnalisa`, `papan.tabBuku`, `papan.tabPenjelajah`, `papan.tabPartai`
- `papan.warnaBiru` dst, `papan.inputPgnFen`, `papan.kolomLangkah` dll
Jalankan `npm run uji:i18n` setelah menambah kunci.

## Uji penjaga

- `npm run uji:nama-pembukaan` — standarisasi nama
- `npm run uji:artikel-wikipedia` — parser artikel
- `npm run uji:rute` — rute `/papan-interaktif` terdaftar
- `npm run uji:analisa-ui` — jika menyentuh engine hook
- `npm run uji:bantuan-langkah` — logika + hook + gambar bantuan langkah (worker UCI palsu)
- `npm run build` — harus lulus

## Checklist sebelum selesai

- [ ] Tidak menambah mode vs engine / PvP / swap sides
- [ ] Pohon masih load dari `buku-pembukaan.json` (flat maupun tree)
- [ ] Mode koordinat vs SAN tetap auto-detect
- [ ] Explorer stats tetap tampil (games, winrate bar)
- [ ] Artikel hanya fetch saat tab Explorer
- [ ] PGN/FEN loader tetap work
- [ ] `npm run uji:i18n` dan `npm run build` lulus

## Referensi yang BOLEH diadopsi untuk opening-only

- `lichess-org/chess-openings` — sumber ECO terbaru
- Lichess Explorer API `https://explorer.lichess.ovh/masters?fen=...` dan `lichess?fen=...` untuk live stats (jika mau upgrade dari JSON statis)
- Chessable-style trainer: mode tebak langkah pembukaan + spaced repetition (ide, bukan wajib sekarang)

Yang dari `stockfish-chess-web-gui` **tidak** diadopsi untuk halaman ini karena scope-nya beda (PvE). Jika butuh anotasi, diskusikan dulu — Analisa sudah punya.
