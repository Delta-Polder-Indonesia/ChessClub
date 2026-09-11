---
name: kci-frontend
description: Frontend conventions for the Komunitas Catur Indonesia (KCI) ChessClub site - React 18, Vite 6, Tailwind CSS v4, react-router-dom v7, Indonesian naming, i18n workflow, standard page markup from existing components, and a restrained corporate design language extracted from jekyll-simple (no emoji, no gradients, single accent, thin borders - anti AI-slop). Use when editing anything under src/, index.html, vite.config.js, or public/.
metadata:
  project: chessclub-kci
  area: frontend
---

# Frontend KCI — Komunitas Catur Indonesia

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

## Stack (jangan diganti tanpa persetujuan pengguna)

- React 18 + Vite 6 + Tailwind CSS v4 (plugin `@tailwindcss/vite`) + react-router-dom v7.
- `lucide-react` (ikon), `react-helmet-async` (meta/SEO), `pdfjs-dist` (pembaca PDF e-book), `chess.js` (logika catur), `zod` (validasi).
- Node >= 22. Tanpa TypeScript, tanpa framework CSS lain, tanpa state library eksternal.

## Bahasa & penamaan

- Semua nama berkas, komponen, fungsi, variabel, dan komentar memakai **Bahasa Indonesia**:
  komponen `VerifikasiAkun.jsx`, hook diawali `gunakan` (`src/lib/gunakanEngineCatur.js`), modul `src/lib/terjemahan.js`.
- Komponen umum → `src/components/`; halaman → folder sendiri di `src/halaman/`
  (baca `src/halaman/BACA-DULU.md` untuk peta menu sebelum menambah halaman).
- Keanggotaan hanya menjadi tab di `StrukturGrupCatur/`; `PendaftaranAnggota` adalah halaman aksi terpisah.

## Bahasa desain — korporat rapi, anti "AI slop"

Acuan gaya: tema **jekyll-simple** (berbasis Skeleton). Prinsipnya satu kalimat:
**tipografi dan whitespace yang bekerja, bukan dekorasi.** Situs korporat yang tenang
terlihat mahal; situs yang penuh gradien, emoji, dan bayangan terlihat murahan.

### Prinsip komposisi

1. **Datar (flat).** Kedalaman dibuat lewat whitespace dan garis 1px, bukan bayangan atau gradien.
2. **Satu warna aksen.** `#0B2F9F` hanya untuk CTA primer, tautan aktif, dan status penting. Sisanya netral.
3. **Hierarki lewat ukuran dan bobot yang tertahan.** Tidak semuanya tebal; hanya satu elemen terkuat per layar.
4. **Copy faktual dan spesifik** — angka, nama resmi, tanggal, nama program. Bukan slogan kosong.

### Token acuan (diekstrak dari jekyll-simple, dipadukan dengan brand KCI)

| Elemen | Nilai acuan |
| --- | --- |
| Container | maks. 960–1100px, padding lateral 24–32px, konten di tengah |
| Teks isi | 15–16px, line-height 1.6, weight 400, warna `#222` |
| Teks sekunder / muted | `#828282` / `#b1b1b1` |
| Permukaan | putih / `#fdfdfd`; blok gelap boleh `#021624` (hero brand) — **polos, tanpa gradien** |
| Pemisah | garis 1px `#E1E1E1` antar bagian dan kartu; atau whitespace 64–96px |
| Radius | 4px (maks. 8px) |
| Heading | H1 24–38px weight 600; H2 22–30px weight 600; H3 18px weight 500 — sisanya weight 400 |
| Tombol | tinggi 38–44px; teks 11–12px uppercase, letter-spacing `.1rem`; primer solid `#0B2F9F`, sekunder outline `#bbb` |
| Tautan | warna sama dengan teks; hover → `#b1b1b1` + underline; transisi warna halus |
| Font | Plus Jakarta Sans self-hosted (`src/fonts/`) — tidak ada font/CDN tambahan |

### Anatomi halaman & landing yang benar

1. **Header tipis** — logo kiri, nav kanan, maksimal satu CTA. Bukan header raksasa ber-gradien.
2. **Hero kiri-rata** (bukan everything-centered) — H1 satu kalimat, satu paragraf subteks faktual,
   CTA primer + CTA sekunder outline. Blok gelap `#021624` polos bila perlu kontras.
3. **Isi** — grid kartu ber-border tipis tanpa bayangan; bagian dipisah `hr` 1px atau whitespace besar.
4. **Footer** — kolom tautan rapi, teks kecil `#828282`.

### Larangan keras (pemicu "AI slop" — jangan pernah)

- **Emoji atau karakter dekoratif** di UI, heading, tombol, maupun copy halaman.
- Gradien ungu-pink/biru, "blob", glow, glassmorphism (`backdrop-blur`), warna neon.
- `shadow-2xl` + `rounded-3xl` di semua kartu; font-weight 800–900 di mana-mana.
- Copy generik ("Selamat datang di website kami!", "Temukan pengalaman terbaikmu") atau lorem ipsum.
- Ikon dekoratif tanpa makna; animasi masuk beruntun (bounce/delay berjenjang); warna atau font di luar palet.

## Sistem desain existing (pertahankan)

- Nilai yang sudah terpasang: primary `#0B2F9F`, hero `#021624`, teks artikel `#374151`, footer `#F8FAFC`,
  H2 30px semibold, H1 hero putih 38px bold — konsisten dengan token di atas; jangan dicampur gaya lain.

