import { Route, Routes } from "react-router-dom";
import PageLayout from "./components/PageLayout.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

import TentangKami from "./halaman/TentangKami/TentangKami.jsx";

import ProgramKami from "./halaman/ProgramKami/ProgramKami.jsx";
import KelasDanPelatihan from "./halaman/ProgramKami/KelasDanPelatihan.jsx";
import CoachingClinic from "./halaman/ProgramKami/CoachingClinic.jsx";
import SimultanDanBlindfold from "./halaman/ProgramKami/SimultanDanBlindfold.jsx";
import SekolahCatur from "./halaman/ProgramKami/SekolahCatur.jsx";
import CaraBermainCatur from "./halaman/ProgramKami/CaraBermainCatur.jsx";

import Turnamen from "./halaman/Turnamen/Turnamen.jsx";
import TurnamenBulanan from "./halaman/Turnamen/TurnamenBulanan.jsx";
import LigaMusiman from "./halaman/Turnamen/LigaMusiman.jsx";
import TurnamenTerbuka from "./halaman/Turnamen/TurnamenTerbuka.jsx";
import LigaAntarKomunitas from "./halaman/Turnamen/LigaAntarKomunitas.jsx";

import MediaDanInformasi from "./halaman/MediaDanInformasi/MediaDanInformasi.jsx";
import BeritaKomunitas from "./halaman/MediaDanInformasi/BeritaKomunitas.jsx";
import Pengumuman from "./halaman/MediaDanInformasi/Pengumuman.jsx";
import Galeri from "./halaman/MediaDanInformasi/Galeri.jsx";
import BuletinBulanan from "./halaman/MediaDanInformasi/BuletinBulanan.jsx";

import Keanggotaan from "./halaman/Keanggotaan/Keanggotaan.jsx";
import PendaftaranAnggota from "./halaman/Keanggotaan/PendaftaranAnggota.jsx";
import SyaratDanKetentuan from "./halaman/Keanggotaan/SyaratDanKetentuan.jsx";
import KodeEtikKomunitas from "./halaman/Keanggotaan/KodeEtikKomunitas.jsx";
import PertanyaanUmum from "./halaman/Keanggotaan/PertanyaanUmum.jsx";

import HubungiKami from "./halaman/HubungiKami/HubungiKami.jsx";
import TidakDitemukan from "./halaman/TidakDitemukan.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<TentangKami />} />
          <Route path="/tentang-kami" element={<TentangKami />} />

          <Route path="/program-kami" element={<ProgramKami />} />
          <Route path="/program-kami/kelas-dan-pelatihan" element={<KelasDanPelatihan />} />
          <Route path="/program-kami/coaching-clinic" element={<CoachingClinic />} />
          <Route path="/program-kami/simultan-dan-blindfold" element={<SimultanDanBlindfold />} />
          <Route path="/program-kami/sekolah-catur" element={<SekolahCatur />} />
          <Route
            path="/program-kami/sekolah-catur/cara-bermain-catur"
            element={<CaraBermainCatur />}
          />

          <Route path="/turnamen" element={<Turnamen />} />
          <Route path="/turnamen/turnamen-bulanan" element={<TurnamenBulanan />} />
          <Route path="/turnamen/liga-musiman" element={<LigaMusiman />} />
          <Route path="/turnamen/turnamen-terbuka" element={<TurnamenTerbuka />} />
          <Route path="/turnamen/liga-antar-komunitas" element={<LigaAntarKomunitas />} />

          <Route path="/media-dan-informasi" element={<MediaDanInformasi />} />
          <Route path="/media-dan-informasi/berita-komunitas" element={<BeritaKomunitas />} />
          <Route path="/media-dan-informasi/galeri" element={<Galeri />} />
          <Route path="/media-dan-informasi/buletin-bulanan" element={<BuletinBulanan />} />
          <Route path="/pengumuman" element={<Pengumuman />} />

          <Route path="/keanggotaan" element={<Keanggotaan />} />
          <Route path="/keanggotaan/pendaftaran-anggota" element={<PendaftaranAnggota />} />
          <Route path="/keanggotaan/syarat-dan-ketentuan" element={<SyaratDanKetentuan />} />
          <Route path="/keanggotaan/kode-etik-komunitas" element={<KodeEtikKomunitas />} />
          <Route path="/keanggotaan/pertanyaan-umum" element={<PertanyaanUmum />} />

          <Route path="/hubungi-kami" element={<HubungiKami />} />
          <Route path="*" element={<TidakDitemukan />} />
        </Route>
      </Routes>
    </>
  );
}
