/**
 * Uji HASIL ANALISA fitur Analisa — grafik + komponen `Summary` ASLI
 * di atas jsdom, diberi partai hasil `parsePGN()` asli dengan engine PALSU
 * deterministik:
 *
 *   Skenario skor (sudut pandang putih):
 *     1.e4 best(100)  1...e5 excellent(90)  2.Nf3 excellent(90)  2...Nc6 excellent(90)
 *     3.Bc4 BLUNDER(0) 3...Bc5 excellent(90) 4.O-O excellent(90)  4...Nf6 excellent(90)
 *     5.d3 excellent(90) 5...O-O excellent(90)
 *
 *   Diperiksa dari DOM hasil render:
 *     - nama pemain + akurasi keseluruhan: Putih 74.0, Hitam 90.0
 *     - RatingCount per label (best w=1; excellent w=3 b=5; blunder w=1)
 *     - rating partai (rumus getRating: 74 → 700, 90 → 2250)
 *     - ikon fase: pembukaan ada (good/excellent), menengah & akhir "-"
 *     - grafik evaluasi (GameChart): bar SVG + lingkaran highlightBlunder
 *     - interaksi grafik: hover + klik memindahkan moveNumber/forward
 *
 * Jalankan: node scripts/uji-hasil.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { Chess } = await import("chess.js");
const { formatSquare, parsePGN } = await import("../src/halaman/Analisa/mesin/engine.js");
const { ID } = await import("../src/lib/terjemahan/id/index.js");
const { default: Summary } = await import(
  "../src/halaman/Analisa/komponen/menu/analysis/summary/summary.jsx"
);
const { default: GrafikMuat } = await import(
  "../src/halaman/Analisa/komponen/menu/loading/grafikMuat.jsx"
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
const tID = (kunci, ganti = {}) => {
  let teks = kunci.split(".").reduce((o, k) => (o ? o[k] : undefined), ID) ?? kunci;
  for (const [k, v] of Object.entries(ganti)) teks = teks.replaceAll(`{${k}}`, v);
  return teks;
};

/* ------------------------- engine palsu (skenario deterministik) ------------------------- */

const PGN = `[Event "Uji Hasil Analisa"]
[Site "localhost"]
[Date "2026.09.10"]
[White "Putih"]
[Black "Hitam"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 O-O`;

/* FEN tiap posisi. */
const caturUji = new Chess();
const FEN_POSISI = [caturUji.fen()];
for (const token of PGN.split(/\n\s*\n/).pop().split(/\s+/)) {
  if (/^\d+\.+$/.test(token)) continue;
  FEN_POSISI.push(caturUji.move(token).after);
}

/* Keunggulan putih (dalam paskal) SESUDAH tiap setangan. */
const SKOR_PUTIH = [0.3, 0.3, 0.5, 0.5, -5.0, -5.0, -5.2, -5.2, -5.4, -5.4];

const kotak = (s) => formatSquare(s);
function saranEngine(fen) {
  const gerak = new Chess(fen).moves({ verbose: true });
  const pilihan =
    gerak.find((m) => m.from === "h2" && m.to === "h3") ??
    gerak.find((m) => m.from === "h7" && m.to === "h6") ??
    gerak[0];
  return [kotak(pilihan.from), kotak(pilihan.to)];
}

