import { useEffect } from "react";

/**
 * Memuat widget peeking dari public/peeking-widget.js (lokal).
 *
 * Script meng-inject <ybouane-peeking> (karakter mengintip dari tepi
 * kanan layar) dan <ybouane-peeking-dialog> ke document.body otomatis.
 *
 * Semua asset (script + video) lokal di public/.
 * Tidak ada request ke peeking.ybouane.com.
 *
 * Catatan: script punya guard internal `window.PeekingWidget` —
 * sekali load, tidak mau re-init. Jadi cleanup StrictMode harus hati-hati.
 */
export default function KarakterAnomali() {
  useEffect(() => {
    // Konfigurasi harus diset SEBELUM script load.
    // fileNameWebm: "/character.webm" — file video sudah ada di public/.
    window.YbouanePeeking = {
      introDelayMs: 0,
      autoPeek: true,
      theme: "light",
      heightPx: 300,
      topPx: 80,
      analytics: false,
      fileNameWebm: "/character.webm",
      fileNameHevc: null,
      poster: ["Ikuti perjalanannya!", "Ada yang menarik di sini...", "Yuk, mulai bermain!"],
      dialogContent:
        '<p class="eyebrow">Komunitas Catur Indonesia</p>' +
        "<h2>Blunder Skuad</h2>" +
        "<p>Wadah bagi pecatur untuk bermain, belajar, dan bertumbuh bersama. Tantang mesin, analisa partai, dan ikuti turnamen rutin.</p>" +
        '<div class="actions"><a class="btn primary" href="/papan-interaktif">Mulai Bermain</a></div>',
    };

    if (window.PeekingWidget) return undefined;

    const s = document.createElement("script");
    s.src = "/peeking-widget.js";
    s.async = true;
    document.body.appendChild(s);

    return undefined;
  }, []);

  return null;
}
