/**
 * Uji komentator langsung Papan Interaktif (tanpa jaringan, tanpa browser).
 *
 * Memastikan:
 *  1. Setiap kunci kalimat yang bisa dihasilkan mesin (semua gaya × semua
 *     peristiwa × semua varian) benar-benar ada di kamus ID dan EN, dan
 *     jumlah varian di kamus ≥ jumlah yang diminta mesin.
 *  2. Kalimat jadi tidak menyisakan placeholder `{…}` / `{{…}}` yang belum
 *     terisi, di kedua bahasa dan kedua gaya.
 *  3. Skenario papan nyata memicu kalimat yang tepat: skakmat (Fool's Mate),
 *     rokade, en passant, promosi, tangkapan menteri, pat, bidak
 *     menggantung, buku pembukaan, penilaian engine, ajakan engine.
 *  4. Varian kalimat deterministik (langkah sama → kalimat sama).
 *
 * Jalankan: node scripts/uji-komentator.mjs  (keluar 1 bila ada kegagalan)
 */
import { Chess } from "chess.js";
import { ID, EN } from "../src/lib/terjemahan.js";
import {
  bidakMenggantung,
  faktaLangkah,
  indeksVarian,
  isiNamaBidak,
  kategoriKeunggulan,
  rapikanKalimat,
  susunKomentar,
  GAYA_KOMENTATOR,
} from "../src/lib/komentator.js";

let gagal = 0;
let lulus = 0;
const ok = (kondisi, pesan) => {
  if (kondisi) {
    lulus++;
  } else {
    gagal++;
    console.error(`  ✗ ${pesan}`);
  }
};

/* ------------------------------------------------------------ t() tiruan */
const ambil = (kamus, kunci) =>
  kunci.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), kamus);

const buatT = (kamus) => (kunci, ganti) => {
  let teks = ambil(kamus, kunci);
  if (typeof teks !== "string") return kunci; // sama seperti i18n: fallback ke kunci
  if (ganti) {
    for (const [k, v] of Object.entries(ganti)) teks = teks.replaceAll(`{${k}}`, String(v));
  }
  return teks;
};
const tId = buatT(ID);
const tEn = buatT(EN);

const render = (t, daftar) =>
  rapikanKalimat(daftar.map(({ kunci, ganti }) => isiNamaBidak(t(kunci, ganti), t)).join(" "));

/* -------------------------------------------- 1. cakupan kunci di kamus */
console.log("1) Cakupan kunci kamus (semua gaya × peristiwa × varian)");
// Kumpulkan seluruh kunci yang bisa dihasilkan mesin dengan memaksa setiap
// cabang lewat fakta buatan + rating buatan.
const semuaKunci = new Set();
const kumpulkan = (daftar) => daftar.forEach(({ kunci }) => semuaKunci.add(kunci));

const faktaDasar = (fenSebelum, san) => {
  const f = faktaLangkah(fenSebelum, san);
  if (!f) throw new Error(`langkah tidak legal: ${san} @ ${fenSebelum}`);
  return f;
};
const AWAL = new Chess().fen();

