import { expect, test } from "@playwright/test";
import { bukuPembukaan as id } from "../../src/lib/terjemahan/id/program.js";
import { bukuPembukaan as en } from "../../src/lib/terjemahan/en/program.js";
import { papan as papanId } from "../../src/lib/terjemahan/id/papan.js";
import { papan as papanEn } from "../../src/lib/terjemahan/en/papan.js";

/** Ganti token {kunci} pada teks kamus, sama seperti fungsi t() aplikasi. */
const ganti = (teks, nilai) => teks.replace(/\{(\w+)\}/g, (_, kunci) => nilai[kunci]);

for (const [bahasa, kamus] of [["id", id], ["en", en]]) {
  test(`landing pembukaan: masthead dan katalog pencarian (${bahasa})`, async ({ page }) => {
    // Muatan pertama menanggung kompilasi graph modul Vite pada mesin dingin.
    test.setTimeout(120_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    await page.route((url) => url.pathname.startsWith("/api/"), (route) =>
      route.fulfill({ json: {} }),
    );
    await page.goto("/program-kami/pembukaan", { waitUntil: "domcontentloaded" });

    const lokal = bahasa === "en" ? "en-US" : "id-ID";
    const angka = new Intl.NumberFormat(lokal);

    // Hero dan pembuka editorial.
    await expect(page.getByRole("heading", { name: kamus.judul, exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("heading", { name: kamus.introJudul, exact: true })).toBeVisible();

    // Katalog: 72 keluarga teratas, pencarian hidup menurut nama dan ECO.
    const carian = page.getByRole("searchbox", { name: kamus.katalogPlaceholder });
    await expect(carian).toBeVisible();
    const barisKatalog = page.locator("tr[data-katalog]");
    await expect(barisKatalog).toHaveCount(72);
    const jumlahBaris = (n) => ganti(kamus.katalogJumlah, { n: angka.format(n), total: angka.format(72) });
    await expect(page.getByText(jumlahBaris(72))).toBeVisible();
    const teratas = barisKatalog.first();
    await expect(teratas).toContainText("C44");
    await expect(teratas).toContainText("Scotch Game: Lolli Variation");
    await expect(teratas).toContainText(angka.format(22326));
    await expect(teratas).toContainText("53 · 5 · 42");

    await carian.fill("sicilian");
    const nSisilia = await barisKatalog.count();
    expect(nSisilia).toBeGreaterThan(0);
    expect(nSisilia).toBeLessThan(72);
    for (let i = 0; i < nSisilia; i += 1) {
      await expect(barisKatalog.nth(i)).toContainText(/sicilian/i);
    }
    await expect(page.getByText(jumlahBaris(nSisilia))).toBeVisible();

    await carian.fill("D00");
    await expect(barisKatalog).toHaveCount(4);

    await carian.fill("zzz");
    await expect(barisKatalog).toHaveCount(0);
    await expect(page.getByText(ganti(kamus.katalogKosong, { q: "zzz" }))).toBeVisible();

    await carian.fill("");
    await expect(barisKatalog).toHaveCount(72);

    // CTA menuju papan interaktif, kini berada di bawah paragraf pembuka.
    await expect(page.getByRole("link", { name: kamus.ctaUtama, exact: true })).toHaveAttribute("href", "/papan-interaktif");

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
      const bilahEvaluasi = document.querySelector("[data-bilah-evaluasi]");
      const menuMode = document.querySelector('nav[aria-label]');
      const batasPapan = papan?.getBoundingClientRect();
      const batasBilah = bilahEvaluasi?.getBoundingClientRect();
      return {
        lebarDokumen: document.documentElement.scrollWidth,
        lebarLayar: window.innerWidth,
        kiriPapan: batasPapan?.left ?? -1,
        kananPapan: batasPapan?.right ?? window.innerWidth + 1,
        bilahTerlihat: Boolean(batasBilah?.width && batasBilah?.height),
        kananBilah: batasBilah?.right ?? window.innerWidth + 1,
        menuMeluap: menuMode ? menuMode.scrollWidth > menuMode.clientWidth + 1 : true,
      };
    });
    expect(tataLetakResponsif.lebarDokumen).toBeLessThanOrEqual(tataLetakResponsif.lebarLayar);
    expect(tataLetakResponsif.kiriPapan).toBeGreaterThanOrEqual(0);
    expect(tataLetakResponsif.kananPapan).toBeLessThanOrEqual(tataLetakResponsif.lebarLayar);
    expect(tataLetakResponsif.bilahTerlihat).toBe(true);
    expect(tataLetakResponsif.kananBilah).toBeLessThanOrEqual(tataLetakResponsif.kiriPapan);
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
    // Bilah bukan dekorasi: evaluator Stockfish terpisah harus mengganti tanda
    // tunggu dengan skor posisi yang benar-benar diterbitkan worker.
    await expect(page.locator("[data-bilah-evaluasi]")).not.toHaveAttribute("aria-label", /—/);
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
    // Menyerah membuka dialog hasil; partai tetap aktif untuk ditinjau sehingga
    // kartu konfigurasi belum kembali. Kartu itu baru tampil lewat "Partai baru".
    const dialogSelesai = page.getByRole("dialog", { name: kamus.pveSelesaiJudul });
    await expect(dialogSelesai).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.pveMulai, exact: true })).toHaveCount(0);
    await dialogSelesai.getByRole("button", { name: kamus.pvePartaiBaru, exact: true }).click();
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
