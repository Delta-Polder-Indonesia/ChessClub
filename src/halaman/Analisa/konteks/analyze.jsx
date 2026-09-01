/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { createContext, useState, useRef, useEffect } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { bacaAngka } from "../penyimpanan.js";
const abortControllerInstance = new AbortController();
const AnalyzeContext = createContext({
  data: [{ format: "fen", string: "" }, () => {
  }],
  pageState: ["analyze", () => {
  }],
  game: [[], () => {
  }],
  players: [[], () => {
  }],
  moveNumber: [0, () => {
  }],
  forward: [true, () => {
  }],
  animation: [false, () => {
  }],
  white: [true, () => {
  }],
  playing: [false, () => {
  }],
  time: [0, () => {
  }],
  materialAdvantage: [0, () => {
  }],
  result: ["", () => {
  }],
  progress: [0, () => {
  }],
  tab: ["analyze", () => {
  }],
  analyzeController: [abortControllerInstance, () => {
  }],
  customLine: [{ moveNumber: -1, moves: [], arrows: {} }, () => {
  }],
  returnedToNormalGame: [null, () => {
  }],
  analyzingMove: [false, () => {
  }],
  depth: [13, () => {
  }],
  gameController: { back: () => {
  }, forward: () => {
  }, last: () => {
  }, first: () => {
  }, play: () => {
  }, pause: () => {
  }, togglePlay: () => {
  } }
});
function AnalyzeContextProvider(props) {
  const [data, setData] = useState({ format: "fen", string: "" });
  const [pageState, setPageState] = useState("default");
  const [game, setGame] = useState([]);
  const { t } = useI18n();
  const [players, setPlayers] = useState(() => [
    { name: t("analisa.pemain.putih"), elo: "?" },
    { name: t("analisa.pemain.hitam"), elo: "?" },
  ]);
  const [moveNumber, setMoveNumber] = useState(0);
  const [forward, setForward] = useState(true);
  const [animation, setAnimation] = useState(true);
  const [white, setWhite] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [materialAdvantage, setMaterialAdvantage] = useState(0);
  const [result2, setResult] = useState("");
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("analyze");
  const [analyzeController, setAnalyzeController] = useState(abortControllerInstance);
  const [customLine, setCustomLine] = useState({ moveNumber: -1, moves: [], arrows: {} });
  const [returnedToNormalGame, setReturnedToNormalGame] = useState(null);
  const [analyzingMove, setAnalyzingMove] = useState(false);
  /*
   * Kedalaman tersimpan. Kuncinya HARUS "kci-analisa-kedalaman" — sama
   * dengan yang ditulis form.jsx dan panel pengaturan. Sebelumnya di sini
   * dibaca kunci "kci-analisa-depth" yang tidak pernah ditulis siapa pun,
   * jadi pilihan pengguna selalu kembali ke 13 setiap kali halaman dibuka.
   */
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
  const gameController = {
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
  };
  return <AnalyzeContext.Provider value={{ data: [data, setData], pageState: [pageState, setPageState], game: [game, setGame], players: [players, setPlayers], moveNumber: [moveNumber, setMoveNumber], forward: [forward, setForward], white: [white, setWhite], animation: [animation, setAnimation], playing: [playing, setPlaying], time: [time, setTime], materialAdvantage: [materialAdvantage, setMaterialAdvantage], result: [result2, setResult], progress: [progress, setProgress], tab: [tab, setTab], analyzeController: [analyzeController, setAnalyzeController], customLine: [customLine, setCustomLine], returnedToNormalGame: [returnedToNormalGame, setReturnedToNormalGame], analyzingMove: [analyzingMove, setAnalyzingMove], depth: [depth, setDepth], gameController }}>
            {props.children}
        </AnalyzeContext.Provider>;
}
export {
  AnalyzeContext,
  AnalyzeContextProvider as default
};
