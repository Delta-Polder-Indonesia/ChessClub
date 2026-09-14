/**
 * Uji ANTI-CHEAT fitur Analisa — modul murni `mesin/antiCheat.js`, orkestrator
 * `akun/antiCheatRiwayat.js`, dan komponen `summary/deteksiEngine.jsx`.
 *
 * Yang direkam suite ini:
 *   1. Konvensi eval UCI: `previousStaticEvals[0]` = eval SESUDAH langkah
 *      (giliran lawan), `[1]` = eval SEBELUM (giliran pemain), sehingga
 *      kerugian langkah = cp[1] + cp[0] untuk kedua warna.
 *   2. `san` dibandingkan dengan `bestMoveSan` entri SEBELUMNYA — bukan dengan
 *      `bestMoveSan` pada entri yang sama (itu milik pemain berikutnya).
 *   3. Langkah `forced` dan `book` dikeluarkan dari semua metrik.
 *   4. Partai "sempurna ala engine" (setiap langkah = usulan engine, ACPL 0,
 *      jam seragam) harus dinilai jauh lebih tinggi daripada partai jujur.
 *   5. Agregat riwayat: rata-rata berbobot jumlah langkah, tren, `andal`.
 *   6. Orkestrator: hanya partai tempat username bermain, cache per id partai,
 *      AbortSignal menghentikan loop tanpa membuang hasil yang sudah jadi.
 *   7. `deteksiEngine.jsx` merender skor + level + sanggahan di DOM.
 *   8. METRIK GENERASI 2 (kandidat MultiPV): peringkat langkah pemain di
 *      antara kandidat engine, kecocokan top-3/top-5, kerugian cp vs
 *      kandidat terbaik, komponen skor `peringkat`, dan parsing baris
 *      `info multipv`/`wdl` di `EngineCatur`.
 *
 * Jalankan: node scripts/uji-anticheat.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/i18n.jsx");
const { Chess } = await import("chess.js");
const { ID } = await import("../src/lib/terjemahan/id/index.js");
const { formatSquare, parsePGN } = await import("../src/halaman/Analisa/mesin/engine.js");
const { EngineCatur } = await import("../src/lib/engineCatur.js");
const ac = await import("../src/halaman/Analisa/mesin/antiCheat.js");
const { FASE_PEMBUKAAN, faseBerikutnya, isEndOpening, isEndMiddlegame } = await import(
  "../src/halaman/Analisa/mesin/fase.js"
);
const riwayat = await import("../src/halaman/Analisa/akun/antiCheatRiwayat.js");
const { default: DeteksiEngine } = await import(
  "../src/halaman/Analisa/komponen/menu/analysis/summary/deteksiEngine.jsx"
);

const act = React.act ?? (await import("react-dom/test-utils")).act;

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
const hampir = (a, b, toleransi = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= toleransi;

/* ============================ 1. utilitas murni ============================ */

console.log("== konvensi eval & utilitas ==");
hasil("cp mentah diteruskan apa adanya", ac.nilaiCentipawn(["cp", "-42"]) === -42);
hasil("mate 3 → +CP_MATE", ac.nilaiCentipawn(["mate", "3"]) === ac.CP_MATE);
hasil("mate -1 → -CP_MATE", ac.nilaiCentipawn(["mate", "-1"]) === -ac.CP_MATE);
hasil('["mate"] tanpa angka → null', ac.nilaiCentipawn(["mate"]) === null);
hasil("eval kosong → null", ac.nilaiCentipawn([]) === null);
hasil("normalkanSan membuang +#!?", ac.normalkanSan("Qxe7+#") === "Qxe7" && ac.normalkanSan("0-0-0") === "O-O-O");

/*
 * Kerugian langkah. Entri `moves[i]` punya previousStaticEvals = [sesudah, sebelum].
 *   Putih bergerak: sebelum giliran putih → cp[1] = +50; sesudah giliran hitam
 *     dan eval putih tidak berubah → cp[0] = -50. rugi = 50 + (-50) = 0.
 *   Putih blunder 1 bidak: sesudah (sudut hitam) = +150 → rugi = 50 + 150 = 200.
 *   Hitam bergerak: sebelum giliran hitam → cp[1] = -50; sesudah giliran putih
 *     tidak berubah → cp[0] = +50. rugi = -50 + 50 = 0.
 */
const entriPutih = (cpSebelum, cpSesudah) => ({
  color: "b",
  previousStaticEvals: [
    ["cp", String(cpSesudah)],
    ["cp", String(cpSebelum)],
  ],
});
hasil("putih tanpa kerugian → 0 cp", ac.kerugianCentipawn(entriPutih(50, -50)) === 0);
hasil("putih rugi 200 cp", ac.kerugianCentipawn(entriPutih(50, 150)) === 200);
hasil("hitam tanpa kerugian → 0 cp", ac.kerugianCentipawn({ color: "w", previousStaticEvals: [["cp", "50"], ["cp", "-50"]] }) === 0);
hasil("hitam rugi 200 cp", ac.kerugianCentipawn({ color: "w", previousStaticEvals: [["cp", "150"], ["cp", "50"]] }) === 200);
hasil("kerugian tidak pernah negatif", ac.kerugianCentipawn(entriPutih(50, -400)) === 0);
hasil(
  `kerugian dipotong di BATAS_KERUGIAN (${ac.BATAS_KERUGIAN})`,
  ac.kerugianCentipawn({ color: "b", previousStaticEvals: [["mate", "1"], ["mate", "5"]] }) === ac.BATAS_KERUGIAN
);
hasil("eval belum lengkap → null", ac.kerugianCentipawn({ color: "b", previousStaticEvals: [["cp", "10"]] }) === null);

hasil("pemainLangkah: moves[0] = null", ac.pemainLangkah({ color: "w" }, 0) === null);
hasil("pemainLangkah: moves[1] (color b) = putih", ac.pemainLangkah({ color: "b" }, 1) === "w");
hasil("pemainLangkah: moves[2] (color w) = hitam", ac.pemainLangkah({ color: "w" }, 2) === "b");
hasil("pemainLangkah: color hilang → pakai indeks (3 = putih)", ac.pemainLangkah({}, 3) === "w");

const jam = (w, b) => ({ white: w, black: b });
const MOVES_JAM = [
  { clock: jam(300, 300) },
  { clock: jam(295, 300) }, // putih pikir 5 detik
  { clock: jam(295, 290) }, // hitam pikir 10 detik
  { clock: jam(296, 290) }, // increment > waktu pikir → negatif
  { clock: null },
];
hasil("waktuBerpikir putih = 5 detik", ac.waktuBerpikir(MOVES_JAM, 1, "w") === 5);
hasil("waktuBerpikir hitam = 10 detik", ac.waktuBerpikir(MOVES_JAM, 2, "b") === 10);
hasil("waktuBerpikir negatif → null", ac.waktuBerpikir(MOVES_JAM, 3, "w") === null);
hasil("clock null → null", ac.waktuBerpikir(MOVES_JAM, 4, "b") === null);
hasil("waktuBerpikir tanpa entri sebelumnya → null", ac.waktuBerpikir(MOVES_JAM, 0, "w") === null);

