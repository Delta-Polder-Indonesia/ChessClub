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
KCI_CHESS_REDIRECT_URI=https://chess-club-weld.vercel.app/api/auth/chess/kembali
```

> `redirect_uri` **tidak boleh** memakai wildcard dan harus **persis sama**
> dengan yang didaftarkan — beda satu garis miring pun akan ditolak.

### Jalur B — Kode di profil (cadangan, aktif sekarang)

Karena OAuth butuh persetujuan manual, sistem menyediakan jalur yang
langsung bisa dipakai **tanpa menunggu siapa pun**:

1. Pendaftar menekan "Verifikasi lewat kode profil"
2. **Server** menerbitkan kode tantangan (mis. `KCI-H2QUTK`) dan menyimpannya
   terikat pada username — browser tidak pernah membuat kode ini
3. Pendaftar menempelkannya ke kolom **Location** di profil Chess.com
4. Browser memanggil `POST /api/auth/kode/periksa`; **server** yang membaca
   profil (tanpa cache) dan mencocokkan kodenya
5. Bila cocok, server menerbitkan tiket; kode boleh dihapus lagi

> Yang TIDAK ada lagi: mode "verifikasi cepat" tempat pendaftar mengetik ulang
> kode yang sedang tampil di layar. Ketik ulang kode hanya membuktikan bahwa
> orang yang duduk di depan browser bisa membaca layarnya sendiri, jadi jalur
> itu tidak pernah bisa menjadi bukti penguasaan akun Chess.com.

**Kenapa kolom Location?** API publik Chess.com hanya mengekspos `name`,
`location`, dan `url` sebagai teks bebas yang bisa diedit pengguna.
**Tidak ada field `bio`** — ini sudah diperiksa langsung ke API. Location
paling aman diubah sementara karena tidak mengubah nama pemain di papan.

Pengamanan jalur ini:
- Kode berlaku **30 menit**, dibuat dari 6 byte acak kripto (bukan `Math.random`)
- Jeda minimal **5 detik** antar pemeriksaan (anti pemborosan API)
- Maksimum **40 percobaan** per kode
- Profil dibaca **tanpa cache**, agar perubahan langsung terbaca
- Pemeriksaan terjadi di server dengan pembatasan laju per IP
  (`/api/auth/kode/minta` 20×, `/api/auth/kode/periksa` 60× per 15 menit)

### Jalur C — Pengajuan manual (status "menunggu", bukan terverifikasi)

Untuk pendaftar yang profilnya benar-benar tidak bisa disunting:

```text
pengajuan dikirim (POST /api/auth/pengajuan-manual)
    -> status "menunggu", tercatat di data/pengajuan-verifikasi.json
    -> pengurus memeriksa:  GET  /api/pengurus/pengajuan-verifikasi
    -> setujui / tolak:     POST /api/pengurus/pengajuan-verifikasi/:id/setujui|tolak
    -> persetujuan MENGIKUTKAN nama pengurus di jejak audit, menerbitkan tiket
       (cara: "pengurus"), dan menulis status terverifikasi ke catatan anggota
