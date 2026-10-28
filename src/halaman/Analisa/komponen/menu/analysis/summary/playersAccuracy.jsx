/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import Profile from "../../../svg/profile.jsx";
import { useEffect, useMemo, useState } from "react";
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
import { akurasiMove, kerugianMove, pemainDariEntri, cpBaku, peluangMenang } from "../../../../mesin/akurasi.js";
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
function formatNilai(nilai, satuan = "") { return Number.isFinite(nilai) ? `${nilai.toFixed(1)}${satuan}` : "-"; }
function buatTitikEvaluasi(moves, mode) {
  return (Array.isArray(moves) ? moves : []).flatMap((move, i) => {
    if (!move || i === 0) return [];
    const evaluasi = cpBaku(move.previousStaticEvals?.[0], false);
    if (!Number.isFinite(evaluasi)) return [];
    const cpPutih = move.color === "b" ? evaluasi : -evaluasi;
    return [{ x: i, y: mode === "wdl" ? peluangMenang(cpPutih) : cpPutih / 100 }];
  });
}
function GrafikEvaluasi({ moves, t }) {
  const [mode, setMode] = useState("cp");
  const titik = useMemo(() => buatTitikEvaluasi(moves, mode), [moves, mode]);
  if (titik.length < 2) return <p className="text-xs text-foregroundGrey">Grafik tersedia setelah evaluasi langkah tersimpan.</p>;
  const lebar = 640, tinggi = 210, kiri = 34, kanan = 12, atas = 12, bawah = 24;
  const min = mode === "wdl" ? 0 : Math.min(-10, ...titik.map(p => p.y));
  const maks = mode === "wdl" ? 100 : Math.max(10, ...titik.map(p => p.y));
  const x = v => kiri + (v / Math.max(1, moves.length - 1)) * (lebar - kiri - kanan);
  const y = v => atas + ((maks - v) / (maks - min)) * (tinggi - atas - bawah);
  const path = titik.map((p, i) => `${i ? "L" : "M"} ${x(p.x).toFixed(1)} ${y(p.y).toFixed(1)}`).join(" ");
  const nol = y(mode === "wdl" ? 50 : 0);
  return <section className="w-full flex flex-col gap-2" aria-label="Grafik evaluasi partai">
    <div className="flex items-center justify-between gap-2 flex-wrap"><span className="text-sm font-semibold text-foreground">Evaluasi sepanjang partai</span>
      <div className="flex gap-1" role="group" aria-label="Mode grafik">
        <button type="button" aria-pressed={mode === "cp"} onClick={() => setMode("cp")} className="rounded px-2 py-1 text-xs border border-border">CP</button>
        <button type="button" aria-pressed={mode === "wdl"} onClick={() => setMode("wdl")} className="rounded px-2 py-1 text-xs border border-border">WDL</button>
      </div></div>
    <div className="w-full overflow-hidden"><svg viewBox={`0 0 ${lebar} ${tinggi}`} role="img" aria-label={mode === "cp" ? "Evaluasi posisi dalam pion dari sudut Putih" : "Peluang menang Putih dalam persen"} className="w-full h-auto">
      {[0,.25,.5,.75,1].map(p => { const yy = atas + p * (tinggi - atas - bawah); return <line key={p} x1={kiri} x2={lebar-kanan} y1={yy} y2={yy} stroke="currentColor" opacity=".12" />; })}
      <line x1={kiri} x2={lebar-kanan} y1={nol} y2={nol} stroke="currentColor" opacity=".45" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <text x={kiri} y={tinggi-5} fontSize="11" fill="currentColor">1</text><text x={lebar-kanan} y={tinggi-5} textAnchor="end" fontSize="11" fill="currentColor">{moves.length-1}</text>
      <text x="4" y="12" fontSize="10" fill="currentColor">{mode === "cp" ? "CP" : "%"}</text></svg></div>
    <div className="flex justify-between gap-2 text-xs text-foregroundGrey"><span>Pembukaan</span><span>Middlegame</span><span>Endgame</span></div>
  </section>;
}

function PlayersAccuracy(props) {
  const { t } = useI18n();
  const { players: players2, setAccuracyPhases, moves } = props;
  const [accuracy, setAccuracy] = props.accuracy;
  // Foto profil pemain (avatar) dari API publik chess.com; fallback ikon profil.
  const kartuPutih = useKartuPemain(players2?.[0]?.name);
  const kartuHitam = useKartuPemain(players2?.[1]?.name);
  const statistik = useMemo(() => {
    const data = { w: { acpl: [], akurasi: [] }, b: { acpl: [], akurasi: [] } };
    (Array.isArray(moves) ? moves : []).forEach((move, i) => {
      const color = pemainDariEntri(move, i);
      if (!color) return;
      const acpl = kerugianMove(move), akurasi = akurasiMove(move);
      if (Number.isFinite(acpl)) data[color].acpl.push(acpl);
      if (Number.isFinite(akurasi)) data[color].akurasi.push(akurasi);
    });
    return Object.fromEntries(["w", "b"].map(color => [color, {
      acpl: data[color].acpl.length ? data[color].acpl.reduce((a,b) => a+b, 0) / data[color].acpl.length : null,
      akurasi: avg(data[color].akurasi)
    }]));
  }, [moves]);
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
            <div className="w-full grid grid-cols-2 gap-2">
              {[
                { color: "w", label: t("analisa.pemain.putih"), tone: "bg-backgroundProfileWhite" },
                { color: "b", label: t("analisa.pemain.hitam"), tone: "bg-backgroundProfileBlack" },
              ].map(({ color, label, tone }) => (
                <div key={color} className={`rounded-borderRoundness border border-border p-3 flex flex-col gap-2 ${tone}`}>
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <div className="flex justify-between items-baseline gap-2"><span className="text-xs text-foregroundGrey">Akurasi</span><strong className="text-xl tabular-nums text-foreground">{formatNilai(statistik[color].akurasi, "%")}</strong></div>
                  <div className="flex justify-between items-baseline gap-2"><span className="text-xs text-foregroundGrey">ACPL</span><strong className="text-xl tabular-nums text-foreground">{formatNilai(statistik[color].acpl, " cp")}</strong></div>
                </div>
              ))}
            </div>
            <div className="w-full"><GrafikEvaluasi moves={moves} t={t} /></div>
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
