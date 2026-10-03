/**
 * Uji jalur galat basis data partai (`src/halaman/Analisa/basisData.js`).
 *
 * Diperiksa (dengan IndexedDB tiruan `fake-indexeddb`):
 *  1. `normalisasiHasil` — tiga bentuk baku; tak dikenal → "draw".
 *  2. Filter menang/kalah TANPA username → TIDAK ADA baris (dulu lolos
 *     semua baris); dengan username → hanya miliknya.
 *  3. Impor PGN terdedup: berkas sama dua kali → satu baris, ID stabil
 *     `impor:<hash isi>`; hasil dibaca dari tag Result ATAU token ujung.
 *  4. Jalur baca yang gagal (kursor/count melempar — disimulasikan lewat
 *     mata-mata prototipe IDB) → `{ galat: true }`, bukan daftar kosong
 *     yang menuduh koleksi memang kosong.
 *  5. `hapusKoleksi` menghapus tanpa `getAll` (kursor indeks) dan
 *     koleksi lain tak tersentuh.
 *
 * Skrip gagal keras bila `fake-indexeddb` tidak terpasang.
 *
 * Jalankan: node scripts/uji-basisdata-galat.mjs
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

if (!ada("fake-indexeddb")) {
  console.log("GAGAL: tidak dapat menjalankan uji galat basis data — pasang `npm i -D fake-indexeddb` untuk menjalankannya.");
  process.exit(1);
}

await import("fake-indexeddb/auto");

/* basisData.js memakai `window.indexedDB`; sediakan jendela tiruan. */
globalThis.window = globalThis;

const {
  normalisasiHasil,
  simpanBanyakPartai,
  ambilDaftarPartai,
  imporPgnKeBasisData,
  hapusKoleksi,
} = await import("../src/halaman/Analisa/basisData.js");
const { hashPgn } = await import("../src/lib/pgnRingan.js");

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

console.log("== normalisasiHasil ==");
hasil('"1-0" → white', normalisasiHasil("1-0") === "white");
hasil('"white"/ejaan campur → white', normalisasiHasil("white") === "white" && normalisasiHasil("  White ") === "white");
hasil('"0-1" → black', normalisasiHasil("0-1") === "black");
hasil('"black" → black', normalisasiHasil("black") === "black");
for (const h of ["1/2-1/2", "½-½", "draw", "*", "", "sampah"]) {
  hasil(`"${h}" → draw`, normalisasiHasil(h) === "draw");
}
hasil("null/undefined → draw", normalisasiHasil(null) === "draw" && normalisasiHasil(undefined) === "draw");

console.log("\n== filter menang/kalah ==");
const KOL_T1 = "uji-galat:t1";
await simpanBanyakPartai(
  [
    { whiteName: "A", blackName: "B", result: "white", pgn: "1. e4 e5 *", plyCount: 2, timestamp: 1000 },
    { whiteName: "B", blackName: "A", result: "black", pgn: "1. e4 e5 *", plyCount: 2, timestamp: 2000 },
    { whiteName: "B", blackName: "A", result: "white", pgn: "1. e4 e5 *", plyCount: 2, timestamp: 3000 },
    { whiteName: "A", blackName: "B", result: "draw", pgn: "1. e4 e5 *", plyCount: 2, timestamp: 4000 },
  ],
  { platform: "uji-galat", username: "t1" }
);
{
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1 });
  hasil("4 baris tersimpan", r.total === 4 && r.galat !== true, `total ${r.total}`);
}
{
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1, hasil: "win", username: "" });
  hasil("menang + username kosong → 0 baris", r.total === 0 && r.partai.length === 0, `total ${r.total}`);
}
{
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1, hasil: "loss", username: "" });
  hasil("kalah + username kosong → 0 baris", r.total === 0 && r.partai.length === 0, `total ${r.total}`);
}
{
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1, hasil: "win", username: "a" });
  hasil("menang + A → 2 baris (putih & hitam)", r.total === 2, `total ${r.total}`);
}
{
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1, hasil: "loss", username: "a" });
  hasil("kalah + A → 1 baris", r.total === 1, `total ${r.total}`);
}
{
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1, hasil: "white" });
  hasil('filter "white" → 2 baris', r.total === 2, `total ${r.total}`);
}

