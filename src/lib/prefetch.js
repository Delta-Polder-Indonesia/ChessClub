/**
 * Prefetch chunk rute — supaya pindah halaman terasa instan.
 *
 * Semua halaman dimuat malas (React.lazy) agar bundel awal ramping, tetapi
 * tanpa prefetch setiap klik menu harus menunggu chunk halaman tujuan
 * diunduh dulu — itulah yang membuat transisi halaman terasa "mentok"
 * lalu mendadak jadi. Dua strategi dipakai bersamaan:
 *
 *  1. Interaksi — saat tautan internal di-hover/fokus/disentuh, chunk
 *     halaman tujuan langsung diunduh di latar belakang (umumnya selesai
 *     sebelum jari sempat menekan klik).
 *  2. Nganggur   — setelah halaman pertama tampil, semua chunk rute
 *     publik (total ± 90 KiB gzip) diunduh satu per satu saat jaringan
 *     sedang tidak sibuk. Dashboard pengurus sengaja TIDAK ikut: berat
 *     (± 111 KiB) dan hanya relevan untuk pengurus.
 *
 * import() di sini memakai penentu yang sama dengan React.lazy di
 * App.jsx — memanggilnya lebih dulu hanya "menghangatkan" modul yang
 * sama; browser tidak mengunduh berkas dua kali.
 */

const PEMUAT_RUTE = new Map([
  ["/", () => import("../halaman/Landing/Landing.jsx")],
  ["/tentang-kami", () => import("../halaman/TentangKami/TentangKami.jsx")],
  ["/tentang-kami/struktur-grup-catur", () => import("../halaman/TentangKami/StrukturGrupCatur/StrukturGrupCatur.jsx")],
  ["/program-kami", () => import("../halaman/ProgramKami/ProgramKami.jsx")],
  ["/program-kami/teka-teki", () => import("../halaman/ProgramKami/TekaTekiKonten.jsx")],
  ["/program-kami/pembukaan", () => import("../halaman/ProgramKami/Pembukaan.jsx")],
  ["/program-kami/sekolah-catur/cara-bermain-catur", () => import("../halaman/ProgramKami/CaraBermainCatur.jsx")],
  ["/teka-teki", () => import("../halaman/TekaTeki/TekaTeki.jsx")],
  ["/papan-interaktif", () => import("../halaman/PapanInteraktif/PapanInteraktif.jsx")],
  ["/turnamen", () => import("../halaman/Turnamen/Turnamen.jsx")],
  ["/turnamen/turnamen-bulanan", () => import("../halaman/Turnamen/TurnamenBulanan.jsx")],
  ["/turnamen/liga-musiman", () => import("../halaman/Turnamen/LigaMusiman.jsx")],
  ["/turnamen/turnamen-terbuka", () => import("../halaman/Turnamen/TurnamenTerbuka.jsx")],
  ["/turnamen/liga-antar-komunitas", () => import("../halaman/Turnamen/LigaAntarKomunitas.jsx")],
  ["/media-dan-informasi", () => import("../halaman/MediaDanInformasi/MediaDanInformasi.jsx")],
  ["/media-dan-informasi/berita-komunitas", () => import("../halaman/MediaDanInformasi/BeritaKomunitas.jsx")],
  ["/media-dan-informasi/pengumuman", () => import("../halaman/MediaDanInformasi/Pengumuman.jsx")],
  ["/media-dan-informasi/galeri", () => import("../halaman/MediaDanInformasi/Galeri.jsx")],
  ["/pendaftaran-anggota", () => import("../halaman/PendaftaranAnggota/PendaftaranAnggota.jsx")],
  ["/keberlanjutan", () => import("../halaman/Keberlanjutan/Keberlanjutan.jsx")],
  ["/keberlanjutan/syarat-dan-ketentuan", () => import("../halaman/Keberlanjutan/SyaratDanKetentuan.jsx")],
  ["/keberlanjutan/kode-etik-komunitas", () => import("../halaman/Keberlanjutan/KodeEtikKomunitas.jsx")],
  ["/keberlanjutan/pertanyaan-umum", () => import("../halaman/Keberlanjutan/PertanyaanUmum.jsx")],
  ["/hubungi-kami", () => import("../halaman/HubungiKami/HubungiKami.jsx")],
  ["/karir", () => import("../halaman/Karir/Karir.jsx")],
  ["/beranda", () => import("../halaman/Beranda/Beranda.jsx")],
  ["/beranda/turnamen", () => import("../halaman/Beranda/Beranda.jsx")],
  ["/beranda/daftar-juara", () => import("../halaman/Beranda/DaftarJuara.jsx")],
  ["/beranda/peringkat", () => import("../halaman/Beranda/Peringkat.jsx")],
  ["/beranda/ebook-panduan", () => import("../halaman/Beranda/EbookPanduan.jsx")],
]);

