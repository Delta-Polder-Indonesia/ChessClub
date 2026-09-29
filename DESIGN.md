# Design System — Komunitas Catur Indonesia (KCI)

Dokumen ini adalah sumber kebenaran (*single source of truth*) untuk token desain, tipografi, warna, dan aturan visual KCI.

---

## 1. Palet Warna (Color System)

| Token | Nilai Hex | Peran & Penggunaan |
|---|---|---|
| `--color-primary` | `#0B2F9F` | Aksen brand utama: tautan aktif, indikator terpilih, tombol primer (outline/fill aksen) |
| `--color-blue-400` | `#4D7CF5` | Aksen biru terang sekunder / state interaktif |
| `--color-hero` | `#021624` | Latar gelap hero seksi pembuka (kontras tinggi, berwibawa) |
| `--color-grey-800` | `#1E293B` | Teks judul utama & body gelap |
| `--color-grey-600` | `#475569` | Teks sekunder, deskripsi, metadata |
| `--color-grey-200` | `#E2E8F0` | Border halus 1px antar seksi & kartu |
| `--color-paper` | `#FFFFFF` | Latar kanvas utama & permukaan kartu |

### Aturan Warna:
- **Dilarang keras:** Gradien ungu/pink/biru, teks gradasi (`bg-gradient-to-r text-transparent`), dan efek bayangan pendar/glow (`shadow-[0_0_20px_...]`).
- Semua kombinasi warna teks dan latar wajib lolos uji kontras **WCAG AA** ($\ge 4.5:1$ untuk body, $\ge 3:1$ untuk teks besar).
- **Palet grafik** (komponen `ui/chart`, `tools/GrafikTools`): `--chart-1` `#0B2F9F` · `--chart-2` `#4D7CF5` · `--chart-3` `#FFDC58` · `--chart-4` `#FF6B6B` · `#7FBC8C` sebagai `--chart-5`.
- **Zona token shadcn/Analisa** (`:root`/`.dark`/`@theme inline` di bagian bawah `src/index.css`): token `--primary`, `--background`, `--radius`, dst. hanya untuk komponen `components/ui/`. **Dilarang menimpa token global** (`--color-primary`, `--color-grey-*`, `--color-paper`, skala radius Tailwind) dari zona ini.

---

## 2. Tipografi (Typography System)

- **Font Utama (Serif — site-wide):** stack `serif` bawaan Tailwind, diterapkan lewat kelas `font-serif`. Ini adalah tipografi **default seluruh situs** — judul Hero, judul seksi, isi paragraf, dan caption menggunakan serif untuk nuansa berwibawa/akademis. Terapkan `font-serif` pada pembungkus konten tiap halaman (mis. `<div className="font-serif">` di dalam `HalamanIsi`) dan pada judul/isi Hero.
- **Font Sans (`"Geist Variable", system-ui, sans-serif`, dibundel lewat paket npm `@fontsource-variable/geist` di `src/index.css`):** untuk elemen UI/kontrol yang padat dan fungsional — navigasi/breadcrumb, tombol, badge, tabel data, dan antarmuka operasional. Bukan font utama untuk teks bacaan. (`--font-sans` hanya boleh didefinisikan sekali di `@theme` utama; jangan menimpanya di blok `@theme` lain.)
- **Font Mono:** Digunakan untuk notasi catur (PGN/FEN), koordinat petak, dan waktu engine.

### Skala Tipografi:
- **Display / H1 Hero:** `2.25rem` s.d. `2.5rem` (36–40px), font-bold/font-semibold, leading-tight.
- **H2 Judul Seksi:** `1.5rem` s.d. `1.875rem` (24–30px), font-semibold, leading-snug.
- **H3 Sub-seksi / Kartu:** `1.125rem` s.d. `1.25rem` (18–20px), font-semibold.
- **Body Text:** `0.9375rem` s.d. `1rem` (15–16px), line-height 1.6, max-width `65ch`–`75ch`.
- **Kutipan tarik (pull quote):** `1.5rem` s.d. `1.875rem` (24–30px), italic, font-medium, `text-grey-800` — sejajar rentang atas H2.
- **Caption / Meta:** `0.75rem` s.d. `0.8125rem` (12–13px), text-slate-500. Tidak ada teks di bawah 12px.
- **Tabel data padat** (peringkat, tingkatan rating): dikecualikan memakai `13–14px` karena kepadatan baris; tabel di dalam artikel (`.tabel-kci`) tetap mengikuti ukuran body.

### Aturan Satu Suara:
- Dalam satu halaman, **semua judul seksi memakai gaya H2 yang persis sama** (`font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800`; varian `text-white` di atas foto gelap). Tidak ada seksi dengan ukuran, ketebalan, atau kapitalisasi judul yang berbeda.
- **Teks isi memakai satu ukuran** (`text-base leading-[1.6] text-grey-600`) dan **label/meta memakai satu ukuran caption** (`text-[13px]`) di seluruh halaman.
- Warna teks hanya dari token palet: judul `text-grey-800`, teks sekunder `text-grey-600` — bukan `text-black`/`text-slate-900`/`text-slate-600` yang berada di luar palet.
- **Teks isi rata kiri (start) di seluruh situs** — tidak memakai rata kiri-kanan (justify), yang meninggalkan celah spasi antar-kata tidak merata.

---

## 3. Tata Letak & Spasi (Layout & Spacing Rhythm)

- **Container Max-Width:** `1080px` (atau `max-w-7xl` untuk layar sangat lebar), padding lateral `px-6` (mobile) s.d. `px-8` (desktop).
- **Ritme Spasi:**
  - Jarak antar elemen terkait rapat: `gap-2` s.d. `gap-4` (8–16px).
  - Jarak antar kelompok konten: `gap-6` s.d. `gap-8` (24–32px).
  - Jarak vertikal antar seksi halaman: `py-16` s.d. `py-20` (64–80px).
- **Hindari Grid 3 Kartu Identik:** Gunakan variasi tata letak seperti 1 kartu sorotan lebar (*featured card*) + 2 kartu sekunder, atau daftar terstruktur.

---

## 4. Batas & Radius (Borders & Radius)

- **Batas (Border):** Garis tegas `1px` (`border border-slate-200` atau `border-slate-300`).
- **Radius:** `rounded` (4px) atau `rounded-lg` (8px). Hindari bentuk pill raksasa atau `rounded-3xl` yang kekanak-kanakan.
- **Elevasi & Bayangan:** Gunakan bayangan netral tipis (`shadow-sm`) atau cukup border `1px` datar (*flat restrained*).

---

## 5. Copywriting & Integritas Konten

- Gunakan Bahasa Indonesia yang baku, lugas, dan terarah.
- **Dilarang:** Kata-kata kosong klise (*supercharge, streamline, memberdayakan ekosistem, solusi terbaik masa depan*).
- Utamakan fakta: sebutkan nama fitur langsung (*"Papan Analisa Stockfish"*, *"Buku Panduan PDF"*, *"Turnamen Catur Cepat"*).
