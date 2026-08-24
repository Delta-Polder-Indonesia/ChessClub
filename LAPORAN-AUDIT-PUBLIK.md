# LAPORAN AUDIT — FITUR-FITUR PUBLIK

**Tanggal:** 24 Agustus 2026
**Ruang lingkup:** seluruh fitur yang dipakai pengunjung situs — navigasi & tautan, halaman statis, formulir publik (pendaftaran anggota, hubungi kami, pengajuan turnamen), konten hidup (berita, pengumuman, jadwal & klasemen turnamen, keanggotaan & peringkat), aset (e-book, data teka-teki/pembukaan), redirect, dan 404.
**Metode:** penelusuran kode statis + pemindaian integritas tautan otomatis (semua `to=`/`href=` internal terhadap rute `App.jsx`) + pengujian hidup terhadap backend nyata & server dev (33 skenario), dengan API Chess.com tiruan untuk menutup keterbatasan jaringan sandbox.

> Audit pendamping dari `LAPORAN-AUDIT-PENGURUS.md` (area dashboard pengurus).

---

## 1. RINGKASAN EKSEKUTIF

**Kesimpulan utama: tidak ditemukan jalur putus maupun fungsi publik yang belum
terintegrasi. Seluruh formulir publik tersambung ke server, semua tautan internal
menunjuk rute yang ada, dan semua aset publik yang dirujuk benar-benar ada.**

| Bukti | Hasil |
|---|---|
| Pemindaian tautan internal otomatis (menu utama, header, sidebar Beranda, dan semua `to=`/`href=` di seluruh JSX) terhadap 33 rute statis + 2 rute dinamis | ✓ **semua cocok, 0 tautan putus** |
| 33 skenario hidup (API publik, formulir, aset) | ✓ **33/33 lulus** |
| `npm run uji:rute` — keselarasan rute ↔ pra-render HTML | ✓ 31 rute publik |
| `npm run uji:i18n` — keselarasan bahasa | ✓ 573 kunci ID = EN; 420 kunci terpakai ada |
| Build produksi | ✓ tanpa error |
| `npm run uji:e2e` (Playwright, 12 skenario alur publik) | ⚠ tidak dapat dijalankan di sandbox — unduhan browser diblokir jaringan; jalankan di komputer lokal |

---

## 2. PETA JALUR FITUR PUBLIK

### 2.1 Navigasi & routing — ✓ BERSIH
- 33 rute statis + 2 rute dinamis (`/media-dan-informasi/berita/:id`,
  `/media-dan-informasi/pengumuman/:id`) terdaftar di `App.jsx`.
- `menu.js` (menu utama), `sidebar.js` (tab Beranda), Header, dan semua tautan
  sebaris di halaman diperiksa otomatis — **tidak ada yang mengarah ke rute
  tidak dikenal**.
- 25 alias lama→baru di `RUTE_REDIRECT` — semua tujuan merupakan rute valid;
  tautan lama tidak menjadi 404.
- Jalur liar → `TidakDitemukan` (halaman 404).
- Area `/pengurus` sengaja tidak ditautkan dari mana pun dan tidak ada di
  `sitemap.xml` — tersembunyi seperti yang dirancang.

### 2.2 Formulir Pendaftaran Anggota + verifikasi — ✓ TERINTEGRASI PENUH

```
/pendaftaran-anggota
  → VerifikasiAkun.jsx     GET /api/auth/cara        → 200 (fallback aman bila server padam)
     jalur 1 (OAuth)       GET /api/auth/chess/mulai → aktif hanya bila OAuth server diisi
     jalur 2 (kode profil) POST /api/auth/kode/minta  → 200
                           POST /api/auth/kode/periksa → 200 {cocok} + tiket bila sah
  → kirim formulir          POST /api/anggota
       ✓ data sah           → 201 (bukti hidup di laporan pengujian)
       ✓ kirim dua kali     → 409 sopan
       ✓ akun tak dikenal   → 404 sopan
       ✓ di luar roster klub → 403 "daftar anggota dulu"
       ✓ isian rusak        → 400 + rincian per-field — persis yang dirender Isian.jsx
  → sukses → cache anggota dibersihkan (segarkanAnggota) → anggota baru
    langsung tampil di tab Keanggotaan DAN halaman Peringkat
    (satu pintu anggotaBersama.js — kedua halaman tidak mungkin beda angka)
  → mode KCI_WAJIB_VERIFIKASI=wajib: server menolak pendaftaran tanpa tiket
    sah (diverifikasi di kode keanggotaan.js — informasi & jalur selaras)
```

### 2.3 Formulir Hubungi Kami — ✓ TERINTEGRASI (rantai penuh terbukti)
Enam field (`nama, email, telepon, organisasi, subjek, pesan`) dikirim lewat
`kirimPesan()` ke `POST /api/pesan` → **201**; pesan terverifikasi sampai ke
panel Pesan Masuk pengurus (rantai ujung-ke-ujung diuji pada audit pengurus).
Validasi server menolak email rusak/pesan terlalu panjang dengan 400 sopan.

### 2.4 Turnamen publik (4 halaman + Beranda) — ✓ TERINTEGRASI

