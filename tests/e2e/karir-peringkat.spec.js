import { expect, test } from "@playwright/test";

const anggotaUji = [
  {
    username: "rapidstar",
    nama: "Rapid Star",
    foto: "",
    negara: "ID",
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
    negara: "US",
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
    negara: null,
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

test("bendera, kode negara, dan umur kosong mengikuti tiap pemain", async ({ page }) => {
  await page.goto("/karir");
  const baris = page.locator("tbody tr");
  await expect(baris).toHaveCount(3);

  const indonesia = baris.nth(0).locator("td").nth(1);
  const benderaIndonesia = indonesia.getByRole("img", { name: "Bendera Indonesia" });
  await expect(benderaIndonesia).toBeVisible();
  await benderaIndonesia.scrollIntoViewIfNeeded();
  await expect.poll(() => benderaIndonesia.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  const sumberBendera = await benderaIndonesia.getAttribute("src");
  expect(new URL(sumberBendera, page.url()).origin).toBe(new URL(page.url()).origin);
  await expect(indonesia).toContainText("INA");
  await expect(indonesia).toContainText("Umur: —");

  const amerika = baris.nth(1).locator("td").nth(1);
  await expect(amerika.getByRole("img", { name: "Bendera Amerika Serikat" })).toBeVisible();
  await expect(amerika).toContainText("USA");
  await expect(amerika).toContainText("Umur: —");

  const tidakAda = baris.nth(2).locator("td").nth(1);
  await expect(tidakAda.getByText("—", { exact: true })).toBeVisible();
  await expect(tidakAda).toContainText("Umur: —");
  await expect(tidakAda.locator("img")).toHaveCount(0);

  const posisi = await baris.evaluateAll((rows) => rows.map((row) => {
    const sel = row.querySelector("td:nth-child(2)");
    const gambar = sel.querySelector(":scope > div > span > *").getBoundingClientRect();
    const nama = sel.querySelector("a").getBoundingClientRect();
    return { lebar: gambar.width, tengah: gambar.left + gambar.width / 2, awalNama: nama.left };
  }));
  expect(posisi.map((item) => item.lebar)).toEqual([96, 64, 48]);
  expect(Math.max(...posisi.map((item) => item.tengah)) - Math.min(...posisi.map((item) => item.tengah))).toBeLessThan(1);
  expect(Math.max(...posisi.map((item) => item.awalNama)) - Math.min(...posisi.map((item) => item.awalNama))).toBeLessThan(1);

  await page.getByRole("button", { name: "Blitz", exact: true }).click();
  await expect(baris.first()).toContainText("Blitz Star");
  await expect(baris.first().getByRole("img", { name: "Bendera Amerika Serikat" })).toBeVisible();
  await expect(baris.nth(1).getByRole("img", { name: "Bendera Indonesia" })).toBeVisible();
});

test("nama, bendera, dan umur tetap sejajar pada setiap baris", async ({ page }) => {
  const anggota = [
    { ...anggotaUji[0], nama: "A" },
    {
      ...anggotaUji[1],
      nama: "Pemain dengan Nama yang Sangat Panjang dan Tidak Boleh Menimpa Kolom Negara",
      username: "blitzstar_pemain_panjang",
      terverifikasi: true,
      statusChess: "closed:fair_play_violations",
    },
    { ...anggotaUji[2], nama: "Nama Sedang" },
    { ...anggotaUji[2], nama: "Tanpa Username", username: null, negara: "GB-ENG" },
  ];
  await page.route("**/api/anggota", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(anggota),
  }));
  await page.goto("/karir");
  const baris = page.locator("tbody tr");
  await expect(baris).toHaveCount(anggota.length);

  const posisi = [];
  for (let i = 0; i < anggota.length; i++) {
    const sel = baris.nth(i).locator("td").nth(1);
    const negara = anggota[i].negara
      ? sel.getByRole("img", { name: /Bendera/ })
      : sel.getByText("—", { exact: true });
    const nama = anggota[i].username
      ? sel.locator("a").first()
      : sel.getByText(anggota[i].nama, { exact: true });
    const username = anggota[i].username
      ? `@${anggota[i].username}`
      : "Tidak ada username Chess.com";
    posisi.push({
      nama: await nama.boundingBox(),
      username: await sel.getByText(username, { exact: true }).boundingBox(),
      negara: await negara.boundingBox(),
      umur: await sel.getByText("Umur: —", { exact: true }).boundingBox(),
    });
  }

  const tengahY = (kotak) => kotak.y + kotak.height / 2;
  const bedaX = (kotak) => Math.max(...kotak.map((item) => item.x)) - Math.min(...kotak.map((item) => item.x));
  expect(bedaX(posisi.map((item) => item.nama))).toBeLessThan(1);
  expect(bedaX(posisi.map((item) => item.negara))).toBeLessThan(1);
  expect(bedaX(posisi.map((item) => item.umur))).toBeLessThan(1);
  for (const { nama, username, negara, umur } of posisi) {
    expect(negara.x).toBeGreaterThanOrEqual(nama.x + nama.width + 8);
    expect(Math.abs(negara.x - umur.x)).toBeLessThan(1);
    expect(Math.abs(tengahY(nama) - tengahY(negara))).toBeLessThan(2);
    expect(Math.abs(tengahY(username) - tengahY(umur))).toBeLessThan(2);
  }
  const namaPanjang = baris.nth(1).locator("td").nth(1).locator("a > span > span").first();
  const lebarNama = await namaPanjang.evaluate((el) => ({ isi: el.scrollWidth, tersedia: el.clientWidth }));
  expect(lebarNama.isi).toBeGreaterThan(lebarNama.tersedia);
  await expect(namaPanjang).toHaveAttribute("title", anggota[1].nama);
  await expect(baris.nth(1).getByText(`@${anggota[1].username}`, { exact: true })).toHaveAttribute("title", `@${anggota[1].username}`);
  const lencanaVerifikasi = baris.nth(1).getByRole("img", { name: "terverifikasi" });
  const lencanaBan = baris.nth(1).getByRole("img", { name: "kena ban fair play" });
  expect((await lencanaVerifikasi.boundingBox()).width).toBe(16);
  expect((await lencanaBan.boundingBox()).width).toBe(16);

  const benderaIndonesia = baris.first().getByRole("img", { name: "Bendera Indonesia" });
  await benderaIndonesia.scrollIntoViewIfNeeded();
  await expect(benderaIndonesia).toBeInViewport();
  const lebarHalaman = await page.evaluate(() => ({
    isi: document.documentElement.scrollWidth,
    layar: document.documentElement.clientWidth,
  }));
  expect(lebarHalaman.isi).toBeLessThanOrEqual(lebarHalaman.layar);
});

test("nama dan negara dapat terlihat bersama saat tabel digeser di layar sempit", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/karir");
  const baris = page.locator("tbody tr").first();
  await expect(baris).toContainText("Rapid Star");
  const pembungkus = page.locator("table").locator("..");
  const nama = baris.locator("td").nth(1).locator("a");
  const bendera = baris.getByRole("img", { name: "Bendera Indonesia" });
  const kode = baris.getByText("INA", { exact: true });
  const umur = baris.getByText("Umur: —", { exact: true });

  const geser = await pembungkus.evaluate((el) => {
    const namaPemain = el.querySelector("tbody tr td:nth-child(2) a");
    el.scrollLeft += namaPemain.getBoundingClientRect().left - el.getBoundingClientRect().left - 8;
    return el.scrollLeft;
  });
  expect(geser).toBeGreaterThan(0);
  const batas = await pembungkus.boundingBox();
  for (const elemen of [nama, bendera, kode, umur]) {
    const kotak = await elemen.boundingBox();
    expect(kotak.x).toBeGreaterThanOrEqual(batas.x);
    expect(kotak.x + kotak.width).toBeLessThanOrEqual(batas.x + batas.width);
  }
});

