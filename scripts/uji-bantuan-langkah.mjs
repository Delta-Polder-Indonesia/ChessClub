/**
 * Uji "Bantuan Langkah" (assisted play) — fitur Papan Interaktif yang menilai
 * kandidat langkah SAAT bidak masih diseret: petak tujuan diwarnai
 * hijau/kuning/merah dan panah merah menunjukkan balasan terbaik lawan.
 *
 * Mengapa perlu: fitur ini menyambungkan empat hal sekaligus — chess.js
 * (FEN hipotetis), worker engine KEDUA, klasifikasi warna, dan lapisan gambar
 * di papan. Kesalahan kecil (mis. memakai sudut pandang Putih untuk menilai
 * langkah Hitam, atau tidak membuang jawaban petak lama) tidak terlihat dari
 * kode saja. Uji ini memakai Worker UCI PALSU supaya deterministik: skor
 * hipotetis ditentukan dari FEN yang diminta, bukan dari kecepatan mesin.
 *
 * Yang dikunci:
 *   1. logika murni bantuanSeret.js (FEN hipotetis, ambang warna, panah lawan);
 *   2. hook gunakanBantuanSeret: debounce, klasifikasi, cache, buang hasil
 *      basi, `bersihkan` mengirim "stop", worker dibuang saat sakelar mati;
 *   3. papan menggambar petak bantuan + panah lawan (data-bantuan /
 *      data-bantuan-panah) dan melaporkan petak yang dilintasi saat seret;
 *   4. halaman Papan Interaktif benar-benar menyambungkan ketiganya
 *      (diperiksa statis: jsdom tidak punya tata letak maupun
 *      `elementFromPoint`, jadi seret penuh halaman tidak dapat dijalankan).
 *
 * Skrip ini melewatkan dirinya (exit 0, ada catatan) bila jsdom/esbuild tidak
 * terpasang — keduanya bukan dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-bantuan-langkah.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";

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
  console.log("lewati uji bantuan langkah — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
  process.exit(0);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
  }
}

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FEN_E3 = "rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
// chess.js baru hanya menulis petak "en passant" bila benar-benar bisa ditangkap.
const FEN_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

/* ------------------------------------------------------ 1. logika murni */

console.log("\n1. Logika murni bantuanSeret.js");
const bantuan = await import(pathToFileURL(path.join(ROOT, "src/lib/bantuanSeret.js")).href);
const {
  AMBANG_BANTUAN,
  balasanLawan,
  nilaiDariSudutPelangkah,
  susunBantuan,
  susunFenHipotetis,
  warnaBantuan,
} = bantuan;

uji("FEN hipotetis 1.e4 disusun benar", susunFenHipotetis(FEN_AWAL, "e2", "e4") === FEN_E4);
uji("FEN hipotetis 1.e3 disusun benar", susunFenHipotetis(FEN_AWAL, "e2", "e3") === FEN_E3);
uji("langkah tidak sah → null", susunFenHipotetis(FEN_AWAL, "e2", "e5") === null);
uji("FEN rusak → null", susunFenHipotetis("bukan-fen", "e2", "e4") === null);
uji(
  "promosi memakai bidak yang diminta",
  susunFenHipotetis("8/P6k/8/8/8/8/6K1/8 w - - 0 1", "a7", "a8", "n") === "N7/7k/8/8/8/8/6K1/8 b - - 0 1"
);

uji("sudut pandang Putih tidak dibalik", nilaiDariSudutPelangkah(120, "w") === 120);
uji("sudut pandang Hitam dibalik", nilaiDariSudutPelangkah(120, "b") === -120);
uji("nilai kosong tetap kosong", nilaiDariSudutPelangkah(null, "w") === null);

uji(`selisih 0 cp → hijau`, warnaBantuan(20, 20) === "hijau");
uji(`selisih tepat ${AMBANG_BANTUAN.hijau} cp → hijau`, warnaBantuan(20, 20 - AMBANG_BANTUAN.hijau) === "hijau");
uji("selisih 51 cp → kuning", warnaBantuan(20, -31) === "kuning");
uji(`selisih tepat ${AMBANG_BANTUAN.kuning} cp → kuning`, warnaBantuan(0, -AMBANG_BANTUAN.kuning) === "kuning");
uji("selisih 151 cp → merah", warnaBantuan(0, -151) === "merah");
uji("kandidat lebih baik dari 'terbaik' tidak dihukum", warnaBantuan(0, 80) === "hijau");
uji("tanpa pembanding → kuning netral", warnaBantuan(null, -500) === "kuning");

