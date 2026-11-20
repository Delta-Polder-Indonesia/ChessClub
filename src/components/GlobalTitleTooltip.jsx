import { useEffect } from "react";

/**
 * Satu pintu tooltip untuk seluruh keluarga papan interaktif.
 * Mengubah setiap [title] native menjadi tooltip ber-CSS sama
 * (.aegov-tooltip, --tooltip-bg: #2A2C32 dari src/gaya/tooltip.css)
 * dipakai di: Teka-teki Catur, Rush, Teka-teki Harian, Kuis Catur,
 * Report Analisa, Pembukaan, Lawan Bot, E-Book, Latihan Repertoar,
 * Hand & Brain, Turing Test — tanpa perlu edit tiap file.
 *
 * Dipasang sekali di MainApp; menangani elemen dinamis via delegasi.
 */
export default function GlobalTitleTooltip() {
  useEffect(() => {
    let tipEl = null;
    let active = null;
    let hideTimer = null;

    function ensureEl() {
      if (tipEl) return tipEl;
      tipEl = document.createElement("div");
      tipEl.className = "aegov-tooltip";
      tipEl.setAttribute("role", "tooltip");
      tipEl.style.position = "fixed";
      tipEl.style.left = "0";
      tipEl.style.top = "0";
      tipEl.style.pointerEvents = "none";
      tipEl.style.opacity = "0";
      tipEl.style.visibility = "hidden";
      tipEl.style.zIndex = "9999";
      tipEl.style.transition = "opacity 120ms ease";
      document.body.appendChild(tipEl);
      return tipEl;
    }

    function place(target) {
      const el = ensureEl();
      const r = target.getBoundingClientRect();
      el.style.visibility = "hidden";
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        let left = r.left + r.width / 2 - w / 2;
        let top = r.top - h - 8;
        left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
        if (top < 8) top = r.bottom + 8;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.visibility = "visible";
        el.style.opacity = "1";
      });
    }

    const SEL = "[title], [data-title-saved]";
    const getText = (el) =>
      el.getAttribute("title") || el.getAttribute("data-title-saved") || "";
    const findTrigger = (el) => el?.closest?.(SEL) || null;

    function show(target) {
      const text = getText(target);
      if (!text) return;
      if (!target.hasAttribute("data-title-saved")) {
        target.setAttribute("data-title-saved", text);
        target.removeAttribute("title");
      }
      active = target;
      const el = ensureEl();
      el.textContent = text;
      place(target);
    }

    function hide(restore = true) {
      if (hideTimer) clearTimeout(hideTimer);
      if (tipEl) {
        tipEl.style.opacity = "0";
        hideTimer = setTimeout(() => {
          if (tipEl) tipEl.style.visibility = "hidden";
        }, 120);
      }
      if (restore && active) {
        const saved = active.getAttribute("data-title-saved");
        if (saved != null) {
          active.setAttribute("title", saved);
          active.removeAttribute("data-title-saved");
        }
        active = null;
      } else if (!restore && active) {
        active = null;
      }
    }

    function onOver(e) {
      const t = findTrigger(e.target);
      if (!t) {
        if (active && e.relatedTarget && active.contains(e.relatedTarget)) return;
        if (active && e.target && active.contains(e.target)) return;
        if (active && findTrigger(e.relatedTarget) === active) return;
        return;
      }
      if (active === t) return;
      if (active) hide(false);
      show(t);
    }

    function onOut(e) {
      const next = findTrigger(e.relatedTarget);
      if (active && e.relatedTarget && active.contains(e.relatedTarget)) return;
      if (next && next === active) return;
      if (!next && active) {
        const from = findTrigger(e.target);
        if (from === active && !next) hide();
        else if (!from && active && !active.contains(e.relatedTarget)) hide();
      }
    }

    function onFocusIn(e) {
      const t = findTrigger(e.target);
      if (t) show(t);
    }
    function onFocusOut() {
      if (active) hide();
    }

    function onScroll() {
      if (active) place(active);
    }

    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll, true);

    return () => {
      document.removeEventListener("pointerover", onOver, true);
      document.removeEventListener("pointerout", onOut, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll, true);
      if (tipEl?.parentNode) tipEl.parentNode.removeChild(tipEl);
      tipEl = null;
      if (active) {
        const saved = active.getAttribute("data-title-saved");
        if (saved != null) {
          active.setAttribute("title", saved);
          active.removeAttribute("data-title-saved");
        }
      }
    };
  }, []);

  return null;
}
