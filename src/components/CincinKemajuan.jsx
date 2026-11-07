/**
 * Cincin kemajuan kecil untuk blok status di halaman konten.
 *
 * Dipakai widget "Teka-teki Hari Ini" di Landing dengan pola kartu progres
 * worldchess.com ("Rating Estimated / 1 of 3"): satu cincin tipis, angka besar
 * di tengah, dan satu catatan kecil di bawahnya.
 *
 * Catatan penting:
 * - Angka di dalam cincin adalah TEKS sungguhan, bukan bagian SVG, sehingga
 *   pembaca layar dan uji teks tetap membacanya. SVG-nya `aria-hidden`.
 * - Komponen ini tidak menetapkan `role="progressbar"`; pemanggil yang
 *   menaruhnya di track/segmen, karena cincin ini hanya penguat visual.
 * - Tanpa gradient dan tanpa gambar: satu lingkaran latar + satu busur yang
 *   panjangnya mengikuti `nilai / maks`.
 */
export default function CincinKemajuan({
  nilai = 0,
  maks = 1,
  label,
  nilaiTeks,
  catatan,
  ukuran = 136,
  className = "",
}) {
  const total = Math.max(1, Number(maks) || 1);
  const terpakai = Math.min(total, Math.max(0, Number(nilai) || 0));
  const jariJari = 50;
  const keliling = 2 * Math.PI * jariJari;
  const panjangBusur = (terpakai / total) * keliling;

  return (
    <div
      data-cincin-kemajuan
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: ukuran, height: ukuran }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        fill="none"
      >
        <circle
          cx="60"
          cy="60"
          r={jariJari}
          stroke="currentColor"
          strokeWidth="4"
          className="text-grey-200"
        />
        <circle
          cx="60"
          cy="60"
          r={jariJari}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${panjangBusur} ${Math.max(0, keliling - panjangBusur)}`}
          className="text-primary transition-[stroke-dasharray] duration-500"
          data-busur-cincin={terpakai}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-0.5 px-3 text-center">
        {label && (
          <p className="font-mono text-[12px] uppercase tracking-wider text-grey-600">
            {label}
          </p>
        )}
        <p className="font-serif text-2xl font-semibold leading-none text-grey-800">
          {nilaiTeks}
        </p>
        {catatan && (
          <p className="font-sans text-xs leading-tight text-grey-600">{catatan}</p>
        )}
      </div>
    </div>
  );
}
