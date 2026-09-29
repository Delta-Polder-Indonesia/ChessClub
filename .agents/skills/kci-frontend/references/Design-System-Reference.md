```markdown
# DESIGN SKILL — Academic Journal / Formal Monochrome UI

> **⚠️ TERDEPREKASI — jangan tiru contoh di berkas ini.**
> Sumber kebenaran desain situs adalah `DESIGN.md` di akar repo (gaya serif
> korporat, aksen biru `#0B2F9F`, teks rata kiri, token `grey-*`). Gaya
> monokrom/koran di bawah (`font-black`, heading uppercase, garis tebal
> `gray-900`, drop cap) sudah DIHAPUS dari halaman publik situs pada
> Sep 2026. Berkas ini disimpan hanya sebagai referensi sejarah; jika
> aturan di bawah bertentangan dengan `DESIGN.md`, `DESIGN.md` yang berlaku.

---

## 1. FILOSOFI DESAIN

- **Gaya:** Formal, akademik, seperti koran/jurnal cetak (newspaper editorial).
- **Suasana:** Serius, resmi, institusional — bukan playful atau modern-SaaS.
- **Prinsip:** Tipografi-driven, minim warna, struktur jelas lewat garis/border.

---

## 2. TIPOGRAFI

| Elemen | Class Tailwind |
|---|---|
| **Font utama (body)** | `font-serif` |
| **Font heading / label** | `font-sans` |
| **Font angka / kode** | `font-mono` |
| **Judul utama (H1)** | `text-3xl md:text-4xl font-black tracking-tight uppercase leading-none` |
| **Sub-judul seksi (H3)** | `text-base font-black tracking-tight uppercase` + `border-b border-gray-900 pb-1` |
| **Label kecil atas** | `text-xs font-bold tracking-widest uppercase` |
| **Heading langkah (H4)** | `text-sm font-bold uppercase` (font-sans) |
| **Body text** | `text-sm leading-relaxed` (rata kiri) |
| **Catatan / footnote** | `text-xs italic` |
| **Kode inline** | `<code class="font-mono">` |
| **Drop cap (paragraf pertama)** | (dihapus — tidak dipakai lagi; jangan pakai drop cap) |

### Aturan Tipografi
- Semua heading **WAJIB uppercase**.
- Gunakan `font-black` untuk heading utama, `font-bold` untuk sub-heading.
- Body text selalu rata kiri — TIDAK memakai `justify` (celah spasi antar-kata tidak merata; lihat `DESIGN.md` §2).
- Catatan kaki selalu `italic` + ukuran lebih kecil (`text-xs` atau `text-[11px]`).

---

## 3. PALET WARNA (Monokrom)

| Penggunaan | Warna |
|---|---|
| Teks utama | `text-gray-900` |
| Teks sekunder | `text-gray-800` |
| Teks tersier / hover | `text-gray-700` / `text-slate-700` |
| Border utama | `border-gray-900` |
| Border sekunder | `border-gray-400` |
| Border halus | `border-gray-300` |
| Background tabel header | `bg-gray-50` |
| Background halaman | `bg-white` |
| Aksen status aktif | `text-emerald-600` |
| Aksen gelap (maklumat) | `border-gray-950` |

### Aturan Warna
- **DILARANG** menggunakan warna gradien, warna cerah, atau warna pastel.
- Satu-satunya warna aksen yang diizinkan: `emerald-600` (hanya untuk status "AKTIF").
- Seluruh UI harus bisa dicetak hitam-putih dan tetap terbaca.

---

## 4. BORDER & GARIS PEMISAH

| Konteks | Class |
|---|---|
| **Garis seksi utama** | `border-b border-gray-400` |
| **Garis judul seksi** | `border-b border-gray-900 pb-1` |
| **Garis dekoratif judul** | `border-b-4 border-double border-gray-900` |
| **Garis indent konten** | `border-l-2 border-gray-900 pl-4` |
| **Garis tabel (atas-bawah)** | `border-t-2 border-b-2 border-gray-900` |
| **Garis antar baris tabel** | `divide-y divide-gray-300` |
| **Garis header tabel** | `border-b border-gray-900` |
| **Kotak maklumat** | `border border-gray-950` + `border-b-2 border-gray-950` pada wrapper |
| **Kartu kecil** | `border border-gray-400` |
| **Tombol inline** | `border border-gray-900 px-1` |

### Aturan Border
- Gunakan `border-double` hanya untuk garis dekoratif utama di bawah judul besar.
- Gunakan `border-l-2` untuk indentasi visual pada penjelasan langkah.
- Tabel **WAJIB** menggunakan `border-t-2 border-b-2` (tanpa border vertikal).

