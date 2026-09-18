# Perbandingan metrik akurasi & ACPL — kita vs en-croissant vs lichess

Dibuat 2026-09-18 sebagai jawaban atas pertanyaan: *"bagaimana en-croissant
menghitung ACPL/CP dan seterusnya, supaya angka kita sama — khususnya untuk
analisa pemain cheat?"*

Ringkasnya: **rumus mereka sudah kita tiru persis di
`src/halaman/Analisa/mesin/akurasi.js`**, dan hasilnya keluar sebagai metrik
baru `akurasi`, `akurasiAritmetik`, `acplBaku`, dan hitungan `anotasi` NAG di
panel **Deteksi Engine**, Dashboard akun, dan laporan peninjauan. Yang lama
tidak dihapus dan tidak dipakai ulang untuk skor kecurigaan — alasannya di
bawah.

---

## 1. Metode en-croissant (yang ditiru)

Sumber: `franciscoBSalgueiro/en-croissant`, branch `master`, dibaca lewat
GitHub API pada 2026-09-18.

### `src/utils/score.ts`

```ts
const CP_CEILING = 1000;

export function getWinChance(centipawns: number) {
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
}

export function normalizeScore(score: ScoreValue, color: Color): number {
    let cp = score.value;
    if (color === "black") cp *= -1;
    if (score.type === "mate") cp = CP_CEILING * Math.sign(cp);
    return minMax(cp, -CP_CEILING, CP_CEILING);
}

export function getAccuracy(prev: ScoreValue, next: ScoreValue, color: Color): number {
    const { prevCP, nextCP } = normalizeScores(prev, next, color);
    return minMax(
        103.1668 * Math.exp(-0.04354 * (getWinChance(prevCP) - getWinChance(nextCP))) - 3.1669 + 1,
        0, 100,
    );
}

export function getCPLoss(prev: ScoreValue, next: ScoreValue, color: Color): number {
    const { prevCP, nextCP } = normalizeScores(prev, next, color);
    return Math.max(0, prevCP - nextCP);
}
```

Anotasi langkah (`getAnnotation`) murni dari selisih win chance:
`> 20` → `??`, `> 10` → `?`, `> 5` → `?!`; lalu `!!` untuk pengorbanan yang
memulihkan keadaan, `!` untuk langkah terbaik yang membalik posisi (>5 poin
win%), `!?` untuk pengorbanan biasa selama eval masih > −200 cp.

### `src/utils/chess.ts` → `getGameStats(root)`

```ts
let prevScore: Score = root.score ?? INITIAL_SCORE;   // INITIAL_SCORE = cp 15
while (node.children.length > 0) {
    node = node.children[0];
    const color = node.halfMoves % 2 === 1 ? "white" : "black";
    if (node.score) {
        cplosses[color].push(getCPLoss(prevScore.value, node.score.value, color));
        accuracies[color].push(getAccuracy(prevScore.value, node.score.value, color));
        prevScore = node.score;
    }
}
const whiteCPL = mean(cplosses.white);              // rata-rata aritmetik
const whiteAccuracy = harmonicMean(accuracies.white);  // ← HARMONIC MEAN
```

dan `src/utils/misc.ts`:

```ts
export function harmonicMean(arr: number[]): number {
    const sum = arr.reduce((a, b) => a + 1 / Math.max(1, b), 0);
    return arr.length / sum;
}
```

Tiga hal yang mudah terlewat:

1. **Akurasi partai = harmonic mean**, bukan rata-rata biasa. Harmonic mean
   menghukum beberapa langkah buruk jauh lebih keras.
2. **Eval dipotong ±1000 cp** dan **mate = ±1000**, jadi kerugian satu langkah
   maksimal **2000** cp.
3. **Basisnya selisih win chance** (0–100), bukan selisih pion. Kehilangan
   100 cp di posisi rata (50% → 41%) jauh lebih mahal daripada kehilangan
   100 cp di posisi yang sudah menang (+800 → +700).

