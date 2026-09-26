#!/usr/bin/env node
/**
 * Penjaga peta: memastikan dokumentasi arah (peta navigasi, skill pengujian,
 * dan cerminnya) TIDAK PERNAH menyimpang dari keadaan repo.
 *
 * Mengapa ada: pada 2026-09-23 audit menemukan peta navigasi sudah memuat satu
 * berkas yang sudah tidak ada (`src/lib/api/verifikasi.js`) dan skill pengujian
 * ketinggalan 14 skrip `uji:*` — semuanya lolos tanpa suara karena tidak ada
 * yang memeriksa. Uji ini menutup celah itu; kegagalannya selalu menunjuk
 * berkas yang harus disunting.
 *
 * Jalankan: node scripts/uji-peta.mjs  |  npm run uji:peta
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, BERKAS_KELUARAN, bangunPeta, berkasUji, petaSkripUji } from "./peta-kode.mjs";

let lulus = 0;
let gagal = 0;
const lapor = (pesan) => {
  gagal++;
  console.error(`  ✗ ${pesan}`);
};
const hasil = (nama, kondisi, keterangan = "") => {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    lapor(`${nama}${keterangan ? ` — ${keterangan}` : ""}`);
  }
};

const baca = (relatif) => readFileSync(path.join(ROOT, relatif), "utf8");
const ada = (relatif) => existsSync(path.join(ROOT, relatif));
const skrip = JSON.parse(baca("package.json")).scripts;
const navigasi = JSON.parse(baca("docs/roadmap/documentation-roadmap.json"));
const devin = JSON.parse(baca(".devin/wiki.json"));

/* ---------------- 1. Tidak ada berkas mati di peta navigasi ---------------- */

console.log("\n1. Setiap key_files peta benar-benar ada");
for (const [nama, dokumen] of [["documentation-roadmap.json", navigasi], [".devin/wiki.json", devin]]) {
  const mati = [];
  for (const p of dokumen.pages) {
    for (const f of p.key_files || []) {
      if (!ada(f.replace(/\/$/, ""))) mati.push(`${p.title} → ${f}`);
    }
  }
  hasil(`${nama}: tidak ada entri mati`, mati.length === 0, mati.slice(0, 5).join("; "));
}

/* ---------------- 2. Dua proyeksi peta tetap selaras ---------------- */

console.log("\n2. .devin/wiki.json selaras dengan docs/roadmap/documentation-roadmap.json");
hasil(
  "jumlah halaman sama",
  navigasi.pages.length === devin.pages.length,
  `${navigasi.pages.length} vs ${devin.pages.length}`
);
if (navigasi.pages.length === devin.pages.length) {
  const beda = [];
  navigasi.pages.forEach((p, i) => {
    const d = devin.pages[i];
    if (JSON.stringify(p.key_files) !== JSON.stringify(d.key_files)) beda.push(`key_files #${i + 1} (${p.title})`);
    if (JSON.stringify(p.keywords) !== JSON.stringify(d.keywords)) beda.push(`keywords #${i + 1} (${p.title})`);
  });
  hasil("key_files & keywords per indeks sama", beda.length === 0, beda.slice(0, 5).join("; "));
}

/* ---------------- 3. Alur uji terdokumentasi ---------------- */

console.log("\n3. Alur uji tercatat di skill kci-pengujian");
const jalurSkill = ".agents/skills/kci-pengujian/SKILL.md";
const teksSkill = baca(jalurSkill);
const skripUji = Object.keys(skrip).filter((n) => n.startsWith("uji")).sort();
const belumTercatat = skripUji.filter((n) => !teksSkill.includes(n));
hasil(
  `semua ${skripUji.length} skrip uji:* disebut di SKILL.md`,
  belumTercatat.length === 0,
  belumTercatat.length ? `belum tercatat: ${belumTercatat.join(", ")}` : ""
);
hasil(
  "SKILL.md menunjuk ke peta kode",
  teksSkill.includes("PETA-KODE.md") || teksSkill.includes("npm run peta"),
  "tambahkan rujukan `npm run peta` / docs/PETA-KODE.md"
);

/* ---------------- 4. Tidak ada berkas uji yatim ---------------- */

console.log("\n4. Setiap berkas uji dipanggil minimal satu skrip npm");
const petaUji = petaSkripUji();
const yatim = berkasUji()
  .filter((u) => !petaUji.has(u.relatif.split("/").pop()))
  .map((u) => u.relatif);
hasil("tidak ada uji yatim", yatim.length === 0, yatim.join(", "));

/* ---------------- 5. Halaman baru wajib terdaftar ---------------- */

