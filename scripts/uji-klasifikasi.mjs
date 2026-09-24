/**
 * Uji KLASIFIKASI LANGKAH fitur Analisa — menguji `getMoveRating` ASLI dari
 * `src/halaman/Analisa/mesin/penilaian.js` (fungsinya murni, jadi bisa dites
 * tanpa React/browser): blunder, mistake, inaccuracy, miss, great, brilliant,
 * best, excellent, good, book, forced + deteksi pengorbanan (isSacrifice) dan
 * langkah paksa (isForced).
 *
 * Konvensi input (persis seperti dipakai parseMove):
 *   - `riwayat` = previousStaticEvals UCI mentah, dari sudut pandang pihak
 *     yang BERGILIR pada posisi itu; riwayat[0] = posisi sebelum langkah
 *     sekarang (pihak yang bergilir = pemain yang sedang dinilai),
 *     riwayat[1..3] = semakin ke belakang.
 *   - `staticEval` = evaluasi UCI SESUDAH langkah (pihak bergilir = lawan
 *     pemain yang dinilai).
 *   - `color` = pemain yang BARU bergerak (move.color dari chess.js).
 *
 * Konvensi tanda skor engine (divalidasi empiris oleh uji-engine-uci terhadap
 * 4 build Stockfish asli): `mate n` positif = pihak yang BERGILIR memberikan
 * skakmat (menang), negatif = pihak yang bergilir yang terserang skakmat.
 *
 * Semua skenario di bawah deterministik (tanpa acak) dan tidak bergantung
 * pada warna — tiap skenario dijalankan untuk `color` "w" DAN "b".
 *
 * Jalankan: node scripts/uji-klasifikasi.mjs
 */
import { AMBANG_KERUGIAN_PELUANG, getMoveRating, isForced, isSacrifice } from "../src/halaman/Analisa/mesin/penilaian.js";
import { peluangMenang } from "../src/halaman/Analisa/mesin/peluang.js";
import * as akurasi from "../src/halaman/Analisa/mesin/akurasi.js";
import { Chess } from "chess.js";

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

const CP = (n) => ["cp", String(n)];
const MATE = (n) => ["mate", String(n)];

/** Posisi seragam: keunggulan +0.3 bagi si pemain pada tiap posisi. */
const SERAGAM = [CP(30), CP(-30), CP(30), CP(-30)];

/**
 * Skenario: riwayat ditulis dari sudut pandang SI PEMAIN yang dinilai
 * (riwayat[0]) dan lawannya (riwayat[1..]); staticEval dari sudut pandang
 * lawan. Karena getMoveRating menormalkan tanda berdasarkan `color`, nilai
 * UCI yang sama berlaku untuk kedua warna (dijalankan dua kali).
 */
