/**
 * Uji NAVIGASI LANGKAH halaman Analisa — menguji `gameController` ASLI
 * (first/back/forward/last/play/pause) dari
 * `src/halaman/Analisa/konteks/analyze.jsx` dengan React sungguhan di atas
 * jsdom (tanpa browser penuh: fungsi kontrol navigasi adalah logika murni
 * state, tidak menyentuh kanvas/drag).
 *
 * Yang dicek:
 *   1. State awal (moveNumber 0, arah maju, belum play).
 *   2. forward: maju satu per satu sampai langkah terakhir; tetap di
 *      terakhir saat tombol ditekan ulang (tidak melewati akhir).
 *   3. back: mundur satu per satu sampai langkah pertama; tetap di pertama
 *      saat ditekan ulang.
 *   4. first/last: lompat langsung; animasi dimatikan oleh keduanya.
 *   5. Baris kustom (customLine): navigasi di dalam baris, dan kembali ke
 *      partai normal dengan `returnedToNormalGame` yang benar.
 *   6. play/pause mengubah state putar.
 *
 * Jalankan: node scripts/uji-navigasi.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { default: AnalyzeContextProvider } = await import("../src/halaman/Analisa/konteks/analyze.jsx");
const { AnalyzeContext } = await import("../src/halaman/Analisa/konteks/analyzeKonteks.js");

const act =
  React.act ?? (await import("react-dom/test-utils")).act;

/* Probe: menyimpan konteks terbaru dari setiap render. */
let ctx = null;
function Probe() {
  ctx = React.useContext(AnalyzeContext);
  return null;
}

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

/* ------------------------- setup render ------------------------- */

const el = document.getElementById("root");
const root = createRoot(el);
act(() => {
  root.render(
    React.createElement(
      I18nProvider,
      null,
      React.createElement(AnalyzeContextProvider, null, React.createElement(Probe))
    )
  );
});

