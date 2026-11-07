/**
 * Konstanta filter & kelas rating Wawasan.
 *
 * Dipindah dari `layarWawasan.jsx` agar `filterBar.jsx` dan `kartuProfil.jsx`
 * bisa memakainya tanpa mengimpor layar induk.
 */

export const OPSI_WAKTU = [
  { nilai: "all", kunci: "analisa.wawasan.filterSemua" },
  { nilai: "bullet", label: "Bullet" },
  { nilai: "blitz", label: "Blitz" },
  { nilai: "rapid", label: "Rapid" },
  { nilai: "daily", label: "Daily" },
];

export const OPSI_WARNA = [
  { nilai: "all", kunci: "analisa.wawasan.filterKeduaWarna" },
  { nilai: "white", kunci: "analisa.wawasan.sebagaiPutih" },
  { nilai: "black", kunci: "analisa.wawasan.sebagaiHitam" },
];

export const OPSI_TANGGAL = [
  { nilai: "all", kunci: "analisa.wawasan.filterSemuaWaktu" },
  { nilai: "30d", kunci: "analisa.wawasan.filter30Hari" },
  { nilai: "90d", kunci: "analisa.wawasan.filter90Hari" },
  { nilai: "365d", kunci: "analisa.wawasan.filter1Tahun" },
];

export const KELAS_RATING = [
  { kunci: "rapid", label: "Rapid" },
  { kunci: "blitz", label: "Blitz" },
  { kunci: "bullet", label: "Bullet" },
  { kunci: "classical", label: "Classical" },
  { kunci: "daily", label: "Daily" },
];
