const BATAS_EVALUASI = 400;
const PERSEN_MINIMUM = 5;
const PERSEN_MAKSIMUM = 95;

/**
 * Bilah evaluasi bersama untuk semua mode Papan Interaktif.
 * Nilai selalu dilihat dari sisi putih; orientasi hanya membalik letak isian
 * dan teks agar bilah mengikuti papan.
 */
export default function BilahEvaluasi({
  cpPutih = 0,
  matePutih = null,
  teksSkor = "",
  orientasi = "w",
  label,
  adaEvaluasi = true,
}) {
  const nilai = matePutih !== null ? Number(matePutih) : Number(cpPutih);
  const nilaiAman = Number.isFinite(nilai) ? nilai : 0;
  const persenMentah =
    ((nilaiAman + BATAS_EVALUASI) * (PERSEN_MAKSIMUM - PERSEN_MINIMUM)) /
      (BATAS_EVALUASI * 2) +
    PERSEN_MINIMUM;
  const persenPutih =
    matePutih !== null
      ? nilaiAman > 0
        ? 100
        : nilaiAman < 0
          ? 0
          : 50
      : Math.min(Math.max(persenMentah, PERSEN_MINIMUM), PERSEN_MAKSIMUM);
  const putihDiAtas = orientasi === "w";
  const sisiOrientasiUnggul = putihDiAtas ? persenPutih >= 50 : persenPutih <= 50;
  const skor =
    matePutih !== null
      ? nilaiAman !== 0
        ? `M${Math.abs(nilaiAman)}`
        : putihDiAtas
          ? "1-0"
          : "0-1"
      : teksSkor || `${nilaiAman > 0 ? "+" : ""}${(nilaiAman / 100).toFixed(1)}`;

  return (
    <div
      className={`relative flex h-full w-9 shrink-0 flex-col overflow-hidden rounded-sm bg-[#403d39] ${
        putihDiAtas ? "justify-start" : "justify-end"
      }`}
      role="img"
      aria-label={adaEvaluasi && label ? `${label}: ${skor}` : undefined}
    >
      <div
        className="w-full bg-white"
        style={{
          height: `${persenPutih}%`,
          transition: "height 1.5s",
          willChange: "height",
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex w-full flex-col items-center justify-between py-1.5 text-[11px] font-bold">
        <div
          style={{ opacity: sisiOrientasiUnggul ? 0 : 1 }}
          className={putihDiAtas ? "text-[#dedede]" : "text-[#262421]"}
        >
          {adaEvaluasi ? skor : ""}
        </div>
        <div
          style={{ opacity: sisiOrientasiUnggul ? 1 : 0 }}
          className={!putihDiAtas ? "text-[#dedede]" : "text-[#262421]"}
        >
          {adaEvaluasi ? skor : ""}
        </div>
      </div>
    </div>
  );
}
