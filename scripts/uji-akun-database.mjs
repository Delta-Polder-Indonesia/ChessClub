/**
 * Uji alur Akun → Database halaman Analisa (tanpa jaringan, tanpa peramban).
 *
 * Regresi yang dikunci di sini — semuanya pernah membuat "akun yang baru
 * ditambahkan tidak terbaca datanya di database":
 *
 *  1. Konversi partai Lichess (NDJSON → baris basisData): hasil, nama anonim,
 *     PGN kosong, dan URL.
 *  2. `pastikanKoleksi` membuat koleksi kosong agar akun baru langsung muncul
 *     di Database; idempotent (tidak menaikkan revisi dua kali).
 *  3. `langgananRevisi` memberi tahu pendengar setiap ada tulis — layar
 *     Database memakai ini untuk muat ulang otomatis.
 *  4. `simpanBanyakPartai` melaporkan jumlah koleksi yang benar dan
 *     `hapusPartai` menurunkannya lagi.
 *  5. Kartu profil Lichess (`ambilKartuPemain` dengan platform) memetakan
 *     rating/total dari API lichess — bukan menembak api.chess.com.
 *
 * basisData.js otomatis memakai jalur memori di node (tanpa IndexedDB),
 * sehingga seluruh tulis/baca di bawah ini deterministik.
 *
 * Jalankan: node scripts/uji-akun-database.mjs
 */
import assert from "node:assert/strict";

let lulus = 0;
let gagal = 0;

async function uji(nama, jalan) {
  try {
    await jalan();
    lulus++;
    console.log(`  ✓ ${nama}`);
  } catch (galat) {
    gagal++;
    console.error(`  ✗ ${nama}\n    ${galat?.message ?? galat}`);
    process.exitCode = 1;
  }
}

const PGN = [
  '[Event "Casual rapid game"]',
  '[Site "https://lichess.org/abc123"]',
  '[White "DrNykterstein"]',
  '[Black "LawanKuat"]',
  '[Result "1-0"]',
  "",
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0",
].join("\n");

const NDJSON_MENANG = {
  id: "abc123",
  winner: "white",
  speed: "rapid",
  createdAt: 1700000000000,
  pgn: PGN,
  players: {
    white: { user: { name: "DrNykterstein" }, rating: 2100 },
    black: { user: { name: "LawanKuat" }, rating: 2000 },
  },
};

/* ── 1. Konversi Lichess ─────────────────────────────────────────── */

console.log("Konversi partai Lichess");
const { olahPartaiLichess, PERIODE_TARIK_MS, muatPartaiLichess, muatPartaiChessCom } = await import(
  "../src/halaman/Analisa/akun/muatPartaiAkun.js"
);

await uji("fungsi tarik kedua platform tersedia", () => {
  assert.equal(typeof muatPartaiChessCom, "function");
  assert.equal(typeof muatPartaiLichess, "function");
});

await uji("periode tarik berurutan mingguan < bulanan < tahunan < semua", () => {
  assert.ok(PERIODE_TARIK_MS.mingguan < PERIODE_TARIK_MS.bulanan);
  assert.ok(PERIODE_TARIK_MS.bulanan < PERIODE_TARIK_MS.tahunan);
  assert.equal(PERIODE_TARIK_MS.semua, Infinity);
});

await uji("kemenangan putih terpetakan lengkap", () => {
  const r = olahPartaiLichess(NDJSON_MENANG);
  assert.equal(r.result, "white");
  assert.equal(r.whiteName, "DrNykterstein");
  assert.equal(r.blackName, "LawanKuat");
  assert.equal(r.whiteElo, 2100);
  assert.equal(r.blackElo, 2000);
  assert.equal(r.timestamp, 1700000000000);
  assert.equal(r.timeClass, "rapid");
  assert.equal(r.url, "https://lichess.org/abc123");
  assert.ok(r.plyCount > 0);
  assert.ok(r.pgn.includes("1. e4"));
});

await uji("tanpa pemenang = seri", () => {
  const r = olahPartaiLichess({ ...NDJSON_MENANG, winner: undefined });
  assert.equal(r.result, "draw");
});

