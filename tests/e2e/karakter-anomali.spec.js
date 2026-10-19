import { expect, test } from "@playwright/test";

test("karakter anomali muncul di Landing dan disembunyikan saat pindah halaman", async ({ page }) => {
  await page.goto("/");

  const karakter = page.locator("ybouane-peeking");
  const dialog = page.locator("ybouane-peeking-dialog");
  await expect(karakter).toHaveCount(1);
  await expect(karakter.locator("canvas")).toHaveCount(1);
  await expect(dialog).toHaveCount(1);

  // Navigasi client-side mempertahankan widget di DOM, tetapi komponen harus
  // menyembunyikan karakter setelah meninggalkan Landing.
  await page.locator('a[href="/tentang-kami"]:visible').first().click();
  await expect(page).toHaveURL(/\/tentang-kami$/);
  await expect(karakter).toHaveCSS("display", "none");

  // Saat kembali ke Landing, elemen yang sama ditampilkan lagi tanpa memuat
  // atau menginisialisasi widget kedua kali.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(karakter).not.toHaveCSS("display", "none");
  await expect(karakter).toHaveCount(1);
});