console.log("\n5. Folder halaman terdaftar di peta navigasi");
const teksNavigasi = baca("docs/roadmap/documentation-roadmap.json");
const folderHalaman = readdirSync(path.join(ROOT, "src/halaman"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
const halamanTakTerdaftar = folderHalaman.filter((h) => !teksNavigasi.includes(`src/halaman/${h}`));
hasil(
  `semua ${folderHalaman.length} folder src/halaman/* terdaftar`,
  halamanTakTerdaftar.length === 0,
  halamanTakTerdaftar.join(", ")
);

/* ---------------- 6. Cermin skill ---------------- */

console.log("\n6. Cermin berkas");
const bacaSemua = (akar) => {
  const hasil = new Map();
  const tumpuk = [akar];
  while (tumpuk.length) {
    const kini = tumpuk.pop();
    for (const entri of readdirSync(kini, { withFileTypes: true })) {
      const penuh = path.join(kini, entri.name);
      if (entri.isDirectory()) tumpuk.push(penuh);
      else hasil.set(path.relative(akar, penuh).split(path.sep).join("/"), readFileSync(penuh, "utf8"));
    }
  }
  return hasil;
};
const agen = bacaSemua(path.join(ROOT, ".agents/skills"));
const opencode = bacaSemua(path.join(ROOT, ".opencode/skills"));
const berkasCermin = [...new Set([...agen.keys(), ...opencode.keys()])].sort();
const cerminBeda = berkasCermin.filter((b) => agen.get(b) !== opencode.get(b));
hasil(
  `.agents/skills ⇄ .opencode/skills (${berkasCermin.length} berkas)`,
  cerminBeda.length === 0,
  `berbeda: ${cerminBeda.join(", ")} — salin berkasnya agar identik`
);

const kerja = baca(".github/workflows/quality.yml");
const cerminKerja = baca("quality.yml").slice(baca("quality.yml").indexOf("name: Quality checks"));
hasil(
  "quality.yml (root) ⇄ .github/workflows/quality.yml",
  cerminKerja === kerja,
  "salin blok mulai baris 'name: Quality checks' ke kedua berkas"
);

/* ---------------- 7. Peta kode sinkron ---------------- */

console.log("\n7. docs/PETA-KODE.md sinkron dengan hasil generate");
const seharusnya = bangunPeta();
const diDisk = ada(BERKAS_KELUARAN) ? baca(BERKAS_KELUARAN) : null;
hasil(
  `${BERKAS_KELUARAN} mutakhir`,
  diDisk === seharusnya,
  "jalankan `npm run peta` lalu commit hasilnya"
);

/* ---------------- 8. Frontmatter SKILL.md sah ---------------- */

// Syarat pemuatan skill di opencode (diverifikasi dari sumbernya): folder `.agents/skills/<name>/`
// harus berisi `SKILL.md` ber-frontmatter YAML dengan `name` SAMA dengan nama folder, `description`
// 1-1024 karakter, dan `metadata` berupa peta string ke string. Frontmatter yang tidak sah membuat
// skill DILEWATI tanpa pesan yang jelas ke pengguna — persis kegagalan senyap yang ingin dicegah uji ini.
console.log("\n8. Frontmatter SKILL.md sesuai aturan pemuatan opencode");

const POLA_NAMA_SKILL = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const folderSkill = readdirSync(path.join(ROOT, ".agents/skills"), { withFileTypes: true })
  .filter((entri) => entri.isDirectory())
  .map((entri) => entri.name)
  .sort();

const tanpaFrontmatter = [];
const namaSalah = [];
const deskripsiSalah = [];
for (const nama of folderSkill) {
  const relatif = `.agents/skills/${nama}/SKILL.md`;
  if (!ada(relatif)) {
    tanpaFrontmatter.push(`${nama}: SKILL.md tidak ada`);
    continue;
  }
  const blok = baca(relatif).match(/^---\n([\s\S]*?)\n---(\n|$)/);
  if (!blok) {
    tanpaFrontmatter.push(`${nama}: frontmatter YAML tidak ditemukan`);
    continue;
  }

  const barisFrontmatter = blok[1].split("\n");
  const nilaiKunci = (kunci) => {
    const baris = barisFrontmatter.find((b) => new RegExp(`^${kunci}\\s*:`).test(b));
    return baris ? baris.replace(new RegExp(`^${kunci}\\s*:`), "").trim() : null;
  };

  const namaSkill = nilaiKunci("name");
  if (namaSkill !== nama || !POLA_NAMA_SKILL.test(namaSkill || "") || namaSkill.length > 64) {
    namaSalah.push(`${nama}: name="${namaSkill}" (harus sama dengan nama folder, pola huruf kecil/angka dipisah satu '-')`);
  }

  const deskripsi = nilaiKunci("description");
  const masalahDeskripsi = [];
  if (!deskripsi) masalahDeskripsi.push("description kosong");
  else {
    if (deskripsi.length > 1024) masalahDeskripsi.push(`description ${deskripsi.length} karakter (maks 1024)`);
    // ": " di nilai tanpa tanda kutip membuat YAML membacanya sebagai peta bersarang.
    if (/:\s/.test(deskripsi)) masalahDeskripsi.push('description memuat ": " (bikin YAML rusak; ganti dengan " - ")');
  }

  const indeksMetadata = barisFrontmatter.findIndex((b) => /^metadata\s*:/.test(b));
  if (indeksMetadata !== -1) {
    for (const baris of barisFrontmatter.slice(indeksMetadata + 1)) {
      if (!baris.trim()) continue;
      if (!/^\s+/.test(baris)) break; // keluar dari blok metadata
      if (!/^\s+[A-Za-z0-9_-]+:\s*\S/.test(baris)) {
        masalahDeskripsi.push(`metadata harus "kunci: nilai" satu tingkat (baris: ${baris.trim()})`);
        break;
      }
    }
  }
  if (masalahDeskripsi.length) deskripsiSalah.push(`${nama}: ${masalahDeskripsi.join("; ")}`);
}

hasil(
  `semua ${folderSkill.length} folder skill punya SKILL.md ber-frontmatter`,
  tanpaFrontmatter.length === 0,
  tanpaFrontmatter.join("; ")
);
hasil("name setiap SKILL.md sama dengan nama folder", namaSalah.length === 0, namaSalah.join("; "));
hasil(
  "description 1-1024 karakter dan metadata peta string",
  deskripsiSalah.length === 0,
  deskripsiSalah.join("; ")
);

/* ---------------- Ringkasan ---------------- */

console.log(`\n${gagal === 0 ? "LULUS" : "GAGAL"}: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
