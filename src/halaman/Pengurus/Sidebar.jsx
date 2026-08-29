/**
 * Sidebar navigasi dashboard pengurus.
 *
 * Icon TIDAK PERNAH bergerak. Yang beranimasi hanya:
 *   - width sidebar        → transition-[width]
 *   - label max-width      → 0 ↔ 180px
 *   - label opacity        → 0 ↔ 1
 *   - label margin-left    → 0 ↔ 12px
 */

export const MENU_SIDEBAR = [
  {
    kunci: "dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    kunci: "anggota",
    label: "Anggota",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    kunci: "larangan",
    label: "Daftar Larangan",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  },
  {
    kunci: "pesan",
    label: "Pesan Masuk",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    kunci: "turnamen",
    label: "Turnamen",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  },
  {
    kunci: "juara",
    label: "Juara Turnamen",
    icon: "M8 21h8m-4-4v4M7 4h10v4a5 5 0 01-10 0V4zM7 5H4v1a3 3 0 003 3m10-4h3v1a3 3 0 01-3 3",
  },
  {
    kunci: "berita",
    label: "Berita Komunitas",
    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  },
  {
    kunci: "pengumuman",
    label: "Pengumuman",
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  },
];

export default function Sidebar({ tab, setTab, terbuka }) {
  return (
    <aside
      className={`
        bg-white border-r border-slate-200 min-h-screen
        flex flex-col shrink-0 overflow-hidden
        will-change-[width]
        transition-[width] duration-300
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka ? "w-64" : "w-[52px]"}
      `}
    >
      <nav className="flex-1 py-3 space-y-1">
        {MENU_SIDEBAR.map(({ kunci, label, icon }) => {
          const aktif = tab === kunci;
          return (
            <button
              key={kunci}
              type="button"
              onClick={() => setTab(kunci)}
              title={terbuka ? undefined : label}
              className={`
                w-full text-sm font-medium
                flex items-center
                py-2.5 pl-4 pr-3
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

              <span
                className={`
                  overflow-hidden whitespace-nowrap
                  transform-gpu
                  transition-[max-width,opacity,margin]
                  duration-300
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  ${terbuka
                    ? "ml-3 max-w-[180px] opacity-100"
                    : "ml-0 max-w-0 opacity-0"
                  }
                `}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
