/**
 * Hitung jumlah langkah (ply) dari teks PGN secara RINGAN.
 *
 * Untuk menampilkan daftar partai (tabel) kita hanya butuh satu angka:
 * berapa langkah partai itu. Melakukan hal itu lewat `new Chess().loadPgn()`
 * berarti menyusun ulang seluruh papan + aturan catur untuk SETIAP partai
 * (ribuan kali saat memuat seluruh akun), padahal yang tampil hanya angka.
 *
 * Fungsi ini menghitung jumlah ply langsung dari teks PGN tanpa simulasi
 * papan: buang header, komentar `{...}`, ragam `(...)`, NAG `$n`, dan token
 * nomor langkah, lalu hitung sisa token SAN. Cukup akurat untuk kolom
 * "Langkah" pada tabel (chess.com / Lichess selalu memproduksi PGN yang rapi).
 */

function hilangkanKurung(s) {
  let out = "";
  let dalam = 0;
  for (const ch of s) {
    if (ch === "(") {
      dalam++;
      continue;
    }
    if (ch === ")") {
      if (dalam > 0) dalam--;
      continue;
    }
    if (dalam === 0) out += ch;
  }
  return out;
}

/** Ambil movetext PGN (buang header tag pair) dan bersihkan artefak. */
function movetextBersih(pgn) {
  return pgn
    .replace(/\[[^\]]*\]/g, " ") // header tag pairs [Key "val"]
    .replace(/\{[^{}]*\}/g, " ") // komentar { ... }
    .replace(/\$\d+/g, " ") // NAG $1, $2, ...
    .replace(/\s+/g, " ");
}

/**
 * Hitung jumlah langkah (ply). Mengembalikan 0 bila tidak bisa dihitung.
 * @param {string} pgn
 * @returns {number}
 */
export function hitungPlyPgn(pgn) {
  if (typeof pgn !== "string" || !pgn) return 0;
  const teks = hilangkanKurung(movetextBersih(pgn));
  const token = teks
    .split(/\s+/)
    .map((t) => t.replace(/,$/, "")) // beberapa PGN memakai koma antar-langkah
    .filter(
      (t) =>
        t &&
        !/^\d+\.[.]*$/.test(t) && // nomor langkah: 1. 2. 12...
        !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t) // penanda hasil
    );
  return token.length;
}
