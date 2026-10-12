// Uji unit impor Lichess untuk Turing test (turingLichess.js).
// Jalankan: node scripts/uji-turing-lichess.mjs (juga lewat npm run uji:turing)
import assert from "node:assert/strict";
import {
  GALAT_IMPOR,
  GalatImporLichess,
  MAKS_PARTAI_IMPOR,
  ambilPgnLichess,
  urlPartaiLichess,
} from "../src/halaman/PapanInteraktif/modus/turingLichess.js";

let lulus = 0;
async function periksa(nama, fungsi) {
  await fungsi();
  lulus += 1;
  console.log(`  ok - ${nama}`);
}

/** Respons tiruan untuk fetch. */
function respons({ status = 200, teks = "" } = {}) {
  return { ok: status >= 200 && status < 300, status, text: async () => teks };
}

async function galatKode(promise) {
  try {
    await promise;
  } catch (galat) {
    assert.ok(galat instanceof GalatImporLichess, `galat bukan GalatImporLichess: ${galat}`);
    return galat.kode;
  }
  throw new Error("seharusnya melempar galat");
}

console.log("Turing test: impor Lichess");

await periksa("URL memakai endpoint user Lichess dengan PGN mentah", () => {
  const url = new URL(urlPartaiLichess("MagnusCarlsen", 10));
  assert.equal(url.origin + url.pathname, "https://lichess.org/api/games/user/MagnusCarlsen");
  assert.equal(url.searchParams.get("moves"), "true");
  assert.equal(url.searchParams.get("pgnInJson"), "false");
  assert.equal(url.searchParams.get("max"), "10");
});

await periksa("jumlah partai dibatasi MAKS_PARTAI_IMPOR", () => {
  const url = new URL(urlPartaiLichess("abc", 9999));
  assert.equal(url.searchParams.get("max"), String(MAKS_PARTAI_IMPOR));
  const kecil = new URL(urlPartaiLichess("abc", 0));
  assert.equal(kecil.searchParams.get("max"), String(MAKS_PARTAI_IMPOR));
});

await periksa("nama pengguna tidak sah ditolak sebelum jaringan", async () => {
  for (const nama of ["", "a", "nama dengan spasi", "../../x", "a".repeat(31), "nama.titik"]) {
    let dipanggil = false;
    const kode = await galatKode(
      ambilPgnLichess(nama, {
        fetchFn: async () => {
          dipanggil = true;
          return respons();
        },
      }),
    );
    assert.equal(kode, GALAT_IMPOR.namaTidakSah, nama);
    assert.equal(dipanggil, false, `fetch tidak boleh dipanggil untuk "${nama}"`);
  }
});

await periksa("nama dipangkas spasi dan dienkode di URL", () => {
  const url = urlPartaiLichess("  pemain_1-x  ");
  assert.ok(url.includes("/user/pemain_1-x?"));
});

await periksa("berhasil: mengembalikan teks PGN dan mengirim header Accept PGN", async () => {
  let headerAccept = null;
  const teks = await ambilPgnLichess("pemain", {
    fetchFn: async (_url, init) => {
      headerAccept = init.headers.Accept;
      return respons({ teks: "\n[Event \"X\"]\n\n1. e4 e5 *\n\n" });
    },
  });
  assert.equal(headerAccept, "application/x-chess-pgn");
  assert.equal(teks, "[Event \"X\"]\n\n1. e4 e5 *");
});

await periksa("404 dipetakan ke tidak-ditemukan", async () => {
  const kode = await galatKode(ambilPgnLichess("ada", { fetchFn: async () => respons({ status: 404 }) }));
  assert.equal(kode, GALAT_IMPOR.tidakDitemukan);
});

await periksa("429 dipetakan ke batas-tercapai", async () => {
  const kode = await galatKode(ambilPgnLichess("ada", { fetchFn: async () => respons({ status: 429 }) }));
  assert.equal(kode, GALAT_IMPOR.batasTercapai);
});

await periksa("status lain dan galat jaringan dipetakan ke jaringan", async () => {
  assert.equal(await galatKode(ambilPgnLichess("ada", { fetchFn: async () => respons({ status: 500 }) })), GALAT_IMPOR.jaringan);
  assert.equal(
    await galatKode(
      ambilPgnLichess("ada", {
        fetchFn: async () => {
          throw new TypeError("Failed to fetch");
        },
      }),
    ),
    GALAT_IMPOR.jaringan,
  );
});

await periksa("respons kosong dipetakan ke kosong", async () => {
  const kode = await galatKode(ambilPgnLichess("ada", { fetchFn: async () => respons({ teks: "   " }) }));
  assert.equal(kode, GALAT_IMPOR.kosong);
});

await periksa("pembatalan (AbortError) diteruskan apa adanya", async () => {
  const batal = new DOMException("dibatalkan", "AbortError");
  await assert.rejects(
    ambilPgnLichess("ada", {
      fetchFn: async () => {
        throw batal;
      },
    }),
    (galat) => galat === batal,
  );
});

console.log(`\n${lulus} pemeriksaan lulus, 0 gagal.`);
