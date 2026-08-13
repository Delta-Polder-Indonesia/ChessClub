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
 */
export default function StickyMenu() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
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
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleClick = (id) => {
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
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            id="stickyitem"
            type="button"
            onClick={() => handleClick(s.id)}
            className={`text-grey-600 hover:text-blue-400 font-semibold flex text-sm w-full items-center justify-center py-4 lg:py-5 px-6 hover:bg-slate-100 hover:text-slate-600 transition-colors ease-in-out duration-200 border-r ${
              active === s.id ? "text-primary" : ""
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </section>
  );
}
