/**
 * Normalisasi & sidik jari identitas anggota.
 *
 * Tujuan: satu ORANG bisa punya banyak username Chess.com, tetapi nomor
 * HP/WA, nomor DANA, dan kombinasi nama+tanggal lahir jauh lebih sulit
 * diganti. Nilai-nilai itu dinormalisasi lalu di-hash, sehingga pengurus
 * tetap bisa mengenali pendaftar berulang tanpa menyimpan data pribadi
 * dalam bentuk terbaca.
 *
 * Dipakai bersama oleh sisi browser (validasi cepat) dan sisi server
 * (server/) agar aturannya tidak pernah berbeda.
 */

/** Normalisasi input: username, @user, atau tautan chess.com/member/user */
export function normalisasiUsername(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/(www\.)?chess\.com\/member\//i, "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#\s]/)[0];
  return s.toLowerCase();
}

/**
 * Nomor Indonesia ke bentuk baku 62xxxxxxxxx.
 * "0812-3456-7890", "+62 812 3456 7890", "62 81234567890", "812 3456 7890"
 * semuanya menghasilkan "6281234567890".
 */
export function normalisasiHp(raw) {
  let s = String(raw || "").trim();
  // Buang semua kecuali angka (spasi, tanda hubung, kurung, titik, plus).
  s = s.replace(/\D/g, "");
  if (!s) return "";
  // 0812… -> 62812…
  if (s.startsWith("0")) s = "62" + s.slice(1);
  // 62… biarkan
  else if (s.startsWith("62")) {
    /* sudah baku */
  }
  // 812… (tanpa awalan) -> 62812…
  else if (s.startsWith("8")) s = "62" + s;
  return s;
}

/** Nomor HP valid untuk Indonesia: 62 + 8xx + 7–11 digit. */
export function hpValid(raw) {
  const s = normalisasiHp(raw);
  return /^628[1-9][0-9]{6,11}$/.test(s);
}

/** Tampilan ramah: 6281234567890 -> +62 812-3456-7890 */
export function formatHp(raw) {
  const s = normalisasiHp(raw);
  if (!s.startsWith("62")) return raw || "";
  const inti = s.slice(2);
  const a = inti.slice(0, 3);
  const b = inti.slice(3, 7);
  const c = inti.slice(7);
  return `+62 ${a}${b ? "-" + b : ""}${c ? "-" + c : ""}`;
}

/**
 * Nama untuk pencocokan: huruf kecil, tanpa gelar/tanda baca, spasi rapat.
 * "Budi   Santoso." dan "budi santoso" dianggap sama.
 */
export function normalisasiNama(raw) {
  return String(raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Kota untuk pencocokan longgar: "Kota Medan" / "medan" -> "medan". */
export function normalisasiKota(raw) {
  return normalisasiNama(raw)
    .replace(/^(kota|kab|kabupaten|kotamadya)\s+/, "")
    .trim();
}

/**
 * Tanggal lahir baku YYYY-MM-DD, atau "" bila tidak valid.
 * Validasi KALENDER eksplisit: `new Date("2026-02-30T00:00:00Z")` di V8
 * di-rollover menjadi 2 Maret dan tampak "valid" — di sini komponen
 * tanggal dibandingkan ulang agar 30 Februari dst. ditolak.
 */
export function normalisasiTanggal(raw) {
  const s = String(raw || "").trim();
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!cocok) return "";
  const [y, m, d] = [Number(cocok[1]), Number(cocok[2]), Number(cocok[3])];
  if (m < 1 || m > 12 || d < 1 || d > 31) return "";
  const tgl = new Date(Date.UTC(y, m - 1, d));
  if (
    tgl.getUTCFullYear() !== y ||
    tgl.getUTCMonth() !== m - 1 ||
    tgl.getUTCDate() !== d
  ) {
    return "";
  }
  return s;
}

/** Umur (tahun penuh) pada tanggal acuan. */
export function hitungUmur(tanggalLahir, acuan = new Date()) {
  const s = normalisasiTanggal(tanggalLahir);
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  let umur = acuan.getFullYear() - y;
  const belumUlangTahun =
    acuan.getMonth() + 1 < m ||
    (acuan.getMonth() + 1 === m && acuan.getDate() < d);
  if (belumUlangTahun) umur -= 1;
  return umur;
}

/** Kategori umur untuk turnamen. */
export function kategoriUmur(tanggalLahir, acuan = new Date()) {
  const umur = hitungUmur(tanggalLahir, acuan);
  if (umur == null) return null;
  if (umur < 13) return "Pemula Cilik";
  if (umur < 18) return "Junior";
  if (umur < 50) return "Umum";
  return "Senior";
}

/**
 * Kunci-kunci identitas yang dipakai untuk mendeteksi pendaftar berulang.
 * Mengembalikan nilai MENTAH yang sudah dinormalisasi — pemanggil yang
 * bertanggung jawab meng-hash-nya sebelum disimpan.
 */
export function kunciIdentitas({ hp, dana, namaLengkap, tanggalLahir }) {
  const kunci = {};
  const nHp = normalisasiHp(hp);
  if (nHp) kunci.hp = nHp;

  const nDana = normalisasiHp(dana);
  // DANA memakai nomor HP; bila sama dengan HP utama tidak perlu kunci ganda.
  if (nDana && nDana !== nHp) kunci.dana = nDana;

  const nNama = normalisasiNama(namaLengkap);
  const nLahir = normalisasiTanggal(tanggalLahir);
  // Nama saja terlalu umum ("budi"); dipasangkan dengan tanggal lahir.
  if (nNama && nLahir) kunci.namaLahir = `${nNama}|${nLahir}`;

  return kunci;
}

/** Label alasan pemblokiran agar seragam di seluruh aplikasi. */
export const ALASAN_BLOKIR = {
  FAIR_PLAY: "fair_play_violations",
  DITUTUP: "akun_ditutup",
  MANUAL: "keputusan_pengurus",
};
