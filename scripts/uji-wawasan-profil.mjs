/**
 * Uji WAWASAN PROFIL (mesin/wawasan.js, mesin/ringkasanAnalisis.js,
 * mesin/analisisTersimpan.js).
 *
 * Angka emasnya BUKAN karangan sendiri: berkas ini menyalin kasus uji repo
 * acuan ChessGameReviewer, `tests/profile-insights/aggregations.test.ts`
 * (describe `computeOpeningStats` dan `computeTacticalStats`), supaya port
 * `computeOpeningStats` → `hitungPembukaanTeratas` dan `computeTacticalStats`
 * → `hitungTaktikal` terbukti menghasilkan angka yang sama. PGN, nama
 * pembukaan, ECO, dan ringkasan analisis di bawah adalah data uji acuan apa
 * adanya; yang disesuaikan hanya BENTUK record partai (repo ini menyimpan
 * `whiteName`/`blackName` + `result` dari sudut putih, acuan menyimpan
 * `userColor` + `result` dari sudut pemain).
 *
 * Ditambah: kunci emas `extractFirstMovesFromPgn`, rantai cadangan nama
 * pembukaan (termasuk partai Chess.com yang TIDAK punya tag `[Opening]`),
 * dan `ringkasWarna` (padanan `summarizeColor`) yang akurasi per langkahnya
 * dikunci ke nilai emas en-croissant di `uji-anticheat.mjs` seksi 14.
 *
 * Jalankan: node scripts/uji-wawasan-profil.mjs   (npm run uji:wawasan-profil)
 */
import assert from "node:assert/strict";

import {
  agregasiWawasan,
  filterPartaiWawasan,
  extractFirstMovesFromPgn,
  formatEcoUrlName,
  hitungPembukaanTeratas,
  hitungTaktikal,
  parsePgnHeaders,
} from "../src/halaman/Analisa/mesin/wawasan.js";
import { akurasiLangkah } from "../src/halaman/Analisa/mesin/akurasi.js";
import { breakdownKosong, ringkasAnalisis, ringkasWarna } from "../src/halaman/Analisa/mesin/ringkasanAnalisis.js";
import { hashPgn } from "../src/lib/pgnRingan.js";
import {
  ambilPetaAnalisis,
  bersihkanAnalisis,
  catatAnalisis,
  hapusAnalisis,
  jumlahAnalisis,
  langgananAnalisis,
} from "../src/halaman/Analisa/mesin/analisisTersimpan.js";

let lulus = 0;
let gagal = 0;

function uji(nama, jalan) {
  try {
    jalan();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal++;
    console.error(`  ✗ ${nama}\n    ${galat?.message ?? galat}`);
    process.exitCode = 1;
  }
}

const hampir = (a, b, toleransi = 1e-9) => Math.abs(a - b) <= toleransi;

/* ------------------------------------------------------------------ fixture
 * `makeGame()` acuan, diterjemahkan ke bentuk record partai repo ini.
 * Acuan: userColor "white" + result "win"  →  di sini: pemain = whiteName,
 * result "white" (putih menang).
 */
/** Bentuk filter yang dikirim layar Wawasan (bukan `{}` — lihat uji seksi 8). */
const FILTER_SEMUA = Object.freeze({ timeClass: "all", color: "all", dateRange: "all" });

const PGN_ACUAN = [
  '[Event "Live Chess"]',
  '[Site "Chess.com"]',
  '[Date "2023.11.14"]',
  '[White "testuser"]',
  '[Black "opponent"]',
  '[Result "1-0"]',
  '[ECO "C00"]',
  '[ECOUrl "https://www.chess.com/openings/French-Defense"]',
  '[Opening "French Defense"]',
  "",
  "1. e4 e6 2. d4 d5 1-0",
].join("\n");

function buatPartai(ganti = {}) {
  return {
    id: "https://www.chess.com/game/live/101",
    url: "https://www.chess.com/game/live/101",
    whiteName: "testuser",
    blackName: "opponent",
    whiteElo: 1550,
    blackElo: 1530,
    result: "white",
    timestamp: 1700000000 * 1000,
    timeClass: "rapid",
    pgn: PGN_ACUAN,
    ...ganti,
  };
}

/** `ColorAnalysisSummary` tiruan — angka persis dari uji acuan. */
function isi(accuracyEstimate, eligibleMoves, breakdown) {
  return {
    accuracyEstimate,
    eligibleMoves,
    excludedMoves: 0,
    breakdown: { ...breakdownKosong(), ...breakdown },
  };
}

/** `GameAnalysisResult` tiruan. */
function hasilAnalisis(putih, hitam) {
  return {
    status: "complete",
    summary: { w: putih, b: hitam },
    analyzedPlies: 20,
    totalPlies: 20,
  };
}

