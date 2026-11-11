import assert from "node:assert/strict";
import { FEN_AWAL } from "../src/halaman/PapanInteraktif/bersama/konstanta.js";
import {
  aturBidak,
  fenDariPeta,
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
assert.equal(diedit.split(" ")[2], "-");

const dihapus = aturBidak(diedit, "e4", null);
assert.equal(petaDariFen(dihapus).e4, undefined);

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
