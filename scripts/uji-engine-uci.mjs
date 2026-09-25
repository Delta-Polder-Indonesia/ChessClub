/**
 * Uji engine Stockfish WASM yang SESUNGGUHNYA (bukan tiruan) lewat UCI.
 *
 * Setiap build di `public/engines/` dijalankan sebagai proses Node (loader
 * mendukung mode CLI UCI), lalu dites:
 *
 *   1. Handshake UCI: `uci` → `uciok`, `isready` → `readyok`.
 *   2. Pencarian posisi awal (go depth 13) → bestmove legal + ada skor.
 *   3. Konvensi tanda UCI (dasar fitur "evaluasi putih/hitam"):
 *      - posisi skakmat-satu giliran PUTIH → skor mate POSITIF;
 *      - posisi skakmat-satu giliran HITAM → skor mate POSITIF dari sisi
 *        pihak yang bergilir = NEGATIF bila dikonversi ke sudut pandang
 *        putih (persis konversi yang dilakukan komponen Evaluation:
 *        `advantageAmount = nilai * (whiteMoving ? 1 : -1)`).
 *   4. Evaluasi materi: unggul satu bidak (posisi riil) → cp positif bagi
 *      pihak yang bergilir; konversi sudut pandang putih membalik tandanya
 *      saat giliran hitam.
 *
 * Langkah skakmat divalidasi silang dengan chess.js sehingga pengujian
 * tidak bergantung pada langkah tertentu (engine bebas memilih di antara
 * beberapa langkah skakmat bila ada).
 *
 * Jalankan: node scripts/uji-engine-uci.mjs
 */
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { DAFTAR_ENGINE_NODE, UciEngine } from "./engine-uci-node.mjs";
import { susunHasilEngine } from "../src/lib/gunakanEngineCatur.js";

const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Skakmat-satu giliran PUTIH (Scholar's mate, setelah 3...Nf6). */
const PUTIH_MAT1 = "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4";

/** Cermin PUTIH_MAT1: skakmat-satu giliran HITAM (divalidasi chess.js). */
const HITAM_MAT1 = "rn1k1bnr/ppp1pppp/2q5/3p1b2/3P4/5N2/PPP1PPPP/RNBKQB1R b KQkq - 0 4";

/**
 * Posisi materi RIIL (hasil rangkaian langkah legal, divalidasi chess.js):
 *
 *   A: 1. e4 e5 2. Qh5 Nc6 3. Bc4 g6?? 4. Qxe5+ Qe7 5. Qxe7+ Bxe7
 *      → putih unggul satu bidak, giliran PUTIH.
 *   B: cermin papan posisi A (file a↔h, baris 1↔8, warna ditukar)
 *      → hitam unggul satu bidak, giliran HITAM.
 *
 * Catatan: build stockfish.js di repo ini menolak FEN "impossible" di mana
 * jumlah suatu jenis bidak melebihi maksimum pembukaan (mis. 3 kuda atau 9
 * bidak — engine menjawab `bestmove (none)`), jadi posisi uji harus hasil
 * permainan nyata, bukan posisi sintetis.
 *
 * Konvensi UCI: skor SELALU dari sudut pandang pihak yang BERGILIR. Maka
 * kedua posisi di atas harus menghasilkan cp POSITIF; konversi sudut
 * pandang putih (`nilai * (whiteMoving ? 1 : -1)`, persis seperti komponen
 * Evaluation) membuat posisi B negatif (hitam unggul).
 */
const PUTIH_UNGGUL = "r1b1k1nr/ppppbp1p/2n3p1/8/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 6";
const HITAM_UNGGUL = "rn1k1bnr/ppp1pppp/1P3N2/8/3p1b2/8/PPPPBP1P/RN1K1B1R b KQkq - 0 6";

/** Daftar SAN langkah yang menghasilkan skakmat langsung. */
function daftarSkakmatSatu(fen) {
  const catur = new Chess(fen);
  const daftar = [];
  for (const langkah of catur.moves({ verbose: true })) {
    catur.move(langkah);
    if (catur.isCheckmate()) daftar.push(langkah.san);
    catur.undo();
  }
  return daftar;
}

/** UCI (mis. "f3f7") → SAN di posisi `fen`, untuk validasi silang. */
function uciKeSan(fen, uci) {
  const catur = new Chess(fen);
  const hasil = catur.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  });
  return hasil ? hasil.san : null;
}

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

