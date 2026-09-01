/**
 * Mesin analisis halaman Analisa.
 *
 * INI BAGIAN YANG DITUKAR dari Brilliant-Chess. Upstream membuka worker
 * Stockfish miliknya sendiri, mengirim `go depth` mentah, lalu membaca ulang
 * semua pesan worker dengan `addEventListener` — antreannya balapan, dan
 * skor dibaca dari potongan teks UCI yang rapuh. Di proyek ini analisis
 * dijalankan lewat engine lokal yang sudah dipakai halaman Papan Interaktif
 * dan Teka-Teki: `src/lib/engineCatur.js` (Stockfish WASM di `public/engines`).
 *
 * Bentuk fungsi (`parsePGN`, `parseMove`, `parsePosition`, `formatSquare`, …)
 * sengaja dipertahankan seperti upstream supaya komponen UI hasil port tidak
 * perlu ditulis ulang; yang berubah hanya cara engine-nya bicara.
 *
 * Konvensi angka mengikuti upstream: `staticEval = ["cp", "34"]` atau
 * `["mate", "2"]`, relatif terhadap pihak yang bergilir (konvensi UCI), dan
 * dipakai apa adanya oleh ./penilaian.js.
 */

import { Chess } from "chess.js";
import { EngineCatur, cariEngine } from "../../../lib/engineCatur.js";
import { hashUntukEngine } from "./cekWasm.js";
import { getMoveRating, invertColor, isForced, isSacrifice } from "./penilaian.js";

const HURUF_PAPAN = "abcdefgh".split("");

export const GALAT_BATAL = "canceled";
export const GALAT_PGN = "pgn";
export const GALAT_FEN = "fen";
/** Engine mati / worker gagal di tengah analisis (bukan pembatalan pengguna). */
export const GALAT_MESIN = "mesin";

export function galat(pesan) {
  const e = new Error(pesan);
  e.kunci = pesan;
  return e;
}

/* ------------------------------------------------------------- kotak */

export function formatSquare(kotak) {
  return { col: HURUF_PAPAN.indexOf(kotak[0]), row: Number(kotak[1]) - 1 };
}

export function deformatSquare({ col, row }) {
  return `${HURUF_PAPAN[col]}${row + 1}`;
}

export { invertColor };

export function getCastle(san) {
  return san === "O-O" ? "k" : san === "O-O-O" ? "q" : undefined;
}

/** Langkah UCI (dari engine) → SAN, agar bisa dibandingkan dengan langkah pemain. */
export function moveToSan(move, coronation, fen) {
  if (!move || !move.length) return "";
  try {
    const chess = new Chess(fen);
    return chess.move({
      from: deformatSquare(move[0]),
      to: deformatSquare(move[1]),
      promotion: coronation,
    }).san;
  } catch {
    return "";
  }
}

/* --------------------------------------------------------------- engine */

export class EngineAnalisis {
  /**
   * @param {{idEngine?: string, kedalaman?: number, threads?: number}} [opsi]
   */
  constructor({ idEngine, kedalaman = 13, threads = 1 } = {}) {
    const pilihan = cariEngine(idEngine);
    this.idEngine = pilihan.id;
    this.labelEngine = pilihan.label;
    this.kedalaman = kedalaman;
    this.memuat = null;
    this.engine = new EngineCatur({ url: pilihan.url, hash: hashUntukEngine(), threads });
  }

  /** Unduh worker + tunggu "readyok". Boleh dipanggil berulang. */
  siapkan() {
    this.memuat ||= this.engine.mulai();
    return this.memuat;
  }

  /**
   * Analisis satu posisi. Beresolusi setelah engine menerbitkan "bestmove",
   * sehingga pencarian berikutnya selalu memakai tabel hash yang sudah panas.
   * `sinyal` (AbortSignal) menghentikan pencarian aktif bila pengguna batal.
   */
  async cari(fen, { kedalaman = this.kedalaman, sinyal = null } = {}) {
    if (sinyal?.aborted) throw galat(GALAT_BATAL);
    await this.siapkan();

    const hentikan = () => this.engine.setop();
    if (sinyal) sinyal.addEventListener("abort", hentikan, { once: true });

    let hasil;
    try {
      hasil = await this.engine.cari({ fen, kedalaman });
    } finally {
      if (sinyal) sinyal.removeEventListener("abort", hentikan);
    }

    if (sinyal?.aborted) throw galat(GALAT_BATAL);

    const { uci, info } = hasil;
    const staticEval = info
      ? info.mate !== null
        ? ["mate", String(info.mate)]
        : ["cp", String(info.cp)]
      : [];
    const langkah = uci && uci !== "(none)" ? uci : null;

    return {
      staticEval,
      bestMove: langkah ? [formatSquare(langkah.slice(0, 2)), formatSquare(langkah.slice(2, 4))] : undefined,
      bestMoveCoronation: langkah && langkah.length > 4 ? langkah[4] : undefined,
      kedalamanTercapai: info?.kedalaman ?? 0,
      pv: info?.pv ?? [],
    };
  }

