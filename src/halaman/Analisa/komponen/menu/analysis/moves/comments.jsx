/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import RatingSVG from "../../../svg/rating.jsx";
import { useI18n } from "../../../../../../lib/i18n.jsx";

/**
 * Kartu penjelasan satu langkah: label penilaian (brilian/blunder/…),
 * skor evaluasi posisi, dan kalimat komentar engine.
 *
 * Kalimat komentar TIDAK lagi dibekukan di objek hasil analisis; mesin hanya
 * menulis `commentKey` + `commentIndex` (lihat ../../../../mesin/penilaian.js)
 * dan teksnya diambil dari kamus di sini. Akibatnya bahasa bisa diganti kapan
 * saja tanpa menganalisis ulang partai. Untuk label "book", `comment` berisi
 * nama pembukaan dari tabel buku dan dipakai apa adanya.
 */

/** Format kalimat penghubung per label ("e4 adalah langkah brilian"). */
const FORMAT_LABEL = {
  book: "adalahLangkahA",
  forced: "adalah",
  brilliant: "adalah",
  great: "adalahLangkahA",
  best: "adalah",
  excellent: "adalah",
  good: "adalah",
  inaccuracy: "adalahLangkahAn",
  mistake: "adalahLangkahA",
  miss: "adalahLangkahA",
  blunder: "adalahLangkahA",
};

/**
 * Bentuk skor UCI mentah → teks siap tampil.
 * `evaluation = ["cp", "34"]` atau `["mate", "2"]`; skor engine selalu relatif
 * terhadap pihak yang bergilir, jadi dinormalisasi ke sudut pandang `white`.
 */
function FormatEval({ evaluation, white, smaller, best }) {
  const angka = Number(evaluation?.[1]) / 100 * (white ? 1 : -1);
  let karakter = "";
  if (angka > 0) karakter = "+";
  if (angka < 0) karakter = "-";

  let teks;
  if (evaluation?.[0] === "mate" && evaluation[1]) {
    teks = `${karakter}M${Math.abs(Number(evaluation[1])) - Number(Boolean(best))}`;
  } else if (!evaluation?.[1]) {
    teks = white ? "0-1" : "1-0";
  } else {
    teks = `${karakter}${Math.abs(angka).toFixed(2)}`;
  }

  return (
    <div
      style={{
        fontSize: smaller ? "14px" : "",
        padding: smaller ? "2px" : "",
        width: smaller ? "46px" : "",
        backgroundColor: karakter === "-" ? "var(--evaluationBarBlack)" : "var(--evaluationBarWhite)",
        color: karakter === "-" ? "var(--foreground)" : "var(--foregroundBlack)",
        filter: karakter === "-" ? "" : "brightness(0.9)",
      }}
      className="rounded-borderRoundness py-1 font-extrabold w-[61px] text-center"
    >
      {teks}
    </div>
  );
}

function Comments({ comment, commentKey, commentIndex, rating, moveSan, evaluation, white, overallGameComment }) {
  const { t } = useI18n();

  const komentar = commentKey
    ? t(`analisa.komentar.${commentKey}.${Number(commentIndex) || 0}`)
    : comment;

  if (!komentar || !rating || !moveSan) {
    return (
      <div
        className="bg-white w-[85%] rounded-borderExtraRoundness p-3.5 text-sm font-semibold text-foregroundBlack leading-6"
        dangerouslySetInnerHTML={{ __html: overallGameComment ?? "" }}
      />
    );
  }

  const label = t(`analisa.penilaian.${rating}`);
  const format = FORMAT_LABEL[rating] ?? "adalah";

  return (
    <div style={{ backgroundColor: "#ffffff" }} className="w-[85%] min-h-24 p-3.5 rounded-borderExtraRoundness text-foregroundBlack text-sm font-semibold flex flex-col gap-1.5">
      <div className="flex flex-row justify-between items-center gap-3">
        <div className="flex flex-row items-center gap-2 min-w-0">
          <RatingSVG draggable rating={rating} size={22} />
          <span className="truncate">
            {moveSan} {t(`analisa.formatLabel.${format}`, { label })}
          </span>
        </div>
        <div className="shrink-0">
          <FormatEval evaluation={evaluation} white={white} />
        </div>
      </div>
      <div className="leading-5 text-foregroundBlack">{komentar}</div>
    </div>
  );
}

export { FormatEval, Comments as default };
