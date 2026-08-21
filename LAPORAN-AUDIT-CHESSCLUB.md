# CHESSCLUB — FULL CODE AUDIT

> Audit menyeluruh repository `Delta-Polder-Indonesia/ChessClub` (commit `d2db791`, branch `main`).
> Tanggal audit: 2026-08-20. Metode: pembacaan seluruh source code, verifikasi runtime (build, 6 rangkaian test, server tiruan Chess.com), dan analisis statis.
> **Tidak ada kode yang diubah.**

---

## 1. Executive Summary

Project ini adalah situs komunitas catur Indonesia (klub Chess.com "BLUNDER SKUAD") dengan arsitektur **frontend statis (Vite + React 18 + Tailwind CSS v4)** dan **backend Node tanpa framework (server/)** yang memakai berkas JSON sebagai penyimpanan. Integrasi Chess.com (roster klub, profil, rating, OAuth+OIDC, verifikasi kode profil) adalah bagian paling matang. Kualitas kode **jauh di atas rata-rata proyek komunitas**: ada anti-akun-kecil (pepper-hash), anti-brute-force, CSRF, rate limit, tulis atomik, retry/backoff, test integrasi yang berjalan tanpa internet, dan dokumentasi tiga lapis (README + 3 PANDUAN).

**Peringkat ringkas:**

```text
Overall Health:       75/100
Production Readiness: 68/100
Security:             82/100
Architecture:         78/100
Performance:          79/100
Maintainability:      78/100
Testing:              82/100
```

**Yang paling penting untuk diketahui:**

1. **Build & seluruh test LULUS** — `npm run build` sukses (2 warning ukuran chunk), `npm run uji` (rute + i18n + identitas), `npm run uji:backend` (73 cek), `npm run uji:verifikasi` (30 cek) semuanya hijau. `npm audit` = 0 kerentanan.
2. **Tetapi build hijau ≠ aplikasi benar.** Ditemukan beberapa bug nyata (kalender tanggal lahir tidak valid, `fetchPriority` React 18 no-op, formulir Hubungi Kami mengabaikan `VITE_API_DASAR`, tanggal tanpa timezone, hari berita bergeser UTC) dan satu celah kecil (sidik jari pepper bocor ke API publik).
3. **Gap terbesar = jalur deploy GitHub Pages**: workflow CI tidak menyetel `VITE_API_DASAR`, sehingga frontend yang ter-deploy ke GitHub Pages memanggil `/api/...` ke GitHub Pages sendiri (404) — berita, pengumuman, turnamen, pendaftaran, dan dashboard pengurus **putus**, hanya daftar anggota yang jatuh ke cadangan roster publik Chess.com. PANDUAN-DEPLOY.md menjelaskan solusinya (.env.production) tetapi CI tidak melakukannya.
4. Backend dan keamanan data pribadi dirancang dengan baik; masalah utamanya adalah **skalabilitas penyimpanan berkas JSON** dan beberapa validasi yang longgar.

---

## 2. Arsitektur & Alur Data

### Komponen arsitektur

| Bagian | Teknologi / Implementasi |
| ------ | ------------------------ |
| Framework | Vite 6 + React 18.3 (SPA) |
| Bahasa | JavaScript (ESM, tanpa TypeScript) |
| UI/CSS | Tailwind CSS v4 (`@tailwindcss/vite`), CSS kustom di `src/index.css` |
| Routing | `react-router-dom` v7, `BrowserRouter` + `basename` dari `import.meta.env.BASE_URL` |
| State management | Tanpa library — `useState`/`useEffect` + cache modul + Context i18n |
| Backend | Node HTTP murni (tanpa Express), `server/src/index.js` |
| Database | Berkas JSON (`data/*.json`) + JSONL audit (`data/rahasia/jejak-audit.jsonl`), tulis atomik + antrean serial |
| External API | Chess.com Published Data (`api.chess.com/pub`), OAuth (`oauth.chess.com`) |
| Auth pengurus | Token statis `KCI_TOKEN_ADMIN` (header `X-Token-Admin` / `Authorization: Bearer`), anti-brute-force per IP |
| Auth anggota | OAuth 2.0 + OIDC (PKCE, JWT RS256) + jalur cadangan "kode KCI-XXXXXX di kolom Location profil" |
| CSRF | Token per-klien (Map in-memory, 24 jam), header `X-CSRF-Token` |
| Deployment | GitHub Pages (frontend) + Render/VPS (backend), GitHub Actions |
| CI/CD | `.github/workflows/deploy.yml` — build → upload-pages-artifact → deploy-pages |
| Asset pipeline | WebP + srcset 828/1280, font self-hosted, CSS inline, preload, code-split per rute, `plugins/performa.js` (salinan HTML per rute) |
| Caching | Memori: roster klub 12 jam, profil 1 jam, cache umum 300 dtk, cache frontend 5 menit |
| Environment | `KCI_*` (server), `VITE_*` (frontend), `.env.contoh` |

### Diagram alur data nyata

```text
USER (browser)
 ↓
BrowserRouter (basename /ChessClub/)
 ↓
PageLayout (Header + main + Footer) → Suspense → lazy page
 ↓
PAGE (Beranda, Peringkat, Turnamen, Pendaftaran, …)
 ↓
HOOK / komponen (useAnggota, useI18n, KartuTurnamen, …)
 ↓
SERVICE LAYER — src/lib/chessAnggota.js (fetch + GalatApi + CSRF + token + retry 429)
 ↓
URL relatif "/api/…" → proxy Vite (dev) / Netlify–Nginx (prod) / VITE_API_DASAR (GitHub Pages)
 ↓
BACKEND — server/src/index.js (router → http.js: CORS, rate-limit, CSRF, admin auth)
 ↓
LAYANAN — keanggotaan.js / klub.js / chess.js / turnamen.js / konten.js / pesan.js / oauth.js / verifikasi-profil.js
 ↓
EXTERNAL — api.chess.com/pub (roster, player, stats) · oauth.chess.com (authorize/token/certs)
 ↓
PENYIMPANAN — data/anggota.json · data/daftar-hitam.json · data/turnamen.json · data/berita.json · data/pengumuman.json · data/pesan.json · data/rahasia/{kontak,jejak-audit}.json(l)
 ↓
RESPONSE (JSON) → STATE (cache modul + setState) → UI (tabel, kartu, lencana)
```

**Catatan penting:**
- Tidak ada database SQL/NoSQL. Semua persistensi adalah berkas JSON di `data/` — harus ada disk persisten di hosting (sudah didokumentasikan di PANDUAN-DEPLOY.md untuk Render, tetapi **tidak disetel di contoh systemd**).
- Tidak ada state management library, tidak ada React Query/SWR — pola "cache modul + dedupe promise" di `anggotaBersama.js` sudah cukup untuk kebutuhan saat ini.
- Frontend TIDAK pernah memanggil backend langsung di produksi GitHub Pages karena tidak ada proxy — itulah sebabnya `VITE_API_DASAR` harus disetel (lihat P0-2).
- Server sama sekali tidak menyajikan file statis (HTML/JS/CSS). Ini benar untuk model dua-host, tetapi berarti Nginx/Netlify/GitHub Pages wajib mengatur fallback SPA.

---

## 3. Audit Struktur Project

