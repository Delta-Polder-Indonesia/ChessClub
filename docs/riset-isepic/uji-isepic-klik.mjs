/**
 * HARNESS A — perilaku klik-langkah isepic-chess-ui (kode ASLI di jsdom).
 *
 * Menjalankan js/isepic-chess.js + js/isepic-chess-ui.js apa adanya dari klon
 * repo, memberi tata letak sintetis (jsdom tidak punya layout), lalu merekam
 * pada EVENT MANA langkah benar-benar dijalankan:
 *   - tekan petak asal  (mousedown)
 *   - lepas petak asal  (mouseup)
 *   - tekan petak tujuan (mousedown)
 *   - lepas/klik tujuan (mouseup/click)
 *
 * Jalankan: node uji-isepic-klik.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** Akar repositori ini (docs/riset-isepic/ → ../..). */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "package.json"));
const { JSDOM } = require("jsdom");

/** Klon isepic-chess-ui — lihat README di folder ini; bisa dioverride lewat env. */
const SRC = process.env.ISEPIC_SRC ?? "/tmp/isepic-src";
const KELUARAN = path.join(ROOT, "docs/riset-isepic");
mkdirSync(KELUARAN, { recursive: true });

const KOTAK = 80; // px per petak (tata letak sintetis)
const KIRI = 120;
const ATAS = 60;

/* --------------------------------------------------------------- bangun DOM */

const dom = new JSDOM(
  `<!doctype html><html><body>
     <div style="height:640px;width:640px">
       <div class="ic_ui_board"><div id="ic_ui_board"></div></div>
     </div>
     <div id="ic_ui_board_tabs"></div>
     <div id="ic_ui_material_diff"></div>
     <input id="ic_ui_nav_first" value="|<" type="button" />
     <input id="ic_ui_nav_previous" value="<" type="button" />
     <input id="ic_ui_nav_next" value=">" type="button" />
     <input id="ic_ui_nav_last" value=">|" type="button" />
     <input id="ic_ui_rotate" value="rotate" type="button" />
     <select id="ic_ui_promote"></select>
     <div id="ic_ui_move_list"></div>
     <div id="ic_ui_move_tooltip"></div>
     <input id="ic_ui_fen" value="" type="text" />
     <div id="ic_ui_push_alerts_top"></div>
     <div id="ic_ui_push_alerts_bottom"></div>
     <div id="ic_ui_debug_toggler"></div>
     <div id="ic_ui_debug"></div>
   </body></html>`,
  { url: "https://isepic.test/", pretendToBeVisual: true, runScripts: "dangerously" }
);
const win = dom.window;
const doc = win.document;

win.eval(readFileSync(path.join(SRC, "js/isepic-chess.js"), "utf8"));
win.eval(readFileSync(path.join(SRC, "js/isepic-chess-ui.js"), "utf8"));

win.Ic.setSilentMode(true);
// jsdom tidak mengimplementasikan audio — suara isepic dinonaktifkan agar
// jejak perilaku bersih (yang diuji: alur event & posisi papan).
win.HTMLMediaElement.prototype.play = function play() {};
win.HTMLMediaElement.prototype.pause = function pause() {};
win.Ic.initBoard({ boardName: "main" });

/* ------------------------------------------- tata letak sintetis + pencacah */

/** Koordinat viewport sebuah petak (orientasi putih di bawah). */
function rectPetak(bos) {
  const kolom = bos.charCodeAt(0) - 97; // a..h → 0..7
  const baris = 8 - Number(bos[1]); // rank 8 di atas → 0
  return {
    left: KIRI + kolom * KOTAK,
    top: ATAS + baris * KOTAK,
    width: KOTAK,
    height: KOTAK,
    right: KIRI + (kolom + 1) * KOTAK,
    bottom: ATAS + (baris + 1) * KOTAK,
    x: KIRI + kolom * KOTAK,
    y: ATAS + baris * KOTAK,
  };
}

