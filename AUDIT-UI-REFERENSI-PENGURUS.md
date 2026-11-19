# Audit UI Referensi → Dashboard Pengurus

Audit repo `kgdash116/Camera-Surveillance-Dashboard--Cloud-Technologies` ("Guard Up")
dan adaptasi pola UI-nya ke panel **Pengurus** ChessClub: tabel anggota, daftar
larangan, daftar admin, dan **Pengaturan Master**.

---

## 1. Repo referensi: apa isinya

| Aspek | Referensi (Guard Up) | ChessClub |
|---|---|---|
| Build | CRA (`react-scripts`) | Vite 6 |
| Komponen | MUI v5 + `@mui/x-data-grid` v6 + Chakra + Nivo | Tailwind v4 + shadcn + TanStack Table |
| Auth/data | AWS Amplify + Cognito | Backend Node sendiri (`server/`) + JWT |
| Tema | gelap bawaan `#141b2d`, aksen hijau `#4cceac` | terang, `--color-primary #0B2F9F` |
| Font | Source Sans Pro | Geist Variable |

**Kesimpulan:** stack-nya tidak bisa dipakai langsung. Tidak ada dependensi baru
yang ditambahkan — MUI/Amplify/CRA sengaja **tidak** diadopsi. Yang diambil hanya
**pola visual & hierarki informasi**.

## 2. Pola yang diadaptasi

| Pola referensi | Diadaptasi menjadi | File |
|---|---|---|
| `Header` judul + subjudul aksen | `KepalaPanel` (judul `text-lg` bold + subjudul `text-sm` primary + slot `aksi`) | `ui.jsx` |
| Pill *Access Level* Admin/Staff | `Lencana` (hijau/biru/merah/abu, ring 1px) | `ui.jsx` |
| DataGrid: header berwarna, footer rentang baris + pemilih baris | `TabelData` dibungkus kartu: bilah atas "Menampilkan 1–10 dari N", header `bg-slate-50` uppercase, footer `bg-slate-50` | `TabelData.jsx` |
| Banner "Add Users" (bilah judul berwarna + isi form + tombol simpan di tengah) | Kartu "Tambah Admin Baru" dengan bilah judul `bg-primary` | `Pengaturan.jsx` |
| Display box halaman Settings | Kartu "Akun Saat Ini" dengan baris `divide-y` | `Pengaturan.jsx` |
| Search bar Topbar (kotak terisi) | Kotak pencarian `bg-slate-100` → putih saat fokus, di Anggota & Larangan | `Anggota.jsx`, `Larangan.jsx` |
| Label grup menu sidebar | `grup` di `MENU_SIDEBAR` → judul kecil uppercase (Utama / Komunitas / Konten / E-Book) | `SidebarData.js`, `Sidebar.jsx` |
| Kartu ringkasan statistik | `Kartu` jadi kartu putih ber-border + `shadow-sm`; dipakai di Ringkasan, Kelola Admin, Riwayat Masuk | `ui.jsx`, `RingkasanDashboard.jsx`, `RiwayatMasuk.jsx` |
| Badge status berikon pada tabel | Lencana status Terverifikasi (hijau), Terblokir/Fair-Play (merah), Sumber Otomatis (biru) | `Anggota.jsx`, `Larangan.jsx` |

## 3. Yang sengaja **tidak** diambil

- **Blok identitas + badge role di sidebar, dan sidebar Pengaturan** — tidak dipakai.
  Sidebar utama hanya mendapat **label grup menu**; susunan, ikon, dan animasi menu
  tetap versi lama.
- **Tema gelap & aksen hijau neon** — bertabrakan dengan `DESIGN.md` (tema terang,
  primary biru `#0B2F9F`).
- **Gradien ungu/pink pada header DataGrid** — dilarang `DESIGN.md`.
- **MUI `<Switch>` / DataGrid** — menambah dependensi besar; padanan terdekat sudah
  ada (`select` role, TanStack Table).
- **Nivo chart, FullCalendar, FAQ accordion** — di luar cakupan tabel & pengaturan.

## 4. Perubahan per file

- `ui.jsx` — `Tombol.utama` kini filled primary, `Tombol.bahaya` outline merah;
  `Kartu` jadi kartu; tambah `KepalaPanel` & `Lencana`.
- `TabelData.jsx` — chrome kartu + bilah jumlah baris + footer pagination;
  `labelItem` dinaikkan ke bilah atas.
- `Anggota.jsx`, `Larangan.jsx` — `KepalaPanel`, kotak pencarian, tabel dalam kartu,
  header kolom uppercase, lencana status.
- `Pengaturan.jsx` — kartu ringkasan admin, form Tambah Admin gaya banner, panel
  Akun & Password ditata dua kolom, lencana role, `KepalaPanel` per panel.
  Header dan sidebar Pengaturan **tidak diubah**.
- `RiwayatMasuk.jsx` — `KepalaPanel` + statistik memakai `Kartu`.
- `Audit.jsx` — `KepalaPanel`, filter dalam kartu.
- `SidebarData.js` / `Sidebar.jsx` — field `grup` + label kelompok menu (satu baris
  kecil per kelompok, hanya saat sidebar terbuka).
- `RingkasanDashboard.jsx` — kartu aktivitas memakai `Kartu` (tanpa border ganda).
- `Pesan.jsx`, `PanelTurnamen.jsx`, `PanelJuara.jsx`, `PanelKonten.jsx`, `PanelEbook.jsx`
  — judul panel konsisten lewat `KepalaPanel`; lencana status konten jadi pill.

## 5. Kepatuhan `DESIGN.md`

- Sidebar utama hanya ditambah label grup (`grup` di `SidebarData.js`); tidak ada
  blok identitas, perubahan susunan menu, atau perubahan animasi. Sidebar Pengaturan
  dan `Dashboard.jsx` (shell) tetap versi lama.
- Token brand dipakai apa adanya (`primary`, slate, white) — tanpa hex baru.
- Tidak ada `text-[11px]`/`text-[10px]` baru; beberapa yang lama di file tersentuh
  dinaikkan ke `text-xs` (12px).
- Radius `rounded-md`/`rounded-lg`, border 1px `slate-200`, `shadow-sm`, tanpa glow/gradien.
- Identifier & komentar berbahasa Indonesia.

## 6. Verifikasi

```
npm run lint                     → 0 error, 0 warning
node scripts/uji-standar-desain.mjs → tidak ada penyimpangan baru
node scripts/uji-impor-css.mjs   → 38 lulus
node scripts/uji-rute.mjs        → 52 rute selaras
node scripts/uji-integritas-suite.mjs → 11 lulus
npx vite build                   → sukses
```

## 7. Pratinjau lokal

Backend (`:8787`) dan Vite (`:5173`) dijalankan untuk pratinjau:

- URL: `/pengurus`
- Login: `master` / `MasterChess2026!` (khusus sandbox ini, diset lewat env
  `KCI_ADMIN_USER` / `KCI_ADMIN_PASSWORD`; tidak ditulis ke berkas repo)
- Data contoh admin (`sekretaris`, `bendahara`, `wasit1`) hanya ada di
  `data/rahasia/admins.json` yang di-ignore Git.

## 8. Catatan

- Roster Chess.com tidak dapat ditarik dari sandbox (hanya host allowlist yang
  bisa diakses), jadi tabel Anggota bisa tampil kosong/galat muat di pratinjau —
  tata letaknya tetap terlihat.
- Belum di-commit dan belum di-push.
