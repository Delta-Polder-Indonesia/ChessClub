# Standar Galeri — adopsi markup Impeccable (pengecualian konten visual)

Dokumen ini mencatat pengecualian resmi DESIGN.md §11: skala dan markup di bawah
hanya berlaku di halaman yang secara eksplisit dipilotkan di sini — kerangka
Galeri penuh (§3) dan judul seksi Landing (§2b) — bukan aturan tipografi
global baru. Di luar halaman yang disebut di sini, `DESIGN.md` §2 dan §6 tetap
satu-satunya skala teks yang sah, dan pola ini tidak pernah berlaku untuk
komponen catur.

## 1. Sumber dan cakupan adopsi

- Sumber markup: `gallery` pada `https://impeccable.style/gallery`
  (dikloning ke `Delta-Polder-Indonesia/Halaman_sample`, berkas `index.html` +
  `_astro/gallery.cvrb3iwg.css`).
- Yang diadopsi: **struktur konten** saja — kerangka shell/heading, rel navigasi
  proyek, grid foto, kartu brief, lightbox, dan footer aksi, berikut ukuran font,
  leading, spacing, dan grid yang menyertainya.
- Implementasi resmi: `src/halaman/MediaDanInformasi/Galeri.jsx`. JSDoc di kepala
  berkas itu memetakan tiap class asli (`.gallery-shell`, `.gallery-heading`, dst.)
  ke class Tailwind yang dipakai — baca berkas itu sebagai rujukan baris demi baris,
  dokumen ini hanya ringkasannya.

### Tidak termasuk dalam adopsi ini

- **Apa pun yang berhubungan dengan catur/papan** (Analisa, Papan Interaktif,
  Teka-teki, Quiz, Rush) tidak boleh memakai pola ini. Domain catur punya rumah
  komponennya sendiri di `src/halaman/Analisa/komponen/` (lihat DESIGN.md §13).
  Pengecualian ini murni untuk halaman konten/media, bukan untuk komponen
  interaktif permainan.
- Warna aksen teal referensi (`--ks-patina-deep`) — diganti biru KCI (`--color-primary`).
- Bayangan `--ks-lift-1`/`--ks-lift-2` pada foto, lencana, dan lightbox — dibuang
  seluruhnya (DESIGN.md §4 melarang bayangan selain `shadow-sm` netral tipis).
- Tombol `.gallery-install` (tautan instalasi paket) — tidak ada padanan di KCI.
- Font display referensi (`--ks-font-display`) — diganti `font-serif` KCI, bukan
  font pihak sumber.

## 2. Kapan boleh dipakai

Pola ini hanya untuk halaman yang fungsinya memang galeri/showcase visual
(DESIGN.md §8 poin 6: *pengantar → navigasi topik → brief → visual utama dan
pendukung → keterangan*), misalnya dokumentasi foto kegiatan atau katalog media
non-catur di bawah `MediaDanInformasi/`. Sebelum memakainya untuk halaman baru:

1. Pastikan visual memang isi utama halaman, bukan artikel berteks panjang.
2. Baca `src/halaman/MediaDanInformasi/Galeri.jsx` secara penuh dan tiru strukturnya.
3. Jangan salin pola ini ke artikel, berita, panduan, atau halaman program — halaman
   itu tetap memakai `HalamanIsi` + `PageArtikel` + `.prose-kci` sesuai
   `references/standar-konten.md`.
4. Jangan salin pola ini ke halaman catur mana pun.

## 2b. Pilot kedua — judul seksi Landing (2026-09-30, direvisi dengan token asli)

Selain kerangka Galeri penuh (§3), elemen tipografinya (bukan grid/lightbox)
juga dipilot di halaman Landing (`/`, `src/halaman/Landing/Landing.jsx`,
`TigaJalan.jsx`, `Testimoni.jsx`) lewat modul bersama
`src/halaman/Landing/gayaTeks.jsx`. Revisi 2026-09-30 mengganti nilai perkiraan
awal dengan **angka literal dari sistem token situs sumber**
(`_astro/kinpaku_tokens.czfxn__5.css`, plus aturan `h2`/`.ks-section*` bawaan
di `_astro/base.dh9lpkoi.css` dan kelas kartu di `_astro/sub_pages.dr6kqi_x.css`
— berkas terakhir ini tidak dipakai HTML halaman Gallery yang dikloning, tapi
tetap berisi token/kelas resmi situs sumber yang sama sehingga sah dipakai
sebagai rujukan skala).

