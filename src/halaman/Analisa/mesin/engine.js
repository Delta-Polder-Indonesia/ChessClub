/**
 * Mesin analisis halaman Analisa.
 *
 * INI BAGIAN YANG DITUKAR dari Brilliant-Chess. Upstream membuka worker
 * Stockfish miliknya sendiri, mengirim `go depth` mentah, lalu membaca ulang
 * semua pesan worker dengan `addEventListener` — antreannya balapan, dan
 * skor dibaca dari potongan teks UCI yang rapuh. Di proyek ini analisis
 * dijalankan lewat engine lokal yang sudah dipakai halaman Papan Interaktif
 * dan Teka-Teki: `src/lib/engineCatur.js` (Stockfish WASM di `public/engines`).
 *
 * Bentuk fungsi (`parsePGN`, `parseMove`, `parsePosition`, `formatSquare`, …)
 * sengaja dipertahankan seperti upstream supaya komponen UI hasil port tidak
 * perlu ditulis ulang; yang berubah hanya cara engine-nya bicara.
 *
 * Konvensi angka mengikuti upstream: `staticEval = ["cp", "34"]` atau
 * `["mate", "2"]`, relatif terhadap pihak yang bergilir (konvensi UCI), dan
 * dipakai apa adanya oleh ./penilaian.js. Skakmat yang sudah dikirim ditulis
 * `["mate", "0"]` (lihat ./evaluasi.js) — penulis baru dilarang mengeluarkan
 * bentuk warisan `["mate"]` tanpa angka.
 */

import { Chess } from "chess.js";
import { pecahMultiPgn } from "../../../lib/pgnRingan.js";
import { EngineCatur, cariEngine } from "../../../lib/engineCatur.js";
import { hashUntukEngine } from "./cekWasm.js";
import { getMoveRating, invertColor, isForced, isSacrifice } from "./penilaian.js";
import { apakahLangkahKritis, cpKandidat } from "./langkahKritis.js";
import { MATE_DISAMPAIKAN, STATUS_EVALUASI } from "./evaluasi.js";

const HURUF_PAPAN = "abcdefgh".split("");

export const GALAT_BATAL = "canceled";
export const GALAT_PGN = "pgn";
export const GALAT_FEN = "fen";
/** Engine mati / worker gagal di tengah analisis (bukan pembatalan pengguna). */
export const GALAT_MESIN = "mesin";

export function galat(pesan) {
  const e = new Error(pesan);
  e.kunci = pesan;
  return e;
}

/* ------------------------------------------------------------- kotak */

export function formatSquare(kotak) {
  return { col: HURUF_PAPAN.indexOf(kotak[0]), row: Number(kotak[1]) - 1 };
}

export function deformatSquare({ col, row }) {
  return `${HURUF_PAPAN[col]}${row + 1}`;
}

export { invertColor };

export function getCastle(san) {
  return san === "O-O" ? "k" : san === "O-O-O" ? "q" : undefined;
}

/** Langkah UCI (dari engine) → SAN, agar bisa dibandingkan dengan langkah pemain. */
export function moveToSan(move, coronation, fen) {
  if (!move || !move.length) return "";
  try {
    const chess = new Chess(fen);
    return chess.move({
      from: deformatSquare(move[0]),
      to: deformatSquare(move[1]),
      promotion: coronation,
    }).san;
  } catch {
    return "";
  }
}

/* --------------------------------------------------------------- engine */

/**
 * Jumlah kandidat MultiPV yang direkam `parsePGN` untuk tiap posisi.
 *
 * Anti-cheat yang serius tidak menilai langkah dari `bestmove` tunggal saja:
 * setiap posisi dianalisis dengan MultiPV sehingga langkah pemain bisa
 * DIPERINGKAT di antara N kandidat terbaik (rank 1 = langkah terbaik, 2–5 =
 * masih dalam kelompok engine, di luar daftar = paling buruk). Nilai 5 adalah
 * keseimbangan biaya (MultiPV memperlambat pencarian ±20–40% pada kedalaman
 * sama) dan ketajaman sinyal; Lichess memakai pendekat serupa untuk metrik
 * "move match". Konstanta ini juga membentuk AMBANG.peringkatJenuh di
 * ./antiCheat.js — ubah keduanya bersamaan.
 */
