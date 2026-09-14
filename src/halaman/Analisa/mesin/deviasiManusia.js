/**
 * Fondasi metrik deviasi dari baseline manusia — siap-Maia.
 *
 * IDE (roadmap fase 3): bandingkan setiap langkah pemain dengan prediksi
 * "manusia rating X" dari model Maia (ONNX). Pemakai engine menimbulkan
 * KEJUTAN besar terhadap distribusi manusia sambil tetap menempel pada
 * Stockfish; manusia jujur kebalikannya. Modul ini MENYEDIAKAN perhitungan
 * metriknya secara murni; penyedia prediksinya (unduh model +
 * onnxruntime-web + peta langkah) menyusul lewat roadmap — semua input
 * berupa `Map<fen, { [uci]: probabilitas 0..1 }>` sehingga ANY provider
 * (Maia 2, Maia 3, atau tabel statistik buatan sendiri) bisa dipasang tanpa
 * mengubah kode di sini, dan tanpa menyentuh `parsePGN`.
 *
 * Metrik (null bila sampel tidak cukup / prediksi tidak ada):
 *  - `kejutanRata`   — rata-rata −log₂ p(langkah pemain) dalam BIT.
 *    Kecil (≈2–4) = langkah wajar menurut manusia; besar (>8) = langkah
 *    yang jarang dipilih manusia.
 *  - `rataPeringkatMaia` — peringkat rata-rata langkah pemain menurut
 *    distribusi manusia (1 = pilihan teratas manusia).
 *  - `kejutanTinggi` — jumlah langkah dengan kejutan > 10 bit (sangat
 *    tidak-manusiawi), untuk ditinjau satu per satu.
 */

/** Ambang "sangat tidak-manusiawi" dalam bit kejutan. */
export const AMBANG_KEJUTAN_BIT = 10;

/** Probabilitas minimum supaya −log₂ tidak meledak pada langkah di luar policy. */
const PROB_MINIMUM = 1e-9;

function kejutanBit(p) {
  const q = Number.isFinite(p) && p > 0 ? p : PROB_MINIMUM;
  return -Math.log2(Math.min(1, q));
}

/**
 * Hitung deviasi pemain terhadap distribusi manusia.
 *
 * @param {object[]} moves array hasil `parsePGN()` — membaca `san`, `uci`,
 *   `fen` (posisi HASIL langkah) dan `color` (giliran berikutnya) dengan
 *   pola yang sama seperti `mesin/antiCheat.js`: prediksi untuk langkah pada
 *   `moves[i]` berada di `prediksi.get(moves[i - 1]?.fen)` (posisi SEBELUM).
 * @param {Map<string, object>} prediksi Map fen → `{ [uci]: probabilitas }`.
 * @param {{ langkahMinimum?: number }} [opsi] batas sampel minimum
 *   (bawaan 8) sebelum metrik dianggap layak dilaporkan.
 * @returns {{ sampel: number, kejutanRata: number|null,
 *   rataPeringkatMaia: number|null, kejutanTinggi: number }|null}
 */
export function hitungDeviasiManusia(moves, prediksi, { langkahMinimum = 8 } = {}) {
  if (!(prediksi instanceof Map) || !Array.isArray(moves)) return null;

  const kejutan = [];
  const peringkat = [];
  for (let i = 1; i < moves.length; i++) {
    const langkah = moves[i];
    if (!langkah?.uci || !langkah?.san) continue;
    const distribusi = prediksi.get(moves[i - 1]?.fen);
    if (!distribusi || typeof distribusi !== "object") continue;
    const p = distribusi[langkah.uci];
    if (!Number.isFinite(p)) continue;
    kejutan.push(kejutanBit(p));
    // Peringkat langkah pemain menurut distribusi manusia: jumlah langkah
    // dengan probabilitas LEBIH BESAR (seri dihitung setelahnya) + 1.
    let atasan = 0;
    for (const prob of Object.values(distribusi)) {
      if (Number.isFinite(prob) && prob > p) atasan++;
    }
    peringkat.push(atasan + 1);
  }

  if (kejutan.length < langkahMinimum) return null;
  const rata = (daftar) => daftar.reduce((a, b) => a + b, 0) / daftar.length;
  return {
    sampel: kejutan.length,
    kejutanRata: Math.round(rata(kejutan) * 100) / 100,
    rataPeringkatMaia: peringkat.length ? Math.round(rata(peringkat) * 100) / 100 : null,
    kejutanTinggi: kejutan.filter((x) => x > AMBANG_KEJUTAN_BIT).length,
  };
}
