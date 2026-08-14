# Prompt: Tambahkan Dukungan Bahasa Inggris (ID ⇄ EN) ke Situs WebCatur

> Dokumen ini adalah ringkasan hasil diskusi. Gunakan sebagai acuan untuk mengimplementasikan fitur
> pengalih bahasa pada situs Komunitas Catur Indonesia (React + Vite, Tailwind CSS, React Router).

## 1. Tujuan

Tombol `ID 🇮🇩` di top bar header (sebelah menu "Hubungi Kami") saat ini hanya teks statis.
Ubah menjadi **dropdown pemilih bahasa** yang bisa mengganti seluruh konten situs antara
**Bahasa Indonesia** dan **English**.

## 2. Keputusan yang sudah disepakati

| Topik            | Keputusan                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Metode i18n      | **Custom ringan, tanpa library** (Context React + kamus objek id/en). Tanpa dependensi baru.  |
| UI switcher      | **Dropdown** berisi dua pilihan: `Bahasa Indonesia` (bendera ID) dan `English` (bendera EN).  |
| Bahasa awal      | Default `id`.                                                                                 |
| Penyimpanan      | Preferensi disimpan di `localStorage` (key `kci-bahasa`), dibaca saat inisialisasi.           |
| `document.lang`  | Diupdate otomatis mengikuti bahasa aktif (`<html lang="...">`).                               |
| Path/URL         | **Tidak berubah.** Hanya konten teks yang berubah. Route tetap sama untuk kedua bahasa.       |

## 3. Arsitektur

### 3.1 File baru: `src/lib/terjemahan.js` ✅ SUDAH DIBUAT

Kamus terjemahan sudah dibuat dan berisi **semua string** yang ada di situs, dua bahasa:

- `export const ID` — teks asli Bahasa Indonesia (persis sama dengan yang ada di komponen).
- `export const EN` — terjemahan Bahasa Inggris.

Struktur kamus: objek bersarang (`common`, `nav`, `header`, `search`, `footer`, `hero`, `sticky`,
`bagian`, `sekilas`, `tonggak`, `visimisi`, `maknaLogo`, `struktur`, `keanggotaan`, `pendaftaran`,
`syarat`, `kodeEtik`, `pertanyaan`, `turnamen`, `turnamenBulanan`, `ligaMusiman`, `turnamenTerbuka`,
`ligaAntar`, `program`, `kelas`, `coaching`, `simultan`, `sekolahCatur`, `media`, `berita`,
`pengumuman`, `galeri`, `buletin`, `hubungi`, `t404`).

### 3.2 File baru: `src/lib/i18n.jsx` (provider + hook)

```jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ID, EN } from "./terjemahan.js";

const SIMPAN = "kci-bahasa";
const KAMUS = { id: ID, en: EN };

const KonteksI18n = createContext(null);

export function I18nProvider({ children }) {
  const [bahasa, setBahasa] = useState(() => {
    try {
      const simpan = localStorage.getItem(SIMPAN);
      if (simpan === "en" || simpan === "id") return simpan;
    } catch (_) {
      /* localStorage tidak tersedia */
    }
    return "id";
  });

  useEffect(() => {
    document.documentElement.lang = bahasa;
    try {
      localStorage.setItem(SIMPAN, bahasa);
    } catch (_) {
      /* abaikan */
    }
  }, [bahasa]);

  const t = useCallback(
    (kunci, ganti = {}) => {
      let teks = kunci
        .split(".")
        .reduce((o, k) => (o ? o[k] : undefined), KAMUS[bahasa]);
      teks = teks ?? kunci;
      for (const [k, v] of Object.entries(ganti)) {
        teks = teks.replaceAll(`{${k}}`, v);
      }
      return teks;
    },
    [bahasa]
  );

  const nilai = useMemo(() => ({ bahasa, setBahasa, t }), [bahasa, t]);

  return <KonteksI18n.Provider value={nilai}>{children}</KonteksI18n.Provider>;
}

export function useI18n() {
  return useContext(KonteksI18n);
}
```

Catatan: `t(kunci)` membaca kamus berdasarkan bahasa aktif; mendukung interpolasi `{var}`.
Jika kunci tidak ditemukan, mengembalikan kunci itu sendiri (aman).

