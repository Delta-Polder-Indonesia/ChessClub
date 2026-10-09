import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart.jsx";
import { cn } from "@/lib/utils.js";

/**
 * Grafik siap pakai gaya neobrutalism — satu pemanggilan, markup & gaya
 * selalu sama di semua halaman. Berbasis komponen `src/components/ui/chart.jsx`.
 *
 * Empat jenis grafik dengan prop yang seragam:
 *   <GrafikBatang judul="…" data={…} config={…} kunciX="bulan" />
 *   <GrafikGaris  judul="…" data={…} config={…} kunciX="bulan" />
 *   <GrafikArea   judul="…" data={…} config={…} kunciX="bulan" />
 *   <GrafikPai    judul="…" data={…} config={…} kunciNama="browser" kunciNilai="pengunjung" />
 *
 * Prop umum (semua jenis):
 *   data          : array objek, mis. [{ bulan: "Jan", pengunjung: 186 }]
 *   config        : chartConfig ala shadcn — { namaSeri: { label, color } };
 *                   warna memakai token var(--chart-1) … var(--chart-5)
 *   judul         : judul kartu grafik (opsional)
 *   deskripsi     : sub-judul di bawah judul (opsional)
 *   footer        : catatan kaki bebas di bawah grafik (opsional)
 *   tinggi        : class tinggi wadah, default "h-[250px]"
 *   denganLegenda : tampilkan legenda seri (default false)
 *   denganTooltip : tampilkan tooltip hover (default true)
 *   className     : class tambahan untuk kartu luar
 *
 * Prop khusus grafik sumbu (Batang/Garis/Area):
 *   kunciX   : nama kunci data untuk sumbu X (default "nama")
 *   seri     : daftar dataKey yang digambar, default = semua kunci config
 *   formatX  : fungsi pemformat label sumbu X (mis. potong jadi 3 huruf)
 *   susun    : (Batang/Area) susun/bertumpuk multi-seri (default false)
 *   jenis    : (Garis/Area) tipe kurva — "monotone" (bawaan), "linear", "step"
 *   opasitasIsi : (Area) opasitas isi area 0–1 (default 1 — gaya datar neobrutalism)
 *
 * Prop khusus GrafikPai:
 *   kunciNama  : kunci label potongan (default "nama")
 *   kunciNilai : kunci angka potongan (default "nilai")
 *   donat      : true → pai donat (default false)
 */

/* ── Kerangka kartu neobrutalism yang sama untuk semua grafik ── */
function BingkaiGrafik({
  judul,
  deskripsi,
  footer,
  className,
  contentClassName,
  children,
}) {
  return (
    <div
      data-slot="grafik-tools"
      className={cn(
        "overflow-hidden rounded-lg border-2 border-black bg-white text-black shadow-[4px_4px_0px_0px_#000]",
        className,
      )}
    >
      {(judul || deskripsi) && (
        <div className="space-y-1 border-b-2 border-black bg-[#0B2F9F] px-4 py-3 text-white">
          {judul && <h3 className="m-0 text-base font-bold">{judul}</h3>}
          {deskripsi && <p className="m-0 text-xs text-white/80">{deskripsi}</p>}
        </div>
      )}
      <div className={cn("p-4", contentClassName)}>{children}</div>
      {footer && (
        <div className="border-t-2 border-black px-4 py-3 text-xs text-slate-700">
          {footer}
        </div>
      )}
    </div>
  );
}

function SumbuGrafik({ denganLegenda, denganTooltip, sembunyikanLabel }) {
  return (
    <>
      <CartesianGrid vertical={false} />
      {denganTooltip && (
        <ChartTooltip
          cursor={{ strokeDasharray: "4 4" }}
          content={<ChartTooltipContent hideLabel={sembunyikanLabel} />}
        />
      )}
      {denganLegenda && <ChartLegend content={<ChartLegendContent />} />}
    </>
  );
}

function AmbilSeri(config, seri) {
  return seri ?? Object.keys(config);
}

