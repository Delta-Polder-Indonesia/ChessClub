# Rencana refactor modul Analisa

Status: **berjalan** — Fase 0–2 selesai, Fase 3 berikutnya, Fase 4 (Maia) paling akhir.
Dokumen acuan teknis tetap `src/halaman/Analisa/README.md`; berkas ini hanya
mencatat **rencana dan status**, bukan detail perilaku.

> Catatan asal-usul: rencana ini berasal dari audit modul Analisa (523 baris,
> disusun 2026-11) yang disimpan **di luar repo** dan tidak ikut ter-commit.
> Berkas ini adalah ringkasan yang dapat dilacak; angka dan klaim di dalamnya
> yang bisa diukur sudah dipindahkan ke README (bagian *Baseline terukur*) dan
> dijaga `npm run uji:dokumentasi`.

## Prinsip yang tidak boleh dilanggar

1. **API publik tidak berubah.** `AnalyzeContext` tetap berbentuk sama
   (semua slot `[nilai, setter]`, `players` sudah dinormalisasi,
   `gameController` stabil). Pemecahan konteks dilakukan di belakangnya.
2. **Tanpa perubahan UI dan perilaku.** Refactor yang mengubah perilaku harus
   dipisah ke perubahan sendiri, dengan alasannya dicatat.
3. **Uji tidak dilonggarkan.** Kalau harness perlu disesuaikan karena struktur
   berubah (mis. jembatan konteks di `uji-analisa-ui.mjs`), penyesuaian itu
   harus dibuktikan perlu — lihat kontrol negatif pada Fase 2c.
4. **Dokumentasi = sumber kebenaran.** Angka di README diverifikasi
   `npm run uji:dokumentasi`; dokumen yang menyimpang dianggap cacat.

## Status per fase

