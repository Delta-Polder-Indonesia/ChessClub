/**
 * Uji Maia 3 — lawan "gaya manusia" di mode Manusia vs Mesin.
 *
 * Yang dijaga di sini bukan kualitas catur Maia (itu urusan pelatihan model),
 * melainkan KESELARASAN FORMAT antara kode kita dan berkas bobotnya: kalau
 * urutan kanal bidak, arah pencerminan, atau indeks promosi meleset sedikit
 * saja, model tetap mengeluarkan angka — hanya saja tanpa makna, dan lawan
 * menjawab dengan langkah acak tanpa pernah mengeluh. Itu sebabnya:
 *
 *  1. Kontrak ONNX (nama & bentuk masuk/keluar) dibaca langsung dari berkas
 *     bobot, bukan dari ingatan saja.
 *  2. Pemetaan langkah diuji terhadap nilai acuan yang diambil dari peta
 *     hulu maia-platform-frontend (`all_moves_maia3.json`).
 *  3. Pencerminan diuji bolak-balik: Maia SELALU melihat papan dari sudut
 *     putih, jadi posisi hitam dicermin sebelum disandikan dan langkahnya
 *     dicermin balik sesudahnya.
 *  4. Ujung ke ujung: model benar-benar dijalankan (onnxruntime-web di Node)
 *     pada posisi awal dan posisi hitam, lalu hasilnya diperiksa masuk akal
 *     — e2e4/d2d4 menguasai posisi awal, dan langkah balasan hitam sah.
 *
 * Jalankan: node scripts/uji-maia.mjs [--tanpa-model] [--inferensi]
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

import {
  AWAL_PROMOSI,
  RATING_MAKS,
  RATING_MIN,
  RUANG_LANGKAH,
  UKURAN_TOKEN,
  URUT_BIDAK,
  URUT_PROMOSI,
  batasRating,
  contohLangkah,
  cpDariPeluang,
  cerminFen,
  cerminLangkah,
  cerminPetak,
  dekodeKebijakan,
  indeksKePetak,
  indeksLangkah,
  langkahDariIndeks,
  nilaiMenang,
  papanKeToken,
  petakKeIndeks,
  praProses,
  susunBatch,
  uraiBatch,
} from "../src/lib/maia3.js";
import { peluangMenang } from "../src/halaman/Analisa/mesin/peluang.js";
import { PILIHAN_LEVEL_MESIN, PILIHAN_RATING_MAIA } from "../src/halaman/PapanInteraktif/modus/mesinLemah.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BERKAS_MODEL = path.join(AKAR, "public", "engines", "maia3", "maia3_simplified.onnx");
const BERKAS_PEKERJA = path.join(AKAR, "public", "engines", "maia3", "maia-pekerja.js");

const argumen = new Set(process.argv.slice(2).map((a) => a.replace(/^--/, "")));
const TANPA_MODEL = argumen.has("tanpa-model");

const STARTPOS = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let lulus = 0;
let gagal = 0;
const hasil = (nama, kondisi, keterangan = "") => {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
};

/* ---------------- 1. Berkas bobot, worker, dan runtime ---------------- */

console.log("\n1. Berkas model, worker, dan runtime ONNX");

hasil("bobot model ada di public/engines/maia3/", existsSync(BERKAS_MODEL), BERKAS_MODEL);
if (existsSync(BERKAS_MODEL)) {
  const ukuran = statSync(BERKAS_MODEL).size;
  // 45 MB: bukan pengecekan ukuran yang kaku, melainkan penangkal bobot
  // yang setengah terunduh atau pointer Git LFS yang belum terganti.
  hasil("ukuran bobot wajar (40–60 MB)", 40e6 < ukuran && ukuran < 60e6, `${(ukuran / 1e6).toFixed(1)} MB`);
  const kepala = readFileSync(BERKAS_MODEL).subarray(0, 1 << 20);
  const ekor = readFileSync(BERKAS_MODEL).subarray(ukuran - (1 << 22));
  for (const nama of ["tokens", "elo_self", "elo_oppo", "logits_move", "logits_value"]) {
    hasil(`kontrak model memuat "${nama}"`, kepala.includes(nama) || ekor.includes(nama));
  }
}

