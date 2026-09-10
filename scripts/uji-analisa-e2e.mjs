/**
 * Uji alur IMPOR PGN halaman Analisa dengan engine Stockfish RIIL.
 *
 * Fungsi yang diuji adalah `parsePGN` asli dari
 * `src/halaman/Analisa/mesin/engine.js` — kode yang sama persis yang
 * dijalankan halaman /analisa saat pengguna menempel PGN lalu menekan
 * "Analisa" — hanya engine-nya diganti subclass lokal yang memproses
 * Stockfish WASM sesungguhnya lewat UCI (lihat scripts/engine-uci-node.mjs).
 *
 * Yang dicek:
 *   1. PGN valid (Scholar's Mate, 1-0): metadata pemain/waktu/hasil, jumlah
 *      langkah, evaluasi tiap posisi tidak kosong, posisi skakmat terdeteksi,
 *      dan eval skakmat-satu muncul tepat sebelum langkah skakmat.
 *   2. Konvensi evaluasi putih/hitam pada partai HITS (Fool's Mate, 0-1):
 *      eval di posisi yang giliran HITAM bernilai UCI positif, dan konversi
 *      sudut pandang putih (faktor -1, seperti komponen Evaluation) negatif.
 *   3. PGN dengan komentar `{…}` dan baris `%` tetap bisa diimpor.
 *   4. PGN tidak valid melempar galat dengan kunci "pgn" (UI menampilkan
 *      pesan galat impor, bukan menggantung).
 *   5. Progres analisis (0–100) berjalan dan kedalaman tercapai.
 *
 * Jalankan: node scripts/uji-analisa-e2e.mjs
 */
import { Chess } from "chess.js";
import {
  parsePGN,
  formatSquare,
  galat,
  GALAT_PGN,
} from "../src/halaman/Analisa/mesin/engine.js";
import { DAFTAR_ENGINE_NODE, UciEngine } from "./engine-uci-node.mjs";

/* ------------------------- mesin Node (interface EngineAnalisis) ------------------------- */

/**
 * Implementasi interface yang dibutuhkan `parsePGN` (cari/gameBaru/setop)
 * di atas Stockfish WASM riil — meniru EngineAnalisis.cari() sebaris demi
 * sebaris agar bentuk hasilnya identik dengan yang dibaca komponen UI.
 */
class MesinNode {
  constructor() {
    this.uci = new UciEngine(DAFTAR_ENGINE_NODE[0], {
      timeout: 60_000,
      timeoutMulai: 120_000,
    });
    /** Kedalaman maksimum yang diumumkan engine (dipakai salah satu uji). */
    this.kedalamanMaks = 0;
  }

  async siapkan() {
    this.uci.mulai();
    await this.uci.siap();
  }

  async cari(fen, { kedalaman, sinyal = null } = {}) {
    if (sinyal?.aborted) throw galat("canceled");
    const { uci, info } = await this.uci.cari({ fen, kedalaman });
    this.kedalamanMaks = Math.max(this.kedalamanMaks, info?.kedalaman ?? 0);
    const staticEval = info
      ? info.mate !== null
        ? ["mate", String(info.mate)]
        : ["cp", String(info.cp)]
      : [];
    const langkah = uci && uci !== "(none)" ? uci : null;
    return {
      staticEval,
      bestMove: langkah
        ? [formatSquare(langkah.slice(0, 2)), formatSquare(langkah.slice(2, 4))]
        : undefined,
      bestMoveCoronation: langkah && langkah.length > 4 ? langkah[4] : undefined,
      kedalamanTercapai: info?.kedalaman ?? 0,
      pv: info?.pv ?? [],
    };
  }

  gameBaru() {
    return this.uci.gameBaru();
  }

  setop() {
    this.uci.setop();
  }

  async hancurkan() {
    await this.uci.tutup();
  }
}

/* ------------------------- alat uji ------------------------- */

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

const PGN_PUTIH_MENANG = `[Event "Uji Import"]
[Site "ChessClub"]
[Date "2024.05.01"]
[Round "1"]
[White "Putih Uji"]
[Black "Hitam Uji"]
[Result "1-0"]
[TimeControl "300+3"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`;