---

## 5. LAYOUT & SPACING

| Konteks | Class |
|---|---|
| **Container utama** | `w-full max-w-none` (full-width, editorial) |
| **Scroll area** | `flex-1 overflow-y-auto px-4 sm:px-6 pt-2 pb-8` |
| **Spacing antar seksi** | `space-y-6` atau `mb-6` + border-b |
| **Spacing antar langkah** | `mb-4` sampai `mb-6` |
| **Spacing dalam paragraf** | `space-y-2` |
| **Padding konten indent** | `pl-4` (setelah border-l-2) |
| **Padding kartu** | `p-2` (kecil) atau `p-3` (sedang) atau `p-4` (maklumat) |

### Aturan Layout
- **Tidak ada** `max-w-4xl` atau pembungkus sempit — biarkan konten melebar penuh (editorial style).
- Gunakan `grid grid-cols-1 sm:grid-cols-3` untuk daftar kartu responsif.
- Section dipisahkan oleh `border-b`, bukan oleh background warna.

---

## 6. KOMPONEN: TABEL

```tsx
<table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
  <thead>
    <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
      <th className="w-2/5 py-2 pr-4">Kolom 1</th>
      <th className="w-2/5 py-2 pr-4">Kolom 2</th>
      <th className="w-1/5 py-2 text-right">Kolom 3</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-300">
    <tr>
      <td className="py-2.5 font-bold text-gray-900">Data</td>
      <td className="py-2.5 font-mono text-xs text-gray-900">kode</td>
      <td className="py-2.5 text-right font-mono text-xs text-gray-900">nilai</td>
    </tr>
  </tbody>
</table>
```

### Aturan Tabel
- **WAJIB** `table-fixed` + `border-collapse`.
- Header: `bg-gray-50`, `text-xs`, `uppercase`, `font-bold`.
- Kolom angka/kode: `font-mono text-xs`, rata kanan (`text-right`).
- Kolom nama: `font-bold`, boleh `truncate`.
- Wrapper: `overflow-x-auto` untuk responsivitas mobile.
- **Tidak ada** border vertikal, **tidak ada** zebra striping warna-warni.

---

## 7. KOMPONEN: KARTU KECIL (Contact / Info Card)

```tsx
<li className="rounded border border-gray-400 bg-white p-3">
  <h5 className="text-xs font-bold tracking-wide uppercase">Judul</h5>
  <p className="mt-0.5 font-mono text-xs text-gray-800">Detail</p>
</li>
```

### Aturan Kartu
- `rounded` (sudut sedikit melengkung, bukan `rounded-xl`).
- Border tipis `border-gray-400`.
- Background tetap `bg-white`.
- Padding kecil `p-2` atau `p-3`.

---

## 8. KOMPONEN: KOTAK MAKLUmat / ALERT

```tsx
<div className="border border-gray-950 p-4">
  <h4 className="mb-3 text-center font-sans text-sm font-bold tracking-wide text-gray-900 uppercase">
    ! JUDUL MAKLUMAT !
  </h4>
  <ul className="space-y-2 text-xs text-gray-900">
    <li className="list-inside list-disc">
      <span className="font-bold">Label:</span> Penjelasan...
    </li>
  </ul>
</div>
```

### Aturan Maklumat
- Border paling tebal/gelap: `border-gray-950`.
- Judul di tengah (`text-center`) dengan tanda seru `!`.
- Isi berupa list `list-disc list-inside`.
- Setiap item dimulai dengan `<span className="font-bold">Label:</span>`.

---

## 9. KOMPONEN: LANGKAH / STEP

```tsx
<div>
  <h4 className="mb-1 font-sans text-sm font-bold text-gray-900 uppercase">
    Langkah N: Judul Langkah
  </h4>
  <p className="border-l-2 border-gray-900 pl-4 text-sm leading-relaxed text-gray-900">
    Penjelasan detail...
    <span className="mt-1 block text-xs text-gray-900 italic">
      *Catatan tambahan...
    </span>
  </p>
</div>
```

### Aturan Langkah
- Heading `font-sans`, body `font-serif` (inherit).
- Garis kiri `border-l-2 border-gray-900` sebagai visual indent.
- Catatan selalu `block` + `italic` + `text-xs`.

---

## 10. KOMPONEN: TOMBOL

| Tipe | Class |
|---|---|
| **Tombol teks (tutup)** | `text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer` |
| **Tombol inline (badge)** | `border border-gray-900 px-1 font-sans text-xs font-bold uppercase` |

