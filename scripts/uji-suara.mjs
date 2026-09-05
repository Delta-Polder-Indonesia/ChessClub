/**
 * Uji suara papan (`public/SoundChess` + `src/lib/suara.js`).
 *
 * Mengapa perlu: bunyi papan gampang rusak diam-diam — berkas MP3 terhapus
 * saat rapi-rapi folder, nama bunyi salah ketik, atau alamatnya ditulis
 * langsung `/SoundChess/...` sehingga pecah di GitHub Pages (base URL bukan
 * "/"). Tidak ada yang gagal saat build; yang terjadi cuma papan jadi bisu.
 *
 * Yang diperiksa:
 *  1. Setiap nama di peta `SUARA` punya berkas MP3-nya.
 *  2. Semua MP3 di public/SoundChess benar-benar bingkai MPEG audio (tidak
 *     nol byte / tidak korup).
 *  3. `suaraLangkah()` memilih bunyi yang benar untuk langkah chess.js
 *     (makan, rokade, skak, promosi, skakmat, langkah lawan).
 *  4. `mainkanSuara()` mengambil berkas lewat BASE_URL, memainkannya, dan
 *     memakai cache pada pemutaran berikutnya.
 *  5. Halaman papan tidak menulis alamat `/SoundChess/...` secara langsung.
 *
 * Skrip melewatkan dirinya (exit 0) bila esbuild tidak terpasang.
 *
 * Jalankan: node scripts/uji-suara.mjs
 */
import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));
const SUARA_DIR = path.join(ROOT, "public", "SoundChess");
const STANDARD_DIR = path.join(SUARA_DIR, "standard");

let gagal = 0;
const ok = (pesan) => console.log(`  ✓ ${pesan}`);
const lapor = (pesan) => {
  gagal++;
  console.error(`  ✗ ${pesan}`);
};
const cek = (syarat, pesan) => (syarat ? ok(pesan) : lapor(pesan));

/* ───────────────────────────── 1 & 2 — berkas MP3 ───────────────────────── */

/** Baca bingkai MPEG pertama; kembalikan null bila bukan MP3 yang sah. */
function bingkaiPertama(buf) {
  let i = 0;
  if (buf.slice(0, 3).toString("latin1") === "ID3") {
    const ukuran =
      ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
    i = 10 + ukuran;
  }
  if (i + 4 > buf.length) return null;
  const h = buf.readUInt32BE(i);
  const sinkron = (h >>> 21) & 0x7ff;
  if (sinkron !== 0x7ff) return null;
  const lapisan = (h >>> 17) & 3;
  const bitrate = (h >>> 12) & 0xf;
  const sampel = (h >>> 10) & 3;
  if (lapisan === 0 || bitrate === 0 || bitrate === 0xf || sampel === 3) return null;
  return { lapisan, bitrate, sampel };
}

console.log("Berkas MP3");
const berkasMp3 = existsSync(STANDARD_DIR)
  ? readdirSync(STANDARD_DIR).filter((n) => n.endsWith(".mp3"))
  : [];
cek(berkasMp3.length > 0, `public/SoundChess/standard berisi ${berkasMp3.length} berkas MP3`);

let rusak = 0;
for (const nama of berkasMp3) {
  const isi = readFileSync(path.join(STANDARD_DIR, nama));
  if (isi.length < 200 || !bingkaiPertama(isi)) {
    lapor(`berkas rusak / bukan MP3: standard/${nama}`);
    rusak++;
  }
}
if (!rusak) ok("semua MP3 punya bingkai MPEG audio yang sah");

const sampah = existsSync(SUARA_DIR)
  ? readdirSync(SUARA_DIR, { recursive: true }).filter(
      (n) => String(n).includes("__MACOSX") || path.basename(String(n)).startsWith("._")
    )
  : [];
cek(sampah.length === 0, "tidak ada sisa arsip macOS (__MACOSX / ._*) di public/SoundChess");

/* ─────────────────────── siapkan modul suara untuk Node ─────────────────── */

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("esbuild")) {
  console.log("\nlewati uji modul suara — pasang `npm i -D esbuild` untuk menjalankannya.");
  process.exit(gagal ? 1 : 0);
}

const { build } = require("esbuild");
const { Chess } = require("chess.js");

const BASE = "/pangkal/";
// Hasil bundel ditaruh di dalam repositori (bukan /tmp) supaya `react` yang
// ditandai eksternal tetap bisa di-resolve dari node_modules.
const keluaran = path.join(ROOT, `.uji-suara-${process.pid}.mjs`);
process.on("exit", () => rmSync(keluaran, { force: true }));

