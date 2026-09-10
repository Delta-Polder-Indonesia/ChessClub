# Audit Keadaan Muat (Loading) & Keadaan Galat (Error)

Tanggal: 2026-09-09 · Basis: commit `fb46dbf` pada cabang `arena/01a0886f-chessclub`
Diperbarui: 2026-09-10 — temuan P1, P2, dan uji injeksi kegagalan **sudah ditindaklanjuti**
(lihat §9).

Dokumen ini adalah hasil audit menyeluruh atas **keadaan memuat** dan **keadaan galat**
seluruh permukaan yang mengambil data secara asinkron (API backend, API pihak ketiga,
berkas statis `/data/*.json`, chunk lazy). Tujuannya: memetakan apa yang sudah baik,
menemukan celah, dan menyiapkan daftar perbaikan berprioritas.

---

## 1. Ringkasan

Aplikasi ini **sudah memiliki fondasi yang kuat**: placeholder Suspense berlapis,
ErrorBoundary akar, hook data tunggal (`useAnggota`) dengan stale-while-revalidate,
serta penanganan galat bertahap di Analisa. Namun audit menemukan **4 temuan Prioritas-1**
dan sejumlah temuan Prioritas-2/3, terutama:

1. Pesan galat mentah dari browser bisa tampil ke pengunjung publik (kegagalan jaringan).
2. Panel dashboard pengurus menampilkan keadaan "kosong" yang menyesatkan setelah gagal muat.
3. Tab utama dashboard menjadi kosong tanpa tombol coba lagi saat muat awal gagal.
4. Tombol "Coba Lagi" ErrorBoundary tidak efektif (error yang sama langsung terulang).

---

## 2. Cakupan & metode

- Seluruh berkas `src/**` yang memanggil `fetch()` atau pembungkusnya di `src/lib/api/*`
  diperiksa satu per satu, beserta render keadaan memuat/gagal/kosongnya.
- Infrastruktur bersama (Loading, ErrorBoundary, `useAnggota`, ProtectedRoute,
  PlaceholderHalaman/Artikel/LayarPenuh) dibaca penuh.
- Cakupan uji diperiksa: `tests/e2e/smoke.spec.js`, `scripts/uji-i18n.mjs`.
- Tidak ada kode yang diubah dalam audit ini.

---

## 3. Inventaris infrastruktur bersama

| Primitif | Berkas | Peran | Catatan |
| --- | --- | --- | --- |
| `LoadingSpinner` | `src/components/Loading.jsx` | Spinner + label | dipakai ProtectedRoute |
| `PlaceholderHalaman` | `src/components/Loading.jsx` | Fallback Suspense rute publik | sadar `#boot-hero` (tanpa kedip) |
| `PlaceholderArtikel` | `src/components/Loading.jsx` | Fallback tab Beranda | hero + sidebar tetap terpasang |
| `PlaceholderLayarPenuh` | `src/components/Loading.jsx` | Fallback rute tanpa kerangka (Pengurus) | |
| `ErrorBoundary` | `src/components/ErrorBoundary.jsx` + `src/main.jsx` | Penangkap error render akar | lihat temuan E-4 |
| `GalatApi` / `GalatPendaftaran` | `src/lib/api/core.js` | Error terstruktur (status, galat per ruas) | |
| `useAnggota()` | `src/lib/anggotaBersama.js` | Satu pintu data anggota: status `memuat/siap/menyegarkan/gagal`, cache localStorage, dedupe, `muatUlang()` | pola terbaik di repo |
| `ProtectedRoute` | `src/components/ProtectedRoute.jsx` | `memeriksa/galat/tanpa-akses` + Coba lagi | membedakan 401/403 vs 5xx |

---

## 4. Matriks audit per permukaan

Legenda: ✓ ada · ✗ tidak ada · ⚠ bermasalah · — tidak relevan