```

Jalur ini **tidak pernah** menerbitkan tiket maupun menandai anggota
terverifikasi dengan sendirinya. Bukti keamanan baru lahir setelah pemeriksaan
pengurus tercatat di server.

---

## 3. Tiket verifikasi

Setelah jalur A, B, atau persetujuan pengurus berhasil, server menerbitkan
**tiket** berumur 30 menit (bisa diubah lewat `KCI_TIKET_UMUR_DETIK`).
Formulir melampirkannya saat mengirim pendaftaran, dan backend memanggil
`periksaTiket()` sebelum menyimpan.

Sifat tiket:
- **Terikat username** — tiket milik `budi` tidak bisa dipakai `andi`
- **Sekali pakai** — dipakai pada saat baris anggota ditulis (lihat urutan
  pemeriksaan di bawah), percobaan kedua ditolak dengan sebab `sudah-dipakai`
- **Tidak dapat dipalsukan** — `muatan + HMAC-SHA256`; kunci turunan
  (HKDF) dari `KCI_JWT_SECRET` dan berbeda antara state OAuth dan tiket,
  sehingga satu token tidak bisa dipakai untuk kegunaan yang lain
- **Ditolak dengan sebab yang jelas** — `kosong`, `tidak-sah`,
  `kedaluwarsa`, `sudah-dipakai`, `username-beda`; UI menampilkan pesan
  "Sesi verifikasi telah kedaluwarsa. Silakan ulangi verifikasi…"
- **Token CSRF bukan tiket** — format dan kunci turunannya berbeda, jadi
  token CSRF tidak akan pernah lolos sebagai bukti verifikasi

### Tanpa keadaan (stateless) — mengapa dan apa batasnya

`api/[...jalur].js` menjalankan backend sebagai Vercel Serverless Function.
Map di memori proses tidak cocok untuk itu: callback OAuth dan pengiriman
formulir bisa mendarat di instance berbeda, dan cold start menghapus
isinya. Karena itu state OAuth (PKCE verifier + tujuan kembali) dan tiket
kini berupa token kecil bertanda tangan, bukan entri `Map`.

Yang tetap hidup di memori proses hanyalah ledger "tiket sudah dipakai".
Akibatnya, di deployment multi-instance, tiket yang sama secara teori dapat
dipakai dua kali di dua instance selama masa berlakunya. Dampaknya dibatasi:
tiket terikat satu username, dan pengecekan duplikasi username dilakukan di
dalam antrean tulis yang sama, sehingga satu tiket tidak pernah menghasilkan
dua anggota (yang kedua menerima `409`). Untuk pencegahan pemutaran ulang
penuh lintas instance, pindahkan ledger ke penyimpanan bersama (Vercel KV /
Supabase) — belum dibuat karena belum ada bukti kebutuhan di volume situs ini.

---

## 4. Tiga mode operasi

Diatur lewat `KCI_WAJIB_VERIFIKASI`:

| Mode | Perilaku | Kapan dipakai |
| ---- | -------- | ------------- |
| `off` | Verifikasi dinonaktifkan | Bila ingin kembali ke perilaku lama |
| `opsional` *(bawaan)* | Boleh mendaftar tanpa verifikasi; yang terverifikasi ditandai | Masa transisi |
| `wajib` | Pendaftaran **ditolak** tanpa tiket sah | Turnamen berhadiah |

Yang berlaku sejak perbaikan ini:

- Nilai dinormalisasi (trim + huruf kecil) dan alias umum (`on`, `1`,
  `required`, …) dipetakan ke tiga nilai di atas. Nilai tak dikenal **tidak**
  dipakai apa adanya: server kembali ke `opsional` dan memberi peringatan di
  log, sehingga salah ketik (`Wajib`, `wajibd`) tidak diam-diam melumpuhkan
  kewajiban verifikasi.
- Bawaan **tidak diubah** (`opsional`). Memindahkan ke `wajib` adalah
  keputusan pengelola; lakukan setelah anggota lama terverifikasi semua.
- `GET /api/auth/cara` melaporkan `mode`, `wajib`, `oauth`, `kodeProfil`,
  dan `tiketBerlakuDetik`. UI membaca endpoint ini — tidak menyimpulkan
  sendiri — jadi label "wajib" di layar dan aturan di backend tidak bisa
  berbeda.
- Di mode `opsional`, UI menampilkan catatan bahwa verifikasi belum diwajibkan
  dan menawarkan "Lewati verifikasi untuk sekarang"; pendaftar tanpa tiket
  dicatat `terverifikasi: false` dan tidak pernah diberi label terverifikasi.
- Tiket yang **dikirim tapi tidak sah** selalu ditolak, juga di mode
  `opsional`. Alasannya: pendaftar yang mengirim tiket yakin sudah terverifikasi;
  mendiamkannya berarti mendaftar dengan status yang menyesatkan.

Aturan username (satu sumber: `src/lib/identitas.js`, dipakai browser dan
server): trim, buang awalan `@` dan tautan `chess.com/member/`, kapital ke
huruf kecil, lalu wajib cocok dengan `^[a-z0-9_-]{3,25}$`. Spasi di tengah
**ditolak**, tidak ditempel atau dipotong diam-diam. Nilai hasil normalisasi
inilah yang dipakai untuk pencarian, tiket, duplikasi, dan penyimpanan.

Anggota yang terverifikasi punya penanda pada datanya:

```json
{
  "username": "budicatur",
  "terverifikasi": true,
  "caraVerifikasi": "oauth"
}
```

Nilai `caraVerifikasi`: `oauth` (login), `kode-profil` (jalur B), atau
`pengurus` (persetujuan pengajuan manual). `terverifikasi` **hanya** boleh
berasal dari tiket yang divalidasi server — field `mode`, `sumber`, `kode`,
`profil`, `terverifikasi`, atau `usernameVerifikasi` dari browser tidak pernah
dibaca sebagai keputusan keamanan (validasi membaca allow-list field saja).

---

## 5. Endpoint

| Metode | Jalur | Keterangan |
| ------ | ----- | ---------- |
| GET | `/api/auth/cara` | Cara verifikasi tersedia + `wajib` + umur tiket |
| GET | `/api/auth/chess/mulai` | Mulai login Chess.com (state tanpa keadaan) |
| GET | `/api/auth/chess/kembali` | Tujuan pengalihan dari Chess.com; menerbitkan tiket |
| POST | `/api/auth/kode/minta` | `{username, paksa?}` → kode tantangan dari server |
| POST | `/api/auth/kode/periksa` | `{username}` → `{cocok, tiket?}`; server yang memeriksa profil |
| POST | `/api/auth/pengajuan-manual` | `{username, catatan}` → `202 {status:"menunggu"}`; TIDAK ada tiket |
| GET | `/api/auth/tiket/:nilai` | Pratinjau tiket (pakai/umur) tanpa memakainya |
| POST | `/api/anggota` | Pendaftaran; wajib CSRF; tiket diverifikasi di dalam antrean tulis |
| GET | `/api/pengurus/pengajuan-verifikasi` | Antrean pengajuan (kredensial pengurus) |
| POST | `/api/pengurus/pengajuan-verifikasi/:id/setujui` | Setujui → tiket "pengurus" + status anggota ditulis |
| POST | `/api/pengurus/pengajuan-verifikasi/:id/tolak` | Tolak dengan alasan |

Semua POST memerlukan `X-CSRF-Token`; halaman perantara OAuth menulis hasil
ke `sessionStorage` (`kci-hasil-verifikasi`) sebagai JSON yang **diescape**
agar `</script>` dari pihak ketiga tidak dapat menyuntik skrip, dan hanya
kode sebab yang dikenal yang dikirim ke browser (pesan exception teknis tidak
pernah sampai ke pengguna).

---

## 6. Yang sudah diuji

`npm run uji:verifikasi` (86 pemeriksaan) dan `npm run uji:pendaftaran`
(49 pemeriksaan, server sungguhan + Chess.com tiruan), plus
`npm run uji:pendaftaran-ui` (jsdom) dan tes Playwright alur pendaftaran.

| Serangan / skenario | Hasil |
| ------------------- | ----- |
| Tanda tangan JWT dipalsukan | ditolak |
| Serangan `alg:none` dan algoritma lain (HS256) | ditolak |
| `kid` tidak dikenal / `kid` hilang | ditolak |
| Issuer salah atau kosong | ditolak |
| `aud` salah atau kosong; tanpa `client_id` | ditolak |
| `exp` hilang, bukan angka, atau terlalu jauh | ditolak |
| Token kedaluwarsa / `nbf` di masa depan | ditolak |
| `sub` atau username tidak ada / tidak sah | ditolak |
| Token ditandatangani kunci penyerang | ditolak |
| Tiket dipakai dua kali (replay) | ditolak |
| Tiket dipakai username lain | ditolak |
| Tiket kedaluwarsa | ditolak dengan sebab `kedaluwarsa` |
| Token CSRF dipakai sebagai tiket (dan sebaliknya) | ditolak |
| Tiket tetap sah setelah restart / di proses lain | diterima (stateless) |
| State OAuth dipalsukan | ditolak |
| `kembali=https://…` / `//evil.com` | ditolak (hanya jalur internal) |
| Ketik ulang kode manual | status `menunggu`, tanpa tiket |
| Field `terverifikasi`/`mode`/`sumber` dari browser | diabaikan |
| Username beda kapitalisasi / spasi / tautan | normalisasi + `409` duplikasi |
| Dua klik kirim bersamaan | satu `201`, satu `409`, satu baris anggota |
| Tanggal 30 Feb, masa depan, umur di luar 5–100 | `400` dengan pesan per field |
| Pendaftar daftar hitam lewat varian tulisan | `403` |
| POST tanpa CSRF | `403` |

