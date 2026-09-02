/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/* Popup Ulasan Game mengikuti tata letak settings Chess.com (header + tab +
   section Game Review / Analysis / Cloud). */
import { useEffect, useRef, useState } from "react";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import Image from "../Gambar.jsx";
import { useContext } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { DAFTAR_ENGINE } from "../../../../lib/engineCatur.js";
import { gunakanMesin } from "../../konteks/mesin.jsx";

function BoardMenu() {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const setWhite = analyzeContext.white[1];
  const setAnimation = analyzeContext.animation[1];
  const [bukaMesin, setBukaMesin] = useState(false);
  const wadahRef = useRef(null);

  const { gantiEngine } = gunakanMesin();
  const [depth, setDepth] = analyzeContext.depth;
  const [idEngine, setIdEngineState] = useState(() => {
    try {
      return localStorage.getItem("kci-analisa-engine") || "stockfish-18-lite";
    } catch {
      return "stockfish-18-lite";
    }
  });

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

  function engineAktif() {
    return DAFTAR_ENGINE.find((e) => e.id === idEngine) ?? DAFTAR_ENGINE[0];
  }

  function pilihEngine(id) {
    setIdEngineState(id);
    try {
      localStorage.setItem("kci-analisa-engine", id);
    } catch {}
    gantiEngine(id);
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

                        <div className="p-5 select-text">
                          <EngineTab
                            engineAktif={engineAktif()}
                            engineId={idEngine}
                            pilihEngine={pilihEngine}
                            depth={depth}
                            pilihKedalaman={(ply) => {
                              setDepth(ply);
                              try { localStorage.setItem("kci-analisa-kedalaman", ply); } catch {}
                            }}
                          />
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

function EngineTab({ engineAktif, engineId, pilihEngine, depth, pilihKedalaman }) {
  const [engineNyala, setEngineNyala] = useState(true);
  return (
    <div className="p-5">
      {/* Game Review */}
      <header className="settings-engine-header text-base font-bold text-foreground">Game Review</header>
      <ul className="mt-3">
        <SettingRow label="Chess Engine">
          <span className="text-sm font-semibold text-foregroundHighlighted">{engineAktif.label}</span>
          <button
            type="button"
            onClick={() => setEngineNyala((v) => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${engineNyala ? "bg-green-500" : "bg-backgroundBoxBoxHighlighted"}`}
            aria-pressed={engineNyala}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${engineNyala ? "left-[18px]" : "left-0.5"}`} />
          </button>
        </SettingRow>        <SettingRow label="Depth">
          <select
            className="cc-select text-sm bg-backgroundBoxBox rounded px-2 py-1 border border-backgroundBoxBoxHighlighted outline-none text-foreground"
            value={depth}
            onChange={(e) => pilihKedalaman(Number(e.target.value))}
          >
            {[7, 9, 11, 13, 15].map((d) => (
              <option key={d} value={d}>Kedalaman&nbsp;{d}</option>
            ))}
          </select>
        </SettingRow>
      </ul>

      <ul className="m-0">
        <SettingRow label="Chess Engine">
          <select
            className="cc-select text-sm bg-backgroundBoxBox rounded px-2 py-1 border border-backgroundBoxBoxHighlighted outline-none text-foreground"
            value={engineId}
            onChange={(e) => pilihEngine(e.target.value)}
          >
            {DAFTAR_ENGINE.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </SettingRow>
      </ul>
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <label className="text-sm text-foregroundGrey">{label}</label>
      <span className="flex items-center gap-1">{children}</span>
    </li>
  );
}

export { BoardMenu as default };
