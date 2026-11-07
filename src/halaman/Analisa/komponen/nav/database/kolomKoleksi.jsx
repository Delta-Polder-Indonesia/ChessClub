/**
 * Kolom kiri Database: pencarian koleksi + kartu tiap profil/akun.
 *
 * Semua data dan aksi datang dari induk (`layarDatabase.jsx`); komponen ini
 * hanya markup. Nama prop sengaja sama dengan nama state induk.
 */
import { useI18n } from "../../../../../lib/i18n.jsx";
import Database from "../../svg/database.jsx";
import Trash from "../../svg/trash.jsx";
import Download from "../../svg/download.jsx";
import { formatUkuran } from "./formatDatabase.js";
import { IkonSearch } from "./ikonDatabase.jsx";

export default function KolomKoleksi({
  mode,
  koleksiList,
  daftarKoleksi,
  statMap,
  koleksiTerpilih,
  setKoleksiTerpilih,
  setMode,
  cariKoleksi,
  setCariKoleksi,
  tanganiEksporPgn,
  tanganiHapusKoleksi,
  onBukaAkun,
}) {
  const { t } = useI18n();

  // Sembunyi dalam mode tabel supaya tabel memakai lebar penuh.
  return (
    <div
  className={`flex w-full shrink-0 flex-col gap-3 lg:w-[300px] lg:min-h-0 lg:max-h-none max-h-[45vh] sm:max-h-[38vh] lg:overflow-visible ${
    mode === "tabel" ? "hidden" : "flex"
  }`}
>
  {/* Pencarian koleksi */}
  <div className="relative">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foregroundGrey">
      <IkonSearch className="h-4 w-4" />
    </div>
    <input
      type="search"
      value={cariKoleksi}
      onChange={(e) => setCariKoleksi(e.target.value)}
      placeholder={t("analisa.basisData.cariKoleksi")}
      aria-label={t("analisa.basisData.cariKoleksi")}
      className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox pl-9 pr-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
    />
  </div>

  {koleksiList.length === 0 ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-borderRoundness border border-border bg-backgroundBox p-6 text-center">
      <Database width={32} height={32} className="fill-foregroundGrey/30" />
      <p className="font-bold text-foreground">{t("analisa.basisData.belumAdaKoleksi")}</p>
      <p className="max-w-[220px] text-xs leading-5 text-foregroundGrey">{t("analisa.basisData.kosongIsi")}</p>
      <button
        type="button"
        onClick={() => onBukaAkun?.()}
        className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-1.5 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover"
      >
        {t("analisa.akun.tambahBaru")}
      </button>
    </div>
  ) : daftarKoleksi.length === 0 ? (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-borderRoundness border border-border bg-backgroundBox p-6 text-center">
      <IkonSearch className="h-6 w-6 text-foregroundGrey/50" />
      <p className="text-sm text-foregroundGrey">{t("analisa.partai.tidakCocok")}</p>
    </div>
  ) : (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
      {daftarKoleksi.map((k) => {
        const aktif = k.id === koleksiTerpilih;
        const st = statMap[k.id];
        return (
          <div
            key={k.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              setKoleksiTerpilih(k.id);
              setMode("data");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setKoleksiTerpilih(k.id);
                setMode("data");
              }
            }}
            aria-pressed={aktif}
            className={`flex cursor-pointer flex-col gap-2.5 rounded-[0.4rem] border p-3.5 transition-colors ${
              aktif
                ? "border-[var(--analisa-backgroundBoxBoxHighlighted)] bg-backgroundBox ring-1 ring-[var(--analisa-backgroundBoxBoxHighlighted)]"
                : "border-border bg-backgroundBox hover:border-borderHighlighted"
            }`}
          >
            <div className="flex items-center gap-2">
              <Database
                width={16}
                height={16}
                className={`shrink-0 ${aktif ? "fill-foregroundHighlighted" : "fill-foregroundGrey"}`}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{k.label}</span>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                aria-hidden="true"
                className={`shrink-0 ${aktif ? "text-[#f5a623]" : "text-foregroundGrey/40"}`}
              >
                <path
                  fill="currentColor"
                  d="M12 2l2.9 6.26 6.86.6-5.2 4.5 1.55 6.7L12 17.1 5.89 20.6l1.55-6.7-5.2-4.5 6.86-.6z"
                />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                  {t("analisa.basisData.dataGames")}
                </div>
                <div className="text-base font-bold tabular-nums text-foreground">
                  {st?.jumlah ?? k.jumlahPartai ?? "…"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-foregroundGrey">
                  {t("analisa.basisData.storage")}
                </div>
                <div className="text-base font-bold tabular-nums text-foreground">
                  {st ? formatUkuran(st.ukuran) : "…"}
                </div>
              </div>
            </div>

            {/* Aksi per kartu — stopPropagation agar tidak ikut memilih koleksi */}
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tanganiEksporPgn(k.id);
                }}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-[10px] font-semibold text-foreground transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted cursor-pointer"
              >
                <Download className="h-3 w-3 shrink-0" />
                <span>{t("analisa.basisData.eksporPgn")}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tanganiHapusKoleksi(k.id);
                }}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2 py-1 text-[10px] font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer"
              >
                <Trash className="h-3 w-3 shrink-0" />
                <span>{t("analisa.basisData.hapusKoleksi")}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}

  </div>
  );
}
