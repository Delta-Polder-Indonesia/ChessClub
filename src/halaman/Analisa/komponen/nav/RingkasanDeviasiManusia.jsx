/**
 * Hasil mode Maia di panel HASIL layar Deteksi engine.
 *
 * Panel ini hanya menampilkan hasil — pengaturan ada di panel kiri (bersama
 * daftar mesin), dan tombol mulai/batal memakai tombol yang sama dengan
 * deteksi Stockfish. Dengan begitu layar tetap dua panel, dan Maia tidak
 * menjadi kartu terpisah yang menambah tinggi halaman.
 */
import { useI18n } from "../../../../lib/i18n.jsx";

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

/**
 * @param {object} p
 * @param {ReturnType<typeof import("./useDeviasiManusia.js").useDeviasiManusia>} p.deviasi
 * @param {((muatan: object) => void)|null} [p.onBukaPartai]
 */
export default function RingkasanDeviasiManusia({ deviasi, onBukaPartai = null }) {
  const { t } = useI18n();
  const d = deviasi;
  const teksUnduh = d.unduh.dariCache
    ? t("analisa.antiCheat.deviasi.memuatCache")
    : t("analisa.antiCheat.deviasi.mengunduh");

  return (
    <div className="flex flex-col gap-3">
      {d.status === "menyiapkan" || d.unduh.status === "menyiapkan" || d.unduh.status === "mengunduh" ? (
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
                      onClick={() => onBukaPartai({ format: "pgn", string: pgn, lompatKe: l.indeks, sorotUci: l.uci })}
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
    </div>
  );
}