async function ujiEngine(engine, nomor) {
  const mesin = new UciEngine(engine, { timeout: 60_000, timeoutMulai: 180_000 });
  console.log(`\n[engine ${nomor}/${DAFTAR_ENGINE_NODE.length}] ${engine.label} (${engine.dir})`);
  let t0 = Date.now();
  try {
    mesin.mulai();
    const idBaris = await mesin.siap();
    console.log(
      `  ✓ handshake UCI (uciok + readyok) — ${idBaris} — ${Date.now() - t0} ms`
    );
    lulus++;

    /* ---------- 1. posisi awal: bestmove legal + ada skor ---------- */
    t0 = Date.now();
    const awal = await mesin.cari({ fen: STARTPOS, kedalaman: 13 });
    hasil(
      `posisi awal: bestmove "${awal.uci}" legal`,
      uciKeSan(STARTPOS, awal.uci) !== null,
      `uci=${awal.uci}`
    );
    hasil(
      "posisi awal: engine menerbitkan skor (cp/mate)",
      awal.info !== null && (awal.info.cp !== null || awal.info.mate !== null),
      awal.info ? JSON.stringify(awal.info) : "info kosong"
    );
    hasil(
      "posisi awal: kedalaman 13 tercapai",
      (awal.info?.kedalaman ?? 0) >= 13,
      `depth=${awal.info?.kedalaman}`
    );
    if (awal.info?.cp !== null) {
      hasil(
        "posisi awal: evaluasi masih seimbang (|cp| < 100)",
        Math.abs(awal.info.cp) < 100,
        `cp=${awal.info.cp}`
      );
    }
    console.log(
      `    → ${awal.uci} @ depth ${awal.info?.kedalaman} ` +
        `${awal.info?.mate !== null ? "mate " + awal.info.mate : "cp " + awal.info?.cp} ` +
        `(${Date.now() - t0} ms)`
    );

    /* ---------- 2. konvensi tanda: skakmat-satu putih ---------- */
    const daftarPutih = daftarSkakmatSatu(PUTIH_MAT1);
    assert.ok(daftarPutih.length >= 1, "posisi PUTIH_MAT1 harus punya skakmat-satu");
    const matPutih = await mesin.cari({ fen: PUTIH_MAT1, mate: 1 });
    hasil(
      "skakmat-satu giliran PUTIH: engine menemukan skakmat",
      daftarPutih.includes(uciKeSan(PUTIH_MAT1, matPutih.uci)),
      `bestmove=${matPutih.uci} (${uciKeSan(PUTIH_MAT1, matPutih.uci)}), opsi=${daftarPutih.join(",")}`
    );
    hasil(
      "skakmat-satu giliran PUTIH: skor mate POSITIF (putih menang)",
      matPutih.info?.mate === 1,
      JSON.stringify(matPutih.info ?? {})
    );

    /* ---------- 3. konvensi tanda: skakmat-satu hitam ---------- */
    const daftarHitam = daftarSkakmatSatu(HITAM_MAT1);
    assert.ok(daftarHitam.length >= 1, "posisi HITAM_MAT1 harus punya skakmat-satu");
    const matHitam = await mesin.cari({ fen: HITAM_MAT1, mate: 1 });
    hasil(
      "skakmat-satu giliran HITAM: engine menemukan skakmat",
      daftarHitam.includes(uciKeSan(HITAM_MAT1, matHitam.uci)),
      `bestmove=${matHitam.uci} (${uciKeSan(HITAM_MAT1, matHitam.uci)}), opsi=${daftarHitam.join(",")}`
    );
    hasil(
      "skakmat-satu giliran HITAM: skor mate positif bagi pihak yang BERGILIR (UCI)",
      matHitam.info?.mate === 1,
      JSON.stringify(matHitam.info ?? {})
    );
    // Konversi sudut pandang putih — persis apa yang dilakukan UI:
    // advantageAmount = nilai * (whiteMoving ? 1 : -1), di sini hitam
    // yang bergilir → faktor -1.
    const sudutPutih = -matHitam.info.mate;
    hasil(
      "skakmat-satu giliran HITAM: konversi sudut pandang PUTIH negatif (hitam menang)",
      sudutPutih < 0,
      `sudut putih=${sudutPutih}`
    );

    /* ---------- 4. evaluasi materi ---------- */
    const unggulPutih = await mesin.cari({ fen: PUTIH_UNGGUL, kedalaman: 13 });
    hasil(
      "putih unggul materi (giliran putih): cp POSITIF",
      (unggulPutih.info?.cp ?? 0) > 50,
      `cp=${unggulPutih.info?.cp}`
    );
    const unggulHitam = await mesin.cari({ fen: HITAM_UNGGUL, kedalaman: 13 });
    // UCI: skor dari sisi pihak yang BERGILIR — hitam unggul + giliran
    // hitam → cp tetap POSITIF.
    hasil(
      "hitam unggul materi (giliran hitam): cp positif bagi yang BERGILIR (UCI)",
      (unggulHitam.info?.cp ?? 0) > 50,
      `cp=${unggulHitam.info?.cp}`
    );
    // Konversi sudut pandang putih — faktor -1 karena hitam yang bergilir,
    // persis apa yang dilakukan komponen Evaluation di UI.
    const sudutPutihHitam = -unggulHitam.info?.cp;
    hasil(
      "hitam unggul materi: konversi sudut pandang PUTIH negatif",
      sudutPutihHitam < -50,
      `sudut putih=${sudutPutihHitam}`
    );
  } catch (galat) {
    gagal++;
    console.error(`  ✗ [${engine.label}] ${galat?.message ?? galat}`);
    console.error(mesin.galatDiagnostics());
    process.exitCode = 1;
  } finally {
    await mesin.tutup();
  }
}

