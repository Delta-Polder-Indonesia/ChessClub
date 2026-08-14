# Backend Komunitas Catur Indonesia

Server HTTP mandiri untuk keanggotaan, verifikasi Chess.com, dan daftar
larangan pemain. **Tanpa dependensi eksternal** — cukup Node.js 20+.

```bash
node server/src/index.js
```

## Endpoint

### Publik

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/kesehatan` | Status server (untuk monitoring/uptime check) |
| GET | `/api/anggota` | Daftar anggota + Elo & rekor dari Chess.com |
| GET | `/api/daftar-hitam` | Daftar larangan (username & alasan saja) |
| POST | `/api/anggota` | Pendaftaran anggota baru |
| GET | `/api/turnamen/jenis` | Empat jenis turnamen + aturannya |
| GET | `/api/turnamen?jenis=&status=` | Turnamen terpublikasi (status `draf` disaring) |
| GET | `/api/turnamen/:id` | Satu turnamen + klasemen (draf → 404) |

### Verifikasi akun Chess.com

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/auth/cara` | Mode verifikasi yang aktif di server ini |
| GET | `/api/auth/chess/mulai?kembali=` | Mulai login OAuth, redirect ke chess.com |
| GET | `/api/auth/chess/kembali` | Callback OAuth → `?verifikasi=sukses&akun=&tiket=` |
| POST | `/api/auth/kode/minta` | Jalur cadangan: minta kode `KCI-XXXXXX` |
| POST | `/api/auth/kode/periksa` | Cek kode di kolom Location profil |
| GET | `/api/auth/tiket/:nilai` | Status tiket verifikasi |

### Pengurus — butuh token

Sertakan header `X-Token-Admin: <token>` atau `Authorization: Bearer <token>`.

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
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
| `KCI_TOKEN_ADMIN` | produksi | Token endpoint pengurus, min. 24 karakter |
| `KCI_ASAL_DIIZINKAN` | disarankan | Origin yang boleh memanggil API, dipisah koma |
| `PORT` | tidak | Bawaan `8787` |
| `KCI_DIR_DATA` | tidak | Lokasi berkas data, bawaan `./data` |
| `KCI_BATAS_DAFTAR` | tidak | Maks. pendaftaran per IP per 15 menit (bawaan 5) |
| `KCI_BATAS_UMUM` | tidak | Maks. permintaan umum per IP per 15 menit |
| `KCI_WAJIB_VERIFIKASI` | tidak | `1` = pendaftaran wajib bertiket verifikasi |
| `KCI_OAUTH_CLIENT_ID` | untuk OAuth | Dari Chess.com; kosong ⇒ hanya jalur kode profil |
| `KCI_OAUTH_CLIENT_SECRET` | untuk OAuth | Dari Chess.com |
| `KCI_OAUTH_REDIRECT` | untuk OAuth | Harus **persis** sama dengan yang didaftarkan |

Server **menolak untuk start** di `NODE_ENV=production` bila `KCI_PEPPER`
atau `KCI_TOKEN_ADMIN` belum diatur.

## Struktur

```
server/src/
  index.js             HTTP server, rute, penanganan galat
  konfigurasi.js       env var + validasi produksi
  http.js              CORS, rate limit, auth, router
  simpanan.js          tulis atomik + antrean anti-balapan
  chess.js             klien Chess.com (cache, retry, timeout)
  keanggotaan.js       logika bisnis
  identitas-server.js  hashing identitas ber-pepper
  oauth.js             OAuth 2.0 + OIDC Chess.com (PKCE S256, JWKS)
  verifikasi-profil.js jalur cadangan kode KCI-XXXXXX di kolom Location
  turnamen.js          mesin turnamen untuk keempat jenis
```

Berkas data (`KCI_DIR_DATA`, bawaan `./data`):

```
data/
  anggota.json         anggota aktif — identitas hanya berupa hash
  daftar-hitam.json    larangan; sumber "otomatis" atau "pengurus"
  turnamen.json        semua turnamen, peserta, dan hasil partai
  rahasia/kontak.json  data pribadi — TIDAK ikut git
  rahasia/jejak-audit.jsonl  jejak tindakan pengurus
```

## Uji

```bash
node scripts/uji-identitas.mjs          # unit, tanpa jaringan
node server/uji/uji-backend.mjs         # integrasi via HTTP
```
