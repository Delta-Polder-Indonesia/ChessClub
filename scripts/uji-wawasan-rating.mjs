// Uji unit wawasan rating (wawasanRating.js). Jalankan: npm run uji:wawasan-rating
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { MIN_LANGKAH_FASE, wawasanPemain } from "../src/halaman/Analisa/mesin/wawasanRating.js";

/*
 * Data langkah dibentuk seperti hasil parsePGN di Analisa:
 * - `color` = pihak yang bergiliran SESUDAH langkah (pemain yang bergerak
 *   adalah kebalikannya, lihat pemainDariEntri),
 * - `previousStaticEvals[i]` = ["cp", nilai] dari sudut pandang pihak yang
 *   akan bergerak; indeks 0 = sesudah langkah, 1 = sebelum langkah.
 */
const PGN = `1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5`;
const INDEKS_BLUNDER = 18; // 10. Nxd5 oleh Putih, jatuh tajam.

function bangunLangkah(tanpaEval = false) {
  const papan = new Chess();
  papan.loadPgn(PGN);
  const riwayat = papan.history({ verbose: true });
  const tes = new Chess();
  return riwayat.map((h) => {
    tes.move(h.san);
    return {
      san: h.san,
      uci: h.from + h.to,
      color: tes.turn(),
      fen: tes.fen(),
      previousStaticEvals: tanpaEval ? undefined : [["cp", 0], ["cp", 0], ["cp", 0]],
    };
  });
}

function dengan(daftar, indeks, evals) {
  daftar[indeks].previousStaticEvals = evals;
  return daftar;
}

let lulus = 0;
function periksa(nama, fungsi) {
  fungsi();
  lulus += 1;
  console.log(`  ok - ${nama}`);
}

console.log("Wawasan rating");

const langkah = dengan(bangunLangkah(), INDEKS_BLUNDER, [["cp", 400], ["cp", 0], ["cp", 0]]);

periksa("langkah pertama (indeks 0) tidak dihitung, sesuai pemainDariEntri", () => {
  // 12 langkah Putih, dikurangi langkah pembuka: 11.
  assert.equal(wawasanPemain(langkah, "w").jumlahLangkah, 11);
});

periksa("langkah Hitam dihitung penuh: 12 langkah", () => {
  assert.equal(wawasanPemain(langkah, "b").jumlahLangkah, 12);
});

periksa("blunder Putih terhitung di fase menengah dan jadi kelemahan", () => {
  const w = wawasanPemain(langkah, "w");
  assert.equal(w.perFase.middlegame.blunder, 1);
  assert.equal(w.total.blunder, 1);
  assert.equal(w.kelemahan, "middlegame");
});

periksa("jumlah per fase sama dengan total", () => {
  const w = wawasanPemain(langkah, "w");
  const jumlah = Object.values(w.perFase).reduce((a, f) => a + f.jumlah, 0);
  assert.equal(jumlah, w.total.jumlah);
});

periksa("Hitam tanpa blunder: tidak ada kelemahan", () => {
  const b = wawasanPemain(langkah, "b");
  assert.equal(b.total.blunder, 0);
  assert.equal(b.kelemahan, null);
});

periksa("akurasi dihitung dari eval; langkah netral 100", () => {
  const b = wawasanPemain(langkah, "b");
  assert.ok(b.total.akurasi > 99);
});

periksa("tanpa data eval: langkah tetap dihitung, akurasi null", () => {
  const polos = bangunLangkah(true);
  const w = wawasanPemain(polos, "w");
  assert.equal(w.total.jumlah, 11);
  assert.equal(w.total.akurasi, null);
  assert.equal(w.total.blunder, 0);
});

periksa("daftar kosong: nol langkah, tanpa kelemahan atau kekuatan", () => {
  const kosong = wawasanPemain([], "w");
  assert.equal(kosong.jumlahLangkah, 0);
  assert.equal(kosong.kelemahan, null);
  assert.equal(kosong.kekuatan, null);
});

periksa("fase di bawah MIN_LANGKAH_FASE tidak dinilai", () => {
  assert.ok(MIN_LANGKAH_FASE >= 1);
  const sedikit = bangunLangkah().slice(0, 4);
  const hasil = wawasanPemain(sedikit, "b");
  assert.equal(hasil.kelemahan, null);
  assert.equal(hasil.kekuatan, null);
});

periksa("hasil deterministik: pemanggilan berulang sama", () => {
  assert.deepEqual(wawasanPemain(langkah, "w"), wawasanPemain(langkah, "w"));
});

console.log(`\n${lulus} pemeriksaan lulus, 0 gagal.`);
