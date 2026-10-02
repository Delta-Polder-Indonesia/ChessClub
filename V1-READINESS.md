# Audit dan Rencana Rilis v1

Tanggal audit: **2 Oktober 2026**  
Target: rilis produksi stabil pertama untuk Komunitas Catur Indonesia.

## Keputusan singkat

Kode **sudah layak masuk release candidate**, tetapi belum boleh diberi label
produksi v1 sebelum storage persisten, environment produksi, smoke test browser,
dan backup/restore staging dibuktikan. Fondasi teknisnya kuat: build berhasil,
rangkaian uji logika/backend berhasil, API sudah memiliki alias kanonik
`/api/v1/*`, CSP dan security headers sudah dipasang, serta server menolak
konfigurasi produksi yang lemah.

## Cakupan audit

Audit membaca struktur frontend, backend, function Vercel, konfigurasi build,
workflow CI, skema database, dokumentasi deployment, dependency tree, dan jalur
pengujian. Verifikasi lokal yang dijalankan:

- `npm audit --omit=dev`: **0 vulnerability** setelah lockfile diperbarui;
- `npm run build`: **berhasil**, 3.098 modul ditransformasi;
- `npm run uji`: **berhasil** (rute, SEO, i18n, analisa, puzzle, e-book, UI, dll.);
- `npm run uji:backend`: **193 pemeriksaan berhasil** (140 integrasi, 17 e-book,
  36 keamanan admin);
- `npm run uji:verifikasi`: **117 berhasil**;
- `npm run uji:pendaftaran`: **60 berhasil**;
- uji konfigurasi keamanan dan JWT: **27 berhasil**.

Smoke test Playwright tetap harus dijalankan oleh CI/staging karena merupakan
bukti perilaku browser yang berbeda dari uji jsdom/unit.

## Temuan menurut prioritas

### P0 — penghalang rilis

1. **Persistensi production harus dibuktikan.** Tanpa `SUPABASE_URL` dan
   `SUPABASE_SERVICE_ROLE_KEY`, Vercel menulis data ke `/tmp`; pendaftaran,
   pesan, admin, dan hasil turnamen dapat hilang saat cold start/redeploy.
2. **Rahasia produksi harus lengkap.** Wajib ada `KCI_PEPPER`,
   `KCI_ADMIN_PASSWORD`, `KCI_JWT_SECRET`, dan `KCI_ASAL_DIIZINKAN`.
   Template sebelumnya menyebut JWT secret tetapi tidak menyediakan field-nya;
   audit ini sudah memperbaikinya.
3. **Browser smoke test harus hijau pada release candidate.** Jalankan
   `npm run uji:e2e` setelah build dan uji alur daftar, login pengurus, konten,
   turnamen, serta pemulihan dari error.
4. **Backup dan restore harus pernah diuji**, bukan hanya backup berhasil dibuat.

### P1 — selesaikan sebelum pengumuman publik

1. **Ukuran repository/deploy besar.** Pack Git sekitar 520 MiB; 32 PDF e-book
   sekitar 484 MiB ditambah engine WASM besar. Migrasikan PDF ke Supabase Storage
   sesuai `PANDUAN-EBOOK-STORAGE.md`, lalu keluarkan binary lama dari jalur deploy.
2. **Rate limit masih per-instance/in-memory.** Pada serverless, batas dapat
   reset ketika cold start dan tidak dibagi antar-instance. Untuk trafik publik,
   pindahkan limiter login/pendaftaran ke storage terdistribusi.
3. **Observability belum menjadi release gate.** Aktifkan
   `KCI_LOG_PERMINTAAN=1`, monitor `/api/kesehatan`, dan tetapkan pemilik alarm.
4. **Source map produksi berada di output publik.** Ini membantu debugging, tetapi
   membuka struktur sumber dan menambah artefak deploy. Untuk v1 publik, unggah
   source map ke layanan observability lalu jangan layani file `.map` publik.

### P2 — utang teknis setelah v1

1. Beberapa komponen terlalu besar (`TekaTeki.jsx` ~101 KiB,
   `PapanInteraktif.jsx` ~77 KiB, `layarDatabase.jsx` ~104 KiB). Pecah berdasarkan
   state/data/view agar perubahan lebih aman.
2. Belum ada lint/type-check formal; kualitas terutama dijaga oleh banyak skrip
   uji khusus. Tambahkan ESLint dan secara bertahap TypeScript atau `checkJs`.
