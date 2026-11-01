# Teka-teki Harian — data, pembaruan, dan batasannya

Fitur ini menampilkan **teka-teki harian resmi Chess.com** di dua tempat:

| Tempat | Berkas | Data yang dipakai |
| --- | --- | --- |
| Widget di halaman depan | `src/halaman/Landing/TekaTekiHarianLanding.jsx` | `terbaru.json` (±2 KB, 7 soal) |
| Halaman penuh `/teka-teki-harian` | `src/halaman/TekaTekiHarian/TekaTekiHarian.jsx` | `terbaru.json` → `<tahun>.json` |

## Tidak ada panggilan ke Chess.com saat pengunjung membuka situs

Situs **tidak** memanggil API siapa pun saat halaman dibuka. Semua posisi
disajikan sebagai berkas statis dari domain sendiri:

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

Konsekuensi yang disengaja: teka-teki tetap bisa dimainkan walau Chess.com
lambat atau tidak terjangkau, dan pengunjung tidak diarahkan ke pihak ketiga
saat membuka halaman.

## Memperbarui snapshot

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
> widget di landing otomatis **tidak tampil** dan halaman menampilkan keadaan
> kosong yang jelas — tidak ada galat.

## Batas tanggal yang ditampilkan

- Arsip teka-teki harian Chess.com dimulai **8 Mei 2007**.
- Pemilih tanggal di halaman dibatasi `indeks.terlama … indeks.terbaru`.
- Bila snapshot tertinggal beberapa hari dari kalender, pengunjung yang membuka
  `/teka-teki-harian` tanpa `?tanggal=` otomatis diarahkan ke tanggal terbaru
  yang tersedia (bukan layar "belum tersedia").

## Status server (`/api/teka-teki-harian`)

Rute ini **opsional** dan tidak dipakai halaman mana pun. Ia tetap ada untuk
kebutuhan lain (mis. bot/administrasi atau pengambilan satu tanggal live):

```bash
curl "http://localhost:8787/api/teka-teki-harian?tanggal=2026-10-20"
```

Bila Anda tidak memerlukannya, rute itu tidak mengganggu apa pun — ia hanya
memakai cache memori 10 menit (hari ini) / sehari (arsip) dan tidak pernah
dipanggil oleh frontend.

## Uji

```bash
npm run uji:teka-teki-harian      # 117 pemeriksaan: PGN, snapshot, skrip pengumpul, server
npm run uji:teka-teki-harian-ui   # 21 pemeriksaan jsdom: halaman + widget landing
```

Pemeriksaan penting yang dijaga:

- setiap soal di snapshot **hanya** punya kolom `tanggal`, `fen`, `langkah`
  (tidak ada judul/penulis/media yang menyelinap masuk);
- seluruh langkah solusi legal bila dimainkan berurutan;
- skrip pengumpul membuang kolom lain dan tidak meminta ulang tanggal yang
  sudah tersimpan;
- widget landing memasang papan soal terbaru dan menautkan halaman aslinya.

## Atribusi

Soal, posisi, dan langkah solusi adalah milik Chess.com. Atribusi dan tautan ke
halaman asli tersedia di widget landing, di halaman `/teka-teki-harian`, dan di
halaman **Program Kami → Atribusi & lisensi**.
