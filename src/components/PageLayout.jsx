import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { BersihkanBootHero, PlaceholderHalaman } from "./Loading.jsx";

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
  return (
    <>
      <Header />
      <main className="page min-h-screen">
        <Suspense fallback={<PlaceholderHalaman />}>
          {/* BersihkanBootHero dipasang di dalam Suspense agar gambar boot
              di index.html baru dibuang SETELAH konten halaman pertama
              benar-benar tampil — bukan begitu kerangka React siap. */}
          <BersihkanBootHero />
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