hasil(
  `statistikWaktu: < ${ac.SAMPEL_WAKTU_MINIMUM} sampel → null`,
  ac.statistikWaktu([1, 1, 1]) === null
);
const waktuSeragam = ac.statistikWaktu(Array(10).fill(3));
hasil("jam seragam → konsistensi 1", waktuSeragam?.konsistensi === 1 && waktuSeragam.koefisienVariasi === 0);
const waktuAcak = ac.statistikWaktu([1, 20, 2, 30, 1, 25, 3, 18, 2, 22, 1, 19]);
hasil("jam bervariasi → konsistensi 0", waktuAcak?.konsistensi === 0);

/* ==================== 2. ambang skor & pemetaan level ==================== */

console.log("\n== skor 0-100 ==");
hasil("kecocokan 45% → komponen 0", ac.komponenKecocokan(ac.AMBANG.kecocokanDasar) === 0);
hasil("kecocokan 100% → komponen 100", ac.komponenKecocokan(100) === 100);
hasil("kecocokan 30% → komponen 0 (tidak negatif)", ac.komponenKecocokan(30) === 0);
hasil("ACPL 0 → komponen 100", ac.komponenAcpl(0) === 100);
hasil("ACPL 45 → komponen 0", ac.komponenAcpl(ac.AMBANG.acplAcuan) === 0);
hasil("ACPL 90 → komponen 0 (tidak negatif)", ac.komponenAcpl(90) === 0);
hasil("waktu null → komponen null", ac.komponenWaktu(null) === null);
hasil("level rendah", ac.tingkatDariSkor(0) === "rendah" && ac.tingkatDariSkor(ac.AMBANG.sedang - 1) === "rendah");
hasil("level sedang", ac.tingkatDariSkor(ac.AMBANG.sedang) === "sedang" && ac.tingkatDariSkor(ac.AMBANG.tinggi - 1) === "sedang");
hasil("level tinggi", ac.tingkatDariSkor(ac.AMBANG.tinggi) === "tinggi" && ac.tingkatDariSkor(100) === "tinggi");

const sempurna = ac.skorKecurigaan({ engineMatchRate: 100, acpl: 0, konsistensiWaktu: 1, jumlahLangkah: 1000 });
hasil(
  "metrik sempurna + 1000 langkah → skor 99 (100 × 1000/1012)",
  sempurna.skor === 99 && sempurna.level === "tinggi",
  JSON.stringify(sempurna)
);
hasil(
  "bobot dinormalkan tanpa data jam → skor sama",
  ac.skorKecurigaan({ engineMatchRate: 100, acpl: 0, konsistensiWaktu: null, jumlahLangkah: 1000 }).skor === 99
);
hasil("tidak ada metrik → skor null", ac.skorKecurigaan({}).skor === null);
const sedikit = ac.skorKecurigaan({ engineMatchRate: 100, acpl: 0, konsistensiWaktu: 1, jumlahLangkah: 12 });
hasil(
  "penyusutan sampel: 12 langkah → 50",
  sedikit.skor === 50,
  `dapat ${sedikit.skor}, faktor 12/(12+${ac.AMBANG.penyusutanLangkah})`
);

/* =============== 3. pengecualian langkah forced & book =============== */

console.log("\n== pengecualian forced & book ==");
/*
 * Empat langkah putih beruntun (dibuat sebagai selang-seling agar warna benar):
 * hanya satu yang bukan forced/book, jadi `langkahDinilai` harus 1.
 */
const MOVES_CAMPUR = [
  { san: undefined, color: "w", bestMoveSan: "e4", previousStaticEvals: [["cp", "30"]] },
  { san: "e4", color: "b", moveRating: "best", bestMoveSan: "e5", previousStaticEvals: [["cp", "-30"], ["cp", "30"]] },
  { san: "e5", color: "w", moveRating: "forced", bestMoveSan: "Nf3", previousStaticEvals: [["cp", "30"], ["cp", "-30"]] },
  { san: "Nf3", color: "b", moveRating: "book", bestMoveSan: "Nc6", previousStaticEvals: [["cp", "-30"], ["cp", "30"]] },
  { san: "Nc6", color: "w", moveRating: "best", bestMoveSan: "Bb5", previousStaticEvals: [["cp", "30"], ["cp", "-30"]] },
];
const campuran = ac.hitungSkorKecurigaan(MOVES_CAMPUR);
hasil("putih: hanya 1 langkah dinilai (Nf3 book dibuang)", campuran.w.langkahDinilai === 1, JSON.stringify(campuran.w));
hasil("putih: langkah dinilai itu cocok dengan engine", campuran.w.langkahCocok === 1);
hasil("hitam: hanya 1 langkah dinilai (e5 forced dibuang)", campuran.b.langkahDinilai === 1, JSON.stringify(campuran.b));
hasil("hitam: langkah dinilai itu cocok dengan engine", campuran.b.langkahCocok === 1);
hasil("ACPL hitam = 0 (eval tidak berubah)", campuran.b.acpl === 0);
hasil("daftar kosong → langkahDinilai 0 & skor null", ac.hitungSkorKecurigaan([]).w.skor === null);
hasil("bukan array → tidak melempar", ac.hitungSkorKecurigaan(null).b.langkahDinilai === 0);

/* ============== 4. partai nyata: jujur vs sempurna ala engine ============== */

console.log("\n== partai hasil parsePGN ASLI (engine palsu deterministik) ==");

/** PGN panjang acak-berpemicu: cukup langkah agar penyusutan sampel tidak mendominasi. */
function buatPgn(panjang = 60, benih = 7) {
  const chess = new Chess();
  let state = benih;
  const acak = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  while (chess.history().length < panjang && !chess.isGameOver()) {
    const daftar = chess.moves({ verbose: true });
    chess.move(daftar[Math.floor(acak() * daftar.length)].san);
  }
  const langkah = chess.history();
  const baris = [];
  for (let i = 0; i < langkah.length; i += 2) {
    baris.push(`${i / 2 + 1}. ${langkah[i]}${langkah[i + 1] ? ` ${langkah[i + 1]}` : ""}`);
  }
  /*
   * `TimeControl` wajib ada: tanpa itu `waktuDariPgn` mengembalikan 0 dan
   * `ekstrakDaftarClock` tidak tahu jam awal, sehingga langkah pertama tiap
   * warna terbaca sebagai 0 detik.
   */
  return (
    `[Event "Uji Anti-Cheat"]\n[Site "localhost"]\n[Date "2026.09.14"]\n` +
    `[White "Mesin"]\n[Black "Manusia"]\n[Result "*"]\n[TimeControl "${JAM_AWAL}+0"]\n\n${baris.join(" ")}`
  );
}

/** FEN sebelum tiap langkah + SAN yang dimainkan dari posisi itu. */
function petaLangkah(pgn) {
  const chess = new Chess();
  chess.loadPgn(pgn, { strict: false });
  const daftar = chess.history({ verbose: true });
  const fen = daftar.map((m) => m.before);
  const san = daftar.map((m) => m.san);
  return { fen, san, awal: daftar[0]?.before ?? new Chess().fen() };
}

/**
 * Engine palsu.
 *  - `sempurna`: selalu mengusulkan langkah yang memang dimainkan, dan eval
 *    putih dijaga tetap → kecocokan 100%, ACPL 0.
 *  - `jujur`: mengusulkan langkah lain pada 2 dari 3 posisi, dan eval putih
 *    digergaji ±GEGERGAJI sehingga kedua pemain "kehilangan" 50 cp per langkah.
 */
