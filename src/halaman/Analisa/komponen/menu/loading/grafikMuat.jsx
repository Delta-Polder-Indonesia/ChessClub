/* Grafik eval yang tumbuh selama analisa berjalan. */
/*
 * Adopsi dari WintrChess: di sana grafik Report (`EvaluationGraph`) sudah
 * terlihat selagi posisi dinilai satu per satu, jadi pengguna menyaksikan
 * kurvanya terbentuk. Di sini hal yang sama dikerjakan di dalam kartu muat —
 * `moves` yang datang dari `parsePGN` bertambah tiap langkah selesai.
 *
 * Geometri kurvanya dipakai bersama `gameChart.jsx` (`../analysis/grafikEval.js`)
 * supaya bentuk yang tumbuh selama analisa sama persis dengan grafik tab
 * Ringkasan setelah analisa selesai. Ruang gambarnya tetap (400×96) dan
 * direntangkan lewat `viewBox`, jadi tidak perlu mengukur lebar wadah.
 */
import { jalurGrafik } from "../analysis/grafikEval.js";
const LEBAR = 400;
const TINGGI = 96;
function GrafikMuat(props) {
  const { moves = [], label } = props;
  // Satu entri = posisi awal saja; belum ada kurva yang bisa digambar.
  if (moves.length < 2) return null;
  return <svg viewBox={`0 0 ${LEBAR} ${TINGGI}`} role="img" aria-label={label} className="w-full h-24 bg-evaluationBarBlack rounded-borderRoundness">
            <path fill="#ffffff" d={jalurGrafik(moves, LEBAR, TINGGI)} />
            <line x1={0} y1={TINGGI / 2} x2={LEBAR} y2={TINGGI / 2} className="stroke-foregroundGrey opacity-75 stroke-2" />
        </svg>;
}
export {
  GrafikMuat as default
};