| Permukaan | Berkas | Loading | Galat | Kosong | Coba lagi | i18n |
| --- | --- | --- | --- | --- | --- | --- |
| Jadwal Beranda | `halaman/Beranda/Beranda.jsx` | ✓ | ✓ | ✓ | ✗ | ✗ hardcode ID |
| Rangkuman Pengumuman | `halaman/Beranda/RangkumanPengumuman.jsx` | ✓ | ✓ | ✓ | ✗ | ✗ |
| Berita Komunitas | `halaman/MediaDanInformasi/BeritaKomunitas.jsx` | ✓ | ⚠ E-1 | ✓ | ✗ | ✗ |
| Pengumuman | `halaman/MediaDanInformasi/Pengumuman.jsx` | ✓ | ⚠ E-1 | ✓ | ✗ | ✗ |
| Detail berita/pengumuman | `halaman/MediaDanInformasi/DetailKonten.jsx` | ✓ | ⚠ E-1 | — | ✗ | sebagian |
| Peringkat | `halaman/Beranda/Peringkat.jsx` | ✓ + "menyegarkan" | ✓ | ✓ | ✓ "Muat ulang" | ✗ |
| Keanggotaan (tabel) | `.../Keanggotaan/DaftarAnggota.jsx` | ✓ `t()` | ✓ `t()` + pesan | ✓ `t()` | ✗ (tanpa `muatUlang`) | ✓ |
| Jadwal turnamen | `components/DaftarTurnamen.jsx` | ✓ KATA id/en | ✓ | ✓ | ✗ | ✓ kamus lokal |
| Klasemen (dalam kartu) | `components/DaftarTurnamen.jsx` | ⚠ L-2 | ⚠ L-2 | ✓ | ✗ | ✓ |
| Tabel hasil turnamen | `components/TabelHasilTurnamen.jsx` | ✓ KATA | ✓ | ✓ | ✗ | ✓ kamus lokal |
| Teka-Teki | `halaman/TekaTeki/TekaTeki.jsx` | ✓ animate-pulse | ✓ | ✓ | ✗ | ✓ |
| Teka-Teki Rush | `halaman/TekaTekiRush/TekaTekiRush.jsx` | ✓ | ✓ | ✓ | ✗ | ✓ |
| Papan peringkat Rush | `halaman/TekaTekiRush/TekaTekiRush.jsx` | ✓ | ✓ "offline" (beda dari kosong) | ✓ | ✓ via `segar` | ✓ |
| Papan Interaktif | `halaman/PapanInteraktif/PapanInteraktif.jsx` | ✓ + kerangka | ✓ | — | ✗ | ✓ |
| Artikel Wikipedia (papan) | `PapanInteraktif.jsx` (status `memuat/gagal`) | ✓ | ✓ | — | ✗ | ✓ |
| Pembaca PDF | `components/PembacaPdf.jsx` | ✓ + progres % | ✓ | — | ✓ + buka tab baru + unduh | ✗ |
| Verifikasi akun | `components/VerifikasiAkun.jsx` | ✓ `sibuk` | ✓ `pesan` | — | ✓ | ✓ |
| Formulir Pendaftaran | `halaman/PendaftaranAnggota/…` | ✓ `mengirim` | ✓ per-ruas + `role` aria | ✓ sukses | ✓ | ✓ |
| Formulir Hubungi Kami | `halaman/HubungiKami/HubungiKami.jsx` | ✓ `sedangMengirim` | ✓ `role="alert"` + aria | ✓ sukses | ✓ | ✗ |
| Gerbang login pengurus | `halaman/Pengurus/Gerbang.jsx` | ✓ `sibuk` | ✓ 401/429/CORS spesifik | — | ✓ | — (admin) |
| ProtectedRoute | `components/ProtectedRoute.jsx` | ✓ | ✓ + Coba lagi | — | ✓ | — |
| Analisa (impor partai) | `halaman/Analisa/komponen/menu/analyze/*` | ✓ bertahap + progres + abort | ✓ bertahap + inline + muat ulang | ✓ | ✓ | ✓ |
| Dashboard pengurus (tab utama) | `halaman/Pengurus/Dashboard.jsx` | ✓ | ⚠ E-3 | ✓ | ✗ | — |
| Panel Pesan | `halaman/Pengurus/Pesan.jsx` | ✓ | ⚠ E-2 (toast 8 dtk) | ⚠ menyesatkan | implisit (pindah tab) | — |
| Panel Berita/Pengumuman | `halaman/Pengurus/PanelKonten.jsx` | ✓ | ⚠ E-2 | ⚠ menyesatkan | implisit | — |
| Panel E-Book | `halaman/Pengurus/PanelEbook.jsx` | ✓ | ⚠ E-2 | ⚠ menyesatkan | ✓ "Segarkan" | — |
| Panel Riwayat Masuk | `halaman/Pengurus/RiwayatMasuk.jsx` | ✓ | ⚠ E-2 | ⚠ menyesatkan | ✓ "Muat Ulang" | — |
| Panel Audit | `halaman/Pengurus/Audit.jsx` | ✓ | ⚠ E-2 | ⚠ menyesatkan | implisit | — |
| Panel Juara | `halaman/Pengurus/PanelJuara.jsx` | ✓ | ✓ inline | ✓ | ✓ | — |
| Kelola admin | `halaman/Pengurus/Pengaturan.jsx` | ✓ | ✓ inline + Coba Lagi | ✓ | ✓ | — |