uji("panah lawan dari bestmove", JSON.stringify(balasanLawan("g8f6")) === '{"from":"g8","to":"f6"}');
uji("panah lawan dari promosi tetap potong 4 huruf", balasanLawan("a7a8q")?.to === "a8");
uji("bestmove kosong/null → tanpa panah", balasanLawan("(none)") === null && balasanLawan(null) === null);

const hasilSusun = susunBantuan({
  tujuan: "e4",
  nilaiKandidat: { cpPutih: -300, matePutih: null },
  nilaiTerbaik: 20,
  sisi: "w",
  uci: "g8f6",
  kedalaman: 8,
});
uji("susunBantuan: kandidat Hitam menilai dari sudut Hitam", susunBantuan({
  tujuan: "e5",
  nilaiKandidat: { cpPutih: 300, matePutih: null },
  nilaiTerbaik: 0,
  sisi: "b",
  uci: null,
}).nilai === -300);
uji("susunBantuan: -300 cp → merah dengan panah lawan", hasilSusun.warna === "merah" && hasilSusun.panah.from === "g8");
uji("susunBantuan: selisih dijepit di 0", susunBantuan({
  tujuan: "e4",
  nilaiKandidat: { cpPutih: 100, matePutih: null },
  nilaiTerbaik: -50,
  sisi: "w",
  uci: null,
}).selisih === 0);

/* ------------------------------------ 2. hook + worker UCI palsu (jsdom) */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/i18n.jsx";
import { gunakanBantuanSeret } from "./src/lib/gunakanBantuanSeret.js";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";

let akarBantuan = null;

/** Harness hook: mengekspos nilai terbaru ke uji lewat objek laporan. */
export function mountBantuan(el, props) {
  akarBantuan = createRoot(el);
  return perbaruiBantuan(props);
}

/** Render ulang harness dengan props baru — dipakai menguji mati/nyala sakelar. */
export function perbaruiBantuan({ aktif, fen, nilaiTerbaik, laporan, catatan }) {
  function Harness() {
    const b = gunakanBantuanSeret({ aktif, fen, nilaiTerbaik });
    laporan.status = b.status;
    laporan.bantuan = b.bantuan;
    laporan.petakBantuan = b.petakBantuan;
    laporan.panahBantuan = b.panahBantuan;
    laporan.bersihkan = b.bersihkan;
    laporan.panggil = b.panggil;
    catatan.instans += 1;
    return null;
  }
  return akarBantuan.render(<I18nProvider><Harness /></I18nProvider>);
}