3. Audit desain masih mengizinkan 115 temuan lama melalui baseline. Kurangi
   baseline, jangan hanya mencegah temuan baru.
4. Fitur sangat luas untuk rilis pertama. Tandai Analisa lanjutan, engine,
   database awan, dan anti-cheat sebagai **beta** bila belum punya SLO/support.

## Scope v1 yang disarankan

**Stabil dan didukung:** landing/informasi, daftar anggota, pendaftaran dan
verifikasi, turnamen/klasemen, konten berita/pengumuman, dashboard pengurus,
puzzle/quiz dasar, serta e-book yang lisensi dan storage-nya sudah jelas.

**Beta:** Analisa, Papan Interaktif/engine, anti-cheat, basis data langkah awan,
dan fitur eksperimen lain. Beta boleh tetap tersedia, tetapi kegagalannya tidak
boleh memblokir fungsi komunitas inti.

## Implementasi release gate

Audit ini menambahkan satu perintah kanonik:

```bash
npm run uji:rilis:v1
```

Perintah tersebut menjalankan audit dependency produksi, seluruh uji logika,
uji backend/keamanan/verifikasi/pendaftaran, dan build produksi. Workflow GitHub
sekarang memakai perintah yang sama sehingga aturan lokal dan CI tidak berbeda.
Playwright dijalankan sesudah gate tersebut di CI.

Health check kini juga memverifikasi `versiApi === "v1"`. Untuk release/staging,
wajibkan database persisten dengan:

```bash
KCI_API_URL=https://staging.example.id \
KCI_HEALTH_REQUIRE_SUPABASE=1 \
npm run operasi:kesehatan
```

## Rencana eksekusi

### Fase 1 — hardening release candidate (1–2 hari)

- [x] Perbarui dependency rentan sampai audit produksi 0.
- [x] Tambahkan `KCI_JWT_SECRET` ke template environment.
- [x] Satukan quality gate lokal dan CI (`uji:rilis:v1`).
- [x] Perketat health check untuk versi API dan opsi Supabase wajib.
- [ ] Isi env staging; jalankan `db/supabase-schema.sql`.
- [ ] Jalankan gate v1 dan Playwright di commit release candidate.

### Fase 2 — validasi staging (1–2 hari)

- [ ] Uji pendaftaran nyata dan pastikan data tetap ada setelah redeploy.
- [ ] Uji login/logout pengurus, rotasi password, dan pembatasan role.
- [ ] Uji buat turnamen, persetujuan peserta, hasil, dan klasemen.
- [ ] Uji backup lalu restore ke proyek/database staging terpisah.
- [ ] Uji mobile, koneksi lambat, error Chess.com, dan error Supabase.
- [ ] Jalankan Lighthouse untuk rute `/`, `/pendaftaran-anggota`, dan
  `/program-kami/analisa/papan`; dokumentasikan baseline.

### Fase 3 — produksi terbatas (1 hari + observasi 48 jam)

- [ ] Deploy tag/commit release candidate ke production.
- [ ] Jalankan strict health check (`KCI_HEALTH_REQUIRE_SUPABASE=1`).
- [ ] Undang kelompok kecil anggota; pantau error, latency, dan kehilangan data.
- [ ] Tidak ada P0/P1 baru selama 48 jam.

### Fase 4 — v1.0.0

- [ ] Bekukan scope dan tulis release notes.
- [ ] Tag Git `v1.0.0` dari commit yang sama dengan deployment terverifikasi.
- [ ] Dokumentasikan rollback target dan penanggung jawab insiden.
- [ ] Umumkan fitur stabil versus beta secara eksplisit.

## Definition of Done v1

v1 selesai hanya jika seluruh kondisi berikut benar:

1. `npm run uji:rilis:v1` dan `npm run uji:e2e` hijau di CI.
2. `npm audit --omit=dev` melaporkan 0 vulnerability moderate atau lebih tinggi.
3. `/api/v1/kesehatan` mengembalikan `status=sehat`, `versiApi=v1`, dan
   `supabase.terpasang=true`, `supabase.siap=true`.
4. Data inti bertahan melewati redeploy dan restore backup berhasil.
5. Tidak ada kredensial/default secret atau data pribadi di Git/log.
6. Pendaftaran, pengurus, turnamen, dan konten lulus smoke test produksi.
7. Rollback dapat dilakukan dan sudah ditulis di release notes/runbook.
