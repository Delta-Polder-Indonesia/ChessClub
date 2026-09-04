/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import Lens from "../svg/lens.jsx";
import Form from "./analyze/form.jsx";
import Loading from "./loading/loading.jsx";
import GameButtons from "./analysis/gameButtons.jsx";
import Pawn from "../svg/pawn.jsx";
import SelectChessComGame from "./analyze/selectChessCom.jsx";
import Star from "../svg/star.jsx";
import BoardIcon from "../svg/boardIcon.jsx";
import Summary from "./analysis/summary/summary.jsx";
import Moves from "./analysis/moves/moves.jsx";
import getOverallGameComment from "./analysis/moves/overallGameComment.jsx";
import SelectLichessOrgGame from "./analyze/selectLichessOrg.jsx";
function Menu() {
  const { t } = useI18n();
  const [selected, select] = useState(0);
  const [overallGameComment, setOverallGameComment] = useState("");
  const analyzeContext = useContext(AnalyzeContext);
  const [username, setUsername] = analyzeContext.akun;
  const [tab, setTab] = analyzeContext.tab;
  const [pageState] = analyzeContext.pageState;
  const [data, setData] = analyzeContext.data;
  const [game] = analyzeContext.game;
  const [players] = analyzeContext.players;
  const [result] = analyzeContext.result;
  const [moveNumber, setMoveNumber] = analyzeContext.moveNumber;
  const [analyzeController] = analyzeContext.analyzeController;
  const [analyzingMove] = analyzeContext.analyzingMove;
  const setAnimation = analyzeContext.animation[1];
  const setForward = analyzeContext.forward[1];
  const [customLine, setCustomLine] = analyzeContext.customLine;
  const [returnedToNormalGame] = analyzeContext.returnedToNormalGame;
  const [depth, setDepth] = analyzeContext.depth;
  const menuRef = useRef(null);
  useEffect(() => {
    if (pageState === "default") setTab("analyze");
    if (pageState === "loading") setTab("analyze");
    if (pageState === "analyze") setTab("summary");
    switch (pageState) {
      case "default":
        setTab("analyze");
        break;
      case "loading":
        setTab("analyze");
        break;
      case "analyze":
        setTab("summary");
        break;
      case "analyzeCustom":
        setTab("moves");
        break;
    }
  }, [pageState]);
  useEffect(() => {
    if (pageState !== "default") return;
    if (username.username) {
      setTab("selectGame");
    } else {
      setTab("analyze");
    }
  }, [username]);
  const { format } = data;
  useEffect(() => {
    if (pageState !== "analyze") return;
    setTab("moves");
  }, [moveNumber]);
  useEffect(() => {
    const playerNames = players.map((player) => player.name);
    setOverallGameComment(getOverallGameComment(playerNames, result, t));
  }, [players, result, t]);
  function stopSelecting() {
    setUsername({ platform: "", username: "" });
  }
  const tabs = [
    { label: "Laporan Analisa", state: "analyze", icon: (className) => <Lens class={className} size={20} />, show: true, onClick: () => {
      if (pageState === "analyze" || pageState === "analyzeCustom") setData({ format: "fen", string: "" });
      if (tab === "selectGame") stopSelecting();
    } },
    { label: t("analisa.tab.pilihPartai"), state: "selectGame", icon: (className) => <Pawn class={className} size={20} />, show: tab === "selectGame", onClick: () => {
    } },
    { label: t("analisa.tab.ringkasan"), state: "summary", icon: (className) => <Star class={className} size={20} />, show: pageState === "analyze", onClick: () => {
    } },
    { label: t("analisa.tab.langkah"), state: "moves", icon: (className) => <BoardIcon class={className} size={20} />, show: pageState === "analyze" || pageState === "analyzeCustom", onClick: () => {
    } }
  ];
  return <div ref={menuRef} className="vertical:h-full w-full max-w-[600px] pb-8 vertical:pb-0 vertical:min-h-0 min-h-[600px] select-text bg-backgroundBox rounded-borderRoundness flex-grow vertical:max-w-[600px] vertical:min-w-[400px] flex flex-col gap-4 overflow-hidden">
            <menu className="flex flex-row relative select-none">
                {tabs.map((t, i) => {
    if (!t.show) return;
    const isSelected = tab === t.state;
    return <button role="tab" key={i} onClick={() => {
      setTab(t.state);
      t.onClick();
    }} className={`w-full flex flex-row gap-2 group items-center justify-center py-2 text-sm outline-none ${isSelected ? "text-foreground" : "bg-backgroundBoxBoxDisabled text-foregroundGrey cursor-pointer transition-colors hover:text-foregroundHighlighted"}`}>{t.icon(isSelected ? "fill-foreground" : "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted")}{t.label}</button>;
  })}
            </menu>
            <div className="overflow-y-auto h-full flex flex-col">
                {pageState === "default" && tab === "analyze" ? <Form setData={setData} selectGame={(username2, platform) => {
    setUsername({ platform, username: username2 });
  }} depth={[depth, setDepth]} selected={[selected, select]} /> : ""}
                {pageState === "default" && tab === "selectGame" && username.platform === "chessCom" && username.username ? <SelectChessComGame stopSelecting={stopSelecting} username={username.username} depth={depth} /> : ""}
                {pageState === "default" && tab === "selectGame" && username.platform === "lichessOrg" && username.username ? <SelectLichessOrgGame stopSelecting={stopSelecting} username={username.username} depth={depth} /> : ""}

                {pageState === "loading" && tab === "analyze" ? <Loading format={format} analyzeController={analyzeController} /> : ""}

                {pageState === "analyze" && tab === "summary" ? <Summary setAnimation={setAnimation} setForward={setForward} setMoveNumber={setMoveNumber} moveNumber={moveNumber} players={players} moves={game} container={menuRef.current} /> : ""}
                {pageState === "analyze" && tab === "moves" ? <Moves container={menuRef.current} moves={game} overallGameComment={overallGameComment} moveNumber={moveNumber} setMoveNumber={setMoveNumber} analyzingMove={analyzingMove} setAnimation={setAnimation} setForward={setForward} customLine={customLine} returnedToNormalGame={returnedToNormalGame} /> : ""}

                {pageState === "analyzeCustom" && tab === "moves" ? <Moves container={menuRef.current} moves={[game[0], ...customLine.moves]} overallGameComment={overallGameComment} moveNumber={customLine.moveNumber + 1} setMoveNumber={(moveNumber2) => setCustomLine((prev) => ({ ...prev, moveNumber: moveNumber2 - 1 }))} analyzingMove={analyzingMove} setAnimation={setAnimation} setForward={setForward} customLine={customLine} returnedToNormalGame={returnedToNormalGame} /> : ""}
            </div>
            {pageState === "analyze" || pageState === "analyzeCustom" ? <div className="flex-col gap-1 pb-1 items-center hidden vertical:flex">
                    <hr className="border-neutral-600 w-[85%]" />
                    <GameButtons />
                </div> : ""}
        </div>;
}
export {
  Menu as default
};