const pencacah = { getBoundingClientRect: 0 };
const asliRect = win.Element.prototype.getBoundingClientRect;
win.Element.prototype.getBoundingClientRect = function () {
  pencacah.getBoundingClientRect += 1;
  const bos = this.dataset?.bos;
  if (bos && (this.classList.contains("ic_ws") || this.classList.contains("ic_bs"))) {
    return rectPetak(bos);
  }
  return {
    left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0,
  };
};
win.Element.prototype.getBoundingClientRect.asli = asliRect;

/** Titik tengah petak (pageX/pageY, scroll = 0). */
const titik = (bos) => ({ x: rectPetak(bos).left + KOTAK / 2, y: rectPetak(bos).top + KOTAK / 2 });

/* -------------------------------------------------------------- observasi */

const board = () => win.Ic.getBoard("main");

/** Ringkas posisi: papan → "e2:e4" (FEN lengkap dipotong agar enak dibaca). */
function posisi() {
  const b = board();
  if (!b) return "(belum ada papan)";
  return b.fen.split(" ")[0];
}

function petakTerpilih() {
  return [...doc.querySelectorAll("#ic_ui_board .ic_selected")].map((e) => e.dataset.bos);
}

function petakDisorot() {
  return [...doc.querySelectorAll("#ic_ui_board .ic_highlight")].map((e) => e.dataset.bos).sort();
}

function jumlahOpsiPromosi() {
  return doc.querySelectorAll("#ic_ui_board .ic_promotion_option").length;
}

function jumlahPapan(papanEl) {
  return [...doc.querySelectorAll("#ic_ui_board .ic_piece_holder")]
    .filter((e) => /ic_(wp|wn|wb|wr|wq|wk|bp|bn|bb|br|bq|bk)\b/.test(e.className))
    .length;
}

/** Catat langkah-langkah naratif selama satu interaksi. */
function rekam(nama, langkah) {
  const jejak = [];
  const catat = (label) => {
    jejak.push({
      tahap: label,
      fen: posisi(),
      terpilih: petakTerpilih(),
      disorot: petakDisorot(),
      opsiPromosi: jumlahOpsiPromosi(),
      calls: pencacah.getBoundingClientRect,
    });
  };
  const t0 = pencacah.getBoundingClientRect;
  const mulai = Date.now();
  const hasil = langkah({ catat });
  const durasi = Date.now() - mulai;
  return {
    nama,
    durasiMs: durasi,
    getBoundingClientRect: pencacah.getBoundingClientRect - t0,
    ...hasil,
    jejak,
  };
}

/* ---------------------------------------------------------- pendorong event */

function mouse(nama, bos, { button = 0, alt = false, shift = false, ctrl = false } = {}) {
  const el = doc.getElementById("ic_ui_" + bos);
  const p = titik(bos);
  const ev = new win.MouseEvent(nama, {
    bubbles: true,
    cancelable: true,
    button,
    altKey: alt,
    shiftKey: shift,
    ctrlKey: ctrl,
    clientX: p.x,
    clientY: p.y,
  });
  // jsdom tidak menerima pageX/pageY di MouseEventInit — dipasang manual
  // (isepic membaca e.pageX/e.pageY).
  Object.defineProperty(ev, "pageX", { value: p.x });
  Object.defineProperty(ev, "pageY", { value: p.y });
  el.dispatchEvent(ev);
  return ev;
}

const tekan = (bos, opsi) => mouse("mousedown", bos, opsi);
const lepas = (bos, opsi) => mouse("mouseup", bos, opsi);
const gerak = (bos) => mouse("mousemove", bos);
const klik = (bos, opsi) => {
  tekan(bos, opsi);
  lepas(bos, opsi);
};

/** Muat ulang posisi awal untuk tiap skenario. */
function reset(fen) {
  const b = board();
  b.loadFen(fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", {
    skipFenValidation: true,
  });
  b.refreshUi(0, false);
}

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FEN_PROMOSI = "8/P7/8/8/8/8/8/K6k w - - 0 1";