| Fase | Isi | Status | Bukti |
|---|---|---|---|
| 0 | Sinkronisasi dokumentasi & baseline | **selesai** (2026-11-06) | README bagian *Baseline terukur*; `scripts/uji-dokumentasi-analisa.mjs` |
| 1 | `basisData.js` → `database/*` | **selesai** | commit `25ed51d` (PR #231) |
| 2 | Pisahkan `BoardContext` + `ImportContext` | **selesai** | commit `d10e8b1`, `34636c3`, `88e428a` (PR #231) |
| 3 | Pecah komponen raksasa | **selesai** (2026-11-06) | `komponen/nav/database/*` + `komponen/game/useMuatPartai.js` / `useAnalisisPapan.js` |
| 4 | Integrasi Maia | **selesai** (2026-11-06) | `mesin/prediksiMaia.js`, `umpanBalik/…` → lihat bawah |

Fase 1–2 sudah merge ke `main` lewat PR #231 (merge commit `2bc3868`).
Ringkasannya: `basisData.js` (867 baris) jadi fasad 46 baris + enam modul
`database/`; `analyze.jsx` (155 baris) jadi 66 baris lapisan kompatibilitas di
atas `BoardProvider > ImportProvider`.

## Fase 3 — komponen raksasa (risiko sedang)

Alasan: `layarDatabase.jsx` (2331 baris) dan `game.jsx` (863 baris) menyatukan
kueri data, state UI, dan tata letak dalam satu berkas sehingga perubahan kecil
sulit ditelusuri dan diuji.

| Berkas | Aksi | R | Isi |
|---|---|---|---|
| `komponen/nav/database/tautanDatabase.jsx` | baru | R | Dialog, Notifikasi, Skeleton (±250 baris) |
| `komponen/nav/database/tabelPartai.jsx` | baru | S | `HeaderTabel`, `BarisPartai`, `HeaderKolom`, `MenuKolom`, `DropdownPilih`, ikon (±600) |
| `komponen/nav/database/tabelRingkasan.jsx` | baru | S | `TabelRingkasan` (±300) |
| `komponen/nav/layarDatabase.jsx` | ubah | S | tinggal orkestrasi (±700) |
| `komponen/game/useMuatPartai.js` | baru | T | alur `handlePGN` + `muatSeqRef` |
| `komponen/game/useAnalisisPapan.js` | baru | T | alur `analyzeMove` + `analyzeControllerRef` + `analyzingMoveRef` |
| `komponen/game/game.jsx` | ubah | T | ±350 baris (orkestrasi + layout) |

Status langkah 1 (`layarDatabase`, 2026-11-06): selesai dalam satu perubahan —
2331 → 1430 baris, dengan empat modul baru di `komponen/nav/database/`:
`formatDatabase.js` (utilitas + konstanta), `ikonDatabase.jsx`, `tabelPartai.jsx`
(`DropdownPilih`, `BarisSkeleton`, `HeaderTabel`, `BarisPartai`, `HeaderKolom`,
`MenuKolom`), dan `tabelRingkasan.jsx` (`TabelRingkasan`). Nama "Dialog/
Notifikasi/Skeleton" pada rencana awal ternyata tidak sesuai isi berkas: dialog
dan notifikasi adalah JSX inline di dalam `LayarDatabase` (butuh state-nya),
jadi yang berdiri sendiri hanya skeleton, ikon, tabel, dan dropdown. Rincian
per berkas ada di README bagian *Peta berkas layar Database (Fase 3)*.

Status langkah 2 (`game.jsx`, 2026-11-06): selesai. 863 → 486 baris, dengan
`useMuatPartai.js` (338 baris: `handlePGN`, `handleFEN`, efek `[data]`, tabel
pembukaan) dan `useAnalisisPapan.js` (193 baris: `analyzeMove`,
`analyzingMoveRef`). Keduanya berbagi `muatSeqRef`/`controllerRef`/`openingsRef`
— pemiliknya `useMuatPartai`, diserahkan ke `useAnalisisPapan` — supaya
semantik balapan (muatan baru mengalahkan analisis langkah yang tertahan,
tombol Batal tetap hidup) tidak bergeser. Rincian ada di README bagian *Peta
berkas papan*.

Fase 3 selesai. Berikutnya Fase 4 (Maia), sengaja paling akhir dan dalam PR
sendiri. Setiap langkah:
`npm run uji:analisa-menyeluruh`, `node scripts/uji-analisa-ui.mjs`,
`node scripts/uji-basisdata-galat.mjs`, `npm run lint`, `npm run build`,
lalu `npm run uji:dokumentasi` bila ada angka dokumentasi yang bergeser.

## Fase 4 — integrasi Maia (risiko tinggi, terpisah)

Disambungkannya `mesin/deviasiManusia.js` ke prediksi Maia
(`src/lib/maia3.js` → `Map<fen, {uci: prob}>`). Kontrak yang dibekukan (lihat
`docs/MAIA3.md`) wajib dipertahankan: `hitungDeviasiManusia` berkunci **fen
sebelum langkah**, model `maia3-simplified-1`.

Status: **selesai** (2026-11-06), dalam dua PR:

1. **Penyedia** — `mesin/prediksiMaia.js` (`posisiUntukPrediksi`,
   `prediksiManusia`, `deviasiManusiaDariMaia`), diuji `npm run
   uji:prediksi-maia` (19) dengan mesin tiruan, tanpa ONNX/worker.
2. **Pemasangan ke layar** — tombol "Analisis distribusi manusia" di Deteksi
   engine: `komponen/nav/PanelDeviasiManusia.jsx` +
   `komponen/nav/useDeviasiManusia.js`, di atas `mesin/deviasiRiwayat.js`
   (rata-rata berbobot sampel lintas partai) dan `mesin/uraiPgn.js` (pengurai
   PGN tanpa Stockfish). Model 45 MB hanya diunduh setelah tombol ditekan;
   pemakaian berikutnya memakai cache.
3. **Sorotan per langkah** — `rincianDeviasiManusia` + `langkahTersorot`
   (lima teratas), dengan tombol **Buka** yang memuat partai ke papan pada
   langkah itu (`data.lompatKe` + `komponen/game/lompatLangkah.js`).

   Dijaga `npm run uji:deviasi-riwayat` (32) + 2 pemeriksaan UI di
   `uji-anticheat.mjs` (428).

Yang **tidak** dikerjakan di fase ini dan tetap terbuka: kalibrasi ulang
`KALIBRASI_RATING` dengan korpus lokal (langkah 2 di README Analisa) dan cache
agregat di server (langkah 3, opsional).

## Pagar yang sudah terpasang

- `npm run uji:dokumentasi` — membandingkan setiap angka di README dengan
  keluaran skrip uji asli, versi kunci cache anti-cheat dengan konstanta di
  kode, dan jumlah kunci i18n. Gagal bila menyimpang (±50 detik).
- README bagian *Baseline terukur* — jumlah pemeriksaan per suite, ukuran
  bundle, waktu build, dan tabel render per detak konteks.
