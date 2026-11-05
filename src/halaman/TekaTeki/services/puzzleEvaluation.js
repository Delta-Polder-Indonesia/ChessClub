/**
 * Perhitungan bilah evaluasi mesin — murni, tanpa React.
 * Dipisah dari komponen agar bisa diuji langsung (termasuk orientasi "b").
 */
export const BATAS_SKOR = [-400, 400];
export const BATAS_PERSEN = [5, 95];

/** Hitung persen isi putih + pihak yang unggul. Murni. */
export function hitungBilah({ cpPutih = 0, matePutih = null, orientasi = "w" } = {}) {
  const skor = matePutih !== null && matePutih !== undefined ? Number(matePutih) : Number(cpPutih);
  let persen;
  if (matePutih !== null && matePutih !== undefined) {
    persen = skor > 0 ? 100 : skor < 0 ? 0 : 50;
  } else {
    const mentah =
      ((skor - BATAS_SKOR[0]) * (BATAS_PERSEN[1] - BATAS_PERSEN[0])) /
        (BATAS_SKOR[1] - BATAS_SKOR[0]) +
      BATAS_PERSEN[0];
    persen = Math.min(Math.max(mentah, BATAS_PERSEN[0]), BATAS_PERSEN[1]);
  }
  const putihDiBawah = orientasi !== "b";
  return {
    persen,
    skor,
    putihDiBawah,
    unggul: putihDiBawah ? persen >= 50 : persen <= 50,
    adaMate: matePutih !== null && matePutih !== undefined,
  };
}