export const MULTI_PV = 5;

export class EngineAnalisis {
  /**
   * @param {{idEngine?: string, kedalaman?: number, threads?: number, hash?: number}} [opsi]
   */
  constructor({ idEngine, kedalaman = 13, threads = 1, hash = hashUntukEngine() } = {}) {
    const pilihan = cariEngine(idEngine);
    this.idEngine = pilihan.id;
    this.labelEngine = pilihan.label;
    this.kedalaman = kedalaman;
    this.memuat = null;
    this.engine = new EngineCatur({ url: pilihan.url, hash, threads });
  }

  /** Unduh worker + tunggu "readyok". Boleh dipanggil berulang. */
  siapkan() {
    this.memuat ||= this.engine.mulai();
    return this.memuat;
  }

  /**
   * Terapkan opsi UCI (Hash/Threads). Nilai tersimpan lebih dulu sehingga
   * worker yang belum dimuat memakainya saat `mulai()`, lalu setoption
   * dikirim ke worker yang sudah hidup (kirim aman bila worker belum ada).
   */
  terapkanOpsi({ hash, threads }) {
    if (Number.isFinite(hash)) {
      this.engine.hash = hash;
      this.engine.kirim(`setoption name Hash value ${hash}`);
    }
    if (Number.isFinite(threads)) {
      this.engine.threads = threads;
      this.engine.kirim(`setoption name Threads value ${threads}`);
    }
  }

  /**
   * Analisis satu posisi. Beresolusi setelah engine menerbitkan "bestmove",
   * sehingga pencarian berikutnya selalu memakai tabel hash yang sudah panas.
   * `sinyal` (AbortSignal) menghentikan pencarian aktif bila pengguna batal.
   * `multiPv > 1` mengaktifkan MultiPV: hasilnya berupa `daftarKandidat`,
   * kandidat terbaik terurut peringkat — bahan metrik peringkat anti-cheat.
   */
  async cari(fen, { kedalaman = this.kedalaman, sinyal = null, multiPv = 1 } = {}) {
    if (sinyal?.aborted) throw galat(GALAT_BATAL);
    await this.siapkan();
    /*
     * Batal selama engine masih diunduh/disiapkan tidak punya pendengar abort
     * (baru dipasang di bawah). Cek ulang di sini supaya pencarian yang
     * "dibatalkan saat memuat" tidak tetap berjalan sampai kedalaman penuh —
     * cuma unduhan wasm yang terlanjur selesai, bukan analisisnya.
     */
    if (sinyal?.aborted) throw galat(GALAT_BATAL);

    const hentikan = () => this.engine.setop();
    if (sinyal) sinyal.addEventListener("abort", hentikan, { once: true });

    let hasil;
    try {
      hasil = await this.engine.cari({ fen, kedalaman, multiPv });
    } finally {
      if (sinyal) sinyal.removeEventListener("abort", hentikan);
    }

    if (sinyal?.aborted) throw galat(GALAT_BATAL);

    const { uci, info, daftarPv } = hasil;
    /*
     * Skor yang tak-terbaca (`undefined`/`null`/NaN dari worker) menjadi `[]`
     * di sini, BUKAN `["mate", "undefined"]` atau `["cp", "null"]`: string
     * sampah itu lolos sebagai angka di beberapa pembaca lama. Entri `[]`
     * ditolak gerbang validasi `getMoveRating` dan langkahnya dicap "gagal"
     * (lihat `statusEvaluasi`), bukan dilabeli kualitas palsu.
     */
    /*
     * Ketiadaan diuji EKSPLISIT (null/undefined), bukan lewat Number():
     * `Number(null)` adalah 0 (finite!) sehingga uji `isFinite` mentah
     * mengubah setiap posisi cp biasa (mate: null) menjadi ["mate","0"].
     * Nilai 0 yang ASLI (angka, bukan null) tetap berarti mate-0.
     */
    const mateMentah = info?.mate;
    const cpMentah = info?.cp;
    const mateInfo = mateMentah === null || mateMentah === undefined ? NaN : Number(mateMentah);
    const cpInfo = cpMentah === null || cpMentah === undefined ? NaN : Number(cpMentah);
    const staticEval = Number.isFinite(mateInfo)
      ? ["mate", String(Math.trunc(mateInfo))]
      : Number.isFinite(cpInfo)
        ? ["cp", String(Math.trunc(cpInfo))]
        : [];
    const langkah = uci && uci !== "(none)" ? uci : null;

    return {
      staticEval,
      bestMove: langkah ? [formatSquare(langkah.slice(0, 2)), formatSquare(langkah.slice(2, 4))] : undefined,
      bestMoveCoronation: langkah && langkah.length > 4 ? langkah[4] : undefined,
      kedalamanTercapai: info?.kedalaman ?? 0,
      pv: info?.pv ?? [],
      /*
       * Kandidat MultiPV → bentuk ringkas: langkah pertama tiap baris PV
       * (string UCI), skornya, dan WDL bila engine menyiarkannya. Entri
       * tanpa langkah (baris rusak) dibuang; peringkat tetap asli dari
       * engine sehingga celah antar-peringkat tetap terbaca.
       */
      daftarKandidat: (daftarPv ?? [])
        .map((x) => ({
          peringkat: x.peringkat,
          uci: x.pv?.[0] ?? null,
          cp: x.cp ?? null,
          mate: x.mate ?? null,
          wdl: x.wdl ?? null,
        }))
        .filter((x) => x.uci),
    };
  }