const ANALISIS_1 = hasilAnalisis(
  isi(85.5, 25, { blunder: 1, mistake: 2, inaccuracy: 3, miss: 1, great: 1, best: 10, excellent: 4, good: 3 }),
  isi(70, 25, { blunder: 3, mistake: 2, inaccuracy: 2, best: 8, excellent: 3, good: 7 })
);
const ANALISIS_2 = hasilAnalisis(
  isi(90, 20, { inaccuracy: 1, brilliant: 1, great: 2, best: 12, excellent: 3, good: 2 }),
  isi(75.5, 20, { blunder: 2, mistake: 1, inaccuracy: 2, best: 9, excellent: 2, good: 4 })
);

/* ------------------------------------------------- 1. parsePgnHeaders (acuan) */

console.log("\n1. parsePgnHeaders — salinan lib/chess/pgnHeaders.ts");

uji("header PGN acuan terbaca semua", () => {
  const h = parsePgnHeaders(PGN_ACUAN);
  assert.equal(h.Opening, "French Defense");
  assert.equal(h.ECO, "C00");
  assert.equal(h.ECOUrl, "https://www.chess.com/openings/French-Defense");
  assert.equal(h.White, "testuser");
});

uji("nilai dengan kutipan ter-escape terbaca (regex acuan, bukan [^\"]*)", () => {
  const h = parsePgnHeaders('[Event "Live \\"Chess\\""]\n\n1. e4 1-0');
  assert.equal(h.Event, 'Live "Chess"');
});

uji("PGN kosong / bukan string → {} (tidak melempar)", () => {
  assert.deepEqual(parsePgnHeaders(""), {});
  assert.deepEqual(parsePgnHeaders(null), {});
});

/* ------------------------------------------- 2. extractFirstMovesFromPgn */

console.log("\n2. extractFirstMovesFromPgn — kunci emas uji acuan");

uji('PGN scandinavian acuan → "1. e4 d5 2. exd5 Qxd5"', () => {
  const pgn = '[ECO "B01"]\n[Opening "Scandinavian Defense"]\n\n1. e4 {[%clk 0:03:00]} d5 {[%clk 0:02:58]} 2. exd5 Qxd5 1-0';
  assert.equal(extractFirstMovesFromPgn(pgn), "1. e4 d5 2. exd5 Qxd5");
});

uji("tanpa anotasi clock → 8 token pertama apa adanya", () => {
  const pgn = '[ECO "B01"]\n\n1. e4 d5 2. exd5 Qxd5 1-0';
  assert.equal(extractFirstMovesFromPgn(pgn), "1. e4 d5 2. exd5 Qxd5");
});

uji("berhenti di penanda hasil dan di 8 token", () => {
  assert.equal(extractFirstMovesFromPgn("\n1. e4 c5 2. Nf3 d6 3. d4 cxd4 1-0"), "1. e4 c5 2. Nf3 d6 3. d4");
  assert.equal(extractFirstMovesFromPgn("\n1. e4 e5 *"), "1. e4 e5");
});

uji("PGN kosong → string kosong", () => {
  assert.equal(extractFirstMovesFromPgn(""), "");
});

/* ------------------------------------------------------ 3. formatEcoUrlName */

console.log("\n3. formatEcoUrlName — salinan aggregations.ts acuan");

uji("slug chess.com menjadi nama ber-spasi", () => {
  assert.equal(formatEcoUrlName("https://www.chess.com/openings/Sicilian-Defense"), "Sicilian Defense");
  assert.equal(formatEcoUrlName("https://www.chess.com/openings/French-Defense"), "French Defense");
});

uji("URL tidak sah tetap dipotong sebagai string mentah (jalur catch acuan)", () => {
  assert.equal(formatEcoUrlName("bukan-url/Sicilian-Defense"), "Sicilian Defense");
});

uji("kosong → undefined; URL tanpa segmen terakhir memakai segmen yang ada", () => {
  assert.equal(formatEcoUrlName(undefined), undefined);
  assert.equal(formatEcoUrlName(""), undefined);
  // `filter(Boolean)` acuan membuang segmen kosong dari "/", jadi slug-nya
  // tetap "openings" — perilaku acuan apa adanya, bukan undefined.
  assert.equal(formatEcoUrlName("https://www.chess.com/openings/"), "openings");
});

/* ------------------------------------------------- 4. hitungPembukaanTeratas */

console.log("\n4. hitungPembukaanTeratas — kunci emas computeOpeningStats acuan");

const PGN_SCANDINAVIAN = (hasil) =>
  `[ECO "B01"]\n[Opening "Scandinavian Defense"]\n\n1. e4 {[%clk 0:03:00]} d5 {[%clk 0:02:58]} 2. exd5 Qxd5 ${hasil}`;
const PGN_FRENCH = '[ECO "C00"]\n[Opening "French Defense"]\n\n1. e4 e6 2. d4 d5 1-0';

