import { useMemo } from "react";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { hitungMateriBidak } from "../../lib/materiBidak.js";

/** Indikator materi minimal di sisi papan Teka-teki Harian. */
export function SelisihMateri({ fen, className = "" }) {
  const { t } = useI18n();
  const materi = useMemo(() => hitungMateriBidak(fen), [fen]);

  if (!fen) return null;

  const { selisih, keping } = materi;
  const unggul = selisih > 0 ? "w" : selisih < 0 ? "b" : null;
  const teks = unggul
    ? t(
        unggul === "w"
          ? "tekaTekiHarian.materiPutihUnggul"
          : "tekaTekiHarian.materiHitamUnggul",
        { n: Math.abs(selisih) }
      )
    : t("tekaTekiHarian.materiSeimbang");

  return (
    <div
      role="group"
      aria-label={t("tekaTekiHarian.materiAria", { teks })}
      data-selisih={selisih}
      data-keping={keping.map((k) => k.bidak).join("")}
      className={`flex shrink-0 flex-col items-center justify-center gap-0.5 ${className}`}
    >
      {unggul && (
        <span
          aria-hidden="true"
          title={teks}
          className="text-sm font-semibold leading-5 tabular-nums text-current"
        >
          +{Math.abs(selisih)}
        </span>
      )}

      {keping.length > 0 && (
        <span aria-hidden="true" className="flex flex-col items-center gap-0">
          {keping.map((k, i) => (
            <span key={`${k.bidak}-${i}`} className="block h-5 w-5">
              <ChessPiece piece={k.bidak} className="h-full w-full" />
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
