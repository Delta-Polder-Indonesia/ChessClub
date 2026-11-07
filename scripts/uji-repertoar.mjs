import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import {
  BATAS_INTERVAL_MS,
  buatKartuDariJalur,
  cocokLangkahBuku,
  indeksJalurPembukaan,
  jadwalkanKartu,
  kartuBerikutnya,
  posisiAkhirJalur,
  uraiUci,
} from "../src/halaman/LatihanRepertoar/repertoarLogika.js";
import { Chess } from "chess.js";
import {
  bacaKartuRepertoar,
  hapusJalurRepertoar,
  simpanKartuRepertoar,
} from "../src/halaman/LatihanRepertoar/repertoarStorage.js";

const sekarang = 1_700_000_000_000;
const jalur = indeksJalurPembukaan([
  { eco: "C20", opening: "King Pawn Game", moves: "e2e4 e7e5", games: 20 },
  { eco: "C20", opening: "King Pawn Game", moves: "e2e4 e7e5 g1f3 b8c6 f1b5", games: 10 },
]);
assert.equal(jalur.length, 1, "jalur bernama sama diringkas satu entri");
assert.equal(jalur[0].moves.length, 5, "jalur representatif terpanjang dipilih");

const kartuPutih = buatKartuDariJalur(jalur[0], "w", sekarang);
const kartuHitam = buatKartuDariJalur(jalur[0], "b", sekarang);
assert.deepEqual(kartuPutih.map((kartu) => kartu.expectedSan), ["e4", "Nf3", "Bb5"]);
assert.deepEqual(kartuHitam.map((kartu) => kartu.expectedSan), ["e5", "Nc6"]);
assert.equal(kartuBerikutnya(kartuPutih, kartuPutih[0].lineId, sekarang)?.id, kartuPutih[0].id);

const kartuGood = jadwalkanKartu(kartuPutih[0], "good", sekarang);
assert.equal(kartuGood.dueAt, sekarang + 3 * 24 * 60 * 60 * 1000, "Good pertama jatuh tempo tiga hari lagi");
assert.equal(kartuBerikutnya([kartuGood], kartuGood.lineId, sekarang), null, "kartu terjadwal bukan due sekarang");
const kartuHard = jadwalkanKartu(kartuPutih[0], "hard", sekarang);
assert.equal(kartuHard.dueAt, sekarang + 24 * 60 * 60 * 1000, "Hard pertama jatuh tempo sehari lagi");
const kartuEasy = jadwalkanKartu(kartuPutih[0], "easy", sekarang);
assert.equal(kartuEasy.dueAt, sekarang + 7 * 24 * 60 * 60 * 1000, "Easy pertama jatuh tempo tujuh hari lagi");
const kartuAgain = jadwalkanKartu(kartuPutih[0], "again", sekarang);
assert.equal(kartuAgain.dueAt, sekarang + 10 * 60 * 1000, "Again dijadwalkan sepuluh menit lagi");

// Plafon jarak tinjauan: pengali 2,5× tidak boleh menumbuhkan interval tanpa henti.
const kartuLama = { ...kartuPutih[0], intervalMs: 300 * 24 * 60 * 60 * 1000, repetitions: 9 };
assert.equal(
  jadwalkanKartu(kartuLama, "easy", sekarang).intervalMs,
  BATAS_INTERVAL_MS,
  "interval tinjauan dibatasi satu tahun",
);
assert.equal(
  jadwalkanKartu(kartuLama, "good", sekarang).intervalMs,
  BATAS_INTERVAL_MS,
  "plafon berlaku untuk semua nilai, bukan hanya Easy",
);

/*
 * Promosi: pilihan bidak pemain tidak menentukan benar/salah — hanya petak
 * asal/tujuan yang dinilai, karena posisi akhir selalu mengikuti buku.
 */
assert.deepEqual(uraiUci("e7e8q"), { from: "e7", to: "e8", promotion: "q" });
assert.deepEqual(uraiUci("e2e4"), { from: "e2", to: "e4" });
assert.equal(uraiUci("e2"), null, "UCI tidak lengkap ditolak");

const promosiPutih = { from: "e7", to: "e8", promotion: "n" };
assert.equal(
  cocokLangkahBuku(promosiPutih, "e7e8q"),
  true,
  "promosi kuda tetap dihitung benar saat buku meminta ratu",
);
assert.equal(cocokLangkahBuku({ from: "e7", to: "d8" }, "e7e8q"), false, "petak tujuan lain tetap salah");
assert.equal(cocokLangkahBuku(null, "e7e8q"), false, "langkah ilegal bukan jawaban benar");

// Papan dimajukan dengan langkah buku, bukan langkah pemain.
const posisiPromosi = new Chess("4k3/3P4/8/8/8/8/8/4K3 w - - 0 1");
const papanBuku = new Chess(posisiPromosi.fen());
papanBuku.move(uraiUci("d7d8q"));
assert.ok(papanBuku.fen().startsWith("3Qk3"), "papan dimajukan dengan bidak promosi buku (ratu)");

/*
 * Pratinjau posisi di layar pemilihan jalur (papan statis panel kanan).
 */
