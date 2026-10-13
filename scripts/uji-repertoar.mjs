import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import {
  buatKartuDariJalur,
  indeksJalurPembukaan,
  jadwalkanKartu,
  kartuBerikutnya,
} from "../src/halaman/LatihanRepertoar/repertoarLogika.js";
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

await simpanKartuRepertoar([kartuPutih[0], kartuPutih[1]]);
const tersimpan = await bacaKartuRepertoar();
assert.equal(tersimpan.length, 2, "kartu tersimpan di IndexedDB");
await hapusJalurRepertoar(kartuPutih[0].lineId);
assert.equal((await bacaKartuRepertoar()).length, 0, "hapus jalur menghapus semua kartunya");

console.log("OK — pemilihan jalur, kartu per giliran, jadwal tinjauan, dan IndexedDB repertoar.");
