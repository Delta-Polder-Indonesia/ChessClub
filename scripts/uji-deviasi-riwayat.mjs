/**
 * Uji lapisan riwayat untuk metrik deviasi manusia:
 * `mesin/uraiPgn.js` + `mesin/deviasiRiwayat.js` (+ opsi `warna` di
 * `mesin/deviasiManusia.js`).
 *
 * Yang dikunci:
 *  1. `uraiPgn` menghasilkan bentuk yang sama dengan `parsePGN()`:
 *     `moves[0]` = posisi awal, `color` = giliran BERIKUTNYA, `fen` = hasil
 *     langkah — inilah yang membuat kunci "FEN sebelum langkah" tetap benar.
 *  2. Anotasi PGN (tag, komentar, variasi, NAG, penanda hasil) tidak boleh
 *     bocor menjadi langkah; langkah tak sah menghentikan ekor, bukan
 *     membuang partai.
 *  3. Rata-rata lintas partai BERBOBOT SAMPEL — partai 20 langkah tidak sama
 *     berat dengan partai 9 langkah.
 *  4. Opsi `warna` menyaring SETELAH kunci `moves[i - 1].fen` dipilih, jadi
 *     melewati langkah lawan tidak menggeser posisi.
 *  5. Pembatalan menghasilkan hasil parsial (`dibatalkan: true`), galat
 *     penyedia prediksi tidak ditelan.
 *
 * Penyedia prediksi di sini palsu — uji jalan tanpa ONNX 45 MB. Jalur Maia
 * memakai pengaturan yang sama dengan deteksi Stockfish (akun, filter waktu,
 * jumlah partai), jadi tidak ada setelan kedua yang perlu diuji di sini.
 *
 * Jalankan: node scripts/uji-deviasi-riwayat.mjs
 */
import assert from "node:assert/strict";

const { uraiPgn, daftarSan } = await import("../src/halaman/Analisa/mesin/uraiPgn.js");
const { ringkasDeviasiRiwayat } = await import("../src/halaman/Analisa/mesin/deviasiRiwayat.js");
const { hitungDeviasiManusia, rincianDeviasiManusia } = await import(
  "../src/halaman/Analisa/mesin/deviasiManusia.js"
);
const { langkahLompat } = await import("../src/halaman/Analisa/komponen/game/lompatLangkah.js");
const { panahSorot, petaPanahSorot } = await import(
  "../src/halaman/Analisa/komponen/game/panahSorot.js"
);

let lulus = 0;
let gagal = 0;

async function uji(nama, jalan) {
  try {
    await jalan();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal += 1;
    console.log(`  ✗ ${nama}`);
    console.log(`    ${galat.message.split("\n").join("\n    ")}`);
  }
}

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** 20 langkah setengah (10 langkah penuh). */
const PGN_PANJANG =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7";
/** 9 langkah setengah. */
const PGN_PENDEK = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O";

/** Distribusi seragam: p untuk langkah yang dimainkan, sisanya 1-p. */
function petaSeragam(moves, p) {
  const peta = new Map();
  for (let i = 1; i < moves.length; i++) {
    const langkah = moves[i];
    if (!langkah?.fen || !langkah.uci) continue;
    // "sisa" = langkah lain yang lebih jarang dipilih, supaya peringkat
    // langkah yang dimainkan selalu 1 dan uji tidak menguji dua hal sekaligus.
    peta.set(moves[i - 1].fen, { [langkah.uci]: p, sisa: p / 2 });
  }
  return peta;
}

console.log("\n== uraiPgn: bentuk keluaran ==");

await uji("moves[0] = posisi awal tanpa san/uci", async () => {
  const moves = uraiPgn(PGN_PANJANG);
  assert.equal(moves[0].fen, FEN_AWAL);
  assert.equal(moves[0].san, undefined);
  assert.equal(moves[0].uci, undefined);
  assert.equal(moves[0].color, "w");
});

