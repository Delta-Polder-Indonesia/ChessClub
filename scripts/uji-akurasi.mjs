/**
 * Uji AKURASI & RATING pemain fitur Analisa — komponen ASLI di atas jsdom:
 *
 *   1. `avg` (playersAccuracy.jsx): array kosong → NaN, rata-rata biasa.
 *   2. `PlayersAccuracy`: akurasi KURVA WIN CHANCE (`mesin/akurasi.js`) atas
 *      partai NYATA hasil `parsePGN()` + engine palsu deterministik;
 *      kredit langkah ke pelangkah (lawan `entry.color`, lewat
 *      `pemainDariEntri`); deteksi fase pembukaan → tengah → akhir (satu arah);
 *      PARITAS dengan `ringkasWarna()` (sumber angka kartu Wawasan);
 *      langkah paksa ikut Akurasi tapi tidak ikut fase; FEN rusak → akurasi
 *      tetap dihitung, fase tidak; ply tanpa eval tidak dihitung;
 *      label tak dikenal tidak mengubah angka;
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
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { Chess } = await import("chess.js");
const { default: PlayersAccuracy } = await import("../src/halaman/Analisa/komponen/menu/analysis/summary/playersAccuracy.jsx");
const { avg } = await import("../src/halaman/Analisa/komponen/menu/analysis/summary/playersAccuracyData.js");
const { default: GameRating } = await import(
  "../src/halaman/Analisa/komponen/menu/analysis/summary/gameRating.jsx"
);
const { formatSquare, parsePGN } = await import("../src/halaman/Analisa/mesin/engine.js");
/*
 * Sumber angka yang diharapkan seksi 2. Ekspektasinya DITURUNKAN dari fungsi
 * produksi ini lalu di-pin: kalau `akurasiMove` berubah, PIN tidak lagi cocok
 * dan uji gagal — bukan ekspektasinya yang ikut bergeser mengikuti kode.
 */
const { akurasiMove, pemainDariEntri } = await import("../src/halaman/Analisa/mesin/akurasi.js");
const { ringkasWarna } = await import("../src/halaman/Analisa/mesin/ringkasanAnalisis.js");

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

/* ------------------------- 1. avg ------------------------- */

console.log("== avg ==");
hasil("avg([]) = NaN", Number.isNaN(avg([])));
hasil("avg([100, 0]) = 50", avg([100, 0]) === 50);
hasil("avg([30]) = 30", avg([30]) === 30);

/* ------------------------- 2. PlayersAccuracy ------------------------- */

/*
 * PARTAI NYATA hasil `parsePGN()` + engine palsu deterministik — pola yang sama
 * dengan `scripts/uji-hasil.mjs`. Sengaja bukan daftar entri buatan tangan:
 * bentuk entri (`moves[0]` = posisi awal, `color` = pihak yang bergilir
 * SESUDAH langkah, `previousStaticEvals` akumulatif) terlalu mudah salah
 * ditiru, dan kalau salah yang rusak adalah kredit warna seluruh partai.
 * Dengan partai asli, pemetaan indeks → pelangkah datang dari parser sungguhan.
 *
 * 73 langkah, ketiga fase terisi (pembukaan 14, menengah 39, akhir 20).
 */
const PGN_UJI = `[Event "Uji Akurasi"]
[Site "localhost"]
[Date "2026.10.22"]
[White "Putih"]
[Black "Hitam"]
[Result "1-0"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be7 8. f3 Be6 9. Qd2 O-O 10. O-O-O Nbd7 11. g4 b5 12. g5 Nh5 13. Kb1 Nb6 14. Na5 Rc8 15. Bxb6 Qxb6 16. Nd5 Bxd5 17. exd5 Qxa5 18. Qxa5 Nf4 19. h4 Nxd5 20. Rxd5 Rxc2 21. Qd2 Rxd2 22. Rxd2 d5 23. Bd3 Rd8 24. Rc1 g6 25. Rc6 Kg7 26. Rxa6 Rd6 27. Rxd6 Bxd6 28. Bxb5 Bc5 29. Rxd5 Be3 30. Rd3 Bf4 31. a4 f6 32. a5 fxg5 33. hxg5 Bxg5 34. a6 Be7 35. Rd7 Kf6 36. a7 Bc5 37. b4`;

