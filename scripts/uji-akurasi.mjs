/**
 * Uji AKURASI & RATING pemain fitur Analisa — komponen ASLI di atas jsdom:
 *
 *   1. `avg` (playersAccuracy.jsx): array kosong → NaN, rata-rata biasa.
 *   2. `PlayersAccuracy`: peta label → poin akurasi
 *        brilliant/great/best/book = 100, excellent = 90, good = 70,
 *        inaccuracy/miss = 30, mistake = 20, blunder = 0;
 *      kredit langkah ke pemain yang Bergerak (lawan entry.color);
 *      deteksi fase pembukaan → tengah → akhir (satu arah);
 *      label "forced" & FEN rusak tidak ikut dihitung;
 *      daftar kosong → akurasi NaN → tampil "-".
 *   3. `GameRating`: rumus rating nonlinear (akurasi 100 → 3000+, 40 → 300,
 *      70 → 550, 0 → 1100, NaN → 0) dan rating per fase (label oleh ambang
 *      95/90/80/60/40/20; <3 langkah → "-").
 *
 * Jalankan: node scripts/uji-akurasi.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/i18n.jsx");
const { Chess } = await import("chess.js");
const { default: PlayersAccuracy, avg } = await import(
  "../src/halaman/Analisa/komponen/menu/analysis/summary/playersAccuracy.jsx"
);
const { default: GameRating } = await import(
  "../src/halaman/Analisa/komponen/menu/analysis/summary/gameRating.jsx"
);

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

const el = document.getElementById("root");
const root = createRoot(el);

/**
 * Pembungkus persis seperti Summary: komponen Summary yang memegang STATE
 * akurasi/fase (bukan fungsi biasa), lalu meneruskannya sebagai tuple
 * [nilai, setter] ke PlayersAccuracy — hanya dengan state asli React
 * tampilan ikut ter-update setelah efek menghitung akurasi.
 */
function ProbePlayersAccuracy(props) {
  const [acc, setAcc] = React.useState({ w: NaN, b: NaN });
  const [phases, setPhases] = React.useState({
    opening: { w: [], b: [] },
    middlegame: { w: [], b: [] },
    endgame: { w: [], b: [] },
  });
  props.kunci().acc = acc;
  props.kunci().phases = phases;
  return React.createElement(PlayersAccuracy, {
    ...props,
    accuracy: [acc, setAcc],
    setAccuracyPhases: setPhases,
  });
}

/* Rangkaian riil 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.Qe2 Qe7 (FEN via chess.js). */
function fenSetengah() {
  const c = new Chess();
  const daftar = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "Qe2", "Qe7"];
  const fen = [];
  for (const san of daftar) fen.push(c.move(san).after);
  return fen;
}

const FEN = fenSetengah();

/* Entri 9-11: reduksi cepat ke akhirpartai (FEN sah, hasil `chess.js`). */
const END1 = "4k3/8/8/8/8/8/1K6/R7 b - - 0 9";
const END2 = "3k4/8/8/8/8/8/1K6/R7 w - - 0 9";
const END3 = "3k4/8/8/8/8/8/2K5/R7 b - - 0 10";

const MOVES = [
  { fen: FEN[0], color: "b", moveRating: "best" }, // 1.e4 (putih)
  { fen: FEN[1], color: "w", moveRating: "blunder" }, // 1...e5 (hitam)
  { fen: FEN[2], color: "b", moveRating: "excellent" }, // 2.Nf3 (putih)
  { fen: FEN[3], color: "w", moveRating: "mistake" }, // 2...Nc6 (hitam)
  { fen: FEN[4], color: "b", moveRating: "good" }, // 3.Bc4 (putih)
  { fen: FEN[5], color: "w", moveRating: "inaccuracy" }, // 3...Bc5 (hitam)
  { fen: FEN[6], color: "b", moveRating: "brilliant" }, // 4.Qe2 (putih)
  { fen: FEN[7], color: "w", moveRating: "great" }, // 4...Qe7 (hitam)
  { fen: END1, color: "b", moveRating: "book" }, // 5.Rxa8 (putih, fiktif)
  { fen: END2, color: "w", moveRating: "forced" }, // 5...Ke8 (hitam, fiktif)
  { fen: END3, color: "b", moveRating: "excellent" }, // 6.Kc2 (putih, fiktif)
  // Sampah: FEN rusak & label tak dikenal — keduanya harus diabaikan.
  { fen: "bukan-fen", color: "w", moveRating: "best" },
  { fen: FEN[0], color: "b", moveRating: "alien" },
];

const PLAYERS = [{ name: "Putih" }, { name: "Hitam" }];

