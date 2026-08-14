import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n.jsx";

/**
 * Submenu sticky di bawah hero — identik dengan #stickymenu Pertamina.
 * `sections` bisa diganti (mis. kelompok Elo di Keanggotaan).
 */
export default function StickyMenu({ sections, activeId, onSelect }) {
  const { t } = useI18n();
  const SECTIONS = [
    { id: "sekilas-komunitas", label: t("sticky.sekilasKomunitas") },
    { id: "tonggak-sejarah", label: t("sticky.tonggakSejarah") },
    { id: "visi-misi", label: t("sticky.visiMisiNilai") },
    { id: "makna-logo", label: t("sticky.maknaLogo") },
    { id: "struktur-pengurus", label: t("sticky.strukturPengurus") },
  ];
  const daftar = sections ?? SECTIONS;
  const [active, setActive] = useState(daftar[0]?.id);
  const current = onSelect ? activeId : active;

  useEffect(() => {
    if (onSelect) return undefined;
    setActive(daftar[0]?.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );
    daftar.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [daftar, onSelect]);

  const handleClick = (id) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="stickymenu"
      className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap sticky w-full h-full mx-auto text-base bg-white z-40 border-b border-t top-[72px] transition-all duration-300 ease-in-out"
    >
      <div className="flex items-stretch lg:justify-center">
        {daftar.map((s) => (
          <button
            key={s.id}
            id="stickyitem"
            type="button"
            onClick={() => handleClick(s.id)}
            className={`text-grey-600 hover:text-blue-400 font-semibold flex text-sm flex-1 shrink-0 whitespace-nowrap min-h-[60px] lg:min-h-[62px] items-center justify-center py-4 lg:py-5 px-4 xl:px-6 hover:bg-slate-100 hover:text-slate-600 transition-colors ease-in-out duration-200 border-r ${
              current === s.id ? "text-primary" : ""
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}
