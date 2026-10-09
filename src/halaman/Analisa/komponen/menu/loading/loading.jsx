/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useContext, useEffect, useRef, useState } from "react";
import Lens from "../../svg/lens.jsx";
import LoadingBar from "./loadingBar.jsx";
import DualRingSpinner from "../../loading/DualRingSpinner.jsx";
import { AnalyzeContext } from "../../../konteks/analyzeKonteks.js";
import { useMesin } from "../../../konteks/mesinKonteks.js";
import { useI18n } from "../../../../../lib/i18n.jsx";
import { persenProgres } from "./persenProgres.js";

function Loading(props) {
  const { t } = useI18n();
  const { status } = useMesin();
  const [ellipsis, setEllipsis] = useState("");
  const analyzeContext = useContext(AnalyzeContext);
  const [progress] = analyzeContext.progress;
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
  function cancel() {
    analyzeController?.abort();
  }
  return <div data-uji="kartu-progres-analisa" className="flex flex-col">
            <div className="text-lg font-bold text-foregroundGrey px-5 pb-3 w-full">
                {status === "memuat" ? t("analisa.status.memuat") : `${t("analisa.muat.menganalisa")}${ellipsis}`}
            </div>
            <hr className="border-neutral-600" />
            <div className="flex justify-center py-3">
                <div className="w-[85%] bg-backgroundBox rounded-borderExtraRoundness text-foregroundGrey flex flex-col gap-3 px-4 py-3">
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
                    <div className="flex w-full items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <Lens class="scale-x-[-1] fill-backgroundBoxBoxHighlighted" size={30} />
                            <span className="font-semibold text-foreground">{format?.toUpperCase()}</span>
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
                                <DualRingSpinner color="#4a9dd9" scale={0.55} />
                            </div>
                        </div>
                        <button onClick={cancel} className="hover:text-foreground transition-colors" type="button">{t("analisa.muat.batal")}</button>
                    </div>
                </div>
            </div>
        </div>;
}
export {
  Loading as default
};