/* FEN tiap posisi: indeks 0 = posisi awal, indeks k = sesudah ply k. */
const caturUji = new Chess();
const FEN_POSISI = [caturUji.fen()];
for (const token of PGN_UJI.split(/\n\s*\n/).pop().split(/\s+/)) {
  if (/^\d+\.+$/.test(token)) continue;
  FEN_POSISI.push(caturUji.move(token).after);
}

/*
 * Keunggulan putih (paskal) SESUDAH tiap ply. Dirancang supaya KEDUA pemain
 * punya campuran rugi kecil (akurasi ~97-100), rugi sedang (~75) dan rugi
 * besar (~44). Tanpa kerugian sama sekali setiap langkah menjadi 100 dan
 * seksinya tidak membuktikan apa-apa; `peluangMenang` menjenuh di ±1000 cp
 * jadi semua nilai dijauhkan dari plafon itu.
 */
const SKOR_PUTIH = [
  0.30, 0.35, 0.25, 0.30, 0.20, 0.25, 0.15, 0.20, 0.30, 0.25,
  0.35, 0.30, 0.40, 0.35, 0.45, 0.40, -0.30, -0.25, -0.35, -0.30,
  -0.20, -0.25, -0.15, -0.20, -0.10, -0.15, -0.05, -0.10, 0.00, -0.05,
  0.05, 0.00, 0.10, 0.05, 0.15, 0.10, 0.20, 0.15, 0.25, 0.20,
  -0.50, -0.45, -0.35, -0.40, -0.30, -0.35, -0.25, -0.30, -0.20, -0.25,
  -0.15, -0.20, -0.10, 2.00, 2.05, 1.30, 1.35, 0.60, 0.65, 0.70,
  0.65, 2.85, 2.90, 2.95, 2.90, 3.00, 2.95, 3.05, 3.00, 3.10,
  3.05, 3.15, 3.10, 3.20,
];

const kotakUji = (s) => formatSquare(s);
function saranEngine(fen) {
  const gerak = new Chess(fen).moves({ verbose: true });
  const pilihan =
    gerak.find((m) => m.from === "h2" && m.to === "h3") ??
    gerak.find((m) => m.from === "h7" && m.to === "h6") ??
    gerak[0];
  return [kotakUji(pilihan.from), kotakUji(pilihan.to)];
}

