# Review Bagian Pengurus — Temuan Bug & Kesalahan Pengeditan

Tanggal review: 13 September 2026 · Commit: `52b9404`

Cakupan: `src/halaman/Pengurus/**` (25 berkas, ±7.300 baris), `src/lib/api/pengurus.js`,
`src/components/ProtectedRoute.jsx`, rute & modul server terkait (`server/src/rute.js`,
`http.js`, `admin-file.js`, `audit.js`, `riwayat-masuk.js`, `konten.js`, `pesan.js`,
`turnamen.js`, `keanggotaan.js`), halaman publik
`src/halaman/TentangKami/StrukturGrupCatur/Pengurus.jsx` + `dataPengurus.js`,
terjemahan `pengurus`, dan `scripts/pengurus.mjs`.

Metode: baca kode menyeluruh, `npm run build` (✓ sukses), `uji:backend` (✓ 138 lulus),
`uji:skema` (✓), `uji-auth-jwt` (✓ 24 lulus), `uji:i18n` (✓ 2081 kunci ID = EN), serta
uji coba nyata terhadap server uji (login → tambah admin → ganti password → buat/hapus
berita → baca audit) untuk membuktikan bug #1, #2, dan #5.

---

## A. Bug fungsional nyata (perlu diperbaiki)

### 1. Hapus massal Berita/Pengumuman TIDAK PERNAH berhasil — id salah
**Berkas:** `src/halaman/Pengurus/PanelKonten.jsx:537-556` (dan `:527`, `:650`)

`konfirmasiHapusMassal` mengirim `Object.keys(rowSelection)` sebagai daftar id:

```js
const ids = Object.keys(rowSelection);          // → ["0","1","3"] (INDEKS BARIS!)
await apiPengurus(`/${konfig.jalur}/${id}/hapus`, ...)
```

Tabel dibuat dengan `useLegacyTable({...})` **tanpa opsi `getRowId`**, sehingga TanStack
memakai default: id baris = **indeks baris** (string `"0"`, `"1"`, …), bukan `item.id`
(format server: `berita-mtztq2xx-c879c1`, lihat `server/src/konten.js:41-44`).

**Bukti (server uji nyata):**
```
BUAT BERITA: 201 id = berita-mtztq2xx-c879c1
HAPUS BERITA id='0' (yang dikirim UI): 404 {"pesan":"Berita tidak ditemukan."}
HAPUS BERITA id asli:                  200 {"pesan":"Berita dihapus."}
```

Dampak: tombol "Hapus terpilih" selalu gagal (toast 404), tidak ada data terhapus.
Bug pendamping: pembersihan seleksi di `konfirmasiHapus` (`delete baru[x.id]`, baris 527)
juga memakai ruang kunci yang salah (harusnya indeks baris) — tidak merusak, tapi menunjukkan
kunci seleksi memang tidak pernah cocok dengan id item.

**Perbaikan:** tambahkan `getRowId: (row) => row.id` pada konfigurasi `useLegacyTable`
(baris 650). Setelah itu `Object.keys(rowSelection)` berisi id item yang benar, dan
`delete baru[x.id]` di baris 527 otomatis ikut benar.

---

### 2. Password admin: UI janji "minimal 6 karakter", server wajib 12, galat muncul sebagai 500 buta
**Berkas:**
- `src/halaman/Pengurus/Pengaturan.jsx:189` & `:428` — placeholder `"minimal 6 karakter"`
- `src/halaman/Pengurus/Pengaturan.jsx:328-330` — cek klien `passBaru.length < 6`
- `server/src/rute.js:538-540` — cek rute `/ganti-password` juga `< 6`
- `server/src/admin-file.js:18-28` — `PANJANG_PASSWORD_MIN = 12`, menolak `"admin123"`,
  **melempar `Error` polos** (bukan `GalatAplikasi`)

