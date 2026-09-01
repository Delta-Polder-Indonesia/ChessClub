/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { createContext, useState, useRef } from "react";
const defaultUsedRatings = {
  brilliant: true,
  great: true,
  best: true,
  excellent: true,
  good: true,
  book: true,
  inaccuracy: true,
  mistake: true,
  miss: true,
  blunder: true,
  forced: true
};
const ConfigContext = createContext({
  openedMenu: [null, () => {
  }],
  boardTheme: [0, () => {
  }],
  usedRatings: [defaultUsedRatings, () => {
  }],
  highlightByRating: [true, () => {
  }],
  showArrows: [true, () => {
  }],
  arrowAfterMove: [true, () => {
  }],
  showLegalMoves: [true, () => {
  }],
  animateMoves: [true, () => {
  }],
  boardSounds: [true, () => {
  }],
  boardMenuSettingsRef: { current: null }
});
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
export {
  ConfigContext,
  ConfigContextProvider as default,
  defaultUsedRatings
};
