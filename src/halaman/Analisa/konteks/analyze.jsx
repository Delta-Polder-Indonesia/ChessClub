/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useState, useRef, useEffect, useMemo } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { bacaAngka } from "../penyimpanan.js";
import { AnalyzeContext, TAMPILAN_ANALISA, normalisasiPemain } from "./analyzeKonteks.js";

function AnalyzeContextProvider(props) {
  const [data, setData] = useState({ format: "fen", string: "" });
  const [pageState, setPageState] = useState("default");
  const [game, setGame] = useState([]);
  const { t } = useI18n();
  const [players, setPlayers] = useState(() => [
    { name: t("analisa.pemain.putih"), elo: "?" },
    { name: t("analisa.pemain.hitam"), elo: "?" },
  ]);
  const playersAman = useMemo(
    () => normalisasiPemain(players, [t("analisa.pemain.putih"), t("analisa.pemain.hitam")]),
    [players, t]
  );
  const [moveNumber, setMoveNumber] = useState(0);
  const [forward, setForward] = useState(true);
  const [animation, setAnimation] = useState(true);
  const [white, setWhite] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [materialAdvantage, setMaterialAdvantage] = useState(0);
  const [result2, setResult] = useState("");
  const [progress, setProgress] = useState(0);
  /* Posisi lengkap dari PGN; eval tiap posisi diisi selama analisis berjalan. */
  const [langkahSementara, setLangkahSementara] = useState([]);
  const [tab, setTab] = useState("analyze");
  // Malas (per-mount), BUKAN lajang modul: `abortControllerInstance` dipakai
  // bersama semua mount provider (termasuk StrictMode ganda + uji) sehingga
  // membatalkan di satu tempat mematikan controller tempat lain.
  const [analyzeController, setAnalyzeController] = useState(() => new AbortController());
  const [customLine, setCustomLine] = useState({ moveNumber: -1, moves: [], arrows: {} });
  const [returnedToNormalGame, setReturnedToNormalGame] = useState(null);
  const [analyzingMove, setAnalyzingMove] = useState(false);
  /*
   * Kedalaman tersimpan. Kuncinya HARUS "kci-analisa-kedalaman" — sama
   * dengan yang ditulis form.jsx dan panel pengaturan. Sebelumnya di sini
   * dibaca kunci "kci-analisa-depth" yang tidak pernah ditulis siapa pun,
   * jadi pilihan pengguna selalu kembali ke 13 setiap kali halaman dibuka.
   */
  const [akun, setAkun] = useState({ platform: "chessCom", username: "" });
  const [tampilan, setTampilan] = useState(TAMPILAN_ANALISA.BERMAIN);
  const [depth, setDepth] = useState(() => {
    const tersimpan = bacaAngka("kedalaman", 13);
    return tersimpan >= 1 ? tersimpan : 13;
  });
  const moveNumberRef = useRef(moveNumber);
  const customLineRef = useRef(customLine);
  const gameLengthRef = useRef(game.length);
  useEffect(() => {
    customLineRef.current = customLine;
  }, [customLine]);
  useEffect(() => {
    moveNumberRef.current = moveNumber;
  }, [moveNumber]);
  useEffect(() => {
    gameLengthRef.current = game.length;
  }, [game.length]);
  /*
   * Stabil antar-render: isinya hanya membaca ref + setter (keduanya stabil),
   * jadi tidak perlu dibuat ulang — dan karena `gameController` masuk ke
   * nilai konteks, kestabilan ini mencegah seluruh konsumen konteks
   * me-render ulang setiap kali provider me-render.
   */
  const gameController = useMemo(() => ({
    back: () => {
      if (customLineRef.current.moveNumber > 0) {
        setForward(false);
        setAnimation(true);
        setReturnedToNormalGame(null);
        setCustomLine((prev) => ({ ...prev, moveNumber: prev.moveNumber - 1 }));
      } else if (customLineRef.current.moveNumber === 0) {
        setForward(false);
        setAnimation(true);
        setReturnedToNormalGame(customLineRef.current.moves[0].movement ?? null);
        setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
      } else if (moveNumberRef.current > 0) {
        setForward(false);
        setAnimation(true);
        setReturnedToNormalGame(null);
        setMoveNumber((prev) => prev - 1);
      }
    },
    forward: () => {
      setReturnedToNormalGame(null);
      if (customLineRef.current.moveNumber >= 0) {
        if (customLineRef.current.moveNumber < customLineRef.current.moves.length - 1) {
          setForward(true);
          setAnimation(true);
          setCustomLine((prev) => ({ ...prev, moveNumber: prev.moveNumber + 1 }));
        }
        return;
      } else if (moveNumberRef.current < gameLengthRef.current - 1) {
        setForward(true);
        setAnimation(true);
        setMoveNumber((prev) => prev + 1);
      }
    },
    first: () => {
      if (customLineRef.current.moveNumber >= 0) {
        setAnimation(false);
        setReturnedToNormalGame(customLineRef.current.moves[0].movement ?? null);
        setCustomLine({ moveNumber: -1, moves: [], arrows: {} });
      } else {
        setAnimation(false);
        setReturnedToNormalGame(null);
        setMoveNumber(0);
      }
    },
    last: () => {
      setReturnedToNormalGame(null);
      if (customLineRef.current.moveNumber >= 0) {
        setAnimation(false);
        setCustomLine((prev) => ({ ...prev, moveNumber: prev.moves.length - 1 }));
      } else {
        setAnimation(false);
        setMoveNumber(gameLengthRef.current - 1);
      }
    },
    togglePlay: () => {
      setPlaying((prev) => !prev);
    },
    play: () => {
      setPlaying(true);
    },
    pause: () => {
      setPlaying(false);
    }
  }), []);
  /*
   * Nilai konteks di-memo: objek literal di sini dibuat ulang tiap render
   * dan identitas baru = SEMUA konsumen me-render ulang (papan, menu,
   * grafik, …) walau state yang mereka pakai tidak berubah. Dependensinya
   * adalah seluruh NILAI state (setter stabil, tak perlu disebut) —
   * menambah state baru ke provider WAJIB menambahkannya di sini.
   */
  const nilaiKonteks = useMemo(() => ({ data: [data, setData], pageState: [pageState, setPageState], game: [game, setGame], players: [playersAman, setPlayers], moveNumber: [moveNumber, setMoveNumber], forward: [forward, setForward], white: [white, setWhite], animation: [animation, setAnimation], playing: [playing, setPlaying], time: [time, setTime], materialAdvantage: [materialAdvantage, setMaterialAdvantage], result: [result2, setResult], progress: [progress, setProgress], langkahSementara: [langkahSementara, setLangkahSementara], tab: [tab, setTab], analyzeController: [analyzeController, setAnalyzeController], customLine: [customLine, setCustomLine], returnedToNormalGame: [returnedToNormalGame, setReturnedToNormalGame], analyzingMove: [analyzingMove, setAnalyzingMove], akun: [akun, setAkun], depth: [depth, setDepth], tampilan: [tampilan, setTampilan], gameController }), [data, pageState, game, playersAman, moveNumber, forward, white, animation, playing, time, materialAdvantage, result2, progress, langkahSementara, tab, analyzeController, customLine, returnedToNormalGame, analyzingMove, akun, depth, tampilan, gameController]);
  return <AnalyzeContext.Provider value={nilaiKonteks}>
            {props.children}
        </AnalyzeContext.Provider>;
}
export default AnalyzeContextProvider;
