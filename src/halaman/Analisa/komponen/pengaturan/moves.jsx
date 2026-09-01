/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { ConfigContext } from "../../konteks/config.jsx";
import { useContext, useEffect, useState } from "react";
import { boardThemes } from "./themes.jsx";
import { BISHOP, ROOK, WHITE } from "chess.js";
import PieceSVG from "../svg/piece.jsx";
import SoundMax from "../svg/soundMax.jsx";
import SoundMute from "../svg/sound-mute.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { bacaTeks, tulis } from "../../penyimpanan.js";
function Moves() {
  const { t } = useI18n();
  const [animateMovesMoved, setAnimateMovesMoved] = useState(false);
  const configContext = useContext(ConfigContext);
  const [boardTheme] = configContext.boardTheme;
  const [showLegalMoves, setShowLegalMoves] = configContext.showLegalMoves;
  const [animateMoves, setAnimateMoves] = configContext.animateMoves;
  const [boardSounds, setBoardSounds] = configContext.boardSounds;
  useEffect(() => {
    setInterval(() => {
      setAnimateMovesMoved((prev) => !prev);
    }, 2e3);
  }, []);
  useEffect(() => {
    const showLegalMoves2 = bacaTeks("showLegalMoves");
    if (!showLegalMoves2) return;
    const numberShowLegalMoves = Number(showLegalMoves2);
    if (!isNaN(numberShowLegalMoves)) {
      setShowLegalMoves(Boolean(numberShowLegalMoves));
    } else {
      tulis("showLegalMoves", "1");
      setShowLegalMoves(true);
    }
  }, []);
  function toggleShowLegalMoves() {
    const newShowLegalMoves = !showLegalMoves;
    tulis("showLegalMoves", String(Number(newShowLegalMoves)));
    setShowLegalMoves(newShowLegalMoves);
  }
  useEffect(() => {
    const animateMoves2 = bacaTeks("animateMoves");
    if (!animateMoves2) return;
    const numberAnimateMoves = Number(animateMoves2);
    if (!isNaN(numberAnimateMoves)) {
      setAnimateMoves(Boolean(numberAnimateMoves));
    } else {
      tulis("animateMoves", "1");
      setAnimateMoves(true);
    }
  }, []);
  function toggleAnimateMoves() {
    const newAnimateMoves = !animateMoves;
    tulis("animateMoves", String(Number(newAnimateMoves)));
    setAnimateMoves(newAnimateMoves);
  }
  useEffect(() => {
    const boardSounds2 = bacaTeks("boardSounds");
    if (!boardSounds2) return;
    const numberBoardSounds = Number(boardSounds2);
    if (!isNaN(numberBoardSounds)) {
      setBoardSounds(Boolean(numberBoardSounds));
    } else {
      tulis("boardSounds", "1");
      setBoardSounds(true);
    }
  }, []);
  function toggleBoardSounds() {
    const newBoardSounds = !boardSounds;
    tulis("boardSounds", String(Number(newBoardSounds)));
    setBoardSounds(newBoardSounds);
  }
  return <div>
            <section>
            <h1 className="block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground">{t("analisa.pengaturan.langkah")}</h1>
                <button onClick={toggleShowLegalMoves} type="button" className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                    <div className="grid grid-cols-2 w-fit">
                        {Array.from({ length: 4 }).map((_, i) => {
    const isEvenCol = i % 2 === 0;
    const isEvenRow = Math.floor(i / 2) % 2 === 0;
    const squareColor = isEvenCol ? isEvenRow ? boardThemes[boardTheme].white : boardThemes[boardTheme].black : isEvenRow ? boardThemes[boardTheme].black : boardThemes[boardTheme].white;
    return <div key={i} style={{ backgroundColor: squareColor }} className="h-5 w-5 relative">
                                    {i === 2 ? <>
                                        <PieceSVG className="absolute z-10 top-0 left-0" piece={BISHOP} size={20} color={WHITE} />
                                        <div className="w-full h-full opacity-50 absolute top-0 left-0" style={{ backgroundColor: boardThemes[boardTheme].highlight }} />
                                    </> : null}
                                    {i === 1 && showLegalMoves ? <div className="absolute w-full h-full top-0 left-0 flex justify-center items-center pointer-events-auto"><div className="bg-black opacity-[25%] w-[30%] h-[30%] rounded-full" /></div> : null}
                                </div>;
  })}
                    </div>
                    <span className="font-bold text-lg">{t("analisa.pengaturan.langkahLegal")}</span>
                    <div style={{ backgroundColor: "var(--foreground)", display: showLegalMoves ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
                </button>
                <button onClick={toggleAnimateMoves} type="button" className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                    <div className="grid grid-cols-2 w-fit">
                        {Array.from({ length: 4 }).map((_, i) => {
    const isEvenCol = i % 2 === 0;
    const isEvenRow = Math.floor(i / 2) % 2 === 0;
    const squareColor = isEvenCol ? isEvenRow ? boardThemes[boardTheme].white : boardThemes[boardTheme].black : isEvenRow ? boardThemes[boardTheme].black : boardThemes[boardTheme].white;
    return <div key={i} style={{ backgroundColor: squareColor }} className="h-5 w-5 relative">
                                    {i === 2 ? <>
                                        <PieceSVG style={{ transform: animateMovesMoved ? "translateX(20px)" : "", transition: animateMoves ? "150ms" : "", transitionTimingFunction: animateMoves ? "linear" : "" }} className="absolute z-10 top-0 left-0" piece={ROOK} size={20} color={WHITE} />
                                        <div className="w-full h-full opacity-50 absolute top-0 left-0" style={{ backgroundColor: boardThemes[boardTheme].highlight }} />
                                    </> : null}
                                    {i === 3 ? <div className="w-full h-full opacity-50 absolute top-0 left-0" style={{ backgroundColor: boardThemes[boardTheme].highlight }} /> : null}
                                </div>;
  })}
                    </div>
                    <span className="font-bold text-lg">{t("analisa.pengaturan.animasi")}</span>
                    <div style={{ backgroundColor: "var(--foreground)", display: animateMoves ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
                </button>
                <button onClick={toggleBoardSounds} type="button" className="flex flex-row gap-2 items-center hover:text-foregroundHighlighted hover:bg-black transition-colors w-full relative p-2">
                    <div className="w-[40px] h-[40px] flex justify-center items-center">
                        <SoundMax display={boardSounds} size={35} />
                        <SoundMute display={!boardSounds} size={35} />
                    </div>
                    <span className="font-bold text-lg">{t("analisa.pengaturan.suara")}</span>
                    <div style={{ backgroundColor: "var(--foreground)", display: boardSounds ? "" : "none" }} className="w-3 h-3 rounded-full absolute right-3" />
                </button>
            </section>
        </div>;
}
export {
  Moves as default
};
