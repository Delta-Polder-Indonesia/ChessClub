import fs from "node:fs";
import path from "node:path";

const AKAR = path.resolve(import.meta.dirname, "..");
const BASELINE = path.join(AKAR, "scripts", "baseline-standar-desain.json");
const TULIS = process.argv.includes("--tulis-baseline");
const EKSTENSI = new Set([".jsx", ".js", ".css"]);
const AREA_KONTEN = [
  "src/halaman/Atribusi/",
  "src/halaman/HubungiKami/",
  "src/halaman/Karir/",
  "src/halaman/Keberlanjutan/",
  "src/halaman/MediaDanInformasi/",
  "src/halaman/TentangKami/",
  "src/halaman/Turnamen/",
  "src/components/PageBagian.jsx",
  "src/components/konten/",
];

const AREA_CATUR = [
  "src/halaman/PapanInteraktif/",
  "src/halaman/TekaTeki/",
  "src/halaman/TekaTekiRush/",
  "src/halaman/QuizCatur/",
];

function termasukAreaKonten(relatif) {
  return AREA_KONTEN.some((awalan) => relatif.startsWith(awalan));
}

function termasukAreaCatur(relatif) {
  return AREA_CATUR.some((awalan) => relatif.startsWith(awalan));
}

const pintuResmi = [
  "src/components/PageBagian.jsx",
  "src/components/konten/AksiKonten.jsx",
  "src/components/konten/TabelKonten.jsx",
  "src/components/icons.jsx",
  "src/halaman/Analisa/komponen/",
];

for (const berkas of pintuResmi) {
  if (!fs.existsSync(path.join(AKAR, berkas))) {
    console.error(`Pintu komponen resmi hilang: ${berkas}`);
    process.exit(1);
  }
}

const desain = fs.readFileSync(path.join(AKAR, "DESIGN.md"), "utf8");
for (const berkas of pintuResmi) {
  if (!desain.includes(berkas)) {
    console.error(`DESIGN.md belum mencatat pintu resmi: ${berkas}`);
    process.exit(1);
  }
}

const aturan = {
  "ukuran-teks-arbitrary": /text-\[[^\]]+\]/g,
  "leading-arbitrary": /leading-\[[^\]]+\]/g,
  "tracking-arbitrary": /tracking-\[[^\]]+\]/g,
  "max-width-arbitrary": /max-w-\[[^\]]+\]/g,
  "teks-terlalu-kecil": /text-\[(?:[0-9]|1[01])px\]/g,
  "teks-justify": /\btext-justify\b|\btext-\[justify\]/g,
  "gradient-dekoratif": /\bbg-gradient-|\bfrom-(?:purple|violet|indigo|pink)-|\btext-transparent\b/g,
  "glassmorphism": /\bbackdrop-blur(?:-|\b)/g,
  "radius-berlebihan": /\brounded-(?:2xl|3xl|\[[^\]]+\])/g,
  "shadow-berlebihan": /\bshadow-(?:xl|2xl|\[[^\]]+\])/g,
  "hover-scale": /\bhover:scale-/g,
  "tombol-ad-hoc": /<button\b/g,
  "tabel-ad-hoc": /<table\b/g,
  "svg-inline": /<svg\b/g,
};

function daftarBerkas(dir) {
  const hasil = [];
  for (const entri of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entri.name)) continue;
    const penuh = path.join(dir, entri.name);
    if (entri.isDirectory()) hasil.push(...daftarBerkas(penuh));
    else if (EKSTENSI.has(path.extname(entri.name))) hasil.push(penuh);
  }
  return hasil;
}

function hitungKemunculan(isi, kelas) {
  let jumlah = 0;
  let dari = 0;
  for (;;) {
    const pos = isi.indexOf(kelas, dari);
    if (pos === -1) return jumlah;
    jumlah += 1;
    dari = pos + kelas.length;
  }
}

// Gaya display rumah (lihat DESIGN.md "Skala Tipografi") disetujui dan boleh
// muncul di area konten mana pun. Aturan tetap menandai ukuran/leading
// arbitrer lain, jadi hanya nilai tunggal ini yang dikecualikan.
const GAYA_DISPLAY = new Map([
  ["ukuran-teks-arbitrary", ["text-[clamp(2.4rem,3.6vw,3.4rem)]"]],
  ["leading-arbitrary", ["leading-[1.04]"]],
]);

function hitung() {
  const hasil = {};
  for (const penuh of daftarBerkas(path.join(AKAR, "src"))) {
    const relatif = path.relative(AKAR, penuh).replaceAll(path.sep, "/");
    const areaKonten = termasukAreaKonten(relatif);
    const areaCatur = termasukAreaCatur(relatif);
    if (!areaKonten && !areaCatur) continue;
    const isi = fs.readFileSync(penuh, "utf8");
    const temuan = {};
    const aturanAktif = areaKonten ? aturan : { "svg-inline-catur": /<svg\b/g };
    for (const [nama, pola] of Object.entries(aturanAktif)) {
      if (relatif === "src/components/konten/AksiKonten.jsx" && nama === "tombol-ad-hoc") continue;
      if (relatif === "src/components/konten/TabelKonten.jsx" && nama === "tabel-ad-hoc") continue;
      pola.lastIndex = 0;
      const diizinkan = GAYA_DISPLAY.get(nama) ?? [];
      const jumlah =
        [...isi.matchAll(pola)].length -
        diizinkan.reduce((n, kelas) => n + hitungKemunculan(isi, kelas), 0);
      if (jumlah > 0) temuan[nama] = jumlah;
    }
    if (Object.keys(temuan).length) hasil[relatif] = temuan;
  }
  return hasil;
}

const sekarang = hitung();
if (TULIS) {
  fs.writeFileSync(BASELINE, `${JSON.stringify(sekarang, null, 2)}\n`);
  console.log(`Baseline standar desain ditulis: ${path.relative(AKAR, BASELINE)}`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  console.error("Baseline standar desain belum ada. Jalankan npm run desain:baseline setelah audit manual.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const kegagalan = [];
for (const [berkas, temuan] of Object.entries(sekarang)) {
  for (const [aturanNama, jumlah] of Object.entries(temuan)) {
    const batas = baseline[berkas]?.[aturanNama] ?? 0;
    if (jumlah > batas) kegagalan.push(`${berkas}: ${aturanNama} ${jumlah} (baseline ${batas})`);
  }
}

if (kegagalan.length) {
  console.error("Penyimpangan desain baru terdeteksi:\n");
  for (const baris of kegagalan) console.error(`- ${baris}`);
  console.error("\nPerbaiki penyimpangan. Perbarui baseline hanya setelah audit dan persetujuan perubahan standar.");
  process.exit(1);
}

const total = Object.values(sekarang).reduce(
  (jumlah, perBerkas) => jumlah + Object.values(perBerkas).reduce((a, b) => a + b, 0),
  0
);
console.log(`Standar desain terjaga: tidak ada penyimpangan baru (${total} temuan lama dibatasi baseline).`);
