/**
 * Basis Data Lokal untuk Halaman Analisa (IndexedDB dengan Fallback).
 *
 * Fasad kompatibilitas. Seluruh implementasi kini tinggal di
 * `./database/` — pemecahan murni tanpa perubahan perilaku:
 *
 *  - `database/migrasi.js`  — nama/versi basis, nama store, 9 indeks saat
 *                             `onupgradeneeded`, koneksi singleton, dan
 *                             cadangan memori + localStorage.
 *  - `database/partai.js`   — ID & normalisasi rekaman, simpan massal, mesin
 *                             kueri (indeks, saring, urut, paginasi), baca,
 *                             hapus partai, dan impor PGN.
 *  - `database/koleksi.js`  — pastikan/daftar/hapus koleksi + ekspor PGN.
 *  - `database/statistik.js`— statistik per koleksi (berbasis revisi) dan
 *                             statistik seluruh basis.
 *  - `database/akun.js`     — gabungkan pemain & kosongkan seluruh basis.
 *  - `database/index.js`    — bus revisi + barrel kelima modul di atas.
 *
 * Daftar ekspor di bawah ini SENGAJA ditulis eksplisit: ia adalah permukaan
 * publik beku (v1) yang dipakai 10 berkas UI dan 6 skrip uji. Nama internal
 * seperti `bukaDB`, `STORE_PARTAI`, `telusuriKursor`, atau `naikkanRevisi`
 * tidak boleh bocor lewat fasad ini. Menambah ekspor = mengubah API publik,
 * jadi harus lewat keputusan sadar, bukan efek samping `export *`.
 */

export {
  bacaRevisiBasis,
  langgananRevisi,
  buatIdPartai,
  normalisasiHasil,
  normalisasiDataPartai,
  hitungStatistikKoleksiRingan,
  simpanBanyakPartai,
  pastikanKoleksi,
  ambilSemuaKoleksi,
  ambilDaftarPartai,
  ambilPartai,
  hapusPartai,
  hapusKoleksi,
  gabungkanPemain,
  bersihkanBasisData,
  hitungStatistikBasisData,
  eksporPgnKoleksi,
  imporPgnKeBasisData,
} from "./database/index.js";