hasil("worker Maia ada di public/engines/maia3/", existsSync(BERKAS_PEKERJA), BERKAS_PEKERJA);
if (existsSync(BERKAS_PEKERJA)) {
  const sumber = readFileSync(BERKAS_PEKERJA, "utf8");
  hasil("worker menyebut lisensi Maia (GPL-3.0)", sumber.includes("GPL-3.0"));
  hasil("worker memuat runtime lewat importScripts", sumber.includes("importScripts"));
  hasil("worker memakai satu utas (tanpa COEP tidak ada SharedArrayBuffer)", /numThreads\s*=\s*1/.test(sumber));
  hasil("worker menyimpan bobot di IndexedDB", sumber.includes("indexedDB") && sumber.includes("Blob"));
  // Skrip klasik: sekali ada `export`/`import` di tingkat atas, importScripts
  // gagal dan lawan tidak pernah siap — tanpa pesan galat yang jelas.
  hasil("worker tetap skrip klasik (tanpa import/export ESM)", !/^\s*(import|export)\s/m.test(sumber));
  for (const jenis of ["init", "unduh", "inferensi", "hapus"]) {
    hasil(`worker menangani pesan "${jenis}"`, sumber.includes(`"${jenis}"`));
  }
}

// Berkas runtime yang disalin `scripts/salin-ort.mjs`. Dicek di node_modules
// (sumbernya), bukan di public/, karena public/engines/ort baru ada setelah
// `npm run salin:ort` — dan uji ini harus tetap bisa jalan tanpanya.
const DIST_ORT = path.join(AKAR, "node_modules", "onnxruntime-web", "dist");
const BERKAS_ORT = ["ort.wasm.min.js", "ort-wasm-simd.wasm", "ort-wasm.wasm"];
for (const nama of BERKAS_ORT) {
  hasil(`runtime onnxruntime-web tersedia: ${nama}`, existsSync(path.join(DIST_ORT, nama)));
}
// Kalau package-nya naik ke versi yang hanya mengirim build "threaded" (≥
// 1.19), worker akan gagal di peramban yang tidak cross-origin isolated —
// tanpa gejala apa pun di Node, karena Node SELALU punya SharedArrayBuffer.
hasil(
  "onnxruntime-web masih mengirim wasm satu utas (tanpa shared memory)",
  existsSync(path.join(DIST_ORT, "ort-wasm-simd.wasm")) && existsSync(path.join(DIST_ORT, "ort-wasm.wasm"))
);
const sumberSalin = readFileSync(path.join(AKAR, "scripts", "salin-ort.mjs"), "utf8");
hasil(
  "salin-ort.mjs menyalin semua berkas yang dibutuhkan worker",
  BERKAS_ORT.every((nama) => sumberSalin.includes(`"${nama}"`))
);

/* ---------------- 2. Pencerminan papan ---------------- */

console.log("\n2. Pencerminan (Maia selalu melihat dari sudut putih)");

hasil('cerminPetak("a1") = "a8"', "a8" === cerminPetak("a1"));
hasil('cerminPetak("e4") = "e5"', "e5" === cerminPetak("e4"));
hasil('cerminLangkah("e2e4") = "e7e5"', "e7e5" === cerminLangkah("e2e4"));
hasil('promosi ikut tercermin: "a7a8q" = "a2a1q"', "a2a1q" === cerminLangkah("a7a8q"));
hasil(
  "cerminFen menukar giliran",
  "b" === cerminFen(STARTPOS).split(" ")[1]
);
// Posisi awal simetris, jadi membalik baris + menukar warna mengembalikan
// susunan yang sama — yang berubah hanya gilirannya. Posisi TIDAK simetris
// (1.e4 sudah dimainkan) dipakai untuk membuktikan barisnya benar-benar
// terbalik, bukan cuma warnanya yang ditukar.
hasil(
  "cerminFen membalik baris papan (posisi setelah 1.e4)",
  "rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" ===
    cerminFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"),
  cerminFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1")
);
const FEN_EP = "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3";
hasil("cerminFen membalik petak en passant (f6 → f3)", cerminFen(FEN_EP).includes(" f3 "), cerminFen(FEN_EP));
for (const fen of [STARTPOS, FEN_EP, "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"]) {
  hasil("cermin ganda mengembalikan FEN semula", fen === cerminFen(cerminFen(fen)));
}
// Posisi hasil cermin harus tetap terbaca chess.js — kalau tidak, seluruh
// giliran hitam gagal diam-diam.
{
  let terbaca = true;
  for (const fen of [STARTPOS, FEN_EP]) {
    try {
      new Chess(cerminFen(fen));
    } catch {
      terbaca = false;
    }
  }
  hasil("FEN hasil cermin tetap sah bagi chess.js", terbaca);
}

