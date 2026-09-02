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
        color: karakter === "-" ? "#ffffff" : "#1f2937",
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
        className="bg-backgroundBoxBox w-[85%] rounded-borderExtraRoundness p-4 font-bold text-lg text-foregroundBlack"
        dangerouslySetInnerHTML={{ __html: overallGameComment ?? "" }}
      />
    );
  }

  const label = t(`analisa.penilaian.${rating}`);
  const format = FORMAT_LABEL[rating] ?? "adalah";

  return (
    <div className="h-44 w-[85%] p-4 rounded-borderExtraRoundness bg-backgroundBoxBox border border-slate-200 text-foregroundBlack text-lg font-bold flex flex-col gap-1">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-2">
          <RatingSVG draggable rating={rating} size={32} />
          <span>
            {moveSan} {t(`analisa.formatLabel.${format}`, { label })}
          </span>
        </div>
        <FormatEval evaluation={evaluation} white={white} />
      </div>
      <div>{komentar}</div>
    </div>
  );
}

export { FormatEval, Comments as default };
