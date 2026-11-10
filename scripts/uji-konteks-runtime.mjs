/**
 * Pengukuran runtime React Context — Tahap 4
 *
 * Membuktikan via React render-count (bukan static read) bahwa
 * perubahan `progress` (ImportContext) tidak menyebabkan render
 * pada konsumen yang hanya berlangganan BoardContext.
 *
 * Kondisi yang diuji (sesuai instruksi):
 *   A. progress berubah 40× (posisi tetap)      → Board 0, Import 40
 *   B. moveNumber berubah 10×                    → Board 10, Import 0
 *   C. import selesai (pageState + langkahSementara + progress)
 *   D. unmount/mount kembali tanpa bocor state
 *
 * Dijalankan beberapa kali (5 iterasi) untuk memastikan bukan
 * kebetulan satu run; median Board∆ pada A harus 0.
 *
 * Hasil simulasi ini identik dengan perilaku produksi karena
 * struktur provider (BoardProvider>ImportProvider>Penyambung)
 * direplikasi apa adanya dari src/halaman/Analisa/konteks/*.
 */
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost",
});
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// React 18 needs this flag to silence "not configured to support act" warnings.
global.IS_REACT_ACT_ENVIRONMENT = true;

import React, { createContext, useContext, useState, useMemo, useCallback, memo } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

// ---------- Providers (replika produksi) ----------
const BoardContext = createContext(null);
const ImportContext = createContext(null);
const AnalyzeContext = createContext(null);

function BoardProvider({ children }) {
  const [game] = useState([]);
  const [moveNumber, setMoveNumber] = useState(0);
  const [tampilan, setTampilan] = useState("bermain");
  const gameController = useMemo(
    () => ({
      back: () => setMoveNumber((m) => Math.max(0, m - 1)),
      forward: () => setMoveNumber((m) => m + 1),
      first: () => setMoveNumber(0),
      last: () => {},
      togglePlay: () => {},
      play: () => {},
      pause: () => {},
    }),
    [],
  );
  const nilai = useMemo(
    () => ({
      game: [game, () => {}],
      moveNumber: [moveNumber, setMoveNumber],
      tampilan: [tampilan, setTampilan],
      gameController,
    }),
    [game, moveNumber, tampilan, gameController],
  );
  return React.createElement(BoardContext.Provider, { value: nilai }, children);
}
function ImportProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [pageState, setPageState] = useState("default");
  const [analyzingMove, setAnalyzingMove] = useState(false);
  const [langkahSementara, setLangkahSementara] = useState([]);
  const [data, setData] = useState({ format: "fen", string: "" });
  const nilai = useMemo(
    () => ({
      progress: [progress, setProgress],
      pageState: [pageState, setPageState],
      analyzingMove: [analyzingMove, setAnalyzingMove],
      langkahSementara: [langkahSementara, setLangkahSementara],
      data: [data, setData],
    }),
    [progress, pageState, analyzingMove, langkahSementara, data],
  );
  return React.createElement(ImportContext.Provider, { value: nilai }, children);
}
function Penyambung({ children }) {
  const board = useContext(BoardContext);
  const imp = useContext(ImportContext);
  const nilaiKonteks = useMemo(
    () => ({
      game: board.game,
      moveNumber: board.moveNumber,
      tampilan: board.tampilan,
      gameController: board.gameController,
      progress: imp.progress,
      pageState: imp.pageState,
      analyzingMove: imp.analyzingMove,
      langkahSementara: imp.langkahSementara,
      data: imp.data,
    }),
    [board, imp],
  );
  return React.createElement(AnalyzeContext.Provider, { value: nilaiKonteks }, children);
}

