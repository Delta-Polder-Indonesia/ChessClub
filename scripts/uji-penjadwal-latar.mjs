/**
 * Uji kontrak penjadwal pekerjaan latar (src/lib/waktuSenggang.js).
 *
 * Mengapa perlu: penjadwal ini menahan SEMUA pekerjaan nonkritis (prefetch
 * rute, pemanasan set bidak, pemanasan MP3, unduhan buku pembukaan/data soal).
 * Kalau antreannya macet atau serialisasinya bocor, gejalanya halus: halaman
 * tetap tampil, tetapi prefetch berhenti selamanya atau puluhan permintaan
 * berjalan bersamaan dan berebut bandwidth dengan render awal — persis yang
 * ingin dihilangkan PR ini.
 *
 * Yang dikunci di sini (kontrak yang tertulis di modul):
 *   1. satu pekerjaan berjalan pada satu waktu — pekerjaan berikut baru mulai
 *      setelah janji pekerjaan sebelumnya SELESAI;
 *   2. pekerjaan yang menggantung (janji tidak pernah selesai) tidak boleh
 *      mengunci antrean selamanya;
 *   3. pembatalan dihormati, termasuk saat pekerjaan sudah keluar dari antrean
 *      tetapi belum mulai;
 *   4. galat (sinkron maupun asinkron) tidak menghentikan antrean;
 *   5. `paksa: true` (data inti halaman) didahulukan atas pekerjaan spekulatif;
 *   6. jaringan hemat data / 2G–3G melewati pekerjaan spekulatif, tetapi tidak
 *      melewati pekerjaan `paksa`;
 *   7. tetap berjalan tanpa `requestIdleCallback`.
 *
 * Jalankan: node scripts/uji-penjadwal-latar.mjs
 */
import { createRequire } from "node:module";
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
  console.log(
    "GAGAL: jalankan uji penjadwal latar — pasang `npm i -D jsdom esbuild` lebih dulu."
  );
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

/* ------------------------------------------------------------ pemuat modul */

async function bundelDari(entri, nama) {
  const hasil = await build({
    stdin: { contents: entri, resolveDir: ROOT, loader: "js" },
    bundle: true,
    write: false,
    format: "iife",
    globalName: nama,
    platform: "browser",
    // Vite mengganti import.meta.env saat build; di sini diisi manual.
    define: { "import.meta.env.BASE_URL": '"/"' },
    logLevel: "error",
  });
  return hasil.outputFiles[0].text;
}

let bundel = null;
async function modul() {
  if (bundel) return bundel;
  const hasil = await build({
    stdin: {
      contents: `export { antrekanLatar, BATAS_TUGAS_MS } from "./src/lib/waktuSenggang.js";`,
      resolveDir: ROOT,
      loader: "js",
    },
    bundle: true,
    write: false,
    format: "iife",
    globalName: "Penjadwal",
    platform: "browser",
    logLevel: "error",
  });
  bundel = hasil.outputFiles[0].text;
  return bundel;
}

/**
 * Siapkan jsdom + modul.
 *
 * `setTimeout` milik HALAMAN dipercepat supaya uji tidak perlu menunggu jeda
 * "halaman tenang" 2 dtk: 2000/3000/12000 ms (jeda tenang & idle) → 0 ms,
 * penjaga 20000 ms → 400 ms. Jeda milik uji sendiri memakai timer Node asli.
 * Nilai asli `BATAS_TUGAS_MS` tetap dikunci oleh pemeriksaan di skenario 2
 * supaya percepatan ini tidak menyembunyikan batas yang sebenarnya.
 */
async function siapkan({ idle = true, hematData = false, koneksi = "4g" } = {}) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://contoh.test/papan-interaktif",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const w = dom.window;
  const cepat = w.setTimeout.bind(w);
  w.__cepat = cepat;
  const percepat = (ms) => (ms === 20000 ? 400 : ms >= 2000 ? 0 : ms);
  w.setTimeout = (fn, ms) => cepat(fn, percepat(ms));
  w.requestIdleCallback = idle
    ? (fn) => cepat(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 0)
    : undefined;
  w.cancelIdleCallback = (id) => w.clearTimeout(id);
  Object.defineProperty(w.navigator, "connection", {
    value: { effectiveType: koneksi, saveData: hematData },
    configurable: true,
  });
  w.eval(await modul());
  return w;
}

