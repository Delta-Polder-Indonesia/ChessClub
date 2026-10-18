#!/usr/bin/env node
/**
 * Uji TANGKAPAN BIDAK di papan — "bidak makan bidak".
 *
 * Mengapa ada: tiga kecacatan logika berturut-turut pada jalur tangkapan papan
 * interaktif tidak tertangkap uji mana pun, karena semuanya hanya terlihat di
 * peramban nyata dan hanya pada langkah yang MEMAKAN bidak:
 *
 *  1. **klik pemakan termakan.** Setiap hiasan di dalam petak (sorotan langkah
 *     terakhir `absolute inset-0`, titik/cincin sasaran) ikut menjadi sasaran
 *     hit-test karena tidak `pointer-events-none`. Klik pemain selalu jatuh di
 *     TENGAH petak — persis tempat titik sasaran duduk — dan pada petak hasil
 *     langkah terakhir (asal & tujuan, yaitu petak yang dipakai untuk makan dan
 *     makan-balik) hiasan itu menutupi seluruh petak. Bila papan render ulang di
 *     antara `pointerdown` dan `click`, klik tidak pernah mendarat di tombol
 *     petak: langkah TIDAK tercipta, riwayat diam-diam tidak bertambah.
 *  2. **en passant bukan langkah biasa.** Penanda "ini tangkapan" disimpulkan
 *     dari "petak tujuan terisi bidak". En passant adalah satu-satunya langkah
 *     yang memakan bidak di petak KOSONG, jadi petaknya ditandai titik (langkah
 *     biasa) sementara baris pemain sudah mencatat bidaknya hilang.
 *  3. **baris pemain tidak ikut papan berbalik.** Baris "Hitam"/"Putih" ditulis
 *     tetap (Hitam selalu di atas papan), padahal isinya — bidak yang dimakan
 *     sisi itu — menempel pada tepi papan. Setelah papan dibalik, bidak yang
 *     baru saja dimakan Hitam muncul di baris Putih.
 *
 * Yang diperiksa:
 *   A. `susunTangkapan` — pemetaan sisi, en passant, promosi, pengali, urutan
 *      nilai, replay dari FEN kustom, dan SAN rusak;
 *   B. penjaga statis papan: setiap hiasan di dalam petak wajib
 *      `pointer-events-none`, dan penanda tangkapan hanya datang dari daftar
 *      tangkapan induk (bukan dari "petak terisi");
 *   C. penjaga statis halaman: `sasaranTangkap` disuplai dari `m.captured` dan
 *      baris pemain adalah turunan `orientasi`;
 *   D. render `PapanTekaTeki` di jsdom: cincin untuk en passant, titik untuk
 *      petak kosong, cincin untuk petak terisi tanpa daftar tangkapan (kontrak
 *      lama halaman lain), dan pengali bidak tertangkap di baris pemain.
 *
 * Skrip gagal keras bila jsdom/esbuild tidak terpasang — keduanya bukan
 * dependensi runtime situs.
 *
 * Jalankan: node scripts/uji-tangkapan-bidak.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

const baca = (berkas) => {
  const jalur = path.join(ROOT, berkas);
  if (!existsSync(jalur)) {
    console.error(`  ✗ berkas sumber tidak ada: ${berkas}`);
    process.exitCode = 1;
    gagal++;
    return "";
  }
  return readFileSync(jalur, "utf8");
};

/* ============================ A. kantong tangkapan ============================ */

console.log("A. susunTangkapan — bidak yang dimakan tiap sisi");

const { susunTangkapan } = await import(
  "../src/halaman/PapanInteraktif/bersama/TangkapanBidakData.js"
);
const { Chess } = await import("chess.js");

/** Mainkan deret SAN dari posisi awal, kembalikan { riwayat, tangkapan }. */
const mainkan = (san, dasar) => {
  const game = dasar ? new Chess(dasar) : new Chess();
  for (const s of san) game.move(s);
  return { game, tangkapan: susunTangkapan(game.history(), dasar) };
};
const ringkas = (daftar) => daftar.map((x) => `${x.huruf}${x.jumlah > 1 ? `x${x.jumlah}` : ""}`).join("");

{
  const { tangkapan, game } = mainkan(["e4", "d5", "exd5"]);
  uji("tangkapan putih: bidak HITAM (huruf kecil) masuk baris Putih", tangkapan.olehPutih.length === 1 && tangkapan.olehPutih[0].huruf === "p");
  uji("tangkapan hitam kosong bila Hitam belum memakan apa pun", tangkapan.olehHitam.length === 0);
  uji("kantong cocok dengan bidak yang hilang dari papan", ringkas(tangkapan.olehPutih) === "p" && game.get("d5")?.color === "w");
}