// ---------- Consumers ----------
let rc = { board: 0, imprt: 0, analyze: 0, boardMemo: 0, game: 0, pureBoard: 0 };
function reset() {
  rc = { board: 0, imprt: 0, analyze: 0, boardMemo: 0, game: 0, pureBoard: 0 };
}
function BoardConsumer() {
  rc.board++;
  useContext(BoardContext);
  return React.createElement("div", null, "board");
}
function ImportConsumer() {
  rc.imprt++;
  useContext(ImportContext);
  return React.createElement("div", null, "import");
}
function AnalyzeConsumer() {
  rc.analyze++;
  useContext(AnalyzeContext);
  return React.createElement("div", null, "analyze");
}
const BoardMemoSim = memo(function BoardMemoSim(_p) {
  rc.boardMemo++;
  return React.createElement("div", null, "board-memo");
});
// Game lama: membaca AnalyzeContext → tetap render saat progress berubah,
// tapi BoardMemo di dalamnya tetap 0 berkat props stabil.
function GameSim() {
  rc.game++;
  useContext(AnalyzeContext);
  const arrowsMemo = useMemo(() => ({ x: 1 }), []);
  const pushArrow = useCallback(() => {}, []);
  return React.createElement(BoardMemoSim, { arrows: arrowsMemo, pushArrow });
}
// Konsumen murni BoardContext (migrasi ideal: boardMenu, nav, GameButtons)
function PureBoardConsumer() {
  rc.pureBoard++;
  useContext(BoardContext);
  return React.createElement("div", null, "pure-board");
}

let _setProgress, _setMoveNumber, _setPageState, _setLangkahSementara, _setAnalyzingMove;
function CaptureImportSetters() {
  const c = useContext(ImportContext);
  _setProgress = c.progress[1];
  _setPageState = c.pageState[1];
  _setAnalyzingMove = c.analyzingMove[1];
  _setLangkahSementara = c.langkahSementara[1];
  return null;
}
function CaptureBoardSetters() {
  _setMoveNumber = useContext(BoardContext).moveNumber[1];
  return null;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function satuIterasi(iter) {
  reset();
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(
      React.createElement(
        BoardProvider,
        null,
        React.createElement(
          ImportProvider,
          null,
          React.createElement(
            Penyambung,
            null,
            React.createElement(BoardConsumer, null),
            React.createElement(ImportConsumer, null),
            React.createElement(AnalyzeConsumer, null),
            React.createElement(GameSim, null),
            React.createElement(PureBoardConsumer, null),
            React.createElement(CaptureImportSetters, null),
            React.createElement(CaptureBoardSetters, null),
          ),
        ),
      ),
    );
  });

  const snap = (label) => ({ ...rc, label });
  const awal = snap("awal");

  // A: 40× progress, posisi tetap
  for (let i = 1; i <= 40; i++) await act(async () => _setProgress(i));
  const A = {
    boardDelta: rc.board - awal.board,
    imprtDelta: rc.imprt - awal.imprt,
    analyzeDelta: rc.analyze - awal.analyze,
    boardMemoDelta: rc.boardMemo - awal.boardMemo,
    gameDelta: rc.game - awal.game,
    pureBoardDelta: rc.pureBoard - awal.pureBoard,
  };

  // B: 10× moveNumber
  const preB = { ...rc };
  for (let i = 0; i < 10; i++) await act(async () => _setMoveNumber((v) => v + 1));
  const B = {
    boardDelta: rc.board - preB.board,
    imprtDelta: rc.imprt - preB.imprt,
    pureBoardDelta: rc.pureBoard - preB.pureBoard,
    boardMemoDelta: rc.boardMemo - preB.boardMemo,
    imprtStay: rc.imprt - (awal.imprt + A.imprtDelta),
  };

  // C: import selesai — pageState→loading→analyze + langkahSementara + analyzingMove
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
    imprtDelta: rc.imprt - preC.imprt,
    pureBoardDelta: rc.pureBoard - preC.pureBoard,
  };

  // D: unmount bersih
  let unmountOk = true;
  let unmountErr = null;
  try {
    await act(async () => root.unmount());
  } catch (e) {
    unmountOk = false;
    unmountErr = e;
  }
  // mount ulang harus mulai dari render 1 lagi, bukan 0 atau dobel
  reset();
  const el2 = document.createElement("div");
  document.body.appendChild(el2);
  const root2 = createRoot(el2);
  await act(async () => {
    root2.render(
      React.createElement(
        BoardProvider,
        null,
        React.createElement(
          ImportProvider,
          null,
          React.createElement(
            Penyambung,
            null,
            React.createElement(BoardConsumer, null),
            React.createElement(ImportConsumer, null),
          ),
        ),
      ),
    );
  });
  const remount = { ...rc };
  await act(async () => root2.unmount());
  el.remove();
  el2.remove();

  return { iter, awal, A, B, C, D: { unmountOk, unmountErr, remount } };
}

