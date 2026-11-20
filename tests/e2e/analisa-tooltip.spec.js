import { expect, test } from "@playwright/test";

test("tooltip bilah navigasi Analisa hanya tampil saat bilah menciut", async ({ page }, testInfo) => {
  await page.goto("/program-kami/analisa/papan", { waitUntil: "domcontentloaded" });

  const pemicu = page.locator('[data-uji="nav-impor"]');
  const tooltip = page.locator('[data-slot="tooltip-content"]');
  const label = await pemicu.getAttribute("aria-label");

  if (testInfo.project.name === "mobile-chromium") {
    // Pada ponsel label nav memang selalu tersembunyi; pemicu tetap bernama
    // lewat aria-label, tetapi hover-tooltip tidak diperlukan di layar sentuh.
    await expect(pemicu).toHaveAttribute("aria-label", label);
    await expect(tooltip).toHaveCount(0);
    return;
  }

  await pemicu.hover();
  await expect(tooltip).toHaveCount(0);

  await page.locator('[data-uji="nav-tutup"]').click();
  await pemicu.hover();

  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveClass(/aegov-tooltip/);
  await expect(tooltip.locator('[data-slot="tooltip-arrow"]')).toBeVisible();
  await expect(tooltip).toContainText(label);
});
