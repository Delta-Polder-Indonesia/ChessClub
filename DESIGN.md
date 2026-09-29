---
name: Komunitas Catur Indonesia (KCI)
description: "Portal resmi komunitas catur Indonesia — dua ruang, satu klub: ruang depan korporat dan ruang belakang papan."
colors:
  ink-blue: "#0b2f9f"
  ink-blue-bright: "#4d7cf5"
  press-navy: "#021624"
  slate-950: "#0f172a"
  slate-900: "#1e293b"
  slate-800: "#334155"
  slate-700: "#475569"
  slate-600: "#64748b"
  slate-500: "#94a3b8"
  rule-300: "#cbd5e1"
  rule-200: "#e2e8f0"
  wash: "#f1f5f9"
  mist: "#f8fafc"
  paper: "#ffffff"
  felt: "#262421"
  felt-raised: "#312e2b"
  felt-sunken: "#1e1c18"
  felt-line: "#363431"
  chalk: "#dedede"
  board-green: "#81b64c"
  board-green-hover: "#91c45a"
  square-dark: "#779556"
  square-light: "#ebecd0"
  square-brown-dark: "#b58863"
  square-brown-light: "#f0d9b5"
  verdict-brilliant: "#26c2a3"
  verdict-best: "#81b64c"
  verdict-good: "#95b776"
  verdict-book: "#d5a47d"
  verdict-inaccuracy: "#f7c631"
  verdict-mistake: "#ffa459"
  verdict-miss: "#ff7769"
  verdict-blunder: "#fa412d"
typography:
  display:
    fontFamily: "{typography.serif}"
    fontSize: "clamp(2.4rem, 3.4vw, 3.3rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "{typography.serif}"
    fontSize: "clamp(1.5rem, 3vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "{typography.serif}"
    fontSize: "1.125rem–1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "{typography.sans}"
    fontSize: "0.9375rem–1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.sans}"
    fontSize: "0.75rem–0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.06em"
  serif: "ui-serif, Georgia, Cambria, Times New Roman, Times, serif"
  sans: "Geist Variable, sans-serif"
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  section: "64px"
  section-lg: "80px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.slate-950}"
    rounded: "{rounded.sm}"
    padding: "12px 32px"
    height: "48px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.slate-950}"
    textColor: "{colors.paper}"
  button-on-dark:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
    typography: "{typography.label}"
  button-on-dark-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.slate-950}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.slate-950}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.slate-900}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "8px 12px"
  nav-active:
    textColor: "{colors.ink-blue}"
    backgroundColor: "{colors.paper}"
  board-action-primary:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.felt-sunken}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    typography: "{typography.label}"
  board-action-primary-hover:
    backgroundColor: "{colors.board-green-hover}"
  board-action-secondary:
    backgroundColor: "{colors.felt-raised}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.body}"
  board-input:
    backgroundColor: "{colors.felt-raised}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "8px 12px"
    typography: "{typography.body}"
  board-tab-active:
    backgroundColor: "{colors.felt-raised}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
---

# Design System: Komunitas Catur Indonesia (KCI)

Dokumen ini adalah sumber kebenaran (*single source of truth*) untuk token desain, tipografi, warna, bentuk, dan aturan visual KCI. Nilai dalam frontmatter adalah yang normatif; prosa menjelaskan cara memakainya. Bila prosa dan frontmatter berbeda, frontmatter yang menang.

---

## Overview

**Creative North Star: "Two Rooms, One Club"**

KCI punya dua ruang, dan seluruh sistem visual lahir dari pemisahan keduanya. **Ruang Depan** adalah ruang tamu klub perserikatan: kertas putih, huruf serif, garis rambut 1px, satu warna aksen biru tinta. Di sanalah orang membaca tentang klub, mendaftar jadi anggota, mengunduh e-book, dan mencari jadwal Turnamen. **Ruang Belakang** adalah ruang analisis: arang hangat, huruf sans rapat, satu aksen hijau catur, dan panel 220–280px yang tidak pernah bergeser. Di sanalah orang duduk mengorbit board — Papan Interaktif, Analisa Stockfish, Teka-Teki, Teka-Teki Rush, Quiz Catur.

