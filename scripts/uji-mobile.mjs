/**
 * Uji PAPAN MOBILE fitur Analisa — komponen `Game` ASLI di jsdom dengan
 * ukuran layar dibagikan per-mode (mobile < 516px, tablet < 1100px,
 * desktop ≥ 1100px) lewat event resize, persis seperti browser nyata.
 *
 * jsdom tidak menghitung layout (clientWidth/offsetHeight = 0), sehingga
 * ukuran wadah dipaksa lewat Object.defineProperty pada elemen — metode yang
 * sama yang dipakai untuk meniru layar fisik:
 *   - wadah (ref Analisa.jsx)  → clientWidth/clientHeight  (lebar/tinggi halaman)
 *   - div daftar nama+clocok   → offsetHeight              (tinggi komponen, mode desktop)
 *
 * Diperiksa:
 *   1. Mode tablet (1024×768): papan 664px, gap 6, container style.height
 *   2. Mode mobile (375×667): papan 360px (lebar jadi pembatas),
 *      container style.WIDTH (nav pindah ke atas), ikon profil 24px
 *   3. Mode desktop (1440×900): papan 760px, gap 10, ikon profil 40px
 *
 * Rumus ukuran papan (game.jsx updateBoardSize) digunakan kembali apa adanya:
 *   mobile : tinggi − (8+36+8+sb+8+8+sb+gap+40+gap+17+8), lebar − 16
 *   tablet : tinggi − (sb*2 + gap*3 + 16 + 69),        lebar − (8+28+gap+8+17+8)
 *   desktop: min(tinggi, tinggiKomponen) − (sb*2 + gap*2), lebar − (16+36+gap+8+17+8+480+16)
 *   sb = tinggi status bar (0 di jsdom), gap = 6 (≤1100) / 10 (>1100),
 *   hasil dibulatkan ke kelipatan 8, plafon 1000.
 *
 * Jalankan: node scripts/uji-mobile.mjs
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

const PGN = `[Event "Uji Papan Mobile"]
[White "Putih"]
[Black "Hitam"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O`;

const caturUji = new Chess();
const FEN_POSISI = [caturUji.fen()];
for (const token of PGN.split(/\n\s*\n/).pop().split(/\s+/)) {
  if (/^\d+\.+$/.test(token)) continue;
  FEN_POSISI.push(caturUji.move(token).after);
}
const kotak = (s) => formatSquare(s);

class EnginePalsu {
  async siapkan() {}
  async cari(fen) {
    const saran = (() => {
      const gerak = new Chess(fen).moves({ verbose: true });
      const p =
        gerak.find((m) => m.from === "h2" && m.to === "h3") ??
        gerak.find((m) => m.from === "h7" && m.to === "h6") ??
        gerak[0];
      return [kotak(p.from), kotak(p.to)];
    })();
    return { staticEval: ["cp", "30"], bestMove: saran, bestMoveCoronation: undefined, kedalamanTercapai: 15, pv: [] };
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

// Wadah virtual: Game membaca wadah.current.clientWidth/clientHeight.
const wadahVirtual = document.createElement("div");
const wadahRef = React.createRef();
wadahRef.current = wadahVirtual;

function aturUkuran(lebar, tinggi, tinggiKomponen = null) {
  Object.defineProperty(wadahVirtual, "clientWidth", { value: lebar, configurable: true });
  Object.defineProperty(wadahVirtual, "clientHeight", { value: tinggi, configurable: true });
  if (tinggiKomponen !== null) {
    // div ref game.jsx: class tepat "h-full flex flex-col justify-start"
    // (ada div lain ber-token justify-start di bar evaluasi — jangan salah pilih).
    const divKomponen = el.querySelector('div.h-full.flex.flex-col.justify-start');
    if (divKomponen) {
      Object.defineProperty(divKomponen, "offsetHeight", { value: tinggiKomponen, configurable: true });
    }
  }
}

let ctx = null;
function Probe() {
  ctx = React.useContext(AnalyzeContext);
  return null;
}

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
          React.createElement(Game, { wadah: wadahRef })
        )
      )
    )
  );
});

await act(async () => {
  ctx.data[1]({ format: "pgn", string: PGN });
  await new Promise((r) => setTimeout(r, 20));
});

/* ------------------------- pembaca DOM ------------------------- */