/* ------------------------- 1. avg ------------------------- */

console.log("== avg ==");
hasil("avg([]) = NaN", Number.isNaN(avg([])));
hasil("avg([100, 0]) = 50", avg([100, 0]) === 50);
hasil("avg([30]) = 30", avg([30]) === 30);

/* ------------------------- 2. PlayersAccuracy ------------------------- */

console.log("\n== PlayersAccuracy: peta poin, kredit warna, fase ==");
{
  const kunci = { acc: null, phases: null };
  act(() => {
    root.render(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(ProbePlayersAccuracy, {
          pemain: undefined,
          players: PLAYERS,
          moves: MOVES,
          reducedSummary: false,
          kunci: () => kunci,
        })
      )
    );
  });
  const akurasiTerkunci = kunci.acc;
  const faseTerkunci = kunci.phases;

  hasil(
    "akurasi putih = 91.666… (100,90,70,100,100,90)",
    Math.abs(akurasiTerkunci?.w - 550 / 6) < 1e-9,
    `dapat ${akurasiTerkunci?.w}`
  );
  hasil(
    "akurasi hitam = 37.5 (0,20,30,100)",
    Math.abs(akurasiTerkunci?.b - 37.5) < 1e-9,
    `dapat ${akurasiTerkunci?.b}`
  );
  hasil(
    "fase pembukaan: putih [100,90,70,100]",
    JSON.stringify(faseTerkunci?.opening?.w) === JSON.stringify([100, 90, 70, 100]),
    JSON.stringify(faseTerkunci?.opening?.w)
  );
  hasil(
    "fase pembukaan: hitam [0,20,30] (berakhir setelah 4.Qe2 — 3 bidak putih & 2 hitam sudah keluar)",
    JSON.stringify(faseTerkunci?.opening?.b) === JSON.stringify([0, 20, 30]),
    JSON.stringify(faseTerkunci?.opening?.b)
  );
  hasil(
    "fase tengah: putih [100], hitam [100] (label 'forced' tidak dihitung)",
    JSON.stringify(faseTerkunci?.middlegame?.w) === JSON.stringify([100]) &&
      JSON.stringify(faseTerkunci?.middlegame?.b) === JSON.stringify([100]),
    JSON.stringify(faseTerkunci?.middlegame)
  );
  hasil(
    "fase akhir: putih [90], hitam []",
    JSON.stringify(faseTerkunci?.endgame?.w) === JSON.stringify([90]) &&
      JSON.stringify(faseTerkunci?.endgame?.b) === JSON.stringify([]),
    JSON.stringify(faseTerkunci?.endgame)
  );
  const teks = el.textContent;
  hasil('tampilan akurasi putih "91.7"', teks.includes("91.7"), teks.slice(0, 80));
  hasil('tampilan akurasi hitam "37.5"', teks.includes("37.5"));
  hasil(
    "FEN rusak & label asing tidak mengacaukan total (6 langkah putih dihitung)",
    teks.includes("91.7") && !teks.includes("NaN")
  );
}

console.log("\n== PlayersAccuracy: daftar kosong → '-' ==");
{
  const kunci = { acc: null, phases: null };
  act(() => {
    root.render(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(ProbePlayersAccuracy, {
          players: PLAYERS,
          moves: [],
          reducedSummary: false,
          kunci: () => kunci,
        })
      )
    );
  });
  hasil("akurasi NaN (kedua warna)", Number.isNaN(kunci.acc?.w) && Number.isNaN(kunci.acc?.b));
  hasil('tampilan "-" di kedua kotak', (el.textContent.match(/-/g) || []).length >= 2, el.textContent);
}

/* ------------------------- 3. GameRating ------------------------- */

function renderRating(accuracy, phases) {
  let nodes;
  act(() => {
    root.render(
      React.createElement(
        I18nProvider,
        null,
        React.createElement(GameRating, { accuracy, accuracyPhases: phases, reducedSummary: false })
      )
    );
    nodes = el;
  });
  return nodes;
}

function kotak(nilai) {
  return nilai.textContent.trim();
}

