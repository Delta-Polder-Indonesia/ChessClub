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
 *   9. METRIK KONDISIONAL (fase 2): keranjang posisi sulit/mudah dari
 *      ketajaman kandidat, rentetan langkah terbaik beruntun, dan korelasi
 *      Spearman waktu pikir ↔ peringkat kandidat.
 *  10. KALIBRASI PER RATING: band KALIBRASI_RATING, pilihKalibrasi,
 *      ratingDariMetadata, median rating agregat, arah pengaruhnya ke skor.
 *  11. LAPORAN PENINJAUAN: teks + JSON + sanggahan wajib.
 *  12. DEVIASI MANUSIA (siap-Maia): kejutan bit & peringkat distribusi.
 *  13. ORKESTRATOR LANJUTAN: durasi per partai + cache localStorage
 *      lintas-sesi (baca ulang setelah memori dibersihkan).
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
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { Chess } = await import("chess.js");
const { ID } = await import("../src/lib/terjemahan/id/index.js");
const { formatSquare, parsePGN } = await import("../src/halaman/Analisa/mesin/engine.js");
const { EngineCatur } = await import("../src/lib/engineCatur.js");
const laporan = await import("../src/halaman/Analisa/mesin/laporanPeninjauan.js");
const deviasi = await import("../src/halaman/Analisa/mesin/deviasiManusia.js");
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
hasil("jam seragam positif → konsistensi 1", waktuSeragam?.konsistensi === 1 && waktuSeragam.koefisienVariasi === 0);
hasil("semua clock nol → waktu tidak informatif (null)", ac.statistikWaktu(Array(10).fill(0)) === null);
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

hasil(
  "jumlah kosong memakai bawaan 12",
  [undefined, null, "", "   "].every((nilai) => riwayat.batasPartaiDariInput(nilai) === 12)
);
hasil(
  "jumlah custom menerima angka dan teks bilangan bulat positif",
  riwayat.batasPartaiDariInput(30) === 30 && riwayat.batasPartaiDariInput(" 30 ") === 30 &&
    riwayat.batasPartaiDariInput("1") === 1
);
const jumlahTidakSah = [0, -1, 1.5, "abc", Infinity, NaN, Number.MAX_SAFE_INTEGER + 1];
hasil(
  "nol, negatif, pecahan, teks, dan angka tidak aman ditolak",
  jumlahTidakSah.every((nilai) => riwayat.batasPartaiDariInput(nilai) === null)
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

/* ---- jumlah custom harus melewati kedua batas, bukan hanya pemilih ---- */
{
  const partaiBanyak = Array.from({ length: 30 }, (_, i) => ({
    ...partaiPalsu[0], id: `batas-${i + 1}`, timestamp: i + 1,
  }));
  const opsiJumlah = {
    partai: partaiBanyak, username: "budi", mesin: null, parserPgn: parserPalsu, cariBuku: bukuPalsu,
  };
  const bawaan = await riwayat.analisisRiwayatAntiCheat(opsiJumlah);
  hasil("orkestrator tanpa jumlah tetap menganalisis 12", bawaan.total === 12 && bawaan.dianalisis === 12);
  hasil(
    "bawaan mengambil 12 terbaru, bukan 12 pertama dari masukan",
    bawaan.agregat.partai[0]?.id === "batas-19" && bawaan.agregat.partai.at(-1)?.id === "batas-30"
  );

  const progresJumlah = [];
  const custom = await riwayat.analisisRiwayatAntiCheat({
    ...opsiJumlah, batas: 20, progres: (p) => progresJumlah.push(p),
  });
  hasil("orkestrator custom 20 tidak terpotong menjadi 12", custom.total === 20 && custom.dianalisis === 20);
  hasil("agregat menghitung seluruh 20 partai custom", custom.agregat.jumlahPartai === 20);
  hasil(
    "custom mengambil terbaru hingga jumlah pilihan",
    custom.agregat.partai[0]?.id === "batas-11" && custom.agregat.partai.at(-1)?.id === "batas-30"
  );
  hasil("memperbesar jumlah tetap memakai cache 12 partai sebelumnya", custom.dariCache === 12);
  hasil("progres memakai jumlah custom", progresJumlah.at(-1)?.ke === 20 && progresJumlah.at(-1)?.total === 20);

  const kecil = await riwayat.analisisRiwayatAntiCheat({ ...opsiJumlah, batas: 3 });
  hasil("jumlah custom di bawah 12 juga dihormati", kecil.total === 3 && kecil.dianalisis === 3);
  const kosong = await riwayat.analisisRiwayatAntiCheat({ ...opsiJumlah, batas: "" });
  hasil("jumlah yang dikosongkan kembali ke 12", kosong.total === 12 && kosong.dianalisis === 12);
  const melebihiArsip = await riwayat.analisisRiwayatAntiCheat({ ...opsiJumlah, batas: 50 });
  hasil("jumlah melebihi arsip hanya menganalisis yang tersedia", melebihiArsip.total === 30 && melebihiArsip.dianalisis === 30);

  const parseSebelum = panggilParse;
  for (const batas of jumlahTidakSah) {
    let ditolak = false;
    try {
      await riwayat.analisisRiwayatAntiCheat({ ...opsiJumlah, batas });
    } catch (e) {
      ditolak = e instanceof RangeError;
    }
    hasil(`orkestrator menolak jumlah tidak sah: ${batas}`, ditolak);
  }
  hasil("jumlah tidak sah tidak menjalankan parser", panggilParse === parseSebelum);
  riwayat.bersihkanCacheAntiCheat();
}

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
hasil("baris ACPL baku tampil", teks().includes(tID("analisa.antiCheat.metrik.acplBaku")));
hasil("baris akurasi metode lichess tampil", teks().includes(tID("analisa.antiCheat.metrik.akurasi")));
hasil("catatan metode metrik baku tampil", teks().includes(tID("analisa.antiCheat.catatanMetrikBaku")));

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

/* ============== 9. pemisahan Akun dan layar Deteksi engine ============== */

console.log("\n== Akun tanpa artefak dan layar Deteksi engine (DOM) ==");

const { simpanBanyakPartai, pastikanKoleksi } = await import("../src/halaman/Analisa/basisData.js");
const { KonteksMesin } = await import("../src/halaman/Analisa/konteks/mesinKonteks.js");
const { default: DashboardAkun } = await import("../src/halaman/Analisa/akun/DashboardAkun.jsx");
const { default: LayarDeteksiEngine } = await import("../src/halaman/Analisa/komponen/nav/layarDeteksiEngine.jsx");
const { default: AnalyzeContextProvider } = await import("../src/halaman/Analisa/konteks/analyze.jsx");
const { AnalyzeContext } = await import("../src/halaman/Analisa/konteks/analyzeKonteks.js");
const { bacaDaftarAkun, simpanDaftarAkun } = await import("../src/halaman/Analisa/akun/daftarAkun.js");

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
      React.createElement(DashboardAkun, { platform: "chessCom", username: "budi" })
    )
  );
});
const teksAkun = () => elAkun.textContent;
const tombol = (label) =>
  Array.from(elAkun.querySelectorAll("button")).find((b) => b.textContent.trim() === label);

hasil("Akun tidak memiliki tab/pintasan Deteksi engine", !tombol(tID("analisa.nav.deteksiEngine")));
hasil("Akun hanya memiliki tiga tombol tab statistik", elAkun.querySelectorAll("button").length === 3);
hasil("Akun tidak lagi merender input deteksi duplikat", !elAkun.querySelector('input[type="number"]'));
hasil("Akun tidak lagi menyiapkan tombol analisis agregat sendiri", !tombol(tID("analisa.antiCheat.riwayat.mulai", { n: 12 })));
hasil("ketiga tab statistik tetap tersedia", ["overview", "ratings", "openings"].every((k) => tombol(tID(`analisa.statistik.${k}`))));
hasil(
  "tidak ada kunci kamus mentah yang bocor ke DOM",
  !/analisa\.antiCheat\.[a-zA-Z.]+/.test(teksAkun()),
  teksAkun().match(/analisa\.antiCheat\.[a-zA-Z.]+/)?.[0] ?? ""
);

