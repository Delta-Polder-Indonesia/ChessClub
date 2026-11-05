#!/usr/bin/env node
/**
 * Uji MURNI (tanpa DOM, tanpa React) untuk inti halaman Teka-Teki.
 *
 * Refactor halaman teka-teki memindahkan keputusan permainan keluar dari
 * komponen 2.987 baris menjadi modul-modul kecil. Skrip ini mengunci perilaku
 * modul-modul itu supaya bisa diuji langsung — termasuk kasus yang dulu tidak
 * mungkin diuji tanpa memasang jsdom:
 *
 *   1. `services/puzzleEvaluation.js` — bilah evaluasi (termasuk orientasi "b"
 *      yang dulu salah banding dengan string "hitam").
 *   2. `services/puzzleSelection.js` — soal mana yang dibuka/dilewati.
 *   3. `services/puzzleFilter.js` — pita level, penyaringan, kolam koleksi.
 *   4. `services/puzzleStorage.js` — validasi penyimpanan + regresi id kurasi
 *      (> jumlah dataset Lichess) yang dulu ditolak diam-diam.
 *   5. `reducers/tekaTekiReducer.js` — seluruh transisi papan.
 *
 * Jalankan: node scripts/uji-teka-teki-murni.mjs
 */
import { Chess } from "chess.js";
import { hitungBilah } from "../src/halaman/TekaTeki/services/puzzleEvaluation.js";
import {
  cariIndeksBelumTerpecahkan,
  pilihIndeksAcak,
  tentukanIndeksAwal,
} from "../src/halaman/TekaTeki/services/puzzleSelection.js";
import {
  bandLevel,
  daftarPelatihDari,
  FILTER_AWAL,
  kolamKoleksi,
  kunciFilter,
  saringSoal,
} from "../src/halaman/TekaTeki/services/puzzleFilter.js";
import {
  bacaIngatPosisi,
  bacaOtomatis,
  bacaPosisi,
  bacaTerpecahkan,
  bacaWarnaPapan,
  bacaSetBidak,
  hapusPosisi,
  KUNCI,
  simpanPosisi,
  simpanTerpecahkan,
} from "../src/halaman/TekaTeki/services/puzzleStorage.js";
import {
  KEADAAN_AWAL,
  keadaanSoal,
  langkahSolusi,
  posisiSekarang,
  reduksiPapan,
} from "../src/halaman/TekaTeki/reducers/tekaTekiReducer.js";

let lulus = 0;
let gagal = 0;