### Sisi "cheat" en-croissant

Penting untuk ekspektasi: **en-croissant tidak punya model skor kecurangan.**
`src/components/panels/analysis/ReportPanel.tsx` hanya menjalankan
"Generate Report" (analisis penuh partai dengan engine pilihan, default
`goMode = Time 500 ms`) lalu menampilkan `AccuracyCard` (`{cpl.toFixed(1)} ACPL`
+ `{accuracy.toFixed(1)}%`), hitungan anotasi `?? ? ?! !! ! !?`, dan eval
chart. Tombol "report" berikutnya adalah pelaporan manual ke lichess. Jadi
metrik engine-match-rate, peringkat MultiPV, konsistensi jam, korelasi
Spearman, keranjang posisi sulit/mudah, dan skor 0–100 yang ada di
`mesin/antiCheat.js` kita **tidak punya padanan di en-croissant** — itu
tambahan kita sendiri.

---

## 2. Asal rumusnya: lichess

en-croissant menyalin rumus lichess:

- `lichess-org/scalachess` → `core/src/main/scala/eval.scala`
  ```scala
  val CEILING = Cp(1000)
  val initial = Cp(15)
  def winningChances(cp: Eval.Cp) = {
    val MULTIPLIER = -0.00368208 // https://github.com/lichess-org/lila/pull/11148
    2 / (1 + Math.exp(MULTIPLIER * cp.value)) - 1
  }.atLeast(-1).atMost(+1)
  // WinPercent.fromCentiPawns(cp) = 50 + 50 * winningChances(cp.ceiled)
  // WinPercent.fromMate(mate) = fromCentiPawns(ceilingWithSignum(signum))
  ```
- `lichess-org/lila` → `modules/analyse/src/main/AccuracyPercent.scala`
  ```scala
  def fromWinPercents(before: WinPercent, after: WinPercent) = AccuracyPercent:
    if after.value >= before.value then 100d
    else
      val winDiff = before.value - after.value
      val raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) + -3.166924740191411
      raw + 1 // uncertainty bonus (due to imperfect analysis)
      .atMost(100).atLeast(0)
  ```
  dan agregasi partai lichess saat ini: *"a mean of volatility-weighted mean
  and harmonic mean"* — `(weightedMean + harmonicMean) / 2` dengan jendela
  geser `clamp(cps.size / 10, 2, 8)` dan bobot = deviasi baku win% dalam
  jendela, dijepit [0.5, 12].

Dua beda halus lichess ↔ en-croissant yang kita putuskan:

| Hal | lichess | en-croissant | pilihan kita |
| --- | --- | --- | --- |
| Konstanta kurva | 103.1668100711649 / −0.04354415386753951 / −3.166924740191411 | 103.1668 / −0.04354 / −3.1669 | **en-croissant** (permintaan: "sama dengan en-croissant"). Beda di desimal ke-2: 0 → −500 cp memberi 19.07 (en-croissant) vs 19.06 (lichess) |
| Agregasi partai | (weighted mean + harmonic mean) / 2 | harmonic mean | **harmonic mean** (en-croissant); rata-rata aritmetik tetap diekspos sebagai pembanding |
| `after ≥ before` | 100 langsung | tidak ada jalan pintas | tidak perlu — hasil ≥ 100 dipotong plafon, keluarannya sama |

---

## 3. Apa yang kita punya sebelumnya

