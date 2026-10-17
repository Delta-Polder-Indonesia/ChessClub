/**
 * Uji REGRESI "luncuran & bunyi sekali per langkah" untuk papan Analisa
 * (`src/halaman/Analisa/komponen/game/board.jsx`) + utilitas pembukaan.
 *
 * Mengapa ada: keluhan "bidak jalan 2x bila engine dinyalakan" dan "kayak ada
 * bayangan saat bidak jalan". Akar masalahnya terukur, bukan dugaan:
 *
 *   1. Efek animasi `animateMove` dulu berjalan ulang SETIAP render (dependensi
 *      `castleRookMove` berupa objek yang dibuat ulang tiap render) dan selalu
 *      me-restart luncuran dari petak asal — update state engine di tengah
 *      300 ms luncuran membuat bidak kembali ke asal lalu meluncur lagi.
 *   2. Efek suara memuat instance `Chess` (objek baru tiap render) di
 *      dependensinya sehingga bunyi langkah terulang setiap render.
 *   3. `resetElements` animasi yang ter-cancel membersihkan gaya animasi
 *      penggantinya (lapisan `willChange`/`zIndex` = artefak "bayangan").
 *
 * Uji ini memasang komponen Board ASLI di atas jsdom, memaksa banyak render
 * ulang selagi `animation` tetap true (persis keadaan saat engine bekerja),
 * lalu menghitung pemanggilan `element.animate()` dan `Suara.play()`.
 *
 * Jalankan: node scripts/uji-luncur-sekali.mjs  |  npm run uji:luncur-sekali
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { default: ConfigContextProvider } = await import(
  "../src/halaman/Analisa/konteks/config.jsx"
);
const { default: Board } = await import(
  "../src/halaman/Analisa/komponen/game/board.jsx"
);
const { Suara } = await import("../src/halaman/Analisa/komponen/suaraPapan.js");
const {
  fenDanSanDariKoordinat,
  kuciDariPindahan,
  sanDiPosisi,
} = await import("../src/halaman/PapanInteraktif/bersama/utilPapan.js");
const { Chess } = await import("chess.js");

const act = React.act ?? (await import("react-dom/test-utils")).act;

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

/* ---------------------- hitung animate() per elemen ---------------------- */

const catatan = [];
window.Element.prototype.animate = function animate(keyframes, opsi) {
  catatan.push({
    petak: this.closest?.("[data-square]")?.getAttribute("data-square") || null,
    keyframes,
    opsi,
  });
  return { finished: Promise.resolve(), cancel() {}, oncancel: null };
};

/* --------------------------- hitung Suara.play --------------------------- */

let bunyi = 0;
const playAsli = Suara.prototype.play;
Suara.prototype.play = function (...a) {
  bunyi++;
  return playAsli.apply(this, a);
};

/* ----------------------------- harness Board ----------------------------- */

// formatSquare: {col, row} dengan row = rank-1.
const e2 = { col: 4, row: 1 };
const e4 = { col: 4, row: 3 };
const e1 = { col: 4, row: 0 };
const g1 = { col: 6, row: 0 };
const MOVE_BIASA = [e2, e4];
const MOVE_ROKADE = [e1, g1];
const NEXT_KOSONG = []; // satu referensi, dipakai ulang (stabil)

const FEN_SETELAH_E4 =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
const FEN_SETELAH_ROKADE =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1RK1 b kq - 1 1";

function PapanUji({ _dorong, move, nextMove, castle, fen, animation }) {
  const [drag, setDrag] = React.useState({ is: false, id: "" });
  return React.createElement(Board, {
    fen,
    nextFen: undefined,
    boardSize: 720,
    move,
    nextMove,
    bestMove: [],
    previousBestMove: [],
    bestMoveSan: undefined,
    moveRating: undefined,
    forward: true,
    white: true,
    animation,
    gameEnded: false,
    result: "",
    arrows: [],
    previousStaticEvals: [],
    sacrifice: false,
    analyzingMove: true,
    drag,
    setDrag,
    pushArrow: () => {},
    cleanArrows: () => {},
    setMaterialAdvantage: () => {},
    setPlaying: () => {},
    setAnimation: () => {},
    analyzeMove: () => {},
    capture: undefined,
    nextCapture: undefined,
    castle,
    nextCastle: undefined,
  });
}

function Induk(props) {
  return React.createElement(
    ConfigContextProvider,
    null,
    React.createElement(PapanUji, props)
  );
}

/**
 * Render Board, lalu 5x render ulang dengan props bernilai sama (identitas
 * array `dorong`-lah yang berubah) — simulasi update state engine di tengah
 * luncuran. Mengembalikan daftar panggilan animate().
 */
function jalankan(sisa, { renderUlang = 5 } = {}) {
  catatan.length = 0;
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => {
    root.render(React.createElement(Induk, { dorong: 0, ...sisa }));
  });
  for (let i = 1; i <= renderUlang; i++) {
    act(() => {
      root.render(React.createElement(Induk, { dorong: i, ...sisa }));
    });
  }
  root.unmount();
  el.remove();
  return [...catatan];
}

