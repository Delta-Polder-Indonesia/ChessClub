/**
 * Peta menu = peta folder.
 * folder  → src/halaman/<folder>/
 * file    → nama file di folder itu
 * path    → alamat di browser
 *
 * `title` berisi kunci terjemahan `nav.*`; pemanggil bertugas menerjemahkan
 * lewat `t(title)`.
 */
export const MENU_UTAMA = [
  {
    title: "nav.tentangKami",
    folder: "TentangKami",
    path: "/tentang-kami",
    children: [
      { title: "nav.sekilasKomunitas", path: "/tentang-kami#sekilas-komunitas" },
      { title: "nav.tonggakSejarah", path: "/tentang-kami#tonggak-sejarah" },
      { title: "nav.visiMisiNilai", path: "/tentang-kami#visi-misi" },
      { title: "nav.maknaLogo", path: "/tentang-kami#makna-logo" },
      { title: "nav.strukturPengurus", path: "/tentang-kami#struktur-pengurus" },
    ],
  },
  {
    title: "nav.programKami",
    folder: "ProgramKami",
    path: "/program-kami",
    file: "ProgramKami.jsx",
    children: [
      {
        title: "nav.kelasPelatihan",
        path: "/program-kami/kelas-dan-pelatihan",
        file: "KelasDanPelatihan.jsx",
      },
      {
        title: "nav.coachingClinic",
        path: "/program-kami/coaching-clinic",
        file: "CoachingClinic.jsx",
      },
      {
        title: "nav.simultanBlindfold",
        path: "/program-kami/simultan-dan-blindfold",
        file: "SimultanDanBlindfold.jsx",
      },
      {
        title: "nav.sekolahCatur",
        path: "/program-kami/sekolah-catur",
        file: "SekolahCatur.jsx",
      },
    ],
  },
  {
    title: "nav.turnamen",
    folder: "Turnamen",
    path: "/turnamen",
    file: "Turnamen.jsx",
    children: [
      {
        title: "nav.turnamenBulanan",
        path: "/turnamen/turnamen-bulanan",
        file: "TurnamenBulanan.jsx",
      },
      {
        title: "nav.ligaMusiman",
        path: "/turnamen/liga-musiman",
        file: "LigaMusiman.jsx",
      },
      {
        title: "nav.turnamenTerbuka",
        path: "/turnamen/turnamen-terbuka",
        file: "TurnamenTerbuka.jsx",
      },
      {
        title: "nav.ligaAntarKomunitas",
        path: "/turnamen/liga-antar-komunitas",
        file: "LigaAntarKomunitas.jsx",
      },
    ],
  },
  {
    title: "nav.mediaDanInformasi",
    folder: "MediaDanInformasi",
    path: "/media-dan-informasi",
    file: "MediaDanInformasi.jsx",
    children: [
      {
        title: "nav.beritaKomunitas",
        path: "/media-dan-informasi/berita-komunitas",
        file: "BeritaKomunitas.jsx",
      },
      {
        title: "nav.galeri",
        path: "/media-dan-informasi/galeri",
        file: "Galeri.jsx",
      },
      {
        title: "nav.buletinBulanan",
        path: "/media-dan-informasi/buletin-bulanan",
        file: "BuletinBulanan.jsx",
      },
    ],
  },
  {
    title: "nav.keanggotaan",
    folder: "Keanggotaan",
    path: "/keanggotaan",
    file: "Keanggotaan.jsx",
    children: [
      {
        title: "nav.pendaftaranAnggota",
        path: "/keanggotaan/pendaftaran-anggota",
        file: "PendaftaranAnggota.jsx",
      },
      {
        title: "nav.syaratKetentuan",
        path: "/keanggotaan/syarat-dan-ketentuan",
        file: "SyaratDanKetentuan.jsx",
      },
      {
        title: "nav.kodeEtik",
        path: "/keanggotaan/kode-etik-komunitas",
        file: "KodeEtikKomunitas.jsx",
      },
      {
        title: "nav.pertanyaanUmum",
        path: "/keanggotaan/pertanyaan-umum",
        file: "PertanyaanUmum.jsx",
      },
    ],
  },
];

export const MENU_ATAS = [
  { title: "nav.turnamen", path: "/turnamen" },
  { title: "nav.pengumuman", path: "/pengumuman" },
  { title: "nav.hubungiKami", path: "/hubungi-kami" },
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
  list.push({ title: "nav.pengumuman", path: "/pengumuman" });
  list.push({ title: "nav.hubungiKami", path: "/hubungi-kami" });
  return list;
}
