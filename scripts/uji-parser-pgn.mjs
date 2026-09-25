/**
 * Uji parser PGN fitur Analisa: pemecah multi-partai, hash impor, pembaca
 * partai, dan taksonomi masukan `chess.js`.
 *
 * Diperiksa:
 *  1. `pecahMultiPgn` — satu/dua/tiga partai, CRLF, tanpa tag, kosong,
 *     bukan-string.
 *  2. `hashPgn` — stabil, tak peka CRLF/spasi tepi, berbeda untuk isi beda.
 *  3. `bacaPartaiPGN` — multi-partai → partai PERTAMA + `jumlahPartai`;
 *     variasi/NAG/komentar/%clk/SetUp-FEN/CRLF/lichess/chess.com DITERIMA.
 *  4. Taksonomi tolak (→ GALAT_PGN): variasi berisi token hasil, nama tag
 *     non-standar, nomor langkah tanpa titik, sampah, tanpa langkah.
 *  5. `parsePGN` meneruskan `jumlahPartai`.
 *
 * Jalankan: node scripts/uji-parser-pgn.mjs
 */
import { Chess } from "chess.js";
import { pecahMultiPgn, hashPgn } from "../src/lib/pgnRingan.js";
import { bacaPartaiPGN, parsePGN, GALAT_PGN } from "../src/halaman/Analisa/mesin/engine.js";

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

function engineSkrip() {
  return {
    async cari() {
      return { staticEval: ["cp", "10"], bestMove: undefined, bestMoveCoronation: undefined, daftarKandidat: [] };
    },
    gameBaru() {},
    setop() {},
    hancurkan() {},
  };
}

function kunciGalat(fn) {
  try {
    fn();
    return "(tidak melempar)";
  } catch (e) {
    return e?.kunci ?? e?.message ?? "(tanpa kunci)";
  }
}

const G1 = `[Event "Partai 1"]
[Site "localhost"]
[White "A"]
[Black "B"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`;

const G2 = `[Event "Partai 2"]
[Site "localhost"]
[White "C"]
[Black "D"]
[Result "0-1"]

1. d4 d5 2. c4 e6 0-1`;

console.log("== pecahMultiPgn ==");
hasil("satu partai → 1 blok", pecahMultiPgn(G1).length === 1);
hasil("dua partai → 2 blok", pecahMultiPgn(`${G1}\n\n${G2}`).length === 2);
{
  const blok = pecahMultiPgn(`${G1}\n\n${G2}`);
  hasil("blok 1 = partai 1 (e4, bukan d4)", blok[0].includes("1. e4") && !blok[0].includes("1. d4"));
  hasil("blok 2 = partai 2", blok[1].includes("1. d4") && blok[1].includes("0-1"));
}
hasil("tiga partai → 3 blok", pecahMultiPgn(`${G1}\n\n${G2}\n\n${G1}`).length === 3);
{
  const blok = pecahMultiPgn(`${G1}\r\n\r\n${G2.replace(/\n/g, "\r\n")}`);
  hasil("CRLF terpecah benar", blok.length === 2);
  hasil("CRLF dinormalisasi di blok", !blok.some((b) => b.includes("\r")));
}
hasil("tanpa tag = 1 blok (tak dipecah)", pecahMultiPgn("1. e4 e5 *").length === 1);
hasil("string kosong/sepasi → []", pecahMultiPgn("").length === 0 && pecahMultiPgn("   \n  ").length === 0);
hasil("bukan string → []", pecahMultiPgn(null).length === 0 && pecahMultiPgn(42).length === 0);

console.log("\n== hashPgn ==");
hasil("stabil antar panggilan", hashPgn(G1) === hashPgn(G1));
hasil("tak peka CRLF", hashPgn(G1.replace(/\n/g, "\r\n")) === hashPgn(G1));
hasil("tak peka spasi tepi", hashPgn(`  \n${G1}\n\n`) === hashPgn(G1));
hasil("isi beda → hash beda", hashPgn(G1) !== hashPgn(G2));
hasil("hex tak kosong", /^[0-9a-f]+$/.test(hashPgn(G1)), hashPgn(G1));

