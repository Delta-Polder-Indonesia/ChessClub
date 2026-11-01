# Teka-teki Harian — data, pembaruan, dan batasannya

Fitur ini menampilkan **teka-teki harian resmi Chess.com** di dua tempat, dengan
**dua sumber data yang sengaja berbeda**:

| Tempat | Berkas | Sumber data | Perilaku |
| --- | --- | --- | --- |
| Halaman penuh `/teka-teki-harian` | `src/halaman/TekaTekiHarian/TekaTekiHarian.jsx` | **API** `GET /api/teka-teki-harian` (server meneruskan Chess.com) | selalu soal terbaru, termasuk hari ini; snapshot lokal hanya jaring pengaman |
| Widget di halaman depan | `src/halaman/Landing/TekaTekiHarianLanding.jsx` | **arsip lokal** `public/data/teka-teki-harian/terbaru.json` | cepat & tanpa pihak ketiga, **bisa dimainkan**, dibatasi **5 soal/hari** lalu dialog ajakan bergabung |

Alasannya sederhana: halaman depan harus ringan, selalu hidup, dan jadi pemikat
(orang boleh langsung bermain tanpa akun); halaman penuh boleh bergantung pada
API karena di situ pengunjung memang mencari soal terbaru.

## 1. Halaman penuh memakai API

```text
GET /api/teka-teki-harian                 → soal hari ini (UTC, menurut server)
GET /api/teka-teki-harian?tanggal=2026-10-20
```

Implementasi server: `server/src/teka-teki-harian.js`, meneruskan
`https://api.chess.com/pub/puzzle/YYYY-MM-DD` dengan cache memori
(10 menit untuk hari ini, sehari untuk arsip). Frontend memanggilnya lewat
`src/lib/api/tekaTekiHarian.js` (`ambilTekaTekiHarian`), lalu mengubah PGN
menjadi langkah `from-to` dengan `parsePgnTekaTeki()`.

Bentuk jawaban:

```json
{ "tersedia": true, "tanggal": "2026-10-20", "judul": "…",
  "fen": "…", "pgn": "…", "url": "https://www.chess.com/…", "gambar": "…" }
```

`{"tersedia": false, "alasan": "…"}` berarti tanggal itu memang belum punya soal
(bukan kegagalan). Kegagalan transport (Chess.com lambat/down) memicu **jalur
cadangan**: halaman membaca snapshot lokal untuk tanggal yang sama dan
menampilkan penanda *“Chess.com sedang tidak bisa dihubungi — soal ini
dilayani dari arsip lokal situs.”* Jadi halaman tidak pernah mati.

## 1b. Kedudukan halaman: alat papan yang berdiri sendiri

`/teka-teki-harian` **bukan** sub-halaman Teka-teki Catur. Ia alat papan yang
berdiri sendiri dan memakai **kerangka keluarga papan interaktif** yang sama
dengan Teka-teki, Teka-teki Rush, dan Manusia vs Mesin:

- sidebar sendiri (brand BlunderSkuad + label mode + navigasi tanggal + status
  permainan + Petunjuk/Ulangi, Lisensi di bagian bawah), papan di area utama,
  dan panel keterangan di kanan;
- tema gelap `#262421` yang sama;
- tidak ada lagi bilah "Kembali ke Teka-teki Catur" di atas halaman.

Di menu, dropdown **Program Kami tetap berbentuk daftar datar seperti semula**
(dua kolom, tanpa submenu bertingkat): "Teka-teki Harian" menjadi satu baris di
sana. Kedudukan "berdiri sendiri" diwujudkan oleh **halamannya** (kerangka
sidebar sendiri, tanpa bilah kembali ke Teka-teki Catur) — bukan oleh menu
bertingkat. Uji `scripts/uji-header.mjs` mengunci hal ini: tidak boleh ada
submenu bertingkat di dalam dropdown Program Kami, dan tautan
`/teka-teki-harian` harus langsung terlihat saat dropdown dibuka.

Yang dibagi dengan keluarga papan hanyalah kerangka, tema, dan komponen
`PapanTekaTeki` — bukan navigasi atau alur halamannya.

## 1c. Susunan halaman: papan besar + panel kanan

Area kerja mengikuti susunan panel teka-teki harian ChessCompass, dengan dua
perbedaan yang disengaja (tema gelap keluarga papan dan data milik situs ini):

- **Papan besar persegi** di tengah; ukurannya dibatasi tinggi layar
  (`min(100%, 640px, calc(100dvh - 96px))`) sehingga muat tanpa menggulir di
  desktop, dan tetap penuh di layar sempit.