Kedua ruang ini bukan dua merek. Keduanya milik klub yang sama, mengikuti aturan yang sama: tidak ada gradien dekoratif, tidak ada glow, tidak ada kartu klise, tidak ada emoji. Yang berubah hanya tempatnya, dan tempat itu penting. Ruang depan berdiri di bawah cahaya; ruang belakang berdiri di bawah bohlam meja. Papan harus menjadi objek paling tajam di layar; chrome harus menghilang.

Kerapatan juga berbeda, dan itu disengaja. Ruang depan boleh lapang — white space adalah tanda ketenangan dan kewibawaan. Ruang belakang harus padat dan hemat: di sinilah tempat orang duduk berlama-lama, dan setiap piksel yang dikorbankan untuk hiasan adalah piksel yang dirampas dari papan. Karena itu tipografi berpindah (serif di depan, sans di belakang), radius menyempit (12px di kartu korporat, 6–8px di panel papan), dan elevasi hilang hampir seluruhnya di ruang belakang.

Di ruang depan, kontrol nyaris bersembunyi supaya foto dan teks yang bicara. Di ruang belakang, kontrol menjadi tegas dan high-contrast karena yang dibaca pengguna adalah board, bukan tombolnya.

**Key Characteristics:**
- Dua ruang, dua bahasa, satu klub — dan rute mana pun tahu ruang mana yang ia tempati.
- Rambut 1px dan whitespace sebagai alat utama; bayangan hanya untuk hal yang benar-benar melayang.
- Biru tinta adalah penanda, bukan cat — hampir tidak pernah menjadi isian besar.
- Serif untuk suara, sans untuk mesin, mono hanya untuk data catur.
- Bahasa Indonesia baku sebagai bahasa produk; istilah teknis (PGN, FEN, ECO, ACPL) tidak diterjemahkan.
- Tidak ada klaim, angka, atau kemuliaan yang tidak ada buktinya di repositori.

---

## Colors

Dua palet terpisah, tidak bercampur. Ruang Depan hidup di atas kertas putih dengan satu aksen biru; Ruang Belakang hidup di atas arang hangat dengan satu aksen hijau catur. Keduanya berbagi ramp netral abu-abu yang sama untuk teks, tetapi tidak pernah bertukar aksen.

### Primary — Ruang Depan

- **Biru Tinta / Ink Blue** (`#0b2f9f`): satu-satunya warna tanda tangan KCI. Dipakai sebagai penanda, bukan cat — teks tautan dan label aktif, rel 1px pada item sidebar yang terpilih, nomor langkah, ikon Facebook di footer, garis bawah field pencarian, dan `::selection` beserta caret. Satu-satunya isian biru yang sah adalah blok struktural kecil: trigger Akordeon (`bg-[#0B2F9F] p-4 text-white`), header grafik (`GrafikTools.jsx`), dan lencana nomor langkah pendaftaran.
- **Biru Terang / Ink Blue Bright** (`#4d7cf5`): aksen sekunder untuk state interaktif dan grafik (`--chart-2`). Jarang sebagai dekorasi; jangan naikkan ke permukaan besar.

### Primary — Ruang Belakang

- **Hijau Papan / Board Green** (`#81b64c`): aksen satu-satunya di seluruh alat catur. Berisi tombol aksi utama, border fokus (`focus:border-[#81b64c]` + `ring-2 ring-[#81b64c]/20`), sorotan petak terbaik, dan garis bawah tab aktif. Hover `board-green-hover` (`#91c45a`). Teks di atas hijau selalu `felt-sunken`, bukan putih.
- **Petak Hijau** (`square-dark` `#779556` / `square-light` `#ebecd0`): papan standar KCI, dipakai Papan Interaktif, Analisa, dan Teka-Teki secara default.
- **Petak Cokelat** (`square-brown-dark` `#b58863` / `square-brown-light` `#f0d9b5`): varian papan alternatif yang dapat dipilih pengguna lewat Pengaturan; dipakai juga oleh Buku Pembukaan. Yang penting adalah konsistensi internal satu papan — jangan campur pasangan dari tema berbeda.

### Neutral — Ruang Depan

