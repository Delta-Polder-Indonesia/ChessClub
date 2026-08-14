import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import PageLayout from "./components/PageLayout.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

import TentangKami from "./halaman/TentangKami/TentangKami.jsx";
import StrukturGrupCatur from "./halaman/TentangKami/StrukturGrupCatur/StrukturGrupCatur.jsx";

import ProgramKami from "./halaman/ProgramKami/ProgramKami.jsx";
import KelasDanPelatihan from "./halaman/ProgramKami/KelasDanPelatihan.jsx";
import CoachingClinic from "./halaman/ProgramKami/CoachingClinic.jsx";
import SimultanDanBlindfold from "./halaman/ProgramKami/SimultanDanBlindfold.jsx";
import SekolahCatur from "./halaman/ProgramKami/SekolahCatur.jsx";
import CaraBermainCatur from "./halaman/ProgramKami/CaraBermainCatur.jsx";
import Dashboard from "./halaman/Pengurus/Dashboard.jsx";

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

import Keberlanjutan from "./halaman/Keberlanjutan/Keberlanjutan.jsx";
import PendaftaranAnggota from "./halaman/PendaftaranAnggota/PendaftaranAnggota.jsx";
import SyaratDanKetentuan from "./halaman/Keberlanjutan/SyaratDanKetentuan.jsx";
import KodeEtikKomunitas from "./halaman/Keberlanjutan/KodeEtikKomunitas.jsx";
import PertanyaanUmum from "./halaman/Keberlanjutan/PertanyaanUmum.jsx";

import HubungiKami from "./halaman/HubungiKami/HubungiKami.jsx";
import Karir from "./halaman/Karir/Karir.jsx";
import Pengadaan from "./halaman/Pengadaan/Pengadaan.jsx";
import TidakDitemukan from "./halaman/TidakDitemukan.jsx";

/**
 * Kunci sessionStorage yang dipakai public/404.html untuk menyimpan alamat
 * asli saat pengguna me-refresh rute dalam di GitHub Pages.
 */
const KUNCI_RUTE = "kci-rute-tersimpan";

/**
 * Memulihkan rute yang disimpan oleh public/404.html.
 * 404.html menyimpan jalur lengkap (mis. "/ChessClub/tentang-kami#keanggotaan"),
 * lalu mengarahkan ke index.html. Komponen ini melepas prefix base dan
 * menavigasi ke rute semula tanpa reload.
 */
function PulihkanRute() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const tersimpan = sessionStorage.getItem(KUNCI_RUTE);
      if (!tersimpan) return;
      sessionStorage.removeItem(KUNCI_RUTE);
      const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
      const jalur = tersimpan.startsWith(base)
        ? tersimpan.slice(base.length)
        : tersimpan;
      if (jalur && jalur !== "/") navigate(jalur, { replace: true });
    } catch {
      /* abaikan — hanya berfungsi di lingkungan yang mendukung sessionStorage */
    }
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <>
      <PulihkanRute />
      <ScrollToTop />
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<TentangKami />} />
          <Route path="/tentang-kami" element={<TentangKami />} />
          <Route path="/tentang-kami/struktur-grup-catur" element={<StrukturGrupCatur />} />
          <Route path="/struktur-grup-catur" element={<Navigate to="/tentang-kami/struktur-grup-catur" replace />} />

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
          <Route path="/media-dan-informasi/pengumuman" element={<Pengumuman />} />
          <Route path="/pengumuman" element={<Navigate to="/media-dan-informasi/pengumuman" replace />} />
          <Route path="/media-dan-informasi/galeri" element={<Galeri />} />
          <Route path="/media-dan-informasi/buletin-bulanan" element={<BuletinBulanan />} />

          {/* Keanggotaan hanya dirender sebagai tab di Struktur Grup Catur. */}
          <Route path="/pendaftaran-anggota" element={<PendaftaranAnggota />} />
          <Route path="/tentang-kami/keanggotaan" element={<Navigate to="/tentang-kami/struktur-grup-catur#keanggotaan" replace />} />
          <Route path="/tentang-kami/keanggotaan/pendaftaran-anggota" element={<Navigate to="/pendaftaran-anggota" replace />} />
          <Route path="/tentang-kami/struktur-grup-catur/keanggotaan/pendaftaran-anggota" element={<Navigate to="/pendaftaran-anggota" replace />} />
          <Route path="/keanggotaan" element={<Navigate to="/tentang-kami/struktur-grup-catur#keanggotaan" replace />} />
          <Route path="/keanggotaan/pendaftaran-anggota" element={<Navigate to="/pendaftaran-anggota" replace />} />

          <Route path="/keberlanjutan" element={<Keberlanjutan />} />
          <Route path="/keberlanjutan/syarat-dan-ketentuan" element={<SyaratDanKetentuan />} />
          <Route path="/keberlanjutan/kode-etik-komunitas" element={<KodeEtikKomunitas />} />
          <Route path="/keberlanjutan/pertanyaan-umum" element={<PertanyaanUmum />} />
          <Route path="/keanggotaan/syarat-dan-ketentuan" element={<Navigate to="/keberlanjutan/syarat-dan-ketentuan" replace />} />
          <Route path="/keanggotaan/kode-etik-komunitas" element={<Navigate to="/keberlanjutan/kode-etik-komunitas" replace />} />
          <Route path="/keanggotaan/pertanyaan-umum" element={<Navigate to="/keberlanjutan/pertanyaan-umum" replace />} />

          <Route path="/hubungi-kami" element={<HubungiKami />} />
          <Route path="/pengadaan" element={<Pengadaan />} />
          <Route path="/karir" element={<Karir />} />
          <Route path="*" element={<TidakDitemukan />} />
        </Route>

        {/* Dashboard pengurus berdiri sendiri: tanpa navbar & footer publik,
            dan sengaja tidak ditautkan dari menu mana pun. */}
        <Route path="/pengurus" element={<Dashboard />} />
      </Routes>
    </>
  );
}
