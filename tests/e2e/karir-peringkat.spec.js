import { expect, test } from "@playwright/test";
import { muatRiwayatRapid } from "../../src/halaman/Karir/riwayatRapid.js";

const unix = (tanggal) => Date.parse(tanggal) / 1000;

function partaiRapid(username, rating, waktu, { hitam = false, ...perubahan } = {}) {
  return {
    end_time: waktu,
    rated: true,
    time_class: "rapid",
    rules: "chess",
    white: { username: hitam ? "lawan" : username, rating: hitam ? 1300 : rating },
    black: { username: hitam ? username.toUpperCase() : "lawan", rating: hitam ? rating : 1300 },
    ...perubahan,
  };
}

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

test("grafik Rapid memakai partai rated dan tersimpan saat kembali ke tab atau memuat ulang", async ({ page }) => {
  const akhir = unix("2026-10-16T08:41:34Z");
  const permintaan = [];
  await page.route("https://api.chess.com/pub/player/**", (route) => {
    const url = new URL(route.request().url());
    permintaan.push(url.pathname);
    let data = { username: "pemain" };
    if (url.pathname.endsWith("/stats")) {
      data = { chess_rapid: { last: { date: akhir } } };
    } else if (url.pathname.includes("/games/")) {
      const games = url.pathname.includes("/rapidstar/games/2026/10") ? [
        partaiRapid("RapidStar", 1640, akhir, { hitam: true }),
        partaiRapid("rapidstar", 1600, akhir - 300),
        partaiRapid("rapidstar", 1680, akhir - 200, { hitam: true }),
        partaiRapid("rapidstar", 3000, akhir - 100, { rated: false }),
        partaiRapid("rapidstar", 3001, akhir - 100, { time_class: "blitz" }),
        partaiRapid("rapidstar", 3002, akhir - 100, { rules: "chess960" }),
        partaiRapid("bukanrapidstar", 3003, akhir - 100),
        partaiRapid("rapidstar", null, akhir - 100),
      ] : [];
      data = { games };
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });

  await page.goto("/karir");
  await expect(page.locator('[data-uji="grafik-rapid"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  const baris = page.locator("tbody tr").first();
  await baris.scrollIntoViewIfNeeded();
  const grafik = baris.getByRole("img", { name: /Grafik rating Rapid Rapid Star/ });
  await expect(grafik).toBeVisible();
  await expect(grafik).toHaveAttribute("aria-label", /3 partai.*rating 1600 ke 1640/);
  await expect(grafik.locator("polyline")).toHaveAttribute("points", "2.0,34.0 40.0,2.0 78.0,18.0");
  const [peringkat, kotakGrafik, rating, avatar] = await Promise.all([
    baris.locator("td").first().locator("div > span").first().boundingBox(),
    grafik.boundingBox(),
    baris.locator(".angka-rating-tabel").boundingBox(),
    baris.locator("td").nth(1).locator(":scope > div > span > *").boundingBox(),
  ]);
  expect(peringkat.x + peringkat.width).toBeLessThan(kotakGrafik.x);
  expect(kotakGrafik.x + kotakGrafik.width).toBeLessThan(rating.x);
  expect(avatar.width).toBe(96);

  const jumlahArsip = () => permintaan.filter((url) => url.includes("/rapidstar/games/")).length;
  expect(jumlahArsip()).toBe(4);
  await page.getByRole("button", { name: "Blitz", exact: true }).click();
  await expect(page.locator('[data-uji="grafik-rapid"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  await baris.scrollIntoViewIfNeeded();
  await expect(grafik).toBeVisible();
  expect(jumlahArsip()).toBe(4);
  await page.reload();
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  await baris.scrollIntoViewIfNeeded();
  await expect(grafik).toBeVisible();
  expect(jumlahArsip()).toBe(4);
});

test("grafik membedakan riwayat tidak cukup dan galat API tanpa membuat garis palsu", async ({ page }) => {
  const akhir = unix("2026-10-16T08:41:34Z");
  const permintaan = [];
  await page.route("https://api.chess.com/pub/player/**", (route) => {
    const url = new URL(route.request().url());
    permintaan.push(url.pathname);
    if (url.pathname.endsWith("/blitzstar/stats")) return route.fulfill({ status: 500, body: "error" });
    if (url.pathname.endsWith("/stats")) return route.fulfill({ json: { chess_rapid: { last: { date: akhir } } } });
    if (url.pathname.includes("/games/")) {
      const games = url.pathname.endsWith("/2026/10") ? [partaiRapid("rapidstar", 1700, akhir)] : [];
      return route.fulfill({ json: { games } });
    }
    return route.fulfill({ json: { username: "pemain" } });
  });
  await page.goto("/karir");
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  const baris = page.locator("tbody tr");
  await baris.first().scrollIntoViewIfNeeded();
  await expect(baris.first().getByRole("img", { name: "Riwayat Rapid Rapid Star tidak cukup untuk grafik" })).toBeVisible();
  await baris.nth(1).scrollIntoViewIfNeeded();
  await expect(baris.nth(1).getByRole("img", { name: "Riwayat rating Rapid Blitz Star tidak dapat dimuat; buka ulang tab Rapid untuk mencoba lagi" })).toBeVisible();
  await expect(baris.nth(2).getByRole("img", { name: "Riwayat Rapid New Member tidak cukup untuk grafik" })).toBeVisible();
  await expect(page.locator('[data-uji="grafik-rapid"]')).toHaveCount(0);
  expect(permintaan.some((url) => url.includes("/newmember/games/"))).toBe(false);
  expect(permintaan.some((url) => url.endsWith("/newmember/stats"))).toBe(false);
});

for (const tanpaPengamat of [false, true]) test(`grafik dimuat hanya ketika baris terlihat${tanpaPengamat ? " tanpa IntersectionObserver" : ""}, termasuk setelah menggulir`, async ({ page }) => {
  if (tanpaPengamat) await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  const akhir = unix("2026-10-16T08:41:34Z");
  const daftar = Array.from({ length: 30 }, (_, i) => ({
    username: `pemain_${String(i).padStart(2, "0")}`,
    nama: `Pemain ${i}`,
    foto: "",
    elo: 2000 - i,
    kontrol: "Rapid",
    ratings: { Rapid: { elo: 2000 - i, puncak: 2000, win: 1, draw: 0, loss: 1 } },
  }));
  const arsip = [];
  await page.route("**/api/anggota", (route) => route.fulfill({ json: daftar }));
  await page.route("https://api.chess.com/pub/player/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/stats")) return route.fulfill({ json: { chess_rapid: { last: { date: akhir } } } });
    if (url.pathname.includes("/games/")) {
      const username = url.pathname.split("/")[3];
      arsip.push(username);
      const games = url.pathname.endsWith("/2026/10") ? [
        partaiRapid(username, 1500, akhir - 60),
        partaiRapid(username, 1510, akhir),
      ] : [];
      return route.fulfill({ json: { games } });
    }
    return route.fulfill({ json: { username: "pemain" } });
  });
  await page.goto("/karir");
  await expect(page.locator("tbody tr")).toHaveCount(30);
  expect(arsip).toHaveLength(0);
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  const pertama = page.locator("tbody tr").first();
  await pertama.scrollIntoViewIfNeeded();
  await expect(pertama.locator('[data-uji="grafik-rapid"]')).toBeVisible();
  expect(arsip).not.toContain("pemain_29");

  const terakhir = page.locator("tbody tr").last();
  await terakhir.scrollIntoViewIfNeeded();
  await expect(terakhir.locator('[data-uji="grafik-rapid"]')).toBeVisible();
  expect(arsip).toContain("pemain_29");
});

test("grafik Rapid tetap terbaca dan kolom pemain dapat digeser pada layar sempit", async ({ page }) => {
  const akhir = unix("2026-10-16T08:41:34Z");
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("https://api.chess.com/pub/player/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/stats")) return route.fulfill({ json: { chess_rapid: { last: { date: akhir } } } });
    if (url.pathname.includes("/games/")) {
      const username = url.pathname.split("/")[3];
      const games = url.pathname.endsWith("/2026/10") ? [
        partaiRapid(username, 1500, akhir - 60),
        partaiRapid(username, 1510, akhir),
      ] : [];
      return route.fulfill({ json: { games } });
    }
    return route.fulfill({ json: { username: "pemain" } });
  });
  await page.goto("/karir");
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  const baris = page.locator("tbody tr").first();
  await baris.scrollIntoViewIfNeeded();
  const grafik = baris.locator('[data-uji="grafik-rapid"]');
  await expect(grafik).toBeVisible();
  const pembungkus = page.locator("table").locator("..");
  const [batas, kotakGrafik, kotakRating] = await Promise.all([
    pembungkus.boundingBox(), grafik.boundingBox(), baris.locator(".angka-rating-tabel").boundingBox(),
  ]);
  expect(kotakGrafik.x).toBeGreaterThanOrEqual(batas.x);
  expect(kotakRating.x + kotakRating.width).toBeLessThanOrEqual(batas.x + batas.width);

  const nama = baris.locator("td").nth(1).locator("a");
  await pembungkus.evaluate((el) => {
    const namaPemain = el.querySelector("tbody tr td:nth-child(2) a");
    el.scrollLeft += namaPemain.getBoundingClientRect().left - el.getBoundingClientRect().left - 8;
  });
  for (const elemen of [nama, baris.getByRole("img", { name: "Bendera Indonesia" }), baris.getByText("Umur: —")]) {
    const kotak = await elemen.boundingBox();
    expect(kotak.x).toBeGreaterThanOrEqual(batas.x);
    expect(kotak.x + kotak.width).toBeLessThanOrEqual(batas.x + batas.width);
  }
});