- **Kertas / Paper** (`#ffffff`): kanvas utama dan permukaan setiap kartu.
- **Kabut / Mist** (`#f8fafc`) dan **Cuci / Wash** (`#f1f5f9`): latar sel understatement untuk header tabel, header kotak peran organisasi, dan tempat gambar belum termuat.
- **Garis Rambut / Rule** (`rule-200` `#e2e8f0`): pemisah utama. Inilah pembatas andalan sistem — bukan bayangan. `rule-300` (`#cbd5e1`) untuk garis yang perlu sedikit lebih tegas (garis bawah judul kelompok pengurus).
- **Teks** (`slate-950` `#0f172a` untuk judul, `slate-800` `#334155` untuk body, `slate-600` `#64748b` untuk sekunder, `slate-500` `#94a3b8` untuk metadata, `slate-900` `#1e293b` untuk body legacy). Turunkan warna teks dari hue permukaan itu sendiri; jangan pernah mengabu teks di atas permukaan berwarna.

### Neutral — Ruang Belakang

- **Bulu / Felt** (`#262421`): kanvas ruang analisis. Charcoal hangat, bukan hitam netral — hangatlah yang membuat arang terasa seperti meja, bukan seperti void.
- **Felt Naik** (`#312e2b`, hover `#2c2926`): permukaan kontrol, tombol, dan panel sekunder.
- **Felt Turun / Sunken** (`#1e1c18`): sidebar, header panel, dan dialog.
- **Garis Felt** (`#363431`, dengan `#4a4742` dan `#3b3935` untuk kontrol yang lebih tegas): pemisah di ruang gelap. Sama rapuhnya seperti garis rambut di ruang terang.
- **Kapur / Chalk** (`#dedede`): teks utama di atas felt; `text-gray-400` untuk sekunder, `text-gray-600` untuk placeholder.

### Semantic — Penilaian Langkah

Ramp `#26c2a3 → #81b64c → #95b776 → #d5a47d → #f7c631 → #ffa459 → #ff7769 → #fa412d` untuk brilliant, best, good, book, inaccuracy, mistake, miss, blunder. Ramp ini milik domain catur dan boleh berwarna ramai — ia membawa informasi, bukan hiasan. Panah: `normalArrow #ffaa00`, `bestArrow #9fcf3f`, `badArrow #eb6150`. Merah fair-play `#dc2626`, biru verifikasi `#1d9bf0`, merah tautan unduh PDF `#e21f23`.

### Named Rules

**The Marker Rule.** Warna biru tinta adalah penanda, bukan cat. Isi biru hanya boleh dalam blok struktural kecil di bawah 64px (trigger, header, lencana angka). Tombol, kartu, dan panel tidak pernah diisi biru.

**The Two Accents Rule.** Biru hanya di Ruang Depan, hijau hanya di Ruang Belakang. Mengimpor satu ke ruang lain menghapus batas yang membuat setiap ruang punya suara sendiri.

**The No-Gradient Rule.** Gradien ungu/pink/biru, teks gradien (`bg-gradient-to-r text-transparent`), dan glow (`shadow-[0_0_20px_…]`) dilarang keras. Satu-satunya gradien yang ada adalah scrim hitam vertikal pada foto Hero (`rgba(0,0,0,.08) → .16 → .8`) — itu cipasan keterbacaan di atas foto, bukan hiasan.

**The Contrast Rule.** Semua pasangan teks/latar wajib ≥4.5:1 untuk body dan ≥3:1 untuk teks besar, termasuk state Selected dan penanda langkah. Warna tidak pernah menjadi satu-satunya pembawa makna: penanda catur selalu berpasangan dengan bentuk atau label.

> **Drift-watch — `--color-primary` sudah tidak lagi biru.** Di `src/index.css:1140` blok `@theme inline` (masih sisa port Analisa) mendeklarasikan ulang `--color-primary: var(--primary)`, dan karena muncul belakangan, ia mengalahkan blok `@theme` proyek di `src/index.css:35`. Terbukti di `dist/assets/style-Ot7I9dAP.css`: `--color-primary:var(--primary)` → `oklch(0.205 0 0)`, yaitu nyaris hitam. Akibatnya `text-primary`, `bg-primary`, `hover:text-primary`, dan `border-primary` merender hitam, bukan biru. Warna biru masih hidup lewat `--chart-1`, `::selection`, `accent-color`, `caret-color`, dan nilai literal `bg-[#0B2F9F]`/`text-[#0B2F9F]` di JSX. **Jangan menulis `text-primary` untuk warna brand dan jangan mengira ia biru.** Perbaikan ada di luar cakupan dokumen ini; yang perlu dilakukan agen sekarang adalah menggunakan literal `#0B2F9F` atau `var(--chart-1)` sampai tokennya dipulihkan.

