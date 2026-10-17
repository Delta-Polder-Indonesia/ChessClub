# PRD — Halaman Landing Publik (As-Is)

**Produk:** Komunitas Catur Indonesia (KCI) / Blunder Skuad
**Tanggal:** 2026-10-18 · **Status:** Dokumentasi kondisi berjalan (as-is) — acuan kerja perbaikan berikutnya
**Cakupan:** seluruh halaman publik/pemasaran **tanpa** alat interaktif (lihat §3)
**Sumber kebenaran terkait:** `PRODUCT.md` (produk & pengguna), `DESIGN.md` (token desain), `PANDUAN-SEO.md`, `docs/AUDIT-BAGIAN-6-PROGRAM-KAMI.md` (audit sub-halaman Program Kami)

> Dokumen ini **hanya mendokumentasikan apa yang ada di basis kode hari ini** — tujuan, struktur, fitur, alur, sumber data, dan acceptance criteria sebagai kontrak perilaku. Setiap klaim bisa dicek ke berkas sumber yang disebut. Tidak ada usulan fitur baru di dokumen ini; gap yang sudah diketahui dicatat apa adanya di §10.

---

## 1. Tujuan Dokumen

1. Menjadi acuan tunggal (PRD as-is) untuk semua halaman landing publik sebelum pekerjaan perbaikan/redesign dimulai.
2. Mengunci perilaku yang sudah benar sebagai acceptance criteria regresi, lengkap dengan pintu kualitas (uji) yang menguncinya.
3. Menyamakan pemahaman cakupan: halaman mana yang termasuk "landing pages", halaman mana yang bukan.

## 2. Konteks Produk (ringkas)

- **Pengguna** (dari `PRODUCT.md`): (1) pecatur & komunitas umum yang mencari materi belajar, e-book, teka-teki, dan jadwal turnamen; (2) pemain alat interaktif & analisa; (3) pengurus/penyelenggara. Halaman landing melayani terutama persona (1) dan publik umum dalam mode **Persuade** (meyakinkan calon anggota, peserta, mitra) dan **Read** (membaca artikel/buku).
- **Positioning:** situs resmi komunitas dengan gaya *Editorial Formal / Academic Journal / Restrained Corporate* — tenang, terpercaya, berwibawa, cepat di semua perangkat.
- **Nada suara:** formal, jernih, faktual, tanpa buzzword SaaS; tanpa gradien neon, glow, kartu klise identik, atau klaim palsu.
- **Identitas brand:** "Blunder Skuad" sebagai brand utama; "Komunitas Catur Indonesia" sebagai deskriptor (`src/components/MetaHalaman.jsx`).

## 3. Cakupan

### 3.1 Dalam cakupan (rute publik yang dipra-render & masuk sitemap)

| Grup | Rute | Halaman |
|---|---|---|
| Beranda publik | `/` | Landing |
| Tentang Kami | `/tentang-kami` | Tentang Kami |
| | `/tentang-kami/struktur-grup-catur` | Struktur Grup Catur (3 tab) |
| Program Kami | `/program-kami` | Induk program |
| | `/program-kami/teka-teki` | Landing Teka-teki |
| | `/program-kami/rush-teka-teki` | Landing Rush Teka-teki |
| | `/program-kami/kuis-catur` | Landing Kuis Catur |
| | `/program-kami/manusia-vs-mesin` | Landing Manusia vs Mesin |
| | `/program-kami/pembukaan` | Buku Pembukaan (katalog) |
| | `/program-kami/analisa` | Landing Analisa |
| | `/program-kami/atribusi` | Atribusi & Lisensi |
| | `/program-kami/ebook-panduan` (+ `/ebook-panduan/:id`, `/ebook-panduan/kategori/:kategori`) | Perpustakaan E-book |
| Turnamen | `/turnamen` | Induk turnamen |
| | `/turnamen/turnamen-bulanan`, `/turnamen/turnamen-terbuka`, `/turnamen/liga-musiman`, `/turnamen/liga-antar-komunitas` | 4 sub-halaman |
| Media & Informasi | `/media-dan-informasi` | Induk media |
| | `/media-dan-informasi/berita-komunitas`, `/media-dan-informasi/pengumuman`, `/media-dan-informasi/galeri` | 3 sub-halaman |
| | `/media-dan-informasi/berita/:id`, `/media-dan-informasi/pengumuman/:id` | Detail konten (rute dinamis) |
| Keberlanjutan | `/keberlanjutan` | Induk keberlanjutan |
| | `/keberlanjutan/syarat-dan-ketentuan`, `/keberlanjutan/kode-etik-komunitas`, `/keberlanjutan/pertanyaan-umum` | 3 sub-halaman |
| | `/bantuan`, `/privasi`, `/ketentuan` | Bantuan, Privasi, Ketentuan |
| Keanggotaan | `/pendaftaran-anggota` (+ `/pendaftaran-anggota/:username`) | Pendaftaran Anggota |
| Kontak & Karir | `/hubungi-kami` (+ `/hubungi-kami/:tab`) | Hubungi Kami |
| | `/karir` | Karir |
| Pendukung | `*` | Tidak Ditemukan (404) |

