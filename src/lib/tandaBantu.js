/**
 * PINTU TUNGGAL logika tanda bantu papan (mark petak + panah).
 *
 * Semua halaman papan (Papan Interaktif, Teka-Teki, Hand & Brain, Latihan
 * Repertoar, Manusia vs Mesin, Turing Test) memakai modul ini. Perbaikan
 * perilaku cukup dilakukan DI SINI — tidak perlu mengubah tiap halaman.
 *
 * Pemakaian di halaman:
 *   const { tanda, setTanda, tandaPetak, tandaPanah, hapusSemuaTanda } = useTandaBantu();
 * lalu teruskan ke PapanTekaTeki sebagai `tanda`, `onTandaPetak={tandaPetak}`,
 * `onTandaPanah={tandaPanah}`, `onHapusTanda={hapusSemuaTanda}`.
 *
 * Aturan (mengikuti isepic-chess-ui, `_addMarkerHelper` dengan is_toggle):
 *   - Klik kanan pada petak:
 *       · belum ada mark  → mark ditambahkan dengan warna yang dipilih;
 *       · warna sama      → HANYA mark pada petak itu yang dihapus;
 *       · warna berbeda   → warna mark pada petak itu diganti.
 *   - Seret klik kanan (asal → tujuan): pasangan kotak yang sama dengan panah
 *     yang sudah ada → panah itu dihapus; selain itu panah ditambahkan.
 *   - Klik kiri di papan: hapus SEMUA mark dan panah (ditangani papan, lewat
 *     `hapusSemuaTanda`).
 *
 * Fungsi `togglePetak` dan `togglePanah` murni (tanpa React) agar mudah diuji.
 */
import { useCallback, useState } from "react";

/** Keadaan awal / kosong untuk tanda bantu. */
export function tandaKosong() {
  return { panah: [], petak: {} };
}

/** Klik kanan pada petak — lihat aturan di atas. Mengembalikan keadaan baru. */
export function togglePetak(lama, petak, warna) {
  if (lama.petak[petak] === warna) {
    const sisa = { ...lama.petak };
    delete sisa[petak];
    return { ...lama, petak: sisa };
  }
  return { ...lama, petak: { ...lama.petak, [petak]: warna } };
}

/** Seret klik kanan dari `from` ke `to` — toggle per pasangan kotak. */
export function togglePanah(lama, from, to, warna) {
  const ada = lama.panah.some((p) => p.from === from && p.to === to);
  const panah = ada
    ? lama.panah.filter((p) => !(p.from === from && p.to === to))
    : [...lama.panah, { from, to, warna }];
  return { ...lama, panah };
}

/**
 * Hook satu-pintu untuk halaman papan.
 * `setTanda` tetap diekspor untuk kebutuhan khusus (mis. mengosongkan tanda
 * saat soal/partai berganti), tetapi aturan klik sebaiknya selalu lewat
 * `tandaPetak` / `tandaPanah`.
 */
export function useTandaBantu() {
  const [tanda, setTanda] = useState(tandaKosong);

  const tandaPetak = useCallback((petak, warna) => {
    setTanda((lama) => togglePetak(lama, petak, warna));
  }, []);

  const tandaPanah = useCallback((from, to, warna) => {
    setTanda((lama) => togglePanah(lama, from, to, warna));
  }, []);

  const hapusSemuaTanda = useCallback(() => {
    setTanda(tandaKosong());
  }, []);

  return { tanda, setTanda, tandaPetak, tandaPanah, hapusSemuaTanda };
}
