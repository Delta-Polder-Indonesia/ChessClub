/**
 * Pemuat engine sunfish (public/engines/sunfish/sunfish.js) untuk Node.
 *
 * Berkas engine adalah UMD CommonJS, sedangkan repo ini bertipe "module".
 * Alih-alih menyalin berkas ke direktori sementara seperti
 * `scripts/engine-uci-node.mjs` (Stockfish butuh itu karena memuat .wasm
 * tetangga), sunfish cukup dievaluasi sebagai modul CommonJS di dalam proses:
 * satu berkas, tanpa aset pendamping.
 *
 * Setiap pemanggilan `muatSunfish()` menghasilkan instance modul TERPISAH —
 * penting untuk uji, karena state engine (posisi, opsi, PRNG) bersifat
 * global di dalam modul sehingga dua profil tidak boleh berbagi satu salinan.
 *
 * Di Node `nextTick` engine bersifat sinkron, jadi `perintah("go depth 2")`
 * mengembalikan baris keluaran setelah pencarian benar-benar selesai.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BERKAS_SUNFISH = path.join(AKAR, "public", "engines", "sunfish", "sunfish.js");

const require = createRequire(import.meta.url);
let sumber = null;

/** Baca sumber engine sekali lalu pakai ulang. */
function sumberSunfish() {
  if (null === sumber) sumber = readFileSync(BERKAS_SUNFISH, "utf8");
  return sumber;
}

/** Satu instance engine sunfish yang berdiri sendiri. */
export function muatSunfish() {
  const modul = { exports: {} };
  // eslint-disable-next-line no-new-func
  const bungkus = new Function("module", "exports", "require", "global", "self", sumberSunfish());
  bungkus(modul, modul.exports, require, globalThis, undefined);
  const sunfish = modul.exports;

  /** Kirim satu perintah UCI; mengembalikan daftar baris keluaran engine. */
  const perintah = (teks) => {
    const keluaran = [];
    sunfish.engine(teks, (baris) => keluaran.push(String(baris)));
    return keluaran;
  };

  return {
    sunfish,
    perintah,
    /** Pasang profil pembodohan (lihat src/.../mesinLemah.js). */
    aturProfil(daftarPerintah) {
      for (const teks of daftarPerintah) perintah(teks);
    },
    /**
     * Cari langkah terbaik dari satu FEN.
     * @returns {string} langkah UCI, atau "" bila engine menjawab "(none)".
     */
    cari(fen, { kedalaman = 2, movetime = null } = {}) {
      perintah(`position fen ${fen}`);
      const batas = [`depth ${kedalaman}`];
      if (movetime) batas.push(`movetime ${movetime}`);
      const keluaran = perintah(`go ${batas.join(" ")}`);
      const baris = keluaran.find((b) => b.startsWith("bestmove")) || "";
      const uci = (baris.split(/\s+/)[1] || "").trim();
      return "(none)" === uci ? "" : uci;
    },
  };
}

/**
 * Jalankan engine pada lingkungan Web Worker TIRUAN.
 *
 * Cabang worker di dalam engine (`onmessage`/`postMessage`, jeda antarbatch
 * lewat setTimeout) tidak pernah tersentuh pemuat Node biasa, padahal justru
 * itu yang dipakai peramban. Simulasi ini memberi engine global palsu yang
 * memenuhi deteksi lingkungannya, lalu mengembalikan kanal pesan dua arah.
 */
export function muatSunfishWorker() {
  const modul = { exports: {} };
  const keluaran = [];
  function WorkerGlobalScope() {}
  function WorkerNavigator() {}
  const navigatorPalsu = Object.create(WorkerNavigator.prototype);
  // eslint-disable-next-line no-new-func
  const bungkus = new Function(
    "module",
    "exports",
    "require",
    "global",
    "self",
    "navigator",
    "WorkerGlobalScope",
    "WorkerNavigator",
    "importScripts",
    "postMessage",
    "onmessage",
    `${sumberSunfish()}\n;return onmessage;`
  );
  const onmessage = bungkus(
    modul,
    modul.exports,
    require,
    undefined,
    {},
    navigatorPalsu,
    WorkerGlobalScope,
    WorkerNavigator,
    () => {},
    (pesan) => keluaran.push(String(pesan)),
    null
  );
  if ("function" !== typeof onmessage) throw new Error("cabang Web Worker sunfish tidak aktif");
  return {
    keluaran,
    kirim(teks) {
      onmessage({ data: teks });
    },
    /** Kosongkan penampung keluaran (mis. sebelum pencarian berikutnya). */
    bersihkan() {
      keluaran.length = 0;
    },
    /** Tunggu sampai baris yang cocok muncul (pencarian worker asinkron). */
    tunggu(pola, batasMs = 10_000) {
      return new Promise((selesai, gagal) => {
        const mulai = Date.now();
        const periksa = () => {
          const baris = keluaran.find((b) => pola.test(b));
          if (baris) return selesai(baris);
          if (Date.now() - mulai > batasMs) return gagal(new Error(`time-out menunggu ${pola}`));
          setTimeout(periksa, 5);
          return undefined;
        };
        periksa();
      });
    },
  };
}
