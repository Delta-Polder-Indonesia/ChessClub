/**
 * Skor kecurigaan penggunaan engine (anti-cheat) berbasis hasil analisis PGN.
 *
 * Dua tingkat perhitungan:
 *  1. PER PARTAI — `hitungSkorKecurigaan(moves)` memakan array `moves` hasil
 *     `parsePGN()` (lihat ./engine.js) dan mengembalikan `{ w, b }`.
 *  2. AGREGAT RIWAYAT — `agregatSkorPemain(daftarHasilPartai, username)`
 *     menggabungkan banyak partai menjadi satu gambaran per pemain.
 *
 * DUA GENERASI METRIK (keduanya hidup berdampingan):
 *  - GENERASI 1 (selalu tersedia): kecocokan top-1 (`engineMatchRate`) dan
 *    ACPL dari selisih eval antarposisi.
 *  - GENERASI 2 (bila `moves[i].kandidat` ada, hasil pencarian MultiPV):
 *    peringkat langkah pemain di antara MULTI_PV kandidat terbaik posisi
 *    sebelumnya, kecocokan top-3/top-5, dan kehilangan centipawn langsung
 *    terhadap kandidat terbaik pada pencarian yang SAMA — jauh lebih tajam
 *    daripada top-1, karena langkah "hampir terbaik" (peringkat 2, selisih
 *    8 cp) tidak lagi dihitung sama dengan langkah buruk (peringkat 6+).
 *    Semua metrik generasi 2 bernilai null bila data kandidat tidak ada
 *    (analisis lama, atau partai hasil cache sebelum fitur ini) dan skor
 *    otomatis menormalkan ulang bobotnya.
 *
 * METRIK SEPADAN PLATFORM LAIN (./akurasi.js, metode lichess/en-croissant):
 * `akurasi` (harmonic mean kurva win chance), `akurasiAritmetik`, `acplBaku`
 * (kerugian cp dengan eval dipotong ±1000, mate = ±1000), dan hitungan
 * `anotasi` NAG (`??` `?` `?!` `!!` `!` `!?`). Angka-angka inilah yang bisa
 * disandingkan dengan yang tampil di lichess/en-croissant. Yang LAMA
 * (`acpl`, dan akurasi label di `summary/playersAccuracy.jsx`) tetap ada dan
 * tetap menjadi masukan `skorKecurigaan`. Skor memakai ambang global yang
 * sama untuk semua pemain; rating hanya boleh ditampilkan sebagai metadata,
 * bukan dipakai untuk memberi kelonggaran/penalti. Lihat
 * `docs/PERBANDINGAN-METRIK-AKURASI.md`.
 *
 * Keluarannya adalah SKOR HEURISTIK, bukan probabilitas empiris: belum ada
 * korpus berlabel yang membuktikan bahwa skor tertentu berarti peluang
 * kecurangan tertentu. Angka ini hanya petunjuk untuk peninjauan manusia,
 * BUKAN vonis. Kecocokan langkah dengan engine naik secara alami seiring
 * kekuatan pemain, kontrol waktu yang panjang, dan fase akhirpartai yang
 * sederhana; semua itu membuat pemain jujur bisa tampak "mirip engine".
 * Karena itu setiap metrik disajikan mentah di samping skor gabungan, dan UI
 * wajib menyertakan sanggahan (lihat `layarDeteksiEngine.jsx`).
 *
 * Semua fungsi di sini MURNI (gaya ./penilaian.js): tidak ada React, tidak
 * ada DOM, tidak ada pemanggilan engine — hanya membaca output yang sudah
 * dihasilkan ./engine.js (impor `MULTI_PV` hanyalah konstanta).
 *
 * KONVENSI EVAL (penting, jangan diubah tanpa membaca ./penilaian.js):
 * `staticEval` berbentuk mentah UCI — `["cp", "34"]` atau `["mate", "2"]` —
 * relatif terhadap PIHAK YANG BERGILIR pada posisi tersebut. Pada satu entri
 * `moves[i]`:
 *   - `previousStaticEvals[0]` = eval SESUDAH langkah `san` dimainkan,
 *     giliran = `color` (lawan pemain);
 *   - `previousStaticEvals[1]` = eval SEBELUM langkah itu, giliran = pemain.
 * Dengan begitu kerugian langkah (centipawn, dari sudut pemain yang bergerak)
 * adalah `cp(prev[1]) + cp(prev[0])` untuk KEDUA warna — lihat penurunan di
 * `kerugianCentipawn`. Skor kandidat MultiPV juga dari sudut pihak yang
 * bergilir (= pemain), sehingga selisih antarkandidat boleh langsung
 * dikurangkan tanpa pembalikan tanda.
 *
 * PETA BERKAS (Fase 5) — berkas ini kini hanya pintu masuk:
 *  - `antiCheat/dasar.js`     konstanta, eval, kandidat MultiPV, statistik waktu
 *  - `antiCheat/kalibrasi.js` tabel kalibrasi rating + komponen skor
 *  - `antiCheat/skor.js`      skor satu partai (`skorKecurigaan`)
 *  - `antiCheat/agregat.js`   gabungan banyak partai (`agregatSkorPemain`)
 * Arah ketergantungan satu jalur: dasar → kalibrasi → skor → agregat.
 * Semua ekspor lama tetap tersedia dari sini, jadi pemanggil tidak berubah.
 */

export { MULTI_PV } from "./engine.js";

/*
 * Metrik gaya lichess/en-croissant ikut diekspor dari sini: pemanggil
 * anti-cheat (panel Deteksi Engine, Dashboard akun, laporan peninjauan)
 * cukup bergantung pada satu modul. Rumusnya sendiri ada di ./akurasi.js.
 */
export {
  akurasiMove,
  anotasiMove,
  CP_AWAL,
  CP_CEILING,
  DAFTAR_ANOTASI,
  harmonikDariJumlah,
  kerugianMove,
  peluangMenang,
  petaAnotasiKosong,
  rataHarmonik,
} from "./akurasi.js";

export * from "./antiCheat/dasar.js";
export * from "./antiCheat/kalibrasi.js";
export * from "./antiCheat/skor.js";
export * from "./antiCheat/agregat.js";
