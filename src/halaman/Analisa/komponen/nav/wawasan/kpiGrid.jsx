/** Empat kartu KPI Wawasan (jumlah partai, skor, akurasi, rentang rating). */
function KpiGrid({ wawasan, t }) {
  const streak = wawasan.streak;
  const streakLabel = streak.type === "none" || streak.count === 0
    ? t("analisa.wawasan.tidakAda")
    : `${streak.count} ${t(`analisa.wawasan.streak.${streak.type}`)}`;

  const items = [
    { label: t("analisa.wawasan.kpi.totalPartai"), value: wawasan.totalPartai },
    { label: t("analisa.wawasan.kpi.winRate"), value: `${wawasan.hasilUmum.winRate}%`, accent: true },
    { label: t("analisa.wawasan.kpi.streak"), value: streakLabel },
    { label: t("analisa.wawasan.kpi.akurasi"), value: wawasan.taktikal.avgAccuracy !== null ? `${wawasan.taktikal.avgAccuracy}%` : "N/A" },
    { label: t("analisa.wawasan.kpi.ratingPuncak"), value: wawasan.peakRating !== null ? String(wawasan.peakRating) : "N/A" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" role="region" aria-label="KPI">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1 rounded-borderRoundness border border-border bg-backgroundBox p-3">
          <span className="text-xs text-foregroundGrey">{item.label}</span>
          <span className={`text-lg font-bold font-mono ${item.accent ? "text-backgroundBoxBoxHighlighted" : "text-foreground"}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default KpiGrid;