/* ---------------- 3. Pemetaan ruang langkah 4352 ---------------- */

console.log("\n3. Pemetaan ruang langkah (4352)");

/**
 * Nilai acuan dari peta hulu maia-platform-frontend
 * (`src/lib/engine/data/all_moves_maia3.json`). Kalau peta ini pernah berubah
 * di hulu, model baru akan butuh penyesuaian di sini — lebih baik ketahuan
 * oleh uji daripada oleh pemain.
 */
const ACUAN_INDEKS = [
  ["a1a1", 0],
  ["e2e4", 796],
  ["e1g1", 262],
  ["e8g8", 3902],
  ["g1f3", 405],
  ["a7a8q", 4096],
  ["a7a8r", 4097],
  ["a7a8b", 4098],
  ["a7a8n", 4099],
  ["d7d8r", 4205],
  ["e7e8q", 4240],
  ["h7h8n", 4351],
];
for (const [uci, indeks] of ACUAN_INDEKS) {
  const promosi = uci.length > 4 ? uci.slice(4) : "";
  const hitung = indeksLangkah(uci.slice(0, 2), uci.slice(2, 4), promosi);
  hasil(`indeks "${uci}" = ${indeks}`, hitung === indeks, `dihitung ${hitung}`);
}
hasil("ruang langkah 4352 = 4096 langkah + 256 promosi", RUANG_LANGKAH === 4096 + 256 && AWAL_PROMOSI === 4096);
hasil("urutan promosi q → r → b → n", "q,r,b,n" === URUT_PROMOSI.join(","));

{
  let bolakBalik = true;
  let contoh = "";
  for (let i = 0; i < RUANG_LANGKAH; i++) {
    const uci = langkahDariIndeks(i);
    const promosi = uci.length > 4 ? uci.slice(4) : "";
    if (indeksLangkah(uci.slice(0, 2), uci.slice(2, 4), promosi) !== i) {
      bolakBalik = false;
      contoh = `${i} → ${uci}`;
      break;
    }
  }
  hasil("indeks ↔ UCI bolak-balik untuk seluruh 4352 ruang", bolakBalik, contoh);
}
{
  // Blok promosi hanya boleh berisi asal baris 7 → tujuan baris 8.
  let rapi = true;
  for (let i = AWAL_PROMOSI; i < RUANG_LANGKAH; i++) {
    const uci = langkahDariIndeks(i);
    if ("7" !== uci[1] || "8" !== uci[3]) {
      rapi = false;
      break;
    }
  }
  hasil("blok promosi selalu asal baris 7 → tujuan baris 8", rapi);
}
hasil("petak a1 = 0 dan h8 = 63", 0 === petakKeIndeks("a1") && 63 === petakKeIndeks("h8"));
hasil("indeksKePetak bolak-balik", "e4" === indeksKePetak(petakKeIndeks("e4")));

/* ---------------- 4. Penyandian papan ---------------- */

console.log("\n4. Penyandian papan (64 × 12)");