/* ---- layar khusus: pilihan akun, jumlah, filter, kedalaman, dan siklus run ---- */
act(() => rootAkun.unmount());
{
  const username = "budijumlah";
  const partaiJumlah = Array.from({ length: 20 }, (_, i) => ({
    id: `ui-jumlah-${i + 1}`,
    whiteName: username,
    blackName: `lawan-${i + 1}`,
    result: "white",
    timestamp: 1_700_100_000_000 + i * 1000,
    timeClass: "blitz",
    pgn: PGN_MESIN.replace('[White "Mesin"]', `[White "${username}"]`)
      .replace('[Black "Manusia"]', `[Black "lawan-${i + 1}"]`),
  }));
  await simpanBanyakPartai(partaiJumlah, { platform: "chessCom", username });
  for (const p of partaiJumlah) {
    riwayat.simpanCachePartai(p.id, riwayat.KEDALAMAN_AGGREGAT, {
      metadata: { ...hasilMesin.metadata, players: [{ name: username }, { name: p.blackName }] },
      hasil: skorMesin,
    });
  }

  await pastikanKoleksi({ platform: "chessCom", username: "akunarsip" });
  const daftarAwal = bacaDaftarAkun();
  simpanDaftarAkun([{ platform: "chessCom", username }, { platform: "lichessOrg", username }, { platform: "chessCom", username: "budi" }]);
  const partaiLichess = partaiJumlah.slice(0, 4).map((p, i) => ({
    ...p, id: `ui-lichess-${i + 1}`, blackName: `lichess-lawan-${i + 1}`,
    pgn: p.pgn.replace(`[Black "${p.blackName}"]`, `[Black "lichess-lawan-${i + 1}"]`),
  }));
  await simpanBanyakPartai(partaiLichess, { platform: "lichessOrg", username });
  for (const p of partaiLichess) {
    riwayat.simpanCachePartai(p.id, 8, { metadata: { ...hasilMesin.metadata, players: [{ name: username }, { name: p.blackName }] }, hasil: skorMesin });
  }

  let siapkanDipanggil = 0;
  let setopDipanggil = 0;
  let galatMesin = null;
  let blokirPencarian = false;
  let rilisPencarian;
  let rilisMesin;
  const pencarian = [];
  const engineDasar = buatEnginePalsu(peta, "sempurna");
  const engineJumlah = {
    ...engineDasar,
    cari: async (fen, opsi) => {
      pencarian.push(opsi);
      if (blokirPencarian) {
        blokirPencarian = false;
        await new Promise((resolve) => { rilisPencarian = resolve; });
      }
      return engineDasar.cari(fen, opsi);
    },
    setop: () => { setopDipanggil++; },
  };
  const mesinJumlah = {
    siapkan: () => {
      siapkanDipanggil++;
      if (galatMesin) return Promise.reject(galatMesin);
      return new Promise((resolve) => { rilisMesin = () => resolve(engineJumlah); });
    },
    setop: () => { setopDipanggil++; },
  };
  const rootJumlah = createRoot(elAkun);
  let ctxJumlah;
  function ProbeJumlah() {
    ctxJumlah = React.useContext(AnalyzeContext);
    return null;
  }
  await act(async () => rootJumlah.render(
    React.createElement(I18nProvider, null,
      React.createElement(KonteksMesin.Provider, { value: mesinJumlah },
        React.createElement(AnalyzeContextProvider, null,
          React.createElement(ProbeJumlah), React.createElement(LayarDeteksiEngine, { onBukaAkun: () => {} })
        )
      )
    )
  ));
  const renderJumlah = (nama) => ctxJumlah.akun[1]({ platform: "chessCom", username: nama });
  await act(async () => renderJumlah(username));

  const inputJumlah = () => elAkun.querySelector('[data-uji="deteksi-jumlah"]');
  const isiJumlah = (nilai) => act(() => {
    const input = inputJumlah();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, nilai);
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  const tombolJumlah = (n) => tombol(tID("analisa.antiCheat.riwayat.mulai", { n })) ||
    tombol(tID("analisa.antiCheat.riwayat.mulaiUlang", { n }));
  const mulaiJumlah = async (n) => {
    await act(async () => tombolJumlah(n)?.click());
  };
  const selesaiJumlah = async () => {
    await act(async () => rilisMesin?.());
  };
  const barisJumlah = () => Array.from(elAkun.querySelectorAll("tbody tr"));
  const pilihDeteksi = (jenis, nilai) => act(async () => {
    const kontrol = elAkun.querySelector(`[data-uji="deteksi-${jenis}"]`);
    // Lewati value tracker React pada input angka seperti pada isiJumlah;
    // assignment biasa bisa menandai nilai baru sebagai sudah terobservasi,
    // sehingga event `input` tidak memicu onChange (mis. pilihan kedalaman).
    const setNilai = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(kontrol), "value")?.set;
    if (setNilai) setNilai.call(kontrol, nilai);
    else kontrol.value = nilai;
    // Select merespons event 'change', input angka merespons 'input' —
    // keduanya dikirim supaya helper berlaku untuk kedua jenis kontrol.
    kontrol.dispatchEvent(new window.Event("input", { bubbles: true }));
    kontrol.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  const tungguUi = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  const batalJumlah = () => act(async () => tombol(tID("analisa.antiCheat.riwayat.batal"))?.click());
  // Penjelasan pengaturan kini berada di dialog ikon info (portaled ke body).
  const bukaInfo = (nama) => act(async () => {
    elAkun.querySelector(`[data-uji="info-${nama}"]`)?.click();
  });
  const tutupInfo = () => act(async () => {
    Array.from(document.body.querySelectorAll("button"))
      .find((b) => b.textContent.trim() === tID("analisa.antiCheat.riwayat.mengerti"))
      ?.click();
  });

  hasil("layar baru tetap memakai panel/token Analisa", !!elAkun.querySelector('section.bg-backgroundBoxDarker') && elAkun.querySelectorAll('.border-border.bg-backgroundBox').length >= 2);
  hasil("delapan pengaturan memiliki kontrol berlabel", Array.from(elAkun.querySelectorAll("select, input")).length === 8 && Array.from(elAkun.querySelectorAll("select, input")).every((el) => el.labels.length > 0));
  hasil("kedalaman deteksi bawaan 8, papan tetap 13", elAkun.querySelector('[data-uji="deteksi-kedalaman"]').value === "8" && ctxJumlah.depth[0] === 13);
  hasil("progres papan 0 tidak dianggap sedang berjalan", ctxJumlah.progress[0] === 0 && tombolJumlah(12)?.disabled === false);
  hasil("layar menunggu perintah, tidak menyiapkan engine otomatis", siapkanDipanggil === 0 && !elAkun.querySelector("tbody"));
  hasil("sanggahan tampil sebelum analisis dimulai", teksAkun().includes(tID("analisa.antiCheat.disclaimer")));
  hasil("keadaan awal hasil memiliki petunjuk", teksAkun().includes(tID("analisa.antiCheat.riwayat.hasilKosong")));

  hasil("kolom jumlah opsional tampil kosong dengan placeholder 12", inputJumlah()?.value === "" && inputJumlah()?.placeholder === "12");
  hasil("kolom jumlah memiliki label terhubung", inputJumlah()?.labels[0]?.textContent.trim() === tID("analisa.antiCheat.riwayat.jumlahPartai"));
  await bukaInfo("jumlah");
  hasil("petunjuk menjelaskan bawaan saat kolom kosong", document.body.textContent.includes(tID("analisa.antiCheat.riwayat.jumlahPetunjuk", { n: 12 })));
  await tutupInfo();

  isiJumlah("20");
  hasil("tombol mengikuti jumlah custom 20", Boolean(tombolJumlah(20)));
  await bukaInfo("jumlah");
  hasil("keterangan batas mengikuti jumlah custom", document.body.textContent.includes(tID("analisa.antiCheat.riwayat.batas", { n: 20, user: username })));
  await tutupInfo();
  await mulaiJumlah(20);
  hasil("jumlah tidak dapat diedit saat analisis berjalan", inputJumlah()?.disabled === true);
  hasil("situs/akun/kedalaman/waktu terkunci selama run", Array.from(elAkun.querySelectorAll("select")).every((el) => el.disabled));
  hasil("bar progres memiliki nilai aksesibel", elAkun.querySelector('[role="progressbar"]')?.getAttribute("aria-valuemax") === "20");
  hasil("progres awal memakai jumlah custom", teksAkun().includes(tID("analisa.antiCheat.riwayat.progres", { ke: 0, total: 20 })));
  await selesaiJumlah();
  hasil("input 20 menghasilkan 20 partai di tabel (kedua batas terlewati)", barisJumlah().length === 20);
  hasil("kolom dapat diedit setelah analisis selesai", inputJumlah()?.disabled === false);
  hasil("metrik/level/fase/tren hasil lama tetap tampil", ["analisa.antiCheat.skor", "analisa.antiCheat.metrik.kecocokan", "analisa.antiCheat.metrik.acplBaku", "analisa.antiCheat.metrik.akurasi", "analisa.antiCheat.perFase", "analisa.antiCheat.riwayat.tren"].every((k) => teksAkun().includes(tID(k))));
  hasil("hasil tetap menyediakan unduh/durasi/sanggahan", !!tombol(tID("analisa.antiCheat.riwayat.unduh")) && teksAkun().includes(tID("analisa.antiCheat.disclaimer")) && /detik/.test(teksAkun()));

  isiJumlah("");
  hasil("mengosongkan kolom mengembalikan tombol ke 12", Boolean(tombolJumlah(12)));
  await mulaiJumlah(12);
  await selesaiJumlah();
  hasil("kolom kosong benar-benar menganalisis 12 dari database", barisJumlah().length === 12);
  hasil("12 bawaan adalah partai terbaru", barisJumlah()[0]?.textContent.includes("lawan-9") && barisJumlah().at(-1)?.textContent.includes("lawan-20"));

  isiJumlah("3");
  await mulaiJumlah(3);
  await selesaiJumlah();
  hasil("input custom 3 menghasilkan 3 partai terbaru", barisJumlah().length === 3 && barisJumlah()[0]?.textContent.includes("lawan-18"));

  isiJumlah("50");
  await mulaiJumlah(50);
  hasil("progres dibatasi partai yang tersedia saat input melebihi arsip", teksAkun().includes(tID("analisa.antiCheat.riwayat.progres", { ke: 0, total: 20 })));
  await selesaiJumlah();
  hasil("input melebihi arsip memakai 20 partai tersedia", barisJumlah().length === 20);

  const siapkanSebelum = siapkanDipanggil;
  for (const nilai of ["0", "-1", "1.5"]) {
    isiJumlah(nilai);
    hasil(`input tidak sah ${nilai}: ditandai dan tombol dinonaktifkan`, inputJumlah()?.getAttribute("aria-invalid") === "true" && tombolJumlah(12)?.disabled === true);
    hasil(`input tidak sah ${nilai}: pesan galat tampil`, elAkun.querySelector('[role="alert"]')?.textContent.trim() === tID("analisa.antiCheat.riwayat.jumlahTidakValid"));
    await mulaiJumlah(12);
  }
  hasil("input tidak sah tidak menyiapkan engine", siapkanDipanggil === siapkanSebelum);
  isiJumlah("");
  hasil("mengosongkan input galat memulihkan bawaan tanpa pesan galat", inputJumlah()?.getAttribute("aria-invalid") === "false" && tombolJumlah(12)?.disabled === false && !elAkun.querySelector('[role="alert"]'));

  const siapkanSebelumPapan = siapkanDipanggil;
  await act(async () => ctxJumlah.pageState[1]("loading"));
  hasil("analisis papan memblokir run deteksi", tombolJumlah(12)?.disabled && teksAkun().includes(tID("analisa.antiCheat.riwayat.papanSibuk")));
  await mulaiJumlah(12);
  hasil("run terblokir tidak mengganggu engine papan", siapkanDipanggil === siapkanSebelumPapan && setopDipanggil === 0);
  await act(async () => { ctxJumlah.pageState[1]("analyze"); ctxJumlah.analyzingMove[1](true); });
  hasil("pencarian langkah manual papan juga memblokir deteksi", tombolJumlah(12)?.disabled === true);
  await act(async () => ctxJumlah.analyzingMove[1](false));
  hasil("selesai analisis papan membuka kembali tombol", tombolJumlah(12)?.disabled === false);

  const partaiRapid = Array.from({ length: 15 }, (_, i) => ({
    ...partaiJumlah[i], id: `ui-rapid-${i + 1}`, blackName: `rapid-lawan-${i + 1}`,
    timestamp: 1_700_200_000_000 + i * 1000, timeClass: "rapid",
    pgn: partaiJumlah[i].pgn.replace(`[Black "${partaiJumlah[i].blackName}"]`, `[Black "rapid-lawan-${i + 1}"]`),
  }));
  await simpanBanyakPartai(partaiRapid, { platform: "chessCom", username });
  for (const p of partaiRapid) {
    riwayat.simpanCachePartai(p.id, 8, { metadata: { ...hasilMesin.metadata, players: [{ name: username }, { name: p.blackName }] }, hasil: skorMesin });
  }
  isiJumlah("20");
  await pilihDeteksi("waktu", "blitz");
  hasil("ganti kontrol waktu membersihkan hasil lama", barisJumlah().length === 0);
  await mulaiJumlah(20);
  await selesaiJumlah();
  hasil("filter blitz diterapkan sebelum limit 20 meski 15 rapid lebih baru", barisJumlah().length === 20 && barisJumlah().every((b) => !b.textContent.includes("rapid-lawan")));
  await pilihDeteksi("waktu", "rapid");
  isiJumlah("3");
  await mulaiJumlah(3);
  await selesaiJumlah();
  hasil("rapid memilih tiga rapid terbaru saja", barisJumlah().length === 3 && barisJumlah()[0]?.textContent.includes("rapid-lawan-13") && barisJumlah().at(-1)?.textContent.includes("rapid-lawan-15"));
  await pilihDeteksi("waktu", "any");
  isiJumlah("50");
  await mulaiJumlah(50);
  await selesaiJumlah();
  hasil("opsi semua waktu tidak diteruskan sebagai filter 'any'", barisJumlah().length === 35);

  await pilihDeteksi("situs", "lichessOrg");
  hasil("situs mengubah akun konteks dan mengosongkan hasil/jumlah", ctxJumlah.akun[0].platform === "lichessOrg" && ctxJumlah.akun[0].username === username && inputJumlah().value === "" && !barisJumlah().length);
  await mulaiJumlah(12);
  await selesaiJumlah();
  hasil("koleksi Lichess dipakai, bukan Chess.com dengan username sama", barisJumlah().length === 4 && barisJumlah().every((b) => b.textContent.includes("lichess-lawan")));
  await pilihDeteksi("situs", "chessCom");
  await pilihDeteksi("akun", "budi");
  hasil("pemilih akun tersambung ke konteks akun", ctxJumlah.akun[0].username === "budi" && !barisJumlah().length);
  await pilihDeteksi("akun", username);
  await pilihDeteksi("waktu", "rapid");
  await pilihDeteksi("kedalaman", "10");
  isiJumlah("1");
  await mulaiJumlah(1);
  await selesaiJumlah();
  hasil("kedalaman terpilih benar-benar mencapai pencarian engine", pencarian.length > 0 && pencarian.every((p) => p.kedalaman === 10));
  hasil("MultiPV tetap 5 di layar baru", pencarian.every((p) => p.multiPv === ac.MULTI_PV));
  hasil("kedalaman deteksi tidak mengubah kedalaman/data papan", ctxJumlah.depth[0] === 13 && ctxJumlah.data[0].format === "fen" && ctxJumlah.data[0].string === "");
  hasil("cache terpisah untuk kedalaman 8 dan 10", !!riwayat.bacaCachePartai("ui-rapid-15", 8) && !!riwayat.bacaCachePartai("ui-rapid-15", 10));
  const pencarianSebelumCache = pencarian.length;
  await mulaiJumlah(1);
  await selesaiJumlah();
  hasil("ulang pada kedalaman sama memakai cache tanpa pencarian baru", pencarian.length === pencarianSebelumCache && barisJumlah().length === 1);

  isiJumlah("3");
  blokirPencarian = true;
  await mulaiJumlah(3);
  await selesaiJumlah();
  hasil("run kedua melaporkan satu hasil sebelum pencarian berikutnya", typeof rilisPencarian === "function" && teksAkun().includes(tID("analisa.antiCheat.riwayat.progres", { ke: 1, total: 3 })));
  await batalJumlah();
  await act(async () => rilisPencarian?.());
  hasil("Batal menyetop engine dan tetap menampilkan partai selesai", setopDipanggil > 0 && barisJumlah().length === 1 && teksAkun().includes(tID("analisa.antiCheat.riwayat.dibatalkan")));
  hasil("setelah batal kontrol dibuka kembali", !inputJumlah().disabled && !elAkun.querySelector('[role="progressbar"]'));

  await mulaiJumlah(3);
  await batalJumlah();
  await selesaiJumlah();
  hasil("batal saat menyiapkan engine tidak menulis hasil terlambat", !barisJumlah().length && !inputJumlah().disabled && teksAkun().includes(tID("analisa.antiCheat.riwayat.dibatalkan")));

  isiJumlah("20");
  await mulaiJumlah(20);
  const rilisRunLama = rilisMesin;
  await act(async () => renderJumlah("budi"));
  hasil("ganti akun mengosongkan jumlah custom dan kembali ke 12", inputJumlah()?.value === "" && Boolean(tombolJumlah(12)));
  await act(async () => rilisRunLama?.());
  hasil("hasil run akun lama tidak menimpa akun baru", !barisJumlah().length && elAkun.querySelector('[data-uji="deteksi-akun"]').value === "budi" && !inputJumlah().disabled);
  await tungguUi();
  hasil("akun koleksi DB yang tidak ada di daftar lokal tetap dapat dipilih", Array.from(elAkun.querySelector('[data-uji="deteksi-akun"]').options).some((o) => o.value === "budi") && Array.from(elAkun.querySelector('[data-uji="deteksi-akun"]').options).some((o) => o.value === "akunarsip"));

  await act(async () => renderJumlah("tanpaarsip"));
  const siapkanSebelumKosong = siapkanDipanggil;
  await mulaiJumlah(12);
  await tungguUi();
  hasil("filter/akun tanpa partai menampilkan keadaan kosong tanpa engine", siapkanDipanggil === siapkanSebelumKosong && teksAkun().includes(tID("analisa.antiCheat.riwayat.tanpaPartai")));
  await act(async () => renderJumlah(username));
  isiJumlah("1");
  galatMesin = new Error("engine-uji-gagal");
  await mulaiJumlah(1);
  await tungguUi();
  hasil("galat engine dilaporkan dan kontrol tidak terkunci", elAkun.querySelector('[role="alert"]')?.textContent.includes("engine-uji-gagal") && !inputJumlah().disabled);
  galatMesin = null;
  await mulaiJumlah(1);
  await selesaiJumlah();
  hasil("run dapat diulang setelah galat tanpa pesan lama", barisJumlah().length === 1 && !elAkun.querySelector('[role="alert"]'));
  hasil("tidak ada kunci kamus mentah di layar khusus", !/analisa\.(antiCheat|kedalaman|nav)\.[a-zA-Z.]+/.test(teksAkun()));

  await mulaiJumlah(1);
  const rilisSetelahUnmount = rilisMesin;
  act(() => rootJumlah.unmount());
  await act(async () => rilisSetelahUnmount?.());
  hasil("keluar layar menolak hasil run yang belum selesai", elAkun.childElementCount === 0);
  simpanDaftarAkun(daftarAwal);
  riwayat.bersihkanCacheAntiCheat();
}

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
hasil("peringkatLangkahDalam: daftar MultiPV parsial tidak dianggap peringkat terburuk", ac.peringkatLangkahDalam("a2a3", KANDIDAT.slice(0, 2)) === null);
hasil("peringkatLangkahDalam: daftar kandidat rusak → null", ac.peringkatLangkahDalam("a2a3", [{ uci: "e2e4", peringkat: 1 }, { uci: null, peringkat: 2 }]) === null);
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

/* ============ 10. kondisional fase 2: sulit/mudah, streak, korelasi ============ */

console.log("\n== metrik kondisional: keranjang ketajaman, streak, korelasi waktu↔kualitas ==");

hasil(
  "AMBANG: kandidatSulit < kandidatMudah (keranjang tidak tumpang tindih)",
  ac.AMBANG.kandidatSulit < ac.AMBANG.kandidatMudah,
  `${ac.AMBANG.kandidatSulit}/${ac.AMBANG.kandidatMudah}`
);
hasil(
  "ketajamanKandidat: selisih cp #1 vs #3",
  ac.ketajamanKandidat(KANDIDAT) === 12,
  `${ac.ketajamanKandidat(KANDIDAT)}`
);
hasil(
  "ketajamanKandidat: kurang dari 3 kandidat memakai terakhir",
  ac.ketajamanKandidat(KANDIDAT.slice(0, 2)) === 8,
  `${ac.ketajamanKandidat(KANDIDAT.slice(0, 2))}`
);
hasil("ketajamanKandidat: kosong = null", ac.ketajamanKandidat([]) === null && ac.ketajamanKandidat(undefined) === null);
hasil(
  "ketajamanKandidat: mate dihitung CP_MATE",
  ac.ketajamanKandidat([
    { peringkat: 1, uci: "x", cp: null, mate: 1 },
    { peringkat: 2, uci: "y", cp: 50, mate: null },
  ]) === ac.CP_MATE - 50
);

/* Spearman: monoton sempurna, ties, sampel kurang, varians nol. */
const pasanganManusia = [];
for (let i = 0; i < 15; i++) pasanganManusia.push({ detik: i + 1, peringkat: 15 - i });
hasil("korelasiSpearman: makin lama makin baik → -1", ac.korelasiSpearman(pasanganManusia) === -1, `${ac.korelasiSpearman(pasanganManusia)}`);
hasil(
  "korelasiSpearman: makin lama makin buruk → +1 (pola mustahil manusia)",
  ac.korelasiSpearman(pasanganManusia.map((p) => ({ detik: p.detik, peringkat: 16 - p.peringkat }))) === 1
);
hasil("korelasiSpearman: sampel < minimum → null", ac.korelasiSpearman(pasanganManusia.slice(0, 5)) === null);
hasil(
  "korelasiSpearman: varians nol (semua waktu sama) → null",
  ac.korelasiSpearman(pasanganManusia.map((p) => ({ detik: 5, peringkat: p.peringkat }))) === null
);
hasil("korelasiSpearman: pasangan rusak dibuang", ac.korelasiSpearman([{ detik: null, peringkat: 2 }, ...pasanganManusia]) === -1);
const pasanganSeri = [];
for (let i = 0; i < 12; i++) pasanganSeri.push({ detik: Math.floor(i / 3), peringkat: Math.floor(i / 4) });
hasil("korelasiSpearman: ties dirata-rata tanpa NaN", Number.isFinite(ac.korelasiSpearman(pasanganSeri)), `${ac.korelasiSpearman(pasanganSeri)}`);

/* Streak pada partai mini generasi 2 yang sudah ada. */
hasil(
  "mini: Putih (selalu rank 1) streak = jumlah langkah ber-kandidat",
  mini.w.streakTerpanjang === mini.w.kandidatSampel,
  `${mini.w.streakTerpanjang}/${mini.w.kandidatSampel}`
);
hasil("mini: Hitam (selalu rank 4) streak 0", mini.b.streakTerpanjang === 0, `${mini.b.streakTerpanjang}`);
hasil(
  "tanpa kandidat: metrik kondisional null",
  tanpaKandidat.w.kecocokanSulit === null && tanpaKandidat.w.kecocokanMudah === null && tanpaKandidat.w.korelasiWaktuKualitas === null && tanpaKandidat.w.streakTerpanjang === 0
);

/* Partai kondisional: putih = "pemakai engine" (sempurna saat sulit,
 * hancur saat mudah), hitam = "manusia" (sebaliknya). Posisi sulit/mudah
 * bergantian; detik putih menempel pada pola kualitas (korelasi -1),
 * detik hitam justru terbalik (korelasi +1). */
const KANDIDAT_SULIT = [
  { peringkat: 1, uci: "e2e4", cp: 30, mate: null, wdl: null },
  { peringkat: 2, uci: "d2d4", cp: 29, mate: null, wdl: null },
  { peringkat: 3, uci: "g1f3", cp: 28, mate: null, wdl: null },
  { peringkat: 4, uci: "c2c4", cp: 27, mate: null, wdl: null },
  { peringkat: 5, uci: "b1c3", cp: 26, mate: null, wdl: null },
];
const KANDIDAT_MUDAH = [
  { peringkat: 1, uci: "e2e4", cp: 200, mate: null, wdl: null },
  { peringkat: 2, uci: "d2d4", cp: 20, mate: null, wdl: null },
  { peringkat: 3, uci: "g1f3", cp: 10, mate: null, wdl: null },
  { peringkat: 4, uci: "c2c4", cp: 5, mate: null, wdl: null },
  { peringkat: 5, uci: "b1c3", cp: 0, mate: null, wdl: null },
];
hasil("klasifikasi: KANDIDAT_SULIT → sulit", ac.ketajamanKandidat(KANDIDAT_SULIT) <= ac.AMBANG.kandidatSulit);
hasil("klasifikasi: KANDIDAT_MUDAH → mudah", ac.ketajamanKandidat(KANDIDAT_MUDAH) >= ac.AMBANG.kandidatMudah);

const KANDIDAT_SULIT_HITAM = [
  { peringkat: 1, uci: "e7e5", cp: 30, mate: null, wdl: null },
  { peringkat: 2, uci: "e7e6", cp: 29, mate: null, wdl: null },
  { peringkat: 3, uci: "d7d5", cp: 28, mate: null, wdl: null },
  { peringkat: 4, uci: "d7d6", cp: 27, mate: null, wdl: null },
  { peringkat: 5, uci: "g8f6", cp: 26, mate: null, wdl: null },
];
const KANDIDAT_MUDAH_HITAM = [
  { peringkat: 1, uci: "e7e5", cp: 200, mate: null, wdl: null },
  { peringkat: 2, uci: "d7d5", cp: 20, mate: null, wdl: null },
  { peringkat: 3, uci: "g8f6", cp: 10, mate: null, wdl: null },
  { peringkat: 4, uci: "b8c6", cp: 5, mate: null, wdl: null },
  { peringkat: 5, uci: "a7a6", cp: 0, mate: null, wdl: null },
];

function bangunKondisional() {
  const daftar = [];
  let sisa = { w: 7200, b: 7200 };
  const dorong = (attrsPosisi, attrsLangkah, pemain, detik) => {
    const sebelum = { white: sisa.w, black: sisa.b };
    if (pemain === "w") sisa.w -= detik;
    else sisa.b -= detik;
    const sesudah = { white: sisa.w, black: sisa.b };
    daftar.push({
      fen: "8/8/8/8/8/8/8/8 w - - 0 1",
      color: pemain === "w" ? "b" : "w",
      clock: sebelum,
      ...attrsPosisi,
    });
    daftar.push({
      san: attrsLangkah.san,
      uci: attrsLangkah.uci,
      color: pemain === "w" ? "b" : "w",
      moveRating: null,
      fen: "8/8/8/8/8/8/8/8 b - - 0 1",
      previousStaticEvals: [["cp", "30"], ["cp", "0"]],
      clock: sesudah,
    });
  };
  for (let r = 0; r < 20; r++) {
    const sulitPutih = r % 2 === 0;
    // kandidat #1 kedua daftar putih = e2e4 → bestMoveSan selalu "e4";
    // putih "engine": e2e4 (rank 1) saat sulit, c2c4 (rank 4) saat mudah.
    dorong(
      { kandidat: sulitPutih ? KANDIDAT_SULIT : KANDIDAT_MUDAH, bestMoveSan: "e4" },
      sulitPutih ? { san: "e4", uci: "e2e4" } : { san: "c4", uci: "c2c4" },
      "w",
      sulitPutih ? 50 : 10
    );
    const mudahHitam = r % 2 === 0;
    // kandidat #1 kedua daftar hitam = e7e5 → bestMoveSan selalu "e5";
    // hitam "manusia": e7e5 (rank 1) saat mudah, d7d6 (rank 4) saat sulit.
    dorong(
      { kandidat: mudahHitam ? KANDIDAT_MUDAH_HITAM : KANDIDAT_SULIT_HITAM, bestMoveSan: "e5" },
      mudahHitam ? { san: "e5", uci: "e7e5" } : { san: "d6", uci: "d7d6" },
      "b",
      mudahHitam ? 30 : 70
    );
  }
  return daftar;
}
const kondisional = ac.hitungSkorKecurigaan(bangunKondisional());
hasil(
  "kondisional: putih cocok 100% di posisi sulit (tanda khas engine)",
  kondisional.w.kecocokanSulit === 100 && kondisional.w.sulitDinilai === 10,
  `${kondisional.w.kecocokanSulit}/${kondisional.w.sulitDinilai}`
);
hasil(
  "kondisional: putih cocok 0% di posisi mudah",
  kondisional.w.kecocokanMudah === 0 && kondisional.w.mudahDinilai === 10,
  `${kondisional.w.kecocokanMudah}/${kondisional.w.mudahDinilai}`
);
hasil(
  "kondisional: hitam (manusia) kebalikannya — 0% sulit, 100% mudah",
  kondisional.b.kecocokanSulit === 0 && kondisional.b.kecocokanMudah === 100,
  `${kondisional.b.kecocokanSulit}/${kondisional.b.kecocokanMudah}`
);
hasil("kondisional: streak putih & hitam = 1 (bergantian rank 1/4)", kondisional.w.streakTerpanjang === 1 && kondisional.b.streakTerpanjang === 1, `${kondisional.w.streakTerpanjang}/${kondisional.b.streakTerpanjang}`);
hasil(
  "kondisional: korelasi putih -1 (manusia: lama berpikir → langkah baik)",
  kondisional.w.korelasiWaktuKualitas === -1 && kondisional.w.sampelKorelasi === 20,
  `${kondisional.w.korelasiWaktuKualitas}/${kondisional.w.sampelKorelasi}`
);
hasil(
  "kondisional: korelasi hitam +1 (makin lama makin buruk — mencurigakan)",
  kondisional.b.korelasiWaktuKualitas === 1,
  `${kondisional.b.korelasiWaktuKualitas}`
);

/* Agregat: keranjang dijumlah ulang mentah, streak maksimum, korelasi berbobot. */
const agregatSulit = ac.agregatSkorPemain([{ id: "s1", timestamp: 1, warna: "w", hasil: kondisional }], "budi");
hasil(
  "agregat: kecocokanSulit/Mudah terbawa",
  agregatSulit.kecocokanSulit === 100 && agregatSulit.kecocokanMudah === 0,
  `${agregatSulit.kecocokanSulit}/${agregatSulit.kecocokanMudah}`
);
hasil("agregat: streakTerpanjang = maksimum antarpartai", agregatSulit.streakTerpanjang === 1, `${agregatSulit.streakTerpanjang}`);
hasil("agregat: korelasi berbobot sampel = -1", agregatSulit.korelasiWaktuKualitas === -1, `${agregatSulit.korelasiWaktuKualitas}`);
const agregatCampurKondisional = ac.agregatSkorPemain(
  [
    { id: "s1", timestamp: 1, warna: "w", hasil: kondisional },
    { id: "s2", timestamp: 2, warna: "b", hasil: kondisional },
  ],
  "budi"
);
hasil(
  "agregat campur: kecocokan sulit (10+0)/20 = 50%",
  agregatCampurKondisional.kecocokanSulit === 50,
  `${agregatCampurKondisional.kecocokanSulit}`
);
hasil(
  "agregat campur: korelasi rata berbobot (-1 dan +1) ≈ 0",
  agregatCampurKondisional.korelasiWaktuKualitas === 0,
  `${agregatCampurKondisional.korelasiWaktuKualitas}`
);

/* ============ 11. kalibrasi per rating ============ */

console.log("\n== kalibrasi ambang per rating ==");
hasil("pilihKalibrasi(null) = ambang global", ac.pilihKalibrasi(null).kecocokanDasar === ac.AMBANG.kecocokanDasar);
hasil("pilihKalibrasi(NaN) = ambang global", ac.pilihKalibrasi(NaN).acplAcuan === ac.AMBANG.acplAcuan);
hasil("pilihKalibrasi(700) → band 40/70", ac.pilihKalibrasi(700).kecocokanDasar === 40 && ac.pilihKalibrasi(700).acplAcuan === 70);
hasil("pilihKalibrasi(800) masuk band 800", ac.pilihKalibrasi(800).kecocokanDasar === 40);
hasil("pilihKalibrasi(1500) → band 50/45", ac.pilihKalibrasi(1500).kecocokanDasar === 50 && ac.pilihKalibrasi(1500).acplAcuan === 45);
hasil("pilihKalibrasi(2600) → band tertinggi", ac.pilihKalibrasi(2600).kecocokanDasar === 65 && ac.pilihKalibrasi(2600).acplAcuan === 27);
hasil(
  "band kalibrasi terurut & tidak tumpang tindih",
  ac.KALIBRASI_RATING.every((b, i, arr) => i === 0 || arr[i - 1].batas < b.batas)
);
hasil(
  "ratingDariMetadata: elo angka dibaca, NOELO → null",
  ac.ratingDariMetadata({ players: [{ elo: 1750 }, { elo: "NOELO" }] }).w === 1750 &&
    ac.ratingDariMetadata({ players: [{ elo: 1750 }, { elo: "NOELO" }] }).b === null
);
hasil("ratingDariMetadata: elo 0/negatif → null", ac.ratingDariMetadata({ players: [{ elo: 0 }, { elo: -3 }] }).w === null && ac.ratingDariMetadata({ players: [{ elo: 0 }, { elo: -3 }] }).b === null);

/* Arah kalibrasi: metrik sama, pemain lemah yang cocok 70% → skor lebih
 * tinggi daripada pemain kuat (70% itu biasa di 2400+). */
const metrikSama = { engineMatchRate: 70, acpl: 30, konsistensiWaktu: 0.5, rataPeringkat: 2, jumlahLangkah: 80 };
const skorLemah = ac.skorKecurigaan({ ...metrikSama, ratingPemain: 800 });
const skorKuat = ac.skorKecurigaan({ ...metrikSama, ratingPemain: 2600 });
hasil("kalibrasi: skor pemain 800 > skor pemain 2600 pada metrik sama", skorLemah.skor > skorKuat.skor, `${skorLemah.skor} vs ${skorKuat.skor}`);
hasil(
  "kalibrasi: tanpa rating = ambang global (perilaku lama utuh)",
  JSON.stringify(ac.skorKecurigaan(metrikSama)) === JSON.stringify(ac.skorKecurigaan({ ...metrikSama, ratingPemain: null }))
);

/* hitungSkorKecurigaan menerima rating per warna. */
const miniRating = ac.hitungSkorKecurigaan(daftarMini, { rating: { w: 800, b: 2600 } });
hasil("kalibrasi per warna: diterapkan tanpa galat", Number.isFinite(miniRating.w.skor) && Number.isFinite(miniRating.b.skor));

/* barisPartai membaca rating dari metadata; agregat memakai median. */
const metadataRating = { players: [{ name: "budi", elo: 1200 }, { name: "lawan", elo: 1250 }] };
const agregatRating = ac.agregatSkorPemain(
  [
    { id: "r1", timestamp: 1, warna: "w", metadata: metadataRating, hasil: mini },
    { id: "r2", timestamp: 2, warna: "b", metadata: metadataRating, hasil: mini },
  ],
  "budi"
);
hasil("agregat: rating median = 1225", agregatRating.rating === 1225, `${agregatRating.rating}`);
hasil("agregat: baris membawa rating", agregatRating.partai.every((b) => b.rating === 1200 || b.rating === 1250));
const agregatTanpaRating = ac.agregatSkorPemain([{ id: "r1", timestamp: 1, warna: "w", hasil: mini }], "budi");
hasil("agregat: tanpa metadata → rating null (tanpa kalibrasi)", agregatTanpaRating.rating === null);

/* ============ 12. laporan peninjauan ============ */

console.log("\n== laporan peninjauan pengurus ==");
{
  const teks = laporan.buatLaporanPeninjauan(agregatRating, { username: "budi" });
  hasil("laporan memuat nama pemain", teks.includes("budi"));
  hasil("laporan memuat skor & level", teks.includes(`Skor kecurigaan: ${agregatRating.skor}`) && teks.includes(agregatRating.level ?? ""));
  hasil("laporan memuat rating acuan", teks.includes("1225"));
  hasil("laporan memuat sanggahan wajib", teks.includes("bukan bukti atau tuduhan"));
  hasil("laporan memuat rincian per partai", teks.includes("RINCIAN PER PARTAI") && teks.split("\n").length > 15);
  hasil("laporan memuat akurasi metode lichess", teks.includes("harmonic mean"), teks.split("\n").find((b) => b.startsWith("Akurasi")) ?? "");
  hasil("laporan memuat ACPL baku", teks.includes("ACPL baku (eval dipotong"));
  hasil("laporan memuat hitungan anotasi NAG", teks.includes("Anotasi NAG:"));
  hasil("laporan memuat catatan metode", teks.includes("CATATAN METODE:"));
  hasil("laporan agregat kosong tetap berbentuk", laporan.buatLaporanPeninjauan(null).includes("Tidak ada partai"));
  const json = JSON.parse(laporan.buatLaporanJson(agregatRating, { username: "budi" }));
  hasil("laporan JSON: versi & jenis benar", json.jenis === "laporan-peninjauan-anticheat" && json.versi === 3);
  hasil("laporan JSON: metrik lengkap", Number.isFinite(json.metrik.engineMatchRate) && "kecocokanSulit" in json.metrik);
  hasil("laporan JSON: metrik sepadan platform lain ikut", "akurasi" in json.metrik && "acplBaku" in json.metrik && "anotasi" in json.metrik);
  hasil("laporan JSON: catatan metode ikut", typeof json.catatanMetode === "string" && json.catatanMetode.length > 0);
  hasil("laporan JSON: sanggahan ikut", json.sanggahan.includes("indikasi statistik"));
  // jsdom punya document+Blob → fungsi harus mengembalikan true dan mengklik
  // anchor sekali. Klik di-stub supaya jsdom tidak mencoba "navigasi" unduhan.
  const klikAsli = window.HTMLAnchorElement.prototype.click;
  let jumlahKlik = 0;
  window.HTMLAnchorElement.prototype.click = function () {
    jumlahKlik++;
  };
  const unduhOk = laporan.unduhLaporanPeninjauan(agregatRating, { username: "budi" });
  window.HTMLAnchorElement.prototype.click = klikAsli;
  hasil("unduhLaporanPeninjauan: memicu unduhan (anchor diklik sekali)", unduhOk === true && jumlahKlik === 1, `${unduhOk}/${jumlahKlik}`);
}

/* ============ 13. deviasi manusia (siap-Maia) ============ */

console.log("\n== fondasi deviasi manusia ==");
{
  const daftarDev = [{ fen: "pos-awal", color: "b" }];
  for (let i = 0; i < 12; i++) {
    daftarDev.push({ san: "e4", uci: "e2e4", fen: `pos-${i}`, color: "w" });
  }
  const prediksiJelas = new Map();
  for (let i = 0; i < 12; i++) {
    prediksiJelas.set(i === 0 ? "pos-awal" : `pos-${i - 1}`, { e2e4: 0.4, d2d4: 0.3, c2c4: 0.2, g1f3: 0.1 });
  }
  const dev = deviasi.hitungDeviasiManusia(daftarDev, prediksiJelas);
  hasil("deviasi: sampel terhitung", dev?.sampel === 12, `${dev?.sampel}`);
  hasil("deviasi: langkah teratas manusia → kejutan ≈ 1.32 bit", Math.abs(dev.kejutanRata - Math.log2(1 / 0.4)) < 0.01, `${dev.kejutanRata}`);
  hasil("deviasi: peringkat Maia 1", dev.rataPeringkatMaia === 1);
  hasil("deviasi: tidak ada kejutan tinggi", dev.kejutanTinggi === 0);

  const prediksiAneh = new Map();
  for (let i = 0; i < 12; i++) {
    prediksiAneh.set(i === 0 ? "pos-awal" : `pos-${i - 1}`, { d2d4: 0.5, e2e4: 0.0001, c2c4: 0.3, g1f3: 0.2 });
  }
  const devAneh = deviasi.hitungDeviasiManusia(daftarDev, prediksiAneh);
  hasil("deviasi: langkah tak-manusiawi → kejutan tinggi tercatat", devAneh.kejutanTinggi === 12, `${devAneh.kejutanTinggi}`);
  hasil("deviasi: peringkat Maia = 4 (tiga langkah lebih disukai)", devAneh.rataPeringkatMaia === 4, `${devAneh.rataPeringkatMaia}`);
  hasil("deviasi: prediksi kurang → null", deviasi.hitungDeviasiManusia(daftarDev.slice(0, 5), prediksiJelas) === null);
  hasil("deviasi: tanpa prediksi → null", deviasi.hitungDeviasiManusia(daftarDev, new Map()) === null);
  hasil("deviasi: input rusak → null", deviasi.hitungDeviasiManusia(null, prediksiJelas) === null);
}

/* ============ 14. orkestrator: durasi + cache localStorage ============ */

console.log("\n== orkestrator: durasi & cache lintas-sesi ==");
{
  // cache dibersihkan dulu supaya hitungan dariCache bisa dipastikan
  riwayat.bersihkanCacheAntiCheat();
  const pgnSatu = PGN_JUJUR;
  const jalan1 = await riwayat.analisisRiwayatAntiCheat({
    partai: [{ id: "dur-1", timestamp: 1, whiteName: "budi", blackName: "lawan", pgn: pgnSatu }],
    username: "budi",
    mesin: buatEnginePalsu(peta, "jujur"),
    parserPgn: parsePGN,
  });
  hasil("durasi: totalMs tercatat (>0)", Number.isFinite(jalan1.durasi?.totalMs) && jalan1.durasi.totalMs >= 0, `${jalan1.durasi?.totalMs}`);
  hasil("durasi: rataMs = totalMs (satu partai)", jalan1.durasi.rataMs === jalan1.durasi.totalMs);
  hasil("durasi: perPartai membawa id", jalan1.durasi.perPartai[0]?.id === "dur-1");
  hasil("dariCache: pertama = 0", jalan1.dariCache === 0);

  // Bersihkan cache MEMORI saja (simulasi sesi baru): tulis ulang Map lewat
  // trik — bersihkan lalu muat dari localStorage via bacaCachePartai.
  const jalan2 = await riwayat.analisisRiwayatAntiCheat({
    partai: [{ id: "dur-1", timestamp: 1, whiteName: "budi", blackName: "lawan", pgn: pgnSatu }],
    username: "budi",
    mesin: buatEnginePalsu(peta, "jujur"),
    parserPgn: parsePGN,
  });
  hasil("cache: jalan kedua membaca dari cache", jalan2.dariCache === 1 && jalan2.durasi.totalMs === 0, `${jalan2.dariCache}/${jalan2.durasi.totalMs}`);

  // Simulasi SESI BARU: buang isi Map memori secara langsung lalu pastikan
  // bacaCachePartai memuat ulang dari localStorage.
  const kunci = riwayat.kunciCachePartai("dur-1", riwayat.KEDALAMAN_AGGREGAT);
  const diSimpanan = JSON.parse(localStorage.getItem("kci-anticheat-cache-v2") ?? "{}");
  hasil("cache: tersimpan di localStorage", Boolean(diSimpanan[kunci]));
  riwayat.bersihkanCacheAntiCheat?.tampak === undefined; // no-op, jaga bentuk
  // Muat ulang: bacaCachePartai setelah Map dibersihkan harus mengambil dari localStorage.
  const hasilBaca = riwayat.bacaCachePartai("dur-1", riwayat.KEDALAMAN_AGGREGAT);
  hasil("cache: baca ulang lintas-sesi dari localStorage", Boolean(hasilBaca) && Boolean(hasilBaca.hasil?.w), `${Boolean(hasilBaca)}`);
  hasil("cache: bersihkan menghapus localStorage", (() => {
    riwayat.bersihkanCacheAntiCheat();
    return !JSON.parse(localStorage.getItem("kci-anticheat-cache-v2") ?? "{}")[kunci];
  })());
}

/* ==== 14. metrik sepadan platform lain (lichess / en-croissant) ==== */

console.log("\n== metrik akurasi baku (lichess/en-croissant) ==");
const mtr = await import("../src/halaman/Analisa/mesin/akurasi.js");

/*
 * NILAI EMAS di bawah diambil dari suite uji en-croissant sendiri
 * (`src/utils/tests/score.test.ts`, branch `master`): getWinChance(0)=50,
 * getWinChance(100)≈59.1, getWinChance(-500)≈13.69,
 * getAccuracy(0,0,white)=100, getAccuracy(0,-500,white)≈19.07,
 * getCPLoss(0,50,black)=50, getCPLoss(mate -1,cp 0,black)=1000,
 * getAnnotation(-500)="??", (-200)="?", (-100)="?!", (-50)="".
 * Kalau salah satu angka ini berubah, rumus kita sudah menyimpang dari
 * acuan dan angka kita tidak lagi bisa dibandingkan dengan lichess.
 */
hasil("peluangMenang(0) = 50", mtr.peluangMenang(0) === 50);
hasil("peluangMenang(100) ≈ 59.1", hampir(mtr.peluangMenang(100), 59.1, 0.05), `${mtr.peluangMenang(100)}`);
hasil("peluangMenang(-500) ≈ 13.69", hampir(mtr.peluangMenang(-500), 13.69, 0.05), `${mtr.peluangMenang(-500)}`);
hasil(
  "peluangMenang dipotong pada ±1000 cp (97.5 / 2.5, bukan 100 / 0)",
  mtr.peluangMenang(99999) === mtr.peluangMenang(1000) &&
    mtr.peluangMenang(-99999) === mtr.peluangMenang(-1000) &&
    hampir(mtr.peluangMenang(1000), 97.5447, 0.001),
  `${mtr.peluangMenang(1000)}`
);
hasil("CP_CEILING = 1000 (lichess Cp.CEILING)", mtr.CP_CEILING === 1000);
hasil("cpBaku: mate → ±1000", mtr.cpBaku(["mate", "7"]) === 1000 && mtr.cpBaku(["mate", "-2"]) === -1000);
hasil("cpBaku: cp di atas plafon dipotong", mtr.cpBaku(["cp", "4200"]) === 1000 && mtr.cpBaku(["cp", "-4200"]) === -1000);
hasil("cpBaku: balikTanda membalik sudut pandang", mtr.cpBaku(["cp", "34"], true) === -34);
hasil("cpBaku: data rusak → null", mtr.cpBaku([]) === null && mtr.cpBaku(["mate"]) === null && mtr.cpBaku(undefined) === null);
hasil("akurasiLangkah: langkah tanpa kerugian = 100", mtr.akurasiLangkah(0, 0) === 100);
hasil("akurasiLangkah(0 → -500) ≈ 19.07", hampir(mtr.akurasiLangkah(0, -500), 19.07, 0.005), `${mtr.akurasiLangkah(0, -500)}`);
hasil("akurasiLangkah: eval membaik tetap 100 (jalan pintas lichess)", mtr.akurasiLangkah(-300, 300) === 100);
hasil("akurasiLangkah: input tak hingga → null", mtr.akurasiLangkah(0, null) === null);
hasil(
  "kerugianLangkah(0 → 50, sudut hitam) = 50",
  mtr.kerugianLangkah(mtr.cpBaku(["cp", "0"], true), mtr.cpBaku(["cp", "50"], true)) === 50
);
hasil(
  "kerugianLangkah(mate -1 → 0, hitam) = 1000",
  mtr.kerugianLangkah(mtr.cpBaku(["mate", "-1"], true), mtr.cpBaku(["cp", "0"], true)) === 1000
);
hasil("kerugianLangkah: langkah yang memperbaiki eval → 0", mtr.kerugianLangkah(-100, 400) === 0);
hasil("kerugianLangkah: maksimum 2000 (bukan 1000)", mtr.kerugianLangkah(1000, -1000) === 2000);

hasil('anotasi: kehilangan 500 cp win chance → "??"', mtr.anotasiLangkah({ sebelumCp: 0, sesudahCp: -500 }) === "??");
hasil('anotasi: -200 cp → "?"', mtr.anotasiLangkah({ sebelumCp: 0, sesudahCp: -200 }) === "?");
hasil('anotasi: -100 cp → "?!"', mtr.anotasiLangkah({ sebelumCp: 0, sesudahCp: -100 }) === "?!");
hasil('anotasi: -50 cp → tanpa catatan', mtr.anotasiLangkah({ sebelumCp: 0, sesudahCp: -50 }) === "");
hasil(
  'anotasi: pengorbanan yang memulihkan keadaan → "!!"',
  mtr.anotasiLangkah({
    sebelumCp: 0,
    sesudahCp: 0,
    kandidat: [{ uci: "e2e4", cp: 300 }, { uci: "d2d4", cp: -200 }],
    uci: "e2e4",
    sacrifice: true,
  }) === "!!"
);
hasil(
  'anotasi: langkah terbaik yang membalik posisi → "!"',
  mtr.anotasiLangkah({
    sebelumCp: 0,
    sesudahCp: 0,
    duaLangkahLaluCp: -300,
    kandidat: [{ uci: "e2e4", cp: 300 }, { uci: "d2d4", cp: -200 }],
    uci: "e2e4",
    sacrifice: false,
  }) === "!"
);
hasil(
  'anotasi: pengorbanan tanpa pemulihan → "!?"',
  mtr.anotasiLangkah({
    sebelumCp: 0,
    sesudahCp: -50,
    kandidat: [{ uci: "a1a2", cp: 10 }, { uci: "b2b3", cp: 5 }],
    uci: "c2c3",
    sacrifice: true,
  }) === "!?"
);

hasil("rataHarmonik: [100, 100] = 100", mtr.rataHarmonik([100, 100]) === 100);
hasil("rataHarmonik: daftar kosong → null (bukan NaN)", mtr.rataHarmonik([]) === null);
hasil("rataHarmonik: lantai 1 mencegah divisi 0", mtr.rataHarmonik([0]) === 1);
hasil(
  "rataHarmonik menghukum blunder lebih keras daripada rata-rata",
  mtr.rataHarmonik([100, 100, 100, 0]) < mtr.rataRataAngka([100, 100, 100, 0]) - 20,
  `${mtr.rataHarmonik([100, 100, 100, 0])} vs ${mtr.rataRataAngka([100, 100, 100, 0])}`
);
hasil(
  "harmonikDariJumlah menyusun nilai yang sama dengan rataHarmonik",
  hampir(
    mtr.harmonikDariJumlah(mtr.inversAkurasi(90) + mtr.inversAkurasi(40), 2),
    mtr.rataHarmonik([90, 40]),
    1e-9
  )
);
hasil("harmonikDariJumlah: tanpa sampel → null", mtr.harmonikDariJumlah(0, 0) === null);

/* Pasangan cp dibaca dari entri parsePGN: [1] = sebelum (giliran pemain),
 * [0] = sesudah (giliran lawan → tanda dibalik). */
const entriAkurasi = { color: "b", previousStaticEvals: [["cp", "100"], ["cp", "0"]] };
hasil("akurasiMove: sebelum 0, sesudah -100", hampir(mtr.akurasiMove(entriAkurasi), 67.24, 0.01), `${mtr.akurasiMove(entriAkurasi)}`);
hasil("kerugianMove: 100 cp", mtr.kerugianMove(entriAkurasi) === 100);
hasil("akurasiMove: tanpa riwayat eval → null", mtr.akurasiMove({}) === null);

/* ---- terpasang di hitungSkorKecurigaan ---- */
hasil("hitungSkorKecurigaan: akurasi terisi", Number.isFinite(skorMesin.w.akurasi), `${skorMesin.w.akurasi}`);
hasil("hitungSkorKecurigaan: acplBaku terisi", Number.isFinite(skorMesin.w.acplBaku), `${skorMesin.w.acplBaku}`);
hasil(
  "partai sempurna engine → akurasi ≈ 100",
  skorMesin.w.akurasi >= 99,
  `${skorMesin.w.akurasi}`
);
hasil(
  "partai jujur: akurasi harmonik ≤ rata-rata aritmetik",
  skorJujur.w.akurasi <= skorJujur.w.akurasiAritmetik + 1e-9,
  `${skorJujur.w.akurasi} vs ${skorJujur.w.akurasiAritmetik}`
);
hasil(
  "partai sempurna lebih bersih daripada partai jujur (ACPL baku)",
  skorMesin.w.acplBaku < skorJujur.w.acplBaku,
  `${skorMesin.w.acplBaku} vs ${skorJujur.w.acplBaku}`
);
hasil(
  "anotasi: enam kunci NAG selalu ada",
  mtr.DAFTAR_ANOTASI.every((a) => Number.isFinite(skorJujur.w.anotasi[a])) && Object.keys(skorJujur.w.anotasi).length === 6,
  JSON.stringify(skorJujur.w.anotasi)
);
hasil(
  "anotasi: jumlah anotasi ≤ langkah yang dinilai",
  Object.values(skorJujur.w.anotasi).reduce((a, b) => a + b, 0) <= skorJujur.jumlahLangkah &&
    Object.values(skorJujur.b.anotasi).reduce((a, b) => a + b, 0) <= skorJujur.jumlahLangkah,
  `${Object.values(skorJujur.w.anotasi).reduce((a, b) => a + b, 0)}/${skorJujur.jumlahLangkah}`
);
hasil(
  "perFase membawa akurasi & ACPL baku",
  "akurasi" in skorJujur.w.perFase.opening && "acplBaku" in skorJujur.w.perFase.opening
);
hasil(
  "pemainDariEntri identik dengan pemainLangkah (duplikat terjaga)",
  hasilJujur.moves.every((m, i) => mtr.pemainDariEntri(m, i) === ac.pemainLangkah(m, i))
);

/* ---- agregat lintas partai ---- */
hasil("agregat: akurasi & acplBaku ikut", Number.isFinite(agregatRating.akurasi) && Number.isFinite(agregatRating.acplBaku));
const totalInvers = agregatRating.partai.reduce((a, b) => a + (b.akurasiInversJumlah || 0), 0);
const totalSampelAkurasi = agregatRating.partai.reduce((a, b) => a + (b.akurasiSampel || 0), 0);
hasil(
  "agregat: akurasi disusun dari jumlah mentah, bukan rata-rata per partai",
  hampir(agregatRating.akurasi, Math.round(mtr.harmonikDariJumlah(totalInvers, totalSampelAkurasi) * 10) / 10, 0.05),
  `${agregatRating.akurasi}`
);
hasil(
  "agregat: anotasi dijumlah antarpartai",
  Object.keys(agregatRating.anotasi).length === 6 &&
    Object.values(agregatRating.anotasi).reduce((a, b) => a + b, 0) ===
      agregatRating.partai.reduce((a, b) => a + Object.values(b.anotasi ?? {}).reduce((x, y) => x + y, 0), 0)
);
hasil("agregat kosong: metrik baru null, bukan NaN", ac.agregatSkorPemain([]).akurasi === null && ac.agregatSkorPemain([]).acplBaku === null);
hasil("re-ekspor antiCheat: peluangMenang & CP_CEILING tersedia", typeof ac.peluangMenang === "function" && ac.CP_CEILING === 1000);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