test("pengambilan Rapid memfilter warna, jenis, waktu, dan batas tiga bulan lintas tahun", async () => {
  const akhir = unix("2026-01-31T12:00:00Z");
  const panggilan = [];
  const asli = globalThis.fetch;
  globalThis.fetch = async (alamat) => {
    const url = String(alamat);
    panggilan.push(url);
    if (url.endsWith("/stats")) return Response.json({ chess_rapid: { last: { date: akhir } } });
    const bulan = url.slice(-7);
    const arsip = {
      "2026/01": [
        partaiRapid("ujirentang", 1060, akhir, { hitam: true }),
        partaiRapid("ujirentang", 1050, unix("2026-01-15T10:00:00Z")),
        partaiRapid("ujirentang", 9999, akhir + 1),
        partaiRapid("ujirentang", 9998, akhir - 10, { time_class: "blitz" }),
        partaiRapid("ujirentang", 9997, akhir - 20, { rated: false }),
        partaiRapid("ujirentang", 9996, akhir - 30, { rules: "chess960" }),
        partaiRapid("oranglain", 9995, akhir - 40),
        partaiRapid("ujirentang", "9994", akhir - 50),
      ],
      "2025/12": [partaiRapid("ujirentang", 1020, unix("2025-12-10T08:00:00Z"), { hitam: true })],
      "2025/11": [partaiRapid("ujirentang", 1010, unix("2025-11-05T08:00:00Z"))],
      "2025/10": [
        partaiRapid("ujirentang", 1000, unix("2025-10-31T12:00:00Z")),
        partaiRapid("ujirentang", 900, unix("2025-10-31T11:59:59Z")),
      ],
    };
    return Response.json({ games: arsip[bulan] || [] });
  };
  try {
    const hasil = await muatRiwayatRapid("UjiRentang");
    expect(hasil.map((titik) => titik.rating)).toEqual([1000, 1010, 1020, 1050, 1060]);
    expect(panggilan.map((url) => url.split("/").slice(-2).join("/"))).toEqual([
      "ujirentang/stats", "2026/01", "2025/12", "2025/11", "2025/10",
    ]);
    expect(await muatRiwayatRapid("../../invalid")).toEqual([]);
    expect(panggilan).toHaveLength(5);
  } finally {
    globalThis.fetch = asli;
  }
});