{
  const tokenAwal = papanKeToken(STARTPOS);
  hasil("token sepanjang 64 × 12", UKURAN_TOKEN === tokenAwal.length && 768 === tokenAwal.length);
  const jumlah = tokenAwal.reduce((a, b) => a + b, 0);
  hasil("posisi awal = 32 bidak", 32 === jumlah, `${jumlah}`);
  hasil("raja putih di kanal K petak e1", 1 === tokenAwal[(petakKeIndeks("e1") * 12) + URUT_BIDAK.indexOf("K")]);
  hasil("raja hitam di kanal k petak e8", 1 === tokenAwal[(petakKeIndeks("e8") * 12) + URUT_BIDAK.indexOf("k")]);
  hasil("pion putih di kanal P petak e2", 1 === tokenAwal[(petakKeIndeks("e2") * 12) + URUT_BIDAK.indexOf("P")]);
  hasil("petak kosong (e4) tidak menyalakan kanal apa pun", 0 === tokenAwal.slice(petakKeIndeks("e4") * 12, petakKeIndeks("e4") * 12 + 12).reduce((a, b) => a + b, 0));
}
{
  // Posisi hitam yang dicermin harus menghasilkan token yang SAMA dengan
  // posisi putih yang setara — inti dari "Maia melihat dari sudut putih".
  const hitam = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const cermin = cerminFen(hitam);
  const tokenCermin = papanKeToken(cermin);
  const game = new Chess(hitam);
  let cocok = true;
  for (const baris of game.board()) {
    for (const kotak of baris) {
      if (!kotak) continue;
      const petak = petakKeIndeks(cerminPetak(kotak.square));
      // Warna ditukar oleh cerminFen: bidak hitam pindah ke kanal putih,
      // bidak putih (yang bergilir berikutnya) pindah ke kanal hitam.
      const kanal = URUT_BIDAK.indexOf("b" === kotak.color ? kotak.type.toUpperCase() : kotak.type);
      if (tokenCermin[petak * 12 + kanal] !== 1) cocok = false;
    }
  }
  hasil("token posisi hitam yang dicermin = posisi putih yang setara", cocok);
  hasil("FEN cermin bergiliran putih", "w" === cermin.split(" ")[1]);
}
{
  const awal = praProses(STARTPOS);
  hasil("posisi awal: 20 langkah sah", 20 === awal.uciSah.length, `${awal.uciSah.length}`);
  hasil("topeng menyala tepat 20 kali", 20 === awal.topeng.reduce((a, b) => a + b, 0));
  hasil("posisi awal tidak dicermin", false === awal.hitam);
  const game = new Chess(STARTPOS);
  const sah = new Set(game.moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion || ""}`));
  hasil("semua UCI yang dikembalikan legal di posisi asli", awal.uciSah.every((uci) => sah.has(uci)));

  const hitam = praProses("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
  const gameHitam = new Chess("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
  const sahHitam = new Set(gameHitam.moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion || ""}`));
  hasil("posisi hitam ditandai tercermin", true === hitam.hitam);
  hasil(
    "langkah hasil cermin-balik legal di posisi asli (bukan di posisi cermin)",
    hitam.uciSah.length > 0 && hitam.uciSah.every((uci) => sahHitam.has(uci)),
    hitam.uciSah.slice(0, 3).join(" ")
  );
  hasil("posisi hitam: 20 langkah sah", 20 === hitam.uciSah.length, `${hitam.uciSah.length}`);
}
{
  // Promosi wajib masuk blok 4096+ — kalau tidak, pion yang mencapai ujung
  // papan tidak pernah punya kandidat dan Maia menjawab dengan langkah acak.
  const promosi = praProses("8/3P2k1/8/8/8/6K1/8/8 w - - 0 1");
  const indeksPromosi = [];
  for (let i = 0; i < RUANG_LANGKAH; i++) if (promosi.topeng[i] > 0) indeksPromosi.push(i);
  hasil("promosi mengaktifkan empat indeks di blok promosi", 4 === indeksPromosi.filter((i) => i >= AWAL_PROMOSI).length, `${indeksPromosi.length} indeks`);
  hasil("empat promosi itu q, r, b, n", ["d7d8q", "d7d8r", "d7d8b", "d7d8n"].every((uci) => promosi.uciSah.includes(uci)));
}

/* ---------------- 5. Dekode keluaran & metrik ---------------- */

console.log("\n5. Dekode policy, nilai, dan pemilihan langkah");

