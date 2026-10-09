export const RATING_TEXT_COLORS = {
  forced: "",
  brilliant: "text-highlightBrilliant",
  great: "text-highlightGreat",
  best: "text-highlightBest",
  critical: "text-highlightBest",
  excellent: "text-highlightExcellent",
  good: "text-highlightGood",
  book: "text-highlightBook",
  inaccuracy: "text-highlightInaccuracy",
  mistake: "text-highlightMistake",
  miss: "text-highlightMiss",
  blunder: "text-highlightBlunder"
};

export function getLastBookMove(moves) {
  for (let i = moves.length - 1; i >= 0; i--) {
    if (moves[i].moveRating === "book") return i;
  }
  return -1;
}