---

## 7. Keterbatasan yang tersisa

- Jalur kode profil membuktikan penguasaan **kolom profil publik**, bukan
  sesi login. Akun yang kata sandinya dicuri tetap bisa disalahgunakan —
  jauh lebih kuat daripada mengetik username, tetapi OAuth tetap jalur utama.
- Ledger "tiket sudah dipakai" per proses: lihat bagian 3.
- Cache Chess.com di server membuat perubahan profil baru terbaca setelah
  beberapa menit; karena itu `periksaKode` selalu membaca profil TANPA cache.
- `KCI_JWT_SECRET` adalah kunci penandatangan tiket/state. Menggantinya
  membuat seluruh tiket dan state yang sedang berjalan hangus (pengguna
  mengulang verifikasi). Nilai bawaan pengembangan acak per proses — itu
  sengaja, dan karena itu produksi WAJIB mengisi `KCI_JWT_SECRET`.
- UI panel pengurus belum punya layar khusus antrean pengajuan; pemeriksaan
  dilakukan lewat endpoint `/api/pengurus/pengajuan-verifikasi` (lihat
  `PANDUAN-PENGURUS.md`).
- Semua yang di atas "aman" berarti **lolos test yang tersedia**, bukan
  dijamin aman secara mutlak; beberapa perilaku (mode wajib, multi-instance)
  tetap bergantung pada konfigurasi deployment.

---

## 8. Urutan pemeriksaan `POST /api/anggota`

Validasi keamanan selalu selesai **sebelum** apa pun ditulis:

```text
1. validasi field (aturan kanonik dari src/lib/identitas.js)
2. periksa tiket TANPA memakainya  -> sebab spesifik bila gagal
3. daftar hitam username (hasil normalisasi) + sidik identitas (pepper)
4. profil Chess.com: ada, status (fair play / ditutup), username sama dengan
   yang diverifikasi
5. keanggotaan klub Chess.com
6. DI DALAM ANTREAN TULIS: cek duplikasi username + duplikasi identitas,
   baru tiket ditandai terpakai, lalu entri ditulis
7. data pribadi (kontak) ditulis terpisah; bila langkah ini gagal, entri
   anggota dibatalkan dan pengguna diminta mengirim ulang
```

Konsekuensi yang diterima sadar: tiket dipakai di langkah 6 dan **tidak**
dikembalikan bila langkah 7 gagal — pendaftar diminta mengulang verifikasi,
sementara isian formulirnya tetap ada di layar.