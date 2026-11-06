/**
 * Tombol navigasi tinjau (|< < > >|) dan deretan aksi (balik, suara, lanjut
 * otomatis, analisa, acak, lewati/selanjutnya).
 */
import { Pause, Play, Repeat, SearchCheck, Shuffle, Volume2, VolumeX } from "lucide-react";
import {
  ArrowRightIcon,
  ChevronStartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronEndIcon,
} from "../../../components/icons.jsx";
import { useI18n } from "../../../lib/i18n.jsx";
import { SUARA, mainkanSuara } from "../../../lib/suara.js";

export default function KontrolLangkah({
  onKeAwal = null,
  onMundur = null,
  onMaju = null,
  onKeAkhir = null,
  bisaMundur = false,
  bisaMaju = false,
  onFlip = null,
  nilaiSuara = true,
  onGantiSuara = null,
  nilaiOtomatis = false,
  onGantiOtomatis = null,
  onBukaAnalisa = null,
  onAcak = null,
  onLewati = null,
  teksCekmat = "",
  selesai = false,
  memuat = false,
  memuatKoleksi = false,
}) {
  const { t } = useI18n();
  return (
    <div className="flex-shrink-0 mt-auto p-3 bg-[#1e1c18] border-t border-[#312e2b] space-y-3">
                <div className="flex items-center gap-1 bg-[#262421] p-1 rounded-lg border border-[#312e2b]">
                  <button
                    type="button"
                    onClick={onKeAwal}
                    disabled={!bisaMundur}
                    title={t("papan.keAwal")}
                    aria-label={t("papan.keAwal")}
                    className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <ChevronStartIcon className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={onMundur}
                    disabled={!bisaMundur}
                    title={t("tekaTeki.mundurSatu")}
                    aria-label={t("tekaTeki.mundurSatu")}
                    className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <ChevronLeftIcon className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={onMaju}
                    disabled={!bisaMaju}
                    title={t("tekaTeki.majuSatu")}
                    aria-label={t("tekaTeki.majuSatu")}
                    className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <ChevronRightIcon className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={onKeAkhir}
                    disabled={!bisaMaju}
                    title={t("papan.keAkhir")}
                    aria-label={t("papan.keAkhir")}
                    className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <ChevronEndIcon className="size-5" />
                  </button>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400">
                  <button
                    type="button"
                    onClick={onFlip}
                    title={t("tekaTeki.balikPapan")}
                    aria-label={t("tekaTeki.balikPapan")}
                    className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
                  >
                    <Repeat className="w-5 h-5" aria-hidden="true" />
                    <span>{t("tekaTeki.balik")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!onGantiSuara) return;
                      if (!nilaiSuara) mainkanSuara(SUARA.tesSuara);
                      onGantiSuara(!nilaiSuara);
                    }}
                    aria-pressed={nilaiSuara}
                    aria-label={nilaiSuara ? t("tekaTeki.suaraMatikan") : t("tekaTeki.suaraHidupkan")}
                    title={nilaiSuara ? t("tekaTeki.suaraMatikan") : t("tekaTeki.suaraHidupkan")}
                    /* Saat senyap label tetap harus terbaca: #b33430 hanya 2,54:1 di atas
                       #262421, sedangkan #e2655c mencapai 4,61:1 (AA). Ikon VolumeX
                       tetap menjadi penanda status yang tidak bergantung warna. */
                    className={`flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] rounded-lg transition border border-[#312e2b] cursor-pointer ${nilaiSuara ? "text-white" : "text-[#e2655c]"}`}
                  >
                    {nilaiSuara ? (
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <VolumeX className="w-5 h-5" aria-hidden="true" />
                    )}
                    <span className="text-xs font-semibold">
                      {t("tekaTeki.suara")}
                    </span>
                  </button>
                  {onGantiOtomatis && (
                    <button
                      type="button"
                      data-aksi="toggle-otomatis"
                      onClick={() => onGantiOtomatis(!nilaiOtomatis)}
                      aria-label={
                        nilaiOtomatis
                          ? t("tekaTeki.otomatisMatikan")
                          : t("tekaTeki.otomatisNyalakan")
                      }
                      aria-pressed={nilaiOtomatis}
                      title={t("tekaTeki.lanjutOtomatis")}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border border-[#312e2b] p-2.5 transition cursor-pointer ${
                        nilaiOtomatis
                          ? "bg-[#81b64c]/20 text-[#a3d168]"
                          : "bg-[#262421] text-gray-400 hover:bg-[#312e2b] hover:text-white"
                      }`}
                    >
                      {nilaiOtomatis ? (
                        <Pause className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Play className="h-5 w-5" aria-hidden="true" />
                      )}
                      <span className="text-xs font-semibold">
                        {nilaiOtomatis ? t("tekaTeki.jeda") : t("tekaTeki.autoLanjut")}
                      </span>
                    </button>
                  )}
                  {onBukaAnalisa && (
                    <button
                      type="button"
                      data-aksi="buka-analisa"
                      onClick={onBukaAnalisa}
                      disabled={!selesai || memuat || memuatKoleksi}
                      aria-label={t("tekaTeki.analisa")}
                      title={t("tekaTeki.analisa")}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition border border-[#312e2b] ${
                        selesai && !memuat && !memuatKoleksi
                          ? "bg-[#262421] hover:bg-[#312e2b] hover:text-white cursor-pointer"
                          : "bg-[#262421] text-gray-500 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <SearchCheck className="w-5 h-5" aria-hidden="true" />
                      <span>{t("tekaTeki.analisa")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onAcak}
                    title={t("tekaTeki.soalAcak")}
                    aria-label={t("tekaTeki.soalAcak")}
                    className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
                  >
                    <Shuffle className="w-5 h-5" aria-hidden="true" />
                    <span>{t("tekaTeki.acak")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLewati}
                    title={teksCekmat ? t("tekaTeki.selanjutnya") : t("tekaTeki.lewati")}
                    aria-label={teksCekmat ? t("tekaTeki.selanjutnya") : t("tekaTeki.lewati")}
                    className="flex flex-col items-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#312e2b] hover:text-white rounded-lg transition border border-[#312e2b] cursor-pointer"
                  >
                    <ArrowRightIcon className="w-5 h-5" />
                    <span>{teksCekmat ? t("tekaTeki.selanjutnya") : t("tekaTeki.lewati")}</span>
                  </button>
                </div>
              </div>
  );
}
