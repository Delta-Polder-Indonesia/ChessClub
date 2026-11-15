/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useRef, useState } from "react";
import NextMove from "../../svg/nextMove.jsx";
import Play from "../../svg/play.jsx";
import SkipGame from "../../svg/skipGame.jsx";
import Pause from "../../svg/pause.jsx";
import { useBoard } from "../../../konteks/boardKonteks.js";
import { useI18n } from "../../../../../lib/i18n.jsx";
import { TooltipLabel } from "../../../../../components/ui/tooltip.jsx";
function GameButtons() {
  const { t } = useI18n();
  const [playPauseHover, setPlayPauseHover] = useState(false);
  /*
   * Hanya memakai state papan (playing/moveNumber/gameController), jadi ia
   * berlangganan BoardContext — bukan AnalyzeContext. Dengan begitu tombol
   * pemutar tidak ikut di-render setiap `progress` analisis berubah.
   */
  const papan = useBoard();
  const [playing] = papan.playing;
  const [moveNumber] = papan.moveNumber;
  const gameController = papan.gameController;
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
  const kelasTombol = "group grid place-items-center border-0 bg-transparent p-1 text-inherit outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return <div className="w-[85%] rounded-borderRoundness p-3 flex flex-row justify-around items-center">
            <TooltipLabel label={t("analisa.pemutar.awal")}>
              <button type="button" aria-label={t("analisa.pemutar.awal")} className={kelasTombol} onClick={firstMove}>
                <span aria-hidden="true"><SkipGame class="h-[45px] rotate-180 fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" /></span>
              </button>
            </TooltipLabel>
            <TooltipLabel label={t("analisa.pemutar.mundur")}>
              <button type="button" aria-label={t("analisa.pemutar.mundur")} className={kelasTombol} onClick={previousMove}>
                <span aria-hidden="true"><NextMove class="h-[25px] rotate-180 fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" /></span>
              </button>
            </TooltipLabel>
            <div className="group" onMouseEnter={() => setPlayPauseHover(true)} onMouseLeave={() => setPlayPauseHover(false)}>
              <TooltipLabel label={t(playing ? "analisa.pemutar.jeda" : "analisa.pemutar.putar")}>
                <button type="button" aria-label={t(playing ? "analisa.pemutar.jeda" : "analisa.pemutar.putar")} className={kelasTombol} onClick={playing ? pause : play}>
                  <span aria-hidden="true">
                    {playing
                      ? <Pause class={`h-[25px] transition-colors pr-1 ${playPauseHover ? "fill-foregroundHighlighted" : "fill-foregroundGrey"}`} />
                      : <Play class={`h-[25px] transition-colors pl-1 ${playPauseHover ? "fill-foregroundHighlighted" : "fill-foregroundGrey"}`} />}
                  </span>
                </button>
              </TooltipLabel>
            </div>
            <TooltipLabel label={t("analisa.pemutar.maju")}>
              <button type="button" aria-label={t("analisa.pemutar.maju")} className={kelasTombol} onClick={nextMove}>
                <span aria-hidden="true"><NextMove class="h-[25px] fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" /></span>
              </button>
            </TooltipLabel>
            <TooltipLabel label={t("analisa.pemutar.akhir")}>
              <button type="button" aria-label={t("analisa.pemutar.akhir")} className={kelasTombol} onClick={lastMove}>
                <span aria-hidden="true"><SkipGame class="h-[45px] fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" /></span>
              </button>
            </TooltipLabel>
        </div>;
}
export {
  GameButtons as default
};
