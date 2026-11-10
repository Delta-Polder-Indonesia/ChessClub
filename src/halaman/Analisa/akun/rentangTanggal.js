/*
 * Perhitungan rentang tanggal untuk panel "Tinjau partai Anda".
 *
 * Semua tanggal di sini berupa kunci "YYYY-MM-DD" yang dihitung di UTC —
 * bukan objek `Date` lokal. Alasannya: `muatPartaiAkun.js` memotong arsip
 * memakai batas milidetik UTC, jadi kalau tanggal dibentuk dari `Date` lokal
 * (mis. `new Date(2026, 10, 1)` di UTC+7) kuncinya akan bergeser satu hari
 * dan partai tanggal 1 ikut terbuang. Satu-satunya tempat zona waktu boleh
 * ikut campur adalah *menampilkan* tanggal, dan itu pun dikunci dengan
 * `timeZone: "UTC"` pada setiap `Intl.DateTimeFormat`.
 */

const SEHARI = 86400000;

/** Kunci "YYYY-MM-DD" dari milidetik (selalu UTC). */
function kunciHari(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Milidetik UTC pada tengah malam kunci "YYYY-MM-DD" itu. */
function msDariKunci(kunci) {
  const [tahun, bulan, hari] = String(kunci ?? "").split("-").map(Number);
  if (!tahun || !bulan || !hari) return Number.NaN;
  return Date.UTC(tahun, bulan - 1, hari);
}

/** Kunci hari ini menurut UTC. */
function hariIniUTC() {
  return kunciHari(Date.now());
}

/** Geser kunci sejauh `n` hari (bisa negatif). */
function tambahHari(kunci, n) {
  return kunciHari(msDariKunci(kunci) + n * SEHARI);
}

/** Pecah kunci menjadi komponen tanggal UTC. */
function bagianTanggal(kunci) {
  const ms = msDariKunci(kunci);
  if (Number.isNaN(ms)) return { tahun: 0, bulan: 0, hari: 0 };
  const d = new Date(ms);
  return { tahun: d.getUTCFullYear(), bulan: d.getUTCMonth(), hari: d.getUTCDate() };
}

/*
 * Urutan preset pada kolom kiri kalender.
 *
 * "semua" sengaja dipertahankan meski blok acuan tidak memilikinya: tanpanya
 * pengguna tidak bisa lagi menarik seluruh arsip akun, padahal itu cara
 * utama mengisi basis data untuk statistik keseluruhan.
 */
const PRESET_RENTANG = [
  "hariIni",
  "kemarin",
  "7hari",
  "30hari",
  "bulanIni",
  "bulanLalu",
  "tahunIni",
  "tahunLalu",
  "semua",
];

/**
 * Rentang inklusif sebuah preset, dalam kunci UTC.
 *
 * `null` bila bukan preset yang dikenal — pemanggil bebas menentukan rentang
 * sendiri (preset "kustom") tanpa harus memeriksa daftar ini.
 */
function rentangPreset(preset, hariIni = hariIniUTC()) {
  if (!PRESET_RENTANG.includes(preset)) return null;
  const { tahun, bulan } = bagianTanggal(hariIni);

  if (preset === "semua") return { dari: "", sampai: "" };
  if (preset === "hariIni") return { dari: hariIni, sampai: hariIni };
  if (preset === "kemarin") {
    const kemarin = tambahHari(hariIni, -1);
    return { dari: kemarin, sampai: kemarin };
  }
  if (preset === "7hari") return { dari: tambahHari(hariIni, -6), sampai: hariIni };
  if (preset === "30hari") return { dari: tambahHari(hariIni, -29), sampai: hariIni };
  if (preset === "bulanIni") {
    return { dari: kunciHari(Date.UTC(tahun, bulan, 1)), sampai: hariIni };
  }
  // Hari ke-0 bulan berjalan = hari terakhir bulan sebelumnya.
  if (preset === "bulanLalu") {
    return {
      dari: kunciHari(Date.UTC(tahun, bulan - 1, 1)),
      sampai: kunciHari(Date.UTC(tahun, bulan, 0)),
    };
  }
  if (preset === "tahunIni") return { dari: kunciHari(Date.UTC(tahun, 0, 1)), sampai: hariIni };
  if (preset === "tahunLalu") {
    return {
      dari: kunciHari(Date.UTC(tahun - 1, 0, 1)),
      sampai: kunciHari(Date.UTC(tahun - 1, 11, 31)),
    };
  }
  return null;
}

/**
 * 42 sel (6 pekan) untuk satu bulan, supaya tinggi kalender tidak berubah
 * saat berganti bulan. `awalMinggu`: 1 = Senin (id), 0 = Minggu (en).
 */
function susunGridBulan(tahun, bulan, awalMinggu = 1) {
  const pertama = Date.UTC(tahun, bulan, 1);
  const geser = (new Date(pertama).getUTCDay() - awalMinggu + 7) % 7;
  const mulai = pertama - geser * SEHARI;

  return Array.from({ length: 42 }, (_, i) => {
    const tanggal = new Date(mulai + i * SEHARI);
    return {
      kunci: kunciHari(mulai + i * SEHARI),
      hari: tanggal.getUTCDate(),
      luar: tanggal.getUTCMonth() !== bulan || tanggal.getUTCFullYear() !== tahun,
    };
  });
}

/** Nama hari singkat (Sen, Sel, …) sesuai urutan awal minggu yang diminta. */
function namaHariPendek(lokal, awalMinggu = 1) {
  const format = new Intl.DateTimeFormat(lokal, { weekday: "short", timeZone: "UTC" });
  // 7 Januari 2024 adalah hari Minggu — dipakai sebagai patokan.
  return Array.from({ length: 7 }, (_, i) =>
    format.format(new Date(Date.UTC(2024, 0, 7 + ((awalMinggu + i) % 7)))),
  );
}

function namaBulan(lokal, tahun, bulan) {
  return new Intl.DateTimeFormat(lokal, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(tahun, bulan, 1)));
}

function formatTanggal(lokal, kunci) {
  return new Intl.DateTimeFormat(lokal, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(msDariKunci(kunci)));
}

function labelHari(lokal, kunci) {
  return new Intl.DateTimeFormat(lokal, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(msDariKunci(kunci)));
}

/** Geser satu bulan pada pasangan (tahun, bulan). */
function geserBulan(tahun, bulan, langkah) {
  const ms = Date.UTC(tahun, bulan + langkah, 1);
  const d = new Date(ms);
  return { tahun: d.getUTCFullYear(), bulan: d.getUTCMonth() };
}

export {
  formatTanggal,
  geserBulan,
  hariIniUTC,
  kunciHari,
  labelHari,
  msDariKunci,
  namaBulan,
  namaHariPendek,
  bagianTanggal,
  PRESET_RENTANG,
  rentangPreset,
  susunGridBulan,
  tambahHari,
};
