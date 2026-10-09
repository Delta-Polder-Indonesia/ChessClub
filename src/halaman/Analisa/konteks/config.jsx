/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useState, useRef } from "react";
import { ConfigContext, defaultUsedRatings } from "./configKonteks.js";

function ConfigContextProvider(props) {
  const [openedMenu, setOpenedMenu] = useState(null);
  const [boardTheme, setBoardTheme] = useState(0);
  const [usedRatings, setUsedRatings] = useState(defaultUsedRatings);
  const [highlightByRating, setHighlightByRating] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const [arrowAfterMove, setArrowAfterMove] = useState(true);
  const [showLegalMoves, setShowLegalMoves] = useState(true);
  const [animateMoves, setAnimateMoves] = useState(true);
  const [boardSounds, setBoardSounds] = useState(true);
  const boardMenuSettingsRef = useRef(null);
  return <ConfigContext.Provider value={{ boardTheme: [boardTheme, setBoardTheme], openedMenu: [openedMenu, setOpenedMenu], usedRatings: [usedRatings, setUsedRatings], highlightByRating: [highlightByRating, setHighlightByRating], showArrows: [showArrows, setShowArrows], arrowAfterMove: [arrowAfterMove, setArrowAfterMove], showLegalMoves: [showLegalMoves, setShowLegalMoves], animateMoves: [animateMoves, setAnimateMoves], boardSounds: [boardSounds, setBoardSounds], boardMenuSettingsRef }}>
            {props.children}
        </ConfigContext.Provider>;
}
export default ConfigContextProvider;
