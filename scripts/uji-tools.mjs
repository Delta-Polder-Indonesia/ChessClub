#!/usr/bin/env node
/**
 * Uji asap komponen tools (src/components/tools/ + primitif src/components/ui/).
 *
 * Mengapa perlu: komponen tools dipakai lintas halaman — satu keliru ketik di
 * wrapper (mis. prop yang berubah, ekspor hilang, impor "@/…" putus) langsung
 * menjatuhkan semua halaman yang memanggilnya, tetapi baru ketahuan saat build
 * atau bahkan di produksi. Uji ini me-render AccordionTools dan keempat grafik
 * dengan renderToString (hasil bundel esbuild, jadi sekalian membuktikan JSX
 * + alias "@" teresolusi), lalu memeriksa markup kunci yang dijanjikan.
 *
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila esbuild tidak
 * terpasang — ia bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-tools.mjs  |  npm run uji:tools
 */
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

let esbuild;
try {
  esbuild = require("esbuild");
} catch {
  console.log("lewati uji tools — pasang `npm i -D esbuild` untuk menjalankannya.");
  process.exit(0);
}

const TMP = mkdtempSync(path.join(tmpdir(), "uji-tools-"));
const KELUARAN = path.join(TMP, "hasil.mjs");

/* Program kecil yang di-bundle: render semua komponen tools sekaligus. */
const SUMBER = `
import { renderToString } from "react-dom/server.browser";
import {
  AccordionTools,
  GrafikBatang,
  GrafikGaris,
  GrafikArea,
  GrafikPai,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  ChartContainer,
} from "@/components/tools";

const tanyaJawab = [
  { judul: "Pertanyaan satu?", isi: <p>Jawaban satu.</p> },
  { judul: "Pertanyaan dua?", isi: <p>Jawaban dua.</p> },
];

const dataGrafik = [
  { bulan: "Jan", pengunjung: 186, anggota: 80 },
  { bulan: "Feb", pengunjung: 305, anggota: 120 },
];
const configGrafik = {
  pengunjung: { label: "Pengunjung", color: "var(--chart-1)" },
  anggota: { label: "Anggota", color: "var(--chart-2)" },
};

const dataPai = [
  { platform: "chesscom", pemain: 275 },
  { platform: "lichess", pemain: 200 },
];
const configPai = {
  chesscom: { label: "Chess.com", color: "var(--chart-3)" },
  lichess: { label: "Lichess", color: "var(--chart-4)" },
};

export const hasil = {
  accordion: renderToString(
    <AccordionTools items={tanyaJawab} terbukaAwal={0} />,
  ),
  accordionPrimitif: renderToString(
    <Accordion type="single" collapsible defaultValue="a">
      <AccordionItem value="a">
        <AccordionTrigger>Judul primitif</AccordionTrigger>
        <AccordionContent>Isi primitif.</AccordionContent>
      </AccordionItem>
    </Accordion>,
  ),
  batang: renderToString(
    <GrafikBatang
      judul="Grafik Batang Uji"
      data={dataGrafik}
      config={configGrafik}
      kunciX="bulan"
      denganLegenda
    />,
  ),
  garis: renderToString(
    <GrafikGaris judul="Grafik Garis Uji" data={dataGrafik} config={configGrafik} kunciX="bulan" />,
  ),
  area: renderToString(
    <GrafikArea judul="Grafik Area Uji" data={dataGrafik} config={configGrafik} kunciX="bulan" />,
  ),
  pai: renderToString(
    <GrafikPai
      judul="Grafik Pai Uji"
      data={dataPai}
      config={configPai}
      kunciNama="platform"
      kunciNilai="pemain"
    />,
  ),
  // Pastikan primitif tingkat rendah ikut terekspor dari satu titik masuk.
  adaPrimitif: Boolean(AccordionItem && AccordionTrigger && AccordionContent && ChartContainer),
};
`;

