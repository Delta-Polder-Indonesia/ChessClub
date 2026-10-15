# Animasi bidak "seperti roket" — apa yang terukur, apa yang diperbaiki

Tanggal: 15 Okt 2026 · Cabang: `arena/4b1602dd-chessclub`
Referensi kebenaran: **isepic-chess-ui** (`_animatePiece`, `_CFG.animationTime`)

---

## 1. Ringkasan

Permintaan: luncuran bidak harus terasa seperti isepic-chess-ui, bukan
"melesat seperti roket, kaku".

Yang saya lakukan: **mengukur animasinya di peramban sungguhan** (Chromium
153, bukan jsdom, bukan pembacaan kode), membandingkannya satu-per-satu
dengan isepic, menelusuri riwayat commit untuk mencari sumber gayanya, lalu
memperbaiki sisa papan yang masih memakai gaya "roket" + menambah uji penjaga
supaya tidak bisa kembali.

Hasil pengukuran satu run (skrip yang sama, peramban yang sama):

| | Papan kita (`/papan-interaktif`) | isepic-chess-ui |
| --- | --- | --- |
| Durasi transisi CSS | `0.3s` | `0.3s` |
| Kurva CSS | `ease` | `ease` |
| Durasi terukur (frame) | **295 ms** | **294 ms** |
| Jarak | 119,3 px (2,27 petak) | 135,1 px (1,99 petak) |
| Kurva p(t) | 46ms=11% · 112ms=58% · 178ms=85% · 245ms=97% | 60ms=22% · 127ms=67% · 194ms=89% · 260ms=99% |
| Vonis | ✓ sama dengan isepic | ✓ (referensi) |

→ Pada kode `main` hari ini, luncuran papan bersama **sudah identik** dengan
isepic. Karena itu keluhan "roket" tidak bisa dijelaskan oleh kode `main`
sekarang — penjelasan yang cocok dengan riwayat ada di §3.

---

## 2. Bagaimana ini diukur (bisa Anda ulangi)

Satu skrip, satu peramban, kedua situs sekaligus:

```bash
CHROME_EXE=/usr/bin/google-chrome node docs/riset-isepic/ukur-animasi-peramban.mjs \
  http://localhost:5173/papan-interaktif http://localhost:5173/isepic/index.html
```

Skrip membuka halaman, mengklik `e2` lalu `e4` dengan event mouse asli,
mencatat posisi elemen luncuran **setiap frame** (`requestAnimationFrame`),
lalu melaporkan durasi, kurva, jarak, kecepatan puncak, dan grafik p(t).
Ada juga snippet tempel-di-Console (`docs/riset-isepic/cek-animasi-konsol.js`)
untuk mengukur langsung di perangkat Anda. Petunjuk: lihat
`docs/riset-isepic/VERIFIKASI-ANIMASI.md`.

Dua uji tambahan yang saya jalankan:

- **Setelan sistem "kurangi gerak"**: dengan `prefers-reduced-motion: reduce`
  dipaksa, luncuran tetap `0.3s` dan menempuh 119,3 px selama 286 ms — jadi
  komentar di kode ("tidak dipangkas oleh setelan kurangi gerak") **benar**,
  dan setelan ini bukan penyebab keluhan.
- **Pemeriksaan tiap frame**: selama penerbangan, klon muncul di petak asal
  sejak frame pertama, tiba di petak tujuan pada frame ke-317 ms, lalu bidak
  asli muncul pada frame ke-338 ms — tidak ada frame kosong, tidak ada bidak
  ganda, tidak ada lompatan (laporan: `docs/riset-isepic/`+ skrip di §6).

---

## 3. Kenapa ia pernah terasa seperti roket — jejak commit

Riwayat berkas `src/halaman/TekaTeki/animasiBidak.js` (via GitHub API):

| Waktu (UTC) | Commit | Perubahan |
| --- | --- | --- |
| 26 Sep 2026 08:50 | `af3d5799` | Papan bersama: bidak meluncur saat langkah (bukan berkedip) |
| 26 Sep 2026 09:00 | `3544cad5` | Luncuran dibuat lebih santai (180 ms → 320 ms) |
| **8 Okt 2026 21:32** | **`ee2a3319`** | **"Papan Interaktif: luncuran bidak memakai gaya Report Analisa"** — inilah gaya `duration: 150, easing: "linear"`: dua kali lebih cepat dan **tanpa melandai** (kaku, terasa "dilesatkan") |
| 15 Okt 2026 02:49 | `ab906ebd` | "samakan luncuran isepic (300ms ease) di **semua mode**" — dibalik |
| 15 Okt 2026 03:57 | `a6a1c6fd` | Merge PR #190 → `main`; Vercel melaporkan sukses 03:58 UTC |

Kata "roket, terlalu cepat, kaku" adalah deskripsi tepat untuk
`150 ms linear`: kecepatan rata-ratanya dua kali lipat, dan karena kurvanya
linear ia mulai melesat seketika tanpa naik-turun kecepatan. Gaya itu hidup di
papan bersama sejak 8 Okt sampai merge hari ini (± 10:58 WIB).

**Yang belum diperbaiki oleh merge itu:** papan Report Analisa
(`src/halaman/Analisa/komponen/game/board.jsx`) masih memakai
`{ duration: 150, easing: "linear" }` di `animateMove` — papan sumber dari
gaya roket itu sendiri masih roket. Itu yang saya perbaiki sekarang.

---

## 4. Perubahan yang dibuat