const hasil = [];

/* ============================ 1. klik dua petak (click-from / click-to) === */

reset(FEN_AWAL);
hasil.push(
  rekam("1. klik-move: tekan e2 → lepas e2 → TEKAN e4 → lepas e4", ({ catat }) => {
    const awal = posisi();
    catat("sebelum apa-apa");
    tekan("e2");
    catat("mousedown e2 (tekan bidak sendiri)");
    lepas("e2");
    catat("mouseup e2");
    tekan("e4");
    const setelahTekanTujuan = posisi();
    catat("mousedown e4 (tekan petak tujuan) — BELUM dilepas");
    lepas("e4");
    catat("mouseup e4");
    return {
      langkahTerjadiDi: setelahTekanTujuan !== awal ? "mousedown petak tujuan" : "bukan mousedown",
      fenAkhir: posisi(),
    };
  })
);

/* ================== 2. apakah lepas di luar papan membatalkan? ============ */

reset(FEN_AWAL);
hasil.push(
  rekam("2. tekan e2 lalu tekan e4; lepas e4 DILUAR papan (tidak di-render)", ({ catat }) => {
    const awal = posisi();
    tekan("e2");
    lepas("e2");
    catat("setelah memilih e2");
    tekan("e4");
    catat("mousedown e4");
    // Lepas di luar papan: event dikirim ke <body>, bukan ke petak.
    const p = titik("h8");
    const ev = new win.MouseEvent("mouseup", {
      bubbles: true,
      clientX: p.x + 5000,
      clientY: p.y + 5000,
      button: 0,
    });
    Object.defineProperty(ev, "pageX", { value: p.x + 5000 });
    Object.defineProperty(ev, "pageY", { value: p.y + 5000 });
    doc.body.dispatchEvent(ev);
    catat("mouseup di luar papan");
    return { langkahTerjadiDi: posisi() !== awal ? "tekan tujuan" : "tidak terjadi", fenAkhir: posisi() };
  })
);

/* ================================ 3. seret bidak ========================== */

reset(FEN_AWAL);
hasil.push(
  rekam("3. seret: tekan e2 → gerak ke e4 → lepas e4", ({ catat }) => {
    const awal = posisi();
    tekan("e2");
    catat("mousedown e2");
    gerak("e4");
    catat("mousemove e4 (seret)");
    const sebelumLepas = posisi();
    lepas("e4");
    catat("mouseup e4");
    return {
      langkahTerjadiDi: sebelumLepas === awal ? "mouseup petak tujuan" : "sebelum mouseup",
      fenAkhir: posisi(),
    };
  })
);

/* ==================== 4. klik petak asal dua kali (batal pilih) =========== */

reset(FEN_AWAL);
hasil.push(
  rekam("4. klik e2 → klik e2 lagi", ({ catat }) => {
    klik("e2");
    catat("setelah klik pertama e2");
    klik("e2");
    catat("setelah klik kedua e2");
    return { terpilihAkhir: petakTerpilih() };
  })
);

/* ================= 5. pindah pilihan ke bidak sendiri lain =============== */

reset(FEN_AWAL);
hasil.push(
  rekam("5. klik e2 → klik d2 (bidak sendiri lain)", ({ catat }) => {
    klik("e2");
    catat("setelah klik e2");
    klik("d2");
    catat("setelah klik d2");
    return { terpilihAkhir: petakTerpilih(), disorot: petakDisorot() };
  })
);

/* ========================= 6. tujuan tidak sah ============================ */

reset(FEN_AWAL);
hasil.push(
  rekam("6. klik e2 → klik e5 (tidak sah, petak kosong)", ({ catat }) => {
    const awal = posisi();
    klik("e2");
    catat("setelah klik e2");
    klik("e5");
    catat("setelah klik e5");
    return { langkah: posisi() !== awal, terpilihAkhir: petakTerpilih(), fenAkhir: posisi() };
  })
);

