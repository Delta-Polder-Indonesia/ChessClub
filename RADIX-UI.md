# Panduan Radix UI dan Markup KCI

Panduan ini menjelaskan implementasi primitif UI operasional KCI, khususnya popup, tab, card, formulir, dan kontrol aksesibilitas. `DESIGN.md` menetapkan batas visual lintas situs; skill domain menetapkan karakter fitur yang memakai primitif ini.

Dokumen ini menjelaskan cara memakai primitive Radix UI yang sudah dipasang di proyek, cara memakai wrapper lokal bergaya shadcn/ui, cara mendiagnosis error umum, serta batasan perilaku yang harus dipertahankan ketika markup diperbaiki.

## Instruksi untuk AI/Opencode

Saat menerima tugas yang menyentuh markup atau komponen UI:

1. Baca `AGENTS.md` terlebih dahulu.
2. Baca `.agents/skills/kci-frontend/SKILL.md` dan `.opencode/skills/kci-frontend/SKILL.md` bila mengubah frontend.
3. Baca panduan ini sebelum mengubah komponen Radix, Tabs, Card, Button, Label, Input, popup, atau formulir.
4. Baca komponen yang akan diubah, pemanggilnya, dan uji yang berkaitan sebelum menulis kode.
5. Pertahankan perilaku yang sudah ada. Jangan mengubah alur API, validasi, terjemahan, URL, atau state hanya karena markup sedang dirapikan.
6. Gunakan komponen UI lokal di `src/components/ui/` daripada membuat versi kedua di halaman.
7. Gunakan `cn()` dari `src/lib/utils.js` untuk menggabungkan class Tailwind.
8. Jangan menambahkan dependensi baru jika primitive atau utilitas yang diperlukan sudah tersedia.
9. Gunakan nama berkas, fungsi, variabel, dan komentar dalam Bahasa Indonesia sesuai konvensi proyek.
10. Setelah perubahan, jalankan pemeriksaan minimum yang relevan. Jangan menyatakan perubahan berhasil tanpa hasil pemeriksaan.

Jika permintaan pengguna hanya menyebut "perbaiki markup", artinya struktur JSX, aksesibilitas, konsistensi komponen, dan class Tailwind boleh diperbaiki. Artinya bukan mengubah desain seluruh situs, mengganti API, atau merombak state management.

## 1. Stack UI yang berlaku

Proyek memakai:

- React 18.
- Vite 6.
- Tailwind CSS v4 melalui `@tailwindcss/vite`.
- Radix UI untuk primitive interaktif dan aksesibilitas.
- `class-variance-authority` untuk varian komponen.
- `clsx` dan `tailwind-merge` melalui helper `cn()`.
- Tipografi mengikuti domain pemakai; jangan memakai wrapper operasional untuk memaksakan tipografi halaman konten.
- JavaScript JSX, bukan TypeScript.

Dependensi UI yang sudah terdaftar di `package.json`:

```json
{
  "@radix-ui/react-label": "...",
  "@radix-ui/react-tabs": "...",
  "class-variance-authority": "...",
  "clsx": "...",
  "tailwind-merge": "..."
}
```

Versi sebenarnya selalu diambil dari `package.json` dan `package-lock.json`. Jangan menyalin versi dari dokumentasi online jika berbeda dari lockfile.

## 2. Letak berkas dan tanggung jawabnya

```text
src/
├── components/
│   └── ui/
│       ├── button.jsx     # Button + varian CVA
│       ├── card.jsx       # Card dan bagian-bagiannya
│       ├── input.jsx      # Input standar
│       ├── label.jsx      # Wrapper Radix Label
│       └── tabs.jsx       # Wrapper Radix Tabs
├── lib/
│   └── utils.js           # cn(): clsx + tailwind-merge
└── halaman/
    └── ProgramKami/
        ├── EbookPanduan.jsx       # Katalog dan pembuka popup
        └── ModalUnduhEbook.jsx    # Popup gerbang unduh e-book

vite.config.js              # Alias @ → src
package.json                # Dependensi dan perintah uji
package-lock.json           # Versi terkunci
RADIX-UI.md                 # Panduan ini
```

