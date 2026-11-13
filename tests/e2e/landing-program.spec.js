import { expect, test } from "@playwright/test";

const RUTE_PROGRAM_TANPA_OVERFLOW = [
  "/",
  "/program-kami",
  "/program-kami/teka-teki",
  "/program-kami/rush-teka-teki",
  "/program-kami/kuis-catur",
  "/program-kami/manusia-vs-mesin",
  "/program-kami/latihan-repertoar",
  "/program-kami/hand-brain",
  "/program-kami/turing-test",
  "/program-kami/teka-teki-harian",
  "/program-kami/pembukaan",
  "/program-kami/analisa",
  "/program-kami/ebook-panduan",
];

/**
 * Halaman penjelas (/program-kami/*) untuk setiap alat papan/latihan.
 *
 * Kenapa perlu: halaman-halaman ini adalah PINTU MASUK yang ditaut dari menu
 * Program Kami dan dari kartu "Alat Latihan" di Beranda. Sebelum tanggal
 * refactor mode mandiri, tiga di antaranya belum punya halaman penjelas dan
 * dua lainnya ditaut langsung ke alatnya, sehingga halaman penjelas yang rusak
 * (impor hilang, kunci terjemahan salah) tidak menggagalkan satu uji pun —
 * yang terlihat hanyalah halaman kosong bagi pengunjung.
 */
for (const { jalur, alat } of [
  { jalur: "/program-kami/manusia-vs-mesin", alat: "/papan-interaktif/manusia-vs-mesin" },
  { jalur: "/program-kami/latihan-repertoar", alat: "/papan-interaktif/latihan-repertoar" },
  { jalur: "/program-kami/hand-brain", alat: "/papan-interaktif/hand-brain" },
  { jalur: "/program-kami/turing-test", alat: "/papan-interaktif/turing-test" },
  { jalur: "/program-kami/teka-teki-harian", alat: "/teka-teki-harian" },
]) {
  test(`halaman penjelas ${jalur} tampil dan menaut alatnya`, async ({ page }) => {
    test.setTimeout(90_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));

    const respons = await page.goto(jalur, { waitUntil: "domcontentloaded" });
    expect(respons?.status() ?? 200).toBeLessThan(400);

    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator(`a[href="${alat}"]`).first()).toBeVisible();

    if (jalur === "/program-kami/latihan-repertoar") {
      await page.addInitScript(() => localStorage.setItem("kci-bahasa", "id"));
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Tiga Cara Berlatih" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Mode tantangan" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Latihan massal" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Pohon cabang dan statistik" })).toBeVisible();
      await expect(page.getByText(/30 detik per langkah/)).toBeVisible();
    }

    expect(galat, galat.join("\n")).toEqual([]);
  });
}

test("semua rute Landing & Program Kami tampil tanpa overflow horizontal dan tanpa galat JS", async ({ page }) => {
  test.setTimeout(120_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(`${page.url()}: ${error.message}`));

  for (const jalur of RUTE_PROGRAM_TANPA_OVERFLOW) {
    const respons = await page.goto(jalur, { waitUntil: "domcontentloaded" });
    expect(respons?.status() ?? 200, `status ${jalur}`).toBeLessThan(400);

    // Pastikan konten utama rute sudah terpasang sebelum mengukur overflow.
    await expect(page.locator("main h1, main h2").first(), `judul di ${jalur}`).toBeVisible();

    if (jalur === "/program-kami/pembukaan") {
      await expect(page.locator("main table").first()).toBeVisible();
    }

    const metrik = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      metrik.scrollWidth,
      `overflow horizontal pada ${jalur} (scrollWidth=${metrik.scrollWidth}, innerWidth=${metrik.innerWidth})`
    ).toBeLessThanOrEqual(metrik.innerWidth);
  }

  expect(galat, galat.join("\n")).toEqual([]);
});

