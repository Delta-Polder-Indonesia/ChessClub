---
name: kci-pengujian
description: How to test the KCI ChessClub project - the Indonesian-named npm scripts (uji:*) for frontend logic, content, backend, schema, security config, and Playwright smoke tests, plus exactly what CI (.github/workflows/quality.yml) runs so a change never breaks the pipeline. Use before finishing any change, when adding tests, or when investigating CI failures.
metadata:
  project: chessclub-kci
  area: testing
---

# Pengujian KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo** (`scripts/…`, `server/uji/…`, `tests/e2e/…`).
Hanya jalur yang diawali `references/` yang relatif terhadap folder skill ini.

## Peta cepat

**Arah yang tidak perlu ditebak: `npm run peta`** menulis `docs/PETA-KODE.md` — tabel
area → berkas → uji penjaga → halaman peta navigasi, dan tabel berkas uji → skrip npm
yang menjalankannya. Jalankan itu lebih dulu sebelum menelusuri repo secara manual.
Rincian per area (frontend, analisa, backend, konten, e2e) ada di
`references/alur-uji-per-area.md`.

- `npm run uji` — langkah berurutan (`&&`, berhenti di kegagalan pertama): `uji:integritas-suite`, `uji:impor-css`, `uji:rute`, `uji:peta`,
  `uji:desain`, `uji:seo`, `uji:i18n`, `uji:tools`, `uji:komentator`, `uji:basisdata-awan`, `uji:analisa`,
  `uji:analisa-ui`, `uji:engine`, `uji:analisa-menyeluruh`, `uji:suara`, `uji:basisdata`,
  `uji:akun-database`, `uji:tarik-api`, `uji:buku-analisa`, `uji:lencana-skakmat`, `uji:tanda-papan`,
  `uji:animasi-bidak`, `uji:glob-aset`, `uji:render-bidak`,
  `uji:gestur-lawan`, `uji:evaluasi-manusia-vs-mesin`, `uji:bantuan-langkah`,
  `uji:repertoar`, `uji:sunfish`, `uji:tekateki-solusi`, `uji:tekateki-alur`,
  `uji:tekateki-rute`, `uji:rush`,
  `uji:api-csrf`, `uji:sesi-ebook`, `uji:kerangka-penuh`, `uji:quiz`, `uji:gambar`,
  `uji-identitas` (node langsung), `uji:skema`, `uji-ebook` (node langsung),
  `uji-ebook-pembaca` (node langsung), `uji-nama-pembukaan` (node langsung),
  `uji-artikel-wikipedia` (node langsung), `uji:pendaftaran-ui`. Urutan ini selalu bisa dilihat
  segar di bagian 1 `docs/PETA-KODE.md`.
- `npm run uji:backend && npm run uji:verifikasi` — backend menyala sementara dan diuji end-to-end
  (auth JWT, verifikasi Chess.com, e-book).
- `npm run uji:rilis:v1` — release gate kanonik: audit dependency produksi, seluruh uji logika,
  backend/keamanan/verifikasi/pendaftaran, dan build. CI menjalankan perintah yang sama.
- `npm run uji:e2e` — Playwright smoke test halaman publik (butuh `npx playwright install chromium`).
- `npm run uji:konfigurasi-keamanan` — konfigurasi keamanan server (wajib lulus bila menyentuh
  `server/src/konfigurasi.js`/`server/src/http.js`; CI selalu menjalankannya).
- Di luar rantai `npm run uji` ada 17 skrip:
  - dipanggil CI: `uji:backend`, `uji:verifikasi`, `uji:pendaftaran`, `uji:konfigurasi-keamanan`,
    `uji:auth-jwt`, `uji:klasemen`, `uji:quiz`, `uji:e2e`. Berkas `server/uji/uji-keamanan-admin.mjs`
    ikut berjalan karena dirangkai di dalam `uji:backend`, bukan sebagai skrip `uji:keamanan-admin`
    tersendiri.
  - pintasan topik (anggotanya sudah ada di rantai): `uji:ebook`, `uji:artikel`,
    `uji:nama-pembukaan`, `uji:anticheat`, `uji:seret-bidak`, `uji:jsonld`, `uji:rekor-rush`.
  - perlu kredensial atau jaringan: `uji:supabase` (butuh `SUPABASE_URL` +
    `SUPABASE_SERVICE_ROLE_KEY`; sengaja di luar CI).