| Path | Fungsi | Dependency | Status | Masalah |
| ---- | ------ | ---------- | ------ | ------- |
| `src/main.jsx` | Entry React, BrowserRouter + ErrorBoundary | react-dom, i18n, asets | GOOD | — |
| `src/App.jsx` | Routing + redirect + pulihkan rute | semua halaman | GOOD | `PulihkanRute` nyaris mati (lihat P3/Dead Code) |
| `src/menu.js` | Peta menu → route | — | GOOD | — |
| `src/lib/terjemahan.js` | Kamus ID/EN (563+563 kunci) | — | GOOD | File 1471 baris — pertimbangkan split per bahasa |
| `src/lib/identitas.js` | Normalisasi + validasi bersama FE/BE | — | WARNING | `normalisasiTanggal` meloloskan tanggal kalender tidak valid (2026-02-30) |
| `src/lib/chessAnggota.js` | Klien API + auth + CSRF + fallback roster | fetch | WARNING | Klub `blunder-skuad` di-hardcode (tidak sinkron dengan env server) |
| `src/lib/anggotaBersama.js` | Cache satu pintu anggota | chessAnggota | GOOD | TTL 5 menit vs server 1 jam — bisa tampil data lama |
| `src/lib/asets.js` | Path aset + srcset hero | — | GOOD | — |
| `src/lib/i18n.jsx` | Provider terjemahan | terjemahan | GOOD | — |
| `src/components/*` | Layout, header, footer, hero, carousel, dll | — | GOOD/WARNING | Footer banyak tautan `#`; dropdown menu hover tidak bisa diakses keyboard; `fetchPriority` no-op di React 18 |
| `src/halaman/Beranda/` | Beranda + tab (jadwal, juara, peringkat, e-book, teka-teki, hubungi admin) | — | WARNING | DaftarJuara, EbookPanduan, HubungiAdmin = placeholder |
| `src/halaman/TekaTeki/` | Pemutar 4.462 soal skakmat | chess.js, ChessPieceSvg | GOOD | Chunk SVG 336 kB; `data/problems.json` duplikat |
| `src/halaman/Pengurus/` | Dashboard + panel (anggota, larangan, pesan, turnamen, konten) | — | GOOD | Dashboard.jsx 1045 baris (kompleks); polling 30 dtk tanpa pause |
| `src/halaman/*` lainnya | Halaman konten korporat | i18n | GOOD | HubungiKami tidak i18n + CSRF duplikat |
| `src/index.css` | Desain sistem + komponen kustom | tailwind | WARNING | Banyak token warna hardcoded (lihat §7) |
| `server/src/*` | Backend Node murni | node:http, node:crypto | GOOD | `kembaliKe` OAuth mati; fetches ke oauth.chess.com tanpa timeout |
| `server/uji/*` | Integrasi test (tanpa internet) | — | GOOD | 103 cek total, semuanya lulus |
| `scripts/*` | Alat pengurus + mock + uji | — | GOOD | `mock-chess.mjs` hanya untuk sandbox |
| `plugins/performa.js` | Optimasi build + HTML per rute | node:fs | WARNING | Menimpa `public/404.html` (mekanisme pemulihan rute jadi mati) |
| `data/*.json` | Data seed/persistensi | — | WARNING | `problems.json` = duplikat `public/data/teka-teki.json` (670 kB); data demo nyata ikut commit |
| `public/` | Aset statis + 404.html + teka-teki.json | — | WARNING | `404.html` ditimpa saat build |
| `.github/workflows/deploy.yml` | CI/CD GitHub Pages | — | WARNING | Tidak menyetel `VITE_API_DASAR` (lihat P0-2) |
| `.env.contoh` | Template env | — | GOOD | Lengkap |
| Dokumen `README.md`, `PANDUAN-*` | Dokumentasi | — | GOOD/WARNING | Beberapa ketidaksesuaian (lihat §14) |

### Struktur yang kurang konsisten
- **`src/asets/`** — 13 set bidak × 12 SVG (156 file) + 12 PNG mati di `bidak/`. Semua diimpor statis → 336 kB chunk. Sebaiknya lazy-load per set.
- **`src/lib/` vs `server/src/`** — `identitas.js` dibagikan silang antara frontend dan backend (baik), tetapi `chessAnggota.js` (klien FE) dan `chess.js` (klien BE) mengulang pola fetch/retry/cache di dua tempat berbeda — duplikasi parsial.
- **`data/problems.json`** dan **`public/data/teka-teki.json`** — dua berkas identik; harus dijaga sinkron manual.
- **`server/README.md`** menyebut berkas "data/anggota.json metadata formulir" — konsisten, tapi berkas seed `anggota.json` berisi 1 rekor nyata (`susantomegaranto`) — indikasi data uji ikut ter-commit.

---

## 4. Critical Problems

### P0-1 — Deploy GitHub Pages menghasilkan frontend dengan API putus
```text
ID:          CR-1
Severity:    HIGH
File:        .github/workflows/deploy.yml (baris 36) + PANDUAN-DEPLOY.md §3
Problem:     Workflow hanya menjalankan `npm run build -- --base=...` tanpa
             `VITE_API_DASAR`. Frontend ter-deploy memanggil URL relatif
             "/api/…" yang tidak ada di GitHub Pages.
Root Cause:  Konfigurasi API dipindah dari relative-proxy (Netlify) ke env
             build, tetapi CI tidak menyetelnya.
Impact:      Di deploy GitHub Pages: berita, pengumuman, turnamen, daftar
             hitam, pendaftaran, verifikasi, dan dashboard pengurus semuanya
             404/rusak. Hanya daftar anggota yang "selamat" lewat fallback
             roster publik Chess.com (tanpa rating). Situs terlihat hidup
             tetapi setengah mati.
Fix:         Tambahkan di workflow: `env: VITE_API_DASAR: https://kci-api.onrender.com`
             (atau buat berkas `.env.production` di repo dan jangan di-ignore),
             dan verifikasi curl ke API setelah deploy.
```
### P0-2 — Backend bisa berjalan di produksi dengan pepper pengembangan yang diketahui publik
```text
ID:          CR-2
Severity:    HIGH
File:        server/src/identitas-server.js (baris 7-8, 20-28) + server/src/index.js (periksaProduksi)
Problem:     `PEPPER_DEV = "kci-pengembangan-jangan-dipakai-di-produksi"` dipakai
             bila `KCI_PEPPER` kosong. `periksaProduksi()` hanya memblokir saat
             `NODE_ENV === "production"` persis. Server yang di-deploy tanpa
             NODE_ENV=production (atau lupa pepper) berjalan dengan pepper
             publik yang sudah ada di source code — semua hash identitas bisa
             ditebak balik.
Root Cause:  Nilai pengembangan default yang terlalu "aman" untuk dev, tapi
             jalur produksi bergantung pada satu env string yang mudah salah.
Impact:      Jika terjadi: daftar hitam jadi mainan (hash HP bisa di-brute-force),
             perlindungan anti akun kecil hilang total.
Fix:         Paksa gagal-start bila `KCI_PEPPER` kosong dan server tidak di
             loopback (atau bila mode produksi), bukan sekadar warning.
```
### P0-3 — Sidik jari pepper (hash rahasia) bocor ke API publik
```text
ID:          CR-3
Severity:    MEDIUM (bocor, bukan pecah)
File:        server/src/keanggotaan.js — `tanpaRahasia()` (baris 171-173) hanya
             membuang `identitas`; penyebaran `lokal` (baris 202) ikut
             mengirim `sidikPepper`, `kotaKunci`, `caraVerifikasi`.
Problem:     Untuk anggota yang sudah mengisi formulir, GET /api/anggota
             mengembalikan `sidikPepper` (SHA-256("sidik|"+pepper) 8-hex)
             dan `kotaKunci` (kota ternormalisasi).
Root Cause:  Daftar field sensitif didefinisikan dengan destructuring satu
             field, bukan allow-list.
Impact:      Verifikasi TERBUKTI runtime (dengan server + mock): field
             `sidikPepper: "deadbeef"` muncul di respons publik. Ini
             mengirim sidik jari rahasia ke publik; kode di `ringkasan()`
             bahkan berkomentar "sidikPepper sengaja TIDAK dikirim ke klien"
             — kontradiksi dengan perilaku aktual.
Fix:         `tanpaRahasia` → allow-list eksplisit (username, panggilan, kota,
             kategoriUmur, terverifikasi, dll) atau buang `sidikPepper`/
             `kotaKunci`/`caraVerifikasi`.
