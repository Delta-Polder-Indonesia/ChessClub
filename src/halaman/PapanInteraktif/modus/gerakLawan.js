/**
 * Klik move untuk lawan di mode Human vs Computer.
 *
 * Satu event `click` pada petak asal sudah cukup untuk membuat papan
 * memperlakukan lawan seperti pemain yang menyentuh bidak: sorotan petak dan
 * titik tujuan muncul lewat jalur `onKlik` yang sama dengan klik pemain.
 * `pointerdown` sengaja tidak dikirim — di PapanTekaTeki itu memicu
 * `onHapusTanda`, sehingga panah dan tanda milik pemain terhapus hanya karena
 * lawan menyentuh bidaknya.
 *
 * Jedenya acak dalam rentang pendek, bukan angka tetap, supaya gerakan tidak
 * terbaca seperti animasi mesin.
 */

const ACAK = (min, maks) => min + Math.random() * (maks - min);
const jeda = (ms) => new Promise((selesai) => window.setTimeout(selesai, ms));

/**
 * Klik satu petak milik lawan, lalu tunggu sampai sorotannya sempat terlihat.
 * Balasan `false` berarti petak tidak ditemukan di DOM; pemanggil tetap harus
 * menjalankan langkahnya sendiri supaya giliran tidak macet.
 */
export async function klikLawan(papan, dari) {
  const el = papan?.querySelector(`[data-petak="${dari}"]`);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      button: 0,
    })
  );
  await jeda(ACAK(180, 320));
  return true;
}
