import { useState } from "react";
import PanelRiwayatMasuk from "./RiwayatMasuk.jsx";

const MENU_PENGATURAN = [
  {
    kunci: "riwayat-masuk",
    label: "Riwayat Masuk",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    kunci: "akun",
    label: "Akun & Profil",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    kunci: "umum",
    label: "Pengaturan Umum",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function Pengaturan({ onKembali, beriTahu }) {
  const [bagian, setBagian] = useState("riwayat-masuk");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onKembali}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
          <h1 className="text-lg font-bold text-slate-900">Pengaturan</h1>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar navigasi pengaturan */}
        <aside className="w-56 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {MENU_PENGATURAN.map(({ kunci, label, icon }) => {
              const aktif = bagian === kunci;
              return (
                <button
                  key={kunci}
                  type="button"
                  onClick={() => setBagian(kunci)}
                  className={`
                    w-full text-sm font-medium
                    flex items-center gap-3
                    px-3 py-2.5 rounded-lg
                    transition-colors duration-150
                    ${aktif
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-slate-100"
                    }
                  `}
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={icon}
                    />
                  </svg>
                  {label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Konten utama */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {bagian === "riwayat-masuk" && (
            <PanelRiwayatMasuk beriTahu={beriTahu} />
          )}

          {bagian === "akun" && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">
                Pengaturan akun & profil akan segera tersedia.
              </p>
            </div>
          )}

          {bagian === "umum" && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">
                Pengaturan umum akan segera tersedia.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