await uji("pemain anonim tidak kosong", () => {
  const r = olahPartaiLichess({
    ...NDJSON_MENANG,
    players: { white: { rating: 1500 }, black: {} },
  });
  assert.equal(r.whiteName, "Anonim");
  assert.equal(r.blackName, "Anonim");
});

await uji("baris tanpa PGN dibuang", () => {
  assert.equal(olahPartaiLichess({ ...NDJSON_MENANG, pgn: "" }), null);
  assert.equal(olahPartaiLichess({}), null);
  assert.equal(olahPartaiLichess(null), null);
});

/* ── 2–4. Tulis/baca basis + revisi ───────────────────────────────── */

console.log("\nBasis data akun (jalur memori)");
const basis = await import("../src/halaman/Analisa/basisData.js");

await uji("pastikanKoleksi membuat koleksi kosong untuk akun baru", async () => {
  const kol = await basis.pastikanKoleksi({ platform: "lichessOrg", username: "DrNykterstein" });
  assert.ok(kol);
  assert.equal(kol.id, "lichessOrg:drnykterstein");
  assert.equal(kol.username, "DrNykterstein");
  assert.equal(kol.jumlahPartai, 0);
  const semua = await basis.ambilSemuaKoleksi();
  assert.ok(semua.some((k) => k.id === "lichessOrg:drnykterstein"));
});

await uji("pastikanKoleksi idempotent (revisi tidak naik dua kali)", async () => {
  const sebelum = basis.bacaRevisiBasis();
  await basis.pastikanKoleksi({ platform: "lichessOrg", username: "DrNykterstein" });
  await basis.pastikanKoleksi({ platform: "lichessOrg", username: "DRNYKTERSTEIN" });
  assert.equal(basis.bacaRevisiBasis(), sebelum);
});

await uji("langgananRevisi dipanggil saat tulis & berhenti saat dilepas", async () => {
  let panggilan = 0;
  const lepas = basis.langgananRevisi(() => {
    panggilan++;
  });
  await basis.simpanBanyakPartai([{ ...olahPartaiLichess(NDJSON_MENANG), url: "https://lichess.org/rev1" }], {
    platform: "lichessOrg",
    username: "DrNykterstein",
  });
  assert.equal(panggilan, 1);
  lepas();
  await basis.simpanBanyakPartai([{ ...olahPartaiLichess(NDJSON_MENANG), url: "https://lichess.org/rev2" }], {
    platform: "lichessOrg",
    username: "DrNykterstein",
  });
  assert.equal(panggilan, 1);
});

await uji("simpan melaporkan jumlah koleksi & hapus menurunkannya", async () => {
  await basis.bersihkanBasisData();
  const tiga = [1, 2, 3].map((i) => ({
    ...olahPartaiLichess({ ...NDJSON_MENANG, id: `g${i}` }),
    url: `https://lichess.org/g${i}`,
  }));
  const simpan = await basis.simpanBanyakPartai(tiga, {
    platform: "lichessOrg",
    username: "DrNykterstein",
  });
  assert.equal(simpan.tersimpan, 3);
  assert.equal(simpan.total, 3);

  const daftar = await basis.ambilDaftarPartai({
    koleksiId: "lichessOrg:drnykterstein",
    limit: 0,
    sertakanPgn: false,
  });
  assert.equal(daftar.total, 3);

  const hapusOk = await basis.hapusPartai(daftar.partai[0].id);
  assert.equal(hapusOk, true);
  const kol = (await basis.ambilSemuaKoleksi()).find((k) => k.id === "lichessOrg:drnykterstein");
  assert.equal(kol.jumlahPartai, 2);

  await basis.bersihkanBasisData();
  const kosong = await basis.ambilSemuaKoleksi();
  assert.equal(kosong.length, 0);
});

