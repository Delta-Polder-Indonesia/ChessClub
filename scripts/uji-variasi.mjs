/**
 * Uji VARIASI & TOP LINES fitur Analisa — komponen `Game` ASLI (papan +
 * alur analisis) di atas jsdom dengan engine PALSU deterministik:
 *
 *   1. Top line engine: hasil `cari()` (staticEval + bestMove) masuk ke
 *      entri partai (`previousStaticEvals`, `bestMove`, `bestMoveSan`),
 *      panah langkah terbaik (`fill-bestArrow`) tergambar di papan, dan
 *      label langkah terbaik menjadi "best".
 *   2. Variasi manual: menyeret bidak lewat event mouse DOM asli
 *      (mousedown di bidak → mouseup di kotak tujuan) memicu `analyzeMove`
 *      → baris kustom (customLine) berisi langkah teranalisis engine,
 *      papan bergeser, dan tombol kembali memulihkan partai normal
 *      (`returnedToNormalGame`).
 *   3. Jumlah panggilan engine = 1 per posisi (1 awal + N langkah + 1 variasi).
 *
 * Engine palsu mengikuti antarmuka `EngineAnalisis.cari()` persis; skor dan
 * bestMove dipetakan per FEN sehingga semua hasil deterministik.
 *
 * Jalankan: node scripts/uji-variasi.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { Chess } = await import("chess.js");
const { KonteksMesin } = await import("../src/halaman/Analisa/konteks/mesinKonteks.js");
const { default: AnalyzeContextProvider } = await import("../src/halaman/Analisa/konteks/analyze.jsx");
const { AnalyzeContext } = await import("../src/halaman/Analisa/konteks/analyzeKonteks.js");
const { formatSquare } = await import("../src/halaman/Analisa/mesin/engine.js");
const { default: Game } = await import("../src/halaman/Analisa/komponen/game/game.jsx");

const act = React.act ?? (await import("react-dom/test-utils")).act;

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

/* ------------------------- engine palsu ------------------------- */

const PGN = `[Event "Uji Variasi"]
[Site "localhost"]
[Date "2026.09.10"]
[White "Putih"]
[Black "Hitam"]
[Result "1-0"]
[TimeControl "0/300"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O`;