- `npm run uji:roster-segar` — kesegaran daftar anggota dari API klub Chess.com: snapshot usang
  tetap dijawab seketika (halaman tidak kosong) tetapi disegarkan di latar belakang, snapshot yang
  melewati `KCI_CHESS_KLUB_SNAPSHOT_TUNGGU` disegarkan DI DALAM permintaan (penting di serverless,
  tempat pekerjaan latar belakang dibekukan setelah respons terkirim), dan penyegaran paksa pengurus
  benar-benar melewati cache daftar klub + cache profil. Chess.com ditiru server lokal; tanpa internet.
- `npm run uji:bantuan-langkah` — "Bantuan Langkah" Papan Interaktif (assisted play): FEN
  hipotetis + klasifikasi hijau/kuning/merah + panah balasan lawan dari posisi hipotetis.
  Memakai Worker UCI palsu supaya deterministik (debounce, cache, pembatalan, hasil basi).
- `npm run uji:render-bidak` — kontrak render bidak, dari berkas di `src/asets/` sampai `<img>`
  yang benar-benar muncul di papan. Empat lapis: (A) setiap pasangan set × bidak punya jalur yang
  ada di disk dan jumlah berkas aset sama dengan jumlah pasangan terpetakan; (B) `muatSet`
  mengembalikan 12 aset tanpa nilai kosong, set tak dikenal jatuh ke set bawaan, dan cache
  bekerja; (C) `PapanTekaTeki` di jsdom menghasilkan 64 petak dan 32 `<img>` dengan src/alt
  terisi, `[data-petak="e2"] img` = 1 dan `[data-petak="e4"] img` = 0, diulang untuk set
  non-default `chesscom` (cabang `.png`); (D) papan mini pertama di halaman `Pembukaan`
  berisi 64 petak dan 32 `<img>`. Lapis C dan D adalah cermin assertion
  `tests/e2e/pembukaan.spec.js:289` dan `:104` yang menangkap regresi 85ddcfa setelah ~9 menit
  di CI; skrip ini menangkapnya dalam hitungan detik. Memakai esbuild dan jsdom yang sudah
  ada, dan melewati lapis yang tidak bisa dijalankan bila salah satunya tidak terpasang.
- `npm run uji:animasi-bidak` — animasi geser bidak papan bersama `PapanTekaTeki`: penyimpul
  langkah dari selisih dua FEN (langkah biasa, pukulan, rokade, en passant, promosi, navigasi
  mundur) dan pengecualiannya (posisi diganti, lompat beberapa langkah, papan dibalik, bidak
  yang baru diseret). Bagian jsdom memeriksa `element.animate()` benar-benar dipanggil pada
  bidak di petak tujuan, termasuk mode Manusia vs Mesin dengan mesin UCI palsu: klik move
  pemain dan balasan mesin meluncur, sedangkan bidak yang diseret tidak diluncurkan ulang.
  Entri PvE mengekspor `GESTUR` supaya uji memangkas jeda "berpikir" mesin (2-4 detik nyata).
- `npm run uji:glob-aset` — aset bidak lewat makro `import.meta.glob`. Glob ini compile-time Vite:
  kalau tidak ter-expand hasilnya `{}` dan seluruh papan tampil tanpa bidak TANPA galat — persis
  yang lolos di PR #167 (commit 85ddcfa membungkus `import.meta.glob` dengan guard `typeof`).
  Uji ini menutupnya dari tiga sisi: bentuk sumber (setiap kemunculan di `src/` wajib panggilan
  langsung), shim `scripts/loader-jsx.mjs` (dipakai 12 skrip uji lain — sekarang melempar galat
  alih-alih menelan glob), dan transform Vite sungguhan lewat `createServer().transformRequest`
  yang jumlah kunci asetnya harus sama dengan jumlah berkas di `src/asets/`. Jalankan uji ini
  setiap kali menyentuh `src/components/chess/ChessPiece.jsx` atau `scripts/loader-jsx.mjs`.
- Sepuluh skrip jsdom yang punya bundel sendiri (`uji:analisa-ui`, `uji:animasi-bidak`,
  `uji:bantuan-langkah`, `uji:evaluasi-manusia-vs-mesin`, `uji:kerangka-penuh`, `uji:lencana-skakmat`,
  `uji:rush-waktu`, `uji:tanda-papan`, `uji:tekateki-alur`, `uji:tekateki-solusi`) memakai
  `pluginGlobAset()` dari `scripts/loader-jsx.mjs`
  untuk memecah `import.meta.glob`. Jangan pernah menggantinya dengan `define` + fungsi kosong:
  `define` menghapus seluruh jejak makro dari sumber sebelum dianalisis, sehingga skrip-butanya
  kembali hijau pada aset rusak. Delapan skrip ini ikut gagal kalau glob di `ChessPiece.jsx`
  berubah bentuk — itulah penjaganya di luar `uji:glob-aset`.
