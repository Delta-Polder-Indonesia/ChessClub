/**
 * Uji gestur "mesin seperti manusia" di mode Manusia vs Mesin.
 *
 * Mengapa perlu: mesin dulu memindahkan bidaknya nyaris seketika setelah
 * pencarian selesai, sehingga terasa seperti mesin, bukan lawan. Sekarang
 * mesin mengklik bidaknya (bidak bergoyang), diam 2-4 detik, dan pada posisi
 * yang dinilai sulit kadang melirik satu-dua bidak lain seperti bimbang.
 *
 * Yang dikunci uji ini (kontrak `src/halaman/ManusiaVsMesin/gerakLawan.js`):
 *   1. `posisiSulit` hanya benar bila skor masih tipis DAN pilihan banyak;
 *      skakmat paksa serta info kosong tidak pernah sulit;
 *   2. `petakRagu` hanya mengembalikan petak bidak milik pihak yang melangkah
 *      yang PUNYA langkah sah, tidak pernah petak asal langkah sebenarnya,
 *      dan jumlahnya dibatasi;
 *   3. `acakRentang` tetap di dalam rentangnya;
 *   4. `gesturLawan` mengklik petak ragu lebih dulu lalu petak asal, memakai
 *      jeda 2-4 detik sebelum langkah, dan berhenti begitu `masihBerlaku`
 *      bernilai false (partai baru / undo di tengah gestur);
 *   5. `klikLawan` mengirim `click` (BUKAN `pointerdown`, yang akan menghapus
 *      panah pemain) dan menggoyangkan bidak di petak itu;
 *   6. gestur tidak pernah mengubah langkah yang dijalankan — petak asal
 *      selalu diklik terakhir.
 *
 * Skrip gagal keras bila jsdom belum terpasang.
 *
 * Jalankan: node scripts/uji-gestur-lawan.mjs
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom")) {
  console.log("GAGAL: tidak dapat menjalankan uji gestur lawan — pasang `npm i -D jsdom` untuk menjalankannya.");
  process.exit(1);
}

const { JSDOM } = require("jsdom");

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, detail = "") {
  if (kondisi) {
    lulus += 1;
    console.log(`  \u2713 ${nama}`);
  } else {
    gagal += 1;
    console.log(`  \u2717 ${nama}${detail ? ` — ${detail}` : ""}`);
  }
}

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.Element = dom.window.Element;
// jsdom tidak punya matchMedia; tanpa stub `kurangiGerak()` melempar.
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
dom.window.matchMedia = globalThis.matchMedia;

const { GESTUR, acakRentang, gesturLawan, goyangBidak, klikLawan, petakRagu, posisiSulit } =
  await import("../src/halaman/ManusiaVsMesin/gerakLawan.js");

const FEN_AWAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
// Setelah 1.e4 e5 2.Nf3 — hitam melangkah, 29 langkah sah.
const FEN_TENGAH = "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2";

/* ---------------------- 1. penilaian posisi sulit ---------------------- */

console.log("\n1. posisiSulit");

uji("skor tipis + banyak langkah = sulit", posisiSulit({ cp: 20, mate: null }, 30));
uji("skor tipis tapi pilihan sedikit = tidak sulit", !posisiSulit({ cp: 20, mate: null }, 12));
uji("pilihan banyak tapi sudah unggul jauh = tidak sulit", !posisiSulit({ cp: 350, mate: null }, 40));
uji("tertinggal jauh juga tidak sulit", !posisiSulit({ cp: -350, mate: null }, 40));
uji("skakmat paksa tidak pernah sulit", !posisiSulit({ cp: null, mate: 3 }, 40));
uji("tanpa info engine tidak pernah sulit", !posisiSulit(null, 40));
uji("info tanpa cp tidak pernah sulit", !posisiSulit({ cp: null, mate: null }, 40));
uji(
  "ambang dipakai apa adanya (cp tepat di ambang belum sulit)",
  !posisiSulit({ cp: GESTUR.ambangCp, mate: null }, GESTUR.ambangLangkah)
);
uji(
  "tepat di ambang langkah dengan cp di bawahnya sudah sulit",
  posisiSulit({ cp: GESTUR.ambangCp - 1, mate: null }, GESTUR.ambangLangkah)
);

/* -------------------------- 2. petak dilirik -------------------------- */

console.log("\n2. petakRagu");

{
  const acak = () => 0.42;
  const petak = petakRagu(FEN_TENGAH, "b", "b8", { acak });
  uji("mengembalikan paling banyak `maksRagu` petak", petak.length <= GESTUR.maksRagu, String(petak));
  uji("tidak pernah memuat petak asal langkah sebenarnya", !petak.includes("b8"), String(petak));
  const hitam = ["a7", "b7", "c7", "d7", "f7", "g7", "h7", "e5", "b8", "g8", "d8", "e8", "f8", "c8", "a8", "h8"];
  uji("semua petak milik pihak yang melangkah", petak.every((p) => hitam.includes(p)), String(petak));
}

