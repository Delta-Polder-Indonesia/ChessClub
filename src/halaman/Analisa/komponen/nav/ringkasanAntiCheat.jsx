import { useI18n } from "../../../../lib/i18n.jsx";
import { MULTI_PV } from "../../mesin/engine.js";
import { DAFTAR_FASE } from "../../mesin/fase.js";

/*
 * Kartu hasil anti-cheat agregat. Warna level memakai token highlight yang
 * sama dengan label langkah (hijau → kuning → merah) supaya satu bahasa warna
 * berlaku di seluruh halaman Analisa.
 */
const KELAS_LEVEL = {
  rendah: "text-highlightBest",
  sedang: "text-highlightInaccuracy",
  tinggi: "text-highlightBlunder",
};

function BarisAntiCheat({ label, nilai, kelas }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-foregroundGrey">{label}</span>
      <span className={`font-bold ${kelas ?? "text-foreground"}`}>{nilai}</span>
    </div>
  );
}

export default function RingkasanAntiCheat({ agregat }) {
  const { t } = useI18n();
  const persen = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : "-");
  const cp = (n) => (Number.isFinite(n) ? `${n.toFixed(1)} cp` : "-");
  const rasio = (n) => (Number.isFinite(n) ? `${Math.round(n * 100)}%` : "-");
  const level = agregat.level ?? "tidakAda";
  const arah = agregat.tren?.arah ?? "tidakAda";
  const jumlahBuktiTerbanyak = Math.max(
    0,
    ...Object.values(agregat.sampelMetrik ?? { kecocokan: agregat.jumlahLangkah }).filter(Number.isFinite)
  );

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.skor")}</span>
          <span className={`text-4xl font-bold leading-none ${KELAS_LEVEL[level] ?? "text-foreground"}`}>
            {Number.isFinite(agregat.skor) ? agregat.skor : "-"}
          </span>
        </div>
        <span className={`text-sm font-bold ${KELAS_LEVEL[level] ?? "text-foregroundGrey"}`}>
          {t(`analisa.antiCheat.level.${level}`)}
        </span>
      </div>

      <p className="text-xs leading-4 text-foregroundGrey">
        {agregat.andal
          ? t("analisa.antiCheat.riwayat.andal", { partai: agregat.jumlahPartai, langkah: jumlahBuktiTerbanyak })
          : t("analisa.antiCheat.riwayat.tidakAndal", { partai: agregat.jumlahPartai, langkah: jumlahBuktiTerbanyak })}
      </p>
      {Number.isFinite(agregat.skor) && (agregat.jumlahDomainBukti ?? 0) < 2 ? (
        <p className="text-xs leading-4 text-foregroundGrey">
          {t("analisa.antiCheat.cakupanTerbatas", { n: agregat.jumlahDomainBukti ?? 0 })}
        </p>
      ) : null}

      {Number.isFinite(agregat.rating) ? (
        <p className="text-xs leading-4 text-foregroundGrey">
          {t("analisa.antiCheat.riwayat.kalibrasi", { n: Math.round(agregat.rating) })}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.kecocokan")} nilai={persen(agregat.engineMatchRate)} />
        {agregat.kandidatSampel > 0 ? (
          <>
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.kecocokanTop3")}
              nilai={persen(agregat.kecocokanTop3)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.rataPeringkat")}
              nilai={`${agregat.rataPeringkat ?? "-"} / ${MULTI_PV + 1}`}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.acplKandidat")}
              nilai={cp(agregat.acplKandidat)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.kecocokanSulit")}
              nilai={persen(agregat.kecocokanSulit)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.kecocokanMudah")}
              nilai={persen(agregat.kecocokanMudah)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.streak")}
              nilai={String(agregat.streakTerpanjang ?? 0)}
            />
            <BarisAntiCheat
              label={t("analisa.antiCheat.metrik.korelasiWaktu")}
              nilai={Number.isFinite(agregat.korelasiWaktuKualitas) ? agregat.korelasiWaktuKualitas.toFixed(2) : "-"}
            />
          </>
        ) : null}
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.acpl")} nilai={cp(agregat.acpl)} />
        {/* Metrik sepadan platform lain (mesin/akurasi.js) — lihat catatanMetrikBaku. */}
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.acplBaku")} nilai={cp(agregat.acplBaku)} />
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.akurasi")} nilai={persen(agregat.akurasi)} />
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.waktu")} nilai={rasio(agregat.konsistensiWaktu)} />
        <BarisAntiCheat label={t("analisa.antiCheat.metrik.langkah")} nilai={String(agregat.jumlahLangkah)} />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.perFase")}</span>
        {DAFTAR_FASE.map((f) => (
          <BarisAntiCheat
            key={f}
            label={t(`analisa.antiCheat.fase.${f}`)}
            nilai={`${persen(agregat.perFase[f].engineMatchRate)} · ${cp(agregat.perFase[f].acpl)}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.riwayat.tren")}</span>
          <span className="text-xs font-bold text-foreground">{t(`analisa.antiCheat.riwayat.arah.${arah}`)}</span>
        </div>
        {Number.isFinite(agregat.tren?.kemiringan) ? (
          <span className="text-xs text-foregroundGrey">
            {t("analisa.antiCheat.riwayat.kemiringan", { n: agregat.tren.kemiringan.toFixed(1) })}
          </span>
        ) : null}
      </div>

      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-border text-foregroundGrey">
            <th className="py-1 font-bold">{t("analisa.antiCheat.riwayat.kolomPartai")}</th>
            <th className="py-1 text-right font-bold">{t("analisa.antiCheat.riwayat.kolomLangkah")}</th>
            <th className="py-1 text-right font-bold">{t("analisa.antiCheat.riwayat.kolomSkor")}</th>
          </tr>
        </thead>
        <tbody>
          {agregat.partai.map((b, i) => (
            <tr key={`${b.id}-${i}`} className="border-b border-border/50 align-top">
              <td className="py-1">
                <span className="block truncate text-foreground">
                  {t("analisa.antiCheat.riwayat.vs", { lawan: b.lawan || "-" })}
                </span>
                <span className="block text-[11px] text-foregroundGrey">
                  {b.timestamp ? new Date(b.timestamp).toISOString().split("T")[0] : "-"}
                  {b.timeClass ? ` · ${b.timeClass}` : ""}
                </span>
              </td>
              <td className="py-1 text-right text-foregroundGrey">{b.langkahDinilai}</td>
              <td className={`py-1 text-right font-bold ${KELAS_LEVEL[b.level] ?? "text-foregroundGrey"}`}>
                {Number.isFinite(b.skor) ? b.skor : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
