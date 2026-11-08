/** Uji larangan komponen Card di halaman publik (DESIGN.md §13).
 *
 * Memindai semua berkas .jsx di src/halaman/Landing/ dan src/halaman/Karir/
 * untuk impor Card, CardHeader, CardTitle, CardDescription, CardContent,
 * atau CardFooter dari components/ui/card.jsx. Jika ditemukan, skrip ini
 * keluar dengan kode 1 sehingga CI gagal (status merah).
 *
 * Jalankan: node scripts/uji-kartu-landing.mjs
 */

import fs from "node:fs";
import path from "node:path";

const AKAR = process.cwd();
const DIR_DI_SCAN = [
  path.join(AKAR, "src", "halaman", "Landing"),
  path.join(AKAR, "src", "halaman", "Karir"),
];
const KARTU_IMPOR = /from\s+["'](\.\.\/)*components\/ui\/card\.jsx["']/;
const NAMA_KARTU = /\b(Card|CardHeader|CardTitle|CardDescription|CardContent|CardFooter)\b/;

function daftarBerkas(dir) {
  const hasil = [];
  for (const entri of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entri.name === "node_modules" || entri.name === ".git") continue;
    const penuh = path.join(dir, entri.name);
    if (entri.isDirectory()) hasil.push(...daftarBerkas(penuh));
    else if (entri.name.endsWith(".jsx")) hasil.push(penuh);
  }
  return hasil;
}

let gagal = 0;
let berkas = [];
for (const dir of DIR_DI_SCAN) {
  if (fs.existsSync(dir)) berkas = berkas.concat(daftarBerkas(dir));
}

for (const penuh of berkas) {
  const isi = fs.readFileSync(penuh, "utf8");
  if (!KARTU_IMPOR.test(isi)) continue;
  if (!NAMA_KARTU.test(isi)) continue;

  const rel = path.relative(AKAR, penuh);
  // Cari baris yang mengimpor dan memakai nama Card
  const baris = isi.split("\n").filter((l) => KARTU_IMPOR.test(l) && NAMA_KARTU.test(l));
  if (baris.length === 0) continue;

  console.error(`✗ ${rel}: komponen Card dari components/ui/card.jsx dilarang di halaman publik (DESIGN.md §13)`);
  for (const b of baris) console.error(`    ${b.trim()}`);
  gagal += 1;
}

if (gagal > 0) {
  console.error(`\n${gagal} pelanggaran larangan Card di halaman publik.`);
  console.error("Ganti Card dengan section + border border-grey-200, atau pindahkan konten ke domain yang mengizinkan Card.");
  process.exit(1);
}

console.log("OK — tidak ada komponen Card di halaman publik.");
