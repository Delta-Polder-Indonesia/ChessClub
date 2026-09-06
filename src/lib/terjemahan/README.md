# Folder terjemahan (`src/lib/terjemahan`)

Kamus UI (Indonesia & Inggris) dipecah per kelompok **agar tidak menumpuk dalam
satu berkas raksasa**. Isi dan kunci **tidak berubah** — berkas `index.js` tiap
bahasa menggabungkan semua kelompok menjadi satu objek (`ID` / `EN`) yang sama
seperti dulu, sehingga `t("papan.komentator.judul")` tetap berfungsi.

## Struktur

```
src/lib/terjemahan/
├── id/            Kamus Bahasa Indonesia
│   ├── index.js   → export const ID = { …gabungan semua kelompok… }
│   ├── inti.js            common · nav · header · search · footer · bagian · t404
│   ├── beranda.js         hero · sticky
│   ├── tentang.js         sekilas · tonggak · visimisi · maknaLogo · struktur
│   ├── keanggotaan.js     keanggotaan · verifikasi · pendaftaran
│   ├── keberlanjutan.js   syarat · kodeEtik · pertanyaan · keberlanjutan
│   ├── program.js         program · bermainCatur · tipsTekaTeki · bukuPembukaan
│   ├── turnamen.js        turnamen · turnamenBulanan · ligaMusiman · turnamenTerbuka · ligaAntar
│   ├── media.js           media · berita · pengumuman · galeri
│   ├── hubungi.js         hubungi · karir · pengadaan
│   ├── pengurus.js        strukturGrupCatur · pengurus · strukturOrganisasiCatur
│   ├── landing.js         landing
│   ├── tekaTeki.js        tekaTeki           (teks komentator teka-teki → komentator.js)
│   ├── papan.js           papan              (teks komentator papan → komentator.js)
│   ├── komentator.js      teks komentator: komentatorPapan (papan.komentator.*)
│   │                                          & komentatorTekaTeki (tekaTeki.komentator.*)
│   └── analisa.js         analisa
└── en/            Kamus Inggris (struktur sama persis; dimuat lazy saat bahasa EN dipilih)
```

> **Mau mengubah kalimat komentator?** Buka langsung `komentator.js` pada bahasa
> yang dimaksud (`id/` atau `en/`) — bukan `papan.js`/`tekaTeki.js`. Blok
> `komentatorPapan` adalah isi kunci `papan.komentator.*`, dan `komentatorTekaTeki`
> adalah isi `tekaTeki.komentator.*`; kedua file itu tinggal mengimpornya.

Setiap kelompok berkas memakai nama kunci top-level yang sama dengan nama
`export const`-nya. `index.js` tinggal menggabungkannya:

```js
// id/index.js
export const ID = {
  common,
  nav,
  header,
  …
};
```

## Cara pakai di kode (tidak berubah)

```js
import { useI18n } from "../lib/i18n.jsx";
const { t } = useI18n();
t("papan.komentator.judul"); // → "Komentator" (ID) / "Commentator" (EN)
```

- `i18n.jsx` mengimpor `ID` dari `./terjemahan/id/index.js` dan memuat kamus EN
  secara lazy (`./terjemahan/en/index.js`) hanya saat pengunjung memilih bahasa Inggris.
- `src/lib/terjemahan.js` adalah *facade* untuk alat uji Node (mis. `node scripts/uji-i18n.mjs`).

## Menambah / mengubah teks

1. Tentukan area teksnya → buka berkas kelompok yang sesuai pada **kedua bahasa**
   (`id/…` dan `en/…`) agar paritas kunci tetap terjaga.
2. Tambahkan/ubah kunci di dalam objek yang tepat — kerangka `papan`, `tekaTeki`,
   `analisa`, dst. mengikuti struktur lama.
3. Jangan lupa isi **dua-duanya** (ID & EN). Jalankan pemeriksaan:
   ```bash
   npm run uji:i18n
   ```
   Script itu memastikan kunci ID ⇄ EN seimbang, tidak ada nilai kosong, dan semua
   `t("…")` di `src/` ada di kamus.

## Catatan

- Urutan kunci objek tidak berpengaruh pada pencarian `t("a.b.c")`, jadi menambah
  kunci di mana pun dalam kelompoknya aman.
- Berkas `terjemahan.id.js` / `terjemahan.en.js` lama sudah dihapus — jangan impor
  dari sana lagi.