/** Papan dengan bantuan yang diberikan induk (menguji lapisan gambar). */
export function mountPapanBantuan(el, { fen, bantuanPetak, bantuanPanah, catatan }) {
  function Harness() {
    const [lewati, setLewati] = React.useState(null);
    laporanLewati(catatan, lewati);
    return (
      <I18nProvider>
        <PapanTekaTeki
          fen={fen}
          orientasi="w"
          bantuanPetak={bantuanPetak}
          bantuanPanah={bantuanPanah}
          onMulaiSeret={() => { catatan.seret += 1; }}
          onSelesaiSeret={() => { catatan.selesai += 1; }}
          onLewatiPetak={(sq) => {
            catatan.urut.push(sq);
            setLewati(sq);
          }}
        />
      </I18nProvider>
    );
  }
  return createRoot(el).render(<Harness />);
}
function laporanLewati(catatan, lewati) {
  catatan.lewati = lewati;
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-bantuan-langkah.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-bantuan-langkah-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` (dipakai ChessPiece) dipecah oleh shim yang sama dengan
  // Node loader, bukan diganti fungsi kosong: `define` menghapus jejak makro dari
  // sumber sehingga skrip ini buta terhadap bentuk yang tidak di-expand Vite.
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/**
 * Worker UCI palsu — deterministik. Skor posisi hipotetis dibaca dari FEN:
 *   1.e4 → info cp +300 dari sudut Hitam (Putih merugi 300 cp) + bestmove g8f6
 *   1.e3 → 0 cp + bestmove g8f6
 * `catatan.go` menghitung pencarian, `catatan.stop` menghitung pembatalan.
 */
class WorkerPalsu {
  constructor() {
    this.pesan = [];
    this.fen = null;
    WorkerPalsu.catatan.selalu.push(this);
  }
  postMessage(perintah) {
    const cmd = String(perintah);
    WorkerPalsu.catatan.kirim.push(cmd);
    if (cmd === "uci") {
      this.kirim("id name EngineUji");
      this.kirim("uciok");
      return;
    }
    if (cmd === "isready") {
      this.kirim("readyok");
      return;
    }
    if (cmd.startsWith("position fen ")) {
      this.fen = cmd.slice("position fen ".length).trim();
      return;
    }
    if (cmd === "stop") {
      WorkerPalsu.catatan.stop += 1;
      // Engine sungguhan tetap menerbitkan "bestmove" setelah stop.
      clearTimeout(this.timer);
      this.timer = null;
      setTimeout(() => this.kirim("bestmove g8f6"), 5);
      return;
    }
    if (cmd.startsWith("go")) {
      WorkerPalsu.catatan.go += 1;
      const fen = this.fen || "";
      const skor = fen.includes("4P3/8/PPPP1PPP") ? 300 : 0;
      this.timer = setTimeout(() => {
        this.timer = null;
        this.kirim(`info depth 8 score cp ${skor} pv g8f6 b8c6`);
        this.kirim("bestmove g8f6");
      }, WorkerPalsu.tunda);
    }
  }
  kirim(baris) {
    this.onmessage?.({ data: baris });
  }
  terminate() {
    clearTimeout(this.timer);
    WorkerPalsu.catatan.terminate += 1;
  }
  addEventListener() {}
  removeEventListener() {}
}
WorkerPalsu.catatan = { go: 0, stop: 0, terminate: 0, kirim: [], selalu: [] };
/** Jeda balasan info/bestmove (ms) — dinaikkan saat menguji pembatalan. */
WorkerPalsu.tunda = 10;
WorkerPalsu.reset = () => {
  WorkerPalsu.catatan.go = 0;
  WorkerPalsu.catatan.stop = 0;
  WorkerPalsu.catatan.kirim = [];
};

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
  window.Worker = WorkerPalsu;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.Worker = WorkerPalsu;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  for (const nama of ["HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent"]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
}

const dom = new JSDOM('<!doctype html><html><body><div id="akar"></div></body></html>', {
  url: "https://uji.test/papan-interaktif",
  pretendToBeVisual: true,
});
siapkanGlobal(dom.window);

const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));
const tungguSampai = (pemeriksa, batasMs = 4000, selangMs = 25) =>
  new Promise((selesai) => {
    const mulai = Date.now();
    const cek = () => {
      if (pemeriksa()) selesai(true);
      else if (Date.now() - mulai >= batasMs) selesai(false);
      else setTimeout(cek, selangMs);
    };
    cek();
  });

console.log("\n2. Hook gunakanBantuanSeret + worker engine kedua");
const laporan = { status: "idle", bantuan: null, petakBantuan: null, panahBantuan: null };
const catatan = { instans: 0 };
modul.mountBantuan(dom.window.document.getElementById("akar"), {
  aktif: true,
  fen: FEN_AWAL,
  nilaiTerbaik: 0,
  laporan,
  catatan,
});
await tunggu(50);
uji("hook terpasang", typeof laporan.panggil === "function");

// Kandidat merugikan: 1.e4 (skor hipotetis -300 dari Putih → selisih 300 cp).
laporan.panggil({ dari: "e2", tujuan: "e4" });
await tunggu(60);
uji("debounce: engine belum dipanggil sebelum jeda", WorkerPalsu.catatan.go === 0, `go=${WorkerPalsu.catatan.go}`);
const siapE4 = await tungguSampai(() => laporan.bantuan?.tujuan === "e4");
uji("hasil kandidat 1.e4 tiba", siapE4);
uji("1.e4 dinilai MERAH (kalah 300 cp dari langkah terbaik)", laporan.bantuan?.warna === "merah", laporan.bantuan?.warna);
uji("panah balasan lawan dari bestmove posisi hipotetis", laporan.bantuan?.panah?.from === "g8" && laporan.bantuan?.panah?.to === "f6");
uji("peta petak bantuan berisi petak tujuan", laporan.petakBantuan?.e4 === "merah");
uji("panah bantuan memakai warna merah", laporan.panahBantuan?.warna === "merah");
uji("kedalaman pencarian kilat tercatat", laporan.bantuan?.kedalaman === 8);
uji("engine dipanggil sekali untuk satu petak", WorkerPalsu.catatan.go === 1, `go=${WorkerPalsu.catatan.go}`);
uji(
  "batas pencarian dipatok depth 8 + movetime 300",
  WorkerPalsu.catatan.kirim.some((c) => /^go .*depth 8/.test(c) && /movetime 300/.test(c))
);

// Cache: kembali ke petak yang sama tidak memanggil engine lagi.
laporan.panggil({ dari: "e2", tujuan: "e4" });
await tunggu(60);
uji("cache: petak yang sama tidak memicu pencarian baru", WorkerPalsu.catatan.go === 1, `go=${WorkerPalsu.catatan.go}`);
uji("cache: hasil langsung tampil", laporan.bantuan?.warna === "merah");

// Kandidat aman: 1.e3 (skor hipotetis 0 → selisih 0).
laporan.panggil({ dari: "e2", tujuan: "e3" });
const siapE3 = await tungguSampai(() => laporan.bantuan?.tujuan === "e3");
uji("kandidat 1.e3 tiba", siapE3);
uji("1.e3 dinilai HIJAU (sebaik langkah terbaik)", laporan.bantuan?.warna === "hijau", laporan.bantuan?.warna);

// Debounce lanjutan: dua petak beruntun → hanya petak terakhir yang dihitung.
WorkerPalsu.reset(); // hitungan go kembali 0
WorkerPalsu.tunda = 500; // balasan lambat supaya petak lama masih "menggantung"
laporan.panggil({ dari: "d2", tujuan: "d4" });
await tunggu(240); // debounce selesai → pencarian petak d4 berjalan
uji("pencarian petak pertama berjalan", WorkerPalsu.catatan.go === 1, `go=${WorkerPalsu.catatan.go}`);
laporan.panggil({ dari: "c2", tujuan: "c4" }); // seret berpindah sebelum jawaban tiba
const siapC4 = await tungguSampai(() => laporan.bantuan?.tujuan === "c4", 4000);
uji(
  "menyeret cepat: petak terakhir menggantikan yang sedang dihitung",
  WorkerPalsu.catatan.go === 2 && WorkerPalsu.catatan.stop >= 1,
  `go=${WorkerPalsu.catatan.go} stop=${WorkerPalsu.catatan.stop}`
);
uji("hasil basi petak lama tidak menimpa petak baru", siapC4, `tujuan=${laporan.bantuan?.tujuan}`);

// Bersihkan saat pencarian BERJALAN (seret dilepas): engine dihentikan.
WorkerPalsu.reset();
WorkerPalsu.tunda = 500;
laporan.panggil({ dari: "g1", tujuan: "f3" });
await tungguSampai(() => laporan.status === "menghitung", 2000);
uji("status 'menghitung' muncul saat mesin bekerja", laporan.status === "menghitung");
laporan.bersihkan();
await tunggu(30);
uji("bersihkan: bantuan hilang", laporan.bantuan === null && laporan.petakBantuan === null && laporan.status === "idle");
uji("bersihkan: pencarian berjalan dihentikan (stop)", WorkerPalsu.catatan.stop >= 1, `stop=${WorkerPalsu.catatan.stop}`);
uji("bersihkan: jawaban yang datang setelahnya diabaikan", laporan.bantuan === null);
WorkerPalsu.tunda = 10;

// Sakelar dimatikan: worker dibuang, tampilan bersih.
laporan.panggil({ dari: "e2", tujuan: "e4" });
await tungguSampai(() => laporan.bantuan !== null, 2000);
const terminateSebelum = WorkerPalsu.catatan.terminate;
modul.perbaruiBantuan({ aktif: false, fen: FEN_AWAL, nilaiTerbaik: 0, laporan, catatan });
await tunggu(60);
uji(
  "sakelar mati: worker engine bantuan dibuang",
  WorkerPalsu.catatan.terminate > terminateSebelum,
  `terminate=${WorkerPalsu.catatan.terminate}`
);
uji("sakelar mati: bantuan tidak tampil", laporan.bantuan === null && laporan.petakBantuan === null);

console.log("\n3. Lapisan gambar papan (PapanTekaTeki)");
const catatanPapan = { urut: [], seret: 0, selesai: 0 };
const akarPapan = dom.window.document.createElement("div");
dom.window.document.body.appendChild(akarPapan);
modul.mountPapanBantuan(akarPapan, {
  fen: FEN_AWAL,
  bantuanPetak: { e4: "merah" },
  bantuanPanah: { from: "g8", to: "f6", warna: "merah" },
  catatan: catatanPapan,
});
await tungguSampai(() => akarPapan.querySelector('[data-petak="e4"]'));
uji("petak bantuan digambar dengan warnanya", !!akarPapan.querySelector('[data-bantuan="merah"]'));
uji("panah balasan lawan digambar", !!akarPapan.querySelector('[data-bantuan-panah="g8f6"]'));

/* ------------------------------ 3b. seret sungguhan: laporan petak dilintasi */

console.log("\n3b. Laporan petak yang dilintasi saat bidak diseret");
// jsdom tidak menghitung tata letak, jadi `elementFromPoint` tidak ada —
// diganti peta koordinat→elemen petak supaya jalur asli `cariPetak` teruji.
const petakDilintasi = { e4: akarPapan.querySelector('[data-petak="e4"]'), d4: akarPapan.querySelector('[data-petak="d4"]') };
dom.window.document.elementFromPoint = (x, y) =>
  x === 1 ? petakDilintasi.e4 : x === 2 ? petakDilintasi.d4 : null;

const petakPapan = (sq) => akarPapan.querySelector(`[data-petak="${sq}"]`);
const kirim = (tipe, el, x, y) =>
  el?.dispatchEvent(new dom.window.MouseEvent(tipe, { bubbles: true, button: 0, buttons: 1, clientX: x, clientY: y }));

kirim("pointerdown", petakPapan("e2"), 0, 0);
await tunggu(40);
uji("bidak mulai diseret", catatanPapan.seret === 1, `seret=${catatanPapan.seret}`);

kirim("pointermove", petakPapan("e2"), 1, 1);
await tunggu(20);
uji("petak tujuan dilaporkan saat kursor di atasnya", catatanPapan.urut.at(-1) === "e4", `urut=${catatanPapan.urut.join(",")}`);

const jumlahSebelum = catatanPapan.urut.length;
kirim("pointermove", petakPapan("e2"), 1, 1); // petak yang sama
kirim("pointermove", petakPapan("e2"), 1, 1);
await tunggu(20);
uji(
  "pointermove di petak yang sama tidak diulang-ulang",
  catatanPapan.urut.length === jumlahSebelum,
  `urut=${catatanPapan.urut.join(",")}`
);

kirim("pointermove", petakPapan("e2"), 2, 2); // pindah petak
await tunggu(20);
uji("pindah petak → laporan baru", catatanPapan.urut.at(-1) === "d4", `urut=${catatanPapan.urut.join(",")}`);

kirim("pointermove", petakPapan("e2"), 9, 9); // keluar papan
await tunggu(20);
uji("keluar papan → laporan null", catatanPapan.urut.at(-1) === null, `urut=${JSON.stringify(catatanPapan.urut)}`);

kirim("pointermove", petakPapan("e2"), 1, 1);
kirim("pointerup", petakPapan("e2"), 1, 1);
await tunggu(40);
uji("seret dilepas → laporan null", catatanPapan.urut.at(-1) === null && catatanPapan.selesai === 1, `urut=${JSON.stringify(catatanPapan.urut)}`);

console.log("\n4. Sakelar & sambungan halaman (statis)");
const teksPapan = readFileSync(path.join(ROOT, "src/halaman/PapanInteraktif/PapanInteraktif.jsx"), "utf8");
const teksPopup = readFileSync(path.join(ROOT, "src/halaman/PapanInteraktif/PopupPengaturan.jsx"), "utf8");
uji("halaman mengirim bantuanPetak ke papan", teksPapan.includes("bantuanPetak={bantuanNyala ?"));
uji("halaman mengirim bantuanPanah ke papan", teksPapan.includes("bantuanPanah={bantuanNyala ?"));
uji("halaman mengirim onLewatiPetak (petak yang dilintasi saat seret)", teksPapan.includes("onLewatiPetak={lewatiPetak}"));
uji("bantuan hanya diminta untuk petak yang SAH", /sasaran\.includes\(petak\)[\s\S]{0,80}bantuanSeret\.panggil/.test(teksPapan));
uji("sakelar bantuan ada di Pengaturan Papan", teksPopup.includes("papan.bantuanToggle"));
uji("halaman menyalakan engine saat bantuan diaktifkan", /if \(nilai\) nyalakanEngine\(\)/.test(teksPapan));
uji("bantuan dibersihkan saat posisi berganti", /bersihkanBantuanRef\.current\(\);\s*\n\s*\}, \[fen\]\)/.test(teksPapan));

console.log(`\n${gagal === 0 ? "LULUS" : "GAGAL"}: ${lulus} lulus, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
