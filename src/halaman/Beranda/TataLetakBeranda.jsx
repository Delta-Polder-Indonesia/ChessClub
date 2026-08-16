/**
 * Tata letak area Beranda.
 *
 * Hero + sidebar tetap terpasang saat pindah tab (pola yang sama dengan
 * halaman Tentang Kami / Struktur Grup Catur). Hanya artikel di bawah
 * foto yang berganti — tampilan tidak loncat ke gambar hero.
 *
 * Setiap tab tetap berkas terpisah dan dirender lewat <Outlet />.
 */
import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  CorporatePage,
  CorporateSection,
} from "../../components/CorporatePage.jsx";
import {
  sidebarBeranda,
  BERANDA_BERIKUT,
  idBerandaDariPath,
} from "./sidebar.js";

const KELAS_BAGIAN = "pb-10 md:pb-10 xl:pb-10 pt-6 md:pt-8 xl:pt-0";

/** Artikel satu tab Beranda — judul yang tampil di bawah foto hero. */
export function BagianBeranda({ id, title, children }) {
  return (
    <CorporateSection id={id} title={title} className={KELAS_BAGIAN}>
      {children}
    </CorporateSection>
  );
}

export default function TataLetakBeranda() {
  const { pathname } = useLocation();
  const id = idBerandaDariPath(pathname);
  const next = BERANDA_BERIKUT[id];
  const pertama = useRef(true);

  useEffect(() => {
    if (pertama.current) {
      pertama.current = false;
      return;
    }
    let coba = 0;
    let frame = 0;
    const gulir = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (coba++ < 30) frame = window.requestAnimationFrame(gulir);
    };
    const t = window.setTimeout(gulir, 40);
    return () => {
      window.clearTimeout(t);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [id]);

  return (
    <CorporatePage
      title="Beranda"
      description="Jadwal turnamen, daftar juara, peringkat, dan sumber belajar komunitas."
      image="/images/sekilas.jpg"
      sidebar={sidebarBeranda(id)}
      next={next}
    >
      <Outlet />
    </CorporatePage>
  );
}