/* ==================== 7. tujuan tidak sah: bidak lawan ==================== */

reset(FEN_AWAL);
hasil.push(
  rekam("7. klik e2 → klik e7 (bidak lawan, tidak sah)", ({ catat }) => {
    const awal = posisi();
    klik("e2");
    klik("e7");
    catat("setelah klik e7");
    return { langkah: posisi() !== awal, terpilihAkhir: petakTerpilih() };
  })
);

/* ============================ 8. promosi klik ============================= */

reset(FEN_PROMOSI);
hasil.push(
  rekam("8. promosi: klik a7 → TEKAN a8 (belum dilepas)", ({ catat }) => {
    const awal = posisi();
    klik("a7");
    catat("setelah klik a7 (pion)");
    tekan("a8");
    catat("mousedown a8");
    const opsiSetelahTekan = jumlahOpsiPromosi();
    const fenSetelahTekan = posisi();
    lepas("a8");
    catat("mouseup a8");
    return {
      overlayDiTekan: opsiSetelahTekan,
      langkahTerjadiDi:
        fenSetelahTekan !== awal ? "mousedown (langsung main)" : "menunggu pilihan promosi",
      fenAkhir: posisi(),
    };
  })
);

/* ====================== 9. hitung biaya per interaksi ==================== */

reset(FEN_AWAL);
{
  const t0 = pencacah.getBoundingClientRect;
  const m0 = Date.now();
  klik("e2");
  klik("e4");
  hasil.push({
    nama: "9. total pembacaan getBoundingClientRect untuk 1 langkah klik-ke-klik",
    durasiMs: Date.now() - m0,
    getBoundingClientRect: pencacah.getBoundingClientRect - t0,
    fenAkhir: posisi(),
  });
}

/* ===================== 10. klik kanan (tanda/panah) ====================== */

reset(FEN_AWAL);
hasil.push(
  rekam("10. klik kanan e4 (tanda petak)", ({ catat }) => {
    tekan("e4", { button: 2 });
    catat("mousedown e4 tombol kanan");
    lepas("e4", { button: 2 });
    catat("mouseup e4 tombol kanan");
    return {
      markSebelumKanan: null,
      penandaSvg: doc.querySelectorAll("#ic_ui_markers_svg circle").length,
    };
  })
);

/* =========================== ringkasan + simpan ========================== */

console.log("=== ISEPIC-CHESS-UI — perilaku klik (kode asli, jsdom) ===\n");
for (const h of hasil) {
  console.log(`▸ ${h.nama}`);
  if (h.jejak) {
    for (const j of h.jejak) {
      console.log(
        `    ${String(j.tahap).padEnd(42)} fen=${j.fen} pilih=[${j.terpilih.join(",")}] sorot=[${j.disorot
          .slice(0, 4)
          .join(",")}${j.disorot.length > 4 ? ",…" : ""}]${j.opsiPromosi ? ` promosi=${j.opsiPromosi}` : ""}`
      );
    }
  }
  if (h.fenAkhir) console.log(`    → FEN akhir: ${h.fenAkhir}`);
  if (h.langkahTerjadiDi) console.log(`    → langkah dijalankan pada: ${h.langkahTerjadiDi}`);
  if (h.terpilihAkhir) console.log(`    → terpilih akhir: [${h.terpilihAkhir.join(",")}]`);
  if (h.getBoundingClientRect) console.log(`    → getBoundingClientRect: ${h.getBoundingClientRect}×`);
  if (h.penandaSvg !== undefined) console.log(`    → elemen penanda SVG: ${h.penandaSvg}`);
  console.log("");
}

writeFileSync(
  path.join(KELUARAN, "hasil-isepic.json"),
  JSON.stringify({ versi: { "isepic-chess": "9.1.1", "isepic-chess-ui": "5.2.0" }, hasil }, null, 2)
);
console.log(`Hasil JSON: ${path.join(KELUARAN, "hasil-isepic.json")}`);