await uji("langkah pertama: san, uci, fen hasil, color = giliran berikutnya", async () => {
  const moves = uraiPgn(PGN_PANJANG);
  assert.equal(moves[1].san, "e4");
  assert.equal(moves[1].uci, "e2e4");
  assert.equal(moves[1].color, "b");
  assert.match(moves[1].fen, /^rnbqkbnr\/pppppppp\/8\/8\/4P3\/8\/PPPP1PPP\/RNBQKBNR b /);
});

await uji("20 langkah setengah → 21 entri, ekor terbaca", async () => {
  const moves = uraiPgn(PGN_PANJANG);
  assert.equal(moves.length, 21);
  assert.equal(moves.at(-1).san, "Nbd7");
  assert.equal(moves.at(-1).color, "w");
});

console.log("\n== uraiPgn: PGN kotor ==");

await uji("tag, komentar, variasi, NAG, dan hasil dibuang", async () => {
  const pgn = `[Event "Uji"]\n[White "A"]\n\n1. e4 $1 {komentar} e5 (1... c5 2. Nf3 d6) 2. Nf3 Nc6 1-0`;
  assert.deepEqual(daftarSan(pgn), ["e4", "e5", "Nf3", "Nc6"]);
  const moves = uraiPgn(pgn);
  assert.equal(moves.length, 5);
  assert.deepEqual(moves.slice(1).map((m) => m.san), ["e4", "e5", "Nf3", "Nc6"]);
});

await uji("variasi bersarang juga dibuang", async () => {
  const pgn = "1. e4 (1. d4 d5 (1... Nf6 2. c4)) e5 2. Nf3";
  assert.deepEqual(daftarSan(pgn), ["e4", "e5", "Nf3"]);
});

await uji("tag FEN dipakai sebagai posisi awal", async () => {
  const pgn = `[FEN "4k3/8/8/8/8/8/8/4K2R w K - 0 1"]\n\n1. O-O`;
  const moves = uraiPgn(pgn);
  assert.equal(moves[0].fen, "4k3/8/8/8/8/8/8/4K2R w K - 0 1");
  assert.equal(moves[1].san, "O-O");
  assert.equal(moves[1].uci, "e1g1");
});

await uji("langkah tak sah menghentikan ekor, bukan seluruh partai", async () => {
  const moves = uraiPgn("1. e4 e5 2. Qxf7 Kxd8 3. Nf3");
  assert.deepEqual(moves.slice(1).map((m) => m.san), ["e4", "e5"]);
});

await uji("PGN kosong / bukan string → []", async () => {
  assert.deepEqual(uraiPgn(""), []);
  assert.deepEqual(uraiPgn("   "), []);
  assert.deepEqual(uraiPgn(null), []);
  assert.deepEqual(uraiPgn(42), []);
});

await uji("FEN awal tak sah → []", async () => {
  assert.deepEqual(uraiPgn(`[FEN "bukan-fen"]\n\n1. e4`), []);
});

console.log("\n== hitungDeviasiManusia: penyaring warna ==");

const empatLangkah = [
  { fen: "F0", color: "w" },
  { fen: "F1", uci: "e2e4", san: "e4", color: "b" }, // Putih
  { fen: "F2", uci: "e7e5", san: "e5", color: "w" }, // Hitam
  { fen: "F3", uci: "g1f3", san: "Nf3", color: "b" }, // Putih
];
const petaTiga = new Map([
  ["F0", { e2e4: 0.5, a2a3: 0.5 }],
  ["F1", { e7e5: 0.25, c7c5: 0.75 }],
  ["F2", { g1f3: 0.125, b1c3: 0.875 }],
]);

await uji("tanpa warna: kedua pemain tercampur (perilaku lama)", async () => {
  const hasil = hitungDeviasiManusia(empatLangkah, petaTiga, { langkahMinimum: 1 });
  assert.deepEqual(hasil, {
    sampel: 3,
    kejutanRata: 2,
    // e4 peringkat 1, e5 dan Nf3 masing-masing punya satu saingan lebih besar.
    rataPeringkatMaia: 1.67,
    kejutanTinggi: 0,
  });
});

