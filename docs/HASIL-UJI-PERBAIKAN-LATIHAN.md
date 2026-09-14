# Hasil Uji: Perbaikan Empat Fitur Latihan

**Tanggal:** 2026-09-13 · **Cabang:** `arena/01a09840-chessclub` · **Commit acuan:** `65ac718` ·
**Basis:** `b431ac8` (main) · **PR:** [#118](https://github.com/Delta-Polder-Indonesia/ChessClub/pull/118)

Dokumen ini merekam **data hasil uji** untuk pekerjaan langkah 1-7, 10, A1, dan C5 di
[`REVIEW-PERBAIKAN-LATIHAN.md`](./REVIEW-PERBAIKAN-LATIHAN.md). Semua angka di bawah adalah keluaran
perintah yang benar-benar dijalankan pada commit di atas, bukan perkiraan.

**Lingkungan uji:** Node v22.22.3, `npm ci` (595 paket), sistem tanpa peramban. Peramban tidak tersedia
sehingga `npm run uji:e2e` tidak dapat dijalankan lokal; jalur browser dijalankan GitHub Actions pada PR
(#118) dan lulus (job "Test and browser smoke checks", 3m12s).

## 1. Ringkasan per langkah

| Langkah | Temuan | Commit | Uji utama | Hasil |
| --- | --- | --- | --- | --- |
| 1 | C1 ikon kategori Kuis | `44cc05a` | `npm run uji:quiz` + harness `quiz` | 1 masalah **pra-ada** (soal #83); harness 5 lulus / 0 gagal |
| 2 | A6 satu sumber `bukaPengaturan` | `c25bd24` | harness `tekateki-panel` | 8 lulus / 0 gagal (pra-A6: 7 lulus / 1 gagal) |
| 3 | C2 + C3 persistensi peringkat | `c0e8307`, `be8c97e` | harness `quiz-peringkat`, `quiz-duplikat` | 8/0 dan 5/0 (pra-C2: 2 penulisan) |
| 4 | A3 + B2 jejak kegagalan storage | `0844059`, `8e61f15` | harness `tekateki-storage-gagal`, `rush-storage-gagal` | 5/0 (10 jejak) dan 5/0 (6 jejak) |
| 5 | B3 + C4 dependensi `useCallback` | `6318376`, `5c35e21` | `npm run uji:rush` | 9 lulus / 0 gagal |
| 6 | A2 + B1 modul `src/lib/tekaTeki.js` | `80d6b1f`, `cb876b8` | 5 uji tema (b) + semuanya di rantai `uji` | semua lulus (lihat §2) |
| 7 | A4 + A5 opsi + komentar dependensi | `3ceab61`, `1337fa9` | `npm run uji:tekateki-solusi` + harness `tekateki-panel` | 9/0 dan 8/0 |
| 10 | D1-D3 i18n & data Pembukaan | `151ce80`, `6ceb28a`, `5428441` | `npm run uji:i18n` + harness `pembukaan` | 2081 kunci seimbang; 8/0 (ID) dan 8/0 (EN) |
| A1 | langkah penutup persis solusi | `9cb68b5` | `npm run uji:tekateki-solusi` | 9 lulus / 0 gagal (pra-A1: 6 lulus / 3 gagal) |
| C5 | peringkat Kuis tetap lokal | `65ac718` | dokumentasi README | tidak ada perubahan perilaku |

## 2. Rantai `npm run uji` (22 skrip, semuanya exit 0)

| # | Perintah | Waktu | Ringkasan keluaran |
| --- | --- | --- | --- |
| 1 | `npm run uji:rute` | 0s | OK — 34 rute publik selaras. |
| 2 | `npm run uji:seo` | 0s | OK — 34 rute publik punya metadata sendiri, 34 URL sitemap selaras. |
| 3 | `npm run uji:i18n` | 0s | OK — 2081 kunci ID = 2081 kunci EN; 879 kunci terpakai semuanya ada. |
| 4 | `npm run uji:tools` | 1s | OK — komponen tools me-render markup yang dijanjikan. |
| 5 | `npm run uji:komentator` | 1s | OK — 4264 pemeriksaan lulus. |
| 6 | `npm run uji:analisa` | 0s | 30 pemeriksaan lulus, 0 gagal. |
| 7 | `npm run uji:analisa-ui` | 16s | 68 pemeriksaan lulus, 0 gagal. |
| 8 | `npm run uji:engine` | 7s | Hasil: 31 lulus, 0 gagal — semua pemeriksaan navigasi langkah lulus. |
| 9 | `npm run uji:analisa-menyeluruh` | 8s | Hasil: 11 lulus, 0 gagal. |
| 10 | `npm run uji:suara` | 0s | OK — suara papan siap dipakai. |
| 11 | `npm run uji:basisdata` | 3s | 34 pemeriksaan lulus, 0 gagal. |
| 12 | `npm run uji:lencana-skakmat` | 4s | 31 lulus, 0 gagal. |
| 13 | `npm run uji:tanda-papan` | 1s | 14 lulus, 0 gagal. |
| 14 | `npm run uji:tekateki-solusi` **(baru)** | 3s | 9 lulus, 0 gagal. |
| 15 | `npm run uji:rush` | 11s | 9 lulus, 0 gagal. |
| 16 | `npm run uji:gambar` | 0s | OK — 1 gambar responsif, 1 varian terdaftar di public/. |
| 17 | `node scripts/uji-identitas.mjs` | 0s | 36 lulus, 0 gagal. |
| 18 | `npm run uji:skema` | 0s | 9 lulus, 0 gagal. |
| 19 | `node scripts/uji-ebook.mjs` | 7s | OK — 32 entri e-book, 32 berkas PDF, semuanya konsisten. |
| 20 | `node scripts/uji-ebook-pembaca.mjs` | 1s | 15 lulus, 0 gagal — pembaca e-book aman. |
| 21 | `node scripts/uji-nama-pembukaan.mjs` | 0s | Semua pemeriksaan nama pembukaan lulus. |
| 22 | `node scripts/uji-artikel-wikipedia.mjs` | 0s | Semua pemeriksaan referensi Wikibooks lulus. |

Perintah lain:

| Perintah | Hasil |
| --- | --- |
| `npm run build` | sukses, `✓ built in 11.12s` (peringatan ukuran chunk pra-ada, tidak diubah) |
| `npm run uji:quiz` | **1 masalah pra-ada**: `[83] ada pilihan yang duplikat` (lihat §5) |

## 3. Uji UI sementara (harness jsdom, di luar repo)

Harness ditulis di `/tmp/uji-ui-temp.mjs` karena repo ini belum punya skrip UI untuk halaman-halaman
tersebut. Hasilnya di bawah; harness-nya sendiri tidak ikut di-commit.

| Mode | Yang diperiksa | Hasil |
| --- | --- | --- |
| `quiz` | 10 id `DAFTAR_KATEGORI` punya ikon; 11 berkas `IKON_KATEGORI` terpakai; 10 label kategori tampil; tak ada kunci kamus mentah | 5 lulus / 0 gagal |
| `quiz-peringkat` | nama → Mulai → jawab 1 soal → Menyerah: hitungan `localStorage.setItem("blunderskuad.quiz.peringkat")` = **1**, tersimpan 1 baris | 8 lulus / 0 gagal |
| `quiz-duplikat` | benih `[Cici 2/4, Dodi 9/9, Cici 6/8]` → dimuat jadi **2 baris** `[Dodi 9/9, Cici 6/8]`, tidak ditulis ulang saat halaman dibuka | 5 lulus / 0 gagal |
| `pembukaan` | judul Sejarah, dua ayat, catatan a6/f5 dari kamus, papan utama tergambar, tak ada kunci mentah | 8 lulus / 0 gagal |
| `pembukaan-en` | sama, untuk bahasa Inggris ("History", "Spanish Torture", "Morphy Defense (Main)") | 8 lulus / 0 gagal |
| `tekateki-panel` | gear ada; panel tertutup; panah diteruskan saat tertutup; panel terbuka; **panah TIDAK diteruskan saat panel terbuka**; Escape menutup; panah kembali | 8 lulus / 0 gagal |
| `tekateki-storage-gagal` | storage melempar: 64 petak tetap tampil, tanpa layar gagal, **10 jejak** `[penyimpanan]` dengan 9 label berbeda | 5 lulus / 0 gagal |
| `rush-storage-gagal` | sama untuk Rush: **6 jejak** dengan 6 label berbeda | 5 lulus / 0 gagal |

Label jejak yang terlihat (bukti A3/B2):

- Teka-teki: baca daftar teka-teki terpecahkan, baca posisi terakhir, baca set bidak, baca warna papan,
  baca mode otomatis, simpan set bidak, simpan warna papan, simpan mode otomatis, simpan posisi terakhir.
- Rush: baca set bidak, baca warna papan, baca username, simpan set bidak, simpan warna papan,
  baca skor tersegel.

## 4. Uji pembeda (kode pra-perbaikan vs pasca)

Uji yang tidak gagal di kode lama tidak membuktikan apa pun. Tiga uji kunci dijalankan terhadap kode
sebelum perbaikannya dengan menukar berkas sementara (lalu dipulihkan, `git status` bersih):

| Uji | Kode pra-perbaikan | Hasil pra | Hasil pasca |
| --- | --- | --- | --- |
| `npm run uji:tekateki-solusi` | `TekaTeki.jsx` @ `5428441` (sebelum A1) | 6 lulus, **3 gagal** — mate alternatif diterima, tak ada pesan salah, soal tercatat terpecahkan | 9 lulus, 0 gagal |
| harness `tekateki-panel` | `TekaTeki.jsx` @ `44cc05a` (sebelum A6) | 7 lulus, **1 gagal** — "panah TIDAK diteruskan ke papan saat panel terbuka" | 8 lulus, 0 gagal |
| harness `quiz-peringkat` | `QuizCatur.jsx` @ `44cc05a` (sebelum C2) | penulisan peringkat = **2** | penulisan peringkat = 1 |

## 5. Yang tidak lulus / tidak dapat dijalankan

1. **`npm run uji:e2e` tidak jalan di lingkungan ini.** `npx playwright install chromium` gagal
   (`Failed to download Chrome for Testing 151.0.7922.34`) dan tidak ada peramban sistem. Jalan pintasnya
   sudah dijalankan di CI: PR #118 lulus job "Test and browser smoke checks" (3m12s).
2. **`npm run uji:quiz` gagal pada soal nomor 83** — pilihan "Selalu diawali P" dan "Selalu diawali p"
   dianggap duplikat (perbandingan tanpa beda huruf besar/kecil). Sudah ada di basis `b431ac8`, di luar
   langkah 1-7/10, dan tidak diubah di PR ini. Catatan tambahan: `uji:quiz` juga belum ikut rantai
   `npm run uji` (temuan C6, di luar cakupan).
   *Pembaruan (PR #123):* distraktor ketiga soal 83 diganti menjadi "Ditulis lengkap, misalnya
   pawn e4" sehingga tidak lagi berbeda hanya di huruf besar/kecil; `kunci` tetap 0 dan
   `npm run uji:quiz` lulus. `uji:quiz` sengaja masih di luar rantai `npm run uji` — memasukkannya
   berarti menambah langkah ke setiap job CI dan perlu keputusan terpisah.

## 6. Perintah reproduksi

```bash
npm ci
npm run uji          # 22 skrip, semua lulus
npm run build
npm run uji:i18n
npm run uji:tekateki-solusi           # uji A1 (baru, ikut rantai uji)
npm run uji:quiz                      # dulu gagal pra-ada (soal #83), kini lulus
node scripts/uji-rush-waktu.mjs       # langkah 5
node scripts/uji-tanda-papan.mjs      # langkah 6
```

Uji pembeda (§4):

```bash
# A1: uji baru vs kode sebelum A1
cp src/halaman/TekaTeki/TekaTeki.jsx /tmp/tt-sekarang.jsx
git show 5428441:src/halaman/TekaTeki/TekaTeki.jsx > src/halaman/TekaTeki/TekaTeki.jsx
node scripts/uji-tekateki-solusi.mjs        # 6 lulus, 3 gagal
cp /tmp/tt-sekarang.jsx src/halaman/TekaTeki/TekaTeki.jsx

# A6 dan C2 lewat harness sementara /tmp/uji-ui-temp.mjs
# (skripnya tidak disimpan di repo; lihat §3 untuk daftar mode)
```

## 7. Daftar commit (17)

```
65ac718 Catat di README bahwa peringkat Kuis hanya lokal
9cb68b5 Wajibkan langkah penutup Teka-Teki persis solusi
5428441 Ganti matriks papan Ruy Lopez dengan posisi dari FEN
6ceb28a Naikkan kandidat langkah lanjutan Pembukaan ke data berkunci kamus
151ce80 Pindahkan teks Sejarah Pembukaan ke kamus terjemahan
1337fa9 Tulis alasan dependensi yang dilepas di lima efek Teka-Teki
3ceab61 Beri opsi pertahankanSelesai pada terapkanSoal
cb876b8 Pakai bersama pemeriksaan promosi dan solusi Teka-Teki/Rush
80d6b1f Pindahkan parseLangkah dan terapkan Teka-Teki ke modul bersama
5c35e21 Hapus eslint-disable yang tidak diperlukan di mulai Kuis
6318376 Buang dependensi promo yang tidak dipakai di cobaLangkah Rush
8e61f15 Tinggalkan jejak saat akses localStorage Rush gagal
0844059 Tinggalkan jejak saat akses localStorage Teka-Teki gagal
be8c97e Satukan logika gabung peringkat Kuis di satu modul
c0e8307 Buang penulisan localStorage ganda di catatHasil Kuis
c25bd24 Satukan state panel pengaturan Teka-Teki di komponen halaman
44cc05a Perbaiki ikon kategori Kuis Catur yang hilang
```
