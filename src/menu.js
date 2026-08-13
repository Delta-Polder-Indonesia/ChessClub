/**
 * Peta menu = peta folder.
 * folder  → src/halaman/<folder>/
 * file    → nama file di folder itu
 * path    → alamat di browser
 */
export const MENU_UTAMA = [
  {
    title: "Tentang Kami",
    folder: "TentangKami",
    path: "/tentang-kami",
    children: [
      { title: "Sekilas Komunitas", path: "/tentang-kami#sekilas-komunitas" },
      { title: "Tonggak Sejarah", path: "/tentang-kami#tonggak-sejarah" },
      { title: "Visi, Misi, & Tata Nilai", path: "/tentang-kami#visi-misi" },
      { title: "Makna Logo", path: "/tentang-kami#makna-logo" },
      { title: "Struktur Pengurus", path: "/tentang-kami#struktur-pengurus" },
    ],
  },
  {
    title: "Program Kami",
    folder: "ProgramKami",
    path: "/program-kami",
    file: "ProgramKami.jsx",
    children: [
      {
        title: "Kelas & Pelatihan",
        path: "/program-kami/kelas-dan-pelatihan",
        file: "KelasDanPelatihan.jsx",
      },
      {
        title: "Coaching Clinic",
        path: "/program-kami/coaching-clinic",
        file: "CoachingClinic.jsx",
      },
      {
        title: "Simultan & Blindfold",
        path: "/program-kami/simultan-dan-blindfold",
        file: "SimultanDanBlindfold.jsx",
      },
      {
        title: "Sekolah Catur",
        path: "/program-kami/sekolah-catur",
        file: "SekolahCatur.jsx",
      },
    ],
  },
  {
    title: "Turnamen",
    folder: "Turnamen",
    path: "/turnamen",
    file: "Turnamen.jsx",
    children: [
      {
        title: "Turnamen Bulanan",
        path: "/turnamen/turnamen-bulanan",
        file: "TurnamenBulanan.jsx",
      },
      {
        title: "Liga Musiman",
        path: "/turnamen/liga-musiman",
        file: "LigaMusiman.jsx",
      },
      {
        title: "Turnamen Terbuka",
        path: "/turnamen/turnamen-terbuka",
        file: "TurnamenTerbuka.jsx",
      },
      {
        title: "Liga Antar Komunitas",
        path: "/turnamen/liga-antar-komunitas",
        file: "LigaAntarKomunitas.jsx",
      },
    ],
  },
  {
    title: "Media & Informasi",
    folder: "MediaDanInformasi",
    path: "/media-dan-informasi",
    file: "MediaDanInformasi.jsx",
    children: [
      {
        title: "Berita Komunitas",
        path: "/media-dan-informasi/berita-komunitas",
        file: "BeritaKomunitas.jsx",
      },
      {
        title: "Pengumuman",
        path: "/media-dan-informasi/pengumuman",
        file: "Pengumuman.jsx",
      },
      {
        title: "Galeri",
        path: "/media-dan-informasi/galeri",
        file: "Galeri.jsx",
      },
      {
        title: "Buletin Bulanan",
        path: "/media-dan-informasi/buletin-bulanan",
        file: "BuletinBulanan.jsx",
      },
    ],
  },
  {
    title: "Keanggotaan",
    folder: "Keanggotaan",
    path: "/keanggotaan",
    file: "Keanggotaan.jsx",
    children: [
      {
        title: "Pendaftaran Anggota",
        path: "/keanggotaan/pendaftaran-anggota",
        file: "PendaftaranAnggota.jsx",
      },
      {
        title: "Syarat & Ketentuan",
        path: "/keanggotaan/syarat-dan-ketentuan",
        file: "SyaratDanKetentuan.jsx",
      },
      {
        title: "Kode Etik Komunitas",
        path: "/keanggotaan/kode-etik-komunitas",
        file: "KodeEtikKomunitas.jsx",
      },
      {
        title: "Pertanyaan Umum",
        path: "/keanggotaan/pertanyaan-umum",
        file: "PertanyaanUmum.jsx",
      },
    ],
  },
];

export const MENU_ATAS = [
  { title: "Turnamen", path: "/turnamen" },
  { title: "Galeri", path: "/media-dan-informasi/galeri" },
  { title: "Hubungi Kami", path: "/hubungi-kami" },
];

export function menuAktif(path, pathname) {
  const base = (path || "").split("#")[0];
  if (!base) return false;
  if (base === "/tentang-kami") {
    return pathname === "/" || pathname === "/tentang-kami";
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function semuaHalaman() {
  const list = [];
  for (const item of MENU_UTAMA) {
    list.push({ title: item.title, path: item.path });
    for (const child of item.children || []) {
      list.push({ title: child.title, path: child.path });
    }
  }
  list.push({ title: "Hubungi Kami", path: "/hubungi-kami" });
  return list;
}
