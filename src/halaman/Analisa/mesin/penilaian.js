/**
 * Penilaian langkah untuk fitur Analisa.
 *
 * Bagian ini adalah terjemahan (alih-bahasa, bukan alih-engine) logika
 * penilaian Brilliant-Chess (MIT, © 2025 Delo) — FILE `src/engine/stockfish.ts`
 * upstream, bagian yang TIDAK berhubungan dengan komunikasi engine:
 * klasifikasi brilliant/great/best/excellent/good/book/inaccuracy/mistake/
 * miss/blunder/forced, deteksi pengorbanan (sacrifice), dan langkah paksa.
 *
 * Yang sengaja TIDAK dibawa: muat-worker Stockfish, parsing baris UCI, dan
 * "go depth" mentah — itu bagian yang di proyek ini ditangani engine lokal
 * (lihat `src/lib/engineCatur.js` dan `./engine.js`).
 *
 * TAMBAHAN di luar upstream: label `critical` ("langkah kritis"). Brilliant-Chess
 * tidak punya label ini; gagasannya berasal dari `classify()` WintrChess
 * (GPL-3.0) dan ditulis ulang di ./langkahKritis.js memakai kandidat MultiPV
 * yang sudah direkam ./engine.js. Karena itu `critical` hanya keluar di cabang
 * `isBest` dan `kritis` dihitung pemanggil — lihat catatan di fungsi itu.
 *
 * PERUBAHAN kedua dari upstream: ambang label standar tidak lagi berupa selisih
 * centipawn (dulu `≥0,4 good`, `≥0,8 inaccuracy`, `≥4 blunder`) melainkan
 * KERUGIAN PELUANG lewat kurva yang sama dengan ./akurasi.js — lihat
 * `AMBANG_KERUGIAN_PELUANG`. Sebabnya: 0,8 pion di posisi +5,0 hampir tidak
 * berarti, sedangkan 0,8 pion dari +0,5 ke −0,3 bisa menentukan hasil partai.
 * Ambang centipawn yang tersisa (gerbang `evaluationDiff >= 1.2` dan garis
 * keunggulan besar ±2,0) sengaja DIPERTAHANKAN: keduanya bukan penentu label
 * utama, melainkan syarat tambahan "kerugiannya material" dan "posisinya
 * melintasi garis menang" — maknanya memang tentang materi, bukan peluang.
 *
 * Semua fungsi di sini murni: menerima hasil evaluasi, mengembalikan label.
 * Teks komentar tidak disimpan sebagai string mentah, melainkan sebagai
 * kunci kamus (`commentKey` + `commentIndex`) agar bisa ikut i18n.
 */

import { BISHOP, Chess, KNIGHT, PAWN, QUEEN, ROOK } from "chess.js";
import { penyerangTersembunyi } from "./keamananBidak.js";
import { peluangMenang } from "./peluang.js";
import { apakahMateTerminal, normalisasiEval, STATUS_EVALUASI } from "./evaluasi.js";

/** Daftar kunci komentar → `analisa.komentar.<kunci>` di kamus terjemahan. */
export const KUNCI_KOMENTAR = [
  "brilliant",
  "great",
  "best",
  "critical",
  "excellent",
  "good",
  "inaccuracy",
  "mistake",
  "blunder",
  "mate",
  "mateIn",
  "delayMate",
  "advanceMate",
  "loseAdvantage",
  "giveAdvantage",
  "gettingMated",
  "missMate",
  "missAdvantage",
  "forced",
];

/** Jumlah varian kalimat per kunci (harus sama dengan panjang array kamus). */
export const JUMLAH_VARIAN = 3;

export function invertColor(warna) {
  return warna === "w" ? "b" : "w";
}