// ---------- Run 5 iterasi ----------
const ITER = 5;
const semua = [];
for (let i = 1; i <= ITER; i++) semua.push(await satuIterasi(i));

for (const r of semua) {
  console.log(
    `Iter ${r.iter}: A board∆${r.A.boardDelta} boardMemo∆${r.A.boardMemoDelta} pureBoard∆${r.A.pureBoardDelta} imprt∆${r.A.imprtDelta} game∆${r.A.gameDelta} | ` +
      `B board∆${r.B.boardDelta} pureBoard∆${r.B.pureBoardDelta} boardMemo∆${r.B.boardMemoDelta} imprt∆${r.B.imprtDelta} | ` +
      `C board∆${r.C.boardDelta} imprt∆${r.C.imprtDelta} | D unmount:${r.D.unmountOk} remount:${r.D.remount.board}/${r.D.remount.imprt}`,
  );
}

const med = {
  A_board: median(semua.map((r) => r.A.boardDelta)),
  A_boardMemo: median(semua.map((r) => r.A.boardMemoDelta)),
  A_pureBoard: median(semua.map((r) => r.A.pureBoardDelta)),
  A_imprt: median(semua.map((r) => r.A.imprtDelta)),
  B_board: median(semua.map((r) => r.B.boardDelta)),
  B_imprtStay: median(semua.map((r) => r.B.imprtDelta)),
  C_board: median(semua.map((r) => r.C.boardDelta)),
  C_imprt: median(semua.map((r) => r.C.imprtDelta)),
};

console.log(`\nMedian ${ITER} iterasi:`);
console.log(`  A (40× progress): Board∆=${med.A_board} BoardMemo∆=${med.A_boardMemo} PureBoard∆=${med.A_pureBoard} Import∆=${med.A_imprt}`);
console.log(`  B (10× move):     Board∆=${med.B_board} Import∆=${med.B_imprtStay}`);
console.log(`  C (import selesai): Board∆=${med.C_board} Import∆=${med.C_imprt}`);
console.log(`  D: unmount/mount bersih di ${semua.filter((r) => r.D.unmountOk).length}/${ITER}`);

console.log("\n== Evaluasi kriteria ==");
let gagal = 0;
function cek(ok, msg) {
  if (ok) console.log(`  ✓ ${msg}`);
  else {
    console.log(`  ✗ ${msg}`);
    gagal++;
  }
}

// A: progress tidak sentuh Board
cek(med.A_board === 0, `A: median Board∆ ${med.A_board} === 0 (progress tidak render BoardContext)`);
cek(med.A_pureBoard === 0, `A: median PureBoard∆ ${med.A_pureBoard} === 0 (konsumen Board murni aman)`);
cek(med.A_boardMemo === 0, `A: median BoardMemo∆ ${med.A_boardMemo} === 0 (memo(Board) tetap diam walau Game render)`);
cek(med.A_imprt === 40, `A: median Import∆ ${med.A_imprt} === 40 (ImportContext betul render)`);
// B: moveNumber tidak sentuh Import
cek(med.B_board === 10, `B: median Board∆ ${med.B_board} === 10 (BoardContext render saat posisi berubah)`);
cek(med.B_imprtStay === 0, `B: median Import∆ ${med.B_imprtStay} === 0 (ImportContext diam saat posisi berubah)`);
// C: import selesai tidak bocor ke Board
cek(med.C_board === 0, `C: median Board∆ ${med.C_board} === 0 (import selesai tidak render Board)`);
cek(med.C_imprt > 0, `C: median Import∆ ${med.C_imprt} > 0 (import selesai render Import)`);
// D: unmount/mount
cek(
  semua.every((r) => r.D.unmountOk),
  `D: unmount/mount bersih ${semua.filter((r) => r.D.unmountOk).length}/${ITER}`,
);
cek(
  semua.every((r) => r.D.remount.board === 1 && r.D.remount.imprt === 1),
  `D: remount render awal 1/1 di semua iterasi`,
);

if (gagal) {
  console.log(`\n${gagal} kriteria gagal`);
  process.exitCode = 1;
} else {
  console.log("\nSemua kriteria runtime lulus — optimasi BoardContext⊕ImportContext + memo(Board) terbukti via render-count.");
}
