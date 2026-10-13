// Uji unit logika Turing test (turingLogika.js). Jalankan: npm run uji:turing
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import {
  JUMLAH_SOAL,
  PLY_MINIMAL,
  catatSkor,
  ekstrakPosisi,
  nilaiTebakan,
  persenBenar,
  pilihAcak,
  pisahPartai,
  sanDariUci,
  skorAwal,
  susunSoal,
} from "../src/halaman/TuringTest/turingLogika.js";

// mulberry32: PRNG deterministik untuk uji (bukan LCG naif yang macet).
function mulberry32(benih) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PGN_A = `[Event "Uji A"]
[White "P1"]
[Black "P2"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 *
`;

const PGN_B = `[Event "Uji B"]
[White "P3"]
[Black "P4"]
[Result "*"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 *
`;

let lulus = 0;
function periksa(nama, fungsi) {
  fungsi();
  lulus += 1;
  console.log(`  ok - ${nama}`);
}

console.log("Turing test: logika");

periksa("pisahPartai memisahkan dua partai dan membuang kosong", () => {
  const daftar = pisahPartai(`${PGN_A}\n\n${PGN_B}\n\n   `);
  assert.equal(daftar.length, 2);
  assert.match(daftar[0], /Uji A/);
  assert.match(daftar[1], /Uji B/);
  assert.deepEqual(pisahPartai(""), []);
});

const posisi = ekstrakPosisi(`${PGN_A}\n${PGN_B}`);

periksa("ekstrakPosisi hanya mengambil ply >= PLY_MINIMAL", () => {
  assert.ok(posisi.length > 0);
  for (const p of posisi) assert.ok(p.ply >= PLY_MINIMAL, `ply ${p.ply}`);
});

periksa("setiap posisi punya FEN legal dan langkah manusia legal", () => {
  for (const p of posisi) {
    const papan = new Chess(p.fen);
    const langkah = papan.move({
      from: p.uci.slice(0, 2),
      to: p.uci.slice(2, 4),
      promotion: p.uci[4],
    });
    assert.ok(langkah, `langkah ${p.uci} tidak legal di ${p.fen}`);
    assert.equal(langkah.san, p.san);
  }
});

periksa("langkah ply 8 partai A adalah Nf6 (g8f6)", () => {
  const a = posisi.find((p) => p.ply === 8 && p.san === "Nf6");
  assert.ok(a, "posisi ply 8 ada");
  assert.equal(a.uci, "g8f6");
});

periksa("sanDariUci mengonversi UCI legal dan menolak yang tidak legal", () => {
  const awal = new Chess().fen();
  assert.equal(sanDariUci(awal, "e2e4"), "e4");
  assert.equal(sanDariUci(awal, "e2e5"), null);
  assert.equal(sanDariUci(awal, ""), null);
});

periksa("susunSoal menolak langkah mesin yang sama dengan manusia", () => {
  assert.equal(susunSoal(posisi[0], posisi[0].uci, mulberry32(1)), null);
});

periksa("susunSoal menolak langkah mesin yang tidak legal dan null", () => {
  assert.equal(susunSoal(posisi[0], "a1a8", mulberry32(1)), null);
  assert.equal(susunSoal(posisi[0], null, mulberry32(1)), null);
});

periksa("susunSoal memuat tepat satu langkah manusia dan satu mesin", () => {
  const p = posisi[0];
  const papan = new Chess(p.fen);
  const alternatif = papan.moves({ verbose: true }).find((m) => m.from + m.to !== p.uci);
  const uciMesin = alternatif.from + alternatif.to + (alternatif.promotion || "");
  const soal = susunSoal(p, uciMesin, mulberry32(7));
  assert.equal(soal.pilihan.length, 2);
  assert.equal(soal.pilihan.filter((x) => x.manusia).length, 1);
  assert.equal(soal.pilihan.find((x) => x.manusia).uci, p.uci);
  assert.equal(soal.pilihan.find((x) => !x.manusia).uci, uciMesin);
});

periksa("urutan pilihan diacak: kedua urutan muncul dari PRNG berbeda", () => {
  const p = posisi[0];
  const papan = new Chess(p.fen);
  const alt = papan.moves({ verbose: true }).find((m) => m.from + m.to !== p.uci);
  const uciMesin = alt.from + alt.to;
  const indeksManusia = new Set();
  for (let i = 0; i < 40; i += 1) {
    const soal = susunSoal(p, uciMesin, mulberry32(i + 1));
    indeksManusia.add(soal.pilihan.findIndex((x) => x.manusia));
  }
  assert.equal(indeksManusia.size, 2);
});

periksa("nilaiTebakan benar hanya untuk indeks langkah manusia", () => {
  const soal = { pilihan: [{ manusia: false }, { manusia: true }] };
  assert.equal(nilaiTebakan(soal, 1), true);
  assert.equal(nilaiTebakan(soal, 0), false);
  assert.equal(nilaiTebakan(soal, 5), false);
});

periksa("catatSkor dan persenBenar", () => {
  let skor = skorAwal();
  assert.equal(persenBenar(skor), 0);
  skor = catatSkor(skor, true);
  skor = catatSkor(skor, false);
  skor = catatSkor(skor, true);
  assert.deepEqual(skor, { jawab: 3, benar: 2 });
  assert.equal(persenBenar(skor), 67);
});

periksa("pilihAcak tanpa pengulangan dan batas jumlah", () => {
  const daftar = Array.from({ length: 30 }, (_, i) => i);
  const pilihan = pilihAcak(daftar, JUMLAH_SOAL, mulberry32(3));
  assert.equal(pilihan.length, JUMLAH_SOAL);
  assert.equal(new Set(pilihan).size, JUMLAH_SOAL);
  assert.equal(pilihAcak([1, 2], JUMLAH_SOAL, mulberry32(3)).length, 2);
});

console.log(`\n${lulus} pemeriksaan lulus, 0 gagal.`);