uji("kasus acuan: 3 Scandinavian + 1 French, sebagai putih", () => {
  const partai = [
    buatPartai({ id: "a", pgn: PGN_SCANDINAVIAN("1-0"), result: "white" }),
    buatPartai({ id: "b", pgn: PGN_SCANDINAVIAN("1-0"), result: "white" }),
    buatPartai({ id: "c", pgn: PGN_SCANDINAVIAN("0-1"), result: "black" }),
    buatPartai({ id: "d", pgn: PGN_FRENCH, result: "white" }),
  ];
  const putih = hitungPembukaanTeratas(partai, "testuser", "white");
  assert.equal(putih.length, 2);
  assert.equal(putih[0].name, "Scandinavian Defense");
  assert.equal(putih[0].played, 3);
  assert.equal(putih[0].wins, 2);
  assert.equal(putih[0].losses, 1);
  assert.equal(putih[0].winRate, 66.7);
  assert.equal(putih[0].eco, "B01");
  assert.equal(putih[0].moves, "1. e4 d5 2. exd5 Qxd5");
  assert.equal(putih[1].name, "French Defense");
  assert.equal(putih[1].played, 1);
  assert.equal(putih[1].winRate, 100);
});

uji("kasus acuan: tanpa [Opening], jatuh ke slug [ECOUrl]", () => {
  const pgn = '[ECO "B20"]\n[ECOUrl "https://www.chess.com/openings/Sicilian-Defense"]\n\n1. e4 c5 1/2-1/2';
  const partai = [buatPartai({ whiteName: "lawan", blackName: "testuser", result: "draw", pgn })];
  const hitam = hitungPembukaanTeratas(partai, "testuser", "black");
  assert.equal(hitam.length, 1);
  assert.equal(hitam[0].name, "Sicilian Defense");
  assert.equal(hitam[0].draws, 1);
  assert.equal(hitam[0].winRate, 0);
});

uji("partai Chess.com tanpa [Opening] TIDAK lagi jadi 'tidak diketahui'", () => {
  // Bentuk nyata arsip bulanan chess.com: hanya ECO + ECOUrl.
  const pgn = [
    '[Event "Live Chess"]',
    '[Site "https://www.chess.com/game/live/9"]',
    '[White "testuser"]',
    '[Black "opponent"]',
    '[Result "1-0"]',
    '[ECO "B01"]',
    '[ECOUrl "https://www.chess.com/openings/Scandinavian-Defense"]',
    "",
    "1. e4 d5 2. exd5 Qxd5 1-0",
  ].join("\n");
  const putih = hitungPembukaanTeratas([buatPartai({ pgn })], "testuser", "white");
  assert.equal(putih[0].name, "Scandinavian Defense");
  assert.equal(putih[0].eco, "B01");
});

uji("hanya [ECO] → 'Opening <ECO>' (label bawaan acuan)", () => {
  const pgn = '[ECO "B20"]\n\n1. e4 c5 1-0';
  const putih = hitungPembukaanTeratas([buatPartai({ pgn })], "testuser", "white");
  assert.equal(putih[0].name, "Opening B20");
});

uji("tanpa ECO maupun ECOUrl → label tidak diketahui, dan bisa di-i18n-kan", () => {
  const pgn = "\n1. e4 c5 1-0";
  assert.equal(hitungPembukaanTeratas([buatPartai({ pgn })], "testuser", "white")[0].name, "Unknown Opening");
  const dilokalkan = hitungPembukaanTeratas([buatPartai({ pgn })], "testuser", "white", 5, {
    dariEco: (eco) => `Pembukaan ${eco}`,
    tidakDiketahui: "Pembukaan tidak diketahui",
  });
  assert.equal(dilokalkan[0].name, "Pembukaan tidak diketahui");
});

uji("batas memotong daftar, urutan jumlah partai lalu winRate", () => {
  const partai = [];
  for (let i = 0; i < 7; i++) {
    partai.push(
      buatPartai({
        id: `g${i}`,
        pgn: `[ECO "A0${i}"]\n[Opening "Uji ${i}"]\n\n1. e4 e5 1-0`,
        result: "white",
      })
    );
  }
  partai.push(buatPartai({ id: "ramai", pgn: '[ECO "B01"]\n[Opening "Ramai"]\n\n1. e4 d5 1-0', result: "white" }));
  partai.push(buatPartai({ id: "ramai2", pgn: '[ECO "B01"]\n[Opening "Ramai"]\n\n1. e4 d5 1-0', result: "white" }));
  const putih = hitungPembukaanTeratas(partai, "testuser", "white", 5);
  assert.equal(putih.length, 5);
  assert.equal(putih[0].name, "Ramai");
  assert.equal(putih[0].played, 2);
});

uji("warna pemain memisahkan daftar putih dan hitam", () => {
  const partai = [buatPartai({ pgn: PGN_FRENCH, result: "white" })];
  assert.equal(hitungPembukaanTeratas(partai, "testuser", "white").length, 1);
  assert.equal(hitungPembukaanTeratas(partai, "testuser", "black").length, 0);
});

