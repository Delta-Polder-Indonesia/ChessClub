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

// Aturan yang hanya diperiksa di AREA_KONTEN (aturan visual/tata letak editorial).
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

// Aturan yang diterapkan ke SELURUH src/ (lintas area: komponen umum, UI kit,
// Pengurus, dan halaman catur). Ini menjaga agar warna token brand tidak
// di-hardcode sebagai hex arbitrer di kelas Tailwind atau string JS.
//
// Yang DIDETEKSI:
//   - utilitas Tailwind dengan hex brand di dalam kurung siku:
//       text-[#0B2F9F], bg-[#0b2f9f], border-[#0B2F9F]/20, ring-[#4D7CF5], …
//   - string hex terlingkupi tanda kutip (JS) untuk tiga palet brand utama
//     yang sudah punya token CSS: --color-primary #0b2f9f, --color-blue-400
//     #4d7cf5, --color-hero #021624.
// Yang TIDAK dihitung (diizinkan):
//   - atribut SVG inline (fill=, stroke=, stop-color=, <path …) — ikon
//     dan diagram memang sering menulis warna langsung di SVG; bila ikon
//     brand perlu warna utama, bungkus dengan CSS/utility yang sama.
//   - komentar (baris yang diawali // atau berada di dalam blok /* */).
//     Deteksi ini memakai pendekatan heuristik baris-demi-baris, bukan
//     parser AST — cukup untuk menangkap pelanggaran baru tanpa false
//     positive yang berlebihan.
//   - warna chart (#ffdc58, #ff6b6b, #7fbc8c) yang memang dipakai untuk
//     visualisasi di src/components/tools/GrafikTools dan diagram.
const BRAND_HEX = String.raw`#(?:0B2F9F|0b2f9f|4D7CF5|4d7cf5|021624)`;
const aturanGlobal = {
  "hex-brand-arbitrer": new RegExp(
    `(?:(?:text|bg|border(?:-[a-z]+)?|ring(?:-[a-z]+)?|outline(?:-[a-z]+)?|accent|from|to|via|fill|stroke|shadow|caret|decoration)-(?:[a-z]+:)*\\[${BRAND_HEX}(?:/\\d{1,3})?\\]|"(?:\\s|)${BRAND_HEX}(?:\\s|)"|'(?:\\s|)${BRAND_HEX}(?:\\s|)')`,
    "g"
  ),
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

// Hapus string/komentar yang seharusnya tidak dihitung dari baris sumber,
// untuk aturan yang hanya ingin mendeteksi token di kode/CSS kelas.
function siapkanBarisUntukCekHex(baris) {
  // Hapus komentar // sampai akhir baris (asumsi // di dalam string tidak
  // muncul dalam konteks yang kita uji; cukup untuk kebutuhan repo ini).
  let dibersihkan = baris.replace(/\/\/.*$/, "");
  // Hapus blok komentar /* … */ (satu baris).
  dibersihkan = dibersihkan.replace(/\/\*.*?\*\//g, "");
  // Jika baris merupakan atribut SVG (fill="…", stroke="…", stop-color="…")
  // atau bagian dari tag <path …>, hapus seluruhnya agar tidak dihitung.
  if (/^\s*(<path|<circle|<rect|<line|<polyline|<polygon|<ellipse|<stop|fill=|stroke=|stop-color=)/.test(dibersihkan)) {
    return "";
  }
  // Atribut di dalam tag JSX yang diawali nama atribut SVG juga dibuang.
  dibersihkan = dibersihkan.replace(/\b(?:fill|stroke|stopColor|stop-color|floodColor)=["'][^"']*["']/g, "");
  return dibersihkan;
}

function hitungUntukAturan(isi, pola, diizinkan, _file) {
  // Untuk aturan "hex-brand-arbitrer", pindai baris-demi-baris dan hapus
  // atribut SVG/komentar sebelum mencocok agar ikon/path SVG tidak
  // menghasilkan false positive.
  if (pola._hexBrand) {
    let jumlah = 0;
    for (const baris of isi.split("\n")) {
      const dibersihkan = siapkanBarisUntukCekHex(baris);
      if (!dibersihkan) continue;
      pola.lastIndex = 0;
      jumlah += dibersihkan.match(pola)?.length ?? 0;
    }
    return jumlah;
  }
  pola.lastIndex = 0;
  return (
    [...isi.matchAll(pola)].length -
    diizinkan.reduce((n, kelas) => n + hitungKemunculan(isi, kelas), 0)
  );
}

function hitung() {
  const hasil = {};
  for (const penuh of daftarBerkas(path.join(AKAR, "src"))) {
    const relatif = path.relative(AKAR, penuh).replaceAll(path.sep, "/");
    const areaKonten = termasukAreaKonten(relatif);
    const areaCatur = termasukAreaCatur(relatif);
    const periksaArea = areaKonten || areaCatur;
    // Aturan global (hex-brand-arbitrer) selalu dijalankan; aturan editorial
    // hanya di area konten; aturan svg-inline-catur hanya di area catur.
    if (!periksaArea && !Object.keys(aturanGlobal).length) continue;
    const isi = fs.readFileSync(penuh, "utf8");
    const temuan = {};

    // Aturan editorial + svg-inline.
    if (periksaArea) {
      const aturanAktif = areaKonten
        ? aturan
        : { "svg-inline-catur": /<svg\b/g };
      for (const [nama, pola] of Object.entries(aturanAktif)) {
        if (relatif === "src/components/konten/AksiKonten.jsx" && nama === "tombol-ad-hoc") continue;
        if (relatif === "src/components/konten/TabelKonten.jsx" && nama === "tabel-ad-hoc") continue;
        const diizinkan = GAYA_DISPLAY.get(nama) ?? [];
        const jumlah = hitungUntukAturan(isi, pola, diizinkan, relatif);
        if (jumlah > 0) temuan[nama] = jumlah;
      }
    }

    // Aturan global (lintas area).
    for (const [nama, pola] of Object.entries(aturanGlobal)) {
      // src/index.css adalah sumber definisi token — warna hex di sana
      // sengaja ditulis dan boleh ada.
      if (relatif === "src/index.css") continue;
      // Komentar dokumentasi di kepala modul yang menyebut hex sebagai
      // referensi (mis. accordion.jsx baris 8) tidak dihitung; baris itu
      // sudah dibuang oleh siapkanBarisUntukCekHex via strip // komentar.
      pola._hexBrand = true;
      const jumlah = hitungUntukAturan(isi, pola, [], relatif);
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