  /** Mulai partai baru: buang tabel hash supaya tidak tercampur. */
  gameBaru() {
    this.engine.gameBaru();
  }

  setop() {
    this.engine.setop();
  }

  /** Bebaskan worker (panggil saat halaman ditutup). */
  hancurkan() {
    this.engine.tamat();
    this.memuat = null;
  }
}

/* ------------------------------------------------------------- metadata */

const TANPA_NAMA = "Unknown";
const TANPA_ELO = "NOELO";

function getPlayers(headers) {
  return [
    { name: headers.White ?? TANPA_NAMA, elo: headers.WhiteElo ?? TANPA_ELO },
    { name: headers.Black ?? TANPA_NAMA, elo: headers.BlackElo ?? TANPA_ELO },
  ];
}

/**
 * "300+3" → 300, "15" → 900 (detik per pemain, taksiran lama upstream),
 * "-" → 0. Upstream memakai Number() mentah sehingga kontrol waktu increment
 * menjadi NaN dan jam di papan menampilkan angka aneh.
 */
export function waktuDariPgn(headers) {
  const kendali = String(headers.TimeControl ?? "").trim();
  if (!kendali || kendali === "-") return 0;
  const [dasar] = kendali.split("+");
  const angka = Number(dasar);
  return Number.isFinite(angka) ? angka : 0;
}

function getResult(headers, pgn) {
  if (headers.Result && headers.Result !== "*") return headers.Result;
  const akhir = pgn.trim().split(/\s+/).pop() ?? "";
  return ["1-0", "0-1", "1/2-1/2", "*"].includes(akhir) ? akhir : "";
}

