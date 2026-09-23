/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import Lens from "../../svg/lens.jsx";
import LoadingBar from "./loadingBar.jsx";
import DualRingSpinner from "../../loading/DualRingSpinner.jsx";
import { AnalyzeContext } from "../../../konteks/analyze.jsx";
import { gunakanMesin } from "../../../konteks/mesin.jsx";
import { useI18n } from "../../../../../lib/i18n.jsx";
/**
 * Kemajuan analisa (0–100, dari `setProgress` di `mesin/engine.js`) untuk
 * ditampilkan sebagai satu angka di belakang koma — sama seperti kartu progres
 * WintrChess (`ProgressReporter`, `(progress * 100).toFixed(1)`). Nilai di luar
 * 0–100 atau bukan angka dijinakkan supaya kartu tidak pernah menulis "NaN%".
 */
export function persenProgres(progress) {
  const angka = Number(progress);
  if (!Number.isFinite(angka)) return "0.0";
  return Math.min(Math.max(angka, 0), 100).toFixed(1);
}
function Loading(props) {
  const { t } = useI18n();
  const { status } = gunakanMesin();
  const [ellipsis, setEllipsis] = useState("");
  const analyzeContext = useContext(AnalyzeContext);
  const [progress] = analyzeContext.progress;
  const progressRef = useRef(progress);
  const ellipsisRef = useRef(ellipsis);
  const { format, analyzeController } = props;
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
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  function cancel() {
    analyzeController?.abort();
  }
  return <div className="flex flex-col flex-grow">
            <div className="text-lg font-bold text-foregroundGrey px-5 pb-5 w-full">
                {status === "memuat" ? t("analisa.status.memuat") : `${t("analisa.muat.menganalisa")}${ellipsis}`}
            </div>
            <hr className="border-neutral-600" />
            <div className="flex-grow flex flex-col justify-center items-center relative">
                <div className="w-[70%] bg-backgroundBox relative overflow-hidden rounded-borderExtraRoundness text-lg text-foregroundGrey flex flex-col gap-8 px-5 pb-4 pt-6 items-center">
                    <div className="w-full flex flex-col gap-2">
                        <div className="flex flex-wrap justify-between gap-2 w-full">
                            <span className="flex items-baseline whitespace-nowrap">
                                <span>{t("analisa.muat.menganalisaPartai")}</span>
                                <span className="inline-block w-7 text-left">{ellipsis}</span>
                            </span>
                            <span className="tabular-nums">{persenProgres(progress)}%</span>
                        </div>
                        <LoadingBar progress={progress} transitionTime={100} />
                        <span className="w-full text-xs leading-4 text-foregroundGrey">{t("analisa.muat.petunjukLama")}</span>
                    </div>
                    <div className="w-36 flex flex-col items-center gap-4">
                        <Lens class="animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite;] scale-x-[-1] fill-backgroundBoxBoxHighlighted" size={60} />
                        <span className="text-xl text-foreground font-bold">{format.toUpperCase()}</span>
                        <DualRingSpinner color="#4a9dd9" />
                    </div>
                    <button onClick={cancel} className="hover:text-foreground transition-colors" type="button">{t("analisa.muat.batal")}</button>
                </div>
            </div>
        </div>;
}
export {
  Loading as default
};
