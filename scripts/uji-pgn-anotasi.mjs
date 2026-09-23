/**
 * Uji EKSPOR PGN BERANOTASI — modul murni `mesin/pgnAnotasi.js`.
 *
 * Yang direkam suite ini:
 *   1. Konvensi eval sudut Putih (`evalKeTeks`): `staticEval` mentah UCI
 *      selalu relatif terhadap pihak yang BERGILIR, jadi tandanya harus
 *      dibalik bila pemain yang melangkah adalah Putih. Salah tanda di sini
 *      tidak terlihat sebagai galat — hanya angka eval di berkas ekspor yang
 *      jadi terbalik — sehingga dikunci per kasus.
 *   2. Peta NAG: hanya label yang layak ditandai; label netral tidak.
 *   3. Bentuk berkas: tag header lengkap, NAG menempel pada langkahnya,
 *      komentar `[%eval …]` hanya bila diminta, hasil partai di akhir,
 *      dan — yang terpenting — **berkas hasilnya masih PGN yang sah**:
 *      dimuat ulang chess.js dan menghasilkan daftar langkah yang sama.
 *   4. Ekspor tanpa langkah mengembalikan `null` (bukan berkas kosong).
 *
 * Jalankan: node scripts/uji-pgn-anotasi.mjs
 */
import { Chess } from "chess.js";
import {
  ANOTATOR,
  NAG_LABEL,
  bangunPgnBeranotasi,
  evalKeTeks,
  tanpaAnotasi,
  unduhPgnBeranotasi,
} from "../src/halaman/Analisa/mesin/pgnAnotasi.js";

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

/* ------------------------------------------------------- 1. konvensi eval */

console.log("== evalKeTeks: eval mentah UCI → sudut Putih ==");
hasil('[cp 34], pemain Putih → "−0.34" (Hitam unggul)', evalKeTeks(["cp", "34"], "w") === "-0.34", evalKeTeks(["cp", "34"], "w"));
hasil('[cp 34], pemain Hitam → "0.34" (Putih unggul)', evalKeTeks(["cp", "34"], "b") === "0.34", evalKeTeks(["cp", "34"], "b"));
hasil('[cp -120], pemain Hitam → "−1.20"', evalKeTeks(["cp", "-120"], "b") === "-1.20", evalKeTeks(["cp", "-120"], "b"));
hasil('[cp 0] → "0.00" (tanpa tanda negatif nol)', evalKeTeks(["cp", "0"], "w") === "0.00", evalKeTeks(["cp", "0"], "w"));
hasil('[cp -1] tidak membulatkan jadi "-0.00"', evalKeTeks(["cp", "-1"], "b") !== "-0.00", evalKeTeks(["cp", "-1"], "b"));
hasil('[mate 2], pemain Hitam → "#2" (Putih mat dalam 2)', evalKeTeks(["mate", "2"], "b") === "#2", evalKeTeks(["mate", "2"], "b"));
hasil('[mate -3], pemain Putih → "#3" (Putih memberi mat)', evalKeTeks(["mate", "-3"], "w") === "#3", evalKeTeks(["mate", "-3"], "w"));
hasil('[mate 2], pemain Putih → "−#2" (Hitam memberi mat)', evalKeTeks(["mate", "2"], "w") === "-#2", evalKeTeks(["mate", "2"], "w"));
hasil('["mate"] tanpa angka → null (posisi mati, bukan skor)', evalKeTeks(["mate"], "w") === null);
hasil("eval kosong → null (mis. analisis dibatalkan)", evalKeTeks([], "w") === null);
hasil("eval rusak → null", evalKeTeks(["cp", "abc"], "w") === null);

/* ------------------------------------------------------------ 2. peta NAG */

console.log("\n== NAG_LABEL ==");
hasil("brilliant → $3 (!!)", NAG_LABEL.brilliant === "$3");
hasil("critical → $1 (!)", NAG_LABEL.critical === "$1");
hasil("inaccuracy → $6 (?!), mistake → $2 (?)", NAG_LABEL.inaccuracy === "$6" && NAG_LABEL.mistake === "$2");
hasil("blunder → $4 (??)", NAG_LABEL.blunder === "$4");
hasil("miss → $2 (?)", NAG_LABEL.miss === "$2");
hasil(
  "label netral tidak ditandai (best/excellent/good/book/forced)",
  ["best", "excellent", "good", "book", "forced"].every((l) => NAG_LABEL[l] === undefined)
);