| Peran token sumber | Nilai token asli | Kelas KCI (`gayaTeks.jsx`) | Nilai yang dipakai |
| --- | --- | --- | --- |
| `--ks-type-headline-*` (dipakai sebagai `h2` bawaan di `base.dh9lpkoi.css`) | size `clamp(2.4rem,3.6vw,3.4rem)`, weight 300, line 1.04, track 0 | `JUDUL_SEKSI` / `JUDUL_SEKSI_TERANG` | identik, font tetap serif KCI (bukan "Alumni Sans" sumber — penyimpangan yang sama seperti Galeri) |
| `.ks-section-sub` (paragraf pengantar seksi, `base.dh9lpkoi.css`) | `font-size:.96rem` (15.36px), `line-height:1.55`, `max-width:60ch`, warna muted | — | **TIDAK DIPAKAI** sejak revisi 2026-09-30 (lihat baris `.section-lead`) |
| `.home-kinpaku .section-lead` (`index.duybiyfa.css`) — kelas yang benar-benar dipakai seksi pengantar di halaman sumber | `font-size:var(--ks-type-body-size)` (16px), `line-height:1.8`, `max-width:62ch`, `text-wrap:pretty` | `LEAD_SEKSI` / `LEAD_SEKSI_TERANG` | ukuran/leading/lebar identik. **Warna** sengaja tetap `text-grey-600`, bukan `var(--ks-text)` (oklch 22%) milik sumber — penyimpangan yang diketahui |
| `.ks-section-eyebrow` / `.ks-subsection-label` (`base.dh9lpkoi.css`) | font mono, uppercase, `letter-spacing:.14em`, size `.6875rem` (11px, token `--ks-type-eyebrow-size`) | `LABEL_SEKSI` / `LABEL_SEKSI_TERANG` | font mono + uppercase + tracking identik; **ukuran dinaikkan ke `.75rem`/12px** (`text-xs`) — token `--ks-type-label-size` yang sama-sama ada di sumber, dipakai sebagai pengganti karena DESIGN.md melarang teks konten di bawah 12px. Ini satu-satunya penyimpangan angka yang disengaja di §2b. |
| `.ks-section-head` (`base.dh9lpkoi.css`) | `gap:14px`, `max-width:720px`, `margin-bottom:56px` | — | **TIDAK DIPAKAI** sejak revisi 2026-09-30 |
| `.home-kinpaku .section-header` (`index.duybiyfa.css`) — kelas yang benar-benar dipakai | `gap:12px`, `margin-bottom:34px`, `display:grid` | `KEPALA_SEKSI` | identik. `max-w-[45rem]` **dihapus** pada revisi 2026-09-30b: sumber tidak membatasi lebar kepala seksi sama sekali, pembatasnya hanya ada di `.section-lead` (`62ch`). Judul TigaJalan, Testimoni, dan MaestroEdision sekarang sama-sama melebar penuh. Kalau satu seksi butuh judulnya dibatasi, tambahkan `max-w-[45rem]` pada pemanggilnya |
| `--ks-type-title-*` (`.tutorial-card-title`, `.gallery-card-title`, `.rule-card-name` di `sub_pages.dr6kqi_x.css`) | `font-size:1.0625rem` (17px), weight 600, line 1.35 | `JUDUL_KARTU` | identik, font tetap serif KCI. Ditambah `text-balance` (sumber menerapkan `text-wrap:balance` ke semua judulnya) |
| `--ks-type-small-size` (`.rule-card-desc`) | `font-size:.875rem` (14px), line 1.6 | `DESKRIPSI_KARTU` | identik. Ditambah `text-pretty` (sumber memakai `text-wrap:pretty` pada body panel dan seksi) |
| `.home-kinpaku .why-panel-title` (`index.duybiyfa.css`) — heading di dalam bento tile lebar; pada halaman sumber berisi "Respects your design system." | `font-size:clamp(1.5rem,2vw,1.85rem)` (24–29.6px), weight `var(--ks-type-headline-weight)` = 300, line `1.04`, tracking 0, `text-wrap:balance`, `max-width:60ch` | `JUDUL_PANEL` | ukuran/weight/line/tracking/balance identik. Dipakai ketiga kartu seksi TigaJalan ("Kurikulum terstruktur", "Papan Interaktif & Teka-teki", "Report Analisa"). `max-w-[60ch]` tidak dipasang karena lebar kartu sudah ~45–55% kolom |
| `.home-kinpaku .why-panel-body` | `font-size:1rem` (16px), line `1.65` (`--ks-type-body-line`), `text-wrap:pretty`, `margin-bottom:0` | `DESKRIPSI_PANEL` | identik. Warna `text-grey-600` bukan `var(--ks-text)`, mengikuti keputusan yang sama seperti `LEAD_SEKSI` |
| `--ks-type-subhead-size` + pola `.site-header-brand` (satu-satunya pemakaian konkret token ini di sumber) | `font-size:1.25rem` (20px), weight 600, `letter-spacing:-.01em` | `JUDUL_POSTER` (khusus overlay sampul e-book, ruang sempit ~240–340px — `JUDUL_SEKSI` terlalu besar untuk konteks ini) | identik |
| `--ks-type-ui-size` | `font-size:.8125rem` (13px) | inline di `TigaJalan.jsx` (baris terms) dan `Landing.jsx` (jabatan hope) | identik; sebelumnya `text-xs` (12px) dan `text-[13px]` |
| `--ks-type-ui-lead` | `font-size:.9375rem` (15px) | inline di `Testimoni.jsx` (nama/cite) | sudah identik sebelum revisi, tidak diubah |
| `--ks-type-lead-size` | `font-size:1.125rem` (18px) | inline di `Landing.jsx` (nama hope, `text-lg`) | sudah identik sebelum revisi, tidak diubah |
| `--ks-type-body-line` | `line-height:1.65` | inline di `Testimoni.jsx` (kartu kutipan) | sebelumnya `1.6`, kini identik dengan sumber |

