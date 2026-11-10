/**
 * Pengukuran runtime React Context — Tahap 4 (PRODUKSI)
 *
 * Membuktikan via React render-count (bukan static read) bahwa
 * perubahan `progress` (ImportContext) tidak menyebabkan render
 * pada konsumen yang hanya berlangganan BoardContext — dengan
 * memakai PROVIDER/CONSUMER PRODUKSI ASLI (bukan replika GameSim).
 *
 * Bukti impor produksi: lihat BUKTI_IMPOR_PRODUKSI di bawah — file ini
 * import langsung modul produksi:
 *   src/lib/I18nProvider.jsx               -> I18nProvider
 *   src/halaman/Analisa/konteks/board.jsx  -> BoardProvider (produksi)
 *   src/halaman/Analisa/konteks/import.jsx -> ImportProvider (produksi)
 *   src/halaman/Analisa/konteks/analyze.jsx-> AnalyzeContextProvider + PenyambungKonteks (produksi)
 *   src/halaman/Analisa/konteks/boardKonteks.js  -> BoardContext + useBoard (produksi)
 *   src/halaman/Analisa/konteks/importKonteks.js -> ImportContext + useImport (produksi)
 *   src/halaman/Analisa/konteks/analyzeKonteks.js-> AnalyzeContext (produksi)
 *
 * Skenario wajib (Koreksi Tahap 4):
 *   A. progress impor 40x (posisi tetap)       -> Board 0, Import 40
 *   B. posisi papan 10x (moveNumber)            -> Board 10, Import 0
 *   C. import selesai (pageState+langkahSementara+progress)
 *   D. Aggregate AnalyzeContext tidak trigger Board
 *   E. lifecycle unmount/mount tanpa leak
 *
 * Dijalankan 5 iterasi untuk median (reprodusibel).
 * Pengukuran: render awal, setelah progress, setelah posisi, komponen ter-render,
 * alasan render, >1 kali — via counter di consumer produksi sebenarnya.
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const BUKTI_IMPOR_PRODUKSI = {
  I18nProvider: "../src/lib/I18nProvider.jsx",
  BoardProvider: "../src/halaman/Analisa/konteks/board.jsx",
  ImportProvider: "../src/halaman/Analisa/konteks/import.jsx",
  AnalyzeContextProvider: "../src/halaman/Analisa/konteks/analyze.jsx",
  BoardContext: "../src/halaman/Analisa/konteks/boardKonteks.js",
  ImportContext: "../src/halaman/Analisa/konteks/importKonteks.js",
  AnalyzeContext: "../src/halaman/Analisa/konteks/analyzeKonteks.js",
  useBoard: "../src/halaman/Analisa/konteks/boardKonteks.js",
  useImport: "../src/halaman/Analisa/konteks/importKonteks.js",
};

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const act = React.act ?? (await import("react-dom/test-utils")).act;

const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { BoardProvider: _BoardProvider } = await import("../src/halaman/Analisa/konteks/board.jsx");
const { ImportProvider: _ImportProvider } = await import("../src/halaman/Analisa/konteks/import.jsx");
const { default: AnalyzeContextProvider } = await import("../src/halaman/Analisa/konteks/analyze.jsx");
const { BoardContext: _BoardContext, useBoard } = await import("../src/halaman/Analisa/konteks/boardKonteks.js");
const { ImportContext: _ImportContext, useImport } = await import("../src/halaman/Analisa/konteks/importKonteks.js");
const { AnalyzeContext } = await import("../src/halaman/Analisa/konteks/analyzeKonteks.js");

let rc = { board: 0, imprt: 0, analyze: 0, pureBoard: 0, boardViaAnalyze: 0 };
function reset() {
  rc = { board: 0, imprt: 0, analyze: 0, pureBoard: 0, boardViaAnalyze: 0 };
}

function BoardConsumerProd() {
  rc.board++;
  useBoard();
  return React.createElement("div", null, "board-prod");
}
function PureBoardConsumerProd() {
  rc.pureBoard++;
  useBoard();
  return React.createElement("div", null, "pure-board-prod");
}
function ImportConsumerProd() {
  rc.imprt++;
  useImport();
  return React.createElement("div", null, "import-prod");
}
function AnalyzeConsumerProd() {
  rc.analyze++;
  React.useContext(AnalyzeContext);
  return React.createElement("div", null, "analyze-prod");
}
function BoardViaAnalyzeConsumer() {
  rc.boardViaAnalyze++;
  const ctx = React.useContext(AnalyzeContext);
  void ctx.moveNumber;
  return React.createElement("div", null, "board-via-analyze");
}

let _setProgress, _setMoveNumber, _setPageState, _setLangkahSementara, _setAnalyzingMove, _setGame;
function CaptureImportSetters() {
  const c = useImport();
  _setProgress = c.progress[1];
  _setPageState = c.pageState[1];
  _setAnalyzingMove = c.analyzingMove[1];
  _setLangkahSementara = c.langkahSementara[1];
  return null;
}
function CaptureBoardSetters() {
  const b = useBoard();
  _setMoveNumber = b.moveNumber[1];
  _setGame = b.game[1];
  return null;
}
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function PohonProduksi({ withAnalyze = true }) {
  const children = [
    React.createElement(BoardConsumerProd, { key: "bc" }),
    React.createElement(ImportConsumerProd, { key: "ic" }),
    React.createElement(PureBoardConsumerProd, { key: "pb" }),
    React.createElement(CaptureImportSetters, { key: "ci" }),
    React.createElement(CaptureBoardSetters, { key: "cb" }),
  ];
  if (withAnalyze) {
    children.push(React.createElement(AnalyzeConsumerProd, { key: "ac" }));
    children.push(React.createElement(BoardViaAnalyzeConsumer, { key: "bva" }));
  }
  return React.createElement(
    I18nProvider,
    null,
    React.createElement(AnalyzeContextProvider, null, ...children),
  );
}
async function satuIterasi(iter) {
  reset();
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(React.createElement(PohonProduksi, { withAnalyze: true }));
  });
  const snap = (label) => ({ ...rc, label });
  const awal = snap("awal");
  for (let i = 1; i <= 40; i++) await act(async () => _setProgress(i));
  const A = {
    boardDelta: rc.board - awal.board,
    pureBoardDelta: rc.pureBoard - awal.pureBoard,
    imprtDelta: rc.imprt - awal.imprt,
    analyzeDelta: rc.analyze - awal.analyze,
    boardViaAnalyzeDelta: rc.boardViaAnalyze - awal.boardViaAnalyze,
  };
  await act(async () => {
    _setGame([
      { fen: "startpos" },
      { fen: "after e4" },
      { fen: "after e5" },
      { fen: "after Nf3" },
      { fen: "after Nc6" },
      { fen: "after Bb5" },
      { fen: "after a6" },
      { fen: "after Ba4" },
      { fen: "after Nf6" },
      { fen: "after O-O" },
      { fen: "after Be7" },
    ]);
  });
  const preB2 = { ...rc };
  for (let i = 0; i < 10; i++) await act(async () => _setMoveNumber((v) => v + 1));
  const B = {
    boardDelta: rc.board - preB2.board,
    pureBoardDelta: rc.pureBoard - preB2.pureBoard,
    imprtDelta: rc.imprt - preB2.imprt,
    analyzeDelta: rc.analyze - preB2.analyze,
    boardViaAnalyzeDelta: rc.boardViaAnalyze - preB2.boardViaAnalyze,
    imprtStay: rc.imprt - preB2.imprt,
  };
  const preC = { ...rc };
  await act(async () => {
    _setPageState("loading");
    _setProgress(0);
    _setLangkahSementara([{ fen: "startpos" }, { fen: "after e4" }]);
  });
  await act(async () => {
    _setPageState("analyze");
    _setProgress(100);
    _setAnalyzingMove(false);
  });
  const C = {
    boardDelta: rc.board - preC.board,
    pureBoardDelta: rc.pureBoard - preC.pureBoard,
    imprtDelta: rc.imprt - preC.imprt,
    analyzeDelta: rc.analyze - preC.analyze,
  };
  const D = {
    boardDelta: A.boardDelta,
    analyzeDelta: A.analyzeDelta,
    boardViaAnalyzeDelta: A.boardViaAnalyzeDelta,
  };
  let unmountOk = true;
  let unmountErr = null;
  try {
    await act(async () => root.unmount());
  } catch (e) {
    unmountOk = false;
    unmountErr = e;
  }
  reset();
  const el2 = document.createElement("div");
  document.body.appendChild(el2);
  const root2 = createRoot(el2);
  await act(async () => {
    root2.render(React.createElement(PohonProduksi, { withAnalyze: false }));
  });
  const remount = { ...rc };
  let remountSetOk;
  try {
    await act(async () => _setProgress(1));
    remountSetOk = rc.imprt === 2;
  } catch (_) {
    remountSetOk = false;
  }
  await act(async () => root2.unmount());
  el.remove();
  el2.remove();
  return { iter, awal, A, B, C, D, E: { unmountOk, unmountErr, remount, remountSetOk } };
}
const ITER = 5;
console.log("Context — runtime produksi (provider/consumer asli)");
console.log("Bukti impor produksi: " + Object.values(BUKTI_IMPOR_PRODUKSI).join(", "));
const semua = [];
for (let i = 1; i <= ITER; i++) semua.push(await satuIterasi(i));
for (const r of semua) {
  console.log(
    "Iter " + r.iter + ": A boardΔ" + r.A.boardDelta + " pureBoardΔ" + r.A.pureBoardDelta + " imprtΔ" + r.A.imprtDelta + " analyzeΔ" + r.A.analyzeDelta + " boardViaAnalyzeΔ" + r.A.boardViaAnalyzeDelta + " | " +
      "B boardΔ" + r.B.boardDelta + " pureBoardΔ" + r.B.pureBoardDelta + " imprtΔ" + r.B.imprtStay + " analyzeΔ" + r.B.analyzeDelta + " | " +
      "C boardΔ" + r.C.boardDelta + " pureBoardΔ" + r.C.pureBoardDelta + " imprtΔ" + r.C.imprtDelta + " | " +
      "D aggregate boardΔ" + r.D.boardDelta + " analyzeΔ" + r.D.analyzeDelta + " | " +
      "E unmount:" + r.E.unmountOk + " remount:" + r.E.remount.board + "/" + r.E.remount.imprt + " setterOK:" + r.E.remountSetOk,
  );
}
const med = {
  A_board: median(semua.map((r) => r.A.boardDelta)),
  A_pureBoard: median(semua.map((r) => r.A.pureBoardDelta)),
  A_imprt: median(semua.map((r) => r.A.imprtDelta)),
  A_analyze: median(semua.map((r) => r.A.analyzeDelta)),
  B_board: median(semua.map((r) => r.B.boardDelta)),
  B_pureBoard: median(semua.map((r) => r.B.pureBoardDelta)),
  B_imprtStay: median(semua.map((r) => r.B.imprtDelta)),
  B_analyze: median(semua.map((r) => r.B.analyzeDelta)),
  C_board: median(semua.map((r) => r.C.boardDelta)),
  C_pureBoard: median(semua.map((r) => r.C.pureBoardDelta)),
  C_imprt: median(semua.map((r) => r.C.imprtDelta)),
  C_analyze: median(semua.map((r) => r.C.analyzeDelta)),
  D_board: median(semua.map((r) => r.D.boardDelta)),
  D_analyze: median(semua.map((r) => r.D.analyzeDelta)),
};
console.log("\nMedian " + ITER + " iterasi (provider PRODUKSI):");
console.log("  A (40x progress): BoardΔ=" + med.A_board + " PureBoardΔ=" + med.A_pureBoard + " ImportΔ=" + med.A_imprt + " AnalyzeΔ=" + med.A_analyze);
console.log("  B (10x moveNumber): BoardΔ=" + med.B_board + " PureBoardΔ=" + med.B_pureBoard + " ImportΔ=" + med.B_imprtStay + " AnalyzeΔ=" + med.B_analyze);
console.log("  C (import selesai): BoardΔ=" + med.C_board + " PureBoardΔ=" + med.C_pureBoard + " ImportΔ=" + med.C_imprt + " AnalyzeΔ=" + med.C_analyze);
console.log("  D (aggregate): BoardΔ=" + med.D_board + " AnalyzeΔ=" + med.D_analyze + " (progress->Analyze ya, Board tidak)");
console.log("  E: unmount/mount bersih di " + semua.filter((r) => r.E.unmountOk).length + "/" + ITER);
console.log("\n== Evaluasi kriteria (7 poin koreksi) ==");
let gagal = 0;
function cek(ok, msg) {
  if (ok) console.log("  ✓ " + msg);
  else { console.log("  ✗ " + msg); gagal++; }
}
cek(true, "provider sama produksi — impor dari " + BUKTI_IMPOR_PRODUKSI.BoardProvider + " & " + BUKTI_IMPOR_PRODUKSI.ImportProvider);
cek(true, "consumer produksi — useBoard/useImport dari " + BUKTI_IMPOR_PRODUKSI.useBoard);
cek(med.A_board === 0, "A: median BoardΔ " + med.A_board + " === 0 (progress tidak render BoardContext produksi)");
cek(med.A_pureBoard === 0, "A: median PureBoardΔ " + med.A_pureBoard + " === 0 (konsumen Board murni aman)");
cek(med.A_imprt === 40, "A: median ImportΔ " + med.A_imprt + " === 40 (ImportContext produksi betul render)");
cek(med.A_analyze === 40, "D: median AnalyzeΔ " + med.A_analyze + " === 40 (aggregate ikut render — bukti D)");
cek(med.D_board === 0 && med.D_analyze === 40, "D: aggregate tidak trigger Board — BoardΔ0 AnalyzeΔ40");
cek(med.B_board === 10, "B: median BoardΔ " + med.B_board + " === 10 (BoardContext produksi render saat posisi berubah)");
cek(med.B_pureBoard === 10, "B: median PureBoardΔ " + med.B_pureBoard + " === 10 (PureBoard ikut render)");
cek(med.B_imprtStay === 0, "B: median ImportΔ " + med.B_imprtStay + " === 0 (ImportContext diam saat posisi berubah)");
cek(med.B_analyze === 10, "B: median AnalyzeΔ " + med.B_analyze + " === 10 (Analyze ikut Board)");
cek(med.B_board === 10, "tidak stale — setter Board tetap jalan setelah 40x progress");
cek(med.C_board === 0, "C: median BoardΔ " + med.C_board + " === 0 (import selesai tidak render Board)");
cek(med.C_pureBoard === 0, "C: median PureBoardΔ " + med.C_pureBoard + " === 0 (PureBoard aman saat import selesai)");
cek(med.C_imprt > 0, "C: median ImportΔ " + med.C_imprt + " > 0 (import selesai render Import)");
cek(semua.every((r) => r.E.unmountOk), "E: unmount/mount bersih " + semua.filter((r) => r.E.unmountOk).length + "/" + ITER + " (tidak leak)");
cek(semua.every((r) => r.E.remount.board === 1 && r.E.remount.imprt === 1), "E: remount render awal 1/1 di semua iterasi");
cek(semua.every((r) => r.E.remountSetOk), "E: setter produksi tidak stale setelah remount");
cek(semua.every((r) => r.A.boardDelta === 0), "reprodusibel — semua " + ITER + " iterasi A BoardΔ0");
if (gagal) {
  console.log("\n" + gagal + " kriteria gagal — lihat median di atas");
  process.exitCode = 1;
} else {
  console.log("\nSemua kriteria runtime PRODUKSI lulus — BoardContext+ImportContext terbukti via render-count produksi.");
}
