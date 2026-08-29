# Backend Komunitas Catur Indonesia

Server HTTP mandiri untuk keanggotaan, verifikasi Chess.com, dan daftar
larangan pemain. Daftar publik anggota disinkronkan dari roster klub
[BLUNDER SKUAD](https://www.chess.com/club/blunder-skuad) melalui Published
Data API Chess.com. **Tanpa dependensi eksternal** — cukup Node.js 20+.

```bash
node server/src/index.js
```

### Jalankan di Vercel (Serverless Function) — FULL VERCEL

Backend juga bisa berjalan **tanpa server** sebagai Vercel Serverless
Function lewat `api/[...jalur].js`. Kode rute tidak berubah: bila variabel
lingkungan `VERCEL` terdeteksi (disuntikkan Vercel otomatis), modul ini
tidak membuka port dan hanya mengekspor `tangani(req, res)`.

Bawaan yang otomatis berlaku di Vercel:

| Nilai                  | Bawaan lokal            | Bawaan di Vercel    |
| ---------------------- | ----------------------- | ------------------- |
| `KCI_DIR_DATA`         | `<repo>/data`           | `/tmp/kci-data` (**ephemeral**) |
| `KCI_JUMLAH_PROXY`     | `0`                     | `1` (di belakang proxy Vercel) |

Langkah deploy lengkap (env vars wajib, verifikasi, batasan serverless):
lihat `PANDUAN-DEPLOY-FULL-VERCEL.md` dan `VERCEL-LIMITATIONS.md` di akar repo.

**Data persistent:** `/tmp/kci-data` di Vercel **tidak** bertahan antar
invocation. Untuk anggota, turnamen, pesan, dan admin yang harus awet,
pasang Postgres (`DATABASE-MIGRATION.md`) atau disk Render.

## Endpoint

### Publik

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/kesehatan` | Status server (untuk monitoring/uptime check) |
| GET | `/api/anggota` | Roster anggota klub Chess.com + Elo & rekor terkini |
| GET | `/api/csrf-token` | Terbitkan token CSRF — **wajib** untuk semua POST |
| GET | `/api/daftar-hitam` | Daftar larangan (username & alasan saja) |
| POST | `/api/anggota` | Pendaftaran anggota baru |
| GET | `/api/turnamen/jenis` | Empat jenis turnamen + aturannya |
| GET | `/api/turnamen?jenis=&status=` | Turnamen terpublikasi (status `draf` disaring) |
| GET | `/api/turnamen/:id` | Satu turnamen + klasemen (draf → 404) |

> **CSRF:** semua request `POST` harus menyertakan header
> `X-CSRF-Token: <token>` dengan token dari `GET /api/csrf-token`.
> Tanpa itu server menjawab `403`. Token berlaku 24 jam dan tidak terikat
> sesi, jadi satu token boleh dipakai ulang sampai kedaluwarsa.

> **Sumber anggota:** `GET /api/anggota` mengambil
> `https://api.chess.com/pub/club/blunder-skuad/members`, lalu menambah profil,
> rating, dan rekor publik tiap pemain. Chess.com memperbarui roster tersebut
> maksimal sekali per 12 jam; server mencache roster pada interval yang sama.
> Akun yang mengisi formulir juga wajib sudah ada di roster klub.

### Verifikasi akun Chess.com

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/auth/cara` | Mode verifikasi yang aktif di server ini |
| GET | `/api/auth/chess/mulai?kembali=` | Mulai login OAuth, redirect ke chess.com (`kembali` hanya menerima jalur internal) |
| GET | `/api/auth/chess/kembali` | Callback OAuth — hasil login disimpan ke `sessionStorage` (`kci-hasil-verifikasi`) lalu redirect ke halaman tujuan |
| POST | `/api/auth/kode/minta` | Jalur cadangan: minta kode `KCI-XXXXXX` |
| POST | `/api/auth/kode/periksa` | Cek kode di kolom Location profil |
| GET | `/api/auth/tiket/:nilai` | Status tiket verifikasi |

### Pengurus — butuh login/token

Dashboard `/pengurus` login lewat `POST /api/auth/login` dengan
`KCI_ADMIN_USER` + `KCI_ADMIN_PASSWORD`. Setelah login, klien menyertakan
header `X-Token-Admin: <token>` dan `X-Admin-User: <username>` untuk endpoint
pengurus. `KCI_TOKEN_ADMIN` lama masih didukung sebagai token/password
alternatif.

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| POST | `/api/auth/login` | Login dashboard `{username, password}` → `{token, username, role}` |
| GET | `/api/pengurus` | Ringkasan dashboard + identitas login (alias `/ringkasan`) |
| GET | `/api/pengurus/verifikasi` | Verifikasi token ringan untuk membuka dashboard |
| GET | `/api/pengurus/ringkasan` | Jumlah anggota & daftar hitam |
| POST | `/api/pengurus/pindai` | Pindai ban fair play ke Chess.com |
| POST | `/api/pengurus/blokir` | `{username, keterangan}` |
| POST | `/api/pengurus/buka` | `{username}` — cabut larangan |
| POST | `/api/pengurus/cek-nomor` | `{hp}` — cek nomor di daftar hitam |
| GET | `/api/pengurus/kontak/:username` | Data pribadi anggota |

### Turnamen — butuh token

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/pengurus/turnamen` | Semua turnamen termasuk draf |
| GET | `/api/pengurus/turnamen/:id` | Rincian + peserta + hasil + klasemen |
| POST | `/api/pengurus/turnamen` | Buat turnamen `{jenis, nama, …}` |
| POST | `/api/pengurus/turnamen/:id/ubah` | Ubah field mana pun, termasuk `status` |
| POST | `/api/pengurus/turnamen/:id/hapus` | Hapus permanen |
| POST | `/api/pengurus/turnamen/:id/peserta` | Daftarkan `{username, tim?}` |
| POST | `/api/pengurus/turnamen/:id/peserta-keluar` | Keluarkan `{username}` |
| POST | `/api/pengurus/turnamen/:id/hasil` | Catat `{ronde, putih, hitam, skor}` |
| POST | `/api/pengurus/turnamen/:id/hasil-hapus` | Hapus hasil `{indeks}` |
| POST | `/api/pengurus/turnamen/:id/pindai` | Pindai peserta ke Chess.com, anulir pecurang |

Skor yang sah hanya `1-0`, `0-1`, `0.5-0.5`. Peserta ganda pada ronde yang
sama ditolak `409`, termasuk bila warnanya dibalik.

## Variabel lingkungan

| Nama | Wajib | Keterangan |
| ---- | ----- | ---------- |
| `KCI_PEPPER` | produksi | Kata rahasia hashing identitas, min. 16 karakter |
| `KCI_ADMIN_USER` | disarankan | Username login dashboard pengurus; bawaan `admin` |
| `KCI_ADMIN_PASSWORD` | produksi | Password login dashboard pengurus; ganti dari bawaan `admin123` |
| `KCI_TOKEN_ADMIN` | opsional | Token legacy endpoint pengurus, min. 24 karakter bila dipakai |
| `KCI_ASAL_DIIZINKAN` | produksi | Origin yang boleh memanggil API, dipisah koma tanpa trailing slash |
| `PORT` | tidak | Bawaan `8787` |
| `KCI_LOG_PERMINTAAN` | disarankan | `1` = log JSON ringkas per request (ID, method, path, status, durasi; tanpa body/token/IP) |
| `KCI_DIR_DATA` | tidak | Lokasi berkas data, bawaan `./data` |
| `KCI_BATAS_DAFTAR` | tidak | Maks. pendaftaran per IP per 15 menit (bawaan 5) |
| `KCI_BATAS_UMUM` | tidak | Maks. permintaan umum per IP per 15 menit |
| `KCI_CHESS_DASAR` | **jangan di produksi** | Ganti alamat API Chess.com — hanya untuk uji tiruan lokal |
| `KCI_CHESS_KLUB` | tidak | URL-ID klub sumber anggota; bawaan `blunder-skuad` |
| `KCI_CHESS_KLUB_CACHE` | tidak | Cache roster klub dalam detik; bawaan `43200` (12 jam) |
| `KCI_CHESS_KLUB_PROFILE_CACHE` | tidak | Cache profil/rating roster dalam detik; bawaan `3600` |
| `KCI_WAJIB_VERIFIKASI` | tidak | `off` / `opsional` (bawaan) / `wajib` — mewajibkan tiket verifikasi saat mendaftar |
| `KCI_CHESS_CLIENT_ID` | untuk OAuth | Dari Chess.com; kosong ⇒ hanya jalur kode profil |
| `KCI_CHESS_CLIENT_SECRET` | untuk OAuth | Dari Chess.com (opsional, PKCE tetap jalan tanpanya) |
| `KCI_CHESS_REDIRECT_URI` | untuk OAuth | Harus **persis** sama dengan yang didaftarkan |
| `KCI_TUJUAN_SETELAH_LOGIN` | tidak | Halaman tujuan setelah login selesai (bawaan `/pendaftaran-anggota`) |

Server dianggap mode produksi bila `NODE_ENV=production` ATAU
`KCI_ASAL_DIIZINKAN` diisi. Dalam mode itu server menolak start bila
`KCI_PEPPER`, `KCI_ADMIN_PASSWORD` kuat, atau origin produksi belum lengkap.
`KCI_TOKEN_ADMIN` hanya diperlukan bila masih memakai token legacy sebagai
password alternatif.

## Struktur

```
server/src/
  index.js             startup, ekspor tangani (Vercel) / listen
  server.js            createServer, graceful shutdown
  rute.js              definisi seluruh rute /api dan /api/v1
  permintaan.js        CORS, CSRF, rate-limit, penanganan galat
  jalur-api.js         alias /api/v1 → /api
  skema.js             kontrak Zod
  audit.js             jejak audit JSONL
  konfigurasi.js       env var + validasi produksi
  http.js              CORS, gzip, rate limit, auth, router
  simpanan.js          tulis atomik + antrean anti-balapan
  chess.js             klien Chess.com (cache, retry, timeout)
  keanggotaan.js       logika bisnis
  identitas-server.js  hashing identitas ber-pepper
  oauth.js             OAuth 2.0 + OIDC Chess.com (PKCE S256, JWKS)
  verifikasi-profil.js jalur cadangan kode KCI-XXXXXX di kolom Location
  turnamen.js          API mesin turnamen
  turnamen/            jenis, klasemen (cache turnamen selesai)
```

Prefiks `/api/v1/*` dipetakan ke rute `/api/*` yang sama (`API_VERSIONING.md`).

Berkas data (`KCI_DIR_DATA`, bawaan `./data`):

```
data/
  anggota.json         metadata formulir anggota (roster aktif dari Chess.com)
  daftar-hitam.json    larangan; sumber "otomatis" atau "pengurus"
  turnamen.json        semua turnamen, peserta, dan hasil partai
  rahasia/kontak.json  data pribadi — TIDAK ikut git
  rahasia/jejak-audit.jsonl  jejak tindakan pengurus
```

## Uji

Semua uji berjalan **mandiri tanpa internet** — skrip integrasi meluncurkan
server terisolasi sendiri (port acak, data sementara di /tmp) dan meniru
API Chess.com secara lokal.

```bash
node scripts/uji-identitas.mjs          # unit: normalisasi & daftar hitam
node scripts/uji-i18n.mjs               # paritas kamus terjemahan ID/EN
node scripts/uji-rute.mjs               # rute publik App.jsx ⇄ plugins/performa.js
node server/uji/uji-backend.mjs         # integrasi HTTP menyeluruh (100+ cek)
node server/uji/uji-verifikasi.mjs      # OAuth/PKCE/JWT + jalur kode profil (30 cek)
```

Untuk menguji terhadap server yang sudah berjalan (mis. staging), tempelkan
lewat `KCI_DASAR`, mis. `KCI_DASAR=https://kci-api.onrender.com node server/uji/uji-backend.mjs`.
