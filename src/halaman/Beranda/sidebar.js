/**
 * Sidebar area Beranda.
 *
 * Sesuai permintaan, setiap item sidebar adalah HALAMAN/berkas TERPISAH,
 * bukan jangkar (#id) dalam satu halaman. Halaman pertama (jadwal turnamen)
 * adalah halaman default /beranda.
 */
export const MENU_BERANDA = [
  {
    id: "turnamen",
    label: "Informasi Jadwal Turnamen Catur",
    href: "/beranda",
  },
  {
    id: "daftar-juara",
    label: "Daftar Juara",
    href: "/beranda/daftar-juara",
  },
  {
    id: "peringkat",
    label: "Peringkat",
    href: "/beranda/peringkat",
  },
  {
    id: "ebook-catur",
    label: "E-Book & Panduan",
    href: "/beranda/ebook-panduan",
  },
  {
    id: "konten-tiktok",
    label: "Teka-Teki & Tips",
    href: "/beranda/teka-teki-tips",
  },
  {
    id: "hubungi-admin",
    label: "Hubungi Admin",
    href: "/beranda/hubungi-admin",
  },
];

/** Kembalikan salinan menu dengan item ber-id `aktif` ditandai aktif. */
export function sidebarBeranda(aktif) {
  return MENU_BERANDA.map((item) => ({ ...item, active: item.id === aktif }));
}

/** Urutan tombol "Selanjutnya". */
export const BERANDA_BERIKUT = {
  turnamen: { to: "/beranda/daftar-juara", title: "Daftar Juara" },
  "daftar-juara": { to: "/beranda/peringkat", title: "Peringkat" },
  peringkat: { to: "/beranda/ebook-panduan", title: "E-Book & Panduan" },
  "ebook-catur": { to: "/beranda/teka-teki-tips", title: "Teka-Teki & Tips" },
  "konten-tiktok": { to: "/beranda/hubungi-admin", title: "Hubungi Admin" },
  "hubungi-admin": { to: "/beranda", title: "Informasi Jadwal Turnamen Catur" },
};