uji("warna 'all' menggabungkan putih dan hitam tanpa memotong saat batas Infinity", () => {
  const partai = [
    buatPartai({
      id: "w1",
      pgn: '[ECO "B01"]\n[Opening "Scandinavian Defense"]\n\n1. e4 d5 1-0',
      result: "white",
    }),
    buatPartai({
      id: "b1",
      whiteName: "opponent",
      blackName: "testuser",
      pgn: '[Opening "Scandinavian Defense"]\n\n1. e4 d5 0-1',
      result: "black",
    }),
    buatPartai({
      id: "b2",
      whiteName: "opponent",
      blackName: "testuser",
      pgn: '[ECO "B01"]\n[Opening "Scandinavian Defense"]\n\n1. e4 d5 1/2-1/2',
      result: "draw",
    }),
  ];
  for (let i = 0; i < 6; i++) {
    partai.push(
      buatPartai({
        id: `extra-${i}`,
        pgn: `[ECO "C0${i}"]\n[Opening "Pembukaan Uji ${i}"]\n\n1. e4 e5 1-0`,
        result: "white",
      }),
    );
  }
  const semua = hitungPembukaanTeratas(partai, "testuser", "all", Infinity);
  assert.equal(semua.length, 7);
  assert.equal(semua[0].name, "Scandinavian Defense");
  assert.equal(semua[0].eco, "B01");
  assert.equal(semua[0].played, 3);
  assert.equal(semua[0].wins, 2);
  assert.equal(semua[0].draws, 1);
  assert.equal(semua[0].losses, 0);
  assert.equal(semua[0].winRate, 66.7);
});

/* ------------------------------------------------------- 5. hitungTaktikal */

console.log("\n5. hitungTaktikal — kunci emas computeTacticalStats acuan");

/*
 * `hitungTaktikal` menerima record berbentuk ACUAN (`id`, `userColor`,
 * `accuracies`) — persis `computeTacticalStats(games, analysisMap)` yang
 * membaca `game.id`, `game.userColor`, dan `game.accuracies[game.userColor]`.
 * Penyesuaian dari bentuk record repo ini dikerjakan `agregasiWawasan`.
 */
const partaiAcuan = (ganti = {}) => ({
  id: "g1",
  userColor: "white",
  result: "win",
  timeClass: "rapid",
  endedAt: 1700000000,
  pgn: PGN_ACUAN,
  ...ganti,
});

uji("kasus acuan: tanpa analisis → metrik kosong, avgAccuracy null", () => {
  const stats = hitungTaktikal([partaiAcuan()], {});
  assert.equal(stats.totalEvaluatedMoves, 0);
  assert.equal(stats.avgAccuracy, null);
  assert.equal(stats.blunders, 0);
  assert.equal(stats.blundersPerGame, 0);
  assert.equal(stats.mistakes, 0);
  assert.equal(stats.inaccuracies, 0);
  assert.equal(stats.misses, 0);
});

uji("kasus acuan: agregasi dari hasil analisis engine", () => {
  // Persis uji acuan: game1 dimainkan sebagai PUTIH, game2 sebagai HITAM.
  const g1 = partaiAcuan({ id: "g1", userColor: "white" });
  const g2 = partaiAcuan({ id: "g2", userColor: "black" });
  const stats = hitungTaktikal([g1, g2], { g1: ANALISIS_1, g2: ANALISIS_2 });
  // blunder: g1.white(1) + g2.black(2) · mistake: 2 + 1 · inaccuracy: 3 + 2
  // miss: 1 + 0 · langkah dinilai: 25 + 20 · akurasi: (85.5 + 75.5) / 2
  assert.equal(stats.blunders, 3);
  assert.equal(stats.mistakes, 3);
  assert.equal(stats.inaccuracies, 5);
  assert.equal(stats.misses, 1);
  assert.equal(stats.totalEvaluatedMoves, 45);
  assert.equal(stats.blundersPerGame, 1.5);
  assert.equal(stats.avgAccuracy, 80.5);
});

uji("userColor memilih sisi ringkasan yang benar", () => {
  const sama = { g1: ANALISIS_1 };
  const hitam = hitungTaktikal([partaiAcuan({ userColor: "black" })], sama);
  assert.equal(hitam.avgAccuracy, 70); // summary.black ANALISIS_1
  assert.equal(hitam.totalEvaluatedMoves, 25);
  assert.equal(hitam.blunders, 3);

  const putih = hitungTaktikal([partaiAcuan({ userColor: "white" })], sama);
  assert.equal(putih.avgAccuracy, 85.5); // summary.white ANALISIS_1
  assert.equal(putih.blunders, 1);
});

uji("tanpa analisis → jatuh ke accuracies terbitan platform (cabang else-if acuan)", () => {
  const partai = [
    partaiAcuan({ id: "p1", userColor: "white", accuracies: { white: 82.4, black: 71.0 } }),
    partaiAcuan({ id: "p2", userColor: "white", accuracies: { white: 60.0, black: 91.2 } }),
  ];
  const stats = hitungTaktikal(partai, {});
  assert.equal(stats.avgAccuracy, 71.2); // (82.4 + 60.0) / 2
  assert.equal(stats.accuracyCount, 2);
  assert.equal(stats.analyzedGamesCount, 0);
  // Hitungan kesalahan HANYA dari engine — platform tidak mengirimnya.
  assert.equal(stats.totalEvaluatedMoves, 0);
  assert.equal(stats.blunders, 0);
  assert.equal(stats.blundersPerGame, 0);
});

