/**
 * Gestur lawan (mesin) di mode Manusia vs Mesin.
 *
 * Tujuannya membuat mesin terlihat "memegang" bidaknya seperti manusia, bukan
 * memindahkan bidak seketika:
 *
 *   1. mesin mengklik petak asal — sorotan petak dan titik tujuan muncul lewat
 *      jalur `onKlik` yang sama dengan klik pemain;
 *   2. bidak yang diklik bergoyang sebentar, seperti baru diangkat;
 *   3. ada jeda beberapa detik sebelum bidak benar-benar melangkah;
 *   4. khusus posisi yang dinilai SULIT, mesin kadang melirik satu-dua bidak
 *      lain dulu (klik-klik seperti bingung) — langkah yang dijalankan tetap
 *      langkah terbaik hasil pencarian engine.
 *
 * `pointerdown` sengaja tidak dikirim — di PapanTekaTeki itu memicu
 * `onHapusTanda`, sehingga panah dan tanda milik pemain terhapus hanya karena
 * lawan menyentuh bidaknya.
 *
 * Semua ini HANYA untuk mode Manusia vs Mesin. Teka-teki, Teka-teki Rush, dan
 * Latihan Repertoar memakai papan yang sama tetapi tidak memanggil modul ini.
 */
import { Chess } from "chess.js";
import { kurangiGerak } from "../TekaTeki/animasiBidak.js";

/**
 * Tetapan waktu dan peluang gestur — satu tempat supaya mudah disetel dan
 * bisa dipercepat oleh uji otomatis (uji menyetel objek ini sebelum bertindak,
 * kalau tidak satu langkah mesin butuh beberapa detik nyata).
 */
export const GESTUR = {
  /** Jeda (ms) setelah bidak "dipegang" sebelum langkah dijalankan: 2-4 detik. */
  jedaLangkah: [2000, 4000],
  /** Jeda (ms) antar klik saat mesin melirik bidak lain. */
  jedaRagu: [380, 900],
  /** Peluang gestur ragu muncul, dihitung hanya saat posisi dinilai sulit. */
  peluangRagu: 1 / 3,
  /** Paling banyak berapa bidak lain yang dilirik sebelum langkah dijalankan. */
  maksRagu: 2,
  /** |cp| di bawah ini dianggap masih imbang (100 cp = satu pion). */
  ambangCp: 80,
  /** Jumlah langkah sah minimal supaya posisi disebut "banyak pilihan". */
  ambangLangkah: 28,
  /** Lama goyangan bidak (ms). */
  goyang: 420,
};

const jedaAsli = (ms) => new Promise((selesai) => window.setTimeout(selesai, ms));

/** Angka acak dalam rentang [min, maks]. */
export function acakRentang([min, maks], acak = Math.random) {
  return Math.round(min + acak() * (maks - min));
}

/**
 * Posisi "sulit": skor engine masih tipis DAN pilihan langkahnya banyak —
 * persis situasi manusia ikut lama menimbang. Skakmat paksa (mate) tidak
 * pernah sulit: jalannya sudah jelas.
 *
 * @param {{cp?: number|null, mate?: number|null}|null} info snapshot eval engine
 * @param {number} jumlahLangkah banyak langkah sah untuk pihak yang melangkah
 */
export function posisiSulit(info, jumlahLangkah) {
  if (!info) return false;
  if (info.mate !== null && info.mate !== undefined && Number.isFinite(info.mate)) return false;
  if (!Number.isFinite(info.cp)) return false;
  return Math.abs(info.cp) < GESTUR.ambangCp && jumlahLangkah >= GESTUR.ambangLangkah;
}

/**
 * Petak bidak lain milik `warna` yang punya langkah sah — bahan gestur ragu.
 * Petak asal langkah yang sebenarnya selalu dikecualikan supaya tidak diklik
 * dua kali berturut-turut.
 */
export function petakRagu(fen, warna, kecuali, { acak = Math.random, maks = GESTUR.maksRagu } = {}) {
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return [];
  }
  if (game.turn() !== warna) return [];
  const calon = [...new Set(game.moves({ verbose: true }).map((langkah) => langkah.from))].filter(
    (petak) => petak !== kecuali
  );
  // Acak stabil: satu lintasan Fisher-Yates dengan sumber acak yang bisa
  // diganti uji, lalu ambil beberapa di depan.
  for (let i = calon.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [calon[i], calon[j]] = [calon[j], calon[i]];
  }
  return calon.slice(0, Math.max(0, maks));
}

/** Goyangkan bidak di sebuah petak — seperti bidak yang baru diangkat jari. */
export function goyangBidak(petakEl) {
  const bidak = petakEl?.querySelector?.("[data-bidak]");
  if (!bidak || typeof bidak.animate !== "function") return null;
  // Setelan sistem "kurangi gerak": sorotan petak tetap ada, goyangannya tidak.
  if (kurangiGerak()) return null;
  const gerak = bidak.animate(
    [
      { transform: "translateY(0) rotate(0deg)" },
      { transform: "translateY(-6%) rotate(-5deg)" },
      { transform: "translateY(-6%) rotate(5deg)" },
      { transform: "translateY(-2%) rotate(-2deg)" },
      { transform: "translateY(0) rotate(0deg)" },
    ],
    { duration: GESTUR.goyang, easing: "ease-in-out" }
  );
  return gerak;
}

/**
 * Klik satu petak milik lawan (tanpa jeda). Balasan `false` berarti petak
 * tidak ada di DOM; pemanggil tetap harus menjalankan langkahnya sendiri
 * supaya giliran tidak macet.
 */
export function klikLawan(papan, petak) {
  const el = papan?.querySelector(`[data-petak="${petak}"]`);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      button: 0,
    })
  );
  goyangBidak(el);
  return true;
}

/**
 * Jalankan seluruh gestur mesin sampai bidak siap melangkah.
 *
 * Pemanggil yang menjalankan langkahnya sendiri setelah fungsi ini selesai —
 * modul ini tidak menyentuh aturan catur sama sekali.
 *
 * @param {Element|null} papan elemen pembungkus papan
 * @param {object} opsi
 * @param {string} opsi.dari petak asal langkah yang akan dijalankan
 * @param {string[]} [opsi.ragu] petak bidak lain yang dilirik lebih dulu
 * @param {() => void} [opsi.padaKlik] dipanggil tiap klik (mis. bunyi klik)
 * @param {() => boolean} [opsi.masihBerlaku] false = gestur dibatalkan
 *   (partai baru, undo, mode ditinggalkan) dan fungsi berhenti di tempat
 * @param {(ms: number) => Promise<void>} [opsi.jeda] penunda (diganti saat uji)
 * @param {() => number} [opsi.acak] sumber acak (diganti saat uji)
 * @returns {Promise<boolean>} true bila gestur selesai utuh
 */
export async function gesturLawan(papan, opsi) {
  const {
    dari,
    ragu = [],
    padaKlik,
    masihBerlaku = () => true,
    jeda = jedaAsli,
    acak = Math.random,
  } = opsi;

  for (const petak of ragu) {
    if (!masihBerlaku()) return false;
    padaKlik?.();
    klikLawan(papan, petak);
    await jeda(acakRentang(GESTUR.jedaRagu, acak));
  }

  if (!masihBerlaku()) return false;
  padaKlik?.();
  klikLawan(papan, dari);
  await jeda(acakRentang(GESTUR.jedaLangkah, acak));
  return masihBerlaku();
}
