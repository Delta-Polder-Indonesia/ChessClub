/**
 * Pengurai PGN ringan: hanya langkah, tanpa mesin.
 *
 * `parsePGN()` di `engine.js` sengaja tidak dipakai di sini karena ia menuntut
 * Stockfish siap dan mengevaluasi setiap posisi — puluhan detik untuk satu
 * partai. Metrik distribusi manusia hanya butuh daftar langkah (`san`, `uci`,
 * `fen`, `color`), jadi cukup chess.js.
 *
 * Bentuk keluaran sengaja meniru `parsePGN()` supaya modul hilir
 * (`deviasiManusia.js`) tidak peduli asal datanya:
 *  - `moves[0]` adalah posisi awal, tanpa `san`/`uci`;
 *  - tiap entri berikutnya membawa `fen` HASIL langkah dan `color` giliran
 *    BERIKUTNYA (jadi pemain yang melangkah adalah kebalikan `color`).
 */
import { Chess } from "chess.js";

const AKHIR_PERMAINAN = new Set(["1-0", "0-1", "1/2-1/2", "*"]);

/** FEN awal dari tag `[FEN "..."]`, atau null bila PGN mulai dari posisi standar. */
function fenAwal(teks) {
  const cocok = /\[\s*FEN\s+"([^"]+)"\s*\]/i.exec(teks);
  return cocok ? cocok[1].trim() : null;
}

/** Buang variasi dalam kurung (boleh bersarang) — variasi bukan langkah utama. */
function tanpaVariasi(teks) {
  let keluar = "";
  let kedalaman = 0;
  for (const huruf of teks) {
    if (huruf === "(") kedalaman += 1;
    else if (huruf === ")") {
      if (kedalaman > 0) kedalaman -= 1;
    } else if (kedalaman === 0) keluar += huruf;
  }
  return keluar;
}

/**
 * Token SAN dari teks PGN: tanpa tag, komentar, variasi, nomor langkah, NAG,
 * dan penanda hasil.
 *
 * @param {string} teks PGN mentah.
 * @returns {string[]} daftar SAN berurutan.
 */
export function daftarSan(teks) {
  if (typeof teks !== "string" || !teks.trim()) return [];
  const tanpaTag = teks
    .split(/\r?\n/)
    .filter((baris) => !/^\s*\[/.test(baris))
    .join(" ");
  const tanpaKomentar = tanpaTag
    .replace(/\{[^}]*\}/g, " ")
    .replace(/;[^\n]*/g, " ");
  const utama = tanpaVariasi(tanpaKomentar);
  return utama
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token)
    .filter((token) => !AKHIR_PERMAINAN.has(token))
    // "12." / "12..." / "12" — nomor langkah
    .filter((token) => !/^\d+\.*$/.test(token))
    // "$1" — NAG numerik
    .filter((token) => !/^\$\d+/.test(token))
    // sisa ganjil seperti "e.p." atau "..." diabaikan
    .filter((token) => !/^\.+$/.test(token) && !/^e\.p\.$/i.test(token));
}

/**
 * Urai PGN menjadi daftar langkah tanpa mesin.
 *
 * Langkah yang tidak bisa diterapkan menghentikan penguraian dan hasil
 * sebelumnya dikembalikan apa adanya — PGN pihak ketiga sering memuat varian
 * atau anotasi yang tidak sah, dan kehilangan ekor partai jauh lebih baik
 * daripada membuang seluruh partai.
 *
 * @param {string} pgn teks PGN.
 * @returns {Array<{san?: string, uci?: string, fen: string, color: string}>}
 *   `[]` bila PGN kosong atau posisi awalnya tidak sah.
 */
export function uraiPgn(pgn) {
  if (typeof pgn !== "string" || !pgn.trim()) return [];
  const awal = fenAwal(pgn);
  let papan;
  try {
    papan = awal ? new Chess(awal) : new Chess();
  } catch {
    return [];
  }

  const moves = [{ fen: papan.fen(), color: papan.turn() }];
  for (const san of daftarSan(pgn)) {
    let langkah;
    try {
      langkah = papan.move(san, { sloppy: true });
    } catch {
      break;
    }
    if (!langkah) break;
    moves.push({
      san: langkah.san,
      uci: `${langkah.from}${langkah.to}${langkah.promotion ?? ""}`,
      fen: papan.fen(),
      color: papan.turn(),
    });
  }
  return moves;
}
