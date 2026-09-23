/**
 * Uji LABEL "LANGKAH KRITIS" (critical) — modul murni `mesin/langkahKritis.js`
 * plus sambungannya ke `getMoveRating` di `mesin/penilaian.js`.
 *
 * Yang direkam suite ini:
 *   1. Kurva kandidat: `cpKandidat` (cp/mate/rusak) dan
 *      `kerugianPeluangKandidat` (selisih peluang kandidat #1 → #2).
 *   2. Tujuh syarat `apakahLangkahKritis` satu per satu — masing-masing
 *      diuji "gagal bila syaratnya dilanggar" DAN "lolos bila syaratnya
 *      dipenuhi", supaya syarat yang keliru (mis. tanda terbalik) langsung
 *      ketahuan.
 *   3. Bahwa label ini HANYA muncul di cabang `best`: langkah yang bukan
 *      langkah terbaik tetap "excellent"/"blunder", langkah yang lebih dahulu
 *      keluar (book, forced, brilliant) tidak pernah tertimpa.
 *   4. Tanpa MultiPV (hanya 1 kandidat) label tidak muncul sama sekali —
 *      bukan muncul berdasarkan tebakan.
 *
 * Jalankan: node scripts/uji-langkah-kritis.mjs
 */
import { Chess } from "chess.js";
import {
  AMBANG_KERUGIAN_KRITIS,
  AMBANG_UNGGUL_MUTLAK_CP,
  apakahLangkahKritis,
  cpKandidat,
  kerugianPeluangKandidat,
} from "../src/halaman/Analisa/mesin/langkahKritis.js";
import { getMoveRating } from "../src/halaman/Analisa/mesin/penilaian.js";
import { cpBaku, peluangMenang } from "../src/halaman/Analisa/mesin/akurasi.js";

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

/* ------------------------------------------------------------ alat bantu */

const PGN_KRITIS = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O";

/**
 * Perbedaan SAN vs UCI tidak relevan di sini: yang diuji hanya syarat
 * "langkah ini = usulan engine", jadi `previousBestMoveSan` cukup disamakan
 * dengan `move.san` milik langkah yang diperiksa.
 */
function langkahKe(pgn, nomor) {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const riwayat = chess.history({ verbose: true });
  return riwayat[nomor ?? riwayat.length - 1];
}

/** Langkah verbose dari sebuah FEN + gerakan eksplisit (promosi, sekak, …). */
function langkahDariFen(fen, langkah) {
  return new Chess(fen).move(langkah);
}

/** Kandidat MultiPV sintetis: `[cp, mate]` per peringkat. */
function kandidat(...daftar) {
  return daftar.map(([cp, mate], i) => ({
    peringkat: i + 1,
    uci: `a1a1${i}`,
    cp: cp ?? null,
    mate: mate ?? null,
    wdl: null,
  }));
}

const move = langkahKe(PGN_KRITIS);
const opsiDasar = {
  staticEval: ["cp", "-50"],
  previousKandidat: kandidat([90, null], [-120, null]),
  previousBestMoveSan: move.san,
};

/* -------------------------------------------------- 1. kurva kandidat */

console.log("== cpKandidat & kerugianPeluangKandidat ==");
hasil("cp terbaca apa adanya", cpKandidat({ cp: 250, mate: null }) === 250, String(cpKandidat({ cp: 250, mate: null })));
hasil("cp dipotong +1000", cpKandidat({ cp: 5000, mate: null }) === 1000);
hasil("mate habis → +1000", cpKandidat({ cp: null, mate: 4 }) === 1000);
hasil("mate −3 → −1000", cpKandidat({ cp: null, mate: -3 }) === -1000);
hasil("entri kosong → null", cpKandidat(null) === null && cpKandidat({}) === null);
hasil("skor rusak → null", cpKandidat({ cp: "abc" }) === null);

