import { useId } from "react";
import { DAFTAR_SET } from "../../components/chess/ChessPiece.jsx";
import KartuKomentator from "../../components/KartuKomentator.jsx";
import { gunakanDialog } from "./gunakanDialog.js";
import { PILIHAN_WARNA_PAPAN } from "./konstanta.js";

/**
 * Popup "Pengaturan Papan" — set bidak, suara, panah engine, tampilan penuh
 * basis data awan, warna papan, plus kontrol komentator. Dipisah dari
 * PapanInteraktif.jsx agar modal pengaturan mudah dirawat sendiri.
 *
 * @param {object} p
 * @param {() => void} p.onTutup                 tutup popup
 * @param {string} p.bidak                       id set bidak yang sedang aktif
 * @param {(id: string) => void} p.setSetBidak   ganti set bidak
 * @param {object} p.kartuKomentator properti yang diteruskan apa adanya ke
 *        <KartuKomentator> (nyala, setNyala, gaya, setGaya, t)
 */
export default function PopupPengaturan({
  onTutup,
  t,
  bidak,
  setSetBidak,
  suaraNyala,
  setSuaraNyala,
  tampilPanahMesin,
  setTampilPanahMesin,
  awanTampilanPenuh,
  setAwanTampilanPenuh,
  warnaPapan,
  setWarnaPapan,
  kartuKomentator,
}) {
  const refDialog = gunakanDialog(onTutup);
  const idSetBidak = useId();
  return (
    <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={onTutup}
                  ><div ref={refDialog}
                      tabIndex={-1}
                      role="dialog"
                      aria-modal="true"
                      aria-label={t("papan.pengaturanPapan")}
                      className="w-full max-w-sm rounded-lg border border-[#312e2b] bg-[#1e1c18] p-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">{t("papan.pengaturanPapan")}</h3>
                        <button
                          type="button"
                          onClick={onTutup}
                          className="text-gray-400 transition hover:text-gray-200"
                          title={t("papan.tutup")}
                          aria-label={t("papan.tutup")}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor={idSetBidak} className="text-sm font-semibold text-gray-400">
                            {t("papan.setBidak")}
                          </label>
                          <select
                            id={idSetBidak}
                            data-autofokus
                            value={bidak}
                            onChange={(e) => setSetBidak(e.target.value)}
                            className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                          >
                            {DAFTAR_SET.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nama}
                              </option>
                            ))}
                          </select>
                        </div>
                        <label className="flex cursor-pointer items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-400">
                            {t("papan.suara")}
                          </span>
                          <input
                            type="checkbox"
                            checked={suaraNyala}
                            onChange={(e) => setSuaraNyala(e.target.checked)}
                            className="h-4 w-4 accent-[#81b64c]"
                          />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-400">
                            {t("papan.enginePanahToggle")}
                          </span>
                          <input
                            type="checkbox"
                            checked={tampilPanahMesin}
                            onChange={(e) => setTampilPanahMesin(e.target.checked)}
                            aria-label={t("papan.enginePanahToggle")}
                            className="h-4 w-4 accent-[#81b64c]"
                          />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-400">
                            {t("papan.awanTampilanPenuh")}
                          </span>
                          <input
                            type="checkbox"
                            checked={awanTampilanPenuh}
                            onChange={(e) => setAwanTampilanPenuh(e.target.checked)}
                            aria-label={t("papan.awanTampilanPenuh")}
                            className="h-4 w-4 accent-[#81b64c]"
                          />
                        </label>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="warna-papan" className="text-sm font-semibold text-gray-400">{t("papan.warnaPapan")}</label>
                          <select
                            id="warna-papan"
                            value={warnaPapan}
                            onChange={(e) => setWarnaPapan(e.target.value)}
                            className="rounded-md border border-[#363431] bg-[#262421] px-3 py-2 text-sm text-gray-200 outline-none transition focus:border-[#81b64c] focus:ring-2 focus:ring-[#81b64c]/20"
                          >
                            {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => <option key={nilai} value={nilai}>{t(kunci)}</option>)}
                          </select>
                        </div>
                        <div className="border-t border-[#312e2b] pt-3">
                          <KartuKomentator {...kartuKomentator} hanyaKontrol />
                        </div>
                      </div>
                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={onTutup}
                          className="rounded-md border border-[#81b64c] bg-[#81b64c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a3d168]"
                        >
                          {t("papan.tutup")}
                        </button>
                      </div>
                    </div>
                  </div>
  );
}
