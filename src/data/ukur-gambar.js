/**
 * Peta ukuran gambar publik — dihasilkan oleh `node scripts/optimumkan-gambar.mjs`.
 * JANGAN disunting tangan; jalankan ulang skripnya kalau ada gambar baru.
 *
 *   UKUR["/images/x.webp"] = [lebarAsli, tinggiAsli, [lebarVarian…]]
 *
 * Varian disimpan sebagai lebarnya saja: berkasnya selalu di samping aslinya
 * dengan nama "x-<lebar>.webp" (konvensi yang sama dipakai sumberHero()).
 * src/lib/asets.js → sumberGambar() membaca peta ini untuk membentuk srcSet,
 * jadi tidak ada kandidat gambar yang menunjuk berkas kosong.
 *
 *   DILEWATI["/images/y.webp"] = [640]
 *
 * Lebar yang sudah dicoba tetapi sengaja TIDAK dibuatkan variannya karena
 * berkas aslinya sudah lebih ramping daripada hasil kompresi ulang.
 */
export const UKUR = {
  "/images/logo-mark-light.webp": [
    336,
    336,
    [
      52
    ]
  ]
};

export const DILEWATI = {};