test("riwayat dibatasi 20 partai terbaru, berhenti lebih awal, dan cache kedaluwarsa", async () => {
  const akhir = unix("2026-10-16T08:41:34Z");
  let sekarang = Date.now();
  const waktuAsli = Date.now;
  const fetchAsli = globalThis.fetch;
  const panggilan = [];
  Date.now = () => sekarang;
  globalThis.fetch = async (alamat) => {
    const url = String(alamat);
    panggilan.push(url);
    if (url.endsWith("/stats")) return Response.json({ chess_rapid: { last: { date: akhir } } });
    const games = Array.from({ length: 25 }, (_, i) => partaiRapid("ujibatas", 1000 + i, akhir - (24 - i) * 10)).reverse();
    return Response.json({ games });
  };
  try {
    const hasil = await muatRiwayatRapid("UjiBatas");
    expect(hasil.map((titik) => titik.rating)).toEqual(Array.from({ length: 20 }, (_, i) => 1005 + i));
    expect(panggilan).toHaveLength(2);
    expect(panggilan[1]).toMatch(/\/games\/2026\/10$/);
    expect(await muatRiwayatRapid("UJIBATAS")).toEqual(hasil);
    expect(panggilan).toHaveLength(2);
    sekarang += 60 * 60 * 1000 + 1;
    expect(await muatRiwayatRapid("ujibatas")).toEqual(hasil);
    expect(panggilan).toHaveLength(4);
  } finally {
    Date.now = waktuAsli;
    globalThis.fetch = fetchAsli;
  }
});

