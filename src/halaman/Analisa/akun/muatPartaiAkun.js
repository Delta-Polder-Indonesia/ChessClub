/**
 * Pengambilan partai sebuah akun dari API publik chess.com / lichess.org,
 * lalu menyimpannya ke basis data lokal (basisData).
 *
 * Mendukung filter periode (mingguan/bulanan/tahunan/semua) untuk mencegah
 * browser stag saat akun punya 1jt partai.
 *
 * Pengaman unduhan:
 *  - `sedangMengunduh` — satu akun yang sama hanya boleh satu unduhan dalam
 *    satu waktu.
 *  - `kegagalanTerakhir` — bila unduhan gagal, jangan tembak ulang otomatis
 *    dalam jeda singkat.
 *
 * Kunci pengaman mencakup platform (`chessCom:…` / `lichessOrg:…`) karena
 * nama pengguna yang sama bisa ada di kedua situs dan keduanya harus bisa
 * ditarik berurutan tanpa saling mengunci.
 */
import { hitungPlyPgn } from "../../../lib/pgnRingan.js";
import { simpanBanyakPartai } from "../basisData.js";

const ANTREAN_ARSIP = 4;
const JEDE_GAGAL_MS = 60_000;
/*
 * Batas partai per sekali tarik Lichess. API Lichess mengembalikan satu
 * aliran NDJSON raksasa — tanpa batas, akun dengan ratusan ribu partai
 * membuat tab membeku saat mengurai teksnya. Chess.com tidak butuh batas
 * ini karena datanya sudah terpotong per bulan arsip.
 */
const MAKS_PARTAI_LICHESS = 5000;

const sedangMengunduh = new Map(); // `${platform}:${username}` → Promise
const kegagalanTerakhir = new Map(); // `${platform}:${username}` → timestamp

function kunciUnduh(platform, username) {
  return `${platform}:${String(username || "").trim().toLowerCase()}`;
}

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
 * Ubah satu baris NDJSON lichess (`pgnInJson=true`) → baris metadata
 * basisData. Pemain anonim/bot tidak punya `user.name` — diisi "Anonim"
 * supaya kartu statistik tidak menampilkan sel kosong.
 */