const GIGI = 50; // centipawn yang hilang per langkah pada partai jujur
const JAM_AWAL = 7200; // detik per pemain (2 jam) — cukup untuk 60 ply
function buatEnginePalsu({ fen, san }, mode) {
  return {
    async cari(fenCari) {
      const i = fen.indexOf(fenCari);
      const giliranPutih = new Chess(fenCari).turn() === "w";
      const dimainkan = i >= 0 ? san[i] : null;
      let usulan = dimainkan;
      if (mode === "jujur" && dimainkan) {
        const pilihan = new Chess(fenCari).moves({ verbose: true });
        const lain = pilihan.find((m) => m.san !== dimainkan);
        if (i % 3 !== 0 && lain) usulan = lain.san;
      }
      const uci = usulan
        ? (() => {
            const m = new Chess(fenCari).moves({ verbose: true }).find((x) => x.san === usulan);
            return m ? `${m.from}${m.to}${m.promotion ?? ""}` : null;
          })()
        : null;
      /*
       * Partai jujur: eval putih digergaji — 100 cp pada posisi genap, 50 cp
       * pada posisi ganjil. Karena pemain berganti tiap langkah, setiap
       * langkah (putih maupun hitam) "kehilangan" tepat GIGI centipawn.
       * Posisi terakhir (sesudah langkah pamungkas) tidak ada di `fen`;
       * indeksnya = fen.length supaya pola genap/ganjilnya tetap nyambung.
       */
      let putih = 100;
      if (mode === "jujur") {
        const indeks = i < 0 ? fen.length : i;
        putih = indeks % 2 === 0 ? 100 : 100 - GIGI;
      }
      /*
       * Kandidat MultiPV deterministik untuk metrik generasi 2:
       *  - sempurna  → langkah yang dimainkan selalu peringkat 1;
       *  - jujur     → pada 2 dari 3 posisi langkah pemain "turun" ke
       *                peringkat 4 (kandidat 1 = usulan lain), kerugian
       *                kandidat 30 cp (peringkat k kehilangan (k-1)·10).
       * Kandidat pengisi memakai UCI sintetis — antiCheat hanya
       * mencocokkan string, tidak memvalidasi legalitas.
       */
      const dasar = giliranPutih ? putih : -putih;
      const uciDariSan = (san) => {
        if (!san) return null;
        const m = new Chess(fenCari).moves({ verbose: true }).find((x) => x.san === san);
        return m ? `${m.from}${m.to}${m.promotion ?? ""}` : null;
      };
      const dimainkanUci = uciDariSan(dimainkan);
      const pengisi = ["a1a2", "a1a3", "a1a4", "a1a5", "a1a6", "b1b2"].filter(
        (u) => u !== dimainkanUci && u !== uci
      );
      let daftarKandidat = [];
      if (uci) {
        const turunKeEmpat = mode === "jujur" && i % 3 !== 0 && dimainkanUci && dimainkanUci !== uci;
        const urutan = turunKeEmpat
          ? [uci, pengisi[0], pengisi[1], dimainkanUci, pengisi[2]]
          : [uci, pengisi[0], pengisi[1], pengisi[2], pengisi[3]];
        daftarKandidat = urutan.slice(0, 5).map((u, idx) => ({
          peringkat: idx + 1,
          uci: u,
          cp: dasar - idx * 10,
          mate: null,
          wdl: [850 - idx * 100, 150, 0],
        }));
      }
      return {
        staticEval: ["cp", String(dasar)],
        bestMove: uci ? [formatSquare(uci.slice(0, 2)), formatSquare(uci.slice(2, 4))] : undefined,
        bestMoveCoronation: uci && uci.length > 4 ? uci[4] : undefined,
        kedalamanTercapai: 8,
        pv: [],
        daftarKandidat,
      };
    },
    async siapkan() {},
    gameBaru() {},
    setop() {},
    hancurkan() {},
  };
}

/**
 * Sisipkan `[%clk H:MM:SS]` sesudah tiap langkah. `waktuPikir(indeks)`
 * menghasilkan detik yang dipakai pemain pada langkah itu; `ekstrakDaftarClock`
 * di engine.js yang mengubahnya kembali menjadi selisih per langkah.
 */
function sisipkanClock(pgn, waktuPikir) {
  const chess = new Chess();
  chess.loadPgn(pgn, { strict: false });
  const daftar = chess.history({ verbose: true });
  const sisa = { w: JAM_AWAL, b: JAM_AWAL };
  const tag = daftar.map((m, i) => {
    sisa[m.color] -= waktuPikir(i);
    const t = Math.max(0, sisa[m.color]);
    return `{[%clk ${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}]}`;
  });
  const [kepala, badan] = pgn.split(/\n\s*\n/);
  const keluar = [];
  let k = 0;
  for (const tok of badan.split(/\s+/)) {
    keluar.push(tok);
    // Hanya token SAN (diawali huruf) yang diikuti clk; nomor langkah tidak.
    if (/^[A-Za-z]/.test(tok) && k < tag.length) keluar.push(tag[k++]);
  }
  return `${kepala}\n\n${keluar.join(" ")}`;
}

const PGN = buatPgn(60);
const peta = petaLangkah(PGN);
hasil(`PGN uji cukup panjang (${peta.san.length} ply)`, peta.san.length >= 40, `hanya ${peta.san.length} ply`);

/* Partai jujur: waktu pikir melompat liar (CV > ambang) → konsistensi 0.
 * Partai engine: waktu pikir seragam 2 detik → konsistensi 1. */
const PGN_JUJUR = sisipkanClock(PGN, (i) => [5, 30, 80, 140][i % 4]);
const PGN_MESIN = sisipkanClock(PGN, () => 2);

const hasilJujur = await parsePGN(buatEnginePalsu(peta, "jujur"), PGN_JUJUR, 8, {}, () => {});
const hasilMesin = await parsePGN(buatEnginePalsu(peta, "sempurna"), PGN_MESIN, 8, {}, () => {});

hasil("parsePGN mengembalikan moves dengan clock", Boolean(hasilJujur.moves[1]?.clock?.white));
hasil("parsePGN menempel previousStaticEvals", Array.isArray(hasilJujur.moves[1]?.previousStaticEvals));

const skorJujur = ac.hitungSkorKecurigaan(hasilJujur.moves);
const skorMesin = ac.hitungSkorKecurigaan(hasilMesin.moves);
console.log(
  `   jujur  : match ${skorJujur.w.engineMatchRate}%/${skorJujur.b.engineMatchRate}% ` +
    `acpl ${skorJujur.w.acpl}/${skorJujur.b.acpl} skor ${skorJujur.w.skor}/${skorJujur.b.skor}`
);
console.log(
  `   engine : match ${skorMesin.w.engineMatchRate}%/${skorMesin.b.engineMatchRate}% ` +
    `acpl ${skorMesin.w.acpl}/${skorMesin.b.acpl} skor ${skorMesin.w.skor}/${skorMesin.b.skor}`
);

hasil("partai engine: kecocokan langkah 100% untuk Putih", skorMesin.w.engineMatchRate === 100, `${skorMesin.w.engineMatchRate}`);
hasil("partai engine: kecocokan langkah 100% untuk Hitam", skorMesin.b.engineMatchRate === 100, `${skorMesin.b.engineMatchRate}`);
hasil("partai engine: ACPL 0 kedua warna", skorMesin.w.acpl === 0 && skorMesin.b.acpl === 0, `${skorMesin.w.acpl}/${skorMesin.b.acpl}`);
hasil("partai engine: jam seragam → konsistensi 1", skorMesin.w.konsistensiWaktu === 1, `${skorMesin.w.konsistensiWaktu}`);
hasil("partai engine: level tinggi", skorMesin.w.level === "tinggi" && skorMesin.b.level === "tinggi", `${skorMesin.w.level}/${skorMesin.b.level}`);