- **Panel kanan setinggi papan** (336px) berisi tiga tab:
  1. **Main** — urutannya meniru rangka panel rujukan, dari atas ke bawah:
     1. judul soal dari Chess.com;
     2. **baris status**: ikon pion ♙/♟ + "Giliran putih/hitam", tanggal edisi
        ("1 November · Hari ini/Arsip"), dan lencana sisa langkah;
     3. **strip kalender tujuh hari** menuju tanggal yang dibuka (titik hijau =
        tanggal yang sudah diselesaikan di peramban ini) dengan kepala strip
        berisi nama bulan + tautan "Kalender lengkap", lalu tautan "Cara kerja
        teka-teki harian";
     4. **aksi**: satu tombol lebar **Petunjuk** + dua tombol ikon bulat
        (Ulangi, Salin FEN);
     5. **baris navigasi** tiga kelompok: Balik papan sendirian di kiri,
        **⏮ ◀ ▶ ⏭** di tengah untuk meninjau langkah yang sudah dimainkan, dan
        menu **⋯** (Cara kerja, buka di Chess.com) di kanan.
  2. **Kalender** — kalender bulan penuh; hari yang sudah diselesaikan
     bertanda, tanggal setelah hari ini tidak bisa dibuka, klik tanggal untuk
     membuka soal arsipnya.
  3. **Info** — cara kerja teka-teki harian, sumber, dan tautan ke Chess.com.
- **Panel kiri tetap ada tetapi tidak lagi menduplikasi panel kanan.** Label
  mode (judul halaman), umpan balik langkah (`aria-live`), peringatan "dari
  arsip", riwayat langkah, dan Lisensi tetap di sana. Yang **dihapus** karena
  sudah diwakili panel kanan: baris "Hari ini · <tanggal>" dan lencana "sudah
  selesai", pemilih tanggal (`input[type=date]` dengan ← → serta tombol "Ke hari
  ini"), kartu "Giliran melangkah / Sisa N langkah", dan tombol Petunjuk serta
  Ulangi.

Perbaikan yang ikut menyertai penyusunan ulang ini:

- **Orientasi papan tidak lagi berputar** setiap langkah. Sebelumnya orientasi
  diturunkan dari posisi terkini, jadi papan berbalik setiap kali langkah
  dimainkan; kini dipakai sisi yang melangkah di **posisi pembuka** (ditambah
  tombol Balik papan).
- **"Ulangi" tidak lagi mengosongkan papan.** Fungsi itu membaca `soal.fen`
  yang tidak pernah ada (FEN hidup di state `posisi`), sehingga papan hilang
  setelah ditekan. Kini FEN pembuka disimpan di `posisiAwal`.

## 2. Widget halaman depan memakai arsip lokal, bisa dimainkan

Widget **tidak** memanggil API sama sekali (dijaga oleh uji). Ia membaca
`terbaru.json`, mengambil **5 soal terbaru**, lalu memasangnya satu per satu di
papan interaktif (`PapanTekaTeki`): pemain melangkah, lawan membalas otomatis,
ada tombol **Petunjuk** dan **Ulangi**, serta pemilih bidak promosi.

Batas harian:

- maksimal **5 soal selesai per hari** (`BATAS_HARIAN = 5`);
- progres disimpan di `localStorage` dengan kunci `kci-harian-landing`
  berisi `{ tanggal, selesai }` — berganti hari berarti jatah baru;
- setelah soal kelima selesai, muncul **dialog Radix** mengajak bergabung ke
  **Blunder Skuad**; aksinya menuju `/pendaftaran-anggota`;
- bila jatah habis, panel papan diganti keterangan jatah habis + tombol gabung,
  sehingga memuat ulang halaman tidak menambah jatah.

Salinan Indonesia dan Inggris keduanya wajib ada (`npm run uji:i18n`).

## 3. Snapshot arsip

```text
public/data/teka-teki-harian/
├── indeks.json      daftar tahun + rentang tanggal + jumlah soal
├── terbaru.json     7 soal terakhir (dipakai widget landing)
├── 2007.json        semua soal tahun itu
├── …
└── 2026.json
```

Satu soal **hanya** berisi tiga kolom:

```json
{ "tanggal": "2026-10-20", "fen": "1q6/… w - - 0 1", "langkah": "c1-b1;b8-a8;…" }
```

Judul, nama/avatar penulis, video, dan hitungan komentar **tidak** disimpan.
`langkah` memakai notasi `from-to` yang sama dengan basis data teka-teki situs
(`src/lib/tekaTeki.js`), dipisah titik koma.

Karena widget mengambil dari snapshot, **kesegaran snapshot = kesegaran widget**.
Perbarui minimal sekali sehari (lihat di bawah) supaya lima soal yang dimainkan
pengunjung memang soal terbaru.

## 4. Memperbarui snapshot

### Cara utama — API publik resmi Chess.com

```bash
npm run data:teka-teki-harian -- --hari 30        # 30 hari terakhir
npm run data:teka-teki-harian -- --dari 2026-01-01 --sampai 2026-10-31
npm run data:teka-teki-harian                     # bawaan: 400 hari terakhir
```

