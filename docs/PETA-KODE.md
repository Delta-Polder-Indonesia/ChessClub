# Peta Kode & Alur Uji

Berkas ini DI-GENERATE dari keadaan repo (struktur folder, `package.json`,
`docs/roadmap/documentation-roadmap.json`). Jangan disunting manual:
jalankan `npm run peta` untuk membangkitkan ulang, dan `npm run uji:peta`
untuk memeriksa bahwa peta ini tidak menyimpang dari kenyataan.

Cara pakai saat audit: cari nama folder/berkas yang Anda curigai di tabel
"Peta area" → lihat kolom "uji penjaga" → jalankan perintah di kolom itu.

## 1. Alur uji utama

`npm run uji` menjalankan rangkaian berikut secara berurutan (berhenti di
kegagalan pertama karena dirangkai dengan `&&`):

1. `npm run uji:integritas-suite`
2. `npm run uji:impor-css`
3. `npm run uji:rute`
4. `npm run uji:peta`
5. `npm run uji:desain`
6. `npm run uji:seo`
7. `npm run uji:i18n`
8. `npm run uji:tools`
9. `npm run uji:komentator`
10. `npm run uji:basisdata-awan`
11. `npm run uji:analisa`
12. `npm run uji:analisa-ui`
13. `npm run uji:engine`
14. `npm run uji:analisa-menyeluruh`
15. `npm run uji:suara`
16. `npm run uji:basisdata`
17. `npm run uji:akun-database`
18. `npm run uji:tarik-api`
19. `npm run uji:buku-analisa`
20. `npm run uji:lencana-skakmat`
21. `npm run uji:tanda-papan`
22. `npm run uji:animasi-bidak`
23. `npm run uji:glob-aset`
24. `npm run uji:render-bidak`
25. `npm run uji:gestur-lawan`
26. `npm run uji:evaluasi-manusia-vs-mesin`
27. `npm run uji:bantuan-langkah`
28. `npm run uji:repertoar`
29. `npm run uji:sunfish`
30. `npm run uji:tekateki-solusi`
31. `npm run uji:rush`
32. `npm run uji:gambar`
33. `node scripts/uji-identitas.mjs` (langsung)
34. `npm run uji:skema`
35. `node scripts/uji-ebook.mjs` (langsung)
36. `node scripts/uji-ebook-pembaca.mjs` (langsung)
37. `node scripts/uji-nama-pembukaan.mjs` (langsung)
38. `node scripts/uji-artikel-wikipedia.mjs` (langsung)
39. `npm run uji:pendaftaran-ui`

Skrip uji di luar rantai di atas (dijalankan terpisah / oleh CI):

- `npm run uji:anticheat` → `node scripts/uji-anticheat.mjs`
- `npm run uji:artikel` → `node scripts/uji-artikel-wikipedia.mjs`
- `npm run uji:auth-jwt` → `node server/uji/uji-auth-jwt.mjs`
- `npm run uji:backend` → `node server/uji/uji-backend.mjs && node server/uji/uji-ebook.mjs && node server/uji/uji-keamanan-admin.mjs`
- `npm run uji:e2e` → `playwright test`
- `npm run uji:ebook` → `node scripts/uji-ebook.mjs && node scripts/uji-ebook-pembaca.mjs`
- `npm run uji:jsonld` → `node scripts/uji-jsonld.mjs`
- `npm run uji:keamanan-admin` → `node server/uji/uji-keamanan-admin.mjs`
- `npm run uji:klasemen` → `node server/uji/uji-klasemen.mjs`
- `npm run uji:konfigurasi-keamanan` → `node server/uji/uji-konfigurasi-keamanan.mjs`
- `npm run uji:nama-pembukaan` → `node scripts/uji-nama-pembukaan.mjs`
- `npm run uji:pendaftaran` → `node server/uji/uji-pendaftaran.mjs`
- `npm run uji:quiz` → `node scripts/uji-quiz.mjs`
- `npm run uji:rekor-rush` → `node server/uji/uji-rekor-rush.mjs`
- `npm run uji:rilis:v1` → `npm audit --omit=dev --audit-level=moderate && npm run uji && npm run uji:backend && npm run uji:verifikasi && npm run uji:pendaftaran && npm run uji:konfigurasi-keamanan && npm run uji:auth-jwt && npm run uji:klasemen && npm run uji:quiz && npm run build`
- `npm run uji:seret-bidak` → `node scripts/uji-seret-bidak.mjs`
- `npm run uji:supabase` → `node scripts/uji-supabase.mjs`
- `npm run uji:verifikasi` → `node server/uji/uji-verifikasi.mjs`

## 2. Berkas uji dan siapa yang menjalankannya