`Error` polos tanpa `.status` jatuh ke penangan generik `server/src/permintaan.js:145`
→ dibalas **500 `{"pesan":"Kesalahan server."}`**.

**Bukti (server uji nyata):**
```
TAMBAH ADMIN (password 7 char):  500 {"pesan":"Kesalahan server."}
GANTI PASSWORD (password 10 char): 500 {"pesan":"Kesalahan server."}
TAMBAH ADMIN (password 17 char): 201 (sukses)
```

Dampak: pengurus yang mengikuti petunjuk UI (6+ karakter) **selalu gagal** dengan pesan
"Kesalahan server." yang tidak menjelaskan apa pun. Berlaku di tiga tempat:
tambah admin (`/admins/tambah`), ubah admin (`/admins/ubah`), dan ganti password sendiri
(`/ganti-password`). Kasus lain yang ikut termasker jadi 500: "Username sudah ada.",
"Tidak bisa hapus master terakhir.", dsb.

**Perbaikan:**
1. Di `admin-file.js`, lempar `GalatAplikasi(400, ...)` (atau bungkus di rute) agar pesan
   asli sampai ke klien.
2. Samakan kebijakan: ubah teks UI + cek rute menjadi **minimal 12 karakter** (konsisten
   dengan `PANJANG_PASSWORD_MIN` dan syarat produksi di `server/src/index.js:100`).

---

### 3. Semua toast (`beriTahu`) TIDAK TERLIHAT saat halaman Pengaturan terbuka
**Berkas:** `src/halaman/Pengurus/Dashboard.jsx:236-256` (cabang `tabPengaturan`) vs `:340-346` (render `kabar`)

`kabar` hanya dirender di dalam `<main>` pada cabang **non**-Pengaturan:

```jsx
{tabPengaturan ? (
  <Pengaturan onKembali={...} beriTahu={beriTahu} />   // ← tidak ada penampil kabar
) : (
  <> ... <main>{kabar && <p ...>{kabar.teks}</p>} ... </main> </>
)}
```