1. **`src/halaman/TekaTeki/animasiBidak.js`**
   - Konstanta baru `GESER_ISEPIC = { durasi: 300, kurva: "ease" }` sebagai
     **satu-satunya sumber** kecepatan luncuran bidak untuk seluruh situs,
     dengan catatan sejarah mengapa nilainya dikunci.
   - `GAYA_ANALISA` (150 ms linear) ditandai **warisan**: disimpan sebagai
     rujukan gaya, tanpa pemanggil produksi.

2. **`src/halaman/TekaTeki/PapanTekaTeki.jsx`**
   - Klon luncuran kini menulis kurva **eksplisit**:
     `transition: top 300ms ease, left 300ms ease` (sebelumnya tanpa kurva,
     mengandalkan nilai bawaan CSS). Efek visualnya sama, tetapi nilainya jadi
     kebal terhadap perubahan/hilangnya bawaan akibat CSS global atau setelan
     peramban, dan terbaca jelas di DevTools.
   - Durasi & timer pengaman membaca `GESER_ISEPIC`.

3. **`src/halaman/Analisa/komponen/game/board.jsx`** (papan Report Analisa)
   - `animateMove`: `duration: 150, easing: "linear"` →
     `duration: GESER_ISEPIC.durasi, easing: GESER_ISEPIC.kurva` (300 ms ease).
   - Ini papan terakhir di situs yang masih memakai gaya roket.

4. **`scripts/uji-animasi-bidak.mjs` — penjaga baru "anti-roket" (seksi A2)**
   - Menolak animasi bidak berdurasi < 300 ms, menolak kurva `linear`, dan
     menolak lewat if ada halaman yang memaksa prop `gayaGeser="analisa"`.
   - Diuji juga bahwa kedua berkas papan benar-benar membaca `GESER_ISEPIC`.
   - Sifatnya statis (membaca sumber) sehingga menangkap penyimpangan yang
     tidak terlihat oleh uji render jsdom.

5. **Alat verifikasi baru** (dipakai untuk seluruh angka di laporan ini)
   - `docs/riset-isepic/ukur-animasi-peramban.mjs` — ukur peramban sungguhan.
   - `docs/riset-isepic/cek-animasi-konsol.js` — tempel di DevTools Console.
   - `docs/riset-isepic/VERIFIKASI-ANIMASI.md` — cara pakai + arti vonis.

---

## 5. Yang TIDAK bisa saya buktikan dari sini (supaya tidak ada tebakan)

- **Bundel yang dimuat peramban Anda.** Sandbox saya tidak bisa membuka
  `*.vercel.app` (koneksi ditolak), jadi saya **tidak** bisa mengklaim isi
  bundel produksi baris per baris. Yang saya tahu pasti: Vercel melaporkan
  deployment commit `a6a1c6fd` sukses pada 03:58 UTC (≈10:58 WIB) — dan
  `a6a1c6fd` sudah memuat luncuran 300 ms ease.
- **Halaman mana yang Anda uji.** Kalau yang Anda uji adalah Report Analisa,
  penyebabnya jelas dan sudah diperbaiki. Kalau `/papan-interaktif` dan
  halamannya dimuat dari bundel lama (tab lama, cache), penyebabnya bundel
  itu — bukan kode `main`.
- **Selera.** isepic sendiri memakai 300 ms ease untuk semua langkah. Jadi
  kalau setelah muat ulang paksa gerakannya tetap terasa cepat, itu bukan
  penyimpangan dari isepic — melainkan permintaan gaya yang berbeda. Sebutkan
  angkanya (mis. 400 ms), dan itu perubahan sadar **menyimpang** dari isepic.

---

## 6. Langkah untuk Anda (2 menit)

1. Buka halaman papannya, tekan `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac).
2. Tempel `docs/riset-isepic/cek-animasi-konsol.js` di DevTools Console, lalu
   klik `e2` → `e4`.
3. Kirim ke saya baris vonis + tabelnya.
   - `✓ 300 ms ease` → sudah benar; bila masih terasa cepat, sebutkan durasi
     yang Anda mau.
   - `⚠ MENYIMPANG / 150 ms / linear` → berarti peramban masih memuat bundel
     lama; saya perlu tahu halaman + peramban + apakah dev server atau
     produksi.
   - `✗ tidak ada luncuran` → kasus baru, kirim hasilnya, saya telusuri.

Kalau ingin membandingkan langsung dengan isepic di komputer Anda:

```bash
git clone --depth 1 https://github.com/ajax333221/isepic-chess-ui.git /tmp/isepic-src
CHROME_EXE=/usr/bin/google-chrome node docs/riset-isepic/ukur-animasi-peramban.mjs \
  http://localhost:5173/papan-interaktif http://localhost:5173/isepic/index.html
```

---

## 7. Uji yang dijalankan (semua hijau)

| Perintah | Hasil |
| --- | --- |
| `node scripts/uji-animasi-bidak.mjs` | 56 lulus, 0 gagal (termasuk 7 pemeriksaan penjaga A2 baru) |
| `npm run uji:integritas-suite` | 9 lulus, 0 gagal |
| `npm run uji:analisa-ui` | 101 pemeriksaan lulus |
| `npm run uji:render-bidak` | 70 lulus, 0 gagal |
| `npm run uji:pratinjau-langkah` | 11 lulus, 0 gagal |
| `npm run uji:tanda-papan` | 26 lulus, 0 gagal |
| `npm run uji:gestur-lawan` | 47 lulus, 0 gagal |
| `npm run build` | sukses; bundel tidak lagi memuat animasi bidak 150 ms linear |

Artefak pengukuran mentah: jalankan skrip §2 dengan `--json=hasil-animasi.json`
di komputer Anda; di sandbox, angka di laporan ini datang dari run nyata yang
sama.