| Berkas uji | Dijalankan oleh |
| --- | --- |
| `scripts/uji-akun-database.mjs` | `npm run uji:akun-database` |
| `scripts/uji-akurasi.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-analisa-e2e.mjs` | `npm run uji:engine` |
| `scripts/uji-analisa-ui.mjs` | `npm run uji:analisa-ui` |
| `scripts/uji-analisa.mjs` | `npm run uji:analisa` |
| `scripts/uji-animasi-bidak.mjs` | `npm run uji:animasi-bidak` |
| `scripts/uji-anticheat.mjs` | `npm run uji:analisa-menyeluruh`, `npm run uji:anticheat` |
| `scripts/uji-area-kerja.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-artikel-wikipedia.mjs` | `npm run uji`, `npm run uji:artikel` |
| `scripts/uji-balap-analisa.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-bantuan-langkah.mjs` | `npm run uji:bantuan-langkah` |
| `scripts/uji-basisdata-awan.mjs` | `npm run uji:basisdata-awan` |
| `scripts/uji-basisdata-galat.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-basisdata.mjs` | `npm run uji:basisdata` |
| `scripts/uji-buku-analisa.mjs` | `npm run uji:buku-analisa` |
| `scripts/uji-ebook-pembaca.mjs` | `npm run uji`, `npm run uji:ebook` |
| `scripts/uji-ebook.mjs` | `npm run uji`, `npm run uji:backend`, `npm run uji:ebook` |
| `scripts/uji-engine-uci.mjs` | `npm run uji:engine` |
| `scripts/uji-evaluasi-manusia-vs-mesin.mjs` | `npm run uji:evaluasi-manusia-vs-mesin` |
| `scripts/uji-evaluasi.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-gambar.mjs` | `npm run uji:gambar` |
| `scripts/uji-gestur-lawan.mjs` | `npm run uji:gestur-lawan` |
| `scripts/uji-glob-aset.mjs` | `npm run uji:glob-aset` |
| `scripts/uji-hasil.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-i18n.mjs` | `npm run uji:i18n` |
| `scripts/uji-identitas.mjs` | `npm run uji` |
| `scripts/uji-impor-css.mjs` | `npm run uji:impor-css` |
| `scripts/uji-integritas-suite.mjs` | `npm run uji:integritas-suite` |
| `scripts/uji-jsonld.mjs` | `npm run uji:jsonld`, `npm run uji:seo` |
| `scripts/uji-klasifikasi.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-komentar.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-komentator.mjs` | `npm run uji:komentator` |
| `scripts/uji-langkah-kritis.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-lencana-skakmat.mjs` | `npm run uji:lencana-skakmat` |
| `scripts/uji-mobile.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-nama-pembukaan.mjs` | `npm run uji`, `npm run uji:nama-pembukaan` |
| `scripts/uji-navigasi.mjs` | `npm run uji:engine` |
| `scripts/uji-panel.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-parser-pgn.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-pendaftaran-ui.mjs` | `npm run uji:pendaftaran-ui` |
| `scripts/uji-peta.mjs` | `npm run uji:peta` |
| `scripts/uji-pgn-anotasi.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-quiz.mjs` | `npm run uji:quiz` |
| `scripts/uji-render-bidak.mjs` | `npm run uji:render-bidak` |
| `scripts/uji-repertoar.mjs` | `npm run uji:repertoar` |
| `scripts/uji-rush-waktu.mjs` | `npm run uji:rush` |
| `scripts/uji-rute.mjs` | `npm run uji:rute` |
| `scripts/uji-sacrifice.mjs` | `npm run uji:analisa-menyeluruh` |
| `scripts/uji-seo.mjs` | `npm run uji:seo` |
| `scripts/uji-seret-bidak.mjs` | `npm run uji:analisa-menyeluruh`, `npm run uji:seret-bidak` |
| `scripts/uji-standar-desain.mjs` | `npm run desain:baseline`, `npm run uji:desain` |
| `scripts/uji-suara.mjs` | `npm run uji:suara` |
| `scripts/uji-sunfish.mjs` | `npm run uji:sunfish` |
| `scripts/uji-supabase.mjs` | `npm run uji:supabase` |
| `scripts/uji-tanda-papan.mjs` | `npm run uji:tanda-papan` |
| `scripts/uji-tarik-api.mjs` | `npm run uji:tarik-api` |
| `scripts/uji-tekateki-solusi.mjs` | `npm run uji:tekateki-solusi` |
| `scripts/uji-tools.mjs` | `npm run uji:tools` |
| `scripts/uji-variasi.mjs` | `npm run uji:analisa-menyeluruh` |
| `server/uji/uji-auth-jwt.mjs` | `npm run uji:auth-jwt` |
| `server/uji/uji-backend.mjs` | `npm run uji:backend` |
| `server/uji/uji-ebook.mjs` | `npm run uji`, `npm run uji:backend`, `npm run uji:ebook` |
| `server/uji/uji-keamanan-admin.mjs` | `npm run uji:backend`, `npm run uji:keamanan-admin` |
| `server/uji/uji-klasemen.mjs` | `npm run uji:klasemen` |
| `server/uji/uji-konfigurasi-keamanan.mjs` | `npm run uji:konfigurasi-keamanan` |
| `server/uji/uji-pendaftaran.mjs` | `npm run uji:pendaftaran` |
| `server/uji/uji-rekor-rush.mjs` | `npm run uji:rekor-rush`, `npm run uji:rush` |
| `server/uji/uji-skema.mjs` | `npm run uji:skema` |
| `server/uji/uji-verifikasi.mjs` | `npm run uji:verifikasi` |
| `tests/e2e/analisa-grafik.spec.js` | `npm run uji:e2e` |
| `tests/e2e/pembukaan.spec.js` | `npm run uji:e2e` |
| `tests/e2e/smoke.spec.js` | `npm run uji:e2e` |