/* -------------------------------------------------------- 3. bentuk PGN */

console.log("\n== bangunPgnBeranotasi: bentuk berkas ==");

const PGN = `[Event "Uji Kritis"]
[Site "Medan"]
[Date "2026.09.23"]
[White "Andi"]
[Black "Budi"]
[Result "1-0"]
[WhiteElo "1750"]
[BlackElo "1720"]
[TimeControl "600+5"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0`;

/**
 * Tiruan entri hasil `parsePGN`: `moves[0]` = posisi awal (tanpa langkah),
 * lalu satu entri per langkah dengan `san`, `color` (pihak yang BERGILIR
 * SESUDAH langkah, konvensi engine.js) dan `previousStaticEvals[0]` = eval
 * sesudah langkah dari sudut pihak yang bergilir.
 */
function buatMoves(pgn, label = {}) {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const riwayat = chess.history({ verbose: true });
  const dinilai = { 0: "excellent", 4: "blunder", 5: "critical", 8: "brilliant", 9: "inaccuracy", 2: "miss" };
  const entri = [{ staticEval: ["cp", "20"], color: "w", kandidat: [] }];
  riwayat.forEach((m, i) => {
    const sudutGiliran = 20 + (i % 3) * 35 - (i > 8 ? 200 : 0);
    entri.push({
      san: m.san,
      color: m.color === "w" ? "b" : "w",
      moveRating: label[i] ?? dinilai[i] ?? "good",
      previousStaticEvals: [["cp", String(m.color === "w" ? sudutGiliran : -sudutGiliran)]],
    });
  });
  return entri;
}

const moves = buatMoves(PGN);
const teks = bangunPgnBeranotasi({ pgn: PGN, moves, pemain: [{ name: "Andi" }, { name: "Budi" }], hasil: "1-0" });