// Baris nama+clocok: <div style={{ width: boardSize }} class="flex flex-row justify-between">
const papan = () => el.querySelector('div[class~="justify-between"][style*="width"]');
function bacaMode() {
  const kontainer = el.querySelector('div[class~="navTop:flex-row"][class~="items-center"]');
  const gap = el.querySelector('div[class~="outline-none"]')?.style?.gap;
  const profil = el.querySelector('div[class~="bg-backgroundProfileWhite"] svg');
  return {
    kontainer,
    gayaKontainer: kontainer?.getAttribute("style") ?? "",
    gap,
    profil: profil?.getAttribute("width") ?? null,
    ukuranPapan: papan()?.style?.width ?? null,
  };
}
function aturLayar(lebar, tinggi) {
  Object.defineProperty(window, "innerWidth", { value: lebar, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: tinggi, configurable: true });
}

/* ------------------------- 1. mode tablet (1024×768) ------------------------- */

console.log("== mode tablet: 1024×768 (516 ≤ lebar < 1100) ==");
aturUkuran(1024, 768);
await act(async () => {
  aturLayar(1024, 768);
  window.dispatchEvent(new window.Event("resize"));
  await new Promise((r) => setTimeout(r, 5));
});
// boardHeight = 768 − (0 + 6*3 + 8*2 + 69) = 665; maxWidth = 1024 − 75 = 949 → 665 → 664
let m = bacaMode();
hasil('papan tablet = 664px (lebar 665 dibulatkan ke kelipatan 8)', m.ukuranPapan === "664px", m.ukuranPapan);
hasil("gap tablet = 6px", m.gap === "6px", m.gap);
hasil(
  "container tablet memakai style.height (nav masih di samping)",
  m.gayaKontainer.includes("height") && !m.gayaKontainer.includes("width"),
  m.gayaKontainer
);
hasil('gameHeight tablet = 664 + 2×0 + 2×6 = 676px', m.gayaKontainer.includes("height: 676px"), m.gayaKontainer);
hasil("ikon profil tablet (1024 < 1100) = 24px", m.profil === "24", m.profil);

/* ------------------------- 2. mode mobile (375×667) ------------------------- */

console.log("\n== mode mobile: 375×667 (lebar < 516) ==");
aturUkuran(375, 667);
await act(async () => {
  aturLayar(375, 667);
  window.dispatchEvent(new window.Event("resize"));
  await new Promise((r) => setTimeout(r, 5));
});
// boardHeight = 667 − (8+36+8+0+8+8+0+6+40+6+17+8) = 522; maxWidth = 375 − 16 = 359
// → pembatas = 359 → 360; gameHeight (mobile) = ukuran papan = 360
m = bacaMode();
hasil('papan mobile = 360px (dibatasi lebar layar: 359 → 360)', m.ukuranPapan === "360px", m.ukuranPapan);
hasil(
  "container mobile memakai style.WIDTH (nav pindah ke atas)",
  m.gayaKontainer.includes("width: 360px") && !m.gayaKontainer.includes("height"),
  m.gayaKontainer
);
hasil("gap mobile = 6px", m.gap === "6px", m.gap);
hasil("ikon profil mobile = 24px", m.profil === "24", m.profil);
hasil("papan tetap 8×8 kotak di mode mobile", Boolean(el.querySelector('[data-square="a8"]')) && Boolean(el.querySelector('[data-square="h1"]')));

/* ------------------------- 3. mode desktop (1440×900) ------------------------- */

console.log("\n== mode desktop: 1440×900 (lebar ≥ 1100) ==");
aturUkuran(1440, 900, 780); // offsetHeight komponen di-niru jsdom (layout nyata)
await act(async () => {
  aturLayar(1440, 900);
  window.dispatchEvent(new window.Event("resize"));
  await new Promise((r) => setTimeout(r, 5));
});
// boardHeight = min(900, 780) − 20 = 760; maxWidth = 1440 − (16+36+10+8+17+8+480+16) = 849 → 760
m = bacaMode();
hasil('papan desktop = 760px', m.ukuranPapan === "760px", m.ukuranPapan);
hasil("gap desktop = 10px", m.gap === "10px", m.gap);
hasil(
  "container desktop memakai style.height (nav di samping)",
  m.gayaKontainer.includes("height") && !m.gayaKontainer.includes("width"),
  m.gayaKontainer
);
hasil("ikon profil desktop (≥1100) = 40px", m.profil === "40", m.profil);

/* ------------------------- ringkasan ------------------------- */

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
