import { useMemo } from "react";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { hitungMateriBidak } from "../../lib/materiBidak.js";

/** Selisih materi pada sudut papan untuk sisi putih dan hitam. */
export function SelisihMateri({ fen, orientasi = "w" }) {
  const { t } = useI18n();
  const materi = useMemo(() => hitungMateriBidak(fen), [fen]);

  if (!fen) return null;

  const { selisih, kepingPutih, kepingHitam } = materi;
  const putihDiAtas = orientasi === "b";
  const putih = {
    warna: "w",
    skor: selisih > 0 ? selisih : 0,
    keping: kepingPutih,
    teks: selisih > 0
      ? t("tekaTekiHarian.materiPutihUnggul", { n: selisih })
      : t("tekaTekiHarian.materiSeimbang"),
  };
  const hitam = {
    warna: "b",
    skor: selisih < 0 ? Math.abs(selisih) : 0,
    keping: kepingHitam,
    teks: selisih < 0
      ? t("tekaTekiHarian.materiHitamUnggul", { n: Math.abs(selisih) })
      : t("tekaTekiHarian.materiSeimbang"),
  };
  const sisiAtas = putihDiAtas ? putih : hitam;
  const sisiBawah = putihDiAtas ? hitam : putih;

  const tampilkanSisi = (sisi) => {
    if (!sisi.skor && !sisi.keping.length) return null;
    return (
      <div
        key={sisi.warna}
        data-sisi={sisi.warna}
        aria-label={t("tekaTekiHarian.materiAria", { teks: sisi.teks })}
        className="flex w-7 flex-col items-center gap-0"
      >
        {sisi.skor > 0 && (
          <span
            title={sisi.teks}
            className="text-sm font-semibold leading-5 tabular-nums text-current"
          >
            +{sisi.skor}
          </span>
        )}
        {sisi.keping.map((k, i) => (
          <span key={`${k.bidak}-${i}`} className="block h-6 w-6">
            <ChessPiece piece={k.bidak} className="h-full w-full" />
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      role="group"
      aria-label={t("tekaTekiHarian.materiAria", {
        teks: selisih === 0
          ? t("tekaTekiHarian.materiSeimbang")
          : selisih > 0
            ? t("tekaTekiHarian.materiPutihUnggul", { n: selisih })
            : t("tekaTekiHarian.materiHitamUnggul", { n: Math.abs(selisih) }),
      })}
      data-selisih={selisih}
      data-keping={materi.keping.map((k) => k.bidak).join("")}
      className="pointer-events-none absolute -right-8 inset-y-0 z-20 flex flex-col items-center justify-between py-1"
    >
      {tampilkanSisi(sisiAtas)}
      {tampilkanSisi(sisiBawah)}
    </div>
  );
}
