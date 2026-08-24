import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageLayout from "./components/PageLayout.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { HeroFallback } from "./components/Loading.jsx";
import TataLetakBeranda from "./halaman/Beranda/TataLetakBeranda.jsx";

/* ------------------------------------------------------- code splitting
 * Semua halaman dimuat malas (React.lazy) sehingga setiap rute menjadi
 * chunk terpisah — bundel awal hanya berisi kerangka layout + router.
 * Halaman berat (Dashboard, Galeri, CaraBermainCatur) paling diuntungkan:
 * kodenya baru diunduh saat rutenya benar-benar dikunjungi. */

// Tentang Kami
const TentangKami = lazy(() => import("./halaman/TentangKami/TentangKami.jsx"));
const StrukturGrupCatur = lazy(() => import("./halaman/TentangKami/StrukturGrupCatur/StrukturGrupCatur.jsx"));

// Program Kami
const ProgramKami = lazy(() => import("./halaman/ProgramKami/ProgramKami.jsx"));
const TekaTekiKonten = lazy(() => import("./halaman/ProgramKami/TekaTekiKonten.jsx"));
const Pembukaan = lazy(() => import("./halaman/ProgramKami/Pembukaan.jsx"));
const CaraBermainCatur = lazy(() => import("./halaman/ProgramKami/CaraBermainCatur.jsx"));

// Turnamen
const Turnamen = lazy(() => import("./halaman/Turnamen/Turnamen.jsx"));
const TurnamenBulanan = lazy(() => import("./halaman/Turnamen/TurnamenBulanan.jsx"));
const LigaMusiman = lazy(() => import("./halaman/Turnamen/LigaMusiman.jsx"));
const TurnamenTerbuka = lazy(() => import("./halaman/Turnamen/TurnamenTerbuka.jsx"));
const LigaAntarKomunitas = lazy(() => import("./halaman/Turnamen/LigaAntarKomunitas.jsx"));

// Media & Informasi
const MediaDanInformasi = lazy(() => import("./halaman/MediaDanInformasi/MediaDanInformasi.jsx"));
const BeritaKomunitas = lazy(() => import("./halaman/MediaDanInformasi/BeritaKomunitas.jsx"));
const Pengumuman = lazy(() => import("./halaman/MediaDanInformasi/Pengumuman.jsx"));
const Galeri = lazy(() => import("./halaman/MediaDanInformasi/Galeri.jsx"));
const DetailKonten = lazy(() => import("./halaman/MediaDanInformasi/DetailKonten.jsx"));
const DetailBerita = () => <DetailKonten jenis="berita" />;
const DetailPengumuman = () => <DetailKonten jenis="pengumuman" />;

// Keberlanjutan & keanggotaan
const Keberlanjutan = lazy(() => import("./halaman/Keberlanjutan/Keberlanjutan.jsx"));
const PendaftaranAnggota = lazy(() => import("./halaman/PendaftaranAnggota/PendaftaranAnggota.jsx"));
const SyaratDanKetentuan = lazy(() => import("./halaman/Keberlanjutan/SyaratDanKetentuan.jsx"));
const KodeEtikKomunitas = lazy(() => import("./halaman/Keberlanjutan/KodeEtikKomunitas.jsx"));
const PertanyaanUmum = lazy(() => import("./halaman/Keberlanjutan/PertanyaanUmum.jsx"));

// Teka-teki interaktif (pemutar 5.486 soal skakmat dari basis data puzzle Lichess).
const TekaTeki = lazy(() => import("./halaman/TekaTeki/TekaTeki.jsx"));

// Papan bebas + buku pembukaan (data dari lichess-org/chess-openings, CC0).
const PapanInteraktif = lazy(() => import("./halaman/PapanInteraktif/PapanInteraktif.jsx"));

// Area Beranda — satu berkas per item sidebar.
const Beranda = lazy(() => import("./halaman/Beranda/Beranda.jsx"));
const DaftarJuara = lazy(() => import("./halaman/Beranda/DaftarJuara.jsx"));
const Peringkat = lazy(() => import("./halaman/Beranda/Peringkat.jsx"));
const EbookPanduan = lazy(() => import("./halaman/Beranda/EbookPanduan.jsx"));

// Lain-lain
const HubungiKami = lazy(() => import("./halaman/HubungiKami/HubungiKami.jsx"));
const Karir = lazy(() => import("./halaman/Karir/Karir.jsx"));
const TidakDitemukan = lazy(() => import("./halaman/TidakDitemukan.jsx"));

// Dashboard pengurus — chunk terpisah; tidak pernah ikut bundel publik.
const Dashboard = lazy(() => import("./halaman/Pengurus/Dashboard.jsx"));

/* --------------------------------------------------------- konfigurasi */

/** Rute area Beranda — satu layout (hero + sidebar) untuk semua tab. */
const RUTE_BERANDA = [
  ["/", Beranda],
  ["/beranda", Beranda],
  ["/beranda/turnamen", Beranda],
  ["/beranda/daftar-juara", DaftarJuara],
  ["/beranda/peringkat", Peringkat],
  ["/beranda/ebook-panduan", EbookPanduan],
];

/** Rute konten utama: [path, Komponen].
 *  "/" adalah Beranda — halaman pertama yang dilihat pengunjung. */
