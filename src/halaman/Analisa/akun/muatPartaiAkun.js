/**
 * Pengambilan seluruh partai sebuah akun dari API publik chess.com, lalu
 * menyimpannya ke basis data lokal (basisData). Dipakai dashboard akun.
 *
 * Sama seperti pemilih partai, tetapi tanpa komponen UI — hasilnya hanya
 * data. Progres dilaporkan lewat `onProgress`; pembatalan lewat `signal`.
 */
import { hitungPlyPgn } from "../../../lib/pgnRingan.js";
import { simpanBanyakPartai } from "../basisData.js";

const ANTREAN_ARSIP = 4;

/** Ubah satu objek partai mentah chess.com → baris metadata basisData. */
function olahPartaiChessCom(game) {
  const pgn = typeof game?.pgn === "string" ? game.pgn : "";
  if (!pgn) return null;
  const putih = game.white ?? {};
  const hitam = game.black ?? {};
  let hasil = "draw";
  if (putih.result === "win") hasil = "white";
  else if (hitam.result === "win") hasil = "black";
  return {
    pgn,
    whiteName: putih.username ?? "",
    blackName: hitam.username ?? "",
    whiteElo: putih.rating ?? 0,
    blackElo: hitam.rating ?? 0,
    result: hasil,
    timestamp: (Number(game.end_time) || 0) * 1e3,
    timeClass: game.time_class ?? "unknown",
    plyCount: hitungPlyPgn(pgn),
    url: game.url ?? "",
  };
}

/**
 * Ambil seluruh partai akun chess.com dan simpan ke basisData.
 * @returns {Promise<object[]>} daftar partai (metadata) urut tanggal terbaru.
 */
export async function muatPartaiChessCom(username, { onProgress, signal } = {}) {
  const user = String(username || "").trim();
  const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`, { signal });
  if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status });
  const json = await res.json();
  const arsip = (Array.isArray(json?.archives) ? json.archives : [])
    .map((alamat) => {
      const pecahan = alamat.split("/");
      return { tahun: pecahan.at(-2), bulan: pecahan.at(-1), url: alamat };
    })
    .toReversed();

  const semua = [];
  for (let i = 0; i < arsip.length; i += ANTREAN_ARSIP) {
    const potongan = arsip.slice(i, i + ANTREAN_ARSIP);
    const hasil = await Promise.all(
      potongan.map(async (bulan) => {
        onProgress?.(i + 1, arsip.length, bulan);
        try {
          const jawaban = await fetch(bulan.url, { signal });
          if (!jawaban.ok) return [];
          const isi = await jawaban.json();
          return (Array.isArray(isi?.games) ? isi.games : []).map(olahPartaiChessCom).filter(Boolean);
        } catch (e) {
          if (e?.name === "AbortError") throw e;
          return [];
        }
      })
    );
    for (const bagian of hasil) semua.push(...bagian);
  }

  semua.sort((a, b) => b.timestamp - a.timestamp);

  if (semua.length > 0) {
    await simpanBanyakPartai(semua, { platform: "chessCom", username: user }).catch(() => {});
  }

  return semua;
}
