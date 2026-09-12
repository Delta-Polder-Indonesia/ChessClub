/**
 * Uji perilaku HAPUS tanda bantu (panah & mark petak) di papan teka-teki /
 * papan interaktif.
 *
 * Mengapa perlu: `PapanTekaTeki` dipakai bersama oleh TekaTeki,
 * PapanInteraktif, dan TekaTekiRush. Penghapusan tanda dulu hanya bergantung
 * pada event `click` petak (induk membersihkan `tanda` di `klikPetak`),
 * padahal menekan bidak sendiri memulai seret + `setPointerCapture` pada
 * elemen papan: `click` tidak lagi mendarat di tombol petak, sehingga klik
 * pada bidak sendiri TIDAK menghapus panah/mark sementara petak kosong dan
 * bidak lawan menghapus. Analisa tidak begitu: `komponen/game/board.jsx`
 * memanggil `cleanArrows()` pada mousedown tombol kiri, di mana pun di papan.
 *
 * Yang dikunci uji ini (kontrak di tingkat papan):
 *   1. `pointerdown` kiri pada bidak sendiri memanggil `onHapusTanda`, dan
 *      seret bidak TETAP dimulai (perilaku lama tidak hilang);
 *   2. tetap menghapus saat papan terkunci (`terkunci`) — sama seperti Analisa;
 *   3. `pointerdown` kanan tidak menghapus (kanan = menggambar);
 *   4. bidak lawan & petak kosong tetap menghapus;
 *   5. halaman TekaTeki dan PapanInteraktif benar-benar mengirim
 *      `onHapusTanda` (diperiksa statis: jsdom tidak punya tata letak maupun
 *      `elementFromPoint`, jadi jalur klik penuh halaman tidak bisa
 *      dijalankan di sini).
 *
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-tanda-papan.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("lewati uji tanda papan — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi) {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}`);
  }
}

/* ------------------------------------------------- bundel papan (esbuild) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/i18n.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";

/**
 * Papan dengan induk tiruan yang memegang state \`tanda\` seperti halaman asli.
 * \`laporan\` diperbarui setiap render supaya uji bisa membaca tanda terkini;
 * \`catatan\` menghitung callback yang dipanggil (klik / seret / hapus).
 */
