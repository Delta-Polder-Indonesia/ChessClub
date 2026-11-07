/**
 * Kolom kanan Database saat mode "data": ringkasan koleksi + aksi hapus semua.
 *
 * Markup murni; state dan pemuatan data tetap di `layarDatabase.jsx`.
 */
import { useI18n } from "../../../../../lib/i18n.jsx";
import Database from "../../svg/database.jsx";
import Trash from "../../svg/trash.jsx";
import { TabelRingkasan } from "./tabelRingkasan.jsx";

export default function PanelRingkasanDatabase({
  koleksi,
  koleksiTerpilih,
  locale,
  revisiRingkasan,
  tanganiAnalisa,
  tanganiKosongkanSemua,
  totalPartai,
}) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-borderRoundness border border-border bg-backgroundBox p-4">
  {koleksi ? (
    <>
      <TabelRingkasan
        koleksiId={koleksiTerpilih}
        t={t}
        locale={locale}
        revisi={revisiRingkasan}
        username={koleksi?.username || ""}
        tanganiAnalisa={tanganiAnalisa}
      />

      {!koleksiTerpilih && totalPartai > 0 ? (
        <>
          <hr className="shrink-0 border-border" />

          <div className="shrink-0">
            <div className="text-xs font-bold uppercase tracking-wide text-foregroundGrey">{t("analisa.basisData.aksi")}</div>
            <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
              <button type="button" onClick={tanganiKosongkanSemua} className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border bg-backgroundBoxBox px-2.5 py-1.5 text-xs font-semibold text-lossRed transition-colors hover:bg-backgroundBoxBoxHover cursor-pointer">
                <Trash className="h-3.5 w-3.5 shrink-0" />
                <span>{t("analisa.basisData.hapusSemua")}</span>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  ) : (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
      <Database width={32} height={32} className="fill-foregroundGrey/30" />
      <p className="font-bold text-foreground">{t("analisa.basisData.belumAdaKoleksi")}</p>
    </div>
  )}
</div>
  );
}
