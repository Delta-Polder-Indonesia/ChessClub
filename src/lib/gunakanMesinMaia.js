/**
 * Pengait React untuk mesin Maia 3 (mode Manusia vs Mesin).
 *
 * Tugasnya hanya menjembatani `MesinMaia` (bukan React) ke siklus render:
 * meneruskan status/kemajuan unduhan ke state, dan menyediakan satu fungsi
 * `mintaLangkah` yang sudah membawa rating pilihan pemain. Tidak ada logika
 * catur di sini — semua ada di `maia3.js` dan `mesinMaia.js`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { RATING_BAKU } from "./maia3.js";
import { STATUS_MAIA, ambilMesinMaia } from "./mesinMaia.js";

/**
 * Nama berkas mengikuti kebiasaan repo (`gunakan…`), tetapi nama EKSPOR-nya
 * berawalan `use` — aturan `react-hooks/rules-of-hooks` menolak pengait yang
 * tidak berawalan "use", sama seperti `gunakanEngineCatur.js` yang
 * mengekspor `useEngineCatur`.
 *
 * @param {{rating?: number, ratingLawan?: number}} [opsi]
 *   `rating` dipakai untuk kedua belah pihak bila `ratingLawan` tidak diisi —
 *   Maia 3 butuh rating lawan sebagai masukan, dan lawan sesama rating adalah
 *   keadaan yang paling masuk akal untuk partai latihan.
 * @returns {{status: string, progres: number, galat: string|null,
 *   dariCache: boolean, siap: boolean, sedangMemuat: boolean,
 *   siapkan: () => Promise<string>, mintaLangkah: (fen: string, opsi?: object) => Promise<object>}}
 */
export function useMesinMaia({ rating = RATING_BAKU, ratingLawan = null } = {}) {
  const mesin = useMemo(() => ambilMesinMaia(), []);
  const [keadaan, aturKeadaan] = useState(() => mesin.keadaan());

  useEffect(() => mesin.langganan(aturKeadaan), [mesin]);

  const siapkan = useCallback(() => mesin.siapkan(), [mesin]);

  const hapusCache = useCallback(() => mesin.hapusCache(), [mesin]);

  const mintaLangkah = useCallback(
    (fen, opsi = {}) =>
      mesin.cariLangkah(fen, {
        rating,
        ratingLawan: ratingLawan ?? rating,
        ...opsi,
      }),
    [mesin, rating, ratingLawan]
  );

  return {
    ...keadaan,
    siap: STATUS_MAIA.SIAP === keadaan.status,
    // "Memuat" mencakup menyiapkan worker dan mengunduh bobot — dua keadaan
    // yang sama-sama membuat lawan belum bisa menjawab.
    sedangMemuat:
      STATUS_MAIA.MENYIAPKAN === keadaan.status ||
      STATUS_MAIA.PERLU_UNDUH === keadaan.status ||
      STATUS_MAIA.MENGUNDUH === keadaan.status,
    mengunduh: STATUS_MAIA.MENGUNDUH === keadaan.status,
    siapkan,
    mintaLangkah,
    hapusCache,
  };
}
