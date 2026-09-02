/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/* Popup Ulasan Game mengikuti tata letak settings Chess.com (header + tab +
   section Game Review / Analysis / Cloud). */
import { useEffect, useRef, useState } from "react";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import Image from "../Gambar.jsx";
import { useContext } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import Themes from "../pengaturan/themes.jsx";
import Ratings from "../pengaturan/ratings.jsx";
import Moves from "../pengaturan/moves.jsx";
import BestMoves from "../pengaturan/bestMoves.jsx";

const TAB_PENGATURAN = ["temaPapan", "penilaian", "langkah", "langkahTerbaik"];

function BoardMenu() {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const setWhite = analyzeContext.white[1];
  const setAnimation = analyzeContext.animation[1];
  const [bukaMesin, setBukaMesin] = useState(false);
  const [tabAktif, setTabAktif] = useState(0);
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
                <div className="relative">
                    <button className='outline-none' onClick={() => setBukaMesin((prev) => !prev)} type='button' aria-expanded={bukaMesin}><Image className='min-w-[17px]' src={`${import.meta.env.BASE_URL}images/analisa/settings.svg`} title={t("analisa.papan.pengaturan")} alt={t("analisa.papan.pengaturan")} width={17} height={17} /></button>
                    {bukaMesin ? (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 navTop:left-0 navTop:translate-x-0 z-[1000] mt-1 w-[400px] max-h-[85vh] bg-backgroundBoxDarker rounded-lg shadow-2xl overflow-y-auto">
                        <header className="flex items-center justify-between px-4 py-3 bg-backgroundBoxBox border-b border-backgroundBoxBoxHighlighted shrink-0 sticky top-0">
                          <span className="font-bold text-base text-foreground">Settings</span>
                          <button
                            type="button"
                            onClick={() => setBukaMesin(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-backgroundBoxHover transition-colors text-foregroundGrey hover:text-foreground"
                            aria-label="Close"
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                              <path d="m6.1 20.77c-1.13 1.13-1.6 1.13-2.73 0l-.13-.13c-1.13-1.13-1.13-1.6 0-2.73l5.97-5.9-5.97-6c-1.13-1.13-1.13-1.6 0-2.73l.13-.1c1.13-1.13 1.6-1.13 2.73 0l5.93 6 5.93-5.97c1.13-1.13 1.6-1.13 2.73 0l.13.13c1.13 1.13 1.13 1.6 0 2.73l-5.97 5.93 5.8 5.9c1.13 1.13 1.13 1.6 0 2.73l-.1.13c-1.13 1.13-1.6 1.13-2.73 0l-5.8-5.93zm0 0" />
                            </svg>
                          </button>
                        </header>

                        <menu className="flex flex-row border-b border-backgroundBoxBoxHighlighted select-none">
                          {TAB_PENGATURAN.map((kunci, i) => (
                            <button
                              role="tab"
                              key={kunci}
                              type="button"
                              aria-selected={tabAktif === i}
                              onClick={() => setTabAktif(i)}
                              className={`flex-1 py-2 text-xs font-bold outline-none transition-colors ${
                                tabAktif === i
                                  ? "text-foreground border-b-2 border-foregroundHighlighted"
                                  : "text-foregroundGrey hover:text-foregroundHighlighted"
                              }`}
                            >
                              {t(`analisa.pengaturan.${kunci}`)}
                            </button>
                          ))}
                        </menu>

                        <div className="p-5 select-text">
                          {tabAktif === 0 ? <Themes /> : null}
                          {tabAktif === 1 ? <Ratings /> : null}
                          {tabAktif === 2 ? <Moves /> : null}
                          {tabAktif === 3 ? <BestMoves /> : null}
                        </div>
                      </div>
                    ) : null}
                </div>
                <button className='outline-none' onClick={flipBoard} type='button'><Image src={`${import.meta.env.BASE_URL}images/analisa/flip.svg`} title={t("analisa.papan.balik")} alt={t("analisa.papan.balik")} width={17} height={17} className='min-w-[17px]' /></button>
            </div>
            <div>

            </div>
        </div>;
}

export { BoardMenu as default };
