/**
 * Uji "peramban tiruan" untuk runtime Maia.
 *
 * `scripts/uji-maia.mjs` menjalankan model lewat `onnxruntime-web` yang
 * diimpor sebagai modul Node — jalur `fs`. Itu menguji bobot dan penyandian
 * posisi, tetapi BUKAN berkas yang benar-benar dipakai peramban. Yang
 * dipakai peramban adalah `public/engines/ort/ort.wasm.min.js`, dimuat
 * worker lewat `importScripts`, yang memilih sendiri berkas `.wasm`-nya.
 *
 * Dua hal bisa rusak hanya di jalur itu:
 *
 *  1. Perekat (glue) memilih build wasm yang SALAH. Sejak onnxruntime-web
 *     1.19 satu-satunya build adalah yang berulir, dan build itu membuat
 *     `WebAssembly.Memory({ shared: true })` tanpa syarat — untuk satu utas
 *     sekalipun. Tanpa COEP, `SharedArrayBuffer` tidak ada dan sesi gagal
 *     dengan pesan yang sama sekali tidak menyebut COEP. Uji di bawah
 *     mengunci keadaan ini: kalau kelak paketnya naik tanpa penyesuaian,
 *     uji ini gagal lebih dulu, di mesin pengembang, bukan di ponsel pemain.
 *  2. Perekat tersedak pada lingkungan worker (XHR, `fetch` `file://`,
 *     `document.currentScript` yang kosong). Di sini ia dijalankan di
 *     dalam `vm` tanpa `process`, jadi emscripten mengambil jalur
 *     peramban/worker yang sesungguhnya — persis seperti di produksi.
 *
 * Kenapa `vm` dan bukan sekadar `import "onnxruntime-web"`: di dalam satu
 * realm, `instanceof Uint8Array` dan kawan-kawannya milik realm itu. Kalau
 * tensor dibuat di realm Node lalu diberikan ke ORT di realm lain,
 * pemeriksaan tipenya gagal dengan pesan yang menyesatkan
 * ("must be 'path' or 'buffer'"). Karena itu seluruh kode ORT — termasuk
 * pembuatan tensor — dijalankan di dalam konteksnya sendiri.
 *
 * Bila lingkungan Node tidak sanggup menjalankan sandbox ini (globals yang
 * dibutuhkan tidak ada), uji dilewati dengan catatan, bukan digagalkan:
 * yang dijaga di sini adalah perilaku peramban, bukan Node.
 *
 * Jalankan: node scripts/uji-maia-ort.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOLDER_ORT = path.join(AKAR, "public", "engines", "ort");
const GLUE = path.join(FOLDER_ORT, "ort.wasm.min.js");
const MODEL = "/engines/maia3/maia3_simplified.onnx";
const ASAL = "http://ort.local"; // origin palsu: cukup agar bukan skema file

let lulus = 0;
let gagal = 0;
const hasil = (nama, kondisi, keterangan = "") => {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
};

/** Potong pesan galat: glue ORT 143 KB, dan stack-nya ikut membanjiri layar. */
function ringkas(galat) {
  const pesan = galat && galat.message ? galat.message : String(galat);
  return pesan.length > 300 ? `${pesan.slice(0, 300)}…` : pesan;
}

console.log("\nRuntime ORT di jalur peramban (glue UMD + wasm satu utas)");

if (!existsSync(GLUE)) {
  console.log("  ⚠ dilewati: jalankan `npm run salin:ort` lebih dulu.");
  process.exit(0);
}
if (!existsSync(path.join(AKAR, "public", "engines", "maia3", "maia3_simplified.onnx"))) {
  console.log("  ⚠ dilewati: bobot maia3_simplified.onnx belum ada.");
  process.exit(0);
}

/** Berkas .wasm yang benar-benar diminta glue — inilah inti uji ini. */
const diminta = [];

/**
 * Setiap `WebAssembly.Memory` yang dibuat glue, dengan tanda `shared`.
 * Memori bersama menuntut `crossOriginIsolated` (COOP **dan** COEP), dan repo
 * ini sengaja tidak mengirim COEP. Dicek di sini — pada konstruksinya, bukan
 * pada `env` — karena build berulir onnxruntime-web membuatnya tanpa syarat,
 * bahkan untuk `numThreads = 1`.
 */
const memori = [];

/**
 * `fetch` pengganti: berkas `public/` disajikan seolah-olah berasal dari
 * origin sendiri. `Response` sungguhan (bukan objek biasa) supaya
 * `WebAssembly.instantiateStreaming` bisa dipakai, seperti di peramban.
 */
