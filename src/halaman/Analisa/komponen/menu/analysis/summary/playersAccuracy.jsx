/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import Profile from "../../../svg/profile.jsx";
import { useEffect } from "react";
import { useI18n } from "../../../../../../lib/i18n.jsx";
import { useKartuPemain } from "../../../../../../lib/pemainCatur.js";
import RatingBox from "./ratingBox.jsx";
import { Chess } from "chess.js";
/*
 * Pembanding fase dipindah ke modul bersama `mesin/fase.js` (isi & ambangnya
 * identik) karena perhitungan anti-cheat memakai batas fase yang sama.
 * Urutan pemindaian di bawah TIDAK berubah: langkah tetap dicatat ke fase
 * yang sedang aktif, baru kemudian fasenya dimajukan.
 */
import { isEndOpening, isEndMiddlegame } from "../../../../mesin/fase.js";
import { langkahTerpaksa } from "../../../../mesin/evaluasi.js";
/*
 * Sumber angka baris Akurasi. Sebelumnya komponen ini punya peta label → poin
 * tetap (best 100, excellent 90, good 70, inaccuracy 30, mistake 20, blunder 0)
 * sehingga SATU partai bisa menampilkan DUA akurasi yang berbeda: baris ini
 * memakai poin label, sedangkan kartu Deteksi Engine dan dashboard Wawasan
 * memakai kurva win chance (`mesin/akurasi.js`). Peta itu dihapus — bukan
 * dikalibrasi ulang — supaya satu partai punya satu angka akurasi.
 * Lihat docs/PERBANDINGAN-METRIK-AKURASI.md bagian 5.
 */
import { akurasiMove, pemainDariEntri } from "../../../../mesin/akurasi.js";
import { avg } from "./playersAccuracyData.js";

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
  // Foto profil pemain (avatar) dari API publik chess.com; fallback ikon profil.
  const kartuPutih = useKartuPemain(players2?.[0]?.name);
  const kartuHitam = useKartuPemain(players2?.[1]?.name);
  useEffect(() => {
    const accuracies = { w: [], b: [] };
    const accuraciesPhases = { opening: { w: [], b: [] }, middlegame: { w: [], b: [] }, endgame: { w: [], b: [] } };
    let currentPhase = "opening";
    // `moves[0]` adalah POSISI AWAL (tanpa `san` maupun eval), bukan langkah —
    // `pemainDariEntri` mengembalikannya sebagai `null` dan entri itu lewat.
    // Pelangkah dibaca dari `color` entri (pihak yang bergilir SESUDAH
    // langkah), sama seperti `mover = parseFenSideToMove(ply.fenBefore)` di
    // acuan; paritas indeks hanya cadangan untuk data tanpa `color`.
    moves.forEach((move2, i) => {
      if (!move2) return;
      const color = pemainDariEntri(move2, i);
      /*
       * Akurasi TIDAK memerlukan papan: `akurasiMove` hanya membaca
       * `previousStaticEvals`. FEN rusak (data lama, partai terpotong) jadi
       * tidak lagi membuang akurasi langkah itu — yang hilang hanya catatan
       * fasenya, karena fase memang ditentukan dari susunan papan.
       */
      const moveAccuracy = akurasiMove(move2);
      if (color !== null && Number.isFinite(moveAccuracy)) {
        pushAccuracy(accuracies, moveAccuracy, color);
      }

      let board;
      try {
        board = new Chess(move2.fen).board();
      } catch {
        return;
      }
      /*
       * Langkah paksa tidak mencerminkan keputusan, jadi tidak ikut daftar
       * fase (warisan perilaku lama). Namun ia TETAP ikut baris Akurasi di
       * atas: `summarizeColor` acuan hanya menyaring `status === 'classified'`,
       * dan langkah paksa tetap terklasifikasi. Menyaringnya di sini akan
       * membuat angka Ringkasan berbeda dari angka Wawasan untuk partai yang
       * sama.
       */
      if (langkahTerpaksa(move2)) return;
      if (color === null || !Number.isFinite(moveAccuracy)) return;
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
    });
    const newAccuracy = { w: avg(accuracies.w), b: avg(accuracies.b) };
    setAccuracy(newAccuracy);
    setAccuracyPhases(accuraciesPhases);
  }, [moves, setAccuracy, setAccuracyPhases]);
  return <div className="w-[85%] flex flex-col items-end gap-3">
            <div className="reduceSummary:w-[262px] w-[160px] flex flex-row justify-between font-semibold text-sm">
                <div className="reduceSummary:w-20 w-16 flex flex-row justify-center whitespace-nowrap overflow-visible"><span>{players2[0].name}</span></div>
                <div className="reduceSummary:w-20 w-16 flex flex-row justify-center whitespace-nowrap overflow-visible"><span>{players2[1].name}</span></div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="text-sm font-semibold text-foregroundGrey">{t("analisa.ringkasan.pemain")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <div className="reduceSummary:h-20 reduceSummary:w-20 h-16 w-16 flex flex-row justify-center items-end overflow-hidden bg-backgroundProfileWhite rounded-borderRoundness">
                        {kartuPutih?.avatar ? (
                          <img className="h-full w-full object-cover" width={80} height={80} src={kartuPutih.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        ) : (
                          <Profile width={props.reducedSummary ? 58 : 70} height={props.reducedSummary ? 58 : 70} class="fill-foregroundProfileWhite" />
                        )}
                    </div>
                    <div className="reduceSummary:h-20 reduceSummary:w-20 h-16 w-16 flex flex-row justify-center items-end overflow-hidden bg-backgroundProfileBlack rounded-borderRoundness">
                        {kartuHitam?.avatar ? (
                          <img className="h-full w-full object-cover" width={80} height={80} src={kartuHitam.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        ) : (
                          <Profile width={props.reducedSummary ? 58 : 70} height={props.reducedSummary ? 58 : 70} class="fill-foregroundProfileBlack" />
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-row w-full justify-between items-center">
                <span className="text-sm font-semibold text-foregroundGrey" title={t("analisa.ringkasan.akurasiMetode")}>{t("analisa.ringkasan.akurasi")}</span>
                <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
                    <RatingBox fontSize={props.reducedSummary ? 18 : void 0} width={props.reducedSummary ? 64 : void 0} paddingY={props.reducedSummary ? 4 : void 0} white>{formatAkurasi(accuracy.w)}</RatingBox>
                    <RatingBox fontSize={props.reducedSummary ? 18 : void 0} width={props.reducedSummary ? 64 : void 0} paddingY={props.reducedSummary ? 4 : void 0}>{formatAkurasi(accuracy.b)}</RatingBox>
                </div>
            </div>
        </div>;
}
export default PlayersAccuracy;
