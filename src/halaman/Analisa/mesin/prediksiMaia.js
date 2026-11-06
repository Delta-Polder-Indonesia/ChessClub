/**
 * Penyedia prediksi "manusia rating X" untuk metrik deviasi anti-cheat.
 *
 * Ini adalah sambungan yang selama ini kosong: `mesin/deviasiManusia.js`
 * sudah menghitung kejutan & peringkat langkah terhadap distribusi manusia,
 * tetapi belum ada yang mengisinya. Modul ini mengisi `Map<fen, {uci: p}>`
 * itu dari model Maia (ONNX, lewat `lib/mesinMaia.js`).
 *
 * Kontrak kuncinya HALUS dan mudah salah — sengaja dijaga uji:
 *
 *   `hitungDeviasiManusia` menilai langkah `moves[i]` memakai
 *   `prediksi.get(moves[i - 1].fen)`, yaitu FEN **sesudah** langkah
 *   sebelumnya — sama dengan posisi SEBELUM langkah yang dinilai. Jadi yang
 *   diminta ke Maia adalah posisi *sebelum* tiap langkah pemain, bukan
 *   sesudahnya. Memakai `moves[i].fen` akan menggeser seluruh penilaian satu
 *   langkah dan menghasilkan kejutan yang salah tanpa galat apa pun.
 *
 * Bentuk keluaran Maia (`inferensi` → `kebijakan`) memang sudah
 * `{ [uci]: probabilitas }`, sama seperti yang diharapkan `deviasiManusia.js`,
 * jadi tidak ada penerjemahan bentuk di sini.
 *
 * Modul ini murni: tidak menyentuh React, tidak mengunduh model, dan tidak
 * membuat worker sendiri. Pemanggil menyerahkan `mesin` (instance
 * `MesinMaia`); uji memakai mesin tiruan sehingga tidak perlu ONNX 45 MB.
 * Dengan begitu integrasi UI bisa menyusul tanpa mengubah berkas ini.
 */
import { hitungDeviasiManusia } from "./deviasiManusia.js";

/** Jumlah posisi per panggilan inferensi — dibatasi supaya tensor tidak meledak. */
export const UKURAN_BATCH_MAIA = 32;

/**
 * Posisi yang benar-benar akan ditanyakan `hitungDeviasiManusia`.
 *
 * Hanya `moves[i]` yang punya `uci` dan `san` yang bisa dinilai, dan posisi
 * yang dibutuhkan adalah `moves[i - 1].fen`. Hasilnya diurutkan sesuai
 * kemunculan pertama dan dideduplikasi: satu posisi cukup diinferensi sekali
 * walau muncul berkali-kali (pengulangan langkah).
 *
 * @param {object[]} moves hasil `parsePGN()`
 * @returns {string[]} FEN unik, tanpa nilai kosong
 */
export function posisiUntukPrediksi(moves) {
  if (!Array.isArray(moves)) return [];
  const dilihat = new Set();
  const daftar = [];
  for (let i = 1; i < moves.length; i++) {
    const langkah = moves[i];
    if (!langkah?.uci || !langkah?.san) continue;
    const fen = moves[i - 1]?.fen;
    if (!fen || typeof fen !== "string") continue;
    if (dilihat.has(fen)) continue;
    dilihat.add(fen);
    daftar.push(fen);
  }
  return daftar;
}

/**
 * Bangun `Map<fen, kebijakan>` untuk satu partai dari mesin Maia.
 *
 * @param {object[]} moves hasil `parsePGN()`
 * @param {{
 *   mesin: { inferensi: (daftarFen: string[], opsi?: object) => Promise<object[]> },
 *   rating?: number|number[],
 *   ratingLawan?: number|number[]|null,
 *   ukuranBatch?: number,
 *   sinyal?: AbortSignal,
 * }} opsi `mesin` wajib; sisanya diteruskan apa adanya ke `inferensi`.
 * @returns {Promise<Map<string, Record<string, number>>>} peta parsial bila
 *   `sinyal` dibatalkan di tengah jalan (bukan galat — pemanggil yang
 *   memutuskan apakah sisa posisi masih perlu dikejar).
 */
export async function prediksiManusia(
  moves,
  { mesin, rating, ratingLawan, ukuranBatch = UKURAN_BATCH_MAIA, sinyal } = {}
) {
  if (!mesin || typeof mesin.inferensi !== "function") {
    throw new TypeError("prediksiManusia: `mesin` harus punya metode inferensi()");
  }

  const daftar = posisiUntukPrediksi(moves);
  const peta = new Map();
  const angkaBatch = Number(ukuranBatch);
  const ukuran = Number.isFinite(angkaBatch) && angkaBatch >= 1 ? Math.floor(angkaBatch) : UKURAN_BATCH_MAIA;

  for (let mulai = 0; mulai < daftar.length; mulai += ukuran) {
    if (sinyal?.aborted) break;
    const bagian = daftar.slice(mulai, mulai + ukuran);
    const hasil = await mesin.inferensi(bagian, { rating, ratingLawan });
    bagian.forEach((fen, urutan) => {
      const kebijakan = hasil?.[urutan]?.kebijakan;
      if (kebijakan && typeof kebijakan === "object") peta.set(fen, kebijakan);
    });
  }

  return peta;
}

/**
 * Jalur lengkap: prediksi Maia → metrik deviasi manusia.
 *
 * @param {object[]} moves hasil `parsePGN()`
 * @param {object} opsi opsi `prediksiManusia` + `langkahMinimum` untuk
 *   `hitungDeviasiManusia`.
 * @returns {Promise<object|null>} `null` bila sampel tidak cukup — sama
 *   seperti `hitungDeviasiManusia`.
 */
export async function deviasiManusiaDariMaia(moves, { langkahMinimum, ...opsi } = {}) {
  const prediksi = await prediksiManusia(moves, opsi);
  return hitungDeviasiManusia(moves, prediksi, { langkahMinimum });
}
