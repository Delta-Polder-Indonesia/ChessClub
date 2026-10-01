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
- **Display / H1 Hero dan H2 Judul Seksi:** `text-[clamp(2.4rem,3.6vw,3.4rem)]` (38–54px), `font-serif font-light`, `leading-[1.04]`, `text-balance`. Varian `text-white` di atas foto gelap. Satu skala untuk H1 dan H2 alike — hierarki dibentuk oleh **warna dan posisi**, bukan ukuran.
- **Subjudul di dalam `.prose-kci`:** `1.5rem` (24px), `font-semibold` — hasil `.prose-kci h2`.
- **H3 Sub-seksi / Kartu:** `1.125rem` s.d. `1.25rem` (18–20px), font-semibold. Label kartu ringkas boleh `0.875rem` (14px).
- **Body Text:** `0.9375rem` s.d. `1rem` (15–16px), line-height 1.6, max-width `65ch`–`75ch`.
- **Kutipan tarik (pull quote):** `1.5rem` s.d. `1.875rem` (24–30px), italic, font-medium, `text-grey-800` — sejajar rentang atas subjudul.
- **Caption / Meta:** `0.75rem` s.d. `0.8125rem` (12–13px). Tidak ada teks di bawah 12px.
- **Label UI padat:** 12px minimum.
- **Tabel data padat** (peringkat, tingkatan rating): dikecualikan memakai `13–14px` karena kepadatan baris; tabel di dalam artikel (`.tabel-kci`) tetap mengikuti ukuran body.

### Aturan Satu Suara:
- **Judul display diletakkan DI LUAR `.prose-kci`.** `.prose-kci` hanya untuk isi paragraf. Alasannya struktural, bukan selera: `.prose-kci h2` punya specificity (0,1,1) dan menang atas kelas utilitas seperti `text-xl`, sehingga `text-*` pada `h2` di dalam wrapper itu adalah kode mati. Judul display masuk lewat slot `title` pada `PageArtikel`, atau `h2` yang menjadi saudara `prose-kci` pada komponen seksi (`Sekilas`, `VisiMisi`, `MaknaLogo`, `Tonggak`, `CorporateSection`).
- Dalam satu halaman, **semua judul seksi memakai gaya persis sama** (`font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800`; varian `text-white` di atas foto gelap). Tidak ada seksi dengan ukuran, ketebalan, atau kapitalisasi judul yang berbeda.
- **Teks isi memakai satu ukuran** dan **label/meta memakai satu ukuran caption** (`text-[13px]`) di seluruh halaman.
- Warna teks hanya dari token palet: judul `text-grey-800`, teks sekunder `text-grey-600` — bukan `text-black`/`text-slate-900`/`text-slate-600` yang berada di luar palet. Kartu memakai `bg-paper`, bukan `bg-white` yang lebih terang dari kanvas.
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
- Jangan mengarang metrik, testimonial, dokumentasi, sumber, tanggal, atau klaim keberhasilan.
- Hindari label, heading, dan paragraf yang mengulang informasi sama.

---

## 6. Hirarki dan Ukuran Teks Resmi

| Peran | Mobile | Desktop | Line-height | Penggunaan |
|---|---:|---:|---:|---|
| H1 hero | 36px | 40px | 1.15–1.2 | Satu judul utama per halaman |
| H2 bagian | 24px | 30px | 1.25–1.35 | Pokok bahasan utama |
| H3 subseksi | 18px | 20px | 1.35–1.45 | Rincian di bawah H2 |
| H4 kelompok | 16px | 18px | 1.4 | Kelompok di bawah H3 |
| Lead | 17px | 18px | 1.6 | Pengantar ringkas |
| Body/list | 16px | 16px | 1.6 | Bacaan utama |
| Caption/meta | 13px | 13px | 1.5 | Keterangan dan metadata |
| UI padat | minimum 12px | minimum 12px | minimum 1.4 | Label/kontrol, bukan paragraf |

- Teks di bawah 12px dilarang.
- Body tidak memakai tracking tambahan; tracking negatif hanya untuk display besar yang telah diuji.
- H1 hanya satu. Heading tidak boleh melompati level.
- Judul lebih dekat dengan isi sesudahnya daripada blok sebelumnya.
- Ukuran arbitrary seperti `text-[11px]` tidak boleh ditambahkan pada konten baru. Jika peran belum tersedia, perbarui sistem ini terlebih dahulu.

