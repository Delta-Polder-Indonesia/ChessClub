/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { deformatSquare, formatSquare } from "../../mesin/engine.js";
import { useContext, useEffect, useRef, useState } from "react";
import { BISHOP, BLACK, Chess, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from "chess.js";
import { buatSuara } from "../suaraPapan.js";
import { ConfigContext } from "../../konteks/config.jsx";
import { boardThemes } from "../pengaturan/themes.jsx";
import PieceSVG from "../svg/piece.jsx";
import RatingSVG from "../svg/rating.jsx";
import ResultSVG from "../svg/result.jsx";
import Image from "../Gambar.jsx";
const HIGHLIGHT_COLORS = {
  forced: "",
  brilliant: "var(--highlightBrilliant)",
  great: "var(--highlightGreat)",
  best: "var(--highlightBest)",
  excellent: "var(--highlightExcellent)",
  good: "var(--highlightGood)",
  book: "var(--highlightBook)",
  inaccuracy: "var(--highlightInaccuracy)",
  mistake: "var(--highlightMistake)",
  miss: "var(--highlightMiss)",
  blunder: "var(--highlightBlunder)"
};
const PIECES_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0
};
/* Bunyi papan dibuat dengan Web Audio (lihat ../suaraPapan.js) — tanpa
   dependensi howler dan tanpa berkas MP3 berlisensi copyleft. */
const moveSelfSound = buatSuara("move-self");
const moveOpponentSound = buatSuara("move-opponent");
const moveCheckSound = buatSuara("move-check");
const gameEndSound = buatSuara("game-end");
const gameStartSound = buatSuara("game-start");
const captureSound = buatSuara("capture");
const castleSound = buatSuara("castle");

