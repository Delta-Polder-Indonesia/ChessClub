/**
 * Sidebar area Beranda.
 *
 * Setiap item sidebar tetap HALAMAN/berkas terpisah, tetapi semuanya
 * dirender di dalam TataLetakBeranda yang sama. Hero + sidebar tidak
 * di-remount saat pindah tab — hanya artikel di bawah foto yang berganti,
 * seperti tab di halaman Tentang Kami / Struktur Grup Catur.
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

/** True bila path termasuk keluarga halaman Beranda (termasuk beranda di "/"). */
export function jalurBeranda(path) {
  return path === "/" || path === "/beranda" || path.startsWith("/beranda/");
}

/**
 * True bila path adalah Beranda UTAMA (foto hero di atas tetap terlihat):
 * "/" atau "/beranda". Berbeda dengan jalurBeranda() yang juga mencakup
 * tab isi ("/beranda/daftar-juara", dsb).
 */
export function jalurBerandaUtama(path) {
  return path === "/" || path === "/beranda";
}

/** Id item sidebar yang sesuai dengan path saat ini. */
export function idBerandaDariPath(path) {
  if (path === "/" || path === "/beranda") return "turnamen";
  const item = MENU_BERANDA.find((m) => m.href === path);
  return item?.id || "turnamen";
}

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