const SKENARIO = [
  {
    nama: 'best — langkah sama dengan usulan engine ("e4")',
    riwayat: SERAGAM,
    staticEval: CP(-30),
    bestMoveSan: "e4",
    moveSan: "e4",
    label: "best",
    kunci: "best",
  },
  {
    nama: 'best + komentar "mate" — skakmat akhir saat langkah terbaik',
    riwayat: SERAGAM,
    staticEval: ["mate"],
    bestMoveSan: "Qxf7#",
    moveSan: "Qxf7#",
    label: "best",
    kunci: "mate",
  },
  {
    // Dulu 1,0 → 0,1 (selisih 0,9 pion) sudah "inaccuracy"; dengan ambang ruang
    // peluang kerugiannya hanya 8,2 poin → good. Band inaccuracy (10–20 poin)
    // diuji di sini dengan 1,5 → 0,2 (rugi 11,7 poin).
    nama: 'inaccuracy — keunggulan turun 1.5 → 0.2 (rugi 11,7 poin)',
    riwayat: [CP(150), CP(-150), CP(30), CP(-30)],
    staticEval: CP(-20),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "inaccuracy",
    kunci: "inaccuracy",
  },
  {
    // Penurunan kecil yang DULU inaccuracy kini good — dicatat sebagai kasus
    // tersendiri supaya pergeserannya terlihat dan tidak diam-diam hilang.
    nama: 'good (dulu inaccuracy) — keunggulan turun 1.0 → 0.1 (rugi 8,2 poin)',
    riwayat: [CP(100), CP(-100), CP(30), CP(-30)],
    staticEval: CP(-10),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "good",
    kunci: "good",
  },
  {
    nama: 'mistake "loseAdvantage" (putih) — unggul 2.5 → 1.0 (diff 1.5, >2 menjadi <2)',
    riwayat: [CP(250), CP(-250), CP(30), CP(-30)],
    staticEval: CP(-100),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "mistake",
    kunci: "loseAdvantage",
    hanya: "w",
  },
  {
    // Kerugian peluangnya 25,1 poin persen: masuk band `mistake` (20–30), jadi
    // labelnya tetap mistake meski garis keunggulan ±2,0 ikut diseberangi.
    nama: 'mistake "giveAdvantage" — dari seimbang (0.0) langsung -3.0 (rugi 25,1 poin)',
    riwayat: [CP(0), CP(0), CP(0), CP(0)],
    staticEval: CP(300),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "mistake",
    kunci: "giveAdvantage",
    // Catat: cabang "giveAdvantage" hanya terjangkau untuk putih. Untuk hitam,
    // kondisi numeriknya identik dengan "loseAdvantage" (dicek lebih dulu),
    // jadi kolaps 0 → -3 untuk hitam berlabel inaccuracy biasa — quirk code
    // upstream yang dipertahankan terjemahan ini.
    hanya: "w",
  },
  {
    nama: "blunder — keunggulan 0 → -5.0 (rugi 36,3 poin ≥ 30, garis -2.0 diseberangi)",
    riwayat: [CP(0), CP(0), CP(0), CP(0)],
    staticEval: CP(500),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "blunder",
    kunci: "giveAdvantage",
  },
  {
    // Jalur mistake UMUM (tanpa diagnosis): posisi sudah kalah jauh, jadi tidak
    // ada garis keunggulan yang diseberangi dan komentarnya kalimat "mistake".
    // Ini juga bukti bahwa label band bisa berubah sendiri tanpa diagnosis —
    // dulu jalur ini bernilai "blunder" karena ambang centipawn (selisih 9,0).
    nama: "mistake — -3.0 → -12.0 (rugi 22,4 poin, band mistake, tanpa diagnosis)",
    riwayat: [CP(-300), CP(-300), CP(-300), CP(-300)],
    staticEval: CP(1200),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "mistake",
    kunci: "mistake",
  },
  {
    // Kasus "blunder/blunder" (komentar cadangan) praktis tak terjangkau lagi:
    // kerugian ≥ 30 poin selalu menyeberangi garis ±2,0 sehingga salah satu
    // cabang diagnosis yang mengambil alih. Karena itu kasus determinisme di
    // bawah memakai kasus blunder BAND + diagnosis ini.
    nama: "blunder — -1.0 → -8.0 (rugi 35,9 poin ≥ 30, diagnosis giveAdvantage)",
    riwayat: [CP(-100), CP(-100), CP(-100), CP(-100)],
    staticEval: CP(800),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "blunder",
    kunci: "giveAdvantage",
    hanya: "w",
  },
  {
    nama: 'excellent "memulai skakmat" — mulai rantai skakmat lawan (M2 bagi lawan)',
    riwayat: SERAGAM,
    staticEval: MATE(-2),
    bestMoveSan: "a3",
    moveSan: "Qxf7#",
    label: "excellent",
    kunci: "mateIn",
  },
  {
    nama: 'good "menunda skakmat" — skakmat sendiri diperlambat 4 → 6',
    riwayat: [MATE(4), CP(30), CP(30), CP(30)],
    staticEval: MATE(-6),
    bestMoveSan: "a3",
    moveSan: "Qh5",
    label: "good",
    kunci: "delayMate",
  },
  {
    nama: 'good "mempercepat skakmat sendiri" — terkejar skakmat 6 → 4',
    riwayat: [MATE(-6), CP(30), CP(30), CP(30)],
    staticEval: MATE(4),
    bestMoveSan: "a3",
    moveSan: "Qh5",
    label: "good",
    kunci: "advanceMate",
  },
  {
    nama: 'excellent "tepat menuju skakmat" — serangan skakmat dipercepat 6 → 4',
    riwayat: [MATE(6), CP(30), CP(30), CP(30)],
    staticEval: MATE(-4),
    bestMoveSan: "a3",
    moveSan: "Qh5",
    label: "excellent",
    kunci: "mateIn",
  },
  {
    nama: 'miss "melewatkan skakmat" — punya M2 lalu main keluar jalur',
    riwayat: [MATE(2), CP(30), CP(-30), CP(30)],
    staticEval: CP(100),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "miss",
    kunci: "missMate",
  },
  {
    nama: 'miss "kelewat menghukum" — lawan blunder (diff 4) lalu salah juga (diff 2)',
    riwayat: [CP(300), CP(100), CP(-100), CP(100)],
    staticEval: CP(-100),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "miss",
    kunci: "missAdvantage",
  },
  {
    nama: 'mistake "mulai terserang skakmat" — kalah 3.0 lalu memberi M2',
    riwayat: [CP(-300), CP(30), CP(30), CP(30)],
    staticEval: MATE(2),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "mistake",
    kunci: "gettingMated",
  },
  {
    nama: 'blunder "memberi skakmat" — dari +1.0 langsung M2 bagi lawan',
    riwayat: [CP(100), CP(-100), CP(30), CP(30)],
    staticEval: MATE(2),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "blunder",
    kunci: "gettingMated",
  },
  {
    nama: 'blunder "membalikkan M2 jadi M4" — dari menang mutlak jadi terkejar',
    riwayat: [MATE(2), CP(30), CP(30), CP(30)],
    staticEval: MATE(4),
    bestMoveSan: "a3",
    moveSan: "e4",
    label: "blunder",
    kunci: "gettingMated",
  },
  {
    // Kesalahan lawan sebelumnya HARUS cukup besar di ruang peluang: pola lama
    // (riwayat[1] = +150) hanya rugi 8,9 poin → band "good", jadi brilliant
    // tidak lagi menyala. Dengan riwayat[1] = +250 kerugiannya 16,8 poin →
    // band inaccuracy, dan pengorbanan yang menghukumnya menjadi brilliant.
    nama: 'brilliant — pengorbanan, lawan sebelumnya keliru (rugi 16,8 poin), posisi seimbang lagi',
    riwayat: [CP(-50), CP(250), CP(-100), CP(100)],
    staticEval: CP(0),
    bestMoveSan: "a3",
    moveSan: "Qd5",
    sacrifice: true,
    label: "brilliant",
    kunci: "brilliant",
  },
  {
    nama: 'great — menghukum blunder lawan (diff lawan 4.0), langkah sendiri diff 0',
    riwayat: [CP(150), CP(250), CP(-300), CP(-250)],
    staticEval: CP(-150),
    bestMoveSan: "a3",
    moveSan: "Qd5",
    label: "great",
    kunci: "great",
  },
  {
    nama: 'excellent "skakmat sudah pasti" — posisi mat, bukan langkah terbaik engine',
    riwayat: SERAGAM,
    staticEval: ["mate"],
    bestMoveSan: "a3",
    moveSan: "Kf1",
    label: "excellent",
    kunci: "mate",
  },
];

