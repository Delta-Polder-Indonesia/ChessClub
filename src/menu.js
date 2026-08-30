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
      {
        title: "nav.strukturGrupCatur",
        folder: "TentangKami/StrukturGrupCatur",
        path: "/tentang-kami/struktur-grup-catur",
        file: "StrukturGrupCatur.jsx",
        children: [
          {
            title: "nav.pengurus",
            folder: "TentangKami/StrukturGrupCatur",
            path: "/tentang-kami/struktur-grup-catur#pengurus",
            file: "Pengurus.jsx",
          },
          {
            title: "nav.strukturOrganisasiCatur",
            folder: "TentangKami/StrukturGrupCatur",
            path: "/tentang-kami/struktur-grup-catur#organisasi",
            file: "StrukturOrganisasiCatur.jsx",
          },
          {
            title: "nav.keanggotaan",
            folder: "TentangKami/StrukturGrupCatur/Keanggotaan",
            path: "/tentang-kami/struktur-grup-catur#keanggotaan",
            file: "Keanggotaan.jsx",
          },
        ],
      },
    ],
  },
  {
    title: "nav.programKami",
    folder: "ProgramKami",
    path: "/program-kami",
    file: "ProgramKami.jsx",
    children: [
      {
        title: "nav.caraBermainCatur",
        path: "/program-kami/sekolah-catur/cara-bermain-catur",
        file: "CaraBermainCatur.jsx",
      },
      {
        title: "nav.tekaTeki",
        path: "/program-kami/teka-teki",
        folder: "ProgramKami",
        file: "TekaTekiKonten.jsx",
      },
      {
        title: "nav.pembukaan",
        path: "/program-kami/pembukaan",
        folder: "ProgramKami",
        file: "Pembukaan.jsx",
      },
      {
        title: "nav.eBookPanduan",
        path: "/program-kami/ebook-panduan",
        folder: "ProgramKami",
        file: "EbookPanduan.jsx",
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
        title: "nav.pengumuman",
        path: "/media-dan-informasi/pengumuman",
        file: "Pengumuman.jsx",
      },
      {
        title: "nav.galeri",
        path: "/media-dan-informasi/galeri",
        file: "Galeri.jsx",
      },
    ],
  },
  {
    title: "nav.keberlanjutan",
    folder: "Keberlanjutan",
    path: "/keberlanjutan",
    file: "Keberlanjutan.jsx",
    children: [
      {
        title: "nav.syaratKetentuan",
        folder: "Keberlanjutan",
        path: "/keberlanjutan/syarat-dan-ketentuan",
        file: "SyaratDanKetentuan.jsx",
      },
      {
        title: "nav.kodeEtik",
        folder: "Keberlanjutan",
        path: "/keberlanjutan/kode-etik-komunitas",
        file: "KodeEtikKomunitas.jsx",
      },
      {
        title: "nav.pertanyaanUmum",
        folder: "Keberlanjutan",
        path: "/keberlanjutan/pertanyaan-umum",
        file: "PertanyaanUmum.jsx",
      },
    ],
  },
];

export const MENU_ATAS = [
  { title: "nav.beranda", path: "/beranda" },
  { title: "nav.karir", path: "/karir" },
  { title: "nav.hubungiKami", path: "/hubungi-kami" },
];

export function menuAktif(path, pathname) {
  const base = (path || "").split("#")[0];
  if (!base) return false;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function semuaHalaman() {
  const list = [];

  function tambahkan(item) {
    list.push({ title: item.title, path: item.path });
    for (const child of item.children || []) tambahkan(child);
  }

  for (const item of MENU_UTAMA) tambahkan(item);
  list.push({ title: "nav.beranda", path: "/beranda" });
  list.push({ title: "nav.karir", path: "/karir" });
  list.push({ title: "nav.hubungiKami", path: "/hubungi-kami" });
  return list;
}
