/**
 * Label "langkah kritis" — langkah yang menjadi SATU-SATUNYA jalan
 * mempertahankan keunggulan.
 *
 * Kenapa modul ini ada: `penilaian.js` menilai sebuah langkah dari selisih
 * eval SEBELUM dan SESUDAH langkah itu dimainkan. Cara itu tidak bisa
 * membedakan "langkah terbaik" dari "langkah yang wajib ditemukan": pada
 * posisi di mana 1.e4 dan 1.d4 sama-sama menang, keduanya "terbaik"; pada
 * posisi di mana hanya 1.e4 yang mempertahankan keunggulan dan sisanya
 * menjatuhkan peluang menang 30%, keduanya tetap "terbaik" di mata eval.
 * Perbedaan itu baru terlihat dari KANDIDAT MultiPV pada posisi yang sama —
 * dan kandidat itu sudah direkam `engine.js` (`MULTI_PV = 5`, bahan metrik
 * peringkat di `antiCheat.js`) tetapi belum pernah dipakai untuk LABEL.
 *
 * Asal-usul gagasan: pendekatan `classify()` di WintrChess
 * (WintrCat/wintrchess, GPL-3.0) yang membandingkan baris terbaik dan baris
 * terbaik KEDUA pada satu posisi, lalu menuntut kerugian peluang minimal
 * sepersepuluh (0,1 skala 0–1). Di sini gagasan itu ditulis ulang dengan
 * modul dan konvensi ChessClub sendiri; TIDAK ADA kode WintrChess yang
 * disalin (lisensi GPL-3.0 tidak boleh masuk ke repo MIT ini).
 *
 * Murni: tanpa React, tanpa DOM, tanpa pemanggilan engine. Yang boleh
 * diimpor hanya `chess.js` (untuk membaca status sekak pada FEN sebelum
 * langkah) dan konstanta/rumus murni dari ./akurasi.js. Arah dependensi:
 *   ./akurasi.js → ./penilaian.js (invertColor)
 *   ./langkahKritis.js → ./akurasi.js
 *   ./engine.js → ./langkahKritis.js + ./penilaian.js
 * Jangan mengimpor ./penilaian.js dari sini — itu menutup lingkaran
 * penilaian → akurasi → penilaian.
 *
 * Konvensi eval (sama dengan ./akurasi.js dan ./penilaian.js):
 *   - `previousKandidat` = `daftarKandidat` MultiPV posisi SEBELUM langkah,
 *     jadi nilainya relatif terhadap PEMAIN YANG AKAN BERGERAK — sudut yang
 *     sama untuk seluruh daftar, sehingga dua kandidat teratas bisa langsung
 *     dibandingkan tanpa membalik tanda apa pun.
 *   - `staticEval` = eval mentah UCI SESUDAH langkah (pihak yang bergilir =
 *     lawan), jadi sudut pemain adalah tandanya yang dibalik — itu sebabnya
 *     syarat "tidak kalah" di bawah memakai `> 0`, bukan `< 0`.
 */

import { Chess } from "chess.js";
import { cpBaku, peluangMenang } from "./akurasi.js";

/**
 * Kerugian peluang menang (poin persen, 0–100) antara kandidat #1 dan #2 yang
 * membuat sebuah langkah disebut kritis. Sepuluh poin persen sengaja dipilih
 * sebagai "setengah jalan antara keliru dan kesalahan" — angka yang sama
 * dipakai WintrChess (0,1 pada skala 0–1) dan konsisten dengan ambang
 * `anotasiLangkah` di ./akurasi.js (mistake = 10 poin persen).
 */
export const AMBANG_KERUGIAN_KRITIS = 10;

/**
 * Batas "sudah menang mutlak": bila kandidat #2 pun masih berada di atas
 * angka ini (dari sudut pemain), langkah terbaik tidak lagi istimewa — hampir
 * semua langkah menang, jadi tidak ada yang perlu disebut kritis. Angka 700
 * sama dengan ambang `isMoveCriticalCandidate` WintrChess.
 */
export const AMBANG_UNGGUL_MUTLAK_CP = 700;

/**
 * Satu entri kandidat MultiPV (`{ peringkat, uci, cp, mate, wdl }`, lihat
 * `EngineAnalisis.cari`) → centipawn baku dari sudut pihak yang bergilir.
 * Skakmat dipetakan ke ±`CP_CEILING` seperti `cpBaku`, sehingga kandidat yang
 * sudah mati tetap bisa dibandingkan dengan kandidat centipawn.
 *
 * @returns {number|null} `null` bila skornya tidak terbaca (baris rusak).
 */
export function cpKandidat(entri) {
  if (!entri || typeof entri !== "object") return null;
  if (entri.mate !== null && entri.mate !== undefined && Number.isFinite(Number(entri.mate))) {
    return cpBaku(["mate", String(entri.mate)]);
  }
  if (entri.cp !== null && entri.cp !== undefined && Number.isFinite(Number(entri.cp))) {
    return cpBaku(["cp", String(entri.cp)]);
  }
  return null;
}

