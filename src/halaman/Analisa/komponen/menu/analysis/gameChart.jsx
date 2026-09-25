/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useState } from "react";
import RatingSVG from "../../svg/rating.jsx";
import { getLastBookMove } from "./moves/moves.jsx";
import { jalurGrafik, tinggiEval, xGrafik } from "./grafikEval.js";
import { ratingTampilan } from "../../../mesin/evaluasi.js";

function isImportantMove(moveNumber, rating, prevRating, lastBookMove) {
  if (!rating) return;
  if (moveNumber === lastBookMove) return "highlightBook";
  if (rating === "best" && prevRating === "inaccuracy") return "highlightBest";
  if (rating === "critical") return "highlightBest";
  if (rating === "blunder") return "highlightBlunder";
  if (rating === "mistake") return "highlightMistake";
  if (rating === "miss") return "highlightMiss";
  if (rating === "great") return "highlightGreat";
  if (rating === "brilliant") return "highlightBrilliant";
}

function teksEvaluasi(move, indeks) {
  const evaluasi = move?.previousStaticEvals?.[0];
  if (!evaluasi || !["cp", "mate"].includes(evaluasi[0])) return "--";
  const putihJalan = move.color === "w" || (move.color !== "b" && indeks % 2 === 0);
  const nilai = Number(evaluasi[1]) * (putihJalan ? 1 : -1);
  if (evaluasi[0] === "mate" && (!evaluasi[1] || nilai === 0)) return putihJalan ? "0-1" : "1-0";
  if (!Number.isFinite(nilai)) return "--";
  if (evaluasi[0] === "mate") return `${nilai > 0 ? "+" : "-"}M${Math.abs(nilai)}`;
  return `${nilai >= 0 ? "+" : "-"}${(Math.abs(nilai) / 100).toFixed(2)}`;
}

function GameChart(props) {
  const { moves = [], container, moveNumber, setMoveNumber, setAnimation, setForward, interaktif = true, label } = props;
  const [hoveredMove, setHoveredMove] = useState(NaN);
  const [size, setSize] = useState({ width: 400, height: 96 });
  const totalMoves = Math.max(1, moves.length - 1);
  const hoveredMoveX = xGrafik(hoveredMove, totalMoves, size.width);
  const moveNumberX = xGrafik(moveNumber, totalMoves, size.width);
  const lastBookMove = getLastBookMove(moves);
  const importantMoves = moves.map((move, i) => ({
    // Langkah paksa digambar netral (abu-abu) seperti warisan: kualitasnya
    // yang kebetulan menempel tidak mewarnai grafik.
    color: isImportantMove(i, ratingTampilan(move), ratingTampilan(moves[i - 1]), lastBookMove),
    move,
  }));
  const entriAktif = moves[moveNumber];
  const penilaianAktif = ratingTampilan(entriAktif);
  const strokeColor = penilaianAktif && penilaianAktif !== "forced"
    ? `highlight${penilaianAktif === "critical" ? "Best" : penilaianAktif[0].toUpperCase() + penilaianAktif.slice(1)}`
    : "foregroundGrey";

  useEffect(() => {
    function setRealSize() {
      const lebar = container?.offsetWidth;
      setSize({ width: lebar ? lebar * 0.85 : 400, height: 96 });
    }
    setRealSize();
    window.addEventListener("resize", setRealSize);
    return () => window.removeEventListener("resize", setRealSize);
  }, [container]);

  function indeksDariKursor(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const lebar = rect.width || size.width;
    const x = Math.min(Math.max(e.clientX - rect.left, 0), lebar);
    return Math.min(moves.length - 1, Math.round(x / lebar * totalMoves));
  }

  function changeMoveNumber(e) {
    if (!interaktif || !moves.length) return;
    const indeks = e ? indeksDariKursor(e) : (Number.isInteger(hoveredMove) ? hoveredMove : moveNumber);
    if (!Number.isInteger(indeks) || indeks < 0 || indeks >= moves.length || indeks === moveNumber) return;
    setAnimation(Math.abs(moveNumber - indeks) === 1);
    setForward(indeks > moveNumber);
    setMoveNumber(indeks);
  }

  function tombolGrafik(e) {
    if (!interaktif) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      e.stopPropagation();
      setHoveredMove((sebelum) => Math.min(Math.max(
        (Number.isInteger(sebelum) ? sebelum : moveNumber) + (e.key === "ArrowRight" ? 1 : -1),
        0,
      ), moves.length - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      changeMoveNumber();
    }
  }

  const posisiAktif = Number.isInteger(hoveredMove) && hoveredMove >= 0 && hoveredMove < moves.length
    ? moves[hoveredMove] : null;
  const posisiTooltip = Math.min(Math.max(hoveredMoveX - 40, 0), Math.max(size.width - 100, 0));

  return <div className="relative shrink-0" style={{ width: size.width, height: size.height }}>
    <svg
      role={interaktif ? "button" : "img"}
      aria-label={label}
      tabIndex={interaktif ? 0 : undefined}
      onClick={interaktif ? changeMoveNumber : undefined}
      onKeyDown={tombolGrafik}
      onMouseMove={(e) => setHoveredMove(indeksDariKursor(e))}
      onMouseLeave={() => setHoveredMove(NaN)}
      width={size.width}
      height={size.height}
      className={`bg-evaluationBarBlack rounded-borderRoundness ${interaktif ? "cursor-pointer" : ""}`}
    >
      <path fill="#ffffff" d={jalurGrafik(moves, size.width, size.height)} />
      <line x1={0} y1={size.height / 2} x2={size.width} y2={size.height / 2} className="stroke-foregroundGrey opacity-75 stroke-2" />
      {posisiAktif && <line x1={hoveredMoveX} y1={size.height} x2={hoveredMoveX} y2={0} className="stroke-foregroundGrey opacity-50 stroke-2" />}
      {interaktif && moves[moveNumber] && <line style={{ stroke: `var(--${strokeColor})` }} x1={moveNumberX} y1={size.height} x2={moveNumberX} y2={0} className="stroke-[4px]" />}
      {importantMoves.map((posisi, i) => {
        if (!(posisi.color || (interaktif && i === moveNumber))) return null;
        const x = xGrafik(i, totalMoves, size.width);
        const y = size.height * (1 - tinggiEval(posisi.move, i));
        return <circle key={i} style={{ fill: `var(--${posisi.color ?? strokeColor})` }} cx={x} cy={y} r={i === moveNumber ? 4 : 3} />;
      })}
    </svg>
    {posisiAktif && <div role="tooltip" className="pointer-events-none absolute z-10 flex flex-col rounded border border-black bg-white/90 p-1 text-sm text-[#222]" style={{ left: posisiTooltip, top: size.height + 2 }}>
      <span className="flex items-center gap-1">
        {posisiAktif.moveRating && <RatingSVG rating={ratingTampilan(posisiAktif)} size={18} /> }
        {teksEvaluasi(posisiAktif, hoveredMove)}
      </span>
      {posisiAktif.san && <span className="text-xs">{posisiAktif.san}</span>}
    </div>}
  </div>;
}

export { GameChart as default };
