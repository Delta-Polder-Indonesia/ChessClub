# Maia 3 di ChessClub

Maia 3 adalah model catur yang **meniru gaya pemain manusia** pada rating
tertentu. Berbeda dari Stockfish yang mencari langkah terkuat, Maia
memprediksi langkah yang *paling mungkin* dimainkan manusia berating
1100–1900. Karena itulah ia dipakai sebagai lawan di **Papan Interaktif →
Manusia vs Mesin**, tangga menengah.

Tangga lawan saat ini (lihat `PILIHAN_LEVEL_MESIN` di
`modus/mesinLemah.js`):

| Level | Mesin | Catatan |
| --- | --- | --- |
| Beginner / Pemula Total | sunfish | sengaja dilemahkan (kedalaman dangkal + derau) |
| Casual / Pemula | sunfish | sengaja dilemahkan |
| **Menengah — Maia** | **Maia 3** | gaya manusia; rating bebas dipilih |
| Advanced / Menengah Atas | Stockfish | Skill Level 12, 700 ms |
| Expert / Ahli | Stockfish | Skill Level 16, 1000 ms |
| Master | Stockfish | Skill Level 20, 1400 ms |

Satu-satunya level Maia memakai rating bawaan 1500 (`RATING_MAIA_BAKU`),
dan ratingnya bisa dipilih dari `PILIHAN_RATING_MAIA` = 1100 / 1300 / 1500 /
1700 / 1900 lewat pilihan **Rating Maia** yang muncul hanya untuk level ini.
Daftar itu sekadar penanda yang enak dipilih: model menerima rating kontinu,
jadi menambah angka lain di daftar sah-sah saja.

---

## Peta berkas

| Berkas | Isi |
| --- | --- |
| `public/engines/maia3/maia3_simplified.onnx` | Bobot model, 45 MB. **Di-commit** di repo ini atas keputusan pemilik proyek. |
| `public/engines/maia3/maia-pekerja.js` | Worker klasik: memuat ORT, membuat sesi, menjalankan inferensi. |
| `public/engines/ort/` | Runtime `onnxruntime-web` hasil salinan. **Tidak di-commit** — dibuat `npm run salin:ort`. |
| `src/lib/maia3.js` | Inti murni: penyandian FEN → token, dekode policy → UCI, vektor rating, pencerminan papan, `cpDariPeluang`. **Tidak mengimpor ORT**, jadi bisa diuji di Node. |
| `src/lib/mesinMaia.js` | Sisi aplikasi: memanggil worker, mengubah bentuk tensor, memilih langkah. |
| `src/lib/gunakanMesinMaia.js` | Kait React `useMesinMaia`. |
| `scripts/uji-maia.mjs` | 116 uji, termasuk satu inferensi ONNX sungguhan dan penjaga "wasm satu utas". |
| `scripts/uji-maia-ort.mjs` | 15 uji "peramban tiruan": glue UMD + wasm dijalankan di sandbox `vm`, lengkap dengan penjaga "tidak ada memori bersama". |
| `scripts/salin-ort.mjs` | Menyalin runtime ORT dari `node_modules` ke `public/`. |

---

## Cara kerja model

Kontrak di bawah dibaca langsung dari graf ONNX-nya — bukan dari dokumentasi
— karena berkas `maia3_simplified.onnx` yang dipakai di sini bukan rilis baku
Maia. Semuanya diimplementasikan di `src/lib/maia3.js`.

**Masukan** (tiga tensor float32):

| Nama | Bentuk | Isi |
| --- | --- | --- |
| `tokens` | `[N, 64, 12]` | 64 petak × 12 kanal bidak, urut `P N B R Q K p n b r q k`, 1 pada kanal yang aktif. a1 = petak 0, h8 = 63. |
| `elo_self` | `[N]` | rating pihak yang bergilir, **angka mentah** (mis. 1500) |
| `elo_oppo` | `[N]` | rating lawannya |

Rating dikirim sebagai angka kontinu, bukan kategori: Maia 3 menginterpolasi
rating, jadi 1500 dan 1550 memang menghasilkan gaya yang berbeda. Nilai
dijepit ke **1100–1900** oleh `batasRating` — rentang yang divalidasi
pelatihannya. Di luar itu model masih berjalan, tetapi tidak pernah diuji,
jadi UI tidak pernah mengirim angka ngawur.