console.log("A. papan Analisa: luncuran TIDAK di-restart oleh render ulang");

{
  const a = jalankan({
    move: MOVE_BIASA,
    nextMove: undefined,
    castle: undefined,
    fen: FEN_SETELAH_E4,
    animation: true,
  });
  uji(
    "langkah biasa: tepat 1 panggilan animate() walau 5x render ulang",
    a.length === 1 && a[0].petak === "e4",
    `jumlah=${a.length} (${a.map((x) => x.petak).join(",")})`
  );
  uji(
    "langkah biasa: durasi 300 ms ease (GESER_ISEPIC)",
    a[0]?.opsi?.duration === 300 && a[0]?.opsi?.easing === "ease",
    JSON.stringify(a[0]?.opsi)
  );
}

{
  // Rokade = dua bidak (raja + benteng), masing-masing SEKALI — dulu 12x
  // (6 render × 2 bidak) karena castleRookMove berganti identitas tiap render.
  const c = jalankan({
    move: MOVE_ROKADE,
    nextMove: NEXT_KOSONG,
    castle: "k",
    fen: FEN_SETELAH_ROKADE,
    animation: true,
  });
  uji(
    "rokade: tepat 2 panggilan animate() (raja + benteng), tanpa restart",
    c.length === 2,
    `jumlah=${c.length} (${c.map((x) => x.petak).join(",")})`
  );
}

{
  // Transisi yang sama diulang SETELAH animasi dimatikan (navigasi kembali ke
  // langkah yang sama) harus beranimasi lagi — penanda transisi dibersihkan
  // saat animation=false.
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  catatan.length = 0;
  const props = {
    move: MOVE_BIASA,
    nextMove: undefined,
    castle: undefined,
    fen: FEN_SETELAH_E4,
    animation: true,
  };
  act(() => {
    root.render(React.createElement(Induk, { dorong: 0, ...props }));
  });
  act(() => {
    root.render(
      React.createElement(Induk, { dorong: 1, ...props, animation: false })
    );
  });
  act(() => {
    root.render(React.createElement(Induk, { dorong: 2, ...props }));
  });
  root.unmount();
  el.remove();
  uji(
    "kembali ke transisi yang sama setelah animation=false → beranimasi lagi",
    catatan.length === 2,
    `jumlah=${catatan.length}`
  );
}

console.log("\nB. papan Analisa: bunyi langkah sekali per posisi");

{
  bunyi = 0;
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  const props = {
    move: MOVE_BIASA,
    nextMove: undefined,
    castle: undefined,
    fen: FEN_SETELAH_E4,
    animation: false,
  };
  act(() => {
    root.render(React.createElement(Induk, { dorong: 0, ...props }));
  });
  const setelahRender1 = bunyi;
  for (let i = 1; i <= 5; i++) {
    act(() => {
      root.render(React.createElement(Induk, { dorong: i, ...props }));
    });
  }
  root.unmount();
  el.remove();
  uji(
    "satu posisi = satu bunyi, walau 5x render ulang",
    setelahRender1 === 1 && bunyi === 1,
    `render-1=${setelahRender1}, total=${bunyi}`
  );
}

console.log("\nC. kunci pembukaan koordinat membawa promosi (UCI)");

{
  // Posisi tanpa skak sesudah promosi supaya SAN-nya polos "a8=Q".
  const POSISI_PROMOSI = "8/P7/8/7k/8/8/8/7K w - - 0 1";
  const game = new Chess(POSISI_PROMOSI);
  const pindah = game.move({ from: "a7", to: "a8", promotion: "q" });
  const kunci = kuciDariPindahan(pindah, "koordinat");
  uji(
    "kuciDariPindahan: promosi menjadi 'a7a8q'",
    kunci === "a7a8q",
    kunci
  );
  uji(
    "sanDiPosisi: kunci promosi dikonversi ke SAN ('a8=Q')",
    sanDiPosisi(new Chess(POSISI_PROMOSI), "a7a8q") === "a8=Q"
  );
  // Replay SELALU berangkat dari posisi awal standar — uji promosinya lewat
  // jalur sungguhan yang berakhir dengan pion ambil-ke-promosi (gxh8=Q).
  const hasil = fenDanSanDariKoordinat([
    "h2h4", "a7a6", "h4h5", "a6a5", "h5h6", "a5a4", "h6g7", "a4a3", "g7h8q",
  ]);
  uji(
    "fenDanSanDariKoordinat: kunci promosi direplay benar ('gxh8=Q')",
    hasil?.san?.[8] === "gxh8=Q" && hasil?.san?.length === 9,
    JSON.stringify(hasil)
  );
}

console.log("");
console.log(`Hasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exitCode = 1;