  /** Mulai partai baru: buang tabel hash supaya tidak tercampur. */
  gameBaru() {
    this.engine.gameBaru();
  }

  setop() {
    this.engine.setop();
  }

  /** Bebaskan worker (panggil saat halaman ditutup). */
  hancurkan() {
    this.engine.tamat();
    this.memuat = null;
  }
}

/* ------------------------------------------------------------- metadata */

const TANPA_NAMA = "Unknown";
const TANPA_ELO = "NOELO";

function getPlayers(headers) {
  return [
    { name: headers.White ?? TANPA_NAMA, elo: headers.WhiteElo ?? TANPA_ELO },
    { name: headers.Black ?? TANPA_NAMA, elo: headers.BlackElo ?? TANPA_ELO },
  ];
}

/**
 * "300+3" → 300, "15" → 900 (detik per pemain, taksiran lama upstream),
 * "-" → 0. Upstream memakai Number() mentah sehingga kontrol waktu increment
 * menjadi NaN dan jam di papan menampilkan angka aneh.
 */
export function waktuDariPgn(headers) {
  const kendali = String(headers.TimeControl ?? "").trim();
  if (!kendali || kendali === "-") return 0;
  const [dasar] = kendali.split("+");
  const angka = Number(dasar);
  return Number.isFinite(angka) ? angka : 0;
}

/**
 * Uraikan tag [%clk H:MM:SS] atau [%clk MM:SS] menjadi detik.
 */
export function parseClockString(str) {
  if (!str) return null;
  const match = str.match(/\[%clk\s+([0-9]+(?::[0-9]+)+(?:\.[0-9]+)?)\]/i);
  if (!match) return null;
  const parts = match[1].split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return Math.round(h * 3600 + m * 60 + s);
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return Math.round(m * 60 + s);
  }
  return null;
}

/**
 * Ekstrak sisa waktu jam (detik) untuk Putih & Hitam pada setiap posisi/langkah partai.
 */