---

## Typography

**Display Font:** serif — `ui-serif, Georgia, Cambria, Times New Roman, Times, serif` (kelas Tailwind `font-serif`)
**Body Font:** Geist Variable — `Geist Variable, sans-serif` (kelas `font-sans`)
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` (kelas `font-mono`)

**Character:** Serif membawa wibawa dan nuansa akademik di ruang depan; Geist Variable yang rapat dan netral membawa keterbacaan alat di ruang belakang. Keduanya bukan dua merek — serif adalah "bicara", sans adalah "kerjakan". Mono tidak pernah jadi kostum: ia hanya dipakai untuk notasi catur (PGN/FEN), koordinat petak, angka rating, dan waktu engine, yaitu data yang harus bisa disalin dan dibandingkan.

### Hierarchy

- **Display** (300 weight, `clamp(2.4rem, 3.4vw, 3.3rem)`, line-height 1): heading besar blok fitur di Beranda dan batas seksi. Serif, sangat ringan, leading rapat. Tidak pernah melebihi 3.3rem.
- **Headline** (600, `text-2xl` → `md:text-3xl` = 24–30px): judul seksi korporat (`CorporateSection`, `Landing`) dan judul Hero. Serif semibold. Hanya satu per halaman.
- **Hero Title** (700, `text-3xl md:text-[38px]`, `leading-normal`): H1 di dalam blok Hero foto. Serif bold putih, `line-clamp-2`, lebar `lg:w-1/2`. Satu-satunya tempat bold serif sebesar ini muncul.
- **Title** (600, 18–20px): judul kartu, judul item, heading `.prose-kci h3`. Serif semibold.
- **Body** (400, 15–16px, line-height 1.6): paragraf bacaan dan deskripsi. Panjang baris dikunci `65ch`–`75ch`. `.prose-kci p` memakai `16px / 28px`, `#374151`, rata kiri-kanan.
- **Label** (500, 12–13px, tracking `0.06em`, uppercase untuk label data seperti "BERGABUNG" / "NILAI" / header tabel): navigasi, breadcrumb, tombol, badge, metadata. Sans. Uppercase hanya untuk label data pendek, bukan untuk tombol panjang.

### Named Rules

**The Two-Voice Rule.** Serif untuk apa yang dibaca orang; sans untuk apa yang mereka gunakan. Jangan menimpa `font-serif` pada tabel, kontrol, atau sidebar papan; jangan menimpa `font-sans` pada paragraf artikel.

**The Measure Rule.** Setiap blok bacaan panjang dikunci 65–75ch. `.prose-kci` sudah mengunci ini; paragraf di dalam grid corporate (960–1280px) wajib diberi `max-w-*`, bukan membiarkan paragraf memakai lebar penuh.

> **Drift-watch — dua token tipografi bocor dari kaskade yang sama.**
> 1. **Sans bukan Plus Jakarta Sans.** `@theme inline` di `src/index.css:1202` menimpa `--font-sans` menjadi `Geist Variable`. Terbukti di build: `@layer theme{:root{--font-sans:"Geist Variable",sans-serif;--font-serif:ui-serif,Georgia,…}}`. File `plus-jakarta-sans-{400,600,700}.woff2` masih diimpor `@font-face` tapi tidak pernah terpakai — byte sia-sia untuk prinsip "font self-hosted" dan Lighthouse 100 di PRODUCT.md.
> 2. **Suara display adalah font sistem.** `font-serif` menyelesaikan ke `ui-serif, Georgia, …` — tidak ada huruf yang benar-benar dipilih dan di-host sendiri untuk suara display. Untuk dunia yang berteks seperti ini, itu tebakan, bukan pilihan. Sumber yang benar perlu ditentukan (dan self-host) sebelum satu pun halaman korporat baru dibangun. Kedua isu ini berasal dari akar yang sama dengan drift `--color-primary` dan layak diperbaiki bersama.

---

## Layout

Model spasialnya satu kolom terukur dengan sidebar opsional, bukan grid bebas.