---

## 5. Temuan

### Prioritas 1 — cacat nyata pada keadaan galat

**E-1. Pesan galat mentah dari browser dapat tampil ke pengunjung publik.**
`src/lib/api/konten.js` hanya membungkus `!res.ok` ("Gagal memuat berita komunitas."),
tetapi **kegagalan jaringan** (`fetch()` melempar `TypeError: Failed to fetch`) lolos
mentah. `BeritaKomunitas.jsx`, `Pengumuman.jsx`, dan `DetailKonten.jsx` merender
`e.message` apa adanya — pengunjung bisa melihat teks Inggris teknis dari browser.
Bandingkan: `lib/api/anggota.js` sudah membungkus dengan fallback roster publik +
pesan akhir yang ramah, dan `rekorRush.js` sudah memberi pesan baku.

**E-2. Panel pengurus menampilkan keadaan "kosong" yang menyesatkan setelah gagal muat.**
`Pesan.jsx` (+248), `PanelKonten.jsx` (+341), `PanelEbook.jsx` (+340, +422),
`RiwayatMasuk.jsx` (+375), dan `Audit.jsx` (+143) hanya menampilkan toast
`beriTahu(e.message, "galat")` selama 8 detik, lalu tabel kosong dirender sebagai
"Belum ada pesan masuk" / "Belum ada kode" / dst. — seolah-olah tidak ada data,
padahal permintaan gagal. Pola yang benar **sudah ada di repo** dan tinggal ditiru:
`PanelJuara.jsx` (+69, +211: status `gagal` inline) dan `Pengaturan.jsx`
PanelKelolaAdmin (+128: galat inline + tombol "Coba Lagi").

**E-3. Tab utama dashboard menjadi kosong saat muat awal gagal.**
`Dashboard.jsx` (+331): `memuat && !ringkas ? "Memuat…" : (ringkas && <RingkasanDashboard/>)`.
Bila `muatUlang()` awal gagal, `memuat=false` dan `ringkas=null` → area konten
merender `null`; hanya toast 8 detik. Tidak ada tombol coba lagi (pengguna harus
muat ulang seluruh halaman). Tab Anggota/Larangan juga mewarisi `anggota`/`hitam`
yang kosong dari kegagalan yang sama.

**E-4. Tombol "Coba Lagi" ErrorBoundary tidak efektif.**
`ErrorBoundary.jsx` `handleReset` hanya mengosongkan state. Tanpa perubahan rute,
render ulang subtree yang sama melempar error yang sama → boundary menangkap lagi →
tampilan yang sama (loop tanpa jalan keluar). Perlu aksi nyata: navigasi ke `/`
atau `window.location.reload()`. Boundary ini juga tidak sadar-i18n (hardcode
Indonesia) karena berada di luar `I18nProvider` — dapat diterima, tapi patut dicatat.

### Prioritas 2 — celah keadaan memat ulang & kosistensi

**L-1. Hampir semua kegagalan muat konten publik tanpa tombol coba lagi.**
Pengguna harus menekan F5. Pengecualian yang sudah baik: Peringkat ("Muat ulang"),
PembacaPdf, Analisa, ProtectedRoute, PanelEbook/RiwayatMasuk (tombol segarkan).
Halaman yang belum punya: jadwal Beranda, RangkumanPengumuman, Berita, Pengumuman,
DetailKonten, DaftarTurnamen + Klasemen, TabelHasilTurnamen, TekaTeki, TekaTekiRush,
PapanInteraktif.

**L-2. Klasemen memakai string milik "jadwal".**
`DaftarTurnamen.jsx` `Klasemen` (+111–124) memakai `k.memuat`/`k.gagal`
("Memuat jadwal…" / "Jadwal sedang tidak dapat dimuat…") untuk kegagalan
`ambilSatuTurnamen(id)` — teks menyesatkan pembaca (yang gagal adalah klasemen).

**I-1. String loading/error/kosong di-hardcode bahasa Indonesia pada halaman dwibahasa.**
Situs punya sakelar id/en dan `scripts/uji-i18n.mjs` menjaga paritas kamus, tetapi
string keadaan berikut di luar kamus (pengguna bahasa Inggris melihat campuran):
`Beranda.jsx` (+58, +79), `RangkumanPengumuman.jsx` (+39, +42), `BeritaKomunitas.jsx`
(+34, +37), `Pengumuman.jsx` (+34), `DetailKonten.jsx` (+88), `Peringkat.jsx`
(+244–260), `HubungiKami.jsx` (+102–111, +175), `PembacaPdf.jsx` (+278, +286),
`ModalUnduhEbook.jsx`. Kamus `keanggotaan` dan `tekaTeki`/`tekaTekiRush`/`papan`
sudah membuktikan pola yang benar (`memuat`, `gagal`, `kosongKlub`, `menyegarkan`).
Catatan: `uji-i18n` hanya memeriksa kunci yang **dipakai** `t()` — string yang belum
dimigrasi tidak terdeteksi.