test("permintaan grafik berjalan berurutan dan antrean batal tidak menghubungi API", async () => {
  const asli = globalThis.fetch;
  const panggilan = [];
  let lepas;
  let mulai;
  const gerbang = new Promise((resolve) => { lepas = resolve; });
  const sudahMulai = new Promise((resolve) => { mulai = resolve; });
  globalThis.fetch = async (alamat) => {
    panggilan.push(String(alamat));
    mulai();
    await gerbang;
    return Response.json({});
  };
  try {
    const pertama = muatRiwayatRapid("ujiantria");
    await sudahMulai;
    const kontrol = new AbortController();
    const kedua = muatRiwayatRapid("ujiantrib", { signal: kontrol.signal })
      .then(() => "berhasil", (galat) => galat.name);
    expect(panggilan).toHaveLength(1);
    kontrol.abort();
    lepas();
    expect(await pertama).toEqual([]);
    expect(await kedua).toBe("AbortError");
    expect(panggilan).toHaveLength(1);
  } finally {
    lepas?.();
    globalThis.fetch = asli;
  }
});

test("galat Chess.com tidak disimpan sebagai riwayat kosong", async () => {
  const asli = globalThis.fetch;
  let panggilan = 0;
  globalThis.fetch = async () => {
    panggilan++;
    return panggilan === 1 ? new Response("error", { status: 500 }) : Response.json({});
  };
  try {
    await expect(muatRiwayatRapid("ujigagal")).rejects.toThrow("Chess.com menjawab 500");
    expect(await muatRiwayatRapid("ujigagal")).toEqual([]);
    expect(panggilan).toBe(2);
  } finally {
    globalThis.fetch = asli;
  }
});

test("grafik Rapid bernilai tetap memiliki garis datar dan label bahasa Inggris", async ({ page }) => {
  const akhir = unix("2026-10-16T08:41:34Z");
  await page.addInitScript(() => localStorage.setItem("kci-bahasa", "en"));
  await page.route("https://api.chess.com/pub/player/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/stats")) return route.fulfill({ json: { chess_rapid: { last: { date: akhir } } } });
    if (url.pathname.includes("/games/")) {
      const username = url.pathname.split("/")[3];
      const games = url.pathname.endsWith("/2026/10") ? [
        partaiRapid(username, 1500, akhir - 60),
        partaiRapid(username, 1500, akhir, { hitam: true }),
      ] : [];
      return route.fulfill({ json: { games } });
    }
    return route.fulfill({ json: { username: "pemain" } });
  });
  await page.goto("/karir");
  await page.getByRole("button", { name: "Rapid", exact: true }).click();
  const baris = page.locator("tbody tr").first();
  await baris.scrollIntoViewIfNeeded();
  const grafik = baris.getByRole("img", { name: /Rapid rating chart for Rapid Star/ });
  await expect(grafik).toBeVisible();
  await expect(grafik).toHaveAttribute("aria-label", /2 games.*rating 1500 to 1500/);
  await expect(grafik.locator("polyline")).toHaveAttribute("points", "2.0,18.0 78.0,18.0");
});