Catatan teknis cakupan (dari `scripts/uji-seo.mjs` & `scripts/uji-rute.mjs`): rute publik **tanpa parameter** dipra-render per rute dan masuk `sitemap.xml`; rute dinamis (`:id`) diserahkan ke fallback SPA dan tidak diuji sebagai rute statis; rute pengalihan (`RUTE_REDIRECT` di `src/App.jsx`) tidak boleh masuk daftar pra-render/sitemap.

### 3.2 Di luar cakupan (halaman non-landing)

- **Alat interaktif:** Teka-teki (`/teka-teki/problem`), Rush (`/teka-teki-rush`), Kuis (`/quiz-catur`), Papan Interaktif (`/papan-interaktif/*` termasuk Manusia vs Mesin, Latihan Repertoar, Hand-Brain, Turing Test, Pengaturan), papan Analisa (`/program-kami/analisa/papan`).
- **Area anggota** `/beranda/*` (hero + sidebar; jadwal turnamen, rangkuman pengumuman, daftar juara, peringkat).
- **Area pengurus** `/pengurus` (Dashboard, `ProtectedRoute`, tanpa navbar/footer publik).

## 4. Persona & Mode Pengunjung (untuk halaman landing)

| Mode | Rute utama | Kebutuhan |
|---|---|---|
| Persuade | `/`, `/tentang-kami`, `/pendaftaran-anggota`, `/karir` | Meyakinkan calon anggota/mitra: profil, program, ajakan bergabung lugas |
| Read | `/program-kami/ebook-panduan`, `/media-dan-informasi/*`, `/keberlanjutan/*` | Kenyamanan baca: lebar teks ideal, tipografi tegas, navigasi jelas |
| Agenda | `/turnamen/*` | Menemukan agenda kompetitif, pendaftaran, hasil/klasemen |

## 5. Kerangka Bersama Seluruh Halaman Landing

Semua halaman dalam cakupan dibangun dari kerangka berikut (requirement lintas halaman):

| Aspek | Implementasi (berkas) | Requirement |
|---|---|---|
| Layout | `components/PageLayout.jsx` | Setiap halaman publik memakai `Header` + `Footer` kecuali daftar `tanpaKerangka` (layar penuh) |
| Cangkang halaman | `components/PageBagian.jsx` (`HalamanIsi`, `PageArtikel`, `MastheadEditorial`) | Judul + deskripsi meta, breadcrumb induk (`parent`/`parentPath`), navigasi "berikutnya" (`next`), submenu opsional (mis. `StickyMenu`) |
| Navigasi | `src/menu.js` + `components/Header.jsx` | `MENU_UTAMA` = peta folder = peta URL; judul menu berupa kunci terjemahan `nav.*`; dropdown Program Kami 2 kolom (`kolom: 4`) |
| Footer | `components/Footer.jsx` | Tautan cepat tetap: Kontak Kami, Kode Etik, Pendaftaran Anggota, Berita, Pengumuman, Program Catur, Turnamen + copyright |
| SEO per halaman | `components/MetaHalaman.jsx` (react-helmet-async) | Judul (`<brand> — <judul>`), deskripsi, `canonical` per rute, `og:type/url/title/description/image` (828×462 default), `twitter:card=summary_large_image`, `robots` |
| Pra-render & meta build | `plugins/performa.js` (`RUTE_PUBLIK`, `META_RUTE`, `RUTE_ALIH`, `RUTE_LATAR_GELAP`) | Setiap rute publik punya entri `META_RUTE` judul+deskripsi sendiri; HTML per rute berbeda dari beranda; kanonikal menunjuk dirinya sendiri |
| Sitemap/robots | `public/sitemap.xml`, `public/robots.txt`, `.well-known/ai-catalog.json` | Sitemap memuat persis rute yang boleh diindeks + `lastmod`; robots tidak memblokir |
| Performa | `React.lazy` semua rute, `lib/prefetch.js` | Bundel awal hanya kerangka; chunk diunduh saat tautan terlihat/di-hover; hero Landing adalah elemen LCP dengan `sumberHero()` + `<link rel=preload>` + `#boot-hero` di `index.html` (828w ponsel / 1280w lebar) |
| i18n | `lib/i18n.jsx` + kamus `src/lib/terjemahan/` | Dua bahasa: Indonesia & Inggris, tombol ganti bahasa di header; sumber ID lebih kaya dari EN (audit terakhir: 2.554 kunci, ID = EN) |
| Desain | `DESIGN.md` | Serif sebagai tipografi default situs; sans (Geist) untuk kontrol UI; palet biru/abu/putih, garis 1px, **tanpa** gradien ungu/pink, teks gradasi, glow; kontras WCAG AA |
| Aksesibilitas | per komponen | Judul `h1` per halaman (Landing memakai `h1.sr-only` karena hero visual murni), label aria pada kontrol, kontras ≥ 4.5:1 body |
| Alih URL lama | `RUTE_REDIRECT` di `src/App.jsx` | Satu tempat untuk semua alias; tautan lama tidak boleh 404 (mis. `/struktur-grup-catur`, `/pengumuman`, sub-halaman Program Kami yang dihapus) |