/* --------------------------------------------------------------- skenario */

console.log("\n1) Serialisasi: pekerjaan berikut menunggu yang sebelumnya");
{
  const w = await siapkan();
  w.eval(`
    window.__log = [];
    const tunda = (ms) => new Promise((r) => window.__cepat(r, ms));
    Penjadwal.antrekanLatar(async () => {
      __log.push("A-mulai");
      await tunda(120);
      __log.push("A-selesai");
    });
    Penjadwal.antrekanLatar(() => { __log.push("B-mulai"); });
  `);
  await tunggu(600);
  uji(
    "urutan A-mulai → A-selesai → B-mulai",
    w.__log.join("→") === "A-mulai→A-selesai→B-mulai",
    `log: ${JSON.stringify(w.__log)}`
  );
}

console.log("\n2) Pekerjaan menggantung tidak mengunci antrean");
{
  const w = await siapkan();
  const batas = w.Penjadwal.BATAS_TUGAS_MS;
  w.eval(`
    window.__log = [];
    Penjadwal.antrekanLatar(() => new Promise(() => {})); // janji tak pernah selesai
    Penjadwal.antrekanLatar(() => { __log.push("B-jalan"); });
  `);
  await tunggu(1200); // percepatan 400 ms + margin
  uji(
    `pekerjaan setelahnya tetap jalan (batas ${batas} ms)`,
    w.__log.includes("B-jalan"),
    `log: ${JSON.stringify(w.__log)}`
  );
  uji(
    "batas penjaga tetap 20 dtk (bukan nilai percepatan uji)",
    batas === 20000,
    `nilai: ${batas}`
  );
}

console.log("\n3) Pembatalan dihormati (sebelum mulai & saat menunggu idle)");
{
  const w = await siapkan();
  const cepat = w.__cepat;
  // Idle yang bisa dikendalikan: beri jendela 120 ms antara keluar antrean
  // dan mulai, supaya pembatalan tepat di jendela itu bisa diuji.
  w.requestIdleCallback = (fn) => cepat(() => fn({ didTimeout: false, timeRemaining: () => 50 }), 120);
  w.eval(`
    window.__log = [];
    const b1 = Penjadwal.antrekanLatar(() => { __log.push("A-tetap-jalan"); });
    b1();                                    // batal sebelum sempat mulai
    Penjadwal.antrekanLatar(() => { __log.push("B-jalan"); });
  `);
  await tunggu(900);
  uji(
    "tugas yang dibatalkan tidak dijalankan",
    !w.__log.includes("A-tetap-jalan"),
    `log: ${JSON.stringify(w.__log)}`
  );
  uji("antrean lanjut ke tugas berikut", w.__log.includes("B-jalan"), `log: ${JSON.stringify(w.__log)}`);
}

console.log("\n4) Galat tidak menghentikan antrean");
{
  const w = await siapkan();
  w.eval(`
    window.__log = [];
    Penjadwal.antrekanLatar(() => { throw new Error("sinkron"); });
    Penjadwal.antrekanLatar(async () => { throw new Error("asinkron"); });
    Penjadwal.antrekanLatar(() => { __log.push("C-jalan"); });
  `);
  await tunggu(900);
  uji("pekerjaan setelah galat sinkron & asinkron tetap jalan", w.__log.includes("C-jalan"), `log: ${JSON.stringify(w.__log)}`);
}

console.log("\n5) Prioritas: data inti (paksa) didahulukan");
{
  const w = await siapkan();
  w.eval(`
    window.__log = [];
    Penjadwal.antrekanLatar(() => { __log.push("spekulatif"); });
    Penjadwal.antrekanLatar(() => { __log.push("paksa"); }, { paksa: true });
  `);
  await tunggu(700);
  uji(
    "paksa berjalan sebelum spekulatif",
    w.__log[0] === "paksa",
    `log: ${JSON.stringify(w.__log)}`
  );
}

