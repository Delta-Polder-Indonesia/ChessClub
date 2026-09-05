/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README.
 *
 * Penyesuaian lokal: ikon bidak yang dimakan memakai set gambar Chess.com
 * (`src/asets/ChessCom`) lewat komponen `ChessPiece`, menggantikan SVG garis. */

import React, { useMemo } from "react";
import { BISHOP, KNIGHT, PAWN, QUEEN, ROOK } from "chess.js";
import { ChessPiece } from "../../../../components/chess/ChessPiece.jsx";

const PIECES_ORDER = [PAWN, BISHOP, KNIGHT, ROOK, QUEEN];

function formatAdvantage(advantage = 0) {
  return advantage > 0 ? `+${advantage}` : "";
}

export default function CapturedPieces({ white = false, pieces = [], advantage = 0 }) {
  // Kelompokkan dan urutkan bidak berdasarkan urutan nilai catur
  const sortedGroupedPieces = useMemo(() => {
    const counts = pieces.reduce((acc, piece) => {
      const normalized = piece.toLowerCase();
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort(
      ([a], [b]) => PIECES_ORDER.indexOf(a) - PIECES_ORDER.indexOf(b)
    );
  }, [pieces]);

  const displayAdvantage = white ? advantage : -advantage;
  const advantageText = formatAdvantage(displayAdvantage);

  return (
    <div className="flex flex-row h-full items-end gap-1 vertical:gap-1.5">
      <div className="flex flex-row h-full w-fit -ml-[3px]">
        {sortedGroupedPieces.map(([piece, count]) => (
          <div key={piece} className="mb-[1px] flex flex-row items-end">
            {Array.from({ length: count }, (_, idx) => {
              const isFirst = idx === 0;
              const pieceChar = white ? piece.toUpperCase() : piece.toLowerCase();

              const marginX =
                piece === PAWN
                  ? "mx-[2px]"
                  : [ROOK, KNIGHT, BISHOP].includes(piece)
                  ? "mx-[1px]"
                  : "";

              const overlapClass = !isFirst ? "-ml-[7px] vertical:-ml-[10px]" : "";

              return (
                <ChessPiece
                  key={`${piece}-${idx}`}
                  piece={pieceChar}
                  set="chesscom"
                  className={`w-[10px] h-[10px] vertical:w-[17px] vertical:h-[17px] ${marginX} ${overlapClass}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Ukuran angka disamakan proporsinya dengan bidak */}
      {advantageText && (
        <span className="text-foregroundGrey font-medium text-[9px] vertical:text-[12px] leading-none mb-[1px] select-none">
          {advantageText}
        </span>
      )}
    </div>
  );
}