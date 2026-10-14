/**
 * Uji kontrak "satu pintu" untuk tanda bantu papan (src/lib/tandaBantu.js).
 *
 * Yang dikunci:
 *   1. Klik kanan pada petak kosong → mark ditambahkan;
 *   2. Klik kanan pada petak dengan warna SAMA → hanya mark itu yang dihapus;
 *   3. Klik kanan pada petak dengan warna BEDA → warna diganti (mark lain utuh);
 *   4. Seret kanan pada pasangan kotak yang sama → panah dihapus (toggle);
 *   5. Setiap halaman papan memakai useTandaBantu dan TIDAK punya salinan
 *      lokal tandaPetak / tandaPanah / setTanda({ panah: [] ... }).
 *
 * Jalankan: node scripts/uji-tanda-bantu.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { togglePanah, togglePetak, tandaKosong } from "../src/lib/tandaBantu.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi) {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}`);
  }
}

console.log("aturan klik kanan pada mark (isepic):");
{
  const awal = { panah: [], petak: { e4: "merah", d5: "biru" } };

  const tambah = togglePetak(awal, "f3", "hijau");
  uji("petak kosong → mark ditambahkan", tambah.petak.f3 === "hijau" && tambah.petak.e4 === "merah");

  const hapus = togglePetak(awal, "e4", "merah");
  uji("warna sama → hanya mark itu dihapus", !("e4" in hapus.petak) && hapus.petak.d5 === "biru");

  const ganti = togglePetak(awal, "e4", "biru");
  uji("warna beda → warna diganti, mark lain utuh", ganti.petak.e4 === "biru" && ganti.petak.d5 === "biru");

  const dgnPanah = { panah: [{ from: "a1", to: "h8", warna: "bawaan" }], petak: { e4: "merah" } };
  const hapusPetak = togglePetak(dgnPanah, "e4", "merah");
  uji("hapus mark tidak menyentuh panah", hapusPetak.panah.length === 1 && Object.keys(hapusPetak.petak).length === 0);

  const awalTdk = awal;
  togglePetak(awalTdk, "e4", "merah");
  uji("fungsi murni: keadaan lama tidak berubah", awalTdk.petak.e4 === "merah" && "d5" in awalTdk.petak);

  const kosong = tandaKosong();
  uji("tandaKosong = panah & petak kosong", kosong.panah.length === 0 && Object.keys(kosong.petak).length === 0);
}

console.log("aturan seret kanan (panah):");
{
  const awal = { panah: [{ from: "e2", to: "e4", warna: "bawaan" }], petak: {} };
  const tambah = togglePanah(awal, "g1", "f3", "bawaan");
  uji("pasangan baru → panah ditambahkan", tambah.panah.length === 2);
  const hapus = togglePanah(awal, "e2", "e4", "bawaan");
  uji("pasangan sama → panah itu dihapus", hapus.panah.length === 0);
}

console.log("satu pintu di halaman:");
{
  const berkas = [];
  function telusuri(dir) {
    for (const nama of readdirSync(dir)) {
      const p = path.join(dir, nama);
      if (statSync(p).isDirectory()) telusuri(p);
      else if (/\.(jsx|js)$/.test(nama)) berkas.push(p);
    }
  }
  telusuri(path.join(ROOT, "src", "halaman"));

  // Halaman papan = yang meneruskan onTandaPetak ke PapanTekaTeki.
  const halaman = berkas.filter((p) => readFileSync(p, "utf8").includes("onTandaPetak={"));
  uji(`ada halaman papan yang diperiksa (${halaman.length})`, halaman.length >= 5);

  for (const p of halaman) {
    const rel = path.relative(ROOT, p);
    const sumber = readFileSync(p, "utf8");
    uji(`${rel} memakai useTandaBantu`, /useTandaBantu\(\)/.test(sumber) && /from "[^"]*lib\/tandaBantu\.js"/.test(sumber));
    uji(`${rel} tanpa salinan lokal tandaPetak/tandaPanah`, !/function tandaPetak\(|function tandaPanah\(/.test(sumber));
    uji(`${rel} tanpa setTanda literal (pakai hapusSemuaTanda)`, !/setTanda\(\{ panah: \[\], petak: \{\} \}\)/.test(sumber));
  }
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