uji("sisi accuracies yang dibaca mengikuti userColor", () => {
  const partai = [partaiAcuan({ userColor: "black", accuracies: { white: 82.4, black: 71.0 } })];
  assert.equal(hitungTaktikal(partai, {}).avgAccuracy, 71);
});

uji("partai tanpa warna pemain yang valid tidak menyumbang statistik taktik", () => {
  const partai = [partaiAcuan({
    id: "p-tanpa-sisi",
    userColor: null,
    accuracies: { white: 99.9, black: 1.0 },
  })];
  const stats = hitungTaktikal(partai, {
    "p-tanpa-sisi": {
      summary: { white: { eligibleMoves: 20, accuracyEstimate: 99.9, breakdown: { blunder: 0 } } },
    },
  });
  assert.equal(stats.avgAccuracy, null);
  assert.equal(stats.accuracyCount, 0);
  assert.equal(stats.analyzedGamesCount, 0);
  assert.equal(stats.totalEvaluatedMoves, 0);
});

uji("ringkasan analisis tanpa sisi pemain jatuh ke akurasi platform", () => {
  const partai = [partaiAcuan({
    id: "p1",
    userColor: "white",
    accuracies: { white: 76.4 },
  })];
  const stats = hitungTaktikal(partai, { p1: { summary: { black: { eligibleMoves: 8, accuracyEstimate: 90, breakdown: {} } } } });
  assert.equal(stats.avgAccuracy, 76.4);
  assert.equal(stats.accuracyCount, 1);
  assert.equal(stats.analyzedGamesCount, 0);
  assert.equal(stats.blundersPerGame, 0);
});

uji("partai punya analisis TIDAK dihitung dua kali dari accuracies platform", () => {
  const g1 = partaiAcuan({ accuracies: { white: 12.3 } });
  const stats = hitungTaktikal([g1], { g1: ANALISIS_1 });
  assert.equal(stats.avgAccuracy, 85.5); // dari engine, bukan 12.3
  assert.equal(stats.accuracyCount, 1);
});

uji("accuracies yang hilang/rusak dilewati, bukan dibaca 0", () => {
  const partai = [
    partaiAcuan({ id: "p1", accuracies: { black: 88 } }), // sisi putih tidak ada
    partaiAcuan({ id: "p2", accuracies: { white: null } }),
    partaiAcuan({ id: "p3" }), // field tidak ada sama sekali
    partaiAcuan({ id: "p4", accuracies: { white: 70 } }),
  ];
  const stats = hitungTaktikal(partai, {});
  assert.equal(stats.accuracyCount, 1);
  assert.equal(stats.avgAccuracy, 70);
});

uji("avgAccuracy dibulatkan satu desimal seperti acuan", () => {
  const partai = [
    partaiAcuan({ id: "p1", accuracies: { white: 80.44 } }),
    partaiAcuan({ id: "p2", accuracies: { white: 80.44 } }),
    partaiAcuan({ id: "p3", accuracies: { white: 80.45 } }),
  ];
  assert.equal(hitungTaktikal(partai, {}).avgAccuracy, 80.4);
});

/* ----------------------------------------------------- 6. ringkasWarna */

console.log("\n6. ringkasWarna — padanan summarizeColor(acuan) di atas moves repo ini");

/**
 * Bentuk `moves` hasil parsePGN. Dua konvensi yang wajib benar di sini
 * (keduanya dikunci `uji-anticheat.mjs`, jadi bukan tafsiran sendiri):
 *   - `color` = pihak yang bergilir SESUDAH langkah dimainkan, sehingga
 *     pelangkahnya adalah kebalikannya (`pemainLangkah`/`pemainDariEntri`).
 *     Lihat fixture `MOVES_CAMPUR` uji-anticheat: `{ san: "e4", color: "b" }`.
 *   - `previousStaticEvals[1]` = eval SEBELUM langkah (sudut pelangkah),
 *     `previousStaticEvals[0]` = eval SESUDAH langkah (sudut lawan, jadi
 *     tandanya dibalik `cpBaku`). Lihat kepala modul mesin/akurasi.js.
 */
const MOVES = [
  { fen: "posisi awal", color: "w" }, // moves[0]: tanpa san → dilewati
  { san: "e4", color: "b", moveRating: "best", previousStaticEvals: [["cp", "0"], ["cp", "100"]] }, // Putih
  // Hitam: riwayat[1] = ["cp","0"] → sebelum = 0; riwayat[0] = ["cp","500"]
  // dibaca dari sudut Putih lalu DIBALIK → sesudah = -500. Pasangan (0, -500)
  // ini persis kasus emas `akurasiLangkah(0, -500) ≈ 19.07` di seksi 14
  // uji-anticheat.mjs (nilai acuan suite en-croissant).
  { san: "e5", color: "w", moveRating: "blunder", previousStaticEvals: [["cp", "500"], ["cp", "0"]] },
  { san: "Nf3", color: "b", moveRating: "excellent" }, // Putih, tanpa eval → excludedMoves
];

