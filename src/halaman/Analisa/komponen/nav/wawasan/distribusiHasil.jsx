/** Distribusi hasil (menang/seri/kalah) keseluruhan dan per warna bidak. */
import { BarHasil } from "../../../akun/DaftarPembukaanAkun.jsx";

function DistribusiHasil({ umum, putih, hitam, t }) {
  const baris = [
    { label: t("analisa.wawasan.hasil.semua"), counts: umum },
    { label: t("analisa.wawasan.hasil.putih"), counts: putih },
    { label: t("analisa.wawasan.hasil.hitam"), counts: hitam },
  ];

  return (
    <div className="wawasan-card">
      <h3 className="wawasan-card-title">{t("analisa.wawasan.distribusiJudul")}</h3>
      <p className="text-xs text-foregroundGrey">{t("analisa.statistik.totalGame", { total: umum.total })}</p>
      <div className="pt-2">
        <BarHasil w={umum.wins} d={umum.draws} l={umum.losses} tinggi="1.6rem" />
      </div>
      <div className="flex flex-col gap-3 pt-2">
        {baris.map((b) => (
          <BarisHasil key={b.label} label={b.label} counts={b.counts} />
        ))}
      </div>
      <div className="flex gap-4 pt-2 text-xs text-foregroundGrey border-t border-border mt-2">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-highlightBest" /> {t("analisa.wawasan.hasil.menang")}</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-foregroundGrey" /> {t("analisa.wawasan.hasil.seri")}</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-highlightBlunder" /> {t("analisa.wawasan.hasil.kalah")}</span>
      </div>
    </div>
  );
}

function BarisHasil({ label, counts }) {
  const { wins, losses, draws, total, winRate } = counts;
  const winPct = total > 0 ? (wins / total) * 100 : 0;
  const drawPct = total > 0 ? (draws / total) * 100 : 0;
  const lossPct = total > 0 ? (losses / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-xs text-foregroundGrey">
          <strong className="text-highlightBest">{winRate}%</strong> ({wins}M / {draws}S / {losses}K)
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-sm bg-backgroundBoxBox">
        {total === 0 ? (
          <div className="h-full w-full bg-backgroundBoxBox" />
        ) : (
          <>
            {winPct > 0 && <div className="h-full bg-highlightBest transition-[width] duration-300" style={{ width: `${winPct}%` }} />}
            {drawPct > 0 && <div className="h-full bg-foregroundGrey transition-[width] duration-300" style={{ width: `${drawPct}%` }} />}
            {lossPct > 0 && <div className="h-full bg-highlightBlunder transition-[width] duration-300" style={{ width: `${lossPct}%` }} />}
          </>
        )}
      </div>
    </div>
  );
}

export default DistribusiHasil;