const skenarioKunci = [
  // [fakta, opsi]
  [faktaDasar(AWAL, "e4"), {}],
  [faktaDasar(AWAL, "e4"), { rating: "book", namaPembukaan: "King's Pawn" }],
  [faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "Nf3"), {}],
  // Tangkapan biasa / untung / menteri
  [faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2", "exd4"), {}],
  [faktaDasar("rnb1kbnr/pppp1ppp/8/4p3/3qP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 4", "Nxd4"), {}],
  [faktaDasar("rnb1kbnr/pppp1ppp/8/4p3/3qP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 4", "Nxd4"), {}],
  // Rokade pendek/panjang
  [faktaDasar("r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "O-O"), {}],
  [faktaDasar("r3kbnr/pppqpppp/2n5/3p1b2/3P1B2/2N5/PPPQPPPP/R3KBNR w KQkq - 6 6", "O-O-O"), {}],
  // En passant
  [faktaDasar("rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3", "exf6"), {}],
  // Promosi
  [faktaDasar("8/1P4k1/8/8/8/8/6K1/8 w - - 0 1", "b8=Q"), {}],
  [faktaDasar("8/1P4k1/8/8/8/8/6K1/8 w - - 0 1", "b8=N"), {}],
  // Skak & skak tambahan (tangkapan + skak)
  [faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "Qh5"), {}],
  [faktaDasar("rnbqkbnr/ppp2ppp/8/3pp3/4P3/5N2/PPPPQPPP/RNB1KB1R w KQkq - 0 3", "exd5"), {}],
  [faktaDasar("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "Qxf7+"), {}],
  // Skakmat / pat / remis
  [faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2", "Qh4#"), {}],
  [faktaDasar("7k/8/6Q1/8/8/8/8/6K1 w - - 0 1", "Qg7#"), {}],
  [faktaDasar("k7/2Q5/8/8/8/8/8/6K1 w - - 0 1", "Qb6"), {}], // pat
  [faktaDasar("k7/2Q5/8/8/8/8/8/6K1 w - - 0 1", "Kf2"), {}], // langkah biasa di akhir
  [faktaDasar("k7/8/8/8/8/8/8/K5B1 w - - 0 1", "Bf2"), {}], // material tidak cukup (K+B vs K) → remis
];
for (const [f, opsi] of skenarioKunci) {
  for (const gaya of GAYA_KOMENTATOR) {
    kumpulkan(susunKomentar({ fakta: f, gaya, engineNyala: false, ...opsi }));
    for (const rating of [
      "brilliant",
      "great",
      "best",
      "excellent",
      "good",
      "inaccuracy",
      "mistake",
      "miss",
      "blunder",
      "forced",
    ]) {
      for (const evalSesudah of [
        { cpPutih: 5, matePutih: null },
        { cpPutih: 90, matePutih: null },
        { cpPutih: -250, matePutih: null },
        { cpPutih: 700, matePutih: null },
        { cpPutih: 0, matePutih: 3 },
        { cpPutih: 0, matePutih: -2 },
      ]) {
        kumpulkan(
          susunKomentar({
            fakta: f,
            gaya,
            rating,
            evalSesudah,
            saranTerbaik: "Nf3",
            engineNyala: true,
            ...opsi,
          })
        );
      }
    }
  }
}
// Paksa juga semua varian: mesin memilih varian lewat hash, jadi periksa
// seluruh indeks 0..n-1 untuk tiap kunci dasar yang muncul.
const kunciDasar = new Map(); // "papan.komentator.santai.tangkap" → maks indeks diminta
for (const k of semuaKunci) {
  const potongan = k.split(".");
  const idx = Number(potongan.pop());
  const dasar = potongan.join(".");
  kunciDasar.set(dasar, Math.max(kunciDasar.get(dasar) ?? 0, idx));
}
// Jumlah varian yang DIMINTA mesin per peristiwa (harus ≤ jumlah di kamus).
// Diambil dari sumber: cari `tambah("nama", N` di komentator.js.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sumber = readFileSync(path.join(AKAR, "src/lib/komentator.js"), "utf8");
const diminta = new Map();
for (const m of sumber.matchAll(/tambah\(\s*"([A-Za-z]+)"\s*,\s*(\d+)/g)) {
  diminta.set(m[1], Number(m[2]));
}
// Kunci yang dipilih lewat peta rating (tambah(kunciRating, 3)).
for (const nama of [
  "nilaiBrilian",
  "nilaiHebat",
  "nilaiTerbaik",
  "nilaiUnggul",
  "nilaiLayak",
  "nilaiKeliru",
  "nilaiKesalahan",
  "nilaiKelewat",
  "nilaiBlunder",
]) {
  diminta.set(nama, 3);
}
// Kunci pilihan kondisional dalam satu tambah(): remisUlang/remisMaterial/remis,
// rokadePendek/rokadePanjang.
for (const nama of ["remisUlang", "remisMaterial", "remis"]) diminta.set(nama, 2);
for (const nama of ["rokadePendek", "rokadePanjang"]) diminta.set(nama, 2);

ok(diminta.size >= 30, `jumlah peristiwa terdeteksi dari sumber: ${diminta.size} (harap ≥ 30)`);

for (const [nama, n] of diminta) {
  for (const gaya of GAYA_KOMENTATOR) {
    for (const [label, kamus] of [
      ["ID", ID],
      ["EN", EN],
    ]) {
      const larik = ambil(kamus, `papan.komentator.${gaya}.${nama}`);
      ok(
        Array.isArray(larik) && larik.length >= n,
        `${label} papan.komentator.${gaya}.${nama}: butuh ≥${n} varian, ada ${
          Array.isArray(larik) ? larik.length : "tidak ada"
        }`
      );
      if (Array.isArray(larik)) {
        larik.forEach((s, i) =>
          ok(typeof s === "string" && s.trim().length > 0, `${label} ${gaya}.${nama}[${i}] kosong`)
        );
      }
    }
  }
}
// Setiap kunci yang benar-benar dihasilkan harus ada di kamus.
for (const k of semuaKunci) {
  ok(typeof ambil(ID, k) === "string", `ID kunci hilang: ${k}`);
  ok(typeof ambil(EN, k) === "string", `EN kunci hilang: ${k}`);
}
console.log(`   ${semuaKunci.size} kunci dihasilkan mesin, ${diminta.size} peristiwa diperiksa.`);

/* ------------------------------------------ 2. placeholder harus terisi */
console.log("2) Placeholder terisi di semua kalimat jadi");
const polaSisa = /\{\{?[a-zA-Z]+(?::[a-z]+)?\}?\}/;
for (const [f, opsi] of skenarioKunci) {
  for (const gaya of GAYA_KOMENTATOR) {
    for (const [engineNyala, rating] of [
      [false, null],
      [true, "blunder"],
      [true, "best"],
    ]) {
      const daftar = susunKomentar({
        fakta: f,
        gaya,
        rating,
        engineNyala,
        evalSesudah: engineNyala ? { cpPutih: 120, matePutih: null } : null,
        saranTerbaik: "Nf3",
        ...opsi,
      });
      for (const t of [tId, tEn]) {
        const teks = render(t, daftar);
        ok(!polaSisa.test(teks), `placeholder tersisa (${gaya}): "${teks}"`);
        ok(!/papan\.komentator\./.test(teks), `kunci mentah bocor (${gaya}): "${teks}"`);
      }
    }
  }
}
// Placeholder kamus harus termasuk daftar yang disediakan mesin.
const bolehPlaceholder = new Set([
  "san",
  "pihak",
  "lawan",
  "petak",
  "bidak",
  "korban",
  "pembukaan",
  "saran",
  "unggul",
  "nilai",
  "mat",
]);
for (const [label, kamus] of [
  ["ID", ID],
  ["EN", EN],
]) {
  for (const gaya of GAYA_KOMENTATOR) {
    const blok = ambil(kamus, `papan.komentator.${gaya}`);
    for (const [nama, larik] of Object.entries(blok)) {
      for (const s of larik) {
        for (const m of s.matchAll(/\{([a-zA-Z]+)\}/g)) {
          ok(bolehPlaceholder.has(m[1]), `${label} ${gaya}.${nama}: placeholder tak dikenal {${m[1]}}`);
        }
      }
    }
  }
}

/* --------------------------------------------- 3. skenario papan nyata */
console.log("3) Skenario papan nyata");
const punya = (daftar, nama) => daftar.some(({ kunci }) => kunci.includes(`.${nama}.`));

// Fool's Mate → skakmat, satu kalimat saja.
{
  const f = faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2", "Qh4#");
  ok(f.skakmat && f.skak, "Fool's Mate terdeteksi sebagai skakmat");
  const d = susunKomentar({ fakta: f, gaya: "santai" });
  ok(d.length === 1 && punya(d, "skakmat"), "skakmat → tepat satu kalimat 'skakmat'");
  const teks = render(tId, d);
  ok(/Hitam/.test(teks) && /Qh4#|skakmat|MAT/i.test(teks), `teks skakmat menyebut Hitam: "${teks}"`);
}
// Rokade pendek & panjang
{
  const p = faktaDasar("r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "O-O");
  ok(p.rokade === "pendek", "O-O → rokade pendek");
  ok(punya(susunKomentar({ fakta: p }), "rokadePendek"), "kalimat rokadePendek dipilih");
  const q = faktaDasar("r3kbnr/pppqpppp/2n5/3p1b2/3P1B2/2N5/PPPQPPPP/R3KBNR w KQkq - 6 6", "O-O-O");
  ok(q.rokade === "panjang", "O-O-O → rokade panjang");
  ok(punya(susunKomentar({ fakta: q }), "rokadePanjang"), "kalimat rokadePanjang dipilih");
}
// En passant
{
  const f = faktaDasar("rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3", "exf6");
  ok(f.enPassant && f.tangkap === "p", "exf6 e.p. terdeteksi");
  ok(punya(susunKomentar({ fakta: f }), "enPassant"), "kalimat enPassant dipilih");
}
// Promosi ke menteri: kalimat menyebut 'menteri' (ID) / 'queen' (EN)
{
  const f = faktaDasar("8/1P4k1/8/8/8/8/6K1/8 w - - 0 1", "b8=Q");
  ok(f.promosi === "q", "b8=Q → promosi q");
  const d = susunKomentar({ fakta: f, gaya: "formal" });
  ok(punya(d, "promosi"), "kalimat promosi dipilih");
  ok(/menteri/.test(render(tId, d)), `ID promosi menyebut 'menteri': "${render(tId, d)}"`);
  ok(/queen/.test(render(tEn, d)), `EN promosi menyebut 'queen': "${render(tEn, d)}"`);
}
// Tangkapan menteri
{
  const f = faktaDasar("rnb1kbnr/pppp1ppp/8/4p3/3qP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 4", "Nxd4");
  ok(f.tangkap === "q", "Nxd4 menangkap menteri");
  const d = susunKomentar({ fakta: f });
  ok(punya(d, "tangkapMenteri"), "kalimat tangkapMenteri dipilih");
  ok(/menteri/i.test(render(tId, d)), "ID menyebut menteri");
}
// Pat: Raja hitam a8, Menteri putih ke b6 dengan raja putih jauh → Ka8 tidak diskak, tidak ada langkah.
{
  const f = faktaDasar("k7/2Q5/8/8/8/8/8/6K1 w - - 0 1", "Qb6");
  // Setelah Qc7-b6: raja a8 tidak diskak; a7, b7, b8 semua diserang → pat.
  ok(f.pat === true, `Qb6 → pat (pat=${f.pat}, remis=${f.remis})`);
  ok(punya(susunKomentar({ fakta: f }), "pat"), "kalimat pat dipilih");
}
// Material tidak cukup (K+B vs K)
{
  const f = faktaDasar("k7/8/8/8/8/8/8/K5B1 w - - 0 1", "Bf2");
  ok(f.remis && f.materialKurang, "K+B vs K → remis material kurang");
  ok(punya(susunKomentar({ fakta: f }), "remisMaterial"), "kalimat remisMaterial dipilih");
}
// Bidak menggantung: setelah 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4?? tidak menggantung;
// gunakan posisi sederhana: kuda putih di e5 tanpa penjaga, diserang pion d6.
{
  const fen = "4k3/8/3p4/4N3/8/8/8/4K3 w - - 0 1";
  const g = bidakMenggantung(fen, "w");
  ok(g.length === 1 && g[0].petak === "e5" && g[0].jenis === "n", `kuda e5 menggantung: ${JSON.stringify(g)}`);
  // Setelah Putih main Kd1 (bukan menyelamatkan kuda) → sendiriMenggantung.
  const f = faktaDasar(fen, "Kd1");
  const d = susunKomentar({ fakta: f });
  ok(punya(d, "sendiriMenggantung"), "kalimat sendiriMenggantung dipilih saat kuda ditinggal");
  const teks = render(tId, d);
  ok(/kuda/.test(teks) && /e5/.test(teks), `teks menyebut kuda e5: "${teks}"`);
  // Kuda (3) dijaga gajah b2 tetapi diserang pion (1) → penyerang lebih
  // murah → tetap dianggap terancam.
  const g5 = bidakMenggantung("4k3/8/3p4/4N3/8/8/1B6/4K3 w - - 0 1", "w");
  ok(g5.length === 1, "kuda dijaga tapi diserang pion → tetap terancam (penyerang lebih murah)");
  // Kuda dijaga gajah b2, diserang gajah d6 (3 vs 3) → aman.
  const g6 = bidakMenggantung("4k3/8/3b4/4N3/8/8/1B6/4K3 w - - 0 1", "w");
  ok(g6.length === 0, `kuda dijaga & diserang setara → tidak menggantung (${JSON.stringify(g6)})`);
}
// Buku pembukaan tanpa engine: kalimat buku menyebut nama pembukaan.
{
  const f = faktaDasar(AWAL, "e4");
  const d = susunKomentar({ fakta: f, rating: "book", namaPembukaan: "King's Pawn Game" });
  ok(punya(d, "buku"), "rating book → kalimat buku");
  ok(/King's Pawn Game/.test(render(tId, d)), "nama pembukaan disisipkan");
  ok(!punya(d, "ajakEngine"), "kalimat buku tidak disertai ajakan engine");
}
// Ajakan engine hanya sesekali (ply % 6 === 5) dan hanya jika tidak ada peristiwa.
{
  let hitung = 0;
  const game = new Chess();
  const langkah = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6", "O-O", "O-O"];
  for (const san of langkah) {
    const sebelum = game.fen();
    game.move(san);
    const d = susunKomentar({ fakta: faktaLangkah(sebelum, san), engineNyala: false });
    if (punya(d, "ajakEngine")) hitung++;
  }
  ok(hitung >= 1 && hitung <= 2, `ajakan engine muncul sesekali dalam 12 langkah: ${hitung}×`);
}
// Engine menyala: rating + keunggulan + saran.
{
  const f = faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "Ke2");
  const d = susunKomentar({
    fakta: f,
    rating: "blunder",
    engineNyala: true,
    evalSesudah: { cpPutih: -180, matePutih: null },
    saranTerbaik: "Nf3",
  });
  ok(punya(d, "nilaiBlunder"), "rating blunder → kalimat nilaiBlunder");
  ok(punya(d, "lebihKuat"), "blunder + saran → kalimat lebihKuat");
  ok(punya(d, "unggulJelas"), "-180 cp → unggulJelas");
  const teks = render(tId, d);
  ok(/Nf3/.test(teks) && /Hitam/.test(teks) && /1\.8/.test(teks), `teks blunder lengkap: "${teks}"`);
  const teksEn = render(tEn, d);
  ok(/Black/.test(teksEn) && /Nf3/.test(teksEn), `EN blunder lengkap: "${teksEn}"`);
  // best → tidak ada lebihKuat
  const d2 = susunKomentar({
    fakta: f,
    rating: "best",
    engineNyala: true,
    evalSesudah: { cpPutih: 20, matePutih: null },
    saranTerbaik: "Ke2",
  });
  ok(punya(d2, "nilaiTerbaik") && !punya(d2, "lebihKuat") && punya(d2, "seimbang"), "best → terbaik + seimbang, tanpa saran");
  // mate untuk Putih
  const d3 = susunKomentar({
    fakta: f,
    rating: "excellent",
    engineNyala: true,
    evalSesudah: { cpPutih: 0, matePutih: 4 },
  });
  ok(punya(d3, "unggulMat") && /4/.test(render(tId, d3)) && /Putih/.test(render(tId, d3)), "mate in 4 → unggulMat Putih");
  // Engine mati + rating book/forced tetap tanpa penilaian
  const d4 = susunKomentar({ fakta: f, rating: "blunder", engineNyala: false });
  ok(!punya(d4, "nilaiBlunder") && !punya(d4, "unggulJelas"), "engine mati → tidak ada penilaian walau rating ada");
}
// Forced
{
  const f = faktaDasar("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "Ke2");
  const d = susunKomentar({ fakta: f, rating: "forced", engineNyala: true, evalSesudah: { cpPutih: 0, matePutih: null } });
  ok(punya(d, "paksa") && !punya(d, "nilaiUnggul"), "forced → kalimat paksa saja + skor");
}
// kategoriKeunggulan
ok(kategoriKeunggulan({ cpPutih: 10, matePutih: null }).tingkat === "seimbang", "10cp seimbang");
ok(kategoriKeunggulan({ cpPutih: -60, matePutih: null }).pihak === "b", "-60cp → Hitam");
ok(kategoriKeunggulan({ cpPutih: 0, matePutih: -3 }).tingkat === "mat", "mate -3 → mat");
ok(kategoriKeunggulan({}) === null, "kosong → null");
ok(faktaLangkah(AWAL, "e5") === null, "langkah ilegal → null");

/* ---------------------------------------------------- 4. deterministik */
console.log("4) Varian deterministik & tersebar");
{
  const f = faktaDasar(AWAL, "e4");
  const a = susunKomentar({ fakta: f });
  const b = susunKomentar({ fakta: f });
  ok(JSON.stringify(a) === JSON.stringify(b), "kalimat sama untuk langkah sama");
  ok(indeksVarian("x", 1) === 0 && indeksVarian("x", 0) === 0, "indeksVarian aman untuk 0/1 varian");
  const sebaran = new Set();
  for (let i = 0; i < 40; i++) sebaran.add(indeksVarian(`Nf3@${i}`, 4));
  ok(sebaran.size === 4, `40 benih menyebar ke 4 varian: ${[...sebaran].join(",")}`);
}

/* -------------------------------------------------------------- contoh */
console.log("\nContoh keluaran (ID/santai → formal, EN/santai):");
{
  const contoh = [
    [AWAL, "e4", { rating: "book", namaPembukaan: "King's Pawn Game" }],
    ["rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2", "Qh4#", {}],
    ["r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "Qxf7+", {}],
    [
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
      "Ke2",
      { rating: "blunder", engineNyala: true, evalSesudah: { cpPutih: -180, matePutih: null }, saranTerbaik: "Nf3" },
    ],
  ];
  for (const [fen, san, opsi] of contoh) {
    const f = faktaDasar(fen, san);
    console.log(`  ${san}`);
    console.log(`    ID santai : ${render(tId, susunKomentar({ fakta: f, gaya: "santai", ...opsi }))}`);
    console.log(`    ID formal : ${render(tId, susunKomentar({ fakta: f, gaya: "formal", ...opsi }))}`);
    console.log(`    EN santai : ${render(tEn, susunKomentar({ fakta: f, gaya: "santai", ...opsi }))}`);
  }
}

console.log(gagal ? `\nGAGAL — ${gagal} masalah (${lulus} lulus).` : `\nOK — ${lulus} pemeriksaan lulus.`);
process.exit(gagal ? 1 : 0);