### `src/components/ui/`

Berkas di direktori ini adalah wrapper UI bersama. Wrapper boleh mengatur class visual dan meneruskan props, tetapi tidak boleh memuat logika domain e-book, autentikasi, atau pemanggilan API.

### `src/lib/utils.js`

Helper ini menggabungkan class dengan benar:

```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

Gunakan:

```jsx
className={cn("class-default", className)}
```

Jangan lagi memakai template string polos jika class dari pemanggil dapat menimpa utility dasar. Contoh masalah yang dihindari oleh `cn()` adalah `flex` dan `grid`, atau `p-6` dan `p-5`, yang sama-sama dikirim ke satu elemen.

### `vite.config.js`

Alias berikut harus tetap ada:

```js
resolve: {
  alias: {
    "@": resolve(__dirname, "src"),
  },
  dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
},
```

`jsconfig.json` memberi pemahaman alias kepada editor, tetapi Vite juga harus dikonfigurasi. Jika alias dihapus dari `vite.config.js`, editor mungkin tidak menunjukkan error tetapi build akan gagal dengan `Failed to resolve import '@/...'`.

## 3. Mengapa paket Radix tidak langsung menyelesaikan contoh shadcn

Contoh seperti berikut:

```jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

bukan API yang disediakan langsung oleh `@radix-ui/react-tabs` atau `@radix-ui/react-label`.

Radix menyediakan primitive, misalnya:

```jsx
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as LabelPrimitive from "@radix-ui/react-label";
```

Sementara `Button`, `Card`, `Input`, dan pola `Tabs` seperti pada contoh shadcn adalah wrapper yang harus ada di project. Pada project ini wrapper tersebut berada di `src/components/ui/`.

Jadi ada dua lapisan:

1. **Radix primitive**: menangani perilaku, keyboard navigation, ARIA, focus, dan state interaktif.
2. **Wrapper lokal**: menentukan markup dan gaya KCI, lalu meneruskan props ke primitive.

Jangan mengimpor `Button` dari `@radix-ui/react-tabs`; komponen itu memang tidak ada.

## 4. Aturan impor

Gunakan alias `@` pada kode aplikasi:

```jsx
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { cn } from "@/lib/utils.js";
```

Ekstensi `.jsx` dan `.js` boleh dicantumkan dan disarankan agar lokasi modul jelas. Jika mengubah wrapper di `src/components/ui/`, tetap gunakan alias `@/lib/utils.js` agar konsisten dengan komponen aplikasi.

Jangan menggunakan:

```jsx
import { Button } from "@/components/ui/button";
```

jika file wrapper belum ada. Menambah dependency tidak otomatis membuat file tersebut.

## 5. Wrapper Button

`src/components/ui/button.jsx` memakai `cva()` untuk varian dan `cn()` untuk class tambahan.

API yang tersedia:

```jsx
<Button>Utama</Button>
<Button variant="outline">Sekunder</Button>
<Button variant="ghost">Tutup</Button>
<Button size="sm">Kecil</Button>
<Button size="lg">Besar</Button>
<Button size="icon" aria-label="Tutup">
  <IkonTutup />
</Button>
```

Varian yang sekarang tersedia:

- `default`: tombol outline hitam untuk pemakai existing.
- `outline`: tombol putih dengan border tipis.
- `ghost`: tombol tanpa bidang, untuk aksi ringan atau tutup.

Ukuran yang sekarang tersedia:

- `default`.
- `sm`.
- `lg`.
- `icon`.

Untuk submit formulir, tulis `type="submit"` karena default wrapper adalah `type="button"`:

```jsx
<Button type="submit" disabled={sibuk} className="w-full">
  Simpan
</Button>
```

Aturan:

- Tombol ikon wajib memiliki `aria-label` jika tidak memiliki teks yang terlihat.
- Jangan menambahkan varian baru hanya untuk satu halaman. Tambahkan varian hanya jika pola tersebut dipakai ulang.
- Jangan membungkus tombol di dalam tombol.
- Aksi navigasi yang benar-benar berupa tautan boleh tetap memakai `<a>` dengan class yang sama; jangan memalsukan tautan sebagai tombol.

## 6. Wrapper Card

`src/components/ui/card.jsx` menyediakan:

```jsx
<Card>
  <CardHeader>
    <CardTitle>Judul</CardTitle>
    <CardDescription>Deskripsi singkat.</CardDescription>
  </CardHeader>
  <CardContent>Isi.</CardContent>
  <CardFooter>Aksi.</CardFooter>
</Card>
```

Komponen:

- `Card`: permukaan, border, radius, dan shadow ringan.
- `CardHeader`: area judul.
- `CardTitle`: heading; mendukung `as="h2"`, `as="h3"`, dan elemen heading lain.
- `CardDescription`: teks sekunder.
- `CardContent`: isi utama.
- `CardFooter`: area aksi.

Contoh heading dialog:

```jsx
<Card role="dialog" aria-modal="true" aria-labelledby="judul-popup">
  <CardHeader>
    <CardTitle as="h2" id="judul-popup">
      Unduh e-book
    </CardTitle>
  </CardHeader>
</Card>
```

`Card` bukan dialog Radix. Popup e-book saat ini memakai overlay custom di `ModalUnduhEbook.jsx`, sehingga jangan mengklaim bahwa Card sudah menyediakan focus trap atau perilaku dialog. Jika nanti diperlukan dialog Radix, `@radix-ui/react-dialog` harus dipasang dan perubahan itu perlu diperlakukan sebagai perubahan komponen baru, bukan diasumsikan sudah tersedia.

## 7. Wrapper Input dan Label

### Input

```jsx
<Field label="Nama asli" htmlFor="unduh-nama">
  <Input
    id="unduh-nama"
    name="nama"
    autoComplete="name"
    maxLength={80}
    value={nama}
    onChange={(e) => setNama(e.target.value)}
  />
</Field>
```

`Input` meneruskan semua props native input dan meneruskan ref. Jangan menaruh pemanggilan API atau validasi domain di dalam wrapper Input.

### Label

`Label` memakai `LabelPrimitive.Root` dari `@radix-ui/react-label`:

```jsx
<Label htmlFor="unduh-nama">Nama asli</Label>
```

Aturan:

- `htmlFor` harus sama persis dengan `id` input.
- Setiap input pada form harus memiliki label yang terlihat atau label aksesibel yang setara.
- Jangan memakai satu `id` untuk dua input yang dirender bersamaan.
- Hindari `placeholder` sebagai pengganti label.

## 8. Wrapper Tabs berbasis Radix

`src/components/ui/tabs.jsx` adalah wrapper dari:

```js
import * as TabsPrimitive from "@radix-ui/react-tabs";
```

Ekspor yang berlaku:

```js
export const Tabs = TabsPrimitive.Root;
```

Wrapper:

- `TabsList` → `TabsPrimitive.List`.
- `TabsTrigger` → `TabsPrimitive.Trigger`.
- `TabsContent` → `TabsPrimitive.Content`.

Contoh dasar:

```jsx
<Tabs defaultValue="account" className="max-w-[400px]">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Isi account
  </TabsContent>
  <TabsContent value="password">
    Isi password
  </TabsContent>
</Tabs>
```

### Controlled dan uncontrolled

Uncontrolled, jika komponen cukup mengelola state sendiri:

```jsx
<Tabs defaultValue="minta">
  ...
</Tabs>
```

Controlled, seperti popup e-book karena tab perlu terhubung ke state halaman:

```jsx
<Tabs value={tab} onValueChange={pilihTab}>
  ...
</Tabs>
```

Jangan memakai `value` tanpa `onValueChange`, karena Tabs akan menjadi read-only dan tombol tab terlihat bisa diklik tetapi tidak berpindah.

### Aturan value