## 6. Spesifikasi Per Halaman

Format tiap butir: **[FR-xx]** requirement fungsional yang ada, **[AC-xx]** acceptance criteria (perilaku yang harus dipertahankan).

### 6.1 Landing — `/` (`src/halaman/Landing/Landing.jsx`)

**Tujuan:** halaman pertama pengunjung; memperkenalkan komunitas, mengarahkan ke program/alat/keanggotaan.

**Struktur seksi (urutan render):**

1. **Hero carousel** (`LandingHero`) — slide full-width gambar tonggak sejarah (label tahun 2015–2021 dst.), overlay gelap, navigasi garis progress, durasi 7 detik per slide; gambar via `sumberHero()` (elemen LCP).
2. **Maestro Edision** (`MaestroEdision.jsx`) — kerangka dua zona (grid `minmax(0,1fr)_400px`): daftar kartu ber-fan berisi **enam perwakilan pengurus BLUNDER SKUAD** (urutan `KELOMPOK_PENGURUS` — Admin Utama 4, Admin 1, Koordinator Acara 1; pengurus 7–8 tampil di halaman Pengurus) + `aside` contoh di kanan. Nama kartu = username Chess.com, foto = avatar Chess.com (token `80x80o` saja — token lain 404), fallback huruf awal username; box gambar `aspect-video` + `object-contain`.
3. **Testimoni** (`Testimoni.jsx`).
4. **Keberlanjutan** — judul + lead + tombol "Selengkapnya" ke `/keberlanjutan`.
5. **Pustaka / gambar kartu** (`BagianGambarKartu` + `CardGambar` + `CardCarousel`) — karusel gambar dengan *double-buffer crossfade* (gambar berikutnya dimuat dulu sebelum transisi; sampul tetangga di-pramuat), kartu program + e-book (`DAFTAR_EBOOK` dari `halaman/Beranda/ebook-data.js`), navigasi sebelumnya/selanjutnya; memuat CTA "tiga jalan akademi" (`landing.tigaJalanAkademiCta` + `landing.tigaJalanAkademiTerms`).
6. **Kartu Alat Latihan** (`KartuAlatLatihan.jsx`) — **enam kartu alat**, tiap kartu mengarah ke landing alatnya: Teka-teki, Rush Teka-teki, Kuis Catur (`/program-kami/…`), Analisa, Pembukaan, Manusia vs Mesin.
7. **Harapan Pengurus** (`HarapanTerimaKasih`) — foto + nama/jabatan ketua (`landing.ketuaPengurus`, `landing.harapanNama`) + paragraf harapan.
8. **Ajakan Bergabung** (`AjakanBergabung`) — CTA keanggotaan (`landing.ajakan*`).

**Requirement:**

- **[FR-L1]** Hero berganti slide otomatis (7 detik) dengan indikator progres dan kontrol manual.
- **[FR-L2]** Seluruh judul seksi/label/lead memakai gaya bersama `gayaTeks.jsx` (pilot tipografi halaman ini — pengecualian tercatat terhadap skala H2 global `DESIGN.md`; **tidak** berlaku ke halaman lain).
- **[FR-L3]** `MetaHalaman` memakai judul `common.judulBeranda` + deskripsi tetap; `h1` tersembunyi (`sr-only`) berisi nama komunitas.
- **[FR-L4]** `document.title` diatur ulang ke nama komunitas saat mount.
- **[FR-L5]** Enam kartu alat latihan masing-masing menautkan ke landing alatnya (`/program-kami/…`) — pintu masuk utama ke katalog program dari beranda.

**Acceptance criteria:**

- **[AC-L1]** Hero tidak mengunduh gambar dua kali (preload `index.html` dan `sumberHero()` memakai berkas yang sama).
- **[AC-L2]** Tidak ada tampilan "kartu identik tanpa hierarki": hierarki dibangun lewat perbedaan ukuran/posisi, bukan kartu seragam (kontrak anti-AI-slop `PRODUCT.md`).
- **[AC-L3]** `h1` tetap ada untuk pembaca layar & mesin pencari walau hero visual murni.

### 6.2 Tentang Kami — `/tentang-kami` (`TentangKami/TentangKami.jsx`)

**Tujuan:** profil komunitas — jangkar: `#sekilas-komunitas`, `#tonggak-sejarah`, `#visi-misi`, `#makna-logo` (sesuai `menu.js`).

**Struktur:** `HalamanIsi` + `StickyMenu` (submenu lengket), lalu berurutan: `Sekilas` → garis pemisah → `Tonggak` (tonggak sejarah) → `VisiMisi` → garis pemisah → `MaknaLogo` (`components/MaknaLogo.jsx`).