- `npm run uji:gestur-lawan` — gestur "seperti manusia" mesin di mode Manusia vs Mesin
  (`src/halaman/PapanInteraktif/modus/gerakLawan.js`): penilaian posisi sulit (skor tipis +
  banyak langkah sah), pemilihan bidak yang dilirik saat bimbang, urutan klik (bidak lain dulu,
  petak asal terakhir), jeda 2-4 detik sebelum melangkah, goyangan bidak yang diklik, pembatalan
  di tengah gestur, serta penjagaan bahwa langkah yang dijalankan tetap hasil engine dan modul
  ini tidak dipakai mode lain (Teka-teki/Rush/Repertoar).
- `npm run uji:evaluasi-manusia-vs-mesin` — bilah evaluasi, pergantian posisi, dan deteksi akhir
  partai di mode Manusia vs Mesin (`ManusiaVsMesin.jsx` + `gunakanEngineCatur.js`): evaluasi tidak
  boleh macet menampilkan skor posisi lama begitu posisi berganti (bug utama yang dikunci uji
  ini), hasil engine basi (termasuk posisi yang persis sama berulang lewat undo/redo) tidak boleh
  menimpa posisi terkini, threefold repetition dideteksi lewat replay histori penuh (bukan
  `new Chess(fen)` satu langkah), navigasi (undo/redo) tidak meninggalkan status giliran mesin
  yang lama (papan tidak terkunci), reset/partai baru membuang evaluasi lama, skakmat tidak
  menyisakan evaluasi posisi sebelumnya, dan konvensi tanda skor (+ = favorit Putih) konsisten
  apa pun giliran/orientasi papan. Worker UCI Stockfish (bilah evaluasi) dan Worker sunfish
  (lawan) sama-sama diganti Worker palsu yang dikendalikan manual (`job.rilis()`) supaya urutan
  selesainya bisa diatur eksplisit; setiap bagian memasang mount React baru supaya pekerjaan
  Worker palsu yang menggantung dari bagian sebelumnya tidak mencemari bagian berikutnya.
- `npm run uji:repertoar` — pemilihan jalur pembukaan, kartu per warna, jadwal pengulangan, dan penyimpanan IndexedDB.
- `npm run uji:desain` — mengaudit keluarga halaman konten publik, bukan UI catur/fitur. Pemeriksaan menolak penambahan ukuran arbitrary, teks terlalu kecil, gradient, glassmorphism, radius/shadow berlebihan, hover-scale, serta `<button>`, `<table>`, dan `<svg>` ad-hoc terhadap baseline per berkas. Konten baru wajib melalui `PageBagian`/`components/konten`. Visual catur reusable berpusat di `src/halaman/Analisa/komponen/` dan diverifikasi melalui rangkaian uji Analisa/papan/teka-teki yang relevan; Program non-catur dan Pengurus mengikuti uji domainnya. Baseline hanya boleh diperbarui setelah audit dan persetujuan perubahan standar.
- `npm run uji:sunfish` — engine lawan level pemula (`public/engines/sunfish/sunfish.js`):
  lisensi/atribusi GPL di header, protokol UCI termasuk `position fen` dan cabang Web Worker,
  knob pembodohan (quiescence, derau evaluasi, materi-saja, tunnel vision), pemetaan level
  Manusia vs Mesin, dan legalitas self-play yang divalidasi chess.js. Pakai `--partai=200`
  untuk uji legalitas berat. Kalibrasi Elo-nya ada di `scripts/kalibrasi-sunfish.mjs`
  (skrip riset manual, di luar rantai uji).
- `npm run uji:peta` — penjaga dokumentasi arah: memastikan tidak ada `key_files` mati, semua
  skrip `uji:*` tercatat di berkas ini, tidak ada berkas uji yatim, setiap folder
  `src/halaman/*` terdaftar, cermin `.agents` ⇄ `.opencode` serta `quality.yml` tetap identik,
  dan `docs/PETA-KODE.md` mutakhir. Ikut berjalan di dalam `npm run uji` dan CI.

## Kapan menjalankan apa (aturan minimum)

- Komponen/halaman → `npm run uji:rute && npm run uji:i18n` lalu `npm run build`.
- Logika frontend → uji topik terkait (lihat blok `"scripts"` di `package.json`; penamaan sudah
  menjelaskan isinya).
- `server/` atau `api/` → `npm run uji:backend && npm run uji:skema && npm run uji:verifikasi`
  (+ `uji:konfigurasi-keamanan` bila relevan; CI selalu menjalankannya).