hasil("partai jujur: kecocokan jauh di bawah 100%", skorJujur.w.engineMatchRate < 60, `${skorJujur.w.engineMatchRate}`);
hasil("partai jujur: ACPL = 50 cp untuk Putih", hampir(skorJujur.w.acpl, GIGI, 0.5), `${skorJujur.w.acpl}`);
hasil("partai jujur: ACPL = 50 cp untuk Hitam", hampir(skorJujur.b.acpl, GIGI, 0.5), `${skorJujur.b.acpl}`);
hasil("partai jujur: jam bervariasi → konsistensi 0", skorJujur.w.konsistensiWaktu === 0, `${skorJujur.w.konsistensiWaktu}`);
hasil("partai jujur: level rendah", skorJujur.w.level === "rendah" && skorJujur.b.level === "rendah", `${skorJujur.w.level}/${skorJujur.b.level}`);
hasil(
  "skor partai engine jauh di atas partai jujur",
  skorMesin.w.skor - skorJujur.w.skor >= 40,
  `${skorMesin.w.skor} vs ${skorJujur.w.skor}`
);

/* ---- metrik generasi 2 (kandidat MultiPV) pada partai parsePGN nyata ---- */
console.log(
  `   jujur  : top3 ${skorJujur.w.kecocokanTop3}% rata-rangking ${skorJujur.w.rataPeringkat} ` +
    `acplKandidat ${skorJujur.w.acplKandidat} komponenPeringkat ${skorJujur.w.komponen?.peringkat}`
);
console.log(
  `   engine : top3 ${skorMesin.w.kecocokanTop3}% rata-rangking ${skorMesin.w.rataPeringkat} ` +
    `acplKandidat ${skorMesin.w.acplKandidat} komponenPeringkat ${skorMesin.w.komponen?.peringkat}`
);
hasil(
  "partai engine: hampir semua langkah punya kandidat (posisi pamungkas tanpa kandidat)",
  skorMesin.w.kandidatSampel >= skorMesin.w.langkahDinilai - 2 && skorMesin.w.kandidatSampel > 0,
  `${skorMesin.w.kandidatSampel}/${skorMesin.w.langkahDinilai}`
);
hasil("partai engine: kecocokan top-3 = 100%", skorMesin.w.kecocokanTop3 === 100 && skorMesin.b.kecocokanTop3 === 100, `${skorMesin.w.kecocokanTop3}`);
hasil("partai engine: peringkat rata-rata = 1", skorMesin.w.rataPeringkat === 1 && skorMesin.b.rataPeringkat === 1, `${skorMesin.w.rataPeringkat}`);
hasil("partai engine: kerugian kandidat 0 cp", skorMesin.w.acplKandidat === 0 && skorMesin.b.acplKandidat === 0, `${skorMesin.w.acplKandidat}`);
hasil("partai engine: komponen peringkat 100", skorMesin.w.komponen?.peringkat === 100, `${skorMesin.w.komponen?.peringkat}`);
hasil(
  "partai jujur: peringkat rata-rata lebih buruk dari engine",
  skorJujur.w.rataPeringkat > 2 && skorJujur.b.rataPeringkat > 2,
  `${skorJujur.w.rataPeringkat}/${skorJujur.b.rataPeringkat}`
);
hasil(
  "partai jujur: kecocokan top-3 < 60%",
  skorJujur.w.kecocokanTop3 < 60 && skorJujur.b.kecocokanTop3 < 60,
  `${skorJujur.w.kecocokanTop3}/${skorJujur.b.kecocokanTop3}`
);
hasil(
  "partai jujur: kerugian kandidat = 20 cp (2 dari 3 langkah rugi 30)",
  hampir(skorJujur.w.acplKandidat, 20, 1) && hampir(skorJujur.b.acplKandidat, 20, 1),
  `${skorJujur.w.acplKandidat}/${skorJujur.b.acplKandidat}`
);
hasil(
  "partai jujur: komponen peringkat sedang (≈60 pada rata-rata 3)",
  skorJujur.w.komponen?.peringkat > 40 && skorJujur.w.komponen?.peringkat < 75,
  `${skorJujur.w.komponen?.peringkat}`
);
hasil(
  "partai jujur: WDL tercatat → rata kehilangan peluang menang positif",
  Number.isFinite(skorJujur.w.rataKehilanganMenang) && skorJujur.w.rataKehilanganMenang > 0,
  `${skorJujur.w.rataKehilanganMenang}`
);
hasil(
  "partai engine: kehilangan peluang menang 0",
  skorMesin.w.rataKehilanganMenang === 0,
  `${skorMesin.w.rataKehilanganMenang}`
);

const totalFase = (sisi) =>
  ["opening", "middlegame", "endgame"].reduce((a, f) => a + sisi.perFase[f].langkahDinilai, 0);
hasil(
  "jumlah langkah per fase = jumlah langkah dinilai (Putih)",
  totalFase(skorJujur.w) === skorJujur.w.langkahDinilai,
  `${totalFase(skorJujur.w)} vs ${skorJujur.w.langkahDinilai}`
);
hasil(
  "jumlah langkah per fase = jumlah langkah dinilai (Hitam)",
  totalFase(skorJujur.b) === skorJujur.b.langkahDinilai
);
hasil(
  "fase pembukaan berisi langkah (partai panjang melewati pembukaan)",
  skorJujur.w.perFase.opening.langkahDinilai > 0 && skorJujur.w.perFase.opening.langkahDinilai < skorJujur.w.langkahDinilai
);

/* ============================ 5. agregat riwayat ============================ */

console.log("\n== agregat riwayat pemain ==");

/** Hasil partai sintetis berbentuk keluaran `hitungSkorKecurigaan`. */
function hasilSintetis(warna, { langkah, cocok, acpl, konsistensi = null, sampelWaktu = 0 }) {
  const sisi = (pakai) =>
    pakai
      ? {
          langkahDinilai: langkah,
          langkahCocok: cocok,
          engineMatchRate: langkah ? (cocok / langkah) * 100 : null,
          langkahAcpl: langkah,
          totalKerugian: acpl * langkah,
          acpl,
          konsistensiWaktu: konsistensi,
          rincianWaktu: konsistensi === null ? null : { jumlahSampel: sampelWaktu, konsistensi },
          perFase: {
            opening: { langkahDinilai: langkah, langkahCocok: cocok, engineMatchRate: langkah ? (cocok / langkah) * 100 : null, langkahAcpl: langkah, totalKerugian: acpl * langkah, acpl },
            middlegame: { langkahDinilai: 0, langkahCocok: 0, engineMatchRate: null, langkahAcpl: 0, totalKerugian: 0, acpl: null },
            endgame: { langkahDinilai: 0, langkahCocok: 0, engineMatchRate: null, langkahAcpl: 0, totalKerugian: 0, acpl: null },
          },
          skor: 50,
          level: "sedang",
        }
      : { langkahDinilai: 0, langkahCocok: 0, engineMatchRate: null, langkahAcpl: 0, totalKerugian: 0, acpl: null, konsistensiWaktu: null, rincianWaktu: null, perFase: null, skor: null, level: null };
  return { w: sisi(warna === "w"), b: sisi(warna === "b") };
}

