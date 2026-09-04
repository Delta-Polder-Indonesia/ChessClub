/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import Profile from "../../../svg/profile.jsx";
import { useEffect } from "react";
import { useI18n } from "../../../../../../lib/i18n.jsx";
import RatingBox from "./ratingBox.jsx";
import { Chess } from "chess.js";
function isEndOpening(position2) {
  let nonDeveloppedBlack = 0, nonDeveloppedWhite = 0;
  for (const square of position2[0]) {
    if (square?.color === "w") continue;
    if (square?.type === "n" || square?.type === "b" || square?.type === "q") nonDeveloppedBlack++;
  }
  for (const square of position2[position2.length - 1]) {
    if (square?.color === "b") continue;
    if (square?.type === "n" || square?.type === "b" || square?.type === "q") nonDeveloppedWhite++;
  }
  const developpedBlack = 5 - nonDeveloppedBlack;
  const developpedWhite = 5 - nonDeveloppedWhite;
  if (developpedBlack >= 3 && developpedWhite >= 2) return true;
  if (developpedWhite >= 3 && developpedBlack >= 2) return true;
  if (developpedBlack >= 4) return true;
  if (developpedWhite >= 4) return true;
}
function isEndMiddlegame(position2) {
  let whitePieces = 0, blackPieces = 0;
  for (const row of position2) {
    for (const square of row) {
      if (square?.type === "r" || square?.type === "n" || square?.type === "b" || square?.type === "q") {
        if (square.color === "w") whitePieces++;
        else blackPieces++;
      }
    }
  }
  if (whitePieces <= 2 && blackPieces <= 2) return true;
  if (whitePieces <= 1 || blackPieces <= 1) return true;
}
function avg(arr) {
  // Tanpa penjagaan ini, daftar kosong menghasilkan 0/0 = NaN dan panel
  // ringkasan menampilkan "NaN" alih-alih angka akurasi.
  if (!arr?.length) return NaN;
  const sum = arr.reduce((acc, cur) => acc + cur, 0);
  return sum / arr.length;
}

/** Akurasi siap tampil; "-" bila belum ada langkah yang bisa dinilai. */
function formatAkurasi(nilai) {
  return Number.isFinite(nilai) ? nilai.toFixed(1) : "-";
}
function pushAccuracyPhase(arr, value, phase, color) {
  arr[phase][color].push(value);
}
function pushAccuracy(arr, value, color) {
  arr[color].push(value);
}
function PlayersAccuracy(props) {
  const { t } = useI18n();
  const { players: players2, setAccuracyPhases, moves } = props;
  const [accuracy, setAccuracy] = props.accuracy;
  useEffect(() => {
    const accuracies = { w: [], b: [] };
    const accuraciesPhases = { opening: { w: [], b: [] }, middlegame: { w: [], b: [] }, endgame: { w: [], b: [] } };
    let currentPhase = "opening";
    for (const move2 of moves) {
      if (!move2) continue;
      let board;
      try {
        board = new Chess(move2.fen).board();
      } catch {
        continue;
      }
      const color = move2.color === "w" ? "b" : "w";
      const rating = move2.moveRating;
      let moveAccuracy = NaN;
      switch (rating) {
        case "brilliant":
        case "great":
        case "best":
        case "book":
          moveAccuracy = 100;
          break;
        case "excellent":
          moveAccuracy = 90;
          break;
        case "good":
          moveAccuracy = 70;
          break;
        case "inaccuracy":
        case "miss":
          moveAccuracy = 30;
          break;
        case "mistake":
          moveAccuracy = 20;
          break;
        case "blunder":
          moveAccuracy = 0;
          break;
      }
      if (isNaN(moveAccuracy)) continue;
      pushAccuracy(accuracies, moveAccuracy, color);
      switch (currentPhase) {
        case "opening":
          pushAccuracyPhase(accuraciesPhases, moveAccuracy, "opening", color);
          if (isEndOpening(board)) currentPhase = "middlegame";
          break;
        case "middlegame":
          pushAccuracyPhase(accuraciesPhases, moveAccuracy, "middlegame", color);
          if (isEndMiddlegame(board)) currentPhase = "endgame";
          break;
        case "endgame":
          pushAccuracyPhase(accuraciesPhases, moveAccuracy, "endgame", color);
          break;
      }
    }
    const newAccuracy = { w: avg(accuracies.w), b: avg(accuracies.b) };
    setAccuracy(newAccuracy);
    setAccuracyPhases(accuraciesPhases);
  }, [moves]);
  return <div className="w-[85%] flex flex-col items-end gap-3">
            <div className="reduceSummary:w-[262px] w-[160px] flex flex-row justify-between font-semibold text-sm">
                <div className="reduceSummary:w-20 w-16 flex flex-row justify-center whitespace-nowrap overflow-visible"><span>{players2[0].name}</span></div>
                <div className="reduceSummary:w-20 w-16 flex flex-row justify-center whitespace-nowrap overflow-visible"><span>{players2[1].name}</span></div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="text-sm font-semibold text-foregroundGrey">{t("analisa.ringkasan.pemain")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <div className="reduceSummary:h-20 reduceSummary:w-20 h-16 w-16 flex flex-row justify-center items-end bg-backgroundProfileWhite rounded-borderRoundness">
                        <Profile width={props.reducedSummary ? 58 : 70} height={props.reducedSummary ? 58 : 70} class="fill-foregroundProfileWhite" />
                    </div>
                    <div className="reduceSummary:h-20 reduceSummary:w-20 h-16 w-16 flex flex-row justify-center items-end bg-backgroundProfileBlack rounded-borderRoundness">
                        <Profile width={props.reducedSummary ? 58 : 70} height={props.reducedSummary ? 58 : 70} class="fill-foregroundProfileBlack" />
                    </div>
                </div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="text-sm font-semibold text-foregroundGrey">{t("analisa.ringkasan.akurasi")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <RatingBox fontSize={props.reducedSummary ? 18 : void 0} width={props.reducedSummary ? 64 : void 0} paddingY={props.reducedSummary ? 4 : void 0} white>{formatAkurasi(accuracy.w)}</RatingBox>
                    <RatingBox fontSize={props.reducedSummary ? 18 : void 0} width={props.reducedSummary ? 64 : void 0} paddingY={props.reducedSummary ? 4 : void 0}>{formatAkurasi(accuracy.b)}</RatingBox>
                </div>
            </div>
        </div>;
}
export {
  avg,
  PlayersAccuracy as default
};