- `TabsTrigger value="minta"` harus memiliki `TabsContent value="minta"` yang cocok.
- Nilai harus stabil dan bukan label yang dapat berubah karena terjemahan.
- Jangan menggunakan label tampilan sebagai value jika label bisa berubah antara bahasa ID dan EN.
- Satu `Tabs` harus memiliki `defaultValue` atau `value` yang benar-benar cocok dengan salah satu trigger.

### State Radix

Radix menambahkan atribut seperti:

```html
data-state="active"
data-state="inactive"
```

Karena itu wrapper memakai class Tailwind:

```text
data-[state=active]:bg-white
data-[state=active]:text-slate-900
data-[state=active]:shadow-sm
```

Jangan membaca state tab lewat `document.querySelector` atau menambahkan event listener manual. Gunakan `value`/`onValueChange` pada Root.

### Keyboard dan aksesibilitas

Radix mengurus role, `aria-selected`, relasi tab-panel, focus, dan navigasi keyboard. Jangan mengulang implementasi manual dengan `useId`, `querySelectorAll`, atau handler ArrowLeft/ArrowRight di wrapper.

Jangan menghapus role yang dipasang Radix. Props seperti `aria-label` boleh diteruskan ke `TabsList` bila daftar tab membutuhkan konteks tambahan:

```jsx
<TabsList aria-label="Cara mendapatkan kode akses">
  ...
</TabsList>
```

## 9. Markup popup e-book yang berlaku

File utama: `src/halaman/ProgramKami/ModalUnduhEbook.jsx`.

Struktur besarnya:

```jsx
<div className="fixed inset-0 ..." onMouseDown={...}>
  <Tabs value={tab} onValueChange={pilihTab}>
    <Card role="dialog" aria-modal="true" aria-labelledby="judul-unduh-ebook">
      <CardHeader>Judul buku dan tombol tutup</CardHeader>

      {tercatat ? (
        <CardContent>Keadaan berhasil mengunduh</CardContent>
      ) : mintaTerkirim ? (
        <CardContent>Keadaan permintaan terkirim</CardContent>
      ) : (
        <CardContent>
          <TabsList>...</TabsList>
          <TabsContent value="minta">Form permintaan</TabsContent>
          <TabsContent value="kode">Form penukaran kode</TabsContent>
        </CardContent>
      )}
    </Card>
  </Tabs>
</div>
```

Alur yang harus dipertahankan:

1. Pengunjung membuka popup dari tombol Unduh pada kartu e-book.
2. Tab awal adalah `minta`.
3. Tab `minta` mengirim `nama`, `akunChess`, `bukuId`, dan `judul` melalui `ajukanMintaEbook()`.
4. Tab `kode` mengirim `kode`, `nama`, `akunChess`, `bukuId`, dan `judul` melalui `tebusUnduhanEbook()`.
5. Kode berhasil ditebus → unduhan otomatis diarahkan ke `urlEbook(buku.file, { unduh: true })`.
6. `tercatat` menampilkan keadaan sukses.
7. `mintaTerkirim` menampilkan konfirmasi permintaan.
8. Error API ditampilkan melalui `role="alert"`.
9. Escape, tombol tutup, dan klik overlay menutup popup.
10. Body scroll dikunci ketika popup aktif.

Jangan memindahkan pemanggilan API ke `Tabs`, `Card`, atau wrapper umum. Domain logic tetap di `ModalUnduhEbook.jsx`.

## 10. Aturan overlay dan popup

Popup e-book belum memakai `@radix-ui/react-dialog`. Perilaku custom saat ini harus dipertahankan:

- overlay `fixed inset-0`.
- `z-index` di atas isi halaman.
- `role="dialog"` dan `aria-modal="true"` pada Card popup.
- `aria-labelledby` menunjuk ke judul popup.
- klik yang tepat pada backdrop menutup popup; klik isi popup tidak boleh menutupnya.
- Escape menutup popup.
- body scroll dikunci dan dikembalikan saat unmount.
- popup tetap usable pada layar kecil dengan `overflow-y-auto`.