async function ambil(url) {
  const alamat = String(url);
  let berkas = null;
  if (alamat.startsWith("/")) berkas = path.join(AKAR, "public", alamat);
  else if (alamat.startsWith(`${ASAL}/`)) berkas = path.join(AKAR, "public", new URL(alamat).pathname);
  if (!berkas || !existsSync(berkas)) return new Response("tidak ada", { status: 404 });
  diminta.push(path.basename(berkas));
  const jenis = berkas.endsWith(".wasm") ? "application/wasm" : "application/octet-stream";
  return new Response(readFileSync(berkas), { status: 200, headers: { "content-type": jenis } });
}

const konteks = {
  console,
  WebAssembly: Object.create(WebAssembly),
  TextDecoder,
  TextEncoder,
  Response,
  Headers,
  Request,
  URL,
  Blob,
  performance,
  crypto,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  structuredClone,
  fetch: ambil,
  navigator: { hardwareConcurrency: 4, userAgent: "uji-maia-ort" },
  location: { href: `${ASAL}/engines/ort/ort.wasm.min.js` },
  document: {
    currentScript: { src: `${ASAL}/engines/ort/ort.wasm.min.js` },
    createElement: () => ({ style: {} }),
    addEventListener() {},
  },
};
// Sadap memori wasm sebelum glue dijalankan. Dua jalur yang mungkin:
//   (a) glue membuat sendiri `new WebAssembly.Memory(...)` — begini cara
//       build berulir onnxruntime-web melakukannya, dan ia menulis
//       `shared: true` tanpa syarat;
//   (b) memori datang dari dalam modul wasm (bagian memory) — tidak mungkin
//       bersama, dan itulah yang diharapkan dari build satu utas.
konteks.WebAssembly.Memory = class MemoriCatat extends WebAssembly.Memory {
  constructor(deskripsi) {
    super(deskripsi);
    memori.push({ bersama: true === (deskripsi && deskripsi.shared), sumber: "glue" });
  }
};
for (const nama of ["instantiate", "instantiateStreaming"]) {
  const asli = WebAssembly[nama].bind(WebAssembly);
  konteks.WebAssembly[nama] = async (...argumen) => {
    const hasilnya = await asli(...argumen);
    const ekspor = (hasilnya?.instance ?? hasilnya)?.exports;
    // Nama ekspor wasm sudah diminifikasi, jadi cari berdasarkan JENIS objek,
    // bukan namanya: yang dicari sesuatu yang merupakan WebAssembly.Memory.
    for (const kunci of Object.keys(ekspor ?? {})) {
      const nilai = ekspor[kunci];
      if (nilai instanceof WebAssembly.Memory) {
        memori.push({ bersama: nilai.buffer instanceof SharedArrayBuffer, sumber: `${nama}:${kunci}` });
      }
    }
    return hasilnya;
  };
}

konteks.self = konteks;
konteks.window = konteks;
konteks.globalThis = konteks;
konteks.addEventListener = () => {};
konteks.removeEventListener = () => {};

try {
  vm.createContext(konteks);
  vm.runInContext(readFileSync(GLUE, "utf8"), konteks, { filename: "ort.wasm.min.js" });
} catch (galat) {
  console.log(`  ⚠ dilewati: sandbox vm tidak sanggup memuat glue — ${ringkas(galat)}`);
  process.exit(0);
}

const ort = konteks.ort;
hasil("glue UMD mengekspos objek ort", Boolean(ort?.InferenceSession));
if (!ort?.InferenceSession) {
  console.log(`\n${gagal ? "GAGAL" : "OK"} — ${lulus} lulus, ${gagal} gagal`);
  process.exit(process.exitCode ?? 0);
}
hasil("versi runtime terbaca", String(ort.env?.versions?.common ?? "").length > 0, ort.env?.versions?.common);

// Semua kode ORT berikut berjalan DI DALAM konteks: tensor, janji, dan
// `instanceof` semuanya harus satu realm dengan ORT-nya.
vm.runInContext(
  `
  globalThis.jalankan = async function jalankan(modelUrl, tokenArr, selfArr, oppoArr, jumlah) {
    const ort = globalThis.ort;
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    ort.env.wasm.wasmPaths = "/engines/ort/";
    ort.env.logLevel = "error";
    const buf = await fetch(modelUrl).then((r) => r.arrayBuffer());
    const sesi = await ort.InferenceSession.create(new Uint8Array(buf), {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    const umpan = {
      tokens: new ort.Tensor("float32", new Float32Array(tokenArr), [jumlah, 64, 12]),
      elo_self: new ort.Tensor("float32", new Float32Array(selfArr), [jumlah]),
      elo_oppo: new ort.Tensor("float32", new Float32Array(oppoArr), [jumlah]),
    };
    const mulai = Date.now();
    const hasil = await sesi.run(umpan);
    return {
      ms: Date.now() - mulai,
      masuk: sesi.inputNames.join(","),
      keluar: sesi.outputNames.join(","),
      logitLangkah: Array.from(hasil.logits_move.data),
      logitNilai: Array.from(hasil.logits_value.data),
    };
  };
`,
  konteks
);