### Aturan Tombol
- **DILARANG** menggunakan tombol berwarna (biru, hijau, merah).
- Tombol utama tetap monokrom.
- Hover effect cukup perubahan shade (`hover:text-slate-900`).

---

## 11. IKON

- Library: **lucide-react**.
- Ukuran standar: `h-4 w-4` (kecil, inline dengan heading).
- Warna: inherit (mengikuti `text-gray-900`).
- Penempatan: `flex items-center gap-2` di sebelah teks heading.

```tsx
<h4 className="flex items-center gap-2 font-sans text-sm font-bold uppercase">
  <BookOpen className="h-4 w-4" /> Judul Seksi
</h4>
```

---

## 12. MODAL / OVERLAY

```tsx
<div className="fixed inset-0 z-[100] flex w-full max-w-none flex-col overflow-hidden bg-white font-serif text-gray-900">
  <div className="flex-1 overflow-y-auto px-4 pt-2 pb-8 sm:px-6">
    {/* konten */}
  </div>
</div>
```

### Aturan Modal
- Full-screen (`fixed inset-0`), bukan centered card.
- Background `bg-white` solid (bukan backdrop blur).
- Z-index tinggi `z-[100]`.
- Scroll di dalam (`overflow-y-auto` pada child).

---

## 13. STRUKTUR HALAMAN STANDAR

```
1. BANNER / JUDUL UTAMA
   - Label kecil atas (tracking-widest)
   - H1 besar (font-black, uppercase)
   - Subtitle italic
   - Border-double bawah

2. INTRO ARTIKEL
   - Paragraf drop-cap
   - Border-b pemisah

3. SEKSI-SEKSI KONTEN (I, II, III, ...)
   - H3 dengan border-b
   - Langkah-langkah / tabel / kartu
   - Border-b pemisah antar seksi

4. MAKLUMAT / ALERT
   - Border gelap
   - List aturan

5. FOOTER / CATATAN KAKI
   - text-center, text-[11px], italic
```
---

## 14. STRUKTUR ARTIKEL STANDAR

Gunakan gaya penulisan formal, analitis, dan bernuansa semi-akademik. Pembahasan harus disusun secara runtut, logis, dan mengalir dengan transisi yang halus antargagasan. Setiap paragraf perlu dikembangkan secara utuh sehingga tidak hanya menyampaikan informasi, tetapi juga menjelaskan hubungan, alasan, implikasi, atau konteks yang mendasarinya.

Tulisan harus menunjukkan kedalaman pemahaman terhadap topik yang dibahas. Hindari penjelasan yang terlalu dangkal, repetitif, atau sekadar mendefinisikan konsep tanpa elaborasi lebih lanjut. Apabila membahas suatu gagasan, jelaskan keterkaitannya dengan faktor penyebab, dampak, tujuan, fungsi, atau perspektif yang relevan sehingga pembahasan terasa lebih komprehensif dan bernilai analitis.

Nada tulisan harus menyerupai pembahasan dalam buku, esai edukatif, atau karya ilmiah populer yang ditulis secara matang dan reflektif. Gunakan bahasa yang jelas, presisi, dan intelektual tanpa menjadi terlalu teknis atau sulit dipahami.

Hindari pola penutup yang bersifat generik, mekanis, atau terasa seperti template. Jangan menggunakan frasa seperti “Pada akhirnya”, “Pada dasarnya”, “Secara keseluruhan”, “Dengan demikian”, “Oleh karena itu”, atau bentuk kesimpulan klise lainnya. Penutup harus muncul secara alami sebagai kelanjutan logis dari pembahasan sebelumnya, dengan kalimat yang menegaskan inti gagasan secara elegan, reflektif, dan menyatu dengan alur tulisan.

Fokus utama adalah menghasilkan tulisan yang terasa seperti hasil pemikiran manusia yang memahami topik secara mendalam, bukan sekadar rangkaian informasi yang disusun secara formal.

---

## 15. CHECKLIST SEBELUM GENERATE

- [ ] Semua heading uppercase?
- [ ] Font serif untuk body, sans untuk heading?
- [ ] Hanya warna monokrom (gray-50 → gray-950)?
- [ ] Tabel pakai `table-fixed` + `border-collapse`?
- [ ] Tidak ada rounded besar (maks `rounded`)?
- [ ] Tidak ada shadow / drop-shadow?
- [ ] Tidak ada gradient?
- [ ] Border sebagai pemisah, bukan background?
- [ ] Catatan kaki selalu italic + kecil?
- [ ] Ikon lucide-react ukuran `h-4 w-4`?

---