import { useEffect, useRef } from "react";

/**
 * Perilaku dialog modal yang benar — dipakai MasukanPgn & PopupPengaturan.
 *
 * - Fokus awal: elemen `[data-autofokus]` bila ada, kalau tidak elemen
 *   fokusabel pertama, kalau tidak ada kotak dialognya sendiri.
 * - Jebakan Tab: fokus tidak bisa keluar dari dialog selama terbuka.
 * - Escape menutup dialog (fase capture agar menang dari pendengar global).
 * - Fokus dikembalikan ke elemen pemicu saat dialog ditutup.
 *
 * @param {() => void} onTutup dipanggil saat Escape ditekan
 * @returns {import("react").RefObject} pasang ke kotak dialog (beri tabIndex={-1})
 */
export function useDialog(onTutup) {
  const refDialog = useRef(null);
  const tutupRef = useRef(onTutup);
  tutupRef.current = onTutup;

  useEffect(() => {
    const node = refDialog.current;
    const pemicu = document.activeElement;
    const daftarFokus = () => {
      if (!node) return [];
      return [
        ...node.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((el) => el.getClientRects().length > 0);
    };
    const utama = node?.querySelector("[data-autofokus]");
    const pertama = daftarFokus()[0];
    (utama || pertama || node)?.focus?.();

    function saatKunci(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        tutupRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const daftar = daftarFokus();
      if (!daftar.length) {
        e.preventDefault();
        return;
      }
      const awal = daftar[0];
      const akhir = daftar[daftar.length - 1];
      if (e.shiftKey && document.activeElement === awal) {
        e.preventDefault();
        akhir.focus();
      } else if (!e.shiftKey && document.activeElement === akhir) {
        e.preventDefault();
        awal.focus();
      }
    }
    document.addEventListener("keydown", saatKunci, true);
    return () => {
      document.removeEventListener("keydown", saatKunci, true);
      if (pemicu && typeof pemicu.focus === "function") pemicu.focus();
    };
     
  }, []);

  return refDialog;
}
