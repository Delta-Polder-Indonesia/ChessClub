import { Chess } from "chess.js";

/**
 * Petak raja yang TERMAT pada posisi `fen`, atau `null` bila posisi itu bukan
 * skakmat. Yang termat adalah sisi yang sedang giliran bergerak (raja mereka
 * diserang dan tidak ada langkah legal tersisa).
 *
 * Dipakai papan teka-teki & papan interaktif untuk memasang lencana skakmat
 * di atas raja lawan.
 *
 * @param {string} fen posisi papan
 * @returns {string|null} petak raja (mis. "e8") atau null
 */
export function petakRajaTermat(fen) {
  if (!fen) return null;
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return null;
  }
  try {
    if (!game.isCheckmate()) return null;
    const korban = game.turn();
    for (const baris of game.board()) {
      for (const kotak of baris) {
        if (kotak && kotak.type === "k" && kotak.color === korban) return kotak.square;
      }
    }
  } catch {
    /* posisi tak terbaca — anggap bukan skakmat */
  }
  return null;
}

/**
 * Petak raja PEMENANG pada posisi `fen`, atau `null` bila posisi itu bukan
 * skakmat. Pemenang adalah sisi yang TIDAK sedang giliran bergerak (mereka
 * baru saja memberi skakmat; raja pemenang dipasangi mahkota hijau).
 *
 * Dipakai papan teka-teki untuk memasang lencana mahkota pemenang, serasi
 * dengan halaman Analisa (ikon `victory` di atas raja pemenang).
 *
 * @param {string} fen posisi papan
 * @returns {string|null} petak raja (mis. "e1") atau null
 */
export function petakRajaPemenang(fen) {
  if (!fen) return null;
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return null;
  }
  try {
    if (!game.isCheckmate()) return null;
    const pemenang = game.turn() === "w" ? "b" : "w";
    for (const baris of game.board()) {
      for (const kotak of baris) {
        if (kotak && kotak.type === "k" && kotak.color === pemenang) {
          return kotak.square;
        }
      }
    }
  } catch {
    /* posisi tak terbaca — anggap bukan skakmat */
  }
  return null;
}