{
  // Bidak yang terkunci total tidak boleh muncul: pada posisi awal hanya pion
  // dan kuda yang punya langkah sah.
  const petak = petakRagu(FEN_AWAL, "w", "e2", { acak: () => 0.1, maks: 16 });
  const bisaJalan = ["a2", "b2", "c2", "d2", "f2", "g2", "h2", "b1", "g1"];
  uji("hanya bidak yang punya langkah sah", petak.every((p) => bisaJalan.includes(p)), String(petak));
  uji("bidak terkunci (mis. benteng a1) tidak dilirik", !petak.includes("a1"), String(petak));
}

uji("giliran tidak cocok = tidak ada yang dilirik", petakRagu(FEN_AWAL, "b", "e7").length === 0);
uji("FEN rusak ditangani, bukan melempar", petakRagu("bukan fen", "w", "e2").length === 0);
uji("maks 0 mematikan gestur ragu", petakRagu(FEN_AWAL, "w", "e2", { maks: 0 }).length === 0);

/* ------------------------------ 3. acak ------------------------------- */

console.log("\n3. acakRentang");

uji("acak 0 = batas bawah", acakRentang([2000, 4000], () => 0) === 2000);
uji("acak 1 = batas atas", acakRentang([2000, 4000], () => 1) === 4000);
uji("acak 0.5 = tengah", acakRentang([2000, 4000], () => 0.5) === 3000);
uji(
  "jeda langkah bawaan 2-4 detik",
  GESTUR.jedaLangkah[0] === 2000 && GESTUR.jedaLangkah[1] === 4000,
  JSON.stringify(GESTUR.jedaLangkah)
);
uji("peluang ragu kira-kira satu dari tiga", Math.abs(GESTUR.peluangRagu - 1 / 3) < 1e-9);

/* --------------------------- 4. klik + goyang -------------------------- */

console.log("\n4. klikLawan & goyangBidak");

/** Papan palsu: 64 petak, isinya bidak pada petak yang disebutkan. */
function buatPapan(berisi = ["e2", "d7", "g8"]) {
  const papan = document.createElement("div");
  for (const kolom of "abcdefgh") {
    for (let baris = 1; baris <= 8; baris++) {
      const sq = `${kolom}${baris}`;
      const el = document.createElement("div");
      el.setAttribute("data-petak", sq);
      if (berisi.includes(sq)) {
        const bidak = document.createElement("div");
        bidak.setAttribute("data-bidak", "1");
        bidak.animate = function (keyframes, opsi) {
          (this.riwayat ||= []).push({ keyframes, opsi });
          papan.goyangan.push({ petak: sq, keyframes, opsi });
          return { cancel() {}, finished: Promise.resolve() };
        };
        el.appendChild(bidak);
      }
      papan.appendChild(el);
    }
  }
  papan.goyangan = [];
  document.body.appendChild(papan);
  return papan;
}

{
  const papan = buatPapan();
  const terlihat = [];
  for (const jenis of ["click", "pointerdown", "mousedown"]) {
    papan.addEventListener(jenis, (e) => terlihat.push(`${jenis}:${e.target.closest("[data-petak]")?.dataset.petak}`));
  }
  const hasil = klikLawan(papan, "e2");
  uji("klik pada petak yang ada mengembalikan true", hasil === true);
  uji("mengirim click pada petak yang benar", terlihat.includes("click:e2"), JSON.stringify(terlihat));
  uji(
    "tidak mengirim pointerdown (panah pemain tidak terhapus)",
    !terlihat.some((t) => t.startsWith("pointerdown")),
    JSON.stringify(terlihat)
  );
  uji("bidak yang diklik bergoyang", papan.goyangan.length === 1 && papan.goyangan[0].petak === "e2");
  uji("goyangan memakai durasi tetapan", papan.goyangan[0]?.opsi?.duration === GESTUR.goyang);
  uji("petak tanpa bidak tidak menggoyangkan apa pun", klikLawan(papan, "e4") === true && papan.goyangan.length === 1);
  uji("petak yang tidak ada di DOM mengembalikan false", klikLawan(papan, "z9") === false);
  uji("papan null tidak melempar", klikLawan(null, "e2") === false);
}

{
  const papan = buatPapan();
  const asli = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  dom.window.matchMedia = globalThis.matchMedia;
  goyangBidak(papan.querySelector('[data-petak="e2"]'));
  uji("setelan kurangi gerak mematikan goyangan", papan.goyangan.length === 0);
  globalThis.matchMedia = asli;
  dom.window.matchMedia = asli;
}

/* ------------------------- 5. orkestrasi gestur ------------------------ */

console.log("\n5. gesturLawan");