Jika mengganti overlay custom dengan Radix Dialog, itu adalah perubahan perilaku medium. AI harus memeriksa scope, menambah dependency yang benar, memindahkan focus management dengan hati-hati, dan menjalankan uji UI sebelum menganggapnya setara.

## 11. Class Tailwind dan `cn()`

Gunakan class yang sudah dipakai project:

- aksen primer: `#0B2F9F`.
- hero gelap: `#021624`.
- border netral: `border-slate-200` atau `#E2E8F0`.
- teks utama: `text-slate-900`.
- teks sekunder: `text-slate-500`/`text-slate-600`.

Contoh benar:

```jsx
<TabsList className={cn("w-full", mode === "compact" && "h-9")}>
  ...
</TabsList>
```

Contoh yang tidak disarankan:

```jsx
<div className={`flex ${className}`}>
```

Alasannya: jika pemanggil memberi `grid`, kedua class bisa masuk dan hasil akhir bergantung pada urutan CSS. `twMerge` menyelesaikan konflik utility Tailwind.

Jangan menggunakan:

- gradien dekoratif.
- glow atau warna neon.
- emoji di UI.
- shadow besar dan radius ekstrem tanpa kebutuhan.
- class warna acak di luar palet project.
- inline style untuk hal yang sudah dapat dilakukan Tailwind.

## 12. i18n dan teks

Default bahasa project adalah Indonesia. Kamus berada di:

```text
src/lib/terjemahan/id/
src/lib/terjemahan/en/
```

Untuk teks popup yang sudah memiliki key, gunakan:

```jsx
const { t } = useI18n();
<Button>{t("unduhEbook.mulaiUnduh")}</Button>
```

Key yang sudah dipakai popup ada pada kelompok `unduhEbook` di `src/lib/terjemahan/id/program.js` dan versi Inggrisnya.

Jika menambah teks yang akan terlihat pengguna:

1. Tambahkan key ke kamus ID.
2. Tambahkan key yang sama ke kamus EN.
3. Gunakan `t("kelompok.key")` di JSX.
4. Jalankan `npm run uji:i18n`.

Teks instruksi yang hanya berupa komentar kode boleh tetap dalam Bahasa Indonesia dan tidak perlu dimasukkan ke kamus.

## 13. Diagnosa error umum

### `Failed to resolve import "@/components/ui/..."`

Periksa:

1. File wrapper benar-benar ada di `src/components/ui/`.
2. Alias `@` ada di `vite.config.js`.
3. Jalankan ulang Vite setelah mengubah `vite.config.js`.
4. Nama file dan huruf besar-kecilnya tepat.

Mengubah `jsconfig.json` saja tidak cukup untuk Vite.

### `Failed to resolve import "@radix-ui/react-tabs"`

Jalankan:

```bash
npm install @radix-ui/react-tabs
```

Lalu pastikan dependency masuk ke `package.json` dan `package-lock.json`. Jangan hanya mengandalkan isi `node_modules` yang tidak dilacak Git.

### `Tabs` tidak berpindah

Periksa:

- `Tabs` menggunakan `defaultValue` atau `value`.
- Jika controlled, `onValueChange` tersedia.
- `TabsTrigger` dan `TabsContent` memakai value yang sama.
- Tidak ada state halaman yang menimpa value Radix dengan nilai yang tidak dikenal.

### Tombol submit tidak mengirim form

Wrapper `Button` default-nya `type="button"`. Pada formulir gunakan:

```jsx
<Button type="submit">Kirim</Button>
```

### Label tidak terhubung ke input

Periksa bahwa:

```jsx
<Label htmlFor="nama" />
<Input id="nama" />
```

menggunakan string ID yang sama dan ID tersebut unik di DOM.

### Class `grid` tidak mengalahkan `flex`

Gunakan `cn()` dan pastikan `tailwind-merge` dipakai. Jangan menggabungkan class melalui template string polos.

### Error `Invalid hook call`

Jangan memasang dua versi atau dua instance React. Vite project ini sudah memakai:

```js
dedupe: ["react", "react-dom", "react-router", "react-router-dom"]
```