export function ekstrakDaftarClock(chess, rawPgn, riwayat, waktuDasar = 0) {
  const mapKomentar = new Map();
  try {
    const daftarKomentar = typeof chess.getComments === "function" ? chess.getComments() : [];
    for (const item of daftarKomentar) {
      if (item.fen && item.comment) {
        const clk = parseClockString(item.comment);
        if (clk !== null) {
          mapKomentar.set(item.fen, clk);
        }
      }
    }
  } catch {}

  const sequentialClocks = [];
  const regexClk = /\[%clk\s+([0-9]+(?::[0-9]+)+(?:\.[0-9]+)?)\]/gi;
  let match;
  while ((match = regexClk.exec(rawPgn)) !== null) {
    const parts = match[1].split(":").map(Number);
    let sec = null;
    if (parts.length === 3) sec = Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
    else if (parts.length === 2) sec = Math.round(parts[0] * 60 + parts[1]);
    if (sec !== null) sequentialClocks.push(sec);
  }

  let curWhite = waktuDasar || (sequentialClocks[0] ?? null);
  let curBlack = waktuDasar || (sequentialClocks[1] ?? curWhite);

  const hasil = [{ white: curWhite, black: curBlack }];

  for (let i = 0; i < riwayat.length; i++) {
    const m = riwayat[i];
    let clk = null;
    if (sequentialClocks.length === riwayat.length) {
      clk = sequentialClocks[i];
    } else if (mapKomentar.has(m.after)) {
      clk = mapKomentar.get(m.after);
    } else if (i < sequentialClocks.length) {
      clk = sequentialClocks[i];
    }

    if (m.color === "w") {
      if (clk !== null) curWhite = clk;
    } else {
      if (clk !== null) curBlack = clk;
    }

    hasil.push({ white: curWhite, black: curBlack });
  }

  return hasil;
}

function getResult(headers, pgn) {
  if (headers.Result && headers.Result !== "*") return headers.Result;
  const akhir = pgn.trim().split(/\s+/).pop() ?? "";
  return ["1-0", "0-1", "1/2-1/2", "*"].includes(akhir) ? akhir : "";
}

/** Buang komentar `{…}` dan kolom `%` yang kadang membuat parser menolak. */
function bersihkanPgn(pgn) {
  // Komentar "%" bisa muncul di MANA PUN dalam baris (bukan hanya di awal),
  // jadi hapus dari "%" sampai akhir baris — kecuali di dalam tanda kutip
  // header (mis. [Event "100% menang"]) yang dilindungi dulu.
  const kutip = [];
  const dilindungi = pgn.replace(/"[^"]*"/g, (s) => {
    kutip.push(s);
    return `\u0000${kutip.length - 1}\u0000`;
  });
  const hasil = dilindungi
    .replace(/%[^\n]*/g, " ")
    .replace(/\{[^{}]*\}/gs, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return hasil.replace(/\u0000(\d+)\u0000/g, (_, i) => kutip[Number(i)]);
}

/**
 * Muat PGN; kalau mentahnya ditolak, coba lagi versi yang sudah dibersihkan.
 *
 * TAKSONOMI MASUKAN (hasil prob chess.js, didokumentasikan agar tak diusut
 * ulang): variasi `(...)`, NAG `$n`, komentar `{...}`, `%clk`, SetUp/FEN,
 * dan CRLF DITERIMA; yang DITOLAK (melempar → GALAT_PGN): variasi yang
 * mengandung token hasil di dalamnya, nama tag berkarakter non-standar
 * (mis. tanda hubung), dan nomor langkah tanpa titik ("1 e4"). Berkas
 * MULTI-partai tidak sampai ke sini — sudah dipecah di `bacaPartaiPGN`.
 */
function muatPgn(chess, rawPgn) {
  try {
    chess.loadPgn(rawPgn, { strict: false });
    return rawPgn;
  } catch (galatAsli) {
    try {
      chess.loadPgn(bersihkanPgn(rawPgn), { strict: false });
      return rawPgn;
    } catch {
      throw galatAsli;
    }
  }
}

/* ------------------------------------------------------------ per langkah */

/** Posisi sebelum langkah pertama dianalisis agar rating langkah 1 adil. */
export async function parsePosition(mesin, chess, depth, sinyal, handleAbort, multiPv = 1) {
  const fen = chess.fen();
  const color = chess.turn();

  let hasil;
  try {
    hasil = await mesin.cari(fen, { kedalaman: depth, sinyal, multiPv });
  } catch (e) {
    // Pembatalan oleh pengguna → serahkan ke handleAbort (menghentikan
    // seluruh alur). Kegagalan engine yang sesungguhnya TIDAK boleh
    // menyamar jadi "canceled": kalau ditelan di sini, halaman kembali ke
    // formulir tanpa pesan apa pun dan tampak seperti tombolnya mati.
    if (sinyal?.aborted || e?.kunci === GALAT_BATAL) {
      handleAbort?.();
      hasil = { staticEval: [], bestMove: undefined, bestMoveCoronation: undefined, daftarKandidat: [] };
    } else {
      throw galat(GALAT_MESIN);
    }
  }

  const { staticEval, bestMove, bestMoveCoronation, daftarKandidat } = hasil;

  return {
    fen,
    bestMove,
    bestMoveSan: bestMove ? moveToSan(bestMove, bestMoveCoronation, fen) : undefined,
    color,
    previousStaticEvals: [staticEval],
    // Kandidat MultiPV posisi AWAL — usulan untuk langkah pertama pemain.
    kandidat: daftarKandidat ?? [],
  };
}