const daftarAgregat = [
  { id: "p1", timestamp: 1000, warna: "w", hasil: hasilSintetis("w", { langkah: 80, cocok: 80, acpl: 0 }) },
  { id: "p2", timestamp: 2000, warna: "b", hasil: hasilSintetis("b", { langkah: 8, cocok: 0, acpl: 100 }) },
];
const agregat = ac.agregatSkorPemain(daftarAgregat, "budi");
hasil("jumlahPartai = 2", agregat.jumlahPartai === 2);
hasil("jumlahLangkah = 88", agregat.jumlahLangkah === 88, `${agregat.jumlahLangkah}`);
hasil(
  "engineMatchRate berbobot langkah = 90.9% (bukan 50%)",
  hampir(agregat.engineMatchRate, (80 / 88) * 100, 0.05),
  `${agregat.engineMatchRate}`
);
hasil("ACPL berbobot = 8.2 cp", hampir(agregat.acpl, (80 * 0 + 8 * 100) / 88, 0.05), `${agregat.acpl}`);
hasil("partai diurut naik menurut timestamp", agregat.partai[0].id === "p1" && agregat.partai[1].id === "p2");
hasil("tren perlu 3 partai → null", agregat.tren.kemiringan === null && agregat.tren.arah === null);
hasil("agregat kosong tetap berbentuk", ac.agregatSkorPemain([], "x").jumlahPartai === 0 && ac.agregatSkorPemain(null).skor === null);

const trenNaik = ac.agregatSkorPemain(
  [10, 40, 70].map((s, i) => ({
    id: `t${i}`,
    timestamp: i * 1000,
    warna: "w",
    hasil: { w: { ...hasilSintetis("w", { langkah: 30, cocok: 15, acpl: 30 }).w, skor: s, level: "sedang" } },
  })),
  "budi"
);
hasil("tren menaik terdeteksi", trenNaik.tren.arah === "naik", `${trenNaik.tren.kemiringan}`);
hasil("kemiringan = 30 poin per partai", hampir(trenNaik.tren.kemiringan, 30, 1e-6), `${trenNaik.tren.kemiringan}`);

const trenTurun = ac.agregatSkorPemain(
  [70, 40, 10].map((s, i) => ({
    id: `t${i}`,
    timestamp: i * 1000,
    warna: "w",
    hasil: { w: { ...hasilSintetis("w", { langkah: 30, cocok: 15, acpl: 30 }).w, skor: s, level: "sedang" } },
  })),
  "budi"
);
hasil("tren menurun terdeteksi", trenTurun.tren.arah === "turun");
hasil(
  "skor stabil → 'stabil'",
  ac.agregatSkorPemain(
    [40, 40, 40].map((s, i) => ({
      id: `t${i}`,
      timestamp: i * 1000,
      warna: "w",
      hasil: { w: { ...hasilSintetis("w", { langkah: 30, cocok: 15, acpl: 30 }).w, skor: s, level: "sedang" } },
    })),
    "budi"
  ).tren.arah === "stabil"
);
hasil(
  `andal = false bila partai < ${ac.MIN_PARTAI_AGGREGAT} (2 partai, 88 langkah)`,
  agregat.andal === false
);
hasil(
  `andal = true bila ≥ ${ac.MIN_PARTAI_AGGREGAT} partai & ≥ ${ac.MIN_LANGKAH_AGGREGAT} langkah (3 partai, 90 langkah)`,
  trenNaik.andal === true
);
hasil(
  "warna dibaca dari metadata.players",
  ac.warnaPemainDariMetadata({ players: [{ name: "Budi" }, { name: "Lawan" }] }, "budi") === "w" &&
    ac.warnaPemainDariMetadata({ players: [{ name: "Lawan" }, { name: "Budi" }] }, "budi") === "b" &&
    ac.warnaPemainDariMetadata({ players: [{ name: "A" }, { name: "B" }] }, "budi") === null
);

/* ============================ 6. orkestrator riwayat ============================ */

console.log("\n== orkestrator: batas partai, cache, batal ==");

const partaiPalsu = [
  { id: "g1", pgn: PGN, whiteName: "budi", blackName: "lawan1", timestamp: 1000, timeClass: "blitz" },
  { id: "g2", pgn: PGN, whiteName: "lawan2", blackName: "Budi", timestamp: 3000, timeClass: "rapid" },
  { id: "g3", pgn: PGN, whiteName: "orang", blackName: "lain", timestamp: 2000 },
  { id: "g4", pgn: "", whiteName: "budi", blackName: "kosong", timestamp: 4000 },
];
hasil(
  "hanya partai tempat username bermain yang dipilih",
  riwayat.pilihPartaiUntukAnalisis(partaiPalsu, "budi").map((p) => p.id).join(",") === "g2,g1"
);
hasil(
  "partai tanpa PGN dilewati",
  !riwayat.pilihPartaiUntukAnalisis(partaiPalsu, "budi").some((p) => p.id === "g4")
);
hasil(
  "urut terbaru lebih dulu",
  riwayat.pilihPartaiUntukAnalisis(partaiPalsu, "budi")[0].timestamp === 3000
);
hasil(
  "batas jumlah partai dihormati",
  riwayat.pilihPartaiUntukAnalisis(partaiPalsu, "budi", { batas: 1 }).length === 1
);
hasil(
  `kedalaman agregat (${riwayat.KEDALAMAN_AGGREGAT}) lebih dangkal dari kedalaman bawaan analisis`,
  riwayat.KEDALAMAN_AGGREGAT < 13
);

riwayat.bersihkanCacheAntiCheat();
let panggilParse = 0;
let kedalamanTerakhir = 0;
const parserPalsu = async (mesin, pgn, kedalaman, openings, setProgress, sinyal) => {
  panggilParse++;
  kedalamanTerakhir = kedalaman;
  setProgress(50);
  await new Promise((r) => setTimeout(r, 0));
  if (sinyal?.aborted) throw Object.assign(new Error("canceled"), { kunci: "canceled" });
  return { metadata: { players: [{ name: "budi" }, { name: "lawan" }] }, moves: hasilMesin.moves };
};
const bukuPalsu = async () => ({});

const jalan1 = await riwayat.analisisRiwayatAntiCheat({
  partai: partaiPalsu,
  username: "budi",
  mesin: null,
  parserPgn: parserPalsu,
  cariBuku: bukuPalsu,
});
hasil("dua partai dianalisis", jalan1.dianalisis === 2 && jalan1.total === 2, JSON.stringify({ d: jalan1.dianalisis, t: jalan1.total }));
hasil("parsePGN dipanggil dua kali", panggilParse === 2, `${panggilParse}`);
hasil("kedalaman yang dipakai = KEDALAMAN_AGGREGAT", kedalamanTerakhir === riwayat.KEDALAMAN_AGGREGAT);
hasil("cache terisi dua entri", riwayat.ukuranCacheAntiCheat() === 2);
hasil("agregat ikut terhitung", jalan1.agregat.jumlahPartai === 2 && jalan1.agregat.level !== null);
hasil("warna pemain diteruskan ke agregat", jalan1.agregat.partai.every((p) => p.warna === "w" || p.warna === "b"));