function isEven(num) {
  return num % 2 === 0;
}
function getSquareId(column, row) {
  const columnId = String.fromCharCode(97 + column);
  const rowId = 8 - row;
  return columnId + rowId;
}
function adaptSquare(square2) {
  return { col: square2.col, row: 7 - square2.row };
}
function getCastleRookFromSquare(castle, whiteMoving) {
  if (!castle) return;
  return { col: castle === "k" ? 7 : 0, row: whiteMoving ? 7 : 0 };
}
function getCastleRookToSquare(castle, whiteMoving) {
  if (!castle) return;
  return { col: castle === "k" ? 5 : 3, row: whiteMoving ? 7 : 0 };
}
function flipBoard(board) {
  for (const row of board) {
    row.reverse();
  }
  board.reverse();
}
function isKnightMove(from, to) {
  return Math.abs(from.col - to.col) === 2 && Math.abs(from.row - to.row) === 1 || Math.abs(from.col - to.col) === 1 && Math.abs(from.row - to.row) === 2;
}
function Arrow(props) {
  const { move, squareSize, white } = props;
  if (!move[1]) {
    const elementPosition = {
      x: squareSize * move[0].col + "px",
      y: squareSize * move[0].row + "px"
    };
    let rounded = "";
    if (move[0].row === 0 && move[0].col === 0) rounded = white ? "rounded-tl-borderRoundness" : "rounded-br-borderRoundness";
    if (move[0].row === 7 && move[0].col === 0) rounded = white ? "rounded-bl-borderRoundness" : "rounded-tr-borderRoundness";
    if (move[0].row === 0 && move[0].col === 7) rounded = white ? "rounded-tr-borderRoundness" : "rounded-bl-borderRoundness";
    if (move[0].row === 7 && move[0].col === 7) rounded = white ? "rounded-br-borderRoundness" : "rounded-tl-borderRoundness";
    const size = squareSize + "px";
    return <div style={{ top: white ? elementPosition.y : "", bottom: !white ? elementPosition.y : "", left: white ? elementPosition.x : "", right: !white ? elementPosition.x : "", width: size, height: size }} className={`absolute opacity-80 z-[10] ${props.class} ${rounded}`} />;
  }
  const [from, to] = move;
  if (isKnightMove(from, to)) {
    const getTransform = () => {
      const longY = Math.abs(from.row - to.row) > Math.abs(from.col - to.col);
      const toDown = white ? from.row < to.row : from.row > to.row;
      const toLeft = white ? from.col < to.col : from.col > to.col;
      let rotation = 0;
      let scaleX = 1;
      let scaleY = 1;
      if (longY) {
        if (toDown) {
          rotation = 270;
          if (toLeft) scaleY = -1;
        } else {
          rotation = 90;
          if (!toLeft) scaleY = -1;
        }
      } else {
        if (toDown) {
          rotation = 180;
          if (!toLeft) scaleX = -1;
        } else {
          if (toLeft) scaleX = -1;
        }
      }
      return `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
    };
    const fromElementPosition2 = {
      x: squareSize * (white ? from.col : 7 - from.col),
      y: squareSize * (white ? from.row : 7 - from.row)
    };
    const toElementPosition2 = {
      x: squareSize * (white ? to.col : 7 - to.col),
      y: squareSize * (white ? to.row : 7 - to.row)
    };
    const distance2 = {
      x: Math.abs(fromElementPosition2.x - toElementPosition2.x),
      y: Math.abs(fromElementPosition2.y - toElementPosition2.y)
    };
    const longLineLength = Math.abs(Math.max(distance2.x, distance2.y));
    const shortLineLength = Math.abs(Math.min(distance2.x, distance2.y));
    const lineWidth2 = squareSize / 2 * (3 / 7);
    const arrowHeadHeight2 = lineWidth2 * 1.6;
    const arrowHeadWidth = squareSize / 2;
    const height2 = shortLineLength + lineWidth2 / 2;
    const width2 = longLineLength + squareSize / 4 - arrowHeadHeight2;
    const longLineCenter = height2 - lineWidth2 / 2;
    const shortLineCenter = arrowHeadWidth / 2;
    const positionX2 = `${toElementPosition2.x + squareSize / 2 - arrowHeadWidth / 2}px`;
    const positionY2 = `${toElementPosition2.y + squareSize / 2}px`;
    return <svg style={{ top: positionY2, left: positionX2, transformOrigin: `${arrowHeadWidth / 2}px 0`, transform: getTransform() }} className={`absolute opacity-65 z-[70] pointer-events-none ${props.class}`} width={width2} height={height2} xmlns="http://www.w3.org/2000/svg">
                <polygon strokeWidth={0} points={`0,${arrowHeadHeight2} ${shortLineCenter},0 ${arrowHeadWidth},${arrowHeadHeight2}`} />
                <path fill="none" strokeWidth={lineWidth2} d={`M ${shortLineCenter} ${arrowHeadHeight2 - 1} L ${shortLineCenter} ${longLineCenter} L ${width2} ${longLineCenter}`} />
            </svg>;
  }
  const fromElementPosition = {
    x: squareSize * from.col,
    y: squareSize * from.row
  };
  const toElementPosition = {
    x: squareSize * to.col,
    y: squareSize * to.row
  };
  const distance = {
    x: (fromElementPosition.x - toElementPosition.x) * (white ? 1 : -1),
    y: (fromElementPosition.y - toElementPosition.y) * (white ? 1 : -1)
  };
  const realDistance = Math.sqrt(distance.x ** 2 + distance.y ** 2);
  const angle = Math.atan2(distance.x, distance.y);
  const degs = angle * (180 / Math.PI);
  const width = squareSize / 2;
  const lineCenter = width / 2;
  const lineWidth = width * (3 / 7);
  const arrowHeadHeight = lineWidth * 1.6;
  const height = realDistance - arrowHeadHeight;
  const positionX = `${toElementPosition.x + squareSize / 2 - width / 2}px`;
  const positionY = `${toElementPosition.y + squareSize / 2 - (white ? 0 : height)}px`;
  return <svg style={{ top: white ? positionY : "", bottom: !white ? positionY : "", left: white ? positionX : "", right: !white ? positionX : "", transformOrigin: "50% 0", rotate: -degs + "deg" }} className={`absolute opacity-65 z-[70] pointer-events-none ${props.class}`} width={width} height={height} xmlns="http://www.w3.org/2000/svg">
            <line x1={lineCenter} y1={height} x2={lineCenter} y2={arrowHeadHeight - 1} strokeWidth={lineWidth} markerEnd="url(#arrowhead)" />
            <polygon strokeWidth={0} points={`0,${arrowHeadHeight} ${lineCenter},0 ${width},${arrowHeadHeight}`} />
        </svg>;
}
function Coronation(props) {
  const { white, column, coroningWhite, squareSize, clearCoronation, coronate } = props;
  const coronationRef = useRef(null);
  const pieces = [
    QUEEN,
    KNIGHT,
    ROOK,
    BISHOP
  ];
  useEffect(() => {
    function clickClearCoronation(e) {
      if (coronationRef.current?.contains(e.target)) return;
      clearCoronation();
    }
    document.addEventListener("mousedown", clickClearCoronation);
    return () => document.removeEventListener("mousedown", clickClearCoronation);
  }, []);
  const color = coroningWhite ? WHITE : BLACK;
  const top = white && coroningWhite || !white && !coroningWhite;
  return <div ref={coronationRef} className="flex absolute bg-white z-[90] shadow-lg shadow-black/50 cursor-pointer" style={{ flexDirection: top ? "column" : "column-reverse", top: top ? 0 : void 0, bottom: !top ? 0 : void 0, left: white ? column * squareSize : void 0, right: !white ? column * squareSize : void 0 }}>
            {pieces.map((piece, i) => <div onClick={() => {
    coronate(piece);
  }} key={i}>
                    <PieceSVG piece={piece} color={color} size={squareSize} />
                </div>)}
            <div onClick={clearCoronation} className="bg-neutral-200 w-full flex justify-center items-center" style={{ height: squareSize / 2 }}>
                <Image draggable={false} src={`${import.meta.env.BASE_URL}images/analisa/cross.svg`} alt="" aria-hidden="true" width={squareSize / 4.5} height={squareSize / 4.5} />
            </div>
        </div>;
}
function Piece(props) {
  const { boardRef, pieceRef, castleRookRef, moved, isCastleRook, pieceColor, pieceSymbol, drag, setDrag, id, squareSize, setPlaying, isCoronating } = props;
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  const wasSelectedRef = useRef(false);
  if (isCoronating) return;
  function handlePieceDragStart(e) {
    if (e.button !== 0) return;
    wasSelectedRef.current = drag.id === id;
    const element = e.currentTarget;
    const elemenRect = element.getBoundingClientRect();
    const startPosition = { x: elemenRect.x + elemenRect.width / 2, y: elemenRect.y + elemenRect.height / 2 };
    function cleanUp() {
      document.removeEventListener("mousedown", pieceDragCancel);
      document.removeEventListener("mousemove", pieceDrag);
      document.removeEventListener("mouseup", pieceDragStop);
      document.body.style.cursor = "";
    }
    function pieceDragCancel() {
      setMovement({ x: 0, y: 0 });
      setDrag({ is: false, id: "" });
      cleanUp();
    }
    function pieceDrag(e2) {
      if (e2.button !== 0) return;
      handlePieceDrag(e2, startPosition);
    }
    function pieceDragStop(e2) {
      if (e2.button !== 0) return;
      handlePieceDragStop(e2, startPosition);
      cleanUp();
    }
    document.addEventListener("mousedown", pieceDragCancel);
    document.addEventListener("mousemove", pieceDrag);
    document.addEventListener("mouseup", pieceDragStop);
    document.body.style.cursor = "grabbing";
    const movement2 = {
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y
    };
    setMovement(movement2);
    setPlaying(false);
    setDrag({ is: true, id });
  }
  function handlePieceDrag(e, startPosition) {
    const board = boardRef.current;
    if (!board) return;
    const limits = {
      min: {
        x: board.offsetLeft,
        y: board.offsetTop
      },
      max: {
        x: board.offsetLeft + board.offsetWidth,
        y: board.offsetTop + board.offsetHeight
      }
    };
    const movement2 = {
      x: Math.min(Math.max(e.clientX, limits.min.x), limits.max.x) - startPosition.x,
      y: Math.min(Math.max(e.clientY, limits.min.y), limits.max.y) - startPosition.y
    };
    setMovement(movement2);
  }
  function handlePieceDragStop(e, startPosition) {
    const movement2 = {
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y
    };
    let newId = id;
    if (wasSelectedRef.current && Math.abs(movement2.x) <= squareSize / 2 && Math.abs(movement2.y) <= squareSize / 2) {
      newId = "";
    }
    setMovement({ x: 0, y: 0 });
    setDrag({ is: false, id: newId });
  }
  return <div
    data-dontcleandrag={true}
    onMouseDown={handlePieceDragStart}
    ref={moved ? pieceRef : isCastleRook ? castleRookRef : null}
    className="w-full relative h-full z-[20] cursor-grab"
    style={{ top: movement.y || "", left: movement.x || "", zIndex: drag.is && drag.id === id ? 100 : "" }}
  >
            <PieceSVG className="*:pointer-events-none" dataset={{ "dontcleandrag": true }} piece={pieceSymbol} color={pieceColor} size={squareSize} />
        </div>;
}
function Board(props) {
  const [hoverDrag, setHoverDrag] = useState("");
  const [coronation, setCoronation] = useState({ choosing: false, movement: [] });
  const configContext = useContext(ConfigContext);
  const [boardTheme] = configContext.boardTheme;
  const [usedRatings] = configContext.usedRatings;
  const [highlightByRating] = configContext.highlightByRating;
  const [showArrows] = configContext.showArrows;
  const [arrowAfterMove] = configContext.arrowAfterMove;
  const [showLegalMoves] = configContext.showLegalMoves;
  const [animateMoves] = configContext.animateMoves;
  const [boardSounds] = configContext.boardSounds;
  const boardRef = useRef(null);
  const pieceRef = useRef(null);
  const castleRookRef = useRef(null);
  const currentArrowRef = useRef([]);
  const { drag, bestMoveSan, setDrag, pushArrow, cleanArrows, setMaterialAdvantage, setPlaying, analyzingMove, arrows, previousStaticEvals, sacrifice, boardSize, bestMove, previousBestMove, moveRating: moveRating2, forward, white, animation, gameEnded, capture, nextCapture, castle, nextCastle, setAnimation, result: result2, analyzeMove } = props;
  const fen = props.fen;
  const nextFen = props.nextFen;
  const move = props.move ?? [];
  const nextMove = props.nextMove ?? [];
  const squareSize = Math.round(boardSize / 8);
  const guideSize = squareSize / 4;
  const leftSize = guideSize / 4.5;
  const rightSize = guideSize / 2.5;
  const chess = new Chess(fen);
  const board = chess.board();
  if (!white) flipBoard(board);
  const whiteMoving = !(chess.turn() === "w");
  const castleRookFrom = getCastleRookFromSquare(forward ? castle : nextCastle, forward ? whiteMoving : !whiteMoving);
  const castleRookTo = getCastleRookToSquare(forward ? castle : nextCastle, forward ? whiteMoving : !whiteMoving);
  const castleRookMove = castleRookFrom && castleRookTo ? [castleRookFrom, castleRookTo] : [];
  const filteredHighlightStyle = filterHighlightStyle(HIGHLIGHT_COLORS);
  const highlightColor = highlightByRating ? filteredHighlightStyle[moveRating2]?.color || boardThemes[boardTheme].highlight : boardThemes[boardTheme].highlight;
  const highlightRating = filteredHighlightStyle[moveRating2]?.rating;
  const soundChessInstance = forward ? chess : new Chess(nextFen);
  const soundCaptureInstance = forward ? capture : nextCapture;
  const soundCastleInstance = forward ? castle : nextCastle;
  const selfTurn = !(soundChessInstance.turn() === "w" ? white : !white);
  useEffect(() => {
    if (drag.is) return;
    if (!drag.id) return;
    const selectedPiece = chess.get(drag.id);
    if (!selectedPiece) {
      setDrag({ is: false, id: "" });
      return;
    }
    if (selectedPiece.color !== chess.turn()) {
      setDrag({ is: false, id: "" });
      return;
    }
  }, [fen]);
  useEffect(() => {
    if (!props.fen) return;
    if (!boardSounds) return;
    if (soundCastleInstance) {
      castleSound.play();
    } else if (soundCaptureInstance) {
      captureSound.play();
    } else if (soundChessInstance.isCheck()) {
      moveCheckSound.play();
    } else {
      if (selfTurn) {
        moveSelfSound.play();
      } else {
        moveOpponentSound.play();
      }
    }
    if (gameEnded) {
      gameEndSound.play();
    }
  }, [fen]);
  useEffect(() => {
    if (!animation) return;
    if (!animateMoves) return;
    if (pieceRef.current) animateMove(pieceRef.current, forward ? move : nextMove, 60, forward, white, squareSize);
    if (castleRookRef.current) animateMove(castleRookRef.current, castleRookMove, 50, forward, white, squareSize);
  }, [move, animation]);
  let newMaterialAdvantage = 0;
  useEffect(() => setMaterialAdvantage(newMaterialAdvantage), [fen]);
  function startArrow(x, y) {
    const rowNumber = Math.floor(y / squareSize);
    const colNumber = Math.floor(x / squareSize);
    const square2 = { col: white ? colNumber : 7 - colNumber, row: white ? rowNumber : 7 - rowNumber };
    currentArrowRef.current[0] = square2;
  }
  function endArrow(x, y) {
    const rowNumber = Math.floor(y / squareSize);
    const colNumber = Math.floor(x / squareSize);
    const square2 = { col: white ? colNumber : 7 - colNumber, row: white ? rowNumber : 7 - rowNumber };
    currentArrowRef.current[1] = square2;
    if (!currentArrowRef.current[0] || !currentArrowRef.current[1]) return;
    pushArrow([...currentArrowRef.current]);
    currentArrowRef.current = [];
  }
  function filterHighlightStyle(highlightStyle) {
    const filteredHighlightStyle2 = {};
    for (const key in highlightStyle) {
      const rating = key;
      if (usedRatings[rating]) filteredHighlightStyle2[rating] = { color: HIGHLIGHT_COLORS[rating], rating };
    }
    return filteredHighlightStyle2;
  }
  async function handleMovePiece(e, toSquare) {
    if (e.button !== 0) return;
    if (!drag.id) return;
    const animation2 = e.type === "mousedown" ? true : false;
    setTimeout(() => setDrag({ is: false, id: "" }), 0);
    if (analyzingMove) return;
    const from = drag.id;
    const to = toSquare;
    const formattedFrom = formatSquare(from);
    const formattedTo = formatSquare(to);
    if (chess.get(from)?.type === PAWN && [0, 7].includes(formattedTo.row)) {
      setCoronation({ choosing: true, movement: [formattedFrom, formattedTo] });
    } else {
      analyzeMove(fen, { from, to }, sacrifice ?? false, previousStaticEvals ?? [], animation2, bestMoveSan);
    }
  }
  function cleanDrag(target) {
    if (target.dataset.dontcleandrag) return;
    setDrag({ id: "", is: false });
  }
  function handleMouseDown(e) {
    if (drag.is) return;
    cleanDrag(e.target);
    if (e.button === 2) {
      e.preventDefault();
      const element = e.currentTarget;
      const elementRect = element.getBoundingClientRect();
      startArrow(e.clientX - elementRect.x, e.clientY - elementRect.y);
    } else {
      cleanArrows();
    }
  }
  function handleMouseUp(e) {
    if (drag.is) return;
    if (e.button === 2) {
      e.preventDefault();
      setAnimation(false);
      const element = e.currentTarget;
      const elementRect = element.getBoundingClientRect();
      endArrow(e.clientX - elementRect.x, e.clientY - elementRect.y);
    }
  }
  function animateMove(element, move2, zIndex, forward2, white2, squareSize2) {
    if (move2.length === 0) return;
    // Web Animations API selalu ada di peramban modern, tapi bukan jaminan di
    // semua lingkungan (jsdom, webview lama). Tanpa penjagaan ini, navigasi
    // langkah akan melempar TypeError dan seluruh papan ikut runtuh.
    if (typeof element?.animate !== "function") return;
    const [from, to] = move2;
    const fromElementPosition = {
      bottom: squareSize2 * from.row,
      left: squareSize2 * from.col
    };
    const toElementPosition = {
      bottom: squareSize2 * to.row,
      left: squareSize2 * to.col
    };
    const distance = {
      x: (toElementPosition.left - fromElementPosition.left) * (white2 ? 1 : -1),
      y: (toElementPosition.bottom - fromElementPosition.bottom) * (white2 ? 1 : -1)
    };
    function resetElements() {
      if (!element) return;
      element.style.zIndex = "";
      element.style.willChange = "";
    }
    element.style.zIndex = String(zIndex);
    element.style.willChange = "transform";
    const animation2 = element.animate(
      [
        { transform: `translate(${forward2 ? -distance.x : 0}px, ${forward2 ? distance.y : 0}px)` },
        { transform: `translate(${!forward2 ? distance.x : 0}px, ${!forward2 ? -distance.y : 0}px)` }
      ],
      { duration: 150, easing: "linear", direction: forward2 ? "normal" : "reverse" }
    );
    animation2.finished.then(resetElements).catch(resetElements);
    animation2.oncancel = resetElements;
  }
  function getLegalMoves() {
    if (!drag.id) return [];
    const moves = chess.moves({ square: drag.id, verbose: true }).map((move2) => move2.to);
    return moves;
  }
  const legalMoves = getLegalMoves();
  const boardColors = [boardThemes[boardTheme].white, boardThemes[boardTheme].black];
  const adaptedCoronationSquare = coronation.movement[0] ? adaptSquare(coronation.movement[0]) : null;
  return <div ref={boardRef} onContextMenu={(e) => e.preventDefault()} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} className="grid w-fit h-fit relative" style={{ gridTemplateColumns: `repeat(8, ${squareSize}px)`, pointerEvents: drag.is ? "none" : "unset" }}>
            {(() => {
    const squares = [];
    let rowNumber = white ? 0 : 7;
    for (const row of board) {
      let columnNumber = white ? 0 : 7;
      for (const square2 of row) {
        const squareId = getSquareId(columnNumber, rowNumber);
        let bgColor, guideColor;
        if (isEven(rowNumber)) {
          if (isEven(columnNumber)) {
            bgColor = boardColors[0];
            guideColor = boardColors[1];
          } else {
            bgColor = boardColors[1];
            guideColor = boardColors[0];
          }
        } else {
          if (isEven(columnNumber)) {
            bgColor = boardColors[1];
            guideColor = boardColors[0];
          } else {
            bgColor = boardColors[0];
            guideColor = boardColors[1];
          }
        }
        let squareNumGuide, squareLetterGuide;
        if (rowNumber === (white ? 7 : 0)) {
          squareLetterGuide = <span style={{ right: rightSize, color: guideColor }} className={`absolute bottom-0`}>{squareId[0]}</span>;
        }
        if (columnNumber === (white ? 0 : 7)) {
          squareNumGuide = <span style={{ left: leftSize, color: guideColor }} className={`absolute top-0`}>{squareId[1]}</span>;
        }
        let rounded = "";
        if (rowNumber === 0 && columnNumber === 0) rounded = white ? "rounded-tl-borderRoundness" : "rounded-br-borderRoundness";
        if (rowNumber === 7 && columnNumber === 0) rounded = white ? "rounded-bl-borderRoundness" : "rounded-tr-borderRoundness";
        if (rowNumber === 0 && columnNumber === 7) rounded = white ? "rounded-tr-borderRoundness" : "rounded-bl-borderRoundness";
        if (rowNumber === 7 && columnNumber === 7) rounded = white ? "rounded-br-borderRoundness" : "rounded-tl-borderRoundness";
        const iconTranslateX = (white ? columnNumber === 7 : columnNumber === 0) ? -5 : 35;
        const iconTranslateY = (white ? rowNumber === 0 : rowNumber === 7) ? 5 : -35;
        const iconSize = squareSize / 2.4;
        let highlighted, highlightedIcon;
        move.forEach((square3, i) => {
          const highlightedSquare = adaptSquare(square3);
          if (highlightedSquare.col === columnNumber && highlightedSquare.row === rowNumber) {
            highlighted = <div style={{ backgroundColor: highlightColor }} className={`absolute z-[10] top-0 left-0 w-full h-full opacity-50 ${rounded}`} />;
            if (i === 1) highlightedIcon = highlightRating && i === 1 ? <RatingSVG className="absolute top-0 right-0 z-[80] pointer-events-none" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%)` }} size={iconSize} rating={highlightRating} /> : "";
          }
        });
        if (squareId === drag.id && !highlighted || coronation.choosing && adaptedCoronationSquare?.col === columnNumber && adaptedCoronationSquare?.row === rowNumber) {
          highlighted = <div style={{ backgroundColor: boardThemes[boardTheme].highlight }} className={`absolute top-0 left-0 w-full h-full opacity-50 ${rounded}`} />;
        }
        let resultIcon;
        if (gameEnded) {
          if (square2?.type === KING) {
            if (result2 === "1/2-1/2") {
              resultIcon = <ResultSVG className="absolute top-0 right-0 z-[60]" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%)` }} size={iconSize} result="draw" />;
            } else {
              if (square2.color === WHITE) {
                if (result2 === "1-0") resultIcon = resultIcon = <ResultSVG className="absolute top-0 right-0 z-[60]" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%)` }} size={iconSize} result="victory" />;
                else if (result2 === "0-1") resultIcon = <ResultSVG className="absolute top-0 right-0 z-[60]" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%) rotate(-90deg)` }} size={iconSize} result="defeat" />;
              } else {
                if (result2 === "0-1") resultIcon = <ResultSVG className="absolute top-0 right-0 z-[60]" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%)` }} size={iconSize} result="victory" />;
                else if (result2 === "1-0") resultIcon = <ResultSVG className="absolute top-0 right-0 z-[60]" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%) rotate(-90deg)` }} size={iconSize} result="defeat" />;
              }
            }
          }
        }
        const toAnimateSquare = forward ? move[1] : nextMove[0];
        const adaptedToAnimateSquare = toAnimateSquare ? adaptSquare(toAnimateSquare) : { col: NaN, row: NaN };
        const moved = adaptedToAnimateSquare.col === columnNumber && adaptedToAnimateSquare.row === rowNumber;
        const isCastleRook = forward ? castleRookTo?.col === columnNumber && castleRookTo?.row === rowNumber : castleRookFrom?.col === columnNumber && castleRookFrom?.row === rowNumber;
        const pieceColor = square2?.color;
        const pieceType = square2?.type;
        let piece;
        if (pieceColor && pieceType) {
          piece = <Piece
            setPlaying={setPlaying}
            squareSize={squareSize}
            drag={drag}
            setDrag={setDrag}
            id={squareId}
            pieceRef={pieceRef}
            moved={moved}
            isCastleRook={isCastleRook}
            castleRookRef={castleRookRef}
            pieceColor={pieceColor}
            pieceSymbol={pieceType}
            boardRef={boardRef}
            isCoronating={coronation.choosing && adaptedCoronationSquare?.col === columnNumber && adaptedCoronationSquare?.row === rowNumber}
          />;
        }
        const hoverDragSquare = <div style={{ display: drag.is ? "" : "none", opacity: hoverDrag === squareId ? "100" : "", borderWidth: squareSize * 0.05 }} onMouseEnter={() => setHoverDrag(squareId)} onMouseLeave={() => setHoverDrag("")} className={`absolute top-0 z-[30] left-0 w-full h-full border-opacity-65 opacity-0 block border-white pointer-events-auto ${rounded}`} />;
        const legalMove = legalMoves.includes(squareId) ? piece ? <div onMouseEnter={() => setHoverDrag(squareId)} onMouseLeave={() => setHoverDrag("")} onMouseDown={(e) => handleMovePiece(e, squareId)} onMouseUp={(e) => handleMovePiece(e, squareId)} className="absolute w-full h-full z-[40] top-0 left-0 cursor-grab pointer-events-auto"><div style={{ borderWidth: squareSize * 0.12 }} className="border-black opacity-[15%] w-full h-full rounded-full" /></div> : <div onMouseEnter={() => setHoverDrag(squareId)} onMouseLeave={() => setHoverDrag("")} onMouseDown={(e) => handleMovePiece(e, squareId)} onMouseUp={(e) => handleMovePiece(e, squareId)} style={{ opacity: showLegalMoves ? "" : 0 }} className="absolute w-full h-full z-[40] top-0 left-0 flex justify-center items-center pointer-events-auto"><div className="bg-black opacity-[15%] w-[30%] h-[30%] rounded-full" /></div> : null;
        squares.push(<div data-square={squareId} key={squareId} style={{ height: squareSize + "px", width: squareSize + "px", fontSize: guideSize, backgroundColor: bgColor }} className={`font-bold relative ${rounded}`}>{squareNumGuide}{squareLetterGuide}{piece}{highlighted}{resultIcon ? null : highlightedIcon}{resultIcon}{hoverDragSquare}{legalMove}</div>);
        if (square2) {
          if (square2?.color === WHITE) {
            newMaterialAdvantage += PIECES_VALUES[square2.type];
          } else {
            newMaterialAdvantage -= PIECES_VALUES[square2.type];
          }
        }
        if (white) columnNumber++;
        else columnNumber--;
      }
      if (white) rowNumber++;
      else rowNumber--;
    }
    return squares;
  })()}
            {(() => {
    if (!showArrows) return;
    if (highlightRating === "book" && arrowAfterMove || highlightRating === void 0) return;
    const move2 = arrowAfterMove ? previousBestMove : bestMove;
    const adaptedMove = move2?.map((square2) => {
      return adaptSquare(square2);
    });
    return adaptedMove ? <Arrow move={adaptedMove} squareSize={squareSize} class="fill-bestArrow stroke-bestArrow" white={white} /> : "";
  })()}
            {arrows.map((move2, i) => {
    const singleSquare = JSON.stringify(move2[0]) === JSON.stringify(move2[1]);
    return <Arrow key={i} move={singleSquare ? [move2[0]] : move2} squareSize={squareSize} class={singleSquare ? "bg-badArrow" : "fill-normalArrow stroke-normalArrow"} white={white} />;
  })}
            {(() => {
    if (!coronation.choosing) return;
    function coronate(piece) {
      const from = deformatSquare(coronation.movement[0]);
      const to2 = deformatSquare(coronation.movement[1]);
      analyzeMove(fen, { from, to: to2, promotion: piece }, sacrifice ?? false, previousStaticEvals ?? [], false, bestMoveSan);
      setCoronation({ choosing: false, movement: [] });
    }
    const to = coronation.movement[1];
    return <Coronation white={white} squareSize={squareSize} column={to.col} coroningWhite={!whiteMoving} clearCoronation={() => setCoronation({ choosing: false, movement: [] })} coronate={coronate} />;
  })()}
        </div>;
}
export {
  Arrow,
  Board as default,
  gameStartSound
};