/* FEN tiap posisi (dihasilkan chess.js dari bagian langkah PGN saja). */
const caturUji = new Chess();
const FEN_POSISI = [caturUji.fen()];
const bagianLangkah = PGN.split(/\n\s*\n/).pop(); // setelah baris kosong = langkah
for (const token of bagianLangkah.split(/\s+/)) {
  if (/^\d+\.+$/.test(token)) continue; // nomor langkah "1."
  if (token.endsWith("#") || token.includes("…")) continue;
  FEN_POSISI.push(caturUji.move(token.replace(/[!?#]+$/, "")).after);
}

/*
 * Skenario skor (sudut pandang pihak bergilir, konvensi engine app):
 *   1.e4      → putih tetap +0.3 (diff 0)   → excellent
 *   1...e5    → putih +0.3  (diff 0)        → excellent
 *   2.Nf3     → putih +0.5  (diff -0.2)     → excellent
 *   2...Nc6   → putih +0.5  (diff 0)        → excellent
 *   3.Bc4     → putih -5.0  (diff 5.5)      → BLUNDER
 *   3...Bc5   → putih -5.0  (diff 0)        → excellent
 *   4.O-O     → putih -5.2  (diff -0.2)     → excellent
 *   4...Nf6   → putih -5.2  (diff 0)        → excellent
 *   5.d3      → putih -5.4  (diff -0.2)     → excellent
 *   5...O-O   → putih -5.4  (diff 0)        → excellent
 */
const SKOR_PUTIH = [0.3, 0.3, 0.5, 0.5, -5.0, -5.0, -5.2, -5.2, -5.4, -5.4]; // setelah tiap setangan
/*
 * Bentuk keluaran `cari()` persis seperti EngineAnalisis: `bestMove` adalah
 * pasangan objek {col, row} (lihat formatSquare di mesin/engine.js).
 * Saran engine harus LEGAL bagi pihak yang bergilir (moveToSan memvalidasi).
 */
const kotak = (s) => formatSquare(s);
function saranEngine(fen) {
  const c = new Chess(fen);
  const gerak = c.moves({ verbose: true });
  const pilihan =
    gerak.find((m) => m.from === "h2" && m.to === "h3") ??
    gerak.find((m) => m.from === "h7" && m.to === "h6") ??
    gerak[0];
  return { bestMove: [kotak(pilihan.from), kotak(pilihan.to)], san: pilihan.san };
}
const PETA_EVAL = {};
PETA_EVAL[FEN_POSISI[0]] = { staticEval: ["cp", "30"], bestMove: [kotak("e2"), kotak("e4")] }; // 1.e4 = usulan engine → "best"
for (let i = 0; i < 10; i++) {
  const giliranPutih = i % 2 === 0; // setelah i%2==0 (putih main), giliran hitam
  const sudutPutih = SKOR_PUTIH[i];
  const saran = saranEngine(FEN_POSISI[i + 1]);
  PETA_EVAL[FEN_POSISI[i + 1]] = {
    staticEval: ["cp", String(giliranPutih ? Math.round(-sudutPutih * 100) : Math.round(sudutPutih * 100))],
    bestMove: saran.bestMove,
    san: saran.san, // dicatat untuk ekspektasi bestMoveSan
  };
}

class EnginePalsu {
  constructor() {
    this.jumlahCari = 0;
  }
  async siapkan() {}
  async cari(fen, { kedalaman } = {}) {
    this.jumlahCari++;
    const skrip = PETA_EVAL[fen];
    if (!skrip) throw new Error(`EnginePalsu: FEN tidak dikenal: ${fen}`);
    return {
      staticEval: skrip.staticEval,
      bestMove: skrip.bestMove,
      bestMoveCoronation: undefined,
      kedalamanTercapai: kedalaman,
      pv: [],
    };
  }
  gameBaru() {}
  setop() {}
  hancurkan() {}
}

const engine = new EnginePalsu();
const NILAI_MESIN_PALSU = {
  idEngine: "engine-palsu",
  gantiEngine: () => {},
  status: "siap",
  galat: "",
  siapkan: async () => engine,
  setop: () => {},
  ambilMesin: () => engine,
  didukung: true,
};

/* ------------------------- render ------------------------- */

const el = document.getElementById("root");
const root = createRoot(el);

let ctx = null;
function Probe() {
  ctx = React.useContext(AnalyzeContext);
  return null;
}

const wadah = React.createRef();

act(() => {
  root.render(
    React.createElement(
      I18nProvider,
      null,
      React.createElement(
        KonteksMesin.Provider,
        { value: NILAI_MESIN_PALSU },
        React.createElement(
          AnalyzeContextProvider,
          null,
          React.createElement(Probe),
          React.createElement(Game, { wadah })
        )
      )
    )
  );
});

/* Muat PGN lewat konteks (persis seperti areaKerja.jsx). */
await act(async () => {
  ctx.data[1]({ format: "pgn", string: PGN });
  await new Promise((r) => setTimeout(r, 20));
});

/* ------------------------- 1. hasil analisis & top line ------------------------- */

console.log("== alur PGN → analisis (engine palsu) ==");
hasil('pageState menjadi "analyze"', ctx.pageState[0] === "analyze", ctx.pageState[0]);
hasil(
  'pemain dari header PGN: ["Putih", "Hitam"]',
  ctx.players[0][0].name === "Putih" && ctx.players[0][1].name === "Hitam",
  JSON.stringify(ctx.players[0].map((p) => p.name))
);
hasil('hasil "1-0" terbaca', ctx.result[0] === "1-0", ctx.result[0]);
hasil(
  "partai: 1 entri awal + 10 langkah",
  ctx.game[0].length === 11,
  `panjang ${ctx.game[0].length}`
);
hasil(
  "engine dipanggil 1× per posisi (11 kali)",
  engine.jumlahCari === 11,
  `dipanggil ${engine.jumlahCari}×`
);

const langkah1 = ctx.game[0][1];
hasil('1.e4: san "e4", giliran "b"', langkah1.san === "e4" && langkah1.color === "b");
hasil(
  '1.e4: previousStaticEvals[0] = ["cp","-30"] (sudut hitam, putih +0.3)',
  JSON.stringify(langkah1.previousStaticEvals[0]) === JSON.stringify(["cp", "-30"]),
  JSON.stringify(langkah1.previousStaticEvals[0])
);
const entriAwal = ctx.game[0][0];
hasil(
  'posisi awal: saran engine e4 (bestMove {col,row} + bestMoveSan "e4")',
  entriAwal.bestMoveSan === "e4" &&
    JSON.stringify(entriAwal.bestMove) === JSON.stringify([kotak("e2"), kotak("e4")]),
  JSON.stringify(entriAwal.bestMove) + " / " + entriAwal.bestMoveSan
);
const saranSetelahE4 = PETA_EVAL[FEN_POSISI[1]];
hasil(
  '1.e4: bestMove ENTRI = saran engine di posisi SESUDAH e4 (h6, giliran hitam)',
  JSON.stringify(langkah1.bestMove) === JSON.stringify(saranSetelahE4.bestMove) &&
    langkah1.bestMoveSan === saranSetelahE4.san,
  JSON.stringify(langkah1.bestMove) + " / " + langkah1.bestMoveSan
);
hasil('1.e4: langkah = usulan engine di posisi awal → label "best"', langkah1.moveRating === "best", langkah1.moveRating);
hasil(
  '1.e4: movement {col,row} e2→e4',
  JSON.stringify(langkah1.movement) === JSON.stringify([kotak("e2"), kotak("e4")]),
  JSON.stringify(langkah1.movement)
);

const langkahBc4 = ctx.game[0][5];
hasil('3.Bc4: label "blunder" (keunggulan 0.5 → -5.0)', langkahBc4.moveRating === "blunder", langkahBc4.moveRating);

console.log("\n== top line: panah langkah terbaik di papan ==");
// Di posisi awal (tanpa langkah) panah disengaja disembunyikan
// (highlightRating belum ada). Geser ke langkah 1 untuk melihat top line.
await act(async () => {
  ctx.gameController.forward();
  await new Promise((r) => setTimeout(r, 5));
});
hasil("setelah forward, moveNumber 1", ctx.moveNumber[0] === 1, `moveNumber ${ctx.moveNumber[0]}`);
hasil(
  'SVG panah "fill-bestArrow" tergambar (saran engine dari posisi setelah 1.e4)',
  el.innerHTML.includes("fill-bestArrow")
);
await act(async () => {
  ctx.gameController.back();
  await new Promise((r) => setTimeout(r, 5));
});
hasil("kembali ke posisi awal", ctx.moveNumber[0] === 0);

/* ------------------------- 2. variasi manual (drag) ------------------------- */

console.log("\n== variasi manual: seret bidak e2 → e4 ==");

function kirimEvent(node, tipe, tombol = 0) {
  node.dispatchEvent(
    new window.MouseEvent(tipe, { bubbles: true, cancelable: true, button: tombol, clientX: 0, clientY: 0 })
  );
}

const kotakE2 = el.querySelector('[data-square="e2"]');
hasil("kotak e2 ada di DOM", Boolean(kotakE2));
const bidakE2 = kotakE2?.querySelector("[data-dontcleandrag]");
hasil("bidak putih e2 ada di DOM", Boolean(bidakE2));

let _dragTersimpan = null;
act(() => {
  kirimEvent(bidakE2, "mousedown");


});
// Titik langkah legal untuk KOSONG (e4): div justify-center + child bg-black.
const titikE4 = () => {
  const kotak = el.querySelector('[data-square="e4"]');
  return kotak ? kotak.querySelector(".justify-center") : null;
};
const adaTitikE4 = Boolean(titikE4());
hasil(
  "setelah mousedown, kotak e4 menampilkan titik langkah legal (drag aktif)",
  adaTitikE4
);

if (adaTitikE4) {
  await act(async () => {
    kirimEvent(titikE4(), "mouseup");
    await new Promise((r) => setTimeout(r, 20));
  });

  const garis = ctx.customLine[0];
  hasil("customLine aktif (moveNumber 0)", garis.moveNumber === 0, `moveNumber ${garis.moveNumber}`);
  const m = garis.moves[0];
  hasil(
    'variasi: san "e4", movement {col,row} e2→e4',
    m?.san === "e4" && JSON.stringify(m?.movement) === JSON.stringify([kotak("e2"), kotak("e4")]),
    m ? `${m.san} ${JSON.stringify(m.movement)}` : "-"
  );
  hasil(
    "variasi: fen = posisi setelah e4",
    m?.fen === FEN_POSISI[1],
    m?.fen
  );
  hasil(
    "variasi: evaluasi engine tersimpan (cp -30 dari sisi hitam)",
    m && JSON.stringify(m.previousStaticEvals?.[0]) === JSON.stringify(["cp", "-30"]),
    m && JSON.stringify(m.previousStaticEvals?.[0])
  );
  hasil(
    "variasi: label \"best\" (e4 memang usulan engine di posisi awal)",
    m?.moveRating === "best",
    m?.moveRating
  );
  hasil("analyzingMove dilepas (finally)", ctx.analyzingMove[0] === false);
  hasil("engine dipanggil sekali lagi (total 12)", engine.jumlahCari === 12, `dipanggil ${engine.jumlahCari}×`);
  hasil(
    "papan menampilkan bidak di e4",
    Boolean(el.querySelector('[data-square="e4"] [data-dontcleandrag]'))
  );

  console.log("\n== kembali ke partai normal ==");
  await act(async () => {
    ctx.gameController.back();
    await new Promise((r) => setTimeout(r, 5));
  });
  hasil("kembali: customLine dilepas (moveNumber -1)", ctx.customLine[0].moveNumber === -1, `moveNumber ${ctx.customLine[0].moveNumber}`);
  hasil("kembali: returnedToNormalGame terisi", ctx.returnedToNormalGame[0] !== null);
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
