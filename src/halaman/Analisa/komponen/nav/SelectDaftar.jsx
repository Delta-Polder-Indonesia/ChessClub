import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import Check from "../svg/check.jsx";

/**
 * Dropdown daftar bergaya panel Analisa (dipakai layar Deteksi Engine dan
 * Layar Papan). Menampilkan tombol + daftar opsi kustom; select asli
 * dipertahankan tersembunyi untuk target uji/AT.
 *
 * @param {object} p
 * @param {string} p.labelTeks  label tersembunyi (a11y / select asli)
 * @param {string} [p.dataUji]  atribut data-uji pada select asli
 * @param {string|number} p.nilai
 * @param {Array<{nilai: string|number, label: string}>} p.opsi
 * @param {(nilai: string|number) => void} p.onPilih
 * @param {boolean} [p.disabled]
 */
export default function SelectDaftar({ labelTeks, dataUji, nilai, opsi, onPilih, disabled }) {
  const [terbuka, setTerbuka] = useState(false);
  const wadahRef = useRef(null);

  useEffect(() => {
    if (!terbuka) return undefined;
    function klikLuar(e) {
      if (!wadahRef.current?.contains(e.target)) setTerbuka(false);
    }
    function tekanEsc(e) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", tekanEsc);
    return () => {
      document.removeEventListener("mousedown", klikLuar);
      document.removeEventListener("keydown", tekanEsc);
    };
  }, [terbuka]);

  const kini = String(nilai ?? "");
  const aktif = opsi.find((o) => String(o.nilai) === kini) ?? opsi[0];

  return (
    <div ref={wadahRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setTerbuka((b) => !b)}
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none transition-colors hover:border-borderHighlighted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{aktif?.label ?? ""}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 text-foregroundGrey transition-transform ${terbuka ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {terbuka ? (
        <ul role="listbox" className="absolute left-0 top-full z-[1200] mt-1 w-max min-w-full max-w-[320px] rounded-borderRoundness border border-border bg-[#272727] py-1 shadow-2xl">
          {opsi.map((o) => {
            const dipilih = String(o.nilai) === kini;
            return (
              <li key={o.nilai || "_kosong"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={dipilih}
                  onClick={() => {
                    onPilih(o.nilai);
                    setTerbuka(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-sm transition-colors hover:bg-[#090909] hover:text-white ${dipilih ? "bg-[#090909] font-semibold text-white" : "text-foreground"}`}
                >
                  <span className="truncate">{o.label}</span>
                  {dipilih ? <Check className="h-3 w-3 shrink-0 text-foregroundHighlighted" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <label className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0">
        {labelTeks}
        <select value={nilai} onChange={(e) => onPilih(e.target.value)} disabled={disabled} data-uji={dataUji} tabIndex={-1} aria-hidden="true">
          {opsi.map((o) => (
            <option key={o.nilai || "_kosong"} value={o.nilai}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
