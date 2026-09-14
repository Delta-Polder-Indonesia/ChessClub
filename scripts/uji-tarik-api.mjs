/**
 * Uji integrasi tarik partai Chess.com & Lichess → IndexedDB (tanpa jaringan).
 *
 * `fetch` diganti tiruan yang mengembalikan respons API realistis, lalu alur
 * produksi penuh dijalankan: `muatPartaiChessCom` / `muatPartaiLichess` →
 * `simpanBanyakPartai` → `ambilSemuaKoleksi` / `ambilDaftarPartai`. IndexedDB
 * memakai `fake-indexeddb` sehingga jalur database-nya sama persis dengan
 * peramban (bukan jalur memori).
 *
 * Yang dikunci:
 *  1. Tarik Lichess (NDJSON, jalur text() maupun streaming) tersimpan dengan
 *     platform `lichessOrg` dan koleksinya muncul di Database.
 *  2. Tarik Chess.com tetap bekerja setelah refactor kunci unduhan.
 *  3. Filter periode & tanggal kustom memotong partai yang di luar rentang.
 *  4. Cooldown/jeda kegagalan TERPISAH per platform: gagal tarik Lichess
 *     tidak mengunci tarik Chess.com untuk username yang sama (dan sebaliknya).
 *
 * Jalankan: node scripts/uji-tarik-api.mjs
 */
import assert from "node:assert/strict";

await import("fake-indexeddb/auto");
globalThis.window = globalThis;

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

const SEKARANG = Date.now();
const SEJAM = 3600 * 1000;

function pgn(white, black, hasil = "1-0") {
  return [
    '[Event "Uji tarik"]',
    '[Site "https://lichess.org/uji"]',
    `[White "${white}"]`,
    `[Black "${black}"]`,
    `[Result "${hasil}"]`,
    "",
    `1. e4 e5 2. Nf3 Nc6 ${hasil}`,
  ].join("\n");
}

/* Dua partai Lichess baru (dalam 31 hari) + satu partai lama (2 tahun). */
function ndjsonLichess() {
  const baris = [
    {
      id: "baru1",
      winner: "white",
      speed: "blitz",
      createdAt: SEKARANG - 2 * SEJAM,
      pgn: pgn("DrNykterstein", "LawanA"),
      players: { white: { user: { name: "DrNykterstein" }, rating: 3000 }, black: { user: { name: "LawanA" }, rating: 2500 } },
    },
    {
      id: "baru2",
      winner: "black",
      speed: "bullet",
      createdAt: SEKARANG - 26 * SEJAM,
      pgn: pgn("LawanB", "DrNykterstein", "0-1"),
      players: { white: { user: { name: "LawanB" }, rating: 2600 }, black: { user: { name: "DrNykterstein" }, rating: 2950 } },
    },
    {
      id: "lama1",
      speed: "rapid",
      createdAt: SEKARANG - 730 * 24 * SEJAM,
      pgn: pgn("DrNykterstein", "LawanC", "1/2-1/2"),
      players: { white: { user: { name: "DrNykterstein" }, rating: 2800 }, black: { user: { name: "LawanC" }, rating: 2700 } },
    },
  ];
  return baris.map((b) => JSON.stringify(b)).join("\n") + "\n";
}

function arsipChessCom() {
  const akhir = Math.floor((SEKARANG - 3 * SEJAM) / 1000);
  return {
    games: [
      {
        url: "https://www.chess.com/game/live/111",
        pgn: pgn("Hikaru", "LawanX"),
        time_class: "blitz",
        end_time: akhir,
        white: { username: "Hikaru", rating: 3200, result: "win" },
        black: { username: "LawanX", rating: 3000, result: "timeout" },
      },
      {
        url: "https://www.chess.com/game/live/222",
        pgn: pgn("LawanY", "Hikaru", "0-1"),
        time_class: "bullet",
        end_time: akhir - 100,
        white: { username: "LawanY", rating: 3100, result: "checkmated" },
        black: { username: "Hikaru", rating: 3210, result: "win" },
      },
    ],
  };
}

/* ── fetch tiruan ─────────────────────────────────────────────────── */

