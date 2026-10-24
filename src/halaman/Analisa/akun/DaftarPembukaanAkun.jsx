import { useI18n } from "../../../lib/i18n.jsx";

export function BarHasil({ w, d, l, tinggi = "1.4rem" }) {
  const total = w + d + l || 1;
  const seg = (nilai, warna) => {
    const pct = (nilai / total) * 100;
    return { pct, warna, tampil: pct > 15 };
  };
  const win = seg(w, "var(--analisa-winGreen)");
  const draw = seg(d, "var(--analisa-foregroundGrey)");
  const loss = seg(l, "var(--analisa-lossRed)");
  return (
    <div className="flex w-full overflow-hidden rounded-md" style={{ height: tinggi }}>
      {[win, draw, loss].map((s, i) => (
        <div
          key={i}
          className="flex h-full items-center justify-center overflow-hidden"
          style={{ width: `${s.pct}%`, backgroundColor: s.warna }}
        >
          {s.tampil ? (
            <span className="px-1 text-[0.7rem] font-bold leading-none text-white/90">{s.pct.toFixed(1)}%</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function BarisPembukaan({ e }) {
  return (
    <div className="flex flex-col gap-2 px-1 py-3" data-uji="pembukaan-akun-baris">
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="truncate font-semibold text-foreground">{e.nama}</span>
        <span className="shrink-0 font-bold text-foregroundGrey">{e.persen}%</span>
      </div>
      <BarHasil w={e.w} d={e.d} l={e.l} tinggi="1rem" />
    </div>
  );
}

export default function DaftarPembukaanAkun({ putih = [], hitam = [] }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-uji="pembukaan-akun-grid">
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <div className="border-b border-border py-3 text-center text-sm font-bold text-foreground">
          {t("analisa.statistik.putih")}
        </div>
        <div className="border-b border-border py-3 text-center text-sm font-bold text-foreground">
          {t("analisa.statistik.hitam")}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <div data-uji="pembukaan-akun-kolom-putih">
            {putih.length ? (
              putih.map((e, i) => <BarisPembukaan key={e.nama + i} e={e} />)
            ) : (
              <p className="py-4 text-center text-sm text-foregroundGrey">—</p>
            )}
          </div>
          <div data-uji="pembukaan-akun-kolom-hitam">
            {hitam.length ? (
              hitam.map((e, i) => <BarisPembukaan key={e.nama + i} e={e} />)
            ) : (
              <p className="py-4 text-center text-sm text-foregroundGrey">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