await uji("warna 'w' hanya menilai langkah Putih (memakai FEN sebelum langkah)", async () => {
  const hasil = hitungDeviasiManusia(empatLangkah, petaTiga, { langkahMinimum: 1, warna: "w" });
  assert.deepEqual(hasil, {
    sampel: 2,
    kejutanRata: 2,
    rataPeringkatMaia: 1.5,
    kejutanTinggi: 0,
  });
});

await uji("warna 'b' hanya menilai langkah Hitam", async () => {
  const hasil = hitungDeviasiManusia(empatLangkah, petaTiga, { langkahMinimum: 1, warna: "b" });
  assert.deepEqual(hasil, { sampel: 1, kejutanRata: 2, rataPeringkatMaia: 2, kejutanTinggi: 0 });
});

await uji("warna tak dikenal = tanpa penyaring", async () => {
  const hasil = hitungDeviasiManusia(empatLangkah, petaTiga, { langkahMinimum: 1, warna: "x" });
  assert.equal(hasil.sampel, 3);
});

console.log("\n== ringkasDeviasiRiwayat: penggabungan ==");

const prediksiBerperingkat = (p) => async (moves, { indeks }) => petaSeragam(moves, indeks === 0 ? p : p / 2);

await uji("rata-rata berbobot sampel lintas partai", async () => {
  const hasil = await ringkasDeviasiRiwayat(
    [{ pgn: PGN_PANJANG }, { pgn: PGN_PENDEK }],
    { prediksi: prediksiBerperingkat(0.5) }
  );
  // 20 langkah → 1 bit, 9 langkah → 2 bit: (20·1 + 9·2) / 29 = 1,31 bit.
  const { langkahTersorot, ...ringkasan } = hasil;
  assert.deepEqual(ringkasan, {
    sampel: 29,
    kejutanRata: 1.31,
    rataPeringkatMaia: 1,
    kejutanTinggi: 0,
    partaiDinilai: 2,
    partaiDilewati: 0,
    dibatalkan: false,
  });
  // Lima langkah paling mengejutkan semuanya dari partai kedua (2 bit).
  assert.equal(langkahTersorot.length, 5);
  assert.ok(langkahTersorot.every((l) => l.partai === 1 && l.kejutan === 2));
});

await uji("warnaUntuk menyaring ke satu pemain, langkahMinimum tetap berlaku", async () => {
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }, { pgn: PGN_PENDEK }], {
    prediksi: prediksiBerperingkat(0.5),
    warnaUntuk: () => "w",
  });
  // Putih: 10 langkah di partai panjang (layak), 5 di partai pendek (< 8 → dilewati).
  assert.equal(hasil.sampel, 10);
  assert.equal(hasil.partaiDinilai, 1);
  assert.equal(hasil.partaiDilewati, 1);
  assert.equal(hasil.kejutanRata, 1);
});

await uji("warnaUntuk menerima partai dan indeksnya", async () => {
  const dilihat = [];
  await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }, { pgn: PGN_PENDEK }], {
    prediksi: prediksiBerperingkat(0.5),
    warnaUntuk: (partai, indeks) => {
      dilihat.push([indeks, partai.pgn === PGN_PANJANG]);
      return null;
    },
  });
  assert.deepEqual(dilihat, [
    [0, true],
    [1, false],
  ]);
});

await uji("partai tanpa PGN / PGN tak terbaca dilewati, progres tetap maju", async () => {
  const progres = [];
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }, {}, { pgn: "bukan pgn sama sekali" }], {
    prediksi: prediksiBerperingkat(0.5),
    onProgres: (p) => progres.push(p),
  });
  assert.equal(hasil.partaiDinilai, 1);
  assert.equal(hasil.partaiDilewati, 2);
  assert.deepEqual(progres, [
    { ke: 1, total: 3 },
    { ke: 2, total: 3 },
    { ke: 3, total: 3 },
  ]);
});

await uji("daftar kosong → metrik null, bukan galat", async () => {
  const hasil = await ringkasDeviasiRiwayat([], { prediksi: async () => new Map() });
  assert.deepEqual(hasil, {
    sampel: 0,
    kejutanRata: null,
    rataPeringkatMaia: null,
    kejutanTinggi: 0,
    partaiDinilai: 0,
    partaiDilewati: 0,
    dibatalkan: false,
    langkahTersorot: [],
  });
});

