# Panduan "1 Pintu" — Gaya Komponen KCI

Dokumen ini adalah **sumber kebenaran tunggal** untuk pemasangan gaya komponen UI di seluruh halaman. Baca sekali, langsung paham, tidak perlu bertanya kembali.

---

## 1. Apa Itu "1 Pintu"?

"1 Pintu" = **satu file CSS entri** yang mengimpor semua gaya komponen. Halaman **tidak** mengimpornya sendiri.

File entri: `src/gaya/components/index.css`

Pintu dipasang **sekali** di `src/index.css`:

```css
@import "./gaya/components/index.css";
```

Karena `src/index.css` adalah gaya global aplikasi, seluruh halaman otomatis mendapat gaya tombol, input, kartu, modal, dropdown, badge, avatar, link, dan komponen lain. Jangan menambahkan impor pintu di file halaman; impor ganda membuat aturan CSS dimuat dua kali.

Impor pintu dijaga otomatis oleh `scripts/uji-impor-css.mjs` ("src/index.css mengimpor pintu komponen") — kalau impor itu hilang, uji gagal.

---

### Siapa yang tidak memakai pintu ini

Pintu ini untuk bentuk dasar antarmuka (tombol, input, kartu data, lencana,
modal, dropdown). Tiga area sengaja **tidak** memakainya:

| Area | Alasan |
|---|---|
| `src/halaman/ProgramKami/` | Halaman program punya karakter sendiri: kartu fitur, alur, dan warna khas. Kelas pintu di sana ditolak `uji:desain`. |
| Antarmuka catur (`src/halaman/Analisa/komponen/` dan halaman catur lain) | Papan, bidak, jam, dan eval memakai pintu catur sendiri dengan tema gelap. |
| Halaman konten editorial | Tipografi bacaan memakai pintu konten (`PageBagian`, `TabelKonten`). |

---

## 2. Mengapa Harus Satu Pintu?

| Tanpa 1 Pintu (Salah) | Dengan 1 Pintu (Benar) |
|-----------------------|------------------------|
| Setiap halaman buat CSS sendiri | Semua halaman pakai `index.css` yang sama |
| Tombol di Halaman A biru, di Halaman B abu-abu | Tombol di semua halaman seragam slate |
| Perbaiki warna harus sentuh 10 halaman | Perbaiki di satu file, semua halaman ikut |
| Rentan adanya gaya yang bertabrakan | Satu sumber kebenaran, tidak ada duplikasi |

---

## 3. Cara Pakai di Setiap Halaman (Langkah demi Langkah)

### Langkah 1: Tidak perlu impor — pintu sudah terpasang global

Pintu dipasang di `src/index.css`, jadi halaman cukup memakai kelasnya. Jika Anda memakai Tailwind di JSX, jangan menimpa warna atau ukuran dari kelas komponen.

### Langkah 2: Pakai kelas kelas komponen yang sudah ada

Gunakan kelas yang sudah didefinisikan di file CSS komponen. Contoh:

| Komponen | Kelas yang Dipakai |
|----------|-------------------|
| Tombol biasa | `btn btn-biasa` |
| Tombol utama (garis) | `btn btn-utama` |
| Tombol utama (isi penuh) | `btn btn-padat` |
| Tombol kecil / rapat | `btn btn-biasa btn-kecil` · `btn btn-biasa btn-rapat` |
| Tombol ikon | `btn btn-ikon` |
| Input teks | `form-input` |
| Label input | `form-label` |
| Kartu | `card card-body card-title card-value` |
| Badge | `badge badge-slate` |
| Modal | `modal-overlay modal-content modal-header modal-body modal-footer` |
| Dropdown | `dropdown dropdown-trigger dropdown-menu dropdown-item` |

Contoh JSX:

```jsx
<button className="btn btn-utama">Simpan</button>
<input className="form-input" />
<label className="form-label">Nama</label>
<div className="card">
  <div className="card-body">
    <div className="card-title">Judul</div>
    <div className="card-value">100</div>
  </div>
</div>
```

### Langkah 3: Jangan buat gaya baru di halaman

Jika Anda butuh gaya yang belum ada, **jangan** buat CSS inline atau file CSS baru di halaman. Tambahkan ke file komponen yang sesuai di `src/gaya/components/`, lalu daftarkan di `index.css`.

---

## 4. Aturan Wajib (Tanpa Pengecualian)

