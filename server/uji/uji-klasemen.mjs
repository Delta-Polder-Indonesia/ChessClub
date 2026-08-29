/**
 * Uji unit untuk logika klasemen turnamen dan normalisasi identitas.
 */

let gagal = 0;
let lolos = 0;

function ok(pesan) { lolos++; console.log(`  ✅ ${pesan}`); }
function fail(pesan) { gagal++; console.error(`  ❌ ${pesan}`); }
function sama(a, b, pesan) {
  if (JSON.stringify(a) === JSON.stringify(b)) ok(pesan);
  else fail(`${pesan} — dapat: ${JSON.stringify(a)}, harap: ${JSON.stringify(b)}`);
}

// ── Import modul ──
const { hitungKlasemen } = await import("../src/turnamen.js");
const {
  normalisasiUsername,
  normalisasiHp,
  hpValid,
  hitungUmur,
  kategoriUmur,
  normalisasiNama,
  normalisasiKota,
  normalisasiTanggal,
  kunciIdentitas,
} = await import("../../src/lib/identitas.js");

// ============================================================
// 1. hitungKlasemen
// ============================================================
console.log("\n1. Hitung Klasemen Turnamen Swiss:");

{
  const turnamen = {
    jenis: "bulanan",
    peserta: [
      { username: "alice", panggilan: "Alice" },
      { username: "bob", panggilan: "Bob" },
      { username: "charlie", panggilan: "Charlie" },
    ],
    hasil: [
      { ronde: 1, putih: "alice", hitam: "bob", skor: "1-0" },
      { ronde: 1, putih: "charlie", hitam: "alice", skor: "0-1" },
      { ronde: 2, putih: "bob", hitam: "charlie", skor: "0.5-0.5" },
    ],
  };

  const k = hitungKlasemen(turnamen);
  sama(k.length, 3, "3 peserta di klasemen");
  sama(k[0].username, "alice", "Alice peringkat 1 (2 poin)");
  sama(k[0].poin, 2, "Alice: 2 poin");
  sama(k[0].menang, 2, "Alice: 2 menang");
  sama(k[1].poin, 0.5, "Bob: 0.5 poin");
  sama(k[2].poin, 0.5, "Charlie: 0.5 poin");
  sama(k[0].peringkat, 1, "Alice peringkat 1");
  sama(k[1].peringkat, 2, "Bob peringkat 2");
}

console.log("\n2. Klasemen dengan peserta dianulir:");
{
  const turnamen = {
    jenis: "bulanan",
    peserta: [
      { username: "alice", panggilan: "Alice" },
      { username: "cheater", panggilan: "Cheater", dianulir: true },
    ],
    hasil: [
      { ronde: 1, putih: "alice", hitam: "cheater", skor: "0-1" },
    ],
  };

  const k = hitungKlasemen(turnamen);
  sama(k.length, 1, "Hanya 1 peserta aktif (cheater dianulir)");
  sama(k[0].username, "alice", "Alice satu-satunya di klasemen");
}

console.log("\n3. Klasemen kosong:");
{
  const k = hitungKlasemen({ jenis: "bulanan", peserta: [], hasil: [] });
  sama(k.length, 0, "Klasemen kosong bila tidak ada peserta");
}

// ============================================================
// 4. normalisasiUsername
// ============================================================
console.log("\n4. Normalisasi Username:");
sama(normalisasiUsername("Alice"), "alice", "Huruf besar → kecil");
sama(normalisasiUsername("  bob  "), "bob", "Trim spasi");
sama(normalisasiUsername("https://www.chess.com/member/charlie"), "charlie", "URL → username");
sama(normalisasiUsername("@dave"), "dave", "@ hilang");
sama(normalisasiUsername(""), "", "Kosong tetap kosong");

// ============================================================
// 5. normalisasiHp
// ============================================================
console.log("\n5. Normalisasi HP:");
sama(normalisasiHp("081234567890"), "6281234567890", "08 → 628");
sama(normalisasiHp("+62 812-3456-7890"), "6281234567890", "+62 format");
sama(normalisasiHp("81234567890"), "6281234567890", "8xx tanpa awalan");
sama(hpValid("081234567890"), true, "Valid: 081234567890");
sama(hpValid("123"), false, "Tidak valid: 123");
sama(hpValid(""), false, "Tidak valid: kosong");

// ============================================================
// 6. normalisasiTanggal
// ============================================================
console.log("\n6. Normalisasi Tanggal:");
sama(normalisasiTanggal("2000-05-15"), "2000-05-15", "Tanggal valid");
sama(normalisasiTanggal("2000-02-30"), "", "30 Feb ditolak");
sama(normalisasiTanggal("2000-13-01"), "", "Bulan 13 ditolak");
sama(normalisasiTanggal("abc"), "", "String random ditolak");
sama(normalisasiTanggal(""), "", "Kosong ditolak");

// ============================================================
// 7. hitungUmur & kategoriUmur
// ============================================================
console.log("\n7. Umur & Kategori:");
{
  const acuan = new Date("2026-08-29");
  const umur10 = hitungUmur("2016-01-01", acuan);
  sama(umur10, 10, "Umur 10 tahun");
  sama(kategoriUmur("2016-01-01", acuan), "Pemula Cilik", "Umur 10 → Pemula Cilik");
  sama(kategoriUmur("2010-01-01", acuan), "Junior", "Umur 16 → Junior");
  sama(kategoriUmur("1990-01-01", acuan), "Umum", "Umur 36 → Umum");
  sama(kategoriUmur("1970-01-01", acuan), "Senior", "Umur 56 → Senior");
  sama(kategoriUmur("invalid", acuan), null, "Tanggal invalid → null");
}

// ============================================================
// 8. normalisasiNama & normalisasiKota
// ============================================================
console.log("\n8. Normalisasi Nama & Kota:");
sama(normalisasiNama("Budi   Santoso."), "budi santoso", "Spasi + tanda baca");
sama(normalisasiNama("Élise"), "elise", "Aksen dihapus");
sama(normalisasiKota("Kota Medan"), "medan", "Prefix 'Kota' dihapus");
sama(normalisasiKota("Kabupaten Deli Serdang"), "deli serdang", "Prefix 'Kabupaten' dihapus");

// ============================================================
// 9. kunciIdentitas
// ============================================================
console.log("\n9. Kunci Identitas:");
{
  const k = kunciIdentitas({ hp: "081234567890", namaLengkap: "Budi Santoso", tanggalLahir: "1990-01-01" });
  sama(typeof k.hp, "string", "Ada kunci hp");
  sama(typeof k.namaLahir, "string", "Ada kunci namaLahir");
  sama(k.dana, undefined, "Tidak ada dana bila tidak diisi");
}

// ============================================================
// Selesai
// ============================================================
console.log(`\n${"─".repeat(50)}`);
console.log(`Hasil: ${lolos} lolos, ${gagal} gagal`);
if (gagal > 0) {
  console.log("\n❌ ADA TEST YANG GAGAL!\n");
  process.exitCode = 1;
} else {
  console.log("\n✅ SEMUA TEST LOLOS!\n");
}