console.log("\n== GameRating: rumus rating ==");
{
  const phasesKosong = { opening: { w: [], b: [] }, middlegame: { w: [], b: [] }, endgame: { w: [], b: [] } };
  let n = renderRating({ w: 100, b: 40 }, phasesKosong);
  hasil('akurasi 100 → "3000+" (batas atas)', kotak(n.querySelector(".bg-evaluationBarWhite")) === "3000+", kotak(n.querySelector(".bg-evaluationBarWhite")));
  hasil('akurasi 40 → "300" (dasar rumus)', kotak(n.querySelector(".bg-evaluationBarBlack")) === "300", kotak(n.querySelector(".bg-evaluationBarBlack")));

  n = renderRating({ w: 70, b: 0 }, phasesKosong);
  hasil('akurasi 70 → "550"', kotak(n.querySelector(".bg-evaluationBarWhite")) === "550", kotak(n.querySelector(".bg-evaluationBarWhite")));
  hasil('akurasi 0 → "1100"', kotak(n.querySelector(".bg-evaluationBarBlack")) === "1100", kotak(n.querySelector(".bg-evaluationBarBlack")));

  n = renderRating({ w: NaN, b: NaN }, phasesKosong);
  hasil("akurasi NaN → \"0\" (keduanya)", kotak(n.querySelector(".bg-evaluationBarWhite")) === "0" && kotak(n.querySelector(".bg-evaluationBarBlack")) === "0");
}

console.log("\n== GameRating: rating per fase ==");
{
  const phases = {
    opening: { w: [100, 90, 70, 100], b: [0, 20, 30, 100] }, // rata 90.0 / 37.5
    middlegame: { w: [100], b: [] }, // <3 langkah → "-"
    endgame: { w: [90], b: [] }, // <3 langkah → "-"
  };
  const n = renderRating({ w: 91.7, b: 37.5 }, phases);
  const judul = [...n.querySelectorAll("[title]")].map((x) => x.getAttribute("title"));
  hasil(
    'fase pembukaan putih: judul "Pembukaan: akurasi 90.0%"',
    judul.some((t) => t === "Pembukaan: akurasi 90.0%"),
    JSON.stringify(judul)
  );
  hasil(
    'fase pembukaan hitam: judul "Pembukaan: akurasi 37.5%"',
    judul.some((t) => t === "Pembukaan: akurasi 37.5%")
  );
  hasil(
    "4 fase pendek (tengah/akhir, 2 warna) → ikon '-'",
    n.querySelectorAll('span[title="Belum cukup langkah untuk menilai fase ini."]').length === 4,
    `dapat ${n.querySelectorAll('span[title="Belum cukup langkah untuk menilai fase ini."]').length}`
  );
}

console.log("\n== GameRating: ambang label fase (lewat bentuk ikon) ==");
{
  function ikonPembukaanPutih(lista) {
    const n = renderRating({ w: 50, b: 50 }, { opening: { w: lista, b: [50, 50, 50] }, middlegame: { w: [], b: [] }, endgame: { w: [], b: [] } });
    const baris = n.querySelectorAll("div.flex-row.w-full");
    // Baris 2 = "Pembukaan"; sel putih = div pertama setelah label.
    const sel = baris[1].querySelectorAll("div.reduceSummary\\:w-20");
    const svg = sel[0]?.querySelector("svg");
    const hasilIkon = svg ? svg.outerHTML : null;
    return hasilIkon;
  }
  const i90 = ikonPembukaanPutih([90, 90, 90]); // "best"
  const i94 = ikonPembukaanPutih([94, 94, 94]); // masih "best"
  const i89 = ikonPembukaanPutih([89, 89, 89]); // "excellent"
  const i95 = ikonPembukaanPutih([95, 95, 95]); // "great"
  hasil("ikon ada untuk fase ≥3 langkah", Boolean(i90));
  hasil("90 dan 94 → label sama (best)", i90 !== null && i90 === i94);
  hasil("95 → label lain (great)", i95 !== null && i95 !== i90);
  hasil("89 → label lain (excellent)", i89 !== null && i89 !== i90 && i89 !== i95);

  const i60 = ikonPembukaanPutih([60, 60, 60]); // "good"
  const i59 = ikonPembukaanPutih([59, 59, 59]); // "inaccuracy"
  const i40 = ikonPembukaanPutih([40, 40, 40]); // "inaccuracy"
  const i39 = ikonPembukaanPutih([39, 39, 39]); // "mistake"
  const i20 = ikonPembukaanPutih([20, 20, 20]); // "mistake"
  const i19 = ikonPembukaanPutih([19, 19, 19]); // "blunder"
  hasil("60 → good, 59 → inaccuracy (ikon beda)", i60 !== null && i60 !== i59);
  hasil("40 → inaccuracy sama ikon 59", i40 !== null && i40 === i59);
  hasil("39 → mistake, beda dari inaccuracy", i39 !== null && i39 !== i40);
  hasil("20 → mistake sama ikon 39", i20 !== null && i20 === i39);
  hasil("19 → blunder, beda dari mistake", i19 !== null && i19 !== i20);
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
