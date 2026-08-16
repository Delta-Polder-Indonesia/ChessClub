import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { jalurBeranda, jalurBerandaUtama } from "../halaman/Beranda/sidebar.js";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const sebelumnya = useRef(null);

  useEffect(() => {
    const prev = sebelumnya.current;
    sebelumnya.current = pathname;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const go = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      };
      const t = setTimeout(go, 80);
      return () => clearTimeout(t);
    }

    // Halaman utama Beranda ("/" atau "/beranda"): selalu tampilkan foto
    // hero di atas — termasuk saat menekan menu Beranda dari tab lain.
    if (jalurBerandaUtama(pathname)) {
      window.scrollTo(0, 0);
      return undefined;
    }

    // Pindah tab di dalam Beranda: hero tetap, fokus ke artikel di bawah foto.
    // TataLetakBeranda yang menggulir ke judul artikel — jangan loncat ke hero.
    if (prev && jalurBeranda(prev) && jalurBeranda(pathname)) {
      return undefined;
    }

    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return null;
}
