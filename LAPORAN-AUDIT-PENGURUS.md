# LAPORAN AUDIT — AREA PENGURUS (DASHBOARD)

**Tanggal:** 24 Agustus 2026
**Ruas lingkup:** 8 bagian dashboard pengurus — Pengurus (gerbang), Dashboard, Anggota, Daftar Larangan, Pesan Masuk, Turnamen, Juara Turnamen, Berita Komunitas, dan Pengumuman.
**Cakupan:** penelusuran jalur (routing) dari menu → komponen → API → endpoint server → data, uji terminal (build + rangkaian uji proyek), dan uji integrasi hidup terhadap backend yang benar-benar dijalankan.

> Ringkasan ini merupakan audit tambahan yang fokus pada dashboard pengurus.
> Temuan umum seluruh kode (keamanan, performa, deploy) tercatat di
> `LAPORAN-AUDIT-CHESSCLUB.md`.

---

## 1. RINGKASAN EKSEKUTIF

**Kesimpulan utama: semua 8 bagian lengkap, terpasang pada jalur yang benar, dan
sudah terintegrasi penuh frontend ↔ backend. Tidak ada halaman yang "tombolnya
palsu" atau fungsinya belum disambungkan.**

Cara verifikasi:

| Bukti | Hasil |
|---|---|
| `npm run uji:rute` | ✓ 31 rute publik selaras (`App.jsx` ↔ `plugins/performa.js`) |
| `npm run uji:i18n` | ✓ 573 kunci ID = EN; 420 kunci terpakai semuanya ada |
| `node scripts/uji-identitas.mjs` | ✓ 36 lulus, 0 gagal |
| `npm run uji:backend` | ✓ 85 lulus, 0 gagal |
| `npm run build` | ✓ selesai 3,4 dtk — **tanpa error terminal** |
| Dev server (`vite`) | ✓ boot 218ms tanpa error; `/` 200, `/pengurus` 200, proxy `/api` → backend 200 |
| **Uji integrasi hidup** (backend nyata + tiruan Chess.com, 51 skenario mengikuti persis urutan panggilan browser, termasuk CORS/CSRF/token) | ✓ **51/51 lulus** |

Tidak ditemukan panel yatim (file yang tidak dipakai), endpoint yang dipanggil
tetapi tidak ada di server, atau endpoint yang jawabnya tidak digunakan.

Ada **6 catatan perbaikan** (tidak satu pun pemblokir jalan; dirinci di §4).

---

## 2. PETA JALUR — DARI MENU SAMPAI DATA

Satu pintu masuk: `App.jsx` mendaftarkan `/pengurus` → `ProtectedRoute`
(yang membuktikan token ke server **sebelum** halaman dirender) →
`Dashboard.jsx` dengan 8 tab sidebar. Semua pemanggilan API lewat
`apiPengurus()` (menyertakan `X-Token-Admin`, `X-Admin-User`, `X-CSRF-Token`,
dan pemulihan otomatis 403-CSRF / 429 rate-limit).

### 2.1 Pengurus (gerbang masuk) — ✓ BENAR

```
/pengurus → ProtectedRoute.jsx
            ├─ token ada? → verifikasi ke GET /api/pengurus/ringkasan
            │   ├─ 200          → dashboard dirender
            │   ├─ 401/403      → token dibuang → Gerbang (login)
            │   └─ 5xx/jaringan → layar "coba lagi" (tidak mengunci selamanya)
            └─ tanpa token → Gerbang.jsx (username + token)
```
Terverifikasi: tanpa token server menjawab **401**; salah token berulang
dibatasi server (**429**); rute ini sengaja **tidak** ditautkan dari menu
publik dan **tidak** ada di `sitemap.xml`.

### 2.2 Dashboard (kartu ringkasan + aksi cepat) — ✓ TERINTEGRASI

