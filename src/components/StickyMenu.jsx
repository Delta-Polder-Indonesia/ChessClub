import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n.jsx";

/** Tinggi header + sticky menu — garis acuan bagian yang sedang dibaca. */
const OFFSET_BACA = 140;

/**
 * Submenu sticky di bawah hero — identik dengan #stickymenu Pertamina.
 * `sections` bisa diganti (mis. kelompok Elo di Keanggotaan).
 *
 * Saat halaman di-scroll, tab yang sesuai dengan bagian yang sedang dibaca
 * ikut menyala, sehingga menu ini sekaligus jadi penanda posisi pengguna.
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
  /** Setelah tab diklik, scroll-spy dibekukan sebentar agar tidak meloncat. */
  const kunci = useRef(0);

  useEffect(() => {
    if (onSelect) return undefined;

    let frame = 0;

    const hitung = () => {
      frame = 0;
      if (Date.now() < kunci.current) return;

      const garis = window.scrollY + OFFSET_BACA;
      let terpilih = daftar[0]?.id;

      for (const s of daftar) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const atas = el.getBoundingClientRect().top + window.scrollY;
        if (atas <= garis + 1) terpilih = s.id;
      }

      const maksimal =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maksimal > 0 && window.scrollY >= maksimal - 2) {
        const akhir = [...daftar]
          .reverse()
          .find((s) => document.getElementById(s.id));
        if (akhir) terpilih = akhir.id;
      }

      if (terpilih) setActive((lama) => (lama === terpilih ? lama : terpilih));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(hitung);
    };

    hitung();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [daftar, onSelect]);

  const handleClick = (id) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    kunci.current = Date.now() + 700;
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