uji("langkah tanpa eval masuk excludedMoves, bukan dihitung 0", () => {
  const w = ringkasWarna(MOVES, "w");
  assert.equal(w.eligibleMoves, 1);
  assert.equal(w.excludedMoves, 1);
  assert.equal(w.breakdown.best, 1);
  assert.equal(w.breakdown.blunder, 0);
});

uji("accuracyEstimate = rata-rata aritmetik akurasi per langkah (bukan harmonik)", () => {
  /*
   * Putih (indeks 1): sebelum = riwayat[1] = ["cp","100"] → +100; sesudah =
   * riwayat[0] = ["cp","0"] dari sudut Putih, dibalik untuk Putih → 0.
   * Jadi akurasiLangkah(100, 0): Putih kehilangan 1 pion → 67.24.
   *
   * Hitam (indeks 2): sebelum = riwayat[1] = ["cp","0"] → 0; sesudah =
   * riwayat[0] = ["cp","500"] dari sudut Putih, dibalik → -500. Jadi
   * akurasiLangkah(0, -500) = 19.07, nilai emas yang DIKUNCI
   * uji-anticheat.mjs seksi 14 dari suite uji en-croissant — bukan angka
   * karangan berkas ini.
   */
  const w = ringkasWarna(MOVES, "w");
  assert.ok(hampir(w.accuracyEstimate, akurasiLangkah(100, 0), 1e-9), `${w.accuracyEstimate}`);
  assert.ok(hampir(w.accuracyEstimate, 67.242, 0.001), `${w.accuracyEstimate}`);
  const b = ringkasWarna(MOVES, "b");
  assert.ok(hampir(b.accuracyEstimate, akurasiLangkah(0, -500), 1e-9), `${b.accuracyEstimate}`);
  assert.ok(hampir(b.accuracyEstimate, 19.07, 0.005), `${b.accuracyEstimate}`);
  assert.equal(b.breakdown.blunder, 1);
  assert.equal(b.eligibleMoves, 1);
});

uji("label critical dihitung sebagai best (keputusan produk README 2026-09-23)", () => {
  const moves = [
    { fen: "awal", color: "w" },
    { san: "e4", color: "b", moveRating: "critical", previousStaticEvals: [["cp", "0"], ["cp", "100"]] }, // Putih
  ];
  assert.equal(ringkasWarna(moves, "w").breakdown.best, 1);
  assert.equal(ringkasWarna(moves, "w").breakdown.critical, undefined);
});

uji("langkah paksa masuk barisnya sendiri, bukan baris kualitas", () => {
  const moves = [
    { fen: "awal", color: "w" },
    { san: "Kd7", color: "b", moveRating: "best", isForced: true, previousStaticEvals: [["cp", "0"], ["cp", "100"]] }, // Putih
  ];
  const w = ringkasWarna(moves, "w");
  assert.equal(w.breakdown.forced, 1);
  assert.equal(w.breakdown.best, 0);
  assert.equal(w.eligibleMoves, 1);
});

uji("daftar kosong → accuracyEstimate null (padanan estimates.length === 0)", () => {
  const kosong = ringkasWarna([], "w");
  assert.equal(kosong.accuracyEstimate, null);
  assert.equal(kosong.eligibleMoves, 0);
  assert.deepEqual(kosong.breakdown, breakdownKosong());
});

uji("ringkasAnalisis: status complete + totalPlies tidak menghitung posisi awal", () => {
  const hasil = ringkasAnalisis(MOVES);
  assert.equal(hasil.status, "complete");
  assert.equal(hasil.totalPlies, 3);
  assert.equal(hasil.analyzedPlies, 3);
  assert.ok(hasil.summary.w && hasil.summary.b);
});

/* ------------------------------------------- 7. pendaftaran analisis sesi */

console.log("\n7. analisisTersimpan — padanan analysis.resultsByGameId acuan");

uji("hanya status complete yang masuk peta (case analysis/terminal acuan)", () => {
  bersihkanAnalisis();
  catatAnalisis("kunci-1", { status: "cancelled", summary: {} });
  assert.equal(jumlahAnalisis(), 0);
  catatAnalisis("kunci-1", ringkasAnalisis(MOVES));
  assert.equal(jumlahAnalisis(), 1);
  assert.equal(ambilPetaAnalisis()["kunci-1"].status, "complete");
});

uji("kunci kosong / hasil kosong tidak menulis apa pun", () => {
  bersihkanAnalisis();
  catatAnalisis("", ringkasAnalisis(MOVES));
  catatAnalisis("  ", ringkasAnalisis(MOVES));
  catatAnalisis("kunci", null);
  assert.equal(jumlahAnalisis(), 0);
});

uji("hapusAnalisis dan bersihkanAnalisis mengosongkan peta", () => {
  bersihkanAnalisis();
  catatAnalisis("a", ringkasAnalisis(MOVES));
  catatAnalisis("b", ringkasAnalisis(MOVES));
  hapusAnalisis("a");
  assert.equal(jumlahAnalisis(), 1);
  bersihkanAnalisis();
  assert.equal(jumlahAnalisis(), 0);
});