- **[FR-T1]** Empat seksi sesuai item submenu `nav.sekilasKomunitas`, `nav.tonggakSejarah`, `nav.visiMisiNilai`, `nav.maknaLogo`, masing-masing dengan anchor yang bisa dituju langsung dari menu.
- **[FR-T2]** Navigasi "berikutnya" ke `/tentang-kami/struktur-grup-catur`.
- **[AC-T1]** Deep-link `#visi-misi` dll. membawa pengunjung ke seksi yang benar (dipakai dropdown header).

### 6.3 Struktur Grup Catur — `/tentang-kami/struktur-grup-catur` (`StrukturGrupCatur/StrukturGrupCatur.jsx`)

**Tujuan:** satu halaman bertab berisi organisasi komunitas; **Keanggotaan hanya hidup sebagai tab di sini** (`BACA-DULU.md`), bukan halaman publik terpisah.

**Tab (anchor `#pengurus`, `#organisasi`, `#keanggotaan`):**

1. **Pengurus** (`Pengurus.jsx`) — daftar pengurus.
2. **Struktur Organisasi Catur** (`StrukturOrganisasiCatur.jsx`) — bagan/struktur.
3. **Keanggotaan** (`Keanggotaan/Keanggotaan.jsx`) — sub-konten: `TingkatanRating.jsx` (tingkatan rating anggota) dan `DaftarAnggota.jsx` (daftar anggota).

- **[FR-S1]** Tiga tab di satu URL; perpindahan tab memakai hash sehingga bisa dibagikan.
- **[FR-S2]** Tab Keanggotaan memuat Tingkatan Rating dan Daftar Anggota tanpa rute terpisah.
- **[AC-S1]** Rute lama `/struktur-grup-catur` mengarah ke sini lewat `RUTE_REDIRECT`.

### 6.4 Program Kami — `/program-kami` + sub-halaman (`ProgramKami/`)

**Tujuan:** katalog program & alat komunitas; tiap sub-halaman adalah *landing* penjelas yang menautkan ke alatnya (CTA `TombolConten`, `RUTE_ALAT` per halaman).

**Induk (`ProgramKami.jsx`, 161 baris):** satu program sorotan lebar + daftar definisi sekunder; konten dari kamus `program.*`; mengikuti `DESIGN.md` (tanpa kicker/penomoran hiasan/mono "teknis").

**Sub-halaman:**

| Rute | Halaman (berkas) | Isi utama | Mengarah ke |
|---|---|---|---|
| `/program-kami/teka-teki` | `TekaTekiKonten.jsx` | Pengantar + **papan statis posisi soal #1927** ("Mate in Two", rating 1095) dari `public/data/teka-teki.json` | `/teka-teki` |
| `/program-kami/rush-teka-teki` | `RushTekaTekiLanding.jsx` | Penjelas mode berjangka | `/teka-teki-rush` |
| `/program-kami/kuis-catur` | `KuisCaturLanding.jsx` | Penjelas kuis pilihan ganda | `/quiz-catur` |
| `/program-kami/manusia-vs-mesin` | `ManusiaVsMesinLanding.jsx` | Penjelas mode | `/papan-interaktif/manusia-vs-mesin` |
| `/program-kami/pembukaan` | `Pembukaan.jsx` (479 baris) | **Katalog pembukaan** — tabel dapat disortir/difilter (fitur filter kolom, filter global, sortir) di atas 18.713 jalur `public/data/buku-pembukaan.json` (CC0, `lichess-org/chess-openings`) | — (alat di tempat) |
| `/program-kami/analisa` | `AnalisaLanding.jsx` | Penjelas fitur (3 fitur + daftar grade klasifikasi langkah berilustrasi: Brilian, Terbaik, dst.) | `/program-kami/analisa/papan` |
| `/program-kami/atribusi` | `../../halaman/Atribusi/Atribusi.jsx` | Halaman utuh atribusi & lisensi: aset pihak ketiga (gambar bidak, buku pembukaan, engine, suara, logo) + pernyataan non-afiliasi | — |
| `/program-kami/ebook-panduan` | `EbookPanduan.jsx` (527 baris) + `FiturEbook.jsx` + `ModalUnduhEbook.jsx` | Perpustakaan **32 PDF** (`public/ebooks/`), kategori (`kategori/:kategori`), detail per buku (`:id`), **pembaca PDF** (`components/PembacaPdf.jsx`), unduhan ber-tiket sesi (`lib/sesiUnduhEbook.js`) | — (alat di tempat) |

**Requirement:**

- **[FR-P1]** Setiap landing alat punya CTA tunggal yang jelas ke alatnya masing-masing.
- **[FR-P2]** Halaman Pembukaan mendukung pencarian/sortir/filter katalog tanpa rute tambahan.
- **[FR-P3]** E-book: alur unduhan memakai tiket sesi per berkas; tiket kedaluwarsa tidak boleh menghasilkan unduhan gagal (keputusan audit F2, sudah dikerjakan).
- **[FR-P4]** Atribusi adalah halaman utuh, bukan popup — setiap aset pihak ketiga wajib punya entri.
- **[FR-P5]** URL lama berbasis query (`?buku=`, `?kategori=`) dialihkan permanen ke bentuk path/slug (`RuteEbookPanduan`).