test("wilayah, kode tidak dikenal, dan umur kosong aman dalam bahasa Inggris", async ({ page }) => {
  const anggota = [
    { ...anggotaUji[0], negara: "GB-ENG", tanggalLahir: "1990-01-01" },
    { ...anggotaUji[1], negara: "ZZ" },
    { ...anggotaUji[2], negara: "../../id.svg" },
  ];
  await page.route("**/api/anggota", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(anggota),
  }));
  await page.addInitScript(() => localStorage.setItem("kci-bahasa", "en"));
  await page.goto("/karir");
  const baris = page.locator("tbody tr");
  await expect(baris).toHaveCount(3);

  const inggris = baris.nth(0).locator("td").nth(1);
  const benderaInggris = inggris.getByRole("img", { name: "Flag of ENG" });
  await expect(benderaInggris).toBeVisible();
  await benderaInggris.scrollIntoViewIfNeeded();
  await expect.poll(() => benderaInggris.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(inggris).toContainText("ENG");
  await expect(inggris).toContainText("Age: —");
  await expect(inggris).not.toContainText("1990");

  const tidakDikenal = baris.nth(1).locator("td").nth(1);
  await expect(tidakDikenal).toContainText("ZZ");
  await expect(tidakDikenal.locator("img")).toHaveCount(0);
  const tidakValid = baris.nth(2).locator("td").nth(1);
  await expect(tidakValid.getByText("—", { exact: true })).toBeVisible();
  await expect(tidakValid).toContainText("Age: —");
  await expect(tidakValid.locator("img")).toHaveCount(0);
  await expect(page.getByText(/Flags and country codes follow/)).toBeVisible();
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