---

## 7. Container dan Ritme Konten

- Bacaan panjang dibatasi sekitar **65–75 karakter per baris**.
- Container halaman standar maksimum **1080px**, dengan padding lateral **24px mobile** dan **32px desktop**.
- Tabel, diagram, galeri, dan gambar lebar boleh memakai lebar container; paragraf tetap kembali ke measure bacaan.
- Elemen dalam satu kelompok berjarak 8–16px; antarkelompok 24–32px; antarbagian utama 64–80px.
- Jarak paragraf ke media penjelas 24–32px, media ke caption 8px, dan caption ke teks lanjutan 24px.
- Jangan menggunakan satu nilai gap untuk seluruh halaman. Spacing harus menunjukkan hubungan informasi.
- Pada mobile, body tidak boleh menyentuh tepi viewport atau menimbulkan scroll horizontal.

---

## 8. Anatomi Halaman Konten

Setiap halaman menentukan jenisnya sebelum markup dibuat:

1. **Informasi organisasi/program:** hero → lead → bagian tematis → visual relevan → data/daftar → halaman berikutnya.
2. **Artikel edukasi:** hero/masthead → lead → gambar pembuka bila perlu → pembahasan H2/H3 → contoh/diagram → penutup.
3. **Berita kegiatan:** judul dan metadata → lead → dokumentasi utama → isi → dokumentasi tambahan yang informatif.
4. **Panduan:** tujuan → prasyarat → langkah bernomor → screenshot pada langkah penting → hasil dan masalah umum.
5. **Daftar/data:** pengantar → filter bila perlu → list/table → loading, empty, error, dan success state.
6. **Galeri/visual:** pengantar → navigasi topik → brief → visual utama dan pendukung → keterangan.
7. **Workspace/alat:** mengikuti kerangka fitur khusus; tidak disamakan dengan artikel.

Gunakan `HalamanIsi`, `PageArtikel`, dan `.prose-kci` untuk konten publik biasa. Pola rinci berada di `.agents/skills/kci-frontend/references/standar-konten.md`.

---

## 9. Media, Gambar, dan Ilustrasi

Visual wajib disediakan ketika pembaca perlu melihat tampilan fitur, langkah, posisi catur, objek, buku, tokoh, lokasi, kegiatan, struktur, data, perubahan, atau perbandingan.

- Visual harus menjelaskan isi; jangan menambahkan gambar hanya untuk mengisi ruang.
- Foto dokumentasi tidak boleh diganti gambar stok atau gambar generatif yang dipresentasikan sebagai peristiwa nyata.
- Screenshot, diagram, papan catur, dan sampul buku memakai `object-contain` bila crop menghilangkan informasi.
- Foto boleh memakai `object-cover` hanya jika subjek penting tetap utuh.
- Media berketerangan memakai `<figure>` dan `<figcaption>`.
- `alt` mendeskripsikan informasi visual; caption menjelaskan konteks. Jangan menyalin teks yang sama.
- Gambar harus memiliki dimensi atau rasio yang mencegah layout shift.
- Jika aset penting belum tersedia, laporkan kebutuhan aset; jangan mengarang dokumentasi.

Rincian teknis berada di `.agents/skills/kci-frontend/references/standar-media.md`.

---

## 10. Semantik, State, dan Aksesibilitas

- Gunakan heading, list, table, figure, button, link, nav, dan dialog sesuai fungsi.
- Focus state harus terlihat dan seluruh kontrol dapat dipakai dengan keyboard.
- Warna tidak boleh menjadi satu-satunya penanda status.
- Form mempunyai label serta state error, success, disabled, dan loading yang jelas.
- Motion menghormati `prefers-reduced-motion`; konten tetap terlihat ketika animasi gagal atau dimatikan.
- Semua teks memenuhi WCAG AA.

---

## 11. Pengecualian Halaman Khusus

Analisa, Papan Interaktif, Teka-teki, Dashboard, pembaca e-book, grafik, tabel padat, dan Galeri boleh memakai kepadatan atau container khusus. Pengecualian:

