/*
 * Kerangka popup modal untuk bilah navigasi Analisa.
 *
 * Tampilannya mengikuti modal en-croissant (Mantine Modal): latar digelapkan,
 * kartu tengah dengan judul di atas, isi di bawah, dan tombol tutup (×).
 * Memakai token tema `.analisa-root` sehingga ikut gelap/terang tema papan.
 */
import { useEffect } from "react";

export default function Popup({ judul, subjudul, onTutup, children, className = "", fullLayar = false, lebarKiri = 0, headerKanan = null, bawahJudul = null }) {
  useEffect(() => {
    function tutupSaatEsc(e) {
      if (e.key === "Escape") onTutup();
    }
    document.addEventListener("keydown", tutupSaatEsc);
    return () => document.removeEventListener("keydown", tutupSaatEsc);
  }, [onTutup]);

  const kelasKartu = fullLayar
    ? "relative flex h-full w-full flex-col select-text bg-backgroundBoxDarker shadow-2xl"
    : "relative flex w-full max-w-[440px] flex-col select-text rounded-borderExtraRoundness border border-border bg-backgroundBoxDarker shadow-2xl";

  return (
    <div
      data-uji="popup"
      className={`fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/70 ${fullLayar ? "p-0" : "p-4"}`}
      style={fullLayar && lebarKiri > 0 ? { left: lebarKiri } : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`${kelasKartu} ${className}`}
      >
        {judul || subjudul || bawahJudul || headerKanan ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 shrink-0">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-foreground">{judul}</p>
              {bawahJudul ? <div className="mt-1.5">{bawahJudul}</div> : subjudul ? <p className="mt-0.5 text-xs leading-4 text-foregroundGrey">{subjudul}</p> : null}
            </div>
            {headerKanan ? (
              <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">{headerKanan}</div>
            ) : null}
          </div>
        ) : null}
        <div className={`min-h-0 px-5 py-4 ${fullLayar ? "flex-1 flex flex-col" : "overflow-y-auto max-h-[75vh]"}`}>{children}</div>
      </div>
    </div>
  );
}
