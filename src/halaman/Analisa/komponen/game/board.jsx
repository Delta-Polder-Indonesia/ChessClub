/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { deformatSquare, formatSquare } from "../../mesin/engine.js";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { BISHOP, BLACK, Chess, KING, KNIGHT, PAWN, QUEEN, ROOK, WHITE } from "chess.js";
import { buatSuara } from "../suaraPapan.js";
import { ConfigContext } from "../../konteks/configKonteks.js";
import { boardThemes } from "../pengaturan/boardThemes.js";
import PieceSVG from "../svg/piece.jsx";
import RatingSVG from "../svg/rating.jsx";
import ResultSVG from "../svg/result.jsx";
import Image from "../Gambar.jsx";
// Kecepatan luncuran bidak: SATU sumber untuk semua papan (lihat penjelasan
// panjang di animasiBidak.js). Nilai isepic-chess-ui: 300 ms, kurva `ease`.
import { GESER_ISEPIC } from "../../../TekaTeki/animasiBidak.js";
const HIGHLIGHT_COLORS = {
  forced: "",
  brilliant: "var(--highlightBrilliant)",
  great: "var(--highlightGreat)",
  // `critical` sengaja memakai warna `best`: tidak ada kosakata visual baru.
  critical: "var(--highlightBest)",
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
/* Array kosong STABIL untuk `castleRookMove` ketika langkah bukan rokade —
   dependensi efek animasi harus identik antar-render agar luncuran tidak
   di-restart oleh render yang tidak berkaitan. */
const KOSONG_TANPA_GESER = Object.freeze([]);
/* Bunyi papan dibuat dengan Web Audio (lihat ../suaraPapan.js) — tanpa
   dependensi howler dan tanpa berkas MP3 berlisensi copyleft. */
const moveSelfSound = buatSuara("move-self");
const moveOpponentSound = buatSuara("move-opponent");
const moveCheckSound = buatSuara("move-check");
const gameEndSound = buatSuara("game-end");
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
  }, [clearCoronation]);
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
  const { boardRef, pieceRef, castleRookRef, moved, isCastleRook, pieceColor, pieceSymbol, drag, setDrag, id, squareSize, setPlaying, isCoronating, bolehSeret, kotakDariKursor } = props;
  const [movement, setMovement] = useState({ x: 0, y: 0 });
  const wasSelectedRef = useRef(false);
  const pindahKotakRef = useRef(false);
  const bersihRef = useRef(null);
  /*
   * Drag memasang tiga listener di `document` dan menulis kursor <body>.
   * Bila bidak ini dilepas di tengah drag (partai baru dimuat, komponen
   * dibongkar), tanpa pelepasan berikut listener-nya menetap di document dan
   * kursor situs terkunci "grabbing" sampai halaman dimuat ulang.
   */
  useEffect(() => () => bersihRef.current?.(), []);
  if (isCoronating) return;
  /*
   * Batas seret HARUS dibaca dari `getBoundingClientRect()` papan, bukan
   * `offsetLeft`/`offsetTop` seperti upstream.
   *
   * `offset*` dihitung terhadap offsetParent terdekat — di situs ini `<main>`
   * ber-`relative` di areaKerja.jsx — sehingga:
   *   1. tidak memuat jarak papan ke tepi viewport (tinggi bilah navigasi atas
   *      di mobile, lebar bilah kiri di desktop), dan
   *   2. tidak ikut berkurang saat `<main>`/halaman di-scroll,
   * padahal pembandingnya (`e.clientX`/`e.clientY`) SELALU koordinat viewport.
   * Selisih kedua ruang koordinat itu membuat kursor "di-clamp" lebih awal:
   * bidak tertahan puluhan piksel dari kursor di tepi kanan/bawah papan dan
   * terasa terangkat jauh, tidak lagi di tengah kursor.
   */
  function batasSeret() {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    // Papan belum diukur (render pertama, jsdom): tanpa batas — memaksa clamp
    // ke rect kosong justru membekukan bidak di titik nol.
    if (!rect.width || !rect.height) return null;
    // Batasnya = tepi papan persis, jadi selama kursor di atas papan bidak
    // SELALU tepat di tengah kursor; yang dibatasi hanya kursor yang sudah
    // keluar papan (bidak berhenti di tepi, tidak terbang ke luar layar).
    return {
      minX: rect.left,
      maxX: rect.right,
      minY: rect.top,
      maxY: rect.bottom
    };
  }
  // Pusat bidak dikunci tepat di bawah kursor (pola chessground/Lichess).
  function gerakIkutKursor(clientX, clientY, startPosition) {
    const batas = batasSeret();
    const x = batas ? Math.min(Math.max(clientX, batas.minX), batas.maxX) : clientX;
    const y = batas ? Math.min(Math.max(clientY, batas.minY), batas.maxY) : clientY;
    return { x: x - startPosition.x, y: y - startPosition.y };
  }
  function handlePieceDragStart(e) {
    if (e.button !== 0) return;
    /*
     * Bidak lawan tidak boleh diangkat. chess.js tidak menghasilkan langkah
     * untuknya, jadi drag-nya buntu: bidak melompat mengikuti kursor lalu
     * balik sendiri, dan kotaknya tetap tersorot sebagai "terpilih" sampai
     * FEN berganti. Ditutup di pintu masuk, bukan lewat efek pembersih.
     */
    if (!bolehSeret) return;
    wasSelectedRef.current = drag.id === id;
    pindahKotakRef.current = false;
    const element = e.currentTarget;
    const elemenRect = element.getBoundingClientRect();
    const startPosition = { x: elemenRect.x + elemenRect.width / 2, y: elemenRect.y + elemenRect.height / 2 };
    function cleanUp() {
      document.removeEventListener("mousedown", pieceDragCancel);
      document.removeEventListener("mousemove", pieceDrag);
      document.removeEventListener("mouseup", pieceDragStop);
      document.body.style.cursor = "";
      bersihRef.current = null;
    }
    function pieceDragCancel(e2) {
      // Event mousedown yang MEMULAI drag ini ikut merambat sampai `document`
      // (listener baru didaftarkan di tengah perambatan) — abaikan agar drag
      // tidak langsung dibatalkan oleh event-nya sendiri. Perbandingan
      // memakai nativeEvent karena React memanggil handler dengan event
      // sintetis. Pembatalan yang benar terjadi pada klik berikutnya.
      if (e2 === e.nativeEvent) return;
      setMovement({ x: 0, y: 0 });
      setDrag({ is: false, id: "" });
      cleanUp();
    }
    function pieceDrag(e2) {
      /* `button` pada mousemove tidak bisa diandalkan (peramban modern
         melaporkannya 0 tanpa peduli tombol mana yang tertahan) — yang benar
         `buttons`. Tidak ada tombol tertahan berarti mouseup-nya terlewat
         (tombol dilepas di luar jendela/tab): akhiri drag di sini supaya
         bidak tidak terus menempel pada kursor. */
      if (typeof e2.buttons === "number" && e2.buttons === 0) {
        pieceDragCancel(e2);
        return;
      }
      handlePieceDrag(e2, startPosition);
    }
    function pieceDragStop(e2) {
      if (e2.button !== 0) return;
      handlePieceDragStop(e2);
      cleanUp();
    }
    document.addEventListener("mousedown", pieceDragCancel);
    document.addEventListener("mousemove", pieceDrag);
    document.addEventListener("mouseup", pieceDragStop);
    bersihRef.current = cleanUp;
    document.body.style.cursor = "grabbing";
    setMovement(gerakIkutKursor(e.clientX, e.clientY, startPosition));
    setPlaying(false);
    setDrag({ is: true, id });
  }
  function handlePieceDrag(e, startPosition) {
    setMovement(gerakIkutKursor(e.clientX, e.clientY, startPosition));
    // `keyHasChanged` ala chessground: gestur ini pernah meninggalkan kotak
    // asal, walau nanti kembali lagi.
    if (kotakDariKursor?.(e.clientX, e.clientY) !== id) pindahKotakRef.current = true;
  }
  function handlePieceDragStop(e) {
    /*
     * Aturan chessground — library papan yang dipakai Lichess dan en-croissant
     * (`@lichess-org/chessground`, `src/drag.ts` → `end()`, sama di v10.1.1):
     *
     *   (orig === previouslySelected || keyHasChanged) && (orig === dest || !dest)
     *       → unselect
     *
     * Artinya: bidak yang SUDAH terpilih, lalu diangkat dan dilepas di
     * kotaknya sendiri (atau di luar papan) = batal pilih, titik petunjuk
     * mati. Klik berikutnya memilih lagi → on/off/on/off.
     *
     * Port lama memakai jarak piksel dari TENGAH kotak (`|movement| <=
     * squareSize/2`) dengan `startPosition` dibaca dari
     * `getBoundingClientRect()` bidak. Rect itu bergeser selama animasi
     * langkah (`GESER_ISEPIC`: 300 ms ease, `transform` WAAPI di
     * `animateMove`), jadi klik kedua di
     * tempat yang sama bisa terhitung "pindah" dan titik petunjuk tidak mati;
     * lepas di luar papan juga tidak pernah membatalkan pilihan. Membandingkan
     * KOTAK — bukan piksel — tidak bergantung pada rect bidak sama sekali.
     */
    const kotakAkhir = kotakDariKursor ? kotakDariKursor(e.clientX, e.clientY) : id;
    const lepasDiAsal = kotakAkhir === id || kotakAkhir === "";
    const batalPilih = lepasDiAsal && (wasSelectedRef.current || pindahKotakRef.current);
    setMovement({ x: 0, y: 0 });
    setDrag({ is: false, id: batalPilih ? "" : id });
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
  const dragTimerRef = useRef(0);
  const animasiLangkahRef = useRef(new WeakMap());
  // Kunci transisi yang SUDAH dianimasikan (lihat efek animasi) — menjaga
  // satu langkah tidak meluncur dua kali walau efek berjalan ulang.
  const kunciAnimasiRef = useRef(null);
  useEffect(() => () => clearTimeout(dragTimerRef.current), []);
  const { drag, bestMoveSan, setDrag, pushArrow, cleanArrows, setMaterialAdvantage, setPlaying, analyzingMove, arrows, previousStaticEvals, kandidat, sacrifice, boardSize, bestMove, previousBestMove, moveRating: moveRating2, forward, white, animation, gameEnded, capture, nextCapture, castle, nextCastle, setAnimation, result: result2, analyzeMove } = props;
  const fen = props.fen;
  const nextFen = props.nextFen;
  const move = useMemo(() => props.move ?? [], [props.move]);
  const nextMove = useMemo(() => props.nextMove ?? [], [props.nextMove]);
  const squareSize = Math.round(boardSize / 8);
  const guideSize = squareSize / 4;
  const leftSize = guideSize / 4.5;
  const rightSize = guideSize / 2.5;
  /*
   * `fen` bisa undefined (belum ada partai) atau tidak sah (posisi dari PGN
   * rusak). `new Chess(fen)` melempar dan — karena Board dirender di jalur
   * utama halaman — melempar seluruh halaman Analisa ke layar putih.
   * Posisi awal dipakai sebagai cadangan agar papan tetap tampil.
   */
  const chess = (() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  })();
  const board = chess.board();
  if (!white) flipBoard(board);
  const whiteMoving = !(chess.turn() === "w");
  const castleRookFrom = getCastleRookFromSquare(forward ? castle : nextCastle, forward ? whiteMoving : !whiteMoving);
  const castleRookTo = getCastleRookToSquare(forward ? castle : nextCastle, forward ? whiteMoving : !whiteMoving);
  /* `castleRookFrom`/`castleRookTo` objek BARU tiap render — memakainya
     sebagai dependensi `useMemo` membuat `castleRookMove` berganti identitas
     tiap render, dan efek animasi di bawah ikut berjalan ulang: luncuran
     di-cancel lalu dimulai lagi dari petak asal sehingga bidak "jalan 2x"
     setiap ada render di tengah luncuran (update state engine saat analisis,
     setDrag timer, dsb). Kuncinya pada nilai PRIMITIF (jenis rokade + sisi),
     bukan pada objek geometri. */
  const gerakanRokade = forward ? castle : nextCastle;
  const sisiRokade = forward ? whiteMoving : !whiteMoving;
  const castleRookMove = useMemo(() => {
    const from = getCastleRookFromSquare(gerakanRokade, sisiRokade);
    const to = getCastleRookToSquare(gerakanRokade, sisiRokade);
    return from && to ? [from, to] : KOSONG_TANPA_GESER;
  }, [gerakanRokade, sisiRokade]);
  const filteredHighlightStyle = filterHighlightStyle(HIGHLIGHT_COLORS);
  const highlightColor = highlightByRating ? filteredHighlightStyle[moveRating2]?.color || boardThemes[boardTheme].highlight : boardThemes[boardTheme].highlight;
  const highlightRating = filteredHighlightStyle[moveRating2]?.rating;
  // Sama seperti `chess` di atas: nextFen bisa kosong di langkah terakhir.
  //
  // Hanya TURUNAN PRIMITIF (boolean/string) yang boleh masuk dependensi efek
  // suara di bawah. Instance Chess dibuat ulang tiap render — dulu ia ikut
  // menjadi dependensi sehingga efek suara berjalan SETIAP render dan bunyi
  // langkah terulang-ulang tanpa ada langkah baru ("langkah terdengar 2x").
  const soundChessInstance = forward
    ? chess
    : (() => {
        try {
          return new Chess(nextFen);
        } catch {
          return chess;
        }
      })();
  const soundCaptureInstance = forward ? capture : nextCapture;
  const soundCastleInstance = forward ? castle : nextCastle;
  const selfTurn = !(soundChessInstance.turn() === "w" ? white : !white);
  const skakSekarang = (() => {
    try {
      return soundChessInstance.isCheck();
    } catch {
      return false;
    }
  })();
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
    // `chess` sengaja tidak dijadikan dependensi: ia objek baru tiap render,
    // sedangkan nilainya murni turunan `fen` (sudah ada di daftar dependensi).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, drag.id, drag.is, setDrag]);
  useEffect(() => {
    if (!props.fen) return;
    if (!boardSounds) return;
    if (soundCastleInstance) {
      castleSound.play();
    } else if (soundCaptureInstance) {
      captureSound.play();
    } else if (skakSekarang) {
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
    // Dependensi WAJIB primitif semua. `soundChessInstance` (objek Chess baru
    // tiap render) pernah berada di sini sehingga efek ini berjalan setiap
    // render — bunyi langkah berulang untuk satu langkah yang sama. Cukup
    // `fen`/`props.fen` yang menggerakkan: satu perubahan posisi = satu bunyi.
  }, [fen, boardSounds, gameEnded, props.fen, selfTurn, soundCaptureInstance, soundCastleInstance, skakSekarang]);
  useEffect(() => {
    if (!animation || !animateMoves) {
      // Animasi tidak aktif — transisi berikutnya (mis. kembali ke langkah ini
      // lewat navigasi) harus beranimasi lagi, jadi penanda dibersihkan.
      kunciAnimasiRef.current = null;
      return;
    }
    /* Satu transisi (posisi + arah + langkah) hanya boleh dianimasikan SEKALI.
     *
     * Efek ini dulu berjalan ulang setiap kali dependensi berganti identitas —
     * termasuk `castleRookMove` yang objeknya dibuat ulang tiap render — dan
     * `animateMove` selalu me-restart luncuran dari petak asal: saat engine
     * menyala, update state di tengah 300 ms luncuran membuat bidak kembali ke
     * petak asal lalu meluncur lagi ("bidak jalan 2x", tersisa artefak lapisan
     * `willChange`). Kunci transisi menjamin render ulang apa pun tidak pernah
     * memulai luncuran kedua untuk langkah yang sama. */
    const gerakanAnimasi = forward ? move : nextMove;
    const kunci = `${fen}|${forward ? "f" : "b"}|${JSON.stringify(gerakanAnimasi)}`;
    if (kunciAnimasiRef.current === kunci) return;
    kunciAnimasiRef.current = kunci;
    if (pieceRef.current) animateMove(pieceRef.current, gerakanAnimasi, 60, forward, white, squareSize);
    if (castleRookRef.current) animateMove(castleRookRef.current, castleRookMove, 50, forward, white, squareSize);
  }, [move, animation, animateMoves, castleRookMove, forward, nextMove, squareSize, white, fen]);
  let newMaterialAdvantage = 0;
  useEffect(() => setMaterialAdvantage(newMaterialAdvantage), [fen, newMaterialAdvantage, setMaterialAdvantage]);
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
  /*
   * Kotak di bawah kursor (koordinat viewport), atau "" bila di luar papan.
   * Konvensi kolom/barisnya mengikuti `startArrow` di atas: `white` menentukan
   * papan dibaca dari a8 (putih di bawah) atau h1 (hitam di bawah).
   *
   * Dipakai `Piece` untuk membedakan "klik" dan "seret" lewat perbandingan
   * KOTAK, bukan jarak piksel — lihat komentar di `handlePieceDragStop`.
   */
  function kotakDariKursor(clientX, clientY) {
    const board = boardRef.current;
    if (!board) return "";
    const rect = board.getBoundingClientRect();
    if (!rect.width || !rect.height) return "";
    const kolom = Math.floor((clientX - rect.left) / squareSize);
    const baris = Math.floor((clientY - rect.top) / squareSize);
    if (kolom < 0 || kolom > 7 || baris < 0 || baris > 7) return "";
    return getSquareId(white ? kolom : 7 - kolom, white ? baris : 7 - baris);
  }
  function filterHighlightStyle(highlightStyle) {
    const filteredHighlightStyle2 = {};
    for (const key in highlightStyle) {
      const rating = key;
      // `critical` tampil sebagai `best`, jadi saklar pengaturannya pun ikut
      // `best` — mematikan "best" tidak boleh menyisakan sorotan bintang.
      const saklar = rating === "critical" ? "best" : rating;
      if (usedRatings[saklar]) filteredHighlightStyle2[rating] = { color: HIGHLIGHT_COLORS[rating], rating };
    }
    return filteredHighlightStyle2;
  }
  async function handleMovePiece(e, toSquare) {
    if (e.button !== 0) return;
    if (!drag.id) return;
    const animation2 = e.type === "mousedown" ? true : false;
    clearTimeout(dragTimerRef.current);
    dragTimerRef.current = setTimeout(() => setDrag({ is: false, id: "" }), 0);
    if (analyzingMove) return;
    const from = drag.id;
    const to = toSquare;
    const formattedFrom = formatSquare(from);
    const formattedTo = formatSquare(to);
    if (chess.get(from)?.type === PAWN && [0, 7].includes(formattedTo.row)) {
      setCoronation({ choosing: true, movement: [formattedFrom, formattedTo] });
    } else {
      analyzeMove(fen, { from, to }, sacrifice ?? false, previousStaticEvals ?? [], animation2, bestMoveSan, kandidat ?? []);
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
    // Navigasi cepat antar-langkah: animasi lama yang belum selesai dibatalkan
    // dulu. Penyelesaiannya hanya boleh mereset gaya bila animasinya MASIH yang
    // aktif untuk elemen ini — `.catch(resetElements)` animasi lama terpanggil
    // sebagai microtask SETELAH animasi baru memasang zIndex/willChange, dan
    // tanpa penjagaan itu ia merobohkan gaya animasi baru (bidak meluncur di
    // bawah bidak lain, tersisa lapisan "bayangan").
    animasiLangkahRef.current.get(element)?.cancel();
    element.style.zIndex = String(zIndex);
    element.style.willChange = "transform";
    const animation2 = element.animate(
      [
        { transform: `translate(${forward2 ? -distance.x : 0}px, ${forward2 ? distance.y : 0}px)` },
        { transform: `translate(${!forward2 ? distance.x : 0}px, ${!forward2 ? -distance.y : 0}px)` }
      ],
      {
        duration: GESER_ISEPIC.durasi,
        easing: GESER_ISEPIC.kurva,
        direction: forward2 ? "normal" : "reverse",
      }
    );
    animasiLangkahRef.current.set(element, animation2);
    const resetElements = () => {
      if (!element) return;
      if (animasiLangkahRef.current.get(element) !== animation2) return;
      animasiLangkahRef.current.delete(element);
      element.style.zIndex = "";
      element.style.willChange = "";
    };
    animation2.finished.then(resetElements).catch(resetElements);
    animation2.oncancel = resetElements;
  }
  // Langkah sah hanya berubah saat kotak yang diseret atau posisinya berubah.
  // `chess` dibuat baru setiap render, jadi tanpa `useMemo` daftar langkah sah
  // dihitung ulang pada setiap render saat menyeret (berat & memuat busuk).
  const legalMoves = useMemo(() => {
    if (!drag.id) return [];
    return chess.moves({ square: drag.id, verbose: true }).map((move2) => move2.to);
  }, [drag.id, chess]);
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
                if (result2 === "1-0") resultIcon = <ResultSVG className="absolute top-0 right-0 z-[60]" style={{ transform: `translateX(${iconTranslateX}%) translateY(${iconTranslateY}%)` }} size={iconSize} result="victory" />;
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
            bolehSeret={pieceColor === chess.turn()}
            kotakDariKursor={kotakDariKursor}
            isCoronating={coronation.choosing && adaptedCoronationSquare?.col === columnNumber && adaptedCoronationSquare?.row === rowNumber}
          />;
        }
        /* Cincin penanda kotak tujuan saat menyeret.
           Dua cacat upstream diperbaiki di sini:
           1. `opacity: "100"` bukan nilai CSS yang sah (opacity 0..1), jadi
              deklarasi inline-nya dibuang peramban dan cincin tidak pernah
              muncul — kelas `opacity-0` yang menang. Nilainya kini 1.
           2. `border-opacity-65` sudah dihapus di Tailwind v4 (diperiksa
              dengan compiler Tailwind 4.3.3 milik repo: kelas itu tidak
              menghasilkan CSS apa pun) — diganti modifier `border-white/65`. */
        const hoverDragSquare = <div style={{ display: drag.is ? "" : "none", opacity: hoverDrag === squareId ? 1 : "", borderWidth: squareSize * 0.05 }} onMouseEnter={() => setHoverDrag(squareId)} onMouseLeave={() => setHoverDrag("")} className={`absolute top-0 z-[30] left-0 w-full h-full opacity-0 block border-white/65 pointer-events-auto ${rounded}`} />;
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
      analyzeMove(fen, { from, to: to2, promotion: piece }, sacrifice ?? false, previousStaticEvals ?? [], false, bestMoveSan, kandidat ?? []);
      setCoronation({ choosing: false, movement: [] });
    }
    const to = coronation.movement[1];
    return <Coronation white={white} squareSize={squareSize} column={to.col} coroningWhite={!whiteMoving} clearCoronation={() => setCoronation({ choosing: false, movement: [] })} coronate={coronate} />;
  })()}
        </div>;
}
export { Arrow, Board as default };