/*
 * ---------- 5. MultiPV: dasar metrik peringkat anti-cheat ----------
 *
 * Setiap posisi anti-cheat dianalisis dengan MultiPV: kandidat terbaik
 * direkam berurutan peringkat, lalu langkah pemain diperanking di antaranya.
 * Uji ini membuktikan bawaan engine di repo benar-benar menerbitkan daftar
 * itu: peringkat terurut, kandidat pertama = bestmove, skor tidak menaik
 * (kandidat terbaik selalu paling unggul), dan semua langkah legal.
 */
async function ujiMultiPv(engine) {
  const mesin = new UciEngine(engine, { timeout: 60_000, timeoutMulai: 180_000 });
  console.log(`\n[MultiPV] ${engine.label}`);
  try {
    mesin.mulai();
    await mesin.siap();

    const t0 = Date.now();
    const banyak = 4;
    const hasilCari = await mesin.cari({ fen: STARTPOS, kedalaman: 10, multiPv: banyak });
    const daftar = hasilCari.daftarPv ?? [];

    hasil(`MultiPV ${banyak}: kandidat terekam`, daftar.length === banyak, `${daftar.length}`);
    hasil(
      "kandidat terurut peringkat 1..N",
      daftar.every((x, i) => (x.multipv ?? i + 1) === i + 1),
      daftar.map((x) => x.multipv).join(",")
    );
    hasil(
      "kandidat 1 = bestmove",
      daftar[0]?.pv?.[0] === hasilCari.uci,
      `${daftar[0]?.pv?.[0]} vs ${hasilCari.uci}`
    );
    const skorDari = (x) => (x.mate !== null ? x.mate * 10000 : x.cp);
    const daftarSkor = daftar.map(skorDari);
    hasil(
      "skor kandidat tidak menaik (terbaik di peringkat 1)",
      daftarSkor.every((s, i) => i === 0 || s <= daftarSkor[i - 1]),
      daftarSkor.join(",")
    );
    hasil(
      "semua langkah pertama kandidat legal (chess.js)",
      daftar.every((x) => uciKeSan(STARTPOS, x.pv[0]) !== null),
      daftar.map((x) => x.pv[0]).join(",")
    );
    hasil(
      "kandidat saling berbeda",
      new Set(daftar.map((x) => x.pv[0])).size === daftar.length
    );
    const denganWdl = daftar.filter((x) => Array.isArray(x.wdl)).length;
    console.log(
      `    → ${daftar.length} kandidat @ depth ${hasilCari.info?.kedalaman}, ` +
        `${denganWdl} dengan WDL (${Date.now() - t0} ms)`
    );
    if (denganWdl === daftar.length) {
      hasil("WDL tersedia di semua kandidat", true);
    } else {
      console.log(`    (build ini tidak menyiarkan WDL — dilewati, bukan gagal)`);
    }
  } catch (galat) {
    gagal++;
    console.error(`  ✗ [MultiPV ${engine.label}] ${galat?.message ?? galat}`);
    console.error(mesin.galatDiagnostics());
    process.exitCode = 1;
  } finally {
    await mesin.tutup();
  }
}

