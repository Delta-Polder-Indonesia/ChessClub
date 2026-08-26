/**
 * Tata letak area Beranda.
 *
 * Hero + sidebar tetap terpasang saat pindah tab (pola yang sama dengan
 * halaman Tentang Kami / Struktur Grup Catur). Hanya artikel di bawah
 * foto yang berganti — tampilan tidak loncat ke gambar hero.
 *
 * Setiap tab tetap berkas terpisah dan dirender lewat <Outlet />.
 */
import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  CorporatePage,
  CorporateSection,
} from "../../components/CorporatePage.jsx";
import { PlaceholderArtikel } from "../../components/Loading.jsx";
import { gulirKeAtasInstan } from "../../lib/gulir.js";
import {
  sidebarBeranda,
  BERANDA_BERIKUT,
  jalurBerandaUtama,
  idBerandaDariPath,
} from "./sidebar.js";

const KELAS_BAGIAN = "pb-10 md:pb-10 xl:pb-10 pt-6 md:pt-8 xl:pt-0 xl:pr-12!";

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
  const idSebelumnya = useRef(null);

  useEffect(() => {
    const sebelum = idSebelumnya.current;
    idSebelumnya.current = id;

    // Beranda utama ("/beranda", dibuka lewat menu "Beranda" di atas): foto
    // hero tetap terlihat di atas — jangan gulir ke artikel. Gulirannya
    // dibuat instan agar tidak "meluncur" pelan saat pindah halaman.
    if (jalurBerandaUtama(pathname)) {
      gulirKeAtasInstan();
      return undefined;
    }

    // Bukan perpindahan antar tab isi (mount pertama, jalankan ulang effect
    // di Strict Mode, atau path dengan id sama): biarkan ScrollToTop yang
    // menentukan posisi — jangan gulir sendiri.
    if (sebelum === null || sebelum === id) return undefined;

    // Pindah ke tab isi (daftar-juara, peringkat, dll): fokus ke judul
    // artikel di bawah foto, jangan loncat ke gambar hero.
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
  }, [id, pathname]);

  return (
    <CorporatePage
      title="Beranda"
      description="Jadwal turnamen, daftar juara, peringkat, dan sumber belajar komunitas."
      image="/images/sekilas.jpg"
      sidebar={sidebarBeranda(id)}
      next={next}
    >
      {/* Suspense di sekitar Outlet menjaga janji tata letak ini: hero,
          sidebar, dan menu mobile TIDAK dibongkar saat pindah tab —
          hanya artikel di bawah foto yang menunggu chunk tab dimuat.
          (Dulu Suspense tunggal di App.jsx mengganti semuanya dengan foto
          hero, sehingga pindah tab terasa seperti halaman baru timpa.) */}
      <Suspense fallback={<PlaceholderArtikel />}>
        <Outlet />
      </Suspense>
    </CorporatePage>
  );
}
