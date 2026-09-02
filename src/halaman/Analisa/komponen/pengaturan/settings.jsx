/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import BestMoves from "./bestMoves.jsx";
import Moves from "./moves.jsx";
import Ratings from "./ratings.jsx";
import Themes from "./themes.jsx";
function Settings({ hidden }) {
  return <div className="flex flex-col gap-2" style={{ display: hidden ? "none" : "" }}>
            <Themes />
            <Ratings />
            <Moves />
            <BestMoves />
        </div>;
}
export {
  Settings as default
};
