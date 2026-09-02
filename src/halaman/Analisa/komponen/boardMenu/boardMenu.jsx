/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useRef, useState } from "react";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import Image from "../Gambar.jsx";
import { useContext } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import PengaturanMesin from "../pengaturan/mesin.jsx";
function BoardMenu() {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const setWhite = analyzeContext.white[1];
  const setAnimation = analyzeContext.animation[1];
  const [bukaMesin, setBukaMesin] = useState(false);
  const wadahRef = useRef(null);
  useEffect(() => {
    function handleClick(e) {
      if (!wadahRef.current?.contains(e.target)) setBukaMesin(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  function flipBoard() {
    setAnimation(false);
    setWhite((prev) => !prev);
  }
  return <div ref={wadahRef} className="relative flex h-full flex-col justify-between">
            <div className='flex navTop:flex-col flex-row-reverse gap-2'>
                <button className='outline-none' onClick={() => setBukaMesin((prev) => !prev)} type='button' aria-expanded={bukaMesin}><Image className='min-w-[17px]' src={`${import.meta.env.BASE_URL}images/analisa/settings.svg`} title={t("analisa.papan.pengaturan")} alt={t("analisa.papan.pengaturan")} width={17} height={17} /></button>
                <button className='outline-none' onClick={flipBoard} type='button'><Image src={`${import.meta.env.BASE_URL}images/analisa/flip.svg`} title={t("analisa.papan.balik")} alt={t("analisa.papan.balik")} width={17} height={17} className='min-w-[17px]' /></button>
            </div>
            {bukaMesin ? (
              <div
                className="absolute top-full navTop:top-0 left-0 navTop:right-full z-[500] w-[300px] max-h-[calc(100vh-20px)] navTop:max-h-full rounded-borderRoundness overflow-y-auto p-2 select-text bg-backgroundBoxDarker"
                onClick={(e) => e.stopPropagation()}
              >
                <PengaturanMesin />
              </div>
            ) : null}
            <div>

            </div>
        </div>;
}
export {
  BoardMenu as default
};