async function utama() {
  // Sanity: semua FEN uji valid menurut chess.js.
  for (const [nama, fen] of Object.entries({
    STARTPOS,
    PUTIH_MAT1,
    HITAM_MAT1,
    PUTIH_UNGGUL,
    HITAM_UNGGUL,
  })) {
    assert.ok(new Chess(fen), `${nama}: FEN tidak valid`);
  }

  // Pembentuk hasil engine bersama (Papan Interaktif + Teka-Teki):
  // mate 0 = pihak bergilir sudah mati — pemenang dibaca dari giliran,
  // BUKAN dari tanda angka 0 (yang selalu netral). Pertahanan-lapis:
  // hook melewatkan posisi terminal, jadi ini dikunci murni di sini.
  {
    const matPutihMenang = susunHasilEngine({ mate: 0, cp: null, pv: [], kedalaman: 20 }, STARTPOS, "b");
    hasil("mate-0 giliran hitam → Putih menang (+M0/+10000/poin 1)",
      matPutihMenang.teksSkor === "+M0" && matPutihMenang.cpPutih === 10000 && matPutihMenang.matePutih === 0 && matPutihMenang.poinPutih === 1,
      JSON.stringify({ t: matPutihMenang.teksSkor, cp: matPutihMenang.cpPutih }));
    const matHitamMenang = susunHasilEngine({ mate: 0, cp: null, pv: [], kedalaman: 20 }, STARTPOS, "w");
    hasil("mate-0 giliran putih → Hitam menang (−M0/−10000/poin ≈0)",
      matHitamMenang.teksSkor === "-M0" && matHitamMenang.cpPutih === -10000 && matHitamMenang.poinPutih < 1e-9);
    const matBiasa = susunHasilEngine({ mate: 3, cp: null, pv: [], kedalaman: 20 }, STARTPOS, "w");
    hasil("mate bukan-nol tak berubah (+M3)", matBiasa.teksSkor === "+M3" && matBiasa.cpPutih === 10000);
    const tanpaMate = susunHasilEngine({ cp: 34, pv: [], kedalaman: 20 }, STARTPOS, "w");
    hasil("mate undefined → cabang cp (+0.34)", tanpaMate.teksSkor === "+0.34" && tanpaMate.matePutih === null);
  }

  for (let i = 0; i < DAFTAR_ENGINE_NODE.length; i++) {
    await ujiEngine(DAFTAR_ENGINE_NODE[i], i + 1);
  }

  // MultiPV cukup dibuktikan pada satu build (semua build Stockfish di repo
  // berbagi implementasi UCI yang sama) — pakai yang lite agar cepat.
  await ujiMultiPv(DAFTAR_ENGINE_NODE[0]);

  console.log(
    `\nHasil: ${lulus} lulus, ${gagal} gagal${
      gagal ? "" : " — semua pemeriksaan engine Stockfish lulus."
    }`
  );
}

await utama();
