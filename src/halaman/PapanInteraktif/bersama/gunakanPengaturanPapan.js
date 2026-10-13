import { useCallback, useMemo, useState } from "react";
import { ENGINE_BAKU } from "../../../lib/engineCatur.js";
import { bacaTampilanPanahMesin } from "../../../lib/gunakanEngineCatur.js";

/**
 * State pengaturan Papan Interaktif. Disediakan ke semua halaman
 * /papan-interaktif/* lewat PengaturanKonteks (di tata letak Workspace),
 * agar nilainya tetap ada saat berpindah antar halaman mode.
 *
 * Preferensi suara & komentator tidak ada di sini: keduanya sudah disimpan
 * di localStorage oleh useSuara() dan usePreferensiKomentator().
 */
export const PENGATURAN_AWAL = {
  bidak: "alpha",
  warnaPapan: "metal",
  tampilPanahMesin: true,
  awanTampilanPenuh: true,
  bantuanNyala: false,
  // Engine analisa
  mesin: ENGINE_BAKU,
  kedalaman: 13,
  threads: 1,
  hashMb: 16,
  multipv: 1,
  skillLevel: 20,
};

/**
 * @returns {{ nilai: typeof PENGATURAN_AWAL, ubah: (kunci: string, nilai: any) => void }}
 */
export function usePengaturanPapan() {
  const [nilai, setNilai] = useState(() => ({
    ...PENGATURAN_AWAL,
    // Panah mesin dibagi dengan Teka-Teki lewat localStorage — baca sekali di awal.
    tampilPanahMesin: bacaTampilanPanahMesin(),
  }));
  const ubah = useCallback((kunci, v) => setNilai((p) => ({ ...p, [kunci]: v })), []);
  return useMemo(() => ({ nilai, ubah }), [nilai, ubah]);
}
