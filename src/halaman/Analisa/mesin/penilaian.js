/**
 * Penilaian langkah untuk fitur Analisa.
 *
 * Bagian ini adalah terjemahan (alih-bahasa, bukan alih-engine) logika
 * penilaian Brilliant-Chess (MIT, © 2025 Delo) — FILE `src/engine/stockfish.ts`
 * upstream, bagian yang TIDAK berhubungan dengan komunikasi engine:
 * klasifikasi brilliant/great/best/excellent/good/book/inaccuracy/mistake/
 * miss/blunder/forced, deteksi pengorbanan (sacrifice), dan langkah paksa.
 *
 * Yang sengaja TIDAK dibawa: muat-worker Stockfish, parsing baris UCI, dan
 * "go depth" mentah — itu bagian yang di proyek ini ditangani engine lokal
 * (lihat `src/lib/engineCatur.js` dan `./engine.js`).
 *
 * Semua fungsi di sini murni: menerima hasil evaluasi, mengembalikan label.
 * Teks komentar tidak disimpan sebagai string mentah, melainkan sebagai
 * kunci kamus (`commentKey` + `commentIndex`) agar bisa ikut i18n.
 */

import { BISHOP, Chess, KNIGHT, PAWN, QUEEN, ROOK } from "chess.js";

/** Daftar kunci komentar → `analisa.komentar.<kunci>` di kamus terjemahan. */
export const KUNCI_KOMENTAR = [
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
  "inaccuracy",
  "blunder",
  "mate",
  "mateIn",
  "delayMate",
  "advanceMate",
  "loseAdvantage",
  "giveAdvantage",
  "gettingMated",
  "missMate",
  "missAdvantage",
  "forced",
];

/** Jumlah varian kalimat per kunci (harus sama dengan panjang array kamus). */
export const JUMLAH_VARIAN = 3;

export function invertColor(warna) {
  return warna === "w" ? "b" : "w";
}

function angkaAcak(batas) {
  return Math.floor(Math.random() * batas);
}

/**
 * Inti klasifikasi. `staticEval` dan isi `previousStaticEvals` memakai bentuk
 * keluaran UCI mentah: `["cp", "34"]` atau `["mate", "2"]`, relatif terhadap
 * pihak yang BERGILIR pada posisi tersebut (konvensi upstream, jangan diubah
 * tanpa menyesuaikan seluruh ambang di bawah).
 */
