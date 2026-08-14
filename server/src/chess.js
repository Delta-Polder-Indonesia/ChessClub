/**
 * Klien API publik Chess.com.
 *
 * Tiga hal yang ditangani di sini:
 * - TENGGANG WAKTU: permintaan yang menggantung tidak boleh membekukan server.
 * - COBA ULANG: 429/5xx dicoba ulang dengan jeda menaik (exponential backoff).
 * - CACHE: profil pemain disimpan sebentar agar tidak membanjiri Chess.com
 *   saat memindai banyak anggota atau saat halaman daftar sering dibuka.
 */
import { konfigurasi } from "./konfigurasi.js";

const cache = new Map(); // kunci -> { kedaluwarsa, nilai }

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

function dariCache(kunci) {
  const item = cache.get(kunci);
  if (!item) return undefined;
  if (Date.now() > item.kedaluwarsa) {
    cache.delete(kunci);
    return undefined;
  }
  return item.nilai;
}

function keCache(kunci, nilai) {
  cache.set(kunci, {
    nilai,
    kedaluwarsa: Date.now() + konfigurasi.chess.cacheDetik * 1000,
  });
  // Jaga agar cache tidak tumbuh tanpa batas.
  if (cache.size > 5000) {
    const tertua = cache.keys().next().value;
    cache.delete(tertua);
  }
}

export function bersihkanCache() {
  cache.clear();
}

/** Galat yang membedakan masalah jaringan dari jawaban resmi Chess.com. */
export class GalatChess extends Error {
  constructor(pesan, { status = 0, sementara = false } = {}) {
    super(pesan);
    this.name = "GalatChess";
    this.status = status;
    this.sementara = sementara;
  }
}

async function ambilSekali(jalur) {
  const kendali = new AbortController();
  const jam = setTimeout(
    () => kendali.abort(),
    konfigurasi.chess.tenggangMs
  );
  try {
    return await fetch(`${konfigurasi.chess.dasar}${jalur}`, {
      headers: {
        "User-Agent": konfigurasi.chess.ua,
        Accept: "application/json",
      },
      signal: kendali.signal,
    });
  } finally {
    clearTimeout(jam);
  }
}

/**
 * GET ke Chess.com dengan coba ulang.
 * Mengembalikan { ada: false } untuk 404 (bukan galat — akun memang tak ada).
 */
export async function chessGet(jalur, { pakaiCache = true } = {}) {
  if (pakaiCache) {
    const tersimpan = dariCache(jalur);
    if (tersimpan !== undefined) return tersimpan;
  }

  let galatTerakhir;
  for (let percobaan = 1; percobaan <= konfigurasi.chess.percobaan; percobaan++) {
    try {
      const res = await ambilSekali(jalur);

      if (res.status === 404) {
        const hasil = { ada: false, status: 404, data: null };
        if (pakaiCache) keCache(jalur, hasil);
        return hasil;
      }

      if (res.ok) {
        const data = await res.json();
        const hasil = { ada: true, status: res.status, data };
        if (pakaiCache) keCache(jalur, hasil);
        return hasil;
      }

      // 429 / 5xx -> layak dicoba ulang
      if (res.status === 429 || res.status >= 500) {
        galatTerakhir = new GalatChess(
          `Chess.com menjawab ${res.status}`,
          { status: res.status, sementara: true }
        );
      } else {
        throw new GalatChess(`Chess.com menjawab ${res.status}`, {
          status: res.status,
        });
      }
    } catch (e) {
      if (e instanceof GalatChess && !e.sementara) throw e;
      galatTerakhir =
        e.name === "AbortError"
          ? new GalatChess("Chess.com tidak menjawab tepat waktu.", {
              sementara: true,
            })
          : galatTerakhir ||
            new GalatChess(`Gagal menghubungi Chess.com: ${e.message}`, {
              sementara: true,
            });
    }

    if (percobaan < konfigurasi.chess.percobaan) {
      await tidur(300 * 2 ** (percobaan - 1)); // 300ms, 600ms, 1200ms
    }
  }
  throw galatTerakhir;
}

export const ambilProfil = (username) =>
  chessGet(`/player/${encodeURIComponent(username)}`);

export const ambilStatistik = (username) =>
  chessGet(`/player/${encodeURIComponent(username)}/stats`);

/** Ringkas semua kontrol waktu menjadi satu objek rating. */
export function ringkasRating(stats) {
  const urutan = [
    ["chess_rapid", "Rapid"],
    ["chess_blitz", "Blitz"],
    ["chess_bullet", "Bullet"],
    ["chess_daily", "Daily"],
  ];
  const ratings = {};
  let utama = null;

  for (const [kunci, label] of urutan) {
    const blok = stats?.[kunci];
    if (blok?.last?.rating) {
      ratings[label] = {
        elo: blok.last.rating,
        win: blok.record?.win ?? 0,
        draw: blok.record?.draw ?? 0,
        loss: blok.record?.loss ?? 0,
      };
      if (!utama) utama = label;
    }
  }

  if (!utama) {
    return { ratings: {}, elo: null, kontrol: null, win: 0, draw: 0, loss: 0 };
  }
  return {
    ratings,
    kontrol: utama,
    elo: ratings[utama].elo,
    win: ratings[utama].win,
    draw: ratings[utama].draw,
    loss: ratings[utama].loss,
  };
}