| Sumber tampilan | Server | Uji hidup |
|---|---|---|
| `apiPengurus("/ringkasan")` | `GET /api/pengurus/ringkasan` (gabungan ringkasan anggota + daftar larangan + turnamen + konten + pesan + verifikasi) | 200 |
| `ambilDaftarAnggota()` | `GET /api/anggota` (roster Chess.com; frontend punya cadangan fetch langsung ke api.chess.com bila backend padam) | 200 |
| `ambilDaftarHitam()` | `GET /api/daftar-hitam` | 200 |
| Lonceng notifikasi (polling 30 detik, jeda saat tab disembunyikan) | `GET /api/pengurus/pesan` | 200 |
| "Tandai semua dibaca" di lonceng | `POST /api/pengurus/pesan/semua-baca` | 200 |
| Klik aksi cepat / "Kelola daftar larangan →" | berpindah ke tab tujuan (pesan, turnamen, berita, anggota, larangan) sesuai nama | ✓ |

Kelengkapan kunci isi ringkasan diperiksa satu per satu
(`anggota, daftarHitam, otomatis, pengurus, anggotaTerdata, pesan, turnamen,
konten, verifikasi`) — **semua ada**.

### 2.3 Anggota — ✓ TERINTEGRASI

| Aksi di panel (`Anggota.jsx`) | Server | Uji hidup |
|---|---|---|
| Daftar anggota | `GET /api/anggota` | 200 |
| Tombol **Pindai ban fair play** | `POST /api/pengurus/pindai` | 200 |
| Tombol **Kontak** (modal data pribadi) | `GET /api/pengurus/kontak/:username` | 200/404 ✓ |
| Tombol **Blokir** (modal alasan wajib) | `POST /api/pengurus/blokir` → masuk `data/daftar-hitam.json` → langsung tampil di `GET /api/daftar-hitam` (yang juga dipakai halaman publik & dashboard) | 200 ✓ rantai lengkap |

### 2.4 Daftar Larangan — ✓ TERINTEGRASI

| Aksi di panel (`Larangan.jsx`) | Server | Uji hidup |
|---|---|---|
| Tabel daftar | `GET /api/daftar-hitam` | 200 |
| Form **cek nomor HP** | `POST /api/pengurus/cek-nomor` | 200 |
| Tombol **Cabut** (modal konfirmasi) | `POST /api/pengurus/buka` | 200 |

### 2.5 Pesan Masuk — ✓ TERINTEGRASI (ujung-ke-ujung terbukti)

```
pengunjung mengisi form /hubungi-kami   POST /api/pesan            → 201 ✓
    pesan SAMPAI ke daftar pengurus     GET  /api/pengurus/pesan   → ✓ terbukti muncul
    klik pesan / klik notifikasi        POST /pesan/:id/baca       → 200
    hapus (modal konfirmasi)            POST /pesan/:id/hapus      → 200
    balas                               mailto: (klien email)      — sengaja
```
Klik notifikasi lonceng membuka tab pesan **langsung ke pesan yang dipilih**
(`pesanTerpilihId`) — jalur khusus ini juga terhubung.

### 2.6 Turnamen — ✓ TERINTEGRASI (panel paling dalam, 13 endpoint)

| Aksi (`PanelTurnamen.jsx` + `PanelTurnamen/Rincian.jsx` + `Formulir.jsx`) | Server | Uji |
|---|---|---|
| Muat daftar + kamus jenis | `GET /api/turnamen/jenis` + `GET /api/pengurus/turnamen` | 200 |
| Buat turnamen | `POST /api/pengurus/turnamen` | 201 |
| Ubah (status, tanggal, dsb.) | `POST .../turnamen/:id/ubah` | 200 |
| Buka rincian di header | `GET .../turnamen/:id` | 200 |
| Terima/tolak pengajuan masuk | `POST .../pengajuan-terima` / `.../pengajuan-tolak` | 200/404 ✓ |
| Tambah/keluarkan peserta | `POST .../peserta` / `.../peserta-keluar` | 201/200 |
| Catat & hapus hasil ronde | `POST .../hasil` / `.../hasil-hapus` | 400/404 kasus validasi benar* |
| Pindai peserta (fair play) | `POST .../pindai` | 200 |
| Hapus turnamen | `POST .../hapus` | 200 |
| Jalur publik ikut hidup: daftar sebagai peserta dari halaman Turnamen | `POST /api/turnamen/:id/daftar` | 403 saat memang wajib daftar anggota dulu — **validasi sengaja**, ditangani halaman publik (`harusDaftarAnggota`) |