console.log("== getMoveRating: klasifikasi label ==");
for (const sk of SKENARIO) {
  const warna = sk.hanya ?? ["w", "b"];
  for (const c of (Array.isArray(warna) ? warna : [warna])) {
    const r = getMoveRating({
      staticEval: sk.staticEval,
      previousStaticEvals: sk.riwayat,
      bestMoveSan: sk.bestMoveSan,
      moveSan: sk.moveSan,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      color: c,
      sacrifice: sk.sacrifice ?? false,
      previousSacrifice: false,
      openings: {},
    });
    hasil(
      `${sk.nama} [color ${c}] → ${sk.label}/${sk.kunci}`,
      r.moveRating === sk.label && r.commentKey === sk.kunci,
      `dapat ${r.moveRating}/${r.commentKey}`
    );
  }
}

console.log("\n== ambang kerugian peluang: kurva bersama & band label ==");
{
  /*
   * Label standar tidak lagi memakai selisih centipawn, melainkan kerugian
   * peluang lewat kurva yang SAMA dengan akurasi. Dua hal yang dijaga di sini:
   * kurvanya benar-benar satu fungsi (bukan salinan yang bisa menyimpang), dan
   * batas tiap band berperilaku persis seperti `AMBANG_KERUGIAN_PELUANG`.
   */
  hasil(
    "akurasi.js mengekspor ULANG fungsi kurva yang sama (satu sumber, bukan salinan)",
    akurasi.peluangMenang === peluangMenang && akurasi.batasiCp !== undefined,
    `akurasi.peluangMenang === peluangMenang → ${akurasi.peluangMenang === peluangMenang}`
  );
  hasil(
    "peluangMenang masih cocok dengan acuan (0 → 50, +100 → 59,1)",
    Math.abs(peluangMenang(0) - 50) < 1e-9 && Math.abs(peluangMenang(100) - 59.10258971916129) < 1e-9,
    `dapat ${peluangMenang(0)} / ${peluangMenang(100)}`
  );
  hasil(
    "ambang band berurutan naik (good < inaccuracy < mistake < blunder)",
    AMBANG_KERUGIAN_PELUANG.good < AMBANG_KERUGIAN_PELUANG.inaccuracy &&
      AMBANG_KERUGIAN_PELUANG.inaccuracy < AMBANG_KERUGIAN_PELUANG.mistake &&
      AMBANG_KERUGIAN_PELUANG.mistake < AMBANG_KERUGIAN_PELUANG.blunder
  );

  // Skenario band: tiap baris [eval sebelum (sudut pemain), eval sesudah, label]
  // — semuanya tanpa penyeberangan garis ±2,0 supaya yang diuji murni bandnya.
  const BAND = [
    // +5,0 → +4,2: dulu "inaccuracy" (selisih 0,8 pion) padahal posisinya masih
    // menang mutlak; kerugian peluangnya cuma 3,9 poin → excellent.
    ['band: +5,0 → +4,2 (rugi 3,9 poin) → excellent', 500, 420, "excellent"],
    // +9,0 → +6,0: selisih 3,0 pion (dulu "inaccuracy"), kerugian 6,4 poin → good.
    ['band: +9,0 → +6,0 (rugi 6,4 poin) → good', 900, 600, "good"],
    // 0,0 → -1,2: kerugian 10,9 poin → inaccuracy (ambang 10), dan TIDAK ada
    // garis keunggulan yang diseberangi sehingga labelnya murni dari band.
    ['band: 0,0 → -1,2 (rugi 10,9 poin) → inaccuracy', 0, -120, "inaccuracy"],
    // -2,1 → -9,0: kerugian 28,1 poin → band mistake (20–30). Posisinya sudah
    // kalah jauh dan tidak menyeberangi garis ±2,0, jadi komentarnya "mistake".
    ['band: -2,1 → -9,0 (rugi 28,1 poin) → mistake', -210, -900, "mistake"],
    // Kerugian peluang memperlakukan penurunan di posisi sudah kalah jauh
    // berbeda dari sebelumnya: 9,0 pion hanya bernilai 22,4 poin.
    ['band: -3,0 → -12,0 (rugi 22,4 poin) → mistake', -300, -1200, "mistake"],
  ];
  for (const [nama, sebelum, sesudah, harapan] of BAND) {
    for (const c of ["w", "b"]) {
      // Konvensi UCI (sama seperti seluruh suite ini): eval selalu dari sudut
      // pihak yang BERGILIR, jadi angka yang sama berlaku untuk kedua warna.
      // riwayat[0] = posisi sebelum langkah → pihak bergilir = pelangkah, jadi
      // ditulis apa adanya; staticEval = posisi sesudah langkah → pihak bergilir
      // = lawan pelangkah, jadi tandanya DIBALIK.
      //
      // Riwayat sengaja "jinak" (pola tanda berselang-seling seperti SERAGAM):
      // konversi sudut pandang membuat eval UCI [+A, −A, +A, −A] berarti posisi
      // TIDAK berubah selama tiga ply sebelumnya, sehingga label yang keluar
      // murni dari kerugian langkah ini — bukan efek samping langkah lawan yang
      // lalu dihukum label "great".
      const riwayat = [CP(sebelum), CP(-sebelum), CP(sebelum), CP(-sebelum)];
      const r = getMoveRating({
        staticEval: CP(-sesudah),
        previousStaticEvals: riwayat,
        bestMoveSan: "a3",
        moveSan: "e4",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        color: c,
        sacrifice: false,
        previousSacrifice: false,
        openings: {},
      });
      hasil(`${nama} [color ${c}]`, r.moveRating === harapan, `dapat ${r.moveRating}/${r.commentKey}`);
    }
  }
}

