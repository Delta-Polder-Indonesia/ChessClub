import { test, expect } from "@playwright/test";

/*
 * Smoke test mode Hand & Brain di Papan Interaktif. Undian jenis bidak acak,
 * jadi tes membaca undian yang tampil lalu memilih langkah yang sesuai
 * (pion e2→e4 atau kuda g1→f3 — keduanya selalu legal di posisi awal).
 */
const kamus = {
  id: {
    menu: "Hand & Brain",
    giliranPutih: "Giliran Putih",
    giliranHitam: "Giliran Hitam",
    undian: /Jenis bidak undian: (Pion|Kuda)/,
    pion: "Pion",
    kuda: "Kuda",
    salahJenis: /Pilih bidak (Pion|Kuda|Gajah|Benteng|Ratu|Raja) sesuai undian\./,
    baru: "Partai baru",
  },
  en: {
    menu: "Hand & Brain",
    giliranPutih: "White to move",
    giliranHitam: "Black to move",
    undian: /Drawn piece type: (Pawn|Knight)/,
    pion: "Pawn",
    kuda: "Knight",
    salahJenis: /Move a (Pawn|Knight|Bishop|Rook|Queen|King) as drawn\./,
    baru: "New game",
  },
};

for (const [bahasa, t] of Object.entries(kamus)) {
  test(`hand & brain: undian, langkah sesuai jenis, dan pesan salah jenis (${bahasa})`, async ({ page }) => {
    test.setTimeout(120_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    // Mode ini halaman mandiri (sidebar sendiri), bukan anggota sidebar
    // Workspace: dibuka langsung dari rutenya, sama seperti Manusia vs Mesin.
    await page.goto("/papan-interaktif/hand-brain", { waitUntil: "domcontentloaded" });
    // Judul tab ditulis halaman itu sendiri lewat kerangka mode papan.
    await expect(page).toHaveTitle(new RegExp(t.menu));
    await expect(page.locator("[data-petak]")).toHaveCount(64, { timeout: 60_000 });

    const status = page.getByRole("status");
    await expect(status).toHaveText(t.giliranPutih);

    const undian = page.getByText(t.undian);
    await expect(undian).toBeVisible();
    const jenisUndian = (await undian.textContent()).match(t.undian)[1];

    if (jenisUndian === (bahasa === "en" ? "Pawn" : "Pion")) {
      // Pion undian: langkah pion dibolehkan, kuda ditolak.
      await page.locator('[data-petak="g1"]').click();
      await page.locator('[data-petak="f3"]').click();
      await expect(page.getByRole("alert")).toHaveText(t.salahJenis);
      await page.locator('[data-petak="e2"]').click();
      await page.locator('[data-petak="e4"]').click();
    } else {
      // Kuda undian: pion ditolak, kuda dibolehkan.
      await page.locator('[data-petak="e2"]').click();
      await page.locator('[data-petak="e4"]').click();
      await expect(page.getByRole("alert")).toHaveText(t.salahJenis);
      await page.locator('[data-petak="g1"]').click();
      await page.locator('[data-petak="f3"]').click();
    }

    // Giliran berganti, riwayat mencatat langkah pertama.
    await expect(status).toHaveText(t.giliranHitam);
    await expect(page.getByRole("listitem").filter({ hasText: /^1\./ })).toHaveCount(1);

    // Pengaturan tampil sebagai panel papan (bukan popup role="dialog"), menerapkan
    // perubahan tema/bidak ke papan, dan menjaga progres partai saat ditutup.
    const labelPengaturan = bahasa === "en" ? "Settings" : "Pengaturan";
    const labelTutup = bahasa === "en" ? "Close" : "Tutup";
    const labelWarna = bahasa === "en" ? "Board color" : "Warna papan";
    await page.getByRole("button", { name: labelPengaturan, exact: true }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    const panelPengaturan = page.locator('[data-panel="mode-pengaturan"]');
    await expect(panelPengaturan).toBeVisible();
    await panelPengaturan.getByLabel(labelWarna).selectOption("blue");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
    await panelPengaturan.getByRole("button", { name: labelTutup }).click();
    await expect(panelPengaturan).toBeHidden();
    await expect(page.getByRole("listitem").filter({ hasText: /^1\./ })).toHaveCount(1);
    await expect(page.locator('[data-petak="a8"]')).toHaveCSS(
      "background-color",
      "rgb(215, 229, 240)"
    );

    // Partai baru mengosongkan riwayat dan kembali ke giliran Putih.
    await page.getByRole("button", { name: t.baru, exact: true }).click();
    await expect(status).toHaveText(t.giliranPutih);
    await expect(page.getByRole("listitem")).toHaveCount(0);

    expect(galat).toEqual([]);
  });
}