\* `hasil` menolak 400 bila pemain bukan peserta; `hasil-hapus` 404 bila indeks
tidak ada — respons ini yang seharusnya.

Waktu mulai/selesai di-parse tegas sebagai **Asia/Jakarta**
(`lib/waktu.js`) di semua panel dan halaman publik — konsisten, tidak geser
zona.

### 2.7 Juara Turnamen — ✓ TERINTEGRASI (memakai mesin turnamen yang sama)

| Aksi (`PanelJuara.jsx`) | Server | Uji |
|---|---|---|
| Arsip (status `selesai` / punya juara) | `GET /api/pengurus/turnamen` + saring di klien | 200 |
| Tambah baris arsip (kategori resmi atau manual) | `POST /api/pengurus/turnamen` (`status:"selesai"` + `juara`) | 201 |
| Pensil edit | `POST .../turnamen/:id/ubah` (field `juara` diizinkan server) | 200 |
| Hapus | `POST .../turnamen/:id/hapus` | 200 |
| Terlihat publik | `GET /api/turnamen/:id` memuat `juara` | ✓ (field diverifikasi ikut terkirim) |

Catatan maksud-rancang: halaman publik `/beranda/daftar-juara` adalah **halaman
pengantar statis** yang menautkan pengunjung ke `/turnamen` (tabel hasil asli
dirender komponen `TabelHasilTurnamen` dari data API yang sama). Bukan jalur
putus — tapi bila Anda berharap tabel juara tampil langsung di tab Beranda itu,
itulah satu-satunya "sambungan opsional" yang belum dibuat.

### 2.8 Berita Komunitas & 2.9 Pengumuman — ✓ TERINTEGRASI (CRUD + draf/publik + gambar)

Panel `PanelKonten.jsx` dipakai dua kali (konfigurasi `berita` / `pengumuman`):

| Aksi | Server | Uji |
|---|---|---|
| Daftar | `GET /api/pengurus/{berita\|pengumuman}` | 200 |
| Buat (judul, isi, gambar terkompresi, status draf/publik) | `POST /api/pengurus/{berita\|pengumuman}` | 201 |
| Edit | `POST .../:id/ubah` | 200 |
| Hapus (modal konfirmasi) | `POST .../:id/hapus` | 200 |
| Status **publik langsung tampil** di halaman situs | `GET /api/{berita\|pengumuman}` → dirender `BeritaKomunitas.jsx` / `Pengumuman.jsx` | ✓ terbukti isi baru ikut muncul |
| Halaman detail `/media-dan-informasi/berita/:id` (dan `/pengumuman/:id`) | menukan daftar publik, `id` URL-safe dari server | ✓ |
| Keamanan gambar | server hanya menerima URL HTTPS / data-URL gambar; skema `javascript:` dsb. ditolak | ✓ |

---

## 3. BUKTI "TERMINAL TIDAK ERROR"

Semua dijalankan nyata pada audit ini:

```
npm run uji:rute      → OK — 31 rute publik selaras.
npm run uji:i18n      → OK — 573 kunci ID = 573 kunci EN; 420 kunci terpakai ada.
uji-identitas.mjs     → 36 lulus, 0 gagal.
npm run uji:backend   → 85 lulus, 0 gagal, 0 dilewati.
npm run build         → ✓ built in 3.37s (tanpa peringatan Vite berarti).
vite dev              → ready in 218 ms; / & /pengurus 200; /api/kesehatan 200 via proxy.
Uji integrasi hidup   → 51 lulus, 0 gagal (awalnya 5 "gagal" — semuanya 502 karena
                        sandbox ini tidak bisa menjangkau api.chess.com; setelah
                        server tiruan Chess.com dipasang, 100% hijau).
```