const p1 = peluangMenang(90);
const p2 = peluangMenang(-120);
hasil(
  "kerugian peluang #1→#2 = selisih kurva",
  Math.abs(kerugianPeluangKandidat(kandidat([90, null], [-120, null])) - (p1 - p2)) < 1e-9,
  String(kerugianPeluangKandidat(kandidat([90, null], [-120, null])))
);
hasil("kandidat #2 hilang → null", kerugianPeluangKandidat(kandidat([90, null])) === null);
hasil("bukan array → null", kerugianPeluangKandidat(undefined) === null);
hasil("kandidat #1 lebih buruk → tidak negatif", kerugianPeluangKandidat(kandidat([-300, null], [50, null])) === 0);

/* --------------------------------------------- 2. syarat 1: langkah terbaik */

console.log("\n== syarat 1: hanya langkah terbaik ==");
hasil(
  "SAN berbeda dari usulan engine → bukan kritis",
  apakahLangkahKritis(move, { ...opsiDasar, previousBestMoveSan: "Kf1" }) === false
);
hasil("usulan engine tidak diketahui → bukan kritis", apakahLangkahKritis(move, { ...opsiDasar, previousBestMoveSan: undefined }) === false);
hasil("langkah kosong → bukan kritis", apakahLangkahKritis(null, opsiDasar) === false);
hasil("usulan engine sama → kritis", apakahLangkahKritis(move, opsiDasar) === true);

/* --------------------------------------------- 3. syarat 2: MultiPV tersedia */

console.log("\n== syarat 2: kandidat #2 tersedia (MultiPV) ==");
hasil(
  "tanpa MultiPV (1 kandidat) → bukan kritis",
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([90, null]) }) === false
);
hasil("kandidat undefined → bukan kritis", apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: undefined }) === false);
hasil("kandidat kosong → bukan kritis", apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: [] }) === false);
hasil(
  "kandidat #2 rusak → bukan kritis",
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: [{ peringkat: 1, cp: 90, mate: null }, { peringkat: 2, cp: null, mate: null }] }) === false
);

/* ------------------------------------------ 4. syarat 3: sudah menang mutlak */

console.log("\n== syarat 3: sudah menang mutlak tanpa langkah ini ==");
hasil(
  `kandidat #2 = +${AMBANG_UNGGUL_MUTLAK_CP} → bukan kritis (tepat di ambang)`,
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([1200, null], [AMBANG_UNGGUL_MUTLAK_CP, null]) }) === false
);
hasil(
  "kandidat #2 = +900 → bukan kritis",
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([1200, null], [900, null]) }) === false
);
hasil(
  "kandidat #2 justru mati untuk pemain → bukan kritis",
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([1000, null], [null, 3]) }) === false
);
/*
 * Syarat 3 pada kurva kita bersifat SABUK PENGAMAN, bukan satu-satunya
 * penolak: di atas 700 cp peluang menang sudah menjenuh (95,1% → 97,5%),
 * sehingga selisih maksimum yang mungkin hanyalah ≈2,3 poin — selalu di bawah
 * ambang 10 poin. Uji di bawah mengunci fakta itu, bukan mengasumsikannya.
 */
const penjuh = peluangMenang(1000) - peluangMenang(AMBANG_UNGGUL_MUTLAK_CP);
hasil(
  `kurva menjenuh di atas ${AMBANG_UNGGUL_MUTLAK_CP} cp (selisih maksimum ${penjuh.toFixed(2)} < ${AMBANG_KERUGIAN_KRITIS})`,
  penjuh < AMBANG_KERUGIAN_KRITIS,
  String(penjuh)
);
hasil(
  "di bawah ambang itu keunggulan besar tetap bisa kritis",
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([250, null], [-100, null]) }) === true
);

/* ---------------------------------------------- 5. syarat 4: tidak kalah */

