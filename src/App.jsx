import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
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
const KelasDanPelatihan = lazy(() => import("./halaman/ProgramKami/KelasDanPelatihan.jsx"));
const CoachingClinic = lazy(() => import("./halaman/ProgramKami/CoachingClinic.jsx"));
const SimultanDanBlindfold = lazy(() => import("./halaman/ProgramKami/SimultanDanBlindfold.jsx"));
const SekolahCatur = lazy(() => import("./halaman/ProgramKami/SekolahCatur.jsx"));
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
const BuletinBulanan = lazy(() => import("./halaman/MediaDanInformasi/BuletinBulanan.jsx"));

// Keberlanjutan & keanggotaan
const Keberlanjutan = lazy(() => import("./halaman/Keberlanjutan/Keberlanjutan.jsx"));
const PendaftaranAnggota = lazy(() => import("./halaman/PendaftaranAnggota/PendaftaranAnggota.jsx"));
const SyaratDanKetentuan = lazy(() => import("./halaman/Keberlanjutan/SyaratDanKetentuan.jsx"));
const KodeEtikKomunitas = lazy(() => import("./halaman/Keberlanjutan/KodeEtikKomunitas.jsx"));
const PertanyaanUmum = lazy(() => import("./halaman/Keberlanjutan/PertanyaanUmum.jsx"));

// Area Beranda — satu berkas per item sidebar.
const Beranda = lazy(() => import("./halaman/Beranda/Beranda.jsx"));
const DaftarJuara = lazy(() => import("./halaman/Beranda/DaftarJuara.jsx"));
const Peringkat = lazy(() => import("./halaman/Beranda/Peringkat.jsx"));
const EbookPanduan = lazy(() => import("./halaman/Beranda/EbookPanduan.jsx"));
const TekaTekiTips = lazy(() => import("./halaman/Beranda/TekaTekiTips.jsx"));
const HubungiAdmin = lazy(() => import("./halaman/Beranda/HubungiAdmin.jsx"));

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
  ["/beranda/teka-teki-tips", TekaTekiTips],
  ["/beranda/hubungi-admin", HubungiAdmin],
];

/** Rute konten utama: [path, Komponen].
 *  "/" adalah Beranda — halaman pertama yang dilihat pengunjung. */
const RUTE_HALAMAN = [
  ["/tentang-kami", TentangKami],
  ["/tentang-kami/struktur-grup-catur", StrukturGrupCatur],

  ["/program-kami", ProgramKami],
  ["/program-kami/kelas-dan-pelatihan", KelasDanPelatihan],
  ["/program-kami/coaching-clinic", CoachingClinic],
  ["/program-kami/simultan-dan-blindfold", SimultanDanBlindfold],
  ["/program-kami/sekolah-catur", SekolahCatur],
  ["/program-kami/sekolah-catur/cara-bermain-catur", CaraBermainCatur],

  ["/turnamen", Turnamen],
  ["/turnamen/turnamen-bulanan", TurnamenBulanan],
  ["/turnamen/liga-musiman", LigaMusiman],
  ["/turnamen/turnamen-terbuka", TurnamenTerbuka],
  ["/turnamen/liga-antar-komunitas", LigaAntarKomunitas],

  ["/media-dan-informasi", MediaDanInformasi],
  ["/media-dan-informasi/berita-komunitas", BeritaKomunitas],
  ["/media-dan-informasi/pengumuman", Pengumuman],
  ["/media-dan-informasi/galeri", Galeri],
  ["/media-dan-informasi/buletin-bulanan", BuletinBulanan],

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
  ["/pengadaan/teka-teki-tips", "/beranda/teka-teki-tips"],
  ["/pengadaan/hubungi-admin", "/beranda/hubungi-admin"],
]);

/* ------------------------------------------------------- pulihkan rute */

/**
 * Kunci sessionStorage yang dipakai public/404.html untuk menyimpan alamat
 * asli saat pengguna me-refresh rute dalam di GitHub Pages.
 */
const KUNCI_RUTE = "kci-rute-tersimpan";

/**
 * Nilai dari sessionStorage tetap data eksternal — pengguna (atau skrip
 * jahat di tab yang sama) bisa menuliskannya. Hanya jalur INTERNAL relatif
 * yang diterima; segala bentuk alamat absolut atau protokol ditolak agar
 * tidak menjadi celah open redirect.
 */
function jalurInternalAman(jalur) {
  if (typeof jalur !== "string" || !jalur) return false;
  // Wajib diawali satu "/" — menolak "https://…", "javascript:…", "foo".
  if (!jalur.startsWith("/")) return false;
  // "//evil.com" dan "/\evil.com" diperlakukan browser sebagai URL absolut.
  if (jalur.startsWith("//") || jalur.startsWith("/\\")) return false;
  // Tolak karakter kontrol serta sisa skema yang tersamar (mis. "/a:javascript").
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(jalur)) return false;
  // Uji akhir: bila diurai relatif terhadap origin kita, origin-nya tidak
  // boleh berubah. Menangkap trik encoding yang lolos pemeriksaan di atas.
  try {
    const asal = window.location.origin;
    return new URL(jalur, asal).origin === asal;
  } catch {
    return false;
  }
}

/**
 * Memulihkan rute yang disimpan oleh public/404.html.
 * 404.html menyimpan jalur lengkap (mis. "/ChessClub/tentang-kami#keanggotaan"),
 * lalu mengarahkan ke index.html. Komponen ini melepas prefix base dan
 * menavigasi ke rute semula tanpa reload — setelah lolos validasi
 * jalurInternalAman() untuk mencegah open redirect.
 */
function PulihkanRute() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const tersimpan = sessionStorage.getItem(KUNCI_RUTE);
      if (!tersimpan) return;
      sessionStorage.removeItem(KUNCI_RUTE);
      if (!jalurInternalAman(tersimpan)) return;
      const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
      const jalur = tersimpan.startsWith(base)
        ? tersimpan.slice(base.length)
        : tersimpan;
      if (!jalur || jalur === "/") return;
      // Validasi ulang setelah prefix base dilepas — pelepasan prefix bisa
      // mengubah bentuk jalur (mis. "/ChessClub//evil.com" → "//evil.com").
      if (!jalurInternalAman(jalur)) return;
      navigate(jalur, { replace: true });
    } catch {
      /* abaikan — hanya berfungsi di lingkungan yang mendukung sessionStorage */
    }
  }, [navigate]);

  return null;
}

/* ---------------------------------------------------------------- app */

export default function App() {
  useEffect(() => {
    document.getElementById("boot-hero")?.remove();
  }, []);

  return (
    <>
      <PulihkanRute />
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
