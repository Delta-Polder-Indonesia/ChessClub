import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../lib/i18n.jsx";

/** Tinggi header + sticky menu — dipakai sebagai garis baca scroll-spy. */
const OFFSET_BACA = 140;

/**
 * Submenu sticky di bawah hero.
 *
 * Dua mode:
 * 1. Mode scroll-spy (default) — tab menyorot bagian yang sedang dibaca
 *    pengguna saat halaman di-scroll, sekaligus jadi penanda posisi.
 * 2. Mode tab terkendali — dipakai bila prop `activeId` + `onSelect` diisi
 *    (mis. Struktur Grup Catur yang berganti konten, bukan scroll).
 */
export default function StickyMenu({ sections, activeId, onSelect }) {
  const { t } = useI18n();

  const SECTIONS = useMemo(
    () => [
      { id: "sekilas-komunitas", label: t("sticky.sekilasKomunitas") },
      { id: "tonggak-sejarah", label: t("sticky.tonggakSejarah") },
      { id: "visi-misi", label: t("sticky.visiMisiNilai") },
      { id: "makna-logo", label: t("sticky.maknaLogo") },
      { id: "struktur-pengurus", label: t("sticky.strukturPengurus") },
    ],
    [t]
  );

  const daftar = sections ?? SECTIONS;
  const terkendali = Boolean(onSelect);

  const [active, setActive] = useState(daftar[0]?.id);
  const [progres, setProgres] = useState(0);
  const barRef = useRef(null);
  const itemRefs = useRef({});
  /** Saat klik tab, scroll-spy dibekukan sebentar supaya tidak "loncat". */
  const kunci = useRef(0);

  const current = terkendali ? activeId : active;

  /* ---------- scroll-spy: tentukan bagian yang sedang dibaca ---------- */
  useEffect(() => {
    if (terkendali) return undefined;

    let frame = 0;

    const hitung = () => {
      frame = 0;

      const doc = document.documentElement;
      const maksimal = doc.scrollHeight - window.innerHeight;
      setProgres(maksimal > 0 ? Math.min(1, window.scrollY / maksimal) : 0);

      if (Date.now() < kunci.current) return;

      const garis = window.scrollY + OFFSET_BACA;
      let terpilih = daftar[0]?.id;

      for (const s of daftar) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const atas = el.getBoundingClientRect().top + window.scrollY;
        if (atas <= garis + 1) terpilih = s.id;
      }

      // Sudah mentok di dasar halaman → pastikan tab terakhir yang menyala.
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
  }, [daftar, terkendali]);

  /* ---------- tab aktif selalu terlihat pada layar sempit ---------- */
  useEffect(() => {
    const el = itemRefs.current[current];
    const bar = barRef.current;
    if (!el || !bar) return;
    if (bar.scrollWidth <= bar.clientWidth + 1) return;

    const target = el.offsetLeft - (bar.clientWidth - el.offsetWidth) / 2;
    bar.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [current]);

  /* ---------- buka halaman dengan #hash langsung ke bagiannya ---------- */
  useEffect(() => {
    if (terkendali) return;
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    if (!hash || !daftar.some((s) => s.id === hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    kunci.current = Date.now() + 700;
    setActive(hash);
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - OFFSET_BACA + 6,
        behavior: "smooth",
      });
    });
  }, [daftar, terkendali]);

  const handleClick = useCallback(
    (id) => {
      if (onSelect) {
        onSelect(id);
        return;
      }
      const el = document.getElementById(id);
      kunci.current = Date.now() + 700;
      setActive(id);
      if (el) {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - OFFSET_BACA + 6,
          behavior: "smooth",
        });
      }
      if (window.history.replaceState) {
        window.history.replaceState(null, "", `#${id}`);
      }
    },
    [onSelect]
  );

  const indeksAktif = Math.max(
    0,
    daftar.findIndex((s) => s.id === current)
  );

  return (
    <section
      id="stickymenu"
      aria-label={t("common.navigasiBagian")}
      className="sticky top-[72px] z-40 w-full bg-white border-b border-t transition-all duration-300 ease-in-out"
    >
      {/* Garis kemajuan baca — penanda seberapa jauh halaman sudah di-scroll */}
      {!terkendali && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-transparent">
          <div
            className="h-full bg-primary/70 transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progres * 100)}%` }}
          />
        </div>
      )}

      <div
        ref={barRef}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap scroll-smooth"
      >
        <div
          className="relative flex items-stretch lg:justify-center"
          role="tablist"
        >
          {daftar.map((s, i) => {
            const aktif = current === s.id;
            return (
              <button
                key={s.id}
                ref={(node) => {
                  itemRefs.current[s.id] = node;
                }}
                type="button"
                role="tab"
                aria-selected={aktif}
                aria-current={aktif ? "true" : undefined}
                title={s.label}
                onClick={() => handleClick(s.id)}
                className={`relative flex flex-1 shrink-0 min-h-[60px] lg:min-h-[62px] items-center justify-center whitespace-nowrap border-r px-4 py-4 text-sm font-semibold transition-colors duration-200 ease-in-out lg:py-5 xl:px-6 ${
                  aktif
                    ? "text-primary bg-slate-50"
                    : "text-grey-600 hover:bg-slate-100 hover:text-blue-400"
                }`}
              >
                <span className="lg:hidden mr-2 text-xs font-bold opacity-60">
                  {i + 1}
                </span>
                {s.label}
              </button>
            );
          })}

          {/* Garis penanda tab aktif */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-[3px] bg-primary transition-all duration-300 ease-out"
            style={{
              width: `${100 / daftar.length}%`,
              left: `${(indeksAktif * 100) / daftar.length}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}
