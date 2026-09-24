import { formatAngka, formatPersen } from "./utilPapan.js";

export default function LangkahExplorer({ langkah, bahasa, onPilih, t }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[510px] border-collapse text-left text-xs text-gray-300">
        <thead className="bg-[#2c2926] text-gray-200">
          <tr>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.kolomLangkah")}</th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.kolomJumlah")}</th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.kolomPersen")}<br /><span className="font-normal">{t("papan.kolomPutihSeriHitam")}</span></th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">{t("papan.pembukaan")}</th>
          </tr>
        </thead>
        <tbody>
          {langkah.map((item) => {
            const stat = item.stat;
            return (
              <tr key={item.k} className="border-b border-[#312e2b] last:border-b-0 hover:bg-[#2c2926]">
                <td className="px-3 py-2 align-top">
                  <button type="button" onClick={() => onPilih(item.san)} className="font-bold text-[#a3d168] hover:underline">{item.san}</button>
                </td>
                <td className="px-3 py-2 align-top tabular-nums">{stat ? formatAngka(stat.games, bahasa) : "—"}</td>
                <td className="min-w-[145px] px-3 py-2 align-top">
                  {stat ? <HasilBar stat={stat} bahasa={bahasa} /> : "—"}
                </td>
                <td className="px-3 py-2 align-top text-gray-400">{item.nama || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HasilBar({ stat, bahasa }) {
  // Data rusak (NaN/negatif/total > 1) tidak boleh membuat bar meluber.
  const batasi = (nilai) => Math.min(1, Math.max(0, Number(nilai) || 0));
  let putih = batasi(stat.whiteWin);
  let seri = batasi(stat.draw);
  let hitam = batasi(stat.blackWin);
  const total = putih + seri + hitam;
  if (total > 1) {
    putih /= total;
    seri /= total;
    hitam /= total;
  }
  return <>
    <div className="flex h-2 w-full overflow-hidden border border-[#555] bg-[#1e1d1c]">
      <span style={{ width: `${putih * 100}%` }} className="bg-[#e8e6e3]" />
      <span style={{ width: `${seri * 100}%` }} className="bg-[#8a8a8a]" />
      <span style={{ width: `${hitam * 100}%` }} className="bg-[#57534e]" />
    </div>
    <div className="mt-1 whitespace-nowrap text-[10px] text-gray-400">{formatPersen(putih, bahasa)}% / {formatPersen(seri, bahasa)}% / {formatPersen(hitam, bahasa)}%</div>
  </>;
}
