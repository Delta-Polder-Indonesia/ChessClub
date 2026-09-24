/*
 * Geometri grafik eval yang sama sepanjang analisis dan di tab Ringkasan.
 * Pemetaan eval → tinggi mengikuti evaluation.jsx (±400 cp → 7,5%–92,5%).
 * Posisi PGN yang belum dievaluasi tetap pada garis tengah sampai hasil masuk.
 */

const EVAL_LAMA = [-400, 400];
const EVAL_BARU = [0.075, 0.925];

/** 0 = hitam unggul, 1 = putih unggul; warna giliran berasal dari FEN. */
export function tinggiEval(move, indeks) {
  const advantage = move?.previousStaticEvals?.[0] ?? ["cp", "0"];
  const putihJalan = move?.color === "w" || (move?.color !== "b" && indeks % 2 === 0);
  const nilai = Number(advantage[1]) * (putihJalan ? 1 : -1);
  if (advantage[0] === "mate") {
    // Skakmat pada posisi akhir: giliran berikutnya sudah kalah, termasuk
    // ketika engine melaporkan "mate 0" alih-alih ["mate"] tanpa angka.
    if (!advantage[1] || nilai === 0) return putihJalan ? 0 : 1;
    return Number.isFinite(nilai) ? (nilai > 0 ? 1 : 0) : 0.5;
  }
  // Eval yang belum masuk/rusak tidak boleh merusak seluruh path SVG.
  if (!Number.isFinite(nilai)) return 0.5;
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
