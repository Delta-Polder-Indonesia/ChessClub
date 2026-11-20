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
import { periksaUsername } from "../../src/lib/identitas.js";

const cache = new Map(); // kunci -> { kedaluwarsa, nilai }

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------- pembatas konkurensi */

/**
 * Pembatas konkurensi (semaphore) agar tidak terlalu banyak permintaan
 * bersamaan ke Chess.com. Mencegah rate-limit dan beban berlebih.
 */
const KONKURENSI_MAKS = 5; // maksimal 5 request bersamaan
let aktif = 0;
const antrean = [];

async function kunciKonkurensi() {
  if (aktif < KONKURENSI_MAKS) {
    aktif++;
    return;
  }
  // Tunggu giliran. "Tiket" dipindahkan oleh lepasKonkurensi tanpa
  // menurunkan aktif lebih dulu, sehingga tidak ada celah bagi pemanggil
  // baru untuk menyelinap dan menaikkan hitungan melebihi KONKURENSI_MAKS.
  await new Promise((resolve) => antrean.push(resolve));
}

function lepasKonkurensi() {
  const berikutnya = antrean.shift();
  if (berikutnya) berikutnya();
  else aktif--;
}

function dariCache(kunci) {
  const item = cache.get(kunci);
  if (!item) return undefined;
  if (Date.now() > item.kedaluwarsa) {
    cache.delete(kunci);
    return undefined;
  }
  return item.nilai;
}

function keCache(kunci, nilai, cacheDetik = konfigurasi.chess.cacheDetik) {
  cache.set(kunci, {
    nilai,
    kedaluwarsa: Date.now() + cacheDetik * 1000,
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

/** Hapus cache untuk username tertentu (pakai setelah data berubah). */
export function hapusCache(username) {
  const hasil = periksaUsername(username);
  if (!hasil.sah) return;
  const kunci = `/player/${hasil.username}`;
  cache.delete(kunci);
  cache.delete(`${kunci}/stats`);
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

function usernameUntukJalur(username) {
  const hasil = periksaUsername(username);
  if (!hasil.sah) {
    throw new GalatChess("Username Chess.com tidak valid.", { status: 400 });
  }
  return hasil.username;
}

function tanggalPuzzleSah(jalur) {
  const cocok = /^\/puzzle\/(\d{4})-(\d{2})-(\d{2})$/.exec(jalur);
  if (!cocok) return false;
  const [, tahun, bulan, hari] = cocok.map(Number);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  return (
    tanggal.getUTCFullYear() === tahun &&
    tanggal.getUTCMonth() === bulan - 1 &&
    tanggal.getUTCDate() === hari
  );
}

/**
 * chessGet hanya menerima tiga keluarga endpoint yang dipakai aplikasi.
 * Path tidak pernah boleh berasal langsung dari parameter permintaan.
 */
function validasiJalurChess(jalur) {
  const sah =
    typeof jalur === "string" &&
    (
      /^\/player\/[a-z0-9_-]{3,25}(?:\/stats)?$/.test(jalur) ||
      /^\/club\/[a-z0-9-]{1,60}\/members$/.test(jalur) ||
      jalur === "/puzzle" ||
      tanggalPuzzleSah(jalur)
    );
  if (!sah) {
    throw new GalatChess("Jalur API Chess.com tidak diizinkan.", { status: 400 });
  }
  return jalur;
}

async function ambilSekali(jalur) {
  // Tunggu giliran sesuai pembatas konkurensi
  await kunciKonkurensi();
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
    lepasKonkurensi();
  }
}

/**
 * GET ke Chess.com dengan coba ulang.
 * Mengembalikan { ada: false } untuk 404 (bukan galat — akun memang tak ada).
 */
export async function chessGet(
  jalur,
  { pakaiCache = true, cacheDetik = konfigurasi.chess.cacheDetik } = {}
) {
  jalur = validasiJalurChess(jalur);
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
        if (pakaiCache) keCache(jalur, hasil, cacheDetik);
        return hasil;
      }

      if (res.ok) {
        const data = await res.json();
        const hasil = { ada: true, status: res.status, data };
        if (pakaiCache) keCache(jalur, hasil, cacheDetik);
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

export const ambilProfil = (username, opsi) =>
  chessGet(`/player/${usernameUntukJalur(username)}`, opsi);

export const ambilStatistik = (username, opsi) =>
  chessGet(`/player/${usernameUntukJalur(username)}/stats`, opsi);

/**
 * Roster publik sebuah klub Chess.com. Respons berisi `weekly`, `monthly`,
 * dan `all_time`; penggabungan ketiganya dilakukan di klub.js.
 */
export const ambilAnggotaKlub = (slug, opsi) => {
  const namaKlub = String(slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{1,60}$/.test(namaKlub)) {
    throw new GalatChess("Slug klub Chess.com tidak valid.", { status: 400 });
  }
  return chessGet(`/club/${namaKlub}/members`, opsi);
};

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
        puncak: blok.best?.rating ?? null,
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