const pratinjau = posisiAkhirJalur(["e2e4", "e7e5", "g1f3"]);
assert.deepEqual(pratinjau.san, ["e4", "e5", "Nf3"], "SAN pratinjau urut sesuai jalur");
assert.deepEqual(pratinjau.terakhir, { from: "g1", to: "f3" }, "petak langkah terakhir ditandai");
assert.ok(
  pratinjau.fen.startsWith("rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b"),
  "FEN pratinjau adalah posisi akhir jalur",
);
assert.equal(posisiAkhirJalur([]), null, "jalur kosong tidak menghasilkan pratinjau");
assert.equal(posisiAkhirJalur(["e2e5"]), null, "langkah tidak sah membatalkan pratinjau");
assert.equal(posisiAkhirJalur(null), null, "argumen kosong aman");

await simpanKartuRepertoar([kartuPutih[0], kartuPutih[1]]);
const tersimpan = await bacaKartuRepertoar();
assert.equal(tersimpan.length, 2, "kartu tersimpan di IndexedDB");
await hapusJalurRepertoar(kartuPutih[0].lineId);
assert.equal((await bacaKartuRepertoar()).length, 0, "hapus jalur menghapus semua kartunya");

assert.equal(
  jadwalkanKartu(kartuPutih[0], "good", sekarang).diperbarui,
  sekarang,
  "penjadwalan menstempel waktu `diperbarui` untuk penggabungan penyimpanan",
);

/*
 * ── Cermin localStorage ──────────────────────────────────────────────
 * Regresi: dulu kartu yang gagal ditulis ke IndexedDB hanya mendarat di
 * localStorage, sedangkan pembacaan selalu memprioritaskan IndexedDB — kartu
 * itu tampil lalu hilang setelah halaman dimuat ulang.
 */
const simpanan = new Map();
globalThis.localStorage = {
  getItem: (kunci) => (simpanan.has(kunci) ? simpanan.get(kunci) : null),
  setItem: (kunci, nilai) => {
    simpanan.set(kunci, String(nilai));
  },
  removeItem: (kunci) => {
    simpanan.delete(kunci);
  },
  clear: () => simpanan.clear(),
};
simpanan.clear();

const kartuA = {
  id: "ujiA:0",
  lineId: "ujiA",
  warna: "w",
  ply: 0,
  dueAt: sekarang,
  repetitions: 0,
  createdAt: sekarang,
  diperbarui: sekarang,
};
const kartuB = {
  id: "ujiB:0",
  lineId: "ujiB",
  warna: "w",
  ply: 0,
  dueAt: sekarang,
  repetitions: 0,
  createdAt: sekarang,
  diperbarui: sekarang,
};

assert.equal(await simpanKartuRepertoar([kartuA]), true, "penyimpanan normal berhasil");

const transaksiAsli = IDBDatabase.prototype.transaction;
IDBDatabase.prototype.transaction = () => {
  throw new Error("kuota penuh");
};
assert.equal(
  await simpanKartuRepertoar([kartuB]),
  true,
  "IndexedDB menolak, tetapi cermin localStorage tetap menyimpan",
);
IDBDatabase.prototype.transaction = transaksiAsli;

const setelahGagal = await bacaKartuRepertoar();
assert.deepEqual(
  setelahGagal.map((kartu) => kartu.id).sort(),
  ["ujiA:0", "ujiB:0"],
  "kartu yang dulu hanya sempat di localStorage tidak hilang setelah muat ulang",
);

// Cermin dibersihkan (mis. pengguna menghapus data situs); kartu harus sudah
// dimigrasikan ke IndexedDB pada pembacaan sebelumnya.
simpanan.clear();
assert.deepEqual(
  (await bacaKartuRepertoar()).map((kartu) => kartu.id).sort(),
  ["ujiA:0", "ujiB:0"],
  "kartu cermin dimigrasikan balik ke IndexedDB saat penyimpanan sehat lagi",
);

// Rekaman terbaru menang saat dua sumber berbeda.
const kartuATerbaru = { ...kartuA, repetitions: 3, diperbarui: sekarang + 60_000 };
await simpanKartuRepertoar([kartuATerbaru]);
assert.equal(
  (await bacaKartuRepertoar()).find((kartu) => kartu.id === "ujiA:0")?.repetitions,
  3,
  "penggabungan memilih rekaman dengan stempel terbaru",
);

// Hapus saat IndexedDB menolak: tombstone menjaga agar jalur tidak hidup lagi.
IDBDatabase.prototype.transaction = () => {
  throw new Error("kuota penuh");
};
assert.equal(await hapusJalurRepertoar("ujiB"), true, "penghapusan tetap tercatat di cermin");
IDBDatabase.prototype.transaction = transaksiAsli;

assert.deepEqual(
  (await bacaKartuRepertoar()).map((kartu) => kartu.id),
  ["ujiA:0"],
  "jalur yang sudah dihapus tidak dihidupkan lagi oleh sisa data IndexedDB",
);
assert.deepEqual(
  JSON.parse(simpanan.get("kci.papan.repertoar.hapus.v1") || "[]"),
  [],
  "tombstone dibersihkan setelah IndexedDB ikut terhapus",
);

await hapusJalurRepertoar("ujiA");
assert.equal((await bacaKartuRepertoar()).length, 0, "repertoar uji bersih di akhir");

console.log(
  "OK — pemilihan jalur, kartu per giliran, jadwal tinjauan, IndexedDB + cermin localStorage repertoar.",
);
