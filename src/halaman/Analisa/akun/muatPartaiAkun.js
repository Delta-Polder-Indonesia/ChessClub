/**
 * Pengambilan seluruh partai sebuah akun dari API publik chess.com, lalu
 * menyimpannya ke basis data lokal (basisData). Dipakai dashboard akun.
 *
 * Sama seperti pemilih partai, tetapi tanpa komponen UI — hasilnya hanya
 * data. Progres dilaporkan lewat `onProgress`; pembatalan lewat `signal`.
 *
 * Pengaman unduhan:
 *  - `sedangMengunduh` — satu akun yang sama hanya boleh satu unduhan dalam
 *    satu waktu. Layar Akun dilepas dan dipasang lagi setiap pindah menu
 *    (Akun → Database → Akun); tanpa ini, menutup-buka popup saat unduhan
 *    panjang berjalan menembakkan unduhan PARALEL kedua (dan ketiga, …)
 *    untuk arsip yang sama → puluhan fetch beruntun + penumpukan teks PGN
 *    di memori sampai tab macet.
 *  - `kegagalanTerakhir` — bila unduhan gagal (jaringan/404/kuota), jangan
 *    tembak ulang otomatis dalam jeda singkat hanya karena popup dibuka
 *    lagi; pengguna bisa memaksa lewat tombol "Tarik data" (`paksa: true`).
 */
import { hitungPlyPgn } from "../../../lib/pgnRingan.js";
import { simpanBanyakPartai } from "../basisData.js";

const ANTREAN_ARSIP = 4;
const JEDE_GAGAL_MS = 60_000;

const sedangMengunduh = new Map(); // username(huruf kecil) → Promise
const kegagalanTerakhir = new Map(); // username(huruf kecil) → timestamp

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
 *
 * @param {object} [opsi]
 * @param {boolean} [opsi.paksa=false] abaikan jeda kegagalan & unduhan
 *   berjalan (dipakai tombol "Tarik data" / refresh manual).
 * @returns {Promise<object[]>} daftar partai (metadata) urut tanggal terbaru.
 */
export async function muatPartaiChessCom(username, { onProgress, signal, paksa = false } = {}) {
  const user = String(username || "").trim();
  const kunci = user.toLowerCase();

  // Unduhan yang sama masih berjalan (mis. popup ditutup-lalu-dibuka saat
  // menarik arsip) → ikut menunggu hasilnya, bukan memulai unduhan baru.
  // Pengecualian: unduhan yang sedang berjalan DIPAKSA (tombol "Tarik
  // data") — biarkan pemanggil memulai unduhan baru.
  const berjalan = sedangMengunduh.get(kunci);
  if (berjalan && !paksa) return berjalan.janji;

  // Baru saja gagal: jangan tembak ulang otomatis saat popup dibuka lagi.
  // Dicek SEBELUM membuat unduhan baru, tetapi jeda baru baru dicatat
  // setelah unduhan benar-benar selesai gagal — supaya beberapa pemicu
  // paralel saat jaringan mati tidak saling menghitung sebagai percobaan.
  if (!paksa) {
    const gagalPada = kegagalanTerakhir.get(kunci) || 0;
    if (gagalPada && Date.now() - gagalPada < JEDE_GAGAL_MS) {
      throw Object.assign(new Error("cooldown"), { cooldown: true });
    }
  }

  const janji = muatPartaiChessComInti(user, { onProgress, signal });
  const entri = { janji };
  sedangMengunduh.set(kunci, entri);
  try {
    const hasil = await janji;
    kegagalanTerakhir.delete(kunci);
    return hasil;
  } catch (e) {
    if (!signal?.aborted) kegagalanTerakhir.set(kunci, Date.now());
    throw e;
  } finally {
    if (sedangMengunduh.get(kunci) === entri) sedangMengunduh.delete(kunci);
  }
}

async function muatPartaiChessComInti(user, { onProgress, signal } = {}) {
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