console.log("\n== rincian per langkah & sorotan ==");

await uji("rincianDeviasiManusia: satu entri per langkah, kunci FEN sebelum langkah", async () => {
  const rincian = rincianDeviasiManusia(empatLangkah, petaTiga);
  assert.deepEqual(rincian, [
    { indeks: 1, san: "e4", uci: "e2e4", warna: "w", kejutan: 1, peringkat: 1 },
    { indeks: 2, san: "e5", uci: "e7e5", warna: "b", kejutan: 2, peringkat: 2 },
    { indeks: 3, san: "Nf3", uci: "g1f3", warna: "w", kejutan: 3, peringkat: 2 },
  ]);
});

await uji("rincianDeviasiManusia: penyaring warna sama dengan ringkasannya", async () => {
  const rincian = rincianDeviasiManusia(empatLangkah, petaTiga, { warna: "w" });
  assert.deepEqual(rincian.map((r) => r.san), ["e4", "Nf3"]);
  const { sampel } = hitungDeviasiManusia(empatLangkah, petaTiga, { langkahMinimum: 1, warna: "w" });
  assert.equal(rincian.length, sampel, "jumlah entri harus sama dengan sampel ringkasan");
});

await uji("rincianDeviasiManusia: masukan tak sah → []", async () => {
  assert.deepEqual(rincianDeviasiManusia(null, petaTiga), []);
  assert.deepEqual(rincianDeviasiManusia(empatLangkah, {}), []);
});

await uji("sorotan: diurutkan dari kejutan terbesar, lengkap dengan nomor langkah", async () => {
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {
    prediksi: async (moves) => petaSeragam(moves, 0.125), // 3 bit seragam
    batasSorot: 3,
  });
  assert.equal(hasil.langkahTersorot.length, 3);
  assert.ok(hasil.langkahTersorot.every((l) => l.kejutan === 3 && l.partai === 0));
  // Partai dimulai Putih: setengah-langkah 1 = langkah 1, 2 = langkah 1, 3 = langkah 2.
  assert.deepEqual(
    hasil.langkahTersorot.map((l) => [l.indeks, l.nomorLangkah]),
    [
      [1, 1],
      [2, 1],
      [3, 2],
    ]
  );
});

await uji("sorotan: warnaUntuk membatasi langkah yang disorot", async () => {
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {
    prediksi: async (moves) => petaSeragam(moves, 0.5),
    warnaUntuk: () => "b",
    batasSorot: 20,
  });
  assert.equal(hasil.langkahTersorot.length, 10, "10 langkah Hitam");
  assert.ok(hasil.langkahTersorot.every((l) => l.warna === "b" && l.indeks % 2 === 0));
});

await uji("sorotan: batasSorot 0 → daftar kosong, ringkasan tetap utuh", async () => {
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {
    prediksi: async (moves) => petaSeragam(moves, 0.5),
    batasSorot: 0,
  });
  assert.deepEqual(hasil.langkahTersorot, []);
  assert.equal(hasil.sampel, 20);
});

console.log("\n== tautan sorotan → papan ==");

await uji("lompatKe sah diteruskan apa adanya", () => {
  assert.equal(langkahLompat(7, 41), 7);
});

await uji("lompatKe melewati langkah terakhir dijepit", () => {
  assert.equal(langkahLompat(99, 41), 40);
  assert.equal(langkahLompat(1, 2), 1);
});

await uji("muatan biasa (tanpa lompatKe) tidak melompat", () => {
  assert.equal(langkahLompat(undefined, 41), null);
  assert.equal(langkahLompat(null, 41), null);
  assert.equal(langkahLompat(0, 41), null);
  assert.equal(langkahLompat(-3, 41), null);
  assert.equal(langkahLompat(2.5, 41), null);
  assert.equal(langkahLompat("7", 41), null);
});

await uji("partai kosong tetap menghasilkan 0, bukan nomor negatif", () => {
  assert.equal(langkahLompat(5, 0), 0);
  assert.equal(langkahLompat(5, undefined), 0);
});

