/**
 * Bilah kontrol mesin (kecepatan analisis + tombol "mainkan saran"), tampil
 * hanya saat engine menyala.
 */
import { useI18n } from "../../../lib/i18n.jsx";

export default function KontrolMesin({
  engineNyala = false,
  kecepatanEngine = 800,
  opsiKecepatan = [],
  onGantiKecepatan = null,
  pvSanEngine = [],
  onMainkanSaran = null,
}) {
  const { t } = useI18n();
  if (!engineNyala) return null;
  return (
    <div className="flex-shrink-0 border-b border-[#312e2b] bg-[#1e1c18] px-3 py-2 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{t("tekaTeki.kecepatanMesin")}</span>
                    <select
                      value={kecepatanEngine}
                      onChange={(e) => onGantiKecepatan && onGantiKecepatan(Number(e.target.value))}
                      className="rounded-md border border-[#363431] bg-[#262421] px-2 py-1 text-xs text-gray-200 outline-none transition focus:border-[#81b64c]"
                    >
                      {opsiKecepatan.map(([ms, label]) => (
                        <option key={ms} value={ms}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {pvSanEngine.length > 0 && onMainkanSaran && (
                    <button
                      type="button"
                      onClick={() => onMainkanSaran(pvSanEngine[0])}
                      className="w-full rounded-md bg-[#363431] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#45423e]"
                    >
                      {t("tekaTeki.mainkanSaran", { san: pvSanEngine[0] })}
                    </button>
                  )}
                </div>
  );
}
