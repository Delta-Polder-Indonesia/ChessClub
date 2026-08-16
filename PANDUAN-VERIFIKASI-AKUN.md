# Verifikasi Kepemilikan Akun Chess.com

Dokumen ini menjelaskan cara sistem membuktikan bahwa akun Chess.com yang
didaftarkan **benar-benar milik pendaftar**.

---

## 1. Masalah yang diselesaikan

Sebelumnya, pendaftar cukup mengetik username. Artinya siapa pun bisa:

- Mendaftarkan akun **pemain lain** (mengambil Elo tinggi milik orang).
- Mendaftarkan akun **GM terkenal** untuk pamer di daftar anggota.
- Mendaftarkan akun **orang yang tidak tahu-menahu**.

Sekarang pendaftar harus membuktikan ia menguasai akun tersebut.

---

## 2. Dua jalur verifikasi

### Jalur A — Login dengan akun Chess.com (paling meyakinkan)

Pendaftar diarahkan ke **chess.com**, masuk dengan kata sandinya sendiri,
lalu Chess.com memberi tahu kita siapa dia. Ini standar industri
(OAuth 2.0 + OpenID Connect), sama seperti "Login with Google".

- Kata sandi pendaftar **tidak pernah** melewati server kita.
- Menggunakan **PKCE**, sehingga aman meski dijalankan dari browser.
- Identitas dibuktikan lewat **JWT bertanda tangan** yang diverifikasi
  dengan kunci publik Chess.com (`oauth.chess.com/certs`).

**Syarat:** `client_id` harus dimohon lebih dulu ke Chess.com melalui
[formulir resmi](https://forms.gle/7Ai8UZCJMZkCVvxn9). Persetujuannya
manual dan bisa memakan waktu beberapa hari sampai minggu.

Setelah disetujui, isi di server:

```bash
KCI_CHESS_CLIENT_ID=...
KCI_CHESS_CLIENT_SECRET=...
KCI_CHESS_REDIRECT_URI=https://kci-api.onrender.com/api/auth/chess/kembali
```

> `redirect_uri` **tidak boleh** memakai wildcard dan harus **persis sama**
> dengan yang didaftarkan — beda satu garis miring pun akan ditolak.

### Jalur B — Kode di profil (cadangan, aktif sekarang)

Karena OAuth butuh persetujuan manual, sistem menyediakan jalur yang
langsung bisa dipakai **tanpa menunggu siapa pun**:

1. Pendaftar menekan "Verifikasi lewat kode profil"
2. Sistem memberi kode unik, misalnya `KCI-H2QUTK`
3. Pendaftar menempelkannya ke kolom **Location** di profil Chess.com
4. Sistem membaca profil lewat API publik dan mencocokkan
5. Setelah cocok, kode boleh dihapus lagi

**Kenapa kolom Location?** API publik Chess.com hanya mengekspos `name`,
`location`, dan `url` sebagai teks bebas yang bisa diedit pengguna.
**Tidak ada field `bio`** — ini sudah diperiksa langsung ke API. Location
paling aman diubah sementara karena tidak mengubah nama pemain di papan.

Pengamanan jalur ini:
- Kode berlaku **30 menit**
- Jeda minimal **5 detik** antar pemeriksaan (anti pemborosan API)
- Maksimum **40 percobaan** per kode
- Profil dibaca **tanpa cache**, agar perubahan langsung terbaca

---

## 3. Tiket verifikasi

Setelah salah satu jalur berhasil, server menerbitkan **tiket** berumur
30 menit. Formulir melampirkannya saat mengirim pendaftaran.

Sifat tiket:
- **Sekali pakai** — hangus setelah dipakai mendaftar
- **Terikat username** — tiket milik `budi` tidak bisa dipakai `andi`
- **Tidak bisa ditebak** — 24 bita acak

---

## 4. Tiga mode operasi

Diatur lewat `KCI_WAJIB_VERIFIKASI`:

| Mode | Perilaku | Kapan dipakai |
| ---- | -------- | ------------- |
| `off` | Verifikasi dinonaktifkan | Bila ingin kembali ke perilaku lama |
| `opsional` *(bawaan)* | Boleh mendaftar tanpa verifikasi; yang terverifikasi ditandai | Masa transisi |
| `wajib` | Pendaftaran **ditolak** tanpa tiket sah | Turnamen berhadiah |

Anggota yang terverifikasi punya penanda pada datanya:

```json
{
  "username": "budicatur",
  "terverifikasi": true,
  "caraVerifikasi": "oauth"
}
```

Nilai `caraVerifikasi`: `oauth` (login) atau `kode-profil` (cadangan).

**Saran:** mulai dengan `opsional`. Setelah anggota lama terverifikasi
semua, pindah ke `wajib`.

---

## 5. Endpoint

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/auth/cara` | Cara verifikasi yang tersedia |
| GET | `/api/auth/chess/mulai` | Mulai login Chess.com |
| GET | `/api/auth/chess/kembali` | Tujuan pengalihan dari Chess.com |
| POST | `/api/auth/kode/minta` | `{username}` → kode |
| POST | `/api/auth/kode/periksa` | `{username}` → tiket bila cocok |
| GET | `/api/auth/tiket/:nilai` | Periksa tiket masih berlaku |

---

## 6. Yang sudah diuji

30 uji otomatis (`node server/uji/uji-verifikasi.mjs`), termasuk serangan:

| Serangan | Hasil |
| -------- | ----- |
| Tanda tangan JWT dipalsukan | ditolak |
| Serangan `alg:none` | ditolak |
| Token kedaluwarsa | ditolak |
| Token milik aplikasi lain (`aud` salah) | ditolak |
| Token ditandatangani kunci penyerang | ditolak |
| Tiket dipakai dua kali | ditolak |
| Tiket dipakai username lain | ditolak |
| Periksa kode tanpa meminta lebih dulu | ditolak |
| Pemeriksaan kode terlalu cepat | dibatasi |

---

## 7. Keterbatasan

- Jalur kode profil membuktikan penguasaan **profil**, bukan sesi login.
  Pemilik akun yang kata sandinya dicuri tetap bisa disalahgunakan —
  tetapi ini jauh lebih kuat daripada sekadar mengetik username.
- OAuth adalah jalur terkuat; disarankan segera mengajukan `client_id`.
