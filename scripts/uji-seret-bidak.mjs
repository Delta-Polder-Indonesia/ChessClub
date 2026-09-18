/**
 * Uji SERET BIDAK di papan Analisa — komponen `Board` ASLI di atas jsdom.
 *
 * Fokusnya geometri drag, bagian yang tidak terjangkau uji lain karena jsdom
 * tidak punya layout (semua `getBoundingClientRect()` = 0, semua `offset*` = 0
 * — persis kondisi yang membuat bug-nya tak terlihat).
 *
 * Karena itu uji ini memasang TATA LETAK SINTETIS yang meniru posisi papan di
 * situs:
 *   • `getBoundingClientRect()` → koordinat viewport (yang dibaca kursor), dan
 *   • `offsetLeft`/`offsetTop` → koordinat terhadap offsetParent (`<main>`
 *     ber-`relative`), yang TIDAK memuat bilah navigasi dan TIDAK berkurang
 *     saat `<main>` di-scroll.
 *
 * Yang diperiksa:
 *   1. pusat bidak selalu tepat di bawah kursor (desktop: papan digeser kanan
 *      oleh bilah kiri; mobile: papan digeser bawah oleh bilah atas; dan saat
 *      `<main>` di-scroll) — termasuk di tepi kanan/bawah papan;
 *   2. bidak tetap terkurung di dalam papan saat kursor keluar jauh;
 *   3. lepas bidak di kotak legal tetap memicu `analyzeMove` (drag → langkah);
 *   4. klik bidak yang sudah terpilih tanpa gerak = batal pilih (perilaku lama);
 *   5. cincin penanda kotak tujuan benar-benar tampil saat drag;
 *   6. mousemove tanpa tombol tertahan (mouseup terlewat) mengakhiri drag.
 *
 * Jalankan: node scripts/uji-seret-bidak.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { Chess } = await import("chess.js");
const { default: ConfigContextProvider } = await import(
  "../src/halaman/Analisa/konteks/config.jsx"
);
const { default: Board } = await import(
  "../src/halaman/Analisa/komponen/game/board.jsx"
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

/* ----------------------- tata letak sintetis ----------------------- */

const UKURAN_PAPAN = 720; // px → squareSize 90
const KOTAK = UKURAN_PAPAN / 8;

/**
 * `papan` = posisi papan di VIEWPORT (dibaca getBoundingClientRect).
 * `offset` = nilai offsetLeft/offsetTop (relatif offsetParent `<main>`).
 * Keduanya sengaja bisa berbeda — di situs nyata memang berbeda.
 */
const tataLetak = {
  papan: { kiri: 0, atas: 0 },
  offset: { kiri: 0, atas: 0 },
};

function rectKotakDariId(id) {
  const file = id.charCodeAt(0) - 97; // a..h → 0..7
  const rank = Number(id[1]); // 1..8
  // Papan dirender dengan putih di bawah (prop `white: true`): a8 kiri-atas.
  const col = file;
  const row = 8 - rank;
  return {
    kiri: tataLetak.papan.kiri + col * KOTAK,
    atas: tataLetak.papan.atas + row * KOTAK,
  };
}

function buatRect(kiri, atas, lebar, tinggi) {
  return {
    x: kiri,
    y: atas,
    left: kiri,
    top: atas,
    right: kiri + lebar,
    bottom: atas + tinggi,
    width: lebar,
    height: tinggi,
    toJSON() {
      return this;
    },
  };
}

/** Geser dari inline style (bidak yang sedang diseret memakai top/left). */
function geserInline(el) {
  return {
    x: parseFloat(el.style.left) || 0,
    y: parseFloat(el.style.top) || 0,
  };
}

window.HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  // Papan = induk langsung dari kotak-kotak.
  if (this.querySelector && this.querySelector(":scope > [data-square]")) {
    return buatRect(
      tataLetak.papan.kiri,
      tataLetak.papan.atas,
      UKURAN_PAPAN,
      UKURAN_PAPAN
    );
  }
  const kotak = this.closest?.("[data-square]");
  if (kotak) {
    const { kiri, atas } = rectKotakDariId(kotak.dataset.square);
    const geser = geserInline(this);
    return buatRect(
      kiri + geser.x,
      atas + geser.y,
      KOTAK,
      KOTAK
    );
  }
  return buatRect(0, 0, 0, 0);
};