console.log("\n== impor terdedup + hasil token ujung ==");
const PGN_IMPOR = `[Event "Impor Uji"]
[White "X"]
[Black "Y"]
[Result "1-0"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`;
{
  const a = await imporPgnKeBasisData(PGN_IMPOR);
  const b = await imporPgnKeBasisData(PGN_IMPOR);
  hasil("impor pertama tersimpan 1", a.tersimpan === 1, `tersimpan ${a.tersimpan}`);
  hasil("impor kedua menimpa (tersimpan tetap 1)", b.tersimpan === 1, `tersimpan ${b.tersimpan}`);
  const r = await ambilDaftarPartai({ koleksiId: "impor:impor" });
  hasil("total baris impor = 1 (bukan 2)", r.total === 1, `total ${r.total}`);
  hasil("ID stabil = hash isi", r.partai[0]?.id === `impor:${hashPgn(PGN_IMPOR)}`, r.partai[0]?.id);
  hasil("hasil tag 1-0 → white", r.partai[0]?.result === "white", r.partai[0]?.result);
}
{
  // Tanpa tag Result: hasil dibaca dari token ujung movetext.
  await imporPgnKeBasisData("1. f3 e5 2. g4 Qh4# 0-1");
  const r = await ambilDaftarPartai({ koleksiId: "impor:impor" });
  const baris = r.partai.find((p) => p.pgn.includes("Qh4# 0-1"));
  hasil("token ujung 0-1 → black", baris?.result === "black", baris?.result);
}
{
  await imporPgnKeBasisData("1. e4 e5 *");
  const r = await ambilDaftarPartai({ koleksiId: "impor:impor" });
  const baris = r.partai.find((p) => p.pgn === "1. e4 e5 *");
  hasil('token ujung "*" → draw', baris?.result === "draw", baris?.result);
}

console.log("\n== jalur baca gagal → galat: true ==");
{
  const asliStore = IDBObjectStore.prototype.openCursor;
  const asliIndex = IDBIndex.prototype.openCursor;
  IDBObjectStore.prototype.openCursor = function () {
    throw new Error("kursor rusak (simulasi)");
  };
  IDBIndex.prototype.openCursor = function () {
    throw new Error("kursor rusak (simulasi)");
  };
  let r;
  try {
    r = await ambilDaftarPartai({ koleksiId: KOL_T1 });
  } finally {
    IDBObjectStore.prototype.openCursor = asliStore;
    IDBIndex.prototype.openCursor = asliIndex;
  }
  hasil("kursor melempar → galat true", r.galat === true, JSON.stringify({ galat: r.galat, total: r.total }));
}
{
  const asliStore = IDBObjectStore.prototype.count;
  const asliIndex = IDBIndex.prototype.count;
  IDBObjectStore.prototype.count = function () {
    throw new Error("count rusak (simulasi)");
  };
  IDBIndex.prototype.count = function () {
    throw new Error("count rusak (simulasi)");
  };
  let r;
  try {
    // Jalur cepat tanpa filter: total dihitung lewat count().
    r = await ambilDaftarPartai({ koleksiId: KOL_T1, limit: 10 });
  } finally {
    IDBObjectStore.prototype.count = asliStore;
    IDBIndex.prototype.count = asliIndex;
  }
  hasil("count melempar → galat true", r.galat === true, JSON.stringify({ galat: r.galat, total: r.total }));
}
{
  // Mata-mata dilepas: baca normal kembali (tanpa galat).
  const r = await ambilDaftarPartai({ koleksiId: KOL_T1 });
  hasil("pulih setelah mata-mata dilepas", r.galat !== true && r.total === 4, `total ${r.total}`);
}

console.log("\n== hapusKoleksi tanpa getAll ==");
await simpanBanyakPartai(
  [{ whiteName: "K", blackName: "L", result: "draw", pgn: "1. e4 e5 *", plyCount: 2, timestamp: 9000 }],
  { platform: "uji-galat", username: "t2" }
);
{
  let panggilGetAll = 0;
  const asli = IDBObjectStore.prototype.getAll;
  IDBObjectStore.prototype.getAll = function (...arg) {
    panggilGetAll++;
    return asli.apply(this, arg);
  };
  let ok;
  try {
    ok = await hapusKoleksi("uji-galat:t1");
  } finally {
    IDBObjectStore.prototype.getAll = asli;
  }
  hasil("hapusKoleksi → true", ok === true);
  hasil("getAll TIDAK dipanggil", panggilGetAll === 0, `dipanggil ${panggilGetAll}×`);
  const sisaA = await ambilDaftarPartai({ koleksiId: "uji-galat:t1" });
  const sisaB = await ambilDaftarPartai({ koleksiId: "uji-galat:t2" });
  hasil("koleksi target habis", sisaA.total === 0, `total ${sisaA.total}`);
  hasil("koleksi lain utuh", sisaB.total === 1, `total ${sisaB.total}`);
}
hasil('hapusKoleksi("") → false', (await hapusKoleksi("")) === false);
hasil("hapusKoleksi tak-ada → true", (await hapusKoleksi("uji-galat:tak-ada")) === true);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