const progresTerekam = [];
const jalan2 = await riwayat.analisisRiwayatAntiCheat({
  partai: partaiPalsu,
  username: "budi",
  mesin: null,
  parserPgn: parserPalsu,
  cariBuku: bukuPalsu,
  progres: (p) => progresTerekam.push(p),
});
hasil("jalan kedua tidak memanggil parsePGN lagi (cache)", panggilParse === 2, `${panggilParse}`);
hasil("dariCache = 2", jalan2.dariCache === 2);
hasil("hasil dari cache identik", JSON.stringify(jalan2.agregat) === JSON.stringify(jalan1.agregat));
hasil(
  "progres dilaporkan per partai",
  progresTerekam.filter((p) => p.jenis === "progres").length === 2 && progresTerekam.at(-1).ke === 2
);

/*
 * Cache dikosongkan dulu: dengan entri cache yang masih ada, parser tidak
 * pernah dipanggil sehingga sinyal batal tidak sempat diuji.
 */
riwayat.bersihkanCacheAntiCheat();
const batalController = new AbortController();
let panggilBatal = 0;
const jalan3 = await riwayat.analisisRiwayatAntiCheat({
  partai: partaiPalsu,
  username: "budi",
  mesin: null,
  parserPgn: async (...args) => {
    panggilBatal++;
    const keluaran = await parserPalsu(...args);
    batalController.abort(); // pengguna menekan Batal setelah partai pertama selesai
    return keluaran;
  },
  cariBuku: bukuPalsu,
  sinyal: batalController.signal,
});
hasil("AbortSignal menghentikan loop setelah partai pertama", panggilBatal === 1, `${panggilBatal}`);
hasil("dibatalkan = true", jalan3.dibatalkan === true);
hasil("hasil partai yang sudah selesai tetap dipakai", jalan3.dianalisis === 1);

riwayat.bersihkanCacheAntiCheat();
hasil("bersihkanCacheAntiCheat mengosongkan cache", riwayat.ukuranCacheAntiCheat() === 0);

const jalanGalat = await riwayat.analisisRiwayatAntiCheat({
  partai: partaiPalsu,
  username: "budi",
  mesin: null,
  parserPgn: async () => {
    throw new Error("mesin mati");
  },
  cariBuku: bukuPalsu,
});
hasil("galat engine tidak melempar, tapi tercatat", jalanGalat.dianalisis === 0 && jalanGalat.galat.length === 2);
hasil("galat partai tidak masuk cache", riwayat.ukuranCacheAntiCheat() === 0);
riwayat.bersihkanCacheAntiCheat();

/* ============================ 7. komponen UI ============================ */

console.log("\n== komponen deteksiEngine.jsx (DOM) ==");

const el = document.getElementById("root");
const root = createRoot(el);
act(() => {
  root.render(React.createElement(I18nProvider, null, React.createElement(DeteksiEngine, { moves: hasilMesin.moves })));
});
const teks = () => el.textContent;
const tID = (kunci, ganti = {}) => {
  let teksKamus = kunci.split(".").reduce((o, k) => (o ? o[k] : undefined), ID) ?? kunci;
  for (const [k, v] of Object.entries(ganti)) teksKamus = teksKamus.replaceAll(`{${k}}`, v);
  return teksKamus;
};

hasil("judul kartu tampil", teks().includes(tID("analisa.antiCheat.judul")), teks().slice(0, 80));
hasil("skor partai engine ter-render", teks().includes(String(skorMesin.w.skor)), `${skorMesin.w.skor}`);
hasil("label level 'tinggi' tampil", teks().includes(tID("analisa.antiCheat.level.tinggi")));
hasil("label metrik kecocokan tampil", teks().includes(tID("analisa.antiCheat.metrik.kecocokan")));
hasil("label metrik ACPL tampil", teks().includes(tID("analisa.antiCheat.metrik.acpl")));
hasil("persen kecocokan ter-render", teks().includes("100.0%"));
hasil("ACPL ter-render", teks().includes("0.0 cp"));
hasil("sanggahan tampil permanen", teks().includes(tID("analisa.antiCheat.disclaimer")));
hasil(
  "sanggahan menyebut peninjauan manusia",
  /ditinjau manusia/i.test(tID("analisa.antiCheat.disclaimer"))
);
hasil("baris per fase tampil", teks().includes(tID("analisa.antiCheat.fase.opening")));

act(() => {
  root.render(React.createElement(I18nProvider, null, React.createElement(DeteksiEngine, { moves: [] })));
});
hasil("moves kosong → pesan tanpa data", teks().includes(tID("analisa.antiCheat.tanpaData")), teks().slice(0, 80));
hasil("moves kosong tetap menampilkan sanggahan", teks().includes(tID("analisa.antiCheat.disclaimer")));

/* ============================ 8. modul fase bersama ============================ */

console.log("\n== modul fase bersama (dipakai Akurasi & anti-cheat) ==");
const papanAwal = new Chess().board();
hasil("posisi awal masih pembukaan", isEndOpening(papanAwal) === false);
hasil("posisi awal masih menengah", isEndMiddlegame(papanAwal) === false);
const papanAkhir = new Chess("4k3/8/8/8/8/8/1K6/R7 b - - 0 9").board();
hasil("posisi minim material = akhir menengah", isEndMiddlegame(papanAkhir) === true);
hasil("fase tidak mundur", faseBerikutnya(FASE_PEMBUKAAN, papanAwal) === FASE_PEMBUKAAN);
hasil("fase maju ke akhir", faseBerikutnya("middlegame", papanAkhir) === "endgame");
hasil("papanDariFen rusak → null", (await import("../src/halaman/Analisa/mesin/fase.js")).papanDariFen("bukan-fen") === null);

/* ============== 9. tab "Deteksi engine" pada DashboardAkun ============== */

console.log("\n== tab Deteksi engine di DashboardAkun (DOM) ==");

const { simpanBanyakPartai } = await import("../src/halaman/Analisa/basisData.js");
const { MesinProvider } = await import("../src/halaman/Analisa/konteks/mesin.jsx");
const { default: DashboardAkun } = await import("../src/halaman/Analisa/akun/DashboardAkun.jsx");

await simpanBanyakPartai(
  [
    { whiteName: "budi", blackName: "lawan1", result: "white", timestamp: 1_700_000_000_000, timeClass: "blitz", pgn: PGN_MESIN },
    { whiteName: "lawan2", blackName: "budi", result: "black", timestamp: 1_700_000_900_000, timeClass: "rapid", pgn: PGN_JUJUR },
  ],
  { platform: "chessCom", username: "budi" }
);

const elAkun = document.createElement("div");
document.body.appendChild(elAkun);
const rootAkun = createRoot(elAkun);
await act(async () => {
  rootAkun.render(
    React.createElement(
      I18nProvider,
      null,
      React.createElement(MesinProvider, null, React.createElement(DashboardAkun, { platform: "chessCom", username: "budi" }))
    )
  );
});
const teksAkun = () => elAkun.textContent;
const tombol = (label) =>
  Array.from(elAkun.querySelectorAll("button")).find((b) => b.textContent.trim() === label);

const tabAntiCheat = tombol(tID("analisa.statistik.antiCheat"));
hasil("tab 'Deteksi engine' terdaftar", Boolean(tabAntiCheat), teksAkun().slice(0, 120));