/**
 * Ambang kerugian peluang (poin persen, 0–100) yang memisahkan label standar
 * `getStandardRating` di ./penilaian.js. Artinya: kerugian < `good` →
 * excellent, < `inaccuracy` → good, < `mistake` → inaccuracy, < `blunder` →
 * mistake, selebihnya blunder.
 *
 * Selisih centipawn TIDAK lagi dipakai untuk ambang ini karena maknanya tidak
 * seragam: +5,0 → +4,2 hampir tidak berarti, sedangkan +0,5 → −0,3 bisa
 * menentukan hasil partai — padahal keduanya sama-sama berjarak 0,8 pion.
 * Kurvanya milik repo ini (`peluangMenang` ./peluang.js) sehingga label langkah
 * dan angka akurasi selalu sejalan.
 *
 * Angkanya memakai ambang label lichess (kerugian peluang 10/20/30 untuk
 * inaccuracy/mistake/blunder) supaya label halaman ini berbicara dalam skala
 * yang sama dengan akurasi — yang juga memakai kurva lichess/en-croissant —
 * dan bisa dibandingkan langsung dengan analisis lichess oleh pengguna. Band
 * `good` mengisi celah di bawah 10. Gagasan "berpikir di ruang peluang" sendiri
 * datang dari tabel transisi `pointLoss.ts` WintrChess (GPL-3.0); kodenya tidak
 * diambil, dan angkanya sengaja dipilih sejajar lichess, bukan tabel mereka.
 *
 * Padanan cp dari posisi SEIMBANG (setara peluang, jadi angka ini bergeser di
 * posisi yang sudah berat sebelah — justru itu maksud perubahan ini):
 *   good ≈ 0,55 pion · inaccuracy ≈ 1,15 · mistake ≈ 2,35 · blunder ≈ 3,80.
 * Sebagai perbandingan, ambang centipawn lama adalah 0,4/0,8/4,0 — inaccuracy
 * lama jauh lebih galak di posisi seimbang, dan sebaliknya terlalu jinak di
 * posisi menang besar.
 *
 * Catatan: karena bervariasi bersama ambang, komentar cadangan `blunder`
 * (`komentar("blunder")`) hampir tidak pernah terpakai — kerugian ≥30 poin
 * selalu menyeberangi garis keunggulan ±2,0 sehingga cabang diagnosis
 * (loseAdvantage/giveAdvantage) yang mengambil alih. Kalimatnya sengaja
 * dibiarkan di kamus: kalau ambangnya disetel ulang, ia bisa hidup lagi.
 */
export const AMBANG_KERUGIAN_PELUANG = Object.freeze({
  good: 5,
  inaccuracy: 10,
  mistake: 20,
  blunder: 30,
});

/**
 * Kerugian peluang (poin persen) satu langkah: peluang menang SEBELUM dikurangi
 * SESUDAH, keduanya dari sudut pandang pihak yang melangkah.
 *
 * Masukannya eval BERSUSUT PANDANG PUTIH dalam satuan pion — bentuk yang sama
 * dengan `getPreviousStaticEvalAmount`/`staticEvalAmount` di `getMoveRating` —
 * lalu tandanya dibalik untuk pelangkah Hitam. Riwayat yang tidak ada/rusak
 * (`NaN`) berarti TIDAK ADA informasi, bukan kerugian besar: hasilnya 0 supaya
 * perilakunya sama dengan ambang centipawn dulu (perbandingan NaN selalu false
 * → "excellent"). Langkah yang malah menaikkan peluang menghasilkan nilai
 * negatif dan otomatis masuk band terbaik.
 */
function kerugianPeluang(sebelum, sesudah, warnaPelangkah) {
  if (!Number.isFinite(sebelum) || !Number.isFinite(sesudah)) return 0;
  const tanda = warnaPelangkah === "w" ? 1 : -1;
  return peluangMenang(tanda * 100 * sebelum) - peluangMenang(tanda * 100 * sesudah);
}

function angkaAcak(batas) {
  return Math.floor(Math.random() * batas);
}

