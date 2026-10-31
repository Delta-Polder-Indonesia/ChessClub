import { expect, test } from "@playwright/test";

const anggotaUji = [
  {
    username: "rapidstar",
    nama: "Rapid Star",
    foto: "",
    elo: 1840,
    kontrol: "Rapid",
    ratings: {
      Rapid: { elo: 1840, puncak: 1910, win: 18, draw: 4, loss: 5 },
      Blitz: { elo: 1580, puncak: 1650, win: 8, draw: 2, loss: 4 },
      Daily: { elo: 1200, puncak: null, win: 0, draw: 0, loss: 0 },
    },
  },
  {
    username: "blitzstar",
    nama: "Blitz Star",
    foto: "",
    elo: 1770,
    kontrol: "Rapid",
    ratings: {
      Rapid: { elo: 1770, puncak: 1850, win: 12, draw: 3, loss: 8 },
      Blitz: { elo: 1960, puncak: 2050, win: 31, draw: 5, loss: 12 },
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
  await page.route("https://api.chess.com/pub/player/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(route.request().url().endsWith("/stats") ? {} : { username: "pemain" }),
    });
  });
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
  await expect(page.locator("tbody tr").nth(0).locator("td").nth(3)).toHaveText("1910");
  await expect(page.locator("tbody tr").nth(1)).toContainText("Blitz Star");
  await expect(page.locator("tbody tr").nth(1).locator("td").nth(3)).toHaveText("1850");
  await expect(page.locator("tbody tr").nth(2)).toContainText("New Member");
  await expect(page.locator("tbody tr").nth(2).locator("td").nth(3)).toHaveText("—");

  await page.getByRole("button", { name: "Blitz", exact: true }).click();
  await expect(page.getByText("Blitz Star").first()).toBeVisible();
  await expect(page.locator("tbody tr").nth(0)).toContainText("Blitz Star");
  await expect(page.locator("tbody tr").nth(0)).toContainText("31 / 5 / 12");
  await expect(page.locator("tbody tr").nth(0).locator("td").nth(3)).toHaveText("2050");
  await expect(page.locator("tbody tr").nth(1).locator("td").nth(3)).toHaveText("1650");

  await page.getByRole("combobox", { name: "Kontrol waktu" }).selectOption("Daily");
  await expect(page.locator("tbody tr").nth(0)).toContainText("Rapid Star");
  await expect(page.locator("tbody tr").nth(0).locator("td").nth(3)).toHaveText("—");
  await page.getByRole("button", { name: "Blitz", exact: true }).click();

  const cariPemain = page.getByRole("searchbox", { name: "Cari pemain" });
  await cariPemain.fill("rapid");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr").first()).toContainText("Rapid Star");

  await cariPemain.clear();
  await page.getByRole("button", { name: "Tanpa rating" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr").first()).toContainText("New Member");
});

test("Puncak Utama mengikuti kontrol utama masing-masing pemain", async ({ page }) => {
  const pemain = {
    username: "blitzonly",
    nama: "Blitz Only",
    elo: 1770,
    kontrol: "Blitz",
    ratings: {
      Blitz: { elo: 1770, puncak: 1950, win: 5, draw: 1, loss: 3 },
      Bullet: { elo: 1600, puncak: 2100, win: 8, draw: 2, loss: 5 },
    },
  };
  await page.route("**/api/anggota", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([pemain]) });
  });

  await page.goto("/karir");
  const puncak = page.locator("tbody tr").first().locator("td").nth(3);
  await expect(puncak).toHaveText("1950");
  await page.getByRole("combobox", { name: "Kontrol waktu" }).selectOption("Bullet");
  await expect(puncak).toHaveText("2100");
});

test("Puncak muncul setelah roster lama disegarkan", async ({ page }) => {
  const rosterLama = structuredClone(anggotaUji);
  delete rosterLama[0].ratings.Rapid.puncak;
  let jumlahPermintaan = 0;
  await page.route("**/api/anggota", async (route) => {
    jumlahPermintaan++;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(jumlahPermintaan === 1 ? rosterLama : anggotaUji),
    });
  });

  await page.goto("/karir");
  const puncak = page.locator("tbody tr").nth(0).locator("td").nth(3);
  await expect(puncak).toHaveText("—");
  await page.getByRole("button", { name: "Muat ulang" }).click();
  await expect(puncak).toHaveText("1910");
  expect(jumlahPermintaan).toBe(2);
});