**Acceptance criteria:**

- **[AC-P1]** Papan statis Teka-teki menampilkan posisi #1927 persis dari data (bukan digambar manual).
- **[AC-P2]** Katalog pembukaan tetap responsif dengan ribuan baris data (18.713 jalur).
- **[AC-P3]** Pernyataan "KCI tidak berafiliasi dengan Chess.com/lichess.org" tetap tercetak di Atribusi — tidak boleh dilonggarkan (`PRODUCT.md`, kontrak brand).
- **[AC-P4]** Atribusi lengkap untuk: gambar bidak, buku pembukaan (CC0), Stockfish (GPL-3.0), suara papan, logo. **Catatan gap tercatat:** lisensi 5.486 soal teka-teki belum tercatat — jangan mengarang lisensinya.

### 6.5 Turnamen — `/turnamen` + 4 sub-halaman (`Turnamen/`)

**Tujuan:** pintu masuk agenda kompetitif; lima tautan cepat ke layanan internal + artikel kebijakan turnamen "Blunder Skuad".

**Induk (`Turnamen.jsx`, 309 baris):**

- **[FR-TU1]** Lima tautan cepat (`DAFTAR_NAV`): Pendaftaran Anggota, Turnamen Bulanan, Turnamen Terbuka, Liga Antar Komunitas, Liga Musiman.
- **[FR-TU2]** Artikel "Turnamen Komunitas" berisi kebijakan turnamen Blunder Skuad (`PageArtikel` + `MastheadEditorial`).
- **[FR-TU3]** Tabel hasil turnamen (`components/TabelHasilTurnamen.jsx`).

**Sub-halaman** (`TurnamenBulanan.jsx`, `TurnamenTerbuka.jsx`, `LigaMusiman.jsx`, `LigaAntarKomunitas.jsx` — pembungkus tipis): masing-masing memakai `HalamanIsi` (judul + deskripsi + `parent` ke `/turnamen`) + `components/DaftarTurnamen.jsx` untuk daftar agenda/jadwal sesi.

- **[AC-TU1]** Semua sub-halaman menampilkan breadcrumb kembali ke `/turnamen` dan tautan "berikutnya" berantai antar sesi (rantai `next` per halaman).
- **[AC-TU2]** Komponen `DaftarTurnamen` dipakai bersama oleh keempat sub-halaman — perubahan komponen tidak boleh merusak satu sesi tanpa memeriksa tiga lainnya.

### 6.6 Media & Informasi — `/media-dan-informasi` + sub (`MediaDanInformasi/`)

**Tujuan:** kanal publikasi berita, pengumuman, dan dokumentasi visual.

**Induk (`MediaDanInformasi.jsx`, 44 baris):** masthead + paragraf pengantar + daftar tautan ke Berita Komunitas dan Galeri.

| Rute | Berkas | Sumber data | Fitur |
|---|---|---|---|
| `/berita-komunitas` | `BeritaKomunitas.jsx` | **API** `ambilBeritaPublik` (`lib/api/index.js`) | Daftar berita (`components/DaftarKontenMedia.jsx`), status muat/galat, tombol **"Coba lagi"** yang mengulang permintaan tanpa muat ulang halaman |
| `/pengumuman` | `Pengumuman.jsx` | **API** `ambilPengumumanPublik` | Daftar pengumuman (`DaftarKontenMedia`), status muat/galat, tombol **"Coba lagi"** (pola sama dengan berita) |
| `/berita/:id`, `/pengumuman/:id` | `DetailKonten.jsx` (parameter `jenis`) | API detail | Halaman detail konten per jenis |
| `/galeri` | `Galeri.jsx` (649 baris) | **57 foto sampel** `public/Galeri_sample/` | Galeri dengan filter kategori (ikon: kegiatan, buku, server, dst.), lightbox (perbesar/tutup), tautan, layar penuh |

- **[FR-M1]** Daftar berita/pengumuman dimuat dari backend (`/api/*`) — bukan konten hardcode.
- **[FR-M2]** Kegagalan jaringan menampilkan status galat + "Coba lagi" (pemulihan tanpa reload).
- **[FR-M3]** Galeri mendukung kategori, pratinjau perbesar, dan layar penuh.
- **[AC-M1]** Rute detail dinamis tidak pernah diprarender; judul + meta tetap benar via `MetaHalaman` di `DetailKonten`.
- **[AC-M2]** Galeri berjalan dengan aset sampel; struktur tidak bergantung pada nama berkas spesifik (folder `Galeri_sample/`).

### 6.7 Keberlanjutan — `/keberlanjutan` + kebijakan (`Keberlanjutan/`)

**Tujuan:** rumah dokumen kebijakan & dukungan komunitas.