await act(async () => {
  tabAntiCheat?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
});
hasil(
  "isi tab menjelaskan batas partai",
  teksAkun().includes(tID("analisa.antiCheat.riwayat.batas", { n: 12, user: "budi" }))
);
hasil("isi tab menyebut kedalaman agregat", teksAkun().includes(String(riwayat.KEDALAMAN_AGGREGAT)));
hasil(
  "tombol mulai analisis tampil (tidak jalan otomatis)",
  Boolean(tombol(tID("analisa.antiCheat.riwayat.mulai", { n: 12 })))
);
hasil("sanggahan tampil di tab agregat", teksAkun().includes(tID("analisa.antiCheat.disclaimer")));
hasil(
  "tidak ada kunci kamus mentah yang bocor ke DOM",
  !/analisa\.antiCheat\.[a-zA-Z.]+/.test(teksAkun()),
  teksAkun().match(/analisa\.antiCheat\.[a-zA-Z.]+/)?.[0] ?? ""
);

/* ================= 9. kandidat MultiPV: unit + parsing EngineCatur ================= */

console.log("\n== metrik kandidat MultiPV (generasi 2) ==");

hasil(
  "bobot skor berjumlah 1",
  hampir(Object.values(ac.BOBOT).reduce((a, b) => a + b, 0), 1, 1e-9),
  JSON.stringify(ac.BOBOT)
);
hasil("AMBANG.peringkatJenuh = MULTI_PV + 1", ac.AMBANG.peringkatJenuh === ac.MULTI_PV + 1, `${ac.AMBANG.peringkatJenuh}`);
hasil("komponenPeringkat(1) = 100", ac.komponenPeringkat(1) === 100);
hasil("komponenPeringkat(3) = 60", ac.komponenPeringkat(3) === 60, `${ac.komponenPeringkat(3)}`);
hasil("komponenPeringkat(jenuh) = 0", ac.komponenPeringkat(ac.AMBANG.peringkatJenuh) === 0);
hasil("komponenPeringkat tanpa data = null", ac.komponenPeringkat(null) === null && ac.komponenPeringkat(NaN) === null);

const KANDIDAT = [
  { peringkat: 1, uci: "e2e4", cp: 30, mate: null, wdl: [550, 400, 50] },
  { peringkat: 2, uci: "d2d4", cp: 22, mate: null, wdl: [520, 420, 60] },
  { peringkat: 3, uci: "g1f3", cp: 18, mate: null, wdl: [510, 430, 60] },
  { peringkat: 4, uci: "c2c4", cp: 10, mate: null, wdl: [490, 440, 70] },
  { peringkat: 5, uci: "b1c3", cp: 4, mate: null, wdl: [480, 450, 70] },
];
hasil("peringkatLangkahDalam: rank 1 terbaca", ac.peringkatLangkahDalam("e2e4", KANDIDAT) === 1);
hasil("peringkatLangkahDalam: rank 4 terbaca", ac.peringkatLangkahDalam("c2c4", KANDIDAT) === 4);
hasil("peringkatLangkahDalam: di luar daftar = jenuh", ac.peringkatLangkahDalam("a2a3", KANDIDAT) === ac.MULTI_PV + 1, `${ac.peringkatLangkahDalam("a2a3", KANDIDAT)}`);
hasil("peringkatLangkahDalam: tanpa kandidat = null", ac.peringkatLangkahDalam("e2e4", []) === null && ac.peringkatLangkahDalam("e2e4", undefined) === null);
hasil("kerugianKandidatCp: rank 4 rugi 20 cp", ac.kerugianKandidatCp("c2c4", KANDIDAT) === 20, `${ac.kerugianKandidatCp("c2c4", KANDIDAT)}`);
hasil("kerugianKandidatCp: rank 1 rugi 0", ac.kerugianKandidatCp("e2e4", KANDIDAT) === 0);
hasil("kerugianKandidatCp: di luar daftar = null", ac.kerugianKandidatCp("a2a3", KANDIDAT) === null);
hasil("kerugianKandidatCp: kandidat tunggal = null", ac.kerugianKandidatCp("e2e4", [KANDIDAT[0]]) === null);
hasil("cpKandidat: mate dihitung CP_MATE", ac.cpKandidat({ cp: null, mate: 2 }) === ac.CP_MATE);
hasil("kehilanganMenangPermille: rank 4 kehilangan 60 permille", ac.kehilanganMenangPermille("c2c4", KANDIDAT) === 60, `${ac.kehilanganMenangPermille("c2c4", KANDIDAT)}`);
hasil("kehilanganMenangPermille: tanpa WDL = null", ac.kehilanganMenangPermille("c2c4", KANDIDAT.map(({ wdl, ...k }) => k)) === null);

/* Partai mini: Putih selalu rank 1, Hitam selalu rank 4 → skor Putih > Hitam. */
const KAND = [
  { peringkat: 1, uci: "e2e4", cp: 30, mate: null, wdl: [550, 400, 50] },
  { peringkat: 2, uci: "d2d4", cp: 20, mate: null, wdl: [520, 420, 60] },
  { peringkat: 3, uci: "g1f3", cp: 15, mate: null, wdl: [500, 430, 70] },
  { peringkat: 4, uci: "c2c4", cp: 5, mate: null, wdl: [480, 450, 70] },
  { peringkat: 5, uci: "b1c3", cp: 0, mate: null, wdl: [470, 460, 70] },
];
/*
 * Struktur daftar mengikuti parsePGN: entri bernomor ganjil = langkah
 * (punya `san`+`uci`), entri genap = posisi hasilnya yang membawa `kandidat`
 * (usulan untuk pemain BERIKUTNYA). Langkah pada indeks i membaca kandidat
 * entri i-1 — pola yang sama dengan `bestMoveSan`.
 */
const daftarMini = [];
daftarMini.push({ fen: "8/8/8/8/8/8/8/8 w - - 0 1", color: "b", kandidat: KAND, bestMoveSan: "e4" });
for (let i = 0; i < 40; i++) {
  const warnaGiliran = i % 2 === 0 ? "w" : "b";
  const putihMain = warnaGiliran === "w";
  daftarMini.push({
    san: putihMain ? "e4" : "c4",
    uci: putihMain ? "e2e4" : "c2c4",
    color: putihMain ? "b" : "w",
    moveRating: null,
    fen: "8/8/8/8/8/8/8/8 b - - 0 1",
    previousStaticEvals: [["cp", "30"], ["cp", "0"]],
  });
  // Posisi hasil langkah ini — kandidat untuk pemain berikutnya.
  daftarMini.push({
    fen: "8/8/8/8/8/8/8/8 " + (putihMain ? "b" : "w") + " - - 0 1",
    color: putihMain ? "w" : "b",
    kandidat: KAND,
    bestMoveSan: putihMain ? "c4" : "e4",
  });
}
const mini = ac.hitungSkorKecurigaan(daftarMini);
hasil("mini: Putih (selalu rank 1) peringkat rata-rata 1", mini.w.rataPeringkat === 1, `${mini.w.rataPeringkat}`);
hasil("mini: Hitam (selalu rank 4) peringkat rata-rata 4", mini.b.rataPeringkat === 4, `${mini.b.rataPeringkat}`);
hasil("mini: kecocokan top-3 Putih 100% vs Hitam 0%", mini.w.kecocokanTop3 === 100 && mini.b.kecocokanTop3 === 0, `${mini.w.kecocokanTop3}/${mini.b.kecocokanTop3}`);
hasil("mini: kerugian kandidat Putih 0 vs Hitam 25", mini.w.acplKandidat === 0 && mini.b.acplKandidat === 25, `${mini.w.acplKandidat}/${mini.b.acplKandidat}`);
hasil("mini: komponen peringkat Putih 100 vs Hitam 40", mini.w.komponen?.peringkat === 100 && mini.b.komponen?.peringkat === 40, `${mini.w.komponen?.peringkat}/${mini.b.komponen?.peringkat}`);
hasil("mini: skor Putih lebih tinggi dari Hitam", mini.w.skor > mini.b.skor, `${mini.w.skor} vs ${mini.b.skor}`);
hasil("mini: kecocokan top-5 keduanya 100%", mini.w.kecocokanTop5 === 100 && mini.b.kecocokanTop5 === 100);

