/**
 * Sidebar navigasi dashboard pengurus.
 *
 * Icon TIDAK PERNAH bergerak. Yang beranimasi hanya:
 *   - width sidebar        → transition-[width]
 *   - label max-width      → 0 ↔ 180px
 *   - label opacity        → 0 ↔ 1
 *   - label margin-left    → 0 ↔ 12px
 */

import { useState } from "react";

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
  {
    kunci: "ebook",
    label: "Kode E-Book",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    anak: [
      { kunci: "terbit", label: "Kode E-Book" },
      { kunci: "minta", label: "Permintaan kode" },
      { kunci: "kode", label: "Daftar kode akses" },
      { kunci: "unduhan", label: "Jejak unduhan" },
    ],
  },
  ];

export default function Sidebar({ tab, setTab, terbuka, halamanEbook, onPilihEbook }) {
  const [bukaSub, setBukaSub] = useState({});

  return (
    <aside
      className={`
        bg-white border-r border-slate-200 h-full
        flex flex-col shrink-0 overflow-hidden
        will-change-[width]
        transition-[width] duration-300
        ease-[cubic-bezier(0.22,1,0.36,1)]
        ${terbuka ? "w-64" : "w-[52px]"}
      `}
    >
      <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
        {MENU_SIDEBAR.map(({ kunci, label, icon, anak }) => {
          const aktif = tab === kunci;
          const punyaAnak = Array.isArray(anak) && anak.length > 0;
          const buka = !!bukaSub[kunci];

          return (
            <div key={kunci}>
              <button
                type="button"
                onClick={() => {
                  if (punyaAnak && terbuka) {
                    setBukaSub((b) => ({ ...b, [kunci]: !buka }));
                  } else {
                    setTab(kunci);
                  }
                }}
                title={terbuka ? undefined : label}
                aria-expanded={punyaAnak && terbuka ? buka : undefined}
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

                {punyaAnak && terbuka && (
                  <svg
                    className={`
                      w-4 h-4 ml-auto shrink-0
                      transition-transform duration-200
                      ${buka ? "rotate-90" : ""}
                    `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>

              {punyaAnak && terbuka && buka && (
                <ul className="mt-0.5 mb-1 ml-[23px] border-l-2 border-slate-200 pl-2 space-y-0.5">
                  {anak.map((sub) => {
                    const subAktif = tab === kunci && halamanEbook === sub.kunci;
                    return (
                      <li key={sub.kunci}>
                        <button
                          type="button"
                          onClick={() => onPilihEbook?.(sub.kunci)}
                          className={`
                            w-full text-sm rounded-sm
                            flex items-center
                            py-1.5 pl-2 pr-2
                            transition-colors duration-150
                            ${subAktif
                              ? "bg-primary text-white font-medium"
                              : "text-slate-600 hover:bg-slate-100"
                            }
                          `}
                        >
                          {sub.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
