import { expect, test } from "@playwright/test";

/** Kegagalan JavaScript tak tertangani harus menggagalkan alur pengguna. */
function pantauGalatHalaman(page) {
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));
  return () => expect(galat, galat.join("\n")).toEqual([]);
}

/** Backend tiruan untuk memverifikasi alur browser tanpa data produksi. */
async function tiruApiPublik(page, onRequest = () => {}) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    onRequest({ path, method: request.method(), body: request.postDataJSON?.() });
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/api/csrf-token") return json({ token: "csrf-uji" });
    if (path === "/api/auth/cara") return json({ oauth: false, kodeProfil: true, mode: "opsional" });
    if (path === "/api/anggota" && request.method() === "POST") return json({ username: "pecaturuji" }, 201);
    if (path === "/api/anggota") return json([]);
    if (path === "/api/pesan" && request.method() === "POST") return json({ id: "pesan-uji" }, 201);
    return json({});
  });
}

async function tiruApiPengurus(page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const token = request.headers()["x-token-admin"];

    if (path === "/api/csrf-token") return json({ token: "csrf-pengurus" });
    if (path === "/api/pengurus/ringkasan") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({
        anggota: 12, anggotaTerdata: 4, daftarHitam: 0, otomatis: 0, pengurus: 0,
        pesan: { total: 0, belumDibaca: 0 },
        turnamen: { total: 0, berlangsung: 0, pendaftaran: 0 },
        konten: { berita: 0, pengumuman: 0 }, verifikasi: { mode: "opsional", oauthAktif: false },
      });
    }
    if (path === "/api/pengurus/pesan") return json([]);
    if (path === "/api/anggota" || path === "/api/daftar-hitam") return json([]);
    return json({});
  });
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

test("perpindahan ke bahasa Inggris memuat terjemahan", async ({ page, isMobile }) => {
  test.skip(isMobile, "Tombol bahasa berada pada navigasi desktop.");
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Pilih bahasa" }).click();
  await expect(page.getByRole("link", { name: "About Us" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  periksaGalat();
});

test("dashboard pengurus menolak token tidak sah", async ({ page }) => {
  await tiruApiPengurus(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pengurus");
  await expect(page.getByRole("heading", { name: "Dashboard Pengurus" })).toBeVisible();
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("token-salah");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Token pengurus tidak dikenali.")).toBeVisible();
  periksaGalat();
});

test("dashboard pengurus memverifikasi token dan logout dengan aman", async ({ page }) => {
  await tiruApiPengurus(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pengurus");
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("token-uji");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText("12", { exact: true })).toBeVisible();
  await page.getByTitle("Masuk sebagai pengurusuji").click();
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  periksaGalat();
});

test("form pendaftaran menampilkan validasi lokal sebelum mengirim", async ({ page }) => {
  await tiruApiPublik(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pendaftaran-anggota");
  await page.locator("form").getByRole("button", { name: "Daftar Anggota" }).click();
  await expect(page.getByRole("alert")).toContainText("Periksa kembali isian");
  await expect(page.locator('input[name="username"]')).toHaveAttribute("aria-invalid", "true");
  periksaGalat();
});

test("form pendaftaran mengirim data sah dan berpindah ke keanggotaan", async ({ page }) => {
  const requests = [];
  await tiruApiPublik(page, (request) => requests.push(request));
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pendaftaran-anggota");

  await page.locator('input[name="username"]').fill("pecaturuji");
  await page.locator('input[name="namaLengkap"]').fill("Pecatur Penguji");
  await page.locator('input[name="panggilan"]').fill("Uji");
  await page.locator('input[name="tanggalLahir"]').fill("1995-05-20");
  await page.locator('input[name="kota"]').fill("Medan");
  await page.locator('input[name="hp"]').fill("081234567890");
  await page.locator('input[name="email"]').fill("uji@example.test");
  await page.locator('input[name="setuju"]').check();
  await page.locator("form").getByRole("button", { name: "Daftar Anggota" }).click();

  await expect(page).toHaveURL(/struktur-grup-catur.*keanggotaan/);
  const pendaftaran = requests.find((request) => request.path === "/api/anggota" && request.method === "POST");
  expect(pendaftaran?.body).toMatchObject({ username: "pecaturuji", kota: "Medan" });
  periksaGalat();
});

test("form Hubungi Kami mengirim pesan setelah persetujuan", async ({ page }) => {
  const requests = [];
  await tiruApiPublik(page, (request) => requests.push(request));
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/hubungi-kami");

  await page.locator('input[name="nama"]').fill("Pengunjung Uji");
  await page.locator('input[name="email"]').fill("pengunjung@example.test");
  await page.locator('input[name="subjek"]').fill("Pertanyaan fitur");
  await page.locator('textarea[name="pesan"]').fill("Mohon informasi kegiatan berikutnya.");
  await page.locator('input[name="agreement"]').check();
  await page.getByRole("button", { name: "Kirim Pesan" }).click();

  await expect(page.getByText("Pesan Anda berhasil dikirim!")).toBeVisible();
  const pesan = requests.find((request) => request.path === "/api/pesan" && request.method === "POST");
  expect(pesan?.body).toMatchObject({ nama: "Pengunjung Uji", subjek: "Pertanyaan fitur" });
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