Catatan penting:

- Nilai `JUDUL_SEKSI` di revisi ini **menggantikan** angka perkiraan pilot
  pertama (`clamp(2rem,3.4vw,2.75rem)` dengan tracking `-0.01em` karangan) —
  angka lama tidak berasal dari berkas sumber mana pun dan sudah dikoreksi.
- Label eyebrow hanya dipasang pada seksi yang memang sudah punya kunci
  terjemahan `*Label` tersedia sebelumnya di `src/lib/terjemahan/{id,en}/landing.js`
  (`sekilasLabel`, `pustakaLabel`, `ajakanLabel`, `tigaJalanLabel`,
  `testimoniLabel`) — kunci ini sudah ada di kamus sebelum pilot ini tetapi
  belum pernah dirender di markup manapun.
- Grid mozaik foto `GaleriKegiatan` memakai `gap-[18px]`, menyamai `.gallery-work`
  (galeri proyek besar) alih-alih nilai KCI lama `gap-4` (16px) — grid foto
  paling dekat sebagai padanan dari sumber untuk konteks ini.

Status: **pilot satu halaman**, bukan perubahan skala global. `DESIGN.md`
§2/§6 tetap berlaku untuk semua halaman lain. Jangan menyalin
`gayaTeks.jsx` atau kelasnya ke halaman/komponen lain (termasuk komponen
catur) tanpa keputusan eksplisit untuk memperluas pilot ini.

## 3. Kerangka dan pemetaan class

