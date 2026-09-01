/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { avg } from "./playersAccuracy.jsx";
import RatingBox from "./ratingBox.jsx";
import RatingSVG from "../../../svg/rating.jsx";
import { useI18n } from "../../../../../../lib/i18n.jsx";
function topElo(elo) {
  const MAX_ELO = 3e3;
  if (elo > MAX_ELO) return `${MAX_ELO}+`;
  else return String(elo);
}
function getRating(accuracy) {
  function nonLinearFunction(x) {
    return 1.5 * Math.pow(x, 4);
  }
  const minAccuracy = 40;
  const maxAccuracy = 100;
  const minRating = 300;
  const maxRating = 3e3;
  const normalizedAccuracy = (accuracy - minAccuracy) / (maxAccuracy - minAccuracy);
  const nonLinearAccuracy = nonLinearFunction(normalizedAccuracy);
  const rating = (maxRating - minRating) * nonLinearAccuracy + minRating;
  const roundedRating = Math.round(rating / 50) * 50;
  return isNaN(roundedRating) ? 0 : roundedRating;
}
function getRatingPhase(accuracy) {
  const avgAccuracy = avg(accuracy);
  if (accuracy.length < 3) return { rating: null, accuracy: null };
  let rating;
  if (avgAccuracy >= 95) {
    rating = "great";
  } else if (avgAccuracy >= 90) {
    rating = "best";
  } else if (avgAccuracy >= 80) {
    rating = "excellent";
  } else if (avgAccuracy >= 60) {
    rating = "good";
  } else if (avgAccuracy >= 40) {
    rating = "inaccuracy";
  } else if (avgAccuracy >= 20) {
    rating = "mistake";
  } else {
    rating = "blunder";
  }
  return { rating, accuracy: avgAccuracy.toFixed(1) };
}
function RatingIcon({ titleText, ratingPhase, t }) {
  const { rating, accuracy } = ratingPhase;
  if (!rating || !accuracy) return <span className="text-xl" title={t("analisa.ringkasan.cukupLangkah")}>-</span>;
  return <RatingSVG draggable rating={rating} size={30} title={t("analisa.ringkasan.akurasiFase", { fase: titleText, angka: accuracy })} />;
}
function GameRating(props) {
  const { accuracy, accuracyPhases, reducedSummary } = props;
  const { t } = useI18n();
  return <div className="w-[85%] flex flex-col items-end gap-3">
            <div className="flex flex-row w-full justify-between items-center">
                <span className="font-bold text-foregroundGrey reduceSummary:text-lg text-base">{t("analisa.ringkasan.ratingPartai")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] reduceSummary:min-w-[262px] min-w-[160px] w-[160px] justify-between">
                    <RatingBox fontSize={reducedSummary ? 18 : void 0} width={reducedSummary ? 64 : void 0} paddingY={reducedSummary ? 4 : void 0} white>{topElo(getRating(accuracy.w))}</RatingBox>
                    <RatingBox fontSize={reducedSummary ? 18 : void 0} width={reducedSummary ? 64 : void 0} paddingY={reducedSummary ? 4 : void 0}>{topElo(getRating(accuracy.b))}</RatingBox>
                </div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="font-bold text-foregroundGrey reduceSummary:text-lg text-base">{t("analisa.ringkasan.pembukaan")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <div className="reduceSummary:w-20 w-16 flex items-center justify-center select-none"><RatingIcon t={t} ratingPhase={getRatingPhase(accuracyPhases.opening.w)} titleText={t("analisa.ringkasan.pembukaan")} /></div>
                    <div className="reduceSummary:w-20 w-16 flex items-center justify-center select-none"><RatingIcon t={t} ratingPhase={getRatingPhase(accuracyPhases.opening.b)} titleText={t("analisa.ringkasan.pembukaan")} /></div>
                </div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="font-bold text-foregroundGrey reduceSummary:text-lg text-base">{t("analisa.ringkasan.menengah")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <div className="reduceSummary:w-20 w-16 flex items-center justify-center select-none"><RatingIcon t={t} ratingPhase={getRatingPhase(accuracyPhases.middlegame.w)} titleText={t("analisa.ringkasan.menengah")} /></div>
                    <div className="reduceSummary:w-20 w-16 flex items-center justify-center select-none"><RatingIcon t={t} ratingPhase={getRatingPhase(accuracyPhases.middlegame.b)} titleText={t("analisa.ringkasan.menengah")} /></div>
                </div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="font-bold text-foregroundGrey reduceSummary:text-lg text-base">{t("analisa.ringkasan.akhir")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <div className="reduceSummary:w-20 w-16 flex items-center justify-center select-none"><RatingIcon t={t} ratingPhase={getRatingPhase(accuracyPhases.endgame.w)} titleText={t("analisa.ringkasan.akhir")} /></div>
                    <div className="reduceSummary:w-20 w-16 flex items-center justify-center select-none"><RatingIcon t={t} ratingPhase={getRatingPhase(accuracyPhases.endgame.b)} titleText={t("analisa.ringkasan.akhir")} /></div>
                </div>
            </div>
        </div>;
}
export {
  GameRating as default
};
