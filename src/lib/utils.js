export { cn } from "cn"

/**
 * Jalankan operasi penyimpanan (`localStorage`) yang boleh gagal.
 *
 * Akses localStorage bisa ditolak — mode privat, kuota penuh, atau kebijakan
 * peramban — dan kegagalan itu memang tidak boleh menghentikan halaman.
 * Kesalahannya tetap ditelan (perilaku pengguna tidak berubah), tetapi satu
 * jejak `console.debug` ditinggalkan supaya penyebab data yang tidak
 * tersimpan bisa dilacak.
 *
 * @param {() => any} fn operasi penyimpanan yang dijalankan
 * @param {string} label keterangan singkat untuk jejak debug
 * @returns {any} hasil `fn`, atau `undefined` bila gagal
 */
export function coba(fn, label) {
  try {
    return fn();
  } catch (galat) {
    console.debug(`[penyimpanan] ${label} gagal:`, galat);
    return undefined;
  }
}
