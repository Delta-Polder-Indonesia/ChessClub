# Rencana refactor modul Analisa

Status: **selesai** — Fase 0–5 tuntas (Fase 4 dikerjakan paling akhir sesuai permintaan).
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
| 4 | Integrasi Maia | **dikerjakan lalu DICABUT** (2026-11-07) | panel/ mesin Maia dihapus; Maia hanya di mode Manusia vs Mesin → lihat bawah |
| 5 | `mesin/antiCheat.js` (1487) → empat lapisan | **selesai** (2026-11-06) | `mesin/antiCheat/{dasar,kalibrasi,skor,agregat}.js`; 417 uji anti-cheat tetap hijau |

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

## Fase 4 — integrasi Maia (dikerjakan, lalu dicabut)

Dikerjakan 2026-11-06: `mesin/prediksiMaia.js` menyambungkan `src/lib/maia3.js`
ke `mesin/deviasiManusia.js`, lalu dipasang ke layar Deteksi engine sebagai
panel "Distribusi manusia (Maia)" dengan setelan sendiri.

**Dicabut 2026-11-07.** Alasannya dari pemakaian, bukan dari kode: satu layar
deteksi berisi dua mesin dengan dua jenis hasil dan dua arti "pengaturan"
membingungkan. Urutan percobaan yang gagal, supaya tidak diulang:

1. panel terpisah di bawah kolom hasil → layar jadi tiga kolom & halaman makin
   tinggi;
2. Maia sebagai pilihan mesin + blok setelan sendiri (kecepatan, jumlah
   partai, rating) → dua set pengaturan untuk satu pekerjaan;
3. Maia sebagai pilihan mesin dengan kolom Elo menggantikan kedalaman dan
   tombol unduh bertahap → lebih rapi, tetapi tetap "mesin kedua" di layar
   yang bahasa visualnya Stockfish.

Keputusan akhir: **Deteksi engine murni Stockfish.** Maia tetap dipakai di
Papan Interaktif (mode Manusia vs Mesin). Kode yang ikut dihapus karena tanpa
pemanggil: `mesin/{prediksiMaia,deviasiRiwayat,deviasiManusia,uraiPgn}.js`,
`komponen/nav/{PanelDeviasiManusia,useDeviasiManusia}.jsx` (+ hook .js),
`komponen/game/{panahSorot,lompatLangkah}.js`, dan uji
`uji-prediksi-maia.mjs` + `uji-deviasi-riwayat.mjs`.

Kalau nanti Maia ingin masuk Analisa lagi: buat **halaman sendiri**
(mis. "Deteksi manusia"), jangan menumpang layar deteksi Stockfish.

Yang **tetap terbuka** di Analisa: kalibrasi ulang `KALIBRASI_RATING` dengan
korpus lokal (langkah 2 di README Analisa) dan cache agregat di server
(langkah 3, opsional).

## Fase 5 — `mesin/antiCheat.js` (risiko sedang)

Alasan: setelah Fase 3, berkas inilah yang terbesar di modul Analisa (1487
baris) dan mencampur empat urusan — konstanta & metrik mentah, kalibrasi
rating, skor satu partai, dan agregat riwayat. Setiap perubahan kecil menuntut
membaca seluruh berkas.

| Berkas | Baris | Isi |
|---|---|---|
| `mesin/antiCheat.js` | 92 | Dokumentasi konvensi eval + re-ekspor; **API publik tidak berubah** |
| `mesin/antiCheat/dasar.js` | 377 | Konstanta, utilitas eval, kandidat MultiPV, statistik waktu |
| `mesin/antiCheat/kalibrasi.js` | 89 | Tabel kalibrasi + komponen skor 0–100 |
| `mesin/antiCheat/skor.js` | 482 | Skor satu partai (`skorKecurigaan`) |
| `mesin/antiCheat/agregat.js` | 528 | Agregat riwayat + tren |

Bentuk pemecahannya mengikuti Fase 1 (`basisData.js` → `database/*` dengan
fasad tipis), jadi tidak ada pola baru yang perlu dipelajari pembaca.

Bukti bahwa ini benar-benar refactor, bukan penulisan ulang:

1. **Potongan byte-identik.** Tiap bagian dipotong dari berkas asli pada batas
   baris eksplisit dan diperiksa ulang dengan uji substring — bukan disalin
   ulang dengan tangan.
2. **API publik utuh.** `Object.keys()` modul dibandingkan sebelum dan sesudah:
   47 nama lama semuanya masih ada; tambahannya hanya tiga helper yang harus
   menyeberang modul (`batasi01`, `rataRata`, `bulat1`).
3. **Arah ketergantungan satu jalur** `dasar → kalibrasi → skor → agregat`.
   `dasar` tidak mengimpor siapa pun di folder itu, `agregat` tidak diimpor
   siapa pun — jadi tidak ada siklus yang bisa muncul kemudian.
4. **Uji tidak disentuh.** `uji-anticheat.mjs` (417) dan seluruh rangkaian
   Analisa (1133) hijau tanpa satu pun perubahan pada berkas uji.

## Pagar yang sudah terpasang

- `npm run uji:dokumentasi` — membandingkan setiap angka di README dengan
  keluaran skrip uji asli, versi kunci cache anti-cheat dengan konstanta di
  kode, dan jumlah kunci i18n. Gagal bila menyimpang (±50 detik).
- README bagian *Baseline terukur* — jumlah pemeriksaan per suite, ukuran
  bundle, waktu build, dan tabel render per detak konteks.