## Design System Reference — wajib untuk komponen baru

Untuk **setiap komponen UI baru** atau perubahan yang secara langsung membentuk gaya visual sebuah komponen, baca dan ikuti:
[`references/Design-System-Reference.md`](references/Design-System-Reference.md).

Dokumen tersebut adalah referensi visual khusus untuk gaya **Academic Journal / Formal Monochrome UI** dan menjadi sumber aturan detail untuk tipografi, palet monokrom, border, spacing, tabel, kartu, maklumat, langkah, tombol, ikon, modal, dan checklist visual.

### Prioritas aturan visual

Agar tidak terjadi konflik antara brand KCI dan referensi visual baru, gunakan urutan berikut:

1. **Perubahan existing:** pertahankan desain, token, warna, layout, dan perilaku existing. Jangan merombak hanya karena Design System Reference dibaca.
2. **Perubahan visual existing yang diminta pengguna:** ikuti permintaan pengguna dan gunakan Design System Reference sebagai panduan, tanpa memperluas scope.
3. **Komponen/halaman baru:** gunakan Design System Reference sebagai standar visual utama, lalu selaraskan dengan identitas KCI yang tidak bertentangan.
4. **Jika aturan bertentangan:** jangan menebak dan jangan memilih aturan yang membuka perubahan lebih luas. Pertahankan existing untuk bagian yang sudah ada; untuk bagian baru, gunakan referensi baru dan pilih token KCI hanya jika tidak bertentangan secara visual.
5. **Tidak ada perubahan massal otomatis:** membaca referensi bukan izin untuk restyling seluruh situs, mengganti palet existing, atau melakukan refactor.

### Aturan penerapan

1. **Baca `Design-System-Reference.md` sebelum membuat komponen baru.** Jangan menebak gaya dari ingatan.
2. **Jangan melakukan restyling massal pada komponen existing hanya karena referensi ini dibaca.** Perubahan existing tetap harus sesuai permintaan pengguna.
3. Jika referensi visual dan kode existing berbeda, **pertahankan UI existing** kecuali pengguna meminta perubahan visual; gunakan referensi sebagai standar untuk komponen baru.
4. Untuk halaman/komponen baru, gabungkan aturan struktur dari `standar-markup.md` dengan aturan visual dari `Design-System-Reference.md`.
5. `Design-System-Reference.md` tidak memberikan izin untuk menambah fitur, mengubah perilaku, atau melakukan refactor di luar permintaan pengguna.

## Standar markup halaman (WAJIB sebelum membuat/porting halaman)

Sebelum menulis satu baris JSX untuk halaman baru atau porting, baca
[`references/standar-markup.md`](references/standar-markup.md) — isinya: langkah mencari halaman
pembanding, kerangka wajib (`HalamanIsi` + `PageArtikel`/`PageGambar`/`StickyMenu` dari
`src/components/PageBagian.jsx`), tipografi `prose-kci`, enam titik pendaftaran rute/menu/terjemahan,
dan larangan membuat komponen `Hero`/`Section`/`Card` versi sendiri. Intinya: **salin pola rumah,
jangan mengarang struktur baru.**

## i18n

- Bahasa bawaan `id`; kamus di `src/lib/terjemahan/{id,en}/`; kamus `en` di-lazy-load oleh `src/lib/i18n.jsx`
  (disimpan di localStorage `kci-bahasa`).
- Kunci terjemahan baru wajib ada di **kedua** bahasa → jalankan `npm run uji:i18n`.

## Jaringan & keamanan

- API dipanggil memakai `VITE_API_DASAR` (kosong = same-origin `/api`). Jangan pernah hardcode `localhost`
  untuk kode yang sampai ke produksi.
- **CSP `connect-src` di `vercel.json` adalah allowlist tertutup.** Domain eksternal baru (API, gambar, font)
  wajib didaftarkan di sana atau request diblokir di produksi. Yang sudah diizinkan: `api.chess.com`,
  `lichess.org`/`tablebase.lichess.ovh`, `*.supabase.co`, `media.githubusercontent.com`, `*.wikipedia.org`/
  `*.wikibooks.org`, `translate.googleapis.com`, `va.vercel-scripts.com`.

## Performa (target Lighthouse 100 di keempat kategori)

- Foto: WebP + `srcset` (828/1280); kompres dengan `npm run gambar:optimum`, verifikasi `npm run uji:gambar`.
- LCP (`hero-about`) di-preload dan dilukis dari HTML awal (`#boot-hero` di `index.html`) — pertahankan pola ini
  untuk LCP baru.
- Jangan menambah dependensi runtime baru tanpa alasan kuat dan persetujuan pengguna.

## Sebelum selesai

- Minimum: `npm run uji:rute && npm run uji:i18n` lalu `npm run build` harus lulus.
- Menyentuh halaman analisa/engine → tambah `npm run uji:analisa-ui`.

## Radix UI dan markup interaktif

Saat mengubah Tabs, Card, Button, Label, Input, popup, atau komponen UI di `src/components/ui/`, baca panduan root [`RADIX-UI.md`](../../../RADIX-UI.md). Panduan tersebut menjelaskan wrapper Radix yang tersedia, alias `@`, `cn()`, kontrak controlled Tabs, aksesibilitas popup, diagnosis error, dan checklist verifikasi untuk AI/Opencode.
