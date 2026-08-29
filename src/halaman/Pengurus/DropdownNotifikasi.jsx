/**
 * Dropdown notifikasi pesan masuk — lonceng di header dashboard.
 */

export function waktuRelatif(iso) {
  if (!iso) return "";
  const sekarang = Date.now();
  const waktu = new Date(iso).getTime();
  if (Number.isNaN(waktu)) return "";
  const detik = Math.max(0, Math.round((sekarang - waktu) / 1000));
  if (detik < 60) return "baru saja";
  const menit = Math.round(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function cuplikan(teks, maks = 80) {
  const s = String(teks || "").replace(/\s+/g, " ").trim();
  return s.length > maks ? `${s.slice(0, maks - 1)}…` : s;
}

export default function DropdownNotifikasi({
  terbuka,
  pesan,
  memuat,
  onBuka,
  onBukaPesan,
  onTandaiSemua,
}) {
  return (
    <div
      className={`
        absolute right-0 mt-2 w-80 sm:w-96 z-50
        bg-white rounded-lg shadow-lg border border-slate-200
        origin-top-right transform-gpu
        transition-[opacity,transform] duration-200
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }
      `}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-slate-900">Notifikasi</p>
          <p className="text-xs text-slate-500">
            Pesan masuk dari form Hubungi Kami
          </p>
        </div>
        {pesan.some((p) => !p.dibaca) && (
          <button
            type="button"
            onClick={onTandaiSemua}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="max-h-[26rem] overflow-y-auto">
        {memuat && pesan.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Memuat…
          </p>
        ) : pesan.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <svg
              className="mx-auto h-9 w-9 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.6}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-slate-500">Belum ada pesan masuk.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pesan.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onBukaPesan(p)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    p.dibaca ? "bg-white" : "bg-blue-50/40"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {String(p.nama || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          p.dibaca
                            ? "font-medium text-slate-700"
                            : "font-bold text-slate-900"
                        }`}
                      >
                        {p.nama}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {waktuRelatif(p.tanggal)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-600">
                      {p.subjek || "(tanpa subjek)"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {cuplikan(p.pesan)}
                    </p>
                  </div>
                  {!p.dibaca && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                      aria-label="belum dibaca"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 px-2 py-2">
        <button
          type="button"
          onClick={onBuka}
          className="w-full rounded-md px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-blue-50"
        >
          Lihat semua pesan →
        </button>
      </div>
    </div>
  );
}
