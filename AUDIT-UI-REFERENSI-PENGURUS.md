# Audit UI Referensi: Dashboard Pengurus

Catatan audit repo `kgdash116/Camera-Surveillance-Dashboard--Cloud-Technologies`
("Guard Up") dan adaptasi pola UI-nya ke panel Pengurus ChessClub: tabel anggota,
daftar larangan, daftar admin, dan Pengaturan Master.

## 1. Isi repo referensi

| Aspek | Referensi (Guard Up) | ChessClub |
|---|---|---|
| Build | CRA (`react-scripts`) | Vite 6 |
| Komponen | MUI v5, `@mui/x-data-grid` v6, Chakra, Nivo | Tailwind v4, primitif `src/components/ui/`, TanStack Table |
| Auth/data | AWS Amplify + Cognito | Backend Node sendiri (`server/`) dengan JWT |
| Tema | gelap bawaan `#141b2d`, aksen hijau `#4cceac` | terang, `--color-primary #0B2F9F` |
| Font | Source Sans Pro | Geist Variable |

Stack referensi tidak dipakai langsung. Tidak ada dependensi baru yang ditambahkan;
MUI, Amplify, dan CRA tidak diadopsi. Yang diambil hanya pola visual dan hierarki
informasi, lalu diterapkan dengan komponen yang sudah ada.

## 2. Pola yang diadaptasi

| Pola referensi | Bentuk di ChessClub | Berkas |
|---|---|---|
| Header berisi judul dan subjudul aksen | `KepalaPanel`: judul `text-lg` bold, subjudul `text-sm` primary, slot `aksi` | `ui.jsx` |
| Pill Access Level (Admin/Staff) | `Lencana` dengan empat warna (hijau, biru, merah, abu) | `ui.jsx` |
| DataGrid: header berwarna, footer rentang baris dan pemilih baris | `TabelData` dibungkus kartu: bilah atas "Menampilkan 1-10 dari N", header kolom `bg-slate-50` uppercase, footer `bg-slate-50` | `TabelData.jsx` |
| Banner "Add Users" | Kartu "Tambah Admin Baru" dengan bilah judul `bg-primary` | `Pengaturan.jsx` |
| Label grup menu sidebar | `grup` di `MENU_SIDEBAR` menjadi judul kecil uppercase (Utama, Komunitas, Konten, E-Book) | `SidebarData.js`, `Sidebar.jsx` |
| Display box halaman Settings | Kartu "Akun Saat Ini" dengan baris `divide-y` | `Pengaturan.jsx` |
| Search bar Topbar | Kotak pencarian `bg-slate-100` yang menjadi putih saat fokus, dipakai di Anggota dan Larangan | `Anggota.jsx`, `Larangan.jsx` |
| Kartu ringkasan statistik | `Kartu` menjadi kartu putih ber-border `slate-200` dengan `shadow-sm` | `ui.jsx`, `RingkasanDashboard.jsx`, `RiwayatMasuk.jsx` |
| Badge status pada tabel | Lencana status Terverifikasi (hijau), Terblokir dan Fair Play (merah), Sumber Otomatis (biru) | `Anggota.jsx`, `Larangan.jsx` |

## 3. Yang tidak diambil

- Tema gelap dan aksen hijau neon. `DESIGN.md` menetapkan tema terang dengan primary
  `#0B2F9F`.
- Gradien ungu dan pink pada header DataGrid. Dilarang `DESIGN.md`.
- MUI Switch dan DataGrid. Menambah dependensi besar; padanannya sudah ada (`select`
  role, TanStack Table).
- Blok identitas dan badge role di sidebar, serta sidebar Pengaturan. Sidebar hanya
  mendapat label grup; susunan, ikon, dan animasinya tetap versi lama.
- Nivo chart, FullCalendar, dan FAQ accordion. Di luar cakupan tabel dan pengaturan.

## 4. Perubahan per berkas

- `ui.jsx`: `Tombol.utama` menjadi primary terisi, `Tombol.bahaya` menjadi outline
  merah; `Kartu` menjadi kartu; tambah `KepalaPanel` dan `Lencana`.
