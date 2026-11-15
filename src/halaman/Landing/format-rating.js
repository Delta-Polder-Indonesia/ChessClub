/**
 * Utilitas format + konstanta rating yang diekspor BERSAMA komponen.
 *
 * Dipisah dari komponen-rating.jsx agar Fast Refresh react-refresh
 * hanya melihat komponen di file itu (tidak protes karena ada
 * fungsi/konstanta yang diekspor dari file yang sama dengan komponen).
 */

/* Daftar emoji pengalaman (5 tingkat), kunci dipakai komponen FormUlasan. */
export const emojiList = (t) => [
  { value: 1, emoji: "😞", label: t("landing.rating.emoji1") },
  { value: 2, emoji: "😕", label: t("landing.rating.emoji2") },
  { value: 3, emoji: "😐", label: t("landing.rating.emoji3") },
  { value: 4, emoji: "😊", label: t("landing.rating.emoji4") },
  { value: 5, emoji: "🤩", label: t("landing.rating.emoji5") },
];

/* Palet warna avatar (lingkaran) — dipilih deterministik dari nama. */
export const WARNA_AVATAR = [
  "bg-purple-600 text-white",
  "bg-emerald-600 text-white",
  "bg-rose-600 text-white",
  "bg-amber-500 text-white",
  "bg-sky-600 text-white",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white",
  "bg-pink-600 text-white",
];

export function warnaUntuk(nama) {
  let hash = 0;
  for (let i = 0; i < (nama || "").length; i++) hash = (hash * 31 + nama.charCodeAt(i)) >>> 0;
  return WARNA_AVATAR[hash % WARNA_AVATAR.length];
}

/** Angka dengan pemisah ribuan (paksa gaya lokal: titik/koma untuk id, koma untuk en). */
export function formatRibuan(n, locale) {
  try {
    return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(n);
  } catch { return String(n); }
}

/** Tanggal DD/MM/YY (Play Store style). */
export function formatTanggalSingkat(ts) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Waktu relatif: "baru saja" / "n menit/jam/hari/minggu/bulan/tahun yang lalu". */
export function waktuRelatif(ts, t) {
  const detik = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (detik < 60) return t("landing.rating.baruSaja");
  const menit = Math.floor(detik / 60);
  if (menit < 60) return t("landing.rating.yangLalu", { n: menit, satuan: t("landing.rating.menit") });
  const jam = Math.floor(menit / 60);
  if (jam < 24) return t("landing.rating.yangLalu", { n: jam, satuan: t("landing.rating.jam") });
  const hari = Math.floor(jam / 24);
  if (hari < 7) return t("landing.rating.yangLalu", { n: hari, satuan: t("landing.rating.hari") });
  const minggu = Math.floor(hari / 7);
  if (minggu < 5) return t("landing.rating.yangLalu", { n: minggu, satuan: t("landing.rating.minggu") });
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return t("landing.rating.yangLalu", { n: bulan, satuan: t("landing.rating.bulan") });
  const tahun = Math.floor(bulan / 12);
  return t("landing.rating.yangLalu", { n: tahun, satuan: t("landing.rating.tahun") });
}
