/**
 * Uji IS_SACRIFICE fitur Analisa — pengunci perilaku `isSacrifice` pada
 * `src/halaman/Analisa/mesin/penilaian.js` (dipakai untuk melabeli "brilliant").
 *
 * `isSacrifice` menelusuri papan lalu memanggil `getAttackersDefenders` untuk
 * tiap bidak non-pion pihak yang bergerak. Fungsi itu boleh dioptimasi (FEN dan
 * daftar langkah diambil sekali per pemanggilan, lalu di-memo per penyerang),
 * TETAPI hasil boolean-nya tidak boleh berubah. Uji ini menjaga kesetaraan itu:
 *
 *   1. NALAR  — 6 kasus yang nilai harapannya di-nalar langsung dari kriteria
 *      pemanggilan di `isSacrifice` (jenis bidak, jumlah penyerang legal, jumlah
 *      pembela, `move.captured`) — bukan dari keluaran fungsi. Tiap kasus juga
 *      menguji ulang fakta serangnya lewat chess.js, supaya alasan di komentar
 *      tidak basi kalau FEN-nya diedit.
 *   2. PENYERANG — pembela disaring dengan penyerang LEGAL, bukan geometris;
 *      kasus di bawah berbalik kalau kedua daftar itu disamakan.
 *   3. PADAT  — 16 kasus yang di posisinya ada petak dengan ≥2 penyerang legal
 *      dan ≥1 pembela; itu memaksa cabang `else` di `getAttackersDefenders`
 *      (loop bersarang pembela×penyerang) benar-benar dijalankan → jalur yang
 *      di-memo. Nilainya adalah *karakterisasi*: direkam dari implementasi
 *      sebelum optimasi (commit 54e4a90). Kalau suatu saat perbedaannya memang
 *      disengaja, fixture ini harus diperbarui secara sadar — bukan otomatis.
 *   4. SIFAT  — determinisme antar-pemanggilan dan kemurnian (objek `move`
 *      input tidak dimutasi).
 *
 * Kasus dasar (kuda jatuh ke bidak, langkah tenang, Qxd5) sudah ada di
 * `scripts/uji-klasifikasi.mjs`; di sini hanya kasus yang belum tertutup.
 *
 * Jalankan: node scripts/uji-sacrifice.mjs
 */
import { isSacrifice } from "../src/halaman/Analisa/mesin/penilaian.js";
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

/** Bangun objek `move` seperti yang disiapkan parseMove: + `before`/`after`. */
function buatLangkah({ fen, dari, ke }) {
  const chess = new Chess(fen);
  const mv = chess.move({ from: dari, to: ke });
  return { ...mv, before: fen, after: chess.fen() };
}

/** Petak non-pion milik `warna` yang diserang ≥min penyerang legal dan punya pembela. */
function petakPadat(chess, warna, min = 2) {
  const lawan = warna === "w" ? "b" : "w";
  const legal = chess.moves({ verbose: true });
  let ketemu = 0;
  for (const row of chess.board()) {
    for (const k of row) {
      if (!k || k.type === "p" || k.color !== warna) continue;
      const attackers = chess.attackers(k.square, lawan);
      const nLegal = legal.filter((m) => m.to === k.square && attackers.includes(m.from)).length;
      if (nLegal >= min && chess.attackers(k.square, warna).length >= 1) ketemu++;
    }
  }
  return ketemu;
}

/* ------------------------------------------------------------------- NALAR */

console.log("== isSacrifice: kasus yang dinalar dari kriteria ==");

