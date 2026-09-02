/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useRef, useState } from "react";
import RatingCount from "./ratingCount.jsx";
import PlayersAccuracy from "./playersAccuracy.jsx";
import GameRating from "./gameRating.jsx";
import GameChart from "../gameChart.jsx";
import { reduceSummary } from "../../../../konstanta.js";
function Summary(props) {
  const { moves, container, players: players2, moveNumber, setMoveNumber, setAnimation, setForward } = props;
  const [reducedSummary, setReducedSummary] = useState(false);
  const componentRef = useRef(null);
  const [accuracy, setAccuracy] = useState({ w: NaN, b: NaN });
  const [accuracyPhases2, setAccuracyPhases] = useState({ opening: { w: [], b: [] }, middlegame: { w: [], b: [] }, endgame: { w: [], b: [] } });
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach(() => {
        setReducedSummary(window.innerWidth < reduceSummary);
      });
    });
    const component = componentRef.current;
    if (!component) return;
    observer.observe(component);
  }, []);
  return <div ref={componentRef} className="flex flex-col gap-3 items-center">
            <GameChart setMoveNumber={setMoveNumber} moves={moves} container={container} moveNumber={moveNumber} setAnimation={setAnimation} setForward={setForward} />
            <PlayersAccuracy reducedSummary={reducedSummary} setAccuracyPhases={setAccuracyPhases} accuracy={[accuracy, setAccuracy]} players={players2} moves={moves} />
            <hr className="border-slate-200 w-[85%]" />
            <RatingCount moves={moves} />
            <hr className="border-slate-200 w-[85%]" />
            <GameRating reducedSummary={reducedSummary} accuracy={accuracy} accuracyPhases={accuracyPhases2} />
        </div>;
}
export {
  Summary as default
};
