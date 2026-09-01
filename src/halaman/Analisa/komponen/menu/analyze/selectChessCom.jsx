/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import Arrow from "../../svg/arrow.jsx";
import { AnalyzeContext } from "../../../konteks/analyze.jsx";
import { pushPageError } from "../../errors/pageErrors.jsx";
import { Chess } from "chess.js";
import Files from "../../svg/files.jsx";
import { ErrorsContext } from "../../../konteks/errors.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
/** Kunci pesan galat (lihat kamus analisa.partai.*) — dipakai juga oleh halaman Lichess. */
const GAMES_ERROR = ["analisa.partai.galatJaringan", "analisa.partai.galatJaringanIsi"];
const USER_ERROR = ["analisa.partai.galatPengguna", "analisa.partai.galatPenggunaIsi"];
const API_BLOCKING_ERROR = ["analisa.partai.galatBatas", "analisa.partai.galatBatasIsi"];
const PLATFORM = "Chess.com";
const PLAYER_URL = "https://www.chess.com/member/";
/** Nama bulan lewat Intl: mengikuti bahasa antarmuka, jadi tidak perlu tabel manual. */
function getMonthName(month, locale = "id") {
  return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, month - 1, 1));
}
function capitalizeFirst(string) {
  return string[0].toUpperCase() + string.substring(1).toLowerCase();
}
function Loading(props) {
  const { t } = useI18n();
  const [ellipsis, setEllipsis] = useState("");
  const ellipsisRef = useRef(ellipsis);
  useEffect(() => {
    ellipsisRef.current = ellipsis;
  }, [ellipsis]);
  useEffect(() => {
    function animateEllipsis() {
      const ellipsis2 = ellipsisRef.current;
      if (ellipsis2.length >= 3) {
        setEllipsis("");
      } else {
        setEllipsis(ellipsis2 + ".");
      }
    }
    const ellipsisInterval = setInterval(animateEllipsis, 300);
    return () => clearInterval(ellipsisInterval);
  }, []);
  return <div className="flex flex-col flex-grow">
                    <div className="flex-grow flex flex-col justify-center items-center">
                        <div className="w-[70%] bg-backgroundBox relative overflow-hidden rounded-borderExtraRoundness text-lg text-foregroundGrey flex flex-col gap-14 pb-4 pt-14 items-center">
                            <div className="w-40 flex flex-col items-center gap-4">
                                <Files className="animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] scale-x-[-1]" size={60} />
                                <span className="text-xl text-foreground font-bold">{props.whatIsLoading}</span>
                                <span className="w-full ml-14">{t("analisa.partai.mengambilApi")}{ellipsis}</span>
                            </div>
                            <button onClick={props.abort} className="hover:text-foreground transition-colors" type="button">{t("analisa.muat.batal")}</button>
                        </div>
                    </div>
                </div>;
}
function SimpleLoading(props) {
  const { t } = useI18n();
  const [ellipsis, setEllipsis] = useState("");
  const ellipsisRef = useRef(ellipsis);
  useEffect(() => {
    ellipsisRef.current = ellipsis;
  }, [ellipsis]);
  useEffect(() => {
    function animateEllipsis() {
      const ellipsis2 = ellipsisRef.current;
      if (ellipsis2.length >= 3) {
        setEllipsis("");
      } else {
        setEllipsis(ellipsis2 + ".");
      }
    }
    const ellipsisInterval = setInterval(animateEllipsis, 300);
    return () => clearInterval(ellipsisInterval);
  }, []);
  return <div className="font-extrabold text-2xl animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] w-48 my-4 m-auto">
            {t("analisa.partai.memuat")} {props.whatIsLoading}{ellipsis}
        </div>;
}
function GamesUI(props) {
  const { t, bahasa: locale } = useI18n();
  const { gamesInfo, loading, username, setData } = props;
  return <>
            {loading ? <SimpleLoading whatIsLoading={t("analisa.tab.pilihPartai")} /> : null}
            <div className="w-full overflow-auto max-h-[400px]">
                <table className="w-full">
                    <thead style={{ display: loading ? "none" : "" }}>
                        <tr>
                            <th className="py-2 text-left pl-8">{t("analisa.partai.pemain")}</th>
                            <th className="py-2 text-left pl-3 pr-4">{t("analisa.partai.hasil")}</th>
                            <th className="py-2 text-left pr-4 notFullDate:pr-8"><span className="notFullDate:block hidden">{t("analisa.partai.tanggal")}</span><span className="notFullDate:hidden block">{t("analisa.partai.hari")}</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {gamesInfo.map((gameInfo, i) => {
    const { pgn, whiteName, blackName, whiteElo, blackElo, result, timestamp, timeClass } = gameInfo;
    const whiteWon = result === "white";
    const blackWon = result === "black";
    const isWin = whiteWon && whiteName.toLowerCase() === username.toLowerCase() || blackWon && blackName.toLowerCase() === username.toLowerCase();
    const isLoss = whiteWon && whiteName.toLowerCase() !== username.toLowerCase() || blackWon && blackName.toLowerCase() !== username.toLowerCase();
    const date = new Date(timestamp);
    const kelasWaktu = t("analisa.partai.kontrolWaktu") + ": " + t(`analisa.partai.kelas.${timeClass ?? "unknown"}`);
    return <tr title={kelasWaktu} onClick={() => setData({ format: "pgn", string: pgn })} className="border-b-[1px] cursor-pointer select-none border-border transition-colors hover:bg-backgroundBoxHover" key={i}>
                                    <td className="text-base flex flex-col py-4 w-60 overflow-hidden pl-8">
                                        <div className="flex flex-row items-center gap-2"><div className={`h-4 min-h-4 w-4 min-w-4 bg-evaluationBarWhite rounded-borderRoundness ${whiteWon ? "border-[3px] border-winGreen" : ""}`} />{whiteName} ({whiteElo})</div>
                                        <div className="flex flex-row items-center gap-2"><div className={`h-4 w-4 bg-evaluationBarBlack rounded-borderRoundness ${blackWon ? "border-[3px] border-winGreen" : ""}`} />{blackName} ({blackElo})</div>
                                    </td>
                                    <td className="py-2 pl-3 pr-4">
                                        <div className="flex flex-row items-center gap-2">
                                            <div className="flex w-4 flex-col text-foregroundGrey font-bold text-base"><span>{whiteWon ? 1 : blackWon ? 0 : <>&#189;</>}</span><span>{blackWon ? 1 : whiteWon ? 0 : <>&#189;</>}</span></div>
                                            <div style={{ mixBlendMode: "screen" }} className={`h-4 w-4 rounded-borderRoundness text-lg font-extrabold flex justify-center items-center text-black ${isWin ? "bg-winGreen" : isLoss ? "bg-lossRed" : "bg-foregroundGrey"}`}><div className="w-fit h-fit ml-px">{isWin ? "+" : isLoss ? "-" : "="}</div></div>
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4 notFullDate:pr-8 text-nowrap text-sm">
                                        <div className="flex flex-row items-baseline">
                                            <span className="hidden notFullDate:block">{getMonthName(date.getMonth() + 1, locale).slice(0, 3)} </span><span className="font-bold text-lg ml-1">{date.getDate()}</span><span className="hidden notFullDate:block">, {date.getFullYear()}</span>
                                        </div>
                                    </td>
                                </tr>;
  })}
                    </tbody>
                </table>
            </div>
        </>;
}
function Games(props) {
  const { t } = useI18n();
  const { url, username, depth, unSelect } = props;
  const [gamesInfo, setGamesInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const errorsContext = useContext(ErrorsContext);
  const analyzeContext = useContext(AnalyzeContext);
  const setErrors = errorsContext.errors[1];
  const setData = analyzeContext.data[1];
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const games = json.games;
        const newGamesInfo = games.toReversed().map((game) => {
          const { pgn, black, white, end_time } = game;
          const whiteName = white.username;
          const blackName = black.username;
          const whiteElo = white.rating;
          const blackElo = black.rating;
          const timestamp = end_time * 1e3;
          let result;
          if (white.result === "win") result = "white";
          else if (black.result === "win") result = "black";
          else result = "draw";
          const timeClass = game.time_class;
          return { pgn, whiteName, blackName, whiteElo, blackElo, result, timestamp, timeClass };
        }).filter((gameInfo) => {
          try {
            const chess = new Chess();
            chess.loadPgn(gameInfo.pgn);
          } catch {
            return false;
          }
          return true;
        });
        setLoading(false);
        setGamesInfo(newGamesInfo);
      } catch {
        setLoading(false);
        setGamesInfo([]);
        unSelect();
        await pushPageError(setErrors, t(GAMES_ERROR[0]), t(GAMES_ERROR[1]));
      }
    })();
  }, []);
  if (gamesInfo.length === 0 && !loading) {
    return <div className="text-center font-bold text-2xl my-4">{t("analisa.partai.tidakAda")}</div>;
  }
  return <GamesUI gamesInfo={gamesInfo} username={username} depth={depth} loading={loading} setData={setData} />;
}
function SelectChessComGame(props) {
  const { t, bahasa: locale } = useI18n();
  const { username, depth, stopSelecting } = props;
  const [dates, setDates] = useState([]);
  const [hovered, setHovered] = useState(NaN);
  const [selected, setSelected] = useState(NaN);
  const [loading, setLoading] = useState(true);
  const errorsContext = useContext(ErrorsContext);
  const setErrors = errorsContext.errors[1];
  const toggleSelected = (number) => {
    setSelected((prev) => prev === number ? NaN : number);
  };
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        const archives = json.archives;
        const newDates = archives.toReversed().map((url) => {
          const [year, month] = url.split("/").slice(-2);
          return { year, month, url };
        });
        setLoading(false);
        setDates(newDates);
      } catch {
        setLoading(false);
        stopSelecting();
        await pushPageError(setErrors, t(USER_ERROR[0]), t(USER_ERROR[1]));
      }
    })();
  }, [username]);
  return <div className={`overflow-x-hidden overflow-y-auto ${loading ? "flex flex-col justify-center flex-grow" : ""}`}>
            <h1 style={{ display: loading ? "none" : "" }} className="text-2xl py-4 px-8 sticky text-foreground"><a target="_blank" href={`${PLAYER_URL}${username}`} className="hover:underline text-backgroundBoxBoxHighlightedHover text-3xl font-bold">{username}</a> &middot; {t("analisa.partai.judul", { platform: PLATFORM })}</h1>
            <hr style={{ display: loading ? "none" : "" }} className="border-border" />
            <div className="flex flex-col w-full">
                {loading ? <Loading whatIsLoading={t("analisa.tab.pilihPartai")} abort={stopSelecting} /> : null}
                {dates.map((date, i) => {
    return <div className="w-full" key={i}>
                            <button onClick={() => toggleSelected(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(NaN)} type="button" className={`${hovered === i || selected === i ? "text-foregroundHighlighted" : "text-foregroundGrey"} hover:bg-backgroundBoxHover w-full tracking-wide transition-colors text-2xl px-8 py-4 flex flex-row justify-between items-center`}>
                                <span><b>{date.year}</b> {getMonthName(Number(date.month), locale)}</span>
                                <div style={{ opacity: hovered === i || selected === i ? "100" : "0", transform: `rotate(${selected !== i ? "180deg" : "0"})` }} className="transition-opacity"><Arrow class="fill-foregroundHighlighted" /></div>
                            </button>
                            {selected === i ? <Games url={date.url} username={username} depth={depth} unSelect={() => setSelected(NaN)} /> : ""}
                        </div>;
  })}
            </div>
        </div>;
}
export {
  API_BLOCKING_ERROR,
  GAMES_ERROR,
  GamesUI,
  Loading,
  SimpleLoading,
  USER_ERROR,
  capitalizeFirst,
  SelectChessComGame as default,
  getMonthName
};
