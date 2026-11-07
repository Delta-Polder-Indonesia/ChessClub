/* eslint-disable react-refresh/only-export-components -- penyedia konteks +
   kait pembacanya memang satu unit: memisah kait ke berkas lain hanya
   menambah impor tanpa manfaat fast-refresh (konteks bukan komponen). */
import { createContext, useContext } from "react";
import { usePengaturanPapan } from "./gunakanPengaturanPapan.js";

/**
 * Pengaturan papan yang dipakai BERSAMA dua halaman inti di bawah
 * `/papan-interaktif/*` (papan buku/Analisa dan Pengaturan).
 *
 * Dulu pengaturan hidup sebagai state di Workspace dan diteruskan lewat prop
 * karena semua mode adalah tab dalam satu halaman. Kini nilainya disediakan
 * lewat konteks oleh tata letak (`Workspace.jsx`) — pindah antara dua halaman
 * itu tidak me-reset pilihan bidak, warna papan, maupun pengaturan engine.
 *
 * Empat mode papan (Manusia vs Mesin, Latihan Repertoar, Hand & Brain, Turing
 * test) berada di luar tata letak ini dan memakai pengaturannya sendiri, jadi
 * `usePengaturanBersama()` di sana mengembalikan null dan halaman memakai
 * state lokalnya (lihat `TataLetakModePapan.jsx`).
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
