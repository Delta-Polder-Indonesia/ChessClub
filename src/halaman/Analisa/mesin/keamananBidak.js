/**
 * Keamanan bidak untuk fitur Analisa: penyerang "tersembunyi" (baterai/x-ray).
 *
 * `chess.attackers()` hanya melihat penyerang yang garis serangnya SAAT INI
 * benar-benar menyentuh petak sasaran. Pada baterai — dua bidak berat berbaris
 * pada satu garis — penyerang di belakang tidak terhitung, padahal ia menjadi
 * penyerang begitu bidak terdepan menyingkir. Contoh minimal:
 *
 *   q5k1/8/8/8/8/8/R7/R5K1 w
 *   attackers("a8", "w")        → ["a2"]   (benteng a1 belum terlihat)
 *   setelah benteng a2 dihapus  → ["a1"]   (benteng a1 menyerang a8)
 *
 * Karena `isSacrifice` di ./penilaian.js menyimpulkan "tukar-menukar yang adil"
 * dari hitungan penyerang (pengecualian "satu penyerang" untuk benteng/ratu),
 * baterai yang tak terlihat membuat ratu a8 di atas dinilai BUKAN pengorbanan —
 * padahal dua benteng Putih menyerangnya dan Hitam kehilangan material.
 *
 * Fungsi di sini menutup lubang itu: ia mengembalikan petak penyerang yang baru
 * muncul setelah penyerang terdepan disingkirkan, dengan satu syarat penting —
 * baterai hanya mungkin terbuka kalau bidak terdepan itu BENAR-BENAR punya
 * langkah legal. Bidak yang terpaku atau tak punya langkah sama sekali (rajanya
 * sedang disekak) tidak membuka apa pun. Tanpa syarat ini muncul pengorbanan
 * palsu; contoh nyata dari korpus puzzle: posisi
 * `8/2R4p/6pk/5pP1/2rP1K1P/4PP2/8/2r5 b` — benteng c4 Hitam terpaku karena
 * Hitam disekak, tetapi benteng c1 sempat dihitung sebagai penyerang
 * tersembunyi untuk petak c8.
 *
 * Catatan cakupan: raja tidak pernah dihitung sebagai penyerang tersembunyi
 * (raja bukan ancaman material) dan tidak dipakai sebagai pembuka baterai.
 *
 * Biaya: pemanggil (./penilaian.js) hanya memanggilnya untuk petak yang punya
 * TEPAT satu penyerang legal, dan daftar langkah legal boleh disodorkan supaya
 * tidak disusun ulang. Pada 15824 langkah solusi puzzle `public/data/teka-teki.json`
 * (objek `move` utuh, termasuk `from` — tanpa itu `couldBeSaved` menerima petak
 * `undefined` dan angkanya menggelembung) perbaikan yang memakainya mengubah 7
 * putusan `isSacrifice`: semuanya false→true, tak satu pun di langkah penutup,
 * dan tidak ada perubahan lain di luar ketujuhnya.
 */

import { Chess } from "chess.js";

/**
 * Batas rantai pembukaan. Dalam praktik satu garis hanya bisa menampung paling
 * banyak tiga bidak berat satu warna di depan sasaran, jadi 16 sudah jauh lebih
 * dari cukup; batas ini murni pengaman agar tidak ada kemungkinan gelung.
 */
const BATAS_RANTAI = 16;

/**
 * Petak penyerang yang hanya menyerang `kotak` setelah penyerang terdepan di
 * garis yang sama menyingkir (baterai/x-ray), termasuk yang muncul di lapis
 * berikutnya.
 *
 * @param {Chess} papan posisi yang diperiksa — tidak diubah.
 * @param {string} kotak petak sasaran, mis. "a8".
 * @param {"w"|"b"} warnaPenyerang pihak yang menyerang.
 * @param {() => object[]} [langkahLegal] penyedia daftar langkah legal
 *   (`moves({ verbose: true })`) milik pihak yang SEDANG MELANGKAH; opsional,
 *   hanya untuk menghindari penyusunan daftar yang sama berulang kali.
 * @returns {string[]} petak penyerang tersembunyi, urut penemuan (bisa kosong).
 */
export function penyerangTersembunyi(papan, kotak, warnaPenyerang, langkahLegal) {
  const langsung = papan.attackers(kotak, warnaPenyerang);
  const terlihat = new Set(langsung);
  const tersembunyi = [];

  let cacheLangkah;
  const daftarLangkah = () => (cacheLangkah ??= langkahLegal ? langkahLegal() : papan.moves({ verbose: true }));
  const bisaMembuka = (petak) => daftarLangkah().some((langkah) => langkah.from === petak);

  const antrean = langsung.filter((petak) => papan.get(petak)?.type !== "k" && bisaMembuka(petak));

  // Satu salinan kerja untuk seluruh penelusuran, dan penyingkiran menumpuk:
  // lapis kedua baru terlihat kalau lapis pertama ikut disingkirkan (rantai
  // Ra3–Ra2–Qa1 di depan sasaran a8 menghasilkan a2 lalu a1). Salinan baru
  // dibuat saat antrean memang ada isinya — kasus tersering justru antrean
  // kosong (penyerang terdepan tak punya langkah legal), dan saat itu tak perlu
  // ada salinan sama sekali.
  let uji;
  let batas = 0;
  while (antrean.length && batas++ < BATAS_RANTAI) {
    uji ??= new Chess(papan.fen());
    // Penyerang terdepan disingkirkan dari papan, lalu petak sasaran dilihat
    // lagi — siapa pun yang kini menyerangnya tadinya "tersembunyi".
    uji.remove(antrean.pop());
    for (const petak of uji.attackers(kotak, warnaPenyerang)) {
      if (terlihat.has(petak)) continue;
      terlihat.add(petak);
      tersembunyi.push(petak);
      if (uji.get(petak)?.type !== "k" && bisaMembuka(petak)) antrean.push(petak);
    }
  }

  return tersembunyi;
}