**Keluaran** (dua tensor float32):

| Nama | Bentuk | Isi |
| --- | --- | --- |
| `logits_move` | `[N, 4352]` | logit per langkah, **belum** softmax |
| `logits_value` | `[N, 3]` | logit kalah / remis / menang untuk pihak yang bergilir |

Ruang 4352 langkah itu:

* `0 … 4095` — `petakAsal × 64 + petakTujuan`. Termasuk "langkah diam"
  (asal = tujuan) yang tak pernah legal, jadi tersaring sendiri.
* `4096 … 4351` — promosi: 8 asal (a7–h7) × 8 tujuan (a8–h8) × 4 macam,
  urut **q r b n** (urutan model, jangan diubah).

Jangkar indeks yang diuji di `scripts/uji-maia.mjs`: `a1a1` = 0,
`e1g1` = 262, `g1f3` = 405, `e2e4` = 796, `e8g8` = 3902, `a7a8q` = 4096,
`h7h8n` = 4351.

**Maia 3 selalu melihat papan dari sudut putih.** Bila hitam yang bergilir,
`cerminFen` membalik baris, menukar warna, menukar hak rokade, dan
mencerminkan petak *en passant*; langkah hasilnya lalu dicermin balik oleh
`cerminLangkah`. Jadi papan tidak pernah perlu diputar secara visual.

Dari logit nilai, `nilaiMenang` menghitung softmax lalu
`(menang + ½·remis) / total`, dan membaliknya bila yang bergilir hitam —
hasilnya selalu "peluang menang **putih**", sama seperti centipawn
Stockfish. `cpDariPeluang` mengubahnya ke sentipion dengan rumus kebalikan
dari `src/halaman/Analisa/mesin/peluang.js` (faktor yang sama persis,
`-0.00368208`), dijepit ±1000 supaya bilah evaluasi tidak meledak. Maia
sendiri tidak pernah mengeluarkan centipawn — angka ini hanya untuk gestur
"lawan ragu" dan bilah evaluasi.

---

## Mengapa onnxruntime-web dikunci di 1.18.0

`package.json` memakai versi **tepat** `1.18.0` (tanpa tanda `^`). Alasannya
penting:

Sejak 1.19, `onnxruntime-web` hanya mengirim build *threaded*. Build itu
menjalankan `new WebAssembly.Memory({ shared: true })` **tanpa syarat** —
termasuk untuk satu utas. Memori bersama menuntut halaman
`crossOriginIsolated`, yang hanya ada bila server mengirim COOP **dan** COEP.
Repo ini sengaja **tidak** mengirim COEP (lihat `vercel.json`): COEP akan
memblokir gambar dan berkas pihak ketiga yang tidak mengirim header CORP,
yang berarti merusak embed dan Supabase.

Pada 1.18.0, `env.wasm.numThreads = 1` memilih `ort-wasm-simd.wasm` — build
satu utas, memori biasa, tanpa `SharedArrayBuffer`. Itulah yang kita mau.

Kalau kelak COEP diaktifkan, versi boleh dinaikkan dan `BERKAS` di
`scripts/salin-ort.mjs` diganti ke varian `-simd-threaded`. Uji
"onnxruntime-web masih mengirim wasm satu utas (tanpa shared memory)" di
`scripts/uji-maia.mjs` akan berteriak lebih dulu kalau paketnya naik tanpa
penyesuaian.

---

## Bagaimana A.C.A.S. menjalankannya (dan mengapa kita tidak menirunya)

`Psyyke/A.C.A.S.` (userscript catur) memakai Maia 3 di
`app/assets/engines/Maia3/`. Diperiksa 13 Oktober 2026. Mesinnya sama persis
dengan punya kita; yang berbeda cara menjalankannya — dan perbedaan itulah
alasan kita tidak bisa menyalinnya begitu saja.

