import { expect, test } from "@playwright/test";

const anggotaUji = [
  {
    username: "rapidstar",
    nama: "Rapid Star",
    foto: "",
    elo: 1840,
    ratings: {
      Rapid: { elo: 1840, win: 18, draw: 4, loss: 5 },
      Blitz: { elo: 1580, win: 8, draw: 2, loss: 4 },
    },
  },
  {
    username: "blitzstar",
    nama: "Blitz Star",
    foto: "",
    elo: 1770,
    ratings: {
      Rapid: { elo: 1700, win: 12, draw: 3, loss: 8 },
      Blitz: { elo: 1960, win: 31, draw: 5, loss: 12 },
    },
  },
  {
    username: "newmember",
    nama: "New Member",
    foto: "",
    elo: null,
    ratings: {},
  },
];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/anggota", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "X-Roster-Diperbarui": "2026-10-30T04:00:00.000Z" },
      body: JSON.stringify(anggotaUji),
    });
  });
});

test("halaman Karir menampilkan papan peringkat anggota dari roster bersama", async ({ page }) => {
  await page.goto("/karir");

  await expect(page.getByRole("heading", { name: "Karir" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Karir" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Peringkat Anggota" })).toBeVisible();
  await expect(page.getByText("Rapid Star").first()).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(page.locator("tbody tr").nth(0)).toContainText("Rapid Star");
  await expect(page.locator("tbody tr").nth(0)).toContainText("26 / 6 / 9");
  await expect(page.locator("tbody tr").nth(1)).toContainText("Blitz Star");
  await expect(page.locator("tbody tr").nth(2)).toContainText("New Member");

  await page.getByRole("button", { name: "Blitz", exact: true }).click();
  await expect(page.getByText("Blitz Star").first()).toBeVisible();
  await expect(page.locator("tbody tr").nth(0)).toContainText("Blitz Star");
  await expect(page.locator("tbody tr").nth(0)).toContainText("31 / 5 / 12");

  const cariPemain = page.getByRole("searchbox", { name: "Cari pemain" });
  await cariPemain.fill("rapid");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr").first()).toContainText("Rapid Star");

  await cariPemain.clear();
  await page.getByRole("button", { name: "Tanpa rating" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr").first()).toContainText("New Member");
});
