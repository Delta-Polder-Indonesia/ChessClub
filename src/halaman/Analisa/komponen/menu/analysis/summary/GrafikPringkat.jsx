import * as React from "react";

/**
 * Grafik peringkat/performa yang berdiri sendiri.
 *
 * Data sengaja diterima lewat props agar komponen bisa dipakai kembali pada
 * data pemain ChessClub tanpa mengikat Summary pada sumber data tertentu.
 * Format minimum: [{ label: "Nama pemain", value: 82 }]
 */
function normalisasiData(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((item, index) => ({
      label: item?.label ?? item?.name ?? `Pemain ${index + 1}`,
      value: Number.isFinite(Number(item?.value)) ? Number(item.value) : 0,
    }))
    .filter((item) => item.value >= 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function GrafikPringkat({
  data = [],
  title = "Peringkat Performa",
  description = "Perbandingan skor pemain",
  valueLabel = "Skor",
  formatValue = (value) => value.toLocaleString("id-ID"),
  maxValue,
}) {
  const chartData = normalisasiData(data);
  const maksimum = Math.max(
    1,
    Number.isFinite(Number(maxValue)) ? Number(maxValue) : 0,
    ...chartData.map((item) => item.value),
  );

  const [activeIndex, setActiveIndex] = React.useState(null);

  return (
    <section className="w-full rounded-borderRoundness bg-background px-4 py-4 text-foreground sm:px-5">
      <header className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-foregroundGrey">{description}</p>
      </header>

      {chartData.length ? (
        <div className="space-y-3" role="list" aria-label={title}>
          {chartData.map((item, index) => {
            const persen = Math.min(100, Math.max(0, (item.value / maksimum) * 100));
            const aktif = activeIndex === index;
            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                className="group block w-full text-left"
                onClick={() => setActiveIndex(aktif ? null : index)}
                aria-pressed={aktif}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-5 shrink-0 text-right font-semibold text-foregroundGrey">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium">{item.label}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-foregroundGrey">
                    {valueLabel}: {formatValue(item.value)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary-background">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-300 group-hover:opacity-80"
                    style={{ width: `${persen}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-borderRoundness border border-dashed border-border text-sm text-foregroundGrey">
          Belum ada data peringkat.
        </div>
      )}
    </section>
  );
}

export { GrafikPringkat as default, GrafikPringkat };