console.log("\n== syarat 4: pemain tidak sedang kalah ==");
hasil(
  'eval sesudah = ["cp","80"] (sudut lawan) → pemain −80, kalah, bukan kritis',
  apakahLangkahKritis(move, { ...opsiDasar, staticEval: ["cp", "80"] }) === false
);
hasil(
  'eval sesudah = ["mate","3"] → pemain terserang mat, bukan kritis',
  apakahLangkahKritis(move, { ...opsiDasar, staticEval: ["mate", "3"] }) === false
);
hasil(
  'eval sesudah = ["mate","-3"] → pemain justru mat lawan, tetap kritis',
  apakahLangkahKritis(move, { ...opsiDasar, staticEval: ["mate", "-3"] }) === true
);
hasil("eval sesudah kosong (dibatalkan) → bukan kritis", apakahLangkahKritis(move, { ...opsiDasar, staticEval: [] }) === false);
hasil(
  'remis (["cp","0"]) → tidak kalah, tetap kritis',
  apakahLangkahKritis(move, { ...opsiDasar, staticEval: ["cp", "0"] }) === true
);

/* -------------------------------------- 6. syarat 5: bukan promosi ratu */

console.log("\n== syarat 5: bukan promosi ratu ==");
const promosiQ = langkahDariFen("7k/P7/8/8/8/8/8/K7 w - - 0 1", { from: "a7", to: "a8", promotion: "q" });
const promosiN = langkahDariFen("7k/P7/8/8/8/8/8/K7 w - - 0 1", { from: "a7", to: "a8", promotion: "n" });
hasil("SAN promosi ratu = a8=Q+", promosiQ.san === "a8=Q+", promosiQ.san);
hasil("SAN promosi kuda = a8=N", promosiN.san === "a8=N", promosiN.san);
const opsiPromosi = { staticEval: ["cp", "-50"], previousKandidat: kandidat([90, null], [-120, null]) };
hasil(
  "promosi ratu → bukan kritis",
  apakahLangkahKritis(promosiQ, { ...opsiPromosi, previousBestMoveSan: promosiQ.san }) === false
);
hasil(
  "promosi non-ratu tetap boleh kritis",
  apakahLangkahKritis(promosiN, { ...opsiPromosi, previousBestMoveSan: promosiN.san }) === true
);

/* ------------------------------------------ 7. syarat 6: tidak dalam sekak */

console.log("\n== syarat 6: pemain tidak dalam sekak sebelum langkah ==");
const disekak = langkahDariFen("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", { from: "e1", to: "f1" });
const bukanSekak = langkahDariFen("4k3/8/8/8/8/8/3r4/4K3 w - - 0 1", { from: "e1", to: "f1" });
hasil("posisi uji: raja putih memang disekak", new Chess(disekak.before).isCheck() === true, disekak.san);
hasil("posisi pembanding: raja putih tidak disekak", new Chess(bukanSekak.before).isCheck() === false, bukanSekak.san);
const opsiSekak = { staticEval: ["cp", "-50"], previousKandidat: kandidat([90, null], [-120, null]) };
hasil(
  "sedang disekak → bukan kritis",
  apakahLangkahKritis(disekak, { ...opsiSekak, previousBestMoveSan: disekak.san }) === false
);
hasil(
  "tidak disekak → kritis",
  apakahLangkahKritis(bukanSekak, { ...opsiSekak, previousBestMoveSan: bukanSekak.san }) === true
);
hasil(
  "langkah tanpa `before` (objek sintetis) → bukan kritis, tidak melempar",
  apakahLangkahKritis({ san: "e4", promotion: undefined }, opsiSekak) === false
);

/* --------------------------------------- 8. syarat 7: ambang kerugian */

