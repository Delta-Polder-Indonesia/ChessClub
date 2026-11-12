import assert from "node:assert/strict";
import { FEN_AWAL } from "../src/halaman/PapanInteraktif/bersama/konstanta.js";
import {
  aturBidak,
  aturHakRokade,
  bersihkanHakRokade,
  fenDariPeta,
  hakRokadeTersedia,
  petaDariFen,
  validasiPosisiSusun,
} from "../src/halaman/PapanInteraktif/bersama/editorPosisi.js";

const awal = petaDariFen(FEN_AWAL);
assert.equal(Object.keys(awal).length, 32);
assert.equal(awal.e1, "K");
assert.equal(awal.e8, "k");

const diedit = aturBidak(FEN_AWAL, "e4", "Q");
assert.equal(petaDariFen(diedit).e4, "Q");
assert.equal(diedit.split(" ")[1], "w");
assert.equal(diedit.split(" ")[2], "KQkq");
assert.equal(FEN_AWAL.split(" ")[2], "KQkq");
assert.equal(aturHakRokade(FEN_AWAL, "K", false).split(" ")[2], "Qkq");
assert.equal(aturHakRokade(FEN_AWAL, "q", false).split(" ")[2], "KQk");
assert.equal(aturHakRokade(FEN_AWAL, "k", false).split(" ")[2], "KQq");
assert.equal(aturHakRokade(FEN_AWAL, "Q", false).split(" ")[2], "Kkq");
assert.equal(aturHakRokade("4k3/8/8/8/8/8/8/R3K2R w - - 0 1", "Q", true).split(" ")[2], "Q");
assert.equal(aturHakRokade("8/8/8/8/8/8/8/8 w - - 0 1", "Q", true).split(" ")[2], "-");
assert.equal(aturHakRokade(FEN_AWAL, "K", false).replace(" ", "|"), FEN_AWAL.replace(" ", "|").replace("KQkq", "Qkq"));
assert.equal(aturHakRokade(FEN_AWAL, "X", true), FEN_AWAL);

// Hak rokade yang masih mungkin dipertahankan saat giliran atau bidak lain diubah,
// namun otomatis dicabut jika raja atau benteng terkait dihapus/dipindah.
const ubahGiliran = fenDariPeta(petaDariFen(FEN_AWAL), "b", FEN_AWAL.split(" ")[2]);
assert.equal(ubahGiliran.split(" ")[1], "b");
assert.equal(ubahGiliran.split(" ")[2], "KQkq");

const tanpaBentengH1 = aturBidak(FEN_AWAL, "h1", null);
assert.equal(tanpaBentengH1.split(" ")[2], "Qkq");
const tanpaRajaHitam = aturBidak(FEN_AWAL, "e8", null);
assert.equal(tanpaRajaHitam.split(" ")[2], "KQ");
assert.equal(hakRokadeTersedia(petaDariFen("4k3/8/8/8/8/8/8/R3K3 w - - 0 1")), "Q");
assert.equal(bersihkanHakRokade(petaDariFen("4k3/8/8/8/8/8/4K3/8 w K - 0 1"), "K"), "-");

const dihapus = aturBidak(diedit, "e4", null);
assert.equal(petaDariFen(dihapus).e4, undefined);
assert.equal(dihapus.split(" ")[2], "KQkq");

const kosong = fenDariPeta({}, "b");
assert.equal(kosong, "8/8/8/8/8/8/8/8 b - - 0 1");
assert.deepEqual(petaDariFen(kosong), {});

assert.throws(() => petaDariFen("8/8/8/8/8/8/8/7 w - - 0 1"));
assert.equal(validasiPosisiSusun(FEN_AWAL), null);
assert.equal(validasiPosisiSusun(kosong), "posisiPerluRaja");
assert.equal(
  validasiPosisiSusun("4k3/8/8/8/8/8/4R3/4K3 w - - 0 1"),
  "posisiRajaDiserang"
);
assert.equal(
  validasiPosisiSusun("4k3/8/8/8/8/8/8/4K2P w - - 0 1"),
  "posisiPionIlegal"
);
assert.equal(validasiPosisiSusun("broken fen"), "posisiTidakSah");
console.log("OK — board edits, FEN, and legal-position validation.");