- `TabelData.jsx`: chrome kartu, bilah jumlah baris, footer pagination, header kolom
  uppercase.
- `SidebarData.js` dan `Sidebar.jsx`: field `grup` dan satu label kelompok per menu,
  hanya tampil saat sidebar terbuka.
- `Anggota.jsx` dan `Larangan.jsx`: `KepalaPanel`, kotak pencarian, tabel dalam kartu,
  lencana status.
- `Pengaturan.jsx`: `KepalaPanel` di tiap panel, kartu ringkasan admin, form Tambah
  Admin bentuk banner, panel Akun dan Password dua kolom, lencana role. Header dan
  sidebar Pengaturan tidak diubah.
- `RiwayatMasuk.jsx`: `KepalaPanel` dan statistik memakai `Kartu`.
- `Audit.jsx`: `KepalaPanel`, filter dalam kartu.
- `RingkasanDashboard.jsx`: kartu aktivitas memakai `Kartu`.
- `Pesan.jsx`, `PanelTurnamen.jsx`, `PanelJuara.jsx`, `PanelKonten.jsx`,
  `PanelEbook.jsx`: judul panel lewat `KepalaPanel`; lencana status konten menjadi pill.

## 5. Kepatuhan aturan

- Token brand dipakai apa adanya (`primary`, slate, white). Tidak ada hex baru.
- Tidak ada `text-[11px]` atau `text-[10px]` baru. Nilai lama pada berkas tersentuh
  dinaikkan ke `text-xs` (12px).
- Radius `rounded-md` dan `rounded-lg`, border 1px `slate-200`, `shadow-sm`, tanpa
  gradien dan glow.
- Label grup sidebar memakai `text-slate-500` agar kontras teks 12px lolos WCAG AA
  (4.76:1 di atas putih).
- Identifier dan komentar berbahasa Indonesia.

## 6. Verifikasi

```
npm run lint                          lulus, 0 error dan 0 warning
node scripts/uji-standar-desain.mjs   tidak ada penyimpangan baru
node scripts/uji-impor-css.mjs        38 lulus
node scripts/uji-rute.mjs             52 rute selaras
node scripts/uji-integritas-suite.mjs 11 lulus
npx vite build                        sukses
```

## 7. Perbaikan lanjutan (review seluruh panel)

Temuan dari penelusuran ulang seluruh berkas konten Pengurus, sudah dikerjakan:

1. Kepala tabel Anggota dan Larangan kini `sticky` dengan latar `bg-slate-50`, jadi
   judul kolom tetap terlihat saat daftar digulir.
2. Tombol "Hapus Semua" pada Pesan berganti menjadi "Hapus terpilih" karena aksinya
   hanya menghapus pesan yang dicentang.
3. Badge "N dipilih" ganda di Pesan dihapus; informasi cukup satu di toolbar.
4. Baris Pesan kini bertumpuk di mobile dan satu baris di layar lebar, tanpa lebar
   tetap yang memicu scroll horizontal.
5. Tabel Turnamen, Juara, dan Konten memakai bingkai kartu, kepala tabel abu-abu,
   dan kepala sticky yang sama dengan tabel lain lewat `KELAS_KARTU_TABEL` dan
   `KELAS_KEPALA_TABEL` di `ui.jsx`.
6. Grid kartu identik dipecah: `Kartu` mendapat prop `sorotan`, dipakai pada Total
   Admin dan Total Sesi Masuk. Dua tindakan cepat di Ringkasan Dashboard kini
   berbentuk baris bertautan, bukan kartu statistik.
7. Pola galat muat diseragamkan memakai `KotakGalatMuat`; `NotifikasiError` tidak
   dipakai lagi di panel mana pun dan masih tersisa sebagai ekspor lama.
8. Empty state Pesan, Turnamen, dan Juara memakai teks tengah `py-8` seperti
   `TabelData`.

Belum dikerjakan, menunggu keputusan: `localhost` putus saat pengembangan.
Usulan perbaikannya target proxy `http://127.0.0.1:8787` di `vite.config.js` dan
penetapan `keepAliveTimeout` serta `headersTimeout` di `server/src/server.js`.