| Aspek | A.C.A.S. | Kita |
| --- | --- | --- |
| Berkas bobot | `maia3_simplified.onnx`, md5 `3a2fe47a…` | **berkas identik** |
| Peta langkah | `all_moves_maia3.json` (4352 entri) | dihitung `indeksLangkah` |
| Ruang langkah | `asal*64+tujuan`, promosi 4096+ urut q,r,b,n | sama — **4352/4352 cocok** |
| Pencerminan | balik pangkat saja, warna bidak ditukar | sama |
| Runtime | `onnxruntime-web` **1.23.2**, glue varian *bundle* (modul) | **1.18.0**, glue UMD lewat `importScripts` |
| Utas | minta banyak (`wasm: { threads: … }`) | 1 utas, eksplisit |
| WebGPU | minta `['webgpu','wasm']` | tidak |
| Isolasi lintas-origin | **COOP + COEP lewat `coi-serviceworker.js`** (service worker menyuntik header, lalu halaman dimuat ulang) | **tidak ada COEP** |
| Penyimpanan bobot | IndexedDB, kunci = url + versi | sama |
| Memilih langkah | argmax — selalu langkah paling mungkin | contoh acak dari distribusi |
| Rentang rating | 600–2600 | 1100–1900 |

Tiga hal yang terbukti saat memeriksanya:

**1. Versi 1.23.2 menuntut memori bersama — untuk satu utas sekalipun.**
Glue-nya memanggil `new WebAssembly.Memory({ initial: 256, maximum: 65536,
shared: true })` di `ort-wasm-simd-threaded.mjs` baris 44, tanpa syarat. Bila
peramban menolaknya (tanpa COEP), sesi mati dengan `no available backend
found. ERR: [wasm] TypeError: …` — pesan yang sama sekali tidak menyebut COEP.
A.C.A.S. bisa begitu karena halamannya **diisolasi lintas-origin lewat jasa
service worker**; mereka memang butuh itu untuk Stockfish-SAB mereka. Kita
memilih tidak (lihat bagian sebelumnya).

**2. Opsi `threads` mereka tidak berpengaruh, dan WebGPU pun tidak.** Kata
`threads` tidak ada di dalam berkas itu — namanya `numThreads`. Yang berlaku
justru bawaan ORT: `min(4, ceil(hardwareConcurrency/2))`. Berkas
`ort.wasm.bundle.min.js` juga tidak memuat EP WebGPU (itu ada di
`ort.webgpu.*`), jadi `['webgpu','wasm']` selalu jatuh ke wasm dengan
peringatan "backend not found". Kecepatan mereka karena itu datang dari utas,
bukan dari versi ORT: dalam perbandingan gaya sama di Node (satu utas, 8
posisi), 1.18.0 dan 1.23.2 hanya berbeda ~5% (131 vs 122 ms/posisi).

**3. Peta langkah mereka memvalidasi rumus kita.** `all_moves_maia3.json`
(4352 entri) dan versi terbaliknya dibandingkan dengan `indeksLangkah` /
`langkahDariIndeks`: **0 ketidakcocokan di kedua arah**, termasuk 256 langkah
promosi yang mulai di indeks 4096 dengan urutan q, r, b, n.

Dua perbedaan yang bukan soal teknis, melainkan pilihan:

* **Rentang rating.** Hulu (`maia-platform-frontend`) menyatakan skala Maia
  600–2600 (`MAIA_MIN_RATING` / `MAIA_MAX_RATING`) dan memberi angka itu ke
  model yang sama; di dalam grafnya sendiri masukan rating hanya dijepit
  `Clip(0, 5000)`. Pilihan kita (1100–1900) jadi lebih sempit daripada yang
  model dan hulunya dukung. Mempersempit itu sah — kalau Maia nanti ingin ikut
  melayani pemula, angkanya bisa diturunkan tanpa mengganti apa pun.
* **Cara memilih langkah.** A.C.A.S. selalu memainkan langkah dengan peluang
  terbesar. Kita mencontoh dari seluruh distribusi (`contohLangkah`), jadi
  posisi yang sama tidak dijawab identik dua kali — itu bagian dari "terasa
  manusia" yang jadi alasan Maia dipasang.

---

## Menjalankan

