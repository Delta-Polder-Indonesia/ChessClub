import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const WIDGET = readFileSync(new URL("../public/peeking-widget.js", import.meta.url), "utf8");
const SUMBER_WEBM = "https://chessclub.test/character.webm";
const NOOP = () => {};

/** Jalankan widget asli di DOM terisolasi; jsdom tidak memuat media eksternal. */
function ujiInisialisasi(label, userAgent) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "https://chessclub.test/",
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const { window } = dom;
  const konteksKanvas = new Proxy(
    {
      measureText: (teks) => ({ width: String(teks).length * 10 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    },
    {
      get(target, kunci) {
        return kunci in target ? target[kunci] : NOOP;
      },
      set(target, kunci, nilai) {
        target[kunci] = nilai;
        return true;
      },
    },
  );
  const peringatan = [];

  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
  window.HTMLCanvasElement.prototype.getContext = () => konteksKanvas;
  window.HTMLMediaElement.prototype.load = NOOP;
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = NOOP;
  window.requestAnimationFrame = () => 1;
  window.cancelAnimationFrame = NOOP;
  window.matchMedia = () => ({
    matches: false,
    addListener: NOOP,
    removeListener: NOOP,
    addEventListener: NOOP,
    removeEventListener: NOOP,
  });
  window.console.warn = (...argumen) => peringatan.push(argumen.join(" "));
  window.console.error = (...argumen) => peringatan.push(argumen.join(" "));

  // Sama dengan konfigurasi KarakterAnomali.jsx. null pada HEVC harus
  // kembali ke WebM, satu-satunya video yang memang tersedia di public/.
  window.YbouanePeeking = {
    introDelayMs: 0,
    autoPeek: true,
    theme: "light",
    heightPx: 300,
    topPx: 80,
    analytics: false,
    avatar: "/images/BlunderSkuad.webp",
    fileNameWebm: "/character.webm",
    fileNameHevc: null,
    poster: ["Ikuti perjalanannya!", "Ada yang menarik di sini...", "Yuk, mulai bermain!"],
    dialogContent: "<p>Blunder Skuad</p>",
  };

  window.eval(WIDGET);

  assert.ok(window.PeekingWidget?.container, `${label}: widget harus terinisialisasi`);
  assert.equal(typeof window.PeekingWidget.api?.pause, "function", `${label}: API pause tersedia`);
  assert.equal(typeof window.PeekingWidget.api?.resume, "function", `${label}: API resume tersedia`);
  assert.ok(window.document.querySelector("ybouane-peeking canvas"), `${label}: karakter dan kanvas dibuat`);
  assert.ok(window.document.querySelector("ybouane-peeking-dialog"), `${label}: dialog dibuat`);
  assert.equal(window.document.querySelector("video")?.src, SUMBER_WEBM, `${label}: video lokal WebM dipilih`);
  assert.deepEqual(peringatan, [], `${label}: tidak ada opsi konfigurasi yang diabaikan`);

  dom.window.close();
}

console.log("KarakterAnomali: inisialisasi widget dan sumber video");
ujiInisialisasi(
  "desktop",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36",
);
ujiInisialisasi(
  "iOS Safari",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
);
console.log("  OK — widget tampil dan memakai /character.webm di desktop maupun iOS Safari.");
