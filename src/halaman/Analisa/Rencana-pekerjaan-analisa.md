# Rencana Pekerjaan — Analisa

Dokumen rencana kerja untuk halaman **Analisa** (`src/halaman/Analisa/`).
Status pembaruan mengikuti perkembangan sesi. Ditulis oleh asisten, direview
oleh pemilik proyek sebelum dieksekusi.

---

## 1. Ringkasan

Rencana ini berisi daftar pekerjaan pada halaman Analisa, lengkap dengan konteks,
keputusan desain, dan detail teknis. Tiap butir pekerjaan diprioritaskan dari yang
paling mendesak/bermanfaat ke yang opsional.

---

## 2. Pekerjaan Aktif: "Cache Sesi" untuk Unduhan Partai

### 2.1 Latar Belakang

Saat ini seluruh partai yang diunduh dari Chess.com (dan platform lain) disimpan
permanen ke **IndexedDB peramban** setiap pengunjung lewat `basisData.js`
(alias `simpanBanyakPartai`). Akibatnya:

- Data akun yang pernah dicari menumpuk di perangkat pengunjung tanpa batas.
- Tidak ada pembersihan otomatis; pengguna juga tidak sadar datanya tersimpan.
- Ke arah depan (jika cache bersama ke GitHub/jsonbin direalisasikan), tumpukan
  data ini akan membebani "server bersama" — jadi kebiasaan bersih cepat harus
  dibangun sejak sekarang.

### 2.2 Keputusan Desain (sudah disepakati lewat diskusi)

1. **Unduhan otomatis (Chess.com/Lichess) = cache sesi saja.** Data ada selama
   sesi analisa berlangsung, lalu **dihapus otomatis** setelah pengguna selesai /
   keluar dari halaman Analisa.
2. **Bukan popup nagging.** Peringatan hanya **1 kali per browser** (flag di
   localStorage), bersifat informatif, dengan opsi "Jangan tampilkan lagi".
3. **Impor PGN manual tetap permanen.** Itu disengaja oleh pengguna, tidak
   ikut dihapus.
4. **Fallback aman.** Data tidak pernah dihapus di tengah sesi analisa aktif;
   pembersihan hanya terjadi saat selesai/keluar, atau saat sesi lama diketahui
   sudah mati (tab ditutup paksa).

### 2.3 Detail Teknis

#### Lapisan 1 — Tandai koleksi unduhan sebagai "sesi"

- **Berkas:** `src/halaman/Analisa/komponen/menu/analyze/selectChessCom.jsx`
  (+ berkas pemilih Lichess bila disepakati, lihat §2.4).
- Setelah `simpanBanyakPartai` sukses, daftarkan `koleksiId`
  (`chessCom:{username}`) ke daftar *cache sesi_.
- Daftar *cache sesi* disimpan juga di **sessionStorage** supaya:
  - tetap ada jika tab ditutup paksa (IndexedDB transaksi tak dapat diandalkan
    di `beforeunload`),
  - bisa "disapu" pada kunjungan berikutnya.
- Titik daftar: modul ini (mis. `basisData.js`) memiliki fungsi:
  - `tandaiKoleksiSesi(koleksiId)` — menambah id ke Set + sessionStorage,
  - `daftarKoleksiSesi()` — membaca Set/sessionStorage,
  - `bersihkanKoleksiSesi()` — memanggil `hapusKoleksi` untuk semua id bertanda,
    lalu membersihkan Set + sessionStorage.

#### Lapisan 2 — Auto-bersih

- **Titik pembersihan:**
  1. Saat halaman Analisa **unmount** (keluar halaman) → panggil
     `bersihkanKoleksiSesi()`.
  2. Saat halaman Analisa **mount** (pertama dibuka) → sapu sisa sesi lama
     dari sessionStorage, lalu panggil `bersihkanKoleksiSesi()`.
- `bersihkanKoleksiSesi()` idempoten & aman dipanggil berkali-kali
  (cek `Set` kosong → langsung selesai).
- Fallback: jika pembersihan gagal (IndexedDB diblokir, dll.) → biarkan data,
  tidak melempar galat.

#### Lapisan 3 — Popup info sekali saja

- **Berkas baru:** komponen kecil (mis. `komponen/nav/infoCacheSesi.jsx`).
- Ditampilkan sekali per browser: key localStorage
  `kci-analisa-info-cache-sesi` (nilai `1`/`0`, format konsisten dengan
  `src/halaman/Analisa/penyimpanan.js`).
- Isi (bahasa mengikuti i18n, lihat kamus di `src/lib/terjemahan.id.js`
  dan `terjemahan.en.js`):
  - Judul: kira-kira "Pembersihan otomatis partai".
  - Isi: "Partai dari Chess.com disimpan sementara di perangkatmu dan otomatis
    dihapus setelah sesi analisa selesai — menjaga penyimpanan dan kecepatan
    buat semua orang."
  - Tombol: **Mengerti** + kotak centang **Jangan tampilkan lagi**.
- Titik tampil: saat pertama membuka Analisa, atau pas unduhan pertama
  (`SelectChessComGame` / pemilih Lichess), sesuai hasil demo.

### 2.4 Keputusan yang Belum Final (tunda sampai konfirmasi pemilik)

- **Cakupan cache-sesi**: hanya **Chess.com**, atau **Lichess juga**?
  (Saran: dua-duanya biar konsisten.)
- Apakah kolom/UI perlu menampilkan indikator "disimpan sementara"?

### 2.5 Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Data terhapus saat pengguna masih ingin menganalisis | Pembersihan hanya saat keluar/unmount atau sesi terbukti mati |
| Tab ditutup paksa → IndexedDB transaksi tak sempat jalan | Penanda di sessionStorage disapu pada kunjungan berikutnya |
| Situs berjalan di banyak tab | `bersihkanKoleksiSesi` idempoten; hanya koleksi bertanda sesi |
| Pengguna bingung data koleksi "hilang" | Popup info sekali + (opsional) indikator "sementara" |

### 2.6 Kriteria Selesai

- [ ] Unduhan Chess.com (dan Lichess bila disepakati) bertanda *cache sesi*.
- [ ] Keluar dari Analisa → koleksi bertanda otomatis terhapus.
- [ ] Tab ditutup paksa → sisa dibersihkan saat Analisa dibuka lagi.
- [ ] Popup info muncul maksimal 1× per browser, bisa di-"Jangan tampilkan lagi".
- [ ] Impor PGN manual tetap tersimpan permanen.
- [ ] Tidak ada galat / tidak mengganggu alur analisa.
- [ ] Verifikasi build di akhir sesi (tanpa `npm run dev`).

---

## 3. Catatan Bersejarah (pekerjaan yang sudah selesai)

- **Suara toggle "Suara papan"** → bunyi `soundcheck` saat dihidupkan
  (Papan Interaktif + Teka-Teki); checkbox di panel pengaturan sengaja **senyap**.
- **Pengecekan data partai di Analisa**: dikonfirmasi data diunduh lewat
  `api.chess.com` (format JSON, isi inti `pgn` berformat teks PGN).