## 8. Larangan warna status di Pengurus

Seluruh lencana status dan angka statistik di panel Pengurus dibuat netral. Alasan
dan pemetaannya:

| Sebelum | Sesudah |
|---|---|
| `Publik` hijau (`bg-emerald-50 text-emerald-700`) | teks `text-slate-700` |
| `Terverifikasi` hijau, `Terblokir` merah | lencana abu `bg-slate-100 text-slate-700` |
| `MASTER` hijau, `PENGURUS` biru | lencana abu |
| Angka statistik merah/hijau/biru | `text-slate-900`, sorotan memakai `text-primary` |
| Tombol destruktif merah | border dan teks `slate-900` |

`Lencana` dan `Kartu` di `ui.jsx` tidak lagi menerima prop `warna`, sehingga varian
berwarna tidak bisa dipakai ulang tanpa mengubah komponennya lebih dulu. Aturan ini
dicatat sebagai larangan keras di `.agents/skills/kci-anti-slop/SKILL.md` bagian 4b,
dicerminkan ke `.opencode/skills/kci-anti-slop/SKILL.md`.

Yang tidak diubah: `LencanaBan` dan `CentangBiru` di `src/components/Lencana.jsx`
masih memakai warna karena dipakai bersama halaman publik (Peringkat, Keanggotaan).
Mengubahnya mengubah halaman di luar Pengurus, jadi perlu keputusan terpisah.

## 9. Penjaga otomatis di CI

`scripts/uji-standar-desain.mjs` mendapat pemeriksaan khusus: setiap kelas warna
semantik (`bg-|text-|border-|ring-|…` dengan hue emerald, green, red, rose, amber,
yellow, orange, teal, lime, cyan, sky, violet, indigo, purple, fuchsia, pink, blue)
di `src/halaman/Pengurus/` langsung menggagalkan uji, dengan laporan per baris:

```
Warna status terlarang di dashboard Pengurus:

- src/halaman/Pengurus/PanelKonten.jsx:47 memakai bg-emerald-50
- src/halaman/Pengurus/PanelKonten.jsx:47 memakai text-emerald-700
```

Pemeriksaan kedua menolak kotak berlatar abu: elemen dengan `bg-slate-50/100/200`
sekaligus `rounded-lg` dan `border`. Dua tindakan cepat di Ringkasan Dashboard
sebelumnya memakai pola itu; sekarang menjadi baris terbuka dengan pemisah tipis
dan tautan teks "Buka", tanpa kotak.

Pemeriksaan ketiga menolak efek mengambang: setiap utilitas `shadow-*` di
`src/halaman/Pengurus/` menggagalkan uji. Sebelas berkas dibersihkan dari
`shadow-sm`, `shadow-lg`, dan `shadow-xl`; batas bidang kini hanya garis 1px,
dan dialog/dropdown memakai border `slate-300` di atas latar gelap transparan.

Cakupan pemeriksa: `className` statis maupun template literal, termasuk kelas yang
terpecah beberapa baris; utilitas warna hex arbitrer (`bg-[#dc2626]`); `boxShadow`
pada style inline; dan nilai warna literal pada atribut SVG. Lima cara meloloskan
desain terlarang sudah diuji dan seluruhnya tertangkap.

Pemeriksaan ini berjalan **sebelum** mekanisme baseline, sehingga
`npm run desain:baseline` tidak bisa mengabsahkan pelanggaran baru. Uji ini ikut
`npm run uji:desain` dan sudah berada di jalur CI lewat `npm run uji:v1:ui-engine`
(`.github/workflows/quality.yml`). Aturannya dicatat di `DESIGN.md` §1 dan skill
`kci-anti-slop` §4b.

## 10. Batasan

- Verifikasi visual di browser tidak dilakukan pada sesi ini. Pratinjau dev server
  tersedia di `/pengurus`, tetapi penilaian tampilan akhir belum diverifikasi mata.
- Roster Chess.com tidak bisa ditarik dari sandbox karena host `api.chess.com`
  diblokir, sehingga tabel Anggota bisa tampil kosong atau gagal muat.
