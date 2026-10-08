/**
 * Uji integritas koleksi E-Book & Panduan.
 *
 * Memeriksa:
 *   1. Setiap entri `file:` di ebook-data.js menunjuk ke berkas yang ADA
 *      di public/ebooks/ (nama di-decode dari URL-encoding).
 *   2. Setiap berkas PDF adalah PDF asli (diawali %PDF) ATAU pointer Git LFS
 *      yang formatnya sah (baris version + oid sha256 64-hex + size > 0).
 *      Pointer LFS sah bila repo dikloning tanpa git-lfs — isi aslinya
 *      tersedia di checkout atau object storage sebelum build Vercel.
 *   3. Tidak ada berkas PDF yatim (di public/ebooks tapi tidak dirujuk).
 *   4. Sampul (COVER) benar-benar ada sebagai varian .webp — `gambar()` di
 *      src/lib/asets.js mengubah .jpg/.png menjadi .webp, jadi berkas yang
 *      hanya ada sebagai .jpg akan menghasilkan gambar rusak di katalog.
 *   5. Id di COVER selalu punya entri padanannya (tidak ada sampul liar).
 *
 * Jalan offline; tidak perlu akses jaringan. Sertakan dalam `npm run uji`.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BERKAS_DATA = resolve(AKAR, "src/halaman/Beranda/ebook-data.js");
const DIR_EBOOK = resolve(AKAR, "public/ebooks");

const masalah = [];
const info = [];

/** Uraikan nama file dari `file: "/ebooks/..."` (bisa URL-encoded). */
function namaDariEntri(file) {
  const bersih = String(file).trim().replace(/^\/ebooks\//, "");
  try {
    return decodeURIComponent(bersih);
  } catch {
    return bersih;
  }
}

/** Sahkah pointer Git LFS? Kembalikan deskripsi, atau null bila bukan pointer. */
function deskripsiPointer(isi) {
  const baris = isi.split(/\r?\n/);
  if (!baris[0]?.startsWith("version https://git-lfs.github.com/spec/v1")) {
    return null;
  }
  const oid = baris.find((b) => b.startsWith("oid sha256:"));
  const size = baris.find((b) => b.startsWith("size "));
  const oidHex = oid?.slice("oid sha256:".length) || "";
  const ukuran = Number(size?.slice("size ".length) || 0);
  if (!/^[a-f0-9]{64}$/.test(oidHex)) {
    return { pointer: true, sah: false, alasan: "oid sha256 tidak valid" };
  }
  if (!Number.isFinite(ukuran) || ukuran <= 0) {
    return { pointer: true, sah: false, alasan: "size tidak valid" };
  }
  return { pointer: true, sah: true, oid: oidHex, ukuran };
}

// 1) Kumpulkan semua referensi `file:` dari ebook-data.js
const data = readFileSync(BERKAS_DATA, "utf8");
const entri = [...data.matchAll(/file:\s*"([^"]+)"/g)].map((m) => m[1]);

if (!entri.length) {
  masalah.push("Tidak ada entri `file:` yang ditemukan di ebook-data.js.");
} else {
  info.push(`${entri.length} entri e-book di ebook-data.js.`);
}

// 2) Periksa setiap referensi
for (const ref of entri) {
  const nama = namaDariEntri(ref);
  const jalur = resolve(DIR_EBOOK, nama);
  if (basename(jalur) !== nama || !existsSync(jalur)) {
    masalah.push(`E-book dirujuk tapi berkas tidak ada: /ebooks/${nama}`);
    continue;
  }
  const isi = readFileSync(jalur, "utf8");
  if (isi.startsWith("%PDF")) {
    info.push(`  ✓ ${nama} — PDF asli (${isi.length} byte)`);
    continue;
  }
  const pointer = deskripsiPointer(isi);
  if (!pointer) {
    masalah.push(
      `E-book bukan PDF asli dan bukan pointer LFS yang dikenal: ${nama}`
    );
    continue;
  }
  if (!pointer.sah) {
    masalah.push(`Pointer LFS rusak (${pointer.alasan}): ${nama}`);
    continue;
  }
  info.push(
    `  ~ ${nama} — pointer LFS sah (objek ${(pointer.ukuran / 1048576).toFixed(1)} MB, oid ${pointer.oid.slice(0, 12)}…)`
  );
}

// 3) PDF yatim di folder (ada di disk tapi tidak dirujuk)
const berkasDiDisk = readdirSync(DIR_EBOOK)
  .filter((f) => f.toLowerCase().endsWith(".pdf"))
  .sort();
const dirujuk = new Set(entri.map(namaDariEntri));
for (const f of berkasDiDisk) {
  if (!dirujuk.has(f)) {
    masalah.push(`PDF yatim (tidak dirujuk ebook-data.js): ${f}`);
  }
}

// 4) Sampul: setiap COVER punya berkas .webp, dan id-nya selalu ada di entri
const blokSampul = data.match(/export const COVER\s*=\s*\{([\s\S]*?)\n\};/);
if (!blokSampul) {
  masalah.push("Blok COVER tidak ditemukan di ebook-data.js.");
} else {
  const pasangan = [...blokSampul[1].matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)];
  const dirPublik = resolve(AKAR, "public");
  const idEntri = new Set([...data.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]));
  for (const [, id, jalur] of pasangan) {
    if (!idEntri.has(id)) masalah.push(`COVER punya id tanpa entri buku: ${id}`);
    const relatif = namaDariEntri(jalur.replace(/^\//, ""));
    const webp = resolve(dirPublik, relatif.replace(/\.(jpe?g|png)$/i, ".webp"));
    if (!existsSync(webp)) {
      masalah.push(`Sampul tidak ada sebagai .webp (akan 404): ${jalur}`);
    }
  }
  info.push(`  ✓ ${pasangan.length} sampul diperiksa (.webp tersedia).`);
}

// ── Laporan ──────────────────────────────────────────────────────────────
console.log("\n== Uji integritas E-Book & Panduan ==");
for (const baris of info) console.log(baris);
if (masalah.length) {
  console.error(`\n✗ ${masalah.length} masalah ditemukan:`);
  for (const m of masalah) console.error(`  - ${m}`);
  process.exit(1);
}
console.log(
  `\nOK — ${entri.length} entri e-book, ${berkasDiDisk.length} berkas PDF, semuanya konsisten.`
);
