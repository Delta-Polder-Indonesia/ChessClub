# Standar markup halaman KCI (hasil ekstraksi kode existing)

Aturan satu kalimat: **halaman baru/porting wajib memakai kerangka yang sudah ada —
jangan pernah mengarang struktur, section wrapper, atau class baru.**

## Langkah 0 — wajib sebelum menulis markup

Cari halaman pembanding yang sudah ada, buka, lalu ikuti strukturnya:

```bash
grep -rln "HalamanIsi" src/halaman/          # semua halaman berkerangka standar
grep -rln "StickyMenu" src/halaman/          # halaman panjang multi-bagian
grep -rln "DaftarKontenMedia\|baris-konten-media" src/   # daftar artikel/konten
```

Pembanding per jenis halaman:

| Jenis halaman | Contoh rujukan |
| --- | --- |
| Artikel kebijakan/program | `src/halaman/Turnamen/Turnamen.jsx`, `Keberlanjutan/*/` |
| Halaman panjang multi-bagian (scroll-spy) | `src/halaman/TentangKami/TentangKami.jsx` |
| Halaman bertab | `src/halaman/TentangKami/StrukturGrupCatur/StrukturGrupCatur.jsx` |
| Daftar konten/berita | `src/halaman/MediaDanInformasi/` + `DaftarKontenMedia.jsx` |

## Kerangka halaman (komponen yang sudah ada — pakai, jangan tiru ulang)

- `PageLayout` (`src/components/PageLayout.jsx`) — header/footer semua halaman publik. Otomatis;
  halaman full-screen (analisa, teka-teki, quiz) didaftarkan di `TANPA_KERANGKA`, bukan dibungkus manual.
- `HalamanIsi` (`src/components/PageBagian.jsx`) — kerangka wajib halaman baru:
  `MetaHalaman` + `BreadcrumbJsonLd` + `Hero` + isi + `PageSelanjutnya`. **Jangan** membuat hero,
  breadcrumb, atau `<title>` sendiri.
- Blok isi di dalam `HalamanIsi`:
  - `PageArtikel` — semua konten teks/artikel (tipografi otomatis oleh `.prose-kci`).
  - `PageGambar` — foto + caption (srcset otomatis).
  - `StickyMenu` — submenu scroll-spy untuk halaman multi-bagian (`sections` dengan `id` + `label`).
    Berkasnya `src/components/StickyMenu.jsx` (*default export*), bukan bagian `PageBagian.jsx`.

Kerangka minimal halaman baru:

```jsx
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function NamaHalaman() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("namaHalaman.judul")}
      description={t("namaHalaman.deskripsi")}
      next={{ to: "/halaman-berikutnya", judul: t("namaHalaman.nextJudul") }}
    >
      <PageArtikel title={t("namaHalaman.bagianUtama")}>
        <p>Paragraf pembuka — faktual, tanpa slogan.</p>
        <h3>Sub-bagian</h3>
        <p>Isi.</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
```

## Tipografi konten — biarkan `prose-kci` bekerja

Di dalam `PageArtikel` pakai **elemen semantik polos** (`h3`, `p`, `ul`/`ol`, `strong`, `em`,
`Link`/`<a>`). `.prose-kci` (`src/index.css`) sudah mengatur: teks 16px/28px `#374151`,
rata kiri-kanan, H2/H3, tautan, daftar. **Jangan** menaruh class warna/ukuran per elemen teks —
itu tanda markup tidak standar.

Daftar tautan cepat memakai pola rumah (lihat `Turnamen.jsx`): `h3` berisi ikon 60px inline + `Link`.

## Pendaftaran halaman baru/porting — enam titik, semua wajib

1. **Berkas halaman** — `src/halaman/<Folder>/<Nama>.jsx` (satu folder per menu, lihat
   `src/halaman/BACA-DULU.md`).
2. **Rute** — `src/App.jsx`: lazy import di atas + pasangan `["/jalur", Komponen]` di `RUTE_HALAMAN`
   (urutkan di dalam kelompok menunya).
3. **Pra-render** — `plugins/performa.js`: tambahkan jalur statis ke `RUTE_PUBLIK`.
   `npm run uji:rute` membandingkan berkas ini dengan `App.jsx` — rute dinamis `:id` dikecualikan.
4. **Menu** — `src/menu.js`: entri dengan `title` (kunci `nav.*`), `folder`, `path`, dan `file`
   bila menyimpang dari bawaan.
5. **Terjemahan** — kunci `nav.*` + kunci konten halaman di **kedua** bahasa:
   `src/lib/terjemahan/id/` dan `src/lib/terjemahan/en/`.
6. **Rantai Selanjutnya** — isi `next={{ to, judul }}` agar halaman sekelompok menu terhubung
   (pola navigasi Pertamina).

Verifikasi setelah porting:

```bash
npm run uji:rute && npm run uji:i18n && npm run build
```

## Class token bawaan (pakai yang ini, bukan karangan)

| Kebutuhan | Class/module yang ada |
| --- | --- |
| Warna aksen | `text-primary` / `bg-primary` (`--color-primary: #0b2f9f`) |
| Latar hero | `bg-hero` |
| Pemisah/garis | `border-grey-200`, `border-guide` |
| Teks artikel | bungkus dengan `prose-kci` (jangan styling manual) |
| Teks muted | `text-gray-500`/`text-gray-600` |

Token baru hanya boleh lahir di `@theme` pada `src/index.css`, dengan alasan yang disebutkan
ke pengguna — bukan class ad-hoc di JSX.

## Batasan anti-slop khusus markup

- Dilarang membuat komponen `Hero`, `Breadcrumb`, `Section`, atau `Card` versi sendiri —
  yang ada di `src/components/` sudah melayani semua kebutuhan itu.
- Tanpa `shadow-*` pada kartu/section; pemisah bagian = `border-t` 1px atau whitespace
  (lihat `PageSelanjutnya` sebagai pola).
- Tanpa ikon/emoji dekoratif di luar pola daftar tautan `h3` ber-ikon yang sudah ada.
- Setiap bagian halaman harus punya padanan di halaman existing bila ragu —
  bila tidak ada padanannya, tanyakan ke pengguna sebelum menciptakan pola baru.

## Referensi visual dan contoh komponen

Setelah menemukan kerangka halaman yang tepat, baca juga:

- `references/standar-visual.md` — aturan warna, typography, spacing, tombol, form, tabel, responsive, motion, dan anti-AI-slop.
- `references/contoh-komponen.md` — katalog implementasi existing yang harus dibuka sebelum meniru komponen.

Urutan kerja agent untuk pekerjaan frontend:

**ATURAN → REFERENSI → IMPLEMENTASI**

1. Baca `AGENTS.md` dan `kci-frontend/SKILL.md`.
2. Tentukan halaman/komponen existing yang paling dekat.
3. Baca `standar-markup.md`.
4. Baca `standar-visual.md` dan `contoh-komponen.md` bila perubahan menyentuh UI.
5. Buka source code contoh yang dirujuk dan bandingkan dengan halaman target.
6. Buat perubahan sekecil mungkin sesuai pola existing.

Jika pengguna meminta UI dibuat lebih `berwibawa` atau `tidak seperti AI slop`, jangan menafsirkan permintaan itu sebagai izin menambah gradient, glassmorphism, shadow, pill, animasi, atau tren visual lain. Gunakan definisi visual KCI dan implementasi existing sebagai baseline.