| Metrik | Kita (sebelum) | Sumber |
| --- | --- | --- |
| Akurasi pemain (panel Ringkasan) | peta **label → poin tetap**: brilliant/great/best/book = 100, excellent = 90, good = 70, inaccuracy/miss = 30, mistake = 20, blunder = 0; dirata-rata biasa | `komponen/menu/analysis/summary/playersAccuracy.jsx` (port Brilliant-Chess, MIT © 2025 Delo) |
| Rating partai | kurva `1.5x⁴` dari akurasi, 40% → 300 Elo, 100% → 3000+ | `summary/gameRating.jsx` (port yang sama) |
| Klasifikasi langkah | 12 label (brilliant…blunder, forced, book) dari selisih **pion** 0.4 / 0.8 / 4.0 + deteksi pengorbanan | `mesin/penilaian.js` (port yang sama) |
| ACPL anti-cheat | `clamp(cp[1] + cp[0], 0, 1000)` dengan `mate = ±10000` (`CP_MATE`) → rugi per langkah dipotong **1000** | `mesin/antiCheat.js` |
| Skor kecurangan 0–100 | kecocokan top-1 + peringkat MultiPV + ACPL + konsistensi jam, dengan kalibrasi per band rating | `mesin/antiCheat.js` (tidak ada padanannya di en-croissant) |

Akibatnya, sebelum perubahan ini **tidak ada satu pun angka kita yang bisa
disandingkan** dengan tangkapan layar lichess/en-croissant: skala akurasinya
diskret (hanya bisa bernilai 0/20/30/70/90/100 per langkah) dan ACPL-nya
memakai plafon yang berbeda.

---

## 4. Yang sekarang disamakan

Modul baru `src/halaman/Analisa/mesin/akurasi.js` (murni, tanpa React/DOM)
menyalin rumus di atas 1:1:

| Fungsi kita | Padanan en-croissant |
| --- | --- |
| `peluangMenang(cp)` | `getWinChance` |
| `cpBaku(staticEval, balikTanda)` | `normalizeScore` |
| `akurasiLangkah(sebelumCp, sesudahCp)` | `getAccuracy` |
| `kerugianLangkah(sebelumCp, sesudahCp)` | `getCPLoss` |
| `anotasiLangkah({...})` | `getAnnotation` |
| `rataHarmonik(daftar)` | `harmonicMean` |
| `CP_CEILING = 1000`, `CP_AWAL = 15` | `CP_CEILING`, `INITIAL_SCORE` |

`antiCheat.js` memakainya dan menambahkan empat keluaran per warna (per partai,
per fase, dan di agregat riwayat):

- `akurasi` — harmonic mean kurva win chance (angka "lichess/en-croissant"),
- `akurasiAritmetik` — pembanding, supaya terlihat seberapa besar efek
  harmonic mean pada partai itu,
- `acplBaku` — ACPL dengan eval dipotong ±1000 cp (mate = ±1000),
- `anotasi` — hitungan `??` `?` `?!` `!!` `!` `!?`.

Agregasi lintas partai menjumlah **jumlah mentah** (`akurasiSampel`,
`akurasiInversJumlah`) lalu menyusun ulang harmonic mean lewat
`harmonikDariJumlah` — harmonic mean tidak boleh dirata-rata antarpartai.

Tampil di: panel **Deteksi Engine** (dua baris baru + catatan metode),
**Dashboard akun** (dua baris baru), dan **laporan peninjauan** (teks + JSON
`versi: 3`, lengkap dengan baris `CATATAN METODE`).

### Verifikasi

`scripts/uji-anticheat.mjs` seksi 14 mengunci **nilai emas dari suite uji
en-croissant sendiri** (`src/utils/tests/score.test.ts`):

```
getWinChance(0) = 50 · getWinChance(100) ≈ 59.1 · getWinChance(-500) ≈ 13.69
getAccuracy(0, 0) = 100 · getAccuracy(0, -500) ≈ 19.07
getCPLoss(0, 50, hitam) = 50 · getCPLoss(mate -1, cp 0, hitam) = 1000
getAnnotation: -500 → "??" · -200 → "?" · -100 → "?!" · -50 → ""
```

