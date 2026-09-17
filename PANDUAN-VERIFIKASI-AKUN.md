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
5. Bila cocok, server menerbitkan tiket dan membuang tantangannya (sekaligus,
   di dalam antrean tulis yang sama) sehingga hasil "cocok" tidak dapat ditukar
   jadi tiket kedua; kode boleh dihapus lagi

**Di mana tantangan disimpan.** Tantangan tidak hidup di `Map` milik satu
proses, melainkan lewat lapisan penyimpanan data yang sudah ada di repo ini
(`server/src/simpanan.js` -> `buatRepo`, berkas `data/rahasia/verifikasi-tantangan.json`
atau baris `kci_storage` di Supabase bila dipasang). Alasannya: di Vercel
serverless, request "minta kode" dan "periksa kode" berikutnya tidak dijamin
mendarat di instance yang sama, dan cold start menghapus memori proses — kalau
tantangan hanya ada di `Map`, pendaftar kehilangan kodenya di tengah alur.
Konsekuensi yang diinginkan: pencatat jeda 5 detik dan batas 40 percobaan ikut
bertahan, jadi pemindaian ulang tidak dapat dimulai dari nol dengan berganti
instance. Berkasnya ada di `rahasia/` (di-gitignore dan di luar glob
`data/*.json` yang di-bundle Vercel) karena isinya kode yang sedang beredar.

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
- Umur, jeda, dan batas percobaan dapat diubah lewat `KCI_TANTANGAN_UMUR_DETIK`,
  `KCI_TANTANGAN_JEDA_DETIK`, `KCI_TANTANGAN_MAKS_PERCOBAAN` (default tidak
  berubah dari nilai sebelumnya; knob ini ada untuk pengujian)
- Keputusan akhir dibuat **di dalam antrean tulis**, jadi dua pemeriksaan yang
  datang bersamaan tidak bisa sama-sama menang dan hanya satu tiket yang terbit
- Bila tantangan tidak ditemukan (mis. instance baru tanpa penyimpanan bersama),
  server menjawab `400` dengan `kode: "tantangan-tidak-ada"`; UI langsung
  meminta kode baru alih-alih membiarkan pengguna menebak. Kegagalan seperti ini
  **selalu menolak**, tidak pernah meloloskan verifikasi
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
    -> bila catatan anggotanya sudah ada: status terverifikasi ditulis ke
       catatan anggota (anggotaDiperbarui: true) dan pengajuan ditandai
       diterapkan
    -> bila formulirnya belum dikirim: persetujuan TIDAK dibuang dan TIDAK
       menghasilkan apa pun di layar pengurus; server menerapkan persetujuan
       itu pada saat pendaftaran, lalu menandai diterapkanPada