/**
 * Inti klasifikasi. `staticEval` dan isi `previousStaticEvals` memakai bentuk
 * keluaran UCI mentah: `["cp", "34"]` atau `["mate", "2"]`, relatif terhadap
 * pihak yang BERGILIR pada posisi tersebut (konvensi upstream, jangan diubah
 * tanpa menyesuaikan seluruh ambang di bawah). Skakmat yang sudah dikirim
 * ditulis `["mate", "0"]` (bentuk warisan `["mate"]` tanpa angka tetap
 * diterima dan diperlakukan sama) — lihat ./evaluasi.js.
 *
 * Eval SESUDAH langkah dan eval posisi SEBELUMNYA yang hilang/rusak membuat
 * fungsi ini mengembalikan `{ moveRating: null, …, statusEvaluasi: "gagal" }`,
 * BUKAN label "excellent": kerugian yang tak-terhitung tidak boleh menyamar
 * jadi langkah sempurna. Riwayat yang LEBIH tua boleh hilang (langkah awal
 * partai) dan tetap diperlakukan netral seperti sebelumnya.
 */
export function getMoveRating({
  staticEval,
  previousStaticEvals,
  bestMoveSan,
  moveSan,
  fen,
  color,
  sacrifice,
  previousSacrifice,
  openings,
  kritis = false,
}) {
  // Salinan kerja: upstream menulis padding langsung ke argumen, yang berarti
  // state React milik pemanggil ikut berubah diam-diam.
  const riwayat = (Array.isArray(previousStaticEvals) ? previousStaticEvals : []).slice(0, 4);
  for (let i = 0; i < 4; i++) if (riwayat[i] === undefined) riwayat[i] = [];

  /*
   * Gerbang validasi: selisih langkah = eval kini vs eval lalu, jadi keduanya
   * wajib valid. Tanpa gerbang ini, `Number(undefined)` menjadi NaN lalu
   * `kerugianPeluang` mengubahnya menjadi 0 — nilai rusak lolos sebagai
   * "excellent" (bahkan "brilliant"/"great" bila syarat lain terpenuhi).
   * Pengembalian memakai `statusEvaluasi: "gagal"` supaya agregator
   * (akurasi, anti-cheat, hitungan label) melewatinya, bukan menghitungnya.
   */
  if (!normalisasiEval(staticEval) || !normalisasiEval(riwayat[0])) {
    return { moveRating: null, commentKey: null, commentIndex: 0, statusEvaluasi: STATUS_EVALUASI.GAGAL };
  }

  const winning = Number(staticEval[1]) < 0;
  const previousWinning = Number(riwayat[0][1]) > 0;

  const previousColor = invertColor(color);

  const commentNumber = angkaAcak(JUMLAH_VARIAN);

  function komentar(kunci) {
    return { commentKey: kunci, commentIndex: commentNumber };
  }

  /*
   * Label standar dari KERUGIAN PELUANG (poin persen), bukan selisih centipawn —
   * lihat `AMBANG_KERUGIAN_PELUANG`. Ambangnya sengaja dipusatkan di satu
   * konstanta supaya mudah disetel ulang bersama ujinya; `mistake` kini bisa
   * keluar langsung dari sini (dulu hanya dari cabang loseAdvantage/
   * giveAdvantage), dan komentarnya memakai `KUNCI_KOMENTAR.mistake`.
   */
  function getStandardRating(kerugian) {
    let rating = "excellent";
    if (kerugian >= AMBANG_KERUGIAN_PELUANG.good) rating = "good";
    if (kerugian >= AMBANG_KERUGIAN_PELUANG.inaccuracy) rating = "inaccuracy";
    if (kerugian >= AMBANG_KERUGIAN_PELUANG.mistake) rating = "mistake";
    if (kerugian >= AMBANG_KERUGIAN_PELUANG.blunder) rating = "blunder";
    return rating;
  }

  /*
   * Urutan keparahan label standar. Dipakai untuk pertanyaan "sekurang-kurangnya
   * seburuk X" alih-alih kesamaan persis: sejak ambang kerugian peluang punya
   * band `mistake` sendiri, `=== "inaccuracy"` akan melewatkan langkah yang
   * justru LEBIH buruk (dan sebaliknya menyamakan band yang berbeda makna).
   * Label non-standar (brilliant/great/miss/…) tidak pernah masuk ke sini.
   */
  const KEPARAHAN = { excellent: 0, good: 1, inaccuracy: 2, mistake: 3, blunder: 4 };
  function minimalSeparah(peringkat, batas) {
    return KEPARAHAN[peringkat] >= KEPARAHAN[batas];
  }

  // Ambang keunggulan besar. Kedua fungsi di bawah SENGAJA punya struktur cabang
  // yang identik; yang membedakan makna "kehilangan" vs "memberi" hanyalah nilai
  // GREAT_ADVANTAGE (2 di sini, -2 di givingGreatAdvantage), bukan bentuk
  // cabangnya.
  // Cabang `warna === "w"` dan cabang hitam sengaja asimetris: putih dibandingkan
  // terhadap +GREAT_ADVANTAGE, hitam terhadap -GREAT_ADVANTAGE (cabang hitam =
  // cermin cabang putih dengan tanda nilai dibalik). Itu perlu karena koreksi
  // tanda pada `staticEvalAmount`/`getPreviousStaticEvalAmount` membuat semua
  // angka terbaca dari sudut pandang Putih, sehingga yang dibalik untuk Hitam
  // adalah ambangnya, bukan nilainya (lihat catatan konvensi UCI di kepala
  // getMoveRating).
  // Rawan saat disunting: karena kedua fungsinya kembar, menyamakan atau membalik
  // tanda 2 ↔ -2 tidak memicu error — yang bergeser hanya label "mistake"
  // (loseAdvantage / giveAdvantage) pada salah satu warna.
  function losingGreatAdvantage(evaluation, previousEvaluation, warna) {
    const GREAT_ADVANTAGE = 2;
    if (warna === "w") {
      return previousEvaluation >= GREAT_ADVANTAGE && evaluation < GREAT_ADVANTAGE;
    }
    return previousEvaluation <= -GREAT_ADVANTAGE && evaluation > -GREAT_ADVANTAGE;
  }

  // Cermin dari losingGreatAdvantage: struktur cabangnya sama persis, yang
  // berbeda hanya tanda GREAT_ADVANTAGE (-2). Nilai -2 itulah yang membuat fungsi
  // ini bermakna "memberi keunggulan besar" (ambang dilintasi ke sisi yang
  // menguntungkan lawan), bukan cabangnya — jangan sampai terbalik menyalin
  // konstanta 2 dari fungsi di atas.
  function givingGreatAdvantage(evaluation, previousEvaluation, warna) {
    const GREAT_ADVANTAGE = -2;
    if (warna === "w") {
      return previousEvaluation >= GREAT_ADVANTAGE && evaluation < GREAT_ADVANTAGE;
    }
    return previousEvaluation <= -GREAT_ADVANTAGE && evaluation > -GREAT_ADVANTAGE;
  }

  function keepMating(mateIn, previousMateIn, warna) {
    if (warna === "w") return mateIn < previousMateIn;
    return mateIn > previousMateIn;
  }

  function advanceMate(mateIn, previousMateIn, warna) {
    if (warna === "w") return mateIn > previousMateIn;
    return mateIn < previousMateIn;
  }

  function getPreviousStaticEvalAmount(number) {
    const checkColor = number % 2 === 0 ? "b" : "w";
    return (Number(riwayat[number][1]) / 100) * (color === checkColor ? -1 : 1);
  }

  const staticEvalAmount = (Number(staticEval[1]) / 100) * (color === "w" ? -1 : 1);

  function getWasNotMateRelated(number) {
    return riwayat[number][0] !== "mate" && riwayat[number + 1][0] !== "mate";
  }

  const isNotMateRelated = staticEval[0] !== "mate" && riwayat[0][0] !== "mate";

  // Langkah buku: nama pembukaan dari posisi (lihat ./buku.js).
  const openingName = typeof openings === "function" ? openings(fen) : openings && openings[fen];
  if (openingName) return { moveRating: "book", comment: openingName };

  function getPreviousStandardRating(number) {
    // Pelangkah langkah ke-`number`: 0 = lawan, 1 = pemain ini lagi, 2 = lawan,
    // ... (riwayat[number] adalah posisi SEBELUM langkah itu).
    const pelangkah = number % 2 === 0 ? invertColor(color) : color;
    return getStandardRating(
      kerugianPeluang(getPreviousStaticEvalAmount(number + 1), getPreviousStaticEvalAmount(number), pelangkah)
    );
  }

  function getPreviousEvaluationDiff(number) {
    const checkColor = number % 2 === 0 ? "b" : "w";
    return color === checkColor
      ? getPreviousStaticEvalAmount(number + 1) - getPreviousStaticEvalAmount(number)
      : getPreviousStaticEvalAmount(number) - getPreviousStaticEvalAmount(number + 1);
  }

  const evaluationDiff =
    color === "w"
      ? getPreviousStaticEvalAmount(0) - staticEvalAmount
      : staticEvalAmount - getPreviousStaticEvalAmount(0);
  const standardRating = getStandardRating(
    kerugianPeluang(getPreviousStaticEvalAmount(0), staticEvalAmount, color)
  );

  const previousMistake =
    getWasNotMateRelated(0) &&
    getWasNotMateRelated(1) &&
    minimalSeparah(getPreviousStandardRating(0), "inaccuracy") &&
    getPreviousEvaluationDiff(0) >= 1.2 &&
    (losingGreatAdvantage(getPreviousStaticEvalAmount(0), getPreviousStaticEvalAmount(1), previousColor) ||
      givingGreatAdvantage(getPreviousStaticEvalAmount(0), getPreviousStaticEvalAmount(1), previousColor));

  const previousPreviousMistake =
    getWasNotMateRelated(1) &&
    getWasNotMateRelated(2) &&
    minimalSeparah(getPreviousStandardRating(1), "inaccuracy") &&
    getPreviousEvaluationDiff(1) >= 1.2 &&
    (losingGreatAdvantage(getPreviousStaticEvalAmount(1), getPreviousStaticEvalAmount(2), color) ||
      givingGreatAdvantage(getPreviousStaticEvalAmount(1), getPreviousStaticEvalAmount(2), color));

  const previousMiss =
    getWasNotMateRelated(0) &&
    (previousPreviousMistake || minimalSeparah(getPreviousStandardRating(1), "blunder")) &&
    minimalSeparah(getPreviousStandardRating(0), "inaccuracy") &&
    getPreviousEvaluationDiff(0) <= getPreviousEvaluationDiff(1) + 0.5;

  // brilliant — pengorbanan
  const previousBrilliant =
    getWasNotMateRelated(0) && previousSacrifice && getPreviousStandardRating(0) === "excellent";
  if (
    !previousBrilliant &&
    isNotMateRelated &&
    standardRating === "excellent" &&
    sacrifice &&
    (minimalSeparah(getPreviousStandardRating(0), "inaccuracy") ||
      (!minimalSeparah(getPreviousStandardRating(1), "inaccuracy") &&
        minimalSeparah(getPreviousStandardRating(2), "inaccuracy")))
  ) {
    return { moveRating: "brilliant", ...komentar("brilliant") };
  }

  // brilliant — memulai rangkaian skakmat
  if (sacrifice && riwayat[0][0] !== "mate" && staticEval[0] === "mate" && winning) {
    return { moveRating: "brilliant", ...komentar("brilliant") };
  }

  // brilliant — langkah tepat menuju skakmat
  if (
    sacrifice &&
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    keepMating(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    winning
  ) {
    return { moveRating: "brilliant", ...komentar("brilliant") };
  }

  // great — menghukum kesalahan lawan
  if (
    !previousMiss &&
    getWasNotMateRelated(0) &&
    isNotMateRelated &&
    standardRating === "excellent" &&
    (previousMistake || getPreviousStandardRating(0) === "blunder")
  ) {
    return { moveRating: "great", ...komentar("great") };
  }

  // best — sama dengan usulan engine
  const isBest = bestMoveSan === moveSan;
  if (isBest && apakahMateTerminal(staticEval)) {
    return { moveRating: "best", ...komentar("mate") };
  }
  /*
   * best yang kritis: langkah terbaik, tetapi alternatif terbaik keduanya
   * sudah menjatuhkan peluang menang secara berarti (hanya satu langkah yang
   * menang). Keputusannya dihitung pemanggil lewat ./langkahKritis.js karena
   * butuh kandidat MultiPV posisi SEBELUM langkah — data yang tidak dimiliki
   * fungsi ini. Diperiksa hanya di cabang ini supaya label brilliant/great/
   * book/forced (yang sudah keluar lebih awal) tidak pernah tertimpa, dan
   * supaya "kritis" tetap berarti "ini langkah terbaik" tanpa terkecuali.
   */
  if (isBest && kritis) return { moveRating: "critical", ...komentar("critical") };
  if (isBest) return { moveRating: "best", ...komentar("best") };

  // excellent — skakmat sudah pasti
  if (apakahMateTerminal(staticEval)) return { moveRating: "excellent", ...komentar("mate") };

  // excellent — memulai skakmat
  if (riwayat[0][0] !== "mate" && staticEval[0] === "mate" && winning) {
    return { moveRating: "excellent", ...komentar("mateIn") };
  }

  // excellent — langkah tepat menuju skakmat
  if (
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    keepMating(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    winning
  ) {
    return { moveRating: "excellent", ...komentar("mateIn") };
  }

  // good — menunda skakmat
  if (
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    !keepMating(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    winning
  ) {
    return { moveRating: "good", ...komentar("delayMate") };
  }

  // good — mempercepat skakmat sendiri
  if (
    riwayat[0][0] === "mate" &&
    staticEval[0] === "mate" &&
    advanceMate(staticEvalAmount, getPreviousStaticEvalAmount(0), color) &&
    !winning
  ) {
    return { moveRating: "good", ...komentar("advanceMate") };
  }

  // miss — melewatkan skakmat
  if (riwayat[0][0] === "mate" && staticEval[0] !== "mate" && previousWinning) {
    return { moveRating: "miss", ...komentar("missMate") };
  }

  // miss — melewatkan kesempatan advantage
  if (
    !previousMiss &&
    isNotMateRelated &&
    (previousMistake || minimalSeparah(getPreviousStandardRating(0), "blunder")) &&
    minimalSeparah(standardRating, "inaccuracy") &&
    evaluationDiff <= getPreviousEvaluationDiff(0) + 0.5
  ) {
    return { moveRating: "miss", ...komentar("missAdvantage") };
  }

  /*
   * Dua cabang berikut adalah DIAGNOSIS, bukan penentu keparahan: keduanya
   * menandai kerugian yang melintasi garis keunggulan besar (±2,0) — "kehilangan
   * keunggulan" dan "menyerahkan keunggulan". Sejak keparahan datang dari band
   * kerugian peluang, labelnya mengikuti band blunder bila memang sebesar itu,
   * tetapi tidak pernah lebih ringan dari `mistake`: melintasi garis menang
   * terlalu besar untuk disebut sekadar "inaccuracy". Komentarnya tetap yang
   * spesifik supaya pengguna tahu APA yang salah, bukan cuma seberapa buruk.
   */
  const keparahanBesar = standardRating === "blunder" ? "blunder" : "mistake";

  // mistake — kehilangan advantage
  if (
    isNotMateRelated &&
    minimalSeparah(standardRating, "inaccuracy") &&
    evaluationDiff >= 1.2 &&
    losingGreatAdvantage(staticEvalAmount, getPreviousStaticEvalAmount(0), color)
  ) {
    return { moveRating: keparahanBesar, ...komentar("loseAdvantage") };
  }

  // mistake — memberikan advantage ke lawan
  if (
    isNotMateRelated &&
    minimalSeparah(standardRating, "inaccuracy") &&
    evaluationDiff >= 1.2 &&
    givingGreatAdvantage(staticEvalAmount, getPreviousStaticEvalAmount(0), color)
  ) {
    return { moveRating: keparahanBesar, ...komentar("giveAdvantage") };
  }

  // mistake — mulai terserang skakmat
  if (
    riwayat[0][0] !== "mate" &&
    staticEval[0] === "mate" &&
    !winning &&
    (color === "w" ? getPreviousStaticEvalAmount(0) <= -2 : getPreviousStaticEvalAmount(0) >= 2)
  ) {
    return { moveRating: "mistake", ...komentar("gettingMated") };
  }

  // blunder — menyerahkan skakmat
  if (
    (riwayat[0][0] !== "mate" && staticEval[0] === "mate" && !winning) ||
    (riwayat[0][0] === "mate" && staticEval[0] === "mate" && !winning && previousWinning)
  ) {
    return { moveRating: "blunder", ...komentar("gettingMated") };
  }

  return { moveRating: standardRating, ...komentar(standardRating) };
}

/* ------------------------------------------------------ deteksi khusus */

function getAttackersDefenders(chess, warna, ke) {
  const attackers = chess.attackers(ke, invertColor(warna));

  // Optimasi murni: FEN dan daftar langkah papan diambil sekali per pemanggilan
  // lalu dipakai ulang, tetapi baru dihitung saat benar-benar diperlukan. Sebagian
  // besar petak yang dipindai `isSacrifice` tidak diserang sama sekali, jadi
  // memanggil `moves()` di awal fungsi justru menambah kerja (chess.js menyusun
  // FEN untuk setiap langkah yang dihasilkannya).
  let cacheLangkah, cacheFen;
  const langkah = () => (cacheLangkah ??= chess.moves({ verbose: true }));
  const fen = () => (cacheFen ??= chess.fen());

  const legalAttackers = attackers.filter(
    (penyerang) => langkah().findIndex((m) => m.from === penyerang && m.to === ke) !== -1
  );
  const legalAttackersPieces = legalAttackers.map((kotak) => chess.get(kotak));

  // Baterai (x-ray): penyerang yang baru terlihat setelah satu-satunya penyerang
  // legal menyingkir. Hanya dihitung pada kasus "satu penyerang legal" karena
  // hanya di situ `isSacrifice` memakainya (pengecualian tukar-menukar untuk
  // benteng/ratu). Di kasus itu `langkah()` sudah terisi, jadi biaya tambahannya
  // hanya penelusuran garis serangnya — lihat ./keamananBidak.js.
  const tersembunyi = legalAttackers.length === 1 ? penyerangTersembunyi(chess, ke, invertColor(warna), langkah).length : 0;

  let defenders, legalDefenders, legalDefendersPieces;
  if (attackers.length === 1) {
    const testChess = new Chess(fen());
    try {
      testChess.move({ from: attackers[0], to: ke });
    } catch {
      /* bisa jadi langkah ilegal — hanya dipakai untuk uji serangan */
    }

    defenders = testChess.attackers(ke, warna);
    // `testChess` tidak diubah selama filter, jadi daftar langkahnya diambil
    // sekali saja (dulu sekali per pembela).
    let cacheAmbil;
    const langkahSetelahAmbil = () => (cacheAmbil ??= testChess.moves({ verbose: true }));
    legalDefenders = defenders.filter(
      (pembela) => langkahSetelahAmbil().findIndex((m) => m.from === pembela && m.to === ke) !== -1
    );
    legalDefendersPieces = legalDefenders.map((kotak) => chess.get(kotak));
  } else {
    defenders = chess.attackers(ke, warna);
    // Posisi "penyerang mengambil di ke" hanya tergantung pada penyerangnya, jadi
    // hasilnya di-memo per penyerang alih-alih dibangun ulang untuk tiap pasangan
    // pembela×penyerang. Memo-nya tetap malas, sehingga kombinasi yang tidak
    // sempat diperiksa karena `return false` lebih awal tetap dilewati seperti
    // sebelumnya — hasil filter identik.
    const cacheLangkahSerang = new Map();
    const langkahUntuk = (penyerang) => {
      if (!cacheLangkahSerang.has(penyerang)) {
        const testChess = new Chess(fen());
        try {
          testChess.move({ from: penyerang, to: ke });
        } catch {
          /* sama seperti di atas */
        }
        cacheLangkahSerang.set(penyerang, testChess.moves({ verbose: true }));
      }
      return cacheLangkahSerang.get(penyerang);
    };
    legalDefenders = defenders.filter((pembela) => {
      for (const penyerang of legalAttackers) {
        if (langkahUntuk(penyerang).findIndex((m) => m.from === pembela && m.to === ke) === -1) {
          return false;
        }
      }
      return true;
    });
    legalDefendersPieces = legalDefenders.map((kotak) => chess.get(kotak));
  }

  return {
    attackers: {
      squares: legalAttackers,
      pieces: legalAttackersPieces,
      length: legalAttackers.length,
      // Jumlah penyerang tersembunyi; selalu 0 kecuali tepat satu penyerang
      // legal (lihat perhitungan di atas).
      tersembunyi,
    },
    defenders: { squares: legalDefenders, pieces: legalDefendersPieces, length: legalDefenders.length },
  };
}

function couldBeSaved(chess, kotak, warna) {
  if (!chess.attackers(kotak, warna).length) {
    for (const m of chess.moves({ verbose: true })) {
      if (m.from !== kotak) return true;
    }
  } else {
    for (const m of chess.moves({ verbose: true, square: kotak })) {
      const testChess = new Chess(m.after);
      if (!testChess.attackers(m.to, warna).length) return true;
    }
  }
  return false;
}

/**
 * Apakah bidak yang baru dimainkan (atau bidak yang ditinggalkan di kotaknya)
 * bisa diselamatkan namun sengaja dikorbankan? Dipakai untuk label brilliant.
 */
export function isSacrifice(move) {
  const chess = new Chess(move.after);
  const chessBefore = new Chess(move.before);

  const sacrifying = [];

  for (const row of chess.board()) {
    for (const kotak of row) {
      if (!kotak || kotak.type === PAWN) continue;
      if (kotak.color !== move.color) continue;

      const { attackers, defenders } = getAttackersDefenders(chess, move.color, kotak.square);

      // Pengecualian "satu penyerang" di bawah mengandaikan serangan satu lawan
      // satu, sehingga tukar-menukar material dianggap adil. Penyerang tersembunyi
      // di belakang penyerang tunggal itu (baterai) membatalkan pengandaiannya —
      // sama seperti petak yang sejak awal diserang dua bidak, yang memang tidak
      // pernah mendapat pengecualian. Lihat ./keamananBidak.js.
      const satuPenyerang = attackers.length === 1 && !attackers.tersembunyi;

      if (!defenders.length && attackers.length && (!move.captured || move.captured === PAWN)) {
        sacrifying.push(kotak);
        continue;
      }
      if (
        (kotak.type === KNIGHT || kotak.type === BISHOP) &&
        !move.captured &&
        attackers.pieces.findIndex((p) => p?.type === PAWN) !== -1
      ) {
        sacrifying.push(kotak);
        continue;
      }
      if (
        kotak.type === ROOK &&
        attackers.length &&
        move.captured !== ROOK &&
        move.captured !== QUEEN &&
        !(satuPenyerang && (attackers.pieces[0]?.type === QUEEN || attackers.pieces[0]?.type === ROOK) && defenders.length) &&
        !(defenders.length && (move.captured === KNIGHT || move.captured === BISHOP))
      ) {
        sacrifying.push(kotak);
        continue;
      }
      if (
        kotak.type === QUEEN &&
        attackers.length &&
        move.captured !== QUEEN &&
        !(satuPenyerang && attackers.pieces[0]?.type === QUEEN && defenders.length) &&
        !(satuPenyerang && attackers.pieces[0]?.type === ROOK && move.captured === ROOK && defenders.length)
      ) {
        sacrifying.push(kotak);
        continue;
      }
    }
  }

  for (const kotak of sacrifying) {
    const sebelum =
      chessBefore.get(kotak.square)?.color === chess.get(kotak.square)?.color &&
      chessBefore.get(kotak.square)?.type === chess.get(kotak.square)?.type
        ? kotak.square
        : move.from;

    if (couldBeSaved(chessBefore, sebelum, invertColor(move.color))) return true;
  }

  return false;
}

/** Hanya satu langkah legal ⇒ pemain tidak punya pilihan (label "forced"). */
export function isForced(move) {
  const chess = new Chess(move.before);
  return chess.moves().length === 1;
}
