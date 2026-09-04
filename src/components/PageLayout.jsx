import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { BersihkanBootHero, PlaceholderHalaman } from "./Loading.jsx";

/** Halaman yang tampil tanpa header & footer situs agar kontennya full-screen. */
const TANPA_KERANGKA = new Set([
  "/program-kami/analisa",
  "/program-kami/atribusi",
  "/teka-teki",
  "/papan-interaktif",
]);

/**
 * Kerangka semua halaman publik.
 *
 * <Suspense> sengaja berada DI DALAM kerangka — tepat di sekeliling
 * <Outlet /> — bukan membungkus seluruh router. Akibat dulu (Suspense di
 * App.jsx memegang semua rute): setiap kali pindah halaman, HEADER dan
 * FOOTER ikut dibongkar dan seluruh layar diganti foto hero Beranda
 * selagi chunk halaman tujuan diunduh — halaman tampak saling menimpah
 * dan seperti "mentok di Beranda dulu baru masuk". Sekarang hanya area
 * konten yang menampilkan placeholder; navigasi terasa mulus.
 */
export default function PageLayout() {
  const { pathname } = useLocation();
  const tanpaKerangka = TANPA_KERANGKA.has(pathname);
  return (
    <>
      {tanpaKerangka ? null : <Header />}
      <main className="page min-h-screen">
        <Suspense fallback={<PlaceholderHalaman />}>
          {/* BersihkanBootHero dipasang di dalam Suspense agar gambar boot
              di index.html baru dibuang SETELAH konten halaman pertama
              benar-benar tampil — bukan begitu kerangka React siap. */}
          <BersihkanBootHero />
          <Outlet />
        </Suspense>
      </main>
      {tanpaKerangka ? null : <Footer />}
    </>
  );
}