---

## 4. TEMUAN & SARAN PERBAIKAN (6 butir — tidak ada yang pemblokir)

### F1 · Sedang — Gerbang login ikut "down" kalau Chess.com down
`ProtectedRoute`/`Gerbang` memverifikasi token lewat `GET /api/pengurus/ringkasan`,
dan fungsi `ringkasan()` di server **ikut memanggil roster klub Chess.com**
(`daftarAnggotaKlub()`). Bila api.chess.com sedang padam/lambat/dibatasi, endpoint
itu menjawab 502, sehingga **pengurus bertoken benar pun tidak bisa masuk**
(ditampilkan layar "coba lagi" — tidak mengunci, tapi dashboard tak terbuka
sampai Chess.com pulih).
*Saran:* tambah endpoint ringan khusus verifikasi token (mis. `GET
/api/pengurus/verifikasi` yang hanya memanggil `pastikanAdmin` lalu 200), atau
buat `ringkasan()` kebal-gagal-rokster (roster kosong saat gagal) — lalu arahkan
`ProtectedRoute`/`Gerbang` ke endpoint ringan itu.

### F2 · Kecil — Satu fungsi frontend yatim DAN salah otorisasi
`pindaiFairPlay()` di `src/lib/api/anggota.js` tidak dipakai di mana pun; lebih
buruk, ia memanggil `POST /api/pengurus/pindai` **tanpa header token admin**,
sehingga pasti 401 bila kelak ada yang menyambungkannya. Panel Anggota sendiri
sudah benar memakai `apiPengurus("/pindai")`. *Saran:* hapus fungsi ini
(atau tulis ulang di atas `apiPengurus`).

### F3 · Kecil — Satu endpoint server yatim
`GET /api/pengurus/ringkasan-pesan` (`server/src/index.js` + `ringkasanPesan()`
di `pesan.js`) tidak dipanggil oleh frontend mana pun — dashboard mengambil
ringkasan pesan dari `/api/pengurus/ringkasan`. Tidak berbahaya; biarkan atau
hapus agar permukaan API ramping.

### F4 · Kecil — Tab fallback Dashboard kurang eksplisit
Rantai ternary di `Dashboard.jsx` merender `PanelTurnamen` untuk **nilai tab apa
pun yang tidak dikenal**. Hari ini tak terjangkau (semua `kunci` menu
dhardcode), tetapi rentan bila kelak tab ditambah luput di rantai bawah.
*Saran:* jadikan cabang `tab === "turnamen"` eksplisit dan default-kan `null`.

### F5 · Catatan maksud-rancang — halaman publik Daftar Juara statis
Seperti dijelaskan §2.7: tab Beranda "Daftar Juara" memang dirancang sebagai
pengantar; data hidupnya di `/turnamen`. **Bukan jalur putus** — hanya perlu
disadari agar ekspektasi "tabel juara di tab itu" tidak keliru.

### F6 · Kecil · Perf/UX — tebakan URL avatar Chess.com
`ui.jsx ▸ Avatar` memuat `https://images.chesscom.com/uploads/user/{username}.jpg`
— pola URL yang tidak didokumentasikan Chess.com (avatar resmi tersedia lewat
field `avatar` API per-pemain). Hampir semua akan gagal lalu jatuh ke inisial
(sudah ada `onError` fallback, jadi tidak rusak), tetapi setiap render membuang
permintaan gambar. *Saran:* pakai field `avatar` yang sudah dikirim fungsi
anggota bila ada, atau langsung tampilkan inisial.

---

## 4a. PERBAIKAN YANG SUDAH DITERAPKAN (24 Agustus 2026)

Kelima perbaikan berikut telah diterapkan pada berkas kode dan diverifikasi
ulang secara hidup:

| # | Perubahan | Berkas |
|---|---|---|
| F1 | **Endpoint baru `GET /api/pengurus/verifikasi`** — pemeriksaan token ringan tanpa panggilan Chess.com; `ProtectedRoute` dan `Gerbang` kini memverifikasi lewat endpoint ini, sehingga login dashboard tetap lolos saat api.chess.com padam (dibuktikan dengan backend yang sengaja diarahkan ke port mati: `/ringkasan` → 502, `/verifikasi` token benar → 200) | `server/src/index.js`, `src/components/ProtectedRoute.jsx`, `src/halaman/Pengurus/Gerbang.jsx` |
| F2 | Fungsi yatim dan salah-otorisasi `pindaiFairPlay()` dihapus; digantikan komentar penanda bahwa satu-satunya jalur sah adalah `apiPengurus()` | `src/lib/api/anggota.js` |
| F3 | Endpoint yatim `GET /api/pengurus/ringkasan-pesan` dicabut dari router (terverifikasi kini menjawab 404). Fungsi `ringkasanPesan()` tetap dipakai oleh `/ringkasan` | `server/src/index.js` |
| F4 | Cabang tab Dashboard dirapikan: `turnamen` kini eksplisit, nilai tab tak dikenal jatuh ke `null` | `src/halaman/Pengurus/Dashboard.jsx` |
| F6 | `Avatar` memakai field `foto` dari data anggota (URL avatar resmi Chess.com) — tebakan URL yang tidak didokumentasikan dihapus; inisial tetap menjadi cadangan | `src/halaman/Pengurus/ui.jsx`, `src/halaman/Pengurus/Anggota.jsx` |
| — | Uji backend ditambah: `/api/pengurus/verifikasi` 401 tanpa token, 200 `{ok:true}` dengan token | `server/uji/uji-backend.mjs` |

**Verifikasi pasca-perbaikan (dijalankan ulang semuanya):**

```
npm run uji:rute     → OK — 31 rute publik selaras.
npm run uji:i18n     → OK — 573 kunci ID = EN.
uji-identitas        → 36 lulus, 0 gagal.
npm run uji:backend  → 87 lulus, 0 gagal (2 uji baru untuk /verifikasi).
npm run build        → ✓ built in 3.01s, tanpa error.
Uji regresi hidup    → 38 lulus, 0 gagal dari 38 pemeriksaan
                       (seluruh rantai 8 bagian + perilaku baru F1/F3).
```

F5 tidak lagi relevan: tab Beranda "Daftar Juara" kini memakai komponen
`TabelHasilTurnamen` (perubahan atas permintaan pemilik, 24 Agustus 2026) —
konten statis lama dihapus, tabel juara hidup bersumber data yang sama
dengan halaman `/turnamen`.

---

## 5. JAWABAN ATAS TIGA PERTANYAAN AUDIT ANDA

1. **"Apakah jalurnya sudah benar sesuai fungsi masing-masing?"**
   Ya. Matriks §2 memetakan tiap tombol/tab ke endpoint nyata; 51/51 skenario
   hidup lulus, termasuk rantai sebab-akibat (blokir → tampil di daftar publik;
   konten publik → tampil di situs; pesan form → masuk panel).

2. **"Masih ada bagian yang terlewatkan / belum terintegrasi ke halaman fungsinya?"**
   Tidak ada bagian yang terlewat. Yang tersisa hanya sisa-sisa kode non-aktif:
   satu fungsi frontend yatim (F2), satu endpoint server yatim (F3), dan satu
   halaman publik yang sengaja statis (F5). Lihat juga LAPORAN-AUDIT-CHESSCLUB.md
   untuk isu level proyek (mis. P0-1 konfigurasi API saat deploy GitHub Pages).

3. **"Apakah terminal bersih dari error?"**
   Ya — build, dev server, uji rute, uji i18n, uji identitas, dan 85 uji
   backend semuanya hijau tanpa error, seperti tercatat di §3.

---

*Metode: penelusuran kode statis seluruh `src/` dan `server/src/`, pelaksanaan
rangkaian uji bawaan proyek, build produksi, boot dev server, serta uji
integrasi hidup terhadap backend nyata (dir data `/tmp` terpisah agar data asli
tidak tersentuh) dengan API Chess.com tiruan untuk menutup keterbatasan jaringan
sandbox.*