const RUTE_HALAMAN = [
  ["/tentang-kami", TentangKami],
  ["/tentang-kami/struktur-grup-catur", StrukturGrupCatur],

  ["/program-kami", ProgramKami],
  ["/program-kami/teka-teki", TekaTekiKonten],
  ["/program-kami/pembukaan", Pembukaan],
  ["/program-kami/sekolah-catur/cara-bermain-catur", CaraBermainCatur],

  ["/teka-teki", TekaTeki],
  ["/papan-interaktif", PapanInteraktif],

  ["/turnamen", Turnamen],
  ["/turnamen/turnamen-bulanan", TurnamenBulanan],
  ["/turnamen/liga-musiman", LigaMusiman],
  ["/turnamen/turnamen-terbuka", TurnamenTerbuka],
  ["/turnamen/liga-antar-komunitas", LigaAntarKomunitas],

  ["/media-dan-informasi", MediaDanInformasi],
  ["/media-dan-informasi/berita-komunitas", BeritaKomunitas],
  ["/media-dan-informasi/berita/:id", DetailBerita],
  ["/media-dan-informasi/pengumuman", Pengumuman],
  ["/media-dan-informasi/pengumuman/:id", DetailPengumuman],
  ["/media-dan-informasi/galeri", Galeri],

  // Keanggotaan hanya dirender sebagai tab di Struktur Grup Catur.
  ["/pendaftaran-anggota", PendaftaranAnggota],

  ["/keberlanjutan", Keberlanjutan],
  ["/keberlanjutan/syarat-dan-ketentuan", SyaratDanKetentuan],
  ["/keberlanjutan/kode-etik-komunitas", KodeEtikKomunitas],
  ["/keberlanjutan/pertanyaan-umum", PertanyaanUmum],

  ["/hubungi-kami", HubungiKami],
  ["/karir", Karir],
];

/**
 * Alamat lama → alamat baru. Satu tempat untuk semua redirect sehingga
 * komponen App() tetap ramping; menambah alias baru cukup satu baris.
 */
const RUTE_REDIRECT = new Map([
  ["/struktur-grup-catur", "/tentang-kami/struktur-grup-catur"],
  ["/pengumuman", "/media-dan-informasi/pengumuman"],

  // Sub-halaman Program Kami yang dihapus — tautan lama tidak boleh 404.
  ["/program-kami/kelas-dan-pelatihan", "/program-kami"],
  ["/program-kami/coaching-clinic", "/program-kami"],
  ["/program-kami/simultan-dan-blindfold", "/program-kami"],
  ["/program-kami/sekolah-catur", "/program-kami/sekolah-catur/cara-bermain-catur"],

  // Tab Beranda "Teka-Teki & Tips" pindah menjadi halaman Program Kami.
  ["/beranda/teka-teki-tips", "/program-kami/teka-teki"],

  // Alias keanggotaan lama.
  ["/keanggotaan", "/tentang-kami/struktur-grup-catur#keanggotaan"],
  ["/tentang-kami/keanggotaan", "/tentang-kami/struktur-grup-catur#keanggotaan"],
  ["/keanggotaan/pendaftaran-anggota", "/pendaftaran-anggota"],
  ["/tentang-kami/keanggotaan/pendaftaran-anggota", "/pendaftaran-anggota"],
  ["/tentang-kami/struktur-grup-catur/keanggotaan/pendaftaran-anggota", "/pendaftaran-anggota"],

  // Dokumen keberlanjutan yang dulu berada di bawah /keanggotaan.
  ["/keanggotaan/syarat-dan-ketentuan", "/keberlanjutan/syarat-dan-ketentuan"],
  ["/keanggotaan/kode-etik-komunitas", "/keberlanjutan/kode-etik-komunitas"],
  ["/keanggotaan/pertanyaan-umum", "/keberlanjutan/pertanyaan-umum"],

  // Alias lama area Beranda (dahulu /pengadaan).
  ["/pengadaan", "/beranda"],
  ["/pengadaan/daftar-juara", "/beranda/daftar-juara"],
  ["/pengadaan/gabung-anggota", "/beranda/peringkat"],
  ["/beranda/gabung-anggota", "/beranda/peringkat"],
  ["/pengadaan/ebook-panduan", "/beranda/ebook-panduan"],
  ["/pengadaan/teka-teki-tips", "/program-kami/teka-teki"],

  // Tab Beranda "Hubungi Admin" dihapus — alamat lamanya (dan alias
  // /pengadaan-nya) diarahkan ke halaman Hubungi Kami, bukan 404.
  ["/beranda/hubungi-admin", "/hubungi-kami"],
  ["/pengadaan/hubungi-admin", "/hubungi-kami"],

  // Halaman "Buletin Bulanan" dihapus — tautan lamanya kembali ke induk.
  ["/media-dan-informasi/buletin-bulanan", "/media-dan-informasi"],
]);

/* ---------------------------------------------------------------- app */

export default function App() {
  useEffect(() => {
    document.getElementById("boot-hero")?.remove();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<HeroFallback />}>
        <Routes>
          <Route element={<PageLayout />}>
            <Route element={<TataLetakBeranda />}>
              {RUTE_BERANDA.map(([jalur, Komponen]) => (
                <Route key={jalur} path={jalur} element={<Komponen />} />
              ))}
            </Route>

            {RUTE_HALAMAN.map(([jalur, Komponen]) => (
              <Route key={jalur} path={jalur} element={<Komponen />} />
            ))}

            {[...RUTE_REDIRECT].map(([dari, ke]) => (
              <Route
                key={dari}
                path={dari}
                element={<Navigate to={ke} replace />}
              />
            ))}

            <Route path="*" element={<TidakDitemukan />} />
          </Route>

          {/* Dashboard pengurus berdiri sendiri: tanpa navbar & footer publik,
              sengaja tidak ditautkan dari menu mana pun, dan dijaga
              ProtectedRoute — token diverifikasi ke server sebelum halaman
              dirender, sehingga menebak URL saja tidak membuka apa pun. */}
          <Route
            path="/pengurus"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