export function mountPapanTanda(el, { fen, terkunci = false, awalTanda, laporan, catatan }) {
  function Harness() {
    const [tanda, setTanda] = React.useState(awalTanda ?? { panah: [], petak: {} });
    laporan.tanda = tanda;
    return (
      <PapanTekaTeki
        fen={fen}
        orientasi="w"
        terkunci={terkunci}
        tanda={tanda}
        onKlik={() => { catatan.klik += 1; }}
        onMulaiSeret={() => { catatan.seret += 1; }}
        onHapusTanda={() => {
          catatan.hapus += 1;
          setTanda({ panah: [], petak: {} });
        }}
      />
    );
  }
  return createRoot(el).render(
    <I18nProvider>
      <Harness />
    </I18nProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-tanda-papan.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-tanda-papan-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` hanya ada di Vite (dipakai ChessPiece). Di luar Vite
  // diganti fungsi kosong: bidak tidak tergambar, tetapi petak, panah, dan
  // penanganan event yang diuji tetap ter-render.
  banner: { js: "function __globPalsu() { return {}; }" },
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    "import.meta.glob": "__globPalsu",
  },
  logLevel: "error",
});

/* ------------------------------------------------------- lingkungan jsdom */

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function siapkanGlobal(window) {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.HTMLElement.prototype.scrollTo = function scrollTo() {};
  window.Element.prototype.scrollTo = function scrollTo() {};

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  // `mulaiSeret` memanggil requestAnimationFrame global (memposisikan bidak
  // hantu). jsdom menyediakannya di `window` (pretendToBeVisual), bukan di
  // global Node — tanpa dua baris ini seret bidak melempar ReferenceError.
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  for (const nama of ["HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent"]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
}

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "https://uji.test/teka-teki",
  pretendToBeVisual: true,
});
siapkanGlobal(dom.window);
const domSiap = dom.window.document;

const pesanGalat = [];
const consoleErrorAsli = console.error;
console.error = (...args) => {
  pesanGalat.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** FEN awal — putih giliran jalan, jadi bidak putih bisa diseret. */
const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/** Gambar yang sudah ada sebelum klik diuji: satu panah + satu mark petak. */
const TANDA_AWAL = { panah: [{ from: "a1", to: "a3", warna: "bawaan" }], petak: { h8: "bawaan" } };

const petakEl = (wadah, sq) => wadah.querySelector(`[data-petak="${sq}"]`);
const jumlahPanah = (wadah) => wadah.querySelectorAll("[data-arrow]").length;

/** Tekan pointer di satu petak — event inilah yang dulu tidak terhapus. */
async function tekan(wadah, sq, button) {
  petakEl(wadah, sq)?.dispatchEvent(
    new dom.window.MouseEvent("pointerdown", { bubbles: true, button, clientX: 0, clientY: 0 })
  );
  await tunggu(60);
}

function pasangPapan({ terkunci = false } = {}) {
  const wadah = domSiap.createElement("div");
  domSiap.body.appendChild(wadah);
  const laporan = {};
  const catatan = { hapus: 0, seret: 0, klik: 0 };
  modul.mountPapanTanda(wadah, {
    fen: FEN_AWAL,
    terkunci,
    awalTanda: TANDA_AWAL,
    laporan,
    catatan,
  });
  return { wadah, laporan, catatan };
}

/* --------------------------------------- 1. papan terbuka: bidak sendiri */

console.log("\npapan terbuka:");
{
  const { wadah, laporan, catatan } = pasangPapan();
  await tunggu(150);

  uji("papan ter-render 64 petak", wadah.querySelectorAll("[data-petak]").length === 64);
  uji("prasyarat: gambar awal tampil (1 panah)", jumlahPanah(wadah) === 1);

  await tekan(wadah, "e2", 0); // bidak putih — pihak yang sedang jalan
  uji("klik kiri bidak sendiri memanggil onHapusTanda", catatan.hapus === 1);
  uji("klik kiri bidak sendiri mengosongkan tanda", laporan.tanda?.panah.length === 0 && Object.keys(laporan.tanda?.petak ?? {}).length === 0);
  uji("gambar hilang dari papan", jumlahPanah(wadah) === 0);
  uji("seret bidak tetap dimulai (perilaku lama utuh)", catatan.seret === 1);

  await tekan(wadah, "e7", 0); // bidak hitam, bukan giliran
  uji("klik kiri bidak lawan tetap menghapus", catatan.hapus === 2);

  await tekan(wadah, "e4", 0); // petak kosong
  uji("klik kiri petak kosong tetap menghapus", catatan.hapus === 3);

  await tekan(wadah, "e2", 2); // tombol kanan = menggambar, bukan menghapus
  uji("klik kanan tidak menghapus tanda", catatan.hapus === 3);

  wadah.remove();
}

/* ------------------------------------------------ 2. papan terkunci */

console.log("\npapan terkunci (giliran komputer / soal selesai):");
{
  const { wadah, catatan } = pasangPapan({ terkunci: true });
  await tunggu(150);

  await tekan(wadah, "e2", 0);
  uji("klik kiri tetap menghapus tanda walau papan terkunci", catatan.hapus === 1);
  uji("papan terkunci tetap menolak seret bidak", catatan.seret === 0);

  wadah.remove();
}

/* --------------------- 3. induk halaman benar-benar mengirim onHapusTanda */

console.log("\npemasangan di halaman:");
{
  const berkas = [
    ["TekaTeki.jsx", "src/halaman/TekaTeki/TekaTeki.jsx"],
    ["PapanInteraktif.jsx", "src/halaman/PapanInteraktif/PapanInteraktif.jsx"],
  ];
  for (const [nama, relatif] of berkas) {
    const isi = readFileSync(path.join(ROOT, relatif), "utf8");
    uji(`${nama} mengirim onHapusTanda ke papan`, /onHapusTanda=\{/.test(isi));
  }
}

const galatRender = pesanGalat.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React", galatRender.length === 0);
if (galatRender.length) console.log(galatRender.slice(0, 3).join("\n"));

console.error = consoleErrorAsli;
console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
