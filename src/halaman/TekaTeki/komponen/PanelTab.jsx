/**
 * Tab panel kanan halaman Teka-Teki.
 *
 * Aksesibilitas (audit A11y):
 *   - pola ARIA tab lengkap: setiap tab punya `id`, `aria-controls`, dan
 *     panelnya `aria-labelledby` + `role="tabpanel"`;
 *   - navigasi panah kiri/kanan + Home/End sesuai pola APG, dengan satu tab
 *     stop (`tabIndex` hanya pada tab terpilih);
 *   - label tab berasal dari kamus (dulu "Main" dan "Panel teka-teki" keras
 *     berbahasa Indonesia/Inggris campur).
 */
import { useCallback, useRef } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { idPanel, idTab, TAB_TEKA_TEKI } from "../data/tabTekaTeki.js";

export default function PanelTab({ aktif = "main", onGanti = null }) {
  const { t } = useI18n();
  const refs = useRef({});

  const label = {
    main: t("tekaTeki.tabMain"),
    video: t("tekaTeki.tabVideo"),
    pengaturan: t("tekaTeki.pengaturan"),
  };

  const pilih = useCallback(
    (kunci) => {
      onGanti?.(kunci);
      refs.current[kunci]?.focus();
    },
    [onGanti]
  );

  const padaKeydown = (e, indeks) => {
    const total = TAB_TEKA_TEKI.length;
    let tujuan = -1;
    if (e.key === "ArrowRight") tujuan = (indeks + 1) % total;
    else if (e.key === "ArrowLeft") tujuan = (indeks - 1 + total) % total;
    else if (e.key === "Home") tujuan = 0;
    else if (e.key === "End") tujuan = total - 1;
    if (tujuan === -1) return;
    e.preventDefault();
    pilih(TAB_TEKA_TEKI[tujuan]);
  };

  return (
    <div
      role="tablist"
      aria-label={t("tekaTeki.panelTekaTeki")}
      data-slot="tab-teka-teki"
      className="grid grid-cols-3 gap-1 rounded-lg border border-[#312e2b] bg-[#262421] p-1 m-3 mb-0"
    >
      {TAB_TEKA_TEKI.map((kunci, indeks) => {
        const terpilih = aktif === kunci;
        return (
          <button
            key={kunci}
            ref={(el) => {
              refs.current[kunci] = el;
            }}
            id={idTab(kunci)}
            type="button"
            role="tab"
            aria-selected={terpilih}
            aria-controls={idPanel(kunci)}
            tabIndex={terpilih ? 0 : -1}
            data-tab={kunci}
            onClick={() => onGanti?.(kunci)}
            onKeyDown={(e) => padaKeydown(e, indeks)}
            className={`rounded-md px-2 py-1.5 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#81b64c] ${
              terpilih ? "bg-[#3d3a37] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {label[kunci]}
          </button>
        );
      })}
    </div>
  );
}
