/**
 * Uji logika fitur Analisa (tanpa peramban, tanpa mengunduh engine).
 *
 * Yang diuji justru bagian yang rawan saat UI analisis Brilliant-Chess
 * dipindah ke proyek ini: parsing PGN, pemetaan kotak, konvensi tanda skor,
 * dan klasifikasi langkah. Engine-nya diganti tiruan yang mengembalikan
 * deret evaluasi tetap sehingga hasilnya deterministik; engine Stockfish
 * yang sebenarnya diuji manual di peramban (halaman /analisa).
 *
 * Jalankan: node scripts/uji-analisa.mjs
 */
import assert from "node:assert/strict";
import { Chess } from "chess.js";

import {
  EngineAnalisis,
  deformatSquare,
  formatSquare,
  getCastle,
  moveToSan,
  parseMove,
  parsePGN,
  parsePosition,
  waktuDariPgn,
} from "../src/halaman/Analisa/mesin/engine.js";
import { getMoveRating, isForced, isSacrifice } from "../src/halaman/Analisa/mesin/penilaian.js";
import { kunciFen } from "../src/halaman/Analisa/mesin/kunciFen.js";
import { DAFTAR_ENGINE, EngineCatur, cariEngine } from "../src/lib/engineCatur.js";

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

/** Engine tiruan: mengembalikan evaluasi sesuai skenario, berurutan. */
function engineTiruan(skenario = []) {
  let i = 0;
  const pesan = [];
  return {
    pesan,
    kedalaman: [],
    async cari(fen, { kedalaman, sinyal } = {}) {
      if (sinyal?.aborted) throw new Error("canceled");
      this.kedalaman.push(kedalaman);
      const hasil = skenario[i++] ?? { staticEval: ["cp", "0"], bestMove: undefined };
      return {
        staticEval: hasil.staticEval,
        bestMove: hasil.bestMove,
        bestMoveCoronation: hasil.promosi,
        kedalamanTercapai: hasil.kedalaman ?? 0,
        pv: hasil.pv ?? [],
      };
    },
    gameBaru() {
      this.pesan.push("ucinewgame");
    },
    setop() {},
    hancurkan() {},
  };
}

const PGN_CONTOH = [
  '[Event "?"]',
  '[Site "?"]',
  '[Date "2024.01.01"]',
  '[Round "1"]',
  '[White "Andi"]',
  '[Black "Budi"]',
  '[Result "1-0"]',
  '[WhiteElo "1800"]',
  '[BlackElo "1750"]',
  '[TimeControl "300+3"]',
  "",
  "1. e4 {ruang pusat} e5 2. Nf3 Nc6 3. Bb5 a6 4. Bxc6 dxc6 1-0",
].join("\n");

const EVAL = (cp) => ["cp", String(cp)];

/* ------------------------------------------------------- alat bantu kotak */

console.log("Analisa — alat bantu kotak & metadata PGN");

await uji("formatSquare/deformatSquare bolak-balik", () => {
  assert.deepEqual(formatSquare("e4"), { col: 4, row: 3 });
  assert.equal(deformatSquare({ col: 4, row: 3 }), "e4");
  assert.equal(deformatSquare(formatSquare("a1")), "a1");
  assert.equal(deformatSquare(formatSquare("h8")), "h8");
});

await uji("rokade dikenali dari SAN", () => {
  assert.equal(getCastle("O-O"), "k");
  assert.equal(getCastle("O-O-O"), "q");
  assert.equal(getCastle("Nf3"), undefined);
});

await uji("moveToSan memakai promosi dan menolak langkah ilegal", () => {
  const fen = "4k3/P7/8/8/8/8/8/4K3 w - - 0 1";
  assert.equal(moveToSan([formatSquare("a7"), formatSquare("a8")], "q", fen), "a8=Q+");
  assert.equal(moveToSan([formatSquare("a7"), formatSquare("a8")], "r", fen), "a8=R+");
  assert.equal(moveToSan([], undefined, fen), "");
  assert.equal(moveToSan([formatSquare("a7"), formatSquare("h8")], "q", fen), "");
});

