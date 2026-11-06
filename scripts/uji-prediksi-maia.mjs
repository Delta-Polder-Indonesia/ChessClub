/**
 * Uji penyedia prediksi Maia untuk metrik deviasi manusia
 * (`src/halaman/Analisa/mesin/prediksiMaia.js`).
 *
 * Yang dikunci di sini adalah KONTRAK KUNCI, bukan angka model:
 *
 *  1. `hitungDeviasiManusia` menilai langkah `moves[i]` memakai
 *     `prediksi.get(moves[i - 1].fen)` — FEN **sebelum** langkah itu. Kalau
 *     penyedia memakai `moves[i].fen`, seluruh penilaian bergeser satu langkah
 *     dan hasilnya salah TANPA galat apa pun. Uji ini membandingkan kedua
 *     kemungkinan secara eksplisit.
 *  2. Hanya posisi yang benar-benar dipakai yang diminta (langkah tanpa
 *     `uci`/`san`, atau FEN kosong, dilewati).
 *  3. Satu posisi cukup satu kali inferensi (pengulangan langkah tidak
 *     menggandakan biaya model).
 *  4. Batch memotong daftar sesuai `ukuranBatch` dan urutannya dipertahankan.
 *  5. Urat nadi: `deviasiManusiaDariMaia` menghasilkan metrik yang sama dengan
 *     `hitungDeviasiManusia` bila diberi distribusi yang sama (nilai dihitung
 *     tangan di uji ini).
 *
 * Mesin tiruan dipakai supaya uji ini jalan tanpa ONNX 45 MB dan tanpa worker.
 *
 * Jalankan: node scripts/uji-prediksi-maia.mjs
 */
import assert from "node:assert/strict";

const {
  UKURAN_BATCH_MAIA,
  posisiUntukPrediksi,
  prediksiManusia,
  deviasiManusiaDariMaia,
} = await import("../src/halaman/Analisa/mesin/prediksiMaia.js");
const { hitungDeviasiManusia } = await import("../src/halaman/Analisa/mesin/deviasiManusia.js");

let lulus = 0;
let gagal = 0;

async function uji(nama, jalan) {
  try {
    await jalan();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal++;
    console.error(`  ✗ ${nama}\n    ${galat?.message ?? galat}`);
    process.exitCode = 1;
  }
}

/** Mesin Maia tiruan: mencatat setiap panggilan, mengembalikan kebijakan per FEN. */
function mesinPalsu(petaKebijakan = {}) {
  const panggilan = [];
  return {
    panggilan,
    inferensi: async (daftarFen, opsi) => {
      panggilan.push({ daftar: [...daftarFen], opsi });
      return daftarFen.map((fen) => ({
        kebijakan: petaKebijakan[fen] ?? {},
        menang: 0.5,
        cp: 0,
      }));
    },
  };
}

const fen = (n) => `8/8/8/8/8/8/8/8 w - - 0 ${n}`;

/** Empat langkah: posisi yang dinilai adalah fen(0)..fen(2). */
const partai = [
  { fen: fen(0), uci: "e2e4", san: "e4" },
  { fen: fen(1), uci: "d7d5", san: "d5" },
  { fen: fen(2), uci: "e4d5", san: "exd5" },
  { fen: fen(3), uci: "d8d5", san: "Qxd5" },
];

console.log("== kontrak kunci: FEN SEBELUM langkah ==");

await uji("posisi yang diminta = fen sesudah langkah sebelumnya", () => {
  assert.deepEqual(posisiUntukPrediksi(partai), [fen(0), fen(1), fen(2)]);
});

await uji("BUKAN fen sesudah langkah yang dinilai (fakta pembeda)", () => {
  const daftar = posisiUntukPrediksi(partai);
  assert.ok(!daftar.includes(fen(3)), "fen(3) tidak boleh diminta");
  assert.deepEqual(daftar, [fen(0), fen(1), fen(2)], "geser satu langkah = salah senyap");
});

await uji("peta hasil memakai kunci yang sama", async () => {
  const mesin = mesinPalsu();
  const peta = await prediksiManusia(partai, { mesin });
  assert.deepEqual([...peta.keys()], [fen(0), fen(1), fen(2)]);
  assert.ok(!peta.has(fen(3)));
});

console.log("== penyaringan posisi ==");

await uji("langkah tanpa uci dilewati (posisinya tidak diminta)", () => {
  const rusak = [partai[0], { ...partai[1], uci: undefined }, partai[2]];
  assert.deepEqual(posisiUntukPrediksi(rusak), [fen(1)]);
});

await uji("langkah tanpa san dilewati", () => {
  const rusak = [partai[0], { ...partai[1], san: "" }, partai[2]];
  assert.deepEqual(posisiUntukPrediksi(rusak), [fen(1)]);
});

await uji("FEN kosong / bukan string dilewati", () => {
  const rusak = [{ ...partai[0], fen: "" }, partai[1], partai[2]];
  assert.deepEqual(posisiUntukPrediksi(rusak), [fen(1)]);
});

await uji("satu posisi berulang hanya diminta sekali", async () => {
  const berulang = [
    { fen: fen(0), uci: "e2e4", san: "e4" },
    { fen: fen(1), uci: "d7d5", san: "d5" },
    { fen: fen(0), uci: "a2a3", san: "a3" },
    { fen: fen(1), uci: "a7a6", san: "a6" },
  ];
  // Empat langkah → tiga posisi ditanya, tetapi hanya dua yang unik.
  assert.deepEqual(posisiUntukPrediksi(berulang), [fen(0), fen(1)]);
  const mesin = mesinPalsu();
  const peta = await prediksiManusia(berulang, { mesin });
  assert.equal(mesin.panggilan.length, 1, "satu panggilan saja");
  assert.equal(peta.size, 2);
});