function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal += 1;
    console.error(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

function judul(teks) {
  console.log(`\n${teks}`);
}

/* --------------------------------------------------------- penyimpanan palsu */

/** `localStorage` minimal di memori — cukup untuk menguji lapisan penyimpanan. */
function pasangPenyimpanan() {
  const isi = new Map();
  globalThis.localStorage = {
    getItem: (k) => (isi.has(k) ? isi.get(k) : null),
    setItem: (k, v) => isi.set(k, String(v)),
    removeItem: (k) => isi.delete(k),
    clear: () => isi.clear(),
    key: (i) => [...isi.keys()][i] ?? null,
    get length() {
      return isi.size;
    },
  };
  return isi;
}

/* ------------------------------------------------------------ bilah evaluasi */

judul("bilah evaluasi (services/puzzleEvaluation.js)");
{
  const netral = hitungBilah({});
  uji("posisi seimbang → 50%", netral.persen === 50, `persen=${netral.persen}`);
  uji("posisi seimbang → skor 0", netral.skor === 0);
  uji("tanpa mate → adaMate false", netral.adaMate === false);
  uji("orientasi bawaan (putih di bawah)", netral.putihDiBawah === true);

  uji("+4,00 bidak dijenuhkan ke 95%", hitungBilah({ cpPutih: 400 }).persen === 95);
  uji("-4,00 bidak dijenuhkan ke 5%", hitungBilah({ cpPutih: -400 }).persen === 5);
  uji("+2,00 bidak → 72,5%", hitungBilah({ cpPutih: 200 }).persen === 72.5);
  uji(
    "nilai di luar batas tetap dijepit",
    hitungBilah({ cpPutih: 4000 }).persen === 95 &&
      hitungBilah({ cpPutih: -4000 }).persen === 5
  );

  const skakmatPutih = hitungBilah({ matePutih: 3 });
  uji("mate untuk putih → 100%", skakmatPutih.persen === 100);
  uji("mate menandai adaMate", skakmatPutih.adaMate === true);
  uji("mate untuk hitam → 0%", hitungBilah({ matePutih: -2 }).persen === 0);
  uji("mate 0 diperlakukan netral", hitungBilah({ matePutih: 0 }).persen === 50);

  // Regresi audit: dulu `putihDiBawah` dibandingkan dengan "hitam", sehingga
  // orientasi "b" (format papan) dianggap putih-di-bawah.
  const hitamDiBawah = hitungBilah({ cpPutih: 100, orientasi: "b" });
  uji("orientasi \"b\" → hitam di bawah", hitamDiBawah.putihDiBawah === false);
  uji(
    "orientasi \"b\" → pihak unggul dihitung dari sisi bawah",
    hitamDiBawah.unggul === false,
    `persen=${hitamDiBawah.persen}`
  );
}

/* ------------------------------------------------------ pemilihan soal */

judul("pemilihan soal (services/puzzleSelection.js)");
{
  const daftar = [{ problemid: 10 }, { problemid: 11 }, { problemid: 12 }];

  uji(
    "memilih indeks pertama setelah yang terpecahkan",
    cariIndeksBelumTerpecahkan(daftar, 0, new Set([10])) === 1
  );
  uji(
    "memulai dari indeks yang diminta bila belum terpecahkan",
    cariIndeksBelumTerpecahkan(daftar, 1, new Set([10])) === 1
  );
  uji(
    "melingkar ke awal saat sisa di ujung terpecahkan",
    cariIndeksBelumTerpecahkan(daftar, 2, new Set([12])) === 0
  );
  uji(
    "indeks di luar rentang dinormalkan",
    cariIndeksBelumTerpecahkan(daftar, 7, new Set()) === 1
  );
  uji(
    "semua terpecahkan → -1",
    cariIndeksBelumTerpecahkan(daftar, 0, new Set([10, 11, 12])) === -1
  );
  uji("daftar kosong → -1", cariIndeksBelumTerpecahkan([], 0, new Set()) === -1);

  uji(
    "acak memakai sumber acak yang disuntikkan",
    pilihIndeksAcak(daftar, new Set([11]), () => 0) === 0 &&
      pilihIndeksAcak(daftar, new Set([11]), () => 0.99) === 2
  );
  uji(
    "acak tidak pernah memilih yang terpecahkan",
    [0, 0.25, 0.5, 0.75, 0.99].every(
      (r) => pilihIndeksAcak(daftar, new Set([10, 12]), () => r) === 1
    )
  );
  uji("acak tanpa sisa → -1", pilihIndeksAcak(daftar, new Set([10, 11, 12])) === -1);

  // `tentukanIndeksAwal` memakai konvensi dataset Lichess: problemid = indeks+1.
  const urut = [{ problemid: 1 }, { problemid: 2 }, { problemid: 3 }];

  uji(
    "deep-link bernomor dihormati meski sudah terpecahkan",
    tentukanIndeksAwal({
      daftar: urut,
      idDiminta: 2,
      posisiTersimpan: null,
      terpecahkan: new Set([2]),
      acak: () => 0,
    }) === 1
  );
  uji(
    "pemulihan sesi melewati soal tersimpan yang sudah selesai",
    tentukanIndeksAwal({
      daftar: urut,
      idDiminta: 2,
      posisiTersimpan: { id: 2, koleksi: "lichess" },
      terpecahkan: new Set([2]),
      acak: () => 0,
    }) === 2
  );
  uji(
    "tanpa nomor → melanjutkan posisi tersimpan",
    tentukanIndeksAwal({
      daftar: urut,
      idDiminta: null,
      posisiTersimpan: { id: 3, koleksi: "lichess" },
      terpecahkan: new Set(),
      acak: () => 0,
    }) === 2
  );
  uji(
    "koleksi berbeda tidak memakai posisi tersimpannya",
    tentukanIndeksAwal({
      daftar: urut,
      idDiminta: null,
      posisiTersimpan: { id: 3, koleksi: "video" },
      terpecahkan: new Set(),
      acak: () => 0,
    }) === 0
  );
}

/* ------------------------------------------------------------- filter */

judul("filter & kolam soal (services/puzzleFilter.js)");
{
  uji("bandLevel(0) → 1", bandLevel(0) === 1);
  uji("bandLevel(999) → 1", bandLevel(999) === 1);
  uji("bandLevel(1000) → 2", bandLevel(1000) === 2);
  uji("bandLevel(1250) → 3", bandLevel(1250) === 3);
  uji("bandLevel(1550) → 4", bandLevel(1550) === 4);
  uji("bandLevel(1900) → 5", bandLevel(1900) === 5);
  uji("bandLevel tanpa rating → 1", bandLevel(undefined) === 1);

  const kolam = [
    { problemid: 1, type: "Mate in One", rating: 900, first: "White to Move", tema: "fork pin" },
    { problemid: 2, type: "Mate in Two", rating: 1300, first: "Black to Move", tema: "pin" },
    { problemid: 3, type: "Mate in Two", rating: 1600, first: "White to Move", tema: "sacrifice" },
  ];

  uji("tanpa filter → semua soal", saringSoal(kolam, FILTER_AWAL).length === 3);
  uji("kolam null → null", saringSoal(null, FILTER_AWAL) === null);
  uji("filter tipe", saringSoal(kolam, { ...FILTER_AWAL, tipe: "Mate in Two" }).length === 2);
  uji("filter level", saringSoal(kolam, { ...FILTER_AWAL, level: "3" }).length === 1);
  uji("filter level tanpa soal", saringSoal(kolam, { ...FILTER_AWAL, level: "2" }).length === 0);
  uji("filter tema", saringSoal(kolam, { ...FILTER_AWAL, tema: "pin" }).length === 2);
  uji(
    "filter giliran",
    saringSoal(kolam, { ...FILTER_AWAL, giliran: "Black to Move" }).length === 1
  );
  uji(
    "filter gabungan menyempit",
    saringSoal(kolam, { ...FILTER_AWAL, tipe: "Mate in Two", tema: "pin" }).length === 1
  );

  const tambahan = [
    { problemid: 5487, video: "https://media.example/a.mp4", kurasi: "legenda" },
    { problemid: 5488, kurasi: "studi anotasi" },
    { problemid: 5489, kurasi: "legenda studix" },
    { problemid: 5490 },
  ];

  uji("koleksi lichess memakai dataset utama", kolamKoleksi(kolam, tambahan, "lichess") === kolam);
  uji(
    "koleksi video hanya soal ber-video",
    kolamKoleksi(kolam, tambahan, "video").map((m) => m.problemid).join() === "5487"
  );
  uji(
    "koleksi legenda memakai kata kunci kurasi",
    kolamKoleksi(kolam, tambahan, "legenda").map((m) => m.problemid).join() === "5487,5489"
  );
  uji(
    "koleksi studi memakai kata kunci kurasi",
    kolamKoleksi(kolam, tambahan, "studi").map((m) => m.problemid).join() === "5488"
  );
  uji(
    "koleksi arsip memuat semua koleksi tambahan",
    kolamKoleksi(kolam, tambahan, "arsip").length === 4
  );
  uji("koleksi tambahan belum diunduh → null", kolamKoleksi(kolam, null, "video") === null);

  const pelatih = [
    { pelatih: "A" },
    { pelatih: "A" },
    { pelatih: "B" },
    { pelatih: "C" },
    { pelatih: "B" },
  ];
  const daftar = daftarPelatihDari(pelatih, "video");
  uji(
    "pelatih dengan minimal dua soal, urut jumlah terbanyak",
    daftar.map(([nama]) => nama).join() === "A,B"
  );
  uji("koleksi lichess tanpa filter pelatih", daftarPelatihDari(pelatih, "lichess").length === 0);

  uji(
    "kunci filter memuat semua dimensi",
    kunciFilter({
      koleksi: "video",
      pelatih: "A",
      tipe: "Mate in One",
      level: "1",
      tema: "pin",
      giliran: "White to Move",
    }) === "video|A|Mate in One|1|pin|White to Move"
  );
}

/* ---------------------------------------------------------- penyimpanan */

judul("penyimpanan & validasi (services/puzzleStorage.js)");
{
  const isi = pasangPenyimpanan();

  uji("terpecahkan kosong → himpunan kosong", bacaTerpecahkan().size === 0);
  isi.set(KUNCI.terpecahkan, "{bukan json");
  uji("JSON rusak tidak menjatuhkan halaman", bacaTerpecahkan().size === 0);
  isi.set(KUNCI.terpecahkan, JSON.stringify([1, "2", 3, -4, null]));
  uji(
    "entri tidak sah dibuang, string angka dinormalkan",
    [...bacaTerpecahkan()].sort((a, b) => a - b).join() === "1,2,3"
  );
  simpanTerpecahkan(new Set([3, 1, 2]));
  uji("tersimpan urut menaik", isi.get(KUNCI.terpecahkan) === "[1,2,3]");

  // Regresi audit C4: id koleksi kurasi (≥ 5487) dulu ditolak diam-diam oleh
  // penjaga `id <= semuaSoal.length`, sehingga posisi tidak pernah tersimpan.
  simpanPosisi(5487, "video");
  const posisi = bacaPosisi();
  uji("id koleksi kurasi tersimpan", posisi?.id === 5487, JSON.stringify(posisi));
  uji("koleksi posisi ikut tersimpan", posisi?.koleksi === "video");
  simpanPosisi(17, "koleksi-ngawur");
  uji("koleksi tak dikenal jatuh ke lichess", bacaPosisi()?.koleksi === "lichess");
  simpanPosisi(0);
  uji("id tidak sah diabaikan", bacaPosisi()?.id === 17);
  hapusPosisi();
  uji("hapusPosisi membersihkan keduanya", bacaPosisi() === null && isi.size === 1);

  uji("bawaan set bidak tidak dikenal → merida", bacaSetBidak(["merida", "cburnett"]) === "merida");
  isi.set(KUNCI.setBidak, "cburnett");
  uji("set bidak tersimpan dipakai", bacaSetBidak(["merida", "cburnett"]) === "cburnett");
  isi.set(KUNCI.warnaPapan, "biru");
  uji("warna papan tak dikenal → bawaan", bacaWarnaPapan(["hijau", "biru"]) === "biru");
  uji("warna papan di luar daftar → bawaan", bacaWarnaPapan(["hijau"]) === "green");
  uji("otomatis bawaan mati", bacaOtomatis() === false);
  isi.set(KUNCI.otomatis, "1");
  uji("otomatis dibaca dari penyimpanan", bacaOtomatis() === true);
  uji("ingat posisi bawaan aktif", bacaIngatPosisi() === true);
  isi.set(KUNCI.ingatPosisi, "0");
  uji("hanya \"0\" yang mematikan ingat posisi", bacaIngatPosisi() === false);
}

/* ------------------------------------------------------------- reducer */

judul("reducer papan (reducers/tekaTekiReducer.js)");
{
  const fenAwal = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const soal = {
    problemid: 107,
    fen: fenAwal,
    moves: "e2-e4;e7-e5;g1-f3",
    first: "Black to Move",
    type: "Mate in Two",
    rating: 1200,
  };

  uji("langkahSolusi membagi dengan titik koma", langkahSolusi(soal).length === 3);
  uji("langkahSolusi tanpa data → kosong", langkahSolusi({}).length === 0);
  uji(
    "keadaanSoal memakai FEN & giliran soal",
    keadaanSoal(soal).fen === fenAwal && keadaanSoal(soal).orientasi === "b"
  );
  uji("keadaanSoal menyimpan jalur FEN awal", keadaanSoal(soal).jalurFen.length === 1);
  uji(
    "keadaanSoal tanpa soal tetap aman",
    keadaanSoal(null).fen === "" && keadaanSoal(null).sisa.length === 0
  );
  uji(
    "posisiSekarang dihitung dari sisa langkah",
    posisiSekarang(soal, ["g1-f3"]) === 2 && posisiSekarang(soal, []) === 3
  );

  const dipasang = reduksiPapan({ ...KEADAAN_AWAL, selesai: true }, {
    type: "PASANG_SOAL",
    soal,
  });
  uji("PASANG_SOAL memasang FEN soal", dipasang.fen === fenAwal);
  uji("PASANG_SOAL menyiapkan sisa langkah", dipasang.sisa.length === 3);
  uji("PASANG_SOAL mereset status selesai", dipasang.selesai === false);
  uji("PASANG_SOAL mereset bantuan", dipasang.terpilih === null && dipasang.promosi === null);
  uji("PASANG_SOAL mengatur orientasi", dipasang.orientasi === "b");
  uji("PASANG_SOAL menandai komentar mulai", dipasang.komentar?.tahap === "mulai");

  const dipertahankan = reduksiPapan(
    { ...dipasang, selesai: true },
    { type: "PASANG_SOAL", soal, pertahankanSelesai: true }
  );
  uji("pertahankanSelesai menjaga status tuntas", dipertahankan.selesai === true);

  const seleksi = reduksiPapan(dipasang, {
    type: "PILIH_PETAK",
    petak: "e2",
    sasaran: ["e3", "e4"],
  });
  uji("PILIH_PETAK menyimpan sasaran", seleksi.terpilih === "e2" && seleksi.sasaran.length === 2);
  uji(
    "BERSIHKAN_PILIHAN menghapus pilihan",
    reduksiPapan(seleksi, { type: "BERSIHKAN_PILIHAN" }).terpilih === null
  );
  uji(
    "BUKA_PROMOSI menghapus pilihan yang tertinggal",
    reduksiPapan(seleksi, { type: "BUKA_PROMOSI", promosi: { from: "a7", to: "a8", warna: "w" } })
      .terpilih === null
  );
  uji(
    "BATAL_PROMOSI menutup dialog",
    reduksiPapan(seleksi, { type: "BATAL_PROMOSI" }).promosi === null
  );

  const langkahSalah = reduksiPapan(seleksi, {
    type: "LANGKAH_SALAH",
    petak: { from: "e2", to: "e3" },
    komentar: { tahap: "salah" },
  });
  uji("LANGKAH_SALAH menandai petak", langkahSalah.kesalahan?.to === "e3");
  uji("LANGKAH_SALAH TIDAK menggeser papan", langkahSalah.fen === fenAwal);
  uji("LANGKAH_SALAH membersihkan pilihan", langkahSalah.terpilih === null);
  uji(
    "HAPUS_KESALAHAN menghapus sorotan",
    reduksiPapan(langkahSalah, { type: "HAPUS_KESALAHAN" }).kesalahan === null
  );

  const game = new Chess(fenAwal);
  game.move("e4");
  const langkahBenar = reduksiPapan(dipasang, {
    type: "LANGKAH_BENAR",
    permainan: game,
    langkah: { from: "e2", to: "e4" },
    sisaBaru: ["e7-e5", "g1-f3"],
    fakta: { san: "e4" },
    sisaPemain: 1,
  });
  uji("LANGKAH_BENAR memajukan FEN", langkahBenar.fen === game.fen());
  uji("LANGKAH_BENAR menambah jalur FEN", langkahBenar.jalurFen.length === 2);
  uji("LANGKAH_BENAR memotong sisa langkah", langkahBenar.sisa.length === 2);
  uji("LANGKAH_BENAR menyerahkan giliran ke lawan", langkahBenar.komputer === true);
  uji("LANGKAH_BENAR menandai langkah terakhir", langkahBenar.langkahAkhir?.to === "e4");
  uji("LANGKAH_BENAR menyimpan komentar benar", langkahBenar.komentar?.tahap === "benar");

  const tuntas = reduksiPapan(langkahBenar, {
    type: "LANGKAH_BENAR",
    permainan: game,
    langkah: { from: "g1", to: "f3" },
    sisaBaru: [],
    fakta: { san: "Nf3" },
    sisaPemain: 0,
  });
  uji("langkah terakhir menandai selesai", tuntas.selesai === true);
  uji("langkah terakhir tidak menyisakan giliran lawan", tuntas.komputer === false);
  uji("langkah terakhir memakai komentar selesai", tuntas.komentar?.tahap === "selesai");

  const balasan = reduksiPapan(langkahBenar, {
    type: "LANGKAH_LAWAN",
    permainan: game,
    balasan: { from: "e7", to: "e5" },
    fakta: { san: "e5" },
    sisaPemain: 1,
  });
  uji("LANGKAH_LAWAN memotong satu langkah", balasan.sisa.length === 1);
  uji("LANGKAH_LAWAN mengembalikan giliran ke pemain", balasan.komputer === false);
  uji("LANGKAH_LAWAN menandai balasan", balasan.langkahAkhir?.to === "e5");
  uji("LANGKAH_LAWAN memakai komentar lawan", balasan.komentar?.tahap === "lawan");

  const petunjuk = reduksiPapan(dipasang, {
    type: "TAMPILKAN_PETUNJUK",
    petunjuk: { from: "e2", to: "e4" },
    petunjukKomentar: { from: "e2", to: "e4", bidak: "p" },
  });
  uji("TAMPILKAN_PETUNJUK menyorot petak", petunjuk.petunjuk?.to === "e4");
  uji("TAMPILKAN_PETUNJUK memakai komentar petunjuk", petunjuk.komentar?.tahap === "petunjuk");

  const bersih = reduksiPapan(
    { ...petunjuk, kesalahan: { from: "a2", to: "a3" }, promosi: { from: "a7", to: "a8" } },
    { type: "BERSIHKAN_BANTU" }
  );
  uji(
    "BERSIHKAN_BANTU membersihkan semua bantuan",
    bersih.petunjuk === null && bersih.kesalahan === null && bersih.promosi === null
  );
  uji("BERSIHKAN_BANTU tidak menggeser papan", bersih.fen === petunjuk.fen);

  uji("ORIENTASI membalik papan", reduksiPapan(dipasang, { type: "ORIENTASI", orientasi: "w" }).orientasi === "w");
  uji(
    "aksi tak dikenal mengembalikan keadaan yang sama",
    reduksiPapan(dipasang, { type: "TIDAK_ADA" }) === dipasang
  );
  uji(
    "reducer tidak mengubah keadaan masukan",
    dipasang.terpilih === null && dipasang.sisa.length === 3
  );
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exitCode = 1;