/* Partai tanpa kandidat (cache lama) → komponen peringkat null, skor tetap ada. */
const daftarTanpaKandidat = daftarMini.map((e) => ({ ...e, kandidat: undefined }));
const tanpaKandidat = ac.hitungSkorKecurigaan(daftarTanpaKandidat);
hasil("tanpa kandidat: kandidatSampel 0", tanpaKandidat.w.kandidatSampel === 0 && tanpaKandidat.b.kandidatSampel === 0);
hasil("tanpa kandidat: semua metrik peringkat null", tanpaKandidat.w.rataPeringkat === null && tanpaKandidat.w.kecocokanTop3 === null && tanpaKandidat.w.acplKandidat === null);
hasil("tanpa kandidat: komponen peringkat null", tanpaKandidat.w.komponen?.peringkat === null);
hasil("tanpa kandidat: skor tetap dihitung (bobot ternormalisasi ulang)", Number.isFinite(tanpaKandidat.w.skor), `${tanpaKandidat.w.skor}`);
hasil("tanpa kandidat: skor putih = skor hitam (kandidat tidak membedakan lagi)", tanpaKandidat.w.skor === tanpaKandidat.b.skor, `${tanpaKandidat.w.skor}/${tanpaKandidat.b.skor}`);

/* Agregat membawa metrik kandidat dari jumlah mentah. */
const agregatKandidat = ac.agregatSkorPemain(
  [
    { id: "k1", timestamp: 1, warna: "w", hasil: mini },
    { id: "k2", timestamp: 2, warna: "w", hasil: mini },
  ],
  "budi"
);
hasil(
  "agregat: rataPeringkat putih terjaga dari jumlah mentah",
  agregatKandidat.rataPeringkat === mini.w.rataPeringkat,
  `${agregatKandidat.rataPeringkat} vs ${mini.w.rataPeringkat}`
);
hasil("agregat: kandidatSampel terjumlah ulang", agregatKandidat.kandidatSampel === 2 * mini.w.kandidatSampel, `${agregatKandidat.kandidatSampel}`);
hasil("agregat: kecocokanTop3 ikut terbawa", Number.isFinite(agregatKandidat.kecocokanTop3), `${agregatKandidat.kecocokanTop3}`);

/* Agregat campuran w+b membagi rata peringkat sesuai proporsi sampelnya. */
const agregatCampur = ac.agregatSkorPemain(
  [
    { id: "m1", timestamp: 1, warna: "w", hasil: mini },
    { id: "m2", timestamp: 2, warna: "b", hasil: mini },
  ],
  "budi"
);
hasil(
  "agregat campur: rataPeringkat = rata-rata berbobot sampel w & b",
  hampir(agregatCampur.rataPeringkat, (mini.w.rataPeringkat * mini.w.kandidatSampel + mini.b.rataPeringkat * mini.b.kandidatSampel) / (mini.w.kandidatSampel + mini.b.kandidatSampel), 0.01),
  `${agregatCampur.rataPeringkat}`
);

/* ---------------- parsing baris `info multipv` di EngineCatur ---------------- */

console.log("\n== EngineCatur: parsing MultiPV + WDL (worker tiruan) ==");
{
  const ec = new EngineCatur();
  const terkirim = [];
  ec.kirim = (perintah) => terkirim.push(perintah);
  const janji = ec.cari({ fen: "posisi-uji", kedalaman: 8, multiPv: 3 });

  // Urutan baris meniru Stockfish: setiap iterasi kedalaman menerbitkan
  // multipv 1..N; batch terakhir (depth 9) yang harus menang.
  ec.terima("info depth 8 multipv 1 score cp 30 wdl 540 410 50 pv e2e4 e7e5 g1f3");
  ec.terima("info depth 8 multipv 2 score cp 20 wdl 520 420 60 pv d2d4 d7d5 g1f3");
  ec.terima("info depth 8 multipv 3 score cp 10 wdl 500 430 70 pv c2c4 c7c5");
  ec.terima("info depth 7 multipv 2 score cp 25 upperbound pv d2d4");
  ec.terima("info depth 9 multipv 1 score cp 35 wdl 560 390 50 pv e2e4 e7e5 g1f3 b8c6");
  ec.terima("info depth 9 multipv 2 score cp 18 wdl 515 425 60 pv d2d4 d7d5 c1g5");
  ec.terima("info depth 9 multipv 3 score cp 9 pv g1f3 g8f6");
  ec.terima("bestmove e2e4");
  const keluar = await janji;

  hasil("bestmove diteruskan", keluar.uci === "e2e4", `${keluar.uci}`);
  hasil("info = baris peringkat 1 TERDALAM (cp 35, bukan cp 10)", keluar.info?.cp === 35 && keluar.info?.kedalaman === 9, JSON.stringify(keluar.info));
  hasil("tiga kandidat terekam", Array.isArray(keluar.daftarPv) && keluar.daftarPv.length === 3, `${keluar.daftarPv?.length}`);
  hasil("kandidat 1: cp 35 + WDL 560/390/50 + pv dipotong benar", keluar.daftarPv[0]?.cp === 35 && keluar.daftarPv[0]?.wdl?.[0] === 560 && keluar.daftarPv[0]?.pv?.length === 4, JSON.stringify(keluar.daftarPv[0]));
  hasil("kandidat 3: baris tanpa WDL → wdl null", keluar.daftarPv[2]?.cp === 9 && keluar.daftarPv[2]?.wdl === null, JSON.stringify(keluar.daftarPv[2]));
  hasil("baris upperbound tidak masuk daftar (ditembus batch depth 9)", keluar.daftarPv[1]?.cp === 18, `${keluar.daftarPv[1]?.cp}`);
  hasil("kandidat terurut peringkat", keluar.daftarPv.map((x) => x.peringkat).join(",") === "1,2,3");
  hasil("setoption MultiPV 3 dikirim sebelum go", terkirim.includes("setoption name MultiPV value 3"), terkirim.join(" | "));
  hasil("opsi MultiPV dikembalikan ke 1 setelah bestmove", terkirim.filter((c) => c === "setoption name MultiPV value 1").length === 1 && ec.multiPvAktif === 1);
}
{
  const ec2 = new EngineCatur();
  ec2.kirim = () => {};
  const j2 = ec2.cari({ fen: "x", kedalaman: 4 });
  ec2.terima("info depth 4 multipv 1 score cp 12 pv e2e4");
  ec2.terima("info depth 4 multipv 2 score cp 8 pv d2d4");
  ec2.terima("bestmove e2e4");
  const k2 = await j2;
  hasil("tanpa multiPv: daftarPv null meski baris multipv lewat", k2.daftarPv === null && k2.info?.cp === 12, JSON.stringify(k2));
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
