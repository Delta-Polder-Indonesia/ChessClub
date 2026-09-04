/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useState } from "react";
import Arrow from "../../svg/arrow.jsx";
import { AnalyzeContext } from "../../../konteks/analyze.jsx";
import { pushPageError, pushPageWarning } from "../../errors/pageErrors.jsx";
import { Chess } from "chess.js";
import { API_BLOCKING_ERROR, GAMES_ERROR, GamesUI, getMonthName, Loading, USER_ERROR } from "./selectChessCom.jsx";
import { ErrorsContext } from "../../../konteks/errors.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
const PLAYER_URL = "https://lichess.org/@/";
const PLATFORM = "Lichess.org";
function Games(props) {
  const { t } = useI18n();
  const { url, username, depth, unSelect } = props;
  const [gamesInfo, setGamesInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const analyzeContext = useContext(AnalyzeContext);
  const errorsContext = useContext(ErrorsContext);
  const setData = analyzeContext.data[1];
  const setErrors = errorsContext.errors[1];
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(url, { headers: { Accept: "application/x-ndjson" } });
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        const jsonArr = text.split("\n").map((text2) => {
          try {
            return JSON.parse(text2);
          } catch {
            return null;
          }
        }).filter((obj) => obj);
        const newGamesInfo = jsonArr.map((json) => {
          // pemain anonim/bot tidak punya objek `user` di balasan Lichess
          const whiteName = json.players.white.user?.name ?? t("analisa.pemain.anonim");
          const whiteElo = json.players.white.rating;
          const blackName = json.players.black.user?.name ?? t("analisa.pemain.anonim");
          const blackElo = json.players.black.rating;
          const result = json.winner;
          const timestamp = json.createdAt;
          const pgn = json.pgn;
          const timeClass = json.speed;
          return { whiteElo, whiteName, blackElo, blackName, result, timestamp, pgn, timeClass };
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
        await pushPageWarning(setErrors, t(API_BLOCKING_ERROR[0]), t(API_BLOCKING_ERROR[1]));
      }
    })();
  }, []);
  if (gamesInfo.length === 0 && !loading) {
    return <div className="text-center text-sm text-foregroundGrey py-8">{t("analisa.partai.tidakAda")}</div>;
  }
  return <GamesUI gamesInfo={gamesInfo} loading={loading} username={username} depth={depth} setData={setData} />;
}
function SelectLichessOrgGame(props) {
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
        const resFirstGame = await fetch(`https://lichess.org/api/games/user/${username}?sort=dateAsc&max=1`, { headers: { Accept: "application/x-ndjson" } });
        if (!resFirstGame.ok) throw new Error(String(resFirstGame.status));
        const jsonFirstGame = await resFirstGame.json();
        const dateFirstGame = new Date(jsonFirstGame.createdAt);
        const resLastGame = await fetch(`https://lichess.org/api/games/user/${username}?sort=dateDesc&max=1`, { headers: { Accept: "application/x-ndjson" } });
        if (!resLastGame.ok) throw new Error(String(resLastGame.status));
        const jsonLastGame = await resLastGame.json();
        const dateLastGame = new Date(jsonLastGame.createdAt);
        const currentDate = new Date(dateFirstGame);
        const newDates = [];
        while (currentDate <= dateLastGame) {
          const sinceDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
          const untilDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1, 0, 0, 0, 0);
          untilDate.setMilliseconds(untilDate.getMilliseconds() - 1);
          const month = currentDate.getMonth();
          const year = currentDate.getFullYear();
          newDates.push({ month: month + 1, year, url: `https://lichess.org/api/games/user/${username}?since=${sinceDate.getTime()}&until=${untilDate.getTime()}&pgnInJson=true` });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        setLoading(false);
        setDates(newDates.toReversed());
      } catch {
        setLoading(false);
        stopSelecting();
        await pushPageError(setErrors, t(USER_ERROR[0]), t(USER_ERROR[1]));
        await pushPageWarning(setErrors, t(API_BLOCKING_ERROR[0]), t(API_BLOCKING_ERROR[1]));
      }
    })();
  }, [username]);
  return <div className={`overflow-x-hidden overflow-y-auto ${loading ? " flex flex-col justify-center flex-grow" : ""}`}>
            <h1 style={{ display: loading ? "none" : "" }} className="py-3 px-8 sticky text-lg text-foreground"><a target="_blank" href={`${PLAYER_URL}${username}`} className="hover:underline text-foregroundHighlighted text-xl font-bold">{username}</a> <span className="text-foregroundGrey">&middot; {t("analisa.partai.judul", { platform: PLATFORM })}</span></h1>
            <hr style={{ display: loading ? "none" : "" }} className="border-border" />
            <div className="flex flex-col w-full">
                {loading ? <Loading whatIsLoading={t("analisa.tab.pilihPartai")} abort={stopSelecting} /> : null}
                {dates.map((date, i) => {
    return <div key={i}>
                            <button onClick={() => toggleSelected(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(NaN)} type="button" className={`${hovered === i || selected === i ? "text-foregroundHighlighted" : "text-foregroundGrey"} hover:bg-backgroundBoxHover w-full transition-colors text-sm px-8 py-2.5 flex flex-row justify-between items-center`}>
                                <span><b>{date.year}</b> {getMonthName(date.month, locale)}</span>
                                <div style={{ opacity: hovered === i || selected === i ? "100" : "0", transform: `rotate(${selected !== i ? "180deg" : "0"})` }} className="transition-opacity"><Arrow class="fill-foregroundHighlighted" /></div>
                            </button>
                            {selected === i ? <Games url={date.url} username={username} depth={depth} unSelect={() => setSelected(NaN)} /> : ""}
                        </div>;
  })}
            </div>
        </div>;
}
export {
  SelectLichessOrgGame as default
};
