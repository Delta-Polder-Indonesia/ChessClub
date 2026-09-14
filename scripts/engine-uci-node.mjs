/**
 * Klien UCI Node untuk engine Stockfish WASM yang sesungguhnya.
 *
 * Loader `public/engines/<folder>/<nama>.js` mendukung mode Node (uji
 * `require.main === module` di dalam loader): ia membaca perintah UCI dari
 * stdin dan menulis respons ke stdout. Dengan itu engine riil — sama persis
 * dengan yang dimuat peramban — bisa diuji tanpa browser.
 *
 * Catatan: loader memakai `require("worker_threads")` di deteksi lingkungannya,
 * sehingga WAJIB dijalankan sebagai CommonJS. Karena `package.json` repo ini
 * bertipe "module", loader disalin ke direktori sementara sebagai `.cjs`
 * (bawaan CommonJS) beserta `package.json` {"type":"commonjs"}; berkas `.wasm`
 * cukup di-symlink agar tidak perlu menyalin ratusan MB.
 *
 * Protokol yang diimplementasikan meniru `src/lib/engineCatur.js`
 * (parsing baris `info`, preferensi baris non-bound, bentuk `cari()`),
 * sehingga hasil uji mencerminkan apa yang dibaca halaman Analisa.
 */
import { spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Satu per satu dengan `DAFTAR_ENGINE` di src/lib/engineCatur.js. */
export const DAFTAR_ENGINE_NODE = [
  {
    id: "stockfish-18-lite",
    label: "Stockfish 18 Lite",
    dir: "stockfish-18-lite-single",
  },
  {
    id: "stockfish-17-lite",
    label: "Stockfish 17 Lite",
    dir: "stockfish-17-lite-single",
  },
  {
    id: "stockfish-18",
    label: "Stockfish 18 (NNUE penuh)",
    dir: "stockfish-18-single",
  },
  {
    id: "stockfish-17",
    label: "Stockfish 17 (NNUE penuh)",
    dir: "stockfish-17-single",
  },
];

/** Ambil bilangan dari potongan baris UCI, mis. "depth 17" → 17. */
function angkaUci(baris, kunci) {
  const cocok = baris.match(new RegExp(`(?:^| )${kunci} (-?\\d+)`));
  return cocok ? Number(cocok[1]) : null;
}

/** Uraikan baris "info" berskor (cp/mate). Mirip engineCatur.js. */
export function uraiInfo(baris) {
  const cp = angkaUci(baris, "cp");
  const mate = angkaUci(baris, "mate");
  if (cp === null && mate === null) return null;
  const pv = (baris.split(" pv ")[1] || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 14);
  const cocokWdl = baris.match(/ wdl (\d+) (\d+) (\d+)(?: |$)/);
  return {
    kedalaman: angkaUci(baris, "depth") ?? 0,
    cp,
    mate,
    pv,
    multipv: angkaUci(baris, "multipv"),
    wdl: cocokWdl ? [Number(cocokWdl[1]), Number(cocokWdl[2]), Number(cocokWdl[3])] : null,
    adaBatas: baris.includes(" lowerbound ") || baris.includes(" upperbound "),
  };
}

/** Siapkan runner CJS sementara; mengembalikan {dir, loader, bersihkan}. */
function siapkanRunner(engine) {
  const dirAsli = path.join(AKAR, "public", "engines", engine.dir);
  const namaAsli = `${engine.dir}.js`;
  if (!existsSync(path.join(dirAsli, namaAsli))) {
    throw new Error(`loader engine tidak ditemukan: ${dirAsli}/${namaAsli}`);
  }

  const dir = path.join(os.tmpdir(), `kci-engine-${engine.dir}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "package.json"), '{"type":"commonjs"}\n');
  const loader = path.join(dir, `${engine.dir}.cjs`);
  copyFileSync(path.join(dirAsli, namaAsli), loader);
  // berkas .wasm (satu utuh atau terpecah -part-N) cukup di-symlink.
  for (const berkas of readdirSync(dirAsli)) {
    if (!berkas.endsWith(".wasm")) continue;
    symlinkSync(
      path.join(dirAsli, berkas),
      path.join(dir, berkas),
      "file"
    );
  }
  return {
    dir,
    loader,
    bersihkan: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export class UciEngine {
  /**
   * @param {object} engine  entri DAFTAR_ENGINE_NODE
   * @param {{timeout?: number, timeoutMulai?: number}} [opsi]
   */
  constructor(engine, { timeout = 60_000, timeoutMulai = 120_000 } = {}) {
    this.engine = engine;
    this.timeout = timeout;
    this.timeoutMulai = timeoutMulai;
    this.proc = null;
    this.buf = "";
    this.log = [];
    this.logGalat = [];
    this.janjiBestmove = null; // { selesaikan, tolak }
    this.pemantau = new Set(); // { cocok(baris), tolak(galat) }
    this.infoTerakhir = null;
    this.barisPv = null; // Map peringkat→info saat pencarian MultiPV
    this.multiPvAktif = 1;
    this.kodeTutup = null;
    this.tutupTerjeda = null;
    this.runner = null;
  }

  /** Jalankan proses engine. */
  mulai() {
    this.runner = siapkanRunner(this.engine);
    this.proc = spawn(process.execPath, [this.runner.loader], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.proc.stdout.on("data", (d) => this.terima(d.toString()));
    this.proc.stderr.on("data", (d) => {
      for (const baris of d.toString().split("\n")) {
        if (baris.trim()) {
          this.logGalat.push(baris);
          if (this.logGalat.length > 60) this.logGalat.shift();
        }
      }
    });
    this.tutupTerjeda = new Promise((selesai) => {
      this.proc.on("close", (kode) => {
        this.kodeTutup = kode;
        this.gagalkanTerjeda(
          new Error(`proses engine berakhir dini (kode ${kode})`)
        );
        selesai(kode);
      });
    });
  }

  /** Tolak semua penunggu saat proses mati — jangan menggantung. */
  gagalkanTerjeda(galat) {
    for (const pantau of [...this.pemantau]) {
      this.pemantau.delete(pantau);
      pantau.tolak(galat);
    }
    if (this.janjiBestmove) {
      const janji = this.janjiBestmove;
      this.janjiBestmove = null;
      janji.tolak(galat);
    }
  }

  terima(teks) {
    this.buf += teks;
    let indeks;
    while ((indeks = this.buf.indexOf("\n")) >= 0) {
      const baris = this.buf.slice(0, indeks).replace(/\r$/, "");
      this.buf = this.buf.slice(indeks + 1);
      this.proses(baris);
    }
  }

  proses(baris) {
    if (!baris.trim()) return;
    this.log.push(baris);
    if (this.log.length > 400) this.log.splice(0, this.log.length - 400);

    if (baris.startsWith("info ")) {
      const info = uraiInfo(baris);
      if (info) {
        // Rekam semua peringkat saat pencarian MultiPV (batch terdalam
        // menimpa yang lama). `infoTerakhir` hanya dari peringkat 1 — pada
        // MultiPV, baris terakhir justru peringkat terburuk.
        if (this.barisPv) {
          this.barisPv.set(info.multipv ?? 1, info);
        }
        const peringkatPertama = (info.multipv ?? 1) === 1;
        if (peringkatPertama && (!info.adaBatas || !this.infoTerakhir)) this.infoTerakhir = info;
      }
      return;
    }

    if (baris.startsWith("bestmove")) {
      const uci = (baris.split(/\s+/)[1] || "").trim();
      const info = this.infoTerakhir;
      const daftarPv = this.barisPv
        ? [...this.barisPv.values()]
            .filter((x) => !x.adaBatas && x.pv.length)
            .sort((a, b) => (a.multipv ?? 1) - (b.multipv ?? 1))
        : null;
      this.barisPv = null;
      if (this.multiPvAktif !== 1) {
        this.kirim("setoption name MultiPV value 1");
        this.multiPvAktif = 1;
      }
      this.infoTerakhir = null;
      const janji = this.janjiBestmove;
      this.janjiBestmove = null;
      if (janji) janji.selesaikan({ uci, info: info ?? null, daftarPv });
      return;
    }

    for (const pantau of [...this.pemantau]) {
      if (pantau.cocok(baris)) {
        this.pemantau.delete(pantau);
        pantau.selesaikan(baris);
      }
    }
  }

  kirim(perintah) {
    this.proc.stdin.write(`${perintah}\n`);
  }

  /**
   * Tunggu sampai ada baris (kini atau yang datang kemudian) yang cocok.
   * Baris yang sudah lewat diperiksa ulang sehingga `uciok` yang tiba
   * sebelum pemantau terdaftar tidak hilang.
   */
  tungguBaris(predikat, label, timeout = this.timeout) {
    const cocokLama = this.log.find(predikat);
    if (cocokLama) return Promise.resolve(cocokLama);
    return new Promise((selesaikan, tolak) => {
      const timer = setTimeout(() => {
        this.pemantau.delete(pantau);
        tolak(new Error(`time-out menunggu "${label}" (${timeout} ms)`));
      }, timeout);
      const pantau = {
        cocok: (baris) => predikat(baris),
        selesaikan: (baris) => {
          clearTimeout(timer);
          selesaikan(baris);
        },
        tolak: (galat) => {
          clearTimeout(timer);
          tolak(galat);
        },
      };
      this.pemantau.add(pantau);
    });
  }

  /**
   * UCI handshake: uci → uciok, setoption, isready → readyok.
   * Mengembalikan baris identifikasi engine (mis. "id name Stockfish ...").
   */
  async siap() {
    this.kirim("uci");
    this.kirim("setoption name Hash value 16");
    this.kirim("setoption name Threads value 1");
    this.kirim("setoption name Ponder value false");
    // Sama seperti engineCatur.js: wdl dipakai anti-cheat. Build tanpa opsi
    // ini hanya membalas "No such option" — pencarian tetap normal.
    this.kirim("setoption name UCI_ShowWDL value true");
    this.kirim("isready");
    const idBaris = await this.tungguBaris(
      (b) => b.startsWith("id name"),
      "id name",
      this.timeoutMulai
    );
    await this.tungguBaris((b) => b === "uciok", "uciok", this.timeoutMulai);
    await this.tungguBaris((b) => b === "readyok", "readyok", this.timeoutMulai);
    return idBaris;
  }

  /**
   * Analisis satu posisi sampai "bestmove".
   * @param {{fen: string, kedalaman?: number|null, mate?: number|null,
   *   movetime?: number|null, multiPv?: number|null}} opsi
   * `multiPv > 1` mengaktifkan MultiPV: hasil memuat `daftarPv`, kandidat
   * terurut peringkat (persis bentuk engineCatur.js).
   */
  cari({ fen, kedalaman = null, mate = null, movetime = null, multiPv = 1 }) {
    if (this.janjiBestmove) {
      return Promise.reject(
        new Error("pencarian sebelumnya belum selesai — tunggu bestmove dulu")
      );
    }
    if (multiPv !== this.multiPvAktif) {
      this.kirim(`setoption name MultiPV value ${multiPv}`);
      this.multiPvAktif = multiPv;
    }
    this.barisPv = multiPv > 1 ? new Map() : null;
    this.kirim(`position fen ${fen}`);
    const batas = [];
    if (mate) batas.push(`mate ${mate}`);
    if (kedalaman) batas.push(`depth ${kedalaman}`);
    if (movetime) batas.push(`movetime ${movetime}`);
    this.kirim(`go ${batas.length ? batas.join(" ") : "movetime 800"}`);
    return new Promise((selesaikan, tolak) => {
      let sudah = false;
      const timer = setTimeout(() => {
        if (sudah) return;
        sudah = true;
        if (this.janjiBestmove?.tolak === tolakAkhir) this.janjiBestmove = null;
        tolak(new Error(`time-out pencarian (${this.timeout} ms)`));
      }, this.timeout);
      const tolakAkhir = (galat) => {
        if (sudah) return;
        sudah = true;
        clearTimeout(timer);
        tolak(galat);
      };
      this.janjiBestmove = {
        selesaikan: (hasil) => {
          if (sudah) return;
          sudah = true;
          clearTimeout(timer);
          selesaikan(hasil);
        },
        tolak: tolakAkhir,
      };
    });
  }

  /** Buang tabel hash (ucinewgame) lalu tunggu siap. */
  async gameBaru() {
    this.kirim("ucinewgame");
    this.kirim("isready");
    await this.tungguBaris((b) => b === "readyok", "readyok (ucinewgame)");
  }

  setop() {
    this.kirim("stop");
  }

  async tutup() {
    try {
      this.proc.kill();
    } catch {
      /* sudah mati */
    }
    await this.tutupTerjeda;
    this.runner?.bersihkan();
  }

  galatDiagnostics() {
    return (
      `\n--- log engine (${this.engine.label}) terakhir ---\n` +
      this.log.slice(-25).join("\n") +
      (this.logGalat.length
        ? `\n--- stderr ---\n${this.logGalat.slice(-15).join("\n")}`
        : "") +
      "\n-----------------------------------------------"
    );
  }
}
