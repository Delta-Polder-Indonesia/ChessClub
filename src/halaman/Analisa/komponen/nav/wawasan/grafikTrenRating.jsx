/** Grafik garis tren rating sepanjang riwayat partai. */
function GrafikTrenRating({ points, t }) {
  if (!points || points.length === 0) {
    return (
      <div className="wawasan-card flex h-[300px] min-h-[300px] flex-col">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.trenJudul")}</h3>
        <div className="flex items-center justify-center p-6">
          <p className="text-sm text-foregroundGrey">{t("analisa.wawasan.tanpaDataRating")}</p>
        </div>
      </div>
    );
  }

  const ratings = points.map((p) => p.rating);
  const minR = Math.min(...ratings);
  const maxR = Math.max(...ratings);
  const yMin = Math.floor((minR - 15) / 25) * 25;
  const yMax = Math.ceil((maxR + 15) / 25) * 25;
  const yRange = yMax - yMin || 1;

  const width = 640;
  const height = 240;
  const padLeft = 50, padRight = 20, padTop = 20, padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const coords = points.map((p, i) => ({
    x: points.length === 1 ? padLeft + plotW / 2 : padLeft + (i / (points.length - 1)) * plotW,
    y: padTop + plotH - ((p.rating - yMin) / yRange) * plotH,
    point: p,
  }));

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPoints =
    `${coords[0].x.toFixed(1)},${(padTop + plotH).toFixed(1)} ` +
    polylinePoints +
    ` ${coords[coords.length - 1].x.toFixed(1)},${(padTop + plotH).toFixed(1)}`;

  const firstRating = points[0].rating;
  const lastRating = points[points.length - 1].rating;
  const delta = lastRating - firstRating;
  const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
  const deltaClass = delta > 0 ? "text-highlightBest" : delta < 0 ? "text-highlightBlunder" : "text-foregroundGrey";
  const midRating = Math.round((yMin + yMax) / 2);

  return (
    <div className="wawasan-card flex h-[300px] min-h-[300px] flex-col">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="wawasan-card-title">{t("analisa.wawasan.trenJudul")}</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-foregroundGrey">
            {t("analisa.wawasan.terkini")}: <strong className="text-foreground">{lastRating}</strong>
          </span>
          <span className={`font-bold font-mono ${deltaClass}`}>{deltaStr}</span>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center overflow-hidden pt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${firstRating} to ${lastRating}`}>
          <defs>
            <linearGradient id="wawasanAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#81b64c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#81b64c" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} className="wawasan-grid" />
          <text x={padLeft - 8} y={padTop + 4} textAnchor="end" className="wawasan-axis-text">{yMax}</text>
          <line x1={padLeft} y1={padTop + plotH / 2} x2={width - padRight} y2={padTop + plotH / 2} className="wawasan-grid" />
          <text x={padLeft - 8} y={padTop + plotH / 2 + 4} textAnchor="end" className="wawasan-axis-text">{midRating}</text>
          <line x1={padLeft} y1={padTop + plotH} x2={width - padRight} y2={padTop + plotH} className="wawasan-grid" />
          <text x={padLeft - 8} y={padTop + plotH + 4} textAnchor="end" className="wawasan-axis-text">{yMin}</text>
          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#wawasanAreaGradient)" />
          {/* Trend line */}
          <polyline points={polylinePoints} fill="none" stroke="#81b64c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Data points */}
           {coords.map((c, i) => (
             <circle key={c.point.gameId || i} cx={c.x} cy={c.y} r={points.length > 50 ? 2 : 3.5} className="wawasan-dot">
               <title>{`${c.point.date ? new Date(c.point.date * 1000).toLocaleDateString() : ""}: ${c.point.rating} (${c.point.result})`}</title>
             </circle>
           ))}
         </svg>
      </div>
    </div>
  );
}

export default GrafikTrenRating;