Jangan mengimpor React dari path yang berbeda. Setelah perubahan dependency, restart Vite dan jalankan build bersih.

### Radix terpasang tetapi komponen tidak terlihat

Radix tidak memberi gaya visual default. Pastikan wrapper memiliki `className`, Tailwind memproses file JSX, dan `src/index.css` tetap mengandung:

```css
@import "tailwindcss";
```

### Warning prop DOM tidak dikenal

Jangan meneruskan prop internal seperti `variant`, `size`, atau `as` ke elemen native tanpa menghapusnya dari destructuring. Wrapper yang berlaku sudah mengambil prop internal sebelum meneruskan sisa props.

## 14. Prosedur perubahan markup

Ikuti urutan ini:

### Langkah A — pahami scope

Tentukan apakah permintaan hanya mengubah:

- markup dan class;
- perilaku tab;
- perilaku dialog/focus;
- alur API;
- dependency atau build config.

Perubahan dependency, alias, atau komponen umum dapat memengaruhi banyak halaman. Jangan memasukkannya sebagai refactor tambahan jika tidak diperlukan.

### Langkah B — cari pola yang sudah ada

Cari penggunaan komponen:

```bash
grep -RIn --exclude-dir=node_modules "ModalUnduhEbook\|TabsTrigger\|CardContent" src
```

Baca pemanggilnya. Untuk popup e-book, baca minimal:

- `src/halaman/ProgramKami/ModalUnduhEbook.jsx`.
- `src/halaman/ProgramKami/EbookPanduan.jsx`.
- `src/lib/api/ebook.js`.
- `src/lib/terjemahan/id/program.js`.
- `src/lib/terjemahan/en/program.js`.

### Langkah C — ubah wrapper jika memang diperlukan

Jika hanya satu halaman membutuhkan perubahan, ubah halaman tersebut. Jika pola yang sama dipakai beberapa tempat, baru pertimbangkan wrapper `src/components/ui/`.

Jangan menaruh copy atau state e-book dalam wrapper umum.

### Langkah D — jaga aksesibilitas

Periksa:

- heading dialog benar.
- `role="dialog"`, `aria-modal`, dan `aria-labelledby` ada pada popup custom.
- setiap trigger tab punya content yang sesuai.
- setiap input punya label.
- tombol ikon punya `aria-label`.
- state error memakai `role="alert"`.
- keyboard navigation tidak rusak.

### Langkah E — verifikasi

Perintah minimum untuk perubahan UI e-book:

```bash
npm run uji:rute
npm run uji:i18n
npm run uji:ebook
npm run build
```

Jika perubahan menyentuh frontend secara umum, tambahkan pemeriksaan yang relevan dari `.opencode/skills/kci-pengujian/SKILL.md`.

## 15. Checklist review AI

Sebelum membuat commit, periksa semua item berikut:

- [ ] Komponen yang diperlukan diimpor dari `@/components/ui/`.
- [ ] Semua dependency yang diimpor tercantum di `package.json` dan lockfile.
- [ ] `vite.config.js` tetap menyediakan alias `@` dan dedupe React.
- [ ] `cn()` dipakai untuk class gabungan.
- [ ] Tabs memakai value yang cocok antara trigger dan content.
- [ ] Tabs controlled memiliki `onValueChange`.
- [ ] Form submit memakai `Button type="submit"`.
- [ ] Semua input memiliki Label dan ID unik.
- [ ] Perilaku API e-book tidak berubah tanpa permintaan pengguna.
- [ ] Popup tetap dapat ditutup dengan tombol, Escape, dan backdrop.
- [ ] Body scroll dikunci dan dipulihkan dengan benar.
- [ ] Tidak ada emoji, gradien, atau visual yang bertentangan dengan desain KCI.
- [ ] Teks baru yang terlihat pengguna memiliki key ID dan EN.
- [ ] `git diff --check` lulus.
- [ ] `npm run build` lulus.
- [ ] Uji domain yang relevan lulus.

## 16. Contoh markup popup yang benar

