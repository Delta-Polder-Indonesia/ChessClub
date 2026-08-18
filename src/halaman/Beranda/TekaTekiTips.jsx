import React from "react";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import { ChessPiece } from "./ChessPieceSvg.jsx";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

/**
 * Posisi Papan Catur Persis sesuai markup Maia Chess (train-section):
 *
 * Black:
 *   a8: rook, f8: rook, g8: king
 *   c7: pawn, f7: pawn, g7: bishop, h7: pawn
 *   c6: pawn, d6: queen, g6: pawn
 *   a5: pawn, e5: pawn
 *   d4: pawn, g4: bishop
 *
 * White:
 *   c5: knight
 *   e4: pawn
 *   b3: pawn, d3: pawn, g3: queen
 *   a2: pawn, c2: pawn, e2: knight, f2: pawn, g2: pawn, h2: pawn
 *   a1: rook, e1: king, h1: rook
 *   f6: bishop
 */
const BOARD_PIECES = [
  // 8 (row 0)
  ["r", "", "", "", "", "r", "k", ""],
  // 7 (row 1)
  ["", "", "p", "", "", "p", "b", "p"],
  // 6 (row 2)
  ["", "", "p", "q", "", "B", "p", ""],
  // 5 (row 3)
  ["p", "", "N", "", "p", "", "", ""],
  // 4 (row 4)
  ["", "", "", "p", "P", "", "b", ""],
  // 3 (row 5)
  ["", "P", "", "P", "", "", "Q", ""],
  // 2 (row 6)
  ["P", "", "P", "", "N", "P", "P", "P"],
  // 1 (row 7)
  ["R", "", "", "", "K", "", "", "R"],
];

