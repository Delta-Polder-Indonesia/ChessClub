import { expect, test } from "@playwright/test";
import { Chess } from "chess.js";
import { bukuPembukaan as id } from "../../src/lib/terjemahan/id/program.js";
import { bukuPembukaan as en } from "../../src/lib/terjemahan/en/program.js";

const LANGKAH = ["d4", "Nf3", "c4", "e3", "g3", "b3", "f4", "d3", "Nc3", "b4", "c3"];
const BIDAK = { p: "Bidak", n: "Kuda", b: "Gajah", r: "Benteng", q: "Menteri", k: "Raja" };

for (const [bahasa, kamus] of [["id", id], ["en", en]]) {
  test(`artikel pembukaan: posisi, isi, dan penempatan (${bahasa})`, async ({ page }) => {
    // Halaman sangat berat (36 papan mini + 11 papan artikel). Pada mesin
    // dingin commit React pertama bisa lambat, jadi beri kelonggaran jauh
    // hanya untuk spec ini.
    test.setTimeout(180_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    await page.route((url) => url.pathname.startsWith("/api/"), (route) =>
      route.fulfill({ json: {} }),
    );
    await page.goto("/program-kami/pembukaan", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: kamus.artikel, exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("heading", { name: kamus.pembangunan, exact: true })).toBeVisible();
    await expect(page.getByText("Hitam memiliki beberapa cara untuk merespons.", { exact: false })).toHaveCount(0);
    await expect(page.locator('article[aria-labelledby^="judul-pembukaan-"]')).toHaveCount(11);
    await expect(page.getByRole("heading", { name: "1. e4 · Pembukaan Pion Raja", exact: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: kamus.buka, exact: true })).toHaveAttribute("href", "/papan-interaktif");

    for (const san of LANGKAH) {
      const isi = kamus.panduan[san];
      const artikel = page.locator(`article[aria-labelledby="judul-pembukaan-${san}"]`);
      const judul = artikel.getByRole("heading", { name: `1. ${san} · ${isi.judul}`, exact: true });
      await expect(judul).toBeVisible();
      await expect(artikel.locator("p")).toHaveText([
        isi.pembuka1, isi.pembuka2, isi.respons, isi.rencana,
      ]);
      const papan = artikel.locator('[role="img"]');
      await expect(papan.locator("img")).toHaveCount(32);
      const permainan = new Chess();
      const langkah = permainan.move(san);
      const harapan = permainan.board().flat().map((bidak) => bidak
        ? `${BIDAK[bidak.type]} ${bidak.color === "w" ? "putih" : "hitam"}`
        : null);
      const petak = papan.locator(":scope > .grid > div");
      await expect(petak).toHaveCount(64);
      expect(await petak.evaluateAll((elemen) => elemen.map((el) => el.querySelector("img")?.alt ?? null))).toEqual(harapan);

      const x = (posisi) => "abcdefgh".indexOf(posisi[0]) * 12.5 + 6.25;
      const y = (posisi) => "87654321".indexOf(posisi[1]) * 12.5 + 6.25;
      const jalur = san.startsWith("N")
        ? `M ${x(langkah.from)} ${y(langkah.from)} V ${y(langkah.to)} H ${x(langkah.to)}`
        : `M ${x(langkah.from)} ${y(langkah.from)} L ${x(langkah.to)} ${y(langkah.to)}`;
      await expect(papan.locator("svg > path")).toHaveAttribute("d", jalur);
      await expect(page.locator(`[id="panah-pembukaan-${san}"]`)).toHaveCount(1);

      const kotakPapan = await papan.boundingBox();
      const kotakJudul = await judul.boundingBox();
      expect(Math.abs(kotakPapan.width - kotakPapan.height)).toBeLessThan(2);
      if (page.viewportSize().width >= 1024) {
        expect(kotakJudul.x).toBeGreaterThan(kotakPapan.x + kotakPapan.width);
      } else {
        expect(kotakJudul.y).toBeGreaterThan(kotakPapan.y + kotakPapan.height);
      }
      const lanjutan = await artikel.locator(":scope > div").last().boundingBox();
      const kotakArtikel = await artikel.boundingBox();
      expect(lanjutan.y).toBeGreaterThan(kotakPapan.y + kotakPapan.height);
      expect(Math.abs(lanjutan.x - kotakPapan.x)).toBeLessThan(2);
      expect(Math.abs(lanjutan.width - kotakArtikel.width)).toBeLessThan(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(galat).toEqual([]);
  });
}
