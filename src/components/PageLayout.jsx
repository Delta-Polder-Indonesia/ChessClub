import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import KarakterAnomali from "./KarakterAnomali.jsx";
import { BersihkanBootHero, PlaceholderHalaman } from "./Loading.jsx";

/**
 * Halaman yang tampil tanpa header & footer situs agar kontennya full-screen.
 *
 * Dicocokkan sebagai AWALAN path, bukan path persis: halaman Teka-teki menulis
 * ulang URL-nya menjadi `/teka-teki/<problemid>` begitu soal dimuat (dan tautan
 * dalam `/teka-teki/<id>` dibagikan bebas), sehingga pencocokan persis membuat
 * header + footer situs tersemat kembali di sekeliling papan yang seharusnya
 * penuh layar — juga pada setiap deep-link soal.
 *
 * KONVENSI PENAMAAN: Setiap awalan harus berupa nama dasar unik yang TIDAK
 * akan menjadi prefiks dari rute lain yang perlu kerangka. Misalnya
 * `/teka-teki` aman karena rute saudaranya bernama `/teka-teki-rush` (strip
 * setelah "teki" mencegah startsWith("/teka-teki/") cocok). Bila menambah
 * halaman baru, awali dengan segmen yang tidak bertumpang tindih (mis.
 * jangan gunakan `/analisa` bila ada `/analisa-lain` — pakai nama yang
 * tidak ambigu).
 */
const TANPA_KERANGKA = [
  "/program-kami/analisa/papan",
  "/teka-teki",
  "/teka-teki-rush",
  "/teka-teki-harian",
  "/quiz-catur",
  "/papan-interaktif",
  "/hubungi-kami",
];

function tanpaKerangkaPath(pathname) {
  return TANPA_KERANGKA.some(
    (awalan) => pathname === awalan || pathname.startsWith(`${awalan}/`)
  );
}

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
  const tanpaKerangka = tanpaKerangkaPath(pathname);
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
      <KarakterAnomali />
    </>
  );
}