function ChessBoardComponent() {
  return (
    <div className="relative w-full max-w-[304px] aspect-square select-none overflow-hidden rounded border border-white/10 shadow-lg bg-[#201d24]">
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {RANKS.map((rank, rIdx) =>
          FILES.map((file, fIdx) => {
            const isLight = (rIdx + fIdx) % 2 === 0;
            const piece = BOARD_PIECES[rIdx][fIdx] || "";
            const squareName = `${file}${rank}`;

            let bgClass = isLight ? "bg-[#d8c3a5]" : "bg-[#8f6843]";

            return (
              <div
                key={squareName}
                className={`relative flex items-center justify-center ${bgClass}`}
              >
                {/* File coordinate (at bottom rank 1) */}
                {rIdx === 7 && (
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-slate-700/80 leading-none">
                    {file}
                  </span>
                )}

                {/* Rank coordinate (at left file a) */}
                {fIdx === 0 && (
                  <span className="absolute top-0.5 left-1 text-[8px] font-bold text-slate-700/80 leading-none">
                    {rank}
                  </span>
                )}

                {/* Chess Piece Vector SVG */}
                {piece && (
                  <div className="w-[85%] h-[85%] flex items-center justify-center pointer-events-none drop-shadow">
                    <ChessPiece piece={piece} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Panah Taktis (Red arrow g4->e2, Blue arrow g7->f6) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
      >
        <defs>
          <marker
            id="arrowhead-red"
            orient="auto"
            markerWidth="5"
            markerHeight="5"
            refX="3"
            refY="2.5"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#dc2626" />
          </marker>
          <marker
            id="arrowhead-blue"
            orient="auto"
            markerWidth="5"
            markerHeight="5"
            refX="3"
            refY="2.5"
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#2563eb" />
          </marker>
        </defs>

        {/* Panah Merah: dari Gajah g4 ke Kuda e2 */}
        <line
          x1="81.25"
          y1="56.25"
          x2="57.5"
          y2="78.75"
          stroke="#dc2626"
          strokeWidth="2.8"
          strokeLinecap="round"
          markerEnd="url(#arrowhead-red)"
          opacity="0.85"
        />

        {/* Panah Biru: dari Gajah g7 ke Gajah Putih f6 */}
        <line
          x1="81.25"
          y1="18.75"
          x2="69.5"
          y2="30.5"
          stroke="#2563eb"
          strokeWidth="2.8"
          strokeLinecap="round"
          markerEnd="url(#arrowhead-blue)"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

function MovesByRatingChartComponent() {
  return (
    <div
      id="analysis-moves-by-rating"
      className="flex h-full w-full flex-col bg-transparent"
    >
      {/* Legend & Title */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b border-white/5">
        <span className="text-xs font-semibold text-white/90">
          Moves by Rating
        </span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-semibold" style={{ color: "rgb(252, 187, 161)" }}>
            Bxe2
          </span>
          <span className="font-semibold" style={{ color: "rgb(35, 139, 69)" }}>
            Bxf6
          </span>
          <span className="font-semibold" style={{ color: "rgb(203, 24, 29)" }}>
            Qxf6
          </span>
          <span className="font-semibold" style={{ color: "rgb(252, 146, 114)" }}>
            Qxc5
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-[155px] pt-1">
        <svg
          viewBox="0 0 309 180"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="colorg4e2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fcbba1" stopOpacity="0.5" />
              <stop offset="95%" stopColor="#fcbba1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="colorg7f6" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#238b45" stopOpacity="0.5" />
              <stop offset="95%" stopColor="#238b45" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="colord6f6" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#cb181d" stopOpacity="0.5" />
              <stop offset="95%" stopColor="#cb181d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="colord6c5" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fc9272" stopOpacity="0.5" />
              <stop offset="95%" stopColor="#fc9272" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          <g>
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="60" y1="155" x2="259" y2="155" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="60" y1="120" x2="259" y2="120" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="60" y1="85" x2="259" y2="85" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="60" y1="50" x2="259" y2="50" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="60" y1="15" x2="259" y2="15" />
          </g>

          {/* Grid lines vertical */}
          <g>
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="84.875" y1="15" x2="84.875" y2="155" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="134.625" y1="15" x2="134.625" y2="155" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="184.375" y1="15" x2="184.375" y2="155" />
            <line strokeDasharray="3 3" stroke="#3C3C3C" x1="234.125" y1="15" x2="234.125" y2="155" />
          </g>

          {/* Y-Axis Ticks */}
          <text x="52" y="158" fill="white" fontSize="10" textAnchor="end">0%</text>
          <text x="52" y="123" fill="white" fontSize="10" textAnchor="end">25%</text>
          <text x="52" y="88" fill="white" fontSize="10" textAnchor="end">50%</text>
          <text x="52" y="53" fill="white" fontSize="10" textAnchor="end">75%</text>
          <text x="52" y="18" fill="white" fontSize="10" textAnchor="end">100%</text>

          {/* Y-Axis Label */}
          <text
            x="-85"
            y="12"
            transform="rotate(-90)"
            fill="#FE7F6D"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
          >
            Maia Probability
          </text>

          {/* X-Axis Ticks */}
          <text x="84.875" y="170" fill="white" fontSize="10" textAnchor="middle">1200</text>
          <text x="134.625" y="170" fill="white" fontSize="10" textAnchor="middle">1400</text>
          <text x="184.375" y="170" fill="white" fontSize="10" textAnchor="middle">1600</text>
          <text x="234.125" y="170" fill="white" fontSize="10" textAnchor="middle">1800</text>

          {/* Area 1: Bxe2 (Salmon / Peach) */}
          <path
            fill="url(#colorg4e2)"
            d="M60,110 L84.875,100 L109.75,90 L134.625,82 L159.5,75 L184.375,66 L209.25,62 L234.125,57 L259,55 L259,155 L60,155 Z"
          />
          <path
            stroke="#fcbba1"
            fill="none"
            strokeWidth="2.5"
            d="M60,110 L84.875,100 L109.75,90 L134.625,82 L159.5,75 L184.375,66 L209.25,62 L234.125,57 L259,55"
          />
          <circle cx="84.875" cy="100" r="2.5" fill="#fcbba1" />
          <circle cx="134.625" cy="82" r="2.5" fill="#fcbba1" />
          <circle cx="184.375" cy="66" r="2.5" fill="#fcbba1" />
          <circle cx="234.125" cy="57" r="2.5" fill="#fcbba1" />
          <text x="265" y="58" fill="#fcbba1" fontSize="10" fontWeight="600">Bxe2</text>

          {/* Area 2: Bxf6 (Green) */}
          <path
            fill="url(#colorg7f6)"
            d="M60,105 L84.875,112 L109.75,118 L134.625,123 L159.5,127 L184.375,132 L209.25,135 L234.125,138 L259,140 L259,155 L60,155 Z"
          />
          <path
            stroke="#238b45"
            fill="none"
            strokeWidth="2.5"
            d="M60,105 L84.875,112 L109.75,118 L134.625,123 L159.5,127 L184.375,132 L209.25,135 L234.125,138 L259,140"
          />
          <circle cx="84.875" cy="112" r="2.5" fill="#238b45" />
          <circle cx="134.625" cy="123" r="2.5" fill="#238b45" />
          <circle cx="184.375" cy="132" r="2.5" fill="#238b45" />
          <circle cx="234.125" cy="138" r="2.5" fill="#238b45" />
          <text x="265" y="142" fill="#238b45" fontSize="10" fontWeight="600">Bxf6</text>

          {/* Line 3: Qxf6 (Red) */}
          <path
            stroke="#cb181d"
            fill="none"
            strokeWidth="2"
            d="M60,135 L84.875,137 L109.75,140 L134.625,142 L159.5,144 L184.375,146 L209.25,147 L234.125,148 L259,149"
          />
          <circle cx="134.625" cy="142" r="2" fill="#cb181d" />
          <circle cx="234.125" cy="148" r="2" fill="#cb181d" />
          <text x="265" y="151" fill="#cb181d" fontSize="9" fontWeight="600">Qxf6</text>

          {/* Line 4: Qxc5 (Coral) */}
          <path
            stroke="#fc9272"
            fill="none"
            strokeWidth="2"
            d="M60,140 L84.875,142 L109.75,144 L134.625,145 L159.5,146 L184.375,147 L209.25,147 L234.125,148 L259,147"
          />
          <text x="265" y="161" fill="#fc9272" fontSize="9" fontWeight="600">Qxc5</text>
        </svg>
      </div>
    </div>
  );
}

export default function TekaTekiTips() {
  return (
    <BagianBeranda id="konten-tiktok" title="Teka-Teki & Tips">
      {/* Kontainer Luar dengan Gradien Radial Gelap Maia Chess */}
      <div className="relative bg-[#120f17] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 85% at 0% 90%, rgba(239, 68, 68, 0.07) 0%, transparent 75%), radial-gradient(ellipse 75% 65% at 100% 40%, rgba(239, 68, 68, 0.05) 0%, transparent 75%)",
          }}
        />

        <section
          id="train-section"
          className="relative w-full flex-col items-center overflow-hidden bg-transparent py-8 sm:py-10 md:py-14"
        >
          <div className="z-10 mx-auto flex w-full max-w-[95%] flex-col items-center px-2 md:max-w-[92%] md:flex-row md:gap-8 md:px-4 lg:gap-12">
            {/* Kolom Kiri: Teks & Tombol Mulai (md:w-2/5) */}
            <div className="mb-6 w-full md:mb-0 md:w-2/5">
              <div className="mb-3 inline-block rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 px-4 py-1 text-xs sm:text-sm font-medium text-[#fe7f6d] md:mb-4">
                Human-Centered Puzzles
              </div>

              <h2 className="mb-4 text-2xl font-bold sm:text-3xl lg:text-4xl text-white leading-tight md:mb-5">
                Train with Maia as your coach
              </h2>

              <p className="mb-3 text-sm text-white/80 leading-relaxed md:mb-4 md:text-base">
                Maia curates puzzles based on its understanding of how millions of
                players improve. With Maia puzzles, you can benchmark your vision,
                focus on your gaps in understanding, and turn hard-to-spot ideas into
                second nature.
              </p>

              <p className="mb-6 text-sm text-white/80 leading-relaxed md:mb-6 md:text-base">
                Each puzzle includes data showing how players of different ratings
                approach the position, making your training more targeted and
                effective.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  className="flex items-center justify-center rounded-md bg-[#b85244] hover:bg-[#a54538] px-6 py-3 font-medium text-white transition duration-200 shadow-md text-sm md:text-base"
                  href="/program-kami/sekolah-catur/cara-bermain-catur"
                >
                  Start Puzzles
                </a>
              </div>
            </div>

            {/* Kolom Kanan: Glass Card Papan Catur & Analisis (md:w-3/5) */}
            <div className="relative w-full md:w-3/5">
              <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.04] backdrop-blur-md shadow-2xl">
                {/* Header Kartu */}
                <div className="border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-2 h-2.5 w-2.5 rounded-full bg-[#fe7f6d]" />
                      <p className="font-semibold text-sm sm:text-base text-white m-0!">
                        Tactical Puzzle
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded bg-white/10 border border-white/10 px-2.5 py-0.5 text-xs text-white/80 font-medium">
                        Intermediate
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 mt-1 m-0!">
                    Find the best move in this tactical position
                  </p>
                </div>

                {/* Isi Kartu: 2 Sub-Kolom (Kiri Papan Catur, Kanan Grafik & Analisis) */}
                <div className="flex flex-col gap-4 p-4 md:flex-row items-center md:items-start">
                  {/* Sub-Kolom 1: Papan Catur (md:w-1/2) */}
                  <div className="flex w-full justify-center md:w-1/2">
                    <div className="w-full max-w-[304px] flex flex-col overflow-hidden rounded border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-1">
                      <ChessBoardComponent />
                    </div>
                  </div>

                  {/* Sub-Kolom 2: Grafik & Analisis Posisi (md:w-1/2) */}
                  <div className="flex w-full flex-col md:w-1/2 gap-3">
                    {/* Kotak Grafik Moves by Rating */}
                    <div className="overflow-hidden rounded border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 sm:p-3 backdrop-blur-md">
                      <MovesByRatingChartComponent />
                    </div>

                    {/* Kotak Analisis Posisi */}
                    <div className="overflow-hidden rounded border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 backdrop-blur-md text-xs">
                      <h4 className="mb-2 text-sm font-semibold text-white m-0!">
                        Position Analysis
                      </h4>
                      <p className="mb-3 text-[11px] leading-relaxed text-white/80 m-0!">
                        Be alert, this position is highly treacherous! It is easy
                        to go astray with tempting blunders like{" "}
                        <span
                          className="font-mono font-semibold"
                          style={{ color: "rgb(252, 187, 161)" }}
                        >
                          Bxe2
                        </span>
                        . Only{" "}
                        <span
                          className="font-mono font-semibold"
                          style={{ color: "rgb(35, 139, 69)" }}
                        >
                          Bxf6
                        </span>{" "}
                        offers an advantage, and it is hard for human players to find.
                      </p>

                      <div className="flex flex-col gap-1.5 2xl:flex-row pt-2 border-t border-white/10 text-[11px]">
                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center">
                            <span className="mr-1.5 h-2 w-2 rounded-full bg-[#238b45]" />
                            <span className="text-white/70">Best Move</span>
                          </div>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: "rgb(35, 139, 69)" }}
                          >
                            Bxf6
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center">
                            <span className="mr-1.5 h-2 w-2 rounded-full bg-[#fcbba1]" />
                            <span className="text-white/70">Common Mistake</span>
                          </div>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: "rgb(252, 187, 161)" }}
                          >
                            Bxe2
                          </span>
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <div className="flex items-center">
                            <span className="mr-1.5 h-2 w-2 rounded-full bg-[#cb181d]" />
                            <span className="text-white/70">Other Mistake</span>
                          </div>
                          <span
                            className="font-mono font-semibold"
                            style={{ color: "rgb(203, 24, 29)" }}
                          >
                            Qxf6
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </BagianBeranda>
  );
}
