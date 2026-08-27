import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { jalurBeranda, jalurBerandaUtama } from "../halaman/Beranda/sidebar.js";
import { gulirKeAtasInstan } from "../lib/gulir.js";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const sebelumnya = useRef(null);

  useEffect(() => {
    const prev = sebelumnya.current;
    sebelumnya.current = pathname;

    if (hash) {
      let id;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        // Hash malformed (mis. "/#%zz") — jangan biarkan aplikasi crash.
        id = hash.slice(1);
      }
      // Halaman tujuan dimuat malas: saat efek ini berjalan, chunk-nya
      // bisa saja belum selesai diunduh sehingga elemen #id belum ada.
      // Coba ulang beberapa frame sampai elemennya muncul (pola yang sama
      // dengan TataLetakBeranda) — tanpa ini, tautan seperti
      // "/tentang-kami#visi-misi" diam-diam gagal menggulir.
      let coba = 0;
      let frame = 0;
      const go = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
        if (coba++ < 90) frame = window.requestAnimationFrame(go);
      };
      frame = window.requestAnimationFrame(go);
      return () => {
        if (frame) window.cancelAnimationFrame(frame);
        coba = 999;
      };
    }

    // Halaman utama Beranda ("/beranda"): selalu tampilkan foto
    // hero di atas — termasuk saat menekan menu Beranda dari tab lain.
    if (jalurBerandaUtama(pathname)) {
      gulirKeAtasInstan();
      return undefined;
    }

    // Pindah tab di dalam Beranda: hero tetap, fokus ke artikel di bawah foto.
    // TataLetakBeranda yang menggulir ke judul artikel — jangan loncat ke hero.
    if (prev && jalurBeranda(prev) && jalurBeranda(pathname)) {
      return undefined;
    }

    gulirKeAtasInstan();
    return undefined;
  }, [pathname, hash]);

  return null;
}
