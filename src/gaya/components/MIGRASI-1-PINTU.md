# Migrasi "Satu Pintu" — Status dan Rencana

Dokumen ini mencatat posisi migrasi gaya komponen ke satu pintu CSS
(`src/gaya/components/index.css`). Aturan pakainya ada di
[`PANDUAN-1-PINTU.md`](./PANDUAN-1-PINTU.md); alasan desainnya di `DESIGN.md` §13.

---

## 1. Kondisi awal (sebelum migrasi)

| Hal | Kenyataan |
|---|---|
| Pintu `src/gaya/components/index.css` | ada, 21 berkas komponen, tetapi **tidak diimpor siapa pun** |
| Akibat | 856 baris CSS "resmi" tidak berpengaruh ke halaman mana pun |
| Tombol memakai kelas pintu | 2 dari 403 |
| Warna di keluarga komponen | tint indigo `#EEF2FF`, sky `#F0F9FF`/`#0C4A6E` |
| Bayangan di keluarga komponen | 5 deklarasi `box-shadow` |

## 2. Yang sudah dikerjakan

| Langkah | Berkas | Bukti |
|---|---|---|
| Pintu dipasang global | `src/index.css` → `@import "./gaya/components/index.css"` | class `.btn`, `.card`, `.form-input` ada di CSS hasil build |
| Impor tunggal tooltip | `tooltip.css` hanya lewat pintu | uji: "gaya/tooltip.css hanya diimpor lewat pintu komponen" |
| Warna dan bayangan dibersihkan | `badges`, `button`, `step`, `tab`, `dropdown`, `modal`, `popover`, `toast`, `form-input` | `grep box-shadow` = 0 |
| Varian tombol dilengkapi | `button.css` → `btn-padat`, `btn-rapat`, `btn-ikon` | dipakai Pengurus dan siap untuk halaman publik |
| Pengurus memakai pintu | `src/halaman/Pengurus/ui.jsx` (`Tombol`) | 77 pemakaian `<Tombol>` otomatis ikut pintu |
| Tombol ad-hoc di Pengurus diganti | 12 tombol di 9 berkas | sisa 1 baris daftar (bukan tombol aksi) |
| Penjaga pintu | `scripts/uji-impor-css.mjs` | uji gagal bila impor pintu hilang |

## 3. Peta kelas pintu

| Komponen | Kelas | Berkas |
|---|---|---|
| Tombol | `btn` + `btn-biasa` / `btn-utama` / `btn-padat` / `btn-bahaya`, ukuran `btn-kecil` / `btn-rapat` / `btn-lebar` / `btn-ikon` | `button.css` |
| Input & label | `form-input`, `form-label`, `form-text` | `form-input.css` |
| Kartu | `card`, `card-body`, `card-title`, `card-value`, `card-caption`, `card-footer` | `card.css` |
| Lencana | `badge`, `badge-slate`, `badge-soft` | `badges.css` |
| Pesan | `alert`, `alert-title`, `alert-description` | `alert.css` |
| Modal | `modal-overlay`, `modal-content`, `modal-header`, `modal-body`, `modal-footer` | `modal.css` |
| Dropdown & popover | `dropdown`, `dropdown-trigger`, `dropdown-menu`, `dropdown-item`, `popover` | `dropdown.css`, `popover.css` |
| Kutipan | `blockquote` (kelas, bukan elemen) | `blockquote.css` |
| Lainnya | `avatar`, `tab`, `step`, `toggle`, `pagination`, `breadcrumb`, `accordion`, `toast`, `banner`, `link` | masing-masing |

## 4. Urutan gelombang

Angka berasal dari pemindaian `src/halaman/**/*.jsx` (76 berkas, 331 kontrol
`<button>`/`<input>`/`<select>`).

| Gelombang | Cakupan | Status |
|---|---|---|
| 0 | Pintu dipasang, varian tombol, penjaga impor | selesai |
| 1 | Dashboard Pengurus (`src/halaman/Pengurus/`) | selesai — tombol |
| 2 | Sisa panel Pengurus: `Lencana` → `badge`, `Bidang` → `form-input`, dialog → `modal` | berikutnya |
| 3 | Halaman publik non-catur: `PendaftaranAnggota`, `HubungiKami`, `Karir`, `Atribusi`, `Beranda`, `TentangKami` | belum |
| 4 | Komponen bersama `src/components/` (Header, Footer, kartu program) | belum |
| 5 | Halaman catur (`Analisa`, `PapanInteraktif`, `TekaTeki*`, `QuizCatur`, `ManusiaVsMesin`, `LatihanRepertoar`) | sengaja beda pintu |

**Catatan gelombang 5:** sesuai `DESIGN.md` §13, antarmuka catur punya pintu
sendiri (`src/halaman/Analisa/komponen/`) dan tema papan gelap. Tombol di sana
tidak dipaksa memakai `btn`; yang dirapikan adalah konsistensi di dalam
domainnya sendiri.

## 5. Aturan saat memigrasikan satu halaman

1. Ganti kelas Tailwind tombol dengan `btn btn-*` dari pintu, jangan menyisakan
   `rounded border px text-*` untuk hal yang sudah ada di pintu.
2. Jangan menambah file CSS per halaman. Butuh bentuk baru → tambahkan ke berkas
   komponen yang sesuai, daftarkan di `index.css` bila berkas baru.
3. Warna hanya token (`--color-primary`, `--color-grey-*`). Dijaga
   `scripts/uji-standar-desain.mjs` untuk semua `.css`.
4. Setelah mengubah: `npm run lint`, `npm run uji:desain`,
   `npm run uji:impor-css`, `npm run build`.