Contoh ini adalah pola ringkas, bukan pengganti `ModalUnduhEbook.jsx`:

```jsx
import { Button } from "@/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";

export default function PanelContoh({ nama, setNama, kirim }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <Tabs defaultValue="minta" className="w-full max-w-[480px]">
        <Card role="dialog" aria-modal="true" aria-labelledby="judul-panel">
          <CardHeader>
            <CardTitle as="h2" id="judul-panel">
              Akses e-book
            </CardTitle>
            <CardDescription>
              Pilih cara mendapatkan kode akses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsList aria-label="Cara mendapatkan kode" className="grid w-full grid-cols-2">
              <TabsTrigger value="minta">Belum punya kode</TabsTrigger>
              <TabsTrigger value="kode">Sudah punya kode</TabsTrigger>
            </TabsList>
            <TabsContent value="minta" className="mt-5">
              <form onSubmit={kirim} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="nama">Nama asli</Label>
                  <Input
                    id="nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                  />
                </div>
                <CardFooter className="p-0 pt-1">
                  <Button type="submit" className="w-full">
                    Kirim permintaan
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            <TabsContent value="kode" className="mt-5">
              Form kode akses
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
```

Jika contoh ini gagal di file baru, periksa alias Vite, lokasi wrapper, dan dependency terlebih dahulu. Jangan langsung mengganti Radix dengan implementasi manual karena itu dapat menghilangkan perilaku keyboard dan ARIA yang sudah disediakan Radix.

## 17. Batasan dan keputusan arsitektur

- Tidak ada TypeScript pada project ini; jangan menambahkan file `.tsx` untuk komponen UI tanpa permintaan khusus.
- Tidak ada `class-variance-authority` pada setiap komponen secara wajib. Gunakan CVA ketika komponen memiliki varian yang memang dipakai ulang, seperti Button.
- Tidak semua primitive Radix sudah terpasang. Yang dipakai saat ini adalah Label dan Tabs.
- `Dialog`, `Popover`, `Select`, `Tooltip`, dan primitive lain belum boleh diimpor seolah-olah tersedia. Cek `package.json` terlebih dahulu.
- Card dan Input adalah wrapper visual lokal, bukan primitive Radix.
- Jangan menambahkan `@radix-ui/react-dialog` hanya untuk memperbaiki class atau markup kecil pada popup yang masih bekerja.
- Jangan mengubah backend e-book atau API hanya karena popup sedang diubah.

## 18. Perintah referensi

```bash
# Memasang dependency UI yang memang digunakan
npm install @radix-ui/react-tabs @radix-ui/react-label class-variance-authority clsx tailwind-merge

# Menjalankan aplikasi
npm run dev -- --host 0.0.0.0

# Validasi markup/rute/i18n/build
npm run uji:rute
npm run uji:i18n
npm run uji:ebook
npm run build

# Pemeriksaan whitespace dan status
 git diff --check
 git status --short
```

Jangan memasukkan `node_modules/` atau `dist/` ke Git. Keduanya sudah diabaikan oleh konfigurasi repository.

## 19. Ringkasan singkat

Jika AI hanya punya waktu membaca bagian ini, ikuti aturan berikut:

1. Radix menyediakan primitive; wrapper lokal ada di `src/components/ui/`.
2. Gunakan `@/components/ui/...`, dan pertahankan alias `@` di `vite.config.js`.
3. Gunakan `cn()` dari `@/lib/utils.js` untuk class Tailwind.
4. Tabs memakai Radix; jangan membuat keyboard navigation manual.
5. `Tabs` controlled wajib memiliki `onValueChange`.
6. Input wajib punya Label dan ID unik.
7. Jangan mengubah alur API `ModalUnduhEbook.jsx` saat hanya memperbaiki markup.
8. Popup custom saat ini bukan Radix Dialog; jangan mengklaimnya sebagai focus-trapped.
9. Jalankan `npm run uji:ebook` dan `npm run build` sebelum selesai.
10. Ikuti `AGENTS.md`, skill frontend, dan checklist di dokumen ini.