{
  const { topeng } = praProses(STARTPOS);
  const logits = new Float32Array(RUANG_LANGKAH);
  // Beri logit tinggi pada e2e4 (796) agar hasilnya bisa diramal pasti.
  logits[indeksLangkah("e2", "e4")] = 5;
  logits[indeksLangkah("d2", "d4")] = 3;
  const kebijakan = dekodeKebijakan(logits, topeng);
  const daftar = Object.entries(kebijakan);
  const total = daftar.reduce((a, [, p]) => a + p, 0);
  hasil("policy hanya berisi langkah sah", daftar.length === 20, `${daftar.length}`);
  hasil("probabilitas berjumlah 1", Math.abs(1 - total) < 1e-6, `${total}`);
  hasil("terurut menurun", daftar.every(([, p], i) => 0 === i || daftar[i - 1][1] >= p));
  hasil("langkah terbaik = e2e4", "e2e4" === daftar[0][0], daftar[0][0]);
  hasil("e2e4 lebih mungkin dari d2d4", kebijakan.e2e4 > kebijakan.d2d4);
  hasil("topeng kosong → policy kosong", 0 === Object.keys(dekodeKebijakan(logits, new Float32Array(RUANG_LANGKAH))).length);
}
{
  hasil("nilai logit sama → remis (0.5)", Math.abs(0.5 - nilaiMenang([1, 1, 1], false)) < 1e-6);
  hasil("logit menang tinggi → mendekati 1", 0.99 < nilaiMenang([0, 0, 10], false));
  hasil("giliran hitam membalik sudut pandang", Math.abs(1 - (nilaiMenang([0, 0, 10], false) + nilaiMenang([0, 0, 10], true))) < 1e-6);
  hasil("remis dihitung setengah", Math.abs(0.5 - nilaiMenang([0, 10, 0], false)) < 1e-6);
}
{
  hasil("cp 0 pada peluang 50%", 0 === cpDariPeluang(50), `${cpDariPeluang(50)}`);
  hasil("peluang tinggi → cp positif", cpDariPeluang(90) > 200, `${cpDariPeluang(90)}`);
  hasil("peluang rendah → cp negatif", cpDariPeluang(10) < -200, `${cpDariPeluang(10)}`);
  hasil("cp dijepit ±1000", 1000 === cpDariPeluang(100) && -1000 === cpDariPeluang(0));
  // Bolak-balik dengan kurva lichess yang dipakai bilah evaluasi.
  let meleset = 0;
  for (const cp of [-800, -300, -50, 0, 50, 300, 800]) {
    if (Math.abs(cpDariPeluang(peluangMenang(cp)) - cp) > 1) meleset++;
  }
  hasil("cp → peluang → cp kembali ke nilai semula", 0 === meleset, `${meleset} meleset`);
}
{
  const kebijakan = { e2e4: 0.6, d2d4: 0.3, c2c4: 0.1 };
  hasil("ambilTeratas selalu langkah teratas", "e2e4" === contohLangkah(kebijakan, { ambilTeratas: true }));
  hasil("contoh dengan acak 0 → langkah teratas", "e2e4" === contohLangkah(kebijakan, { acak: () => 0 }));
  // 0,5 masih jatuh di ember pertama (0–0,6); 0,7 baru ember kedua (0,6–0,9).
  hasil("contoh dengan acak 0,7 → langkah kedua", "d2d4" === contohLangkah(kebijakan, { acak: () => 0.7 }), contohLangkah(kebijakan, { acak: () => 0.7 }));
  hasil("contoh dengan acak 0,99 → langkah terakhir", "c2c4" === contohLangkah(kebijakan, { acak: () => 0.99 }));
  hasil("policy kosong → null", null === contohLangkah({}));
  // Distribusi harus dipakai apa adanya: 1000 contoh dengan sumber acak
  // berurutan harus mendekati 60/30/10.
  const hitung = {};
  let i = 0;
  const acak = () => (i = (i + 0.007) % 1);
  for (let n = 0; n < 1000; n++) {
    const uci = contohLangkah(kebijakan, { acak });
    hitung[uci] = (hitung[uci] || 0) + 1;
  }
  hasil(
    "pencontoh mengikuti distribusi model",
    Math.abs(hitung.e2e4 - 600) < 60 && Math.abs(hitung.d2d4 - 300) < 60,
    JSON.stringify(hitung)
  );
}
{
  hasil("rating dijepit ke rentang latihan model", RATING_MIN === batasRating(400) && RATING_MAKS === batasRating(2800));
  hasil("rating di tengah rentang tidak diubah", 1500 === batasRating(1500));
  hasil("rating bukan angka → bawaan 1500", 1500 === batasRating("abc"));
}