await build({
  entryPoints: [path.join(ROOT, "src", "lib", "suara.js")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: keluaran,
  external: ["react"],
  define: { "import.meta.env.BASE_URL": JSON.stringify(BASE) },
  logLevel: "silent",
});

/* Panggung palsu: AudioContext + fetch yang mencatat pemakaian. */
const diambil = [];
let jumlahDimainkan = 0;

class GainPalsu {
  constructor() {
    this.gain = { value: 1 };
  }
  connect() {
    return this;
  }
}
class SumberPalsu {
  connect() {
    return new GainPalsu();
  }
  start() {
    jumlahDimainkan++;
  }
}
class AudioContextPalsu {
  constructor() {
    this.state = "running";
    this.destination = {};
  }
  createBufferSource() {
    return new SumberPalsu();
  }
  createGain() {
    return new GainPalsu();
  }
  decodeAudioData() {
    return Promise.resolve({ palsu: true });
  }
  resume() {
    return Promise.resolve();
  }
}

globalThis.window = globalThis;
globalThis.AudioContext = AudioContextPalsu;
globalThis.localStorage = {
  simpanan: new Map(),
  getItem(k) {
    return this.simpanan.has(k) ? this.simpanan.get(k) : null;
  },
  setItem(k, v) {
    this.simpanan.set(k, String(v));
  },
};
globalThis.fetch = (url) => {
  diambil.push(String(url));
  return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
};

const { SUARA, mainkanSuara, suaraLangkah } = await import(`file://${keluaran}`);

/* ───────────────────── 1b — nama bunyi ⇄ berkas yang ada ────────────────── */

console.log("\nPeta nama bunyi");
let hilang = 0;
for (const [kunci, nama] of Object.entries(SUARA)) {
  if (!berkasMp3.includes(`${nama}.mp3`)) {
    lapor(`SUARA.${kunci} menunjuk "${nama}.mp3" yang tidak ada di public/SoundChess/standard`);
    hilang++;
  }
}
if (!hilang) ok(`${Object.keys(SUARA).length} nama bunyi punya berkasnya masing-masing`);

/* ─────────────────────── 3 — pemilihan bunyi per langkah ────────────────── */

console.log("\nPemilihan bunyi langkah");

function langkah(fen, gerak) {
  const game = new Chess(fen);
  const pindah = game.move(gerak);
  return { pindah, game };
}

const biasa = langkah("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "e4");
cek(
  suaraLangkah(biasa.pindah, biasa.game) === SUARA.langkahSendiri,
  "langkah biasa → move-self"
);
cek(
  suaraLangkah(biasa.pindah, biasa.game, { lawan: true }) === SUARA.langkahLawan,
  "langkah pihak lawan → move-opponent"
);

const makan = langkah("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "exd5");
cek(suaraLangkah(makan.pindah, makan.game) === SUARA.makan, "menangkap bidak → capture");

const rokade = langkah("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "O-O");
cek(suaraLangkah(rokade.pindah, rokade.game) === SUARA.rokade, "rokade → castle");

const skak = langkah("4k3/8/8/8/8/8/8/K6R w - - 0 1", "Rh8+");
cek(suaraLangkah(skak.pindah, skak.game) === SUARA.skak, "memberi skak → move-check");

// Hitam menyisakan bidak h2 supaya papan tidak jatuh ke remis material
// tak cukup — bunyi akhir permainan memang sengaja menang atas bunyi promosi.
const promosi = langkah("8/P5k1/8/8/8/8/7p/K7 w - - 0 1", {
  from: "a7",
  to: "a8",
  promotion: "q",
});
cek(suaraLangkah(promosi.pindah, promosi.game) === SUARA.promosi, "promosi → promote");

const mat = langkah("k7/6R1/8/8/8/8/8/K6R w - - 0 1", "Rh8#");
cek(suaraLangkah(mat.pindah, mat.game) === SUARA.selesai, "skakmat → game-end");

cek(suaraLangkah(null, null) === SUARA.ilegal, "langkah gagal → illegal");

/* ────────────────────────── 4 — pemutaran & cache ───────────────────────── */

console.log("\nPemutaran");
mainkanSuara(SUARA.makan);
await new Promise((r) => setTimeout(r, 20));
cek(
  diambil.length === 1 && diambil[0] === `${BASE}SoundChess/standard/capture.mp3`,
  `alamat memakai BASE_URL: ${diambil[0]}`
);
cek(jumlahDimainkan === 1, "bunyi pertama dimainkan setelah berkas dimuat");

mainkanSuara(SUARA.makan);
await new Promise((r) => setTimeout(r, 20));
cek(diambil.length === 1, "pemutaran kedua memakai cache (tidak mengunduh ulang)");
cek(jumlahDimainkan === 2, "pemutaran kedua tetap berbunyi");

/* ─────────────────── 5 — halaman tidak menulis alamat sendiri ───────────── */

console.log("\nPemakaian di halaman");
const halaman = [
  "src/halaman/PapanInteraktif/PapanInteraktif.jsx",
  "src/halaman/TekaTeki/TekaTeki.jsx",
  "src/halaman/Analisa/komponen/suaraPapan.js",
];
let nakal = 0;
for (const berkas of halaman) {
  const isi = readFileSync(path.join(ROOT, berkas), "utf8");
  if (/["'`]\/?SoundChess\//.test(isi)) {
    lapor(`${berkas} menulis alamat /SoundChess/ langsung — pakai lib/suara.js (berkasPublik)`);
    nakal++;
  }
}
if (!nakal) ok("alamat berkas suara hanya dibentuk di src/lib/suara.js");

const dipakaiSuara = readFileSync(
  path.join(ROOT, "src", "halaman", "Analisa", "komponen", "suaraPapan.js"),
  "utf8"
);
cek(
  dipakaiSuara.includes("lib/suara.js"),
  "halaman Analisa memakai modul suara bersama"
);

console.log(`\n${gagal ? `GAGAL — ${gagal} masalah` : "OK — suara papan siap dipakai"}`);
process.exit(gagal ? 1 : 0);
