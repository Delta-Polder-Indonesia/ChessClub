/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useLayoutEffect, useState, useRef, useContext } from "react";
import Board from "./board.jsx";
import Clock from "./clock.jsx";
import Name from "./name.jsx";
import Evaluation from "./evaluation.jsx";
import { AnalyzeContext, TAMPILAN_ANALISA } from "../../konteks/analyzeKonteks.js";
import { ratingTampilan } from "../../mesin/evaluasi.js";
import { WHITE } from "chess.js";
import { pushPageWarning } from "../errors/pushPageError.js";
import { useMesin } from "../../konteks/mesinKonteks.js";
import { useI18n } from "../../../../lib/i18n.jsx";
import { useKartuPemain } from "../../../../lib/pemainCatur.js";
import { ErrorsContext } from "../../konteks/errorsKonteks.js";
import { maxVertical, navTop } from "../../konstanta.js";
import { ConfigContext } from "../../konteks/configKonteks.js";
import GameButtons from "../menu/analysis/gameButtons.jsx";
import { getMoves, getArrows, getCustomResult, formatPlayerLabel } from "./getMoves.js";
import { useMuatPartai } from "./useMuatPartai.js";
import { useAnalisisPapan } from "./useAnalisisPapan.js";

function Game({ wadah }) {
  const [boardSize, setBoardSize] = useState(750);
  const [gameHeight, setGameHeight] = useState(850);
  const [captured, setCaptured] = useState({ white: [], black: [] });
  const [arrows, setArrows] = useState({ 0: [] });
  const [gap, setGap] = useState(10);
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
  const [langkahSementara, setLangkahSementara] = analyzeContext.langkahSementara;
  const [tab, setTab] = analyzeContext.tab;
  const [analyzeController, setAnalyzeController] = analyzeContext.analyzeController;
  const [customLine, setCustomLine] = analyzeContext.customLine;
  const [returnedToNormalGame] = analyzeContext.returnedToNormalGame;
  const [analyzingMove, setAnalyzingMove] = analyzeContext.analyzingMove;
  const [depth] = analyzeContext.depth;
  const [tampilan] = analyzeContext.tampilan;
  const setMaterialAdvantage = analyzeContext.materialAdvantage[1];
  const gameController = analyzeContext.gameController;
  const setErrors = errorsContext.errors[1];
  const [boardSounds] = configContext.boardSounds;
  const componentRef = useRef(null);
  const gameRef = useRef(null);
  const { t } = useI18n();
  const { didukung, siapkan, ambilMesin } = useMesin();
  const intervalRef = useRef();
  const tabRef = useRef(tab);
  const dragRef = useRef(drag2);
  const pageStateRef = useRef(pageState);
  const tampilanRef = useRef(tampilan);
  const { previousMove, move: move2, nextMove } = getMoves(game, moveNumber, customLine, returnedToNormalGame);
  const shownResult = customLine.moveNumber < 0 ? result2 : getCustomResult(move2);
  /*
   * Dua alur besar dipisah ke hook (Fase 3): memuat partai (`useMuatPartai`)
   * dan menilai langkah manual (`useAnalisisPapan`). Keduanya berbagi ref
   * yang sama — `controllerRef`, `muatSeqRef`, `openingsRef` — supaya
   * pembatalan, urutan muatan, dan tabel pembukaan tetap punya satu sumber
   * kebenaran seperti saat masih satu berkas.
   */
  const muatPartai = useMuatPartai({
    data,
    depth,
    analyzeController,
    boardSounds,
    siapkan,
    t,
    setErrors,
    setAnalyzeController,
    setPageState,
    setTab,
    setProgress,
    setLangkahSementara,
    setTime,
    setPlayers,
    setGame,
    setResult,
    setAnimation,
    setArrows,
    setCustomLine,
    setAnalyzingMove,
    setMoveNumber,
    setWhite,
    setPlaying,
  });
  const { analyzeMove, analyzingMoveRef } = useAnalisisPapan({
    controllerRef: muatPartai.controllerRef,
    muatSeqRef: muatPartai.muatSeqRef,
    openingsRef: muatPartai.openingsRef,
    data,
    depth,
    time,
    move2,
    siapkan,
    ambilMesin,
    t,
    setErrors,
    setAnalyzeController,
    setPageState,
    setAnimation,
    setForward,
    setCustomLine,
    setAnalyzingMove,
    analyzingMove,
  });
  useEffect(() => {
    dragRef.current = drag2;
  }, [drag2]);
  useEffect(() => {
    pageStateRef.current = pageState;
  }, [pageState]);
  useEffect(() => {
    tampilanRef.current = tampilan;
  }, [tampilan]);
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
  }, [moveNumber, customLine.moveNumber, setAnimation]);
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
  }, [playing, gameController]);
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
      /*
       * Pintasan pemutar partai hanya berlaku saat papan yang tampil.
       * Papan tidak pernah dilepas saat layar berganti (lihat areaKerja.jsx)
       * — jadi tanpa penjaga ini, mengetik di layar Basis Data atau menekan
       * panah untuk menggulir tabel partai akan menggerakkan papan di
       * baliknya. `tampilanRef`, bukan `tampilan`: efek ini dipasang
       * sekali, sehingga pembacaan langsung akan selamanya berisi nilai
       * render pertama.
       */
      if (tampilanRef.current !== TAMPILAN_ANALISA.BERMAIN) return;
      // Kalau belum ada partai termuat, biarkan peramban menggulirkan
      // halaman seperti biasa.
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
        case "Tab": {
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
    }
    document.addEventListener("keydown", handleKeyDown);
    // Dulu dilepas dari `window` padahal dipasang di `document`, sehingga
    // pendengar menumpuk setiap kali halaman dibuka ulang dan tombol panah
    // memicu beberapa langkah sekaligus.
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once: listener keyboard global hanya dipasang sekali; ref dipakai agar nilai selalu segar
  }, []);
  /**
   * Ukuran papan = sisi terkecil wadah halaman, dikurangi lajur bilah
   * evaluasi, menu papan, dan panel kanan bila panel masih sejajar.
   *
   * upstream mengukur `window.innerHeight` dikurangi tinggi <nav> mereka;
   * di proyek ini halaman berada di bawah header situs dan di dalam
   * kontainer ber-padding, jadi yang diukur elemen wadah itu sendiri
   * (`wadah` dari Analisa.jsx) agar papan tidak pernah meluap ke bawah lipatan.
   */
  /*
   * PENGUKURAN UKURAN PAPAN — sengaja useLayoutEffect, bukan useEffect:
   * koreksi `boardSize` (tebakan awal 750) terjadi setelah DOM terpasang
   * tetapi SEBELUM paint pertama, jadi papan tidak pernah tampil sekejap
   * dengan ukuran salah lalu menyusut/membesar. Inilah sumber CLS 0,949
   * (mobile) / 0,358 (desktop) pada audit Lighthouse — penyebab tunggal
   * terbesar skor Performance halaman ini.
   */
  useLayoutEffect(() => {
    function updateBoardSize() {
      const el = wadah?.current;
      const lebar = el?.clientWidth ?? window.innerWidth;
      const tinggi = el?.clientHeight ?? window.innerHeight;

      const newGap = window.innerWidth < maxVertical ? 6 : 10;
      setGap(newGap);

      const component = componentRef.current;
      const statusBar = component?.getElementsByTagName("div")[0];
      const statusBarHeight = statusBar?.offsetHeight ?? 0;
      const componentHeight = Math.min(tinggi, component?.offsetHeight ?? tinggi);
      const gapHeight = newGap;
      const evalWidth = 36;
      const menuWidth = 480;
      const boardMenuWidth = 17;
      const gapWidth = 8;
      const paddingWidth = 16;

      // CSS breakpoint `vertical`/`navTop` memakai lebar viewport, bukan
      // lebar <main> (yang sudah dikurangi bilah navigasi kiri).
      const isNavTop = window.innerWidth < navTop;
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

      if (window.innerWidth < maxVertical) {
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
  }, [moveNumber, customLine.moveNumber, customLine.moves, game]);
  function roundBoardSize(boardSize2) {
    // Papan boleh melebar sampai batas ini (kelipatan 8) supaya tetap rapi.
    return Math.min(1000, Math.round(boardSize2 / 8) * 8);
  }
  function formatTime(seconds) {
    const noTime = "--:--";
    if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) return noTime;
    const sec = Math.max(0, Math.round(Number(seconds)));
    const toTwoDigits = (num) => String(num).padStart(2, "0");
    const totalMinutes = Math.floor(sec / 60);
    const restSeconds = sec % 60;

    if (totalMinutes >= 60) {
      const hours = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        return t("analisa.waktu.hari", { n: days });
      }
      return `${hours}:${toTwoDigits(mins)}:${toTwoDigits(restSeconds)}`;
    }

    return `${toTwoDigits(totalMinutes)}:${toTwoDigits(restSeconds)}`;
  }
  const playerLabels = [
    formatPlayerLabel(players?.[0], t("analisa.pemain.putih")),
    formatPlayerLabel(players?.[1], t("analisa.pemain.hitam")),
  ];
  // Kartu profil (avatar, gelar, bendera) untuk kedua pemain — diambil dari
  // API publik chess.com (lihat lib/pemainCatur.js). Fallback: ikon profil.
  // Hanya aktif saat partai benar-benar dimuat (menghemat request ke API).
  /*
   * Papan tidak lagi menjadi kotak kosong selama partai dianalisis. Teks PGN
   * diurai LEBIH DULU (`bacaPartaiPGN` → `langkahSementara`), jadi posisi awal
   * partai sudah diketahui walau engine belum selesai menilai langkahnya.
   * Yang digambar adalah posisi itu — bukan selalu posisi awal standar, supaya
   * partai yang mulai dari FEN khusus (soal, varian) tidak sempat menampilkan
   * papan yang salah.
   */
  const memuatPartaiPapan = pageState === "loading";
  const posisiPratinjau = memuatPartaiPapan ? langkahSementara?.[0]?.fen ?? null : null;
  const partaiDimuat = pageState === "analyze" || pageState === "analyzeCustom";
  const kartu0 = useKartuPemain(players?.[0]?.name, partaiDimuat);
  const kartu1 = useKartuPemain(players?.[1]?.name, partaiDimuat);
  const avatarPemain = [kartu0?.avatar, kartu1?.avatar];
  const titlePemain = [kartu0?.title, kartu1?.title];
  const flagPemain = [kartu0?.flag, kartu1?.flag];
  const currentWhiteTime = move2?.clock?.white !== undefined ? move2.clock.white : (time || null);
  const currentBlackTime = move2?.clock?.black !== undefined ? move2.clock.black : (time || null);

  return <div className="flex flex-col gap-[6px]">
        <div ref={gameRef} tabIndex={0} style={{ gap }} className="h-full flex navTop:flex-row flex-col outline-none">
            <div style={{ [isNavTop ? "width" : "height"]: gameHeight }} className="flex navTop:flex-row flex-col items-center">
                <Evaluation size={boardSize} navTop={isNavTop} white={white} advantage={analyzingMove ? previousMove?.previousStaticEvals?.[0] ?? ["cp", "0"] : move2?.previousStaticEvals?.[0] ?? ["cp", "0"]} whiteMoving={(analyzingMove ? previousMove?.color ?? WHITE : move2?.color ?? WHITE) === WHITE} />
            </div>
            <div ref={componentRef} data-papan-fen={memuatPartaiPapan ? posisiPratinjau ?? undefined : undefined} style={{ gap }} className="h-full flex flex-col justify-start">
                <div style={{ width: boardSize }} className="flex flex-row justify-between">
                    <Name materialAdvantage={materialAdvantage} captured={captured[white ? "black" : "white"]} white={!white} avatar={avatarPemain[white ? 1 : 0]} title={titlePemain[white ? 1 : 0]} flag={flagPemain[white ? 1 : 0]}>{playerLabels[white ? 1 : 0]}</Name>
                    <Clock white={!white} colorMoving={move2?.color ?? game[moveNumber]?.color}>{formatTime(white ? currentBlackTime : currentWhiteTime)}</Clock>
                </div>
                {memuatPartaiPapan && !posisiPratinjau ? (
                  /*
                   * Kerangka papan hanya untuk sela sebelum PGN selesai diurai
                   * (biasanya satu tarikan napas). Begitu posisi awal partai
                   * diketahui, papan sungguhan yang tampil — lihat
                   * `posisiPratinjau` di atas.
                   */
                  <div
                    data-kerangka-papan="1"
                    aria-hidden="true"
                    style={{ width: boardSize, height: boardSize }}
                    className="animate-pulse rounded-[3px] bg-backgroundBox ring-1 ring-black/10"
                  />
                ) : (
                <Board
    pratinjau={memuatPartaiPapan}
    setPlaying={setPlaying}
    cleanArrows={cleanCurrentArrows}
    arrows={getArrows(arrows, moveNumber, customLine)}
    sacrifice={move2?.sacrifice}
    forward={forward}
    // Langkah paksa memakai sorotan papan bawaan (netral) seperti warisan.
    moveRating={ratingTampilan(move2)}
    bestMove={move2?.bestMove}
    previousBestMove={previousMove?.bestMove}
    move={move2?.movement}
    nextMove={nextMove?.movement}
    fen={memuatPartaiPapan ? posisiPratinjau ?? undefined : move2?.fen}
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
    kandidat={move2?.kandidat}
    analyzingMove={analyzingMove}
    setMaterialAdvantage={setMaterialAdvantage}
    drag={drag2}
    setDrag={setDrag}
    bestMoveSan={move2?.bestMoveSan}
  />
                )}
                <div style={{ width: boardSize }} className="flex flex-row justify-between">
                    <Name materialAdvantage={materialAdvantage} captured={captured[white ? "white" : "black"]} white={white} avatar={avatarPemain[white ? 0 : 1]} title={titlePemain[white ? 0 : 1]} flag={flagPemain[white ? 0 : 1]}>{playerLabels[white ? 0 : 1]}</Name>
                    <Clock white={white} colorMoving={move2?.color ?? game[moveNumber]?.color}>{formatTime(white ? currentWhiteTime : currentBlackTime)}</Clock>
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
export default Game;