console.log("\n== getMoveRating: langkah buku (openings) ==");
{
  const r = getMoveRating({
    staticEval: CP(-30),
    previousStaticEvals: SERAGAM,
    bestMoveSan: "e4",
    moveSan: "e4",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1",
    color: "w",
    sacrifice: false,
    previousSacrifice: false,
    openings: (fen) => (fen === "rnbqkbnr/pppppppp/8/8/8/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1" ? "Pertahanan Bukit Raya" : undefined),
  });
  hasil('book — moveRating "book"', r.moveRating === "book", `dapat ${r.moveRating}`);
  hasil('book — nama pembukaan dipakai apa adanya', r.comment === "Pertahanan Bukit Raya", `dapat ${r.comment}`);
  const tanpaBuku = getMoveRating({
    staticEval: CP(-30),
    previousStaticEvals: SERAGAM,
    bestMoveSan: "e4",
    moveSan: "e4",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    color: "w",
    sacrifice: false,
    previousSacrifice: false,
    openings: (fen) => (fen === "rnbqkbnr/pppppppp/8/8/8/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1" ? "Pertahanan Bukit Raya" : undefined),
  });
  hasil("bukan posisi buku → kembali best", tanpaBuku.moveRating === "best", `dapat ${tanpaBuku.moveRating}`);
}

