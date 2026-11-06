/**
 * Bilah evaluasi mesin (ala halaman Analisa).
 *
 * Perhitungan skor → persen dipisah menjadi fungsi murni `hitungBilah` supaya
 * bisa diuji tanpa DOM. Perbaikan dari audit: orientasi dulu dibandingkan
 * dengan string `"hitam"` padahal sisa aplikasi memakai `"w"`/`"b"`, sehingga
 * papan terbalik (`"b"`) tetap dianggap putih. Sekarang hanya `"b"` yang berarti
 * hitam di bawah.
 */
import { memo } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { hitungBilah } from "../services/puzzleEvaluation.js";

const BilahEvaluasi = memo(function BilahEvaluasi({ hasil = null, orientasi = "w" }) {
  const { t } = useI18n();
  /*
   * Bilah SELALU tampil — juga sebelum mesin dinyalakan. Dulu komponen ini
   * mengembalikan `null` saat `hasil` kosong, dan karena halaman selalu
   * mengirim elemen (bukan `null`), kolom bilah jadi kosong sama sekali:
   * bilah evaluasi "hilang" dari tata letak. Tanpa hasil, bilah netral 50/50.
   */
  const { teksSkor = "", cpPutih = 0, matePutih = null } = hasil || {};
  const { persen, skor, putihDiBawah, unggul, adaMate } = hitungBilah({
    cpPutih,
    matePutih,
    orientasi,
  });

  let displayAdvantage;
  if (adaMate) {
    displayAdvantage =
      skor !== 0
        ? `M${Math.abs(skor)}`
        : putihDiBawah
          ? "1-0"
          : "0-1";
  } else {
    displayAdvantage = teksSkor || "";
  }

  return (
    <div
      data-bilah-evaluasi="true"
      className={`relative flex h-full w-9 shrink-0 flex-col overflow-hidden rounded-sm bg-[#403d39] ${
        putihDiBawah ? "justify-start" : "justify-end"
      }`}
      role="img"
      aria-label={`${t("papan.engineSkor")} ${displayAdvantage}`}
    >
      <div
        className="w-full bg-[#ffffff]"
        style={{
          height: `${persen}%`,
          transition: "height 0.4s",
          willChange: "height",
        }}
      />
      <div className="absolute inset-0 flex w-full flex-col items-center justify-between py-1.5 text-[11px] font-bold">
        <div
          style={{ opacity: unggul ? 0 : 100 }}
          className={putihDiBawah ? "text-[#dedede]" : "text-[#262421]"}
        >
          {displayAdvantage}
        </div>
        <div
          style={{ opacity: unggul ? 100 : 0 }}
          className={putihDiBawah ? "text-[#262421]" : "text-[#dedede]"}
        >
          {displayAdvantage}
        </div>
      </div>
    </div>
  );
});

export default BilahEvaluasi;
