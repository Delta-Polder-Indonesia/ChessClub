import { expect, test } from "@playwright/test";

test("tooltip bilah navigasi Analisa memakai gaya bersama", async ({ page }) => {
  await page.goto("/program-kami/analisa/papan", { waitUntil: "domcontentloaded" });

  const pemicu = page.locator('[data-uji="nav-impor"]');
  const label = await pemicu.getAttribute("aria-label");
  await pemicu.hover();

  const tooltip = page.locator('[data-slot="tooltip-content"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveClass(/aegov-tooltip/);
  await expect(tooltip).toContainText(label);
});