| Rute | Berkas | Isi |
|---|---|---|
| `/keberlanjutan` | `Keberlanjutan.jsx` (175) | Induk: masthead + artikel + `next` ke syarat & ketentuan |
| `/keberlanjutan/syarat-dan-ketentuan` | `SyaratDanKetentuan.jsx` (262) | Syarat & ketentuan layanan |
| `/keberlanjutan/kode-etik-komunitas` | `KodeEtikKomunitas.jsx` (321) | Kode etik komunitas |
| `/keberlanjutan/pertanyaan-umum` | `PertanyaanUmum.jsx` (511) | FAQ |
| `/bantuan` | `Bantuan.jsx` (95) | Bantuan |
| `/privasi` | `Privasi.jsx` (108) | Kebijakan privasi |
| `/ketentuan` | `Ketentuan.jsx` (108) | Ketentuan |

- **[FR-K1]** Setiap dokumen kebijakan dapat diakses langsung dari footer/tautan publik (Kode Etik & FAQ tercangkok di footer/menu).
- **[FR-K2]** Halaman kebijakan memakai cangkang `HalamanIsi` yang sama (judul, deskripsi, kanonikal).
- **[AC-K1]** `/privasi` dan `/ketentuan` berdiri sendiri di root (bukan di bawah `/keberlanjutan`) — jangan dipindah tanpa `RUTE_REDIRECT`.

### 6.8 Pendaftaran Anggota — `/pendaftaran-anggota` (+ `/:username`) (`PendaftaranAnggota/`)

**Tujuan:** halaman aksi (hanya dibuka lewat tombol "Daftar Anggota" — header/footer/CTA), formulir pendaftaran anggota baru.

**Alur & fitur (`PendaftaranAnggota.jsx` 401 baris + `TampilanPendaftaran.jsx` 941 baris):**

- Formulir: `username` (Chess.com), `namaLengkap`, `panggilan`, `hp`, `dana` (e-wallet), `kota`, `tanggalLahir`.
- Validasi: `periksaUsername`, `normalisasiUsernameKanonik`, `normalisasiNama`, `hpValid`, `periksaTanggalLahir` (`lib/api`).
- Verifikasi kepemilikan akun Chess.com: `daftarDenganChessCom` + `ambilCaraVerifikasi` (`lib/api/anggota.js`); diatur `KCI_WAJIB_VERIFIKASI` (`off` / `opsional` (bawaan) / `wajib`).
- Setelah berhasil: `segarkanAnggota` (`lib/anggotaBersama.js`) menyegarkan data klub.
- Varian URL `/:username` — praisi username dari URL.
- Roster anggota diambil dari Published Data API Chess.com klub BLUNDER SKUAD, cache ≤ 12 jam (sudah termasuk infra `DaftarAnggota` di §6.3).

- **[FR-DA1]** Formulir memvalidasi setiap isian di sisi klien sebelum kirim; pesan galat per bidang.
- **[FR-DA2]** Mode verifikasi mengikuti `KCI_WAJIB_VERIFIKASI` — saat ini produksi `opsional` (keputusan "wajib/belum" masih terbuka, `PRODUCT.md`).
- **[AC-DA1]** Pendaftaran gagal tidak mengosongkan formulir yang sudah diisi.
- **[AC-DA2]** Normalisasi username menghasilkan bentuk kanonik (huruf kecil, tanpa spasi) sebelum dikirim.

### 6.9 Hubungi Kami — `/hubungi-kami` (+ `/:tab`) (`HubungiKami/HubungiKami.jsx`, 890 baris)

**Tujuan:** halaman kontak + portofolio komunitas bergaya ekspresif (berbeda dari halaman editorial lain — dicatat apa adanya sebagai ciri halaman ini).

**Struktur:** enam tab yang dipetakan ke URL (`TAB_VALID` = `home`, `about`, `services`, `work`, `testimonials`, `contact`; tab default `contact`); perpindahan tab menulis URL (`/hubungi-kami/:tab`). Komponen: `Avatar`, `Bulb`, `Circles`, `ParticlesContainer`, `ServiceSlider`, `TestimonialSlider`, `ProjectsBtn`, `TopLeftImg`; animasi `framer-motion` + `react-countup`; ikon brand layanan (Figma, HTML, CSS, JS, React, WordPress, Framer, Next, Photoshop, XD).

- **[FR-H1]** Enam tab dapat diakses langsung via URL dan tombol navigasi tab.
- **[FR-H2]** Tab `contact` adalah default untuk URL polos maupun tab tak dikenal.
- **[AC-H1]** Navigasi tab tidak menyebabkan muat ulang halaman penuh (SPA navigate).
- **[AC-H2]** Format nomor/alamat kontak mengikuti data kamus — bukan hardcode di markup.

### 6.10 Karir — `/karir` (`Karir/Karir.jsx` → `components/RecruitmentCareer.jsx`)

**Tujuan:** rekrutmen relawan/pelatih/media/sekretariat.

**Isi:** blok-blok bergambar: "Siapa Kami?", "Bergabung Bersama Kami" (program relawan/pelatih/media/sekretariat), "Nilai Kami" (sportivitas, prestasi, pembinaan; nilai: amanah, kompeten, harmonis, loyal, adaptif, kolaboratif) + `Hero` + ajakan (`ArrowRightIcon`).