### Prioritas 3 — minor / catatan

- **M-1.** `useAnggota()`: bila penyegaran latar belakang gagal saat data lama masih
  ada, status diam-diam kembali `"siap"` — pengguna tidak diberi tahu datanya mungkin
  basi (berdebat apakah ini disengaja; paling tidak `diperbaruiPada` tidak berbohong).
- **M-2.** `Dashboard.jsx`: `pindai-otomatis` (+119) dan polling notifikasi (+138)
  menelan galat diam-diam (`catch(() => {})`). Sadar-desain untuk polling; pantau
  bila jadi sumber kebingungan.
- **M-3.** Skeleton hanya ada di PapanInteraktif (`Kerangka`); permukaan lain
  memakai teks "Memuat…". Konsisten dengan gaya korporat minimalis — opsional untuk
  tabel besar (Peringkat, jadwal) guna menghindari layout shift.
- **M-4.** `DaftarTurnamen`/`TabelHasilTurnamen` memakai kamus `KATA` lokal id/en,
  bukan kamus pusat — duplikasi pola terjemahan (berfungsi, hanya soal konsistensi).

---

## 6. Yang sudah baik (jangan diregresi)

1. **Penjaga race-condition konsisten** — flag `hidup`/`batal`/`aktif` pada semua
   `useEffect` pengambil data; `DaftarTurnamen` me-reset state saat `jenis` berganti.
2. **Stale-while-revalidate anggota** (`anggotaBersama.js`): tampil instan dari
   localStorage, penyegaran latar, jawaban kosong tidak menghapus daftar lama,
   dedupe permintaan serentak, TTL 5 menit.
3. **Degradasi anggun**: `jenisTurnamen().catch(() => ({}))` di Beranda;
   `caraVerifikasi().catch(() => default)` di VerifikasiAkun; fallback roster
   Chess.com publik di `ambilDaftarAnggota`; mode "offline" berbeda dari "kosong"
   di PapanPeringkat Rush.
4. **ProtectedRoute** membedakan 401/403 (buang token) dari 5xx/jaringan (jangan
   tendang pengguna keluar dashboard) — keputusan yang tepat.
5. **Analisa**: fase memuat bertahap + `AbortController`, galat inline
   terkategori (pengguna/batas/jaringan) + muat ulang.
6. **Aksesibilitas formulir**: `role="alert"`, `aria-invalid`, `aria-describedby`
   di Pendaftaran & Hubungi Kami; tombol kirim `disabled` saat `sibuk`.
7. **Pesan galat Gerbang** menjelaskan penyebab infrastruktur (CORS/env) —
  sangat membantu operator.

---

## 7. Cakupan pengujian saat ini

- `tests/e2e/smoke.spec.js` (317 baris): navigasi publik, sakelar bahasa EN,
  klasemen turnamen, pengajuan peserta, tolak login 401, login/logout pengurus,
  validasi lokal + kirim Pendaftaran & Hubungi Kami dengan API tiruan.
- **Belum ada** uji yang memaksa kegagalan muat (`route.abort()` / status 500 /
  respons rusak) lalu meng-asersi UI keadaan galat/kosong muncul dengan benar.
- `scripts/uji-i18n.mjs` menjaga paritas kamus & kunci terpakai — tidak melihat
  string hardcode di luar `t()` (lihat I-1).

---

## 8. Rekomendasi perbaikan (usulan urutan)

1. **[E-1]** Bungkus galat jaringan di `lib/api/konten.js` dengan pesan ramah
   (contoh pola: `rekorRush.js`), dan hindari merender `e.message` mentah di
   Berita/Pengumuman/DetailKonten.
2. **[E-2, E-3]** Tambah status galat inline + tombol "Coba Lagi" pada panel
   pengurus (Pesan, PanelKonten, PanelEbook, RiwayatMasuk, Audit) dan tab utama
   Dashboard — tiru pola PanelJuara/PanelKelolaAdmin.
3. **[E-4]** ErrorBoundary: tombol utama memuat ulang halaman / kembali ke `/`.
4. **[L-1, L-2]** Tambah tombol "Muat ulang" pada keadaan galat publik; beri
   string tersendiri untuk Klasemen.