- **Container utama:** `max-w-[1080px]`, melebar ke `xl:max-w-7xl` (1280px) dan `2xl:max-w-8xl` di layar sangat lebar, dengan padding lateral `px-6` → `lg:px-8` → `xl:px-0`. Pola ini dipakai Hero, header, dan grid corporate secara konsisten — jangan membangun container ketiga.
- **Grid corporate:** `lg:grid-cols-[220px_1fr]`, sidebar lengket di `top-[88px]` dengan tinggi `calc(100vh-96px)`. Konten di dalamnya dikunci `lg:max-w-[960px] xl:max-w-[1280px]`.
- **Ruang Belakang:** tinggi layar penuh tanpa scroll halaman (`h-dvh`, `lg:h-screen`, `overflow-hidden`), sidebar `220px` (Teka-Teki, Papan Interaktif) atau `236–280px` (Quiz Catur), konten papan `flex-1` dan boleh menyusut ke bawah. Halaman alat tidak pernah memakai container korporat dan tidak pernah menampilkan Header/Footer — allowlist `TANPA_KERANGKA` di `src/components/PageLayout.jsx:8` adalah satu-satunya allowlist resminya.
- **Ritme spasi:** 4px / 8px / 12px / 16px / 24px / 32px. Jarak antar elemen terkait 8–16px; antar kelompok konten 24–32px; antar seksi halaman `py-16` → `py-20` (64–80px). Ruang di atas judul selalu lebih besar dari ruang di bawahnya.
- **Breakpoint:** `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Di luar breakpoint Tailwind, tiga CSS query khusus: `700px` (prose-kci dan baris pengurus runtuh ke satu kolom), `1024px` (sidebar corporate hilang, menu ringkas sticky muncul), dan lima breakpoint warisan Analisa (`navTop 516`, `vertical 1100`, `reduceNav 1280`, `notFullDate 1468`, `reduceSummary 1669`) yang hanya berlaku di dalam `.analisa-root`.
- **Anti-pola grid:** tiga kartu identik dengan ikon-dikepala-teks sebagai struktur halaman dilarang. Yang dipakai sebagai gantinya: satu kartu Featured lebar + dua kartu sekunder, daftar terstruktur dengan garis pemisah, atau tabel. Galeri, bagan organisasi, dan daftar pengurus memakai baris dengan pemisah 1px, bukan kartu.

---

## Elevation & Depth

Sistem ini datar secara default. Kedalaman datang dari **lapisan tonal dan garis 1px**, bukan dari bayangan. Di ruang depan, objek tidak "melayang" kecuali benar-benar melayang — dropdown, dialog, dan overlay yang benar-benar menutupi konten. Di ruang belakang, bayangan nyaris tidak ada; pemisahnya warna latar (`felt` → `felt-raised` → `felt-sunken`) dan garis `#363431`.

### Shadow Vocabulary

- **Card rest** (`shadow-sm`): satu-satunya bayangan yang boleh menempel pada permukaan yang diam. Ada pada `Card` dan `Input` ruang depan.
- **Overlay** (`shadow-xl`): dropdown menu Header, dialog Pengaturan papan, dialog Humans vs Machines, panel tooltip Teka-Teki. Hanya untuk lapisan yang benar-benar menutupi konten.
- **Tidak ada**: glow berwarna, `shadow-md` pada kartu, bayangan offset tanpa blur.-depth yang hilang begitu pun.

### Named Rules

**The Flat-By-Default Rule.** Permukaan datar saat diam. Bayangan muncul hanya sebagai jawaban terhadap state — hover, elevation, atau fokus pada sesuatu yang menutupi halaman.

**The Hairline Rule.** Kalau dua permukaan bersebelahan perlu dibedakan dan keduanya tidak bisa bergerak, taruh garis 1px di antaranya (`border-slate-200` di terang, `border-[#363431]` di gelap). Jangan menumpuk bayangan untuk mencapai hal yang sama sekali sedang dan bisa diselesaikan satu piksel.

---

## Shapes

Bahasa bentuk KCI sengaja menyebutkecil. Tidak ada bentuk pill besar, tidak ada `rounded-3xl`, tidak ada lingkaran dekoratif.

