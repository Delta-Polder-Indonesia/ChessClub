/**
 * Uji logika Hand & Brain (varian lokal) — tanpa DOM/jaringan.
 *
 * Mencakup: undian jenis bidak hanya dari jenis yang punya langkah, validasi
 * jenis undian, promosi otomatis ratu, deteksi skakmat dan remis tiga kali
 * (butuh histori penuh), serta partai tidak pernah macet tanpa langkah.
 *
 * Jalankan: node scripts/uji-hand-brain.mjs  (keluar 1 bila ada yang gagal)
 */
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import {
  buatPartai,
  jenisBerlangkah,
  langkahDiizinkan,
  mainkanLangkah,
  papanDariLangkah,
  statusPartai,
  undiJenis,
} from "../src/halaman/HandBrain/handBrainLogika.js";

let lulus = 0;
function uji(nama, fn) {
  fn();
  lulus += 1;
  console.log(`  ✓ ${nama}`);
}

const rngTetap = (nilai) => () => nilai;
const FEN_AWAL = new Chess().fen();

console.log("1. undian jenis bidak");
uji("posisi awal: semua jenis yang bisa jalan (bukan raja saja)", () => {
  // Di posisi awal: bidak (p), kuda (n) yang bisa jalan. B/R/Q/K terblokir.
  assert.deepEqual(jenisBerlangkah(FEN_AWAL), ["p", "n"]);
});
uji("undian hanya memilih jenis yang punya langkah legal", () => {
  for (const r of [0, 0.25, 0.5, 0.75, 0.9999]) {
    assert.ok(["p", "n"].includes(undiJenis(FEN_AWAL, rngTetap(r))));
  }
});
uji("undian deterministik sesuai rng", () => {
  assert.equal(undiJenis(FEN_AWAL, rngTetap(0)), "p");
  assert.equal(undiJenis(FEN_AWAL, rngTetap(0.99)), "n");
});
uji("buatPartai: langkah kosong dan jenis terundi", () => {
  const partai = buatPartai(rngTetap(0));
  assert.deepEqual(partai.langkah, []);
  assert.equal(partai.jenis, "p");
});
uji("posisi tanpa langkah legal (mat) → undian null", () => {
  // Skakmat Fool's mate: Hitam sudah mat, tidak ada langkah.
  const mat = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";
  assert.equal(undiJenis(mat), null);
});

console.log("2. validasi langkah sesuai jenis undian");
uji("langkah bidak sesuai jenis → diterima, giliran berganti", () => {
  const partai = { langkah: [], jenis: "p" };
  const hasil = mainkanLangkah(partai, "e2", "e4", rngTetap(0));
  assert.equal(hasil.ok, true);
  assert.equal(hasil.san, "e4");
  assert.deepEqual(hasil.partai.langkah, ["e2e4"]);
  assert.equal(papanDariLangkah(hasil.partai.langkah).turn(), "b");
});
uji("langkah legal tetapi jenis bidak lain → ditolak dengan alasan 'jenis'", () => {
  const partai = { langkah: [], jenis: "n" };
  const hasil = mainkanLangkah(partai, "e2", "e4", rngTetap(0));
  assert.deepEqual(hasil, { ok: false, alasan: "jenis" });
});
uji("langkah tidak legal → ditolak dengan alasan 'tidak-legal'", () => {
  const partai = { langkah: [], jenis: "p" };
  const hasil = mainkanLangkah(partai, "e2", "e5", rngTetap(0));
  assert.deepEqual(hasil, { ok: false, alasan: "tidak-legal" });
});
uji("langkah setelah partai selesai → 'selesai'", () => {
  const mat = ["f2f3", "e7e5", "g2g4", "d8h4"];
  const partai = { langkah: mat, jenis: "p" };
  assert.deepEqual(mainkanLangkah(partai, "a2", "a3", rngTetap(0)), { ok: false, alasan: "selesai" });
});
uji("langkah kuda legal saat jenis undian 'n'", () => {
  const partai = { langkah: [], jenis: "n" };
  const hasil = mainkanLangkah(partai, "g1", "f3", rngTetap(0));
  assert.equal(hasil.ok, true);
  assert.equal(hasil.san, "Nf3");
});
uji("langkah yang sama dengan jenis lain tidak membocorkan undian", () => {
  const partai = { langkah: [], jenis: "p" };
  const hasil = mainkanLangkah(partai, "g1", "f3", rngTetap(0));
  assert.deepEqual(hasil, { ok: false, alasan: "jenis" });
});