5. **[I-1]** Migrasi string keadaan yang hardcode ke kamus id/en + kunci baru
   (`memuat`/`gagal`/`kosong`) per kelompok halaman.
6. **[Uji]** Tambah kasus e2e: `route.abort()` pada `/api/berita`, `/api/anggota`,
   `/api/pengurus/ringkasan` → asersi pesan galat + tombol coba lagi bekerja.

---

## 9. Status tindak lanjut (2026-09-10)

Semua butir §8 diterapkan pada cabang kerja ini. Ringkasan diff:

| Temuan | Perbaikan | Berkas |
| --- | --- | --- |
| E-1 | `fetchApi()` di `core.js` mengganti kegagalan transport (TypeError "Failed to fetch") dengan `GalatApi` pesan ramah; dipakai semua modul API publik (`konten`, `pesan`, `ebook`, `verifikasi`, `turnamen`, POST `anggota`) dan `apiPengurus` (toast dashboard tidak lagi menampilkan teks mentah browser). `loginAdmin` sengaja tidak dibungkus — deteksi CORS di Gerbang memerlukan TypeError asli. | `src/lib/api/core.js`, `konten.js`, `pesan.js`, `ebook.js`, `verifikasi.js`, `turnamen.js`, `anggota.js`, `pengurus.js` |
| E-1 + I-1 | Berita/Pengumuman/DetailKonten tidak lagi merender `e.message` mentah; memakai kunci kamus `berita.*`/`pengumuman.*`/`media.tidakDitemukan`. | `halaman/MediaDanInformasi/*.jsx` |
| E-2 | Komponen bersama `KotakGalatMuat` (pesan permanen + tombol "Coba Lagi") dipasang di Pesan, PanelKonten, PanelEbook, RiwayatMasuk, dan Audit — kegagalan muat tidak lagi menyamar sebagai keadaan kosong. | `halaman/Pengurus/ui.jsx` + 5 panel |
| E-3 | Tab utama Dashboard: kotak galat + "Coba Lagi" (`muatUlang`) saat muat awal gagal; area konten tidak lagi blank. Galat 401/403 tetap ditangani `tanganiGalat`. | `halaman/Pengurus/Dashboard.jsx` |
| E-4 | ErrorBoundary: tombol "Muat Ulang Halaman" (`window.location.reload()`) + tautan "Kembali ke Beranda". | `components/ErrorBoundary.jsx` |
| L-1 | Tombol "Coba lagi" (pola `percobaan` seperti PembacaPdf) pada: jadwal Beranda, RangkumanPengumuman, Berita, Pengumuman, DetailKonten, DaftarTurnamen + Klasemen, TabelHasilTurnamen, TekaTeki, TekaTekiRush, PapanInteraktif. | masing-masing halaman |
| L-2 | Klasemen memakai string sendiri (`memuatKlasemen`/`gagalKlasemen`, id/en), bukan meminjam string jadwal. | `components/DaftarTurnamen.jsx` |
| I-1 | Kunci kamus baru: `common.cobaLagi`; grup `beranda.*` (jadwal/rangkuman/peringkat); `berita/pengumuman.{memuat,gagal,kosong}`; `media.tidakDitemukan`; `hubungi.{terkirimJudul,terkirimIsi,tulisLagi,galatJudul,galatKirim,mengirim}`; grup `pembacaPdf.*` dan `unduhEbook.*` (keadaan pembaca PDF + popup unduh e-book, termasuk aria-label). Paritas ID/EN dijaga `uji-i18n`. | `lib/terjemahan/{id,en}/*` |
| Uji | 3 uji e2e injeksi kegagalan (500 → pesan galat → tombol coba lagi → pemulihan tanpa reload): berita, peringkat anggota (termasuk cekat fallback roster Chess.com), ringkasan dashboard. Uji jsdom PembacaPdf diperbarui membungkus `I18nProvider`. | `tests/e2e/smoke.spec.js`, `scripts/uji-ebook-pembaca.mjs` |

Verifikasi lokal: `npm run build`, `npm run uji`, `npm run uji:backend`,
`npm run uji:verifikasi` — semua hijau. `npm run uji:e2e` dijalankan CI
(browser Playwright tidak dapat diunduh di lingkungan sandbox).

Sisa yang disengaja tidak diubah (lihat §5 P3): badan teks modal unduh e-book
(label isian, kalimat penjelasan tab) masih Indonesia; judul seksi & kepala tabel
Beranda/Peringkat belum dimigrasi (bukan string keadaan); skeleton tabel (M-3)
dan kebisuan penyegaran latar `useAnggota` (M-1) dibiarkan sebagai keputusan desain.