console.log("\n6) Jaringan hemat data / 3G");
{
  const w = await siapkan({ hematData: true, koneksi: "3g" });
  w.eval(`
    window.__log = [];
    Penjadwal.antrekanLatar(() => { __log.push("spekulatif"); });
    Penjadwal.antrekanLatar(() => { __log.push("paksa"); }, { paksa: true });
  `);
  await tunggu(700);
  uji(
    "spekulatif dilewati, paksa tetap jalan",
    w.__log.length === 1 && w.__log[0] === "paksa",
    `log: ${JSON.stringify(w.__log)}`
  );
}

console.log("\n7) Tanpa requestIdleCallback");
{
  const w = await siapkan({ idle: false });
  w.eval(`
    window.__log = [];
    Penjadwal.antrekanLatar(() => { __log.push("jalan"); });
  `);
  await tunggu(700);
  uji("tetap menjalankan antrean", w.__log.includes("jalan"), `log: ${JSON.stringify(w.__log)}`);
}

console.log("\n8) Pemanasan audio & bidak benar-benar dinanti antrean");
{
  // Bukti kontrak: janji tugas harus mewakili unduhan yang dimulainya, bukan
  // sekadar "fungsi sudah dipanggil".
  const w = await siapkan();
  w.eval(`
    window.__log = [];
    const tunda = (ms) => new Promise((r) => window.__cepat(r, ms));
    // Meniru panaskanSuara()/muatSet(): memulai unduhan lalu mengembalikan janji.
    Penjadwal.antrekanLatar(() => Promise.all([tunda(150), tunda(150)]).then(() => __log.push("hangat-selesai")));
    Penjadwal.antrekanLatar(() => { __log.push("berikut"); });
  `);
  await tunggu(700);
  uji(
    "pekerjaan berikut menunggu unduhan pemanasan selesai",
    w.__log.join("→") === "hangat-selesai→berikut",
    `log: ${JSON.stringify(w.__log)}`
  );
}

console.log("\n9) Pemanasan audio nyata: janji dikembalikan, tanpa AudioContext, tanpa unduh ganda");
{
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://contoh.test/papan-interaktif",
    runScripts: "outside-only",
  });
  const w = dom.window;
  let jumlahAudio = 0;
  w.AudioContext = function AudioContext() {
    jumlahAudio += 1;
    throw new Error("AudioContext tidak boleh dibuat saat pemanasan");
  };
  const panggilan = [];
  const lepas = [];
  w.fetch = (url) =>
    new Promise((selesai) => {
      panggilan.push(String(url));
      lepas.push(() => selesai({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
    });
  w.eval(await bundelDari(`export { panaskanSuara } from "./src/lib/suara.js";`, "SuaraUji"));

  const janji = w.SuaraUji.panaskanSuara(["langkah", "tangkap"]);
  uji(
    "panaskanSuara mengembalikan janji (bisa ditunggu penjadwal)",
    janji && typeof janji.then === "function",
    `tipe: ${typeof janji}`
  );
  uji(
    "tidak ada unduhan ganda: sekali per nama",
    panggilan.length === 2 && new Set(panggilan).size === 2,
    `permintaan: ${JSON.stringify(panggilan)}`
  );
  // Panggilan kedua sebelum yang pertama selesai tetap memakai janji yang sama.
  w.SuaraUji.panaskanSuara(["langkah", "tangkap"]);
  uji(
    "pemanggilan ulang memakai cache (tetap 2 permintaan)",
    panggilan.length === 2,
    `permintaan: ${JSON.stringify(panggilan)}`
  );
  uji("tidak membuat AudioContext (aman dari kebijakan autoplay)", jumlahAudio === 0, `dibuat: ${jumlahAudio}`);
  lepas.forEach((f) => f());
  let selesai = false;
  await janji.then(() => {
    selesai = true;
  });
  uji("janji selesai setelah unduhan selesai", selesai);
}

console.log(
  `\n${gagal === 0 ? "OK" : "GAGAL"} — penjadwal latar: ${lulus} lulus, ${gagal} gagal.`
);
process.exit(gagal === 0 ? 0 : 1);
