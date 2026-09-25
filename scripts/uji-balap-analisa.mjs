/**
 * Uji BALAPAN fitur Analisa — komponen `Game` ASLI di jsdom dengan engine
 * PALSU bergerbang (panggilan `cari` bisa ditahan sampai uji membukanya).
 *
 * Balapan yang diperiksa:
 *  1. Seret-langkah (analyzeMove) yang masih tertahan saat partai BARU
 *     dimuat: hasilnya BASI — tidak boleh menimpa customLine muatan baru,
 *     tidak boleh menimpa controller muatan baru (tombol Batal tetap hidup),
 *     dan kunci papan tetap dilepas (`finally`).
 *  2. Muatan baru membersihkan galat muatan lama (`setErrors([])`).
 *  3. Gagal non-batal (bukan balapan): placeholder dicap "gagal" + galat
 *     dilaporkan, bukan placeholder polos tanpa kabar.
 *  4. Batal non-batalan-muatan (abort saat tertahan): placeholder dicap
 *     "dibatalkan" + controller diganti yang segar.
 *  5. Batal saat MENUNGGU engine/buku (abort mendarat di sela `await`
 *     penyiapan, sebelum `parseMove`): dicap "dibatalkan" (bukan "gagal"),
 *     tanpa kabar galat, dan engine tidak dipanggil sama sekali.
 *
 * Jalankan: node scripts/uji-balap-analisa.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/i18n.jsx");
const { Chess } = await import("chess.js");
const { KonteksMesin } = await import("../src/halaman/Analisa/konteks/mesin.jsx");
const { ErrorsContext } = await import("../src/halaman/Analisa/konteks/errors.jsx");
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

/* ------------------------- engine gerbang ------------------------- */

class EngineGerbang {
  constructor() {
    this.jumlahCari = 0;
    this.tahanPada = -1; // panggilan ke-N ditahan sampai bukaGerbang()
    this.bukaGerbang = null;
    this.gagalkanBerikutnya = false;
  }
  async siapkan() {}
  async cari(fen, { kedalaman, sinyal } = {}) {
    this.jumlahCari++;
    if (this.gagalkanBerikutnya) {
      this.gagalkanBerikutnya = false;
      throw new Error("mesin mati (simulasi)");
    }
    if (sinyal?.aborted) throw Object.assign(new Error("canceled"), { kunci: "canceled" });
    if (this.jumlahCari === this.tahanPada) {
      await new Promise((selesai) => {
        this.bukaGerbang = selesai;
      });
      this.bukaGerbang = null;
      // Dibatalkan selama tertahan → berperilaku seperti engine asli.
      if (sinyal?.aborted) throw Object.assign(new Error("canceled"), { kunci: "canceled" });
    }
    const c = new Chess(fen);
    const pilihan = c.moves({ verbose: true })[0];
    return {
      staticEval: ["cp", "10"],
      bestMove: pilihan ? [formatSquare(pilihan.from), formatSquare(pilihan.to)] : undefined,
      bestMoveCoronation: undefined,
      kedalamanTercapai: kedalaman,
      pv: [],
      daftarKandidat: [],
    };
  }
  gameBaru() {}
  setop() {}
  hancurkan() {}
}