export function olahPartaiLichess(json) {
  const pgn = typeof json?.pgn === "string" ? json.pgn : "";
  if (!pgn) return null;
  const putih = json.players?.white ?? {};
  const hitam = json.players?.black ?? {};
  let hasil = "draw";
  if (json.winner === "white") hasil = "white";
  else if (json.winner === "black") hasil = "black";
  const id = typeof json.id === "string" && json.id ? json.id : "";
  return {
    pgn,
    whiteName: putih.user?.name ?? "Anonim",
    blackName: hitam.user?.name ?? "Anonim",
    whiteElo: putih.rating ?? 0,
    blackElo: hitam.rating ?? 0,
    result: hasil,
    timestamp: Number(json.createdAt) || 0,
    timeClass: json.speed ?? "unknown",
    plyCount: hitungPlyPgn(pgn),
    url: id ? `https://lichess.org/${id}` : "",
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
  const kunci = kunciUnduh("chessCom", user);

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

/* ── Lichess ─────────────────────────────────────────────────────────── */

/**
 * Baca aliran NDJSON lichess baris per baris (streaming) supaya progres
 * "N partai…" bisa tampil dan unduhan bisa dihentikan tepat saat batas
 * tercapai — tanpa menunggu seluruh teks raksasa selesai diunduh.
 * Lingkungan tanpa ReadableStream (uji node lama) memakai jalur `text()`.
 */
async function bacaNdjsonLichess(res, { signal, onProgress, maks }) {
  const semua = [];
  const olahBaris = (baris) => {
    const teks = String(baris || "").trim();
    if (!teks) return true;
    let obj = null;
    try {
      obj = JSON.parse(teks);
    } catch {
      return true;
    }
    const barisData = olahPartaiLichess(obj);
    if (barisData) {
      semua.push(barisData);
      onProgress?.(semua.length, 0, null);
    }
    return semua.length < maks;
  };

  if (!res.body || typeof res.body.getReader !== "function") {
    const teks = await res.text();
    for (const baris of String(teks || "").split("\n")) {
      if (!olahBaris(baris)) break;
    }
    return semua;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sisa = "";
  try {
    for (;;) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          /* abaikan */
        }
        const batal = new Error("dibatalkan");
        batal.name = "AbortError";
        throw batal;
      }
      const { done, value } = await reader.read();
      sisa += decoder.decode(value || new Uint8Array(), { stream: !done });
      let idx = -1;
      let lanjut = true;
      while ((idx = sisa.indexOf("\n")) >= 0) {
        const baris = sisa.slice(0, idx);
        sisa = sisa.slice(idx + 1);
        if (!olahBaris(baris)) {
          lanjut = false;
          break;
        }
      }
      if (!lanjut) {
        try {
          await reader.cancel();
        } catch {
          /* abaikan */
        }
        break;
      }
      if (done) {
        if (sisa.trim()) olahBaris(sisa);
        break;
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* abaikan */
    }
  }
  return semua;
}

/**
 * Ambil partai akun lichess.org dan simpan ke basisData, dengan filter
 * periode yang sama seperti chess.com. `since`/`until` dikirim ke API
 * sehingga server yang memotong rentang — klien hanya menyaring ulang
 * sebagai pengaman.
 *
 * @param {object} [opsi]
 * @param {boolean} [opsi.paksa=false] abaikan jeda kegagalan & unduhan berjalan
 * @param {string} [opsi.periode="semua"] "mingguan" | "bulanan" | "tahunan" | "semua"
 * @param {string} [opsi.tanggal] "YYYY-MM-DD" — hanya partai di hari itu yang diambil
 * @param {number} [opsi.maks=5000] batas partai per sekali tarik (anti-stag)
 * @returns {Promise<object[]>} daftar partai urut terbaru
 */
export async function muatPartaiLichess(
  username,
  { onProgress, signal, paksa = false, periode = "semua", tanggal, maks = MAKS_PARTAI_LICHESS } = {}
) {
  const user = String(username || "").trim();
  const kunci = kunciUnduh("lichessOrg", user);

  const berjalan = sedangMengunduh.get(kunci);
  if (berjalan && !paksa) return berjalan.janji;

  if (!paksa) {
    const gagalPada = kegagalanTerakhir.get(kunci) || 0;
    if (gagalPada && Date.now() - gagalPada < JEDE_GAGAL_MS) {
      throw Object.assign(new Error("cooldown"), { cooldown: true });
    }
  }

  const janji = muatPartaiLichessInti(user, { onProgress, signal, periode, tanggal, maks });
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

async function muatPartaiLichessInti(user, { onProgress, signal, periode = "semua", tanggal, maks }) {
  const cutoffMs = cutoffDariPeriode(periode);
  const kustom = typeof tanggal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(tanggal);
  const mulaiHari = kustom ? new Date(`${tanggal}T00:00:00`).getTime() : 0;
  const akhirHari = kustom ? mulaiHari + 24 * 3600 * 1000 : 0;

  const params = new URLSearchParams({
    pgnInJson: "true",
    opening: "true",
    sort: "dateDesc",
    max: String(Math.max(1, Number(maks) || MAKS_PARTAI_LICHESS)),
  });
  if (kustom) {
    params.set("since", String(mulaiHari));
    params.set("until", String(akhirHari - 1));
  } else if (cutoffMs) {
    params.set("since", String(cutoffMs));
  }

  onProgress?.(0, 0, null);
  const res = await fetch(`https://lichess.org/api/games/user/${encodeURIComponent(user)}?${params.toString()}`, {
    headers: { Accept: "application/x-ndjson" },
    signal,
  });
  if (!res.ok) throw Object.assign(new Error(String(res.status)), { status: res.status });

  let semua = await bacaNdjsonLichess(res, {
    signal,
    onProgress,
    maks: Math.max(1, Number(maks) || MAKS_PARTAI_LICHESS),
  });

  // Saring ulang di klien sebagai pengaman (server sudah memotong via since/until).
  if (kustom) {
    semua = semua.filter((g) => {
      const ts = g.timestamp || 0;
      return ts >= mulaiHari && ts < akhirHari;
    });
  } else if (cutoffMs) {
    semua = semua.filter((g) => (g.timestamp || 0) >= cutoffMs);
  }

  semua.sort((a, b) => b.timestamp - a.timestamp);

  if (semua.length > 0) {
    await simpanBanyakPartai(semua, { platform: "lichessOrg", username: user }).catch(() => {});
  }

  return semua;
}
