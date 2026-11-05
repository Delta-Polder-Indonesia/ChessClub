/**
 * Filter & pengelompokan soal Teka-Teki — murni, tanpa React.
 *
 * Semua aturan "soal mana yang masuk kolam" dulu ditulis sebagai rangkaian
 * `if` di dalam `useMemo` milik komponen halaman. Di sini aturan itu menjadi
 * fungsi yang bisa diuji langsung, termasuk kesetaraan pita level.
 */

/** Pita rating selector Level, mengikuti level NACCL (1–5). */
export const PITA_LEVEL = {
  1: (r) => r < 1000,
  2: (r) => r >= 1000 && r < 1250,
  3: (r) => r >= 1250 && r < 1550,
  4: (r) => r >= 1550 && r < 1900,
  5: (r) => r >= 1900,
};

/**
 * Level (1–5) untuk sebuah rating.
 *
 * Sebelumnya ada dua sumber kebenaran: `bandLevel()` dan `PITA_LEVEL` memakai
 * ambang yang sama tetapi ditulis dua kali. Sekarang `bandLevel` diturunkan
 * dari `PITA_LEVEL`, jadi keduanya tidak mungkin menyimpang.
 */
export function bandLevel(rating) {
  const nilai = Number(rating) || 0;
  for (let level = 1; level <= 5; level += 1) {
    if (PITA_LEVEL[level](nilai)) return level;
  }
  return 5;
}

/** Nilai awal semua filter. */
export const FILTER_AWAL = {
  koleksi: "lichess",
  pelatih: "semua",
  tipe: "semua",
  level: "semua",
  tema: "semua",
  giliran: "semua",
};

/**
 * Kolam soal untuk sebuah koleksi.
 * @returns {Array|null} null selama data koleksi belum dimuat.
 */
export function kolamKoleksi(semuaSoal, soalTambahan, koleksi) {
  if (koleksi === "lichess") return semuaSoal;
  if (!soalTambahan) return null;
  if (koleksi === "video") return soalTambahan.filter((m) => Boolean(m.video));
  if (koleksi === "legenda") {
    return soalTambahan.filter((m) => (m.kurasi || "").split(" ").includes("legenda"));
  }
  if (koleksi === "studi") {
    return soalTambahan.filter((m) => (m.kurasi || "").split(" ").includes("studi"));
  }
  return soalTambahan;
}

/** Daftar pelatih (nama + jumlah) yang muncul minimal dua kali pada kolam aktif. */
export function daftarPelatihDari(kolamAktif, koleksi) {
  if (!kolamAktif || koleksi === "lichess") return [];
  const hitung = new Map();
  for (const m of kolamAktif) {
    if (m.pelatih) hitung.set(m.pelatih, (hitung.get(m.pelatih) || 0) + 1);
  }
  return [...hitung.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1]);
}

/**
 * Terapkan seluruh filter aktif pada kolam.
 * @param {object} filter `{ pelatih, tipe, level, tema, giliran }`
 */
export function saringSoal(kolamAktif, filter = FILTER_AWAL) {
  if (!kolamAktif) return null;
  let hasil = kolamAktif;
  if (filter.pelatih && filter.pelatih !== "semua") {
    hasil = hasil.filter((m) => m.pelatih === filter.pelatih);
  }
  if (filter.tipe && filter.tipe !== "semua") {
    hasil = hasil.filter((m) => m.type === filter.tipe);
  }
  if (filter.level && filter.level !== "semua") {
    const pita = PITA_LEVEL[filter.level];
    if (pita) hasil = hasil.filter((m) => pita(m.rating ?? 0));
  }
  if (filter.tema && filter.tema !== "semua") {
    hasil = hasil.filter((m) => (m.tema || "").split(" ").includes(filter.tema));
  }
  if (filter.giliran && filter.giliran !== "semua") {
    hasil = hasil.filter((m) => m.first === filter.giliran);
  }
  return hasil;
}

/** Kunci filter yang mengubah isi kolam (memicu pemilihan ulang soal). */
export function kunciFilter(filter = FILTER_AWAL) {
  return [
    filter.koleksi,
    filter.pelatih,
    filter.tipe,
    filter.level,
    filter.tema,
    filter.giliran,
  ].join("|");
}
