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
| 3 | Pecah komponen raksasa | **belum** | rencana di bawah |
| 4 | Integrasi Maia | **belum**, sengaja paling akhir | `docs/MAIA3.md` |

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

Urutan kerja yang disarankan: `tautanDatabase` → `tabelRingkasan` →
`tabelPartai` → `layarDatabase` tinggal orkestrasi; setelah itu
`useMuatPartai`/`useAnalisisPapan` untuk `game.jsx`. Setiap langkah:
`npm run uji:analisa-menyeluruh`, `node scripts/uji-analisa-ui.mjs`,
`node scripts/uji-basisdata-galat.mjs`, `npm run lint`, `npm run build`,
lalu `npm run uji:dokumentasi` bila ada angka dokumentasi yang bergeser.

## Fase 4 — integrasi Maia (risiko tinggi, terpisah)

Disambungkannya `mesin/deviasiManusia.js` ke prediksi Maia
(`src/lib/maia3.js` → `Map<fen, {uci: prob}>`). Kontrak yang sudah dibekukan
(lihat `docs/MAIA3.md`) wajib dipertahankan: `hitungDeviasiManusia` berkunci
**fen sebelum langkah**, model `maia3-simplified-1`. Dikerjakan setelah Fase 3
stabil, dalam PR sendiri.

## Pagar yang sudah terpasang

- `npm run uji:dokumentasi` — membandingkan setiap angka di README dengan
  keluaran skrip uji asli, versi kunci cache anti-cheat dengan konstanta di
  kode, dan jumlah kunci i18n. Gagal bila menyimpang (±50 detik).
- README bagian *Baseline terukur* — jumlah pemeriksaan per suite, ukuran
  bundle, waktu build, dan tabel render per detak konteks.
