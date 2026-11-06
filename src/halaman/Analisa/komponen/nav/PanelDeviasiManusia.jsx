/**
 * Panel "distribusi manusia" di layar Deteksi engine.
 *
 * Beda dengan panel deteksi utama: yang ini TIDAK memakai Stockfish sama
 * sekali. Ia membandingkan langkah pemain dengan prediksi Maia, sehingga
 * berguna justru untuk peninjau yang ingin melihat "apakah langkah ini wajar
 * bagi manusia rating segini" tanpa menjalankan analisis MultiPV.
 *
 * Model 45 MB hanya diunduh bila tombol ditekan (lihat `useDeviasiManusia`).
 */
import { useI18n } from "../../../../lib/i18n.jsx";
import { useDeviasiManusia } from "./useDeviasiManusia.js";

const KELAS_TOMBOL =
  "w-fit cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted disabled:cursor-not-allowed disabled:opacity-50";

function Bar({ nilai, maks, label }) {
  const persen = maks > 0 ? Math.min(100, Math.max(0, (nilai / maks) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, maks)}
      aria-valuenow={nilai}
      className="h-2 w-full overflow-hidden rounded-md bg-backgroundBoxBox"
    >
      <div
        className="h-full bg-backgroundBoxBoxHighlighted transition-[width] duration-200"
        style={{ width: `${persen}%` }}
      />
    </div>
  );
}

export default function PanelDeviasiManusia({ platform, username, waktu, batas, nonaktif = false, onBukaPartai = null }) {
  const { t } = useI18n();
  const d = useDeviasiManusia({ platform, username, waktu, batas });
  const sibuk = d.status === "menyiapkan" || d.status === "menghitung";
  const bisaMulai = Boolean(username) && !nonaktif && !sibuk;
  const teksUnduh = d.unduh.dariCache
    ? t("analisa.antiCheat.deviasi.memuatCache")
    : t("analisa.antiCheat.deviasi.mengunduh");

  return (
    <section
      data-uji="deviasi-manusia"
      className="flex flex-col gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2"
    >
      <span className="text-sm font-bold text-foreground">{t("analisa.antiCheat.deviasi.judul")}</span>
      <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.deviasi.isi")}</p>

      {d.status === "menyiapkan" ? (
        <div className="flex flex-col gap-2">
          <p role="status" className="text-xs text-foregroundGrey">
            {teksUnduh} {d.unduh.progres > 0 ? `${d.unduh.progres}%` : ""}
          </p>
          <Bar nilai={d.unduh.progres} maks={100} label={teksUnduh} />
        </div>
      ) : null}

      {d.status === "menghitung" ? (
        <div className="flex flex-col gap-2">
          <p role="status" className="text-xs text-foregroundGrey">
            {t("analisa.antiCheat.deviasi.progres", d.progres)}
          </p>
          <Bar nilai={d.progres.ke} maks={d.progres.total} label={t("analisa.antiCheat.deviasi.progres", d.progres)} />
          <button type="button" data-uji="deviasi-batal" onClick={d.batalkan} className={KELAS_TOMBOL}>
            {t("analisa.antiCheat.deviasi.batal")}
          </button>
        </div>
      ) : null}

      {d.status === "galat" ? (
        <p role="alert" className="text-xs leading-4 text-warning">
          {t("analisa.antiCheat.deviasi.gagal", { pesan: d.pesan || "-" })}
        </p>
      ) : null}

      {d.status === "tanpaPartai" ? (
        <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.deviasi.tanpaPartai")}</p>
      ) : null}

      {d.status === "tanpaSampel" ? (
        <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.deviasi.tanpaSampel")}</p>
      ) : null}

      {d.status === "batal" ? (
        <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.deviasi.dibatalkan")}</p>
      ) : null}

      {d.status === "selesai" && d.hasil ? (
        <dl data-uji="deviasi-hasil" className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-foregroundGrey">{t("analisa.antiCheat.deviasi.kejutanRata")}</dt>
          <dd className="text-right font-bold text-foreground">{d.hasil.kejutanRata} bit</dd>
          <dt className="text-foregroundGrey">{t("analisa.antiCheat.deviasi.rataPeringkat")}</dt>
          <dd className="text-right font-bold text-foreground">{d.hasil.rataPeringkatMaia ?? "-"}</dd>
          <dt className="text-foregroundGrey">{t("analisa.antiCheat.deviasi.kejutanTinggi")}</dt>
          <dd className="text-right font-bold text-foreground">{d.hasil.kejutanTinggi}</dd>
          <dt className="text-foregroundGrey">{t("analisa.antiCheat.deviasi.sampel")}</dt>
          <dd className="text-right font-bold text-foreground">
            {t("analisa.antiCheat.deviasi.sampelNilai", {
              n: d.hasil.sampel,
              partai: d.hasil.partaiDinilai,
            })}
          </dd>
        </dl>
      ) : null}

      {d.status === "selesai" && d.hasil?.langkahTersorot?.length ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.deviasi.sorotan")}</span>
          <ul data-uji="deviasi-sorotan" className="flex flex-col gap-1">
            {d.hasil.langkahTersorot.map((l) => {
              const pgn = d.pgnPartai(l.partai);
              return (
                <li key={`${l.partai}-${l.indeks}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-foregroundGrey">
                    {t("analisa.antiCheat.deviasi.sorotanBaris", {
                      partai: l.partai + 1,
                      nomor: l.nomorLangkah,
                      san: l.san,
                      kejutan: l.kejutan,
                    })}
                  </span>
                  {onBukaPartai && pgn ? (
                    <button
                      type="button"
                      data-uji="deviasi-buka"
                      onClick={() => onBukaPartai({ format: "pgn", string: pgn, lompatKe: l.indeks })}
                      className="shrink-0 cursor-pointer rounded-borderRoundness border border-border px-2 py-0.5 text-xs font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted"
                    >
                      {t("analisa.antiCheat.deviasi.buka")}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {d.status === "selesai" ? (
        <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.deviasi.catatan")}</p>
      ) : null}

      {d.status === "selesai" || d.status === "batal" || d.status === "tanpaSampel" || d.status === "galat" || d.status === "tanpaPartai" ? (
        <button type="button" data-uji="deviasi-ulangi" onClick={d.mulai} disabled={!bisaMulai} className={KELAS_TOMBOL}>
          {t("analisa.antiCheat.deviasi.ulangi")}
        </button>
      ) : null}

      {d.status === "kosong" ? (
        <button type="button" data-uji="deviasi-mulai" onClick={d.mulai} disabled={!bisaMulai} className={KELAS_TOMBOL}>
          {t("analisa.antiCheat.deviasi.mulai")}
        </button>
      ) : null}
    </section>
  );
}
