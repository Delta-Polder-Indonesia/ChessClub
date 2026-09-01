/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useState, useRef, useContext } from "react";
import Board, { gameStartSound } from "./board.jsx";
import Clock from "./clock.jsx";
import Name from "./name.jsx";
import Evaluation from "./evaluation.jsx";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { formatSquare, getCastle, invertColor, parseMove, parsePGN, parsePosition } from "../../mesin/engine.js";
import { cariNamaPembukaan } from "../../mesin/buku.js";
import { Chess, WHITE } from "chess.js";
import { pushPageWarning, pushPageError } from "../errors/pageErrors.jsx";
import { gunakanMesin } from "../../konteks/mesin.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { ErrorsContext } from "../../konteks/errors.jsx";
import { maxVertical, navTop } from "../../konstanta.js";
import { ConfigContext } from "../../konteks/config.jsx";
import GameButtons from "../menu/analysis/gameButtons.jsx";
function getMoves(game, moveNumber, customLine, returnedToNormalGame) {
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
function getArrows(arrows, moveNumber, customLine) {
  if (customLine.moveNumber < 0) {
    return arrows[moveNumber];
  }
  return customLine.arrows[customLine.moveNumber];
}
function getCustomResult(move2) {
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
function Game({ wadah }) {
  const [boardSize, setBoardSize] = useState(750);
  const [gameHeight, setGameHeight] = useState(850);
  const [captured, setCaptured] = useState({ white: [], black: [] });
  const [arrows, setArrows] = useState({ 0: [] });
  const [gap, setGap] = useState(10);
  const [openings2, setOpenings] = useState(null);
  const [drag2, setDrag] = useState({ is: false, id: "" });
  const [isNavTop, setIsNavTop] = useState(false);
  const analyzeContext = useContext(AnalyzeContext);
  const errorsContext = useContext(ErrorsContext);
  const configContext = useContext(ConfigContext);
  const [players, setPlayers] = analyzeContext.players;
  const [time, setTime] = analyzeContext.time;
  const [moveNumber, setMoveNumber] = analyzeContext.moveNumber;
  const [game, setGame] = analyzeContext.game;
  const [data] = analyzeContext.data;
  const [pageState, setPageState] = analyzeContext.pageState;
  const [forward, setForward] = analyzeContext.forward;
  const [animation, setAnimation] = analyzeContext.animation;
  const [white, setWhite] = analyzeContext.white;
  const [playing, setPlaying] = analyzeContext.playing;
  const [materialAdvantage] = analyzeContext.materialAdvantage;
  const [result2, setResult] = analyzeContext.result;
  const setProgress = analyzeContext.progress[1];
  const [tab, setTab] = analyzeContext.tab;
  const [analyzeController, setAnalyzeController] = analyzeContext.analyzeController;
  const [customLine, setCustomLine] = analyzeContext.customLine;
  const [returnedToNormalGame] = analyzeContext.returnedToNormalGame;
  const [analyzingMove, setAnalyzingMove] = analyzeContext.analyzingMove;
  const [depth] = analyzeContext.depth;
  const setMaterialAdvantage = analyzeContext.materialAdvantage[1];
  const gameController = analyzeContext.gameController;
  const setErrors = errorsContext.errors[1];
  const [boardSounds] = configContext.boardSounds;
  const componentRef = useRef(null);
  const gameRef = useRef(null);
  const { t } = useI18n();
  const { didukung, siapkan, ambilMesin } = gunakanMesin();
  const intervalRef = useRef();
  const tabRef = useRef(tab);
  const dragRef = useRef(drag2);
  const analyzingMoveRef = useRef(analyzingMove);
  const pageStateRef = useRef(pageState);
  const { previousMove, move: move2, nextMove } = getMoves(game, moveNumber, customLine, returnedToNormalGame);
  const shownResult = customLine.moveNumber < 0 ? result2 : getCustomResult(move2);
  useEffect(() => {
    analyzingMoveRef.current = analyzingMove;
  }, [analyzingMove]);
  useEffect(() => {
    dragRef.current = drag2;
  }, [drag2]);
  useEffect(() => {
    pageStateRef.current = pageState;
  }, [pageState]);
  // Label "langkah buku": tabel nama pembukaan milik situs ini sendiri
  // (dibangun oleh scripts/generasi-buku-analisa.mjs). Bentuknya fungsi
  // pencarian (fen) => nama, bukan peta mentah, agar penghitung langkah di
  // FEN bisa diabaikan — tabel upstream tidak pernah cocok karena itu.
  useEffect(() => {
    let hidup = true;
    cariNamaPembukaan().then((pencari) => {
      if (hidup) setOpenings(() => pencari);
    });
    return () => {
      hidup = false;
    };
  }, []);
  // Engine TIDAK lagi dimuat di sini: worker dimiliki <MesinProvider> dan
  // baru diunduh ketika pengguna benar-benar meminta analisis (lihat
  // src/halaman/Analisa/konteks/mesin.jsx). Yang tersisa hanya peringatan
  // untuk peramban tanpa WebAssembly.
  useEffect(() => {
    if (didukung) return undefined;
    pushPageWarning(setErrors, t("analisa.status.peringatanWasm"), t("analisa.status.peringatanWasmIsi"));
    return undefined;
  }, [didukung, setErrors, t]);
  useEffect(() => {
    setAnimation(false);
  }, [moveNumber, customLine.moveNumber]);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (playing) {
      let nextMove2 = function() {
        gameController.forward();
      };
      nextMove2();
      intervalRef.current = setInterval(nextMove2, 1e3);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing]);
  function createArrowsObject(length) {
    const newArrows = {};
    Array.from({ length }).forEach((_, i) => {
      newArrows[i] = [];
    });
    return newArrows;
  }
  function cleanArrows() {
    setArrows({ 0: [] });
  }
  function cleanCurrentArrows() {
    if (customLine.moveNumber < 0) {
      setArrows((prev) => {
        return { ...prev, [moveNumber]: [] };
      });
    } else {
      setCustomLine((prev) => ({ ...prev, arrows: { ...prev.arrows, [prev.moveNumber]: [] } }));
    }
  }
  function pushArrow(currentArrow) {
    if (customLine.moveNumber < 0) {
      const repeatedIndex = arrows[moveNumber].findIndex((arrow) => JSON.stringify(arrow) === JSON.stringify(currentArrow));
      const isRepeated = repeatedIndex !== -1;
      const newArrows = [...arrows[moveNumber]];
      if (isRepeated) {
        newArrows.splice(repeatedIndex, 1);
      } else {
        newArrows.push(currentArrow);
      }
      setArrows((prev) => {
        return { ...prev, [moveNumber]: newArrows };
      });
    } else {
      const repeatedIndex = customLine.arrows[customLine.moveNumber].findIndex((arrow) => JSON.stringify(arrow) === JSON.stringify(currentArrow));
      const isRepeated = repeatedIndex !== -1;
      const newArrows = [...customLine.arrows[customLine.moveNumber]];
      if (isRepeated) {
        newArrows.splice(repeatedIndex, 1);
      } else {
        newArrows.push(currentArrow);
      }
      setCustomLine((prev) => ({ ...prev, arrows: { ...prev.arrows, [customLine.moveNumber]: newArrows } }));
    }
  }
  useEffect(() => {
    let lastPressed = 0;
    function handleKeyDown(e) {
      // Tombol panah/spasi adalah pintasan pemutar partai. Kalau belum ada
      // partai termuat, biarkan peramban menggulirkan halaman seperti biasa.
      if (pageStateRef.current === "default") return;
      const element = e.target;
      const focusableInputTypes = ["text", "number", "password", "email", "search", "tel", "url"];
      if (element.tagName === "INPUT" && focusableInputTypes.includes(element.getAttribute("type") ?? "")) return;
      if (element.tagName === "TEXTAREA") return;
      const now = (/* @__PURE__ */ new Date()).getTime();
      const minPressInterval = 25;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (dragRef.current.is) return;
          if (now - lastPressed < minPressInterval) return;
          if (analyzingMoveRef.current) return;
          gameController.back();
          lastPressed = (/* @__PURE__ */ new Date()).getTime();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (dragRef.current.is) return;
          if (now - lastPressed < minPressInterval) return;
          if (analyzingMoveRef.current) return;
          gameController.forward();
          lastPressed = (/* @__PURE__ */ new Date()).getTime();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (dragRef.current.is) return;
          if (now - lastPressed < minPressInterval) return;
          if (analyzingMoveRef.current) return;
          gameController.first();
          lastPressed = (/* @__PURE__ */ new Date()).getTime();
          break;
        case "ArrowDown":
          e.preventDefault();
          if (dragRef.current.is) return;
          if (now - lastPressed < minPressInterval) return;
          if (analyzingMoveRef.current) return;
          gameController.last();
          lastPressed = (/* @__PURE__ */ new Date()).getTime();
          break;
        case " ":
          e.preventDefault();
          if (dragRef.current.is) return;
          if (now - lastPressed < minPressInterval) return;
          if (analyzingMoveRef.current) return;
          gameController.togglePlay();
          lastPressed = (/* @__PURE__ */ new Date()).getTime();
          break;
        case "Tab":
          e.preventDefault();
          if (now - lastPressed < minPressInterval) return;
          const tab2 = tabRef.current;
          // pageStateRef, bukan pageState: efek ini hanya dipasang sekali
          // sehingga `pageState` di sini selamanya bernilai render pertama.
          if (pageStateRef.current === "analyze") {
            if (tab2 === "summary") setTab("moves");
            else if (tab2 === "moves") setTab("summary");
          }
          break;
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    // Dulu dilepas dari `window` padahal dipasang di `document`, sehingga
    // pendengar menumpuk setiap kali halaman dibuka ulang dan tombol panah
    // memicu beberapa langkah sekaligus.
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  async function handlePGN(pgn, depth2) {
    setPageState("loading");
    if (!pgn?.trim()) {
      pushPageError(setErrors, t("analisa.galat.pgnJudul"), t("analisa.galat.pgnIsi"));
      setPageState("default");
      return;
    }
    let mesin;
    try {
      mesin = await siapkan();
    } catch {
      pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
      setPageState("default");
      return;
    }
    try {
      const { metadata, moves } = await parsePGN(mesin, pgn, depth2, openings2 ?? {}, setProgress, analyzeController.signal);
      setTime(metadata.time);
      setPlayers(metadata.players.map((p) => ({ name: p.name || t("analisa.pemain.anonim"), elo: p.elo })));
      setGame(moves);
      setResult(metadata.result);
      setAnimation(false);
      setArrows(createArrowsObject(moves.length));
      setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
      setAnalyzingMove(false);
      if (boardSounds) setTimeout(() => gameStartSound.play(), 100);
      setPageState("analyze");
    } catch (e) {
      switch (e?.kunci ?? e?.message) {
        case "pgn":
          pushPageError(setErrors, t("analisa.galat.pgnJudul"), t("analisa.galat.pgnIsi"));
          break;
        case "canceled":
          setAnalyzeController(new AbortController());
          break;
        case "mesin":
          pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
          break;
        default:
          pushPageError(setErrors, t("analisa.galat.analisisJudul"), String(e?.message ?? e));
      }
      setPageState("default");
    }
    setProgress(0);
    setMoveNumber(0);
  }
  async function handleFEN(fen) {
    let move3;
    try {
      move3 = await new Promise(async (resolve, reject) => {
        setPageState("loading");
        setTime(0);
        setPlayers([{ name: t("analisa.pemain.putih"), elo: "?" }, { name: t("analisa.pemain.hitam"), elo: "?" }]);
        setWhite(true);
        setPlaying(false);
        setMoveNumber(0);
        setResult("");
        setProgress(0);
        setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
        setAnalyzingMove(false);
        cleanArrows();
        if (!fen?.trim()) {
          // Tanpa FEN: papan bebas dari posisi awal, saran engine langsung
          // ditampilkan setelah engine siap (lihat efek di bawah).
          const chess2 = new Chess();
          const fen2 = chess2.fen();
          const bestMove = chess2.move({ from: "e2", to: "e4" });
          const move5 = {
            fen: fen2,
            color: chess2.turn(),
            bestMove: [formatSquare(bestMove.from), formatSquare(bestMove.to)],
            bestMoveSan: bestMove.san,
            previousStaticEvals: [["cp", "-30"]]
          };
          setGame([move5]);
          setPageState("default");
          return;
        }
        const mesin = await siapkan().catch(() => null);
        if (!mesin) {
          pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
          resolve(null);
          return;
        }
        let chess;
        try {
          chess = new Chess(fen);
        } catch {
          reject(new Error("fen"));
          return;
        }
        const signal = analyzeController.signal;
        function handleAbort() {
          reject(new Error("canceled"));
          signal.removeEventListener("abort", handleAbort);
        }
        const move4 = await parsePosition(mesin, chess, depth, signal, handleAbort);
        resolve(move4);
      });
    } catch (e) {
      switch (e?.kunci ?? e?.message) {
        case "fen":
          pushPageError(setErrors, t("analisa.galat.fenJudul"), t("analisa.galat.fenIsi"));
          break;
        case "canceled":
          setAnalyzeController(new AbortController());
          break;
        case "mesin":
          pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
          break;
        default:
          pushPageError(setErrors, t("analisa.galat.analisisJudul"), String(e?.message ?? e));
      }
      setPageState("default");
      return;
    }
    if (!move3) {
      setPageState("default");
      return;
    }
    setGame([move3]);
    setPageState("analyzeCustom");
  }
  useEffect(() => {
    const { format, string } = data;
    switch (format) {
      case "pgn":
        handlePGN(string, depth);
        break;
      case "fen":
        handleFEN(string);
        break;
    }
  }, [data]);
  /**
   * Ukuran papan = sisi terkecil wadah halaman, dikurangi lajur bilah
   * evaluasi, menu papan, dan panel kanan bila panel masih sejajar.
   *
   * upstream mengukur `window.innerHeight` dikurangi tinggi <nav> mereka;
   * di proyek ini halaman berada di bawah header situs dan di dalam
   * kontainer ber-padding, jadi yang diukur elemen wadah itu sendiri
   * (`wadah` dari Analisa.jsx) agar papan tidak pernah meluap ke bawah lipatan.
   */
  useEffect(() => {
    function updateBoardSize() {
      const el = wadah?.current;
      const lebar = el?.clientWidth ?? window.innerWidth;
      const tinggi = el?.clientHeight ?? window.innerHeight;

      const newGap = lebar < maxVertical ? 6 : 10;
      setGap(newGap);

      const component = componentRef.current;
      const statusBar = component?.getElementsByTagName("div")[0];
      const statusBarHeight = statusBar?.offsetHeight ?? 0;
      const componentHeight = Math.min(tinggi, component?.offsetHeight ?? tinggi);
      const gapHeight = newGap;
      const evalWidth = 36;
      const menuWidth = 400;
      const boardMenuWidth = 17;
      const gapWidth = 8;
      const paddingWidth = 16;

      const isNavTop = lebar < navTop;
      setIsNavTop(isNavTop);

      if (isNavTop) {
        const padding = 8;
        const gameButtonsHeight = 40;
        const boardHeight =
          tinggi -
          (padding + evalWidth + gapWidth + statusBarHeight + gapWidth + gapWidth + statusBarHeight + gapHeight + gameButtonsHeight + gapHeight + boardMenuWidth + padding);
        const maxWidth = lebar - padding * 2;
        const size = roundBoardSize(Math.min(boardHeight, maxWidth));
        setBoardSize(size);
        setGameHeight(size);
        return;
      }

      if (lebar < maxVertical) {
        const padding = 8;
        const evalLebar = 28;
        const gameButtonsHeight = 69;
        const boardHeight = tinggi - (statusBarHeight * 2 + gapHeight * 3 + padding * 2 + gameButtonsHeight);
        const maxWidth = lebar - (padding + evalLebar + gapHeight + gapWidth + boardMenuWidth + padding);
        const size = roundBoardSize(Math.min(boardHeight, maxWidth));
        setBoardSize(size);
        setGameHeight(size + statusBarHeight * 2 + gapHeight * 2);
        return;
      }

      const boardHeight = componentHeight - (statusBarHeight * 2 + gapHeight * 2);
      const maxWidth =
        lebar - (paddingWidth + evalWidth + gapHeight + gapWidth + boardMenuWidth + gapWidth + menuWidth + paddingWidth);
      const size = roundBoardSize(Math.min(boardHeight, maxWidth));
      setBoardSize(size);
      setGameHeight(size + statusBarHeight * 2 + gapHeight * 2);
    }

    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(updateBoardSize) : null;
    if (observer && wadah?.current) observer.observe(wadah.current);
    return () => {
      window.removeEventListener("resize", updateBoardSize);
      observer?.disconnect();
    };
    // pageState ikut jadi dependensi: panel kanan baru muncul setelah
    // analisis berjalan, dan itu mengubah lebar yang tersedia untuk papan.
  }, [wadah, pageState]);
  useEffect(() => {
    const newCaptured = { white: [], black: [] };
    for (let i = 0; i <= moveNumber && i < game.length; i++) {
      const move3 = game[i];
      if (move3.capture) newCaptured[move3.color === "w" ? "black" : "white"].push(move3.capture);
    }
    for (let i = 0; i <= customLine.moveNumber; i++) {
      const move3 = customLine.moves[i];
      if (move3.capture) newCaptured[move3.color === "w" ? "black" : "white"].push(move3.capture);
    }
    setCaptured(newCaptured);
  }, [moveNumber, customLine.moveNumber]);
  function roundBoardSize(boardSize2) {
    return Math.round(boardSize2 / 8) * 8;
  }
  function sliceCustomArrows(arrows2, moveNumber2) {
    const newArrows = {};
    for (let i = 0; i <= moveNumber2; i++) {
      if (!arrows2[i]) newArrows[i] = [];
      else newArrows[i] = arrows2[i];
    }
    return newArrows;
  }
  async function analyzeMove(previousFen, movement, previousSacrifice, previousStaticEvals, animation2, previousBestMoveSan) {
    const chess = new Chess(previousFen);
    const unanalyzedMoveObj = chess.move(movement);
    const unanalyzedMove = {
      fen: unanalyzedMoveObj.after,
      movement: [formatSquare(movement.from), formatSquare(movement.to)],
      color: invertColor(unanalyzedMoveObj.color),
      capture: unanalyzedMoveObj.captured,
      castle: getCastle(unanalyzedMoveObj.san),
      san: unanalyzedMoveObj.san
    };
    setAnimation(animation2);
    setForward(true);
    setCustomLine((prev) => ({ moveNumber: prev.moveNumber + 1, moves: [...prev.moves.slice(0, prev.moveNumber + 1), unanalyzedMove], arrows: sliceCustomArrows(prev.arrows, prev.moveNumber + 1) }));
    setAnalyzingMove(true);
    if (data.format === "fen") setPageState("analyzeCustom");
    /*
     * Analisis langkah manual. Semua jalur keluar HARUS melepas
     * `analyzingMove`: kalau tidak, papan terkunci selamanya (tombol dan
     * tombol panah semuanya memeriksa bendera ini) dan pengguna harus
     * memuat ulang halaman. Karena itu pembersihannya ada di `finally`,
     * bukan setelah `await`.
     */
    let move3;
    try {
      const signal = analyzeController.signal;
      const mesin = ambilMesin() ?? (await siapkan().catch(() => null));
      if (mesin && !signal.aborted) {
        const chess2 = new Chess(previousFen);
        const move4 = chess2.move(movement);
        move3 = await parseMove(
          mesin,
          depth,
          move4,
          chess2,
          previousStaticEvals,
          previousBestMoveSan,
          previousSacrifice,
          openings2 ?? {},
          () => {
            throw new Error("canceled");
          },
          signal
        );
      }
    } catch (e) {
      // Batal (tombol Batal / ganti engine) bukan galat yang perlu
      // ditampilkan; sisanya dilaporkan supaya tidak hilang diam-diam.
      const kunci = e?.kunci ?? e?.message;
      if (kunci !== "canceled" && kunci !== "pencarian dibatalkan" && kunci !== "permintaan digantikan") {
        pushPageError(setErrors, t("analisa.galat.analisisJudul"), String(e?.message ?? e));
      }
      move3 = undefined;
    } finally {
      setAnimation(false);
      setAnalyzingMove(false);
    }

    /*
     * Bila analisis gagal/dibatalkan, langkahnya tetap ada di papan sebagai
     * langkah "belum dinilai" — menyisipkan `undefined` ke dalam daftar akan
     * merobohkan render (getMoves membaca `.movement` dari elemen ini).
     */
    if (!move3) return;
    setCustomLine((prev) => ({ ...prev, moveNumber: prev.moveNumber, moves: [...prev.moves.slice(0, prev.moveNumber), move3] }));
  }
  function formatTime(seconds) {
    const noTime = "--:--";
    const toTwoDigits = (num) => {
      return String(num).padStart(2, "0");
    };
    const getMinutes = (seconds2) => {
      return [Math.floor(seconds2 / 60), seconds2 % 60];
    };
    const getHours = (minutes2) => {
      return Math.ceil(minutes2 / 60);
    };
    const getDays = (hours) => {
      return Math.ceil(hours / 24);
    };
    const [minutes, restSeconds] = getMinutes(seconds);
    if (minutes) {
      const hours = getHours(minutes);
      if (hours > 2) {
        const days = getDays(hours);
        if (days > 2) {
          return t("analisa.waktu.hari", { n: days });
        }
        return t("analisa.waktu.jam", { n: hours });
      }
      return `${toTwoDigits(minutes)}:${toTwoDigits(restSeconds)}`;
    }
    if (restSeconds) return `${toTwoDigits(minutes)}:${toTwoDigits(restSeconds)}`;
    return noTime;
  }
  return <div className="flex flex-col gap-[6px]">
        <div ref={gameRef} tabIndex={0} style={{ gap }} className="h-full flex navTop:flex-row flex-col outline-none">
            <div style={{ [isNavTop ? "width" : "height"]: gameHeight }} className="flex navTop:flex-row flex-col items-center">
                <Evaluation size={boardSize} navTop={isNavTop} white={white} advantage={analyzingMove ? previousMove?.previousStaticEvals?.[0] ?? ["cp", "0"] : move2?.previousStaticEvals?.[0] ?? ["cp", "0"]} whiteMoving={(analyzingMove ? previousMove?.color ?? WHITE : move2?.color ?? WHITE) === WHITE} />
            </div>
            <div ref={componentRef} style={{ gap }} className="h-full flex flex-col justify-start">
                <div style={{ width: boardSize }} className="flex flex-row justify-between">
                    <Name materialAdvantage={materialAdvantage} captured={captured[white ? "black" : "white"]} white={!white}>{`${players[white ? 1 : 0].name} ${players[white ? 1 : 0].elo !== "NOELO" ? `(${players[white ? 1 : 0].elo})` : ""}`}</Name>
                    <Clock white={!white} colorMoving={game[moveNumber]?.color}>{formatTime(time)}</Clock>
                </div>
                <Board
    setPlaying={setPlaying}
    cleanArrows={cleanCurrentArrows}
    arrows={getArrows(arrows, moveNumber, customLine)}
    sacrifice={move2?.sacrifice}
    forward={forward}
    moveRating={move2?.moveRating}
    bestMove={move2?.bestMove}
    previousBestMove={previousMove?.bestMove}
    move={move2?.movement}
    nextMove={nextMove?.movement}
    fen={move2?.fen}
    nextFen={nextMove?.fen}
    boardSize={boardSize}
    white={white}
    animation={animation}
    gameEnded={moveNumber === game.length - 1 && customLine.moveNumber < 0 || customLine.moveNumber >= 0 && Boolean(shownResult)}
    capture={move2?.capture}
    nextCapture={nextMove?.capture}
    castle={move2?.castle}
    nextCastle={nextMove?.castle}
    setAnimation={setAnimation}
    result={shownResult}
    pushArrow={pushArrow}
    analyzeMove={analyzeMove}
    previousStaticEvals={move2?.previousStaticEvals}
    analyzingMove={analyzingMove}
    setMaterialAdvantage={setMaterialAdvantage}
    drag={drag2}
    setDrag={setDrag}
    bestMoveSan={move2?.bestMoveSan}
  />
                <div style={{ width: boardSize }} className="flex flex-row justify-between">
                    <Name materialAdvantage={materialAdvantage} captured={captured[white ? "white" : "black"]} white={white}>{`${players[white ? 0 : 1].name} ${players[white ? 0 : 1].elo !== "NOELO" ? `(${players[white ? 0 : 1].elo})` : ""}`}</Name>
                    <Clock white={white} colorMoving={game[moveNumber]?.color}>{formatTime(time)}</Clock>
                </div>
            </div>
        </div>
        <div className="bg-backgroundBox flex-row justify-center rounded-borderRoundness vertical:hidden w-full navTop:flex hidden">
            <div className="max-w-[500px] w-full flex flex-row justify-center">
                <GameButtons />
            </div>
        </div>
    </div>;
}
export {
  Game as default,
  getMoves
};