const PEMUAT_TAMBAHAN = [
  // Halaman detail berita/pengumuman (rute :id dinamis) tidak punya jalur
  // statis untuk dipetakan; chunk-nya kecil (± 2,6 KiB) sehingga cukup
  // dihangatkan saat nganggur.
  () => import("../halaman/MediaDanInformasi/DetailKonten.jsx"),
];

const sudah = new Set();

/** Ubah href apa pun menjadi jalur rute bersih ("/turnamen", "/beranda", …). */
function jalurNormal(path) {
  let p = String(path || "").split(/[?#]/)[0];
  const basis = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  if (basis && p.startsWith(`${basis}/`)) p = p.slice(basis.length);
  if (!p.startsWith("/")) return null;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p;
}

/** Unduh chunk untuk satu jalur rute (aman dipanggil berulang). */
export function prefetchRute(path) {
  const jalur = jalurNormal(path);
  if (!jalur) return;
  const muat = PEMUAT_RUTE.get(jalur);
  if (!muat || sudah.has(jalur)) return;
  sudah.add(jalur);
  // Gagal (mis. sedang offline) tidak fatal — biarkan bisa dicoba lagi.
  muat().catch(() => sudah.delete(jalur));
}

let berjalan = false;

/** Pasang listener prefetch — cukup dipanggil sekali per aplikasi. */
export function mulaiPrefetchRute() {
  if (typeof window === "undefined" || berjalan) return;
  berjalan = true;

  // (1) Interaksi: hover / fokus / sentuh pada tautan internal mana pun.
  //     Listener global di window — semua <Link> dan <a> otomatis tercakup
  //     tanpa perlu mengubah tiap komponen menu.
  const saatInteraksi = (event) => {
    const target = event.target;
    const a =
      typeof target?.closest === "function"
        ? target.closest("a[href]")
        : null;
    if (!a) return;
    try {
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      prefetchRute(url.pathname);
    } catch {
      // href tidak bisa diurai — abaikan saja.
    }
  };
  for (const nama of ["mouseover", "focusin", "touchstart"]) {
    window.addEventListener(nama, saatInteraksi, { passive: true });
  }

  // (2) Nganggur: setelah halaman pertama siap, hangatkan semua rute publik
  //     satu per satu agar tidak berebut bandwidth dengan data halaman.
  const muatSemua = () => {
    [...PEMUAT_RUTE.keys()]
      .reduce(
        (janji, jalur) => janji.then(() => prefetchRute(jalur)),
        Promise.resolve(),
      )
      .then(() => {
        for (const muat of PEMUAT_TAMBAHAN) muat().catch(() => {});
      });
  };

  // Hormati pengguna hemat data / jaringan sangat lambat: lewati unduhan
  // massal (prefetch saat hover tetap berjalan — itu atas inisiatif user).
  const sambungan = navigator.connection;
  if (sambungan?.saveData || /2g/.test(sambungan?.effectiveType || "")) {
    return;
  }

  const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 2000));
  idle(muatSemua, { timeout: 4000 });
}
