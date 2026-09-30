# Komponen Tools (neobrutalism)

Komponen siap panggil bergaya [neobrutalism.dev](https://www.neobrutalism.dev) —
diport dari [ekmas/neobrutalism-components](https://github.com/ekmas/neobrutalism-components)
dan disesuaikan dengan identitas situs (biru `#0B2F9F`, bayangan keras
`shadow-[4px_4px_0px_0px_#000]`, font sans UI situs).

**Tujuan:** semua halaman memakai markup yang sama. Jangan menulis
ulang markup accordion/grafik per halaman — panggil komponen ini.

## Impor (satu baris untuk semuanya)

```jsx
import { AccordionTools, GrafikBatang, GrafikGaris, GrafikArea, GrafikPai } from "@/components/tools";
```

> Alias `@` menunjuk ke `src/` (sudah diatur di `jsconfig.json` & `vite.config.js`).

---

## 1. AccordionTools

Accordion data-dorong — oper array, selesai.

```jsx
const tanyaJawab = [
  { judul: "Apa itu Blunder Skuad?", isi: <p>Komunitas catur untuk semua…</p> },
  { judul: "Bagaimana cara bergabung?", isi: <p>Isi formulir pendaftaran…</p> },
];

<AccordionTools items={tanyaJawab} />
```

Prop opsional:

| Prop | Bawaan | Fungsi |
| --- | --- | --- |
| `terbukaAwal` | — | index item yang terbuka saat muat, mis. `terbukaAwal={0}` |
| `type` | `"single"` | `"single"` / `"multiple"` (Radix) |
| `collapsible` | `true` | item boleh ditutup lagi |
| `className` | — | gabungan class wadah (jarak antar item: ubah `gap-4`) |
| `itemClassName`, `triggerClassName`, `contentClassName` | — | penyesuaian per bagian |

Markup manual ala [dokumentasi neobrutalism.dev/accordion](https://www.neobrutalism.dev/docs/accordion)
juga tetap bisa (primitif diekspor dari titik yang sama):

```jsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/tools";

<Accordion type="single" collapsible className="w-full max-w-xl">
  <AccordionItem value="item-1">
    <AccordionTrigger>Apakah aksesibel?</AccordionTrigger>
    <AccordionContent>Ya, mengikuti pola WAI-ARIA.</AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## 2. Grafik (Batang / Garis / Area / Pai)

Satu pemanggilan = kartu berbingkai + judul + grafik + tooltip bergaya sama.
Berbasis Recharts (teknik `chartConfig` seperti
[neobrutalism.dev/charts](https://www.neobrutalism.dev/charts)).

### Grafik batang / garis / area

```jsx
const data = [
  { bulan: "Jan", pengunjung: 186, anggota: 80 },
  { bulan: "Feb", pengunjung: 305, anggota: 120 },
  { bulan: "Mar", pengunjung: 237, anggota: 150 },
];

const config = {
  pengunjung: { label: "Pengunjung", color: "var(--chart-1)" },
  anggota:    { label: "Anggota Baru", color: "var(--chart-2)" },
};

<GrafikBatang
  judul="Statistik Komunitas"
  deskripsi="Januari – Maret 2026"
  data={data}
  config={config}
  kunciX="bulan"
  denganLegenda
/>
```

`GrafikGaris` dan `GrafikArea` menerima prop yang persis sama — cukup ganti
nama komponennya:

```jsx
<GrafikGaris judul="Rating Rata-rata" data={data} config={config} kunciX="bulan" />
<GrafikArea  judul="Partai per Bulan"  data={data} config={config} kunciX="bulan" susun />
```

### Grafik pai / donat

```jsx
const dataPai = [
  { platform: "chesscom", pemain: 275 },
  { platform: "lichess",  pemain: 200 },
];

const configPai = {
  chesscom: { label: "Chess.com", color: "var(--chart-1)" },
  lichess:  { label: "Lichess",   color: "var(--chart-3)" },
};

<GrafikPai
  judul="Platform Bermain"
  data={dataPai}
  config={configPai}
  kunciNama="platform"
  kunciNilai="pemain"
  donat        // hilangkan untuk pai penuh
/>
```

### Referensi prop

| Prop | Berlaku | Bawaan | Fungsi |
| --- | --- | --- | --- |
| `data`, `config` | semua | wajib | data polos + peta label/warna seri |
| `judul` / `deskripsi` / `footer` | semua | — | teks kartu (hilangkan bila tak perlu) |
| `kunciX` | batang/garis/area | `"nama"` | kunci sumbu X |
| `seri` | batang/garis/area | semua kunci `config` | batasi urutan seri yang digambar |
| `tinggi` | semua | `"h-[250px]"` | class tinggi grafik |
| `denganLegenda` | semua | `false` (pai: `true`) | legenda seri |
| `denganTooltip` | semua | `true` | tooltip hover neobrutalism |
| `susun` | batang/area | `false` | mode bertumpuk |
| `jenis` | garis/area | `"monotone"` | `"linear"` / `"step"` |
| `denganTitik` | garis | `true` | titik di tiap simpul |
| `formatX` | batang/garis/area | — | mis. `(v) => v.slice(0, 3)` |
| `donat` | pai | `false` | pai donat |

### Warna

`color` pada `config` diisi token situs `var(--chart-1)` … `var(--chart-5)`
(didefinisikan di `src/index.css`, blok `@theme`). Boleh juga hex/HSL langsung.
Urutan token dipakai berulang saat seri banyak.

### Primitif grafik

Butuh susunan khusus (mis. grafik interaktif ala contoh upstream, label khusus,
multi-axis)? Semua primitif Recharts tetap terbuka:

```jsx
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/tools";
import { Bar, BarChart } from "recharts";

<ChartContainer config={config} className="min-h-[200px] w-full">
  <BarChart data={data}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="pengunjung" fill="var(--color-pengunjung)" radius={8} />
  </BarChart>
</ChartContainer>
```

---

## Berkas

| Berkas | Isi |
| --- | --- |
| `src/components/ui/accordion.jsx` | primitif Accordion (Radix + gaya neobrutalism) |
| `src/components/ui/chart.jsx` | `ChartContainer`, tooltip & legenda grafik |
| `src/components/tools/AccordionTools.jsx` | pembungkus data-dorong accordion |
| `src/components/tools/GrafikTools.jsx` | `GrafikBatang/Garis/Area/Pai` + kerangka kartu `BingkaiGrafik` |
| `src/components/tools/index.js` | barrel — titik impor `@/components/tools` |
| `scripts/uji-tools.mjs` | uji asap render (dijalankan oleh `npm run uji`) |

## Uji

```bash
npm run uji:tools   # render uap: accordion + 4 grafik
npm run uji         # seluruh gerbang mutu (termasuk uji:tools)
```