await uji("kunciFen membuang penghitung langkah", () => {
  const c = new Chess();
  assert.equal(kunciFen(c.fen()), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -");
});

await uji("kontrol waktu PGN → detik", () => {
  assert.equal(waktuDariPgn({ TimeControl: "300+3" }), 300);
  assert.equal(waktuDariPgn({ TimeControl: "600" }), 600);
  assert.equal(waktuDariPgn({ TimeControl: "-" }), 0);
  assert.equal(waktuDariPgn({}), 0);
  assert.equal(waktuDariPgn({ TimeControl: "10:60" }), 0); // format tak dikenal → tanpa jam
});

/* ---------------------------------------------------------------- engine */

console.log("Analisa — integrasi engine (engine tiruan)");

await uji("parsePosition mengembalikan eval & langkah terbaik", async () => {
  const mesin = engineTiruan([{ staticEval: EVAL(-30), bestMove: [formatSquare("e2"), formatSquare("e4")] }]);
  const hasil = await parsePosition(mesin, new Chess(), 12, null, () => {});
  assert.equal(hasil.color, "w");
  assert.deepEqual(hasil.previousStaticEvals[0], EVAL(-30));
  assert.equal(hasil.bestMoveSan, "e4");
});

await uji("parseMove melabeli langkah yang sama dengan usulan engine", async () => {
  const game = new Chess();
  const move = game.move("e4");
  const mesin = engineTiruan([
    { staticEval: EVAL(20), bestMove: [formatSquare("e2"), formatSquare("e4")] },
  ]);
  const hasil = await parseMove(mesin, 12, move, new Chess(), [EVAL(10)], "e4", false, {}, () => {}, null);
  assert.equal(hasil.san, "e4");
  assert.equal(hasil.moveRating, "best");
  assert.equal(hasil.commentKey, "best");
  assert.equal(typeof hasil.commentIndex, "number");
  assert.equal(hasil.previousStaticEvals.length, 2);
  assert.equal(hasil.fen, move.after);
});

await uji("posisi skakmat tidak dikirim ke engine", async () => {
  const kotakSkak = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
  const game = new Chess();
  for (const san of ["f3", "e5", "g4", "Qh4#"]) game.move(san);
  const move = game.history({ verbose: true }).pop();
  assert.ok(game.isCheckmate(), "skenario harus posisi skakmat");

  const mesin = engineTiruan([]);
  const hasil = await parseMove(mesin, 12, move, new Chess(), [EVAL(0)], undefined, false, {}, () => {}, null);
  assert.equal(mesin.kedalaman.length, 0, "engine tidak boleh dipanggil");
  assert.deepEqual(hasil.previousStaticEvals[0], ["mate"]);
  assert.equal(hasil.bestMove, undefined);
});

await uji("posisi remis (pat) diberi eval 0, bukan evaluasi kosong", async () => {
  const move = {
    color: "w",
    from: "c5",
    to: "c7",
    san: "Qc7",
    before: "k7/8/1K6/2Q5/8/8/8/8 w - - 0 1",
    after: "k7/2Q5/1K6/8/8/8/8/8 b - - 1 2",
    captured: undefined,
    promotion: undefined,
  };
  assert.ok(new Chess(move.before).isLegal ? true : true);
  assert.ok(new Chess(move.after).isStalemate(), "skenario harus posisi pat");
  const mesin = engineTiruan([]);
  const hasil = await parseMove(mesin, 12, move, new Chess(), [EVAL(0)], undefined, false, {}, () => {}, null);
  assert.equal(mesin.kedalaman.length, 0);
  assert.deepEqual(hasil.previousStaticEvals[0], EVAL(0));
});

await uji("parsePGN: satu entri posisi + satu entri per langkah", async () => {
  const mesin = engineTiruan();
  let progres = 0;
  const { metadata, moves } = await parsePGN(mesin, PGN_CONTOH, 10, {}, (p) => {
    progres = p;
  }, null);
  assert.equal(moves.length, 9, "1 posisi awal + 8 setengah-langkah");
  assert.equal(metadata.players[0].name, "Andi");
  assert.equal(metadata.players[1].elo, "1750");
  assert.equal(metadata.result, "1-0");
  assert.equal(metadata.time, 300);
  assert.equal(progres, 0, "progres direset setelah selesai");
  assert.equal(mesin.pesan[0], "ucinewgame", "tabel hash dibuang di awal partai");
  assert.equal(moves[0].san, undefined, "entri pertama adalah posisi, bukan langkah");
  assert.equal(moves[0].moveRating, undefined, "entri posisi memang tidak diberi label");
  assert.ok(moves.slice(1).every((m) => m.moveRating), "semua langkah punya label");
  assert.ok(mesin.kedalaman.every((d) => d === 10), "kedalaman diteruskan ke engine");
});

await uji("parsePGN menolak PGN rusak / tanpa langkah", async () => {
  await assert.rejects(() => parsePGN(engineTiruan(), "putih main e4 e4 e4", 8, {}, () => {}, null), /pgn/);
  await assert.rejects(() => parsePGN(engineTiruan(), '[White "A"] 1. e8 1-0', 8, {}, () => {}, null), /pgn/);
});

await uji("pembatalan menghentikan analisis", async () => {
  const pengontrol = new AbortController();
  const mesin = {
    async cari() {
      pengontrol.abort();
      throw new Error("canceled");
    },
    gameBaru() {},
    setop() {},
  };
  await assert.rejects(
    () => parsePGN(mesin, PGN_CONTOH, 8, {}, () => {}, pengontrol.signal),
    /canceled/
  );
});

/* ------------------------------------------------------------- penilaian */

console.log("Analisa — klasifikasi langkah (logika warisan upstream)");

await uji("blunder saat eval jatuh lebih dari 4 bidak", () => {
  const hasil = getMoveRating({
    staticEval: EVAL(460),
    previousStaticEvals: [EVAL(-20)],
    bestMoveSan: "d5",
    moveSan: "exd4",
    fen: "",
    color: "b",
    sacrifice: false,
    previousSacrifice: false,
    openings: {},
  });
  assert.equal(hasil.moveRating, "blunder");
  assert.equal(hasil.commentKey, "blunder");
});

await uji("inaccuracy untuk kerugian kecil", () => {
  const hasil = getMoveRating({
    staticEval: EVAL(120),
    previousStaticEvals: [EVAL(-10)],
    bestMoveSan: "Nf6",
    moveSan: "h6",
    fen: "",
    color: "b",
    sacrifice: false,
    previousSacrifice: false,
    openings: {},
  });
  assert.equal(hasil.moveRating, "inaccuracy");
});

await uji("langkah buku memakai nama pembukaan dari tabel", () => {
  const hasil = getMoveRating({
    staticEval: EVAL(0),
    previousStaticEvals: [EVAL(0)],
    bestMoveSan: "e4",
    moveSan: "e5",
    fen: "FEN-KUNCI",
    color: "b",
    sacrifice: false,
    previousSacrifice: false,
    openings: { "FEN-KUNCI": "Ruy Lopez" },
  });
  assert.equal(hasil.moveRating, "book");
  assert.equal(hasil.comment, "Ruy Lopez");
});

await uji("tabel buku juga boleh berupa fungsi pencari", () => {
  const hasil = getMoveRating({
    staticEval: EVAL(0),
    previousStaticEvals: [EVAL(0)],
    bestMoveSan: "e4",
    moveSan: "e5",
    fen: "papan b KQkq -",
    color: "b",
    sacrifice: false,
    previousSacrifice: false,
    openings: (fen) => (fen.includes("papan") ? "Italian Game" : undefined),
  });
  assert.equal(hasil.moveRating, "book");
  assert.equal(hasil.comment, "Italian Game");
});

await uji("hanya satu langkah legal → dilabeli paksa", () => {
  const chess = new Chess("7k/8/6K1/8/8/8/8/R7 b - - 0 1");
  assert.equal(chess.moves().length, 1, "skenario: hitam hanya punya satu langkah");
  const [satu] = chess.moves({ verbose: true });
  assert.equal(isForced(satu), true);
  assert.equal(isForced(new Chess().moves({ verbose: true })[0]), false);
});

await uji("kuda yang ditinggal sendiri di e5 dianggap pengorbanan", () => {
  const chess = new Chess();
  for (const san of ["e4", "e5", "Nf3", "Nc6"]) chess.move(san);
  const sebelum = chess.fen();
  const ambilBidak = chess.move("Nxe5");
  assert.equal(isSacrifice({ ...ambilBidak, before: sebelum }), true);
});

await uji("pengembangan biasa bukan pengorbanan", () => {
  const chess = new Chess();
  chess.move("e4");
  chess.move("e5");
  const sebelum = chess.fen();
  const kuda = chess.move("Nf3");
  assert.equal(isSacrifice({ ...kuda, before: sebelum }), false);
});

/* -------------------------------------------------------- konfigurasi */

console.log("Analisa — konfigurasi engine lokal");

await uji("semua engine cadangan menunjuk berkas yang benar", () => {
  assert.ok(DAFTAR_ENGINE.length >= 2, "daftar engine tidak kosong");
  for (const engine of DAFTAR_ENGINE) {
    assert.match(engine.url, /^\/engines\/[\w.-]+\/[\w.-]+\.js$/, `url salah: ${engine.url}`);
  }
  assert.equal(cariEngine("tidak-ada").id, DAFTAR_ENGINE.find((e) => e.saran).id);
});

await uji("EngineCatur menerima url & hash dari pemanggil", () => {
  const engine = new EngineCatur({ url: "/engines/x/x.js", hash: 64, threads: 1 });
  assert.equal(engine.url, "/engines/x/x.js");
  assert.equal(engine.hash, 64);
  assert.equal(engine.siap, false);
  engine.tamat(); // aman dipanggil walau worker belum dibuat
});

await uji("EngineAnalisis memakai engine lokal, bukan berkas upstream", () => {
  const mesin = new EngineAnalisis({ idEngine: "stockfish-18-lite", kedalaman: 10 });
  assert.equal(mesin.kedalaman, 10);
  assert.equal(mesin.idEngine, "stockfish-18-lite");
  assert.match(mesin.engine.url, /^\/engines\/stockfish-18-lite-single\//);
  assert.doesNotMatch(mesin.engine.url, /stockfish-single\.js$/); // milik upstream
  mesin.hancurkan();
});

console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
