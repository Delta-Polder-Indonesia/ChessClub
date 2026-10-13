/* eslint-disable react-refresh/only-export-components -- penyedia konteks +
   kait pembacanya memang satu unit: memisah kait ke berkas lain hanya
   menambah impor tanpa manfaat fast-refresh (konteks bukan komponen). */
import { createContext, useContext } from "react";
import { usePengaturanPapan } from "./gunakanPengaturanPapan.js";

/**
 * Pengaturan papan yang dipakai BERSAMA semua halaman di bawah
 * `/papan-interaktif/*` (papan buku, empat mode latihan, dan pengaturan).
 *
 * Dulu pengaturan hidup sebagai state di Workspace dan diteruskan lewat prop
 * karena semua mode adalah tab dalam satu halaman. Kini tiap mode adalah rute
 * sendiri, jadi nilainya disediakan lewat konteks oleh tata letak
 * (`Workspace.jsx`) — pindah halaman tidak me-reset pilihan bidak, warna
 * papan, maupun pengaturan engine.
 *
 * Halaman yang dibuka di luar tata letak (mis. diuji terpisah) tetap jalan:
 * `usePengaturanBersama()` mengembalikan null dan tiap halaman memakai state
 * lokalnya sendiri seperti sebelumnya.
 */
const KonteksPengaturanPapan = createContext(null);

export function PenyediaPengaturanPapan({ children }) {
  const pengaturan = usePengaturanPapan();
  return (
    <KonteksPengaturanPapan.Provider value={pengaturan}>
      {children}
    </KonteksPengaturanPapan.Provider>
  );
}

/** @returns {{ nilai: object, ubah: Function } | null} */
export function usePengaturanBersama() {
  return useContext(KonteksPengaturanPapan);
}