uji("langganan dipanggil saat peta berubah, dan bisa berhenti", () => {
  bersihkanAnalisis();
  let hitungan = 0;
  const berhenti = langgananAnalisis(() => {
    hitungan++;
  });
  catatAnalisis("a", ringkasAnalisis(MOVES));
  assert.equal(hitungan, 1);
  hapusAnalisis("tidak-ada");
  assert.equal(hitungan, 1); // tidak ada perubahan → tidak dipanggil
  berhenti();
  catatAnalisis("b", ringkasAnalisis(MOVES));
  assert.equal(hitungan, 1);
  bersihkanAnalisis();
});

uji("snapshot selalu objek baru supaya useMemo pemanggil melihat perubahan", () => {
  bersihkanAnalisis();
  catatAnalisis("a", ringkasAnalisis(MOVES));
  assert.notEqual(ambilPetaAnalisis(), ambilPetaAnalisis());
  bersihkanAnalisis();
});

/* -------------------------------------------------- 7. filter wawasan */

console.log("\n7. filterPartaiWawasan — default dan filter parsial");

uji("filter kosong menggunakan semua kelas waktu dan rentang tanggal", () => {
  const partai = [
    buatPartai({ id: "lama", timestamp: 1000, timeClass: "rapid" }),
    buatPartai({ id: "baru", timestamp: 1700000000000, timeClass: "blitz" }),
  ];
  assert.deepEqual(filterPartaiWawasan(partai, {}).map((p) => p.id), ["lama", "baru"]);
});

uji("filter parsial tanggal tidak menolak kelas waktu yang tidak ditentukan", () => {
  const sekarang = 1700000000000;
  const partai = [
    buatPartai({ id: "dalam-rentang", timestamp: sekarang - 5 * 86400000, timeClass: "rapid" }),
    buatPartai({ id: "di-luar-rentang", timestamp: sekarang - 40 * 86400000, timeClass: "blitz" }),
  ];
  assert.deepEqual(
    filterPartaiWawasan(partai, { dateRange: "30d" }, sekarang).map((p) => p.id),
    ["dalam-rentang"],
  );
});

uji("filter waktu parsial tetap menerima semua rentang tanggal", () => {
  const partai = [
    buatPartai({ id: "rapid-lama", timestamp: 1000, timeClass: "rapid" }),
    buatPartai({ id: "blitz-baru", timestamp: 1700000000000, timeClass: "blitz" }),
  ];
  assert.deepEqual(
    filterPartaiWawasan(partai, { timeClass: "rapid" }).map((p) => p.id),
    ["rapid-lama"],
  );
});

uji("filter aman ketika masukan partai bukan array", () => {
  assert.deepEqual(filterPartaiWawasan(null, {}), []);
});

uji("filter Daily mencakup daily Chess.com dan correspondence Lichess", () => {
  const partai = [
    buatPartai({ id: "chesscom-daily", timeClass: "daily" }),
    buatPartai({ id: "lichess-correspondence", timeClass: "correspondence" }),
    buatPartai({ id: "rapid", timeClass: "rapid" }),
  ];
  assert.deepEqual(
    filterPartaiWawasan(partai, { timeClass: "daily" }).map((p) => p.id),
    ["chesscom-daily", "lichess-correspondence"],
  );
});

uji("filter tanggal menolak timestamp rusak dan tanggal masa depan", () => {
  const sekarang = 1700000000000;
  const partai = [
    buatPartai({ id: "valid", timestamp: sekarang - 5 * 86400000, timeClass: "rapid" }),
    buatPartai({ id: "rusak", timestamp: "bukan-tanggal", timeClass: "rapid" }),
    buatPartai({ id: "masa-depan", timestamp: sekarang + 86400000, timeClass: "rapid" }),
    null,
  ];
  assert.deepEqual(
    filterPartaiWawasan(partai, { dateRange: "30d" }, sekarang).map((p) => p.id),
    ["valid"],
  );
});



/* ------------------------------------------------- 8. agregasiWawasan utuh */

console.log("\n8. agregasiWawasan — padanan aggregateAllInsights acuan");

uji("peta analisis keyed by id partai mengisi kartu taktikal", () => {
  bersihkanAnalisis();
  const partai = [
    buatPartai({ id: "g1" }),
    buatPartai({ id: "g2", whiteName: "opponent", blackName: "testuser", result: "black" }),
  ];
  const hasil = agregasiWawasan(partai, "testuser", { timeClass: "all", color: "all", dateRange: "all" }, {
    g1: ANALISIS_1,
    g2: ANALISIS_2,
  });
  assert.equal(hasil.totalPartai, 2);
  assert.equal(hasil.taktikal.avgAccuracy, 80.5);
  assert.equal(hasil.taktikal.blunders, 3);
  assert.equal(hasil.taktikal.totalEvaluatedMoves, 45);
  assert.equal(hasil.pembukaPutih[0].name, "French Defense");
  assert.equal(hasil.pembukaPutih[0].moves, "1. e4 e6 2. d4 d5");
});