| Jalur | Bukti hidup |
|---|---|
| `GET /api/turnamen` + `?jenis=` / `/api/turnamen/jenis` | 200 |
| Kartu jadwal tiap halaman (DaftarTurnamen) sudah bilingual ID/EN | ✓ |
| Klasemen & klasemen tim: `GET /api/turnamen/:id` | 200 + hasil/klasemen lengkap |
| Turnamen fiktif → 404 sopan (bukan 500) | ✓ |
| Tombol "Daftar sebagai peserta": `POST /api/turnamen/:id/daftar` | 403 terpetakan ke tautan "Daftar menjadi anggota" saat belum lengkap — perilaku memang dirancang |
| Tabel Hasil Turnamen (`TabelHasilTurnamen`) | sumber sama — juara yang diisi pengurus otomatis tampil (terbukti di audit pengurus) |

### 2.5 Keanggotaan & Peringkat — ✓ TERINTEGRASI
`GET /api/anggota` → 200 berisi `elo/foto/ratings/url/daftarPada`; dikonsumsi
lewat satu pintu `anggotaBersama.js` oleh tab Keanggotaan
(`DaftarAnggota`, `TingkatanRating`) dan `/beranda/peringkat` (`Peringkat.jsx`).
Bila backend padam, frontend jatuh ke roster publik api.chess.com — halaman
tetap hidup. Susunan peringkat (berating dulu, tanpa rating tanpa nomor)
ditulis satu kali di `susunPeringkat`.

### 2.6 Berita & Pengumuman publik — ✓ TERINTEGRASI
Daftar (`BeritaKomunitas.jsx`, `Pengumuman.jsx`) dan detail (`DetailKonten.jsx`)
mengambil `GET /api/berita` / `/api/pengumuman` → 200; konten berstatus
"publik" dari dashboard terbukti langsung tampil; id URL-safe.
Detail tak ketemu → pesan sopan, bukan halaman rusak.

### 2.7 Aset & data publik — ✓ SEMUA ADA DAN TERLAYANI 200

| Aset | Rujukan |
|---|---|
| 5 PDF e-book (panduan-dasar, aturan-fide, pembukaan, taktik-strategi, peraturan-komunitas) | seluruh 5 yang didaftarkan `EbookPanduan.jsx` |
| `data/teka-teki.json` (5.486 soal) | `TekaTeki.jsx` |
| `data/buku-pembukaan.json` | `PapanInteraktif.jsx` |
| Foto `images/*.webp` (helper `gambar()` mengonversi jpg/png→webp) | Galeri & hero halaman |
| `sitemap.xml`, `robots.txt` | SEO |

### 2.8 Halaman statis berkonten i18n — ✓
Tentang Kami, Struktur Grup Catur, Program Kami, Sekolah Catur, Teka-teki &
Tips, Pembukaan, Galeri, Buletin, Keberlanjutan (S&K, Kode Etik, FAQ), Karir —
semuanya berkonten terjemahan; kunci i18n terverifikasi lengkap dua bahasa.

---

## 3. TEMUAN (catatan kecil, tanpa jalur putus)

1. **Playwright e2e belum terverifikasi di sandbox** — 12 skenario uji browser
   (navigasi, pencarian, bilingual, pengajuan turnamen, blokir token, formulir
   pendaftaran & kontak, menu mobile) tersedia di `tests/e2e/smoke.spec.js`
   tetapi browser Chromium tak dapat diunduh dari sandbox ini.
   *Saran:* jalankan `npm run uji:e2e` di komputer lokal sebelum rilis berikutnya.
2. **Dependensi eksternal TekaTeki** pada `tablebase.lichess.ovh` — bila layanan
   itu padam, fitur petunjuk tablebase nonaktif tetapi halaman tetap jalan
   (sudah ada keadaan gagal anggun). Tidak perlu tindakan.
3. ~~Akurasi sinkronisasi juara bergantung input pengurus~~ — **SUDAH DIUBAH
   (24 Agustus 2026 atas permintaan pemilik):** tab Beranda "Daftar Juara"
   (`src/halaman/Beranda/DaftarJuara.jsx`) sekarang merender komponen
   `TabelHasilTurnamen` yang sama persis dengan tabel di halaman `/turnamen` —
   konten statis lama dihapus. Data (selesai / punya juara, bukan batal,
   terbaru dulu) kini hidup dan selalu sinkron dengan input dashboard;
   rantai "pengurus isi juara → tampil di tab Daftar Juara" sudah diverifikasi
   hidup (set juara via API pengurus → baris juara langsung muncul di API
   publik yang dirender tab tersebut).

---

## 4. JAWABAN RINGKAS

- Apakah jalur publik benar sesuai fungsi? **Ya — peta §2, semua terverifikasi
  hidup 33/33 dan tautan internal 0 putus.**
- Ada bagian yang terlewatkan/belum terintegrasi? **Tidak.** Yang perlu
  dilakukan hanya menjalankan `npm run uji:e2e` di lingkungan yang bisa
  mengunduh browser (jiwa pengujian browser end-to-end).
- Terminal bersih? **Ya** — build, uji rute, dan uji i18n semua hijau tanpa error.
