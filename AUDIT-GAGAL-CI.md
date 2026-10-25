# Audit Kegagalan CI (Quality checks)

Tanggal: 2026-10-25 · Basis: commit `e5e161de` pada cabang `feat/deteksi-engine-audit-upgrade`
(kerja lanjutan di `arena/7d07f3a4-chessclub`).

Dokumen ini menelusuri **mengapa setiap run `Quality checks` berakhir `failure`**, memisahkan
penyebab yang berasal dari infrastruktur (di luar repo) dari penyebab yang berasal dari kode,
lalu mencatat perbaikannya.

---

## 1. Ringkasan

Ada **dua penyebab berbeda**, bukan satu:

| # | Penyebab | Sifat | Dampak |
|---|----------|-------|--------|
| 1 | Kuota/billing GitHub Actions habis → job **tidak pernah dijalankan** | Infrastruktur (di luar repo) | Semua run setelah ~04:15 UTC gagal dalam 1–4 detik |
| 2 | 5 uji gagal di `npm run uji:rilis:v1` (gerbang rilis) | Kode repo | Run sebelum kuota habis gagal di tahap gerbang rilis |

Karena job hanya berjalan beberapa detik lalu mati, **gejala di UI menyesatkan**: yang terlihat
adalah "CI merah" padahal langkah-langkah uji tidak pernah dieksekusi sama sekali.

---

## 2. Temuan 1 — Job tidak dijalankan (billing)

**Bukti.** Anotasi GitHub pada job:

> The job was not started because recent account payments have failed or your spending limit
> needs to be increased. Please check the 'Billing & plans' section in your settings

Durasi job: 1–4 detik, tanpa satu pun langkah berjalan. Run terakhir yang masih benar-benar
menjalankan langkah ada pada 2026-10-25 03:42–03:46 UTC; setelah itu seluruh 17 run berikutnya
(`40161165965` … `40162003780`) mati karena alasan yang sama. Run `main` juga terdampak
(`401…` pada 2026-10-24 10:10 dan 13:27 masih `failure` biasa, sedangkan run terjadwal
`Production health check` sejak itu selalu `skipped` karena `vars.KCI_API_URL` belum diisi).

**Tindakan (pemilik repo, bukan lewat kode).**

1. Buka **Settings → Billing & plans** organisasi/pemilik repo, selesaikan pembayaran yang gagal
   atau naikkan *spending limit* GitHub Actions.
2. Setelah kuota pulih, jalankan ulang: `gh run rerun <run-id>`.
3. Opsional, agar pemakaian menit lebih hemat: `quality.yml` sudah dipecah menjadi dua job
   paralel; pertimbangkan `concurrency` dengan `cancel-in-progress: true` supaya push beruntun
   pada PR yang sama tidak menumpuk run (terlihat 17 run dalam satu jam).

Tidak ada perubahan kode yang bisa menghilangkan penyebab ini.

---

## 3. Temuan 2 — Gerbang rilis gagal (kode)

Pada run `40159221340` (03:42 UTC) job benar-benar berjalan: `Lint` dan
`Run Wawasan regression tests` **lulus**, job Playwright **lulus** (`success`, 3m49s), dan satu-
satunya langkah yang gagal adalah `Run the v1 release gate`.

Reproduksi lokal (`npm ci --include=dev` lalu `npm run uji:rilis:v1`) memberi **exit 1** dengan
5 uji gagal. Semuanya berasal dari kontrak data yang sengaja diubah pada commit `e5e161de`
tanpa memperbarui uji yang mengunci kontrak lama, ditambah dua uji baru yang premisnya keliru.

### 3a. Jam PGN: 3 uji memakai kontrak lama (`scripts/uji-analisa.mjs`)

Commit `e5e161de` mengubah `parseClockString` dan `ekstrakDaftarClock` secara sengaja
(didokumentasikan di komentar kode):

- **Pecahan detik dipertahankan** (`0:02:59.9` → `179.9`, bukan `180`), agar metrik waktu pikir
  tidak kehilangan presisi sub-detik. Pembulatan untuk tampilan tetap dilakukan di
  `formatTime` (`game.jsx`), jadi UI tidak berubah.
- **`incrementSeconds` ditempel pada setiap `clock`**, supaya anti-cheat bisa mengoreksi
  waktu pikir. Nilai `null` berarti "tidak diketahui", dibedakan dari `0`.
- **Jam awal tidak lagi ditebak** dari komentar pertama/kedua, dan jam yang komentarnya hilang
  tidak digeser ke langkah/warna lain.

Uji di `uji-analisa.mjs` masih menuntut nilai bulat dan bentuk objek `{ white, black }`.
**Perbaikan:** uji diperbarui ke kontrak baru, ditambah tiga uji penjaga untuk perilaku baru
(presisi pecahan, `incrementSeconds: null` vs `0`, komentar jam hilang, dan larangan menebak
jam awal).

### 3b. Anti-cheat: 2 uji baru dengan premis keliru (`scripts/uji-anticheat.mjs`)

Keduanya **bukan bug produksi** — kode berperilaku benar; data ujinya yang tidak membentuk
skenario yang dimaksud:

1. `MultiPV campuran: top-1 hanya menghitung posisi tanpa peringkat valid`
   Loop penghapus `kandidat` memakai indeks `i - 1` untuk `i` ganjil, sehingga menghapus
   kandidat **seluruh** posisi Putih (indeks genap). Hasilnya bukan campuran, melainkan 30/30 —
   top-1 memang menutup semua posisi. **Perbaikan:** hapus kandidat hanya pada separuh posisi
   Putih → 15/30, rasio campuran yang benar-benar menguji pemisahan top-1 vs MultiPV.
