/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { ConfigContext } from "../../konteks/config.jsx";
import Image from "../Gambar.jsx";
import { useContext } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
function BoardMenu() {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const configContext = useContext(ConfigContext);
  const setWhite = analyzeContext.white[1];
  const setAnimation = analyzeContext.animation[1];
  const setOpenedMenu = configContext.openedMenu[1];
  const boardMenuSettingsRef = configContext.boardMenuSettingsRef;
  function flipBoard() {
    setAnimation(false);
    setWhite((prev) => !prev);
  }
  return <div className="flex flex-col justify-between h-full">
            <div className='flex navTop:flex-col flex-row-reverse gap-2'>
                <button className='outline-none' ref={boardMenuSettingsRef} onClick={() => setOpenedMenu((prev) => prev === "settings" ? null : "settings")} type='button'><Image className='min-w-[17px]' src={`${import.meta.env.BASE_URL}images/analisa/settings.svg`} title={t("analisa.papan.pengaturan")} alt={t("analisa.papan.pengaturan")} width={17} height={17} /></button>
                <button className='outline-none' onClick={flipBoard} type='button'><Image src={`${import.meta.env.BASE_URL}images/analisa/flip.svg`} title={t("analisa.papan.balik")} alt={t("analisa.papan.balik")} width={17} height={17} className='min-w-[17px]' /></button>
            </div>
            <div>

            </div>
        </div>;
}
export {
  BoardMenu as default
};