{
  const papan = buatPapan(["e2", "d7", "g8", "b8", "c7"]);
  const urutan = [];
  const jedaTercatat = [];
  papan.addEventListener("click", (e) => urutan.push(e.target.closest("[data-petak]")?.dataset.petak));
  let klikSuara = 0;
  const selesai = await gesturLawan(papan, {
    dari: "d7",
    ragu: ["b8", "c7"],
    padaKlik: () => (klikSuara += 1),
    jeda: async (ms) => jedaTercatat.push(ms),
    acak: () => 0.5,
  });
  uji("gestur selesai utuh", selesai === true);
  uji("petak ragu diklik lebih dulu, petak asal terakhir", urutan.join(">") === "b8>c7>d7", urutan.join(">"));
  uji("setiap klik memicu bunyi", klikSuara === 3, String(klikSuara));
  uji("setiap bidak yang diklik bergoyang", papan.goyangan.length === 3, String(papan.goyangan.length));
  uji(
    "jeda terakhir adalah jeda langkah 2-4 detik",
    jedaTercatat.at(-1) === 3000,
    JSON.stringify(jedaTercatat)
  );
  uji(
    "jeda antar klik ragu jauh lebih pendek",
    jedaTercatat.slice(0, -1).every((ms) => ms < GESTUR.jedaLangkah[0]),
    JSON.stringify(jedaTercatat)
  );
}

{
  const papan = buatPapan(["d7"]);
  const urutan = [];
  papan.addEventListener("click", (e) => urutan.push(e.target.closest("[data-petak]")?.dataset.petak));
  const selesai = await gesturLawan(papan, {
    dari: "d7",
    jeda: async () => {},
    acak: () => 0.5,
  });
  uji("tanpa gestur ragu hanya petak asal yang diklik", urutan.join(">") === "d7", urutan.join(">"));
  uji("gestur polos tetap dianggap selesai", selesai === true);
}

{
  // Partai di-reset di tengah gestur: sisa klik tidak boleh dikirim dan
  // pemanggil harus tahu langkahnya batal dijalankan.
  const papan = buatPapan(["b8", "c7", "d7"]);
  const urutan = [];
  papan.addEventListener("click", (e) => urutan.push(e.target.closest("[data-petak]")?.dataset.petak));
  let hidup = true;
  const selesai = await gesturLawan(papan, {
    dari: "d7",
    ragu: ["b8", "c7"],
    masihBerlaku: () => hidup,
    jeda: async () => {
      hidup = false;
    },
    acak: () => 0.5,
  });
  uji("gestur yang dibatalkan mengembalikan false", selesai === false);
  uji("klik berhenti begitu gestur dibatalkan", urutan.join(">") === "b8", urutan.join(">"));
}

{
  // Dibatalkan tepat saat jeda terakhir: petak asal sudah diklik, tetapi
  // langkahnya tidak boleh dijalankan lagi.
  const papan = buatPapan(["d7"]);
  let hidup = true;
  const selesai = await gesturLawan(papan, {
    dari: "d7",
    masihBerlaku: () => hidup,
    jeda: async () => {
      hidup = false;
    },
    acak: () => 0.5,
  });
  uji("dibatalkan saat menunggu = langkah tidak dijalankan", selesai === false);
}

{
  const papan = buatPapan(["d7"]);
  const selesai = await gesturLawan(papan, {
    dari: "z9",
    jeda: async () => {},
    acak: () => 0.5,
  });
  uji("petak asal hilang dari DOM tidak menggagalkan giliran", selesai === true);
}

/* -------------------- 6. hanya mode Manusia vs Mesin ------------------- */

console.log("\n6. pemakaian terbatas");

{
  const { readFileSync, readdirSync } = await import("node:fs");
  const pemakai = [];
  const telusuri = (dir) => {
    for (const isi of readdirSync(dir, { withFileTypes: true })) {
      const penuh = path.join(dir, isi.name);
      if (isi.isDirectory()) telusuri(penuh);
      else if (/\.(js|jsx)$/.test(isi.name) && readFileSync(penuh, "utf8").includes("gerakLawan"))
        pemakai.push(path.relative(ROOT, penuh));
    }
  };
  telusuri(path.join(ROOT, "src"));
  uji(
    "gestur hanya dipakai mode Manusia vs Mesin",
    pemakai.length === 1 && pemakai[0].endsWith("ManusiaVsMesin.jsx"),
    JSON.stringify(pemakai)
  );

  const sumber = readFileSync(
    path.join(ROOT, "src/halaman/ManusiaVsMesin/ManusiaVsMesin.jsx"),
    "utf8"
  );
  uji("langkah yang dijalankan tetap hasil engine", sumber.includes("mainkanLangkah(from, to, promosi)"));
  uji("gestur ragu hanya dipicu lewat posisiSulit", /posisiSulit\(info, jumlahLangkah\)/.test(sumber));
  uji("jendela klik lawan membatasi petak yang boleh diproses", sumber.includes("boleh.includes(square)"));
}

console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
