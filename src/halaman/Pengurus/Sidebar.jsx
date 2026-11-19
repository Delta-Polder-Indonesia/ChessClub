/**
 * Sidebar navigasi dashboard pengurus.
 *
 * Icon TIDAK PERNAH bergerak. Yang beranimasi hanya:
 *   - width sidebar        → transition-[width]
 *   - label max-width      → 0 ↔ 180px
 *   - label opacity        → 0 ↔ 1
 *   - label margin-left    → 0 ↔ 12px
 */

import { Fragment, useState } from "react";
import { MENU_SIDEBAR } from "./SidebarData.js";
import { TooltipLabel } from "./ui.jsx";

export default function Sidebar({ tab, setTab, terbuka, halamanEbook, onPilihEbook }) {
  const [bukaSub, setBukaSub] = useState({});
  // Label grup hanya tampil saat sidebar terbuka; dicetak sekali per kelompok.
  let grupSebelumnya = null;

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
      <nav className={`
        flex-1 py-3 space-y-1
        ${terbuka
          ? "overflow-y-auto [scrollbar-gutter:stable]"
          : "overflow-y-visible"
        }
      `}>
        {MENU_SIDEBAR.map(({ kunci, label, icon, anak, grup }) => {
          const aktif = tab === kunci;
          const punyaAnak = Array.isArray(anak) && anak.length > 0;
          const buka = !!bukaSub[kunci];
          const tampilLabelGrup = terbuka && grup && grup !== grupSebelumnya;
          if (grup) grupSebelumnya = grup;

          return (
            <Fragment key={kunci}>
            {tampilLabelGrup && (
              <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                {grup}
              </p>
            )}
            <div>
              <TooltipLabel label={terbuka ? undefined : label}>
                <button
                  type="button"
                  onClick={() => {
                  if (punyaAnak && terbuka) {
                    setBukaSub((b) => ({ ...b, [kunci]: !buka }));
                  } else {
                    setTab(kunci);
                  }
                }}
                aria-expanded={punyaAnak && terbuka ? buka : undefined}
                className={`
                  w-full text-sm font-medium
                  flex items-center
                  pl-4 pr-3 py-2 border
                  transition-colors duration-150
                  ${aktif
                    ? "text-slate-900 border-slate-900 rounded-md"
                    : "text-slate-700 border-transparent hover:bg-slate-100"
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
              </TooltipLabel>

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
                            w-full text-sm
                            flex items-center
                            py-1.5 pl-2 pr-2 border
                            transition-colors duration-150
                            ${subAktif
                              ? "text-slate-900 font-medium border-slate-900 rounded-sm"
                              : "text-slate-600 border-transparent hover:bg-slate-100"
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
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
