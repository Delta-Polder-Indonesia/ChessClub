/** Uji cepat logika normalisasi & daftar hitam (tanpa jaringan). */
import {
  normalisasiHp,
  hpValid,
  formatHp,
  normalisasiNama,
  normalisasiKota,
  normalisasiTanggal,
  kategoriUmur,
  hitungUmur,
} from "../src/lib/identitas.js";
import {
  hashKunci,
  cariDiDaftarHitam,
  evaluasiStatusChess,
} from "../server/src/identitas-server.js";

let lulus = 0;
let gagal = 0;
const cek = (nama, aktual, harap) => {
  const ok = JSON.stringify(aktual) === JSON.stringify(harap);
  if (ok) lulus++;
  else {
    gagal++;
    console.log(`  GAGAL ${nama}\n    dapat: ${JSON.stringify(aktual)}\n    harap: ${JSON.stringify(harap)}`);
  }
};

console.log("\n== Normalisasi nomor HP (semua harus jadi 6281234567890) ==");
for (const v of [
  "081234567890",
  "0812-3456-7890",
  "0812 3456 7890",
  "+6281234567890",
  "+62 812-3456-7890",
  "6281234567890",
  "81234567890",
  "(0812) 3456-7890",
]) {
  const h = normalisasiHp(v);
  console.log(`  ${h === "6281234567890" ? "ok  " : "SALAH"} "${v}" -> ${h}`);
  cek(v, h, "6281234567890");
}

console.log("\n== Validasi nomor ==");
cek("valid 0812…", hpValid("081234567890"), true);
cek("tolak kependekan", hpValid("0812345"), false);
cek("tolak kosong", hpValid(""), false);
cek("tolak huruf", hpValid("abcdefghijk"), false);
console.log(`  format tampil: ${formatHp("081234567890")}`);

console.log("\n== Normalisasi nama & kota ==");
cek("nama rapat", normalisasiNama("  Budi   Santoso. "), "budi santoso");
cek("nama kapital", normalisasiNama("BUDI SANTOSO"), "budi santoso");
cek("kota prefiks", normalisasiKota("Kota Medan"), "medan");
cek("kota kabupaten", normalisasiKota("Kabupaten Deli Serdang"), "deli serdang");

console.log("\n== Umur & kategori ==");
const acuan = new Date("2026-08-14T00:00:00Z");
cek("umur", hitungUmur("2000-01-01", acuan), 26);
cek("junior", kategoriUmur("2012-01-01", acuan), "Junior");
cek("cilik", kategoriUmur("2016-01-01", acuan), "Pemula Cilik");
cek("senior", kategoriUmur("1970-01-01", acuan), "Senior");

console.log("\n== Validasi tanggal kalender (30 Feb dst. harus ditolak) ==");
cek("tanggal baku", normalisasiTanggal("2026-08-14"), "2026-08-14");
cek("tolak 2026-02-30", normalisasiTanggal("2026-02-30"), "");
cek("tolak 2026-04-31", normalisasiTanggal("2026-04-31"), "");
cek("tolak bulan 13", normalisasiTanggal("2026-13-01"), "");
cek("tolak format salah", normalisasiTanggal("14/08/2026"), "");
cek("tolak kosong", normalisasiTanggal(""), "");

console.log("\n== Status Chess.com ==");
cek("fair play -> blokir", evaluasiStatusChess("closed:fair_play_violations").diblokir, true);
cek("basic -> aman", evaluasiStatusChess("basic").diblokir, false);
cek("premium -> aman", evaluasiStatusChess("premium").diblokir, false);
cek("closed -> ditutup", evaluasiStatusChess("closed").ditutup, true);

console.log("\n== SKENARIO INTI: pemain di-ban lalu pakai akun kecil ==");
const curang = {
  namaLengkap: "Budi Santoso",
  hp: "0812-3456-7890",
  dana: "0812-3456-7890",
  tanggalLahir: "2000-01-01",
};
const hashCurang = hashKunci(curang);
console.log("  hash tersimpan:", JSON.stringify(hashCurang));

const daftarHitam = [
  {
    username: "budi_grandmaster",
    identitas: hashCurang,
    alasan: "fair_play_violations",
  },
];

// Akun kecil: username baru, nama ditulis beda, TAPI nomor HP sama.
const akunKecil = hashKunci({
  namaLengkap: "budi  santoso",
  hp: "+62 812 3456 7890",
  dana: "",
  tanggalLahir: "2000-01-01",
});
const tertangkap = cariDiDaftarHitam(akunKecil, daftarHitam);
console.log(
  `  akun kecil (HP sama, format beda) -> ${tertangkap ? "TERTANGKAP via " + tertangkap.jenis : "LOLOS"}`
);
cek("akun kecil harus tertangkap", Boolean(tertangkap), true);

// Ganti nomor HP tapi nama+tgl lahir sama -> masih tertangkap.
const gantiHp = hashKunci({
  namaLengkap: "Budi Santoso",
  hp: "0899-1111-2222",
  dana: "",
  tanggalLahir: "2000-01-01",
});
const t2 = cariDiDaftarHitam(gantiHp, daftarHitam);
console.log(
  `  ganti HP, nama+lahir sama       -> ${t2 ? "TERTANGKAP via " + t2.jenis : "LOLOS"}`
);
cek("ganti HP masih tertangkap", Boolean(t2), true);

// Pakai nomor lama sebagai DANA saja -> tetap tertangkap (silang kunci).
const lewatDana = hashKunci({
  namaLengkap: "Andi Wijaya",
  hp: "0899-3333-4444",
  dana: "081234567890",
  tanggalLahir: "1995-05-05",
});
const t3 = cariDiDaftarHitam(lewatDana, daftarHitam);
console.log(
  `  nomor lama dipakai di DANA      -> ${t3 ? "TERTANGKAP via " + t3.jenis : "LOLOS"}`
);
cek("silang DANA tertangkap", Boolean(t3), true);

// Orang yang benar-benar berbeda -> harus lolos.
const orangLain = hashKunci({
  namaLengkap: "Siti Aminah",
  hp: "0857-9999-8888",
  dana: "",
  tanggalLahir: "1999-09-09",
});
const t4 = cariDiDaftarHitam(orangLain, daftarHitam);
console.log(
  `  anggota baru yang sah           -> ${t4 ? "TERTANGKAP (SALAH!)" : "lolos (benar)"}`
);
cek("orang lain harus lolos", t4, null);

console.log("\n== Privasi: nomor asli tidak boleh terbaca di hash ==");
const str = JSON.stringify(hashCurang);
cek("tak ada nomor polos", str.includes("6281234567890"), false);
cek("tak ada nama polos", str.includes("budi"), false);
console.log(`  isi hash: ${str}`);

console.log(`\n===== ${lulus} lulus, ${gagal} gagal =====\n`);
process.exit(gagal ? 1 : 0);
