/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import { useEffect, useRef, useState } from "react";
import RatingCount from "./ratingCount.jsx";
import PlayersAccuracy from "./playersAccuracy.jsx";
import GameRating from "./gameRating.jsx";
import DeteksiEngine from "./deteksiEngine.jsx";
import EksporPgn from "./eksporPgn.jsx";
import GameChart from "../gameChart.jsx";
import { reduceSummary } from "../../../../konstanta.js";
function Summary(props) {
  const { moves, container, players: players2, moveNumber, setMoveNumber, setAnimation, setForward } = props;
  const [reducedSummary, setReducedSummary] = useState(false);
  const componentRef = useRef(null);
  const [accuracy, setAccuracy] = useState({ w: NaN, b: NaN });
  const [accuracyPhases2, setAccuracyPhases] = useState({ opening: { w: [], b: [] }, middlegame: { w: [], b: [] }, endgame: { w: [], b: [] } });
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach(() => {
        setReducedSummary(window.innerWidth < reduceSummary);
      });
    });
    const component = componentRef.current;
    if (!component) {
      observer.disconnect();
      return;
    }
    observer.observe(component);
    // Observer wajib dilepas: Summary terpasang/lepas tiap ganti tab,
    // tanpa disconnect() observer menumpuk memantau node yang sudah lepas.
    return () => observer.disconnect();
  }, []);
  return <div ref={componentRef} className="flex flex-col gap-3 items-center">
            <GameChart setMoveNumber={setMoveNumber} moves={moves} container={container} moveNumber={moveNumber} setAnimation={setAnimation} setForward={setForward} />
            <PlayersAccuracy reducedSummary={reducedSummary} setAccuracyPhases={setAccuracyPhases} accuracy={[accuracy, setAccuracy]} players={players2} moves={moves} />
            <hr className="border-neutral-600 w-[85%]" />
            <RatingCount moves={moves} />
            <hr className="border-neutral-600 w-[85%]" />
            <GameRating reducedSummary={reducedSummary} accuracy={accuracy} accuracyPhases={accuracyPhases2} />
            <hr className="border-neutral-600 w-[85%]" />
            {/* Deteksi engine ditaruh paling bawah: kartu tambahan ini tidak
                boleh menggeser urutan baris Ringkasan yang sudah direkam
                suite uji beku (scripts/uji-hasil.mjs mencari baris berdasarkan
                urutan DOM). */}
            <DeteksiEngine moves={moves} />
            {/* Ekspor juga PALING BAWAH, dengan alasan yang sama seperti
                DeteksiEngine di atas: suite beku mencari baris Ringkasan
                berdasarkan urutan DOM. */}
            <EksporPgn moves={moves} />
        </div>;
}
export {
  Summary as default
};