Padahal seluruh umpan balik di Pengaturan (Kelola Admin, Akun & Password, Riwayat Masuk,
Jejak Audit) memakai `beriTahu`. Dampak: "Admin ditambahkan.", "Password berhasil diganti.",
maupun pesan galat (termasuk 500 dari bug #2) **tidak pernah tampil** — pengguna hanya
menebak-nebak apakah aksinya berhasil.

**Perbaikan:** render elemen `kabar` juga di cabang Pengaturan (mis. di dalam
`<Pengaturan>` sebagai banner/toast tetap), atau pindahkan penampil kabar ke level atas
di luar percabangan.

---

### 4. Panel Juara: perubahan "Kategori" saat Ubah Turnamen hilang diam-diam
**Berkas:**
- `src/halaman/Pengurus/PanelJuara.jsx:193-203` — bodi `/turnamen/:id/ubah` hanya mengirim
  `nama, juara, mulai, selesai` (tanpa `jenis`)
- `server/src/turnamen.js:252-256` — daftar `bolehUbah` juga **tidak memuat `jenis`**

Sheet "Ubah Turnamen" menampilkan pemilih Kategori yang bisa diedit, tetapi perubahan itu
tidak pernah dikirim/diterima. Pengguna mengira kategori tersimpan; data lama tetap.

**Perbaikan (pilih satu):**
- kirim `jenis: kategori` di bodi ubah **dan** tambahkan `"jenis"` ke `bolehUbah` server; atau
- nonaktifkan/sembunyikan field Kategori saat mode ubah agar tidak menyesatkan.

---

### 5. Unduh CSV Jejak Audit: kolom tercemar nilai timestamp
**Berkas:** `src/halaman/Pengurus/Audit.jsx:22-27`

```js
.map((k) => `"${String(e[k] || e.waktu || e.peristiwa || e.pengguna || "").replace(...)}"`)
```

Rantai fallback `|| e.waktu || e.peristiwa || e.pengguna` dipakai untuk **semua** kolom.
Setiap entri audit selalu punya `waktu`, sehingga kolom yang kosong (`username`, `ip`,
`status`, `resourceId`, `reason`) terisi **timestamp**, bukan kosong.

**Bukti (entri nyata dari server uji):**
```json
{"timestamp":"2026-09-13T13:02:19.762Z","waktu":"...","action":"admin-post-...",
 "pengguna":"","ip":"9.9.9.9","username":"","status":"success"}
```
→ di CSV, kolom `username` baris ini akan berisi `2026-09-13T13:02:19.762Z`.

Bug pendamping (baris 33): `URL.revokeObjectURL(url)` dipanggil **sinkron** tepat setelah
`a.click()` — di sebagian browser (mis. Firefox) unduhan bisa batal karena URL dicabut
sebelum unduhan dimulai.

**Perbaikan:** nilai per kolom tanpa fallback silang (`String(e[k] ?? "")`), dan tunda
revoke (`setTimeout(() => URL.revokeObjectURL(url), 1000)`).

---

### 6. Filter Jejak Audit menembak server di setiap ketikan
**Berkas:** `src/halaman/Pengurus/Audit.jsx:45-66`

```js
const muat = useCallback(async () => { ...q.set("aksi", aksi.trim())... }, [aksi, username, beriTahu]);
useEffect(() => { muat(); }, [muat]);
```

Karena `aksi` & `username` adalah dependensi `useCallback`, setiap karakter yang diketik di
input "Aksi"/"Username" membuat `muat` baru → `useEffect` jalan → **GET `/audit` per ketikan**.
Tombol "Saring" jadi redundan, dan rate-limit umum server (100 request/window,
`server/src/konfigurasi.js:236`) bisa terpicu 429 hanya karena mengetik.

**Perbaikan:** kirim filter hanya saat tombol "Saring" ditekan (simpan nilai query di state
terpisah), atau beri debounce ±400 ms.

---

## B. Bug minor / inkonsistensi logika

### 7. Riwayat Masuk: "Hari Ini" memakai tanggal UTC, tampilan memakai WIB
`src/halaman/Pengurus/RiwayatMasuk.jsx:186` & `:215` membandingkan
`r.waktu.slice(0,10)` (ISO **UTC**) dengan `new Date().toISOString().slice(0,10)` (UTC),
sementara seluruh tampilan memakai `timeZone: "Asia/Jakarta"`. Login jam 00:00–06:59 WIB
tercatat sebagai tanggal UTC sebelumnya → tidak dihitung "Hari Ini" padahal tabel
menampilkannya sebagai hari ini. Server sudah punya pola benar: `hariIni()` di
`server/src/konten.js:26-33` (Intl `en-CA` + Asia/Jakarta) — pakai pola yang sama.

### 8. Filter basi saat masuk lewat Sidebar (Anggota & Daftar Larangan)
`Dashboard.jsx:31-32,57-61` menyimpan `filterAnggota`/`filterLarangan` dan tidak pernah
meresetnya. Alur: klik banner "Buka di Panel Anggota" (filter `terblokir`) → pindah tab →
klik "Anggota" di sidebar → panel re-mount dengan `filterAwal="terblokir"` yang lama,
bukan "semua". Perbaikan: reset filter ke `"semua"` saat `setTab` dipanggil langsung dari
Sidebar, atau sinkronkan `filterAwal` via `useEffect` di panel.

### 9. Formulir Turnamen menelan galat non-field tanpa pesan apa pun
`src/halaman/Pengurus/PanelTurnamen/Formulir.jsx:48-51`:
```js
setGalat(err.galat || {});
if (!err.galat) throw err;
```
`GalatApi` **selalu** punya `.galat` (default `{}` — truthy, `src/lib/api/core.js:8-16`),
jadi cabang `throw` tidak pernah jalan dan `{}` tidak menampilkan apa-apa. Kegagalan
jaringan/500/403 saat membuat turnamen = tombol "Simpan" berkedip tanpa umpan balik.
Perbaikan: `if (!Object.keys(err.galat || {}).length)` → tampilkan `err.message`
(atau lempar ke pemanggil agar `beriTahu` menangani).

### 10. Panel Juara: gagal muat tanpa "Coba Lagi" dan tanpa toast
`src/halaman/Pengurus/PanelJuara.jsx:132-136` — `catch { setGagal(true) }` menelan pesan
galat; kotak gagal (baris 246-248) tidak punya tombol coba lagi, dan `gagal` tidak pernah
direset sehingga tidak ada jalan pemulihan selain pindah tab. Panel lain sudah memakai
`KotakGalatMuat` — pakai komponen yang sama.

### 11. Filter "Terverifikasi" di Anggota bisa memuat akun terblokir
`src/halaman/Pengurus/Anggota.jsx:103-106` hanya mengecualikan `diblokirKomunitas`,
sedangkan definisi "terblokir" (baris 92-101) juga mencakup `alasanStatus ===
"fair_play_violations"` dan `statusChess` closed. Akun yang kena ban Chess.com tetapi
belum masuk daftar hitam komunitas akan muncul di **kedua** filter. Samakan kriterianya.

### 12. `galatMuat` di Dashboard adalah state mati
`src/halaman/Pengurus/Dashboard.jsx:42` — `setGalatMuat(true)` dipanggil di `muatUlang`
tetapi nilainya **tidak pernah dibaca** di render manapun (kotak galat tab dashboard
memakai kondisi `!ringkas && !memuat`). Selain membingungkan, kegagalan muat awal juga
berdampak ke tab Anggota/Larangan (data `anggota`/`hitam` kosong) yang tidak punya kotak
galat sama sekali. Pakai `galatMuat` untuk menampilkan `KotakGalatMuat` di semua tab yang
datanya berasal dari `muatUlang`, atau hapus state-nya.

### 13. Teks Riwayat Masuk ketinggalan zaman ("token", "akun Chess.com")
`src/halaman/Pengurus/RiwayatMasuk.jsx:407` — "Setiap kali pengurus memasukkan username
Chess.com dan **token** di gerbang login" — gerbang sekarang memakai username + **password**
(`Gerbang.jsx`), dan username admin belum tentu akun Chess.com (bawaan: `admin`). Label
kolom "Akun Chess.com" + tautan `chess.com/member/<username>` (baris 452-460) untuk akun
seperti `admin` akan membuka profil yang tidak ada. Perbaiki teks & label agar netral
("Akun admin").

### 14. Kondisional redundan di legacy auth server
`server/src/http.js:411-414`:
```js
if (!username || a.username === username) return a;
return a;   // ← membuat pemeriksaan di atas tidak berarti
```
Kedua cabang identik — pemeriksaan kecocokan username mati. Jalur legacy (token mentah =
password admin) tetap mengembalikan admin apa pun yang passwordnya cocok, terlepas dari
`X-Admin-User`. Rapikan: hapus baris kedua atau tegakkan pengecekan username.

### 15. `salahPanggilan` di PanelEbook/Terbit tidak pernah `true`
`src/halaman/Pengurus/PanelEbook/Terbit.jsx:30,66` — state untuk border merah hanya
di-set `false`; validasi nama kosong baru terlihat setelah dialog "Gagal menerbitkan kode".
Set `true` saat `kirim`/`lanjut` dengan panggilan kosong, atau hapus state-nya.

### 16. "Tolak" permintaan kode e-book tanpa konfirmasi
`src/halaman/Pengurus/PanelEbook.jsx:122-132` + `PanelEbook/Permintaan.jsx` — sekali klik
langsung menolak permanen (status `ditolak`), padahal semua aksi destruktif lain di
dashboard memakai `Modal` konfirmasi. Rawan salah klik.

---

## C. Catatan keamanan & konsistensi (bukan bug baru, layak diputuskan)

1. **`/api/pengurus/ganti-password` hanya dijaga `pastikanAdmin`** (`server/src/rute.js:528`),
   bukan `pastikanMaster` — padahal UI-nya master-only dan endpoint ini menulis ulang
   kredensial **master** (`tulisAdminFile` selalu men-set `role: "master"`,
   `admin-file.js:135-176`). Admin ber-role `pengurus` yang mengetahui password master bisa
   mengganti username/password master lewat API langsung. Selaraskan penjagaan server
   dengan UI (`pastikanMaster`).
2. **`/api/pengurus/audit` dijaga `pastikanAdmin`** (`rute.js:514`) sedangkan panelnya
   master-only — jejak audit (IP, username, aksi) bisa dibaca role `pengurus` via API.
   Pertimbangkan `pastikanMaster`.
3. Kredensial bawaan `admin/admin123` **aman untuk produksi** — server menolak start bila
   `KCI_ADMIN_PASSWORD` lemah (`server/src/index.js:98-102`). Sudah benar; dipertahankan.
4. `PanelKelolaAdmin.hapus` memakai `window.confirm` (`Pengaturan.jsx:113`) — bertentangan
   dengan pola `Modal` yang didokumentasikan `ui.jsx` ("pengganti window.confirm").
5. Input password di form Tambah Admin / Edit memakai `type="text"` (`Pengaturan.jsx:187`,
   `:283`) — password baru terlihat di layar; pastikan ini disengaja.

## D. Data & teks (halaman publik Pengurus)

1. `src/halaman/TentangKami/StrukturGrupCatur/dataPengurus.js:81` — `negara: "Palestine"`
   (Inggris) di antara entri `"Indonesia"`; ikut tampil apa adanya di halaman berbahasa
   Indonesia. Harusnya "Palestina" (atau dipetakan lewat i18n).
2. `dataPengurus.js` — field `label` per kelompok tidak pernah dipakai (judul memakai
   `t("pengurus.peran.*")`). Data mati; boleh dihapus.
3. `PanelKonten.jsx:779-782` — empty-state menyebut tombol "+Berita baru" yang sebenarnya
   berada **di dalam dropdown status** (bukan tombol terlihat), dan pesan "Belum ada berita"
   juga muncul saat hasil filter/pencarian kosong (menyesatkan). Termasuk "Halaman 1 dari 0"
   saat daftar kosong (baris 800-802).

## E. Yang sudah baik (tidak perlu diubah)

- `npm run build` bersih; uji backend (138), skema, JWT (24), dan i18n (2081 kunci) lulus.
- Lapisan auth: JWT + verifikasi server di `ProtectedRoute` sebelum render, penanganan
  401/403/429 + pemulihan CSRF otomatis di `apiPengurus` — solid.
- Pemisahan data pribadi (hash + `data/rahasia/` di-gitignore, `kontakAnggota` hanya lewat
  endpoint pengurus) sesuai janji privasi di PANDUAN-PENGURUS.md.
- Normalisasi HP `62…` membuat tautan `wa.me` di modal kontak benar.
- Focus trap + Escape + restore focus di `Modal`, portal di `MenuAksi`/`Sheet` — rapi.
- Guard "master terakhir tidak bisa dihapus" dan "minimal 1 master" di server sudah ada
  (hanya pesan galatnya yang termasker 500 — lihat #2).

---

## Status perbaikan (13 Sep 2026)

**Semua temuan di atas sudah diperbaiki** pada branch `arena/01a09ad3-chessclub`:

| # | Perbaikan | Berkas yang diubah |
|---|-----------|--------------------|
| 1 | `getRowId: (baris) => baris.id` ditambahkan ke tabel konten → hapus massal memakai id item yang benar | PanelKonten.jsx |
| 2 | Kebijakan password disatukan ke **12 karakter**: `admin-file.js` melempar galat ber-`status 400` (pesan asli sampai ke UI, bukan 500 buta); rute `/ganti-password` memeriksa 12; UI (placeholder, cek klien, teks bantuan) diselaraskan | admin-file.js, rute.js, Pengaturan.jsx |
| 3 | `Pengaturan` menerima prop `kabar` dan merender banner toast yang sama → semua umpan balik di halaman Pengaturan kini terlihat | Dashboard.jsx, Pengaturan.jsx |
| 4 | Sheet "Ubah" Panel Juara ikut mengirim `jenis`; server menambahkan `"jenis"` ke `bolehUbah` + validasi (kunci resmi / teks bebas ≤60, tolak kosong) | PanelJuara.jsx, turnamen.js |
| 5 | CSV audit: nilai per kolom dengan fallback yang relevan saja; `revokeObjectURL` ditunda 4 detik | Audit.jsx |
| 6 | Filter Aksi/Username hanya dikirim saat tombol "Saring"/Enter (state `filterKirim` terpisah dari input) | Audit.jsx |
| 7 | "Hari Ini" (kartu statistik + filter) memakai tanggal **Asia/Jakarta** lewat helper `tanggalWIB()` (pola `en-CA`, sama dengan server) | RiwayatMasuk.jsx |
| 8 | Klik sidebar mereset filter Anggota/Larangan ke "semua" (`pilihTabSidebar`) + panel menyinkronkan `filterAwal` saat ter-mount | Dashboard.jsx, Anggota.jsx, Larangan.jsx |
| 9 | Galat non-field form turnamen ditampilkan sebagai banner `galatUmum` (tidak lagi ditelan karena `GalatApi.galat` default `{}`) | Formulir.jsx |
| 10 | Gagal muat Panel Juara memakai `KotakGalatMuat` + tombol "Coba Lagi"; `gagal` direset tiap muat | PanelJuara.jsx |
| 11 | Predikat `kenaBan()` tunggal → filter "Terverifikasi" tidak lagi memuat akun terblokir | Anggota.jsx |
| 12 | `galatMuat` dipakai: tab Anggota/Larangan menampilkan kotak galat + coba lagi bila muat awal gagal | Dashboard.jsx |
| 13 | Teks usang "username Chess.com dan token" diperbarui ke "username + password"; kolom jadi "Akun Admin"; tautan chess.com/member dihapus dari tabel riwayat | RiwayatMasuk.jsx |
| 14 | Kondisional redundan `return a; return a;` dirapikan (perilaku tetap, komentar diperjelas) | http.js |
| 15 | `salahPanggilan` di-set saat panggilan kosong → border merah benar-benar muncul | Terbit.jsx |
| 16 | Tolak permintaan kode e-book kini memakai Modal konfirmasi | PanelEbook.jsx |
| C1 | `/api/pengurus/ganti-password` dijaga `pastikanMaster` | rute.js |
| C2 | `/api/pengurus/audit` dijaga `pastikanMaster` | rute.js |
| C4 | Hapus admin memakai `Modal` (bukan `window.confirm`) | Pengaturan.jsx |
| C5 | Input password tambah/ubah admin disamarkan (`type=password`) + tombol "Lihat password" | Pengaturan.jsx |
| D1 | Nama negara dilokalkan per bahasa (`NAMA_NEGARA`; ID: "Palestina", EN: "Palestine") | Pengurus.jsx |
| D2 | Field `label` mati dihapus | dataPengurus.js |
| D3 | Empty-state konten membedakan "belum ada data" vs "filter kosong"; pagination `Math.max(1, pageCount)`; teks merujuk dropdown status | PanelKonten.jsx |

**Verifikasi setelah perbaikan:**
- `npm run build` ✓
- `uji:backend` ✓ 138 lulus · `uji:skema` ✓ 9 · `uji-auth-jwt` ✓ 24 · `uji:konfigurasi-keamanan` ✓ · `uji:verifikasi` ✓ 30
- `uji:rute` ✓ 34 rute · `uji:seo` ✓ · `uji:i18n` ✓ 2081 kunci ID = EN
- Uji end-to-end ad-hoc terhadap server uji (17 cek): password pendek → **400 + pesan asli**
  (sebelumnya 500 buta), `audit`/`ganti-password` dgn token role pengurus → **403**,
  ganti password master 13 char → 200 + login ulang berhasil, ubah `jenis` turnamen
  (resmi/bebas/kosong/61 char) → 200/200/400/400, buat+hapus berita dgn id asli → 201/200.

## Ringkasan prioritas

| # | Temuan | Tingkat | Berkas utama |
|---|--------|---------|--------------|
| 1 | Hapus massal konten kirim indeks baris, selalu 404 | **Kritis** | PanelKonten.jsx:537,650 |
| 2 | Kebijakan password 6 vs 12 karakter + galat 500 buta | **Kritis** | Pengaturan.jsx:189,328 · rute.js:538 · admin-file.js:18-28 |
| 3 | Toast tidak tampil di halaman Pengaturan | **Tinggi** | Dashboard.jsx:236-256 |
| 4 | Edit kategori Juara Turnamen hilang diam-diam | **Tinggi** | PanelJuara.jsx:193 · turnamen.js:252 |
| 5 | CSV audit tercemar timestamp + revokeObjectURL dini | **Tinggi** | Audit.jsx:22-33 |
| 6 | Request /audit per ketikan (risiko 429) | Sedang | Audit.jsx:45-66 |
| 7 | "Hari Ini" UTC vs tampilan WIB | Sedang | RiwayatMasuk.jsx:186,215 |
| 8 | Filter basi via sidebar | Sedang | Dashboard.jsx:31,57 |
| 9 | Galat non-field ditelan di form turnamen | Sedang | Formulir.jsx:48-51 |
| 10 | Panel Juara gagal tanpa retry | Sedang | PanelJuara.jsx:132,246 |
| 11-16 | Inkonsistensi kecil & state mati | Ringan | lihat bagian B |
| C1-C2 | Penjagaan endpoint vs UI (ganti-password, audit) | Catatan keamanan | rute.js:514,528 |

## Addendum — status laporan survei eksternal (13 Sep 2026)

Seluruh item laporan survei keamanan/konsistensi pengurus + bug tabel konten
sudah dikerjakan dan diverifikasi dengan test.

| Item | Temuan survei | Status | Implementasi |
|------|---------------|--------|--------------|
| A1 | `/api/pengurus/ganti-password` rawan privilege-escalation (pengurus → master) | ✅ | Handler ditulis ulang jadi **layanan mandiri**: `pastikanAdmin` + `dapatkanAdminDariRequest`; `passwordLama` diverifikasi hanya terhadap kredensial admin yang login (record `admins.json` → bawaan env → tokenAdmin legacy); penyimpanan lewat `ubahAdmin` (role TIDAK pernah berubah); `tulisAdminFile` hanya untuk bootstrap file belum ada; ganti username cek tabrakan (rute.js) |
| A2 | `tulisAdminFile` memaksa `role="master"` saat update admin existing | ✅ | Cabang `idx >= 0` tidak lagi men-set role; master hanya untuk pembuatan admin pertama (admin-file.js) |
| A3 | Ambang password 12 karakter harus sama di semua lapisan | ✅ | `PANJANG_PASSWORD_MIN` + `pastikanPasswordKuat` diekspor dari admin-file.js dan dipakai handler ganti-password (klien sudah 12 sejak perbaikan sebelumnya) |
| A4 | Hash bcrypt diterima sebagai token login (`daftarTokenSah`) | ✅ | Helper `hashBcrypt()`; nilai berprefiks `$2` disaring dari `daftarTokenSah()`, kedua loop legacy `dapatkanAdminDariRequest`, dan fallback `konfigurasi.admin.password`. Pemeriksaan "kredensial dikonfigurasi?" dipisah (`adaKredensialDikonfigurasi`) agar jalur dev-loopback tanpa token tidak terbuka saat password env sudah ter-hash di memori (http.js) |
| A5 | Pencocokan token lintas-username | ✅ | Bila header `X-Admin-User` ada, token hanya dicocokkan dengan admin ber-username itu; loop "token cocok admin mana pun" hanya jalan tanpa header (http.js) |
| A6 | Input password tidak disamarkan | ✅ | Sudah dari ronde perbaikan sebelumnya (type="password" + toggle lihat) |
| B1 | `getRowId` untuk hapus massal | ✅ | Sudah dari ronde sebelumnya; `layarDatabase.jsx` dikonfirmasi aman (tanpa rowSelection) |
| B2 | `colSpan={6}` hardcode pada baris kosong | ✅ | `colSpan={tabel.getVisibleLeafColumns().length}` (PanelKonten.jsx) |
| B3 | Teks kosong/placeholder dirapikan | ✅ | Sudah dari ronde sebelumnya |

### Bug baru yang ditemukan test e2e ronde ini (di luar survei)

| Bug | Gejala | Perbaikan |
|-----|--------|-----------|
| Paginasi panel konten mati | `tampil` (hasil `daftar.filter`) dibuat ulang tiap render → referensi `data` berubah → TanStack v9 meng-auto-reset `pageIndex` tiap render; tombol "Berikutnya" selalu melompat balik ke halaman 1 | `tampil` dibungkus `useMemo([daftar, saring, cari])` (PanelKonten.jsx) |
| Checkbox "Pilih semua" mati di halaman ≥ 2 | `toggleAllPageRowsSelected()` tanpa argumen salah menghitung nilai tujuan di wrapper legacy v9 saat `pageIndex > 0` — klik tidak memilih apa pun | `onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}` — nilai dikirim eksplisit (PanelKonten.jsx) |

### Test

- **Baru** `server/uji/uji-keamanan-admin.mjs` (36 cek; didaftarkan ke `uji:backend`
  dan skrip `uji:keamanan-admin`): unit A4/A5 `dapatkanAdminDariRequest`; alur
  normal login JWT master/pengurus + `/verifikasi` + CRUD admin master-only +
  tokenAdmin legacy; pengurus ganti password sendiri → role tetap pengurus;
  password master sebagai `passwordLama` pengurus → 401; ambil alih username
  `admin` → 400; password 11 karakter / `admin123` → 400; hash bcrypt dari
  `admins.json` sebagai X-Token-Admin/Bearer → 401; master ganti
  password+username → role tetap master. `alat-uji.mjs` kini mengembalikan
  `dirData`.
- **Baru** 2 tes di `tests/e2e/smoke.spec.js`: hapus massal PanelBerita dengan
  sorting turun + paginasi (assert id `berita-01/02` yang terkirim, bukan
  indeks) dan hapus massal PanelPengumuman dengan kolom "Gambar" disembunyikan
  (assert 12 id + baris kosong `colspan=5`).
- Hasil: `uji-keamanan-admin` 36/36 · `uji-backend` 138/138 · `uji-ebook` 17/17 ·
  `uji-auth-jwt` 24/24 · `uji-skema` 9/9 · `uji-verifikasi` 30/30 ·
  `uji-konfigurasi-keamanan` 3/3 · Playwright 28 lulus/4 skip (skip = tes
  khusus viewport) · `npm run build` ✓ · `uji:rute` 34 ✓ · `uji:seo` ✓ ·
  `uji:i18n` 2081 kunci ✓.