const { susunBatch, uraiBatch } = await import("../src/lib/maia3.js");

const FEN_PUTIH = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const FEN_HITAM = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
const berkas = susunBatch([FEN_PUTIH, FEN_HITAM], [1500, 1700], [1500, 1500]);

let laporan = null;
try {
  laporan = await konteks.jalankan(
    MODEL,
    Array.from(berkas.token),
    Array.from(berkas.self),
    Array.from(berkas.oppo),
    berkas.jumlah
  );
} catch (galat) {
  // "bad memory" / SharedArrayBuffer adalah wajah kegagalan build berulir
  // tanpa COEP. Tanpa petunjuk ini, pesannya sama sekali tidak menyebut
  // penyebab yang sebenarnya (versi onnxruntime-web).
  const pesan = ringkas(galat);
  const petunjuk = /bad memory|SharedArrayBuffer/i.test(pesan)
    ? " — ini wajah kegagalan build wasm berulir: ia menuntut memori bersama, yang butuh COEP. Periksa versi onnxruntime-web dan berkas yang disalin scripts/salin-ort.mjs."
    : "";
  hasil("inferensi lewat glue UMD tidak galat", false, pesan + petunjuk);
}

if (laporan) {
  hasil("glue memuat wasm lewat fetch (bukan XHR/Node)", diminta.some((n) => n.endsWith(".wasm")), diminta.join(" "));
  hasil(
    "yang dimuat build satu utas (bukan -threaded)",
    diminta.includes("ort-wasm-simd.wasm") && !diminta.some((n) => n.includes("threaded")),
    diminta.join(" ")
  );
  hasil("memori wasm terdeteksi (glue benar-benar berjalan)", memori.length > 0, `${memori.length} memori`);
  hasil(
    "tidak satu pun memori wasm bersama (aman tanpa COEP)",
    memori.length > 0 && !memori.some((m) => m.bersama),
    memori.map((m) => `${m.sumber}${m.bersama ? " bersama" : ""}`).join(", ")
  );
  hasil("nama masuk sesuai kontrak model", "tokens,elo_self,elo_oppo" === laporan.masuk, laporan.masuk);
  hasil("nama keluar sesuai kontrak model", "logits_move,logits_value" === laporan.keluar, laporan.keluar);

  const urai = uraiBatch(laporan.logitLangkah, laporan.logitNilai, berkas.posisi);
  const [putih, hitam] = urai;

  hasil("batch dua posisi terurai", 2 === urai.length, String(urai.length));
  hasil(
    "posisi awal: e2e4 paling manusiawi",
    "e2e4" === Object.keys(putih.kebijakan)[0],
    Object.keys(putih.kebijakan).slice(0, 3).join(" ")
  );
  hasil(
    "posisi awal: d2d4 kedua",
    "d2d4" === Object.keys(putih.kebijakan)[1],
    Object.keys(putih.kebijakan).slice(0, 3).join(" ")
  );
  hasil("posisi awal: nilai mendekati seimbang", Math.abs(putih.cp) < 100, `cp ${putih.cp}`);
  // Baris ini yang paling sering meledak kalau pencerminan meleset: tanpa
  // pencerminan, "langkah terbaik hitam" keluar dalam koordinat putih.
  hasil(
    "posisi hitam: balasan atas 1.e4 dalam koordinat hitam",
    ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5", "g8f6"].includes(Object.keys(hitam.kebijakan)[0]),
    Object.keys(hitam.kebijakan).slice(0, 3).join(" ")
  );
  // Rating 1700 lawan 1500: pihak yang lebih kuat (hitam) harus lebih baik.
  hasil("rating memengaruhi nilai (hitam 1700 > putih 1500)", hitam.menang < 0.5, hitam.menang.toFixed(4));
  hasil(
    "dua posisi sekali jalan di bawah 10 detik",
    laporan.ms < 10_000,
    `${laporan.ms} ms untuk ${berkas.jumlah} posisi`
  );
  console.log(`  · inferensi ${berkas.jumlah} posisi dalam ${laporan.ms} ms (${Math.round(laporan.ms / berkas.jumlah)} ms/posisi)`);
}

console.log(`\n${gagal ? "GAGAL" : "OK"} — ${lulus} lulus, ${gagal} gagal`);