/* ── Grafik batang ── */
function GrafikBatang({
  data,
  config,
  kunciX = "nama",
  seri,
  judul,
  deskripsi,
  footer,
  tinggi = "h-[250px]",
  denganLegenda = false,
  denganTooltip = true,
  susun = false,
  formatX,
  className,
}) {
  const semuaSeri = AmbilSeri(config, seri);
  return (
    <BingkaiGrafik
      judul={judul}
      deskripsi={deskripsi}
      footer={footer}
      className={className}
    >
      <ChartContainer config={config} className={cn("w-full", tinggi)}>
        <BarChart accessibilityLayer data={data}>
          <SumbuGrafik
            denganLegenda={denganLegenda}
            denganTooltip={denganTooltip}
            sembunyikanLabel={semuaSeri.length === 1}
          />
          <XAxis
            dataKey={kunciX}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            {...(formatX ? { tickFormatter: formatX } : {})}
          />
          <YAxis tickLine={false} axisLine={false} width={36} />
          {semuaSeri.map((kunci, _i) => (
            <Bar
              key={kunci}
              dataKey={kunci}
              fill={`var(--color-${kunci})`}
              stroke="#000"
              strokeWidth={2}
              radius={susun ? 0 : 6}
              stackId={susun ? "susun" : undefined}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </BingkaiGrafik>
  );
}

/* ── Grafik garis ── */
function GrafikGaris({
  data,
  config,
  kunciX = "nama",
  seri,
  judul,
  deskripsi,
  footer,
  tinggi = "h-[250px]",
  denganLegenda = false,
  denganTooltip = true,
  jenis = "monotone",
  denganTitik = true,
  formatX,
  className,
}) {
  const semuaSeri = AmbilSeri(config, seri);
  return (
    <BingkaiGrafik
      judul={judul}
      deskripsi={deskripsi}
      footer={footer}
      className={className}
    >
      <ChartContainer config={config} className={cn("w-full", tinggi)}>
        <LineChart accessibilityLayer data={data}>
          <SumbuGrafik
            denganLegenda={denganLegenda}
            denganTooltip={denganTooltip}
            sembunyikanLabel={semuaSeri.length === 1}
          />
          <XAxis
            dataKey={kunciX}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            {...(formatX ? { tickFormatter: formatX } : {})}
          />
          <YAxis tickLine={false} axisLine={false} width={36} />
          {semuaSeri.map((kunci) => (
            <Line
              key={kunci}
              dataKey={kunci}
              type={jenis}
              stroke={`var(--color-${kunci})`}
              strokeWidth={2}
              dot={denganTitik}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </BingkaiGrafik>
  );
}

/* ── Grafik area ── */
function GrafikArea({
  data,
  config,
  kunciX = "nama",
  seri,
  judul,
  deskripsi,
  footer,
  tinggi = "h-[250px]",
  denganLegenda = false,
  denganTooltip = true,
  jenis = "monotone",
  susun = false,
  opasitasIsi = 1,
  formatX,
  className,
}) {
  const semuaSeri = AmbilSeri(config, seri);
  return (
    <BingkaiGrafik
      judul={judul}
      deskripsi={deskripsi}
      footer={footer}
      className={className}
    >
      <ChartContainer config={config} className={cn("w-full", tinggi)}>
        <AreaChart accessibilityLayer data={data}>
          <SumbuGrafik
            denganLegenda={denganLegenda}
            denganTooltip={denganTooltip}
            sembunyikanLabel={semuaSeri.length === 1}
          />
          <XAxis
            dataKey={kunciX}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            {...(formatX ? { tickFormatter: formatX } : {})}
          />
          <YAxis tickLine={false} axisLine={false} width={36} />
          {semuaSeri.map((kunci) => (
            <Area
              key={kunci}
              dataKey={kunci}
              type={jenis}
              fill={`var(--color-${kunci})`}
              fillOpacity={opasitasIsi}
              stroke={`var(--color-${kunci})`}
              strokeWidth={2}
              stackId={susun ? "susun" : undefined}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    </BingkaiGrafik>
  );
}

/* ── Grafik pai / donat ── */
function GrafikPai({
  data,
  config,
  kunciNama = "nama",
  kunciNilai = "nilai",
  judul,
  deskripsi,
  footer,
  tinggi = "h-[250px]",
  denganLegenda = true,
  denganTooltip = true,
  donat = false,
  className,
}) {
  // Isi warna tiap potongan dari config sehingga data tetap polos:
  // cukup { nama: "chrome", pengunjung: 275 } dan config.chrome.color.
  const dataBerwarna = data.map((baris) => ({
    ...baris,
    fill: `var(--color-${baris[kunciNama]})`,
  }));

  return (
    <BingkaiGrafik
      judul={judul}
      deskripsi={deskripsi}
      footer={footer}
      className={className}
      contentClassName="pb-0"
    >
      <ChartContainer
        config={config}
        className={cn("mx-auto aspect-square w-full", tinggi)}
      >
        <PieChart>
          {denganTooltip && (
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey={kunciNama} />}
            />
          )}
          {denganLegenda && (
            <ChartLegend
              content={<ChartLegendContent nameKey={kunciNama} />}
            />
          )}
          <Pie
            data={dataBerwarna}
            dataKey={kunciNilai}
            nameKey={kunciNama}
            stroke="#000"
            strokeWidth={2}
            innerRadius={donat ? "55%" : 0}
          />
        </PieChart>
      </ChartContainer>
    </BingkaiGrafik>
  );
}

export { GrafikBatang, GrafikGaris, GrafikArea, GrafikPai };
