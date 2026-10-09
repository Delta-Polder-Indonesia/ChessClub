import { hitungPlyPgn } from "../../../../../lib/pgnRingan.js";

/** Kunci pesan galat (lihat kamus analisa.partai.*) — dipakai juga oleh halaman Lichess. */
export const GAMES_ERROR = ["analisa.partai.galatJaringan", "analisa.partai.galatJaringanIsi"];
export const USER_ERROR = ["analisa.partai.galatPengguna", "analisa.partai.galatPenggunaIsi"];
export const API_BLOCKING_ERROR = ["analisa.partai.galatBatas", "analisa.partai.galatBatasIsi"];

/** Nama bulan lewat Intl: mengikuti bahasa antarmuka, jadi tidak perlu tabel manual. */
export function getMonthName(month, locale = "id") {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, month - 1, 1));
}

export function capitalizeFirst(string) {
  return string[0].toUpperCase() + string.substring(1).toLowerCase();
}

/** Format tanggal penuh singkat: 12 Agu 2026 (atau 12 Aug 2026 dalam EN). */
export function formatTanggal(timestamp, locale) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

/** Ubah satu objek partai mentah Chess.com jadi baris tabel yang aman. */
export function olahPartaiChessCom(game) {
  const pgn = typeof game?.pgn === "string" ? game.pgn : "";
  if (!pgn) return null;
  /*
   * Jumlah langkah dihitung RINGAN dari teks PGN (lihat lib/pgnRingan.js).
   * Dulu memakai `new Chess().loadPgn(pgn)` untuk SETIAP partai pada seluruh
   * akun — menyusun ulang seluruh papan untuk ribuan partai hanya untuk
   * angka di kolom "Langkah". Itu penyebab pemuatan terasa berat.
   */
  let plyCount = hitungPlyPgn(pgn);
  if (Number.isNaN(plyCount) || plyCount <= 0) return null;
  const putih = game.white ?? {};
  const hitam = game.black ?? {};
  let hasil = "draw";
  if (putih.result === "win") hasil = "white";
  else if (hitam.result === "win") hasil = "black";
  const endTime = typeof game.end_time === "number" ? game.end_time : 0;
  return {
    pgn,
    whiteName: putih.username ?? "",
    blackName: hitam.username ?? "",
    whiteElo: putih.rating ?? 0,
    blackElo: hitam.rating ?? 0,
    result: hasil,
    timestamp: endTime * 1e3,
    timeClass: game.time_class ?? "unknown",
    plyCount,
  };
}

export function nilaiHasil(gameInfo) {
  if (gameInfo.result === "white") return 1;
  if (gameInfo.result === "black") return -1;
  return 0;
}
