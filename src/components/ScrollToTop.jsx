import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { jalurBerandaUtama } from "../halaman/Beranda/sidebar.js";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  // Menyimpan pathname SEBELUMNYA (riwayat navigasi), BUKAN flag "pertama
  // kali". Ref semacam ini aman di React Strict Mode: nilainya memang
  // dirancang untuk bertahan antar-render, dan yang kita bandingkan adalah
  // dari mana pengguna datang — bukan apakah komponen baru pertama mount.
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

    // Beranda UTAMA ("/" atau "/beranda"): foto hero di atas harus selalu
    // terlihat — baik saat pertama kali masuk maupun saat menu Beranda diklik.
    // Selalu pindah ke puncak, apa pun path sebelumnya.
    if (jalurBerandaUtama(pathname)) {
      window.scrollTo(0, 0);
      return undefined;
    }

    // Pindah antar TAB ISI Beranda (dua-duanya sub-jalur /beranda/…):
    // hero + sidebar tetap terpasang, fokus ke judul artikel ditangani
    // TataLetakBeranda. Jangan paksa loncat ke hero (scroll 0,0).
    const pindahAntarTabIsi =
      prev &&
      prev.startsWith("/beranda/") &&
      pathname.startsWith("/beranda/");
    if (pindahAntarTabIsi) {
      return undefined;
    }

    // Halaman lain (atau tiba langsung ke tab isi dari luar Beranda):
    // kembali ke puncak seperti perilaku normal.
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return null;
}