/**
 * Analisis satu langkah. Seluruh parameter berawalan `previous` adalah milik
 * entri SEBELUMNYA (`moves[i - 1]`), bukan entri yang sedang dibuat:
 * `previousStaticEvals` (eval posisi sebelum langkah), `previousBestMoveSan`
 * (usulan engine di posisi itu), `previousSacrifice` (pengorbanan langkah
 * sebelumnya) dan `previousKandidat` (kandidat MultiPV posisi itu — bahan
 * label "kritis"). Pola yang sama dipakai ./antiCheat.js saat membaca
 * `moves[i - 1].kandidat`.
 */
export async function parseMove(mesin, depth, move, chess, previousStaticEvals, previousBestMoveSan, previousSacrifice, openings, handleAbort, sinyal, multiPv = 1, previousKandidat = []) {
  if (sinyal?.aborted) handleAbort?.();

  const movement = [move.from, move.to].map((kotak) => formatSquare(kotak));
  // Langkah yang DIMAINKAN dalam string UCI — kunci pencocokan peringkat
  // anti-cheat terhadap kandidat MultiPV posisi sebelumnya.
  const uciLangkah = `${move.from}${move.to}${move.promotion ?? ""}`;

  const fen = move.after;
  chess.load(fen);

  const color = invertColor(move.color);
  const capture = move.captured;
  const san = move.san;
  const castle = getCastle(move.san);

  let staticEval;
  let bestMove;
  let bestMoveCoronation;
  let kandidat = [];
  let sacrifice = false;
  let forced = false;

  if (chess.isGameOver()) {
    // Posisi mati: engine tidak punya langkah lagi. Upstream hanya menangani
    // skakmat sehingga remis (pat/stalemate) ikut "dianalisis" dan menghasilkan
    // skor kosong — di sini keduanya dipotong dengan eval yang benar.
    sacrifice = false;
    staticEval = chess.isCheckmate() ? ["mate", String(MATE_DISAMPAIKAN)] : ["cp", "0"];
    bestMove = undefined;
    bestMoveCoronation = undefined;
    kandidat = [];
  } else {
    sacrifice = move.promotion ? false : isSacrifice(move);

    try {
      ({ staticEval, bestMove, bestMoveCoronation, daftarKandidat: kandidat } = await mesin.cari(fen, {
        kedalaman: depth,
        sinyal,
        multiPv,
      }));
    } catch (e) {
      // Lihat catatan yang sama di parsePosition: hanya pembatalan yang
      // boleh ditelan, kegagalan engine harus terlihat oleh pengguna.
      if (sinyal?.aborted || e?.kunci === GALAT_BATAL) {
        handleAbort?.();
        bestMove = undefined;
        bestMoveCoronation = undefined;
        staticEval = [];
        kandidat = [];
      } else {
        throw galat(GALAT_MESIN);
      }
    }

    if (sinyal?.aborted) handleAbort?.();
    forced = isForced(move);
  }

  /*
   * Tri-state kritis: MultiPV tak tersedia/tak terbaca = tak diketahui
   * (`null`, BUKAN "bukan kritis"); cukup data = hasil deteksi. Syarat
   * "cukup data" (kandidat #1 dan #2 keduanya terbaca) disamakan dengan
   * syarat internal `apakahLangkahKritis`, supaya `null` tepat berarti
   * "detektornya sendiri akan menyerah" — bukan tebakan kedua yang bisa
   * menyimpang dari detektor. `penilaian.js` membaca nilai ini sebagai
   * boolean biasa (`null`/falsy = tidak kritis).
   */
  const cukupKandidat =
    Array.isArray(previousKandidat) &&
    previousKandidat.length >= 2 &&
    cpKandidat(previousKandidat[0]) !== null &&
    cpKandidat(previousKandidat[1]) !== null;
  const kritis = cukupKandidat
    ? apakahLangkahKritis(move, { staticEval, previousKandidat, previousBestMoveSan })
    : null;

  /*
   * Keterpaksaan adalah STATUS, bukan kualitas: kualitas langkah paksa tetap
   * dihitung seperti biasa (supaya akurasi dan grafik jujur) dan statusnya
   * dicatat di `isForced` agar agregator keputusan bisa mengecualikannya
   * (lihat `langkahTerpaksa` di ./evaluasi.js). Label "forced" warisan tidak
   * lagi ditulis, tetapi tetap dikenali saat dibaca (data lama).
   */
  const penilaian = getMoveRating({
    staticEval,
    previousStaticEvals,
    bestMoveSan: previousBestMoveSan ?? "",
    moveSan: move.san,
    fen,
    color: move.color,
    sacrifice,
    previousSacrifice,
    openings,
    /*
     * Label "kritis" menuntut kandidat MultiPV posisi SEBELUM langkah ini
     * (`previousKandidat`), jadi dihitung di sini lalu diserahkan —
     * `penilaian.js` tetap murni dan tidak perlu menyentuh papan. Lihat
     * ./langkahKritis.js.
     */
    kritis,
  });

  const bestMoveSan = bestMove ? moveToSan(bestMove, bestMoveCoronation, fen) : undefined;

  return {
    color,
    capture,
    san,
    castle,
    ...penilaian,
    // Cap status: hasil penilaian menentukan SIAP vs GAGAL (tak ada eval
    // valid = tak ada label = "gagal"). Pembatalan tak pernah sampai ke
    // sini — `gagalkan` melempar GALAT_BATAL sebelum entri dibuat.
    statusEvaluasi: penilaian.statusEvaluasi || STATUS_EVALUASI.SIAP,
    isForced: forced,
    kritis,
    bestMove,
    bestMoveSan,
    fen,
    sacrifice,
    movement,
    uci: uciLangkah,
    /*
     * Kandidat MultiPV posisi SETELAH langkah ini — usulan untuk PEMAIN
     * BERIKUTNYA (pola yang sama dengan `bestMoveSan`). Pada entri `i`,
     * langkah pemain `daftar[i].uci` dibandingkan dengan
     * `daftar[i - 1].kandidat` oleh ./antiCheat.js.
     */
    kandidat,
    // Hanya 4 evaluasi terakhir yang dibaca ./penilaian.js; dipotong supaya
    // analisis partai panjang tidak menyalin seluruh riwayat tiap langkah.
    previousStaticEvals: [staticEval, ...previousStaticEvals].slice(0, 4),
  };
}

