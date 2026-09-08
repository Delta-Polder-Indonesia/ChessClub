/**
 * Uji modul e-book pada level modul (tanpa HTTP).
 *
 * Fokus pada perilaku waktu yang sulit diuji lewat HTTP:
 *   - kode kedaluwarsa ditolak (410) meski formatnya sah;
 *   - daftar kode menandai kadaluarsa;
 *   - pembersihan kode yang kedaluwarsa lebih dari 7 hari.
 *
 * Jalankan: node server/uji/uji-ebook.mjs
 * Data uji ditulis ke direktori sementara — data asli tidak disentuh.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.KCI_DIR_DATA = fs.mkdtempSync(path.join(os.tmpdir(), "kci-ebook-"));

const tanda = `uji-${Date.now()}-${Math.random()}`;
const { buatKodeEbook, tebusUnduhanEbook, daftarKodeEbook } = await import(
  `../src/ebook.js?${tanda}`
);

let lulus = 0;
let gagal = 0;

function cek(nama, syarat, rincian = "") {
  if (syarat) {
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal += 1;
    console.log(`  ✗ ${nama}${rincian ? `\n      ${rincian}` : ""}`);
  }
}

async function harapGagal(janji, status) {
  try {
    await janji;
    return false;
  } catch (e) {
    return e.status === status;
  }
}

const berkasKode = path.join(process.env.KCI_DIR_DATA, "kode-ebook.json");
const TEBUS = {
  nama: "Budi Santoso",
  akunChess: "budichess99",
  bukuId: "sicilian-defense",
  judul: "Sicilian Defense",
};

console.log("\n🧪 UJI MODUL E-BOOK\n");

const kode = await buatKodeEbook({ panggilan: "Budi" });
cek("kode terbit dengan panggilan benar", kode.panggilan === "Budi");
cek("kode berformat EBK-XXXXXXXX", /^EBK-[A-Z2-9]{8}$/.test(kode.kode));

const tebusSah = await tebusUnduhanEbook({ kode: kode.kode, ...TEBUS });
cek("kode baru bisa ditebus", tebusSah.panggilan === "Budi");

// Majukan jam: tulis ulang kedaluwarsa ke masa lalu (simulasi 1 jam berlalu).
const satuJamLalu = new Date(Date.now() - 3601_000).toISOString();
fs.writeFileSync(
  berkasKode,
  JSON.stringify([{ ...kode, kedaluwarsa: satuJamLalu }])
);
cek(
  "kode kedaluwarsa ditolak 410",
  await harapGagal(tebusUnduhanEbook({ kode: kode.kode, ...TEBUS }), 410)
);

const daftar = await daftarKodeEbook();
cek("daftar menandai kode kedaluwarsa", daftar[0]?.kadaluarsa === true);

// Kode yang kedaluwarsanya lebih tua dari 7 hari dibuang saat daftar diubah.
const delapanHariLalu = new Date(Date.now() - 8 * 24 * 3600_000).toISOString();
fs.writeFileSync(
  berkasKode,
  JSON.stringify([{ ...kode, kedaluwarsa: delapanHariLalu }])
);
await buatKodeEbook({ panggilan: "Citra" });
const sesudahBasmi = await daftarKodeEbook();
cek(
  "kode lewat 7 hari terbasmi otomatis",
  sesudahBasmi.length === 1 && sesudahBasmi[0].panggilan === "Citra",
  JSON.stringify(sesudahBasmi.map((k) => k.panggilan))
);

// Validasi masukan.
cek(
  "panggilan kosong ditolak 400",
  await harapGagal(buatKodeEbook({ panggilan: "  " }), 400)
);
cek(
  "format kode asal ditolak 400",
  await harapGagal(tebusUnduhanEbook({ kode: "ABC-123", ...TEBUS }), 400)
);

console.log(`\n${lulus} lulus, ${gagal} gagal\n`);
process.exit(gagal ? 1 : 0);
