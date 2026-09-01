/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import RatingSVG from "../../../svg/rating.jsx";
import { useEffect, useState } from "react";
import { useI18n } from "../../../../../../lib/i18n.jsx";
const ratings = [
  "brilliant",
  // text-highlightBrilliant
  "great",
  // text-highlightGreat
  "best",
  // text-highlightBest
  "excellent",
  // text-highlightExcellent
  "good",
  // text-highlightGood
  "book",
  // text-highlightBook
  "inaccuracy",
  // text-highlightInaccuracy
  "mistake",
  // text-highlightMistake
  "miss",
  // text-highlightMiss
  "blunder"
  // text-highlightBlunder
];
function RatingCount(props) {
  const { t } = useI18n();
  const [counter, setCounter] = useState({ w: {}, b: {} });
  const { moves } = props;
  useEffect(() => {
    const newCounter = { w: {}, b: {} };
    moves.forEach((move2, i) => {
      const rating = move2.moveRating;
      const color = i % 2 === 0 ? "b" : "w";
      newCounter[color][rating] = newCounter[color][rating] + 1 || 1;
    });
    setCounter(newCounter);
  }, []);
  return <div className="w-[85%] flex flex-col gap-3 justify-center reduceSummary:pr-[35px] pr-[26px]">
            {ratings.map((rating) => {
    const titleRating = t(`analisa.penilaian.${rating}`);
    return <div key={rating} className="flex flex-row items-center justify-between">
                        <span className="font-bold text-foregroundGrey reduceSummary:text-lg text-base">{titleRating}</span>
                        <div className="flex flex-row text-xl font-extrabold w-fit">
                            <span className={`reduceSummary:w-[81px] w-[40px] text-left text-highlight${rating.charAt(0).toUpperCase() + rating.slice(1)}`}>{counter.w[rating] ?? 0}</span>
                            <RatingSVG draggable className="select-none" rating={rating} size={30} />
                            <span className={`reduceSummary:w-[81px] w-[40px] text-right text-highlight${rating.charAt(0).toUpperCase() + rating.slice(1)}`}>{counter.b[rating] ?? 0}</span>
                        </div>
                    </div>;
  })}
        </div>;
}
export {
  RatingCount as default
};