export function getMoveRating({
  staticEval,
  previousStaticEvals,
  bestMoveSan,
  moveSan,
  fen,
  color,
  sacrifice,
  previousSacrifice,
  openings,
}) {
  // Salinan kerja: upstream menulis padding langsung ke argumen, yang berarti
  // state React milik pemanggil ikut berubah diam-diam.
  const riwayat = previousStaticEvals.slice(0, 4);
  for (let i = 0; i < 4; i++) if (riwayat[i] === undefined) riwayat[i] = [];

  const winning = Number(staticEval[1]) < 0;
  const previousWinig = Number(riwayat[0][1]) > 0;

  const previousColor = invertColor(color);

  const commentNumber = angkaAcak(JUMLAH_VARIAN);

  function komentar(kunci) {
    return { commentKey: kunci, commentIndex: commentNumber };
  }

  function getStandardRating(diff) {
    let rating = "excellent";
    if (diff >= 0.4) rating = "good";
    if (diff >= 0.8) rating = "inaccuracy";
    if (diff >= 4) rating = "blunder";
    return rating;
  }

  function losingGeatAdvantage(evaluation, previousEvaluation, warna) {
    const GREAT_ADVANTAGE = 2;
    if (warna === "w") {
      return previousEvaluation >= GREAT_ADVANTAGE && evaluation < GREAT_ADVANTAGE;
    }
    return previousEvaluation <= -GREAT_ADVANTAGE && evaluation > -GREAT_ADVANTAGE;
  }

  function givingGeatAdvantage(evaluation, previousEvaluation, warna) {
    const GREAT_ADVANTAGE = -2;
    if (warna === "w") {
      return previousEvaluation >= GREAT_ADVANTAGE && evaluation < GREAT_ADVANTAGE;
    }
    return previousEvaluation <= -GREAT_ADVANTAGE && evaluation > -GREAT_ADVANTAGE;
  }

  function keepMating(mateIn, previousMateIn, warna) {
    if (warna === "w") return mateIn < previousMateIn;
    return mateIn > previousMateIn;
  }

  function advanceMate(mateIn, previousMateIn, warna) {
    if (warna === "w") return mateIn > previousMateIn;
    return mateIn < previousMateIn;
  }

  function getPreviousStaticEvalAmount(number) {
    const checkColor = number % 2 === 0 ? "b" : "w";
    return (Number(riwayat[number][1]) / 100) * (color === checkColor ? -1 : 1);
  }

  const staticEvalAmount = (Number(staticEval[1]) / 100) * (color === "w" ? -1 : 1);

  function getWasNotMateRelated(number) {
    return riwayat[number][0] !== "mate" && riwayat[number + 1][0] !== "mate";
  }

  const isNotMateRelated = staticEval[0] !== "mate" && riwayat[0][0] !== "mate";

  // Langkah buku: nama pembukaan dari posisi (lihat ./buku.js).
  const openingName = typeof openings === "function" ? openings(fen) : openings && openings[fen];
  if (openingName) return { moveRating: "book", comment: openingName };

  function getPreviousStandardRating(number) {
    return getStandardRating(getPreviousEvaluationDiff(number));
  }

  function getPreviousEvaluationDiff(number) {
    const checkColor = number % 2 === 0 ? "b" : "w";
    return color === checkColor
      ? getPreviousStaticEvalAmount(number + 1) - getPreviousStaticEvalAmount(number)
      : getPreviousStaticEvalAmount(number) - getPreviousStaticEvalAmount(number + 1);
  }

  const evaluationDiff =
    color === "w"
      ? getPreviousStaticEvalAmount(0) - staticEvalAmount
      : staticEvalAmount - getPreviousStaticEvalAmount(0);
  const standardRating = getStandardRating(evaluationDiff);

  const previousMistake =
    getWasNotMateRelated(0) &&
    getWasNotMateRelated(1) &&
    getPreviousStandardRating(0) === "inaccuracy" &&
    getPreviousEvaluationDiff(0) >= 1.2 &&
    (losingGeatAdvantage(getPreviousStaticEvalAmount(0), getPreviousStaticEvalAmount(1), previousColor) ||
      givingGeatAdvantage(getPreviousStaticEvalAmount(0), getPreviousStaticEvalAmount(1), previousColor));

  const previousPreviousMistake =
    getWasNotMateRelated(1) &&
    getWasNotMateRelated(2) &&
    getPreviousStandardRating(1) === "inaccuracy" &&
    getPreviousEvaluationDiff(1) >= 1.2 &&
    (losingGeatAdvantage(getPreviousStaticEvalAmount(1), getPreviousStaticEvalAmount(2), color) ||
      givingGeatAdvantage(getPreviousStaticEvalAmount(1), getPreviousStaticEvalAmount(2), color));

  const previousMiss =
    getWasNotMateRelated(0) &&
    (previousPreviousMistake || getPreviousStandardRating(1) === "blunder") &&
    (getPreviousStandardRating(0) === "blunder" || getPreviousStandardRating(0) === "inaccuracy") &&
    getPreviousEvaluationDiff(0) <= getPreviousEvaluationDiff(1) + 0.5;

  // brilliant — pengorbanan
  const previousBrilliant =
    getWasNotMateRelated(0) && previousSacrifice && getPreviousStandardRating(0) === "excellent";
  if (
    !previousBrilliant &&
    isNotMateRelated &&
    standardRating === "excellent" &&
    sacrifice &&
    (getPreviousStandardRating(0) === "inaccuracy" ||
      getPreviousStandardRating(0) === "blunder" ||
      (!(getPreviousStandardRating(1) === "inaccuracy" || getPreviousStandardRating(1) === "blunder") &&
        (getPreviousStandardRating(2) === "inaccuracy" || getPreviousStandardRating(2) === "blunder")))
  ) {
    return { moveRating: "brilliant", ...komentar("brilliant") };
  }

  // brilliant — memulai rangkaian skakmat
  if (sacrifice && riwayat[0][0] !== "mate" && staticEval[0] === "mate" && winning) {
    return { moveRating: "brilliant", ...komentar("brilliant") };
  }

  // brilliant — langkah tepat menuju skakmat
  if (
    sacrifice &&
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    keepMating(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    winning
  ) {
    return { moveRating: "brilliant", ...komentar("brilliant") };
  }

  // great — menghukum kesalahan lawan
  if (
    !previousMiss &&
    getWasNotMateRelated(0) &&
    isNotMateRelated &&
    standardRating === "excellent" &&
    (previousMistake || getPreviousStandardRating(0) === "blunder")
  ) {
    return { moveRating: "great", ...komentar("great") };
  }

  // best — sama dengan usulan engine
  const isBest = bestMoveSan === moveSan;
  if (isBest && staticEval[0] === "mate" && !staticEval[1]) {
    return { moveRating: "best", ...komentar("mate") };
  }
  if (isBest) return { moveRating: "best", ...komentar("best") };

  // excellent — skakmat sudah pasti
  if (staticEval[0] === "mate" && !staticEval[1]) return { moveRating: "excellent", ...komentar("mate") };

  // excellent — memulai skakmat
  if (riwayat[0][0] !== "mate" && staticEval[0] === "mate" && winning) {
    return { moveRating: "excellent", ...komentar("mateIn") };
  }

  // excellent — langkah tepat menuju skakmat
  if (
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    keepMating(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    winning
  ) {
    return { moveRating: "excellent", ...komentar("mateIn") };
  }

  // good — menunda skakmat
  if (
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    !keepMating(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    winning
  ) {
    return { moveRating: "good", ...komentar("delayMate") };
  }

  // good — mempercepat skakmat sendiri
  if (
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    advanceMate(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    !winning
  ) {
    return { moveRating: "good", ...komentar("advanceMate") };
  }

  // miss — melewatkan skakmat
  if (riwayat[0][0] === "mate" && staticEval[0] !== "mate" && previousWinig) {
    return { moveRating: "miss", ...komentar("missMate") };
  }

  // miss — melewatkan kesempatan advantage
  if (
    !previousMiss &&
    isNotMateRelated &&
    (previousMistake || getPreviousStandardRating(0) === "blunder") &&
    (standardRating === "blunder" || standardRating === "inaccuracy") &&
    evaluationDiff <= getPreviousEvaluationDiff(0) + 0.5
  ) {
    return { moveRating: "miss", ...komentar("missAdvantage") };
  }

  // mistake — kehilangan advantage
  if (
    isNotMateRelated &&
    standardRating === "inaccuracy" &&
    evaluationDiff >= 1.2 &&
    losingGeatAdvantage(staticEvalAmount, getPreviousStaticEvalAmount(0), color)
  ) {
    return { moveRating: "mistake", ...komentar("loseAdvantage") };
  }

  // mistake — memberikan advantage ke lawan
  if (
    isNotMateRelated &&
    standardRating === "inaccuracy" &&
    evaluationDiff >= 1.2 &&
    givingGeatAdvantage(staticEvalAmount, getPreviousStaticEvalAmount(0), color)
  ) {
    return { moveRating: "mistake", ...komentar("giveAdvantage") };
  }

  // mistake — mulai terserang skakmat
  if (
    riwayat[0][0] !== "mate" &&
    staticEval[0] === "mate" &&
    !winning &&
    (color === "w" ? getPreviousStaticEvalAmount(0) <= -2 : getPreviousStaticEvalAmount(0) >= 2)
  ) {
    return { moveRating: "mistake", ...komentar("gettingMated") };
  }

  // blunder — menyerahkan skakmat
  if (
    (riwayat[0][0] !== "mate" && staticEval[0] === "mate" && !winning) ||
    (riwayat[0][0] === "mate" && staticEval[0] === "mate" && !winning && previousWinig)
  ) {
    return { moveRating: "blunder", ...komentar("gettingMated") };
  }

  return { moveRating: standardRating, ...komentar(standardRating) };
}

/* ------------------------------------------------------ deteksi khusus */

function getAttackersDefenders(chess, warna, ke) {
  const attackers = chess.attackers(ke, invertColor(warna));
  const legalAttackers = attackers.filter(
    (penyerang) => chess.moves({ verbose: true }).findIndex((m) => m.from === penyerang && m.to === ke) !== -1
  );
  const legalAttackersPieces = legalAttackers.map((kotak) => chess.get(kotak));

  let defenders, legalDefenders, legalDefendersPieces;
  if (attackers.length === 1) {
    const testChess = new Chess(chess.fen());
    try {
      testChess.move({ from: attackers[0], to: ke });
    } catch {
      /* bisa jadi langkah ilegal — hanya dipakai untuk uji serangan */
    }

    defenders = testChess.attackers(ke, warna);
    legalDefenders = defenders.filter(
      (pembela) =>
        testChess.moves({ verbose: true }).findIndex((m) => m.from === pembela && m.to === ke) !== -1
    );
    legalDefendersPieces = legalDefenders.map((kotak) => chess.get(kotak));
  } else {
    defenders = chess.attackers(ke, warna);
    legalDefenders = defenders.filter((pembela) => {
      for (const penyerang of legalAttackers) {
        const testChess = new Chess(chess.fen());
        try {
          testChess.move({ from: penyerang, to: ke });
        } catch {
          /* sama seperti di atas */
        }
        if (testChess.moves({ verbose: true }).findIndex((m) => m.from === pembela && m.to === ke) === -1) {
          return false;
        }
      }
      return true;
    });
    legalDefendersPieces = legalDefenders.map((kotak) => chess.get(kotak));
  }

  return {
    attackers: { squares: legalAttackers, pieces: legalAttackersPieces, length: legalAttackers.length },
    defenders: { squares: legalDefenders, pieces: legalDefendersPieces, length: legalDefenders.length },
  };
}

function couldBeSaved(chess, kotak, warna) {
  if (!chess.attackers(kotak, warna).length) {
    for (const m of chess.moves({ verbose: true })) {
      if (m.from !== kotak) return true;
    }
  } else {
    for (const m of chess.moves({ verbose: true, square: kotak })) {
      const testChess = new Chess(m.after);
      if (!testChess.attackers(m.to, warna).length) return true;
    }
  }
  return false;
}

/**
 * Apakah bidak yang baru dimainkan (atau bidak yang ditinggalkan di kotaknya)
 * bisa diselamatkan namun sengaja dikorbankan? Dipakai untuk label brilliant.
 */
export function isSacrifice(move) {
  const chess = new Chess(move.after);
  const chessBefore = new Chess(move.before);

  const sacrifying = [];

  for (const row of chess.board()) {
    for (const kotak of row) {
      if (!kotak || kotak.type === PAWN) continue;
      if (kotak.color !== move.color) continue;

      const { attackers, defenders } = getAttackersDefenders(chess, move.color, kotak.square);

      if (!defenders.length && attackers.length && (!move.captured || move.captured === PAWN)) {
        sacrifying.push(kotak);
        continue;
      }
      if (
        (kotak.type === KNIGHT || kotak.type === BISHOP) &&
        !move.captured &&
        attackers.pieces.findIndex((p) => p?.type === PAWN) !== -1
      ) {
        sacrifying.push(kotak);
        continue;
      }
      if (
        kotak.type === ROOK &&
        attackers.length &&
        move.captured !== ROOK &&
        move.captured !== QUEEN &&
        !(attackers.length === 1 && (attackers.pieces[0]?.type === QUEEN || attackers.pieces[0]?.type === ROOK) && defenders.length) &&
        !(defenders.length && (move.captured === KNIGHT || move.captured === BISHOP))
      ) {
        sacrifying.push(kotak);
        continue;
      }
      if (
        kotak.type === QUEEN &&
        attackers.length &&
        move.captured !== QUEEN &&
        !(attackers.length === 1 && attackers.pieces[0]?.type === QUEEN && defenders.length) &&
        !(attackers.length === 1 && attackers.pieces[0]?.type === ROOK && move.captured === ROOK && defenders.length)
      ) {
        sacrifying.push(kotak);
        continue;
      }
    }
  }

  for (const kotak of sacrifying) {
    const sebelum =
      chessBefore.get(kotak.square)?.color === chess.get(kotak.square)?.color &&
      chessBefore.get(kotak.square)?.type === chess.get(kotak.square)?.type
        ? kotak.square
        : move.from;

    if (couldBeSaved(chessBefore, sebelum, invertColor(move.color))) return true;
  }

  return false;
}

/** Hanya satu langkah legal ⇒ pemain tidak punya pilihan (label "forced"). */
export function isForced(move) {
  const chess = new Chess(move.before);
  return chess.moves().length === 1;
}