| Blok asli | Markup KCI | Nilai inti |
| --- | --- | --- |
| `.gallery-shell` | `div.mx-auto.max-w-[1560px]` | lebar maks 1560px, padding lateral `clamp(20px,4vw,64px)`, `[overflow-anchor:none]` |
| `.gallery-heading` | `header` di atas rel proyek | padding `28px 0 24px` (`26px` di ≤700px) |
| `.gallery-heading` judul | `<p>` (bukan `<h1>` — lihat §4) | `clamp(2.8rem,4vw,4rem)`, leading 1, tracking `-0.02em`; `3rem` di ≤700px |
| `.gallery-heading` paragraf | `<p>` pengantar | `14px/1.5` muted, margin-top 12px; `13px`/margin-top 10px di ≤700px |
| `#gallery-code` | grid dua kolom ≥901px | `184px` + `1fr`, column-gap 36px; ≤900px satu kolom |
| `.gallery-niches` | `<nav>` rel proyek | mendatar + snap di mobile; kolom vertikal `sticky` di ≥901px |
| `.gallery-niche` | butir rel | tinggi min 40px, `500 12px/1.3`, ikon 18px; aktif = kertas putih tanpa bayangan |
| `.gallery-project` | `<article>` per proyek | padding-top 30px, `scroll-margin-top` 90px; proyek berikutnya dipisah `border-t` + padding-top 32px |
| `.gallery-project-header h2` | `<h2>` judul proyek | `clamp(2.4rem,3.4vw,3.3rem)`, leading 1; `2.4rem` di ≤700px |
| `.gallery-brief` | `<blockquote>` + ikon | lebar maks `96ch`, ikon 20px, teks `14px/1.6` |
| `.gallery-baselines h3` / `.gallery-with-label` | `<h3>` label seksi | `500 13px/1.4`, keterangan jumlah `11px/400` |
| `.gallery-baseline-work` | grid 5 kolom | gap 14px (10px ≤1050px); carousel geser lebar tetap 155px ≤700px |
| `.gallery-work` | grid 3 kolom | gap 18px (12px ≤1050px, 20px ≤700px, 1 kolom) |
| `.gallery-piece>button` | tombol foto | rasio `16/10`, tanpa border, `cursor-zoom-in` |
| `.gallery-enlarge` | lencana perbesar | lingkaran 30px (26px varian baseline), transparan sampai hover/fokus |
| `.gallery-comparison-note` | `<p>` catatan | `14px/1.6` muted |
| `#gallery-lightbox` | dialog modal | kartu `min(1560px,100%-32px)` × `94dvh` (`96dvh` ≤700px) di atas backdrop `oklch(13% 0 0/.65)` |
| `.gallery-footer-actions` | blok `<details>` rata kanan | lebar maks `72ch` |
| `#gallery-status` | toast | `role="status"`, posisi fixed bawah tengah |

Nilai lengkap termasuk breakpoint tambahan ada di komentar kepala
`Galeri.jsx` dan di `_astro/gallery.cvrb3iwg.css` pada repo sumber.

## 4. Penyesuaian wajib terhadap standar KCI

Markup sumber diadopsi apa adanya untuk struktur dan ukuran, tetapi tunduk pada
aturan KCI berikut — jangan mengembalikan penyimpangan sumber:

- **Satu H1 per halaman.** Referensi memakai `<h1>` untuk judul "Gallery"; di KCI
  elemen itu jadi `<p>` bergaya identik karena `Hero` KCI sudah menjadi H1 halaman.
  Dua `<h1>` untuk satu entitas melanggar aturan heading level di `kci-anti-slop`.
- **Tanpa bayangan dekoratif.** Semua `box-shadow`/`--ks-lift-*` pada kartu, lencana,
  dan lightbox dibuang; DESIGN.md §4 hanya mengizinkan `shadow-sm` netral atau
  border 1px datar.
- **Warna dari token KCI.** Aksen memakai `text-primary`/`bg-primary`
  (`#0b2f9f`), teks `text-grey-800`/`text-grey-600`, bukan token `--ks-*` sumber.
- **Bahasa.** Label, judul proyek, dan teks UI memakai kamus `src/lib/terjemahan/`
  (id + en) seperti halaman lain, bukan string statis bahasa Inggris permanen —
  teks contoh proyek yang masih bahasa Inggris di implementasi saat ini adalah
  placeholder sampai konten KCI asli tersedia, bukan standar akhir.
- **Aksesibilitas tetap wajib**: fokus terlihat, trap fokus di lightbox, `Escape`/
  panah kiri-kanan berfungsi, `alt` mendeskripsikan gambar, kontras AA.

## 5. Batas berlakunya pengecualian ini

- Berlaku hanya pada kerangka Galeri yang dirujuk di atas; tidak menjadi preseden
  untuk mengubah skala tipografi global (`DESIGN.md` §2/§6).
- Tidak boleh dipakai sebagai dasar membuat komponen `Hero`/`Section`/`Card` baru
  di luar galeri (lihat larangan di `standar-markup.md`).
- Jika galeri kedua dibutuhkan (misalnya katalog foto kegiatan komunitas), gunakan
  ulang kerangka yang sama alih-alih menciptakan varian baru; ajukan ke pengguna
  bila kebutuhan barunya tidak tercakup pola ini.