/* ---------------- 6. Batch & tangga level ---------------- */

console.log("\n6. Batch inferensi dan tangga level UI");

{
  const fenHitam = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const berkas = susunBatch([STARTPOS, fenHitam], [1500, 1200], [1500, 1800]);
  hasil("token batch = 2 × 768", 2 * UKURAN_TOKEN === berkas.token.length);
  hasil("rating sendiri tersusun", 1500 === berkas.self[0] && 1200 === berkas.self[1]);
  hasil("rating lawan tersusun", 1500 === berkas.oppo[0] && 1800 === berkas.oppo[1]);

  const logitsLangkah = new Float32Array(2 * RUANG_LANGKAH);
  // Entri kedua dicermin, jadi e7e5 hadir di model SEBAGAI e2e4 — itulah
  // sebabnya logitnya diset pada indeks e2e4 di irisan kedua.
  logitsLangkah[indeksLangkah("e2", "e4")] = 4;
  logitsLangkah[RUANG_LANGKAH + indeksLangkah("e2", "e4")] = 4;
  const logitsNilai = new Float32Array([0, 0, 1, 0, 0, 1]);
  const keluaran = uraiBatch(logitsLangkah, logitsNilai, berkas.posisi);
  hasil("batch menghasilkan dua entri", 2 === keluaran.length);
  hasil("entri putih: e2e4 teratas", "e2e4" === Object.keys(keluaran[0].kebijakan)[0]);
  // Posisi kedua dicermin; e2e4 di ruang model harus keluar lagi sebagai
  // e7e5 — inilah uji paling penting untuk giliran hitam.
  hasil("entri hitam: hasilnya sudah dicermin balik (e7e5)", "e7e5" === Object.keys(keluaran[1].kebijakan)[0], Object.keys(keluaran[1].kebijakan)[0]);
  hasil(
    "nilai menang dibalik untuk entri hitam (sudut pandang putih)",
    keluaran[0].menang > 0.6 && keluaran[1].menang < 0.4 && Math.abs(1 - (keluaran[0].menang + keluaran[1].menang)) < 1e-6,
    `${keluaran[0].menang.toFixed(3)} / ${keluaran[1].menang.toFixed(3)}`
  );
  hasil("cp mengikuti peluang menang", keluaran[0].cp > 0 && keluaran[1].cp < 0);
}
{
  const maia = PILIHAN_LEVEL_MESIN.find((level) => "maia" === level.mesin);
  hasil("tangga level memuat Maia", Boolean(maia));
  hasil("rating Maia baku ada di pilihan UI", PILIHAN_RATING_MAIA.includes(maia?.rating), `${maia?.rating}`);
  hasil("pilihan rating Maia diurutkan naik", PILIHAN_RATING_MAIA.every((r, i) => 0 === i || PILIHAN_RATING_MAIA[i - 1] < r));
  hasil(
    "pilihan rating Maia masuk rentang latihan model",
    PILIHAN_RATING_MAIA.every((r) => r >= RATING_MIN && r <= RATING_MAKS)
  );
}

/* ---------------- 7. Inferensi nyata ---------------- */

/**
 * Bagian ini menjalankan model 45 MB sungguhan di Node (onnxruntime-web
 * memakai backend wasm yang sama dengan peramban). Ia membuktikan bahwa
 * penyandian di atas memang menghasilkan langkah masuk akal — satu-satunya
 * cara menangkap "modelnya jalan, tetapi formatnya salah".
 *
 * Lewati dengan `--tanpa-model`.
 */
