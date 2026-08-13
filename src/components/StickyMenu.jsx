import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "sekilas-komunitas", label: "Sekilas Komunitas" },
  { id: "tonggak-sejarah", label: "Tonggak Sejarah" },
  { id: "visi-misi", label: "Visi, Misi, & Tata Nilai" },
  { id: "makna-logo", label: "Makna Logo" },
  { id: "struktur-pengurus", label: "Struktur Pengurus" },
];

/**
 * Submenu sticky di bawah hero — identik dengan #stickymenu Pertamina.
 * `sections` bisa diganti (mis. kelompok Elo di Keanggotaan).
 */
export default function StickyMenu({
  sections = SECTIONS,
  activeId,
  onSelect,
}) {
  const [active, setActive] = useState(sections[0]?.id);
  const current = onSelect ? activeId : active;

  useEffect(() => {
    if (onSelect) return undefined;
    setActive(sections[0]?.id);
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
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, onSelect]);

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
      className="max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:whitespace-nowrap sticky w-full h-full mx-auto text-base bg-white z-40 border-b border-t top-[72px] transition-all duration-300 ease-in-out"
    >
      <div className="flex items-center lg:justify-center">
        {sections.map((s) => (
          <button
            key={s.id}
            id="stickyitem"
            type="button"
            onClick={() => handleClick(s.id)}
            className={`text-grey-600 hover:text-blue-400 font-semibold flex text-sm w-full items-center justify-center py-4 lg:py-5 px-6 hover:bg-slate-100 hover:text-slate-600 transition-colors ease-in-out duration-200 border-r ${
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