Hasil suite: **301 lulus, 0 gagal** (sebelumnya 245 — 56 pemeriksaan baru).
Seluruh rantai `npm run uji:analisa-menyeluruh`, `uji-analisa-ui` (68),
`uji-analisa` (30), `uji-i18n` (2393 kunci ID = 2393 EN), dan `npm run build`
hijau.

### Contoh angka (dihitung dari kode, bukan taksiran)

Satu langkah Putih dengan eval sebelum +500 cp (sudut pemain):

| Skenario | ACPL lama | ACPL baku | Akurasi baru | Win% |
| --- | ---: | ---: | ---: | --- |
| setara (0 cp hilang) | 0 | 0 | 100.0% | 86.3 → 86.3 |
| kehilangan 1 bidak (100 cp) | 100 | 100 | 81.0% | 86.3 → 81.3 |
| kehilangan perwira (300 cp) | 300 | 300 | 43.6% | 86.3 → 67.6 |
| kehilangan menteri (900 cp) | 900 | 900 | 3.3% | 86.3 → 18.7 |
| posisi hancur (±2000 cp) | **1000** | **2000** | 0.0% | 97.5 → 2.5 |
| menyerahkan skakmat | **1000** | **1500** | 0.5% | 86.3 → 2.5 |

Dua baris terakhir adalah seluruh perbedaan ACPL: konvensi lama memotong
kerugian di 1000 cp, konvensi baku membiarkannya sampai 2000. Untuk partai
tanpa blunder besar kedua ACPL identik.

---

## 5. Yang SENGAJA tidak disamakan

1. **Panel "Akurasi" di Ringkasan** tetap memakai peta label port
   Brilliant-Chess. Halaman Analisa berstatus FROZEN (v1) sejak 2026-09-10
   (lihat `src/halaman/Analisa/README.md`), dan mengganti skala akurasi di
   sana mengubah angka yang sudah dilihat pengguna selama ini plus rating
   partai turunan (`gameRating.jsx`). Kalau memang mau disatukan, itu
   keputusan produk tersendiri — tinggal memanggil `akurasiMove`/`rataHarmonik`
   di `playersAccuracy.jsx`.
2. **Skor kecurigaan 0–100 masih memakai ACPL lama.** `AMBANG.acplAcuan` (45)
   dan seluruh baris `KALIBRASI_RATING` dikalibrasi terhadap konvensi lama
   (clamp 1000 cp/langkah). Mengganti masukannya ke `acplBaku` tanpa
   kalibrasi ulang akan menaikkan semua skor untuk partai yang berisi
   blunder besar. Jalan yang benar: kumpulkan korpus partai lokal, hitung
   ulang ambangnya, baru tukar.
3. **Klasifikasi 12 label** (`mesin/penilaian.js`) tetap apa adanya; anotasi
   NAG baru hidup berdampingan sebagai metrik tambahan, bukan pengganti.
4. **Agregasi akurasi ala lichess 2025** (weighted mean berbobot volatilitas
   + harmonic mean) belum ditiru — en-croissant pun tidak.

---

## 6. Yang masih terbuka

- [ ] Kalibrasi ulang ambang ACPL bila `acplBaku` mau dijadikan masukan skor
      kecurigaan (butuh korpus partai, bukan taksiran).
- [ ] Deteksi fase masih memakai aturan Brilliant-Chess
      (`mesin/fase.js`: pengembangan perwira, material ≤ 2). lichess memakai
      `Divider.scala` (majorsAndMinors ≤ 10 / backrank sparse / mixedness
      > 150; endgame ≤ 6) dan en-croissant menyalinnya di
      `src/utils/phase.ts`. Kalau akurasi per fase mau persis lichess,
      pembanding fase itu yang harus diganti.
- [ ] Eval posisi awal: lichess memakai `Cp.initial = 15` bila posisi awal
      tidak dianalisis; kita selalu menganalisis posisi awal, jadi `CP_AWAL`
      baru terpakai bila data eval langkah pertama hilang.
