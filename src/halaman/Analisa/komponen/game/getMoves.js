import { Chess, WHITE } from "chess.js";

export function getMoves(game, moveNumber, customLine, returnedToNormalGame) {
  const previousMove = (() => {
    if (customLine.moveNumber === 0) {
      return game[moveNumber];
    }
    if (customLine.moveNumber > 0) {
      return customLine.moves[customLine.moveNumber - 1];
    }
    return game[moveNumber - 1];
  })();
  const move2 = (() => {
    if (customLine.moveNumber >= 0) {
      return customLine.moves[customLine.moveNumber];
    }
    return game[moveNumber];
  })();
  const nextMove = (() => {
    if (customLine.moveNumber >= 0) {
      return customLine.moves[customLine.moveNumber + 1];
    }
    if (returnedToNormalGame) {
      return { ...game[moveNumber], movement: returnedToNormalGame };
    }
    return game[moveNumber + 1];
  })();
  return { previousMove, move: move2, nextMove };
}

export function getArrows(arrows, moveNumber, customLine) {
  if (customLine.moveNumber < 0) {
    return arrows[moveNumber];
  }
  return customLine.arrows[customLine.moveNumber];
}

export function getCustomResult(move2) {
  if (!move2?.fen) return "";
  let chess;
  try {
    chess = new Chess(move2.fen);
  } catch {
    return "";
  }
  const color = move2.color;
  if (chess.isCheckmate()) return color === WHITE ? "0-1" : "1-0";
  if (chess.isDraw()) return "1/2-1/2";
  return "";
}

export function formatPlayerLabel(player, fallbackName) {
  const name = String(player?.name ?? "").trim() || String(fallbackName ?? "");
  const elo = String(player?.elo ?? "").trim();
  return elo && elo !== "NOELO" ? `${name} (${elo})` : name;
}
