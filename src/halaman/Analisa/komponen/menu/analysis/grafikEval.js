/*
 * Geometri grafik eval. Murni (tanpa React/DOM) karena dipakai dua tempat yang
 * harus menghasilkan kurva identik:
 *   - `gameChart.jsx` — grafik tab Ringkasan setelah analisa selesai;
 *   - `../loading/grafikMuat.jsx` — grafik yang tumbuh selama analisa berjalan
 *     (adopsi grafik Report WintrChess).
 * Pemetaan eval → tinggi mengikuti `evaluation.jsx` (skala ±400 cp → 7,5%–92,5%
 * tinggi) supaya bentuk kurvanya sejalan dengan eval bar di samping papan.
 */

const EVAL_LAMA = [-400, 400];
const EVAL_BARU = [0.075, 0.925];

/**
 * Posisi vertikal relatif satu langkah: 0 = hitam unggul penuh, 1 = putih
 * unggul penuh. `indeks` menentukan warna yang jalan (indeks genap = putih),
 * sama seperti perhitungan di grafik Ringkasan.
 */
export function tinggiEval(move, indeks) {
  const advantage = move?.previousStaticEvals?.[0] ?? ["cp", "0"];
  const putihJalan = indeks % 2 === 0;
  const nilai = Number(advantage[1]) * (putihJalan ? 1 : -1);
  if (advantage[0] === "mate") {
    if (advantage[1]) return nilai >= 0 ? 1 : 0;
    return putihJalan ? 0 : 1;
  }
  const mentah = (nilai - EVAL_LAMA[0]) * (EVAL_BARU[1] - EVAL_BARU[0]) / (EVAL_LAMA[1] - EVAL_LAMA[0]) + EVAL_BARU[0];
  return Math.min(Math.max(mentah, EVAL_BARU[0]), EVAL_BARU[1]);
}

/** Koordinat x satu langkah pada ruang gambar selebar `lebar`. */
export function xGrafik(indeks, total, lebar) {
  return lebar * (indeks / Math.max(1, total));
}

/**
 * Jalur SVG area eval untuk `moves`, termasuk sisi kanan-bawah-kiri yang
 * menutup area. Daftar kosong atau satu entri tetap menghasilkan jalur sah
 * (tanpa `NaN`) — grafik muncul begitu ada langkah, termasuk saat analisa
 * masih berjalan.
 */
export function jalurGrafik(moves, lebar, tinggi) {
  const total = Math.max(1, moves.length - 1);
  const titik = moves.map((move, i) => (
    `L ${xGrafik(i, total, lebar)} ${tinggi * (1 - tinggiEval(move, i))}`
  )).join(" ");
  return `M 0 ${tinggi * 0.5} ${titik} L ${lebar} ${tinggi} L 0 ${tinggi}`;
}
