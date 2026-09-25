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

/**
 * Pecah teks yang mungkin memuat BEBERAPA partai PGN menjadi blok per partai.
 *
 * Dipakai dua tempat dengan kebutuhan berlawanan: analisis (`bacaPartaiPGN`)
 * mengambil blok PERTAMA (engine hanya bisa satu partai), sedangkan impor
 * basis data menyimpan SEMUANYA. Keduanya harus sepakat soal "di mana satu
 * partai berakhir" — kalau tidak, partai yang berhasil diimpor bisa gagal
 * dianalisis dan sebaliknya.
 *
 * Aturan: partai baru dimulai pada baris tag (`[Nama "nilai"]`) yang muncul
 * SETELAH teks langkah (movetext). Konsekuensinya:
 *   - ekspor chess.com/lichess (selalu ber-tag) terpecah dengan benar,
 *     termasuk jeda baris kosong dan CRLF khas Windows;
 *   - dua partai TANPA tag yang berurutan TIDAK bisa dipisahkan secara
 *     andal (tidak ada pembatasnya) dan diperlakukan sebagai satu blok —
 *     `chess.js` kemudian akan menolaknya sebagai PGN rusak, bukan
 *     menganalisis gabungan aneh diam-diam.
 *
 * @param {string} teks
 * @returns {string[]} blok per partai (tanpa blok kosong).
 */
export function pecahMultiPgn(teks) {
  if (typeof teks !== "string") return [];
  const baris = teks.replace(/\r\n?/g, "\n").split("\n");
  const blok = [];
  let kini = [];
  let adaMovetext = false;
  const siram = () => {
    const gabung = kini.join("\n").trim();
    if (gabung) blok.push(gabung);
    kini = [];
    adaMovetext = false;
  };
  for (const b of baris) {
    const tag = /^\s*\[[A-Za-z0-9_]+\s+"/.test(b);
    if (tag && adaMovetext) siram();
    if (!tag && b.trim()) adaMovetext = true;
    kini.push(b);
  }
  siram();
  return blok;
}

/**
 * Hash stabil (cyrb53, hex) dari isi PGN — dipakai sebagai ID baris impor
 * (`impor:<hash>`) supaya berkas yang sama yang diimpor ulang MENIMPA baris
 * yang sama, bukan menggandakan. Teks dinormalisasi dulu (CRLF, spasi
 * tepi) supaya berkas yang sama dari Windows/Unix menghasilkan ID sama.
 */
export function hashPgn(pgn) {
  const teks = String(pgn ?? "").replace(/\r\n?/g, "\n").trim();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < teks.length; i++) {
    const ch = teks.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