test("arsip bulanan 404 dilewati tanpa menganggap data yang lain gagal", async () => {
  const akhir = unix("2026-03-31T12:00:00Z");
  const asli = globalThis.fetch;
  const panggilan = [];
  globalThis.fetch = async (alamat) => {
    const url = String(alamat);
    panggilan.push(url);
    if (url.endsWith("/stats")) return Response.json({ chess_rapid: { last: { date: akhir } } });
    if (url.endsWith("/2026/03") || url.endsWith("/2026/01")) return new Response("not found", { status: 404 });
    if (url.endsWith("/2026/02")) return Response.json({ games: [partaiRapid("uji404", 1550, unix("2026-02-12T00:00:00Z"))] });
    return Response.json({ games: [partaiRapid("uji404", 1500, unix("2025-12-31T12:00:00Z"))] });
  };
  try {
    expect((await muatRiwayatRapid("uji404")).map((titik) => titik.rating)).toEqual([1500, 1550]);
    expect(panggilan).toHaveLength(5);
  } finally {
    globalThis.fetch = asli;
  }
});

test("cache yang rusak diabaikan dan penyimpanan yang gagal tidak merusak grafik", async () => {
  const fetchAsli = globalThis.fetch;
  const storageAsli = globalThis.localStorage;
  let panggilan = 0;
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ disimpanPada: Date.now(), nilai: [{ waktu: 1e30, rating: 1500 }] }),
    setItem: () => { throw new Error("penuh"); },
  };
  globalThis.fetch = async () => {
    panggilan++;
    return Response.json({});
  };
  try {
    expect(await muatRiwayatRapid("ujicache")).toEqual([]);
    expect(await muatRiwayatRapid("ujicache")).toEqual([]);
    expect(panggilan).toBe(1);
  } finally {
    globalThis.fetch = fetchAsli;
    if (storageAsli === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = storageAsli;
  }
});

test("respons 429 menunda permintaan grafik berikutnya dan dapat dicoba setelah jeda", async () => {
  const fetchAsli = globalThis.fetch;
  const waktuAsli = Date.now;
  let sekarang = waktuAsli() - 120_000;
  let panggilan = 0;
  Date.now = () => sekarang;
  globalThis.fetch = async () => {
    panggilan++;
    return panggilan === 1 ? new Response("terlalu banyak", { status: 429 }) : Response.json({});
  };
  try {
    await expect(muatRiwayatRapid("ujibatashit")).rejects.toThrow("Chess.com menjawab 429");
    await expect(muatRiwayatRapid("ujibatashit")).rejects.toThrow("Chess.com sedang membatasi permintaan");
    expect(panggilan).toBe(1);
    sekarang += 60_001;
    expect(await muatRiwayatRapid("ujibatashit")).toEqual([]);
    expect(panggilan).toBe(2);
  } finally {
    Date.now = waktuAsli;
    globalThis.fetch = fetchAsli;
  }
});

test("membatalkan permintaan aktif membebaskan antrean untuk pemain lain", async () => {
  const asli = globalThis.fetch;
  let mulai;
  const sudahMulai = new Promise((resolve) => { mulai = resolve; });
  globalThis.fetch = (alamat, { signal } = {}) => {
    if (String(alamat).includes("ujibatalaktif")) {
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Batal", "AbortError")), { once: true });
        mulai();
      });
    }
    return Promise.resolve(Response.json({}));
  };
  try {
    const kontrol = new AbortController();
    const pertama = muatRiwayatRapid("ujibatalaktif", { signal: kontrol.signal })
      .then(() => "berhasil", (galat) => galat.name);
    await sudahMulai;
    const kedua = muatRiwayatRapid("ujiberikut");
    kontrol.abort();
    expect(await pertama).toBe("AbortError");
    expect(await kedua).toEqual([]);
  } finally {
    globalThis.fetch = asli;
  }
});
