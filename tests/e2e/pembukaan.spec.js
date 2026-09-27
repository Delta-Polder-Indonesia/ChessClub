import { expect, test } from "@playwright/test";
import { Chess } from "chess.js";
import { bukuPembukaan as id } from "../../src/lib/terjemahan/id/program.js";
import { bukuPembukaan as en } from "../../src/lib/terjemahan/en/program.js";
import { papan as papanId } from "../../src/lib/terjemahan/id/papan.js";
import { papan as papanEn } from "../../src/lib/terjemahan/en/papan.js";

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

for (const [bahasa, kamus] of [["id", papanId], ["en", papanEn]]) {
  test(`papan interaktif membuka papan lama tanpa meninggalkan workspace (${bahasa})`, async ({ page }, testInfo) => {
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    await page.goto("/papan-interaktif", { waitUntil: "domcontentloaded" });

    const menu = page.getByRole("navigation", { name: kamus.menuMode });
    const analisa = menu.getByRole("button", { name: kamus.menuAnalisa, exact: true });
    await expect(analisa).toHaveAttribute("aria-pressed", "true");
    await expect(menu.getByRole("link")).toHaveCount(0);
    await expect(page.locator('a[href="/program-kami/analisa"]')).toHaveCount(0);
    await expect(page.locator("[data-petak]")).toHaveCount(64, { timeout: 30_000 });
    await expect(page.getByRole("tab", { name: kamus.tabBuku })).toBeVisible();
    await expect(page.getByText(kamus.workspacePilih)).toHaveCount(0);
    await expect(page.getByRole("button", { name: kamus.workspaceKembali })).toHaveCount(0);

    if (testInfo.project.name === "desktop-chromium") {
      for (const [lebar, tinggi] of [[1366, 768], [1366, 600], [1024, 768]]) {
        await page.setViewportSize({ width: lebar, height: tinggi });
        const ukuran = await page.evaluate(() => {
          const papan = document.querySelector('[data-petak="e2"]').parentElement.parentElement;
          const lajur = papan.closest('div[class*="lg:max-w-"]');
          const batas = papan.getBoundingClientRect();
          return {
            lebarDokumen: document.documentElement.scrollWidth,
            tinggiDokumen: document.documentElement.scrollHeight,
            lebarLayar: innerWidth,
            tinggiLayar: innerHeight,
            atasPapan: batas.top,
            bawahPapan: batas.bottom,
            lajurBergulir: lajur.scrollHeight > lajur.clientHeight + 1,
          };
        });
        expect(ukuran.lebarDokumen).toBeLessThanOrEqual(ukuran.lebarLayar);
        expect(ukuran.tinggiDokumen).toBeLessThanOrEqual(ukuran.tinggiLayar);
        expect(ukuran.atasPapan).toBeGreaterThanOrEqual(0);
        expect(ukuran.bawahPapan).toBeLessThanOrEqual(ukuran.tinggiLayar);
        expect(ukuran.lajurBergulir).toBe(false);
      }
    }

    await page.locator('[data-petak="e2"]').click();
    await page.locator('[data-petak="e4"]').click();
    await expect(page.getByRole("tabpanel")).toContainText("e4");
    await page.getByRole("tab", { name: kamus.tabBuku }).click();
    await expect(page.getByRole("searchbox", { name: kamus.cariPembukaan })).toBeVisible();

    await menu.getByRole("button", { name: kamus.menuLatihanRepertoar }).click();
    await expect(page.getByRole("heading", { name: kamus.repertoarJudul })).toBeVisible();
    await page.getByRole("button", { name: kamus.repertoarJelajahBuku }).click();
    await expect(analisa).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-petak]")).toHaveCount(64);
    await expect(page.getByRole("button", { name: kamus.workspaceKembali })).toHaveCount(0);

    await menu.getByRole("button", { name: kamus.menuManusiaMesin }).click();
    await expect(page.getByRole("region", { name: kamus.pveJudul })).toBeVisible();

    // Workspace, menu mode, eval bar, dan papan harus tetap berada di dalam
    // viewport sempit. Ini menjaga regresi flex `w-full` yang pernah membuat
    // papan melebar melebihi layar ketika eval bar dipasang di sebelah kiri.
    const tataLetakResponsif = await page.evaluate(() => {
      const petak = document.querySelector('[data-petak="e2"]');
      const papan = petak?.parentElement?.parentElement;
      const menuMode = document.querySelector('nav[aria-label]');
      const batasPapan = papan?.getBoundingClientRect();
      return {
        lebarDokumen: document.documentElement.scrollWidth,
        lebarLayar: window.innerWidth,
        kiriPapan: batasPapan?.left ?? -1,
        kananPapan: batasPapan?.right ?? window.innerWidth + 1,
        menuMeluap: menuMode ? menuMode.scrollWidth > menuMode.clientWidth + 1 : true,
      };
    });
    expect(tataLetakResponsif.lebarDokumen).toBeLessThanOrEqual(tataLetakResponsif.lebarLayar);
    expect(tataLetakResponsif.kiriPapan).toBeGreaterThanOrEqual(0);
    expect(tataLetakResponsif.kananPapan).toBeLessThanOrEqual(tataLetakResponsif.lebarLayar);
    expect(tataLetakResponsif.menuMeluap).toBe(false);

    const warnaPemain = page.getByLabel(kamus.pveWarnaPemain);
    const levelMesin = page.getByLabel(kamus.pveLevel);
    await expect(warnaPemain).toBeEnabled();
    await expect(levelMesin).toBeEnabled();

    // Tanda pengguna tetap berfungsi ketika belum bermain dan dapat dipakai
    // saat komputer berpikir. Ini menutup regresi PvE yang sebelumnya tidak
    // meneruskan callback onTandaPetak/onTandaPanah ke papan bersama.
    const asal = await page.locator('[data-petak="e2"]').boundingBox();
    const tujuan = await page.locator('[data-petak="e4"]').boundingBox();
    expect(asal).not.toBeNull();
    expect(tujuan).not.toBeNull();
    await page.mouse.move(asal.x + asal.width / 2, asal.y + asal.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(tujuan.x + tujuan.width / 2, tujuan.y + tujuan.height / 2, { steps: 4 });
    await page.mouse.up({ button: "right" });
    await expect(page.locator('[data-arrow="e2e4"]')).toHaveCount(1);

    await page.getByRole("button", { name: kamus.pveMulai, exact: true }).click();
    // Partai berjalan: kartu konfigurasi pra-partai hilang dan panel partai
    // (daftar langkah + navigasi + baris aksi) menggantikannya.
    await expect(page.getByRole("region", { name: kamus.pveKonfigurasi })).toHaveCount(0);
    await expect(warnaPemain).toHaveCount(0);
    await expect(levelMesin).toHaveCount(0);
    await expect(page.getByRole("button", { name: kamus.pveMulai, exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: kamus.pveRiwayat })).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.keAwal })).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.pveMenyerah })).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.simpan })).toBeVisible();
    await expect(page.locator('[data-arrow="e2e4"]')).toHaveCount(0);

    // Tombol + Baru tidak boleh dapat ditekan pada partai kosong. Begitu pemain
    // melangkah, tombol aktif dan mereset papan tanpa kembali ke konfigurasi.
    const partaiBaru = page.getByRole("button", { name: kamus.baru, exact: true });
    await expect(partaiBaru).toBeDisabled();
    await page.locator('[data-petak="e2"]').click();
    await page.locator('[data-petak="e4"]').click();
    await expect(partaiBaru).toBeEnabled();
    await partaiBaru.click();
    await expect(partaiBaru).toBeDisabled();
    await expect(page.getByRole("heading", { name: kamus.pveRiwayat })).toBeVisible();
    await expect(page.locator('[data-petak="e2"] img')).toHaveCount(1);
    await expect(page.locator('[data-petak="e4"] img')).toHaveCount(0);

    await page.getByRole("button", { name: kamus.pveMenyerah }).click();
    await page
      .getByRole("dialog", { name: kamus.pveKonfirmasiMenyerah })
      .getByRole("button", { name: kamus.pveYa })
      .click();
    await expect(page.getByRole("button", { name: kamus.pveMulai, exact: true })).toBeVisible();
    await expect(warnaPemain).toBeEnabled();
    await expect(levelMesin).toBeEnabled();
    if (testInfo.project.name === "desktop-chromium") {
      await page.setViewportSize({ width: 1366, height: 600 });
      const ukuran = await page.evaluate(() => {
        const papan = document.querySelector('[data-petak="e2"]').parentElement.parentElement;
        const batas = papan.getBoundingClientRect();
        return {
          tinggiDokumen: document.documentElement.scrollHeight,
          tinggiLayar: innerHeight,
          bawahPapan: batas.bottom,
          lajurBergulir: papan.closest("section").scrollHeight > papan.closest("section").clientHeight + 1,
        };
      });
      expect(ukuran.tinggiDokumen).toBeLessThanOrEqual(ukuran.tinggiLayar);
      expect(ukuran.bawahPapan).toBeLessThanOrEqual(ukuran.tinggiLayar);
      expect(ukuran.lajurBergulir).toBe(false);
    }
    await analisa.click();
    await expect(page.locator("[data-petak]")).toHaveCount(64);
    await expect(page).toHaveURL(/\/papan-interaktif$/);
    expect(galat).toEqual([]);
  });
}
