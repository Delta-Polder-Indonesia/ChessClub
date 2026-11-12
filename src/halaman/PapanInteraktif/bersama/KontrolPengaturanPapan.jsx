import { X } from "lucide-react";
import "../../Analisa/analisa.css";
import { ChessPiece } from "../../../components/chess/ChessPiece.jsx";
import { Switch } from "../../../components/ui/switch.jsx";
import { TEMA_PAPAN } from "../../TekaTeki/temaPapan.js";

const BIDAK_PRATINJAU = ["R", "N", "B", "Q", "K", "P"];

export const KELAS_SELECT =
  "h-10 w-auto max-w-full rounded-borderRoundness border border-border bg-[#272727] px-2 text-sm text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-[#81b64c]";

export const KELAS_TOMBOL_AKSI =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-borderRoundness border border-border bg-[#272727] px-3 text-sm font-medium text-foreground outline-none transition-colors hover:border-borderHighlighted focus-visible:border-[#81b64c]";

export function PratinjauBidak({ set }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-[11.5rem] shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[0.25rem] border border-border bg-[#272727] px-1.5"
    >
      {BIDAK_PRATINJAU.map((bidak) => (
        <ChessPiece key={bidak} piece={bidak} set={set} className="h-6 w-6 object-contain" />
      ))}
    </div>
  );
}

export function PratinjauPapan({ tema }) {
  const palet = TEMA_PAPAN[tema] ?? TEMA_PAPAN.metal;
  return (
    <div
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 grid-cols-8 overflow-hidden rounded-[0.25rem] border border-border"
    >
      {Array.from({ length: 64 }, (_, i) => (
        <span
          key={i}
          style={{
            backgroundColor:
              (Math.floor(i / 8) + (i % 8)) % 2 === 0 ? palet.terang : palet.gelap,
          }}
        />
      ))}
    </div>
  );
}

export function BarisPilihan({ judul, deskripsi = "", pratinjau = null, sejajar = false, children }) {
  if (sejajar) {
    return (
      <div className="flex items-center justify-between gap-4 border-b border-border py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{judul}</p>
          {deskripsi && (
            <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pratinjau}
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="border-b border-border py-3">
      <p className="text-sm font-semibold text-foreground">{judul}</p>
      {deskripsi && (
        <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {pratinjau}
        {children}
      </div>
    </div>
  );
}

export function BarisSakelar({
  judul,
  deskripsi = "",
  checked,
  onCheckedChange,
  switchProps = {},
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{judul}</p>
        {deskripsi && (
          <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
        )}
      </div>
      <Switch
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={judul}
        {...switchProps}
      />
    </div>
  );
}

export function BarisAksi({ judul, deskripsi = "", children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{judul}</p>
        {deskripsi && (
          <p className="mt-0.5 text-xs leading-5 text-foregroundGrey">{deskripsi}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function KartuPengaturanPapan({
  judul = "",
  onTutup = null,
  labelTutup = "",
  className = "",
  children,
  ...rest
}) {
  return (
    <div
      className={`analisa-root flex min-h-0 flex-col overflow-hidden rounded-[0.4rem] border border-border text-foreground ${className}`}
      style={{ backgroundColor: "#262421" }}
      {...rest}
    >
      {(judul || onTutup) && (
        <div className="relative flex shrink-0 items-center justify-center px-4 pt-4">
          {judul && (
            <h2 className="text-center text-base font-bold text-foreground">{judul}</h2>
          )}
          {onTutup && (
            <button
              type="button"
              onClick={onTutup}
              className="absolute right-3 top-3 rounded p-1 text-foregroundGrey transition-colors hover:bg-white/10 hover:text-foreground"
              aria-label={labelTutup}
              title={labelTutup}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-4 [&>*:first-child]:pt-0 [&>*:last-child]:border-b-0 [&>*:last-child]:pb-0">
        {children}
      </div>
    </div>
  );
}