## 4. Perubahan per file

### 4.1 `src/main.jsx`
Bungkus `<App />` dengan `<I18nProvider>` (di dalam `<BrowserRouter>`).

### 4.2 `src/menu.js`
Ubah `title` pada semua item `MENU_UTAMA` (termasuk `children`) dan `MENU_ATAS` menjadi **kunci
terjemahan** `nav.*` dari `terjemahan.js`. Contoh:
`title: "Tentang Kami"` → `title: "nav.tentangKami"`.
`semuaHalaman()` tidak perlu berubah (tetap mengembalikan `{ title: key, path }`), karena pemanggil
yang bertugas menerjemahkan title.

### 4.3 `src/components/icons.jsx`
Tambah komponen `FlagENIcon` (bendera Union Jack, ukuran 12×12 seperti `FlagIDIcon`). SVG contoh:

```jsx
export function FlagENIcon({ className = "" }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <rect width="12" height="12" fill="#012169" />
      <path d="M0 0L12 12M12 0L0 12" stroke="#FFFFFF" strokeWidth="2.4" />
      <path d="M0 0L12 12M12 0L0 12" stroke="#C8102E" strokeWidth="1" />
      <path d="M0 6H12M6 0V12" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0 6H12M6 0V12" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}
```

### 4.4 `src/components/Header.jsx`
- Panggil `const { t, bahasa, setBahasa } = useI18n();` di komponen yang memakai teks.
- `NavItemDesktop`: `{item.title}` → `{t(item.title)}` (child sama).
- `MobileDrawer`: judul menu `{t(item.title)}`, `{t(child.title)}`, `MENU_ATAS` `{t(l.title)}`,
  teks tombol "Daftar Anggota" → `{t("common.daftarAnggota")}`.
- `SearchOverlay`: filter & tampil pakai title yang sudah diterjemahkan
  (buat list `{ path, label: t(r.title) }` dengan `useMemo`). Placeholder → `t("search.placeholder")`,
  "Tekan Enter untuk mencari" → `t("search.enter")`, "Tidak ditemukan hasil..." →
  `t("search.noResults", { query })`.
- **Ganti tombol ID statis** (baris ~290–298) menjadi komponen `DropdownBahasa`:

```jsx
function DropdownBahasa() {
  const { bahasa, setBahasa, t } = useI18n();
  const [buka, setBuka] = useState(false);
  const OPSI = [
    { kode: "id", label: t("common.bahasaIndonesia"), Bendera: FlagIDIcon },
    { kode: "en", label: t("common.english"), Bendera: FlagENIcon },
  ];
  const aktif = OPSI.find((o) => o.kode === bahasa) || OPSI[0];
  return (
    <li className="relative hidden lg:block">
      <button
        type="button"
        title={t("common.pilihBahasa")}
        aria-label={t("common.pilihBahasa")}
        aria-expanded={buka}
        onClick={() => setBuka((b) => !b)}
        className="bg-transparent border-0 flex items-center gap-2 text-xs text-white cursor-pointer"
      >
        <span>{aktif.kode.toUpperCase()}</span>
        <aktif.Bendera />
      </button>
      {buka && (
        <ul className="absolute right-0 top-8 w-[180px] rounded-lg bg-white shadow-xl py-2 z-50">
          {OPSI.map((o) => (
            <li key={o.kode}>
              <button
                type="button"
                onClick={() => {
                  setBahasa(o.kode);
                  setBuka(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-xs cursor-pointer ${
                  o.kode === bahasa ? "text-primary font-semibold" : "text-slate-700 hover:text-primary"
                }`}
              >
                <o.Bendera className="size-3" />
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
```

Catatan: saat header menempel (scrolled), teks dropdown berubah jadi gelap — ikuti pola warna
yang sudah ada di top bar (`text-white`/`text-slate-800`). Tambahkan `onBlur` atau klik-luar agar
dropdown tertutup.

### 4.5 `src/components/Footer.jsx`
- Pindahkan `FOOTER_COLUMNS`, `SOCIALS` (atau cukup kolom & title) ke dalam komponen agar bisa
  pakai `t()`, atau buat kolom berisi kunci lalu terjemahkan saat render.
- Terjemahkan: title kolom, semua `link.title`, "Address:", "Email:", teks copyright,
  "Kebijakan Privasi", "Waspada Penipuan". Gunakan kunci `footer.*` dan `nav.*`.

### 4.6 `src/components/PageBagian.jsx`
- `HalamanIsi`: `{ label: t("common.home"), to: "/" }`; `document.title` →
  `` `${title} | ${t("common.namaKomunitas")}` ``.
- `PageSelanjutnya`: label "Selanjutnya" → `t("common.selanjutnya")`.

### 4.7 `src/components/Hero.jsx`
- Default `title`/`description`/`crumbs` pakai `t("hero.tentangKami")`, `t("hero.deskripsi")`.

### 4.8 `src/components/StickyMenu.jsx`
- Default `SECTIONS` dibuat di dalam komponen memakai `t()` (`sticky.*`).

### 4.9 Komponen konten halaman "Tentang Kami"
- `TentangKami.jsx`: `document.title` pakai `t()`; `judul="t(nav.programKami)"` pada
  `PageSelanjutnya`.
- `Sekilas.jsx`, `Tonggak.jsx`, `VisiMisi.jsx`, `MaknaLogo.jsx`, `Struktur.jsx`: ganti semua teks
  hardcoded dengan `t("...")`. Khusus `Tonggak`, array `SLIDES` (yang berisi paragraf panjang)
  dibangun **di dalam komponen** memakai `t()` karena butuh hook.

### 4.10 Halaman di `src/halaman/**`
Semua halaman berikut: panggil `useI18n()`, ganti `title`, `description`, `parent`, `judul` pada
`next`, serta seluruh teks body dengan `t("...")` sesuai kunci di kamus.
- `TentangKami/StrukturGrupCatur/Keanggotaan/*` (3 file): hanya dirender sebagai tab di `StrukturGrupCatur.jsx`; terjemahkan label tab Elo, header tabel (No/Foto/Nama), status
  ("Memuat data...", "Tidak ada anggota...", "akun tidak ditemukan", "gagal memuat",
  "belum ada rating"), pesan error form.
- `Turnamen/*` (5 file), `ProgramKami/*` (5 file), `MediaDanInformasi/*` (5 file),
  `HubungiKami/HubungiKami.jsx`, `TidakDitemukan.jsx`.
- `BuletinBulanan.jsx`: array `EDISI` (bulan) pindah ke dalam komponen; `isi` → `t("buletin.eN")`.
- `Galeri.jsx`: `PageGambar` `alt`/`caption` → `t()`.
- `BeritaKomunitas.jsx` & `Pengumuman.jsx`: item berita/pengumuman → `t()`.

## 5. Yang TIDAK perlu diubah
- `src/App.jsx` (route tetap sama), `src/components/PageLayout.jsx`, `ScrollToTop.jsx`, `Logo.jsx`.
- `src/lib/chessAnggota.js` (pesan error dari fetch/API dibiarkan; bersifat teknis).
- `index.html` cukup `lang="id"` (diubah otomatis oleh provider via `document.documentElement.lang`).
  Opsional: teks `title`/`meta description` di index.html dibiarkan.

## 6. Verifikasi
1. `npm run dev` — pastikan tidak ada error build/runtime.
2. Tes manual:
   - Klik tombol `ID` di top bar → dropdown muncul (Bahasa Indonesia / English).
   - Pilih "English" → seluruh halaman berubah ke Inggris, `lang` di `<html>` jadi `en`.
   - Refresh browser → bahasa tetap English (localStorage).
   - Cek menu navigasi (desktop & mobile drawer), footer, hero, sticky menu, tabel keanggotaan,
     form Hubungi Kami, dan pencarian (search) ikut berubah.
   - Cek semua halaman (Turnamen, Program, Media, Keberlanjutan, Keanggotaan di bawah Tentang Kami, 404) tanpa teks Indonesia tertinggal.
3. `npm run build` — pastikan build sukses.

## 7. Catatan tambahan
- `t()` mengembalikan kunci jika tidak ditemukan — ini memudahkan mendeteksi string yang
  ketinggalan saat testing (akan tampil teks kunci di layar).
- Pertahankan gaya penamaan yang sudah ada di repo (komponen English, fungsi/lib kadang Indonesian).
- Jangan tambahkan dependensi baru.
