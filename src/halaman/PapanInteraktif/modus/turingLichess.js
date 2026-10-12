/**
 * Impor partai PGN dari Lichess untuk Turing test.
 *
 * Murni sejauh mungkin: validasi nama pengguna dan pembangun URL tidak
 * menyentuh jaringan. Pemanggilan `fetch` disuntikkan lewat `fetchFn` supaya
 * skrip Node bisa menguji alur galat tanpa internet.
 *
 * Endpoint dan parameter mengikuti `muatPartaiLichessInti` di
 * src/halaman/Analisa/akun/muatPartaiAkun.js, tetapi memakai PGN mentah
 * (`pgnInJson=false`, `moves=true`) karena Turing test hanya butuh langkah.
 */

/** Nama pengguna Lichess: huruf, angka, `_`, `-`; 2–30 karakter. */
export const POLA_NAMA_LICHESS = /^[A-Za-z0-9_-]{2,30}$/;

/** Batas partai per impor. Cukup untuk ratusan posisi, tetap ringan di browser. */
export const MAKS_PARTAI_IMPOR = 30;

/** Kode galat yang dipetakan ke kunci i18n di UI. */
export const GALAT_IMPOR = Object.freeze({
  namaTidakSah: "nama-tidak-sah",
  tidakDitemukan: "tidak-ditemukan",
  batasTercapai: "batas-tercapai",
  jaringan: "jaringan",
  kosong: "kosong",
});

export class GalatImporLichess extends Error {
  constructor(kode) {
    super(kode);
    this.name = "GalatImporLichess";
    this.kode = kode;
  }
}

/**
 * Bentuk URL unduhan partai untuk satu pengguna.
 * @throws {GalatImporLichess} bila nama pengguna tidak sah.
 */
export function urlPartaiLichess(username, maks = MAKS_PARTAI_IMPOR) {
  const nama = String(username || "").trim();
  if (!POLA_NAMA_LICHESS.test(nama)) throw new GalatImporLichess(GALAT_IMPOR.namaTidakSah);
  const params = new URLSearchParams({
    moves: "true",
    pgnInJson: "false",
    clocks: "false",
    evals: "false",
    opening: "false",
    sort: "dateDesc",
    max: String(Math.min(MAKS_PARTAI_IMPOR, Math.max(1, Number(maks) || MAKS_PARTAI_IMPOR))),
  });
  return `https://lichess.org/api/games/user/${encodeURIComponent(nama)}?${params.toString()}`;
}

/**
 * Ambil PGN partai pengguna Lichess sebagai teks.
 *
 * @param {string} username
 * @param {{ fetchFn?: typeof fetch, signal?: AbortSignal, maks?: number }} [opsi]
 * @returns {Promise<string>} teks PGN (satu atau lebih partai)
 * @throws {GalatImporLichess}
 */
export async function ambilPgnLichess(username, { fetchFn = fetch, signal, maks } = {}) {
  const url = urlPartaiLichess(username, maks);
  let respons;
  try {
    respons = await fetchFn(url, { headers: { Accept: "application/x-chess-pgn" }, signal });
  } catch (galat) {
    if (galat?.name === "AbortError") throw galat;
    throw new GalatImporLichess(GALAT_IMPOR.jaringan);
  }
  if (respons.status === 404) throw new GalatImporLichess(GALAT_IMPOR.tidakDitemukan);
  if (respons.status === 429) throw new GalatImporLichess(GALAT_IMPOR.batasTercapai);
  if (!respons.ok) throw new GalatImporLichess(GALAT_IMPOR.jaringan);
  const teks = (await respons.text()).trim();
  if (!teks) throw new GalatImporLichess(GALAT_IMPOR.kosong);
  return teks;
}
