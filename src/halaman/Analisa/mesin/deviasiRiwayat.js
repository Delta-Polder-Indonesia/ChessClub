/**
 * Ringkasan deviasi manusia untuk BANYAK partai sekaligus.
 *
 * `deviasiManusia.js` bekerja per partai; peninjau riwayat butuh satu angka
 * untuk seluruh sampel. Modul ini menjahit keduanya dan sengaja MURNI:
 * penyedia prediksi diserahkan pemanggil lewat `prediksi()`, jadi uji bisa
 * memakai tabel palsu tanpa ONNX 45 MB, dan layar bisa memakai Maia.
 *
 * Penggabungan memakai rata-rata BERBOBOT SAMPEL, bukan rata-rata dari
 * rata-rata: partai 40 langkah tidak boleh sama beratnya dengan partai 9
 * langkah seperti pada rata-rata biasa.
 */
import { hitungDeviasiManusia } from "./deviasiManusia.js";
import { uraiPgn } from "./uraiPgn.js";

const bulat2 = (angka) => Math.round(angka * 100) / 100;

/**
 * Ringkas deviasi manusia dari daftar partai.
 *
 * @param {object[]} daftar partai basis data — dibaca `pgn`-nya saja.
 * @param {object} opsi
 * @param {(moves: object[], konteks: {partai: object, indeks: number, sinyal?: AbortSignal}) => Promise<Map<string, object>>} opsi.prediksi
 *   penyedia `Map<fen, { [uci]: probabilitas }>` per partai. Wajib.
 * @param {(partai: object, indeks: number) => ("w"|"b"|null)} [opsi.warnaUntuk]
 *   warna pemain yang sedang ditinjau pada partai itu; `null` = nilai kedua
 *   pemain. Tanpa ini, langkah lawan ikut terhitung dan metrik kehilangan
 *   makna untuk menilai satu orang.
 * @param {number} [opsi.langkahMinimum] batas sampel per partai (lihat
 *   `hitungDeviasiManusia`).
 * @param {AbortSignal} [opsi.sinyal] pembatalan; hasil parsial tetap
 *   dikembalikan dengan `dibatalkan: true`.
 * @param {(progres: {ke: number, total: number}) => void} [opsi.onProgres]
 *   dipanggil setelah tiap partai selesai diproses.
 * @returns {Promise<{sampel: number, kejutanRata: number|null,
 *   rataPeringkatMaia: number|null, kejutanTinggi: number, partaiDinilai: number,
 *   partaiDilewati: number, dibatalkan: boolean}>}
 *   `sampel: 0` berarti belum ada partai yang layak dinilai.
 */
export async function ringkasDeviasiRiwayat(
  daftar,
  { prediksi, warnaUntuk = () => null, langkahMinimum, sinyal, onProgres } = {}
) {
  if (typeof prediksi !== "function") {
    throw new TypeError("ringkasDeviasiRiwayat butuh fungsi prediksi(moves, konteks)");
  }
  const partai = Array.isArray(daftar) ? daftar : [];
  const total = partai.length;
  const opsiMetrik = langkahMinimum === undefined ? {} : { langkahMinimum };

  let sampel = 0;
  let jumlahKejutan = 0;
  let jumlahPeringkat = 0;
  let sampelPeringkat = 0;
  let kejutanTinggi = 0;
  let partaiDinilai = 0;
  let partaiDilewati = 0;
  let dibatalkan = false;

  for (let i = 0; i < partai.length; i++) {
    if (sinyal?.aborted) {
      dibatalkan = true;
      break;
    }
    const moves = uraiPgn(partai[i]?.pgn);
    if (moves.length < 2) {
      partaiDilewati += 1;
      onProgres?.({ ke: i + 1, total });
      continue;
    }

    let peta;
    try {
      peta = await prediksi(moves, { partai: partai[i], indeks: i, sinyal });
    } catch (galat) {
      // Pembatalan di tengah inferensi bukan kegagalan: simpan hasil parsial.
      if (sinyal?.aborted) {
        dibatalkan = true;
        break;
      }
      throw galat;
    }
    if (sinyal?.aborted) {
      dibatalkan = true;
      break;
    }

    const metrik = hitungDeviasiManusia(moves, peta, {
      ...opsiMetrik,
      warna: warnaUntuk(partai[i], i),
    });
    if (!metrik) {
      partaiDilewati += 1;
      onProgres?.({ ke: i + 1, total });
      continue;
    }

    partaiDinilai += 1;
    sampel += metrik.sampel;
    jumlahKejutan += metrik.kejutanRata * metrik.sampel;
    kejutanTinggi += metrik.kejutanTinggi;
    if (Number.isFinite(metrik.rataPeringkatMaia)) {
      jumlahPeringkat += metrik.rataPeringkatMaia * metrik.sampel;
      sampelPeringkat += metrik.sampel;
    }
    onProgres?.({ ke: i + 1, total });
  }

  return {
    sampel,
    kejutanRata: sampel > 0 ? bulat2(jumlahKejutan / sampel) : null,
    rataPeringkatMaia:
      sampelPeringkat > 0 ? bulat2(jumlahPeringkat / sampelPeringkat) : null,
    kejutanTinggi,
    partaiDinilai,
    partaiDilewati,
    dibatalkan,
  };
}