- Endpoint: `https://api.chess.com/pub/puzzle/YYYY-MM-DD`.
- **Inkremental**: tanggal yang sudah ada di snapshot dilewati, jadi aman
  dijalankan berkala (mis. cron harian) dan aman diulang setelah gagal.
- Tanggal yang belum terbit tidak disimpan, sehingga otomatis dicoba lagi pada
  jalannya berikutnya.
- `--kering` = periksa saja tanpa menulis berkas; `--paksa` = ambil ulang semua.

Contoh cron harian (jalankan di mesin Anda / GitHub Action, bukan di Vercel):

```cron
15 1 * * * cd /srv/chessclub && npm run data:teka-teki-harian -- --hari 3
```

Setelah snapshot berubah: `npm run uji:teka-teki-harian && npm run build`, lalu
commit folder `public/data/teka-teki-harian/`.

### Cara alternatif — salinan arsip lokal

Bila Anda sudah punya salinan arsip pihak ketiga (mis.
`samuraitruong/chess.com-daily-puzzle`), skrip yang sama bisa mengimpornya:

```bash
git clone --depth 1 https://github.com/samuraitruong/chess.com-daily-puzzle /tmp/arsip
npm run data:teka-teki-harian -- --dari-arsip /tmp/arsip/puzzle
```

Skrip hanya mengambil `date`, FEN, dan langkah solusi — sisanya dibuang.

> **Catatan risiko (sudah ditimbang, mohon dipahami):** arsip itu **tanpa
> lisensi** dan dikumpulkan lewat endpoint internal Chess.com
> (`/callback/puzzles/daily`), bukan API publik resmi. Memakainya berarti
> menyimpan ulang data milik Chess.com di repo ini. Bila pemilik repo ingin
> risiko nol, hapus `public/data/teka-teki-harian/` dan pakai cara utama;
> widget di landing otomatis **tidak tampil** dan halaman penuh tetap berjalan
> dari API — tidak ada galat.

## 5. Batas tanggal

- Arsip teka-teki harian Chess.com dimulai **8 Mei 2007**; tanggal ke depan
  tidak mungkin punya soal.
- Pemilih tanggal di halaman penuh dibatasi `2007-05-08 … hari ini` (soal
  terbaru selalu datang dari API, jadi tidak bergantung pada snapshot).
- Widget hanya menampilkan soal yang ada di `terbaru.json` (maksimal 5 dari 7).

## 6. Uji

```bash
npm run uji:teka-teki-harian      # 117 pemeriksaan: PGN, snapshot, skrip pengumpul, server
npm run uji:teka-teki-harian-ui   # 90 pemeriksaan jsdom: halaman (API + cadangan), panel kanan, panel kiri, widget
```

Yang dijaga oleh uji UI (`scripts/uji-teka-teki-harian-ui.mjs`):

- halaman memakai rute API dan mengirim `?tanggal=` saat membuka tanggal arsip;
- saat API **ditolak**, halaman jatuh ke snapshot, tetap menampilkan papan, dan
  memunculkan penanda “dilayani dari arsip lokal” (bukan layar galat);
- saat API menjawab `tersedia:false`, halaman menampilkan keadaan kosong yang
  jelas tanpa tombol coba-ulang dan tanpa penanda arsip;
- widget landing **tidak** memanggil API, papannya bisa dimainkan (langkah salah
  ditolak, langkah benar dibalas lawan), jatah naik 0 → 4 → 5;
- soal kelima memunculkan dialog ajakan gabung, tidak lanjut ke soal keenam, dan
  aksi dialog berpindah ke `/pendaftaran-anggota`;
- memuat ulang setelah jatah habis tetap menampilkan panel jatah habis;
- panel kanan: tiga tab (Main/Kalender/Info), strip tujuh hari yang berpindah
  tanggal lewat API, kalender bulan penuh dengan hari mendatang dinonaktifkan,
  kontrol ⏮ ◀ ▶ ⏭ yang benar-benar berpindah posisi dan mengunci papan saat
  meninjau, serta orientasi yang tidak berputar dan "Ulangi" yang tidak
  mengosongkan papan.

Selain itu `scripts/uji-teka-teki-harian.mjs` menjaga agar setiap soal di
snapshot **hanya** punya kolom `tanggal`, `fen`, `langkah` — tidak ada
judul/penulis/media yang menyelinap masuk — dan seluruh langkah solusinya legal
bila dimainkan berurutan.

## 7. Atribusi

Soal, posisi, dan langkah solusi adalah milik Chess.com. Atribusi dan tautan ke
halaman asli tersedia di widget landing, di halaman `/teka-teki-harian`, dan di
halaman **Program Kami → Atribusi & lisensi**.
