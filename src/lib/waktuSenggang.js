/**
 * Penjadwal pekerjaan latar bersama — prefetch rute, pemanasan aset/bunyi, dan
 * unduhan data besar.
 *
 * Audit PageSpeed `/papan-interaktif` (Lighthouse 13, Moto G Power, 4G lambat)
 * mencatat rantai permintaan kritis 2,97 dtk dan elemen LCP baru dicat 4,3 dtk
 * setelah TTFB. Permintaan halaman itu sendiri kecil; yang menghabiskan
 * bandwidth adalah pekerjaan latar yang menyala terlalu cepat dan berjalan
 * bersamaan: prefetch seluruh tautan sidebar, tiga set bidak (±36 chunk),
 * enam MP3 papan, buku pembukaan 4,6 MB — semuanya berebut pipa 1,6 Mbps
 * dengan chunk yang justru menahan LCP.
 *
 * Kontrak modul ini (satu pintu untuk semua pekerjaan semacam itu):
 *   1. Tidak ada yang berjalan sebelum halaman selesai `load` + jeda tenang.
 *   2. Hanya SATU pekerjaan berjalan pada satu waktu, dan hanya saat browser
 *      menganggur — pekerjaan latar tidak pernah mendahului render.
 *   3. Pengguna hemat data / jaringan 2G–3G tidak diunduhkan apa pun, kecuali
 *      pemanggil menyatakan datanya memang wajib (`paksa: true`).
 */

/** Jeda setelah `load` sebelum pekerjaan latar boleh dijadwalkan. */
const JEDA_SETELAH_LOAD_MS = 2000;

/** Batas `requestIdleCallback` — jaring pengaman bila browser tak pernah idle. */
const BATAS_IDLE_MS = 3000;

/** Jaring pengaman bila `load` tertahan lama (mis. gambar yang lambat). */
const BATAS_TUNGGU_LOAD_MS = 12000;

function saatIdle(fn) {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(fn, { timeout: BATAS_IDLE_MS });
  }
  return window.setTimeout(fn, 200);
}

/**
 * Boleh mengunduh sesuatu yang belum diminta pengguna?
 * Data hemat atau jaringan lambat = tidak: biarkan halaman yang sedang dibuka
 * memakai bandwidthnya sendiri.
 */
export function jaringanLatarBoleh() {
  if (typeof navigator === "undefined") return false;
  const koneksi = navigator.connection;
  if (!koneksi) return true;
  if (koneksi.saveData) return false;
  return !/(^|-)2g$|^3g$/.test(koneksi.effectiveType || "");
}

let janjiTenang = null;

/** Promise yang selesai saat halaman sudah `load` + jeda tenang. */
function halamanTenang() {
  if (janjiTenang) return janjiTenang;
  janjiTenang = new Promise((selesai) => {
    let sudah = false;
    const lanjut = () => {
      if (sudah) return;
      sudah = true;
      selesai();
    };
    const tungguJeda = () => window.setTimeout(lanjut, JEDA_SETELAH_LOAD_MS);
    if (document.readyState === "complete") {
      tungguJeda();
      return;
    }
    window.addEventListener("load", tungguJeda, { once: true });
    window.setTimeout(lanjut, BATAS_TUNGGU_LOAD_MS);
  });
  return janjiTenang;
}

/** Antrean tunggal: satu pekerjaan latar pada satu waktu. */
const antre = [];
let berjalan = false;

function jalankanAntrean() {
  if (berjalan) return;
  const indeks = antre.findIndex((tugas) => !tugas.batal);
  if (indeks === -1) return;
  const [tugas] = antre.splice(indeks, 1);
  berjalan = true;
  saatIdle(() => {
    Promise.resolve()
      .then(tugas.kerja)
      .catch(() => {
        /* pekerjaan latar tidak boleh merusak halaman */
      })
      .then(() => {
        berjalan = false;
        jalankanAntrean();
      });
  });
}

/**
 * Antrekan satu pekerjaan latar.
 *
 * @param {() => unknown} kerja pekerjaan; boleh mengembalikan promise.
 * @param {{ paksa?: boolean }} [opsi] `paksa: true` melewati penjagaan
 *        jaringan untuk data yang memang wajib ada (mis. buku pembukaan),
 *        tetapi TETAP menunggu halaman tenang dan tetap antre satu per satu.
 * @returns {() => void} pembatalan — pekerjaan yang belum mulai akan dilewati.
 */
export function antrekanLatar(kerja, { paksa = false } = {}) {
  if (typeof window === "undefined" || typeof kerja !== "function") {
    return () => {};
  }
  const tugas = { kerja, batal: false };
  if (!paksa && !jaringanLatarBoleh()) {
    tugas.batal = true;
    return () => {};
  }
  antre.push(tugas);
  halamanTenang().then(jalankanAntrean);
  return () => {
    tugas.batal = true;
  };
}
