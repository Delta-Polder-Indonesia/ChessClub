/** Palet papan per tema — dipakai papan teka-teki dan pratinjau langkah. */
export const TEMA_PAPAN = {
  blue: { terang: "#d7e5f0", gelap: "#4f82a8" },
  brown: { terang: "#ead2ad", gelap: "#9b6847" },
  orange: { terang: "#f5d7a1", gelap: "#cf7e36" },
  green: { terang: "#e4e8d0", gelap: "#779556" },
  grey: { terang: "#dedede", gelap: "#8c8c8c" },
  "light-blue": { terang: "#e3eff3", gelap: "#80aec1" },
  "dark-blue": { terang: "#b9cad5", gelap: "#355772" },
  wood: { terang: "#e7c78f", gelap: "#a66a35" },
  "marble-brown": { terang: "#dfd1c0", gelap: "#947966" },
  "marble-green": { terang: "#d5ddd3", gelap: "#6f8a73" },
  metal: { terang: "#aeb2b3", gelap: "#596062" },
  klasik: { terang: "#f0d9b5", gelap: "#b58863" },
  hijau: { terang: "#ebecd0", gelap: "#779556" },
};

/**
 * Papan catur interaktif untuk teka-teki — tampilan & perilaku ala chess.com.
 *
 * Gerakan bidak:
 *  - Klik bidak → klik petak tujuan (termasuk layar sentuh & keyboard).
 *  - Seret (drag & drop) bidak ke petak tujuan.
 *  - Klik kanan saat sedang menyeret (tahan kiri + drag) = batalkan:
 *    bidak kembali ke petak asal, seperti chess.com.
 *
 * Tanda bantu ala chess.com:
 *  - Klik kanan pada petak = tandai petak dengan warna kuning.
 *  - Tahan klik kanan lalu seret = gambar panah oranye (lurus; siku untuk
 *    langkah kuda).
 *  - Klik kanan pada petak yang sudah bertanda = hapus HANYA tanda itu (warna
 *    sama); warna beda = ganti warna. Mengikuti isepic-chess-ui. Aturan ada di
 *    src/lib/tandaBantu.js (satu pintu untuk semua halaman papan).
 *  - Klik kiri di mana pun pada papan = hapus SEMUA tanda & panah — termasuk
 *    saat yang ditekan bidak sendiri. Ini mengikuti Analisa
 *    (`komponen/game/board.jsx`: `cleanArrows()` pada mousedown), dan
 *    memang harus di `pointerdown`, bukan di `click`: menekan bidak sendiri
 *    memulai seret + `setPointerCapture` pada elemen papan, sehingga event
 *    `click` tidak lagi mendarat di tombol petaknya dan penghapusan lewat
 *    `onClick` (jalur lama) tidak pernah berjalan.
 *  - Shift/Ctrl/Alt saat menandai memilih warna merah/hijau/biru.
 *
 * Lencana di pojok petak:
 *  - `ikonLangkah` → klasifikasi langkah terakhir (brilian/terbaik/blunder, …).
 *  - `ikonSkakmat` → raja tumbang di atas raja lawan yang termat.
 */