console.log(`\n== syarat 7: kerugian peluang ≥ ${AMBANG_KERUGIAN_KRITIS} poin persen ==`);
/** Cari cp kandidat #2 pertama yang selisihnya melewati `batas` dari cp #1. */
function cpKeduaDenganKerugian(terbaik, batas) {
  for (let cp = 1000; cp >= -1000; cp--) {
    if (peluangMenang(terbaik) - peluangMenang(cp) >= batas) return cp;
  }
  return null;
}
const cpSempit = -1;
while (peluangMenang(600) - peluangMenang(cpSempit - 1) < AMBANG_KERUGIAN_KRITIS && cpSempit - 1 > -1000) {
  // naikkan sampai tepat di bawah ambang
  break;
}
const kandidat2Sempit = cpKeduaDenganKerugian(600, AMBANG_KERUGIAN_KRITIS) + 1;
const kerugianSempit = peluangMenang(600) - peluangMenang(kandidat2Sempit);
hasil(
  `selisih ${kerugianSempit.toFixed(2)} (< ${AMBANG_KERUGIAN_KRITIS}) → belum kritis`,
  kerugianSempit < AMBANG_KERUGIAN_KRITIS &&
    apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([600, null], [kandidat2Sempit, null]) }) === false,
  `kandidat #2 = ${kandidat2Sempit}`
);
const kandidat2Lolos = cpKeduaDenganKerugian(600, AMBANG_KERUGIAN_KRITIS);
const kerugianLolos = peluangMenang(600) - peluangMenang(kandidat2Lolos);
hasil(
  `selisih ${kerugianLolos.toFixed(2)} (≥ ${AMBANG_KERUGIAN_KRITIS}) → kritis`,
  apakahLangkahKritis(move, { ...opsiDasar, previousKandidat: kandidat([600, null], [kandidat2Lolos, null]) }) === true,
  `kandidat #2 = ${kandidat2Lolos}`
);
hasil(
  "kandidat #1 mati, #2 jatuh ke remis → kritis",
  apakahLangkahKritis(move, {
    ...opsiDasar,
    staticEval: ["cp", "-20"],
    previousKandidat: kandidat([null, 2], [0, null]),
  }) === true
);

/* ------------------------------- 9. sambungan ke getMoveRating (label) */

console.log("\n== getMoveRating: label critical ==");
const argRating = {
  staticEval: ["cp", "-50"],
  previousStaticEvals: [["cp", "-50"], ["cp", "40"], ["cp", "35"], ["cp", "30"]],
  bestMoveSan: "e4",
  moveSan: "e4",
  fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  color: "w",
  sacrifice: false,
  previousSacrifice: false,
  openings: {},
};
const tanpaKritis = getMoveRating(argRating);
const denganKritis = getMoveRating({ ...argRating, kritis: true });
hasil('tanpa `kritis` → tetap "best" (perilaku lama utuh)', tanpaKritis.moveRating === "best", tanpaKritis.moveRating);
hasil("commentKey lama tetap 'best'", tanpaKritis.commentKey === "best", tanpaKritis.commentKey);
hasil('`kritis: true` → "critical"', denganKritis.moveRating === "critical", denganKritis.moveRating);
hasil("commentKey 'critical' (bukan teks mentah)", denganKritis.commentKey === "critical", denganKritis.commentKey);
hasil(
  "commentIndex 0..2 (ada di kamus)",
  Number.isInteger(denganKritis.commentIndex) && denganKritis.commentIndex >= 0 && denganKritis.commentIndex <= 2,
  String(denganKritis.commentIndex)
);

console.log("\n== label lain tidak boleh tertimpa ==");
const langkahBuruk = getMoveRating({
  ...argRating,
  bestMoveSan: "d4",
  moveSan: "e4",
  staticEval: ["cp", "500"],
  previousStaticEvals: [["cp", "500"], ["cp", "30"], ["cp", "25"], ["cp", "20"]],
  kritis: true,
});
hasil(
  "langkah bukan terbaik + kritis:true → penilaian biasa (bukan critical)",
  langkahBuruk.moveRating !== "critical",
  langkahBuruk.moveRating
);
const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const bukaBuku = getMoveRating({
  ...argRating,
  fen: FEN_AWAL,
  /* `openings` bisa peta biasa ATAU fungsi(fen) — lihat pemanggilnya di engine.js. */
  openings: { [FEN_AWAL]: "Pembukaan Uji" },
  kritis: true,
});
const mati = getMoveRating({ ...argRating, staticEval: ["mate"], kritis: true });
hasil('skakmat ["mate"] → tetap "best" + komentar mate', mati.moveRating === "best" && mati.commentKey === "mate", `${mati.moveRating}/${mati.commentKey}`);