const engine = new EngineGerbang();
// Indireksi agar skenario 5 bisa memaksa jalur `siapkan()` yang TERTAHAN
// (tanpa render ulang — Game membaca fungsi stabil ini, yang membaca
// variabel skenario saat dipanggil).
let ambilHasil = engine;
let tahanSiapkan = false;
let bukaSiapkan = null;
const NILAI_MESIN_PALSU = {
  idEngine: "engine-palsu",
  gantiEngine: () => {},
  status: "siap",
  galat: "",
  siapkan: async () => {
    if (tahanSiapkan) await new Promise((selesai) => { bukaSiapkan = selesai; });
    return engine;
  },
  setop: () => {},
  ambilMesin: () => ambilHasil,
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

// Mata-mata galat halaman: Game hanya memakai setter-nya.
let daftarGalat = [];
const setErrorsMata = (nilai) => {
  daftarGalat = typeof nilai === "function" ? nilai(daftarGalat) : nilai;
};

const wadah = React.createRef();

act(() => {
  root.render(
    React.createElement(
      I18nProvider,
      null,
      React.createElement(
        ErrorsContext.Provider,
        { value: { errors: [[], setErrorsMata] } },
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
    )
  );
});

const PGN1 = `[Event "Balap 1"]

1. e4 e5 *`;
const PGN2 = `[Event "Balap 2"]

1. d4 d5 *`;

async function muatPgn(teks) {
  await act(async () => {
    ctx.data[1]({ format: "pgn", string: teks });
    await new Promise((r) => setTimeout(r, 30));
  });
}

function kirimEvent(node, tipe, tombol = 0) {
  node.dispatchEvent(
    new window.MouseEvent(tipe, { bubbles: true, cancelable: true, button: tombol, clientX: 0, clientY: 0 })
  );
}

/** Seret e2→e4; kembalikan setelah mouseup di-flush (analisis boleh tertahan). */
async function seretE2E4(tungguMs = 30) {
  const kotakE2 = el.querySelector('[data-square="e2"]');
  const bidakE2 = kotakE2?.querySelector("[data-dontcleandrag]");
  if (!bidakE2) return false;
  act(() => {
    kirimEvent(bidakE2, "mousedown");
  });
  const kotak = el.querySelector('[data-square="e4"]');
  const titik = kotak?.querySelector(".justify-center");
  if (!titik) return false;
  await act(async () => {
    kirimEvent(titik, "mouseup");
    await new Promise((r) => setTimeout(r, tungguMs));
  });
  return true;
}

async function kembaliKeAwal() {
  await act(async () => {
    ctx.gameController.back();
    await new Promise((r) => setTimeout(r, 5));
  });
}

/* ------------------------- 1 & 2: muat + reset galat ------------------------- */

console.log("== muatan baru membersihkan galat lama ==");
await muatPgn("sampah total bukan pgn");
hasil("PGN rusak → galat halaman terisi", daftarGalat.length >= 1, `galat ${daftarGalat.length}`);
hasil("PGN rusak → kembali ke formulir", ctx.pageState[0] === "default", ctx.pageState[0]);

await muatPgn(PGN1);
hasil('PGN1 → pageState "analyze"', ctx.pageState[0] === "analyze", ctx.pageState[0]);
hasil("PGN1 → 1 + 2 entri", ctx.game[0].length === 3, `panjang ${ctx.game[0].length}`);
hasil("galat lama dibersihkan muatan baru", daftarGalat.length === 0, `galat ${daftarGalat.length}`);
hasil("engine dipanggil 3× (awal + 2 langkah)", engine.jumlahCari === 3, `${engine.jumlahCari}×`);

/* ------------------------- 3: analisis basi vs muatan baru ------------------------- */

console.log("\n== analisis basi tidak menimpa muatan baru ==");
engine.tahanPada = 4; // panggilan analisis seret berikutnya ditahan
hasil("seret e2→e4 terkirim", (await seretE2E4()) === true);
hasil("papan terkunci (analyzingMove)", ctx.analyzingMove[0] === true);
hasil("placeholder seret terpasang", ctx.customLine[0].moveNumber === 0 && !ctx.customLine[0].moves[0]?.previousStaticEvals);
hasil("engine tertahan di gerbang", engine.bukaGerbang !== null);

await muatPgn(PGN2);
hasil('muatan baru selesai ("analyze")', ctx.pageState[0] === "analyze", ctx.pageState[0]);
hasil("partai baru = PGN2 (d4)", ctx.game[0][1]?.san === "d4", ctx.game[0][1]?.san);
hasil("customLine direset muatan baru", ctx.customLine[0].moveNumber === -1);
// Muatan baru melepas kunci papan (reset analyzingMove) walau analisis basi
// belum tuntas — itu perilaku yang diterima: yang dilarang adalah TULISAN
// basi, bukan ekor tertahannya (diuji di bawah).
hasil("engine basi masih tertahan di gerbang", engine.bukaGerbang !== null);

await act(async () => {
  engine.bukaGerbang();
  await new Promise((r) => setTimeout(r, 30));
});
hasil("kunci papan dilepas setelah basi selesai", ctx.analyzingMove[0] === false);
hasil("customLine TIDAK ditimpa hasil basi", ctx.customLine[0].moveNumber === -1 && ctx.customLine[0].moves.length === 0, JSON.stringify({ n: ctx.customLine[0].moveNumber, m: ctx.customLine[0].moves.length }));
hasil("partai tetap PGN2", ctx.game[0][1]?.san === "d4");
hasil("controller muatan baru TIDAK ditimpa (tak aborted)", ctx.analyzeController[0].signal.aborted === false);
hasil("engine total 7× (3 + 1 basi + 3)", engine.jumlahCari === 7, `${engine.jumlahCari}×`);

/* ------------------------- 4: gagal non-batal → cap "gagal" ------------------------- */

console.log('\n== gagal non-batal → placeholder dicap "gagal" ==');
engine.gagalkanBerikutnya = true;
hasil("seret kedua terkirim", (await seretE2E4()) === true);
hasil("kunci dilepas", ctx.analyzingMove[0] === false);
hasil('placeholder dicap "gagal"', ctx.customLine[0].moves[0]?.statusEvaluasi === "gagal", ctx.customLine[0].moves[0]?.statusEvaluasi);
hasil("galat dilaporkan ke halaman", daftarGalat.length >= 1, `galat ${daftarGalat.length}`);
await kembaliKeAwal();
hasil("reset customLine", ctx.customLine[0].moveNumber === -1);

/* ------------------------- 5: batal murni → cap "dibatalkan" ------------------------- */

console.log('\n== batal murni → placeholder dicap "dibatalkan" ==');
engine.tahanPada = engine.jumlahCari + 1;
hasil("seret ketiga terkirim", (await seretE2E4()) === true);
hasil("tertahan di gerbang", engine.bukaGerbang !== null);
await act(async () => {
  ctx.analyzeController[0].abort(); // seperti tombol Batal
  engine.bukaGerbang();
  await new Promise((r) => setTimeout(r, 30));
});
hasil("kunci dilepas", ctx.analyzingMove[0] === false);
hasil('placeholder dicap "dibatalkan"', ctx.customLine[0].moves[0]?.statusEvaluasi === "dibatalkan", ctx.customLine[0].moves[0]?.statusEvaluasi);
hasil("controller diganti yang segar", ctx.analyzeController[0].signal.aborted === false);
hasil("batal murni TIDAK mendorong galat baru", daftarGalat.length === 1, `galat ${daftarGalat.length}`);
await kembaliKeAwal();
hasil("reset customLine", ctx.customLine[0].moveNumber === -1);

/* ------------------------- 6: batal saat menunggu engine ------------------------- */

console.log('\n== batal saat menunggu engine → "dibatalkan", engine tak dipanggil ==');
ambilHasil = null; // paksa analyzeMove menunggu siapkan()
tahanSiapkan = true;
const cariSebelum = engine.jumlahCari;
hasil("seret keempat terkirim", (await seretE2E4()) === true);
hasil("tertahan di siapkan()", bukaSiapkan !== null);
hasil("papan terkunci saat menunggu", ctx.analyzingMove[0] === true);
await act(async () => {
  ctx.analyzeController[0].abort(); // Batal mendarat di sela await
  bukaSiapkan();
  await new Promise((r) => setTimeout(r, 30));
});
ambilHasil = engine;
tahanSiapkan = false;
bukaSiapkan = null;
hasil("kunci dilepas", ctx.analyzingMove[0] === false);
hasil('placeholder dicap "dibatalkan"', ctx.customLine[0].moves[0]?.statusEvaluasi === "dibatalkan", ctx.customLine[0].moves[0]?.statusEvaluasi);
hasil("engine TIDAK dipanggil (parseMove tak berjalan)", engine.jumlahCari === cariSebelum, `${cariSebelum} → ${engine.jumlahCari}`);
hasil("batal TIDAK mendorong galat baru", daftarGalat.length === 1, `galat ${daftarGalat.length}`);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
