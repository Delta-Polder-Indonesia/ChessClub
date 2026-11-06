/*
 * Utilitas bersama layar Basis Data: format tanggal/ukuran, jendela nomor
 * halaman, status hasil partai, dan konstanta tata letak tabel.
 *
 * Dipisah dari `layarDatabase.jsx` (Fase 3) karena dipakai tiga modul:
 * orkestrasi layar, tabel Partai, dan tabel Ringkasan. Semuanya murni —
 * tidak menyentuh React maupun basis data — sehingga aman diuji terpisah.
 */

/* ── Konstanta ─────────────────────────────────────────────────────── */

/** Biru aksen (mantine blue) — dipakai spinner loading tab Pemain & Event. */
export const BIRU = "#4a9dd9";

export const BARIS_PER_HALAMAN = 50;
export const JUMLAH_BARIS_SKELETON = 7; // jumlah baris skeleton
export const TINGGI_BARIS = "h-[56px]"; // tinggi konsisten per baris
export const LEBAR_JENDELA_HALAMAN = 5; // jumlah tombol nomor halaman yang tampil

/* ── Utilitas ──────────────────────────────────────────────────────── */

export function formatTanggal(timestamp, locale = "id") {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return "";
  }
}

export function daftarHalaman(aktif, total) {
  return Array.from({ length: LEBAR_JENDELA_HALAMAN }, (_, i) => aktif + i).filter(
    (hlm) => hlm <= total,
  );
}

/* ── Utilitas Statistik Koleksi & Format Ukuran ───────────────────── */

/** Format byte → "220 KB" / "7.36 MB" (gaya kartu En Croissant). */
export function formatUkuran(byte) {
  const b = Number(byte) || 0;
  if (b <= 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 1024 * 10 ? 0 : 1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/*
 * Status hasil ± dari sudut pandang pemain yang sedang dilihat:
 * - ada `perspectiveUser`: "+" (hijau) bila pemain itu menang, "−" (merah)
 *   bila kalah — sama seperti pemilih partai.
 * - tanpa perspektif ("Semua Koleksi"): ikut konvensi dunia, putih menang = "+".
 */
export function statusHasil(game, perspectiveUser) {
  const pemenang = game.result === "white" ? "white" : game.result === "black" ? "black" : "";
  if (!pemenang) return "draw";
  const pemain = String(perspectiveUser || "").trim().toLowerCase();
  if (!pemain) return pemenang === "white" ? "win" : "loss";
  const pemainMenang =
    (pemenang === "white" && String(game.whiteName || "").toLowerCase() === pemain) ||
    (pemenang === "black" && String(game.blackName || "").toLowerCase() === pemain);
  return pemainMenang ? "win" : "loss";
}
