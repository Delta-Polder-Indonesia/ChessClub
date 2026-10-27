/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useRef, useState } from "react";
import RatingCount from "./ratingCount.jsx";
import PlayersAccuracy from "./playersAccuracy.jsx";
import GameRating from "./gameRating.jsx";
import WawasanRating from "./wawasanRating.jsx";
import EksporPgn from "./eksporPgn.jsx";
import { reduceSummary } from "../../../../konstanta.js";
function Summary(props) {
  const { moves, players: players2 } = props;
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
    if (!component) {
      observer.disconnect();
      return;
    }
    observer.observe(component);
    // Observer wajib dilepas: Summary terpasang/lepas tiap ganti tab,
    // tanpa disconnect() observer menumpuk memantau node yang sudah lepas.
    return () => observer.disconnect();
  }, []);
  return <div ref={componentRef} className="flex flex-col gap-3 items-center">
            <PlayersAccuracy reducedSummary={reducedSummary} setAccuracyPhases={setAccuracyPhases} accuracy={[accuracy, setAccuracy]} players={players2} moves={moves} />
            <hr className="border-neutral-600 w-[85%]" />
            <RatingCount moves={moves} />
            <hr className="border-neutral-600 w-[85%]" />
            <GameRating reducedSummary={reducedSummary} accuracy={accuracy} accuracyPhases={accuracyPhases2} />
            <hr className="border-neutral-600 w-[85%]" />
            <WawasanRating moves={moves} />
            <EksporPgn moves={moves} />
        </div>;
}
export {
  Summary as default
};