2. `UI menandai level satu-metrik sebagai sementara`
   Fixture hanya menghapus `bestMoveSan` dan `kandidat`, tetapi **data jam masih ada**. Jam
   adalah domain bukti tersendiri, jadi domain yang aktif `['kualitas','waktu']` = 2 domain —
   level "tinggi" memang benar dan tidak seharusnya "sementara". **Perbaikan:** fixture
   satu-domain dibuat eksplisit dengan mengosongkan `clock`; hasilnya `['kualitas']` → level
   `sementara` dan peringatan `cakupanTerbatas` tampil seperti yang diharapkan.

### 3c. `uji:maia` gagal pada runner GitHub Actions 4-core (`scripts/uji-maia.mjs`)

Setelah kuota Actions pulih dan PR #203 (`3fe10ea0`) digabung ke `feat/deteksi-engine-audit-upgrade`,
run `40166594395` (`run_attempt: 3`) masih gagal pada langkah `Run the v1 release gate` di menit
`1m48s` (`scripts/uji-maia.mjs:555`) dengan galat:

```text
env.wasm.numThreads is set to 2, however, currently onnxruntime-web does not support multi-threads in Node.js.
failed to asynchronously prepare wasm: LinkError: WebAssembly.instantiate(): Import #46 module="a" function="a": memory import must be a WebAssembly.Memory object
Error: no available backend found. ERR: [wasm] RuntimeError: Aborted(LinkError: ...)
```

**Penyebab:** Di Node 21+, `globalThis.navigator.hardwareConcurrency` tersedia secara global.
Pada mesin 2-core (`hardwareConcurrency = 2`), `onnxruntime-web@1.18.0` menghitung
`Math.ceil(2 / 2) = 1` sehingga `uji-maia.mjs` lulus. Namun pada runner GitHub Actions
`ubuntu-latest` 4-core (`hardwareConcurrency = 4`), `onnxruntime-web@1.18.0` menimpa
`ort.env.wasm.numThreads` menjadi `Math.ceil(4 / 2) = 2` lalu mencoba memuat binari WASM
multi-utas di Node.js dan gagal dengan `LinkError`. Berbeda dari `scripts/uji-maia-ort.mjs` dan
`public/engines/maia3/maia-pekerja.js` yang sudah menyetel `ort.env.wasm.numThreads = 1`,
`scripts/uji-maia.mjs` belum menyetelnya sebelum `ort.InferenceSession.create(...)`.

**Perbaikan:** Setel `ort.env.wasm.numThreads = 1` secara eksplisit di `scripts/uji-maia.mjs`
sebelum membuat sesi ONNX.

### 3d. Balapan pemuatan buku pembukaan di `<Game>` & `<Suspense>` di `uji-area-kerja.mjs`

1. **`src/halaman/Analisa/komponen/game/game.jsx`**: Fungsi pencari buku pembukaan disimpan di
   state `openings2` dan dimasukkan ke daftar dependensi `useCallback` `handlePGN`. Ketika timer
   tunda 1500 ms (`setTimeout(muat, 1500)` / `requestIdleCallback`) selesai saat analisis atau
   pengujian sedang berjalan, `setOpenings` menciptakan ulang `handlePGN`, yang memicu ulang
   `useEffect([data, depth, handleFEN, handlePGN, ...])` — membatalkan analisis yang sedang
   berjalan serta menghasilkan >2.000 baris peringatan React `act(...)` di suite uji Analisa.
   **Perbaikan:** Simpan di `openingsRef` (`useRef`) dan panggil `id?.unref?.()` pada timer tunda.
2. **`scripts/uji-area-kerja.mjs`**: `keTampilan` sebelumnya hanya menunggu `setTimeout(20)`
   tunggal, yang berpacu dengan pemuatan `React.lazy` (`LayarAkun`, `LayarDeteksiEngine`) di
   dalam `<Suspense>`. **Perbaikan:** Tunggu di dalam `act(...)` hingga isi komponen malas
   terpasang di DOM.
3. **`.github/workflows/quality.yml`**: Ditambahkan `workflow_dispatch` dan pelaporan anotasi
   `::error::` otomatis apabila langkah `uji:rilis:v1` atau `uji:e2e` gagal.

---

## 4. Status setelah perbaikan

Dijalankan lokal dan di GitHub Actions pada `arena/0518b6c4-chessclub`:

| Langkah CI | Hasil |
|------------|-------|
| `npm run lint` (`--max-warnings 0`) | **lulus** |
| `npm run uji:wawasan-profil` + `node scripts/uji-analisa-ui.mjs` | **lulus** |
| `npm run uji:rilis:v1` (audit, ±60 suite, `build` ikut) | **exit 0**, `✓ built in 22.45s` |
| `npm run uji:anticheat` | **427 lulus, 0 gagal** |
| `npm run uji:analisa` | **34 pemeriksaan lulus, 0 gagal** |

Artinya penyebab #2 sudah hilang: begitu kuota Actions pulih, `Quality checks` seharusnya hijau
tanpa perubahan lain.

## 5. Catatan lanjutan (bukan penyebab kegagalan saat ini)

- `Production health check` selalu `skipped` karena repository variable `KCI_API_URL` belum
  diisi. Ini disengaja (agar tidak ada alarm palsu), tetapi berarti pemantauan produksi saat ini
  tidak aktif.
- 30 suite uji dijalankan berurutan dalam satu langkah gerbang rilis sehingga kegagalan pertama
  menyembunyikan sisanya (inilah sebabnya 3 kegagalan jam dulu tampak seperti satu masalah).
  Memecah gerbang per kelompok akan mempercepat umpan balik, tetapi menambah jumlah job dan
  konsumsi menit Actions — relevan selama kuota masih terbatas.