test("regresi Landing: meta/title i18n, tombol hero, CincinKemajuan, dan tabIndex CardCarousel", async ({ page }) => {
  test.setTimeout(90_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("kci-bahasa", "id"));
  await page.reload({ waitUntil: "domcontentloaded" });

  // MetaHalaman tidak tertimpa document.title mentah & meta description mengikuti bahasa.
  await expect(page).toHaveTitle(/Blunder Skuad \| Komunitas Catur Indonesia/);
  await expect(page.locator('meta[name="description"][data-rh="true"]')).toHaveAttribute(
    "content",
    /Komunitas Catur Indonesia/
  );

  await page.evaluate(() => localStorage.setItem("kci-bahasa", "en"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="description"][data-rh="true"]')).toHaveAttribute(
    "content",
    /Indonesia Chess Community/
  );

  // LandingHero memakai <button type="button"> untuk indikator slide (bukan div[role="button"]).
  const tombolHero = page.locator("section").first().locator('button[type="button"]');
  await expect(tombolHero).toHaveCount(6);
  await expect(page.locator('section div[role="button"]')).toHaveCount(0);

  // CincinKemajuan & GameTowerProgress tidak bertumpuk (tanpa -mt-14),
  // dan di desktop (xl >= 1280px) tinggi kolom kiri tetap sejajar <= papan catur.
  const kartuKiri = page.locator("[data-kartu-harian]");
  const ring = page.locator("[data-cincin-kemajuan]");
  await ring.scrollIntoViewIfNeeded();
  await expect(ring).toBeVisible();
  const track = page.locator('[data-component="GameTowerProgress"]');
  await expect(track).toBeVisible();
  const ringBox = await ring.boundingBox();
  const trackBox = await track.boundingBox();
  expect(ringBox).toBeTruthy();
  expect(trackBox).toBeTruthy();
  expect(ringBox.y + ringBox.height).toBeLessThanOrEqual(trackBox.y + 1);
  const lebarViewport = page.viewportSize()?.width ?? 0;
  if (lebarViewport >= 1280) {
    const leftBox = await kartuKiri.boundingBox();
    const boardBox = await kartuKiri.locator("xpath=following-sibling::div[1]/div").first().boundingBox();
    expect(leftBox).toBeTruthy();
    expect(boardBox).toBeTruthy();
    expect(leftBox.height).toBeLessThanOrEqual(boardBox.height + 1);
  }

  // CardCarousel menonaktifkan tautan di luar 3 kartu aktif agar Tab tidak terjebak di duplikat off-screen.
  const tautanCarousel = page.locator('a[href^="/program-kami/ebook-panduan/"]');
  await expect(tautanCarousel.first()).toBeAttached();
  const tabbableCount = await tautanCarousel.evaluateAll(
    (els) => els.filter((el) => el.getAttribute("tabindex") !== "-1").length
  );
  expect(tabbableCount).toBe(3);

  expect(galat, galat.join("\n")).toEqual([]);
});

test("regresi ProgramKami: alt gambar terlokalisasi, sizes RushTekaTeki, dan dialog PDF EbookPanduan", async ({ page }) => {
  test.setTimeout(90_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));

  // ProgramKami: alt gambar mengikuti bahasa aktif.
  await page.goto("/program-kami", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("kci-bahasa", "id"));
  await page.reload({ waitUntil: "domcontentloaded" });
  const imgProgram = page.locator('img[src*="landing-sorotan-program"]');
  await expect(imgProgram).toBeVisible();
  await expect(imgProgram).toHaveAttribute("alt", /Sesi latihan berjenjang bersama pelatih Komunitas Catur Indonesia/);

  await page.evaluate(() => localStorage.setItem("kci-bahasa", "en"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(imgProgram).toHaveAttribute("alt", /Tiered coaching session with Indonesia Chess Community coaches/);

  // RushTekaTekiLanding: atribut sizes bukan default "100vw".
  await page.goto("/program-kami/rush-teka-teki", { waitUntil: "domcontentloaded" });
  const rushImg = page.locator('img[src*="RushPuzzle"]');
  await expect(rushImg).toBeVisible();
  await expect(rushImg).toHaveAttribute("sizes", /520px/);

  // EbookPanduan: tidak ada nested article[tabIndex], dialog PDF bermakna modal, fokus kembali saat Escape.
  await page.evaluate(() => localStorage.setItem("kci-bahasa", "id"));
  await page.goto("/program-kami/ebook-panduan", { waitUntil: "domcontentloaded" });
  const kartu = page.locator("article#chess-rulebook");
  await expect(kartu).toBeVisible();
  expect(await kartu.getAttribute("tabindex")).toBeNull();

  await kartu.scrollIntoViewIfNeeded();
  await kartu.click();
  const tombolBaca = kartu.getByRole("button", { name: /Baca/i });
  await tombolBaca.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.getByRole("heading", { name: /Basic Rules of Chess/i })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(tombolBaca).toBeFocused();

  expect(galat, galat.join("\n")).toEqual([]);
});
