/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useState } from "react";
import { getLastBookMove } from "./moves/moves.jsx";
import { jalurGrafik, tinggiEval, xGrafik } from "./grafikEval.js";
function isImportantMove(moveNumber, rating, prevRating, nextRating, lastBookMove) {
  if (!rating) return;
  if (moveNumber === lastBookMove) return "highlightBook";
  if (rating === "best" && prevRating === "inaccuracy") return "highlightBest";
  // Tanpa warna sendiri: `critical` memakai warna `best` (lihat svg/rating.jsx).
  if (rating === "critical") return "highlightBest";
  if (rating === "blunder") return "highlightBlunder";
  if (rating === "mistake") return "highlightMistake";
  if (rating === "miss") return "highlightMiss";
  if (rating === "great") return "highlightGreat";
  if (rating === "brilliant") return "highlightBrilliant";
  return;
}
function GameChart(props) {
  const { moves, container, moveNumber, setMoveNumber, setAnimation, setForward } = props;
  const [hoveredMove, setHoveredMove] = useState(NaN);
  const [importantMoves, setImportantMoves] = useState([]);
  const [size, setSize] = useState({ width: 400, height: 96 });
  // Analisis satu posisi (alur FEN) hanya punya 1 entri → totalMoves 0 →
  // pembagian nol → seluruh koordinat NaN dan <path> tidak sah. Minimal 1.
  const totalMoves = Math.max(1, moves.length - 1);
  const hoveredMoveX = xGrafik(hoveredMove, totalMoves, size.width);
  const moveNumberX = xGrafik(moveNumber, totalMoves, size.width);
  useEffect(() => {
    // `container` datang dari `menuRef.current` induk dan pada render
    // pertama masih null — tanpa penjagaan ini grafik melempar TypeError
    // dan menjatuhkan seluruh panel Ringkasan/Langkah.
    function setRealSize() {
      const lebar = container?.offsetWidth;
      setSize({ width: lebar ? lebar * 0.85 : 400, height: 96 });
    }
    setRealSize();
    window.addEventListener("resize", setRealSize);
    return () => window.removeEventListener("resize", setRealSize);
  }, [container]);
  useEffect(() => {
    const newImportantMoves = moves.map((move2, i) => {
      const rating = move2.moveRating;
      const previousRating = moves[i - 1]?.moveRating;
      const nextRating = moves[i + 1]?.moveRating;
      return { color: isImportantMove(i, rating, previousRating, nextRating, lastBookMove), move: move2 };
    });
    setImportantMoves(newImportantMoves);
  }, [moves]);
  function hoverMove(e) {
    const svg = e.currentTarget;
    const svgPosition = svg.getBoundingClientRect().x;
    const mousePosition = e.clientX;
    const mouseInSvgPosition = mousePosition - svgPosition;
    const moveSize = size.width / totalMoves;
    const move2 = Math.round(mouseInSvgPosition / moveSize);
    setHoveredMove(move2);
  }
  function changeMoveNumber() {
    if (hoveredMove === moveNumber) return;
    if (Math.abs(moveNumber - hoveredMove) === 1) {
      setAnimation(true);
    }
    if (hoveredMove > moveNumber) {
      setForward(true);
    } else {
      setForward(false);
    }
    setMoveNumber(hoveredMove);
  }
  const upperFirstLetter = (str) => str[0]?.toUpperCase() + str.substring(1);
  const lastBookMove = getLastBookMove(moves);
  // `moves[moveNumber]` bisa undefined sesaat setelah partai baru dimuat
  // (moveNumber masih menunjuk indeks partai lama) — jangan dereference.
  const penilaianAktif = moves[moveNumber]?.moveRating;
  const strokeColor =
    penilaianAktif && penilaianAktif !== "forced" ? `highlight${upperFirstLetter(penilaianAktif)}` : "foregroundGrey";
  return <svg onClick={changeMoveNumber} onMouseMove={hoverMove} onMouseLeave={() => setHoveredMove(NaN)} width={size.width} height={size.height} className="bg-evaluationBarBlack rounded-borderRoundness">
            <path
    fill="#ffffff"
    d={jalurGrafik(moves, size.width, size.height)}
  />
            <line x1={0} y1={size.height / 2} x2={size.width} y2={size.height / 2} className="stroke-foregroundGrey opacity-75 stroke-2" />
            {isNaN(hoveredMoveX) ? "" : <line x1={hoveredMoveX} y1={size.height} x2={hoveredMoveX} y2={0} className="stroke-foregroundGrey opacity-50 stroke-2" />}
            {isNaN(moveNumberX) ? "" : <line style={{ display: !moveNumber ? "none" : "", stroke: `var(--${strokeColor})` }} x1={moveNumberX} y1={size.height} x2={moveNumberX} y2={0} className="stroke-[4px]" />}
            {importantMoves.map((move2, i) => {
    if (!(move2.color || i === moveNumber && moveNumber)) return;
    const x = xGrafik(i, totalMoves, size.width);
    const y = size.height * (1 - tinggiEval(move2.move, i));
    return <circle key={i} style={{ fill: `var(--${move2.color ?? strokeColor})` }} cx={x} cy={y} r={5} />;
  })}
        </svg>;
}
export {
  GameChart as default
};
