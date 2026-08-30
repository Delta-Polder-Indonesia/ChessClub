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
 *  2. Visibilitas — chunk rute dihangatkan saat tautannya benar-benar
 *     terlihat (IntersectionObserver), satu per satu di waktu luang
 *     browser. Dulu semua rute publik diunduh sekaligus setelah halaman
 *     pertama tampil: ± 45 berkas yang bersaing dengan gambar LCP dan
 *     membuat PageSpeed mencatat rantai permintaan kritis 1,2 detik.
 *     Dashboard pengurus sengaja TIDAK ikut: berat (± 111 KiB) dan hanya
 *     relevan untuk pengurus.
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
  ["/program-kami/ebook-panduan", () => import("../halaman/ProgramKami/EbookPanduan.jsx")],
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
]);

/** Rute dengan parameter dinamis (/:id) — dicocokkan dengan pola. */
const POLA_RUTE = [
  // Halaman detail berita/pengumuman: chunk-nya kecil (± 2,6 KiB) dan hanya
  // berguna bila daftar kontennya benar-benar dilihat.
  [/^\/media-dan-informasi\/(berita|pengumuman)\/[^/]+$/, () => import("../halaman/MediaDanInformasi/DetailKonten.jsx")],
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

/** Pemuat chunk untuk satu jalur rute — peta statis dulu, lalu pola dinamis. */
function pemuatUntuk(jalur) {
  if (!jalur) return null;
  const tetap = PEMUAT_RUTE.get(jalur);
  if (tetap) return tetap;
  for (const [pola, muat] of POLA_RUTE) if (pola.test(jalur)) return muat;
  return null;
}

/** Unduh chunk untuk satu jalur rute (aman dipanggil berulang).
 *  Mengembalikan promise unduhan supaya pemanggil bisa mengantrekan
 *  prefetch berikutnya SETELAH yang ini selesai (tidak berebut bandwidth). */
export function prefetchRute(path) {
  const jalur = jalurNormal(path);
  if (!jalur) return null;
  const muat = pemuatUntuk(jalur);
  if (!muat || sudah.has(jalur)) return null;
  sudah.add(jalur);
  // Gagal (mis. sedang offline) tidak fatal — biarkan bisa dicoba lagi.
  const janji = muat();
  janji.catch(() => sudah.delete(jalur));
  return janji;
}

let berjalan = false;

/** Jaringan yang patut dihormati: data hemat atau RTT tinggi = jangan
 *  mengunduh apa pun yang belum diminta pengguna. */
function jaringanBoleh() {
  const c = typeof navigator !== "undefined" ? navigator.connection : null;
  if (!c) return true;
  if (c.saveData) return false;
  return !/(^|-)2g$/.test(c.effectiveType || "");
}

/** Antrean unduhan yang hanya jalan saat browser menganggur. */
function buatAntrean(kerjakan) {
  const antre = [];
  let sibuk = false;
  const idle =
    typeof window.requestIdleCallback === "function"
      ? (fn) => window.requestIdleCallback(fn, { timeout: 2500 })
      : (fn) => window.setTimeout(fn, 120);
  let janji = Promise.resolve();

  const jalan = () => {
    if (sibuk || antre.length === 0) return;
    const jalur = antre.shift();
    sibuk = true;
    // Satu unduhan per waktu luang: tidak pernah ada lebih dari satu
    // prefetch bersaing dengan gambar/konten halaman yang sedang dimuat.
    janji = janji.then(() => mengerjakan(jalur)).catch(() => {});
    janji.then(() => {
      sibuk = false;
      if (antre.length) idle(() => jalan());
    });
  };

  return (jalur) => {
    if (!jalur || sudah.has(jalur) || antre.includes(jalur)) return;
    if (antre.length > 40) return; // penjaga, bukan kebijakan
    antre.push(jalur);
    idle(jalan);
  };
}

/**
 * Pasang prefetch berbasis tautan.
 *
 * Strategi lama: "saat jaringan nganggur, hangatkan SEMUA rute publik".
 * Praktiknya itu berarti ± 45 berkas (± 0,5 MB) diunduh setelah landing,
 * dan Lighthouse mencatatnya sebagai rantai permintaan kritis 1,17 s di
 * halaman yang hanya menampilkan satu rute — bandwidth ponsel dipakai untuk
 * halaman yang belum tentu dikunjungi.
 *
 * Sekarang yang dihangatkan hanya rute yang TAUTANNYA PERNAH TERLIHAT
 * (IntersectionObserver pada <a>) plus rute yang disentuh pointer. Pindah
 * halaman tetap terasa instan untuk jelajah wajar, tetapi pengunjung yang
 * hanya membaca satu halaman tidak diunduhkan seluruh situs.
 */
export function mulaiPrefetchRute() {
  if (typeof window === "undefined" || berjalan) return;
  berjalan = true;

  const antre = buatAntrean((jalur) => prefetchRute(jalur));
  // Pada jaringan lambat / hemat kuota hanya interaksi pengguna yang memicu
  // unduhan; penghangatan otomatis (lihat `mulai` di bawah) ditangguhkan.
  const hangatOtomatis = jaringanBoleh();
  const diamati = new WeakSet();

  const observasi = window.IntersectionObserver
    ? new window.IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          observasi.unobserve(e.target);
          try {
            const url = new URL(e.target.href, window.location.href);
            if (url.origin !== window.location.origin) continue;
            antre(url.pathname);
          } catch {
            /* href tidak bisa diurai — abaikan */
          }
        }
      }, { rootMargin: "80px 0px" })
    : null;

  const amati = (a) => {
    if (!observasi || !a.href || diamati.has(a)) return;
    const jalur = jalurNormal(a.getAttribute("href") || "");
    if (!pemuatUntuk(jalur)) return;
    diamati.add(a);
    observasi.observe(a);
  };

  const amatiSemua = () => {
    for (const a of document.querySelectorAll("a[href]")) amati(a);
  };

  // Tautan baru muncul setiap kali ganti rute / menu drawer dibuka.
  // Defer ke waktu luang supaya tidak menambah kerja di tengah commit React.
  let jatah = 0;
  const pemantau = new window.MutationObserver(() => {
    if (jatah) return;
    const idle =
      typeof window.requestIdleCallback === "function"
        ? (fn) => window.requestIdleCallback(fn, { timeout: 1500 })
        : (fn) => window.setTimeout(fn, 400);
    jatah = idle(() => {
      jatah = 0;
      amatiSemua();
    });
  });

  const mulai = () => {
    if (!hangatOtomatis || !observasi) {
      pemantau.disconnect();
      return;
    }
    amatiSemua();
    pemantau.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === "complete") mulai();
  else window.addEventListener("load", mulai, { once: true });

  // (1) Interaksi: hover / fokus / sentuh pada tautan internal mana pun —
  //     ini tetap jalan di semua kondisi jaringan karena atas inisiatif
  //     pengguna, dan langsung di luar antrean (chunk tujuan = prioritas).
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

}
