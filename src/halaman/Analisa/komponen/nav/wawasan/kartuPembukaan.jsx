/** Kartu pembukaan teratas dengan tab Semua/Putih/Hitam. */
import { useState } from "react";
import DaftarPembukaanAkun from "../../../akun/DaftarPembukaanAkun.jsx";

export function KartuPembukaanTeratas({
  rekapAkun = { putih: [], hitam: [] },
  putih = [],
  hitam = [],
  t,
}) {
  const [warna, setWarna] = useState("all");
  const daftarAkunPutih = rekapAkun?.putih || [];
  const daftarAkunHitam = rekapAkun?.hitam || [];
  const jumlahSemua = daftarAkunPutih.length + daftarAkunHitam.length;
  const daftarTab = [
    { kunci: "all", label: t("analisa.wawasan.filterSemua"), jumlah: jumlahSemua },
    { kunci: "white", label: t("analisa.wawasan.sebagaiPutih"), jumlah: putih.length, daftar: putih },
    { kunci: "black", label: t("analisa.wawasan.sebagaiHitam"), jumlah: hitam.length, daftar: hitam },
  ];
  const aktif = daftarTab.find((item) => item.kunci === warna) || daftarTab[0];
  const modeSemua = aktif.kunci === "all";
  const openings = modeSemua ? [] : aktif.daftar;
  const kosong = modeSemua ? jumlahSemua === 0 : openings.length === 0;

  return (
    <div className="wawasan-card flex min-h-0 flex-1 flex-col" data-uji="wawasan-pembukaan">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.pembukaanJudul")}</h3>
        <div
          className="flex rounded-borderRoundness bg-backgroundBoxBox p-0.5"
          role="tablist"
          aria-label={t("analisa.wawasan.pembukaanJudul")}
        >
          {daftarTab.map((tab) => {
            const terpilih = aktif.kunci === tab.kunci;
            return (
              <button
                key={tab.kunci}
                type="button"
                role="tab"
                data-uji={`wawasan-pembukaan-tab-${tab.kunci}`}
                aria-selected={terpilih}
                onClick={() => setWarna(tab.kunci)}
                className={`cursor-pointer rounded-borderRoundness px-2 py-1 text-xs font-medium transition-colors ${
                  terpilih
                    ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark font-bold"
                    : "text-foregroundGrey hover:text-foreground"
                }`}
              >
                {tab.label} ({tab.jumlah})
              </button>
            );
          })}
        </div>
      </div>

      {kosong ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.tanpaPembukaan")}</p>
        </div>
      ) : modeSemua ? (
        <div
          data-uji="wawasan-pembukaan-daftar"
          className="mt-2 min-h-0 flex-1"
        >
          <DaftarPembukaanAkun putih={daftarAkunPutih} hitam={daftarAkunHitam} />
        </div>
      ) : (
        <div
          data-uji="wawasan-pembukaan-daftar"
          className="mt-2 max-h-[34rem] min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]"
        >
          <table className="w-full table-fixed text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-backgroundBoxDarker shadow-[inset_0_-1px_0_0_var(--analisa-border)]">
              <tr className="text-foregroundGrey">
                <th className="w-[32%] py-1.5 px-1 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.nama")}</th>
                <th className="w-[35%] py-1.5 px-1 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.langkah")}</th>
                <th className="w-[11%] py-1.5 px-0.5 text-right font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.main")}</th>
                <th className="w-[12%] py-1.5 px-1 text-right font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.winRate")}</th>
                <th className="w-[10%] py-1.5 px-1 text-left font-bold uppercase tracking-wide text-[10px]">{t("analisa.wawasan.pembukaan.hasil")}</th>
              </tr>
            </thead>
            <tbody>
              {openings.map((op, idx) => {
                const winPct = op.played > 0 ? (op.wins / op.played) * 100 : 0;
                const drawPct = op.played > 0 ? (op.draws / op.played) * 100 : 0;
                const lossPct = op.played > 0 ? (op.losses / op.played) * 100 : 0;
                return (
                  <tr key={`${op.name}-${idx}`} className="border-b border-border/30">
                    <td className="min-w-0 overflow-hidden py-1 px-1">
                      <div className="flex min-w-0 items-center gap-1">
                        {op.eco && <span className="rounded border border-border bg-backgroundBoxBox px-1 py-0.5 font-mono text-[10px] text-highlightBest font-bold">{op.eco}</span>}
                        <span className="min-w-0 truncate font-semibold text-foreground" title={op.name}>{op.name}</span>
                      </div>
                    </td>
                    <td className="min-w-0 overflow-hidden py-1.5 px-1 font-mono text-[10px] text-foregroundGrey"><span className="block truncate" title={op.moves || "\u2014"}>{op.moves || "\u2014"}</span></td>
                    <td className="py-1 px-0.5 text-right font-mono text-foregroundGrey" title={`${op.played} kali dimainkan`}>{op.played}</td>
                    <td className="py-1 px-0.5 text-right font-mono font-bold text-highlightBest" title={`Win rate: ${op.winRate}%`}>{op.winRate}%</td>
                    <td className="min-w-0 py-1 px-1">
                      <div className="flex h-2 w-full max-w-16 overflow-hidden rounded-sm bg-backgroundBoxBox" title={`Menang ${op.wins}, seri ${op.draws}, kalah ${op.losses}`}>
                        {winPct > 0 && <div className="h-full bg-highlightBest" style={{ width: `${winPct}%` }} />}
                        {drawPct > 0 && <div className="h-full bg-foregroundGrey" style={{ width: `${drawPct}%` }} />}
                        {lossPct > 0 && <div className="h-full bg-highlightBlunder" style={{ width: `${lossPct}%` }} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default KartuPembukaanTeratas;