let gagal = 0;
let kodeKeluar = 0;
const lapor = (pesan) => {
  gagal++;
  console.error(`  ✗ ${pesan}`);
};
const pastikan = (syarat, pesan) => {
  if (!syarat) lapor(pesan);
};

try {
  await esbuild.build({
    stdin: { contents: SUMBER, resolveDir: ROOT, loader: "jsx" },
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    alias: { "@": path.join(ROOT, "src") },
    logLevel: "silent",
    outfile: KELUARAN,
  });

  const { hasil } = await import(pathToFileURL(KELUARAN).href);

  /* 1 — AccordionTools: dua item, judul tampil, item pertama terbuka. */
  pastikan(
    (hasil.accordion.match(/data-slot="accordion-item"/g) || []).length === 2,
    "AccordionTools tidak me-render 2 item",
  );
  pastikan(
    hasil.accordion.includes("Pertanyaan satu?") && hasil.accordion.includes("Pertanyaan dua?"),
    "judul item AccordionTools hilang",
  );
  pastikan(
    hasil.accordion.includes('aria-expanded="true"') && hasil.accordion.includes("Jawaban satu."),
    "prop terbukaAwal tidak membuka item pertama",
  );

  /* 2 — Primitif accordion tetap bisa dipakai langsung ala neobrutalism.dev. */
  pastikan(
    hasil.accordionPrimitif.includes("Judul primitif") &&
      hasil.accordionPrimitif.includes("Isi primitif."),
    "primitif Accordion (AccordionItem/Trigger/Content) gagal dipakai langsung",
  );

  /* 3 — Keempat grafik: kerangka kartu sama, judul ada, warna seri disuntik. */
  for (const jenis of ["batang", "garis", "area", "pai"]) {
    pastikan(
      hasil[jenis].includes('data-slot="grafik-tools"'),
      `Grafik ${jenis}: kerangka kartu (data-slot="grafik-tools") hilang`,
    );
    pastikan(
      /data-chart="chart-/.test(hasil[jenis]),
      `Grafik ${jenis}: ChartContainer (data-chart) hilang`,
    );
  }
  pastikan(
    hasil.batang.includes("--color-pengunjung: var(--chart-1);") &&
      hasil.batang.includes("--color-anggota: var(--chart-2);"),
    "GrafikBatang: variabel warna seri tidak disuntikkan ChartStyle",
  );
  pastikan(
    hasil.pai.includes("--color-chesscom") && hasil.pai.includes("--color-lichess"),
    "GrafikPai: warna potongan dari config tidak disuntikkan",
  );
  pastikan(hasil.adaPrimitif, "primitif accordion/chart tidak terekspor dari @/components/tools");

  if (gagal) {
    console.error(`\n${gagal} masalah pada komponen tools ditemukan.`);
    kodeKeluar = 1;
  } else {
    console.log("OK — komponen tools (AccordionTools + 4 grafik neobrutalism) me-render markup yang dijanjikan.");
  }
} catch (err) {
  console.error("  ✗ komponen tools gagal dibundel/di-render:");
  console.error(err);
  kodeKeluar = 1;
} finally {
  // Layanan esbuild (proses anak) masih memegang berkas keluaran di dalam TMP
  // saat akhir skrip. Hentikan lebih dulu sebelum menghapus TMP: rmSync() pada
  // direktori yang berkasnya masih dipakai proses lain bisa menggantung lama
  // (khas Windows, apalagi bila antivirus ikut memindai berkas yang baru ditulis).
  try {
    await esbuild.stop();
  } catch {
    /* layanan esbuild tidak hidup — tidak apa-apa */
  }
  try {
    rmSync(TMP, { recursive: true, force: true });
  } catch {
    /* TMP gagal dibersihkan bukan alasan menggagalkan uji (mis. berkas terkunci) */
  }
}

// Keluar eksplisit: tanpa ini proses bergantung pada tidak adanya handle sisa,
// dan `npm run uji` bisa tampak menggantung setelah "OK" tercetak.
process.exit(kodeKeluar);