/** Buang komentar `{…}` dan kolom `%` yang kadang membuat parser menolak. */
function bersihkanPgn(pgn) {
  return pgn
    .replace(/^\s*%.*$/gm, "")
    .replace(/\{[^{}]*\}/gs, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Muat PGN; kalau mentahnya ditolak, coba lagi versi yang sudah dibersihkan. */
function muatPgn(chess, rawPgn) {
  try {
    chess.loadPgn(rawPgn, { strict: false });
    return rawPgn;
  } catch (galatAsli) {
    try {
      chess.loadPgn(bersihkanPgn(rawPgn), { strict: false });
      return rawPgn;
    } catch {
      throw galatAsli;
    }
  }
}

/* ------------------------------------------------------------ per langkah */

/** Posisi sebelum langkah pertama dianalisis agar rating langkah 1 adil. */
export async function parsePosition(mesin, chess, depth, sinyal, handleAbort) {
  const fen = chess.fen();
  const color = chess.turn();

  let hasil;
  try {
    hasil = await mesin.cari(fen, { kedalaman: depth, sinyal });
  } catch (e) {
    // Pembatalan oleh pengguna → serahkan ke handleAbort (menghentikan
    // seluruh alur). Kegagalan engine yang sesungguhnya TIDAK boleh
    // menyamar jadi "canceled": kalau ditelan di sini, halaman kembali ke
    // formulir tanpa pesan apa pun dan tampak seperti tombolnya mati.
    if (sinyal?.aborted || e?.kunci === GALAT_BATAL) {
      handleAbort?.();
      hasil = { staticEval: [], bestMove: undefined, bestMoveCoronation: undefined };
    } else {
      throw galat(GALAT_MESIN);
    }
  }

  const { staticEval, bestMove, bestMoveCoronation } = hasil;

  return {
    fen,
    bestMove,
    bestMoveSan: bestMove ? moveToSan(bestMove, bestMoveCoronation, fen) : undefined,
    color,
    previousStaticEvals: [staticEval],
  };
}

export async function parseMove(mesin, depth, move, chess, previousStaticEvals, previousBestMoveSan, previousSacrifice, openings, handleAbort, sinyal) {
  if (sinyal?.aborted) handleAbort?.();

  const movement = [move.from, move.to].map((kotak) => formatSquare(kotak));

  const fen = move.after;
  chess.load(fen);

  const color = invertColor(move.color);
  const capture = move.captured;
  const san = move.san;
  const castle = getCastle(move.san);

  let staticEval;
  let bestMove;
  let bestMoveCoronation;
  let sacrifice = false;
  let forced = false;

  if (chess.isGameOver()) {
    // Posisi mati: engine tidak punya langkah lagi. Upstream hanya menangani
    // skakmat sehingga remis (pat/stalemate) ikut "dianalisis" dan menghasilkan
    // skor kosong — di sini keduanya dipotong dengan eval yang benar.
    sacrifice = false;
    staticEval = chess.isCheckmate() ? ["mate"] : ["cp", "0"];
    bestMove = undefined;
    bestMoveCoronation = undefined;
  } else {
    sacrifice = move.promotion ? false : isSacrifice(move);

    try {
      ({ staticEval, bestMove, bestMoveCoronation } = await mesin.cari(fen, { kedalaman: depth, sinyal }));
    } catch (e) {
      // Lihat catatan yang sama di parsePosition: hanya pembatalan yang
      // boleh ditelan, kegagalan engine harus terlihat oleh pengguna.
      if (sinyal?.aborted || e?.kunci === GALAT_BATAL) {
        handleAbort?.();
        bestMove = undefined;
        bestMoveCoronation = undefined;
        staticEval = [];
      } else {
        throw galat(GALAT_MESIN);
      }
    }

    if (sinyal?.aborted) handleAbort?.();
    forced = isForced(move);
  }

  const penilaian = forced
    ? { moveRating: "forced", commentKey: "forced", commentIndex: 0 }
    : getMoveRating({
        staticEval,
        previousStaticEvals,
        bestMoveSan: previousBestMoveSan ?? "",
        moveSan: move.san,
        fen,
        color: move.color,
        sacrifice,
        previousSacrifice,
        openings,
      });

  const bestMoveSan = bestMove ? moveToSan(bestMove, bestMoveCoronation, fen) : undefined;

  return {
    color,
    capture,
    san,
    castle,
    ...penilaian,
    bestMove,
    bestMoveSan,
    fen,
    sacrifice,
    movement,
    // Hanya 4 evaluasi terakhir yang dibaca ./penilaian.js; dipotong supaya
    // analisis partai panjang tidak menyalin seluruh riwayat tiap langkah.
    previousStaticEvals: [staticEval, ...previousStaticEvals].slice(0, 4),
  };
}

/**
 * Analisis seluruh partai PGN, langkah demi langkah.
 * Progres dilaporkan dalam persen (0–100) untuk bilah muat.
 */
export async function parsePGN(mesin, rawPgn, depth, openings, setProgress, sinyal) {
  const chess = new Chess();

  let pgn;
  try {
    pgn = muatPgn(chess, rawPgn);
  } catch {
    throw galat(GALAT_PGN);
  }

  const riwayat = chess.history({ verbose: true });
  if (!riwayat.length) throw galat(GALAT_PGN);

  const headers = chess.header();
  const metadata = {
    players: getPlayers(headers),
    time: waktuDariPgn(headers),
    result: getResult(headers, pgn),
  };

  const hentikan = () => mesin.setop();
  if (sinyal) sinyal.addEventListener("abort", hentikan, { once: true });

  const moves = [];
  let previousStaticEvals = [];
  let previousBestMoveSan;
  let previousSacrifice = false;

  /** Menghentikan seluruh loop analisis dengan rapi (dipakai tombol Batal). */
  const gagalkan = () => {
    throw galat(GALAT_BATAL);
  };

  try {
    mesin.gameBaru();

    // Langkah pembuka dianalisis dari posisi awal supaya diff eval langkah
    // pertama punya pembanding.
    const chessAwal = new Chess(riwayat[0].before);
    const awal = await parsePosition(mesin, chessAwal, depth, sinyal, gagalkan);
    moves.push(awal);
    previousStaticEvals = awal.previousStaticEvals;
    previousBestMoveSan = awal.bestMoveSan;

    for (let i = 0; i < riwayat.length; i++) {
      if (sinyal?.aborted) throw galat(GALAT_BATAL);

      const move = riwayat[i];

      const dianalisis = await parseMove(
        mesin,
        depth,
        move,
        new Chess(),
        previousStaticEvals,
        previousBestMoveSan,
        previousSacrifice,
        openings,
        gagalkan,
        sinyal
      );

      if (sinyal?.aborted) throw galat(GALAT_BATAL);

      moves.push(dianalisis);
      previousStaticEvals = dianalisis.previousStaticEvals;
      previousBestMoveSan = dianalisis.bestMoveSan;
      previousSacrifice = dianalisis.sacrifice ?? false;

      setProgress(((i + 1) / riwayat.length) * 100);
    }
  } finally {
    if (sinyal) sinyal.removeEventListener("abort", hentikan);
    setProgress(0);
  }

  return { metadata, moves };
}