/*
 * Siapkan seluruh posisi dari PGN SEBELUM engine dimuat. Grafik Report sudah
 * memiliki sumbu X penuh sejak awal; posisi yang belum dinilai tetap pada
 * garis tengah, lalu diisi satu per satu oleh parsePGN. Parser ini juga dipakai
 * parsePGN agar PGN tidak perlu dibaca dua kali dalam satu proses analisis.
 */
export function bacaPartaiPGN(rawPgn) {
  /*
   * Berkas multi-partai (ekspor chess.com/lichess): HANYA partai pertama
   * yang dibaca — `chess.js` melempar bila diberi semuanya sekaligus, dan
   * menggagalkan semuanya lebih buruk daripada menganalisis yang pertama.
   * `jumlahPartai` dilaporkan agar pemanggil (game.jsx) bisa
   * memperingatkan pengguna bahwa sisanya diabaikan.
   */
  const blok = pecahMultiPgn(rawPgn);
  const pertama = blok.length > 0 ? blok[0] : rawPgn;
  const chess = new Chess();
  let pgn;
  try {
    pgn = muatPgn(chess, pertama);
  } catch {
    throw galat(GALAT_PGN);
  }

  const riwayat = chess.history({ verbose: true });
  if (!riwayat.length) throw galat(GALAT_PGN);

  const headers = chess.header();
  const metadata = {
    players: getPlayers(headers),
    time: waktuDariPgn(headers),
    result: getResult(headers, pgn),
  };
  const daftarClock = ekstrakDaftarClock(chess, pertama, riwayat, metadata.time);
  const kerangka = [
    { fen: riwayat[0].before, color: riwayat[0].color },
    ...riwayat.map((langkah) => ({
      fen: langkah.after,
      san: langkah.san,
      color: invertColor(langkah.color),
    })),
  ];
  return { metadata, riwayat, daftarClock, kerangka, jumlahPartai: blok.length };
}

