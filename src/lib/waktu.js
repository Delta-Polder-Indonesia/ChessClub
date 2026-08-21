/**
 * Utilitas waktu bersama.
 *
 * Komunitas beroperasi di Asia/Jakarta (UTC+7, tanpa DST). Jam turnamen
 * disimpan server sebagai string lokal "YYYY-MM-DD HH:MM" TANPA zona waktu.
 * Bila diurai dengan `new Date(string)` hasilnya bergantung zona browser
 * pengunjung (bisa bergeser 1 hari/1 jam). Di sini semua string lokal
 * komunitas diurai eksplisit sebagai UTC+7 agar tampil konsisten di mana pun.
 */

/** Zona waktu komunitas (Asia/Jakarta). */
export const ZONA_KOMUNITAS = "Asia/Jakarta";

/**
 * Tanggal "hari ini" dalam zona komunitas, format YYYY-MM-DD.
 * ("en-CA" menghasilkan YYYY-MM-DD.) Dipakai untuk batas input date dsb.
 */
export function hariIniLokal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_KOMUNITAS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Ubah nilai waktu menjadi objek Date.
 * - "YYYY-MM-DD"          → tengah malam Asia/Jakarta
 * - "YYYY-MM-DD HH:MM"    → jam tersebut di Asia/Jakarta
 * - "YYYY-MM-DDTHH:MM…Z"  → ISO biasa (diurai apa adanya)
 * - nilai lain            → null bila tidak bisa diurai
 */
export function parseWaktuKomunitas(nilai) {
  if (!nilai) return null;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/.exec(String(nilai));
  if (m) {
    const d = new Date(`${m[1]}T${m[2]}:00+07:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(nilai))) {
    const d = new Date(`${nilai}T00:00:00+07:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(nilai);
  return Number.isNaN(d.getTime()) ? null : d;
}
