/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
                        <div className="w-[70%] bg-backgroundBox relative overflow-hidden rounded-borderExtraRoundness text-sm text-foregroundGrey flex flex-col gap-6 pb-6 pt-10 items-center">
                            <div className="flex flex-col items-center gap-3">
                                <Files className="animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] scale-x-[-1]" size={44} />
                                <span className="text-base text-foreground font-semibold">{props.whatIsLoading}</span>
                                <span>{t("analisa.partai.mengambilApi")}{ellipsis}</span>
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
  return <div className="text-sm text-foregroundGrey animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] w-fit my-4 m-auto">
            {t("analisa.partai.memuat")} {props.whatIsLoading}{ellipsis}
        </div>;
}
function GamesUI(props) {
  const { t, bahasa: locale } = useI18n();
  const { gamesInfo, loading, username, setData } = props;
  // Pencarian bebas: cocokkan nama pemain putih/hitam (huruf besar/kecil diabaikan).
  const [cari, setCari] = useState("");
  // Pengurutan tabel: kolom aktif + arah. Bawaan: tanggal terbaru di atas.
  const [urut, setUrut] = useState({ kolom: "tanggal", arah: "desc" });

  // Daftar partai setelah disaring pencarian, lalu diurutkan.
  const terfilter = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    if (!kata) return gamesInfo;
    return gamesInfo.filter(
      (g) =>
        g.whiteName?.toLowerCase().includes(kata) ||
        g.blackName?.toLowerCase().includes(kata)
    );
  }, [gamesInfo, cari]);

  const terurut = useMemo(() => {
    const { kolom, arah } = urut;
    const pengali = arah === "asc" ? 1 : -1;
    return [...terfilter].sort((a, b) => {
      if (kolom === "tanggal") return (a.timestamp - b.timestamp) * pengali;
      if (kolom === "hasil") {
        const nilai = (g) => (g.result === "white" ? 1 : g.result === "draw" ? 0 : -1);
        return (nilai(a) - nilai(b)) * pengali;
      }
      // kolom "pemain": urut berdasarkan nama putih, lalu hitam.
      if (kolom === "pemain") {
        const banding =
          a.whiteName.localeCompare(b.whiteName, locale) ||
          a.blackName.localeCompare(b.blackName, locale);
        return banding * pengali;
      }
      return 0;
    });
  }, [terfilter, urut, locale]);

  /** Balik arah bila kolom sama, atau mulai arah baru (tanggal: terbaru dulu). */
  function ubahUrut(kolom) {
    setUrut((lama) =>
      lama.kolom === kolom
        ? { kolom, arah: lama.arah === "asc" ? "desc" : "asc" }
        : { kolom, arah: kolom === "tanggal" ? "desc" : "asc" }
    );
  }

  const IkonUrut = ({ kolom }) =>
    urut.kolom === kolom ? (
      <span className="ml-1 inline-block w-3 text-foregroundGrey">{urut.arah === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1 inline-block w-3 text-foregroundGrey opacity-40">↕</span>
    );

  return <>
            {loading ? <SimpleLoading whatIsLoading={t("analisa.tab.pilihPartai")} /> : null}
            <div className="px-8 pt-2">
              <input
                type="search"
                value={cari}
                onChange={(e) => setCari(e.currentTarget.value)}
                placeholder={t("analisa.partai.cari")}
                aria-label={t("analisa.partai.cari")}
                className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
              />
            </div>
            <div className="w-full overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                    <thead style={{ display: loading ? "none" : "" }}>
                        <tr>
                            <th className="py-2 pl-8 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                              <button type="button" onClick={() => ubahUrut("pemain")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                {t("analisa.partai.pemain")}<IkonUrut kolom="pemain" />
                              </button>
                            </th>
                            <th className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                              <button type="button" onClick={() => ubahUrut("hasil")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                {t("analisa.partai.hasil")}<IkonUrut kolom="hasil" />
                              </button>
                            </th>
                            <th className="py-2 pl-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey notFullDate:pr-8">
                              <button type="button" onClick={() => ubahUrut("tanggal")} className="inline-flex items-center hover:text-foregroundHighlighted transition-colors">
                                <span className="notFullDate:block hidden">{t("analisa.partai.tanggal")}</span><span className="notFullDate:hidden block">{t("analisa.partai.hari")}</span><IkonUrut kolom="tanggal" />
                              </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {terurut.map((gameInfo, i) => {
    const { pgn, whiteName, blackName, whiteElo, blackElo, result, timestamp, timeClass } = gameInfo;
    const whiteWon = result === "white";
    const blackWon = result === "black";
    const isWin = whiteWon && whiteName.toLowerCase() === username.toLowerCase() || blackWon && blackName.toLowerCase() === username.toLowerCase();
    const isLoss = whiteWon && whiteName.toLowerCase() !== username.toLowerCase() || blackWon && blackName.toLowerCase() !== username.toLowerCase();
    const date = new Date(timestamp);
    const kelasWaktu = t("analisa.partai.kontrolWaktu") + ": " + t(`analisa.partai.kelas.${timeClass ?? "unknown"}`);
    return <tr title={kelasWaktu} onClick={() => setData({ format: "pgn", string: pgn })} className="cursor-pointer select-none border-b border-border transition-colors hover:bg-backgroundBoxHover" key={i}>
                                    <td className="flex flex-col py-2 pl-8 pr-2 w-[42%] min-w-52 overflow-hidden">
                                        <div className="flex flex-row items-center gap-2 text-[13px] leading-5">
                                            <div className={`h-3.5 min-h-3.5 w-3.5 min-w-3.5 shrink-0 bg-evaluationBarWhite rounded-sm ${whiteWon ? "border-[3px] border-winGreen" : ""}`} />
                                            <span className="truncate">{whiteName}</span>
                                            <span className="text-foregroundGrey">({whiteElo})</span>
                                        </div>
                                        <div className="flex flex-row items-center gap-2 text-[13px] leading-5">
                                            <div className={`h-3.5 w-3.5 shrink-0 bg-evaluationBarBlack rounded-sm ${blackWon ? "border-[3px] border-winGreen" : ""}`} />
                                            <span className="truncate">{blackName}</span>
                                            <span className="text-foregroundGrey">({blackElo})</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-3">
                                        <div className="flex flex-row items-center gap-2">
                                            <div className="flex w-4 flex-col text-foregroundGrey font-semibold text-[11px] leading-4"><span>{whiteWon ? 1 : blackWon ? 0 : <>&#189;</>}</span><span>{blackWon ? 1 : whiteWon ? 0 : <>&#189;</>}</span></div>
                                            <div style={{ mixBlendMode: "screen" }} className={`flex h-5 w-5 items-center justify-center rounded-sm text-xs font-bold text-black ${isWin ? "bg-winGreen" : isLoss ? "bg-lossRed" : "bg-foregroundGrey"}`}><div className="w-fit h-fit ml-px">{isWin ? "+" : isLoss ? "-" : "="}</div></div>
                                        </div>
                                    </td>
                                    <td className="py-2 pl-3 pr-4 notFullDate:pr-8 text-nowrap text-[13px]">
                                        <div className="flex flex-row items-baseline">
                                            <span className="hidden notFullDate:block text-foregroundGrey">{getMonthName(date.getMonth() + 1, locale).slice(0, 3)} </span><span className="font-bold text-sm ml-1">{date.getDate()}</span><span className="hidden notFullDate:block text-foregroundGrey">, {date.getFullYear()}</span>
                                        </div>
                                    </td>
                                </tr>;
  })}
                    {!loading && terurut.length === 0 && (
                        <tr>
                            <td colSpan={3} className="py-6 text-center text-sm text-foregroundGrey">
                                {cari.trim() ? t("analisa.partai.tidakCocok") : t("analisa.partai.tidakAda")}
                            </td>
                        </tr>
                    )}
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
    return <div className="text-center text-sm text-foregroundGrey py-8">{t("analisa.partai.tidakAda")}</div>;
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
            <h1 style={{ display: loading ? "none" : "" }} className="py-3 px-8 sticky text-lg text-foreground"><a target="_blank" href={`${PLAYER_URL}${username}`} className="hover:underline text-backgroundBoxBoxHighlightedHover text-xl font-bold">{username}</a> <span className="text-foregroundGrey">&middot; {t("analisa.partai.judul", { platform: PLATFORM })}</span></h1>
            <hr style={{ display: loading ? "none" : "" }} className="border-border" />
            <div className="flex flex-col w-full">
                {loading ? <Loading whatIsLoading={t("analisa.tab.pilihPartai")} abort={stopSelecting} /> : null}
                {dates.map((date, i) => {
    return <div className="w-full" key={i}>
                            <button onClick={() => toggleSelected(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(NaN)} type="button" className={`${hovered === i || selected === i ? "text-foregroundHighlighted" : "text-foregroundGrey"} hover:bg-backgroundBoxHover w-full transition-colors text-sm px-8 py-2.5 flex flex-row justify-between items-center`}>
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