{
  const { tangkapan } = mainkan(["e4", "d5", "exd5", "Qxd5", "Bc4", "Qxc4"]);
  uji(
    "makan-balik: tiap sisi punya kantong sendiri, diurutkan dari bidak termahal",
    ringkas(tangkapan.olehPutih) === "p" && ringkas(tangkapan.olehHitam) === "BP",
    `${ringkas(tangkapan.olehPutih)} / ${ringkas(tangkapan.olehHitam)}`
  );
}

{
  // en passant: Hitam kehilangan pion d5, padahal pion putih mendarat di d6 KOSONG.
  const { tangkapan, game } = mainkan(["e4", "a6", "e5", "d5", "exd6"]);
  uji("en passant tercatat sebagai tangkapan pion", ringkas(tangkapan.olehPutih) === "p", ringkas(tangkapan.olehPutih));
  uji("en passant benar-benar menghapus bidak di petak sebelah", !game.get("d5") && game.get("d6")?.type === "p" && game.get("d6").color === "w");
}

{
  // axb8=Q+ : pion MEMAKAN kuda sambil promosi; lalu menteri promosi itu dimakan raja.
  const dasar = "1n2k3/P7/8/8/8/8/8/4K3 w - - 0 1";
  const promosi = mainkan(["axb8=Q+"], dasar);
  uji("tangkapan sambil promosi tercatat sebagai tangkapan (bukan promosi)", ringkas(promosi.tangkapan.olehPutih) === "n", ringkas(promosi.tangkapan.olehPutih));
  uji("saat promosi tidak ada bidak lawan yang hilang di luar tangkapan", promosi.tangkapan.olehHitam.length === 0);
  const dimakan = mainkan(["axb8=Q+", "Kd7", "Qc7", "Kxc7"], dasar);
  uji("bidak hasil promosi yang kemudian dimakan masuk kantong lawan", ringkas(dimakan.tangkapan.olehHitam) === "Q", ringkas(dimakan.tangkapan.olehHitam));
  uji("kantong Putih tetap hanya berisi kuda yang dimakannya", ringkas(dimakan.tangkapan.olehPutih) === "n", ringkas(dimakan.tangkapan.olehPutih));
}

{
  // tiga pion berturut-turut (d5, e6, f7) — pengali; Hitam hanya kehilangan satu.
  const { tangkapan } = mainkan(["e4", "d5", "exd5", "e6", "dxe6", "Nf6", "exf7+", "Kxf7"]);
  uji("beberapa bidak sejenis dikelompokkan dengan pengali", ringkas(tangkapan.olehPutih) === "px3", ringkas(tangkapan.olehPutih));
  uji("satu bidak sejenis tampil tanpa pengali", ringkas(tangkapan.olehHitam) === "P", ringkas(tangkapan.olehHitam));
}

{
  // dua jenis perwira berbeda: diurutkan dari yang paling berharga.
  const { tangkapan } = mainkan(["e4", "d5", "exd5", "Nf6", "Nc3", "Nxd5", "Nxd5", "Qxd5"]);
  uji("disortir dari bidak paling berharga", ringkas(tangkapan.olehPutih) === "np" && ringkas(tangkapan.olehHitam) === "NP", `${ringkas(tangkapan.olehPutih)} / ${ringkas(tangkapan.olehHitam)}`);
}

{
  const dariFen = "r1bqkbnr/pppppppp/2n5/8/3N4/8/PPP1PPPP/RNBQKB1R w KQkq - 0 1";
  const { tangkapan } = mainkan(["Nxc6"], dariFen);
  uji("replay berangkat dari FEN awal halaman, bukan selalu posisi standar", ringkas(tangkapan.olehPutih) === "n", ringkas(tangkapan.olehPutih));
}

{
  const rusak = susunTangkapan(["e4", "Nh5", "zzz", "e5"]);
  uji("SAN tidak sah menghentikan replay tanpa melempar", ringkas(rusak.olehPutih) === "" && Array.isArray(rusak.olehHitam));
  uji("FEN dasar rusak → kantong kosong tanpa melempar", JSON.stringify(susunTangkapan(["e4"], "bukan-fen")) === JSON.stringify({ olehPutih: [], olehHitam: [] }));
}

{
  // riwayat kosong (mis. setelah Mundur dari posisi pertama) → tidak ada kantong.
  uji("riwayat kosong → kedua baris kosong", JSON.stringify(susunTangkapan([])) === JSON.stringify({ olehPutih: [], olehHitam: [] }));
}

