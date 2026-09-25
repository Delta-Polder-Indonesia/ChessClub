/**
 * Uji bantuan evaluasi bersama (`mesin/evaluasi.js`) + seluruh pembacanya.
 *
 * Diperiksa:
 *  1. `normalisasiEval` — bentuk baku cp/mate, toleransi SATU warisan
 *     (`["mate"]` tanpa angka → mate 0), penolakan sampah.
 *  2. `apakahMateTerminal` + `tandaMate` — mate 0 = pihak bergilir SUDAH
 *     MATI (tanda −1), bukan remis/netral.
 *  3. `cpBaku` — mate 0 → −1000 (bukan 0); `akurasi.js` mengekspor ulang
 *     fungsi yang SAMA (identitas, bukan salinan).
 *  4. `evalSiap` + `langkahTerpaksa` — status gagal/dibatalkan ditolak,
 *     data lama (tanpa status) diterima; flag baru + label warisan.
 *  5. `getMoveRating` — eval rusak → `{ moveRating: null, statusEvaluasi:
 *     "gagal" }`, BUKAN "excellent"; warisan `["mate"]` tetap mengalir ke
 *     cabang mate.
 *  6. `parseMove` — langkah paksa tetap DAPAT kualitas + `isForced: true`
 *     (label "forced" tak lagi ditulis); `kritis` tri-state
 *     (true/false/null); skakmat → `["mate","0"]` + "excellent".
 *  7. Pembaca mate-0: `nilaiCentipawn`, `cpKandidat` (antiCheat),
 *     `cpKandidat` (langkahKritis), `evalKeTeks`.
 *  8. Paritas fase: urutan catat-dulu-majukan-kemudian IDENTIK antara
 *     pemindaian Akurasi dan anti-cheat (lihat `mesin/fase.js`).
 *
 * Jalankan: node scripts/uji-evaluasi.mjs
 */
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import {
  STATUS_EVALUASI,
  MATE_DISAMPAIKAN,
  normalisasiEval,
  apakahMateTerminal,
  tandaMate,
  cpBaku,
  evalSiap,
  langkahTerpaksa,
  ratingTampilan,
} from "../src/halaman/Analisa/mesin/evaluasi.js";
import { cpBaku as cpBakuAkurasi } from "../src/halaman/Analisa/mesin/akurasi.js";
import { getMoveRating } from "../src/halaman/Analisa/mesin/penilaian.js";
import { EngineAnalisis, parseMove } from "../src/halaman/Analisa/mesin/engine.js";
import { nilaiCentipawn, cpKandidat as cpKandidatAc, CP_MATE } from "../src/halaman/Analisa/mesin/antiCheat.js";
import { cpKandidat as cpKandidatKritis } from "../src/halaman/Analisa/mesin/langkahKritis.js";
import { evalKeTeks } from "../src/halaman/Analisa/mesin/pgnAnotasi.js";
import {
  DAFTAR_FASE,
  FASE_PEMBUKAAN,
  FASE_MENENGAH,
  FASE_AKHIR,
  isEndOpening,
  isEndMiddlegame,
  faseBerikutnya,
  papanDariFen,
} from "../src/halaman/Analisa/mesin/fase.js";