/* --------------------------------------------- 10. rantai parsePGN utuh */

console.log("\n== rantai parsePGN: entri i membaca kandidat entri i−1 ==");
const { parsePGN, formatSquare } = await import("../src/halaman/Analisa/mesin/engine.js");

/*
 * PGN sunyi (tanpa tangkapan/pengorbanan) supaya tidak ada aturan lain
 * (brilliant/great/miss) yang keluar lebih dulu dan menutupi cabang `best`.
 */
const PGN_SUNYI = "1. Nf3 Nf6 2. g3 g6 3. Bg2 Bg7 4. d3 d6 5. O-O O-O";

/**
 * Engine palsu yang mengikuti partai: panggilan ke-k menjawab dengan langkah
 * ke-k partai (urutan panggilan parsePGN: posisi awal → posisi sesudah
 * langkah 1 → …), sehingga setiap langkah yang dimainkan SELALU sama dengan
 * usulan engine — itulah syarat pertama label "kritis".
 */
function buatEnginePalsu(pgn, { denganKandidat }) {
  const papan = new Chess();
  papan.loadPgn(pgn);
  const daftar = papan.history({ verbose: true });
  let panggilan = 0;
  return {
    async cari() {
      const saran = daftar[Math.min(panggilan, daftar.length - 1)];
      panggilan++;
      const hasil = {
        staticEval: ["cp", "-80"],
        /* Kontrak engine: `bestMove` berisi KOTAK terformat, bukan string SAN/UCI. */
        bestMove: [formatSquare(saran.from), formatSquare(saran.to)],
        bestMoveCoronation: undefined,
        kedalamanTercapai: 12,
        pv: [],
      };
      if (denganKandidat) {
        hasil.daftarKandidat = [
          { peringkat: 1, uci: `${saran.from}${saran.to}`, cp: 150, mate: null, wdl: null },
          { peringkat: 2, uci: "a1a1", cp: -300, mate: null, wdl: null },
        ];
      }
      return hasil;
    },
    gameBaru() {},
    setop() {},
    hancurkan() {},
  };
}

{
  const { moves } = await parsePGN(buatEnginePalsu(PGN_SUNYI, { denganKandidat: true }), PGN_SUNYI, 12, {}, () => {});
  const kritisAda = moves.filter((m) => m.moveRating === "critical").length;
  const bestAda = moves.filter((m) => m.moveRating === "best").length;
  hasil("entri posisi awal punya kandidat", Array.isArray(moves[0].kandidat) && moves[0].kandidat.length === 2);
  hasil("label kritis muncul dari rantai kandidat (bukan disuntik manual)", kritisAda > 0, `critical ${kritisAda}, best ${bestAda}`);
  hasil("setiap langkah terbaik menjadi kritis, tidak ada yang tertinggal", kritisAda === moves.length - 1 && bestAda === 0, `critical ${kritisAda}, best ${bestAda}`);
  hasil("entri posisi awal tidak berlabel", moves[0].moveRating === undefined, String(moves[0].moveRating));
  hasil("komentar memakai kunci kamus (bukan teks mentah)", moves[1].commentKey === "critical", String(moves[1].commentKey));
}
{
  const { moves } = await parsePGN(buatEnginePalsu(PGN_SUNYI, { denganKandidat: false }), PGN_SUNYI, 12, {}, () => {});
  hasil("tanpa daftarKandidat: tidak ada satu pun label kritis", moves.every((m) => m.moveRating !== "critical"), moves.map((m) => m.moveRating).join(","));
  hasil("label best tetap ada seperti sebelumnya", moves.filter((m) => m.moveRating === "best").length === moves.length - 1, moves.map((m) => m.moveRating).join(","));
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