const PGN_HITAM_MENANG = `[Event "Uji Import 2"]
[Site "ChessClub"]
[Date "2024.05.02"]
[Round "1"]
[White "Lemah Putih"]
[Black "Kuat Hitam"]
[Result "0-1"]
[TimeControl "600"]

1. f3 e5 2. g4 Qh4# 0-1`;

const PGN_DENGAN_KOMENTAR = `[Event "Uji Komentar"]
[Site "ChessClub"]
[Date "2024.05.03"]
[Round "1"]
[White "Putih"]
[Black "Hitam"]
[Result "1-0"]

1. e4 { pembuka standar } e5 % baris persen diabaikan
2. Qh5 { ancaman f7 } Nc6 3. Bc4 Nf6?? 4. Qxf7# 1-0`;

/* ------------------------- pengujian ------------------------- */

const mesin = new MesinNode();
const sinyal = new AbortController().signal;

async function utama() {
  console.log("Memuat engine riil (Stockfish 18 Lite WASM)…");
  await mesin.siapkan();
  console.log("Engine siap.\n");

  try {
    /* ================= 1. PGN valid: putih menang ================= */
    console.log("[1] Impor PGN valid (Scholar's Mate, 1-0):");
    let progresMaks = 0;
    const h1 = await parsePGN(
      mesin,
      PGN_PUTIH_MENANG,
      13,
      null,
      (p) => {
        progresMaks = Math.max(progresMaks, p);
      },
      sinyal
    );

    hasil(
      "metadata pemain terbaca dari tag PGN",
      h1.metadata.players[0].name === "Putih Uji" &&
        h1.metadata.players[1].name === "Hitam Uji",
      JSON.stringify(h1.metadata.players)
    );
    hasil(
      "waktu kontrol terbaca (300+3 → 300 detik)",
      h1.metadata.time === 300,
      `time=${h1.metadata.time}`
    );
    hasil("hasil partai terbaca (1-0)", h1.metadata.result === "1-0", h1.metadata.result);
    // Scholar's Mate = 7 setangan (e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7#) →
    // 8 entri: posisi awal + tiap setangan.
    hasil(
      "semua langkah dianalisis (posisi awal + 7 setangan)",
      h1.moves.length === 8,
      `moves=${h1.moves.length}`
    );
    hasil(
      "posisi awal: engine memberi langkah terbaik",
      Boolean(h1.moves[0].bestMoveSan),
      `best=${h1.moves[0].bestMoveSan}`
    );
    hasil(
      "engine mencapai kedalaman 13 selama analisis",
      mesin.kedalamanMaks >= 13,
      `maks=${mesin.kedalamanMaks}`
    );
    hasil(
      "langkah pertama tercatat benar (1.e4, giliran hitam)",
      h1.moves[1].san === "e4" && h1.moves[1].color === "b",
      JSON.stringify({ san: h1.moves[1].san, color: h1.moves[1].color })
    );
    // Evaluasi posisi saat ini disimpan di previousStaticEvals[0] —
    // persis yang dibaca komponen Evaluation (game.jsx: advantage=…).
    hasil(
      "setiap posisi punya evaluasi (engine bekerja di tiap langkah)",
      h1.moves.every(
        (m) =>
          Array.isArray(m.previousStaticEvals) &&
          m.previousStaticEvals[0]?.length > 0
      ),
      h1.moves.map((m) => JSON.stringify(m.previousStaticEvals?.[0])).join(",")
    );
    hasil(
      "setelah 3…Nf6: engine melihat skakmat-satu PUTIH (mate,1)",
      h1.moves[6].previousStaticEvals[0][0] === "mate" &&
        h1.moves[6].previousStaticEvals[0][1] === "1",
      JSON.stringify(h1.moves[6].previousStaticEvals?.[0])
    );
    hasil(
      "langkah skakmat (4.Qxf7#) terdeteksi sebagai akhir",
      h1.moves[7].previousStaticEvals[0][0] === "mate" &&
        h1.moves[7].bestMove === undefined,
      JSON.stringify(h1.moves[7].previousStaticEvals?.[0])
    );
    hasil("progres analisis mencapai 100%", progresMaks === 100, `maks=${progresMaks}`);

    /* ================= 2. PGN valid: hitam menang (konvensi putih/hitam) ================= */
    console.log("\n[2] Impor PGN valid (Fool's Mate, 0-1) — konvensi evaluasi:");
    const h2 = await parsePGN(mesin, PGN_HITAM_MENANG, 13, null, () => {}, sinyal);

    hasil("hasil partai terbaca (0-1)", h2.metadata.result === "0-1", h2.metadata.result);
    hasil(
      "jumlah entri benar (posisi awal + 4 setangan)",
      h2.moves.length === 5,
      `moves=${h2.moves.length}`
    );
    hasil(
      "setelah 2.g4: giliran HITAM, engine menemukan skakmat-satu",
      h2.moves[3].previousStaticEvals[0][0] === "mate" &&
        h2.moves[3].previousStaticEvals[0][1] === "1",
      JSON.stringify(h2.moves[3].previousStaticEvals?.[0])
    );
    // Konvensi UCI: nilai positif = pihak yang BERGILIR menang. Komponen
    // Evaluation mengkonversi ke sudut pandang PUTIH dengan
    // advantageAmount = nilai * (whiteMoving ? 1 : -1). Di sini giliran
    // hitam (whiteMoving=false) → 1 × -1 = -1 (hitam unggul).
    const sudutPutih =
      Number(h2.moves[3].previousStaticEvals[0][1]) *
      (h2.moves[3].color === "w" ? 1 : -1);
    hasil(
      "konversi sudut pandang PUTIH: negatif (hitam yang menang)",
      sudutPutih < 0 && h2.moves[3].color === "b",
      `sudutPutih=${sudutPutih}, color=${h2.moves[3].color}`
    );
    hasil(
      "langkah skakmat (2…Qh4#) terdeteksi sebagai akhir",
      h2.moves[4].previousStaticEvals[0][0] === "mate" &&
        h2.moves[4].bestMove === undefined,
      JSON.stringify(h2.moves[4].previousStaticEvals?.[0])
    );

    /* ================= 3. PGN dengan komentar & baris % ================= */
    console.log("\n[3] Impor PGN dengan komentar {…} dan baris %:");
    const h3 = await parsePGN(mesin, PGN_DENGAN_KOMENTAR, 13, null, () => {}, sinyal);
    hasil(
      "PGN berkomentar diimpor utuh (7 setangan)",
      h3.moves.length === 8 && h3.metadata.result === "1-0",
      `moves=${h3.moves.length}, hasil=${h3.metadata.result}`
    );
    hasil(
      "evaluasi posisi skakmat-satu tetap benar (mate,1)",
      h3.moves[6].previousStaticEvals[0][0] === "mate" &&
        h3.moves[6].previousStaticEvals[0][1] === "1",
      JSON.stringify(h3.moves[6].previousStaticEvals?.[0])
    );

    /* ================= 4. PGN tidak valid ================= */
    console.log("\n[4] Impor PGN tidak valid:");
    let galatTercatat = null;
    try {
      await parsePGN(mesin, "ini bukan pgn sama sekali", 13, null, () => {}, sinyal);
    } catch (e) {
      galatTercatat = e;
    }
    hasil(
      "PGN rusak melempar galat dengan kunci \"pgn\" (UI bisa menampilkan pesan)",
      galatTercatat?.kunci === GALAT_PGN,
      `kunci=${galatTercatat?.kunci}`
    );

    /* ================= 5. Sanity FEN posisi uji ================= */
    console.log("\n[5] Sanity posisi uji (chess.js):");
    const cek = new Chess("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4");
    hasil(
      "posisi 3…Nf6 memang skakmat-satu bagi putih",
      cek.moves({ verbose: true }).some((m) => {
        cek.move(m);
        const mat = cek.isCheckmate();
        cek.undo();
        return mat;
      })
    );
  } finally {
    await mesin.hancurkan();
  }

  console.log(
    `\nHasil: ${lulus} lulus, ${gagal} gagal${
      gagal ? "" : " — semua pemeriksaan impor PGN lulus."
    }`
  );
}

await utama();