- **Radius kecil, dan disengaja:** kartu korporat `rounded-xl` (12px) adalah sudut terhalus di ruang depan; CTA `rounded` (4px); input dan tombol dense `rounded-md` (6px); fieldset dan chip `rounded-lg` (8px). Di ruang belakang hampir tidak ada radius: `rounded-md` (6px) untuk kontrol, `rounded-lg` (8px) untuk tombol aksi utama dan panel.
- **Pill hanya untuk dua hal:** avatar foto (`rounded-full` 64px di daftar pengurus) dan tombol submit berbentuk lingkaran di overlay pencarian. Untuk yang lain, pil tidak pernah.
- **Batas 1px sebagai bentuk utama:** kartu, tabel, panel, dan daftar memakai `border` 1px; `border-b` pada baris tabel dan baris daftar; `border-b-2` hanya pada tab aktif dan field pencarian; `border-t` pada footer panel. Rel aktif sidebar korporat adalah `::after` 1px setinggi baris — bukan `border-left` berwarna.
- **Papan adalah satu-satunya bentuk bersudut-tegak di sistem:** grid 8×8 dengan petak berbentuk bujur sangkar, dipisahkan 1px garis terang, tanpa radius di sekelilingnya.

---

## Components

Untuk tiap komponen: bentuk, warna, state. Nilai literal adalah yang ada di kode hari ini.

### Buttons

Chrome bisu, papan keras — kontrol di ruang depan nyaris bersembunyi dan bergaris tipis; kontrol papan rapat dan berkontras tinggi, karena yang dibaca adalah board.

- **Shape:** `rounded` (4px) di ruang depan; `rounded-md` (6px) untuk kontrol generik, `rounded-lg` (8px) untuk aksi utama ruang belakang.
- **Primary (Publik):** `border border-black bg-transparent text-black`, serif, `font-semibold text-sm`, `px-8 py-3`, `gap-2`. Berbalik di atas foto gelap menjadi `border border-white text-white`.
- **Hover / Focus:** hover mengisi penuh — `hover:bg-black hover:text-white` (atau putih di atas gelap). Fokus: `focus-visible:ring-2 ring-primary ring-offset-2`, offset selalu ada supaya cincin tidak menempel pada teks.
- **Varian `Button` (`src/components/ui/button.jsx`):** `default` garis hitam transparan, `outline` garis `slate-200` di atas putih dengan hover `slate-50`, `ghost` tanpa garis dengan hover `slate-100`, `secondary` `bg-slate-100`. Ukuran: `sm h-9`, `default h-10`, `lg h-11`, `icon h-10 w-10`. Semua `rounded-md`, `text-sm font-semibold`, `gap-2`. Ada state `loading` (spinner `Loader2` + `aria-busy`) dan `disabled` (`opacity-50`, `pointer-events-none`).
- **Aksi Utama (Papan):** `bg-[#81b64c] text-[#1e1c18]`, `font-bold`, `uppercase`, `tracking-[0.14em]`, `rounded-lg`, hover `#91c45a`. Ini satu-satunya tombol berisi penuh di seluruh produk. Teks gelap di atas hijau, tidak pernah putih.

### Cards / Containers

- **Sudut:** `rounded-xl` (12px) ruang depan, `rounded-md`–`rounded-lg` ruang belakang.
- **Latar:** `bg-white` di ruang depan; `bg-[#262421]` atau `bg-[#312e2b]` di ruang belakang.
- **Strategi bayangan:** `shadow-sm` di `Card`, tidak ada di ruang belakang.
- **Garis:** `border border-slate-200` ruang depan; `border-[#363431]` atau `border-[#312e2b]` ruang belakang.
- **Padding internal:** `p-6` di `Card` (`CardHeader`/`CardContent`/`CardFooter`); `p-4` untuk `DocumentCard`; `p-2.5` untuk panel papan yang padat.
- **Kartu bersarang selalu salah.** Kalau sebuah kartu butuh kartu di dalamnya, strukturnya salah — pakai `div` dengan `border` atau baris tabel.

### Inputs / Fields

