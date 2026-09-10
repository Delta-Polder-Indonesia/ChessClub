/**
 * Uji PANEL SAMPING (Menu) fitur Analisa — komponen `Menu` + `Game` ASLI di
 * jsdom dengan engine PALSU deterministik.
 *
 * Regresi utama: urutan tab saat masuk mode analisis.
 *   - Efek "buka tab Ringkasan" berjalan saat pageState → "analyze".
 *   - Efek "loncat ke langkah → tab Langkah" (dependensi [moveNumber,
 *     pageState]) juga berjalan di commit yang SAMA dan — karena dideklarasikan
 *     belakangan — dulu menimpa tab Ringkasan, sehingga panel selalu terbuka
 *     di "Langkah". Perbaikan: efek kedua hanya merespons perubahan
 *     moveNumber saat SUDAH berada di mode analisis.
 *
 * Diperiksa:
 *   1. State kosong (belum ada PGN): tidak ada tombol tab, ajakan tampil.
 *   2. PGN dimuat → analisis masuk: tab Ringkasan aktif (DOM + konteks).
 *   3. Loncatan langkah (moveNumber berubah) → tab Langkah aktif.
 *   4. Pengembalian manual ke Ringkasan + loncatan lagi → Langkah lagi.
 *
 * Jalankan: node scripts/uji-panel.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/i18n.jsx");
const { Chess } = await import("chess.js");
const { KonteksMesin } = await import("../src/halaman/Analisa/konteks/mesin.jsx");
const { AnalyzeContext, default: AnalyzeContextProvider } = await import(
  "../src/halaman/Analisa/konteks/analyze.jsx"
);
const { formatSquare } = await import("../src/halaman/Analisa/mesin/engine.js");
const { default: Game } = await import("../src/halaman/Analisa/komponen/game/game.jsx");
const { default: Menu } = await import("../src/halaman/Analisa/komponen/menu/menu.jsx");

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

const PGN = `[Event "Uji Panel Samping"]
[White "Putih"]
[Black "Hitam"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5`;

const kotak = (s) => formatSquare(s);
class EnginePalsu {
  async siapkan() {}
  async cari(fen) {
    const gerak = new Chess(fen).moves({ verbose: true });
    const pilihan =
      gerak.find((m) => m.from === "h2" && m.to === "h3") ??
      gerak.find((m) => m.from === "h7" && m.to === "h6") ??
      gerak[0];
    return { staticEval: ["cp", "30"], bestMove: [kotak(pilihan.from), kotak(pilihan.to)], bestMoveCoronation: undefined, kedalamanTercapai: 15, pv: [] };
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

const el = document.createElement("div");
document.body.appendChild(el);
const root = createRoot(el);

let ctx = null;
function Probe() {
  ctx = React.useContext(AnalyzeContext);
  return null;
}
const wadah = React.createRef();
const wadahMenu = React.createRef();

const pohon = React.createElement(
  I18nProvider,
  null,
  React.createElement(
    KonteksMesin.Provider,
    { value: NILAI_MESIN_PALSU },
    React.createElement(
      AnalyzeContextProvider,
      null,
      React.createElement(Probe),
      React.createElement(Game, { wadah }),
      React.createElement(Menu, { wadah: wadahMenu })
    )
  )
);

act(() => {
  root.render(pohon);
});

/* ------------------------- 1. state kosong ------------------------- */

console.log("== panel kosong (belum ada PGN) ==");
hasil("pageState awal \"default\"", ctx.pageState[0] === "default", ctx.pageState[0]);
hasil("tidak ada tombol tab", el.querySelectorAll('button[role="tab"]').length === 0);

/* ------------------------- 2. analisis masuk ------------------------- */

console.log("\n== PGN dimuat → masuk mode analisis ==");
await act(async () => {
  ctx.data[1]({ format: "pgn", string: PGN });
  await new Promise((r) => setTimeout(r, 30));
});
hasil('pageState "analyze"', ctx.pageState[0] === "analyze", ctx.pageState[0]);
hasil('tab kontekstual = "summary" (Ringkasan dibuka lebih dulu)', ctx.tab[0] === "summary", ctx.tab[0]);

const tombolTab = Array.from(el.querySelectorAll('button[role="tab"]'));
hasil('dua tombol tab: Ringkasan & Langkah', tombolTab.length === 2 && tombolTab[0].textContent === "Ringkasan" && tombolTab[1].textContent === "Langkah", tombolTab.map((t) => t.textContent).join(" | "));
hasil(
  "tombol Ringkasan terpilih di DOM (tanpa kelas non-aktif)",
  !tombolTab[0]?.className.includes("bg-backgroundBoxBoxDisabled") && tombolTab[1]?.className.includes("bg-backgroundBoxBoxDisabled")
);
hasil("isi Ringkasan terpasang (nama pemain tampil)", el.textContent.includes("Putih") && el.textContent.includes("Hitam"));

/* ------------------------- 3. loncatan langkah ------------------------- */

console.log("\n== loncatan langkah (mis. klik grafik) ==");
await act(async () => {
  ctx.moveNumber[1](2);
  await new Promise((r) => setTimeout(r, 10));
});
hasil('tab beralih ke "moves" (Langkah)', ctx.tab[0] === "moves", ctx.tab[0]);
hasil("tombol Langkah terpilih di DOM", tombolTab[0]?.className.includes("bg-backgroundBoxBoxDisabled") && !tombolTab[1]?.className.includes("bg-backgroundBoxBoxDisabled"));

/* ------------------------- 4. manual ke Ringkasan, loncat lagi ------------------------- */

console.log("\n== kembali manual ke Ringkasan, lalu loncat lagi ==");
await act(async () => {
  ctx.tab[1]("summary");
  await new Promise((r) => setTimeout(r, 5));
});
hasil('tab manual "summary" bertahan', ctx.tab[0] === "summary", ctx.tab[0]);
await act(async () => {
  ctx.moveNumber[1](1);
  await new Promise((r) => setTimeout(r, 10));
});
hasil('loncatan langkah lagi menyetel "moves"', ctx.tab[0] === "moves", ctx.tab[0]);

/* ------------------------- ringkasan ------------------------- */

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
