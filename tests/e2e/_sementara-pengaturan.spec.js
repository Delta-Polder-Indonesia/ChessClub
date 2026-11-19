import { expect, test } from "@playwright/test";

const JALUR_API = (url) => url.pathname.startsWith("/api/");

test("sementara: buka pengaturan master", async ({ page }) => {
  const galatKonsol = [];
  page.on("console", (m) => { if (m.type() === "error") galatKonsol.push(m.text()); });
  const galatHalaman = [];
  page.on("pageerror", (e) => galatHalaman.push(e.stack || e.message));

  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/csrf-token") return json({ token: "csrf-uji" });
    if (path === "/api/auth/login") return json({ ok: true, token: "token-uji", username: "pengurusuji", role: "master" });
    if (path === "/api/pengurus/verifikasi") return json({ ok: true, username: "pengurusuji", role: "master" });
    if (path === "/api/pengurus/ringkasan") return json({ anggota: 12, anggotaTerdata: 4, daftarHitam: 0, otomatis: 0, pengurus: 0, pesan: { total: 0, belumDibaca: 0 }, turnamen: { total: 0, berlangsung: 0, pendaftaran: 0 }, konten: { berita: 0, pengumuman: 0 }, verifikasi: { mode: "opsional", oauthAktif: false } });
    if (path === "/api/pengurus/admins") return json([{ username: "pengurusuji", role: "master", dibuatPada: "2026-01-01T00:00:00.000Z" }]);
    if (path === "/api/pengurus/admin-info") return json({ username: "pengurusuji", role: "master", adaFile: true, sumber: "file" });
    if (path === "/api/pengurus/riwayat-masuk") return json({ isi: [], total: 0 });
    if (path === "/api/pengurus/audit") return json({ isi: [], total: 0 });
    if (path === "/api/pengurus/pesan") return json([]);
    if (path === "/api/anggota" || path === "/api/daftar-hitam") return json([]);
    return json({});
  });

  await page.goto("/pengurus");
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("password-uji");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("12", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Masuk sebagai pengurusuji" }).click();
  await page.getByRole("button", { name: "Pengaturan (Master)" }).click();
  await expect(page.getByRole("heading", { name: "Pengaturan (Master Admin)" })).toBeVisible();

  console.log("GALAT_HALAMAN:", JSON.stringify(galatHalaman));
  console.log("GALAT_KONSOL:", JSON.stringify(galatKonsol));
});