/**
 * Kerugian peluang menang (poin persen) dari kandidat #1 ke kandidat #2 pada
 * satu posisi — inti dari "apakah posisi ini menuntut langkah tertentu".
 * Dua kandidat berasal dari pencarian yang SAMA (kedalaman identik), jadi
 * selisihnya tidak tercemar perbedaan kedalaman antar-posisi.
 *
 * @returns {number|null} `null` bila kandidat #2 tidak ada atau skornya tidak
 *   terbaca — termasuk saat pengguna mematikan MultiPV (hanya 1 kandidat).
 */
export function kerugianPeluangKandidat(kandidat) {
  if (!Array.isArray(kandidat) || kandidat.length < 2) return null;
  const terbaik = cpKandidat(kandidat[0]);
  const kedua = cpKandidat(kandidat[1]);
  if (terbaik === null || kedua === null) return null;
  return Math.max(0, peluangMenang(terbaik) - peluangMenang(kedua));
}

/**
 * Apakah `move` layak dilabeli "kritis"?
 *
 * Semua syarat di bawah harus benar. Urutannya disusun dari yang paling
 * murah ke yang paling mahal karena fungsi ini dipanggil sekali per langkah
 * partai; hanya syarat nomor 6 yang menyentuh papan.
 *
 *   1. Langkah yang dimainkan = langkah terbaik mesin pada posisi sebelumnya.
 *      Langkah yang bukan terbaik sudah punya labelnya sendiri (excellent,
 *      mistake, …) — "kritis" tidak boleh menutupi penilaian itu.
 *   2. Rekaman MultiPV tersedia (kandidat #2 ada). Tanpa MultiPV, "hanya satu
 *      langkah yang menang" tidak bisa dibuktikan, jadi labelnya tidak muncul
 *      alih-alih muncul berdasarkan tebakan.
 *   3. Pemain BELUM menang mutlak tanpa langkah ini (kandidat #2 masih di
 *      bawah 700 cp). Di posisi menang telak semua langkah menang, jadi tidak
 *      ada yang istimewa.
 *   4. Pemain tidak sedang dalam posisi kalah setelah langkahnya.
 *   5. Bukan promosi ratu (langkah yang jelas-jelas terbaik bagi siapa pun;
 *      mempromosikan bidak jadi ratu bukan temuan).
 *   6. Pemain tidak sedang dalam sekak sebelum langkah — langkah balasan sekak
 *      adalah langkah wajib, bukan pilihan cerdas.
 *   7. Kandidat terbaik kedua benar-benar merugikan: peluang menangnya
 *      terpaut minimal `AMBANG_KERUGIAN_KRITIS` poin persen di bawah kandidat
 *      terbaik.
 *
 * Sengaja TIDAK dipakai (bedanya dari WintrChess, dan alasannya):
 *   - penyaringan "menang makan bidak bebas" yang menuntut mesin keamanan
 *     bidak (penyerang/pembela); modul ini hanya memakai kandidat MultiPV.
 *     Penyaringan itu menunggu modul keamanan bidak terpisah.
 *   - perbandingan skakmat-ke-skakmat (M3 → M5 berbeda beberapa poin peluang
 *     karena keduanya dipetakan ke ±1000 cp oleh `cpBaku`).
 *
 * @param {object} move langkah verbose `chess.js` (`san`, `promotion`,
 *   `before`); `before` hanya dibaca pada syarat 6.
 * @param {object} opsi
 * @param {Array} opsi.staticEval eval UCI sesudah langkah.
 * @param {Array} opsi.previousKandidat kandidat MultiPV posisi sebelumnya.
 * @param {string} opsi.previousBestMoveSan SAN langkah terbaik posisi
 *   sebelumnya (dari `parsePosition`/entri sebelumnya).
 * @returns {boolean}
 */
export function apakahLangkahKritis(move, { staticEval, previousKandidat, previousBestMoveSan } = {}) {
  if (!move || !previousBestMoveSan || previousBestMoveSan !== move.san) return false;

  if (!Array.isArray(previousKandidat) || previousKandidat.length < 2) return false;

  const terbaik = cpKandidat(previousKandidat[0]);
  const kedua = cpKandidat(previousKandidat[1]);
  if (terbaik === null || kedua === null) return false;

  // Keunggulan: `kedua` sudah dari sudut pemain yang akan bergerak.
  if (kedua >= AMBANG_UNGGUL_MUTLAK_CP) return false;

  // Kalah: `staticEval` sudut lawan, jadi sudut pemain = tandanya dibalik.
  const sesudahPemain = cpBaku(staticEval, true);
  if (sesudahPemain === null || sesudahPemain < 0) return false;

  if (move.promotion === "q") return false;

  // Satu-satunya syarat yang menyentuh papan — dikerjakan paling akhir.
  if (!move.before) return false;
  try {
    if (new Chess(move.before).isCheck()) return false;
  } catch {
    return false;
  }

  return peluangMenang(terbaik) - peluangMenang(kedua) >= AMBANG_KERUGIAN_KRITIS;
}