/* ======================= B. penjaga statis papan & halaman ======================= */

console.log("\nB. papan: hiasan petak tidak boleh memakan klik");

const SUMBER_PAPAN = "src/halaman/TekaTeki/PapanTekaTeki.jsx";
const papan = baca(SUMBER_PAPAN);
{
  const mulai = papan.indexOf("const Petak = memo(");
  const akhir = papan.indexOf("export default function PapanTekaTeki");
  uji("komponen Petak ditemukan di sumber papan", mulai >= 0 && akhir > mulai);
  const blok = papan.slice(mulai, akhir);
  // Semua elemen yang diposisikan absolut di dalam petak: hiasan sorotan,
  // penanda sasaran, label koordinat, dan ikon klasifikasi. Bisa berupa string
  // biasa maupun template literal.
  const hiasan = [...blok.matchAll(/className=\{?[`"]([^`"]*\babsolute\b[^`"]*)[`"]\}?/g)].map((m) => m[1]);
  uji("blok petak memuat hiasan untuk diperiksa", hiasan.length >= 10, `${hiasan.length} hiasan`);
  const memakan = hiasan.filter((kls) => !kls.includes("pointer-events-none"));
  uji(
    "setiap hiasan di dalam petak memakai pointer-events-none",
    memakan.length === 0,
    `${memakan.length} hiasan masih merebut klik: ${memakan.slice(0, 3).join(" | ")}`
  );
  uji("penanda tangkapan tidak bisa direbut hiasan lain", /data-tangkap=\{jadiTangkap/.test(blok));
}

console.log("\nC. papan: penanda tangkapan datang dari daftar induk");
{
  uji(
    "PapanTekaTeki menerima prop sasaranTangkap",
    /sasaranTangkap\s*=\s*\[\]/.test(papan),
    "prop tidak punya nilai bawaan — halaman lain jadi rusak"
  );
  uji(
    "cincin dipakai bila petak terisi ATAU termasuk daftar tangkapan",
    /jadiSasaran && \(bidak \|\| jadiTangkap\)/.test(papan),
    "masih menyimpulkan tangkapan dari 'petak terisi' saja"
  );
  uji(
    "titik hanya untuk petak kosong yang bukan tangkapan",
    /jadiSasaran && !bidak && !jadiTangkap/.test(papan)
  );
}

console.log("\nD. halaman papan interaktif: kantong & baris pemain");
{
  const halaman = baca("src/halaman/PapanInteraktif/PapanInteraktif.jsx");
  uji(
    "daftar tangkapan dibaca dari m.captured chess.js",
    /langkah\.filter\(\(m\) => m\.captured\)\.map\(\(m\) => m\.to\)/.test(halaman),
    "penanda tangkapan tidak disuplai induk"
  );
  uji("daftar tangkapan diteruskan ke papan", /sasaranTangkap=\{seleksi\.tangkap\}/.test(halaman));
  uji(
    "petak terpilih + sasaran + tangkapan adalah SATU state",
    /const \[seleksi, setSeleksi\] = useState\(SELEKSI_KOSONG\)/.test(halaman) &&
      !/const \[sasaran, setSasaran\]/.test(halaman)
  );
  uji(
    "baris pemain adalah turunan orientasi (bukan Hitam selalu di atas)",
    /barisAtas = barisSisi\(orientasi === "w" \? "b" : "w"\)/.test(halaman) &&
      /barisBawah = barisSisi\(orientasi === "w" \? "w" : "b"\)/.test(halaman)
  );
  uji(
    "baris pemain memakai BarisProfil bersama (satu sumber untuk lima mode)",
    /import \{ BarisProfil \} from ".\/bersama\/BarisProfil\.jsx"/.test(halaman) &&
      /<BarisProfil \{\.\.\.barisAtas\}/.test(halaman)
  );
  uji(
    "kantong dihitung dari riwayat langkah pada posisi awal halaman",
    /susunTangkapan\(riwayat, fenAwal\)/.test(halaman)
  );
  const teks = baca("src/lib/terjemahan/id/papan.js");
  const teksEn = baca("src/lib/terjemahan/en/papan.js");
  uji(
    "label baris pemain berasal dari kamus (bukan teks Indonesia yang di-hardcode)",
    /t\("papan\.warnaPutih"\)/.test(halaman) && /t\("papan\.warnaHitam"\)/.test(halaman) &&
      /warnaPutih: "Putih"/.test(teks) && /warnaHitam: "Hitam"/.test(teks) &&
      /warnaPutih: "White"/.test(teksEn) && /warnaHitam: "Black"/.test(teksEn)
  );
}

/* ============================== E. render papan ============================== */

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("\nE. GAGAL — pasang `npm i -D jsdom esbuild` untuk menjalankan uji render.");
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

console.log("\nE. render PapanTekaTeki: cincin tangkapan vs titik langkah biasa");

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./src/lib/I18nProvider.jsx";
import PapanTekaTeki from "./src/halaman/TekaTeki/PapanTekaTeki.jsx";
import { BarisProfil } from "./src/halaman/PapanInteraktif/bersama/BarisProfil.jsx";
import { susunTangkapan } from "./src/halaman/PapanInteraktif/bersama/TangkapanBidakData.js";

export function mountPapan(el, props) {
  return createRoot(el).render(
    <I18nProvider>
      <PapanTekaTeki {...props} />
    </I18nProvider>
  );
}

export function mountBaris(el, { san, dasar, nama, putih }) {
  const tangkapan = susunTangkapan(san, dasar);
  return createRoot(el).render(
    <I18nProvider>
      <BarisProfil
        nama={nama}
        putih={putih}
        tangkapan={putih ? tangkapan.olehPutih : tangkapan.olehHitam}
        setBidak="merida"
      />
    </I18nProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-tangkapan-bidak.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-tangkapan-bidak-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
  // `import.meta.glob` (dipakai ChessPiece) dipecah oleh shim yang sama dengan
  // Node loader, supaya aset bidak benar-benar termuat dan tidak diganti {}.
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

/* ------------------------------------------------------- lingkungan jsdom */
/* Disamakan dengan scripts/uji-tanda-papan.mjs — papan yang sama, cara uji sama. */

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
  // `mulaiSeret` memanggil requestAnimationFrame global; jsdom menyimpannya di
  // window (pretendToBeVisual), bukan di global Node.
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  for (const nama of ["HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent"]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: "https://uji.test/papan-interaktif",
  pretendToBeVisual: true,
});
siapkanGlobal(dom.window);
const dokumen = dom.window.document;
const modul = require(berkasBundel);
const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

/** Render papan lalu kembalikan wadahnya (React 18 flush pada tick berikut). */
async function papanUntuk(props) {
  const wadah = dokumen.createElement("div");
  dokumen.body.appendChild(wadah);
  modul.mountPapan(wadah, props);
  await tunggu(150);
  return wadah;
}

/** Penanda petak sasaran pada satu petak, atau null bila tidak ada. */
function penanda(wadah, petak) {
  const el = wadah.querySelector(`[data-petak="${petak}"] [data-bantu-sasaran]`);
  if (!el) return null;
  const kls = el.getAttribute("class") || "";
  return {
    cincin: kls.includes("inset-[3%]"),
    tangkap: el.getAttribute("data-tangkap") === "1",
    kebalKlik: kls.includes("pointer-events-none"),
  };
}

/** Teks pengali ("3×") pada span daun baris pemain. */
function daunPengali(wadah) {
  return [...wadah.querySelectorAll("span")]
    .filter((el) => el.children.length === 0)
    .map((el) => (el.textContent || "").trim())
    .filter((x) => /^\d+×$/.test(x));
}

/** Hiasan (aria-hidden) di dalam tombol petak — tidak boleh merebut klik. */
function hiasan(wadah, petak) {
  const tombol = wadah.querySelector(`[data-petak="${petak}"]`);
  if (!tombol) return [];
  return [...tombol.children].filter((el) => el.getAttribute("aria-hidden") === "true");
}

/* FEN setelah 1.e4 d5 2.exd5 — petak d5 berisi bidak, d6 kosong (en passant). */
const FEN_EPAK = "rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3";

{
  // Papan sedang mengancam: d5 (terisi => tangkapan lama) dan d6 (KOSONG tapi
  // tetap tangkapan karena en passant) — inilah bedanya cincin vs titik.
  const wadah = await papanUntuk({
    fen: FEN_EPAK,
    terpilih: "d5",
    sasaran: ["d6", "d5"],
    sasaranTangkap: ["d6", "d5"],
    animasi: false,
  });
  uji("papan ter-render 64 petak", wadah.querySelectorAll("[data-petak]").length === 64);
  const ep = penanda(wadah, "d6");
  const isi = penanda(wadah, "d5");
  uji("en passant: petak KOSONG ditandai cincin, bukan titik", !!ep && ep.cincin && ep.tangkap, JSON.stringify(ep));
  uji("tangkapan biasa: petak terisi tetap cincin", !!isi && isi.cincin && isi.tangkap, JSON.stringify(isi));
  uji(
    "penanda tidak merebut klik",
    !!ep?.kebalKlik && !!isi?.kebalKlik,
    JSON.stringify({ ep: ep?.kebalKlik, isi: isi?.kebalKlik })
  );
  const kosong = penanda(wadah, "d4");
  uji("petak tak bersasaran tidak punya penanda", kosong === null, JSON.stringify(kosong));
  wadah.remove();
}

{
  // Kontrak lama: halaman lain (TekaTeki, TekaTekiRush, …) tidak mengirim
  // daftar tangkapan -> petak kosong harus tetap titik, bukan cincin.
  const wadah = await papanUntuk({
    fen: FEN_EPAK,
    terpilih: "d5",
    sasaran: ["d6", "d5"],
    animasi: false,
  });
  uji(
    "tanpa sasaranTangkap: petak kosong tetap titik (perilaku lama utuh)",
    penanda(wadah, "d6")?.cincin === false && penanda(wadah, "d5")?.cincin === true,
    JSON.stringify({ d6: penanda(wadah, "d6"), d5: penanda(wadah, "d5") })
  );
  uji("tanpa sasaranTangkap: penanda bukan cincin tidak diberi data-tangkap", penanda(wadah, "d6")?.tangkap === false);
  wadah.remove();
}

{
  // Regresi langsung penyebab bug: pada petak yang baru saja dipakai makan
  // (sorotan langkah terakhir + terpilih + sasaran), semua hiasan harus kebal
  // klik supaya tombol petak tetap yang menerima klik.
  const wadah = await papanUntuk({
    fen: FEN_EPAK,
    terpilih: "e4",
    langkahAkhir: { from: "e4", to: "d5" },
    sasaran: ["d5"],
    sasaranTangkap: ["d5"],
    tanda: { panah: [], petak: { e4: "bawaan" } },
    animasi: false,
  });
  const hiasanE4 = hiasan(wadah, "e4");
  const hiasanD5 = hiasan(wadah, "d5");
  uji("petak sorotan punya hiasan untuk diuji", hiasanE4.length >= 1 && hiasanD5.length >= 2, `${hiasanE4.length}/${hiasanD5.length}`);
  const bocor = [...hiasanE4, ...hiasanD5].filter((el) => !(el.getAttribute("class") || "").includes("pointer-events-none"));
  uji(
    "SEMUA hiasan di petak makan kebal klik (klik tidak hilang)",
    bocor.length === 0,
    bocor.map((el) => el.getAttribute("class")).join(" | ")
  );
  uji("label koordinat juga kebal klik", (() => {
    const label = [...wadah.querySelectorAll("[data-petak]")].flatMap((t) => [...t.querySelectorAll("*")]).filter((el) => /^[a-h]$|^[1-8]$/.test((el.textContent || "").trim()));
    return label.length > 0 && label.every((el) => (el.getAttribute("class") || "").includes("pointer-events-none"));
  })());
  wadah.remove();
}

{
  // Baris pemain: ikon bidak yang dimakan + pengali "N×".
  const wadah = dokumen.createElement("div");
  dokumen.body.appendChild(wadah);
  modul.mountBaris(wadah, {
    san: ["e4", "d5", "exd5", "Nf6", "Nc3", "Nxd5", "Nxd5", "Qxd5"],
    nama: "Putih",
    putih: true,
  });
  await tunggu(150);
  const ikon = [...wadah.querySelectorAll("img")];
  uji("baris pemain merender ikon bidak tertangkap", ikon.length === 2, `${ikon.length} ikon`);
  uji("satu bidak sejenis tidak memakai pengali", daunPengali(wadah).length === 0, daunPengali(wadah).join(" "));
  wadah.remove();

  const wadah2 = dokumen.createElement("div");
  dokumen.body.appendChild(wadah2);
  modul.mountBaris(wadah2, {
    san: ["e4", "d5", "exd5", "e6", "dxe6", "Nf6", "exf7+", "Kxf7"],
    nama: "Putih",
    putih: true,
  });
  await tunggu(150);
  uji(
    "tiga pion sejenis = SATU ikon dengan pengali",
    wadah2.querySelectorAll("img").length === 1 && daunPengali(wadah2).join(" ") === "3×",
    `${wadah2.querySelectorAll("img").length} ikon / ${daunPengali(wadah2).join(" ")}`
  );
  wadah2.remove();
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