const NALAR = [
  {
    nama: "Re2-e4: rook diserang 2 bidak + dikawal 2 bidak → pengorbanan",
    fen: "4k3/8/8/3p1p2/8/3P1P2/4R3/4K3 w - - 0 1",
    dari: "e2",
    ke: "e4",
    harapan: true,
    // Cabang ROOK: attackers.length ≥ 2 (jadi pengecualian "penyerang tunggal
    // Q/R yang dikawal" tidak berlaku), captured kosong, dan pembela hanya
    // mengecualikan kalau yang diambil kuda/gajah.
    fakta: (c) => c.attackers("e4", "b").length === 2 && c.attackers("e4", "w").length === 2,
  },
  {
    nama: "Nf3: kuda diserang gajah saja dan dikawal bidak → bukan pengorbanan",
    fen: "4k3/8/8/3b4/8/8/6P1/4K1N1 w - - 0 1",
    dari: "g1",
    ke: "f3",
    harapan: false,
    // Ada pembela → kriteria pertama gugur; penyerangnya bukan bidak → kriteria
    // kuda/gajah juga gugur.
    fakta: (c) => {
      const atk = c.attackers("f3", "b");
      return atk.length === 1 && c.get(atk[0]).type === "b" && c.attackers("f3", "w").length === 1;
    },
  },
  {
    nama: "Ra4-a6: rook diserang gajah tanpa pembela → pengorbanan",
    fen: "4k3/1b6/8/8/R7/8/8/4K3 w - - 0 1",
    dari: "a4",
    ke: "a6",
    harapan: true,
    // Kriteria pertama: `!defenders.length && attackers.length` dan langkahnya
    // tidak mengambil apa pun.
    fakta: (c) => c.attackers("a6", "b").length === 1 && c.attackers("a6", "w").length === 0,
  },
  {
    nama: "a3 di posisi awal: tidak ada bidak putih yang diserang → bukan pengorbanan",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    dari: "a2",
    ke: "a3",
    harapan: false,
    fakta: (c) =>
      c.board().flat().every((k) => !k || k.color !== "w" || k.type === "p" || c.attackers(k.square, "b").length === 0),
  },
  {
    nama: "Rd4-d6: rook diserang tepat satu ratu, dikawal 2 bidak → bukan pengorbanan",
    fen: "3qk3/8/8/2P1P3/3R4/8/8/4K3 w - - 0 1",
    dari: "d4",
    ke: "d6",
    harapan: false,
    // Pengecualian eksplisit: satu penyerang berupa Q/R sementara ada pembela.
    fakta: (c) => {
      const atk = c.attackers("d6", "b");
      return atk.length === 1 && c.get(atk[0]).type === "q" && c.attackers("d6", "w").length === 2;
    },
  },
  {
    nama: "Nb1-c3: kuda diserang bidak (walau dikawal bidak lain) → pengorbanan",
    fen: "4k3/8/8/8/1p6/8/PPP5/1N2K3 w - - 0 1",
    dari: "b1",
    ke: "c3",
    harapan: true,
    // Kuda/gajah yang tidak mengambil apa pun dan dijangkau bidak lawan selalu
    // jadi kandidat, pengawalan tidak dilihat di kriteria ini.
    fakta: (c) => {
      const atk = c.attackers("c3", "b");
      return atk.length === 1 && c.get(atk[0]).type === "p" && c.attackers("c3", "w").length === 1;
    },
  },
];

for (const k of NALAR) {
  const move = buatLangkah(k);
  hasil(`${k.nama} (fakta serangan cocok)`, k.fakta(new Chess(move.after)));
  hasil(`  → isSacrifice = ${k.harapan}`, isSacrifice(move) === k.harapan, `dapat ${isSacrifice(move)}`);
}

/* ------------------------------------------------------------------- PADAT */

console.log("\n== isSacrifice: kasus padat (cabang multi-penyerang di-memo) ==");

// [fenSebelum, dari, ke, harapan] — harapan = keluaran implementasi SEBELUM
// optimasi (oracle karakterisasi), lihat catatan di kepala berkas.
const PADAT = [
  ["r1b2bnr/pp1kppp1/n1pp3p/1q6/QPP2P1P/P3P1P1/3P4/RNB1KBNR b Q - 2 12", "h8", "h7", true],
  ["r1b2bn1/pp1kpppr/n1pp3p/1P6/QP3P1P/P3P1P1/3P4/RNB1KBNR b Q - 0 13", "h6", "h5", true],
  ["rnb2bn1/1p2pp1r/3pk3/QPp3pp/1P3P1P/P2BP1P1/1R1P4/1NB1K1NR b - - 1 18", "b8", "a6", true],
  ["2b2b2/1p1k1p1r/7n/nPppp2p/1PB4p/P1R1P1P1/3PK2R/1NB3N1 w - - 0 30", "g3", "g4", true],
  ["2b5/1p1k1pbr/7n/nPppp2p/1PB3Pp/P1R1P3/3PK2R/1NB3N1 w - - 1 31", "d2", "d3", true],
  ["7r/1bkB4/1p3b1n/nP2p1Pp/1Pp4p/P1RPP3/4K1R1/1NB3N1 b - - 5 39", "a5", "c6", true],
  ["1rb1kbn1/pp2p3/n2p4/5p2/qPp2pp1/P6R/2PrPK1P/2B1QBNR w - - 0 18", "h3", "d3", true],
  ["2rqkbn1/p3p3/b2p1n2/1p3pN1/1P4BR/P5p1/1Bp1P3/4QK2 w - - 4 31", "e1", "c1", true],
  ["r1b2bn1/1p2pp1r/n2pk3/QPp3pp/1PB2P1P/P3P1P1/1R1P4/1NB1K1NR b - - 3 19", "e6", "d7", false],
  ["3q2kr/r2bpnbp/npp2p2/p1N3p1/1B1P1PPP/P6B/1PP1N3/2R1K2R w K - 1 22", "h4", "g5", false],
  ["1r3b1r/p2k1p1p/bpp3p1/nB1qp2n/N2Q2P1/1PP1P3/P2PKP1P/R1B3NR w - - 8 15", "d4", "b6", false],
  ["1r3b1r/p2k1p1p/bQp3p1/nB1qp3/N5P1/1PP1P1n1/P2PKP1P/R1B3NR w - - 1 16", "f2", "g3", false],
  ["r2k3r/p4p2/2qb2p1/1bQ1p1Pp/N6P/1PPPP1P1/PB6/R3K1N1 w - - 3 26", "e1", "d1", false],
  ["2q1k1r1/r2nbppp/pp1pb2n/1NpPp3/2P1PPPP/2B2N2/PP4B1/2RQK1R1 w - - 9 19", "f3", "e5", false],
  ["2rqk1r1/4bppp/1p1pb2n/pNN1nP2/1PP3PP/P4Q1B/2R5/4K1R1 b - - 0 28", "h6", "f5", false],
  ["1r1qkr2/4bppp/1p1nb3/P1N1n3/2P3PP/P6B/2R1Q3/4KR2 b - - 0 32", "e5", "c4", false],
];