await uji("panahSorot: UCI jadi panah papan (kolom, baris)", () => {
  assert.deepEqual(panahSorot("e2e4"), [
    { col: 4, row: 1 },
    { col: 4, row: 3 },
  ]);
  assert.deepEqual(panahSorot("g1f3"), [
    { col: 6, row: 0 },
    { col: 5, row: 2 },
  ]);
});

await uji("panahSorot: promosi & huruf besar diterima, promosi tak menggeser kotak", () => {
  assert.deepEqual(panahSorot("e7e8q"), panahSorot("e7e8"));
  assert.deepEqual(panahSorot("E2E4"), panahSorot("e2e4"));
});

await uji("panahSorot: bukan UCI sah → null (tanpa panah, bukan panah acak)", () => {
  for (const sampah of [null, undefined, "", "   ", "e2", "zz", "e2e9", "e2e4x", 42]) {
    assert.equal(panahSorot(sampah), null, `harus null: ${String(sampah)}`);
  }
});

await uji("petaPanahSorot: panah menempel pada nomor langkahnya", () => {
  assert.deepEqual(petaPanahSorot(3, "g1f3"), {
    3: [
      [
        { col: 6, row: 0 },
        { col: 5, row: 2 },
      ],
    ],
  });
});

await uji("petaPanahSorot: tanpa lompatan/uci sah → objek kosong (aman disebar)", () => {
  assert.deepEqual(petaPanahSorot(0, "e2e4"), {});
  assert.deepEqual(petaPanahSorot(null, "e2e4"), {});
  assert.deepEqual(petaPanahSorot(3.5, "e2e4"), {});
  assert.deepEqual(petaPanahSorot(3, "sampah"), {});
});

await uji("uci dari langkahTersorot selalu bisa digambar jadi panah", async () => {
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {
    prediksi: async (moves) => petaSeragam(moves, 0.125),
    batasSorot: 5,
  });
  assert.equal(hasil.langkahTersorot.length, 5);
  for (const l of hasil.langkahTersorot) {
    assert.ok(panahSorot(l.uci), `uci tidak sah: ${l.uci}`);
    assert.deepEqual(Object.keys(petaPanahSorot(l.indeks, l.uci)), [String(l.indeks)]);
  }
});

console.log("\n== kegagalan & pembatalan ==");

await uji("prediksi bukan fungsi → TypeError", async () => {
  await assert.rejects(() => ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {}), TypeError);
});

await uji("sinyal sudah dibatalkan → berhenti sebelum prediksi dipanggil", async () => {
  const controller = new AbortController();
  controller.abort();
  let dipanggil = 0;
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {
    prediksi: async () => {
      dipanggil += 1;
      return new Map();
    },
    sinyal: controller.signal,
  });
  assert.equal(dipanggil, 0);
  assert.equal(hasil.dibatalkan, true);
  assert.equal(hasil.sampel, 0);
});

await uji("batal di tengah inferensi → hasil parsial, bukan galat", async () => {
  const controller = new AbortController();
  let dipanggil = 0;
  const hasil = await ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }, { pgn: PGN_PENDEK }], {
    prediksi: async (moves) => {
      dipanggil += 1;
      controller.abort();
      return petaSeragam(moves, 0.5);
    },
    sinyal: controller.signal,
  });
  assert.equal(dipanggil, 1);
  assert.equal(hasil.dibatalkan, true);
  assert.equal(hasil.sampel, 0);
  assert.equal(hasil.partaiDinilai, 0);
});

await uji("galat penyedia prediksi diteruskan ke pemanggil", async () => {
  await assert.rejects(
    () =>
      ringkasDeviasiRiwayat([{ pgn: PGN_PANJANG }], {
        prediksi: async () => {
          throw new Error("mesin mati");
        },
      }),
    /mesin mati/
  );
});

console.log("");
if (gagal === 0) {
  console.log(`Hasil: ${lulus} lulus, 0 gagal.`);
} else {
  console.error(`Hasil: ${lulus} lulus, ${gagal} gagal.`);
  process.exitCode = 1;
}
