/* Snippet tempel-di-konsol: ukur animasi luncuran bidak di halaman ini.
   Cara pakai:
     1) buka halaman papan (mis. /papan-interaktif atau /teka-teki/problem)
     2) tempel seluruh blok ini ke DevTools Console, tekan Enter
     3) klik bidak asal, lalu klik petak tujuan  (mis. e2 lalu e4)
     4) tunggu ±2 detik — hasilnya tercetak di konsol
*/
(() => {
  const BATAS_MS = 6000;
  const petak = () => document.querySelector("[data-petak]");
  const kandidat = () =>
    document.querySelector("[data-klon-terbang]") ||
    [...document.querySelectorAll("div,span,img")].find((e) => {
      const s = getComputedStyle(e);
      return s.position === "fixed" && /top|left/.test(s.transitionProperty) && e.offsetWidth > 8;
    }) ||
    null;

  console.info(
    "%c[UJI ANIMASI BIDAK] siap — sekarang klik petak asal (e2), lalu petak tujuan (e4).",
    "font-weight:bold;color:#0a0"
  );
  console.info("Konteks:", {
    "prefers-reduced-motion": matchMedia("(prefers-reduced-motion: reduce)").matches,
    "ukuran petak (px)": petak() ? petak().getBoundingClientRect().width : null,
    "bundel JS dimuat": performance
      .getEntriesByType("resource")
      .map((e) => e.name.split("/").pop())
      .filter((n) => /\.js$/.test(n))
      .slice(0, 12),
  });

  let el = null;
  let t0 = 0;
  let durasiGb = null;
  let kurvaGb = null;
  const jejak = [];
  const mulai = performance.now();

  const laporan = () => {
    if (!jejak.length) {
      console.warn(
        "%c[UJI ANIMASI BIDAK] ✗ tidak ada luncuran — bidak berpindah seketika (lompat), ini BUKAN gaya isepic.",
        "color:#c00;font-weight:bold"
      );
      return;
    }
    const a = jejak[0];
    const z = jejak[jejak.length - 1];
    const jarak = Math.hypot(z.x - a.x, z.y - a.y);
    const lebarPetak = petak() ? petak().getBoundingClientRect().width : jarak;
    const durasiTerlihat = z.t - a.t;
    const ms = (durasiGb || "").split(",")[0].trim();
    const kurva = (kurvaGb || "").split(",")[0].trim();
    console.table({
      "durasi transisi (CSS)": durasiGb,
      "kurva transisi (CSS)": kurvaGb,
      "durasi terlihat (frame)": `${durasiTerlihat.toFixed(0)} ms`,
      jarak: `${jarak.toFixed(1)} px (${(jarak / lebarPetak).toFixed(2)} petak)`,
      "jumlah frame": jejak.length,
      "kurva p(t)": jejak
        .map((p) => ({
          t: p.t - a.t,
          p: jarak ? Math.hypot(p.x - a.x, p.y - a.y) / jarak : 0,
        }))
        .filter((_, i) => i % 2 === 0)
        .map((p) => `${p.t.toFixed(0)}ms=${(p.p * 100).toFixed(0)}%`)
        .join(" "),
    });
    const cepat = /0\.1[0-9]s|1[0-9][0-9]ms/.test(ms);
    const lurus = /linear/.test(kurva);
    const pasIsepic = /0\.3s|300ms/.test(ms) && /ease/.test(kurva) && !lurus;
    const pesan = pasIsepic
      ? "✓ sama dengan isepic-chess-ui (300 ms, ease) — peramban Anda memuat versi yang benar."
      : `⚠ MENYIMPANG — ${cepat ? "terlalu cepat " : ""}${lurus ? "kurva linear (kaku) " : ""}→ peramban Anda kemungkinan memuat bundel LAMA. Lakukan muat ulang paksa (Ctrl+Shift+R) lalu ulangi.`;
    console.info(`%c[UJI ANIMASI BIDAK] ${pesan}`, `font-weight:bold;color:${pasIsepic ? "#0a0" : "#c00"}`);
  };

  const tick = () => {
    const k = kandidat();
    const now = performance.now();
    if (k) {
      const r = k.getBoundingClientRect();
      const s = getComputedStyle(k);
      if (!el) {
        el = k;
        t0 = now;
        durasiGb = s.transitionDuration;
        kurvaGb = s.transitionTimingFunction;
      }
      jejak.push({ t: now - t0, x: r.left, y: r.top });
    } else if (el) {
      laporan();
      return;
    }
    if (now - mulai < BATAS_MS) requestAnimationFrame(tick);
    else if (el) laporan();
    else
      console.warn(
        "%c[UJI ANIMASI BIDAK] tak ada luncuran terdeteksi sampai batas waktu. Pastikan langkahnya sudah dijalankan.",
        "color:#c60"
      );
  };
  requestAnimationFrame(tick);
})();