/* --------------------------- komponen uji --------------------------- */

const FEN_AWAL = new Chess().fen();
/* Posisi dengan bidak PUTIH di baris ke-7: satu-satunya cara menguji seret ke
   baris atas papan (daerah yang paling rusak oleh clamp offsetTop) tanpa
   menyentuh bidak lawan, yang memang tidak boleh diangkat. */
const FEN_ATAS = "8/P7/8/8/8/8/k6K/8 w - - 0 1";
let FEN_AKTIF = FEN_AWAL;
let dragTerakhir = null;
let langkahTerakhir = null;
let jumlahLangkah = 0;

function PapanUji() {
  const [drag, setDrag] = React.useState({ is: false, id: "" });
  dragTerakhir = drag;
  return React.createElement(Board, {
    fen: FEN_AKTIF,
    nextFen: FEN_AKTIF,
    boardSize: UKURAN_PAPAN,
    move: [],
    nextMove: [],
    bestMove: [],
    previousBestMove: [],
    bestMoveSan: undefined,
    moveRating: undefined,
    forward: true,
    white: true,
    animation: false,
    gameEnded: false,
    result: "",
    arrows: [],
    previousStaticEvals: [],
    sacrifice: false,
    analyzingMove: false,
    drag,
    setDrag,
    pushArrow: () => {},
    cleanArrows: () => {},
    setMaterialAdvantage: () => {},
    setPlaying: () => {},
    setAnimation: () => {},
    analyzeMove: (_fen, movement) => {
      jumlahLangkah++;
      langkahTerakhir = movement;
    },
  });
}

const el = document.getElementById("root");
const root = createRoot(el);
act(() => {
  root.render(React.createElement(ConfigContextProvider, null, React.createElement(PapanUji)));
});

const papanEl = el.querySelector('[data-square="a8"]').parentElement;
// Nilai offset* seperti yang dilaporkan peramban terhadap `<main>`.
Object.defineProperty(papanEl, "offsetLeft", {
  configurable: true,
  get: () => tataLetak.offset.kiri,
});
Object.defineProperty(papanEl, "offsetTop", {
  configurable: true,
  get: () => tataLetak.offset.atas,
});
Object.defineProperty(papanEl, "offsetWidth", { configurable: true, value: UKURAN_PAPAN });
Object.defineProperty(papanEl, "offsetHeight", { configurable: true, value: UKURAN_PAPAN });

/* ------------------------------ helper ------------------------------ */

function kirim(node, tipe, { x = 0, y = 0, tombol = 0, tombolTertahan = 1 } = {}) {
  node.dispatchEvent(
    new window.MouseEvent(tipe, {
      bubbles: true,
      cancelable: true,
      button: tombol,
      buttons: tombolTertahan,
      clientX: x,
      clientY: y,
    })
  );
}

const bidakDi = (kotak) =>
  el.querySelector(`[data-square="${kotak}"]`)?.querySelector("[data-dontcleandrag]");
const cincinDi = (kotak) =>
  el.querySelector(`[data-square="${kotak}"]`)?.querySelector('[class*="z-[30]"]');
const titikLegalDi = (kotak) =>
  el.querySelector(`[data-square="${kotak}"]`)?.querySelector('[class*="z-[40]"]');
const pusatKotak = (kotak) => {
  const { kiri, atas } = rectKotakDariId(kotak);
  return { x: kiri + KOTAK / 2, y: atas + KOTAK / 2 };
};
/** Posisi bidak yang dirender (inline top/left) relatif kotak asalnya. */
function posisiBidak(kotak) {
  const node = bidakDi(kotak);
  if (!node) return null;
  return {
    x: parseFloat(node.style.left) || 0,
    y: parseFloat(node.style.top) || 0,
  };
}
function setelTataLetak({ kiriPapan, atasPapan, offsetKiri, offsetAtas }) {
  tataLetak.papan = { kiri: kiriPapan, atas: atasPapan };
  tataLetak.offset = { kiri: offsetKiri, atas: offsetAtas };
}