uji("tanpa peta analisis, akurasi terbitan platform tetap terbaca", () => {
  const partai = [buatPartai({ id: "p1", accuracies: { white: 88.2, black: 79.9 } })];
  const hasil = agregasiWawasan(partai, "testuser", FILTER_SEMUA);
  assert.equal(hasil.taktikal.avgAccuracy, 88.2);
  assert.equal(hasil.taktikal.accuracyCount, 1);
});

uji("field taktikal selalu ada walau daftar partai kosong", () => {
  const hasil = agregasiWawasan([], "testuser", FILTER_SEMUA);
  assert.equal(hasil.totalPartai, 0);
  assert.equal(hasil.taktikal.avgAccuracy, null);
  assert.deepEqual(hasil.pembukaanSemua, []);
  assert.deepEqual(hasil.pembukaPutih, []);
  assert.deepEqual(hasil.pembukaanHitam, []);
});

uji("agregasiWawasan mengembalikan semua pembukaan tanpa batas 5 untuk semua, putih, dan hitam", () => {
  const partai = [];
  for (let i = 0; i < 7; i++) {
    partai.push(
      buatPartai({
        id: `pw-${i}`,
        pgn: `[ECO "A0${i}"]\n[Opening "Putih ${i}"]\n\n1. e4 e5 1-0`,
        result: "white",
      }),
    );
    partai.push(
      buatPartai({
        id: `pb-${i}`,
        whiteName: "opponent",
        blackName: "testuser",
        pgn: `[ECO "B0${i}"]\n[Opening "Hitam ${i}"]\n\n1. d4 d5 0-1`,
        result: "black",
      }),
    );
  }
  const hasil = agregasiWawasan(partai, "testuser", FILTER_SEMUA);
  assert.equal(hasil.pembukaPutih.length, 7);
  assert.equal(hasil.pembukaanHitam.length, 7);
  assert.equal(hasil.pembukaanSemua.length, 14);
});

/* ------------------------------------ 9. seam kunci hash PGN → id partai */

console.log("\n9. seam papan ↔ Wawasan: kunci hashPgn(pgn) diterjemahkan ke p.id");

uji("analisis yang dicatat papan terbaca agregasiWawasan lewat id partai", () => {
  // (1) Papan analisa: parsePGN selesai → catatAnalisis(hashPgn(pgn), ringkas).
  //     Persis yang dilakukan komponen/game/game.jsx setelah setGame(moves).
  const ringkasan = ringkasAnalisis(MOVES);
  catatAnalisis(hashPgn(PGN_ACUAN), ringkasan);

  // (2) Layar Wawasan: partai dari basis data punya `id` sendiri, bukan hash.
  const partai = [buatPartai({ id: "chesscom:testuser:12345", pgn: PGN_ACUAN })];

  // (3) Terjemahan kunci (logika `petaAnalisis` di layarWawasan.jsx).
  const sumber = ambilPetaAnalisis();
  const peta = {};
  for (const p of partai) {
    const hasil = sumber[hashPgn(p.pgn)];
    if (hasil) peta[p.id] = hasil;
  }
  assert.deepEqual(Object.keys(peta), ["chesscom:testuser:12345"]);
  assert.equal(peta["chesscom:testuser:12345"], ringkasan);

  // (4) Hasil akhirnya: kartu taktikal + pembukaan terisi dari partai itu.
  const hasil = agregasiWawasan(partai, "testuser", FILTER_SEMUA, peta, {
    dariEco: (eco) => `Pembukaan ${eco}`,
    tidakDiketahui: "Pembukaan tidak diketahui",
  });
  assert.equal(hasil.taktikal.analyzedGamesCount, 1);
  assert.equal(hasil.taktikal.totalEvaluatedMoves, 1); // hanya langkah Putih yang punya eval
  assert.ok(Number.isFinite(hasil.taktikal.avgAccuracy), `${hasil.taktikal.avgAccuracy}`);
  assert.equal(hasil.pembukaPutih[0].name, "French Defense");

  bersihkanAnalisis();
});

uji("partai yang tidak dianalisis sesi ini tetap mengandalkan accuracies platform", () => {
  bersihkanAnalisis();
  const partai = [
    buatPartai({ id: "sudah", pgn: PGN_ACUAN, accuracies: { white: 91.5 } }),
    buatPartai({ id: "belum", pgn: PGN_FRENCH, result: "white" }),
  ];
  catatAnalisis("hash-tak-cocok", ringkasAnalisis(MOVES));
  const hasil = agregasiWawasan(partai, "testuser", FILTER_SEMUA);
  // Hanya "sudah" yang punya angka; "belum" tidak boleh dibaca sebagai 0.
  assert.equal(hasil.taktikal.accuracyCount, 1);
  assert.equal(hasil.taktikal.avgAccuracy, 91.5);
  assert.equal(hasil.taktikal.analyzedGamesCount, 0);
  bersihkanAnalisis();
});

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
