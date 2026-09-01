/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { capitalizeFirst } from "../menu/analyze/selectChessCom.jsx";
import { ConfigContext, defaultUsedRatings } from "../../konteks/config.jsx";
import { useContext, useEffect } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { boardThemes } from "./themes.jsx";
import { QUEEN, WHITE } from "chess.js";
import PieceSVG from "../svg/piece.jsx";
import RatingSVG from "../svg/rating.jsx";
const ratings = [
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
  "book",
  "inaccuracy",
  "mistake",
  "miss",
  "blunder",
  "forced"
];
function serializeRatings(usedRatings2) {
  const serializedRatings = [];
  for (const rating of ratings) {
    if (usedRatings2[rating]) serializedRatings.push(1);
    else serializedRatings.push(0);
  }
  return serializedRatings.join("");
}
function unserializeRatings(serializedUsedRatings) {
  const unserializedRatings = { ...defaultUsedRatings };
  const serializedRatings = serializedUsedRatings.split("").map(Number);
  if (serializedRatings.length !== ratings.length) throw new Error("Invalid serialized ratings");
  for (const [i, rating] of ratings.entries()) {
    if (isNaN(serializedRatings[i])) throw new Error("Invalid serialized ratings");
    if (serializedRatings[i]) unserializedRatings[rating] = true;
    else unserializedRatings[rating] = false;
  }
  return unserializedRatings;
}
function Ratings() {
  const { t } = useI18n();
  const configContext = useContext(ConfigContext);
  const [usedRatings2, setUsedRatings] = configContext.usedRatings;
  const [boardTheme] = configContext.boardTheme;
  const [highlightByRating, setHighlightByRating] = configContext.highlightByRating;
  useEffect(() => {
    const serializedUsedRatings = localStorage.getItem("kci-analisa-usedRatings");
    if (!serializedUsedRatings) return;
    try {
      const usedRatings3 = unserializeRatings(serializedUsedRatings);
      setUsedRatings(usedRatings3);
    } catch {
      localStorage.setItem("kci-analisa-usedRatings", serializeRatings(defaultUsedRatings));
      setUsedRatings(defaultUsedRatings);
    }
  }, []);
  useEffect(() => {
    const highlightByRating2 = localStorage.getItem("kci-analisa-highlightByRating");
    if (!highlightByRating2) return;
    const numberHighlightByRating = Number(highlightByRating2);
    if (!isNaN(numberHighlightByRating)) {
      setHighlightByRating(Boolean(numberHighlightByRating));
    } else {
      localStorage.setItem("kci-analisa-highlightByRating", "1");
      setHighlightByRating(true);
    }
  }, []);
  function toggleHighlightByRating() {
    const newHighlightByRating = !highlightByRating;
    localStorage.setItem("kci-analisa-highlightByRating", String(Number(newHighlightByRating)));
    setHighlightByRating(newHighlightByRating);
  }
  return <section>
            <h1 className="block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground">{t("analisa.pengaturan.penilaian")}</h1>
            <button onClick={toggleHighlightByRating} type="button" className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                <div className="grid grid-cols-2 w-fit">
                    {Array.from({ length: 4 }).map((_, i) => {
    const isEvenCol = i % 2 === 0;
    const isEvenRow = Math.floor(i / 2) % 2 === 0;
    const squareColor = isEvenCol ? isEvenRow ? boardThemes[boardTheme].white : boardThemes[boardTheme].black : isEvenRow ? boardThemes[boardTheme].black : boardThemes[boardTheme].white;
    return <div key={i} style={{ backgroundColor: squareColor }} className="h-5 w-5 relative">
                                {i === 2 || i === 3 ? <div className="w-full h-full absolute top-0 left-0 opacity-50" style={{ backgroundColor: highlightByRating ? "var(--highlightGreat)" : boardThemes[boardTheme].highlight }} /> : null}
                                {i === 3 ? <>
                                        <PieceSVG className="absolute z-10 top-0 left-0" piece={QUEEN} size={20} color={WHITE} />
                                        <RatingSVG rating="great" size={12} className="absolute top-0 right-0 translate-x-1/2 translate-y-[-50%]" />
                                    </> : null}
                            </div>;
  })}
                </div>
                <span className="font-bold text-lg">{t("analisa.pengaturan.sorotLabel")}</span>
                <div style={{ backgroundColor: "var(--foreground)", display: highlightByRating ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
            </button>
            {ratings.map((rating, i) => {
    const color = rating === "forced" ? "var(--highlightGood)" : `var(--highlight${capitalizeFirst(rating)})`;
    function toggleRating() {
      const newUsedRatings = {
        ...usedRatings2,
        [rating]: !usedRatings2[rating]
      };
      setUsedRatings(newUsedRatings);
      localStorage.setItem("kci-analisa-usedRatings", serializeRatings(newUsedRatings));
    }
    return <button onClick={toggleRating} type="button" key={i} className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                        <RatingSVG rating={rating} size={35} className="w-[40px] h-[40px] flex justify-center items-center" />
                        <span className="font-bold text-lg">{capitalizeFirst(rating)}</span>
                        <div style={{ backgroundColor: color, display: usedRatings2[rating] ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
                    </button>;
  })}
        </section>;
}
export {
  Ratings as default
};