/**
 * Analisis seluruh partai PGN, langkah demi langkah.
 * Progres dilaporkan dalam persen (0–100) untuk bilah muat.
 * `partai` opsional adalah hasil bacaPartaiPGN yang sudah ditampilkan di
 * grafik; `onLangkah` menerima posisi yang telah dinilai setelah tiap langkah.
 * `multiPv` (bawaan MULTI_PV) merekam kandidat untuk penilaian langkah.
 */
export async function parsePGN(mesin, rawPgn, depth, openings, setProgress, sinyal, { multiPv = MULTI_PV, onLangkah, partai } = {}) {
  const { riwayat, metadata, daftarClock, jumlahPartai = 1 } = partai ?? bacaPartaiPGN(rawPgn);

  const hentikan = () => mesin.setop();
  if (sinyal) sinyal.addEventListener("abort", hentikan, { once: true });

  const moves = [];
  let previousStaticEvals = [];
  let previousBestMoveSan;
  let previousSacrifice = false;
  /*
   * Kandidat MultiPV posisi sebelum langkah yang sedang dianalisis — bahan
   * label "kritis" (./langkahKritis.js). Pada entri `i`, ini adalah
   * `daftar[i - 1].kandidat`, sama seperti pola `previousBestMoveSan` dan
   * `previousStaticEvals` di atas.
   */
  let previousKandidat = [];

  /** Menghentikan seluruh loop analisis dengan rapi (dipakai tombol Batal). */
  const gagalkan = () => {
    throw galat(GALAT_BATAL);
  };

  try {
    mesin.gameBaru();

    // Langkah pembuka dianalisis dari posisi awal supaya diff eval langkah
    // pertama punya pembanding.
    const chessAwal = new Chess(riwayat[0].before);
    const awal = await parsePosition(mesin, chessAwal, depth, sinyal, gagalkan, multiPv);
    moves.push({ ...awal, clock: daftarClock[0] ?? { white: metadata.time || null, black: metadata.time || null } });
    onLangkah?.([...moves]);
    previousStaticEvals = awal.previousStaticEvals;
    previousBestMoveSan = awal.bestMoveSan;
    previousKandidat = awal.kandidat ?? [];

    for (let i = 0; i < riwayat.length; i++) {
      if (sinyal?.aborted) throw galat(GALAT_BATAL);

      const move = riwayat[i];

      const dianalisis = await parseMove(
        mesin,
        depth,
        move,
        new Chess(),
        previousStaticEvals,
        previousBestMoveSan,
        previousSacrifice,
        openings,
        gagalkan,
        sinyal,
        multiPv,
        previousKandidat
      );

      if (sinyal?.aborted) throw galat(GALAT_BATAL);

      moves.push({ ...dianalisis, clock: daftarClock[i + 1] ?? moves[moves.length - 1]?.clock });
      previousStaticEvals = dianalisis.previousStaticEvals;
      previousBestMoveSan = dianalisis.bestMoveSan;
      previousSacrifice = dianalisis.sacrifice ?? false;
      previousKandidat = dianalisis.kandidat ?? [];

      setProgress(((i + 1) / riwayat.length) * 100);
      onLangkah?.([...moves]);
    }
  } finally {
    if (sinyal) sinyal.removeEventListener("abort", hentikan);
    setProgress(0);
  }

  return { metadata, moves, jumlahPartai };
}