- Konten/data (`data/`, e-book, gambar, suara) → uji sesuai jenis (`uji:ebook`, `uji:gambar`,
  `uji:basisdata`, `uji:suara`).

## Konvensi menambah uji

- Berkas uji bernama `uji-<topik>.mjs`, ditaruh di `scripts/` (frontend/konten) atau `server/uji/`
  (backend), lalu didaftarkan sebagai skrip npm `uji:<topik>` dan (bila termasuk gabungan) ditambahkan
  ke rantai `npm run uji`.
- Uji backend memakai alat bantu `server/uji/alat-uji.mjs`; boleh memakai dependensi akar (`zod`, dll.)
  tetapi tetap tanpa framework dan tanpa dependensi baru.
- Uji e-book menerima PDF asli (`%PDF`) atau pointer Git LFS yang formatnya sah. PDF di
  `public/ebooks/` kini blob Git biasa (`.gitattributes` kosong), jadi `git lfs pull` tidak perlu.

## Cakupan wajib per fitur

Sebagian area tidak boleh hanya mengandalkan uji lain yang kebetulan menyentuhnya:

- **Autentikasi JWT** — wajib menguji token sah, kedaluwarsa, **dan** palsu. Sudah ditangani
  `server/uji/uji-auth-jwt.mjs` (login mengembalikan JWT, JWT sah dipakai ke endpoint pengurus, JWT
  kedaluwarsa ditolak, JWT palsu ditolak 401, ganti password tetap bcrypt) → `npm run uji:auth-jwt`.
  Perubahan di `server/src/http.js` atau `server/src/konfigurasi.js` menjalankan uji ini bersama
  `npm run uji:konfigurasi-keamanan`.
- **Validasi kuis dan klasemen** — bank soal divalidasi `npm run uji:quiz`; perhitungan peringkat diuji
  terisolasi di `server/uji/uji-klasemen.mjs` `hitungKlasemen` (poin, jumlah menang, urutan peringkat,
  peserta dianulir). Celah yang belum ditutup: `src/lib/peringkatKuis.js` (`gabungPeringkat`) belum punya
  uji — bila berkas itu disentuh, tulis ujinya lebih dulu.
- **Variasi kalimat komentator** — setiap penambahan variasi teks wajib lewat `npm run uji:komentator`,
  yang menjaga nilai `undefined`/`NaN` tidak lolos ke UI (mis. `ekspresiDariSkorAwan(undefined) === null`).
  Menambah kalimat tanpa memperluas uji ini akan lolos ke produksi tanpa penjaga.

## Prosedur sebelum PR

1. Jalankan rantai yang relevan sampai hijau di lokal: `npm run uji` (atau uji topik) + `npm run build`,
   dan `npm run uji:e2e` bila perubahan menyentuh halaman publik.
2. Repo ini **tidak punya linter**: tidak ada ESLint/Prettier/Biome, tidak ada skrip `lint`, dan CI tidak
   menjalankan lint. Jangan menulis "jalankan linter" di catatan PR, dan jangan menambah tooling lint
   sebagai bagian dari tugas lain tanpa persetujuan pengguna. Kebersihan kode dijaga lewat aturan di
   `kci-standar-kode` dan lewat uji.
3. Struktur berkas, folder, atau skrip berubah → `npm run peta`, lalu pastikan `npm run uji:peta` hijau
   sebelum push.
4. Uji yang melewati dirinya sendiri (`esbuild` atau `fake-indexeddb` tidak terpasang, `uji:supabase`
   tanpa kredensial) laporkan apa adanya — jangan mengklaim lulus padahal bagian itu dilewati.
5. Uji merah diperbaiki di cabang kerja sebelum meminta tinjauan. Menghapus, melewati, atau melemahkan
   uji agar CI hijau tidak dibenarkan; bila aturan lama memang sudah usang, sebutkan alasannya di PR.

## Samakan dengan CI

`.github/workflows/quality.yml` (berjalan pada setiap PR dan push ke `main`, Node 22, checkout
biasa tanpa `lfs: true`) menjalankan berurutan:

1. "Run logic and backend tests": `npm run uji && npm run uji:backend && npm run uji:verifikasi && npm run uji:pendaftaran && npm run uji:konfigurasi-keamanan && npm run uji:auth-jwt && npm run uji:klasemen && npm run uji:quiz`
2. "Build production bundle": `npm run build`
3. "Install Chromium for Playwright": `npx playwright install --with-deps chromium`
4. "Run public browser smoke tests": `npm run uji:e2e`

Pekerjaan belum selesai sebelum langkah-langkah yang relevan lulus secara lokal.
