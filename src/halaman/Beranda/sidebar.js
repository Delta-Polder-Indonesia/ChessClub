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
    href: "/beranda/turnamen",
  },
  {
    id: "pengumuman",
    label: "Rangkuman Pengumuman",
    href: "/beranda/rangkuman-pengumuman",
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
];

/**
 * True bila path adalah halaman utama Beranda ("/beranda") — halaman
 * tempat foto hero tampil di atas, sebelum tab-tab isi di bawahnya.
 */
export function jalurBerandaUtama(path) {
  return path === "/beranda";
}

/** True bila path termasuk keluarga halaman Beranda. */
export function jalurBeranda(path) {
  return jalurBerandaUtama(path) || path.startsWith("/beranda/");
}

/** Id item sidebar yang sesuai dengan path saat ini. */
export function idBerandaDariPath(path) {
  if (jalurBerandaUtama(path)) return "turnamen";
  const item = MENU_BERANDA.find((m) => m.href === path);
  return item?.id || "turnamen";
}

/** Kembalikan salinan menu dengan item ber-id `aktif` ditandai aktif. */
export function sidebarBeranda(aktif) {
  return MENU_BERANDA.map((item) => ({ ...item, active: item.id === aktif }));
}

/** Urutan tombol "Selanjutnya". */
export const BERANDA_BERIKUT = {
  turnamen: { to: "/beranda/rangkuman-pengumuman", title: "Rangkuman Pengumuman" },
  pengumuman: { to: "/beranda/daftar-juara", title: "Daftar Juara" },
  "daftar-juara": { to: "/beranda/peringkat", title: "Peringkat" },
  peringkat: { to: "/beranda/ebook-panduan", title: "E-Book & Panduan" },
  "ebook-catur": { to: "/beranda/turnamen", title: "Informasi Jadwal Turnamen Catur" },
};