- **Style (Publik):** `h-10`, `rounded-md`, `border border-slate-300`, `bg-white`, `text-sm text-slate-900`, `placeholder:text-slate-400`.
- **Style (Papan):** `border border-[#363431]` atau `border-slate-600` di atas `bg-[#262421]`, `text-gray-200`, `placeholder-gray-500`.
- **Focus:** `focus:border-[#0B2F9F] focus:ring-2 focus:ring-[#0B2F9F]/20` di ruang depan; `focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20` di ruang belakang. Border berubah warna **dan** cincin muncul — warna saja tidak cukup untuk set state fokus yang terlihat.
- **Error / Disabled:** `border-red-500/60 text-red-300` di panel papan; `disabled:cursor-not-allowed disabled:opacity-50` di kedua ruang.
- **Field pencarian overlay** adalah pengecualian yang disengaja: `border-b-2 border-primary`, input `bg-transparent` tanpa garis, `text-2xl md:text-3xl`. Garis bawah = field, bukan kotak.

### Navigation

- **Header Publik:** `fixed top-0 z-50`. Transparan di atas Hero foto, berubah `bg-white border-b border-slate-200` saat `scrolled` (transisi `duration-200`), dan logo ber-swap dari varian `light` ke `dark`. Padding vertikal menyusut `py-6` → `py-3`. Baris atas (tautan sekunder) disembunyikan saat header menempel pada layar kecil.
- **Sidebar Corporate:** sticky `top-[88px]`, `text-sm`, dengan rel `::after` 1px `slate-200` setinggi daftar. Item aktif: `text-[#0B2F9F] font-bold` + rel `::after` 1px biru. Item lain `text-slate-500`, hover `text-slate-600` + rel abu-abu yang memanjang 300ms. Di bawah `lg` sidebar diganti tombol ringkas sticky dengan `border-l-4` biru pada label aktif.
- **Sidebar Ruang Belakang:** lebar tetap `220–280px`, `bg-[#1e1c18]`, `border-r border-[#312e2b]`, tidak pernah sticky — ia bagian dari layout `h-dvh`.
- **Tab:** `rounded-sm`, `text-sm font-medium`, `data-[state=active]:bg-white` + `shadow-sm` di ruang depan; `border-b-2 border-[#81b64c]` di ruang belakang.

### Tables / Data

`text-sm`, header `h-10 px-2 font-medium whitespace-nowrap`, sel `p-2`, `border-b` 1px `slate-200` per baris, `hover:bg-muted/50`. Baris Corporate (`CorporateTable`) memakai grid `grid-cols-4` dengan label `font-bold` dan baris terakhir tanpa border bawah. Angka rating, ACPL, dan waktu engine memakai `tabular-nums` agar kolom sejajar saat nilainya berubah.

### Document Card

`flex gap-4 p-4 border border-[#E2E8F0] rounded-lg bg-white` dengan ikon PDF 32px di kiri dan tautan unduh `text-[#E21F23] font-semibold` + ikon panah. Grid `md:grid-cols-2 gap-6`. Unduhan adalah satu-satunya tempat merah yang dibenarkan di ruang depan.

### Signature — Papan Catur

Satu-satunya komponen yang tidak berasal dari pustaka mana pun, dan satu-satunya tempat di produk ini yang diizinkan berwarna ramai.

- **Petak:** pasangan gelap/terang yang konsisten (`#779556`/`#ebecd0` default, `#b58863`/`#f0d9b5` varian). Biji-biji memakai piece SVG, `draggable=false`, `decoding=async`.
- **Tanda langkah:** warna ramp verdict (lihat Colors) **selalu** berpasangan dengan bentuk atau label — petak berisi ikon kualitas di sudut, panah untuk langkah, bentuk untuk IP. Pengguna dengan gangguan penglihatan warna harus tetap bisa membaca setiap tanda.
- **Bilah evaluasi:** vertikal penuh tinggi di sisi papan, dua warna (`#ffffff` / `#403d39`) dengan angka `#dedede` atau `#262421` yang menyesuaikan kontras mengikuti sisi petak.
- **Papan adalah layout, bukan konten.** Di setiap halaman papan, ruang petak dan kejelasan kontrol langkah mendahulukan chrome, promosi, dan hiasan. Di bawah 1024px, panel samping pindah ke bawah dan papan tetap Square.

---

## Do's and Don'ts

### Do:

- **Do** pilih ruangnya lebih dulu sebelum menulis satu baris pun: rute dengan papan, engine, teka-teki, atau kuis memakai bahasa Ruang Belakang (felt, sans, hijau catur, sidebar tetap, tanpa Header/Footer); semuanya else memakai bahasa Ruang Depan (kertas, serif, biru tinta, container 1080px).
- **Do** pakai garis 1px `border-slate-200` untuk memisahkan permukaan, dan `bg-slate-50`/`#f8fafc` untuk membedakan header tabel tanpa menambah garis lagi.
- **Do** batasi biru tinta pada penanda: teks tautan, label aktif, rel 1px, nomor langkah, cincin fokus. Jarang, dan selalu di atas kertas.
- **Do** jadikan warna langkah sebagai pasangan — warna verdict selalu bersama bentuk, ikon, atau label teks.
- **Do** kunci panjang baris bacaan di 65–75ch dan ruangkan lebih banyak di atas judul daripada di bawahnya.
- **Do** jaga radius tetap kecil: `rounded` untuk CTA publik, `rounded-md` untuk kontrol, `rounded-lg` untuk aksi papan, `rounded-xl` hanya untuk kartu korporat.
- **Do** sediakan hover, focus-visible, disabled, loading, dan error untuk setiap kontrol, dengan cincin fokus yang punya `ring-offset`.
- **Do** hormati `prefers-reduced-motion` (sudah ada di `src/index.css:1404`); setiap keyframes KCI punya pasangan `animation: none` di sana.
- **Do** sebutkan nama fitur apa adanya — "Papan Analisa Stockfish", "Buku Panduan PDF", "Turnamen Catur Cepat" — bukan kategori yang di-rewrite jadi jargon.
- **Do** nyatakan kekurangan dengan jujur. Galeri masih contoh, belum ada testimoni, belum ada statistik; halaman yang butuh angka itu harus mengatakannya.

### Don't:

- **Don't** pakai gradien ungu/pink/biru, teks gradien, atau glow. Sudah dilarang keras di PRODUCT.md; sistem ini tidak pernah memakainya di mana pun.
- **Don't** isi biru pada tombol, kartu, atau panel. Biru tinta adalah penanda, bukan cat.
- **Don't** campur aksen antar ruang. Biru tidak masuk ke alat catur; hijau tidak masuk ke halaman korporat.
- **Don't** pakai `border-left`/`border-right` berwarna lebih dari 1px pada kartu, item daftar, atau callout. Rel aktif sidebar adalah `::after` 1px, bukan pita 4px.
- **Don't** letakkan kicker atau eyebrow di atas judul. Judul membawa bobotnya sendiri; label yang berulang di atas setiap judul dihapus.
- **Don't** susun halaman sebagai tiga kartu identik ikon-dikepala-teks. Pakai satu kartu featured + dua sekunder, daftar bergaris, atau tabel.
- **Don't** meletakkan label nomor/kicker (01 / 02 / 03) kecuali urutan itu sendiri membawa informasi yang dibutuhkan pembaca.
- **Don't** pakai bayangan sebagai latar. `shadow-sm` hanya pada kartu dan input; `shadow-xl` hanya pada overlay yang benar-benar menutupi konten.
- **Don't** pakai `rounded-3xl`, pill besar, atau lingkaran dekoratif. Yang diizinkan: avatar 64px dan tombol submit berbentuk lingkaran di overlay pencarian.
- **Don't** pakai monospace sebagai kostum "teknis". Mono hanya untuk PGN/FEN, koordinat petak, rating, dan waktu engine.
- **Don't** pakai emoji sebagai ikon. Ikon adalah SVG yang digambar dalam satu ketebalan garis — dan proyek ini tidak memakai emoji di UI maupun dokumen.
- **Don't** menulis `text-primary`, `bg-primary`, atau `border-primary` mengharapkan warna biru; token itu saat ini nyaris hitam (lihat Drift-watch di Colors). Pakai literal `#0B2F9F`.
- **Don't** mengarang angka, testimoni, klien, atau studi kasus. Kalau buktinya tidak ada di repositori, halaman itu menyebut kekurangan, bukan mengisinya.
- **Don't** memakai kata buzz SaaS yang kosong — supercharge, streamline, memberdayakan ekosistem, solusi terbaik masa depan. Nada: Indonesia baku, lugas, dan berorientasi fakta.
