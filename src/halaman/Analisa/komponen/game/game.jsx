/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useCallback, useEffect, useLayoutEffect, useState, useRef, useContext } from "react";
import Board from "./board.jsx";
import { gameStartSound } from "./gameStartSound.js";
import Clock from "./clock.jsx";
import Name from "./name.jsx";
import Evaluation from "./evaluation.jsx";
import { AnalyzeContext, TAMPILAN_ANALISA } from "../../konteks/analyzeKonteks.js";
import { bacaPartaiPGN, formatSquare, getCastle, invertColor, parseMove, parsePGN, parsePosition } from "../../mesin/engine.js";
import { cariNamaPembukaan } from "../../mesin/buku.js";
import { STATUS_EVALUASI, ratingTampilan } from "../../mesin/evaluasi.js";
import { Chess, WHITE } from "chess.js";
import { pushPageWarning, pushPageError } from "../errors/pushPageError.js";
import { useMesin } from "../../konteks/mesinKonteks.js";
import { useI18n } from "../../../../lib/i18n.jsx";
import { useKartuPemain } from "../../../../lib/pemainCatur.js";
import { ErrorsContext } from "../../konteks/errorsKonteks.js";
import { maxVertical, navTop } from "../../konstanta.js";
import { ConfigContext } from "../../konteks/configKonteks.js";
import GameButtons from "../menu/analysis/gameButtons.jsx";
import { getMoves, getArrows, getCustomResult, formatPlayerLabel } from "./getMoves.js";

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
  const setLangkahSementara = analyzeContext.langkahSementara[1];
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
  const analyzingMoveRef = useRef(analyzingMove);
  const pageStateRef = useRef(pageState);
  const tampilanRef = useRef(tampilan);
  // Nomor urut muatan partai: muatan yang lebih lama dibatalkan oleh yang
  // lebih baru sehingga hasilnya tidak saling menimpa (`related key` ada di
  // useEffect [data]).
  const muatSeqRef = useRef(0);
  /*
   * Cermin controller untuk alur async: `analyzeController` (state) hanya
   * segar saat render, sedangkan `handlePGN`/`analyzeMove` hidup melintasi
   * banyak render — membaca state dari closure basi berarti membatalkan
   * controller yang SALAH. Ref ini disinkronkan tiap render (mencakup
   * penulis luar seperti ganti engine di pengaturan) dan dibaca semua alur
   * async; penulis di berkas ini selalu memperbarui keduanya berbarengan.
   */
  const controllerRef = useRef(analyzeController);
  controllerRef.current = analyzeController;
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
  useEffect(() => {
    tampilanRef.current = tampilan;
  }, [tampilan]);
  // Label "langkah buku": tabel nama pembukaan milik situs ini sendiri
  // (dibangun oleh scripts/generasi-buku-analisa.mjs). Bentuknya fungsi
  // pencarian (fen) => nama, bukan peta mentah, agar penghitung langkah di
  // FEN bisa diabaikan — tabel upstream tidak pernah cocok karena itu.
  useEffect(() => {
    /*
     * Tabel bukunya ±160 KiB — jangan diunduh di jalur kritis pemuatan
     * halaman (Lighthouse mencatatnya sebagai item payload terbesar).
     * Ditunda ke waktu senggang peramban; belum ada partai yang butuh nama
     * pembukaan pada detik-detik pertama, dan `cariNamaPembukaan` men-cache
     * janjinya jadi jalur lain (muat partai/impor) tetap berbagi unduhan.
     */
    let hidup = true;
    const muat = () =>
      cariNamaPembukaan().then((pencari) => {
        if (hidup) setOpenings(() => pencari);
      });
    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(muat, { timeout: 5000 });
      return () => {
        hidup = false;
        window.cancelIdleCallback?.(id);
      };
    }
    const id = setTimeout(muat, 1500);
    return () => {
      hidup = false;
      clearTimeout(id);
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
  function createArrowsObject(length) {
    const newArrows = {};
    Array.from({ length }).forEach((_, i) => {
      newArrows[i] = [];
    });
    return newArrows;
  }
  const cleanArrows = useCallback(() => {
    setArrows({ 0: [] });
  }, []);
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
  const handlePGN = useCallback(async (pgn, depth2, terkini, signal) => {
    setPageState("loading");
    setTab("summary");
    setProgress(0);
    setLangkahSementara([]);
    if (!pgn?.trim()) {
      pushPageError(setErrors, t("analisa.galat.pgnJudul"), t("analisa.galat.pgnIsi"));
      setPageState("default");
      return;
    }

    // Tombol Batal juga bekerja saat engine/buku masih disiapkan, bukan cuma
    // saat pencarian UCI sudah berjalan. Muatan lama tidak boleh menutup yang baru.
    const batal = () => {
      if (!terkini()) return;
      setPageState("default");
      setProgress(0);
      setLangkahSementara([]);
    };
    signal.addEventListener("abort", batal, { once: true });
    try {
      const partai = bacaPartaiPGN(pgn);
      if (signal.aborted || !terkini()) return;
      // Berkas multi-partai: hanya partai pertama yang dianalisis — katakan,
      // jangan diam (pengguna menempel 100 partai lalu heran sisanya hilang).
      if ((partai.jumlahPartai ?? 1) > 1) {
        pushPageWarning(setErrors, t("analisa.multiPartai.judul"), t("analisa.multiPartai.isi", { n: partai.jumlahPartai }));
      }
      setLangkahSementara(partai.kerangka);

      // Buku pembukaan diunduh bersamaan dengan penyiapan engine.
      const janjiBuku = openings2
        ? Promise.resolve(openings2)
        : cariNamaPembukaan().catch(() => ({}));
      const mesin = await siapkan().catch(() => {
        throw new Error(signal.aborted ? "canceled" : "mesin");
      });
      if (signal.aborted || !terkini()) return;
      const buku = await janjiBuku;
      if (signal.aborted || !terkini()) return;

      // Posisi belum dinilai tetap berada pada garis tengah. Sumbu X berasal
      // dari seluruh partai dan tidak berubah setiap kali onLangkah terpanggil.
      const laporkanLangkah = (dinilai) => {
        if (!terkini() || signal.aborted) return;
        setLangkahSementara(partai.kerangka.map((posisi, i) => dinilai[i] ?? posisi));
      };
      const laporkanProgres = (nilai) => {
        if (terkini() && !signal.aborted) setProgress(nilai);
      };
      const { metadata, moves } = await parsePGN(mesin, pgn, depth2, buku, laporkanProgres, signal, {
        partai, onLangkah: laporkanLangkah,
      });
      if (!terkini() || signal.aborted) return;
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
      if (!terkini()) return;
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
    } finally {
      signal.removeEventListener("abort", batal);
      if (terkini()) {
        setProgress(0);
        setLangkahSementara([]);
        setMoveNumber(0);
      }
    }
  }, [t, openings2, siapkan, boardSounds, setErrors, setAnalyzeController, setPageState, setTab, setProgress, setLangkahSementara, setTime, setPlayers, setGame, setResult, setAnimation, setArrows, setCustomLine, setAnalyzingMove, setMoveNumber]);
  const handleFEN = useCallback(async (fen, terkini, sinyal) => {
    let move3;
    try {
      move3 = await new Promise((resolve, reject) => {
        (async () => {
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
              previousStaticEvals: [["cp", "-30"]],
              clock: { white: null, black: null },
            };
            setGame([move5]);
            setPageState("default");
            return null;
          }
          const mesin = await siapkan().catch(() => null);
          if (!mesin) {
            pushPageError(setErrors, t("analisa.galat.engineJudul"), t("analisa.galat.engineIsi"));
            return null;
          }
          let chess;
          try {
            chess = new Chess(fen);
          } catch {
            throw new Error("fen");
          }
          const signal = sinyal;
          function handleAbort() {
            reject(new Error("canceled"));
            signal.removeEventListener("abort", handleAbort);
          }
          return parsePosition(mesin, chess, depth, signal, handleAbort);
        })().then(resolve, reject);
      });
    } catch (e) {
      // Muatan lama yang dibatalkan tidak boleh menimpa muatan baru.
      if (!terkini()) return;
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
      if (terkini()) setPageState("default");
      return;
    }
    if (!terkini()) return;
    setGame([{ ...move3, clock: { white: null, black: null } }]);
    setPageState("analyzeCustom");
  }, [t, depth, siapkan, cleanArrows, setErrors, setAnalyzeController, setPageState, setTime, setPlayers, setWhite, setPlaying, setMoveNumber, setResult, setProgress, setCustomLine, setAnalyzingMove, setGame]);
  useEffect(() => {
    const { format, string } = data;
    /*
     * Muatan baru membatalkan analisis yang masih berjalan — dua parsePGN
     * sekaligus memakai signal yang sama saling menimpa hasil. Muatan baru
     * memakai controller/signal miliknya sendiri; `terkini` mencegah muatan
     * lama yang dibatalkan ikut menyetor state (langkah, progres, halaman).
     */
    muatSeqRef.current += 1;
    const nomor = muatSeqRef.current;
    const terkini = () => muatSeqRef.current === nomor;
    // Muatan baru = kanvas bersih: galat/peringatan muatan lama (termasuk
    // "multi-partai") tidak boleh menghantui muatan ini.
    setErrors([]);
    controllerRef.current.abort();
    const baru = new AbortController();
    controllerRef.current = baru;
    setAnalyzeController(baru);
    switch (format) {
      case "pgn":
        handlePGN(string, depth, terkini, baru.signal);
        break;
      case "fen":
        handleFEN(string, terkini, baru.signal);
        break;
    }
  }, [data, depth, handleFEN, handlePGN, setAnalyzeController, setErrors]);
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
  function sliceCustomArrows(arrows2, moveNumber2) {
    const newArrows = {};
    for (let i = 0; i <= moveNumber2; i++) {
      if (!arrows2[i]) newArrows[i] = [];
      else newArrows[i] = arrows2[i];
    }
    return newArrows;
  }
  /*
   * `previousKandidat` ditambahkan paling belakang supaya pemanggil lama
   * (uji dan jalur lain) tetap sah: tanpanya label "kritis" tidak muncul,
   * perilaku lainnya identik.
   */
  async function analyzeMove(previousFen, movement, previousSacrifice, previousStaticEvals, animation2, previousBestMoveSan, previousKandidat) {
    // Baca-SAJA: dipakai untuk mendeteksi muatan baru yang dimulai selama
    // analisis berjalan — TIDAK PERNAH ditambah. Menambahkannya di sini akan
    // membuang muatan yang sedang berjalan dan memacetkannya pada "memuat".
    const nomorMuat = muatSeqRef.current;
    const chess = new Chess(previousFen);
    const unanalyzedMoveObj = chess.move(movement);
    const unanalyzedMove = {
      fen: unanalyzedMoveObj.after,
      movement: [formatSquare(movement.from), formatSquare(movement.to)],
      color: invertColor(unanalyzedMoveObj.color),
      capture: unanalyzedMoveObj.captured,
      castle: getCastle(unanalyzedMoveObj.san),
      san: unanalyzedMoveObj.san,
      clock: move2?.clock ?? { white: time || null, black: time || null },
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
    let dibatalkan = false;
    try {
      // Controller yang sudah dibatalkan (tombol Batal / ganti engine) tidak
      // bisa dipakai lagi: signal aborted memacetkan setiap analisis berikutnya
      // secara diam-diam. Ganti dengan yang baru sebelum melanjutkan — TAPI
      // hanya bila yang terpasang MASIH controller mati itu (blok sinkron,
      // tak ada render yang bisa menyela): muatan baru yang memasang
      // controller segar saat langkah ini menunggu tidak boleh ditimpa.
      if (controllerRef.current.signal.aborted) {
        const baru = new AbortController();
        controllerRef.current = baru;
        setAnalyzeController(baru);
      }
      const signal = controllerRef.current.signal;
      // Lihat catatan balapan buku di handlePGN: langkah manual pun menunggu
      // tabel buku yang sama (berselang dengan penyiapan engine) sebelum dinilai.
      const janjiBuku = openings2
        ? Promise.resolve(openings2)
        : cariNamaPembukaan().catch(() => ({}));
      const mesin = ambilMesin() ?? (await siapkan().catch(() => null));
      const buku = await janjiBuku;
      // Muatan baru dimulai saat menunggu → hasil analisis ini pasti basi;
      // berhenti di sini (`finally` tetap melepas kunci papan).
      if (muatSeqRef.current !== nomorMuat) return;
      // Dibatalkan saat MENUNGGU engine/buku (tombol Batal / ganti engine
      // mendarat di sela `await`): ini pembatalan, bukan kegagalan — capnya
      // "dibatalkan" dan tidak ada kabar galat. (`signal` diambil sebelum
      // `await`, jadi nilainya di sini adalah status saat menunggu.)
      if (signal.aborted) {
        dibatalkan = true;
      } else if (mesin) {
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
          buku,
          () => {
            throw new Error("canceled");
          },
          signal,
          undefined,
          previousKandidat ?? []
        );
      }
    } catch (e) {
      // Batal (tombol Batal / ganti engine) bukan galat yang perlu
      // ditampilkan; sisanya dilaporkan supaya tidak hilang diam-diam.
      const kunci = e?.kunci ?? e?.message;
      const batal = kunci === "canceled" || kunci === "pencarian dibatalkan" || kunci === "permintaan digantikan";
      if (!batal) {
        pushPageError(setErrors, t("analisa.galat.analisisJudul"), String(e?.message ?? e));
      } else {
        dibatalkan = true;
        // Signal ini sudah mati; ganti dengan yang baru supaya langkah
        // berikutnya tetap bisa dinilai, bukan langsung "canceled" — TAPI
        // hanya bila yang terpasang masih yang mati: menimpa controller
        // muatan baru membuat tombol Batal lumpuh untuk muatan itu.
        if (controllerRef.current.signal.aborted) {
          const baru = new AbortController();
          controllerRef.current = baru;
          setAnalyzeController(baru);
        }
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
    /*
     * Tulis hasil HANYA bila tak ada muatan baru yang dimulai selama analisis
     * berjalan — customLine milik muatan baru tidak boleh ditimpa hasil basi
     * (balapan seret-langkah vs muat partai).
     */
    if (muatSeqRef.current !== nomorMuat) return;
    if (!move3) {
      // Analisis gagal/dibatalkan: langkahnya tetap ada sebagai "belum
      // dinilai", dan placeholder-nya dicap supaya downstream (grafik,
      // ekspor) bisa membedakan batal vs gagal vs valid.
      const cap = dibatalkan ? STATUS_EVALUASI.DIBATALKAN : STATUS_EVALUASI.GAGAL;
      setCustomLine((prev) => {
        const daftar = prev.moves.slice();
        const sasaran = daftar[prev.moveNumber];
        if (sasaran && !sasaran.previousStaticEvals && !sasaran.statusEvaluasi) {
          daftar[prev.moveNumber] = { ...sasaran, statusEvaluasi: cap };
        }
        return { ...prev, moves: daftar };
      });
      return;
    }
    setCustomLine((prev) => ({ ...prev, moveNumber: prev.moveNumber, moves: [...prev.moves.slice(0, prev.moveNumber), { ...move3, clock: unanalyzedMove.clock }] }));
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
            <div ref={componentRef} style={{ gap }} className="h-full flex flex-col justify-start">
                <div style={{ width: boardSize }} className="flex flex-row justify-between">
                    <Name materialAdvantage={materialAdvantage} captured={captured[white ? "black" : "white"]} white={!white} avatar={avatarPemain[white ? 1 : 0]} title={titlePemain[white ? 1 : 0]} flag={flagPemain[white ? 1 : 0]}>{playerLabels[white ? 1 : 0]}</Name>
                    <Clock white={!white} colorMoving={move2?.color ?? game[moveNumber]?.color}>{formatTime(white ? currentBlackTime : currentWhiteTime)}</Clock>
                </div>
                <Board
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
    kandidat={move2?.kandidat}
    analyzingMove={analyzingMove}
    setMaterialAdvantage={setMaterialAdvantage}
    drag={drag2}
    setDrag={setDrag}
    bestMoveSan={move2?.bestMoveSan}
  />
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
