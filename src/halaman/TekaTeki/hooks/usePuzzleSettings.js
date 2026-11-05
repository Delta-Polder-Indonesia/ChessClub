/**
 * Preferensi tampilan halaman Teka-Teki: set bidak, tema papan, lanjut
 * otomatis, dan "Ingat posisi".
 *
 * Semua pembacaan/penulisan penyimpanan lewat `services/puzzleStorage.js`.
 * Penulisan dilakukan di efek (bukan di dalam handler) supaya tidak ada efek
 * samping tersembunyi saat handler dipanggil berulang.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { DAFTAR_SET } from "../../../components/chess/pemuatBidak.js";
import { PILIHAN_WARNA_PAPAN } from "../../../lib/pilihanPapan.js";
import {
  bacaIngatPosisi,
  bacaOtomatis,
  bacaSetBidak,
  bacaWarnaPapan,
  simpanIngatPosisi,
  simpanOtomatis,
  simpanSetBidak,
  simpanWarnaPapan,
} from "../services/puzzleStorage.js";

const ID_SET = DAFTAR_SET.map((s) => s.id);
const ID_WARNA = PILIHAN_WARNA_PAPAN.map(([nilai]) => nilai);

/** Penulisan preferensi hanya setelah nilai berubah dari keadaan awal. */
function useSimpanSaatBerubah(nilai, simpan) {
  const pertama = useRef(true);
  useEffect(() => {
    if (pertama.current) {
      pertama.current = false;
      return;
    }
    simpan(nilai);
  }, [nilai, simpan]);
}

/**
 * @param {object} opsi
 * @param {Function} opsi.setIngatPosisi setter "Ingat posisi" dari sesi
 * @param {boolean} opsi.ingatPosisi nilai "Ingat posisi" dari sesi
 */
export function usePuzzleSettings({ ingatPosisi, setIngatPosisi }) {
  const [setBidak, setSetBidak] = useState(() => bacaSetBidak(ID_SET));
  const [warnaPapan, setWarnaPapan] = useState(() => bacaWarnaPapan(ID_WARNA));
  const [otomatis, setOtomatis] = useState(bacaOtomatis);

  useSimpanSaatBerubah(setBidak, simpanSetBidak);
  useSimpanSaatBerubah(warnaPapan, simpanWarnaPapan);
  useSimpanSaatBerubah(otomatis, simpanOtomatis);

  const ubahIngatPosisi = useCallback(
    (nilai) => {
      setIngatPosisi(nilai);
      simpanIngatPosisi(nilai);
    },
    [setIngatPosisi]
  );

  // Nilai awal "Ingat posisi" dibaca sekali dari penyimpanan (lewat sesi).
  const ingatAwal = useRef(null);
  if (ingatAwal.current === null) ingatAwal.current = bacaIngatPosisi();

  return {
    setBidak,
    setSetBidak,
    warnaPapan,
    setWarnaPapan,
    otomatis,
    setOtomatis,
    ingatPosisi,
    setIngatPosisi: ubahIngatPosisi,
    ingatPosisiAwal: ingatAwal.current,
  };
}