/* ------------------------- data partai ------------------------- */
/* Bentuk entri mengikuti keluaran parsePGN (mesin/engine.js). */
const MOVEMENT = { from: "e2", to: "e4" };
const partai = [
  { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", color: "w" },
  { san: "e4", color: "w", movement: MOVEMENT, previousStaticEvals: [["cp", "30"]] },
  { san: "e5", color: "b", movement: { from: "e7", to: "e5" }, previousStaticEvals: [["cp", "-30"]] },
  { san: "Nf3", color: "w", movement: { from: "g1", to: "f3" }, previousStaticEvals: [["cp", "40"]] },
];

const gc = () => ctx.gameController;
const nomor = () => ctx.moveNumber[0];
const baris = () => ctx.customLine[0];

/* ------------------------- pengujian ------------------------- */

console.log("[1] State awal:");
hasil("moveNumber awal 0", nomor() === 0, `moveNumber=${nomor()}`);
hasil("arah awal = maju", ctx.forward[0] === true);
hasil("belum dalam mode putar", ctx.playing[0] === false);
hasil("baris kustom awal kosong", baris().moveNumber === -1);

console.log("\n[2] Muat partai lalu forward:");
act(() => ctx.game[1](partai));
hasil("partai dimuat (4 entri: posisi awal + 3 langkah)", ctx.game[0].length === 4, `game=${ctx.game[0].length}`);

act(() => gc().forward());
hasil("forward → langkah 1 (1.e4)", nomor() === 1, `moveNumber=${nomor()}`);
act(() => gc().forward());
hasil("forward → langkah 2 (1…e5)", nomor() === 2, `moveNumber=${nomor()}`);
act(() => gc().forward());
hasil("forward → langkah 3 (2.Nf3)", nomor() === 3, `moveNumber=${nomor()}`);
act(() => gc().forward());
hasil("forward di akhir tetap di akhir (tidak melewati)", nomor() === 3, `moveNumber=${nomor()}`);
hasil("arah saat maju = maju", ctx.forward[0] === true);

console.log("\n[3] back:");
act(() => gc().back());
hasil("back → langkah 2", nomor() === 2, `moveNumber=${nomor()}`);
act(() => gc().back());
hasil("back → langkah 1", nomor() === 1, `moveNumber=${nomor()}`);
act(() => gc().back());
hasil("back → langkah pertama", nomor() === 0, `moveNumber=${nomor()}`);
act(() => gc().back());
hasil("back di awal tetap di awal", nomor() === 0, `moveNumber=${nomor()}`);
hasil("arah saat mundur = mundur", ctx.forward[0] === false);

console.log("\n[4] first / last:");
act(() => gc().forward());
act(() => gc().forward());
act(() => gc().last());
hasil("last → langsung ke langkah terakhir", nomor() === 3, `moveNumber=${nomor()}`);
hasil("last mematikan animasi", ctx.animation[0] === false);
act(() => gc().first());
hasil("first → langsung ke langkah pertama", nomor() === 0, `moveNumber=${nomor()}`);
hasil("first mematikan animasi", ctx.animation[0] === false);

console.log("\n[5] Baris kustom (customLine):");
const barisKustom = {
  moveNumber: 0,
  moves: [
    { san: "Nc3", color: "w", movement: { from: "b1", to: "c3" } },
    { san: "Bb4+", color: "b", movement: { from: "c8", to: "b4" } },
    { san: "Nf3", color: "w", movement: { from: "g1", to: "f3" } },
  ],
  arrows: {},
};
act(() => ctx.customLine[1](barisKustom));
hasil("baris kustom aktif (moveNumber 0)", baris().moveNumber === 0);
act(() => gc().forward());
hasil("forward di dalam baris → 1", baris().moveNumber === 1, `baris=${baris().moveNumber}`);
act(() => gc().forward());
hasil("forward di dalam baris → 2 (terakhir baris)", baris().moveNumber === 2, `baris=${baris().moveNumber}`);
act(() => gc().forward());
hasil("forward di akhir baris tidak keluar dari baris", baris().moveNumber === 2, `baris=${baris().moveNumber}`);
act(() => gc().back());
hasil("back di dalam baris → 1", baris().moveNumber === 1, `baris=${baris().moveNumber}`);
act(() => gc().back());
hasil("back di dalam baris → 0", baris().moveNumber === 0, `baris=${baris().moveNumber}`);
act(() => gc().back());
hasil(
  "back dari awal baris → kembali ke partai normal",
  baris().moveNumber === -1 && baris().moves.length === 0,
  `baris=${JSON.stringify(baris())}`
);
hasil(
  "kembali ke partai: gerakan pertama baris dicatat (returnedToNormalGame)",
  ctx.returnedToNormalGame[0]?.from === "b1" && ctx.returnedToNormalGame[0]?.to === "c3",
  JSON.stringify(ctx.returnedToNormalGame[0])
);

console.log("\n[6] last di dalam baris kustom:");
act(() => ctx.customLine[1](barisKustom));
act(() => ctx.customLine[1]((prev) => ({ ...prev, moveNumber: 1 })));
act(() => gc().last());
hasil("last → akhir baris (indeks moves-1)", baris().moveNumber === 2, `baris=${baris().moveNumber}`);
act(() => gc().first());
hasil(
  "first dari baris → kembali ke partai normal",
  baris().moveNumber === -1 && nomor() === 0,
  `baris=${baris().moveNumber}, moveNumber=${nomor()}`
);

console.log("\n[7] play / pause:");
act(() => gc().play());
hasil("play → mode putar aktif", ctx.playing[0] === true);
act(() => gc().pause());
hasil("pause → mode putar mati", ctx.playing[0] === false);

/* ------------------------- beres ------------------------- */

act(() => root.unmount());

console.log(
  `\nHasil: ${lulus} lulus, ${gagal} gagal${
    gagal ? "" : " — semua pemeriksaan navigasi langkah lulus."
  }`
);
process.exit(process.exitCode ?? 0);