async function ujiInferensi() {
  console.log("\n7. Inferensi nyata (onnxruntime-web, backend wasm)");
  if (TANPA_MODEL) {
    console.log("  · dilewati (--tanpa-model)");
    return;
  }
  if (!existsSync(BERKAS_MODEL)) {
    hasil("model tersedia untuk uji inferensi", false, BERKAS_MODEL);
    return;
  }

  let ort;
  try {
    ort = await import("onnxruntime-web");
  } catch (galat) {
    hasil("onnxruntime-web bisa dimuat di Node", false, galat?.message || String(galat));
    return;
  }

  const mulai = Date.now();
  const sesi = await ort.InferenceSession.create(BERKAS_MODEL, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  hasil("sesi ONNX terbentuk", Boolean(sesi), `${Date.now() - mulai} ms`);
  hasil(
    "nama masuk/keluar sesuai kontrak",
    ["tokens", "elo_self", "elo_oppo"].every((n) => sesi.inputNames.includes(n)) &&
      ["logits_move", "logits_value"].every((n) => sesi.outputNames.includes(n)),
    `${sesi.inputNames} → ${sesi.outputNames}`
  );

  const fenHitam = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const berkas = susunBatch([STARTPOS, fenHitam], [1500, 1500], [1500, 1500]);
  const awal = Date.now();
  const keluar = await sesi.run({
    tokens: new ort.Tensor("float32", berkas.token, [berkas.jumlah, 64, 12]),
    elo_self: new ort.Tensor("float32", berkas.self, [berkas.jumlah]),
    elo_oppo: new ort.Tensor("float32", berkas.oppo, [berkas.jumlah]),
  });
  const ms = Date.now() - awal;
  hasil("dua posisi selesai di bawah 10 detik", ms < 10000, `${ms} ms`);

  const [putih, hitam] = uraiBatch(keluaranLogits(keluar.logits_move), keluaranLogits(keluar.logits_value), berkas.posisi);

  const daftarPutih = Object.keys(putih.kebijakan);
  hasil("posisi awal: policy terisi 20 langkah", 20 === daftarPutih.length, `${daftarPutih.length}`);
  // Maia 1500 itu manusia: e4 dan d4 menguasai posisi awal, bukan g4 atau a3.
  hasil("posisi awal: langkah teratas e2e4 atau d2d4", ["e2e4", "d2d4"].includes(daftarPutih[0]), daftarPutih.slice(0, 3).join(" "));
  hasil("posisi awal: dua teratas e4/d4", ["e2e4", "d2d4"].every((uci) => daftarPutih.slice(0, 2).includes(uci)), daftarPutih.slice(0, 3).join(" "));
  hasil("posisi awal: nilainya seimbang (0,4–0,6)", 0.4 < putih.menang && putih.menang < 0.6, `${putih.menang.toFixed(3)}`);
  hasil("posisi awal: cp dekat nol", Math.abs(putih.cp) < 100, `${putih.cp}`);

  const daftarHitam = Object.keys(hitam.kebijakan);
  const sahHitam = new Set(new Chess(fenHitam).moves({ verbose: true }).map((m) => `${m.from}${m.to}${m.promotion || ""}`));
  hasil("posisi hitam: semua langkah hasil legal", daftarHitam.every((uci) => sahHitam.has(uci)), daftarHitam.slice(0, 3).join(" "));
  hasil("posisi hitam: bukan langkah sisi putih", daftarHitam.every((uci) => /^[a-h][1-8]/.test(uci) && !["e2e4", "d2d4", "g1f3"].includes(uci)), daftarHitam.slice(0, 3).join(" "));
  hasil(
    "posisi hitam: jawaban wajar atas 1.e4",
    ["e7e5", "c7c5", "e7e6", "c7c6", "d7d5", "g8f6"].includes(daftarHitam[0]),
    daftarHitam.slice(0, 3).join(" ")
  );

  const langkahMaia = contohLangkah(putih.kebijakan, { ambilTeratas: true });
  hasil("langkah terpilih legal di papan", sah(STARTPOS, langkahMaia), String(langkahMaia));

  await sesi.release();
}

/** Ambil data tensor sebagai Float32Array (aman untuk CPU dan WebGPU). */
function keluaranLogits(tensor) {
  return new Float32Array(tensor.data);
}

/** Apakah `uci` legal pada `fen`. */
function sah(fen, uci) {
  if (!uci) return false;
  try {
    const game = new Chess(fen);
    return Boolean(game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }));
  } catch {
    return false;
  }
}

await ujiInferensi();

console.log(`\n${gagal ? "GAGAL" : "OK"} — ${lulus} lulus, ${gagal} gagal`);
