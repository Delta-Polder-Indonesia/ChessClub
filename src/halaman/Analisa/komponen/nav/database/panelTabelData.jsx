/**
 * Kolom kanan Database saat mode "tabel": tab Partai/Pemain/Event, kotak cari,
 * tabel partai + paginasi, serta rekap pemain & event.
 *
 * Markup murni — state, pemuatan, dan cache tetap di `layarDatabase.jsx`.
 * Nama prop sengaja sama dengan nama state induk.
 */
import { useI18n } from "../../../../../lib/i18n.jsx";
import Database from "../../svg/database.jsx";
import DualRingSpinner from "../../loading/DualRingSpinner.jsx";
import { JUMLAH_BARIS_SKELETON, daftarHalaman, BIRU, formatTanggal } from "./formatDatabase.js";
import { HeaderTabel, BarisSkeleton, BarisPartai } from "./tabelPartai.jsx";
import { IkonSearch } from "./ikonDatabase.jsx";

export default function PanelTabelData({
  tampilan,
  setTampilan,
  cari,
  setCari,
  daftarPartai,
  memuat,
  locale,
  koleksi,
  tanganiAnalisa,
  urut,
  ubahUrut,
  onBukaAkun,
  filterHasil,
  filterWaktu,
  totalHal,
  aktifHal,
  setHal,
  totalPartai,
  daftarPemainTampil,
  memuatPemain,
  daftarEventTampil,
  memuatEvent,
}) {
  const { t } = useI18n();

  return (
    <>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pb-2.5 shrink-0">
        <div
          role="tablist"
          aria-label={t("analisa.basisData.judul")}
          className="flex shrink-0 rounded-borderRoundness border border-border bg-backgroundBoxBox p-0.5 w-full sm:w-auto overflow-x-auto"
        >
          {[
            { k: "partai", label: t("analisa.basisData.dataGames") },
            { k: "pemain", label: t("analisa.basisData.dataPlayers") },
            { k: "event", label: t("analisa.basisData.dataEvents") },
          ].map((tab) => (
            <button
              key={tab.k}
              type="button"
              role="tab"
              aria-selected={tampilan === tab.k}
              onClick={() => setTampilan(tab.k)}
              className={`cursor-pointer rounded-borderRoundness px-3 py-1 text-xs font-bold transition-colors ${
                tampilan === tab.k
                  ? "bg-backgroundBoxBoxHighlighted text-foregroundBlackDark"
                  : "text-foregroundGrey hover:text-foregroundHighlighted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pencarian berlaku untuk semua tab: tab Partai menyaring nama
            pemain/event/isi PGN via basis, tab Pemain & Event menyaring
            rekap yang sudah dimuat secara langsung. */}
        <div className="relative w-full sm:w-56">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foregroundGrey">
            <IkonSearch className="h-4 w-4" />
          </div>
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder={t("analisa.basisData.cariPlaceholder")}
            aria-label={t("analisa.basisData.cariPlaceholder")}
            className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox pl-9 pr-3 py-1.5 text-sm text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      </div>

      {tampilan === "partai" ? (
        <>
      {/* ── Tabel Permainan ─────────────────────────────────────── */}
      {/* flex-1: kotak mengisi sisa tinggi kolom kanan — tabel selalu
          mentok ke bawah, ada isi atau kosong. */}
      <div className="relative w-full min-h-0 flex-1 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
        <table className="w-full h-full min-w-[600px] sm:min-w-[760px] table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "36%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>

          <HeaderTabel urut={urut} ubahUrut={ubahUrut} t={t} />

          <tbody>
            {memuat && daftarPartai.length === 0
              ? Array.from({ length: JUMLAH_BARIS_SKELETON }, (_, i) => (
                  <BarisSkeleton key={`skeleton-${i}`} />
                ))
              : daftarPartai.length > 0
                ? daftarPartai.map((game, i) => (
                    <BarisPartai
                      key={game.id || i}
                      game={game}
                      locale={locale}
                      tanganiAnalisa={tanganiAnalisa}
                      perspectiveUser={koleksi?.username || ""}
                    />
                  ))
                : (
                  <tr>
                    <td colSpan={6} className="h-24 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Database width={32} height={32} className="fill-foregroundGrey/30 mb-1" />
                        <p className="font-bold text-foreground">
                          {t("analisa.basisData.kosongJudul")}
                        </p>
                        <p className="max-w-md text-xs leading-5 text-foregroundGrey">
                          {cari || filterHasil || filterWaktu
                            ? t("analisa.partai.tidakCocok")
                            : t("analisa.basisData.kosongIsi")}
                        </p>
                        {onBukaAkun && !cari && !filterHasil && !filterWaktu ? (
                          <button
                            type="button"
                            onClick={() => onBukaAkun()}
                            className="mt-1 inline-flex items-center gap-1.5 rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-1.5 text-xs font-bold text-foregroundBlackDark hover:bg-backgroundBoxBoxHighlightedHover cursor-pointer"
                          >
                            <span>{t("analisa.basisData.bukaAkun")}</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>

      {/* ── Navigasi Paginasi ───────────────────────────────────── */}
      {/* Nempel langsung di bawah kotak tabel (tanpa mt-auto) — jaraknya
          cukup dari gap-3 kolom induk, tidak ada lompatan ke dasar panel. */}
      <div className="shrink-0">
        {totalHal > 1 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-foregroundGrey">
                {t("analisa.basisData.halaman", {
                  aktif: aktifHal,
                  total: totalHal,
                })}{" "}
                ({totalPartai} partai)
              </span>
            </div>
<div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {daftarHalaman(aktifHal, totalHal).map((hlm) => (
                <button
                  key={hlm}
                  type="button"
                  onClick={() => setHal(hlm)}
                  aria-current={aktifHal === hlm ? "page" : undefined}
                  className={`rounded-borderRoundness px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                    aktifHal === hlm
                      ? "border border-border bg-backgroundBoxBox font-bold text-foregroundHighlighted"
                      : "border border-border bg-backgroundBoxBox text-foreground hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
                  }`}
                >
                  {hlm}
                </button>
              ))}
              <button
                type="button"
                disabled={aktifHal <= 1}
                onClick={() => setHal((h) => Math.max(1, h - 1))}
                className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer"
              >
                {t("analisa.basisData.sebelumnya")}
              </button>
              <button
                type="button"
                disabled={aktifHal >= totalHal}
                onClick={() => setHal((h) => Math.min(totalHal, h + 1))}
                className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-1 text-xs text-foreground transition-colors hover:bg-backgroundBoxBoxHover disabled:opacity-40 disabled:hover:bg-backgroundBoxBox cursor-pointer"
              >
                {t("analisa.basisData.berikutnya")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
        </>
      ) : tampilan === "pemain" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {memuatPemain ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <DualRingSpinner color={BIRU} />
              <p className="text-sm text-foregroundGrey">{t("analisa.basisData.memuatData")}</p>
            </div>
          ) : daftarPemainTampil.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-foregroundGrey">
              {cari ? t("analisa.partai.tidakCocok") : t("analisa.partai.tidakAda")}
            </div>
          ) : (
            <div className="relative w-full min-h-0 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
              <table className="w-full min-w-[480px] sm:min-w-[560px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
                  <tr>
                    <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">ID</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.pemain")}
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.seri")}
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.menang")}
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.kalah")}
                    </th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.tanggal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daftarPemainTampil.map((e, i) => (
                    <tr
                      key={e.nama}
                      className="border-b border-border/50 transition-colors hover:bg-backgroundBoxHover"
                    >
                      <td className="py-2 pl-4 pr-2 whitespace-nowrap text-xs tabular-nums text-foregroundGrey">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 truncate text-[13px] font-medium text-foreground">
                        {e.nama}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-foregroundGrey">
                        {e.seri}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-winGreen">
                        {e.menang}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-lossRed">
                        {e.kalah}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
                        {formatTanggal(e.terakhir, locale) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {memuatEvent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <DualRingSpinner color={BIRU} />
              <p className="text-sm text-foregroundGrey">{t("analisa.basisData.memuatData")}</p>
            </div>
          ) : daftarEventTampil.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-foregroundGrey">
              {cari ? t("analisa.partai.tidakCocok") : t("analisa.partai.tidakAda")}
            </div>
          ) : (
            <div className="relative w-full min-h-0 overflow-y-auto overflow-x-auto border border-border rounded-borderRoundness bg-backgroundBox [scrollbar-gutter:stable] -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
              <table className="w-full min-w-[400px] sm:min-w-[480px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "45%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>
                <thead className="sticky top-0 bg-backgroundBox border-b border-border z-10 select-none">
                  <tr>
                    <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">ID</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      Event
                    </th>
                    <th className="py-2 px-2 text-center text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.dataGames")}
                    </th>
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-wide text-foregroundGrey">
                      {t("analisa.basisData.terakhirMain")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {daftarEventTampil.map((e, i) => (
                    <tr
                      key={e.nama}
                      className="border-b border-border/50 transition-colors hover:bg-backgroundBoxHover"
                    >
                      <td className="py-2 pl-4 pr-2 whitespace-nowrap text-xs tabular-nums text-foregroundGrey">
                        {i + 1}
                      </td>
                      <td className="py-2 px-2 truncate text-[13px] font-medium text-foreground">
                        {e.nama}
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap text-xs tabular-nums text-foreground">
                        {e.jumlah}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-xs text-foregroundGrey">
                        {formatTanggal(e.terakhir, locale) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