console.log("3. daftar langkah diizinkan");
uji("langkahDiizinkan hanya memuat bidak berjenis undian", () => {
  const dapat = langkahDiizinkan({ langkah: [], jenis: "n" });
  assert.ok(dapat.length > 0);
  assert.ok(dapat.every((m) => m.piece === "n"));
});
uji("langkahDiizinkan kosong bila jenis null", () => {
  assert.deepEqual(langkahDiizinkan({ langkah: [], jenis: null }), []);
});

console.log("4. promosi dan status akhir");
uji("promosi otomatis ke ratu (gxh8=Q)", () => {
  // 1.h4 a5 2.h5 a4 3.h6 a3 4.hxg7 Nf6 — pion g7 menangkap rook di h8 dan promosi.
  const langkah = ["h2h4", "a7a5", "h4h5", "a5a4", "h5h6", "a4a3", "h6g7", "g8f6"];
  const partai = { langkah, jenis: "p" };
  const hasil = mainkanLangkah(partai, "g7", "h8", rngTetap(0));
  assert.equal(hasil.ok, true);
  assert.equal(hasil.san, "gxh8=Q");
  assert.equal(hasil.partai.langkah.at(-1), "g7h8q");
});
uji("skakmat terdeteksi: Fool's mate (1.f3 e5 2.g4 Qh4#)", () => {
  const langkah = ["f2f3", "e7e5", "g2g4", "d8h4"];
  const papan = papanDariLangkah(langkah);
  assert.deepEqual(statusPartai(papan), { selesai: true, hasil: "skakmat", pemenang: "b" });
});
uji("remis tiga kali pengulangan terdeteksi (butuh histori penuh)", () => {
  // Bolak-balik kuda: posisi awal muncul di t=0, 4, dan 8 setengah-langkah.
  const siklus = ["g1f3", "g8f6", "f3g1", "f6g8"];
  assert.equal(statusPartai(papanDariLangkah(siklus)).selesai, false, "posisi awal baru dua kali");
  const duaSiklus = [...siklus, ...siklus];
  assert.deepEqual(statusPartai(papanDariLangkah(duaSiklus)), { selesai: true, hasil: "seri", pemenang: null });
});
uji("mainkanLangkah mengakhiri partai dan mengosongkan jenis", () => {
  // Fool's mate lewat API: langkah terakhir 2...Qh4# harus berstatus selesai.
  let partai = { langkah: ["f2f3", "e7e5", "g2g4"], jenis: "q" };
  const hasil = mainkanLangkah(partai, "d8", "h4", rngTetap(0));
  assert.equal(hasil.ok, true);
  assert.equal(hasil.status.hasil, "skakmat");
  assert.equal(hasil.partai.jenis, null);
});

console.log("5. partai selalu bisa dilanjutkan sampai selesai (acak)");
uji("partai acak tidak pernah macet: tiap giliran punya langkah yang diterima", () => {
  // mulberry32: PRNG 32-bit deterministik (LCG naif kehilangan presisi di JS).
  let seed = 12345 >>> 0;
  const rng = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Sampel kecil: tiap langkah membangun ulang papan (histori penuh), jadi
  // dijaga tetap cepat. Partai acak bisa sangat panjang, jadi dibatasi.
  let giliranDiuji = 0;
  for (let partaiKe = 0; partaiKe < 6; partaiKe += 1) {
    let partai = buatPartai(rng);
    let langkahMaks = 100;
    while (partai.jenis !== null && langkahMaks > 0) {
      const legal = langkahDiizinkan(partai);
      assert.ok(legal.length > 0, "undian jenis selalu punya langkah");
      const pilih = legal[Math.floor(rng() * legal.length)];
      const hasil = mainkanLangkah(partai, pilih.from, pilih.to, rng);
      assert.equal(hasil.ok, true, `langkah ${pilih.san} harus diterima`);
      partai = hasil.partai;
      langkahMaks -= 1;
      giliranDiuji += 1;
    }
  }
  assert.ok(giliranDiuji > 0);
});

console.log(`\n${lulus} pemeriksaan lulus, 0 gagal.`);
