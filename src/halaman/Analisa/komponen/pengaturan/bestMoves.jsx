/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { ConfigContext } from "../../konteks/config.jsx";
import { useContext, useEffect } from "react";
import { boardThemes } from "./themes.jsx";
import { Arrow } from "../game/board.jsx";
import PieceSVG from "../svg/piece.jsx";
import { QUEEN, WHITE } from "chess.js";
import { useI18n } from "../../../../lib/i18n.jsx";
import { bacaTeks, tulis } from "../../penyimpanan.js";
function BestMoves() {
  const { t } = useI18n();
  const configContext = useContext(ConfigContext);
  const [boardTheme] = configContext.boardTheme;
  const [showArrows, setShowArrows] = configContext.showArrows;
  const [arrowAfterMove, setArrowAfterMove] = configContext.arrowAfterMove;
  useEffect(() => {
    const showArrows2 = bacaTeks("showArrows");
    if (!showArrows2) return;
    const numberShowArrows = Number(showArrows2);
    if (!isNaN(numberShowArrows)) {
      setShowArrows(Boolean(numberShowArrows));
    } else {
      tulis("showArrows", "1");
      setShowArrows(true);
    }
  }, []);
  function toggleShowArrows() {
    const newShowArrows = !showArrows;
    tulis("showArrows", String(Number(newShowArrows)));
    setShowArrows(newShowArrows);
  }
  useEffect(() => {
    const arrowAfterMove2 = bacaTeks("arrowAfterMove");
    if (!arrowAfterMove2) return;
    const numberArrowAfterMove = Number(arrowAfterMove2);
    if (!isNaN(numberArrowAfterMove)) {
      setArrowAfterMove(Boolean(numberArrowAfterMove));
    } else {
      tulis("arrowAfterMove", "1");
      setArrowAfterMove(true);
    }
  }, []);
  function toggleArrowAfterMove() {
    const newArrowAfterMove = !arrowAfterMove;
    tulis("arrowAfterMove", String(Number(newArrowAfterMove)));
    setArrowAfterMove(newArrowAfterMove);
  }
  return <section>
            <h1 className="block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground">{t("analisa.pengaturan.langkahTerbaik")}</h1>
            <button onClick={toggleShowArrows} type="button" className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                <div className="grid grid-cols-2 w-fit relative">
                    {Array.from({ length: 4 }).map((_, i) => {
    const isEvenCol = i % 2 === 0;
    const isEvenRow = Math.floor(i / 2) % 2 === 0;
    const squareColor = isEvenCol ? isEvenRow ? boardThemes[boardTheme].white : boardThemes[boardTheme].black : isEvenRow ? boardThemes[boardTheme].black : boardThemes[boardTheme].white;
    return <div key={i} style={{ backgroundColor: squareColor }} className="h-5 w-5 relative">
                                {i === 2 ? <PieceSVG className="absolute z-10 top-0 left-0" piece={QUEEN} size={20} color={WHITE} /> : null}
                            </div>;
  })}
                    {showArrows ? <Arrow move={[{ col: 0, row: 1 }, { col: 1, row: 1 }]} squareSize={20} white class="fill-bestArrow stroke-bestArrow" /> : null}
                </div>
                <span className="font-bold text-sm">{t("analisa.pengaturan.tampilPanah")}</span>
                <div style={{ backgroundColor: "var(--foreground)", display: showArrows ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
            </button>
            <button onClick={toggleArrowAfterMove} type="button" className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                <div className="grid grid-cols-2 w-fit relative">
                    {Array.from({ length: 4 }).map((_, i) => {
    const isEvenCol = i % 2 === 0;
    const isEvenRow = Math.floor(i / 2) % 2 === 0;
    const squareColor = isEvenCol ? isEvenRow ? boardThemes[boardTheme].white : boardThemes[boardTheme].black : isEvenRow ? boardThemes[boardTheme].black : boardThemes[boardTheme].white;
    return <div key={i} style={{ backgroundColor: squareColor }} className="h-5 w-5 relative">
                                {(i === 2 || i === 3) && arrowAfterMove ? <div className="w-full h-full absolute top-0 left-0 opacity-50" style={{ backgroundColor: "var(--highlightBoard)" }} /> : null}
                                {i === 2 && !arrowAfterMove || i === 3 && arrowAfterMove ? <PieceSVG className="absolute z-10 top-0 left-0" piece={QUEEN} size={20} color={WHITE} /> : null}
                                {(i === 2 || i === 3) && arrowAfterMove ? <div className="w-full h-full opacity-50 absolute top-0 left-0" style={{ backgroundColor: boardThemes[boardTheme].highlight }} /> : null}
                            </div>;
  })}
                    <Arrow move={[{ col: 0, row: 1 }, { col: 1, row: 1 }]} squareSize={20} white class="fill-bestArrow stroke-bestArrow" />
                </div>
                <span className="font-bold text-sm">{t("analisa.pengaturan.panahSetelahLangkah")}</span>
                <div style={{ backgroundColor: "var(--foreground)", display: arrowAfterMove ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
            </button>
        </section>;
}
export {
  BestMoves as default
};