/**
 * Seret bidak `dari` ke titik kursor (x,y) lalu laporkan selisih pusat bidak
 * terhadap kursor. `{dx: 0, dy: 0}` = bidak persis di tengah kursor.
 */
function seretKe(dari, x, y) {
  const mulai = pusatKotak(dari);
  act(() => {
    kirim(bidakDi(dari), "mousedown", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mousemove", { x, y });
  });
  const posisi = posisiBidak(dari);
  const pusatBidak = { x: mulai.x + posisi.x, y: mulai.y + posisi.y };
  return { dx: pusatBidak.x - x, dy: pusatBidak.y - y, posisi };
}

function lepasDi(node, x, y) {
  act(() => {
    kirim(node, "mouseup", { x, y });
  });
}

/* Klik di papan (bukan di bidak) = batal pilih, jalur `cleanDrag` di Board.
   Harus dikirim ke elemen papan: event yang dikirim ke `document` tidak
   pernah mencapai handler React (root container-nya #root, turunannya). */
function kembaliKeAwal() {
  act(() => {
    kirim(papanEl, "mousedown", { x: 5, y: 5 });
  });
}

/** `handleMovePiece` melepas drag lewat setTimeout(0) — tunggu di dalam act. */
async function serahkanWaktu() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

/** Ganti posisi papan tanpa membongkar pohon (state drag ikut terjaga). */
function gantiPosisi(fen) {
  FEN_AKTIF = fen;
  act(() => {
    root.render(
      React.createElement(ConfigContextProvider, null, React.createElement(PapanUji))
    );
  });
}
/* ====== 1. desktop: bilah navigasi kiri (nav.jsx: w-12 / w-[210px]) ====== */

/*
 * Angkanya mengikuti tata letak nyata halaman: bilah kiri 210px saat terbuka,
 * papan di tengah `<main>` (p-2 + baris nama pemain) → offsetLeft 96, dan
 * `<main>` menempel puncak viewport sehingga offsetTop = posisi viewport-nya.
 * Selisih kedua ruang koordinat di sumbu X = lebar bilah = 210px.
 */
console.log("\n== desktop: papan di viewport (306,96), offset* relatif <main> (96,96) ==");
setelTataLetak({ kiriPapan: 306, atasPapan: 96, offsetKiri: 96, offsetAtas: 96 });

{
  const target = pusatKotak("e4");
  const { dx, dy } = seretKe("e2", target.x, target.y);
  hasil(
    "drag e2 → e4 (tengah papan): pusat bidak tepat di kursor",
    dx === 0 && dy === 0,
    `selisih (${dx}, ${dy}) px`
  );
  await serahkanWaktu();
  lepasDi(titikLegalDi("e4"), target.x, target.y);
  hasil(
    "lepas di kotak legal memicu analyzeMove e2 → e4",
    jumlahLangkah === 1 && langkahTerakhir?.from === "e2" && langkahTerakhir?.to === "e4",
    JSON.stringify(langkahTerakhir)
  );
  await serahkanWaktu();
}

{
  // Tepi kanan papan: di sinilah clamp yang salah ruang koordinat paling
  // terasa — kursor sudah di h1, bidak tertahan di offsetLeft + lebar papan.
  const target = pusatKotak("h1");
  const { dx, dy } = seretKe("h2", target.x, target.y);
  hasil(
    "drag h2 → h1 (kolom paling kanan) tetap di tengah kursor",
    dx === 0 && dy === 0,
    `selisih (${dx}, ${dy}) px`
  );
  kembaliKeAwal();
}

{
  // Kursor jauh di luar papan: bidak harus tetap terkurung di dalam papan.
  const { posisi } = seretKe("e2", 5000, 5000);
  const pusatBidak = { x: pusatKotak("e2").x + posisi.x, y: pusatKotak("e2").y + posisi.y };
  const dalamPapan =
    pusatBidak.x >= tataLetak.papan.kiri &&
    pusatBidak.x <= tataLetak.papan.kiri + UKURAN_PAPAN &&
    pusatBidak.y >= tataLetak.papan.atas &&
    pusatBidak.y <= tataLetak.papan.atas + UKURAN_PAPAN;
  hasil(
    "kursor keluar jauh: bidak tetap di dalam papan",
    dalamPapan,
    `pusat bidak (${pusatBidak.x}, ${pusatBidak.y})`
  );
  kembaliKeAwal();
}

/* ============ 2. mobile: bilah navigasi mendatar di atas papan ========== */

console.log("\n== mobile: bilah atas ≈56px, papan di viewport (8,116) ==");
setelTataLetak({ kiriPapan: 8, atasPapan: 116, offsetKiri: 8, offsetAtas: 60 });
{
  const target = pusatKotak("d1");
  const { dx, dy } = seretKe("d2", target.x, target.y);
  hasil(
    "drag d2 → d1 (baris paling bawah) tetap di tengah kursor",
    dx === 0 && dy === 0,
    `selisih (${dx}, ${dy}) px`
  );
  kembaliKeAwal();
}
{
  // Overshoot wajar: kursor melewati tepi bawah papan beberapa piksel. Bidak
  // boleh berhenti di tepi papan, tapi tidak boleh "ketinggalan" lebih jauh
  // dari kursor daripada kursor itu sendiri keluar papan.
  const tepiBawah = tataLetak.papan.atas + UKURAN_PAPAN;
  const target = { x: pusatKotak("d1").x, y: tepiBawah + 2 };
  const { posisi } = seretKe("d2", target.x, target.y);
  const pusatBidakY = pusatKotak("d2").y + posisi.y;
  hasil(
    "kursor 2px lewat tepi bawah: bidak berhenti tepat di tepi papan",
    pusatBidakY === tepiBawah && posisi.x === 0,
    `pusat bidak y=${pusatBidakY}, tepi=${tepiBawah}, x=${posisi.x}`
  );
  kembaliKeAwal();
}

/* ========= 3. <main> di-scroll 160px (mode <1100px: panel di bawah) ====== */

console.log("\n== papan di-scroll 160px: viewport (8,-44), offset* tetap (8,60) ==");
setelTataLetak({ kiriPapan: 8, atasPapan: -44, offsetKiri: 8, offsetAtas: 60 });
gantiPosisi(FEN_ATAS);
{
  const target = pusatKotak("a8");
  const { dx, dy } = seretKe("a7", target.x, target.y);
  hasil(
    "drag a7 → a8 (baris teratas) setelah <main> di-scroll tetap di kursor",
    dx === 0 && dy === 0,
    `selisih (${dx}, ${dy}) px`
  );
  kembaliKeAwal();
}
gantiPosisi(FEN_AWAL);
{
  const target = pusatKotak("e5");
  const { dx, dy } = seretKe("e2", target.x, target.y);
  hasil(
    "drag e2 → e5 setelah di-scroll tetap di tengah kursor",
    dx === 0 && dy === 0,
    `selisih (${dx}, ${dy}) px`
  );
  kembaliKeAwal();
}

/* ============== 4. klik bidak terpilih = batal pilih ================== */

console.log("\n== pilih / batal pilih bidak ==");
setelTataLetak({ kiriPapan: 306, atasPapan: 96, offsetKiri: 96, offsetAtas: 96 });
{
  const mulai = pusatKotak("e2");
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  lepasDi(document, mulai.x, mulai.y);
  hasil(
    "klik bidak: bidak terpilih (drag.id = e2)",
    dragTerakhir?.id === "e2" && dragTerakhir?.is === false,
    JSON.stringify(dragTerakhir)
  );
  // Klik kedua tanpa gerak → batal pilih.
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  lepasDi(document, mulai.x, mulai.y);
  hasil(
    "klik kedua tanpa gerak: batal pilih (drag.id kosong)",
    dragTerakhir?.id === "",
    JSON.stringify(dragTerakhir)
  );
}

/* =============== 5. cincin penanda kotak tujuan tampil ================ */

console.log("\n== cincin penanda kotak tujuan saat drag ==");
{
  const mulai = pusatKotak("e2");
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  const cincin = cincinDi("e4");
  hasil("cincin penanda ada di DOM", Boolean(cincin));
  act(() => {
    cincin.dispatchEvent(
      new window.MouseEvent("mouseover", { bubbles: true, relatedTarget: document.body })
    );
  });
  hasil(
    'cincin kotak tujuan tampil (opacity = "1", bukan "100" yang tak sah)',
    cincin.style.opacity === "1",
    `opacity "${cincin.style.opacity}"`
  );
  hasil(
    "cincin tidak memakai kelas mati border-opacity-65 (dibuang Tailwind v4)",
    !cincin.className.includes("border-opacity-65") && cincin.className.includes("border-white/65"),
    cincin.className
  );
  kembaliKeAwal();
}

/* ========== 6. mouseup terlewat (tombol dilepas di luar jendela) ======= */

console.log("\n== mouseup terlewat ==");
{
  const mulai = pusatKotak("e2");
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  hasil("drag aktif setelah mousedown", dragTerakhir?.is === true, JSON.stringify(dragTerakhir));
  act(() => {
    kirim(document, "mousemove", { x: mulai.x + 100, y: mulai.y + 100, tombolTertahan: 0 });
  });
  hasil(
    "mousemove tanpa tombol tertahan mengakhiri drag",
    dragTerakhir?.is === false,
    JSON.stringify(dragTerakhir)
  );
  hasil(
    "bidak kembali ke kotaknya setelah drag berakhir",
    posisiBidak("e2").x === 0 && posisiBidak("e2").y === 0,
    JSON.stringify(posisiBidak("e2"))
  );
}

/* ========== 7. bidak lawan tidak bisa diangkat ========== */

console.log("\n== bidak lawan (giliran putih) ==");
setelTataLetak({ kiriPapan: 306, atasPapan: 96, offsetKiri: 96, offsetAtas: 96 });
{
  const mulai = pusatKotak("e7"); // pion hitam
  act(() => {
    kirim(bidakDi("e7"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mousemove", { x: mulai.x, y: mulai.y + 180 });
  });
  const posisi = posisiBidak("e7");
  hasil(
    "bidak hitam tidak mengikuti kursor saat giliran putih",
    posisi.x === 0 && posisi.y === 0,
    JSON.stringify(posisi)
  );
  hasil(
    "tidak ada bidak yang ikut terpilih",
    dragTerakhir?.is === false && dragTerakhir?.id === "",
    JSON.stringify(dragTerakhir)
  );
  hasil(
    "kursor <body> tidak terkunci \"grabbing\"",
    document.body.style.cursor === "",
    `"${document.body.style.cursor}"`
  );
}

/* ====== 9. klik bidak yang sama = on/off (aturan chessground) ====== */

console.log("\n== klik bidak sama: on/off/on (chessground drag.end) ==");
setelTataLetak({ kiriPapan: 306, atasPapan: 96, offsetKiri: 96, offsetAtas: 96 });
const jumlahTitik = () => el.querySelectorAll('[class*="z-[40]"]').length;
function klikBidak(kotak, geser = { x: 0, y: 0 }) {
  const mulai = pusatKotak(kotak);
  const x = mulai.x + geser.x;
  const y = mulai.y + geser.y;
  act(() => {
    kirim(bidakDi(kotak), "mousedown", { x, y });
  });
  act(() => {
    kirim(document, "mouseup", { x, y });
  });
}
{
  klikBidak("e2");
  const pertama = jumlahTitik();
  klikBidak("e2");
  const kedua = jumlahTitik();
  klikBidak("e2");
  const ketiga = jumlahTitik();
  hasil(
    "klik 1 → titik muncul, klik 2 → hilang, klik 3 → muncul lagi",
    pertama > 0 && kedua === 0 && ketiga > 0,
    `titik: ${pertama} → ${kedua} → ${ketiga}`
  );
  kembaliKeAwal();
}
{
  // Bidak sedang beranimasi: rect-nya bergeser (transform WAAPI 150ms di
  // animateMove). Klik kedua di tempat yang sama tetap harus mematikan titik.
  klikBidak("d2");
  const nyala = jumlahTitik();
  bidakDi("d2").style.left = "70px"; // seolah bidak masih di tengah animasi
  const mulai = pusatKotak("d2");
  act(() => {
    kirim(bidakDi("d2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mouseup", { x: mulai.x, y: mulai.y });
  });
  hasil(
    "klik ke-2 saat bidak beranimasi tetap mematikan titik petunjuk",
    nyala > 0 && jumlahTitik() === 0,
    `titik: ${nyala} → ${jumlahTitik()}`
  );
  kembaliKeAwal();
}
kembaliKeAwal();
{
  // Lepas di luar papan = batal pilih (chessground: `|| !dest`).
  klikBidak("e2");
  const nyala = jumlahTitik();
  const mulai = pusatKotak("e2");
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mousemove", { x: mulai.x - 900, y: mulai.y - 900 });
  });
  act(() => {
    kirim(document, "mouseup", { x: mulai.x - 900, y: mulai.y - 900 });
  });
  hasil(
    "bidak terpilih lalu dilepas di luar papan → batal pilih",
    nyala > 0 && jumlahTitik() === 0,
    `titik: ${nyala} → ${jumlahTitik()}`
  );
}
{
  // Seret ke kotak ilegal lalu lepas: tetap terpilih (perilaku lama dipertahankan).
  const mulai = pusatKotak("e2");
  const tujuan = pusatKotak("g4");
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mousemove", { x: tujuan.x, y: tujuan.y });
  });
  act(() => {
    kirim(document, "mouseup", { x: tujuan.x, y: tujuan.y });
  });
  hasil(
    "seret ke kotak ilegal lalu lepas → bidak tetap terpilih",
    jumlahTitik() > 0 && dragTerakhir?.id === "e2",
    `drag=${JSON.stringify(dragTerakhir)} titik=${jumlahTitik()}`
  );
  kembaliKeAwal();
}
kembaliKeAwal();
{
  // Keluar kotak lalu kembali lagi (keyHasChanged) → batal pilih.
  const mulai = pusatKotak("e2");
  const lewat = pusatKotak("d3");
  klikBidak("e2");
  const nyala = jumlahTitik();
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mousemove", { x: lewat.x, y: lewat.y });
  });
  act(() => {
    kirim(document, "mousemove", { x: mulai.x, y: mulai.y });
  });
  act(() => {
    kirim(document, "mouseup", { x: mulai.x, y: mulai.y });
  });
  hasil(
    "keluar kotak lalu kembali → batal pilih",
    nyala > 0 && jumlahTitik() === 0,
    `titik: ${nyala} → ${jumlahTitik()}`
  );
}

/* ========== 8. komponen dilepas di tengah drag ========== */

console.log("\n== papan dilepas di tengah drag ==");
{
  const mulai = pusatKotak("e2");
  act(() => {
    kirim(bidakDi("e2"), "mousedown", { x: mulai.x, y: mulai.y });
  });
  hasil(
    'kursor <body> = "grabbing" selama drag',
    document.body.style.cursor === "grabbing",
    `"${document.body.style.cursor}"`
  );
  act(() => {
    root.unmount();
  });
  hasil(
    "unmount di tengah drag memulihkan kursor <body>",
    document.body.style.cursor === "",
    `"${document.body.style.cursor}"`
  );
  let melempar = null;
  try {
    kirim(document, "mousemove", { x: 10, y: 10 });
    kirim(document, "mouseup", { x: 10, y: 10 });
  } catch (e) {
    melempar = e;
  }
  hasil("listener drag sudah dilepas setelah unmount", melempar === null, String(melempar));
}


/* ------------------------------- hasil ------------------------------- */

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal > 0) process.exit(1);