- **[FR-KA1]** Halaman menampilkan nilai & jalur bergabung yang konsisten dengan `PRODUCT.md`.
- **[AC-KA1]** Tautan "Karir" di header/footer menuju halaman ini (bukan halaman eksternal).

### 6.11 Pendukung: 404 & Alih

- **Tidak Ditemukan** (`TidakDitemukan.jsx`) — fallback `path="*"`: menampilkan pesan + jalan kembali ke beranda. **[AC-404-1]** URL tak dikenal tetap memberi halaman 404 bermerek dengan navigasi pulang.
- **Alih (`RUTE_REDIRECT`)** — alias lama → baru dalam satu `Map` di `App.jsx`. **[AC-RED-1]** Menambah alias baru cukup satu baris; alias tidak boleh masuk `RUTE_PUBLIK`/sitemap.

## 7. Requirement Non-Fungsional (berlaku untuk semua halaman cakupan)

| No | Domain | Requirement | Dikunci oleh |
|---|---|---|---|
| NFR-1 | SEO | Setiap rute publik punya judul + deskripsi + kanonikal sendiri; HTML per rute berbeda dari beranda | `scripts/uji-seo.mjs`, `plugins/performa.js` |
| NFR-2 | SEO | Sitemap memuat persis rute indeks + `lastmod`; robots memblokir; 2 metode verifikasi Search Console utuh | `scripts/uji-seo.mjs` |
| NFR-3 | SEO | JSON-LD valid | `scripts/uji-jsonld.mjs` |
| NFR-4 | Performa | Semua rute lazy + prefetch saat hover/terlihat; hero LCP ter-preload; rute gelap tidak mewarisi preload hero | `scripts/uji-seo.mjs` (butir 5–6), `lib/prefetch.js` |
| NFR-5 | Konsistensi rute | Daftar rute `App.jsx` ↔ `plugins/performa.js` selalu sinkron | `scripts/uji-rute.mjs` |
| NFR-6 | i18n | Seluruh teks antarmuka dari kamus ID/EN; tidak ada string mentah di markup | `scripts/uji-i18n.mjs` |
| NFR-7 | Aset | Gambar terdaftar & ada; glob aset konsisten | `scripts/uji-gambar.mjs`, `scripts/uji-glob-aset.mjs` |
| NFR-8 | Desain | Kontrak `DESIGN.md`: serif default, sans untuk kontrol, tanpa gradien/glow, garis 1px, WCAG AA | review desain + `DESIGN.md` |
| NFR-9 | Navigasi | Header/footer/menu konsisten dengan `menu.js`; uji navigasi antar halaman publik | `scripts/uji-navigasi.mjs` |
| NFR-10 | Konten | Nada formal-faktual; tidak ada klaim palsu; atribusi pihak ketiga lengkap | `PRODUCT.md`, halaman Atribusi |

## 8. Ketergantungan & Sumber Data