```

Jalur ini **tidak pernah** menerbitkan tiket maupun menandai anggota
terverifikasi dengan sendirinya. Bukti keamanan baru lahir setelah pemeriksaan
pengurus tercatat di server.

**Hanya ada SATU mekanisme persetujuan.** Endpoint `setujui` sengaja TIDAK
lagi menyerahkan tiket kepada pengurus. Sebelumnya ia melakukan dua hal
sekaligus: menerbitkan tiket (yang lalu harus disalin-salinkan ke pendaftar)
dan menulis status ke catatan anggota — dua jalan yang menghasilkan state sama
lewat pihak berbeda, dan yang pertama justru lebih mudah salah pakai serta tidak
terikat pada instance/tempat pendaftar berada. Sekarang status berubah hanya
dari satu peristiwa: `"menunggu" -> "disetujui"` oleh endpoint yang sudah
melewati `pastikanAdmin`, dan penerapannya (ke catatan anggota yang sudah ada
ATAU ke pendaftaran yang baru masuk) selalu terjadi di server. Jejak audit
mencatat `pengajuan-verifikasi-disetujui` dan
`pengajuan-verifikasi-diterapkan` (siapa, kapan, lewat jalur apa).

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

Yang tetap hidup di memori proses hanyalah ledger "tiket sudah dipakai", dan
lingkupnya harus disebut apa adanya: sekali pakai berlaku **dalam satu instance
yang masih hidup** — tidak bertahan cold start/restart, dan tidak dibagikan
antar-instance. Jadi jangan ditulis (maupun dilaporkan) sebagai "sekali pakai
lintas instance". Akibatnya, di deployment multi-instance, tiket yang sama
secara teori dapat dipakai dua kali di dua instance selama masa berlakunya.
Ledger tidak dipindahkan ke `kci_storage` karena lapisan itu hanya upsert
kunci-nilai (menang-last-write, tanpa pembaruan bersyarat), jadi sekalipun
dipindah sifatnya tetap "best effort", bukan sekali pakai yang sesungguhnya;
yang benar butuh Redis `SETNX` atau baris DB dengan constraint unik.
Dampaknya dibatasi:
tiket terikat satu username, dan pengecekan duplikasi username dilakukan di
dalam antrean tulis yang sama, sehingga satu tiket tidak pernah menghasilkan
dua anggota (yang kedua menerima `409`). Untuk pencegahan pemutaran ulang
penuh lintas instance, pindahkan ledger ke penyimpanan bersama yang sanggup
menolak pembaruan ganda (Vercel KV `add` / Redis `SETNX` / tabel dengan
`UNIQUE(jti)` + INSERT) — belum dibuat karena belum ada bukti kebutuhan di
volume situs ini, dan statusnya dilaporkan dasbor lewat
`lingkupLedgerTiket`.

---

## 4. Tiga mode operasi

Diatur lewat `KCI_WAJIB_VERIFIKASI`:

| Mode | Perilaku | Kapan dipakai |
| ---- | -------- | ------------- |
| `off` | Verifikasi dinonaktifkan; tiket tidak dinilai sama sekali | Hanya bila ditulis eksplisit (uji/dev, atau kembali ke perilaku lama) |
| `opsional` | Boleh mendaftar tanpa verifikasi; yang terverifikasi ditandai | Masa transisi, hanya bila ditulis eksplisit |
| `wajib` *(bawaan)* | Pendaftaran **ditolak** tanpa tiket sah | Produksi |

Yang berlaku sejak perbaikan ini:

- **Bawaan `wajib` dan fail-closed.** Env yang kosong, tidak disetel, atau
  bernilai tak dikenal jatuh ke `wajib` + peringatan di log. Arah gagalnya ke
  sisi ketat: deployment yang lupa env tidak mungkin diam-diam membuka
  pendaftaran tanpa bukti kepemilikan akun.
- Nilai dinormalisasi (trim + huruf kecil) dan alias umum (`on`, `1`,
  `required`, …) dipetakan ke tiga nilai di atas. Nilai tak dikenal **tidak**
  dipakai apa adanya: server kembali ke `wajib` dan memberi peringatan di
  log, sehingga salah ketik (`Wajibb`, `optionall`) tidak melumpuhkan
  kewajiban verifikasi.
- Melonggarkan ke `opsional` atau `off` adalah keputusan pengelola yang harus
  ditulis **eksplisit** di env. Tidak ada jalan lain untuk mencapai keduanya.
- `GET /api/auth/cara` melaporkan `mode`, `wajib`, `oauth`, `kodeProfil`,
  dan `tiketBerlakuDetik`. UI membaca endpoint ini — tidak menyimpulkan
  sendiri — jadi label "wajib" di layar dan aturan di backend tidak bisa
  berbeda.
- Di mode `opsional`, pendaftar tanpa tiket dicatat `terverifikasi: false`
  dan tidak pernah diberi label terverifikasi. Jalur ini dipakai harness uji
  (`server/uji/alat-uji.mjs` mematok `KCI_WAJIB_VERIFIKASI=opsional`) agar
  suite lama tidak berubah makna.
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
| POST | `/api/auth/kode/periksa` | `{username}` → `{cocok, tiket?}`; server yang memeriksa profil; penolakan membawa `kode` sebab (`tantangan-tidak-ada`, `kode-kedaluwarsa`, `terlalu-cepat`, `terlalu-banyak-percobaan`) |
| POST | `/api/auth/pengajuan-manual` | `{username, catatan}` → `202 {status:"menunggu"}`; TIDAK ada tiket |
| GET | `/api/auth/tiket/:nilai` | Pratinjau tiket (pakai/umur) tanpa memakainya |
| POST | `/api/anggota` | Pendaftaran; wajib CSRF; tiket diverifikasi di dalam antrean tulis |
| POST | `/api/anggota/verifikasi-diri` | `{username, tiketVerifikasi}` → anggota yang SUDAH terdaftar melengkapi bukti; wajib CSRF; tiket tidak dikembalikan |
| GET | `/api/verifikasi/pindai-jadwal` | Pemindaian terjadwal (Vercel Cron); butuh `Authorization: Bearer <KCI_CRON_SECRET>` |
| POST | `/api/pengurus/pindai` | "Pindai sekarang" dari dasbor: satu batch, melanjutkan kursor (kredensial pengurus) |
| GET | `/api/pengurus/pengajuan-verifikasi` | Antrean pengajuan (kredensial pengurus) |
| POST | `/api/pengurus/pengajuan-verifikasi/:id/setujui` | Setujui → status anggota ditulis; TIDAK ada tiket di respons (`anggotaDiperbarui:false` + `petunjuk` bila formulir belum masuk) |
| POST | `/api/pengurus/pengajuan-verifikasi/:id/tolak` | Tolak dengan alasan |

Semua POST memerlukan `X-CSRF-Token` (penolakannya membawa
`kode: "token-csrf"` agar klien dapat membedakinya dari penolakan lain dan
memulihkan diri: token CSRF hidup di memori instance, jadi di serverless token
yang baru terbit bisa tidak dikenal oleh instance tempat POST mendarat — klien
meminta token baru dan mengirim ulang satu kali). Halaman perantara OAuth menulis hasil
ke `sessionStorage` (`kci-hasil-verifikasi`) sebagai JSON yang **diescape**
agar `</script>` dari pihak ketiga tidak dapat menyuntik skrip, dan hanya
kode sebab yang dikenal yang dikirim ke browser (pesan exception teknis tidak
pernah sampai ke pengguna).

---

## 6. Yang sudah diuji

`npm run uji:verifikasi` (117 pemeriksaan) dan `npm run uji:pendaftaran`
(60 pemeriksaan, server sungguhan + Chess.com tiruan), plus
`npm run uji:pendaftaran-ui` (66, jsdom), `npm run uji:backend` (140) dan tes Playwright alur pendaftaran.

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
| Tantangan dibuat di request A, diperiksa di request B | berhasil (tersimpan, bukan `Map`) |
| Kode di profil berbeda dengan tantangan | `cocok: false`, tanpa tiket |
| Tantangan kedaluwarsa | `410` + `kode: "kode-kedaluwarsa"` |
| Melewati batas percobaan (40) | `429` dan tantangan dibuang |
| Dua `/api/auth/kode/periksa` bersamaan | tepat satu `cocok: true` + satu tiket |
| Tantangan yang sudah berhasil dipakai lagi | `400` `tantangan-tidak-ada` |
| Tantangan di instance BARU dengan penyimpanan bersama | tetap terlihat (restart-aman) |
| Tantangan di instance dengan penyimpanan TERPISAH | ditolak — gagal aman, bukan lolos |
| Persetujuan pengurus, tiket tidak diserahkan ke layar pengurus | `status: "disetujui"`, tanpa `tiket` |
| Persetujuan pengurus sebelum formulir masuk | diterapkan saat mendaftar, lalu ditandai |
| Persetujuan satu username dipakai pendaftar lain | `403` (tidak menular) |
| Entri sudah ditolak lalu disetujui lagi | `409` |
| Field `terverifikasi`/`mode`/`sumber` dari browser | diabaikan |
| Username beda kapitalisasi / spasi / tautan | normalisasi + `409` duplikasi |
| Dua klik kirim bersamaan | satu `201`, satu `409`, satu baris anggota |
| Tanggal 30 Feb, masa depan, umur di luar 5–100 | `400` dengan pesan per field |
| Pendaftar daftar hitam lewat varian tulisan | `403` |
| POST tanpa CSRF | `403` + `kode: "token-csrf"` |
| Token CSRF terbit di instance lain | `403`; klien meminta token baru lalu mengirim ulang SATU kali |
| Sebab penolakan tantangan | `kode` di respons (`tantangan-tidak-ada`, `kode-kedaluwarsa`, `terlalu-cepat`, `terlalu-banyak-percobaan`) |

---

## 7. Keterbatasan yang tersisa

- Jalur kode profil membuktikan penguasaan **kolom profil publik**, bukan
  sesi login. Akun yang kata sandinya dicuri tetap bisa disalahgunakan —
  jauh lebih kuat daripada mengetik username, tetapi OAuth tetap jalur utama.
- Ledger "tiket sudah dipakai" per proses: lihat bagian 3.
- Tantangan kode profil andal lintas instance **hanya bila penyimpanan bersama
  terpasang** (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + tabel
  `kci_storage`). Tanpa itu `KCI_DIR_DATA` di Vercel adalah `/tmp` milik tiap
  instance: tantangan bisa hilang di tengah alur, dan hasilnya selalu penolakan
  dengan `kode: "tantangan-tidak-ada"` (UI langsung meminta kode baru), bukan
  verifikasi palsu. Dasbor pengurus menampilkan `tantanganPenyimpanan`
  (`penyimpanan-bersama` / `berkas-per-instance`) supaya ini terlihat, bukan
  harus ditebak.
- Belum ada antarmuka pengurus untuk antrean pengajuan: setujui/tolak masih
  lewat API (Basic auth / `KCI_TOKEN_ADMIN`).
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
---

## 9. Deteksi ban fair play otomatis

Keluhan yang mendorong bagian ini: *"banyak anggota memakai engine, jadi datanya
tidak terlacak kalau dia kena banned."* Verifikasi di depan saja tidak cukup —
akun yang hari ini bersih bisa kena ban tahun depan, dan tanpa pemindaian
berkala tidak ada yang tahu.

### Apa yang dipindai

Sumber pemindaian adalah **gabungan** roster klub Chess.com dan anggota yang
tercatat di situs (`data/anggota.json`). Sebelumnya hanya roster yang dipindai,
sehingga dua kelompok lolos dari pemeriksaan:

- anggota yang keluar atau dikeluarkan dari klub Chess.com;
- anggota yang dulu mendaftar tanpa bukti kepemilikan akun.

Justru mereka yang paling mungkin memakai engine, dan ban pada akun semacam itu
tidak akan pernah terlihat bila hanya roster yang diperiksa.

### Apa akibatnya bagi data anggota

| Temuan | Tindakan |
| ------ | -------- |
| `closed:fair_play_violations` | Masuk daftar larangan (`sumber:"otomatis"`) **dan** `terverifikasi:false` + `perluVerifikasiUlang:true` + `alasanStatus` + `diperiksaPada`, plus jejak audit `verifikasi-dicabut` |
| `closed` (akun ditutup) | `terverifikasi:false` + penanda yang sama. TIDAK masuk daftar larangan |
| Profil 404 (akun hilang) | `terverifikasi:false` + penanda yang sama. TIDAK masuk daftar larangan |
| Tidak muncul di roster klub | `perluVerifikasiUlang:true` SAJA — verifikasi **tidak** dicabut |
| Jaringan gagal / timeout / 5xx | TIDAK mengubah data apa pun; dihitung di `gagal` |

Dua pagar pengaman yang disengaja:

- **Roster klub bisa tertinggal hingga 12 jam** (batasan resmi endpoint
  Chess.com). Karena itu "tidak ada di roster" bukan bukti yang cukup untuk
  mencabut verifikasi anggota sah — hanya ditandai agar pengurus memeriksa.
  Bila endpoint roster gagal dibaca, penandaan ini dilewati seluruhnya, supaya
  satu gangguan tidak menandai semua anggota sekaligus.
- **Chess.com yang sedang down tidak boleh mengubah data kami.** Kegagalan
  permintaan selalu masuk `gagal` dan tidak pernah dianggap "akun hilang".
  Hanya 404 definitif (permintaan berhasil, akun memang tidak ada) yang
  mencabut verifikasi.

Pencabutan bersifat satu arah: pemindaian tidak pernah memulihkan
`terverifikasi:true`. Pemulihan hanya lewat bukti baru (bagian 10) atau
tindakan pengurus.

### Kapan pemindaian berjalan

1. **Terjadwal** — `vercel.json` `crons` memanggil
   `GET /api/verifikasi/pindai-jadwal` sekali sehari pada 04:17 UTC. Tanpa
   cron, pemindaian hanya terjadi saat ada pengurus membuka dasbor; di
   serverless tanpa trafik itu bisa berarti tidak pernah.
2. **Manual** — tombol "Pindai sekarang" di dasbor pengurus
   (`POST /api/pengurus/pindai`).

Setiap pemanggilan memproses akun per batch (maks. 40) dan menyimpan kursor di
`terakhir-pindai.json`, karena satu permintaan profil per anggota dengan batas
waktu fungsi 60 detik tidak muat untuk roster besar. Pemanggilan terjadwal
melanjutkan batch beruntun sampai roster tuntas atau anggaran waktu 45 detik
habis, jadi sekali sehari tetap menutup seluruh roster. Tombol manual
menjalankan satu batch lalu mengembalikan kursor, sehingga menekan berulang
kali benar-benar menyusuri daftar — bukan mengulang 40 akun pertama.

### Jadwal cron dan paket Vercel

Jadwalnya **sekali sehari dengan sengaja**. Paket Vercel Hobby menolak
deployment yang cronnya berjalan lebih dari sekali sehari (galat saat deploy:
*"Hobby accounts are limited to daily Cron Jobs"*), jadi `17 */6 * * *` akan
mematahkan deployment. Bila proyek sudah di paket Pro, jadwal boleh diperketat
ke `17 */6 * * *` tanpa perubahan kode; throttle internal 6 jam sudah
menyesuaikan.

Endpoint cron menolak jalan bila `KCI_CRON_SECRET` kosong (503 + peringatan
log). Ini gagal aman yang disengaja: endpoint memicu permintaan keluar ke
Chess.com dan mengubah data anggota, jadi tidak boleh terbuka tanpa kunci.
Perbandingannya konstan-time (`samaAman()`: hash SHA-256 lalu
`timingSafeEqual`), dan rahasia cron tidak diterima sebagai token pengurus.

---

## 10. Verifikasi mandiri untuk anggota lama

Pendaftaran menolak username yang sudah ada (`409`). Artinya anggota yang
terlanjur `terverifikasi:false` tidak bisa mengulang dari formulir, dan setelah
mode `wajib` menjadi bawaan mereka akan terkunci di luar kegiatan komunitas.
Karena itu ada jalur tersendiri:

- Halaman **`/lengkapi-verifikasi`** (tautannya juga tersedia di langkah
  username halaman pendaftaran).
- Endpoint **`POST /api/anggota/verifikasi-diri`** dengan
  `{username, tiketVerifikasi}`.

### Otorisasi

Situs ini **tidak punya sesi/login anggota** — login hanya untuk pengurus.
Jadi yang menjadi bukti identitas adalah tiket itu sendiri: HMAC ditandatangani
server, terikat ke satu username, berumur pendek, dan sekali pakai. Mengetahui
username orang lain tidak cukup; penyerang tetap harus membuktikan kepemilikan
akun Chess.com itu lewat OAuth atau kode di profil. Ini bukti yang sama persis
dengan yang diterima `POST /api/anggota`.

### Yang ditolak

Endpoint ini tidak boleh bisa dipakai memulihkan akun bermasalah:

- akun ada di daftar larangan (dicocokkan lewat username **dan** hash
  identitas) → `403` `diblokir:true`;
- profil Chess.com-nya kena ban fair play atau ditutup → `403` `diblokir:true`,
  dan ban fair play langsung dicatat ulang ke daftar larangan;
- tiket untuk username lain → `403` `kodeVerifikasi:"username-beda"`;
- profil Chess.com menjawab username yang berbeda → `409`;
- username bukan anggota terdaftar → `404` (endpoint ini melengkapi, bukan
  membuat anggota);
- `KCI_PEPPER` tidak cocok dengan entri daftar larangan → `503`, lebih baik
  menolak daripada meloloskan pemain yang seharusnya dilarang.

Tiket dipakai **di dalam antrean tulis** bersama penulisan status, jadi dua
klik beruntun tidak menghabiskan tiket yang sama lalu gagal menyimpan. Tiket
tidak pernah dikembalikan ke klien dan tidak disimpan di state browser setelah
dipakai.

### Gerbang kegiatan

Anggota dengan `terverifikasi:false` ditolak saat mendaftar turnamen
(`403` `perluVerifikasi:true`) dengan pesan mengarahkan melengkapi verifikasi.
Pengecualian per-even bisa dibuka pengurus lewat field
`izinkanBelumTerverifikasi`. Pengecualian itu **tidak** meloloskan akun yang
kena ban fair play atau ada di daftar larangan — pemeriksaan larangan tetap
berjalan lebih dulu.

Jalur pengurus menambahkan peserta langsung (`daftarkanPeserta`) sengaja tidak
digerbangi, agar data tetap bisa diperbaiki manual — misalnya saat Chess.com
sedang down dan verifikasi mandiri menjawab `502`.