/** Eval sudut PIHAK YANG BERGILIR di `fen` — persis kontrak Stockfish. */
class EnginePalsu {
  async siapkan() {}
  async cari(fen, { kedalaman } = {}) {
    const awal = fen === FEN_POSISI[0];
    const i = awal ? 0 : FEN_POSISI.indexOf(fen) - 1;
    const giliranPutih = i % 2 === 0;
    const cp = Math.round((giliranPutih ? -SKOR_PUTIH[i] : SKOR_PUTIH[i]) * 100);
    return {
      staticEval: ["cp", String(cp)],
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

const { moves: MOVES } = await parsePGN(new EnginePalsu(), PGN_UJI, 15, {}, () => {});

/*
 * Kasus tepi DITEMPELKAN ke partai nyata (bukan entri sintetis terpisah),
 * supaya yang diuji tetap bentuk data yang dihasilkan `parsePGN`. Semua ply
 * yang dipilih jauh dari batas fase — kalau tidak, satu entri rusak akan
 * menggeser fase seluruh sisa partai dan uji jadi menguji hal lain.
 */
const PLY_PAKSA = 43; // Putih: ikut Akurasi, tidak ikut fase
const PLY_FEN_RUSAK = 46; // Hitam: akurasi tetap dihitung, fase tidak
const PLY_TANPA_EVAL = 61; // Putih: tidak dihitung di mana pun
const PLY_LABEL_ASING = 64; // Hitam: tetap dihitung
MOVES[PLY_PAKSA].isForced = true;
/*
 * Eval ply paksa DIKHAS-kan (rugi ~12 poin win chance → akurasi 82.29) supaya
 * nilainya tidak sama dengan 100 yang dimiliki banyak langkah lain. Tanpa ini
 * "tidak ikut fase" tidak bisa dibuktikan: nilai 100 tetap akan ditemukan di
 * daftar fase, hanya berasal dari langkah yang berbeda.
 */
MOVES[PLY_PAKSA].previousStaticEvals = [["cp", "10"], ["cp", "40"]];
MOVES[PLY_FEN_RUSAK].fen = "bukan-fen";
MOVES[PLY_TANPA_EVAL].previousStaticEvals = [["cp", null]];
MOVES[PLY_LABEL_ASING].moveRating = "alien";

const PLAYERS = [{ name: "Putih" }, { name: "Hitam" }];

/*
 * EKSPEKTASI. `akurasi*` DITURUNKAN dari fixture lewat fungsi produksi
 * `akurasiMove`, sedangkan `PIN_*` adalah salinan keluaran fungsi itu pada
 * saat seksi ini ditulis. Keduanya diperiksa: kalau `akurasiMove` berubah,
 * PIN tidak lagi cocok dan uji gagal — ekspektasinya tidak ikut bergeser
 * diam-diam mengikuti kode.
 */
const PLY_PUTIH = [];
const PLY_HITAM = [];
for (let i = 1; i < MOVES.length; i++) {
  const mover = pemainDariEntri(MOVES[i], i);
  if (mover === "w") PLY_PUTIH.push(i);
  else if (mover === "b") PLY_HITAM.push(i);
}
const acc = (i) => akurasiMove(MOVES[i]);
const rata = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const sampelPutih = PLY_PUTIH.map(acc).filter(Number.isFinite);
const sampelHitam = PLY_HITAM.map(acc).filter(Number.isFinite);
/* Diukur 2026-10-22. Putih: 36 sampel (ply 61 tanpa eval). Hitam: 36 sampel. */
const PIN_PUTIH = 97.75224649393323; // tampil "97.8"
const PIN_HITAM = 96.43311589466; // tampil "96.4"
/*
 * Indeks fase DIUKUR, bukan dihitung dari panjang partai: batasnya ditentukan
 * `isEndOpening`/`isEndMiddlegame` atas papan tiap langkah. Angka kedua adalah
 * rata-rata akurasi fase pada saat seksi ini ditulis.
 */
const FASE = {
  opening: { w: { n: 7, rata: 98.6952 }, b: { n: 7, rata: 99.4043 } },
  middlegame: { w: { n: 19, rata: 97.2927 }, b: { n: 18, rata: 99.8271 } },
  endgame: { w: { n: 9, rata: 99.7070 }, b: { n: 10, rata: 87.8875 } },
};

console.log("\n== PlayersAccuracy: akurasi kurva win chance, kredit warna, fase ==");
hasil(
  "partai nyata: 74 entri = posisi awal + 73 langkah",
  MOVES.length === 74 && FEN_POSISI.length === 74 && SKOR_PUTIH.length === 74,
  `moves=${MOVES.length} fen=${FEN_POSISI.length} skor=${SKOR_PUTIH.length}`
);
hasil(
  "moves[0] = POSISI AWAL, bukan langkah (tanpa san/rating/akurasi)",
  MOVES[0].san === undefined && MOVES[0].moveRating === undefined && acc(0) === null,
  `san=${JSON.stringify(MOVES[0].san)} akurasi=${acc(0)}`
);
/* 73 langkah: Putih membuka, jadi Putih 37 ply (ganjil) dan Hitam 36 (genap). */
hasil(
  "kredit warna: Putih = 37 ply ganjil, Hitam = 36 ply genap",
  PLY_PUTIH.length === 37 && PLY_HITAM.length === 36 &&
    PLY_PUTIH.every((i) => i % 2 === 1) && PLY_HITAM.every((i) => i % 2 === 0),
  `putih=${PLY_PUTIH.length} hitam=${PLY_HITAM.length}`
);
/*
 * Bukti bahwa akurasi TIDAK lagi dibaca dari label. Dicari di data, bukan
 * ditulis tangan: yang diuji adalah PROPERTI-nya (label sama → angka bisa
 * berbeda), jadi assertion tidak ikut rusak bila skor engine diubah.
 */
const PLY_SEMPURNA = MOVES.findIndex(
  (m, i) => i > 0 && m.moveRating === "excellent" && acc(i) === 100
);
hasil(
  "label tidak menentukan angka: dua 'excellent' → 100 dan 96.96",
  PLY_SEMPURNA > 0 && MOVES[3].moveRating === "excellent" &&
    Math.abs(acc(3) - 96.959003) < 1e-6,
  `ply sempurna=${PLY_SEMPURNA} acc(3)=${acc(3)}`
);
hasil(
  'tidak ada lagi label "excellent" yang bernilai 90 poin tetap',
  !MOVES.some((m, i) => i > 0 && m.moveRating === "excellent" && acc(i) === 90),
  "masih ada excellent = 90"
);
hasil(
  "label 'inaccuracy' (ply 54) → 43.85, bukan 30 poin tetap",
  MOVES[54].moveRating === "inaccuracy" && Math.abs(acc(54) - 43.851748) < 1e-6,
  `acc(54)=${acc(54)}`
);
hasil(
  "ply paksa punya akurasi khas (bukan 100) supaya bisa dilacak",
  acc(PLY_PAKSA) !== 100 && Number.isFinite(acc(PLY_PAKSA)),
  `acc(${PLY_PAKSA})=${acc(PLY_PAKSA)}`
);
hasil("ply tanpa eval → akurasi null, bukan 0", acc(PLY_TANPA_EVAL) === null, String(acc(PLY_TANPA_EVAL)));
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
    "akurasi putih = rata-rata aritmetik 36 sampel (97.752…)",
    Math.abs(akurasiTerkunci?.w - PIN_PUTIH) < 1e-9 &&
      Math.abs(akurasiTerkunci?.w - rata(sampelPutih)) < 1e-9,
    `dapat ${akurasiTerkunci?.w}, pin ${PIN_PUTIH}`
  );
  hasil(
    "akurasi hitam = rata-rata aritmetik 36 sampel (96.433…)",
    Math.abs(akurasiTerkunci?.b - PIN_HITAM) < 1e-9 &&
      Math.abs(akurasiTerkunci?.b - rata(sampelHitam)) < 1e-9,
    `dapat ${akurasiTerkunci?.b}, pin ${PIN_HITAM}`
  );
  /*
   * PARITAS dengan dashboard Wawasan: baris Akurasi dan `ringkasWarna()` —
   * dibaca `hitungTaktikal` lewat peta analisis sesi — HARUS sama persis untuk
   * `moves` yang sama. Inilah inti perbaikan 2026-10-22: satu partai, satu
   * angka akurasi, di Ringkasan maupun di Wawasan.
   */
  hasil(
    "paritas dengan ringkasWarna (sumber angka kartu Wawasan) — putih",
    akurasiTerkunci?.w === ringkasWarna(MOVES, "w").accuracyEstimate,
    `${akurasiTerkunci?.w} vs ${ringkasWarna(MOVES, "w").accuracyEstimate}`
  );
  hasil(
    "paritas dengan ringkasWarna (sumber angka kartu Wawasan) — hitam",
    akurasiTerkunci?.b === ringkasWarna(MOVES, "b").accuracyEstimate,
    `${akurasiTerkunci?.b} vs ${ringkasWarna(MOVES, "b").accuracyEstimate}`
  );
  for (const fase of ["opening", "middlegame", "endgame"]) {
    const w = faseTerkunci?.[fase]?.w ?? [];
    const b = faseTerkunci?.[fase]?.b ?? [];
    hasil(
      `fase ${fase}: putih n=${FASE[fase].w.n} rata≈${FASE[fase].w.rata}, hitam n=${FASE[fase].b.n} rata≈${FASE[fase].b.rata}`,
      w.length === FASE[fase].w.n && b.length === FASE[fase].b.n &&
        Math.abs(rata(w) - FASE[fase].w.rata) < 5e-5 &&
        Math.abs(rata(b) - FASE[fase].b.rata) < 5e-5,
      `dapat w n=${w.length} rata=${w.length ? rata(w).toFixed(4) : "-"} b n=${b.length} rata=${b.length ? rata(b).toFixed(4) : "-"}`
    );
  }
  /*
   * Langkah paksa ikut baris Akurasi (mengikuti `summarizeColor` acuan, yang
   * hanya menyaring `status === 'classified'`) tetapi tidak ikut daftar fase.
   * Selisih sampel-vs-fase harus NYATA, kalau tidak pembeda itu bisa hilang
   * tanpa terdeteksi.
   */
  const gabunganW = FASE.opening.w.n + FASE.middlegame.w.n + FASE.endgame.w.n;
  const gabunganB = FASE.opening.b.n + FASE.middlegame.b.n + FASE.endgame.b.n;
  hasil(
    "langkah paksa & ply tanpa eval: putih 36 sampel Akurasi vs 35 di fase",
    sampelPutih.length === 36 && gabunganW === 35,
    `${sampelPutih.length} vs ${gabunganW}`
  );
  hasil(
    "FEN rusak: hitam 36 sampel Akurasi vs 35 di fase",
    sampelHitam.length === 36 && gabunganB === 35,
    `${sampelHitam.length} vs ${gabunganB}`
  );
  hasil(
    "ply paksa ikut baris Akurasi tapi tidak ikut fase",
    Number.isFinite(acc(PLY_PAKSA)) &&
      sampelPutih.includes(acc(PLY_PAKSA)) &&
      ![...(faseTerkunci?.opening?.w ?? []), ...(faseTerkunci?.middlegame?.w ?? []), ...(faseTerkunci?.endgame?.w ?? [])].includes(acc(PLY_PAKSA)),
    `acc(${PLY_PAKSA})=${acc(PLY_PAKSA)}`
  );
  hasil(
    "FEN rusak → akurasi tetap dihitung, hanya catatan fasenya yang hilang",
    Number.isFinite(acc(PLY_FEN_RUSAK)) && sampelHitam.includes(acc(PLY_FEN_RUSAK)),
    `acc(${PLY_FEN_RUSAK})=${acc(PLY_FEN_RUSAK)}`
  );
  hasil(
    'label tak dikenal ("alien") tetap dihitung — akurasi tidak dibaca dari label',
    Number.isFinite(acc(PLY_LABEL_ASING)) &&
      sampelHitam.includes(acc(PLY_LABEL_ASING)) &&
      MOVES[PLY_LABEL_ASING].moveRating === "alien",
    `acc(${PLY_LABEL_ASING})=${acc(PLY_LABEL_ASING)}`
  );
  const teks = el.textContent;
  hasil('tampilan akurasi putih "97.8"', teks.includes("97.8"), teks.slice(0, 90));
  hasil('tampilan akurasi hitam "96.4"', teks.includes("96.4"), teks.slice(0, 90));
  hasil(
    "tanpa NaN di panel meski ada ply tanpa eval & FEN rusak",
    teks.includes("97.8") && teks.includes("96.4") && !teks.includes("NaN")
  );
  hasil(
    "label baris Akurasi menerangkan metodenya lewat title",
    Boolean(el.querySelector('[title*="win chance"]')),
    "title tidak memuat keterangan metode"
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