class EnginePalsu {
  constructor() {
    this.jumlahCari = 0;
  }
  async siapkan() {}
  async cari(fen, { kedalaman } = {}) {
    this.jumlahCari++;
    if (fen === FEN_POSISI[0]) {
      return { staticEval: ["cp", "30"], bestMove: [kotak("e2"), kotak("e4")], bestMoveCoronation: undefined, kedalamanTercapai: kedalaman, pv: [] };
    }
    const i = FEN_POSISI.indexOf(fen) - 1;
    const giliranPutih = i % 2 === 0; // setelah putih main → giliran hitam
    const sudutPutih = SKOR_PUTIH[i];
    return {
      staticEval: ["cp", String(giliranPutih ? Math.round(-sudutPutih * 100) : Math.round(sudutPutih * 100))],
      bestMove: saranEngine(fen),
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

/* ------------------------- partai hasil parsePGN ASLI ------------------------- */

const { metadata, moves } = await parsePGN(engine, PGN, 15, {}, () => {});

console.log("== partai hasil analisis (parsePGN asli + engine palsu) ==");
hasil(
  'pemain: [{name:"Putih"},{name:"Hitam"}]',
  metadata.players?.[0]?.name === "Putih" && metadata.players?.[1]?.name === "Hitam",
  JSON.stringify(metadata.players)
);
hasil('hasil "1-0"', metadata.result === "1-0", metadata.result);
hasil("11 entri (awal + 10 langkah)", moves.length === 11, `panjang ${moves.length}`);
hasil("engine dipanggil 11× (1 per posisi)", engine.jumlahCari === 11, `dipanggil ${engine.jumlahCari}×`);
/*
 * Catatan: 3...Bc5 berlabel "great" (bukan "excellent") karena aturan
 * "great — menghukum kesalahan lawan": langkah itu excellent (diff 0) dan
 * langkah SEBELUMNYA (3.Bc4) adalah blunder. Ini perilaku desain penilaian.js.
 */
hasil(
  'label langkah: e4 best, Bc4 blunder, Bc5 great (hukum blunder), lainnya excellent',
  moves[1].moveRating === "best" && moves[5].moveRating === "blunder" &&
    moves[6].moveRating === "great" &&
    [2, 3, 4, 7, 8, 9, 10].every((i) => moves[i].moveRating === "excellent"),
  JSON.stringify(moves.map((m) => m.moveRating))
);

/* ------------------------- ekspektasi independen ------------------------- */

/* Mirip rumus getRating di gameRating.jsx (1.5x^4, pembulatan 50, plafon 3000+). */
function ratingDariAkurasi(akurasi) {
  const norm = (akurasi - 40) / 60;
  const rating = 2700 * (1.5 * Math.pow(norm, 4)) + 300;
  const dibulatkan = Math.round(rating / 50) * 50;
  return Number.isNaN(dibulatkan) ? 0 : dibulatkan > 3000 ? "3000+" : String(dibulatkan);
}

const PETA_AKURASI = { brilliant: 100, great: 100, best: 100, book: 100, excellent: 90, good: 70, inaccuracy: 30, miss: 30, mistake: 20, blunder: 0 };
const akurasiPutih = [];
const akurasiHitam = [];
for (let i = 1; i < moves.length; i++) {
  const nilai = PETA_AKURASI[moves[i].moveRating];
  if (moves[i].color === "b") akurasiPutih.push(nilai);
  else akurasiHitam.push(nilai);
}
const rata = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const AKURASI_W = rata(akurasiPutih); // 74
const AKURASI_B = rata(akurasiHitam); // 90

/* ------------------------- render Grafik + Summary seperti di Menu ------------------------- */

const el = document.getElementById("root");
const root = createRoot(el);

const status = { moveNumber: 0, animation: false, forward: false };
function Wadah() {
  const [moveNumber, setMoveNumber] = React.useState(0);
  const [animation, setAnimation] = React.useState(false);
  const [forward, setForward] = React.useState(false);
  status.moveNumber = moveNumber;
  status.animation = animation;
  status.forward = forward;
  return React.createElement(React.Fragment, null,
    React.createElement(GrafikMuat, {
      moves, moveNumber, setMoveNumber, setAnimation, setForward, interaktif: true,
    }),
    React.createElement(Summary, { moves, players: metadata.players }),
  );
}

act(() => {
  root.render(React.createElement(I18nProvider, null, React.createElement(Wadah)));
});

/* ------------------------- 1. pemain & akurasi keseluruhan ------------------------- */

console.log("\n== akurasi pemain (DOM) ==");
const semuaTeks = el.textContent;
hasil('nama "Putih" & "Hitam" tampil', semuaTeks.includes("Putih") && semuaTeks.includes("Hitam"));
hasil(`akurasi Putih = ${AKURASI_W.toFixed(1)}`, semuaTeks.includes(AKURASI_W.toFixed(1)), `teks: ${semuaTeks.match(/\d+\.\d/g)?.join(",")}`);
hasil(`akurasi Hitam = ${AKURASI_B.toFixed(1)}`, semuaTeks.includes(AKURASI_B.toFixed(1)));

/* ------------------------- 2. RatingCount ------------------------- */

console.log("\n== jumlah penilaian per label (RatingCount) ==");
function cariBaris(label) {
  const target = tID(`analisa.penilaian.${label}`);
  const spans = Array.from(el.querySelectorAll("span.text-sm.font-semibold.text-foregroundGrey"));
  const sp = spans.find((s) => s.textContent === target);
  if (!sp) return null;
  const baris = sp.closest("div");
  const angka = Array.from(baris.querySelectorAll("span")).filter((s) => /^\d+$/.test(s.textContent));
  return { putih: Number(angka[0]?.textContent ?? 0), hitam: Number(angka[1]?.textContent ?? 0) };
}
hasil("label kamus terurai (bukan id mentah)", cariBaris("blunder") !== null, tID("analisa.penilaian.blunder"));
const cBest = cariBaris("best");
const cExcell = cariBaris("excellent");
const cBlunder = cariBaris("blunder");
const cBrill = cariBaris("brilliant");
const cGreat = cariBaris("great");
hasil('best: Putih 1, Hitam 0', cBest?.putih === 1 && cBest?.hitam === 0, JSON.stringify(cBest));
hasil('great: Putih 0, Hitam 1 (3...Bc5)', cGreat?.putih === 0 && cGreat?.hitam === 1, JSON.stringify(cGreat));
hasil('excellent: Putih 3, Hitam 4', cExcell?.putih === 3 && cExcell?.hitam === 4, JSON.stringify(cExcell));
hasil('blunder: Putih 1, Hitam 0', cBlunder?.putih === 1 && cBlunder?.hitam === 0, JSON.stringify(cBlunder));
hasil('brilliant: 0 / 0', cBrill?.putih === 0 && cBrill?.hitam === 0, JSON.stringify(cBrill));

/* ------------------------- 3. rating partai & fase ------------------------- */

console.log("\n== rating partai (GameRating) ==");
const teksSetelah = () => el.textContent;
hasil(`rating Putih = ${ratingDariAkurasi(AKURASI_W)}`, teksSetelah().includes(ratingDariAkurasi(AKURASI_W)), `diharap ${ratingDariAkurasi(AKURASI_W)}`);
hasil(`rating Hitam = ${ratingDariAkurasi(AKURASI_B)}`, teksSetelah().includes(ratingDariAkurasi(AKURASI_B)), `diharap ${ratingDariAkurasi(AKURASI_B)}`);

/*
 * Fase (isEndOpening): pembukaan berakhir setelah 4...Nf6 (hitam sudah
 * mengembangkan 3 bidak, putih 2). Jadi:
 *   opening.w  = [e4:100, Nf3:90, Bc4:0, O-O:90]  → rata 70.0
 *   opening.b  = [e5:90, Nc6:90, Bc5:100, Nf6:90] → rata 92.5
 *   middlegame = [d3:90] / [O-O:90]  → kurang 3 langkah → "-"
 *   endgame    = kosong               → "-"
 */
const barisFase = (namaT) => {
  const spans = Array.from(el.querySelectorAll("span.text-sm.font-semibold.text-foregroundGrey"));
  const sp = spans.find((s) => s.textContent === tID(namaT));
  return sp ? sp.closest("div") : null;
};
function isiSelFase(baris, sisi) {
  if (!baris) return null;
  const sel = Array.from(baris.querySelectorAll("div.flex.items-center.justify-center"));
  const d = sel[sisi];
  if (!d) return null;
  const ikon = d.querySelector("div[title]");
  const strip = d.querySelector("span");
  return { adaIkon: Boolean(ikon), judul: ikon?.getAttribute("title") ?? null, strip: strip?.textContent ?? null };
}
const fPembukaan = isiSelFase(barisFase("analisa.ringkasan.pembukaan"), 0);
const fPembukaanH = isiSelFase(barisFase("analisa.ringkasan.pembukaan"), 1);
const fMenengahP = isiSelFase(barisFase("analisa.ringkasan.menengah"), 0);
const fMenengahH = isiSelFase(barisFase("analisa.ringkasan.menengah"), 1);
const fAkhirP = isiSelFase(barisFase("analisa.ringkasan.akhir"), 0);
const fAkhirH = isiSelFase(barisFase("analisa.ringkasan.akhir"), 1);
hasil("pembukaan Putih: ikon ada + judul memuat akurasi 70.0", fPembukaan?.adaIkon === true && fPembukaan.judul?.includes("70.0"), JSON.stringify(fPembukaan));
hasil("pembukaan Hitam: ikon ada + judul memuat akurasi 92.5", fPembukaanH?.adaIkon === true && fPembukaanH.judul?.includes("92.5"), JSON.stringify(fPembukaanH));
hasil("menengah Putih: '-' (kurang dari 3 langkah)", fMenengahP?.adaIkon === false && fMenengahP.strip === "-", JSON.stringify(fMenengahP));
hasil("menengah Hitam: '-'", fMenengahH?.adaIkon === false && fMenengahH.strip === "-", JSON.stringify(fMenengahH));
hasil("akhir Putih: '-'", fAkhirP?.adaIkon === false && fAkhirP.strip === "-", JSON.stringify(fAkhirP));
hasil("akhir Hitam: '-'", fAkhirH?.adaIkon === false && fAkhirH.strip === "-", JSON.stringify(fAkhirH));

/* ------------------------- 4. grafik evaluasi (GameChart) ------------------------- */

console.log("\n== grafik evaluasi ==");
const svgChart = el.querySelector("svg.bg-evaluationBarBlack");
hasil("SVG grafik ada", Boolean(svgChart));
hasil("bar evaluai putih (path fill #ffffff) ada", Boolean(svgChart?.querySelector('path[fill="#ffffff"]')));
hasil(
  "lingkaran highlightBlunder untuk 3.Bc4 tergambar",
  el.querySelectorAll('circle[style*="highlightBlunder"]').length === 1,
  `ditemukan ${el.querySelectorAll('circle[style*="highlightBlunder"]').length}`
);

console.log("\n== interaksi grafik: hover + klik langkah 3.Bc4 ==");
// mousemove dan klik harus di `act` terpisah: handler klik membaca
// state hoveredMove dari render sebelumnya (batching).
await act(async () => {
  svgChart.dispatchEvent(new window.MouseEvent("mousemove", { bubbles: true, clientX: 200, clientY: 48 }));
});
await act(async () => {
  svgChart.dispatchEvent(new window.MouseEvent("click", { bubbles: true, clientX: 200, clientY: 48 }));
});
hasil("klik grafik memindahkan moveNumber ke 5 (3.Bc4)", status.moveNumber === 5, `moveNumber ${status.moveNumber}`);
hasil("klik ke depan menyetel forward=true", status.forward === true, `forward ${status.forward}`);

/* ------------------------- ringkasan ------------------------- */

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
