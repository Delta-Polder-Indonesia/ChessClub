/**
 * Dropdown notifikasi — lonceng di header dashboard.
 * Semua jenis notifikasi masuk kesini: pesan masyuk (Hubungi Kami),
 * permintaan kode e-book, dan jenis lain ke depan. Tiap baris ditandai
 * jenisnya lewat avatar (inisial untuk pesan, ikon buku untuk e-book).
 */

import Book from "../Analisa/komponen/svg/book.jsx";
import ShieldAlert from "../Analisa/komponen/svg/shield-alert.jsx";

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
  baris,
  memuat,
  onBuka,
  onPilih,
  onTandaiSemua,
}) {
  const adaPesanBelumBaca = baris.some((b) => b.jenis === "pesan" && !b.dibaca);
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
        <p className="text-sm font-bold text-slate-900">Notifikasi</p>
        {adaPesanBelumBaca && (
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
        {memuat && baris.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Memuat…
          </p>
        ) : baris.length === 0 ? (
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-2 text-sm text-slate-500">Belum ada notifikasi.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {baris.map((b) => (
              <li key={b.kunci}>
                <button
                  type="button"
                  onClick={() => onPilih(b)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    b.dibaca ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  {b.jenis === "ebook" ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Book className="h-4 w-4" />
                    </div>
                  ) : b.jenis === "fairplay" ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {String(b.nama || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-sm ${
                          b.dibaca
                            ? "font-medium text-slate-700"
                            : "font-bold text-slate-900"
                        }`}
                      >
                        {b.nama}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {waktuRelatif(b.waktu)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-600">
                      {b.subjek}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {cuplikan(b.teks)}
                    </p>
                  </div>
                  {!b.dibaca && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-700"
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
          className="w-full rounded-md px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-slate-50"
        >
          Lihat semua →
        </button>
      </div>
    </div>
  );
}