| Data | Sumber | Dipakai oleh |
|---|---|---|
| Berita/pengumuman | Backend `/api/*` (`ambilBeritaPublik` dll.) | Media & Informasi |
| Roster anggota | Chess.com Published Data API (klub BLUNDER SKUAD, cache 12 jam) | Daftar Anggota (tab Keanggotaan) |
| Buku pembukaan | `public/data/buku-pembukaan.json` (18.713 jalur, CC0) | `/program-kami/pembukaan` |
| Soal teka-teki | `public/data/teka-teki.json` (5.486) | Papan statis `TekaTekiKonten` (posisi #1927) |
| E-book | `public/ebooks/` (32 PDF) + `halaman/Beranda/ebook-data.js` | Landing (karusel), EbookPanduan |
| Galeri | `public/Galeri_sample/` (57 foto) | `/media-dan-informasi/galeri` |
| Kamus bahasa | `src/lib/terjemahan/` (±2.554 kunci) | Semua halaman |
| Verifikasi akun | `lib/api/anggota.js`, env `KCI_WAJIB_VERIFIKASI` | Pendaftaran Anggota |

## 9. Pintu Kualitas (kontrak regresi)

Perilaku di atas dikunci oleh suite berikut (jalankan via `npm run uji` / per suite):

| Suite | Menjaga |
|---|---|
| `scripts/uji-rute.mjs` | Sinkronisasi rute App.jsx ↔ pra-render |
| `scripts/uji-seo.mjs` | Meta per rute, sitemap, robots, verifikasi Search Console, preload |
| `scripts/uji-jsonld.mjs` | JSON-LD |
| `scripts/uji-navigasi.mjs` | Navigasi antar halaman publik |
| `scripts/uji-i18n.mjs` | Kelengkapan kamus ID/EN |
| `scripts/uji-gambar.mjs`, `scripts/uji-glob-aset.mjs` | Ketersediaan & konsistensi aset |
| `scripts/uji-ebook.mjs`, `scripts/uji-ebook-pembaca.mjs` | Alur e-book & pembaca PDF |
| `scripts/uji-teka-teki-rute.mjs` | Alih & kanonikasi rute teka-teki (terkait landing `TekaTekiKonten`) |
| `npm run lint`, `npm run build` | Kebersihan kode & keberhasilan build |

## 10. Gap & Fakta Terbuka (dicatat, bukan usulan)

1. **Lisensi soal teka-teki** belum tercatat di `/program-kami/atribusi` — berbeda dari buku pembukaan (CC0) dan Stockfish (GPL-3.0). Jangan mengarang lisensinya.
2. **`KCI_WAJIB_VERIFIKASI`** masih `opsional` di produksi; status wajib/tidak belum diputuskan.
3. **Galeri** masih berisi foto sampel (`Galeri_sample/`), bukan dokumentasi kegiatan nyata (`PRODUCT.md`).
4. **Gaya HubungiKami** (portofolio ekspresif: partikel, animasi, slider) berbeda dari kontrak editorial halaman lain — kondisi tercatat; penyelarasan adalah keputusan produk.
5. Sumber konten **ID lebih kaya dari EN** untuk sebagian halaman.
6. **Pesan galat lapisan API** (`src/lib/api/*`) memakai standar terjemahan sejak penataan ini: `message` hanya diisi dari `pesan` server (konten, ditampilkan apa adanya); kegagalan sisi klien dibawa sebagai `GalatApi.kodePesan` dan diterjemahkan lapisan tampilan lewat `teksGalat` (kamus `api.*` ID/EN). Rincian di `src/lib/api/README.md`. Kunci kamus yang belum terpakai (mis. `pengadaan.*` untuk halaman yang belum dirutekan, `karir.nextJudul`) tetap tercatat sebagai fakta terbuka.

## 11. Di Luar Cakupan Dokumen Ini

Alat interaktif (Teka-teki, Rush, Kuis, Papan Interaktif + seluruh mode, papan Analisa), area `/beranda`, dashboard `/pengurus`, dan seluruh requirement engine/papan — didokumentasikan di dokumen lain (`ARSITEKTUR-ANALISA.md`, `PRODUCT.md` bagian alat, dsb.).

---

## Lampiran A — Peta Rute Ringkas

```
/                                        Landing
/tentang-kami                            Tentang Kami (#sekilas #tonggak #visi-misi #makna-logo)
/tentang-kami/struktur-grup-catur        Struktur Grup Catur (#pengurus #organisasi #keanggotaan)
/program-kami                            Program Kami
/program-kami/teka-teki                  → /teka-teki
/program-kami/rush-teka-teki             → /teka-teki-rush
/program-kami/kuis-catur                 → /quiz-catur
/program-kami/manusia-vs-mesin           → /papan-interaktif/manusia-vs-mesin
/program-kami/pembukaan                  Katalog Pembukaan
/program-kami/analisa                    → /program-kami/analisa/papan (di luar cakupan)
/program-kami/atribusi                   Atribusi & Lisensi
/program-kami/ebook-panduan[/:id|/kategori/:kategori]   E-book
/turnamen                                Turnamen
/turnamen/{turnamen-bulanan,turnamen-terbuka,liga-musiman,liga-antar-komunitas}
/media-dan-informasi                     Media & Informasi
/media-dan-informasi/{berita-komunitas,pengumuman,galeri}
/media-dan-informasi/{berita,pengumuman}/:id
/keberlanjutan                           Keberlanjutan
/keberlanjutan/{syarat-dan-ketentuan,kode-etik-komunitas,pertanyaan-umum}
/bantuan  /privasi  /ketentuan           Kebijakan
/pendaftaran-anggota[/:username]         Pendaftaran Anggota
/hubungi-kami[/:tab]                     Hubungi Kami (home|about|services|work|testimonials|contact)
/karir                                   Karir
*                                        404
```

## Lampiran B — Struktur Folder Sumber

```
src/halaman/
├── Landing/            Landing.jsx, KartuAlatLatihan, MaestroEdision, Testimoni, gayaTeks
├── TentangKami/        TentangKami, StrukturGrupCatur/ (Pengurus, StrukturOrganisasiCatur, Keanggotaan/)
├── ProgramKami/        ProgramKami, TekaTekiKonten, RushTekaTekiLanding, KuisCaturLanding,
│                       ManusiaVsMesinLanding, AnalisaLanding, Pembukaan, EbookPanduan, ModalUnduhEbook, FiturEbook
├── Turnamen/           Turnamen, TurnamenBulanan, LigaMusiman, TurnamenTerbuka, LigaAntarKomunitas
├── MediaDanInformasi/  MediaDanInformasi, BeritaKomunitas, Pengumuman, Galeri, DetailKonten
├── Keberlanjutan/      Keberlanjutan, SyaratDanKetentuan, KodeEtikKomunitas, PertanyaanUmum,
│                       Bantuan, Privasi, Ketentuan
├── PendaftaranAnggota/ PendaftaranAnggota, TampilanPendaftaran
├── HubungiKami/        HubungiKami (+ components/)
├── Karir/              Karir
└── Atribusi/           Atribusi
```
