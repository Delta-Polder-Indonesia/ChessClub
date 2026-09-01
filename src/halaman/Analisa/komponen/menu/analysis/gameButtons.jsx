/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import NextMove from "../../svg/nextMove.jsx";
import Play from "../../svg/play.jsx";
import SkipGame from "../../svg/skipGame.jsx";
import Pause from "../../svg/pause.jsx";
import { AnalyzeContext } from "../../../konteks/analyze.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
function GameButtons() {
  const { t } = useI18n();
  const [playPauseHover, setPlayPauseHover] = useState(false);
  const analyzeContext = useContext(AnalyzeContext);
  const [playing] = analyzeContext.playing;
  const [moveNumber] = analyzeContext.moveNumber;
  const gameController = analyzeContext.gameController;
  const moveNumberRef = useRef(moveNumber);
  useEffect(() => {
    moveNumberRef.current = moveNumber;
  }, [moveNumber]);
  function previousMove() {
    gameController.back();
  }
  function nextMove() {
    gameController.forward();
  }
  function firstMove() {
    gameController.first();
  }
  function lastMove() {
    gameController.last();
  }
  function play() {
    gameController.play();
  }
  function pause() {
    gameController.pause();
  }
  return <div className="w-[85%] rounded-borderRoundness p-3 flex flex-row justify-around items-center">
            <SkipGame title={t("analisa.pemutar.awal")} click={firstMove} class="h-[45px] rotate-180 fill-foregroundGrey transition-colors hover:fill-foregroundHighlighted" />
            <NextMove title={t("analisa.pemutar.mundur")} click={previousMove} class="h-[25px] rotate-180 fill-foregroundGrey transition-colors hover:fill-foregroundHighlighted" />
            <div onMouseEnter={() => setPlayPauseHover(true)} onMouseLeave={() => setPlayPauseHover(false)}>
                <Play title={t("analisa.pemutar.putar")} click={play} class={`h-[25px] transition-colors pl-1 ${playPauseHover ? "fill-foregroundHighlighted" : "fill-foregroundGrey"} ${playing ? "hidden" : ""}`} />
                <Pause title={t("analisa.pemutar.jeda")} click={pause} class={`h-[25px] transition-colors pr-1 ${playPauseHover ? "fill-foregroundHighlighted" : "fill-foregroundGrey"} ${!playing ? "hidden" : ""}`} />
            </div>
            <NextMove title={t("analisa.pemutar.maju")} click={nextMove} class="h-[25px] fill-foregroundGrey transition-colors hover:fill-foregroundHighlighted" />
            <SkipGame title={t("analisa.pemutar.akhir")} click={lastMove} class="h-[45px] fill-foregroundGrey transition-colors hover:fill-foregroundHighlighted" />
        </div>;
}
export {
  GameButtons as default
};