console.log("\n== bacaPartaiPGN: multi-partai ==");
{
  const p = bacaPartaiPGN(`${G1}\n\n${G2}`);
  hasil("jumlahPartai = 2", p.jumlahPartai === 2, String(p.jumlahPartai));
  hasil("yang dibaca = partai pertama (4 ply)", p.riwayat.length === 4, String(p.riwayat.length));
  hasil("metadata dari partai pertama", p.metadata.players[0].name === "A" && p.metadata.result === "1-0");
}
{
  const p = bacaPartaiPGN(G1);
  hasil("partai tunggal → jumlahPartai 1", p.jumlahPartai === 1);
}

console.log("\n== bacaPartaiPGN: masukan DITERIMA ==");
{
  const p = bacaPartaiPGN("1. e4 (1. d4 d5) e5 2. Nf3 *");
  hasil("variasi langkah → 3 ply jalur utama", p.riwayat.length === 3, String(p.riwayat.length));
}
{
  const p = bacaPartaiPGN("1. e4 $1 e5 $2 *");
  hasil("NAG → 2 ply", p.riwayat.length === 2);
}
{
  const p = bacaPartaiPGN("1. e4 {bagus sekali} e5 *");
  hasil("komentar → 2 ply", p.riwayat.length === 2);
}
{
  const p = bacaPartaiPGN("1. e4 {[%clk 0:03:00]} e5 {[%clk 0:02:59]} *");
  hasil("%clk → 2 ply + 3 entri jam", p.riwayat.length === 2 && p.daftarClock.length === 3);
}
{
  const p = bacaPartaiPGN('[SetUp "1"]\n[FEN "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"]\n\n3. Bb5 *');
  hasil("SetUp/FEN → 1 ply dari posisi kustom", p.riwayat.length === 1 && p.kerangka.length === 2);
}
{
  const lichess = `[Event "Casual rapid game"]
[Site "https://lichess.org/abc123"]
[White "alice"]
[Black "bob"]
[Result "1-0"]
[UTCDate "2026.09.01"]
[WhiteElo "1500"]
[BlackElo "1480"]
[TimeControl "600+0"]

1. e4 { [%eval 0.17] [%clk 0:10:00] } e5 { [%eval 0.22] [%clk 0:10:00] } 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`;
  const p = bacaPartaiPGN(lichess);
  hasil("gaya lichess (eval+clk) → 7 ply", p.riwayat.length === 7, String(p.riwayat.length));
}
{
  const chesscom = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.09.01"]
[White "carlsen"]
[Black "nakamura"]
[Result "1/2-1/2"]
[Timezone "UTC"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1/2-1/2`;
  const p = bacaPartaiPGN(chesscom);
  hasil("gaya chess.com → 10 ply + remis", p.riwayat.length === 10 && p.metadata.result === "1/2-1/2");
}

console.log("\n== bacaPartaiPGN: masukan DITOLAK (GALAT_PGN) ==");
hasil("variasi berisi token hasil → pgn", kunciGalat(() => bacaPartaiPGN("1. e4 (1. d4 1-0) e5 *")) === GALAT_PGN);
hasil("nama tag non-standar → pgn", kunciGalat(() => bacaPartaiPGN('[White-foo "x"]\n\n1. e4 e5 *')) === GALAT_PGN);
hasil("nomor langkah tanpa titik → pgn", kunciGalat(() => bacaPartaiPGN("1 e4 e5 *")) === GALAT_PGN);
hasil("sampah → pgn", kunciGalat(() => bacaPartaiPGN("bukan pgn sama sekali")) === GALAT_PGN);
hasil("tanpa langkah → pgn", kunciGalat(() => bacaPartaiPGN('[Event "x"]\n\n*')) === GALAT_PGN);
hasil("string kosong → pgn", kunciGalat(() => bacaPartaiPGN("")) === GALAT_PGN);

console.log("\n== parsePGN meneruskan jumlahPartai ==");
{
  const { moves, jumlahPartai, metadata } = await parsePGN(engineSkrip(), `${G1}\n\n${G2}`, 10, {}, () => {}, null, {});
  hasil("jumlahPartai = 2", jumlahPartai === 2);
  hasil("moves dari partai pertama (1 + 4)", moves.length === 5, String(moves.length));
  hasil("metadata partai pertama", metadata.players[0].name === "A");
  // Sanity chess.js: rujukan urutan langkah.
  const ref = new Chess();
  ref.loadPgn(G1);
  hasil("urutan SAN sesuai partai pertama", moves.slice(1).map((m) => m.san).join(" ") === ref.history().join(" "));
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