let lulus = 0;
let gagal = 0;
function hasil(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

/** Engine skrip: `cari()` mengembalikan entri skenario berurutan. */
function engineSkrip(daftar) {
  let i = 0;
  return {
    async cari(fen, { sinyal } = {}) {
      if (sinyal?.aborted) throw Object.assign(new Error("canceled"), { kunci: "canceled" });
      const s = daftar[i++] ?? { staticEval: ["cp", "0"] };
      return {
        staticEval: s.staticEval,
        bestMove: s.bestMove,
        bestMoveCoronation: s.promosi,
        daftarKandidat: s.kandidat ?? [],
      };
    },
    gameBaru() {},
    setop() {},
    hancurkan() {},
  };
}

console.log("== normalisasiEval ==");
hasil("cp utuh → apa adanya", JSON.stringify(normalisasiEval(["cp", "34"])) === '["cp","34"]');
hasil("cp angka (bukan string) → string", JSON.stringify(normalisasiEval(["cp", 34])) === '["cp","34"]');
hasil("cp pecahan → dipotong", JSON.stringify(normalisasiEval(["cp", "34.9"])) === '["cp","34"]');
hasil("mate utuh → apa adanya", JSON.stringify(normalisasiEval(["mate", "2"])) === '["mate","2"]');
hasil('warisan ["mate"] → ["mate","0"]', JSON.stringify(normalisasiEval(["mate"])) === '["mate","0"]');
hasil('["mate",null] → ["mate","0"]', JSON.stringify(normalisasiEval(["mate", null])) === '["mate","0"]');
hasil("[] → null", normalisasiEval([]) === null);
hasil("jenis tak dikenal → null", normalisasiEval(["x", "1"]) === null);
hasil("angka tak terbaca → null", normalisasiEval(["cp", "rusak"]) === null);
hasil("bukan array → null", normalisasiEval("cp") === null && normalisasiEval(null) === null);
hasil('["cp",null] → null (bukan 0!)', normalisasiEval(["cp", null]) === null);
hasil('["cp",undefined]/["cp",""] → null', normalisasiEval(["cp", undefined]) === null && normalisasiEval(["cp", ""]) === null);

console.log("\n== apakahMateTerminal & tandaMate ==");
hasil('["mate"] warisan → terminal', apakahMateTerminal(["mate"]) === true);
hasil('["mate","0"] → terminal', apakahMateTerminal(["mate", "0"]) === true);
hasil('["mate",0] angka → terminal', apakahMateTerminal(["mate", 0]) === true);
hasil('["mate","2"] → bukan terminal', apakahMateTerminal(["mate", "2"]) === false);
hasil('["cp","0"] → bukan terminal', apakahMateTerminal(["cp", "0"]) === false);
hasil("[]/null → bukan terminal", apakahMateTerminal([]) === false && apakahMateTerminal(null) === false);
hasil("tandaMate(2) → +1", tandaMate(2) === 1);
hasil('tandaMate("-3") → −1', tandaMate("-3") === -1);
hasil("tandaMate(0) → −1 (sudah mati, bukan remis)", tandaMate(0) === -1);
hasil('tandaMate("0") → −1', tandaMate("0") === -1);
hasil("tandaMate(rusak) → null", tandaMate("x") === null && tandaMate(undefined) === null && tandaMate(NaN) === null);
hasil("tandaMate(null/\"\") → null (bukan −1)", tandaMate(null) === null && tandaMate("") === null);
hasil("MATE_DISAMPAIKAN = 0", MATE_DISAMPAIKAN === 0);

console.log("\n== cpBaku ==");
hasil('["cp","34"] → 34', cpBaku(["cp", "34"]) === 34);
hasil('balik tanda → −34', cpBaku(["cp", "34"], true) === -34);
hasil('["mate","2"] → +1000', cpBaku(["mate", "2"]) === 1000);
hasil('["mate","-2"] → −1000', cpBaku(["mate", "-2"]) === -1000);
hasil('["mate","0"] → −1000 (bergilir mati)', cpBaku(["mate", "0"]) === -1000);
hasil('["mate","0"] balik → +1000 (pemberi menang)', cpBaku(["mate", "0"], true) === 1000);
hasil('warisan ["mate"] → null (tak cukup info)', cpBaku(["mate"]) === null);
hasil("[]/rusak → null", cpBaku([]) === null && cpBaku(["cp", "x"]) === null);
hasil('["mate","x"] → null (bukan 0!)', cpBaku(["mate", "x"]) === null);
hasil('payload absen → null (["cp",null]/["mate",null])', cpBaku(["cp", null]) === null && cpBaku(["mate", null]) === null);
hasil("plafon ±1000", cpBaku(["cp", "5000"]) === 1000 && cpBaku(["cp", "-5000"]) === -1000);
hasil("akurasi.js mengekspor ulang fungsi yang SAMA", cpBakuAkurasi === cpBaku);

console.log("\n== STATUS_EVALUASI, evalSiap, langkahTerpaksa ==");
hasil("tiga status baku", STATUS_EVALUASI.SIAP === "siap" && STATUS_EVALUASI.GAGAL === "gagal" && STATUS_EVALUASI.DIBATALKAN === "dibatalkan");
hasil("STATUS_EVALUASI dibekukan", Object.isFrozen(STATUS_EVALUASI));
hasil("tanpa status (data lama) → siap", evalSiap({}) === true);
hasil('"siap" → siap', evalSiap({ statusEvaluasi: "siap" }) === true);
hasil('"gagal"/"dibatalkan" → tidak siap', evalSiap({ statusEvaluasi: "gagal" }) === false && evalSiap({ statusEvaluasi: "dibatalkan" }) === false);
hasil("bukan objek → tidak siap", evalSiap(null) === false && evalSiap("x") === false);
hasil("isForced:true → terpaksa", langkahTerpaksa({ isForced: true, moveRating: "best" }) === true);
hasil('label warisan "forced" → terpaksa', langkahTerpaksa({ moveRating: "forced" }) === true);
hasil("label kualitas → tidak terpaksa", langkahTerpaksa({ moveRating: "best" }) === false);
hasil("kosong/null → tidak terpaksa", langkahTerpaksa({}) === false && langkahTerpaksa(null) === false);
hasil('tampil: paksa → "forced"', ratingTampilan({ moveRating: "best", isForced: true }) === "forced");
hasil("tampil: biasa lolos apa adanya", ratingTampilan({ moveRating: "best" }) === "best" && ratingTampilan(undefined) === undefined);

console.log("\n== getMoveRating: gerbang validasi ==");
const EVAL_BAIK = ["cp", "100"];
{
  const r = getMoveRating({ staticEval: [], previousStaticEvals: [EVAL_BAIK], bestMoveSan: "e4", moveSan: "e4", fen: new Chess().fen(), color: "w", sacrifice: false, previousSacrifice: false, openings: {} });
  hasil("eval kini kosong → gagal (bukan excellent)", r.moveRating === null && r.statusEvaluasi === "gagal" && r.commentKey === null, JSON.stringify(r));
}
{
  const r = getMoveRating({ staticEval: EVAL_BAIK, previousStaticEvals: [[]], bestMoveSan: "e4", moveSan: "e4", fen: new Chess().fen(), color: "w", sacrifice: false, previousSacrifice: false, openings: {} });
  hasil("eval lalu kosong → gagal", r.moveRating === null && r.statusEvaluasi === "gagal");
}
{
  const r = getMoveRating({ staticEval: ["cp", "rusak"], previousStaticEvals: [EVAL_BAIK], bestMoveSan: "e4", moveSan: "e4", fen: new Chess().fen(), color: "w", sacrifice: false, previousSacrifice: false, openings: {} });
  hasil("eval tak-terbaca → gagal", r.moveRating === null && r.statusEvaluasi === "gagal");
}
{
  const r = getMoveRating({ staticEval: EVAL_BAIK, previousStaticEvals: "bukan-array", bestMoveSan: "e4", moveSan: "e4", fen: new Chess().fen(), color: "w", sacrifice: false, previousSacrifice: false, openings: {} });
  hasil("riwayat bukan array → gagal (tidak crash)", r.moveRating === null && r.statusEvaluasi === "gagal");
}
{
  // Warisan ["mate"] sebagai eval SESUDAH langkah terbaik → cabang mate.
  const r = getMoveRating({ staticEval: ["mate"], previousStaticEvals: [["cp", "200"]], bestMoveSan: "Qh4#", moveSan: "Qh4#", fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", color: "b", sacrifice: false, previousSacrifice: false, openings: {} });
  hasil('warisan ["mate"] terbaik → best + komentar mate', r.moveRating === "best" && r.commentKey === "mate", JSON.stringify(r));
}
{
  // Mate-0 bukan-terbaik (kedalaman beda) → excellent + komentar mate.
  const r = getMoveRating({ staticEval: ["mate", "0"], previousStaticEvals: [["cp", "100"]], bestMoveSan: "Qg4#", moveSan: "Qh4#", fen: "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3", color: "b", sacrifice: false, previousSacrifice: false, openings: {} });
  hasil('mate-0 → excellent + komentar mate', r.moveRating === "excellent" && r.commentKey === "mate", JSON.stringify(r));
}

console.log("\n== parseMove: paksa, kritis, skakmat ==");
{
  // Hitam Ka8; Putih Kc6 + Ra1 → satu-satunya langkah legal: Kb8.
  const FEN_TERPAKSA = "k7/8/2K5/8/8/8/8/R7 b - - 0 1";
  assert.equal(new Chess(FEN_TERPAKSA).moves().length, 1, "skenario harus tepat 1 langkah legal");
  const catur = new Chess(FEN_TERPAKSA);
  const mv = catur.move("Kb8");
  const mesin = engineSkrip([{ staticEval: ["cp", "500"] }]);
  const r = await parseMove(mesin, 12, mv, new Chess(), [["cp", "0"]], "Kb8", false, {}, () => {}, null, 5, []);
  hasil("langkah paksa DAPAT kualitas (bukan label forced)", typeof r.moveRating === "string" && r.moveRating !== "forced", r.moveRating);
  hasil("langkah paksa → isForced true", r.isForced === true);
  hasil("langkah paksa → status siap", r.statusEvaluasi === "siap");
  hasil("tanpa kandidat → kritis null (tak diketahui)", r.kritis === null);
}
{
  // Kritis: e4 = terbaik, kandidat #2 terpaut jauh, posisi tetap menang.
  const catur = new Chess();
  const mv = catur.move("e4");
  const kandidat = [
    { peringkat: 1, uci: "e2e4", cp: 300, mate: null, wdl: null },
    { peringkat: 2, uci: "d2d4", cp: 0, mate: null, wdl: null },
  ];
  const mesin = engineSkrip([{ staticEval: ["cp", "-200"] }]);
  const r = await parseMove(mesin, 12, mv, new Chess(), [["cp", "50"]], "e4", false, {}, () => {}, null, 5, kandidat);
  hasil("kandidat cukup → kritis boolean true", r.kritis === true, String(r.kritis));
  hasil('kritis mengalir ke label "critical"', r.moveRating === "critical", r.moveRating);
}
{
  // Kandidat #2 tak terbaca → tak diketahui (null), bukan "bukan kritis".
  const catur = new Chess();
  const mv = catur.move("e4");
  const kandidat = [
    { peringkat: 1, uci: "e2e4", cp: 300, mate: null, wdl: null },
    { peringkat: 2, uci: "d2d4", cp: null, mate: null, wdl: null },
  ];
  const mesin = engineSkrip([{ staticEval: ["cp", "-200"] }]);
  const r = await parseMove(mesin, 12, mv, new Chess(), [["cp", "50"]], "e4", false, {}, () => {}, null, 5, kandidat);
  hasil("kandidat #2 rusak → kritis null", r.kritis === null);
}
{
  // Engine tanpa info (staticEval []) → gagal, bukan label palsu.
  const catur = new Chess();
  const mv = catur.move("e4");
  const mesin = engineSkrip([{ staticEval: [] }]);
  const r = await parseMove(mesin, 12, mv, new Chess(), [["cp", "50"]], "e4", false, {}, () => {}, null);
  hasil("eval kosong → moveRating null + gagal", r.moveRating === null && r.statusEvaluasi === "gagal", JSON.stringify({ m: r.moveRating, s: r.statusEvaluasi }));
}
{
  // Skakmat tidak dikirim ke engine; evalnya mate-0.
  const catur = new Chess();
  for (const san of ["f3", "e5", "g4", "Qh4#"]) catur.move(san);
  const mv = catur.history({ verbose: true }).pop();
  const mesin = engineSkrip([{ staticEval: ["cp", "999"] }]);
  const r = await parseMove(mesin, 12, mv, new Chess(), [["cp", "0"]], undefined, false, {}, () => {}, null);
  hasil('skakmat → ["mate","0"]', JSON.stringify(r.previousStaticEvals[0]) === '["mate","0"]');
  hasil("skakmat → bestMove undefined", r.bestMove === undefined);
  hasil('skakmat → excellent + siap', r.moveRating === "excellent" && r.statusEvaluasi === "siap", `${r.moveRating}/${r.statusEvaluasi}`);
}

console.log("\n== pembaca mate-0 ==");
hasil("CP_MATE = 10000", CP_MATE === 10000);
hasil('nilaiCentipawn mate-0 → −10000', nilaiCentipawn(["mate", "0"]) === -10000);
hasil('nilaiCentipawn ["mate"] warisan → null', nilaiCentipawn(["mate"]) === null);
hasil('nilaiCentipawn payload absen → null', nilaiCentipawn(["mate", null]) === null && nilaiCentipawn(["cp", null]) === null);
hasil('nilaiCentipawn mate+3 → +10000', nilaiCentipawn(["mate", "3"]) === 10000);
hasil("cpKandidat antiCheat mate 0 → −10000", cpKandidatAc({ cp: null, mate: 0 }) === -10000);
hasil("cpKandidat antiCheat mate rusak → null (bukan NaN)", cpKandidatAc({ cp: null, mate: "rusak" }) === null);
hasil("cpKandidat langkahKritis mate 0 → −1000", cpKandidatKritis({ cp: null, mate: 0 }) === -1000);
hasil('evalKeTeks mate-0 putih melangkah → "#0"', evalKeTeks(["mate", "0"], "w") === "#0");
hasil('evalKeTeks mate-0 hitam melangkah → "-#0"', evalKeTeks(["mate", "0"], "b") === "-#0");

console.log("\n== EngineAnalisis.cari: info worker → eval baku ==");
// Regresi: info Stockfish memakai `mate: null` untuk posisi cp biasa —
// pemetaan TIDAK BOLEH membaca null sebagai 0 (mate-0 = skakmat!).
{
  const cariDengan = async (info) => {
    const mesin = new EngineAnalisis({ kedalaman: 10 });
    mesin.engine.cari = async () => ({ uci: "e2e4", info, daftarPv: [] });
    mesin.siapkan = async () => {};
    return mesin.cari("fen-uji", {});
  };
  const cp = await cariDengan({ kedalaman: 10, cp: 34, mate: null, pv: [], adaBatas: false });
  hasil("cp 34 + mate null → [\"cp\",\"34\"]", JSON.stringify(cp.staticEval) === '["cp","34"]', JSON.stringify(cp.staticEval));
  const mate = await cariDengan({ kedalaman: 10, cp: null, mate: 5, pv: [], adaBatas: false });
  hasil("mate 5 → [\"mate\",\"5\"]", JSON.stringify(mate.staticEval) === '["mate","5"]');
  const mate0 = await cariDengan({ kedalaman: 10, cp: null, mate: 0, pv: [], adaBatas: false });
  hasil("mate 0 (angka, bukan null) → [\"mate\",\"0\"]", JSON.stringify(mate0.staticEval) === '["mate","0"]');
  const kosong = await cariDengan({ kedalaman: 10, cp: null, mate: null, pv: [], adaBatas: false });
  hasil("cp+mate null → [] (ditolak gerbang hilir)", JSON.stringify(kosong.staticEval) === "[]");
  const tanpaInfo = await cariDengan(null);
  hasil("info null → []", JSON.stringify(tanpaInfo.staticEval) === "[]");
  const aneh = await cariDengan({ kedalaman: 10, cp: "x", mate: undefined, pv: [], adaBatas: false });
  hasil("skor tak-terbaca → [] (bukan string sampah)", JSON.stringify(aneh.staticEval) === "[]", JSON.stringify(aneh.staticEval));
}

console.log("\n== paritas fase (catat-dulu-majukan-kemudian) ==");
hasil("urutan fase tetap", JSON.stringify(DAFTAR_FASE) === '["opening","middlegame","endgame"]');
{
  // Partai acak DETERMINISTIK (seed 42: menyentuh ketiga fase dalam 200 ply).
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rnd = mulberry(42);
  const catur = new Chess();
  const daftarFen = [catur.fen()];
  while (!catur.isGameOver() && daftarFen.length < 200) {
    const legal = catur.moves();
    catur.move(legal[Math.floor(rnd() * legal.length)]);
    daftarFen.push(catur.fen());
  }
  // Bentuk pemindaian playersAccuracy.jsx: catat ke fase aktif, BARU majukan.
  const urutAkurasi = [];
  let faseA = FASE_PEMBUKAAN;
  for (const fen of daftarFen) {
    const papan = new Chess(fen).board();
    urutAkurasi.push(faseA);
    if (faseA === FASE_PEMBUKAAN && isEndOpening(papan)) faseA = FASE_MENENGAH;
    else if (faseA === FASE_MENENGAH && isEndMiddlegame(papan)) faseA = FASE_AKHIR;
  }
  // Bentuk pemindaian antiCheat.js: catat, lalu faseBerikutnya.
  const urutAc = [];
  let faseB = FASE_PEMBUKAAN;
  for (const fen of daftarFen) {
    urutAc.push(faseB);
    faseB = faseBerikutnya(faseB, papanDariFen(fen));
  }
  hasil("kedua pemindaian menandai fase yang SAMA PERSIS", JSON.stringify(urutAkurasi) === JSON.stringify(urutAc));
  hasil("partai menyentuh ketiga fase", urutAkurasi.includes(FASE_PEMBUKAAN) && urutAkurasi.includes(FASE_MENENGAH) && urutAkurasi.includes(FASE_AKHIR), [...new Set(urutAkurasi)].join(","));
}
hasil("posisi awal = pembukaan (belum berakhir)", isEndOpening(new Chess().board()) === false);
hasil("akhir bidak+menteri = menengah berakhir", isEndMiddlegame(new Chess("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1").board()) === true);
hasil("faseBerikutnya satu arah (akhir tak kembali)", faseBerikutnya(FASE_AKHIR, new Chess().board()) === FASE_AKHIR);
hasil("faseBerikutnya null → fase tetap", faseBerikutnya(FASE_PEMBUKAAN, null) === FASE_PEMBUKAAN);
hasil("papanDariFen rusak → null", papanDariFen("") === null && papanDariFen("bukan-fen") === null);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