await uji("daftar akun tersimpan & terbaca (localStorage tiruan)", async () => {
  const simpan = new Map();
  globalThis.localStorage = {
    getItem: (k) => (simpan.has(k) ? simpan.get(k) : null),
    setItem: (k, v) => void simpan.set(k, String(v)),
    removeItem: (k) => void simpan.delete(k),
  };
  const { bacaDaftarAkun, tambahKeDaftar } = await import("../src/halaman/Analisa/akun/daftarAkun.js");
  assert.deepEqual(bacaDaftarAkun(), []);
  tambahKeDaftar({ platform: "chessCom", username: "Hikaru" });
  tambahKeDaftar({ platform: "lichessOrg", username: "DrNykterstein" });
  tambahKeDaftar({ platform: "chessCom", username: "hikaru" }); // duplikat beda huruf → ditolak
  const daftar = bacaDaftarAkun();
  assert.equal(daftar.length, 2);
  delete globalThis.localStorage;
});

/* ── 5. Kartu profil per platform ─────────────────────────────────── */

console.log("\nKartu profil pemain");
const fetchAsli = globalThis.fetch;
let hitungFetch = 0;
globalThis.fetch = async (url) => {
  hitungFetch++;
  const alamat = String(url);
  if (alamat.startsWith("https://lichess.org/api/user/")) {
    return {
      ok: true,
      json: async () => ({
        id: "drnykterstein",
        username: "DrNykterstein",
        url: "https://lichess.org/@/DrNykterstein",
        perfs: { bullet: { rating: 2900 }, blitz: { rating: 3000 }, rapid: { rating: 2800 } },
        count: { all: 12345 },
      }),
    };
  }
  if (alamat.endsWith("/stats")) {
    return {
      ok: true,
      json: async () => ({
        chess_bullet: { last: { rating: 3000 }, record: { win: 1, loss: 0, draw: 0 } },
        chess_blitz: { last: { rating: 3100 }, record: { win: 2, loss: 0, draw: 0 } },
        chess_rapid: { last: { rating: 2900 }, record: { win: 0, loss: 0, draw: 3 } },
      }),
    };
  }
  return {
    ok: true,
    json: async () => ({
      username: "hikaru",
      url: "https://www.chess.com/member/Hikaru",
      avatar: "https://avatar/contoh.png",
      country: "https://api.chess.com/pub/country/US",
    }),
  };
};

const { ambilKartuPemain } = await import("../src/lib/pemainCatur.js");

await uji("kartu lichess memakai API lichess (rating & total benar)", async () => {
  hitungFetch = 0;
  const kartu = await ambilKartuPemain("DrNykterstein", "lichessOrg");
  assert.ok(kartu);
  assert.equal(kartu.ratings.bullet, 2900);
  assert.equal(kartu.ratings.blitz, 3000);
  assert.equal(kartu.ratings.rapid, 2800);
  assert.equal(kartu.total, 12345);
  assert.equal(kartu.url, "https://lichess.org/@/DrNykterstein");
  assert.equal(hitungFetch, 1);
});

await uji("kartu chess.com tetap memakai API chess.com", async () => {
  hitungFetch = 0;
  const kartu = await ambilKartuPemain("Hikaru", "chessCom");
  assert.ok(kartu);
  assert.equal(kartu.ratings.bullet, 3000);
  assert.equal(kartu.total, 6);
  assert.equal(hitungFetch, 2); // profil + statistik
});

await uji("cache per platform: panggilan kedua tanpa fetch", async () => {
  hitungFetch = 0;
  await ambilKartuPemain("DrNykterstein", "lichessOrg");
  await ambilKartuPemain("Hikaru", "chessCom");
  assert.equal(hitungFetch, 0);
});

await uji("nama jelas-bukan-akun tidak menembak API", async () => {
  hitungFetch = 0;
  assert.equal(await ambilKartuPemain("Putih", "lichessOrg"), null);
  assert.equal(await ambilKartuPemain("Anonim", "chessCom"), null);
  assert.equal(hitungFetch, 0);
});

globalThis.fetch = fetchAsli;

/* ── Ringkasan ────────────────────────────────────────────────────── */

console.log(`\n${lulus} lulus, ${gagal} gagal.`);
if (gagal > 0) process.exitCode = 1;
