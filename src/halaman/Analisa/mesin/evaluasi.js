/**
 * Bantuan bersama evaluasi engine untuk fitur Analisa.
 *
 * Kenapa modul ini ada: lima modul (./engine.js, ./penilaian.js, ./akurasi.js,
 * ./langkahKritis.js, ./antiCheat.js) semuanya membaca skor UCI mentah
 * (`["cp", "34"]` / `["mate", "2"]`, relatif terhadap pihak yang bergilir)
 * dan masing-masing punya salinan logika "mate → angka" sendiri. Begitu satu
 * kasus tepi berubah (skakmat yang sudah dikirim, skor rusak), kelimanya
 * harus diubah berbarengan — dan dulu memang pernah menyimpang diam-diam.
 * Modul ini adalah satu-satunya tempat konvensi itu didefinisikan; yang lain
 * hanya memakai dan mengekspor ulang.
 *
 * KONVENSI SKAKMAT (dipegang seluruh halaman):
 *   - `["mate", "N"]` dengan N > 0 = pihak yang bergilir MEMBERI skakmat
 *     dalam N langkah (konvensi UCI/Stockfish, sudah divalidasi empiris di
 *     scripts/uji-engine-uci.mjs).
 *   - `["mate", "N"]` dengan N < 0 = pihak yang bergilir TERSERANG skakmat.
 *   - `["mate", "0"]` = skakmat SUDAH dikirim: pihak yang bergilir sudah
 *     mati (tidak ada "mat dalam 0" yang artinya menang — kalau belum mati,
 *     partainya belum selesai). Karena itu mate 0 SELALU dibaca sebagai
 *     kekalahan pihak yang bergilir (`tandaMate(0) === -1`), bukan 0.
 *   - `["mate"]` tanpa angka = bentuk WARISAN posisi mati (dulu ditulis
 *     ./engine.js). Penulis baru tidak boleh mengeluarkannya lagi, tetapi
 *     pembaca tetap menerimanya dan memperlakukannya sama dengan mate 0.
 *
 * STATUS EVALUASI satu langkah (`statusEvaluasi`, ditempel ./engine.js):
 *   - `"siap"` = langkah selesai dinilai engine, evalnya valid.
 *   - `"gagal"` = eval hilang/rusak sehingga kualitasnya tidak bisa dinilai
 *     (langkah semacam ini TIDAK BOLEH lolos sebagai "excellent" — lihat
 *     `evalSiap`, dipakai semua agregator untuk melewatinya).
 *   - `"dibatalkan"` = analisis langkah ini dibatalkan pengguna.
 *   Entri lama (cache, uji, sebelum status ini ada) tidak punya kuncinya dan
 *   diperlakukan sebagai `"siap"` — lihat `evalSiap`.
 *
 * STATUS LANGKAH PAKSA (`isForced`, ditempel ./engine.js): langkah paksa
 * (satu-satunya langkah legal) adalah STATUS, bukan kualitas — ia tetap
 * dinilai kualitasnya seperti biasa (best/excellent/…) supaya angkanya jujur,
 * dan keterpaksaannya dicatat terpisah. Label `moveRating: "forced"` warisan
 * tetap dikenali (`langkahTerpaksa`) untuk data lama.
 *
 * Murni: tanpa React, tanpa DOM, tanpa pemanggilan engine. Hanya boleh
 * mengimpor ./peluang.js (kurva + batas cp) — JANGAN mengimpor ./penilaian.js,
 * ./akurasi.js, ./antiCheat.js, atau ./engine.js dari sini (lingkaran impor).
 */

import { batasiCp, CP_CEILING } from "./peluang.js";

/**
 * Status evaluasi satu langkah — lihat kepala modul.
 * `undefined` (data lama) berarti `"siap"`, bukan status keempat.
 */
export const STATUS_EVALUASI = Object.freeze({
  SIAP: "siap",
  GAGAL: "gagal",
  DIBATALKAN: "dibatalkan",
});

/**
 * Nilai mate yang berarti "skakmat sudah dikirim" (pihak yang bergilir mati).
 * Bukan 0 yang netral — lihat `tandaMate`.
 */
export const MATE_DISAMPAIKAN = 0;

/**
 * Bentuk kanal skor UCI mentah → bentuk baku, atau `null` bila tidak bisa
 * dipakai (kosong, jenis tak dikenal, angka tak terbaca).
 *
 * Lenien terhadap SATU bentuk warisan: `["mate"]` tanpa angka diterima dan
 * dikembalikan sebagai `["mate", "0"]` (posisi mati = skakmat terkirim).
 * Selain itu keluarannya selalu `[jenis, angka-desimal-sebagai-string]`.
 *
 * @param {Array} evalMentah `["cp", "34"]` / `["mate", "2"]` / warisan / sampah.
 * @returns {Array|null} `["cp"|"mate", "<int>"]` atau `null`.
 */
export function normalisasiEval(evalMentah) {
  if (!Array.isArray(evalMentah)) return null;
  const [jenis, mentah] = evalMentah;
  if (jenis !== "cp" && jenis !== "mate") return null;
  // Payload absen: warisan ["mate"] = skakmat terkirim; ["cp"] tanpa angka
  // TIDAK punya makna (bukan 0!) dan ditolak. Kehadiran diuji eksplisit —
  // `Number(null)` adalah 0 sehingga `isFinite` mentah bukan uji kehadiran.
  if (mentah === undefined || mentah === null || mentah === "") {
    return jenis === "mate" ? ["mate", "0"] : null;
  }
  const angka = Number(mentah);
  if (!Number.isFinite(angka)) return null;
  // Skor UCI selalu bilangan bulat; pecahan (kalau ada) dibulatkan supaya
  // perbandingan downstream (`=== 0`, paritas) tidak meleset presisi.
  return [jenis, String(Math.trunc(angka))];
}