console.log("\n== isForced: hanya satu langkah legal ==");
{
  // Hitam tersedak skak Qg6 (baris g): f7/g7/h7 dijaga Qg6, g7 juga kotak
  // antar-ke dua — satu-satunya langkah legal = Kf8.
  const FEN_TERPENJARA = "6k1/8/6Q1/8/8/8/8/4K2R b - - 0 1";
  const chess = new Chess(FEN_TERPENJARA);
  hasil(
    "FEN terjaga memang hanya punya 1 langkah legal (validasi silang chess.js)",
    chess.moves().length === 1,
    `chess.js menemukan ${chess.moves().length} langkah: ${chess.moves().join(", ")}`
  );
  hasil("isForced → true", isForced({ before: FEN_TERPENJARA }) === true);
  hasil(
    "isForced → false pada posisi awal (20 langkah legal)",
    isForced({ before: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }) === false
  );
}

console.log("\n== isSacrifice: pengorbanan bidak ==");
{
  // Putih: K e1, N g1, Q d1 vs Hitam K e8, bidak e4. Nf3 jatuh ke bidak e4
  // dan tidak ada pembela → bisa diselamatkan (kuda tetap di g1) → pengorbanan.
  const chess = new Chess("4k3/8/8/8/4p3/8/8/3QK1N1 w - - 0 1");
  const langkah = chess.move({ from: "g1", to: "f3" });
  hasil("isSacrifice(Nf3 jatuh ke bidak e4) → true", isSacrifice(langkah) === true);

  // Langkah tenang: tidak ada bidak yang ditinggalkan/letakkan dalam jangkauan
  // lawan → bukan pengorbanan.
  const chess2 = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const tenang = chess2.move({ from: "e2", to: "e4" });
  hasil("isSacrifice(e4 langkah tenang) → false", isSacrifice(tenang) === false);

  // Mengambil ratu lawan: Qxd5 — meski ratu hasil tangkapan masih diserang
  // bidak e6 tanpa pembela, cabang "QUEEN" mengecualikan langkah penangkap
  // ratu → bukan pengorbanan.
  const chess3 = new Chess("4k3/8/4p3/3q4/8/3P4/8/4K2Q w - - 0 1");
  const ambil = chess3.move({ from: "h1", to: "d5" });
  hasil(
    "isSacrifice(Qxd5 — mengambil ratu, meski terserang bidak) → false",
    isSacrifice(ambil) === false,
    `dapat ${isSacrifice(ambil)}`
  );
}

console.log("\n== determinasi: label & kunci komentar stabil ==");
{
  const kasus = SKENARIO.find((s) => s.label === "blunder" && s.kunci === "giveAdvantage");
  const indeks = new Set();
  let stabil = true;
  for (let i = 0; i < 25; i++) {
    const r = getMoveRating({
      staticEval: kasus.staticEval,
      previousStaticEvals: kasus.riwayat,
      bestMoveSan: kasus.bestMoveSan,
      moveSan: kasus.moveSan,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      color: "w",
      sacrifice: false,
      previousSacrifice: false,
      openings: {},
    });
    if (r.moveRating !== kasus.label || r.commentKey !== kasus.kunci) stabil = false;
    indeks.add(r.commentIndex);
  }
  hasil("25× blunder → moveRating 'blunder' & commentKey stabil", stabil);
  hasil(
    "commentIndex acak 0..2 terisi semua varian (3 kalimat)",
    indeks.size === 3,
    `varian muncul: ${[...indeks].join(",")} (3 kalimat giveAdvantage)`
  );
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
