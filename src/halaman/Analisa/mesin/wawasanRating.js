/**
 * Wawasan rating: ringkasan kekuatan dan kelemahan SATU pemain dalam satu
 * partai yang sudah dianalisis, dibagi per fase (pembukaan, menengah, akhir).
 *
 * Yang dihitung hanya dari data yang sudah ada di Analisa: anotasi per langkah
 * (`anotasiMove`, dari akurasi.js) dan akurasi per langkah (`akurasiMove`).
 * Fase memakai aturan yang sama dengan panel Akurasi dan Deteksi Engine
 * (fase.js), termasuk kontrak urutannya: langkah dicatat ke fase yang aktif
 * dulu, baru fasenya dimajukan.
 *
 * Murni: tanpa React, DOM, atau jaringan. Teks untuk pengguna dibuat di UI
 * lewat i18n, bukan di sini.
 */
import { anotasiMove, akurasiMove, cpBaku, pemainDariEntri, rataHarmonik } from "./akurasi.js";
import { DAFTAR_FASE, FASE_PEMBUKAAN, faseBerikutnya, papanDariFen } from "./fase.js";

/** Fase dengan langkah lebih sedikit dari ini tidak dinilai sebagai kelemahan/kekuatan. */
export const MIN_LANGKAH_FASE = 5;

/** Anotasi yang dihitung sebagai kesalahan. */
const ANOTASI_BLUNDER = "??";
const ANOTASI_KESALAHAN = "?";
const ANOTASI_DIRAGUKAN = "?!";

function kosongFase() {
  return { jumlah: 0, akurasiList: [], blunder: 0, kesalahan: 0, diragukan: 0 };
}

function catatLangkah(acc, anotasi, akurasi) {
  acc.jumlah += 1;
  if (Number.isFinite(akurasi)) acc.akurasiList.push(akurasi);
  if (anotasi === ANOTASI_BLUNDER) acc.blunder += 1;
  else if (anotasi === ANOTASI_KESALAHAN) acc.kesalahan += 1;
  else if (anotasi === ANOTASI_DIRAGUKAN) acc.diragukan += 1;
}

function ringkasFase(acc) {
  const kesalahan = acc.blunder + acc.kesalahan;
  return {
    jumlah: acc.jumlah,
    akurasi: rataHarmonik(acc.akurasiList),
    blunder: acc.blunder,
    kesalahan: acc.kesalahan,
    diragukan: acc.diragukan,
    // Laju kesalahan berat (blunder + mistake) per langkah, 0..1.
    lajuKesalahan: acc.jumlah ? kesalahan / acc.jumlah : null,
  };
}

/**
 * Hitung wawasan untuk satu warna pada satu partai.
 *
 * @param {object[]} moves  daftar langkah `parsePGN` (sama dengan panel Analisa)
 * @param {"w"|"b"} warna   warna pemain yang dinilai
 * @returns {{
 *   jumlahLangkah: number,
 *   perFase: Record<string, ReturnType<typeof ringkasFase>>,
 *   total: ReturnType<typeof ringkasFase>,
 *   kelemahan: string|null,
 *   kekuatan: string|null,
 * }}
 *   `kelemahan` = fase dengan laju kesalahan berat tertinggi,
 *   `kekuatan`  = fase dengan akurasi tertinggi. Keduanya null bila tidak
 *   ada fase yang punya cukup langkah (`MIN_LANGKAH_FASE`).
 */
export function wawasanPemain(moves, warna) {
  const daftar = Array.isArray(moves) ? moves : [];
  const akumFase = Object.fromEntries(DAFTAR_FASE.map((f) => [f, kosongFase()]));
  const akumTotal = kosongFase();
  let fase = FASE_PEMBUKAAN;

  for (let i = 0; i < daftar.length; i += 1) {
    const move = daftar[i];
    // Kontrak urutan: catat dulu ke fase aktif, baru majukan fase.
    if (pemainDariEntri(move, i) === warna) {
      const anotasi = anotasiMove(move, daftar[i - 1]?.kandidat, cpBaku(move.previousStaticEvals?.[2], false));
      const akurasi = akurasiMove(move);
      catatLangkah(akumFase[fase], anotasi, akurasi);
      catatLangkah(akumTotal, anotasi, akurasi);
    }
    if (move?.fen) fase = faseBerikutnya(fase, papanDariFen(move.fen));
  }

  const perFase = Object.fromEntries(DAFTAR_FASE.map((f) => [f, ringkasFase(akumFase[f])]));
  const layak = DAFTAR_FASE.filter((f) => perFase[f].jumlah >= MIN_LANGKAH_FASE);

  let kelemahan = null;
  let kekuatan = null;
  if (layak.length > 0) {
    // Seri dimenangkan fase yang lebih awal (urutan DAFTAR_FASE), supaya hasilnya stabil.
    const laju = (f) => perFase[f].lajuKesalahan;
    const akurasi = (f) => perFase[f].akurasi ?? -1;
    const terburuk = layak.reduce((a, b) => (laju(b) > laju(a) ? b : a));
    const terbaik = layak.reduce((a, b) => (akurasi(b) > akurasi(a) ? b : a));
    kelemahan = laju(terburuk) > 0 ? terburuk : null;
    kekuatan = terbaik;
  }

  return {
    jumlahLangkah: akumTotal.jumlah,
    perFase,
    total: ringkasFase(akumTotal),
    kelemahan,
    kekuatan,
  };
}
