# Alur uji per area

Rujukan cepat: area kerja → uji yang harus jalan → berkas uji → halaman peta navigasi.
Daftar ini stabil; untuk keadaan repo yang selalu segar (jumlah berkas, uji penjaga
per folder, berkas uji yatim) jalankan `npm run peta` → `docs/PETA-KODE.md`.
Keakuratan berkas itu dijaga `npm run uji:peta`.

## Frontend — halaman, komponen, i18n

| Area | Uji minimum | Berkas uji | Halaman peta |
| --- | --- | --- | --- |
| `src/halaman/**` (semua halaman) | `npm run uji:rute && npm run uji:i18n` lalu `npm run build` | `uji-rute.mjs`, `uji-i18n.mjs` | Routing, Code Splitting & Layouts; Public Content Pages |
| `src/components/**`, `src/components/ui/**` | `npm run uji:tools` | `uji-tools.mjs` | Shared Components & UI Kit |
| JSON-LD / metadata SEO | `npm run uji:seo` (termasuk `uji:jsonld`) | `uji-seo.mjs`, `uji-jsonld.mjs` | Styling & Theming; Public Content Pages |
| Teks terjemahan ID/EN | `npm run uji:i18n` | `uji-i18n.mjs` | Internationalization (terjemahan) |
| Pendaftaran anggota (UI) | `npm run uji:pendaftaran-ui` | `uji-pendaftaran-ui.mjs` | Membership, Community & Admin Dashboard |

Catatan `uji:jsonld`: skrip `ld+json` disuntik `react-helmet-async` **secara asinkron
lewat requestAnimationFrame**, jadi DOM tidak boleh dibaca segera setelah `act()`
(terukur: 0 skrip segera setelah `act()`, 1 skrip setelah `setTimeout 0`).

## Analisa, engine, dan teka-teki

| Area | Uji minimum | Berkas uji | Halaman peta |
| --- | --- | --- | --- |
| Mesin Stockfish (WASM/UCI) | `npm run uji:engine` | `uji-engine-uci.mjs`, `uji-analisa-e2e.mjs`, `uji-navigasi.mjs` | Chess Engine Integration (Stockfish/UCI) |
| Panel & UI Analisa | `npm run uji:analisa && npm run uji:analisa-ui` | `uji-analisa.mjs`, `uji-analisa-ui.mjs` | Analisa Subsystem; Analysis UI Details |
| Klasifikasi langkah, akurasi, anti-cheat | `npm run uji:analisa-menyeluruh` | `uji-klasifikasi.mjs`, `uji-akurasi.mjs`, `uji-anticheat.mjs`, `uji-*` lain di grup itu | Move Commentator & Classification |
| Papan interaktif & teka-teki | `npm run uji:lencana-skakmat && npm run uji:tanda-papan && npm run uji:tekateki-solusi` | `uji-lencana-skakmat.mjs`, `uji-tanda-papan.mjs`, `uji-tekateki-solusi.mjs` | Interactive Board & Puzzles |
| Rush & Quiz | `npm run uji:rush` (termasuk `uji:rekor-rush`), `npm run uji:quiz` | `uji-rekor-rush.mjs`, `uji-rush-waktu.mjs`, `uji-quiz.mjs` | Training Modes: Teka-Teki Rush & Quiz Catur |

## Data, konten, dan aset

| Area | Uji minimum | Berkas uji | Halaman peta |
| --- | --- | --- | --- |
| Basis data lokal (IndexedDB) | `npm run uji:basisdata` | `uji-basisdata.mjs` | Local Game Database (IndexedDB) |
| Tarik partai (Lichess/Chess.com) | `npm run uji:tarik-api` | `uji-tarik-api.mjs` | Game Ingestion: PGN, FEN, Chess.com & Lichess |
| E-book & pembaca PDF | `npm run uji:ebook` | `uji-ebook.mjs`, `uji-ebook-pembaca.mjs` | Public Content Pages |
| Gambar & suara papan | `npm run uji:gambar && npm run uji:suara` | `uji-gambar.mjs`, `uji-suara.mjs` | Chess Features |
| Nama pembukaan & artikel | `npm run uji:nama-pembukaan && npm run uji:artikel` | `uji-nama-pembukaan.mjs`, `uji-artikel-wikipedia.mjs` | Chess Features |

Catatan `uji-ebook-pembaca`: jangan kembali ke `tunggu(ms)` dengan durasi tetap —
DOM jsdom kadang dibaca sebelum React selesai menulis. Pakai polling `tungguSampai`
dengan tenggat (mis. 2 detik), seperti yang sudah dipakai sekarang.

## Backend, keamanan, dan API

| Area | Uji minimum | Berkas uji | Halaman peta |
| --- | --- | --- | --- |
| HTTP backend menyeluruh | `npm run uji:backend` | `uji-backend.mjs`, `uji-ebook.mjs`, `uji-keamanan-admin.mjs` | Backend API Server; Routes & Domain Modules |
| Verifikasi akun & OAuth | `npm run uji:verifikasi && npm run uji:pendaftaran` | `uji-verifikasi.mjs`, `uji-pendaftaran.mjs` | Security & Authentication Model |
| Token/JWT pengurus | `npm run uji:auth-jwt` | `uji-auth-jwt.mjs` | Admin Gateway & Dashboard Panels |
| Skema data & penyimpanan | `npm run uji:skema` (+ `uji:supabase` bila ada kredensial) | `uji-skema.mjs`, `uji-supabase.mjs` | Persistence: JSON Seed Data & Supabase |
| Konfigurasi keamanan | `npm run uji:konfigurasi-keamanan` | `uji-konfigurasi-keamanan.mjs` | Bootstrap, Configuration & HTTP Primitives |
| Turnamen & klasemen | `npm run uji:klasemen` | `uji-klasemen.mjs` | Tournament Management |

## Uji browser end-to-end

| Area | Uji | Berkas | Catatan |
| --- | --- | --- | --- |
| Alur publik (desktop + mobile) | `npm run uji:e2e` | `tests/e2e/smoke.spec.js`, `tests/e2e/pembukaan.spec.js` | Butuh `npx playwright install chromium`; di sandbox Arena CDN-nya diblokir, andalkan CI |

## Urutan yang aman sebelum menyelesaikan pekerjaan

1. `npm run peta` bila Anda menambah/memindahkan folder, berkas, atau skrip uji.
2. Uji topik sesuai tabel di atas (yang paling dekat dengan perubahan).
3. `npm run uji` (memuat `uji:peta` sebagai langkah ke-2) dan `npm run build`.
4. Bila menyentuh `server/`, `api/`, atau alur auth: `npm run uji:backend`,
   `npm run uji:verifikasi`, `npm run uji:pendaftaran`, `npm run uji:konfigurasi-keamanan`.

CI (`.github/workflows/quality.yml`) menjalankan langkah 3 dan 4 di setiap PR —
rangkaian persisnya ada di bagian 1 `docs/PETA-KODE.md`.
