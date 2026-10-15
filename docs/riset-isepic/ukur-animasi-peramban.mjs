#!/usr/bin/env node
/**
 * Ukur animasi luncuran bidak di PERAMBAN SUNGGUHAN (bukan jsdom).
 *
 * Latar: keluhan "bidak melesat seperti roket, kaku" muncul dari perbedaan
 * durasi/kurva transisi yang tidak terlihat di uji jsdom (jsdom tidak
 * menjalankan transisi CSS). Skrip ini membuka halaman, melakukan langkah
 * klik e2 → e4 dengan event mouse asli, mencatat posisi elemen luncuran pada
 * SETIAP frame, lalu melaporkan durasi, kurva, jarak, dan grafik p(t).
 *
 * Pemakaian:
 *   # 1) siapkan peramban
 *   npm i -D puppeteer-core            # atau sudah ada di lingkungan Anda
 *   # Chrome/Chromium bawaan sistem:
 *   CHROME_EXE=/usr/bin/google-chrome node docs/riset-isepic/ukur-animasi-peramban.mjs http://localhost:5173/papan-interaktif
 *   # atau Chromium sandbox/serverless:
 *   npm i -D @sparticuz/chromium && node docs/riset-isepic/ukur-animasi-peramban.mjs <url>
 *
 * Opsi:
 *   --petak=e2,e4     petak asal & tujuan (bawaan e2,e4)
 *   --json=keluar.json  simpan hasil mentah
 *   --kurangi-gerak   paksa prefers-reduced-motion: reduce
 *
 * Halaman isepic-chess-ui terdeteksi otomatis (memakai #ic_ui_e2 / #ic_ui_e4).
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(path.join(ROOT, "noop.js"));

const arg = process.argv.slice(2);
const urls = arg.filter((a) => /^https?:\/\//.test(a));
const opsi = (nama, bawaan) => {
  const t = arg.find((a) => a.startsWith(`--${nama}=`));
  return t ? t.slice(nama.length + 3) : bawaan;
};
const bendera = (nama) => arg.includes(`--${nama}`);
const [petakAsal, petakTujuan] = opsi("petak", "e2,e4").split(",");
const keluarJson = opsi("json", null);

if (!urls.length) {
  console.error("Sebutkan minimal satu URL. Contoh: node docs/riset-isepic/ukur-animasi-peramban.mjs http://localhost:5173/papan-interaktif");
  process.exit(1);
}

async function muatPuppeteer() {
  let puppeteer;
  try {
    puppeteer = require("puppeteer-core");
  } catch {
    console.error("Butuh `puppeteer-core`: npm i -D puppeteer-core");
    process.exit(1);
  }
  const exe = process.env.CHROME_EXE;
  if (exe) return { puppeteer, executablePath: exe, args: [] };
  try {
    const Chromium = require("@sparticuz/chromium").default;
    return {
      puppeteer,
      executablePath: await Chromium.executablePath(),
      args: Chromium.args,
      // Binari serverless butuh pustaka pendamping; jalankan dengan
      // LD_LIBRARY_PATH ke folder hasil inflate-nya.
    };
  } catch {
    console.error("Tidak ada peramban: set CHROME_EXE=/jalur/ke/chrome ATAU pasang @sparticuz/chromium.");
    process.exit(1);
  }
}

/** Perekam dalam halaman: lacak tiap elemen luncuran satu per satu. */
async function pasangPerekam(page) {
  await page.evaluate(() => {
    window.__elems = [];
    const peta = new Map();
    const kandidat = () => [
      ...new Set([
        ...document.querySelectorAll("[data-klon-terbang]"),
        ...document.querySelectorAll("#ic_ui_board > .ic_piece_holder"),
      ]),
    ];
    const tick = () => {
      const now = performance.now();
      for (const el of kandidat()) {
        const s = getComputedStyle(el);
        if (s.position !== "fixed" && s.position !== "absolute") continue;
        let entri = peta.get(el);
        if (!entri) {
          const r = el.getBoundingClientRect();
          entri = {
            cls: String(el.className).slice(0, 60),
            durasiCss: s.transitionDuration,
            kurvaCss: s.transitionTimingFunction,
            t0: now,
            lebar: +r.width.toFixed(2),
            sampel: [],
          };
          peta.set(el, entri);
          window.__elems.push(entri);
        }
        const r = el.getBoundingClientRect();
        entri.sampel.push({ t: +(now - entri.t0).toFixed(1), x: +r.left.toFixed(2), y: +r.top.toFixed(2) });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function ringkas(e) {
  const s = e.sampel;
  const akhir = s[s.length - 1];
  const jarak = Math.hypot(akhir.x - s[0].x, akhir.y - s[0].y);
  let puncak = 0;
  for (let i = 1; i < s.length; i++) {
    const dt = s[i].t - s[i - 1].t;
    if (dt <= 0) continue;
    const d = Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
    puncak = Math.max(puncak, d / dt);
  }
  const kurva = s
    .filter((_, i) => i % 2 === 0)
    .map((k) => `${k.t.toFixed(0)}ms=${((jarak ? Math.hypot(k.x - s[0].x, k.y - s[0].y) / jarak : 0) * 100).toFixed(0)}%`);
  const ms = (e.durasiCss || "").split(",")[0].trim();
  const kurvaCss = (e.kurvaCss || "").split(",")[0].trim();
  const sesuaiIsepic = /0\.3s|300ms/.test(ms) && /ease/.test(kurvaCss) && !/linear/.test(kurvaCss);
  return {
    kelas: e.cls,
    durasiCss: e.durasiCss,
    kurvaCss: e.kurvaCss,
    durasiTerlihatMs: +(akhir.t - s[0].t).toFixed(0),
    jarakPx: +jarak.toFixed(1),
    jarakPetak: +(jarak / e.lebar).toFixed(2),
    puncakPxPerMs: +puncak.toFixed(3),
    frame: s.length,
    kurva,
    sesuaiIsepic,
  };
}

const { puppeteer, executablePath, args } = await muatPuppeteer();
const browser = await puppeteer.launch({
  args: [...(args || []), "--no-sandbox", "--disable-setuid-sandbox"],
  executablePath,
  headless: true,
});

const semua = [];
for (const url of urls) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (bendera("kurangi-gerak")) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  const isepic = /isepic/.test(url);
  const selAsal = isepic ? "#ic_ui_e2" : `[data-petak="${petakAsal}"]`;
  const selTujuan = isepic ? "#ic_ui_e4" : `[data-petak="${petakTujuan}"]`;

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForFunction(
      (s) => document.querySelectorAll(s).length > 0,
      { timeout: 60000, polling: 200 },
      isepic ? "#ic_ui_board .ic_ws" : "[data-petak]"
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await pasangPerekam(page);

    const kotak = async (sel) =>
      page.$eval(sel, (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
      });
    const asal = await kotak(selAsal);
    const tujuan = await kotak(selTujuan);

    await page.mouse.click(asal.x, asal.y);
    await new Promise((r) => setTimeout(r, 150));
    await page.mouse.click(tujuan.x, tujuan.y);
    await new Promise((r) => setTimeout(r, 1200));

    const elems = await page.evaluate(() => window.__elems);
    const hasil = elems.filter((e) => e.sampel.length > 2).map(ringkas).filter((e) => e.jarakPx > 1);
    semua.push({ url, ukuranPetak: +asal.w.toFixed(1), hasil });

    console.log(`\n▸ ${url}  (petak ${asal.w.toFixed(1)} px)`);
    if (!hasil.length) console.log("   ⚠ tidak ada elemen luncuran terdeteksi (bidak mungkin melompat seketika).");
    for (const h of hasil) {
      console.log(`   durasi CSS   : ${h.durasiCss}   kurva: ${h.kurvaCss}`);
      console.log(`   terukur      : ${h.durasiTerlihatMs} ms, ${h.jarakPx} px (${h.jarakPetak} petak), puncak ${h.puncakPxPerMs} px/ms, ${h.frame} frame`);
      console.log(`   kurva p(t)   : ${h.kurva.join("  ")}`);
      console.log(`   vonis        : ${h.sesuaiIsepic ? "✓ 300 ms ease (sama dengan isepic)" : "⚠ MENYIMPANG dari isepic"}`);
    }
  } catch (e) {
    semua.push({ url, galat: e.message });
    console.log(`\n▸ ${url}\n   ✗ gagal: ${e.message}`);
  }
  await page.close();
}

if (keluarJson) {
  fs.writeFileSync(keluarJson, JSON.stringify(semua, null, 2));
  console.log(`\nJSON: ${keluarJson}`);
}
await browser.close();
