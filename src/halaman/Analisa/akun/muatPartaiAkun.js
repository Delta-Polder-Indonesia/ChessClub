/**
 * Pengambilan partai sebuah akun dari API publik chess.com, lalu
 * menyimpannya ke basis data lokal (basisData).
 *
 * Mendukung filter periode (mingguan/bulanan/tahunan/semua) untuk mencegah
 * browser stag saat akun punya 1jt partai.
 *
 * Pengaman unduhan:
 *  - `sedangMengunduh` — satu akun yang sama hanya boleh satu unduhan dalam
 *    satu waktu.
 *  - `kegagalanTerakhir` — bila unduhan gagal, jangan tembak ulang otomatis
 *    dalam jeda singkat.
 */
import { hitungPlyPgn } from "../../../lib/pgnRingan.js";
import { simpanBanyakPartai } from "../basisData.js";

const ANTREAN_ARSIP = 4;
const JEDE_GAGAL_MS = 60_000;

const sedangMengunduh = new Map(); // username(huruf kecil) → Promise
const kegagalanTerakhir = new Map(); // username(huruf kecil) → timestamp

/* Periode filter untuk tarik data — mencegah 1jt partai langsung diunduh */
export const PERIODE_TARIK_MS = {
  mingguan: 7 * 24 * 3600 * 1000,
  bulanan: 31 * 24 * 3600 * 1000,
  tahunan: 366 * 24 * 3600 * 1000,
  semua: Infinity,
  // alias dari UI Database lama
  "7d": 7 * 24 * 3600 * 1000,
  "30d": 30 * 24 * 3600 * 1000,
  "90d": 90 * 24 * 3600 * 1000,
  "1y": 365 * 24 * 3600 * 1000,
  all: Infinity,
};

function cutoffDariPeriode(periode) {
  const key = String(periode || "semua").toLowerCase();
  const ms = PERIODE_TARIK_MS[key] ?? PERIODE_TARIK_MS.semua;
  if (!Number.isFinite(ms)) return 0; // semua = 0 artinya tidak ada cutoff
  return Date.now() - ms;
}

/* Cek apakah arsip bulan/tahun masih relevan dengan cutoff */
function arsipRelevan(tahunStr, bulanStr, cutoffMs) {
  if (!cutoffMs) return true; // semua
  const t = Number(tahunStr);
  const b = Number(bulanStr);
  if (!Number.isFinite(t) || !Number.isFinite(b)) return true;
  // akhir bulan arsip: new Date(t, b, 0) -> b 1-12, day 0 = last day of month b
  const akhirBulan = new Date(t, b, 0).getTime();
  return akhirBulan >= cutoffMs;
}

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
 * Ambil partai akun chess.com dan simpan ke basisData, dengan filter periode.
 *
 * @param {object} [opsi]
 * @param {boolean} [opsi.paksa=false] abaikan jeda kegagalan & unduhan berjalan
 * @param {string} [opsi.periode="semua"] "mingguan" | "bulanan" | "tahunan" | "semua"
 * @param {string} [opsi.tanggal] "YYYY-MM-DD" — hanya partai di hari itu yang diambil
 * @returns {Promise<object[]>} daftar partai urut terbaru
 */
export async function muatPartaiChessCom(username, { onProgress, signal, paksa = false, periode = "semua", tanggal } = {}) {
  const user = String(username || "").trim();
  const kunci = user.toLowerCase();

  const berjalan = sedangMengunduh.get(kunci);
  if (berjalan && !paksa) return berjalan.janji;

  if (!paksa) {
    const gagalPada = kegagalanTerakhir.get(kunci) || 0;
    if (gagalPada && Date.now() - gagalPada < JEDE_GAGAL_MS) {
      throw Object.assign(new Error("cooldown"), { cooldown: true });
    }
  }

  const janji = muatPartaiChessComInti(user, { onProgress, signal, periode, tanggal });
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

async function muatPartaiChessComInti(user, { onProgress, signal, periode = "semua", tanggal } = {}) {
  const cutoffMs = cutoffDariPeriode(periode);
  // Mode satu hari ("Kustom"): hanya arsip bulan itu, per partai startOfDay ≤ ts < endOfDay
  const kunciBulan = typeof tanggal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)
    ? tanggal.slice(0, 7).replace("-", "/")
    : "";
  const mulaiHari = kunciBulan ? new Date(`${tanggal}T00:00:00`).getTime() : 0;
  const akhirHari = kunciBulan ? mulaiHari + 24 * 3600 * 1000 : 0;

  const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/games/archives`, { signal });
  if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status });
  const json = await res.json();
  let arsip = (Array.isArray(json?.archives) ? json.archives : [])
    .map((alamat) => {
      const pecahan = alamat.split("/");
      return { tahun: pecahan.at(-2), bulan: pecahan.at(-1), url: alamat };
    })
    .toReversed();

  // Filter arsip berdasarkan periode — ini yang mencegah 1jt partai langsung diunduh
  if (kunciBulan) {
    arsip = arsip.filter((a) => `${a.tahun}/${a.bulan}` === kunciBulan);
  } else if (cutoffMs) {
    arsip = arsip.filter((a) => arsipRelevan(a.tahun, a.bulan, cutoffMs));
  }

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
          let daftar = (Array.isArray(isi?.games) ? isi.games : []).map(olahPartaiChessCom).filter(Boolean);
          // Filter per game juga, untuk kasus bulan yang sebagian di luar periode/hari target
          if (kunciBulan) {
            daftar = daftar.filter((g) => {
              const ts = g.timestamp || 0;
              return ts >= mulaiHari && ts < akhirHari;
            });
          } else if (cutoffMs) {
            daftar = daftar.filter((g) => (g.timestamp || 0) >= cutoffMs);
          }
          return daftar;
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
