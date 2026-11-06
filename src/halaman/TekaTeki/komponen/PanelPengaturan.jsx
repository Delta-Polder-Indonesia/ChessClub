/**
 * Tab "Pengaturan": set bidak, suara, mesin, panah mesin, "Ingat posisi",
 * kartu komentator, dan warna papan.
 */
import { useI18n } from "../../../lib/i18n.jsx";

export default function PanelPengaturan({
  daftarSet = [],
  nilaiSetBidak = "merida",
  onGantiSetBidak = null,
  nilaiSuara = true,
  onGantiSuara = null,
  engineNyala = false,
  onGantiEngine = null,
  tampilPanahMesin = true,
  onGantiPanahMesin = null,
  labelPanahMesin = "",
  nilaiIngatPosisi = true,
  onGantiIngatPosisi = null,
  teksPosisiTersimpan = "",
  teksIngatNonaktif = "",
  kartu = null,
  pilihanWarnaPapan = [],
  nilaiWarnaPapan = "green",
  onGantiWarnaPapan = null,
}) {
  const { t } = useI18n();
  return (
    <div
                  role="tabpanel"
                  id="panel-teka-teki-pengaturan"
                  aria-labelledby="tab-teka-teki-pengaturan"
                  data-panel="pengaturan"
                  className="flex-1 overflow-y-auto min-h-0 p-4"
                >
                  <p className="mb-3 text-sm font-bold text-white">
                    {t("tekaTeki.pengaturan")}
                  </p>
                  <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-3">
                              {daftarSet.length > 0 && onGantiSetBidak && (
                                <div className="flex items-center justify-between gap-3">
                                  <label
                                    htmlFor="sampel-pilih-set-bidak"
                                    className="text-xs font-semibold text-gray-400"
                                  >
                                    {t("papan.setBidak")}
                                  </label>
                                  <select
                                    id="sampel-pilih-set-bidak"
                                    value={nilaiSetBidak}
                                    onChange={(e) => onGantiSetBidak(e.target.value)}
                                    className="w-32 shrink-0 rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                                  >
                                    {daftarSet.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.nama}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {onGantiSuara && (
                                <label className="flex cursor-pointer items-center justify-between gap-3">
                                  <span className="text-xs font-semibold text-gray-400">
                                    {t("papan.suara")}
                                  </span>
                                  <input
                                    type="checkbox"
                                    aria-label={t("papan.suara")}
                                    checked={nilaiSuara}
                                    onChange={(e) => onGantiSuara(e.target.checked)}
                                    className="h-4 w-4 accent-[#81b64c]"
                                  />
                                </label>
                              )}
                              {onGantiEngine && (
                                <label className="flex cursor-pointer items-center justify-between gap-3">
                                  <span className="text-xs font-semibold text-gray-400">
                                    {t("papan.engine")}
                                  </span>
                                  <input
                                    type="checkbox"
                                    data-aksi="toggle-engine"
                                    aria-label={t("papan.engine")}
                                    checked={engineNyala}
                                    onChange={() => onGantiEngine()}
                                    className="h-4 w-4 accent-[#81b64c]"
                                  />
                                </label>
                              )}
                              {onGantiPanahMesin && (
                                <label className="flex cursor-pointer items-center justify-between gap-3">
                                  <span className="text-xs font-semibold text-gray-400">
                                    {labelPanahMesin}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={tampilPanahMesin}
                                    onChange={(e) => onGantiPanahMesin(e.target.checked)}
                                    aria-label={labelPanahMesin}
                                    className="h-4 w-4 accent-[#81b64c]"
                                  />
                                </label>
                              )}
                              {onGantiIngatPosisi && (
                                <div className="grid gap-1">
                                  <label className="flex cursor-pointer items-center justify-between gap-3">
                                    <span className="text-xs font-semibold text-gray-400">
                                      {t("tekaTeki.ingatPosisi")}
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={nilaiIngatPosisi}
                                      onChange={(e) => onGantiIngatPosisi(e.target.checked)}
                                      className="h-4 w-4 accent-[#81b64c]"
                                    />
                                  </label>
                                  {(teksPosisiTersimpan || teksIngatNonaktif) && (
                                    <p className="text-[11px] text-gray-500">
                                      {teksPosisiTersimpan || teksIngatNonaktif}
                                    </p>
                                  )}
                                </div>
                              )}
                              {kartu && (
                                <div className="border-t border-[#312e2b] pt-3">
                                  {kartu}
                                </div>
                              )}
                              {pilihanWarnaPapan.length > 0 && onGantiWarnaPapan && (
                                <div className="flex items-center justify-between gap-3">
                                  <label
                                    htmlFor="sampel-warna-papan"
                                    className="text-xs font-semibold text-gray-400"
                                  >
                                    {t("papan.warnaPapan")}
                                  </label>
                                  <select
                                    id="sampel-warna-papan"
                                    value={nilaiWarnaPapan}
                                    onChange={(e) => onGantiWarnaPapan(e.target.value)}
                                    className="w-32 shrink-0 rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                                  >
                                    {pilihanWarnaPapan.map(([nilai, label]) => (
                                      <option key={nilai} value={nilai}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                  </div>
                </div>
  );
}