/**
 * Apakah eval ini berarti "posisi sudah mati terskakmat" — mate dengan nilai
 * 0 ATAU bentuk warisan tanpa angka. Dipakai cabang "skakmat sudah pasti" di
 * ./penilaian.js dan tampilan skor yang sudah-akhir (FormatEval, Evaluation).
 */
export function apakahMateTerminal(evalMentah) {
  if (!Array.isArray(evalMentah) || evalMentah[0] !== "mate") return false;
  const mentah = evalMentah[1];
  if (mentah === undefined || mentah === null || mentah === "") return true;
  return Number(mentah) === 0;
}

/**
 * Tanda kemenangan pihak yang bergilir dari angka mate UCI: +1 = memberi
 * mat, −1 = terserang mat. `0` berarti SUDAH MATI (bukan remis/netral!),
 * jadi hasilnya −1 — inilah yang membuat `Math.sign` mentah tidak boleh
 * dipakai langsung di mana pun. Bukan-angka → `null`.
 *
 * @param {number|string} nilai angka mate UCI (boleh string "−3").
 * @returns {1|-1|null}
 */
export function tandaMate(nilai) {
  // Absen (null/undefined/"") BUKAN angka 0 — tolak eksplisit, karena
  // `Number(null)` dan `Number("")` sama-sama 0 (finite!).
  if (nilai === null || nilai === undefined || nilai === "") return null;
  const angka = Number(nilai);
  if (!Number.isFinite(angka)) return null;
  if (angka === 0) return -1;
  return angka > 0 ? 1 : -1;
}

/**
 * `staticEval` mentah UCI → centipawn BAKU (mate → ±1000, dipotong ±1000),
 * setara `normalizeScore` en-croissant. Pindahan dari ./akurasi.js supaya
 * satu definisi dipakai semua modul (diekspor ulang dari sana agar pemanggil
 * lama — termasuk ./langkahKritis.js dan ./antiCheat.js — tidak berubah).
 *
 * @param {Array} staticEval `["cp", "34"]` / `["mate", "2"]`.
 * @param {boolean} [balikTanda] `true` bila pihak yang bergilir BUKAN pemain
 *   yang dinilai (yaitu eval SESUDAH langkah pemain dimainkan) sehingga
 *   tandanya harus dibalik agar terbaca dari sudut pemain.
 * @returns {number|null} `null` bila datanya tidak ada/rusak.
 */
export function cpBaku(staticEval, balikTanda = false) {
  if (!Array.isArray(staticEval) || staticEval.length < 2) return null;
  // Payload absen (mis. ["cp", null]) ditolak — BUKAN dibaca 0. Tanpa ini
  // `Number(null)` menjadi 0 dan eval rusak menyamar jadi posisi seimbang.
  const mentah = staticEval[1];
  if (mentah === null || mentah === undefined || mentah === "") return null;
  // Mate 0 = pihak bergilir sudah mati (−1000), BUKAN posisi seimbang.
  // `tandaMate` (bukan `Math.sign`, yang mengubah 0 menjadi 0) yang menjamin
  // langkah skakmat terbaca sebagai kemenangan mutlak pemberinya.
  // Tanda yang tak-terbaca → `null`: `null * CP_CEILING` adalah 0 (finite!)
  // dan tanpa penjagaan ini eval mate rusak menyamar jadi posisi seimbang.
  let angka;
  if (staticEval[0] === "mate") {
    const tanda = tandaMate(mentah);
    if (tanda === null) return null;
    angka = tanda * CP_CEILING;
  } else {
    angka = Number(mentah);
  }
  if (!Number.isFinite(angka)) return null;
  const cp = balikTanda ? -angka : angka;
  return batasiCp(cp);
}

/**
 * Apakah satu entri langkah layak ikut agregasi (akurasi, anti-cheat,
 * hitungan label, ekspor)? Hanya entri berstatus `"gagal"`/`"dibatalkan"`
 * yang ditolak; entri TANPA status (data lama, posisi awal, kerangka PGN)
 * dianggap siap — status ini aditif, bukan filter baru untuk data lama.
 */
export function evalSiap(move) {
  if (!move || typeof move !== "object") return false;
  const status = move.statusEvaluasi;
  if (status === undefined || status === null) return true;
  return status !== STATUS_EVALUASI.GAGAL && status !== STATUS_EVALUASI.DIBATALKAN;
}

/**
 * Apakah langkah ini langkah PAKSA (tak punya pilihan lain)? Benar bila flag
 * `isForced` menyala ATAU label warisan `"forced"` masih menempel (data lama
 * dan fixture uji). Keduanya berarti sama: langkah ini tidak mengatakan
 * apa pun tentang keputusan pemain, jadi dikeluarkan dari semua metrik yang
 * menilai keputusan (akurasi label, anti-cheat, NAG ekspor).
 */
export function langkahTerpaksa(move) {
  if (!move || typeof move !== "object") return false;
  return move.isForced === true || move.moveRating === "forced";
}

/**
 * Label yang TAMPIL untuk satu entri langkah (ikon + warna + kalimat):
 * langkah paksa memakai tampilan `"forced"` warisan walau kualitas aslinya
 * tersimpan terpisah (`moveRating` + `isForced`) — lihat `langkahTerpaksa`.
 * SATU-SATUNYA definisi pemetaan tampil: daftar langkah (termasuk tetangga
 * untuk aturan ikon), grafik, kartu komentar, dan sorotan papan semuanya
 * memakai ini supaya tidak menyimpang satu sama lain.
 */
export function ratingTampilan(move) {
  return langkahTerpaksa(move) ? "forced" : move?.moveRating;
}