let jumlahPadat = 0;
for (const [fen, dari, ke, harapan] of PADAT) {
  const move = buatLangkah({ fen, dari, ke });
  const padat = petakPadat(new Chess(move.after), move.color);
  if (padat > 0) jumlahPadat++;
  hasil(`isSacrifice(${move.san}) = ${harapan}`, isSacrifice(move) === harapan, `dapat ${isSacrifice(move)}`);
}
hasil(
  "fixture padat benar-benar menyentuh cabang multi-penyerang",
  jumlahPadat === PADAT.length,
  `${jumlahPadat}/${PADAT.length} kasus punya petak dengan ≥2 penyerang legal + pembela`
);
hasil(
  "fixture padat seimbang (ada true dan false)",
  PADAT.filter((k) => k[3]).length === 8 && PADAT.filter((k) => !k[3]).length === 8
);

/* ------------------------------------------- PENYERANG: legal ≠ geometris */

console.log("\n== isSacrifice: penyaring penyerang harus yang legal, bukan geometris ==");

// Di `getAttackersDefenders`, `attackers` = penyerang GEOMETRIS (sudah pasti
// menyerang petaknya), sedangkan `legalAttackers` sudah difilter dengan daftar
// langkah legal sehingga bidak yang terpaku tersingkir. Loop pembela di cabang
// `else` wajib memakai yang legal — kalau kedua daftar itu disamakan (godaan
// umum saat merapikan cache), kasus-kasus di bawah berbalik jadi true.
const PENYERANG = [
  ["r1b2b1r/3n1k1p/1p3pp1/p2Kn3/PpP4P/1P2p3/1B1P1qP1/1R3B1R b - - 4 28", "c8", "a6", false], // Ba6
  ["rnb4r/1pqp3p/p1kb1p2/2P5/4pnp1/2PPPPP1/P1NK2QP/R1B2BNR b - - 3 19", "f4", "d3", false], // Nxd3
  ["r2qk2r/p1pp2pp/b1n1N2n/1pb2p2/5pP1/P1P1P2B/1P1P1K1P/RNBQ2R1 b kq - 2 11", "c5", "e3", false], // Bxe3+
  ["r3k2r/p1p1q2p/b1n1p1pn/1p3p2/5pP1/P1P1b2B/1P1PK1RP/RNB1Q3 b kq - 3 15", "f5", "g4", false], // fxg4
  ["1b1B1k2/5q1r/b5pn/p1p1PN1p/2P3PP/N3P3/PP2QP2/RB3KR1 w - - 1 45", "d8", "e7", false], // Be7+
  ["rnb2r2/q2k1pp1/4pb2/1pP3Np/2B2PPP/8/Pp6/R1B1K1R1 w - - 3 26", "c4", "e6", false], // Bxe6+
];

for (const [fen, dari, ke, harapan] of PENYERANG) {
  const move = buatLangkah({ fen, dari, ke });
  hasil(`isSacrifice(${move.san}) = ${harapan}`, isSacrifice(move) === harapan, `dapat ${isSacrifice(move)}`);
}

/* ------------------------------------------------------------------- SIFAT */

console.log("\n== isSacrifice: determinisme & kemurnian ==");

const SEMUA = [
  ...NALAR.map(({ fen, dari, ke }) => ({ fen, dari, ke })),
  ...PADAT.map(([fen, dari, ke]) => ({ fen, dari, ke })),
  ...PENYERANG.map(([fen, dari, ke]) => ({ fen, dari, ke })),
];
const gerakan = SEMUA.map(buatLangkah);
const sidikJari = gerakan.map((m) => JSON.stringify(m));

const pertama = gerakan.map(isSacrifice);
hasil("hasil stabil di 5 pemanggilan berturut-turut", [1, 2, 3, 4, 5].every(() => gerakan.every((m, i) => isSacrifice(m) === pertama[i])));
hasil("objek `move` input tidak dimutasi", gerakan.every((m, i) => JSON.stringify(m) === sidikJari[i]));
hasil(
  "FEN sumber tidak berubah (papan lokal tidak dimutasi)",
  gerakan.every((m) => new Chess(m.before).fen() === m.before && typeof m.after === "string")
);

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
