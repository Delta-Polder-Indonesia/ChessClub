/**
 * Sidebar area Beranda / Pengadaan.
 *
 * Sesuai permintaan, setiap item sidebar adalah HALAMAN/berkas TERPISAH,
 * bukan jangkar (#id) dalam satu halaman. Halaman pertama (jadwal turnamen)
 * adalah halaman default /pengadaan.
 */
export const MENU_BERANDA = [
  {
    id: "turnamen",
    label: "Informasi Jadwal Turnamen Catur",
    href: "/pengadaan",
  },
  {
    id: "daftar-juara",
    label: "Daftar Juara",
    href: "/pengadaan/daftar-juara",
  },
  {
    id: "keanggotaan",
    label: "Gabung Anggota",
    href: "/pengadaan/gabung-anggota",
  },
  {
    id: "ebook-catur",
    label: "E-Book & Panduan",
    href: "/pengadaan/ebook-panduan",
  },
  {
    id: "konten-tiktok",
    label: "Teka-Teki & Tips",
    href: "/pengadaan/teka-teki-tips",
  },
  {
    id: "hubungi-admin",
    label: "Hubungi Admin",
    href: "/pengadaan/hubungi-admin",
  },
];

/** Kembalikan salinan menu dengan item ber-id `aktif` ditandai aktif. */
export function sidebarBeranda(aktif) {
  return MENU_BERANDA.map((item) => ({ ...item, active: item.id === aktif }));
}

/** Urutan tombol "Selanjutnya". */
export const BERANDA_BERIKUT = {
  turnamen: { to: "/pengadaan/daftar-juara", title: "Daftar Juara" },
  "daftar-juara": { to: "/pengadaan/gabung-anggota", title: "Gabung Anggota" },
  keanggotaan: { to: "/pengadaan/ebook-panduan", title: "E-Book & Panduan" },
  "ebook-catur": { to: "/pengadaan/teka-teki-tips", title: "Teka-Teki & Tips" },
  "konten-tiktok": { to: "/pengadaan/hubungi-admin", title: "Hubungi Admin" },
  "hubungi-admin": { to: "/pengadaan", title: "Informasi Jadwal Turnamen Catur" },
};
