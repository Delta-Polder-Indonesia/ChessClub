import { useMemo } from "react";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { hitungMateriBidak } from "../../lib/materiBidak.js";

/**
 * Panel "selisih materi" di samping papan.
 *
 * Meniru cara ChessCompass menampilkan bahan yang sudah habis: deretan bidak
 * yang tertangkap (warna aslinya) plus angka keunggulan, mis. "+1" bila hitam
 * sudah memakan dua pion putih dan kehilangan satu kuda. Di layar sempit panel
 * ini turun ke bawah papan; mulai `lg` ia menjadi rel sempit di sisi kanan
 * papan, tepat di sebelah kiri panel ChessCompass.
 *
 * Warna mengikuti tema gelap keluarga papan, bukan palet krem rujukan.
 */
export function SelisihMateri({ fen, className = "" }) {
  const { t } = useI18n();
  const materi = useMemo(() => hitungMateriBidak(fen), [fen]);

  // Tanpa posisi (memuat, galat, atau soal kosong) tidak ada yang bisa dihitung.
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
      className={`flex shrink-0 flex-wrap content-center items-center justify-center gap-1 rounded-md bg-[#211f1c] p-1.5 ring-1 ring-[#312e2b] lg:w-12 lg:flex-col lg:flex-nowrap lg:self-center ${className}`}
    >
      <span
        aria-hidden="true"
        title={teks}
        className={`flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-bold leading-none tabular-nums ${
          unggul === "w"
            ? "bg-[#f0f0ea] text-[#1e1c18]"
            : unggul === "b"
              ? "bg-[#312e2b] text-gray-100 ring-1 ring-[#4a4744]"
              : "bg-[#2b2825] text-gray-400"
        }`}
      >
        {unggul === "w" ? `+${selisih}` : unggul === "b" ? `+${-selisih}` : "="}
      </span>

      {keping.length > 0 && (
        <span aria-hidden="true" className="flex flex-wrap items-center justify-center gap-0.5">
          {keping.map((k, i) => (
            <span key={`${k.bidak}-${i}`} className="h-4 w-4">
              <ChessPiece piece={k.bidak} className="h-full w-full" />
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
