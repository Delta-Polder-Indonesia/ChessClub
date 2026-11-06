/**
 * "Titipan" PGN sekali pakai dari halaman Teka-Teki ke papan Analisa.
 *
 * Tombol **Analisa** pada teka-teki menitipkan PGN partainya lewat
 * `sessionStorage`, lalu berpindah rute ke `/program-kami/analisa/papan`.
 * Kunci dan cara bacanya ditaruh di satu tempat supaya penulis (Teka-Teki) dan
 * pembaca (Analisa) tidak bisa berbeda diam-diam.
 */

export const KUNCI_PGN_TITIPAN = "kci-analisa-impor-awal";

/** `true` bila ada PGN yang menunggu dibaca — dibaca TANPA menghapus. */
export function adaPgnTitipan() {
  try {
    return Boolean(sessionStorage.getItem(KUNCI_PGN_TITIPAN));
  } catch {
    return false;
  }
}

/**
 * Ambil PGN titipan lalu hapus (sekali pakai). Mengembalikan string kosong
 * bila tidak ada atau penyimpanan tidak dapat diakses.
 */
export function ambilPgnTitipan() {
  try {
    const pgn = sessionStorage.getItem(KUNCI_PGN_TITIPAN) || "";
    if (pgn) sessionStorage.removeItem(KUNCI_PGN_TITIPAN);
    return pgn;
  } catch {
    return "";
  }
}
