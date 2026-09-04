/*
 * Kerangka popup modal untuk bilah navigasi Analisa.
 *
 * Tampilannya mengikuti modal en-croissant (Mantine Modal): latar digelapkan,
 * kartu tengah dengan judul di atas, isi di bawah, dan tombol tutup (×).
 * Memakai token tema `.analisa-root` sehingga ikut gelap/terang tema papan.
 */
import { useEffect } from "react";

export default function Popup({ judul, subjudul, onTutup, children, className = "" }) {
  useEffect(() => {
    function tutupSaatEsc(e) {
      if (e.key === "Escape") onTutup();
    }
    document.addEventListener("keydown", tutupSaatEsc);
    return () => document.removeEventListener("keydown", tutupSaatEsc);
  }, [onTutup]);

  return (
    <div
      data-uji="popup"
      className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/70 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-[440px] select-text rounded-borderExtraRoundness border border-border bg-backgroundBoxDarker shadow-2xl ${className}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <p className="text-base font-extrabold text-foreground">{judul}</p>
            {subjudul ? <p className="mt-0.5 text-xs leading-4 text-foregroundGrey">{subjudul}</p> : null}
          </div>
          <button
            type="button"
            data-uji="popup-tutup"
            onClick={onTutup}
            aria-label="Tutup"
            className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-borderRoundness text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