```

---

## 5. Security Findings

| ID | Severity | File | Issue | Risk | Fix |
| -- | -------- | ---- | ----- | ---- | --- |
| S-1 | LOW–MED | `server/src/keanggotaan.js:171-202` | `sidikPepper` (fingerprint pepper 32-bit) + `kotaKunci` bocor di `/api/anggota` | Membantu brute-force pepper offline; kontradiksi komentar kode | Allow-list saat serialisasi publik |
| S-2 | MEDIUM | `server/src/identitas-server.js:7` | Pepper dev hardcoded dipakai bila env kosong (di luar produksi ketat) | Hash bisa ditebak | Refuse-to-start bila publik tanpa pepper |
| S-3 | LOW | `server/src/oauth.js:120-135` | `fetch(oauth.chess.com/certs)` tanpa timeout/retry | Callback OAuth bisa menggantung; server stuck | AbortController + retry (sama seperti chess.js) |
| S-4 | LOW | `src/halaman/HubungiKami/HubungiKami.jsx:14-18` | Duplikat `ambilCsrfToken` lokal + `fetch("/api/pesan")` hardcoded | Bila `VITE_API_DASAR` dipakai, form kirim pesan rusak; kode ganda rentan divergen | Pakai `ambilCsrfToken`/`url()` dari chessAnggota.js |
| S-5 | INFO | `index.html` + build | Frontend tanpa CSP (tidak ada meta/header CSP) | Jika suatu saat ada XSS, tidak ada mitigasi lapis-2 | Tambah CSP via header host (Nginx) atau meta |
| S-6 | LOW | `src/halaman/ProgramKami/CaraBermainCatur.jsx:14,33` | `dangerouslySetInnerHTML` atas data `panduanCatur.js` statis | Aman sekarang (data lokal), jadi XSS bila sumber data berubah | Tambah komentar peringatan + validasi bila data jadi dinamis |
| S-7 | INFO | `src/halaman/Pengurus/ui.jsx:Modal` | Modal tanpa focus trap / focus restore | Keyboard/screen reader bisa "keluar" dari dialog | Trap focus + restore focus ke tombol pemicu |
| S-8 | INFO | `src/components/Header.jsx` (NavItemDesktop) | Dropdown desktop murni hover (`group-hover`) — tidak bisa dibuka keyboard | Menu sub tidak dapat diakses keyboard/screen reader | Buka dropdown via `aria-expanded` + focus; jangan andalkan hover |
| S-9 | INFO | `data/pesan.json` & `.gitignore` | Data pesan (nama, email, telepon) disimpan di `data/pesan.json` yang TIDAK di-ignore | Bila server dijalankan di folder repo dan repo di-commit, PII ikut ter-commit | Tambah `data/*.json` (atau minimal `pesan.json`) ke .gitignore |
| S-10 | INFO | `PANDUAN-DEPLOY.md` (systemd) | Contoh systemd tidak menyetel `KCI_DIR_DATA` → data PII ditulis di dalam folder repo | Sama dengan S-9; risiko kebocoran saat backup/commit | Tambah `Environment=KCI_DIR_DATA=/var/lib/kci` |

**Catatan positif (hasil verifikasi):**
- Tidak ada secret/API key/token asli di source code maupun git history (1 commit, `git log -p` bersih; hanya placeholder dokumentasi).
- Hash identitas memakai pepper + namespace; `cariDiDaftarHitam` menangkap akun kecil (uji lulus), silang HP↔DANA tertutup.
- Perbandingan token admin `samaAman()` memakai SHA-256 + `timingSafeEqual`.
- Anti-brute-force token admin (5 gagal/15 mnt/IP) teruji lulus.
- CSRF token wajib untuk semua POST; CORS allow-list di produksi; `jalurInternalAman()` mencegah open redirect dari sessionStorage.
- `npm audit`: **0 vulnerabilities**.

---

## 6. Bugs

| ID | Severity | File | Line | Bug | Root Cause | Fix |
| -- | -------- | ---- | ---- | --- | ---------- | --- |
| B-1 | MEDIUM | `src/lib/identitas.js` | 83-89 | `normalisasiTanggal("2026-02-30")` mengembalikan tanggal "valid" | `new Date("YYYY-MM-DDT00:00:00Z")` di V8 me-rollover tanggal tak valid (Feb 30 → 2 Mar) | Validasi `y,m,d` komponen + `new Date(y, m-1, d)` lalu bandingkan |
| B-2 | MEDIUM | `server/src/konten.js` | 22, 111 | Tanggal konten default = **UTC** (`kiniIso().slice(0,10)`), bukan lokal WIB | `toISOString()` selalu UTC | Pakai waktu lokal server (`Intl` WIB atau `toLocaleDateString`) |
| B-3 | MEDIUM | `src/halaman/Beranda/Beranda.jsx` (formatTanggal), `src/components/DaftarTurnamen.jsx` (tanggal) | ~30, ~190 | `new Date("2026-08-30 13:00")` diurai sebagai **zona waktu lokal browser**; tanggal/tutup daftar turnamen bisa bergeser antar-TZ | String tanggal server tanpa timezone; admin memasukkan WIB | Simpan ISO dengan offset (`2026-08-30T13:00+07:00`) atau tandai `WIB` dan parse eksplisit |
| B-4 | MEDIUM | `src/components/Hero.jsx`, `Loading.jsx`, `Logo.jsx` | `fetchPriority="high"` | React 18.3 TIDAK mengenali prop `fetchPriority` (terverifikasi di source react-dom: 0 kemunculan) → atribut `fetchpriority` tidak pernah sampai ke DOM | React 19 baru mendukung prop ini | Pakai atribut huruf kecil via spread (`<img {...{"fetchpriority":"high"}}>`) atau upgrade React 19; gunakan preload link (sudah ada) |
| B-5 | MEDIUM | `src/halaman/HubungiKami/HubungiKami.jsx` | 14-18, ~90 | Formulir Hubungi Kami memakai `fetch("/api/csrf-token")` & `fetch("/api/pesan")` langsung — tidak lewat `url()` helper | Duplikasi klien API | Refactor ke `chessAnggota.js` (`ambilCsrfToken`, `kirimPesan`) |
| B-6 | LOW | `server/src/oauth.js` + `server/src/index.js` | 148, 189 | `kembaliKe` disimpan di sesi OAuth tapi **tidak pernah dipakai** untuk redirect; callback selalu ke `konfigurasi.oauth.tujuanSetelahLogin` | Kode lengkap alur lama yang tidak difinishing | Gunakan `kembaliKe` (validasi internal) atau hapus param `kembali` |
| B-7 | LOW | `server/src/turnamen.js` | catatHasil | Pemain bisa punya **2 hasil di ronde yang sama** melawan lawan berbeda (Swiss normalnya 1 partai/ronde/pemain) | Validasi hanya menolak pasangan yang sama | Cek `hasil.some(x => x.ronde===r && (x.putih===p||x.hitam===p||x.putih===h||x.hitam===h))` |
| B-8 | LOW | `src/components/ScrollToTop.jsx` | 12 | `decodeURIComponent(hash.slice(1))` bisa `throw URIError` untuk hash malformed (mis. `/#%zz`) → error di useEffect → ErrorBoundary seluruh aplikasi | Asumsi hash selalu valid UTF-8 percent-encoded | Bungkus try/catch |
| B-9 | INFO | `server/src/turnamen.js` | validasiTurnamen | Komentar "tie-break: 3) pertemuan langsung" tapi kode tidak ada pertemuan langsung (urutannya poin→SB→menang→nama) | Komentar vs implementasi tidak sinkron | Perbaiki komentar atau tambah tie-break pertemuan langsung |
| B-10 | INFO | `src/halaman/PendaftaranAnggota/PendaftaranAnggota.jsx` | `hariIni` | `new Date().toISOString().slice(0,10)` = tanggal UTC; pengguna WIB jam 00:30 tidak bisa memilih "hari ini" sebagai tanggal lahir | UTC vs lokal | `toLocaleDateString("sv-SE")` atau format lokal |

**Potensi race / konsistensi:**
- `daftarkan()` menulis `anggota.json` lalu `rahasia/kontak.json` dalam dua operasi antrean terpisah (bukan transaksi) — crash di antara keduanya = anggota tanpa kontak (atau sebaliknya). LOW-MEDIUM.
- `berurutan()` adalah satu rantai global — aman, tapi semua tulis ke semua berkas diserialkan (bottleneck kecil).

---

## 7. Architecture Problems

- **Pemisahan FE/BE sangat baik** (service layer, satu pintu data, validasi dibagi `identitas.js`). Tidak ada circular dependency nyata (komentar di `ui.jsx` menjelaskan siklus lama yang sudah dipecah).
- **Penyimpanan berkas JSON adalah batas skalabilitas**: tidak ada transaksi multi-berkas, tidak ada locking antar-instance (2 instance server + disk bersama = race), tidak ada query. Untuk komunitas kecil ini wajar, tetapi harus disadari: **jangan jalankan >1 instance**.
- **Backend monolitik tanpa framework** — bagus untuk zero-dependency, tetapi router/rate-limit/auth ditulis manual; setiap fitur baru menambah risiko bug keamanan sendiri.
- **Duplikasi klien API**: `chessAnggota.js` (FE) dan `chess.js` (BE) mengimplementasikan pola fetch/retry/cache dua kali dengan perilaku berbeda (FE tidak punya timeout! `fetch` tanpa AbortController di `chessAnggota.js`).
- **Business logic di UI**: `TekaTeki.jsx` (804 baris) berisi mesin permainan (validasi langkah, cek skakmat, timer, progres) di dalam komponen; `Dashboard.jsx` (1045 baris) menggabungkan layout, state, polling, dan notifikasi. Bisa dipecah ke hook/`useReducer` + modul logika murni (mis. `chessAnggota.js` style).
- **Konstanta tersebar**: `WARNA_STATUS`/`TEKS_STATUS` didefinisikan 3× (Beranda.jsx, DaftarTurnamen.jsx, PanelTurnamen/bagian.jsx) dengan nilai hampir sama.
- **Hardcoded klub "blunder-skuad"** di frontend (`chessAnggota.js`, `Peringkat.jsx`, `PendaftaranAnggota.jsx`, `DaftarTurnamen.jsx`, `DaftarAnggota.jsx`) sementara server memakai `KCI_CHESS_KLUB` — jika klub diganti lewat env, frontend tetap menunjuk klub lama (fragile).

---

## 8. Frontend Problems

### React / Hooks
- **`fetchPriority` no-op di React 18** (B-4) — intent performa LCP hilang diam-diam.
- `StickyMenu` (tanpa `onSelect`): `daftar` = array baru tiap render → `useEffect([daftar])` jalan setiap render (add/remove listener berulang). LOW.
- `Tonggak` carousel: `SLIDES` dibuat ulang tiap render; autoplay RAF berjalan terus walau slide tidak terlihat. LOW.
- `TekaTeki`: banyak state; `terapkanSoal` dipanggil dari effect tanpa deps lengkap (eslint-disable) — risiko stale closure saat filter berganti cepat. LOW (teruji manual OK).
- `useAnggota`: cache TTL 5 menit sedangkan server cache profil 1 jam — angka "Muat ulang" tidak benar-benar segar (bukan bug, tapi ekspektasi).
- Tidak ada `AbortController` di fetch frontend — komponen unmount hanya menandai `hidup=false`; request tetap jalan (boros di navigasi cepat). LOW.

### Komponen
- `Dashboard.jsx` 1045 baris — terlalu banyak tanggung jawab.
- `TekaTeki.jsx` 804 + `PapanTekaTeki.jsx` 654 baris — mesin permainan di dalam komponen.
- `terjemahan.js` 1471 baris — kamus raksasa di bundle utama (kedua bahasa sekaligus).
- `Header.jsx` 460 baris dengan 3 komponen internal (NavItemDesktop, MobileDrawer, SearchOverlay) — OK tapi padat.
- Prop drilling: `Dashboard` → panel (anggota, larangan, turnamen) meneruskan `beriTahu`/`muatUlang` — bisa diganti context. LOW.

### UI / Responsive / Aksesibilitas (detail di §10)

---

## 9. Backend Problems

| Area | Temuan |
| ---- | ------ |
| API | Routing, status code, struktur respons konsisten; `GalatAplikasi`, `GalatChess`, kode `TERLALU_BESAR`/`JSON_RUSAK` ditangani rapi |
| Validation | Formulir pendaftaran kuat. **Gap:** tanggal kalender tak valid (B-1); `berita.ubah` tidak memvalidasi `tanggal`; `catatHasil` tidak menjaga 1 partai/ronde/pemain (B-7); `ajukanKeikutsertaan` memanggil `ambilProfil` tanpa cache setiap pengajuan (performa) |
| Security | Lihat §5 (S-1..S-10). Umumnya sangat baik |
| Error Handling | 502 untuk GalatChess, 500 generik untuk lainnya, log konsol terstruktur `[kci]` — baik. `console.error` sah di produksi |
| Caching | Cache memori FIFO 5000 entri; roster 12 jam + fallback cache lama saat Chess.com down — sangat baik |
| Concurrency | Semaphore 5 untuk keluar; antrean tulis serial; **tidak ada lock antar-instance** |
| Logging | Tidak ada log sensitif (token tidak pernah di-log; `identitasPengurus` disaring regex). Jejak audit JSONL di `rahasia/` |
| Timeout | chess.js punya timeout+retry; **oauth.js tidak** (S-3) |

### Kinerja backend yang perlu dicatat
- `GET /api/anggota` = roster × (profil + stats) dengan konkurensi 5. Klub 500 anggota → ±1.000 request ≈ 40–60 dtk pada muat pertama, lalu cache 1 jam. Terukur wajar, tapi **first paint data anggota lambat** untuk klub besar. Pertimbangkan batasi jumlah yang diperkaya atau cache agregat di disk.
- `pindaiFairPlay` & `pindaiPesertaTurnamen` loop serial (1 request/partisipan) — bisa lambat untuk turnamen besar; aman tapi tidak paralel (berlawanan dengan `pindaiFairPlay` di keanggotaan yang paralel).

---

## 10. Chess.com Integration Problems

| Area | Status | Masalah |
| ---- | ------ | ------- |
| Endpoint roster klub | OK | `/club/{slug}/members`, merge weekly/monthly/all_time, dedupe, prioritas aktivitas — benar |
| Endpoint profil/stats | OK | `ringkasRating` memilih Rapid→Blitz→Bullet→Daily, W/D/L dijumlahkan — benar |
| **FRAGILE** — slug klub hardcoded di FE | RISK | `chessAnggota.js:47-48` `api.chess.com/pub/club/blunder-skuad/members` + 5 file FE lain hardcode "blunder-skuad"; server memakai env `KCI_CHESS_KLUB`. Ganti klub = FE rusak |
| Rate limiting | OK | Backoff 300/600/1200 ms + hormati 429; semaphore 5 |
| Timeout | OK (BE) / RISK (FE) | `KCI_CHESS_TIMEOUT` 8 dtk di `chess.js`; fallback FE `ambilRosterPublikChess()` tanpa timeout |
| Stale data | WARNING | Roster cache 12 jam (sesuai kebijakan Chess.com) — anggota baru muncul max 12 jam; dokumentasi sudah jujur |
| Duplicate request | OK | Dedupe `sedangMemuat` + cache |
| Player not found | OK | `hilang: true` tetap tampil di UI tanpa rating |
| Fair-play | OK | `closed:fair_play_violations` → blokir otomatis + anulir turnamen |
| Asumsi struktur respons | FRAGILE | Bergantung pada `username`, `joined`, `status`, `avatar`, `url`, `location`, `name`, `stats.chess_*.last.rating`, `record.win/draw/loss`. Bila Chess.com mengubah skema (mis. menambah namespace kontrol waktu), parser diam-diam menghasilkan `elo: null` — tidak ada validasi skema eksplisit |
| Kode verifikasi profil | WARNING | Mencocokkan kode di `location | name | url` — kolom `name` bisa diisi orang lain? Tidak: kode hanya diketahui pemohon. Tapi kode di `name`/`url` berisiko terindeks Google (kode jadi publik) — sebaiknya batasi hanya `location` |
| OAuth | OK | PKCE S256, state sekali pakai, JWT RS256 + JWKS, aud/exp/nbf — solid. Tanpa timeout fetch (S-3) |
| OAuth `kembali` param | DEAD | B-6 |

---

## 11. Performance Problems

### CRITICAL PERFORMANCE
- Tidak ada. (Tidak ditemukan bottleneck parah.)

### HIGH IMPACT
1. **`panduanCatur.js` chunk 719 kB (132 kB gzip)** — di-lazy-load hanya di rute CaraBermainCatur, tapi tetap besar; bisa dipecah per bab atau di-fetch JSON.
2. **`ChessPieceSvg` chunk 336 kB (67 kB gzip)** — 13 set × 12 SVG diinline; hanya 1 set dipakai per pengguna. Lazy-load per set (dynamic import set terpilih) bisa hemat ~90%.
3. **`GET /api/anggota` fan-out profil** — 1.000 request Chess.com per muat pertama klub 500 anggota (cache 1 jam membantu).

### MEDIUM IMPACT
4. `index` chunk 322 kB (105 kB gzip) — React+Router+Header/Footer+**kedua kamus bahasa** (563+563 kunci, termasuk paragraf panjang) di bundle awal. Split i18n per bahasa (dynamic import kamus EN hanya saat dipilih) hemat ~40–80 kB gzip.
5. Gambar 1280w `sekilas.webp` (639 kB), `tonggak-2018.webp` (619 kB), `tonggak-2016.webp` (392 kB) — varian `-828` dipakai untuk LCP (baik), tapi varian besar ini berat; kompresi tambahan (AVIF) atau turunkan kualitas.
6. Dashboard polling notifikasi setiap 30 dtk terus-menerus (tidak dijeda saat tab hidden) — kecil.

### LOW IMPACT
7. `StickyMenu` re-subscribe listener tiap render.
8. Font 500/600/800 tidak di-preload (OK — sesuai kebutuhan).
9. Carousel `Tonggak` RAF berjalan saat tidak terlihat — tambahkan `IntersectionObserver`/`visibilitychange`.

**Catatan positif:** CSS di-inline, font self-hosted, preload LCP + `#boot-hero` (LCP langsung dari HTML), width/height di semua gambar (anti-CLS), srcset 828/1280, `modulePreload: false` (semua modern), rute di-lazy.

---

## 12. UX/UI Problems

| Kategori | Temuan |
| -------- | ------ |
| Desktop | Dropdown menu header hanya hover (tidak keyboard). Sticky menu `top-[72px]` hardcode — bisa menabrak header saat transisi scroll. |
| Tablet | Grid sidebar 220px + konten — OK; tabel peringkat `min-width:880px` dengan overflow-scroll — OK |
| Mobile | Drawer menu tanpa kunci scroll body (background ikut scroll di iOS); tombol kecil (<44px touch target) di banyak tempat (`text-xs px-4 py-2`); `TombolBahasa` disembunyikan di mobile (tidak ada pengganti) |
| Navigation | Footer: 7 tautan `href="#"` (chapters, privasi, penipuan, sosial media) — dead links. `DocumentCard` E-Book `href="#"`. Breadcrumb konsisten. Back navigation OK (BrowserRouter). |
| Forms | HubungiKami: checkbox persetujuan tidak terhubung ke submit server (tidak divalidasi); "Baca Selengkapnya" → `#privacy` yang tidak ada. Pendaftaran: validasi lokal + server ganda — baik |
| Feedback | Loading/error/empty state hampir selalu ada (baik). Beranda `gagal` menggabungkan semua fetch (satu gagal → semua pesan error) — kasar |
| Empty state | Turnamen, anggota, pesan: ada. DaftarJuara/EbookPanduan/HubungiAdmin: placeholder "akan dilengkapi" |
| Search | Overlay pencarian: **Enter tidak melakukan apa-apa** (form `preventDefault`, tanpa navigasi) padahal teksnya "Tekan Enter untuk mencari" — misleading; tidak ada focus trap |
| Aksesibilitas | Dropdown hover (S-8); modal tanpa focus trap (S-7); `aria-label` pada `<span>` (titik "belum dibaca") tidak terbaca sebagian SR; kontras `text-[#64748B]` kecil di atas putih ~4.8:1 (marginal untuk teks kecil); heading hierarchy umumnya baik (`h1` hero → `h2` section); semua `<div onClick>` pada elemen interaktif sudah memakai `<button>` (baik) kecuali bullet carousel yang pakai `role="button"` (sudah dengan Enter/Space — OK) |

---

## 13. Dead Code

| Item | Lokasi | Aman dihapus? |
| ---- | ------ | ------------- |
| `PulihkanRute` + `jalurInternalAman` | `src/App.jsx` (digunakan `public/404.html`) | YA — `plugins/performa.js` **menimpa** `dist/404.html` dengan index.html, jadi skrip pemulihan rute di `public/404.html` tidak pernah terpakai di build; komponen tetap jalan tapi tidak pernah menerima data. Pertahankan hanya bila mau mengembalikan mekanisme 404 asli |
| `public/404.html` (versi asli) | `public/404.html` | YA setelah konfirmasi desain fallback baru (SPA 200) |
| `kembaliKe` OAuth | `server/src/oauth.js:148,224`, `server/src/index.js:150,189` | YA — nilai tidak pernah dipakai untuk redirect |
| `data/problems.json` (670 kB) | `data/problems.json` | YA — duplikat persis `public/data/teka-teki.json` (verifikasi: isi identik, 4462 soal) |
| `src/asets/bidak/*.png` (12 file) | `src/asets/bidak/wB.png … bK.png` | YA — tidak direferensikan (yang dipakai versi SVG; grep 0 hasil) |
| `src/components/PageBagian.jsx` `PageGambar` | dipakai Galeri — bukan dead |
| `LoadingSkeleton` | `src/components/Loading.jsx` | Tidak direferensikan (grep: hanya definisi) — YA |
| `CorporateDivider` | dipakai HubungiKami — bukan dead |
| `alihkan-akar-preview` plugin | `vite.config.js` | Dipakai preview server — bukan dead |
| `KUNCI_TIPE`/`KUNCI_SUSAH` | `src/halaman/TekaTeki/TekaTeki.jsx` | Didefinisikan, cek pemakaiannya (kemungkinan sisa refactor) — REVIEW |
| Kunci i18n `nav.pengadaan`, `common.alamat`, `sticky.strukturPengurus`, `bagian.dewanPengurus` | `src/lib/terjemahan.js` | Kemungkinan tidak dipakai — REVIEW (uji i18n hanya cek paritas, bukan pemakaian semua kunci) |

---

## 14. Duplicate Code

| File A | File B | Logika sama | Rekomendasi |
| ------ | ------ | ----------- | ----------- |
| `src/halaman/Beranda/Beranda.jsx` (`WARNA_STATUS`, `TEKS_STATUS`, `formatTanggal`) | `src/components/DaftarTurnamen.jsx` (sama) | Lencana status turnamen + format tanggal | Satu modul `src/lib/turnamenUI.js` (atau di `chessAnggota.js`) |
| `src/halaman/Beranda/Beranda.jsx` | `src/halaman/MediaDanInformasi/DetailKonten.jsx` + `DaftarKontenMedia.jsx` | `formatTanggal` (3 implementasi) | Shared util |
| `src/halaman/HubungiKami/HubungiKami.jsx:14` | `src/lib/chessAnggota.js:ambilCsrfToken` | Ambil CSRF token | Pakai yang shared |
| `src/lib/chessAnggota.js` (fallback roster) | `server/src/klub.js` (normalisasi roster) | Merge weekly/monthly/all_time + dedupe | Satu definisi skema (FE memakai versi sederhana tanpa prioritas aktivitas — perilaku bisa beda: FE `unik.has` hanya dedupe, BE memakai prioritas) |
| `server/src/keanggotaan.js` `daftarAnggota()` | `server/src/klub.js` | Keduanya melakukan enrichment roster+profil? Tidak — `daftarAnggota` memanggil `daftarAnggotaKlub` — OK, bukan duplikat |
| `scripts/pengurus.mjs` `chessGet` (tanpa retry/cache) | `server/src/chess.js` `chessGet` (retry/cache) | HTTP client ke Chess.com | Alat CLI sebaiknya import dari `chess.js` (perilaku konsisten) |
| `LABEL_STATUS`/`Lencana` | `WARNA_STATUS` (Beranda, DaftarTurnamen) | 3 definisi lencana status | Satu komponen `LencanaStatus` |

---

## 15. Incomplete Features

| Feature | UI | Logic | Backend | Status |
| ------- | -- | ----- | ------- | ------ |
| Daftar Juara (`/beranda/daftar-juara`) | Placeholder "konten sedang dilengkapi" | — | — | **INCOMPLETE** |
| E-Book & Panduan (`/beranda/ebook-panduan`) | 2 `DocumentCard` dengan `href="#"` (dead link) | — | — | **INCOMPLETE** |
| Hubungi Admin (`/beranda/hubungi-admin`) | Placeholder | — | — | **INCOMPLETE** |
| Footer jejaring sosial + chapters + privasi/penipuan | Tautan `#` | — | — | **INCOMPLETE** |
| OAuth Chess.com | Tombol login tampil hanya bila `oauthAktif()` | Selesai (PKCE+OIDC) | Env `KCI_CHESS_CLIENT_ID` kosong → tidak aktif; `kembali` param mati | **PARTIALLY COMPLETE** |
| Pencarian | Overlay + daftar hasil | Filter lokal | — | PARTIALLY (Enter tidak navigasi) |
| Bahasa EN | Toggle header | Kamus 563 kunci | — | PARTIALLY — HubungiKami, Dashboard, Beranda (DaftarJuara/Ebook/HubungiAdmin), Karir, Galeri (caption) tetap hardcoded Indonesia |
| Beranda tab "Informasi Jadwal" | Menampilkan jadwal + pengumuman | OK | OK | COMPLETE (data dari API) |
| Dashboard pengurus | Lengkap | Lengkap | Lengkap | COMPLETE |
| Teka-teki 4.462 soal | Lengkap (drag, panah, set bidak, progres localStorage) | Lengkap | Data statis | COMPLETE |
| Verifikasi profil (kode) | Lengkap | Lengkap | Lengkap | COMPLETE |
| Turnamen (4 jenis) | Lengkap | Klasemen + SB | Lengkap | COMPLETE (dengan catatan B-7, B-9) |

---

## 16. Documentation Problems

| Dokumen | Temuan |
| ------- | ------ |
| `README.md` | Tabel struktur menyebut `src/components/Struktur.jsx` yang **tidak ada** (sudah dipindah ke `StrukturGrupCatur/`); sebutan "Divider di src/App.jsx" usang. Tidak menyebut server/ sama sekali (bagian penting). |
| `PANDUAN-DEPLOY.md` | §3 "Bila frontend tetap di GitHub Pages: tambahkan `.env.production`" — **CI tidak membuat/membaca itu** (P0-1). Contoh systemd tidak menyetel `KCI_DIR_DATA` (S-10). |
| `PANDUAN-PENGURUS.md` | Akurat. Sebutan `/pengurus` di domain `komunitascatur.or.id` — domain tidak ada di repo (placeholder OK). |
| `PANDUAN-VERIFIKASI-AKUN.md` | Akurat; menyebut OAuth aktif setelah client_id — sesuai kode. |
| `server/README.md` | Tabel callback OAuth menulis `→ ?verifikasi=sukses&akun=&tiket=` — **tidak sesuai** kode (hasil dikirim via `sessionStorage`, bukan query string; dan `kembali` param diabaikan). |
| `prompt.md` | Dokumen spesifikasi/riset — tidak diverifikasi isinya; tidak bertentangan dengan kode. |
| `src/halaman/BACA-DULU.md` | Struktur folder sedikit usang: tidak mencantumkan `PanelTurnamen/{Formulir,Rincian,bagian}.jsx`, `Larangan.jsx`, `Pesan.jsx`, `PanelKonten.jsx`, `ui.jsx` di area Pengurus. |

---

## 17. Dependency Problems

| Dependency | Status | Keterangan |
| ---------- | ------ | ---------- |
| `react` 18.3.1 / `react-dom` 18.3.1 | SAFE (tetap) / POTENTIALLY BREAKING (naik ke 19) | React 19 mengubah beberapa perilaku; tidak ada kerentanan. Naik ke 19 akan memperbaiki `fetchPriority` — tapi lakukan bertahap |
| `vite` 6.4.3 (latest 8.x) | SAFE | Tidak perlu upgrade untuk saat ini; upgrade mayor = risiko plugin |
| `@vitejs/plugin-react` 4.7 (latest 6.x) | SAFE | — |
| `react-router-dom` ^7.18.2 | SAFE | v7 stabil, API kompatibel pemakaian ini |
| `chess.js` ^1.4.0 | SAFE | — |
| `tailwindcss` ^4 + `@tailwindcss/vite` | SAFE | v4 terpasang |
| `esbuild@0.25.12` | SAFE (allowScripts) | — |
| Tidak ada dependency tak terpakai di package.json | GOOD | Semua 4 dep runtime terpakai |
| `npm audit` | **0 vulnerabilities** | — |

**Bedakan:**
- SAFE UPDATE: `vite` patch (6.4.x), `tailwind` patch.
- POTENTIALLY BREAKING: `react`→19 (perlu uji penuh; menyelesaikan B-4), `vite`→8, `@vitejs/plugin-react`→6.
- CRITICAL SECURITY UPDATE: tidak ada saat ini.

---

## 18. Production Readiness

| Area | Score | Status | Reason |
| ---- | ----: | ------ | ------ |
| Architecture | 4/5 | Baik | Pemisahan FE/BE bersih, service layer konsisten, zero-framework BE mudah diaudit. Batas: JSON-file storage, satu rantai tulis global |
| Security | 4/5 | Baik | Pepper-hash, timing-safe, CSRF, rate-limit, brute-force lockout, tanpa secret di repo. Minus: sidikPepper bocor (S-1), pepper dev default (S-2), tanpa CSP FE |
| Performance | 4/5 | Baik | Asset pipeline kelas atas (WebP, srcset, preload, CSS inline, code-split). Minus: 3 chunk besar (panduan 719 kB, SVG 336 kB, index 322 kB), fan-out profil |
| Reliability | 3/5 | Cukup | Tulis atomik + retry/backoff + fallback cache saat Chess.com down = solid. Minus: tidak ada backup otomatis, 1 instance saja, beberapa validasi longgar (B-1, B-7), tanpa transaksi antar-berkas |
| Accessibility | 2/5 | Kurang | Menu hover-only, modal tanpa focus trap, touch target kecil, kontras marginal, i18n sebagian — belum WCAG AA |
| SEO | 2/5 | Kurang | Tanpa canonical/OG/Twitter/robots/sitemap/JSON-LD; meta description statis; rute dinamis balas HTTP 404 (konten tetap render) |
| Testing | 4/5 | Baik | 103+ cek integrasi/unit lulus tanpa internet; kuat untuk logika inti. Tidak ada test component/E2E (rekomendasi di §19) |
| Documentation | 4/5 | Baik | Dokumentasi lengkap & jujur; beberapa ketidaksesuaian kecil (§16) |
| Deployment | 3/5 | Cukup | Workflow GH Pages berfungsi untuk statis; tapi API putus tanpa `VITE_API_DASAR` (P0-1); backend butuh hosting manual + disk + backup |
| Maintainability | 4/5 | Baik | Konvensi jelas, komentar bagus, satu pintu data. Minus: file raksasa (Dashboard 1045, TekaTeki 804, terjemahan 1471), konstanta berulang |

---

## 19. Testing Audit — Rekomendasi Prioritas

Belum ada kerangka test otomatis (Jest/Vitest/Playwright); test saat ini berupa skrip Node ad-hoc. **Fungsi paling kritis untuk ditest dulu:**

1. **Mesin klasemen turnamen** (`server/src/turnamen.js:hitungKlasemen`) — poin, SB, minPartai, beregu, anulir. (Sekarang hanya lewat uji HTTP uji-backend, belum unit langsung dengan kasus tie-break.)
2. **`normalisasiTanggal`/`kategoriUmur`** — tambahkan kasus tanggal kalender invalid (2026-02-30) → harus gagal (B-1).
3. **`catatHasil`** — ronde sama + lawan berbeda harus ditolak (B-7).
4. **Alur verifikasi + pendaftaran penuh** — sudah ada (uji-verifikasi 30 cek); tambahkan kasus `mode=wajib` tanpa tiket.
5. **`daftarAnggota` serialisasi publik** — pastikan `sidikPepper`/`kotaKunci` tidak pernah muncul (S-1).
6. **Frontend**: tambahkan minimal Vitest untuk `anggotaBersama.js` (opsiKontrol, susunPeringkat) dan smoke-test Playwright untuk 5 rute utama + formulir pendaftaran.

---

## 20. Build & Runtime Audit (hasil eksekusi aktual)

```text
npm install        → sukses (87 paket)
npm run build      → SUKSES (2.6 s)
  WARNING: chunk >500 kB:
    panduanCatur-*.js   719.43 kB  (131.86 kB gzip)
    ChessPieceSvg-*.js  335.98 kB  ( 66.77 kB gzip)
    index-*.js          322.32 kB  (104.65 kB gzip)
npm run uji         → SUKSES (uji-rute: 33 rute selaras; uji-i18n: 563=563 kunci, 437 terpakai; identitas: 30 lulus)
npm run uji:backend → SUKSES (73 lulus, 0 gagal)
npm run uji:verifikasi → SUKSES (30 lulus, 0 gagal)
npm audit           → 0 vulnerabilities
npm run dev         → SUKSES (Vite 6.4.3, HTTP 200)
Server + mock-chess → SUKSES (verifikasi runtime S-1 & P0-3: sidikPepper bocor — TERBUKTI)
```

Tidak ada BUILD ERROR / TYPE ERROR (tanpa TS) / LINT ERROR (tanpa eslint) / RUNTIME ERROR yang ditemukan pada jalur yang diuji. Hanya WARNING ukuran chunk + temuan di atas.

---

## 21. File-by-File Audit (file penting)

```text
src/main.jsx                       GOOD   — ringkas, ErrorBoundary di atas router
src/App.jsx                        WARNING — PulihkanRute mati; routing baik; redirect Map rapi
src/menu.js                        GOOD
src/index.css                      WARNING — token warna campur hardcode (#0B2F9F, #64748B, #374151, #021624, #E21F23 …)
src/lib/terjemahan.js              REFACTOR — 1471 baris; split per bahasa
src/lib/identitas.js               WARNING — B-1 (tanggal invalid)
src/lib/chessAnggota.js            WARNING — klub hardcode; tanpa timeout fetch
src/lib/anggotaBersama.js          GOOD
src/lib/asets.js                   GOOD
src/lib/i18n.jsx                   GOOD
src/components/Header.jsx          WARNING — dropdown hover non-keyboard; SearchOverlay Enter mati; tombol kecil
src/components/Footer.jsx          WARNING — banyak href="#"
src/components/Hero.jsx            WARNING — fetchPriority no-op (B-4)
src/components/Tonggak.jsx         WARNING — autoplay tak dijeda saat tak terlihat
src/components/StickyMenu.jsx      WARNING — efek re-run tiap render; top-[72px] hardcode
src/components/CorporatePage.jsx   GOOD — DocumentCard href default "#" (pemicu dead link di EbookPanduan)
src/components/PageBagian.jsx      GOOD
src/components/ProtectedRoute.jsx  GOOD — verifikasi token ke server, galat 5xx tidak menendang keluar
src/components/VerifikasiAkun.jsx  GOOD
src/components/Lencana.jsx         GOOD
src/components/Loading.jsx         WARNING — LoadingSkeleton tak dipakai; fetchPriority no-op
src/halaman/Beranda/Beranda.jsx    GOOD — 3 fetch digabung Promise.all (satu gagal → semua error)
src/halaman/Beranda/Peringkat.jsx  GOOD — satu pintu data; filter + kontrol waktu
src/halaman/Beranda/DaftarJuara.jsx        INCOMPLETE
src/halaman/Beranda/EbookPanduan.jsx       INCOMPLETE (DocumentCard href="#")
src/halaman/Beranda/HubungiAdmin.jsx       INCOMPLETE
src/halaman/Beranda/TekaTekiTips.jsx       GOOD (statis + ChessPiece)
src/halaman/TekaTeki/TekaTeki.jsx          REFACTOR — 804 baris; mesin permainan di komponen
src/halaman/TekaTeki/PapanTekaTeki.jsx     REFACTOR — 654 baris; geometri panah kompleks
src/halaman/PendaftaranAnggota/PendaftaranAnggota.jsx  GOOD — validasi ganda FE/BE, privasi terjaga
src/halaman/HubungiKami/HubungiKami.jsx    WARNING — B-5; tidak i18n; link #privacy mati
src/halaman/Karir/Karir.jsx                WARNING — warna #0B4D8C/#252A64 di luar token
src/halaman/Pengurus/Dashboard.jsx         REFACTOR — 1045 baris; polling 30 dtk
src/halaman/Pengurus/PanelKonten.jsx       GOOD — kompresi gambar → data URL ≤1.9 MB (sesuai batas server)
src/halaman/Pengurus/PanelTurnamen/*.jsx   GOOD — dibagi rapi (Formulir/Rincian/bagian)
src/halaman/Pengurus/ui.jsx                GOOD — Modal tanpa focus trap (S-7)
src/halaman/MediaDanInformasi/*.jsx        GOOD — DetailKonten fetch seluruh daftar lalu filter (inefisien)
server/src/index.js               GOOD — routing + penanganan galat rapi
server/src/http.js                GOOD — rate-limit, CSRF, auth, alamatIp benar (ambil paling kanan XFF)
server/src/keanggotaan.js         WARNING — S-1 (sidikPepper bocor); tanpa transaksi antar-berkas
server/src/identitas-server.js    WARNING — S-2 (pepper dev)
server/src/chess.js               GOOD — timeout/retry/backoff/cache/semaphore
server/src/klub.js                GOOD — dedupe roster + prioritas aktivitas + fallback cache lama
server/src/turnamen.js            WARNING — B-7, B-9; komentar tie-break keliru
server/src/oauth.js               WARNING — B-6, S-3
server/src/verifikasi-profil.js   GOOD — rate-limit percobaan, cache bypass
server/src/konten.js              WARNING — B-2 (tanggal UTC); gambarAman sudah baik
server/src/pesan.js               GOOD
server/src/simpanan.js            GOOD — tulis atomik + antrean
scripts/pengurus.mjs              WARNING — duplikat HTTP client tanpa retry
plugins/performa.js               WARNING — menimpa public/404.html (PulihkanRute jadi mati)
vite.config.js                    GOOD — proxy, base, preview redirect
.github/workflows/deploy.yml      WARNING — P0-1 (VITE_API_DASAR hilang)
public/404.html                   REMOVE/REVIEW — ditimpa build
data/problems.json                REMOVE — duplikat teka-teki.json
```

---

## 22. Dependency Graph

```text
App
 ├── PageLayout → Header (Logo, icons, menu) ─ Footer
 ├── ScrollToTop ─ PulihkanRute (mati)
 ├── ProtectedRoute → Gerbang → Dashboard
 │     ├── PanelAnggota / PanelLarangan / PanelPesan
 │     ├── PanelKonten (Berita/Pengumuman)
 │     └── PanelTurnamen → Formulir / Rincian (bagian)
 ├── TataLetakBeranda → CorporatePage (Hero, CorporateSidebar) → tab Beranda
 ├── RUTE_HALAMAN → HalamanIsi/Hero/PageArtikel + halaman spesifik
 └── TekaTeki → PapanTekaTeki → ChessPieceSvg (13 set) → chess.js
      └── public/data/teka-teki.json (4462 soal)

Lib FE: chessAnggota.js → identitas.js · anggotaBersama.js · i18n.jsx → terjemahan.js · asets.js
Server: index.js → http.js · konfigurasi.js · keanggotaan.js → simpanan.js/identitas-server.js/klub.js/chess.js/oauth.js
        turnamen.js → keanggotaan.js (GalatAplikasi, repo) · konten.js · pesan.js
        identitas.js (FE) DI-IMPORT OLEH server (berbagi aturan) ← lintas batas, disengaja

Circular dependency: TIDAK ADA (sudah dipecah — komentar di ui.jsx)
```

---

## 23. PRIORITY FIX ROADMAP

### P0 — Fix Immediately
1. **CR-1 (P0-1)**: Set `VITE_API_DASAR` di workflow deploy (atau `.env.production` di repo).
2. **CR-2 (P0-2)**: Tolak start server publik tanpa `KCI_PEPPER` (tidak bergantung hanya pada `NODE_ENV=production`).
3. **CR-3 (S-1)**: Hentikan bocornya `sidikPepper`/`kotaKunci`/`caraVerifikasi` di `/api/anggota`.
4. **B-1**: Perbaiki `normalisasiTanggal` (tanggal kalender invalid).

### P1 — Fix Before Production
5. **B-4**: Perbaiki `fetchPriority` (React 19 atau atribut lowercase) untuk hero LCP.
6. **B-5 / S-4**: Refactor HubungiKami ke klien API bersama (i18n + `url()` + CSRF).
7. **B-2**: Tanggal konten default pakai waktu lokal Indonesia.
8. **B-3**: Simpan tanggal turnamen dengan offset timezone eksplisit.
9. **S-2**: Dokumentasi + guard `KCI_JUMLAH_PROXY`, pastikan deploy punya `KCI_DIR_DATA` & backup (S-9/S-10, .gitignore data/*.json).
10. **B-6**: Gunakan atau hapus `kembaliKe` OAuth; perbaiki dokumentasi `server/README.md`.

### P2 — Fix Soon
11. **B-7**: 1 partai/ronde/pemain di `catatHasil`.
12. **B-8**: try/catch `decodeURIComponent` di ScrollToTop.
13. **S-3**: timeout fetch OAuth certs/token.
14. **S-8 / S-7**: dropdown keyboard-accessible + focus trap modal.
15. **Dead code**: hapus `LoadingSkeleton`, `data/problems.json`, PNG bidak mati; putuskan nasib `PulihkanRute`/`public/404.html`.
16. **Duplikasi**: satu `formatTanggal`/`LencanaStatus`/`WARNA_STATUS`.

### P3 — Improvement
17. Split kamus i18n per bahasa (dynamic import EN).
18. Lazy-load set bidak per pilihan (hemat ~300 kB) & pecah `panduanCatur.js`.
19. Pisahkan mesin Teka-Teki dari komponen (hook + modul murni).
20. Batasi fan-out profil di `GET /api/anggota` (agregat cache disk).
21. SEO: canonical, OG/Twitter, robots.txt, sitemap.xml, JSON-LD, meta description per rute.
22. Aksesibilitas: touch target ≥44px, kontras, `sr-only` untuk indikator, pause carousel saat `prefers-reduced-motion`.
23. Search: jadikan Enter navigasi ke hasil pertama; tutup overlay dengan Escape; kunci scroll body pada drawer/overlay.
24. Tambah Vitest/Playwright (lihat §19).

---

## 24. FINAL VERDICT

### Apakah project ini:

```text
[ ] Belum siap
[ ] Siap untuk development
[ ] Siap staging
[X] Hampir production ready
[ ] Production ready
```

**Alasan teknis:**

- **Backend & keamanan data**: siap produksi. Kode matang, teruji (103 cek), anti-akun-kecil bekerja, tidak ada secret di repo, tidak ada kerentanan dependensi.
- **Frontend statis**: siap dari sisi build/performa (asset pipeline bagus), tetapi **jalur deploy resmi (GitHub Pages) menghasilkan situs dengan API putus** karena `VITE_API_DASAR` tidak disetel di CI — ini yang menahan status "production ready".
- **Integritas data**: ada beberapa bug validasi kecil (tanggal kalender invalid, 2 partai/ronde, tie-break tidak sesuai komentar) dan timezone yang tidak eksplisit.
- **Privasi**: satu kebocoran kecil (`sidikPepper`) + risiko PII di `data/pesan.json` jika repo di-commit dari server.
- **Aksesibilitas & SEO**: belum setara dengan kualitas teknis lainnya — perlu satu iterasi (P2/P3).
- **Observability**: log `[kci]` konsisten, ada `/api/kesehatan`, jejak audit — cukup; belum ada metrik/alert.

**Kesimpulan:** Dengan menyelesaikan 4 item P0 (estimasi < 1 hari kerja), project ini layak dianggap **production ready untuk komunitas skala kecil-menengah**, dengan catatan memakai backend terpisah (Render/VPS) + disk persisten + backup berkala, dan menjalankan satu instance server saja.

---

## 25. LAMPIRAN — Perbaikan yang Telah Diterapkan (2026-08-21)

Daftar perbaikan yang dikerjakan berdasarkan temuan audit di atas, beserta status verifikasinya. Semua perubahan sudah lulus `npm run build`, `npm run uji` (36 cek), `npm run uji:backend` (84 cek), dan `npm run uji:verifikasi` (30 cek) — total 150 cek hijau.

| ID Temuan | Perbaikan | File |
| --------- | --------- | ---- |
| P0-1 (CR-1) | Workflow deploy menyetel `VITE_API_DASAR` (bawaan `https://kci-api.onrender.com`, bisa di-override lewat repository variable `KCI_API_URL`) | `.github/workflows/deploy.yml` |
| P0-2 (CR-2) | Mode produksi = `NODE_ENV=production` ATAU `KCI_ASAL_DIIZINKAN` terisi; tanpa `KCI_PEPPER`/`KCI_TOKEN_ADMIN` server menolak start (terverifikasi: Kasus A/B exit 1, Kasus C dev tetap jalan) | `server/src/konfigurasi.js`, `.env.contoh`, `server/README.md` |
| P0-3 (S-1) | `tanpaRahasia` memakai allow-list eksplisit — `sidikPepper`, `kotaKunci`, `caraVerifikasi`, dan hash identitas tidak lagi dikirim ke `/api/anggota` (terverifikasi runtime + test `roster publik tidak membocorkan…`) | `server/src/keanggotaan.js`, `src/halaman/Pengurus/Anggota.jsx`, `server/uji/uji-backend.mjs` |
| B-1 | `normalisasiTanggal` memvalidasi kalender (30 Feb, 31 Apr, bulan 13 ditolak) + 6 kasus uji baru | `src/lib/identitas.js`, `scripts/uji-identitas.mjs`, `server/uji/uji-backend.mjs` |
| B-2 | Tanggal konten bawaan memakai Asia/Jakarta; `ubah` memvalidasi format tanggal | `server/src/konten.js` |
| B-3 | Jam turnamen diurai eksplisit sebagai UTC+7 (WIB) di Beranda & DaftarTurnamen | `src/lib/waktu.js` (baru), `src/halaman/Beranda/Beranda.jsx`, `src/components/DaftarTurnamen.jsx` |
| B-4 | `fetchPriority` → `fetchpriority` (React 18 meneruskan atribut huruf kecil ke DOM — terverifikasi via `renderToStaticMarkup`) | `src/components/Hero.jsx`, `Loading.jsx`, `Logo.jsx` |
| B-5 / S-4 | Form Hubungi Kami memakai `kirimPesan()` dari klien API bersama (menghormati `VITE_API_DASAR` + CSRF); tautan `#privacy` mati diganti ke halaman Syarat & Ketentuan | `src/lib/chessAnggota.js`, `src/halaman/HubungiKami/HubungiKami.jsx` |
| B-6 | `kembaliKe` OAuth divalidasi (`jalurInternal`, anti open-redirect) dan benar-benar dipakai untuk redirect; interpolasi HTML di-JSON.stringify | `server/src/oauth.js`, `server/src/index.js` |
| B-7 | `catatHasil` menolak pemain yang sudah bermain di ronde yang sama + 5 kasus uji baru | `server/src/turnamen.js`, `server/uji/uji-backend.mjs` |
| B-8 | `decodeURIComponent` di ScrollToTop dibungkus try/catch | `src/components/ScrollToTop.jsx` |
| B-10 | Batas tanggal lahir di formulir memakai tanggal lokal Asia/Jakarta | `src/halaman/PendaftaranAnggota/PendaftaranAnggota.jsx` |
| S-3 | Fetch OAuth (certs/token) memakai timeout 8 dtk | `server/src/oauth.js` |
| S-7 | Modal pengurus: focus trap (Tab berputar di dalam dialog) + restore fokus + `aria-label` | `src/halaman/Pengurus/ui.jsx` |
| S-8 | Dropdown menu desktop bisa dibuka via keyboard (`group-focus-within`) | `src/components/Header.jsx` |
| S-9 | `data/pesan.json` di-untrack + masuk `.gitignore` (PII form Hubungi Kami tidak ikut commit) | `.gitignore`, `git rm --cached data/pesan.json` |
| S-10 | Contoh systemd di PANDUAN-DEPLOY menambah `KCI_DIR_DATA=/var/lib/kci` | `PANDUAN-DEPLOY.md` |
| P2 #15 (dead code) | Hapus `LoadingSkeleton`, `data/problems.json` (duplikat teka-teki.json), 12 PNG bidak mati, `public/404.html`, dan komponen `PulihkanRute` (mekanismenya ditimpa build oleh `plugins/performa.js` — rute dalam sudah ditangani fallback SPA 200) | `src/components/Loading.jsx`, `src/App.jsx`, dll. |
| P2 #16 (duplikasi) | Satu komponen/konstanta `LencanaStatus` + `WARNA_STATUS`/`TEKS_STATUS` dipakai Beranda & DaftarTurnamen | `src/components/LencanaStatus.jsx` (baru) |
| P3 #21 (SEO dasar) | canonical, Open Graph, Twitter Card, JSON-LD Organization, `robots.txt`, `sitemap.xml` (34 URL, digenerate dari `RUTE_PUBLIK`) | `index.html`, `public/robots.txt`, `public/sitemap.xml` |
| P3 #22 | Carousel Tonggak menghormati `prefers-reduced-motion` | `src/components/Tonggak.jsx` |
| P3 #23 | Search: Enter membuka hasil pertama; Escape menutup overlay/drawer; scroll body dikunci saat overlay/drawer terbuka | `src/components/Header.jsx` |
| P3 #6 | Polling notifikasi dashboard dijeda saat tab tersembunyi | `src/halaman/Pengurus/Dashboard.jsx` |
| Docs | README (struktur usang), server/README (deskripsi callback OAuth), PANDUAN-DEPLOY (VITE_API_DASAR otomatis, KCI_DIR_DATA, backup), `.env.contoh` (mode produksi + VITE_API_DASAR) | `README.md`, `server/README.md`, `PANDUAN-DEPLOY.md`, `.env.contoh` |

**Tidak dikerjakan (sengaja, menunggu instruksi/risiko):** upgrade React 19 (perbaiki `fetchPriority` secara resmi — saat ini sudah disiasati), split kamus i18n per bahasa, lazy-load 13 set bidak, pecah `panduanCatur.js` 719 kB, refactor mesin Teka-Teki keluar dari komponen, batasi fan-out profil Chess.com, CSP frontend, dan perbaikan kontras/ukuran sentuh menyeluruh.
