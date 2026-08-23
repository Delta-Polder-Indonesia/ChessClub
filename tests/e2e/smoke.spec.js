import { expect, test } from "@playwright/test";

/** Kegagalan JavaScript tak tertangani harus menggagalkan alur pengguna. */
function pantauGalatHalaman(page) {
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));
  return () => expect(galat, galat.join("\n")).toEqual([]);
}

test("navigasi publik dan pencarian dapat digunakan", async ({ page }) => {
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/Komunitas Catur Indonesia/);

  await page.getByRole("button", { name: "cari" }).click();
  const input = page.getByRole("textbox", { name: "cari" });
  await expect(input).toBeVisible();
  await input.fill("turnamen");
  await page.getByRole("link", { name: "Turnamen", exact: true }).click();
  await expect(page).toHaveURL(/\/turnamen$/);
  await expect(page.getByRole("heading", { name: "Turnamen", exact: true })).toBeVisible();
  periksaGalat();
});

test("panduan catur memuat bab awal dan bab lain secara progresif", async ({ page }) => {
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/program-kami/sekolah-catur/cara-bermain-catur");
  await expect(page.getByRole("heading", { name: "Cara Bermain Catur", exact: true })).toBeVisible();

  // Bab selain bab pertama sengaja tidak dimuat sampai pembaca memintanya.
  const muatBab = page.getByRole("button", { name: "Muat bab ini" }).first();
  await expect(muatBab).toBeVisible();
  await muatBab.click();
  await expect(muatBab).toBeHidden();
  periksaGalat();
});

test("menu mobile membuka tautan pendaftaran", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Khusus viewport mobile.");
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/");
  await page.getByRole("button", { name: "menu" }).click();
  await expect(page.getByRole("link", { name: "Daftar Anggota" })).toBeVisible();
  await page.getByRole("link", { name: "Daftar Anggota" }).click();
  await expect(page).toHaveURL(/\/pendaftaran-anggota$/);
  periksaGalat();
});
