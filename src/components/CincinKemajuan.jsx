/**
 * Cincin kemajuan untuk blok status di halaman konten.
 *
 * Bentuknya mengikuti cincin "Rating / Estimated / 1 of 3" di worldchess.com:
 * satu lingkaran tipis, satu busur gelap sepanjang `nilai / maks`, dan teks di
 * tengahnya. Dipakai panel progres "Teka-teki Hari Ini" di Landing.
 *
 * Catatan penting:
 * - Semua teks adalah HTML di atas SVG (bukan `<text>` di dalam SVG), supaya
 *   ukurannya mengikuti skala tipografi situs dan tidak pernah sekecil 12 px.
 *   SVG-nya `aria-hidden`; satu-satunya keterangan untuk pembaca layar adalah
 *   `aria-label` terjemahan yang dikirim pemanggil.
 * - Komponen ini tidak menetapkan `role="progressbar"`; pemanggil yang
 *   menaruhnya di track/segmen, karena cincin di sini hanya penguat visual.
 * - Tanpa gradient dan tanpa gambar: satu lingkaran latar + satu busur.
 */
export default function CincinKemajuan({
  nilai = 0,
  maks = 1,
  label,
  subLabel,
  nilaiTeks,
  catatan,
  ukuran = 160,
  ariaLabel,
  className = "",
}) {
  const total = Math.max(1, Number(maks) || 1);
  const terpakai = Math.min(total, Math.max(0, Number(nilai) || 0));
  const jariJari = 93.6;
  const keliling = 2 * Math.PI * jariJari;
  const panjangBusur = (terpakai / total) * keliling;

  return (
    <div
      data-cincin-kemajuan
      role="img"
      aria-label={ariaLabel}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: ukuran, height: ukuran }}
    >
      <svg aria-hidden="true" viewBox="0 0 200 200" fill="none" className="h-full w-full">
        <circle
          cx="100"
          cy="100"
          r={jariJari}
          stroke="currentColor"
          strokeWidth="0.9"
          className="text-grey-300"
        />
        <circle
          cx="100"
          cy="100"
          r={jariJari}
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeDasharray={`${panjangBusur} ${Math.max(0, keliling - panjangBusur)}`}
          transform="rotate(-90 100 100)"
          className="text-grey-800 transition-[stroke-dasharray] duration-500"
          data-busur-cincin={terpakai}
        />
      </svg>

      <div className="absolute inset-0 flex translate-x-[2px] flex-col items-center justify-center gap-y-1 px-4 text-center">
        {label && (
          <p className="font-sans text-base font-light text-grey-800">{label}</p>
        )}
        {subLabel && (
          <p className="font-sans text-base font-light text-grey-600">{subLabel}</p>
        )}
        {nilaiTeks && (
          <p className="whitespace-nowrap pt-1 font-serif text-[48px] font-light leading-[0.8] text-grey-800">
            {nilaiTeks}
          </p>
        )}
        {catatan && (
          <p className="max-w-32 pt-1 font-sans text-xs font-light leading-[14px] text-grey-600">
            {catatan}
          </p>
        )}
      </div>
    </div>
  );
}
