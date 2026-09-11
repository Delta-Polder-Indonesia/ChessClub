import { TrendingUp } from "lucide-react";

/**
 * Grafik ringkasan analisa yang berdiri sendiri.
 *
 * Tidak bergantung pada data analisa tertentu sehingga aman disiapkan sebelum
 * dipasang ke Summary. Saat dipanggil, cukup kirim `data`:
 * [{ label, white, black }]
 */
function normalisasiData(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((item, index) => ({
      label: item?.label ?? item?.name ?? `${index + 1}`,
      white: Number.isFinite(Number(item?.white)) ? Number(item.white) : 0,
      black: Number.isFinite(Number(item?.black)) ? Number(item.black) : 0,
    }))
    .slice(-8);
}

function GrafikRingkasan({
  data = [],
  title = "Ringkasan Analisa",
  description = "Perbandingan performa Putih dan Hitam",
  whiteLabel = "Putih",
  blackLabel = "Hitam",
  formatValue = (value) => value.toLocaleString("id-ID"),
}) {
  const chartData = normalisasiData(data);
  const maksimum = Math.max(
    1,
    ...chartData.flatMap((item) => [item.white, item.black]),
  );

  return (
    <section className="w-full rounded-borderRoundness bg-background px-4 py-4 text-foreground sm:px-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-foregroundGrey">{description}</p>
        </div>
        <TrendingUp className="h-4 w-4 shrink-0 text-foregroundGrey" aria-hidden="true" />
      </header>

      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-foregroundGrey">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground" aria-hidden="true" />
          {whiteLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-foregroundGrey" aria-hidden="true" />
          {blackLabel}
        </span>
      </div>

      {chartData.length ? (
        <div className="flex h-52 items-end gap-2 overflow-hidden px-1" role="img" aria-label={title}>
          {chartData.map((item, index) => {
            const tinggiPutih = `${Math.max(4, (item.white / maksimum) * 100)}%`;
            const tinggiHitam = `${Math.max(4, (item.black / maksimum) * 100)}%`;
            return (
              <div key={`${item.label}-${index}`} className="flex min-w-0 flex-1 items-end justify-center gap-1">
                <div className="group relative flex h-full w-full max-w-7 items-end justify-center">
                  <div
                    className="w-full rounded-t-[5px] bg-foreground transition-[height] duration-300"
                    style={{ height: tinggiPutih }}
                    title={`${whiteLabel}: ${formatValue(item.white)}`}
                  />
                </div>
                <div className="group relative flex h-full w-full max-w-7 items-end justify-center">
                  <div
                    className="w-full rounded-t-[5px] bg-foregroundGrey transition-[height] duration-300"
                    style={{ height: tinggiHitam }}
                    title={`${blackLabel}: ${formatValue(item.black)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-52 items-center justify-center rounded-borderRoundness border border-dashed border-border text-sm text-foregroundGrey">
          Belum ada data grafik.
        </div>
      )}

      {chartData.length ? (
        <div className="mt-2 flex gap-2 overflow-hidden px-1 text-[10px] text-foregroundGrey">
          {chartData.map((item, index) => (
            <span key={`${item.label}-label-${index}`} className="min-w-0 flex-1 truncate text-center">
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export { GrafikRingkasan as default, GrafikRingkasan };