### Aturan 1: Hanya palet slate, tidak ada warna "make up"

Dilarang keras memakai warna di luar palet slate (`slate-50` sampai `slate-900`) dan primary (`#0B2F9F`).

| Dilarang | Gunakan Ini |
|----------|-------------|
| `text-red-600`, `bg-red-50`, `border-red-300` | `text-slate-700`, `bg-slate-50`, `border-slate-300` |
| `text-amber-700`, `bg-amber-100` | `text-slate-700`, `bg-slate-100` |
| `text-emerald-700`, `bg-emerald-100` | `text-slate-700`, `bg-slate-100` |
| Gradien ungu/pink/biru | Warna solid slate atau primary |
| Glow/shadow pendar (`shadow-[0_0_20px_...]`) | `shadow-sm` atau border 1px datar |

### Aturan 2: Tidak ada inline style yang menimpa gaya komponen

Dilarang menambahkan `style={{ color: 'red' }}` atau `className` yang menimpa warna dari komponen. Jika tombol perlu berbeda, ubah di file CSS komponen, bukan di halaman.

### Aturan 3: Setiap komponen punya satu file sendiri

- Tombol → `button.css`
- Input → `form-input.css`
- Modal → `modal.css`
- Kartu → `card.css`

Jika butuh komponen baru, buat file baru di `src/gaya/components/`, lalu tambahkan `@import` di `index.css`.

---

## 5. Contoh: Halaman Pengurus yang Konsisten

### Sebelum (tidak konsisten, dilarang):

```jsx
<!-- SETIAP HALAMAN BEDA → TIDAK DIIZINKAN -->
<button className="bg-red-500 text-white px-4 py-2">Hapus</button>
<button className="bg-blue-500 text-white px-3 py-1">Simpan</button>
<input className="border border-red-500" />
```

### Sesudah (satu pintu, konsisten di semua halaman):

```jsx
<!-- SEMUA HALAMAN SERAGAM → DIIZINKAN -->
<button className="btn btn-bahaya">Hapus</button>
<button className="btn btn-utama">Simpan</button>
<input className="form-input" />
```

Semua halaman pakai tombol yang sama, input yang sama, kartu yang sama.

---

## 6. Cara Menambahkan Komponen Baru

Jika butuh komponen yang belum ada (misalnya `pagination`):

1. Buat file `src/gaya/components/pagination.css`
2. Tulis gaya dengan palet slate
3. Tambahkan baris ini di `src/gaya/components/index.css`:

```css
@import "./pagination.css";
```

4. Gunakan kelas `pagination` di halaman mana saja.

---

## 7. Cara Memperbaiki Komponen yang Ada

Jika tombol terlalu besar di semua halaman:

1. Buka `src/gaya/components/button.css`
2. Ubah padding atau font-size di sana
3. Simpan → semua halaman yang pakai `btn` secara otomatis ikut berubah

**Jangan** ubah ukuran tombol di masing-masing halaman.

---

## 8. Checklist Sebelum Commit

Setiap kali Anda mengedit halaman pengurus (atau halaman lain), pastikan:

- [ ] Tidak ada warna merah/amber/emerald di `className` atau `style`
- [ ] Tidak ada CSS inline (`style={{...}}`) yang menimpa gaya komponen
- [ ] Semua tombol pakai `btn btn-biasa`, `btn btn-utama`, atau `btn btn-bahaya`
- [ ] Semua input pakai `form-input`
- [ ] Semua label pakai `form-label`
- [ ] Jika menambahkan gaya baru, sudah ditambahkan ke file CSS komponen yang sesuai dan diimpor di `index.css`
- [ ] `npm run uji:desain` lulus
- [ ] `npm run build` lulus

---

## 9. Ringkasan Satu Kalimat

**Impor satu file `index.css`, pakai kelas yang sudah ada, jangan buat gaya baru di halaman, dan semua halaman akan terlihat seragam dan profesional.**

---

## Lokasi File

| File | Fungsi |
|------|--------|
| `src/gaya/components/index.css` | Satu pintu entri (impor semua) |
| `src/gaya/components/*.css` | Gaya tiap komponen |
| `src/gaya/components/PANDUAN-1-PINTU.md` | Panduan ini |
| `DESIGN.md` | Panduan desain global KCI |

Jika ada yang belum jelas setelah membaca dokumen ini sekali, berarti tulisan ini belum cukup baik — sampaikan kepada pengembang untuk diperbaiki.
