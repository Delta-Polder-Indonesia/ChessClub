/**
 * Logika langkah yang dipakai bersama halaman Teka-teki (`TekaTeki.jsx`) dan
 * Rush Teka-teki (`TekaTekiRush.jsx`): mengurai langkah dari data soal dan
 * menerapkannya ke posisi.
 *
 * Kebijakan hasil sengaja tetap di masing-masing halaman — Teka-teki menerima
 * skakmat legal apa pun pada langkah penutup, Rush menuntut skor + nyawa.
 */
import { Chess } from "chess.js";

/** Langkah data "c4-c8" / "e7-e8q" → { from, to, promo }. */
export function parseLangkah(teks) {
  return {
    from: teks.slice(0, 2),
    to: teks.slice(3, 5),
    promo: teks.length > 5 ? teks[5] : null,
  };
}

/** Terapkan satu langkah ke posisi; bidak pion ke baris terakhir → promosi. */
export function terapkan(fen, { from, to, promo }) {
  const game = new Chess(fen);
  const opsi = { from, to };
  const bidak = game.get(from);
  if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
    opsi.promotion = promo || "q";
  }
  game.move(opsi);
  return game;
}

/**
 * Apakah langkah ini memindahkan pion ke baris terakhir — yaitu promosi wajib
 * yang bidaknya belum dipilih pemain?
 *
 * @returns {{ butuh: boolean, warna: "w" | "b" }}
 */
export function butuhPromosi(fen, from, to) {
  let butuh = false;
  let warna = "w";
  try {
    const bidak = new Chess(fen).get(from);
    if (bidak && bidak.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
      butuh = true;
      warna = bidak.color;
    }
  } catch {
    butuh = false;
  }
  return { butuh, warna };
}

/**
 * Apakah langkah from→to MENGHASILKAN skakmat pada posisi `fen`?
 *
 * Dipakai halaman Teka-teki untuk membedakan dua kegagalan yang berbeda bagi
 * pemain: langkah salah biasa vs skakmat alternatif (mate sah yang tidak
 * tercatat di data soal). Pemeriksaan ini murni pada posisi — tidak menyentuh
 * state halaman.
 *
 * @param {string} fen   posisi sebelum langkah
 * @param {{from: string, to: string, promo?: string|null}} langkah
 * @returns {boolean}
 */
export function apakahSkakmat(fen, { from, to, promo } = {}) {
  try {
    return terapkan(fen, { from, to, promo }).isCheckmate();
  } catch {
    return false;
  }
}

/**
 * Apakah langkah from→to legal pada posisi `fen`? Dipakai memisahkan bunyi
 * "tidak boleh" (langkah ilegal) dari "boleh tapi bukan solusinya".
 */
export function apakahLangkahLegal(fen, from, to) {
  try {
    return new Chess(fen)
      .moves({ square: from, verbose: true })
      .some((langkah) => langkah.to === to);
  } catch {
    return false;
  }
}

/**
 * Apakah langkah pemain sama dengan langkah solusi yang diharapkan?
 * Promosi di tengah varian harus memakai bidak yang sama dengan solusi;
 * pada langkah terakhir (`diharapkan.promo` kosong) bidak apa pun diterima.
 */
export function apakahLangkahSesuai(from, to, promo, diharapkan) {
  return (
    from === diharapkan.from &&
    to === diharapkan.to &&
    (!diharapkan.promo || promo === diharapkan.promo)
  );
}
