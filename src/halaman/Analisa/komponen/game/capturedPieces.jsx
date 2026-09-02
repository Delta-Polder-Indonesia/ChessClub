/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { BISHOP, BLACK, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from "chess.js";
import { maxVertical } from "../../konstanta.js";
import SimplePieceSVG from "../svg/simplePiece.jsx";
const PIECES_ORDER = [PAWN, BISHOP, KNIGHT, ROOK, QUEEN];
function formatAdvantage(advantage) {
  return advantage > 0 ? `+${advantage}` : "";
}
function CapturedPieces(props) {
  const { white, pieces, advantage } = props;
  const groupedPieces = pieces.reduce((acc, piece) => {
    acc[piece] = acc[piece] ? acc[piece] + 1 : 1;
    return acc;
  }, {});
  return <div className="flex flex-row h-full items-end vertical:gap-2 gap-1">
            <div className="w-fit h-full flex flex-row ml-[-3px]">
                {Object.entries(groupedPieces).sort((a, b) => PIECES_ORDER.indexOf(a[0]) - PIECES_ORDER.indexOf(b[0])).map(([piece, count], i) => {
    // Garis tepi bidak tertangkap. Di tema terang, `--border` terlalu pucat
    // untuk memisahkan bidak putih dari latar putih, jadi pakai abu lebih gelap.
    const outlineColor = "#64748b";
    const smallSize = window.innerWidth < maxVertical ? 8 : 15;
    const mediumSize = window.innerWidth < maxVertical ? 10 : 17;
    const bigSize = window.innerWidth < maxVertical ? 12 : 19;
    return <div className="mb-[1px] flex flex-row items-end" key={i}>
                            {Array.from({ length: count }).map((_, i2) => {
      return <SimplePieceSVG
        key={i2}
        piece={piece}
        color={white ? WHITE : BLACK}
        size={piece === PAWN ? smallSize : piece === ROOK || piece === KNIGHT || piece === BISHOP ? mediumSize : bigSize}
        className={`${piece === PAWN ? "mx-[2px]" : piece === ROOK || piece === KNIGHT || piece === BISHOP ? "mx-[1px]" : ""} ${i2 !== 0 ? "vertical:ml-[-10px] ml-[-7px]" : ""}`}
        draggable
        style={{ filter: `drop-shadow(1px 0 0 ${outlineColor}) drop-shadow(-1px 0 0 ${outlineColor}) drop-shadow(0 1px 0 ${outlineColor}) drop-shadow(0 -1px 0 ${outlineColor})` }}
      />;
    })}
                        </div>;
  })}
            </div>
            <span className="text-foregroundGrey h-fit font-light text-[8px] vertical:text-[17px]">{white ? formatAdvantage(advantage) : formatAdvantage(-advantage)}</span>
        </div>;
}
export {
  CapturedPieces as default
};