- harus berasal dari kebutuhan tugas;
- hanya berlaku pada area tersebut;
- tidak boleh disalin ke artikel umum;
- tetap mematuhi minimum keterbacaan, semantik, keyboard, kontras, dan reduced-motion;
- harus tercatat di skill area atau komponen terkait.

Galeri (`src/halaman/MediaDanInformasi/Galeri.jsx`) memakai skala tipografi dan grid
tersendiri yang diadopsi dari markup konten (bukan komponen catur) sebuah situs
galeri contoh — dicatat lengkap di
`.agents/skills/kci-frontend/references/standar-galeri.md`. Skala itu hanya berlaku
di kerangka Galeri dan tidak mengubah §2/§6 di atas untuk halaman lain.

Landing (`/`, `src/halaman/Landing/`) memilot judul seksi dan label kecil dari
adopsi yang sama (bukan grid/lightbox Galeri) lewat `src/halaman/Landing/gayaTeks.jsx`
— dicatat di `references/standar-galeri.md` §2b. Ini pilot satu halaman; belum
menjadi keputusan untuk mengubah skala H2 global.

---

## 12. Urutan Otoritas

1. Permintaan eksplisit pengguna untuk tugas aktif.
2. `AGENTS.md` untuk cakupan dan proses.
3. `DESIGN.md` ini untuk seluruh keputusan visual.
4. Skill `kci-frontend` untuk implementasi.
5. Skill `kci-anti-slop` untuk audit larangan.
6. Implementasi existing yang masih sesuai standar ini.

Dokumen atau kode lama yang bertentangan tidak menjadi preseden. Jangan memperbaikinya secara massal tanpa persetujuan cakupan.

---

## 13. Arsitektur Komponen Satu Pintu per Domain

“Satu pintu” berlaku **di dalam domain yang sama**, bukan satu bentuk untuk seluruh situs. Konten editorial, fitur belajar, papan catur, analisa, dan dashboard mempunyai kebutuhan serta karakter berbeda.

| Domain | Sumber resmi | Batas |
|---|---|---|
| Halaman konten publik | `src/components/PageBagian.jsx`, `src/components/konten/AksiKonten.jsx`, dan `src/components/konten/TabelKonten.jsx` | Tipografi, bagian, media, kutipan, catatan, aksi, serta tabel konten |
| Program dan fitur belajar non-catur | komponen di `src/halaman/ProgramKami/` | Tidak mengikuti bentuk artikel; pertahankan karakter fitur dan alurnya |
| Seluruh antarmuka catur | `src/halaman/Analisa/komponen/` | Satu rumah papan, bidak, jam, evaluasi, nama pemain, panel, indikator, dan ikon catur untuk Analisa, Papan Interaktif, Teka-teki, Quiz, serta Rush |
| Mode/alur catur | folder halaman masing-masing | Hanya orkestrasi, state, dan logika mode; jangan membuat ulang komponen visual catur yang sudah ada |
| Pengurus/dashboard | `src/components/ui/` dan komponen Pengurus | Tabel padat, form operasional, dialog, dan state administrasi |
| Ikon umum non-catur | `lucide-react` dan `src/components/icons.jsx` | Ikon catur tetap berasal dari `Analisa/komponen/svg/` |

Aturan:

- Halaman konten tidak menciptakan bentuk tombol, tabel, media, atau blok baru di setiap halaman; gunakan pintu konten.
- Komponen Program Kami, antarmuka catur, dan Pengurus tidak dipaksa memakai rupa halaman konten.
- Semua fitur catur mencari dan memperluas `src/halaman/Analisa/komponen/` sebelum membuat komponen visual lokal.
- Folder Papan Interaktif, Teka-teki, Quiz, dan Rush boleh menyimpan komponen orkestrasi yang khusus alur, tetapi bukan salinan papan, bidak, ikon, jam, evaluasi, atau kontrol catur umum.
- Komponen lintas domain boleh berbagi perilaku aksesibel, tetapi keluarga domain menentukan bentuk visualnya.
- Jangan memindahkan ikon atau komponen catur ke komponen halaman umum hanya demi menyatukan rupa.
- Kode lama dimigrasikan per domain; keberadaan pola lama bukan izin menambah variasi baru.