console.log("== batch & penerusan opsi ==");

await uji("tanpa potongan: satu panggilan untuk semua posisi", async () => {
  const mesin = mesinPalsu();
  await prediksiManusia(partai, { mesin });
  assert.equal(mesin.panggilan.length, 1);
  assert.deepEqual(mesin.panggilan[0].daftar, [fen(0), fen(1), fen(2)]);
});

await uji("ukuranBatch memotong daftar dan menjaga urutan", async () => {
  const mesin = mesinPalsu();
  await prediksiManusia(partai, { mesin, ukuranBatch: 2 });
  assert.deepEqual(
    mesin.panggilan.map((p) => p.daftar),
    [[fen(0), fen(1)], [fen(2)]]
  );
});

await uji("ukuranBatch tidak sah (0) jatuh ke bawaan", async () => {
  const mesin = mesinPalsu();
  await prediksiManusia(partai, { mesin, ukuranBatch: 0 });
  assert.deepEqual(
    mesin.panggilan.map((p) => p.daftar.length),
    [3],
    "0 bukan potongan sah — pakai UKURAN_BATCH_MAIA"
  );
});

await uji("rating & ratingLawan diteruskan apa adanya", async () => {
  const mesin = mesinPalsu();
  await prediksiManusia(partai, { mesin, rating: 1800, ratingLawan: 1500 });
  assert.deepEqual(mesin.panggilan[0].opsi, { rating: 1800, ratingLawan: 1500 });
});

await uji("UKURAN_BATCH_MAIA dipakai bila ukuranBatch tidak diberikan", async () => {
  // 35 langkah → 34 posisi dinilai (langkah terakhir tidak punya posisi sesudahnya).
  const banyak = Array.from({ length: UKURAN_BATCH_MAIA + 3 }, (_, i) => ({
    fen: fen(i),
    uci: "e2e4",
    san: "e4",
  }));
  const mesin = mesinPalsu();
  await prediksiManusia(banyak, { mesin });
  assert.deepEqual(
    mesin.panggilan.map((p) => p.daftar.length),
    [UKURAN_BATCH_MAIA, 2]
  );
});

console.log("== kegagalan & pembatalan ==");

await uji("mesin tanpa inferensi() → TypeError", async () => {
  await assert.rejects(() => prediksiManusia(partai, { mesin: {} }), TypeError);
});

await uji("moves bukan array → peta kosong, mesin tidak dipanggil", async () => {
  const mesin = mesinPalsu();
  const peta = await prediksiManusia(null, { mesin });
  assert.equal(peta.size, 0);
  assert.equal(mesin.panggilan.length, 0);
});

await uji("sinyal sudah dibatalkan → peta kosong, mesin tidak dipanggil", async () => {
  const mesin = mesinPalsu();
  const peta = await prediksiManusia(partai, { mesin, sinyal: { aborted: true } });
  assert.equal(peta.size, 0);
  assert.equal(mesin.panggilan.length, 0);
});

await uji("hasil inferensi lebih pendek → entri yang tak ada dilewati", async () => {
  const mesin = {
    inferensi: async (daftarFen) => daftarFen.slice(0, 1).map(() => ({ kebijakan: { e2e4: 1 } })),
  };
  const peta = await prediksiManusia(partai, { mesin });
  assert.equal(peta.size, 1, "hanya posisi pertama yang punya kebijakan");
});

await uji("galat mesin diteruskan ke pemanggil (tidak ditelan)", async () => {
  const mesin = {
    inferensi: async () => {
      throw new Error("model gagal dimuat");
    },
  };
  await assert.rejects(() => prediksiManusia(partai, { mesin }), /model gagal dimuat/);
});

console.log("== urat nadi: metrik deviasi ==");

/* Satu langkah dinilai: p(d7d5) = 0.25 → kejutan 2 bit, peringkat 2 (ada satu
 * langkah berprobabilitas lebih besar). Nilainya dihitung tangan di sini. */
const petaUji = { [fen(0)]: { d7d5: 0.25, g8f6: 0.75 } };
const duaPemain = [
  { fen: fen(0), uci: "e2e4", san: "e4" },
  { fen: fen(1), uci: "d7d5", san: "d5" },
];

await uji("deviasiManusiaDariMaia = hitungDeviasiManusia dengan peta yang sama", async () => {
  const hasil = await deviasiManusiaDariMaia(duaPemain, {
    mesin: mesinPalsu(petaUji),
    rating: 1500,
    langkahMinimum: 1,
  });
  const harapan = hitungDeviasiManusia(
    duaPemain,
    new Map([[fen(0), { d7d5: 0.25, g8f6: 0.75 }]]),
    { langkahMinimum: 1 }
  );
  assert.deepEqual(hasil, harapan);
  assert.deepEqual(hasil, { sampel: 1, kejutanRata: 2, rataPeringkatMaia: 2, kejutanTinggi: 0 });
});

await uji("langkahMinimum bawaan (8) → null pada sampel kecil", async () => {
  const hasil = await deviasiManusiaDariMaia(duaPemain, { mesin: mesinPalsu(petaUji) });
  assert.equal(hasil, null);
});

console.log("");
if (gagal === 0) {
  console.log(`Hasil: ${lulus} lulus, 0 gagal.`);
} else {
  console.error(`Hasil: ${lulus} lulus, ${gagal} gagal.`);
  process.exitCode = 1;
}