hasil("menghasilkan teks", typeof teks === "string" && teks.length > 0);
hasil('tag Event dari PGN asli dipertahankan', teks.includes('[Event "Uji Kritis"]'));
hasil('tag pemain dari PGN asli', teks.includes('[White "Andi"]') && teks.includes('[Black "Budi"]'));
hasil("tag Elo & TimeControl ikut disalin", teks.includes('[WhiteElo "1750"]') && teks.includes('[TimeControl "600+5"]'));
hasil(`tag Annotator = "${ANOTATOR}"`, teks.includes(`[Annotator "${ANOTATOR}"]`));
hasil('hasil partai "1-0" di akhir movetext', teks.trimEnd().endsWith("1-0"));
hasil("NAG menempel pada langkahnya (1. e4 tanpa tanda, 3. Bb5 = ?!)", /3\. Bb5 \??/.test(teks) && !/1\. e4 \$/.test(teks));
hasil("critical → $1 pada langkah ke-6", /3\. Bb5 \$1|6\./.test(teks) && teks.includes("$1"));
hasil("brilliant → $3", teks.includes("$3"));
hasil("blunder → $4", teks.includes("$4"));
hasil('inaccuracy → $6', teks.includes("$6"));
hasil("miss → $2", teks.includes("$2"));
hasil("eval ditulis sebagai [%eval] pada tiap langkah", (teks.match(/\[%eval /g) ?? []).length === moves.length - 1, `${(teks.match(/\[%eval /g) ?? []).length} eval untuk ${moves.length - 1} langkah`);
{
  /*
   * Token berkomentar sengaja tidak dipecah (memotong `{ [%eval …] }` di
   * tengah membuat PGN tidak sah), jadi patokannya: setiap baris yang TIDAK
   * memuat komentar harus ≤ 80 kolom.
   */
  const baris = teks.split("\n").filter((b) => !b.startsWith("["));
  const panjang = baris.map((b) => b.length);
  const maksimal = Math.max(...panjang);
  hasil(
    "baris movetext tanpa komentar ≤ 80 kolom",
    baris.filter((b) => !b.includes("{ [%eval")).every((b) => b.length <= 80),
    `terpanjang ${maksimal}`
  );
  hasil("movetext dipecah menjadi beberapa baris", baris.length > 1, `${baris.length} baris`);
}

/* ------------------------- 4. berkas hasilnya masih PGN yang SAH */

console.log("\n== berkas hasil bisa dibaca ulang (PGN sah) ==");
{
  const ulang = new Chess();
  let galat = null;
  try {
    ulang.loadPgn(teks);
  } catch (e) {
    galat = e;
  }
  hasil("chess.js menerima hasil ekspor", galat === null, String(galat?.message ?? ""));
  if (!galat) {
    const asli = new Chess();
    asli.loadPgn(PGN);
    const sanAsli = asli.history();
    const sanUlang = ulang.history();
    hasil(
      `daftar langkah identik dengan aslinya (${sanAsli.length} langkah)`,
      sanUlang.length === sanAsli.length && sanUlang.every((s, i) => s === sanAsli[i]),
      `${sanUlang.join(" ")} vs ${sanAsli.join(" ")}`
    );
    hasil("tag Event tetap terbaca setelah putar-ulang", ulang.header().Event === "Uji Kritis");
    hasil("NAG tidak mengubah jumlah langkah", ulang.history().length === moves.length - 1);
    const papan = new Chess();
    papan.loadPgn(teks);
    hasil("papan akhir identik dengan partai asli", papan.fen() === asli.fen(), `${papan.fen()} vs ${asli.fen()}`);
  }
}

/* ---------------------------------------- 5. opsi tanpa eval & tanpa langkah */

console.log("\n== opsi tambahan ==");
const tanpaEval = bangunPgnBeranotasi({ pgn: PGN, moves, hasil: "1-0", sertakanEval: false });
hasil("sertakanEval:false → tidak ada [%eval]", !tanpaEval.includes("[%eval]") && !tanpaEval.includes("[%eval "));
hasil("sertakanEval:false → NAG tetap ada", tanpaEval.includes("$3") && tanpaEval.includes("$4"));
hasil("tanpaAnotasi menghapus NAG dan eval", !tanpaAnotasi(teks).includes("$") && !tanpaAnotasi(teks).includes("%eval"));
{
  const ulang = new Chess();
  let galat = null;
  try {
    ulang.loadPgn(tanpaEval);
  } catch (e) {
    galat = e;
  }
  hasil("berkas tanpa eval tetap sah", galat === null, String(galat?.message ?? ""));
}
hasil("moves kosong → null", bangunPgnBeranotasi({ pgn: PGN, moves: [] }) === null);
hasil("moves hanya posisi awal → null", bangunPgnBeranotasi({ pgn: PGN, moves: [moves[0]] }) === null);
hasil("moves bukan array → null", bangunPgnBeranotasi({ moves: undefined }) === null);
hasil("PGN rusak tetap menghasilkan berkas (header disintesis)", typeof bangunPgnBeranotasi({ pgn: "bukan pgn", moves }) === "string");
{
  const sintetis = bangunPgnBeranotasi({ pgn: "", moves, pemain: [{ name: "Putih Uji" }, { name: "Hitam Uji" }] });
  hasil('nama pemain dari halaman dipakai bila PGN kosong', sintetis.includes('[White "Putih Uji"]') && sintetis.includes('[Black "Hitam Uji"]'));
  hasil('Event bawaan "Analisa ChessClub"', sintetis.includes('[Event "Analisa ChessClub"]'));
  hasil('hasil "*" bila tidak diketahui', sintetis.trimEnd().endsWith("*"));
}
hasil("nama pemain dibersihkan dari tanda kutip", bangunPgnBeranotasi({ moves, pemain: [{ name: 'A"B' }] }).includes('[White "A\'B"]'));
{
  /*
   * PGN tanpa tag header: chess.js mengisinya dengan "?" dan "????.??.??",
   * jadi tanpa pembersihan berkas ekspor akan berbunyi [White "?"] dan
   * seterusnya — nama dari halaman tidak akan pernah muncul.
   */
  const tanpaTag = bangunPgnBeranotasi({
    pgn: "1. e4 e5 2. Nf3 Nc6",
    moves: buatMoves("1. e4 e5 2. Nf3 Nc6"),
    pemain: [{ name: "Andi" }, { name: "Budi" }],
  });
  hasil('PGN tanpa tag: nama dari halaman dipakai (bukan "?")', tanpaTag.includes('[White "Andi"]') && tanpaTag.includes('[Black "Budi"]'), tanpaTag.split("\n")[4]);
  hasil("PGN tanpa tag: tidak ada tag bernilai \"?\"", !tanpaTag.includes('"?"'), tanpaTag.split("\n").slice(0, 8).join(" | "));
  hasil("PGN tanpa tag: Event bawaan dipakai", tanpaTag.includes('[Event "Analisa ChessClub"]'));
  hasil("PGN tanpa tag: tanggal diisi tanggal hari ini", /\[Date "\d{4}\.\d{2}\.\d{2}"\]/.test(tanpaTag), tanpaTag.split("\n")[2]);
  const ulang = new Chess();
  let galat = null;
  try {
    ulang.loadPgn(tanpaTag);
  } catch (e) {
    galat = e;
  }
  hasil("PGN tanpa tag tetap sah setelah ekspor", galat === null, String(galat?.message ?? ""));
}
hasil("unduhPgnBeranotasi tanpa DOM → false (bukan melempar)", unduhPgnBeranotasi({ moves }) === false);
hasil("unduhPgnBeranotasi tanpa langkah → false", unduhPgnBeranotasi({ moves: [] }) === false);

/* ------------------- 6. rantai utuh: parsePGN → PGN beranotasi ------------------- */

console.log("\n== rantai parsePGN → PGN beranotasi ==");
{
  const { parsePGN, formatSquare } = await import("../src/halaman/Analisa/mesin/engine.js");
  const PGN_KECIL = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6";

  /* Engine palsu yang selalu menyarankan langkah yang benar-benar dimainkan. */
  function buatEngine(pgn) {
    const papan = new Chess();
    papan.loadPgn(pgn);
    const daftar = papan.history({ verbose: true });
    let panggilan = 0;
    return {
      async cari() {
        const saran = daftar[Math.min(panggilan, daftar.length - 1)];
        panggilan++;
        return {
          staticEval: ["cp", "-60"],
          bestMove: [formatSquare(saran.from), formatSquare(saran.to)],
          bestMoveCoronation: undefined,
          kedalamanTercapai: 12,
          pv: [],
          daftarKandidat: [
            { peringkat: 1, uci: `${saran.from}${saran.to}`, cp: 120, mate: null, wdl: null },
            { peringkat: 2, uci: "a1a1", cp: -350, mate: null, wdl: null },
          ],
        };
      },
      gameBaru() {},
      setop() {},
      hancurkan() {},
    };
  }

  const { moves: entri } = await parsePGN(buatEngine(PGN_KECIL), PGN_KECIL, 12, {}, () => {});
  const berkas = bangunPgnBeranotasi({ pgn: PGN_KECIL, moves: entri, pemain: [{ name: "Andi" }, { name: "Budi" }], hasil: "*" });
  hasil("berkas tersusun dari hasil parsePGN", typeof berkas === "string" && berkas.includes("1. e4"));
  hasil("label kritis dari MultiPV muncul sebagai $1", berkas.includes("$1"), berkas.split("\n").slice(-3).join(" / "));
  const ulang = new Chess();
  let galat = null;
  try {
    ulang.loadPgn(berkas);
  } catch (e) {
    galat = e;
  }
  hasil("berkas hasil rantai utuh tetap PGN sah", galat === null, String(galat?.message ?? ""));
  if (!galat) {
    hasil("seluruh langkah partai ikut terekspor", ulang.history().length === entri.length - 1, `${ulang.history().length} vs ${entri.length - 1}`);
  }
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