const panggilan = [];
globalThis.fetch = async (url, opsi) => {
  const alamat = String(url);
  panggilan.push(alamat);
  if (opsi?.signal?.aborted) {
    const e = new Error("dibatalkan");
    e.name = "AbortError";
    throw e;
  }
  // Lichess: paksa gagal untuk akun cooldown-ex (URL memakai ejaan asli,
  // server lichess tidak peduli huruf besar/kecil — samakan dulu di sini).
  if (alamat.toLowerCase().includes("lichess.org/api/games/user/cooldownex")) {
    return { ok: false, status: 500 };
  }
  if (alamat.startsWith("https://lichess.org/api/games/user/streamer")) {
    // Varian streaming: kembalikan ReadableStream asli.
    const teks = ndjsonLichess();
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(teks.slice(0, 400)));
        c.enqueue(new TextEncoder().encode(teks.slice(400)));
        c.close();
      },
    });
    return { ok: true, status: 200, body: stream, text: async () => teks };
  }
  if (alamat.startsWith("https://lichess.org/api/games/user/")) {
    // Varian text(): tanpa body stream → jalur fallback.
    return { ok: true, status: 200, body: null, text: async () => ndjsonLichess() };
  }
  if (alamat.endsWith("/games/archives")) {
    return { ok: true, status: 200, json: async () => ({ archives: ["https://api.chess.com/pub/player/x/games/2026/09"] }) };
  }
  if (alamat.includes("/games/2026/09")) {
    return { ok: true, status: 200, json: async () => arsipChessCom() };
  }
  return { ok: false, status: 404 };
};

const { muatPartaiChessCom, muatPartaiLichess } = await import(
  "../src/halaman/Analisa/akun/muatPartaiAkun.js"
);
const basis = await import("../src/halaman/Analisa/basisData.js");

/* ── 1. Lichess → Database (jalur text) ───────────────────────────── */

console.log("Tarik Lichess → Database");
await uji("2 partai baru tersimpan, 1 partai lama terpotong filter bulanan", async () => {
  const progres = [];
  const hasil = await muatPartaiLichess("DrNykterstein", {
    periode: "bulanan",
    paksa: true,
    onProgress: (ke) => progres.push(ke),
  });
  assert.equal(hasil.length, 2);
  assert.ok(progres.length > 0);
  assert.ok(hasil[0].timestamp >= hasil[1].timestamp);
});

await uji("koleksi lichess muncul dengan jumlah & platform benar", async () => {
  const semua = await basis.ambilSemuaKoleksi();
  const kol = semua.find((k) => k.id === "lichessOrg:drnykterstein");
  assert.ok(kol, "koleksi lichessOrg:drnykterstein ada");
  assert.equal(kol.jumlahPartai, 2);
  const daftar = await basis.ambilDaftarPartai({ koleksiId: kol.id, limit: 0, sertakanPgn: false });
  assert.equal(daftar.total, 2);
  assert.ok(daftar.partai.every((p) => p.platform === "lichessOrg"));
});

await uji("tanggal kustom di luar hari partai = kosong", async () => {
  const hasil = await muatPartaiLichess("DrNykterstein", { tanggal: "2001-02-03", paksa: true });
  assert.equal(hasil.length, 0);
});

/* ── 2. Lichess jalur streaming ───────────────────────────────────── */

console.log("\nTarik Lichess jalur streaming");
await uji("ReadableStream terurai sama benarnya", async () => {
  const hasil = await muatPartaiLichess("Streamer", { periode: "bulanan", paksa: true });
  assert.equal(hasil.length, 2);
  const daftar = await basis.ambilDaftarPartai({
    koleksiId: "lichessOrg:streamer",
    limit: 0,
    sertakanPgn: true,
  });
  assert.equal(daftar.total, 2);
  assert.ok(daftar.partai[0].pgn.includes("1. e4"));
});

/* ── 3. Chess.com tetap jalan ─────────────────────────────────────── */

console.log("\nTarik Chess.com → Database");
await uji("arsip chess.com tersimpan ke koleksi chessCom", async () => {
  const hasil = await muatPartaiChessCom("Hikaru", { periode: "bulanan", paksa: true });
  assert.equal(hasil.length, 2);
  const semua = await basis.ambilSemuaKoleksi();
  const kol = semua.find((k) => k.id === "chessCom:hikaru");
  assert.ok(kol);
  assert.equal(kol.jumlahPartai, 2);
});

/* ── 4. Cooldown terpisah per platform ─────────────────────────────── */

console.log("\nCooldown per platform");
await uji("gagal lichess tidak mengunci chess.com username sama", async () => {
  await assert.rejects(() => muatPartaiLichess("CooldownEx"));
  // Tanpa paksa: bila kuncinya global, baris ini melempar "cooldown".
  const hasil = await muatPartaiChessCom("CooldownEx", { periode: "bulanan" });
  assert.equal(hasil.length, 2);
});

await uji("gagal lichess tetap mengunci lichess username sama", async () => {
  await assert.rejects(() => muatPartaiLichess("CooldownEx"), /cooldown/);
});

console.log(`\n${lulus} lulus, ${gagal} gagal.`);
if (gagal > 0) process.exitCode = 1;