```bash
npm install            # mengambil onnxruntime-web 1.18.0
npm run salin:ort      # menyalin runtime ke public/engines/ort (19.5 MB)
npm run dev            # atau npm run build — predev/prebuild menjalankan salin:ort
```

Lalu buka **Papan Interaktif → Manusia vs Mesin**, pilih level *Menengah —
Maia*, dan mainkan satu langkah. Unduhan ~56 MB terjadi sekali (45 MB bobot
+ ~11 MB wasm SIMD). Bobotnya lalu disimpan di IndexedDB, jadi kunjungan
berikutnya langsung siap tanpa mengunduh ulang; selama unduhan pertama,
statusnya ditampilkan dengan persentase supaya pemain tahu ini memang sedang
mengunduh, bukan macet.

**Uji:**

```bash
npm run uji:maia       # 131 uji: penyandian, pencerminan, inferensi ONNX,
                       # lalu glue UMD di sandbox "peramban tiruan" (uji-maia-ort)
npm run uji:sunfish    # 49 uji: tangga lawan pemula tidak rusak
npm run uji:i18n       # kamus id/en seimbang
npm run build
```

`uji:maia` dan `uji:sunfish` sudah ikut di `npm run uji`.

---

## Bila lawan tidak mau jalan

| Gejala | Arti |
| --- | --- |
| Status "Maia gagal dimuat…" | Aduan umum: unduhan bobot gagal, kuota penyimpanan penuh, atau peramban tidak mendukung WebAssembly SIMD. Teksnya menyarankan pilih level lain atau muat ulang. |
| Pesan worker `HTTP … saat mengunduh model` | Bobot `maia3_simplified.onnx` tidak tersedia di origin (berkas terhapus atau belum ter-deploy). |
| Pesan worker `Model Maia belum dimuat` | Inferensi diminta sebelum sesi siap — seharusnya tidak pernah muncul; bila muncul, itu bug di `mesinMaia.js`. |
| `SharedArrayBuffer is not defined` atau `bad memory` | Runtime ORT salah versi (terbawa 1.19+, atau glue memilih build berulir). Pastikan `npm ls onnxruntime-web` mengatakan 1.18.0, lalu `npm run salin:ort`. `npm run uji:maia` menangkap ini lebih cepat: `uji-maia-ort.mjs` menjalankan glue-nya di peramban tiruan dan gagal bila ia membuat memori bersama. |
| Langkah pertama terasa lama | Normal: model 45 MB dijalankan satu utas — memang tidak ada utas berulir, karena COEP dimatikan. Setelah sesi siap, tiap langkah tinggal satu inferensi. |

---

## Mengubah tangga lawan

Tangga ada di `src/halaman/PapanInteraktif/modus/mesinLemah.js` pada
`PILIHAN_LEVEL_MESIN`. Tiap entri punya `mesin` (`"sunfish"`, `"maia"`, atau
`"stockfish"`) lalu pengaturan untuk mesin itu:

* `sunfish` — `waktu` dan `kedalaman`, diterjemahkan ke perintah UCI oleh
  `perintahProfilSunfish` (QS, QS_A, Eval Noise, Material Only, Tunnel
  Vision, Random Seed).
* `maia` — `rating`, dipakai apa adanya untuk `elo_self`/`elo_oppo`.
* `stockfish` — `keterampilan` (Skill Level) dan `waktu`.

Kekuatan Maia datang dari rating, bukan dari pembatasan pencarian, jadi level
Maia tidak butuh satu pun opsi pelemahan. Menambah level Maia kedua (misal
"Maia 1800") cukup dengan menyalin entri `maia` dan mengganti `rating`-nya —
satu berkas bobot melayani semuanya.

---

## Yang belum dikerjakan

Halaman **Analisa** punya `mesin/deviasiManusia.js` (fondasi anti-cheat
"seberapa mirip manusia langkah ini"). Bagian itu **belum** disambung ke Maia
— yang ada baru mesinnya untuk Papan Interaktif. Sambungannya memakai
`src/lib/maia3.js` untuk menghasilkan `Map<fen, {uci: prob}>` per partai;
lihat `src/halaman/Analisa/README.md`.
