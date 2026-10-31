/** Grafik rating ringan untuk tabel padat; nilai diurutkan dari terlama ke terbaru. */
export default function GrafikMiniRating({ nilai, label, className, dataUji }) {
  if (nilai.length < 2) return null;
  const terendah = Math.min(...nilai);
  const tertinggi = Math.max(...nilai);
  const rentang = tertinggi - terendah;
  const titik = nilai.map((rating, indeks) => ({
    x: 2 + (76 * indeks) / (nilai.length - 1),
    y: rentang ? 2 + (32 * (tertinggi - rating)) / rentang : 18,
  }));

  return (
    <svg data-uji={dataUji} role="img" aria-label={label} viewBox="0 0 80 36" width="80" height="36" className={className}>
      <polyline points={titik.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={titik.at(-1).x} cy={titik.at(-1).y} r="2" fill="currentColor" />
    </svg>
  );
}
