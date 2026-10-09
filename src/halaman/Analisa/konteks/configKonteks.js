import { createContext } from "react";

export const defaultUsedRatings = {
  brilliant: true,
  great: true,
  best: true,
  critical: true,
  excellent: true,
  good: true,
  book: true,
  inaccuracy: true,
  mistake: true,
  miss: true,
  blunder: true,
  forced: true
};

export const ConfigContext = createContext({
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