## 3. Peta area

| Area | Berkas | Uji penjaga | Halaman peta |
| --- | --- | --- | --- |
| `src/halaman` | 233 | `uji-akun-database.mjs`, `uji-akurasi.mjs`, `uji-analisa-e2e.mjs`, `uji-analisa-ui.mjs`, +39 | Repository Layout & Naming Conventions; Routing, Code Splitting & Layouts; Styling & Theming, +14 |
| `src/components` | 73 | `uji-ebook-pembaca.mjs`, `uji-glob-aset.mjs`, `uji-jsonld.mjs`, `uji-pendaftaran-ui.mjs`, +3 | Frontend Application Architecture; Routing, Code Splitting & Layouts; Shared Components & UI Kit, +3 |
| `src/lib` | 72 | `uji-akun-database.mjs`, `uji-akurasi.mjs`, `uji-analisa-ui.mjs`, `uji-analisa.mjs`, +35 | Frontend Application Architecture; Routing, Code Splitting & Layouts; Internationalization (terjemahan), +9 |
| `src/lib/api` | 10 | `uji-pendaftaran-ui.mjs`, `uji-peta.mjs`, `smoke.spec.js` | Frontend API Client (src/lib/api) |
| `src/hooks` | 1 | — | Frontend Application Architecture |
| `src/data` | 3 | `uji-ebook-pembaca.mjs`, `uji-gambar.mjs` | — |
| `src/asets` | 170 | `uji-render-bidak.mjs` | — |
| `server/src` | 27 | `uji-akurasi.mjs`, `uji-analisa-e2e.mjs`, `uji-analisa-ui.mjs`, `uji-analisa.mjs`, +25 | Overview; Training Modes: Teka-Teki Rush & Quiz Catur; Backend API Server, +6 |
| `server/uji` | 11 | `uji-backend.mjs`, `uji-ebook.mjs`, `uji-keamanan-admin.mjs` | Training Modes: Teka-Teki Rush & Quiz Catur; Bootstrap, Configuration & HTTP Primitives; Security & Authentication Model, +1 |
| `api` | 2 | `uji-akun-database.mjs`, `uji-ebook-pembaca.mjs`, `uji-pendaftaran-ui.mjs`, `uji-peta.mjs`, +8 | Backend API Server |
| `plugins` | 3 | `uji-rute.mjs`, `uji-seo.mjs` | — |
| `db` | 1 | `uji-basisdata-galat.mjs`, `uji-basisdata.mjs`, `uji-repertoar.mjs`, `uji-supabase.mjs`, +1 | Persistence: JSON Seed Data & Supabase |
| `data` | 9 | `uji-analisa-ui.mjs`, `uji-buku-analisa.mjs`, `uji-ebook-pembaca.mjs`, `uji-gambar.mjs`, +9 | Public Content Pages; Persistence: JSON Seed Data & Supabase; Tournament Management |
| `scripts` | 81 | `uji-akun-database.mjs`, `uji-akurasi.mjs`, `uji-analisa-e2e.mjs`, `uji-analisa-ui.mjs`, +47 | Routing, Code Splitting & Layouts; Shared Components & UI Kit; Internationalization (terjemahan), +9 |
| `tests/e2e` | 3 | `uji-render-bidak.mjs` | — |
| `public` | 417 | `uji-analisa-ui.mjs`, `uji-buku-analisa.mjs`, `uji-ebook-pembaca.mjs`, `uji-ebook.mjs`, +12 | Chess Features; Interactive Board & Puzzles (PapanInteraktif, TekaTeki); Chess Engine Integration (Stockfish/UCI) |

## 4. Cermin yang dijaga `uji:peta`

- `.agents/skills/**` ⇄ `.opencode/skills/**` (isi identik, byte per byte).
- `quality.yml` (root) ⇄ `.github/workflows/quality.yml` (mulai baris `name:`).
- `.devin/wiki.json` ⇄ `docs/roadmap/documentation-roadmap.json` (jumlah halaman,
  `key_files`, dan `keywords` per indeks sama).
- Berkas ini ⇄ hasil `npm run peta`.

## 5. Aturan yang ditegakkan `uji:peta`

1. Setiap `key_files` di peta navigasi benar-benar ada di repo.
2. Setiap skrip `uji:*` di `package.json` tercatat di skill `kci-pengujian`.
3. Setiap berkas uji dipanggil minimal satu skrip npm (tidak ada uji yatim).
4. Setiap folder di `src/halaman/` terdaftar di peta navigasi.
5. Keempat cermin pada bagian 4 tetap sinkron.
6. Frontmatter setiap `SKILL.md` memenuhi syarat pemuatan opencode: `name` sama dengan nama
   folder, `description` 1–1024 karakter tanpa `": "`, dan `metadata` peta string ke string.
