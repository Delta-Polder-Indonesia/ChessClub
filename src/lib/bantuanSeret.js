/**
 * Logika murni "Bantuan Langkah" (assisted play ala Fritz): saat pengguna
 * MENGANGKAT bidak dan menggesernya melintasi petak tujuan, engine menilai
 * posisi hipotetis (posisi SEANDAINYA langkah itu dimainkan) lalu:
 *   - mewarnai petak tujuan: hijau = aman, kuning = diperebutkan,
 *     merah = merugikan (blunder/kalah material);
 *   - menggambar panah langkah balasan terbaik lawan dari posisi hipotetis itu
 *     (bestmove posisi tersebut = langkah lawan — "lawan mau ke mana").
 *
 * Semua fungsi di sini murni (tanpa DOM/engine) supaya bisa dikunci uji Node;
 * hook `gunakanBantuanSeret.js` yang menyambungkannya ke engine.
 */
import { Chess } from "chess.js";

/**
 * Ambang selisih nilai (centipawn, dari sudut pandang pelangkah) antara
 * langkah terbaik dan langkah yang sedang dipertimbangkan.
 * Selisih ≤ 50 cp → hijau; ≤ 150 cp → kuning; di atasnya → merah.
 * Mengikuti semantik Assisted Play Fritz: "green says go, red says no".
 */
export const AMBANG_BANTUAN = { hijau: 50, kuning: 150 };

/**
 * FEN posisi setelah `from`→`to` dimainkan pada `fen`, atau `null` bila
 * langkahnya tidak sah. Promosi memakai menteri secara bawaan (`promosi`).
 *
 * @param {string} fen posisi asal
 * @param {string} from petak asal ("e2")
 * @param {string} to petak tujuan ("e4")
 * @param {string} [promosi] bidak promosi ("q" | "r" | "b" | "n")
 * @returns {string|null}
 */
export function susunFenHipotetis(fen, from, to, promosi = "q") {
  if (!fen || !from || !to) return null;
  let game;
  try {
    game = new Chess(fen);
  } catch {
    return null;
  }
  let pindah;
  try {
    pindah = game.move({ from, to, promotion: promosi });
  } catch {
    pindah = null;
  }
  return pindah ? game.fen() : null;
}

/**
 * Ubah nilai skor bersudut-pandang Putih menjadi bersudut-pandang pelangkah.
 * Papan memakai sudut pandang Putih (`cpPutih`), sedangkan penilaian kandidat
 * langkah harus dibandingkan dari sisi pemain yang bergerak.
 */
export function nilaiDariSudutPelangkah(cpPutih, sisi) {
  if (cpPutih === null || cpPutih === undefined) return null;
  const cp = Number(cpPutih);
  if (!Number.isFinite(cp)) return null;
  return sisi === "w" ? cp : -cp;
}

/**
 * Warna petak bantuan dari perbandingan nilai langkah terbaik posisi sekarang
 * dengan nilai kandidat langkah yang sedang diseret — keduanya SUDAH dalam
 * sudut pandang pelangkah (makin besar makin baik). Selisih dijepit di 0
 * supaya kandidat yang (karena kekurangan kedalaman) terlihat lebih baik dari
 * "terbaik" tidak pernah dihukum.
 */
export function warnaBantuan(nilaiTerbaik, nilaiKandidat, ambang = AMBANG_BANTUAN) {
  // Tanpa pembanding (mis. analisa posisi sekarang belum selesai) petak diberi
  // kuning: jangan mengklaim "aman"/"blunder" tanpa dasar.
  if (nilaiTerbaik === null || nilaiKandidat === null) return "kuning";
  const selisih = Math.max(0, nilaiTerbaik - nilaiKandidat);
  if (selisih <= ambang.hijau) return "hijau";
  if (selisih <= ambang.kuning) return "kuning";
  return "merah";
}

/**
 * Panah balasan lawan dari langkah UCI pertama posisi hipotetis.
 * Di posisi itu giliran lawan, jadi `bestmove`-nya = langkah lawan yang paling
 * menyulitkan kita (persis "Threat/Spy" Fritz).
 */
export function balasanLawan(uci) {
  const u = String(uci || "").trim();
  // "bestmove (none)" / string kosong bukan langkah — jangan digambar.
  if (!/^[a-h][1-8][a-h][1-8]/.test(u)) return null;
  return { from: u.slice(0, 2), to: u.slice(2, 4) };
}

/**
 * Susun hasil siap-tampil dari data mentah satu kandidat langkah.
 *
 * @param {object} p
 * @param {string} p.tujuan              petak tujuan yang diseret
 * @param {{cpPutih:number, matePutih:number|null}} p.nilaiKandidat nilai posisi hipotetis (sudut pandang Putih)
 * @param {number|null} p.nilaiTerbaik    nilai langkah terbaik posisi sekarang (sudut pandang pelangkah)
 * @param {string} p.sisi                 "w" | "b" — pihak yang melangkah
 * @param {string|null} p.uci             bestmove posisi hipotetis (langkah lawan)
 * @param {number|null} [p.kedalaman]     kedalaman pencarian kandidat
 * @returns {{tujuan:string, warna:string, panah:object|null, nilai:number|null, selisih:number|null}}
 */
export function susunBantuan({ tujuan, nilaiKandidat, nilaiTerbaik, sisi, uci, kedalaman = null }) {
  const kandidat = nilaiDariSudutPelangkah(nilaiKandidat?.cpPutih, sisi);
  const warna = warnaBantuan(nilaiTerbaik, kandidat);
  return {
    tujuan,
    warna,
    panah: balasanLawan(uci),
    nilai: kandidat,
    selisih: nilaiTerbaik === null || kandidat === null ? null : Math.max(0, nilaiTerbaik - kandidat),
    kedalaman,
  };
}
