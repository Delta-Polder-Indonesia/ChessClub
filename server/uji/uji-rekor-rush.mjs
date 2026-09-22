/**
 * Uji unit logika papan peringkat Rush Teka-teki (tanpa jaringan/DB).
 */

let lolos = 0;
let gagal = 0;
const ok = (pesan) => { lolos++; console.log(`  ✅ ${pesan}`); };
const fail = (pesan) => { gagal++; console.error(`  ❌ ${pesan}`); };
const sama = (a, b, pesan) => {
  if (JSON.stringify(a) === JSON.stringify(b)) ok(pesan);
  else fail(`${pesan} — dapat ${JSON.stringify(a)}, harap ${JSON.stringify(b)}`);
};

const { perbaruiRekor, susunPeringkat } = await import("../src/rekor-rush.js");

console.log("\n== 1. Masukkan skor baru ==");
{
  const { daftar, hasil } = perbaruiRekor([], {
    username: "Alice_12",
    skor: 8,
    durasiMenit: 3,
  });
  sama(hasil.baru, true, "skor pertama tercatat");
  sama(daftar.length, 1, "satu entri");
  sama(daftar[0].username, "alice_12", "username dinormalisasi");
  sama(daftar[0].skor, 8, "skor tersimpan");
}

console.log("\n== 2. Skor lebih rendah diabaikan (pertahankan rekor terbaik) ==");
{
  const d0 = perbaruiRekor([], { username: "bob", skor: 6, durasiMenit: 5 }).daftar;
  const { daftar, hasil } = perbaruiRekor(d0, {
    username: "Bob",
    skor: 3,
    durasiMenit: 5,
  });
  sama(hasil.baru, false, "tidak dianggap baru");
  sama(daftar.length, 1, "tidak menggandakan entri");
  sama(daftar[0].skor, 6, "skor terbaik dipertahankan");
}

console.log("\n== 3. Skor lebih tinggi menggantikan ==");
{
  const d0 = perbaruiRekor([], { username: "bob", skor: 4, durasiMenit: 5 }).daftar;
  const { daftar, hasil } = perbaruiRekor(d0, {
    username: "bob",
    skor: 11,
    durasiMenit: 5,
  });
  sama(hasil.baru, false, "bukan entri baru");
  sama(daftar[0].skor, 11, "skor diperbarui ke nilai tertinggi");
}

console.log("\n== 4. Durasi dipisah, bukan dicampur ==");
{
  let daftar = [];
  daftar = perbaruiRekor(daftar, { username: "carol", skor: 9, durasiMenit: 3 }).daftar;
  daftar = perbaruiRekor(daftar, { username: "carol", skor: 5, durasiMenit: 5 }).daftar;
  daftar = perbaruiRekor(daftar, { username: "dave", skor: 7, durasiMenit: 3 }).daftar;
  const p3 = susunPeringkat(daftar, 3);
  const p5 = susunPeringkat(daftar, 5);
  sama(p3.length, 2, "dua peserta di 3 menit");
  sama(p3[0].username, "carol", "urutan 3 menit benar");
  sama(p3[0].peringkat, 1, "peringkat 1 = 3 menit");
  sama(p5.length, 1, "satu peserta di 5 menit");
  sama(p5[0].username, "carol", "carol juga di 5 menit");
}

console.log("\n== 5. Batas tampil dihormati ==");
{
  let daftar = [];
  for (let i = 1; i <= 30; i++) {
    daftar = perbaruiRekor(daftar, {
      username: `pemain${i}`,
      skor: i,
      durasiMenit: 3,
    }).daftar;
  }
  const p = susunPeringkat(daftar, 3, 5);
  sama(p.length, 5, "hanya 5 teratas");
  sama(p[0].skor, 30, "skor terbesar di puncak");
  sama(p[0].username, "pemain30", "pemain dengan skor terbesar di puncak");
}

console.log("\n== 6. Input tidak sah ditolak ==");
{
  let menolak = 0;
  const coba = (fn) => { try { fn(); } catch { menolak++; } };
  coba(() => perbaruiRekor([], { username: "x", skor: 5, durasiMenit: 7 }));
  coba(() => perbaruiRekor([], { username: "", skor: 5, durasiMenit: 3 }));
  coba(() => perbaruiRekor([], { username: "aa", skor: -1, durasiMenit: 3 }));
  coba(() => perbaruiRekor([], { username: "cc", skor: 9999, durasiMenit: 3 }));
  coba(() => perbaruiRekor([], { username: "dd", skor: 200, durasiMenit: 5 }));
  sama(menolak, 5, "lima input ditolak");
}

console.log("\n== 7. Skor di batas wajar tetap diterima ==");
{
  const a = perbaruiRekor([], { username: "ee", skor: 90, durasiMenit: 3 });
  const b = perbaruiRekor([], { username: "ff", skor: 120, durasiMenit: 5 });
  sama(a.hasil.baru, true, "3 menit: tepat batas 90 diterima");
  sama(b.hasil.baru, true, "5 menit: tepat batas 120 diterima");
}

console.log(`\nRekor Rush: ${lolos} lolos, ${gagal} gagal.`);
if (gagal) process.exit(1);
