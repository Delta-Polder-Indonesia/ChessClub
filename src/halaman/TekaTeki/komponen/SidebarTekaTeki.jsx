/**
 * Sidebar kiri halaman Teka-Teki: brand, filter koleksi/level/langkah/tema/
 * giliran, input nomor soal, tombol petunjuk, dan tautan atribusi.
 *
 * Diekstrak dari `LayoutTekaTeki` (dulu 89 prop) — sekarang hanya menerima
 * satu objek `kol` berisi nilai filter dan callback-nya.
 */
import { Link } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { useI18n } from "../../../lib/i18n.jsx";
import License from "../../Analisa/komponen/svg/license.jsx";

export default function SidebarTekaTeki({ kol }) {
  const { t } = useI18n();
  return (
            <aside data-sidebar="teka-teki" className="w-full lg:w-[220px] bg-[#1e1c18] flex flex-col justify-between py-4 border-r border-b lg:border-b-0 border-[#312e2b] flex-shrink-0">
              <div>
                {/* Brand */}
                <div className="px-5 mb-4 flex items-center">
                  <span className="font-bold text-[22px] tracking-tight text-white leading-none">
                    Blunder<span className="text-[#81b64c]">Skuad</span>
                  </span>
                </div>

                {/* Filter Controls */}
                <div className="px-5 pt-1 space-y-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="wadah-koleksi" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelKoleksi")}</label>
                    <select
                      id="wadah-koleksi"
                      value={kol.nilai}
                      onChange={(e) => kol.buka && kol.buka(e.target.value)}
                      className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                    >
                      <option value="lichess">{t("tekaTeki.koleksiLichess")}</option>
                      <option value="video">{t("tekaTeki.koleksiVideo")}</option>
                      <option value="legenda">{t("tekaTeki.koleksiLegenda")}</option>
                      <option value="studi">{t("tekaTeki.koleksiStudi")}</option>
                      <option value="arsip">{t("tekaTeki.koleksiArsip")}</option>
                    </select>
                  </div>

                  {kol.daftarPelatih.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <label htmlFor="wadah-pelatih" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelPelatih")}</label>
                      <select
                        id="wadah-pelatih"
                        value={kol.pelatih}
                        onChange={(e) => kol.setPelatih && kol.setPelatih(e.target.value)}
                        className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                      >
                        <option value="semua">{t("tekaTeki.semuaPelatih")}</option>
                        {kol.daftarPelatih.map(([nama, cacah]) => (
                          <option key={nama} value={nama}>
                            {nama} ({cacah})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label htmlFor="wadah-level" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelLevel")}</label>
                    <select
                      id="wadah-level"
                      value={kol.level}
                      onChange={(e) => kol.setLevel && kol.setLevel(e.target.value)}
                      className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                    >
                      <option value="semua">{t("tekaTeki.semuaLevel")}</option>
                      <option value="1">{t("tekaTeki.sangatMudah")}</option>
                      <option value="2">{t("tekaTeki.mudah")}</option>
                      <option value="3">{t("tekaTeki.normal")}</option>
                      <option value="4">{t("tekaTeki.sulit")}</option>
                      <option value="5">{t("tekaTeki.sangatSulit")}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="wadah-langkah" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelLangkah")}</label>
                    <select
                      id="wadah-langkah"
                      value={kol.langkah}
                      onChange={(e) => kol.setLangkah && kol.setLangkah(e.target.value)}
                      className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                    >
                      <option value="semua">{t("tekaTeki.semua")}</option>
                      <option value="1">{t("tekaTeki.langkahSatu")}</option>
                      <option value="2">{t("tekaTeki.langkahDua")}</option>
                      <option value="3">{t("tekaTeki.langkahTiga")}</option>
                      {kol.nilai !== "lichess" && (
                        <>
                          <option value="4+">{t("tekaTeki.langkahEmpatPlus")}</option>
                          <option value="taktik">{t("tekaTeki.langkahTaktik")}</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="wadah-tema" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelTema")}</label>
                    <select
                      id="wadah-tema"
                      value={kol.tema}
                      onChange={(e) => kol.setTema && kol.setTema(e.target.value)}
                      className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                    >
                      <option value="semua">{t("tekaTeki.semuaTema")}</option>
                      {kol.opsiTema.map((g) => (
                        <optgroup key={g.grup} label={g.grup}>
                          {g.isi.map(([nilai, label]) => (
                            <option key={nilai} value={nilai}>
                              {label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="wadah-giliran" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelGiliran")}</label>
                    <select
                      id="wadah-giliran"
                      value={kol.giliran}
                      onChange={(e) => kol.setGiliran && kol.setGiliran(e.target.value)}
                      className="w-full rounded-md border border-slate-600 bg-[#262421] px-2.5 py-1.5 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                    >
                      <option value="semua">{t("tekaTeki.semuaGiliran")}</option>
                      <option value="White to Move">{t("tekaTeki.hanyaPutih")}</option>
                      <option value="Black to Move">{t("tekaTeki.hanyaHitam")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom sidebar */}
              <div className="px-4 space-y-3 mt-4">
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    kol.bukaNomor?.(e);
                  }}
                >
                  <div className="relative px-1">
                    <p className="mb-1.5 px-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("tekaTeki.labelSoal")}</p>
                    <input
                      type="number"
                      min={1}
                      max={kol.total || undefined}
                      value={kol.nomor}
                      onChange={(e) => kol.setNomor && kol.setNomor(e.target.value)}
                      aria-label={t("tekaTeki.rentangNomor", { total: kol.total || 1 })}
                      placeholder={`1–${kol.total || 1}`}
                      className="w-full bg-[#262421] text-sm text-gray-200 px-3 py-2.5 rounded-md border border-[#363431] focus:outline-none focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20 placeholder-gray-400"
                    />
                    {kol.galatNomor && (
                      <p role="alert" className="mt-1 px-1 text-[11px] font-medium text-red-400">
                        {kol.galatNomor}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#81b64c] hover:bg-[#a3d168] text-[#1e1c18] font-bold py-2.5 px-3 rounded-md text-sm transition shadow-lg shadow-[#81b64c]/20 cursor-pointer"
                  >
                    {t("tekaTeki.buka")}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={kol.hint}
                  disabled={!kol.bisaHint}
                  title={t("tekaTeki.petunjuk")}
                  className="w-full bg-[#363431] hover:bg-[#45423e] text-white font-semibold py-2.5 px-3 rounded-md text-sm transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#363431]"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-400" aria-hidden="true" />
                  {t("tekaTeki.petunjuk")}
                </button>
                <div className="pt-3 flex justify-center text-gray-300 text-xs border-t border-[#312e2b]">
                  <Link
                    to="/program-kami/atribusi"
                    className="flex items-center gap-1.5 hover:text-white transition"
                  >
                    <License size={14} class="fill-current" />
                    {t("papan.menuAtribusi")}
                  </Link>
                </div>
              </div>
            </aside>
  );
}
