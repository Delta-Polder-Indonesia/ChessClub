import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke test browser untuk alur publik yang paling penting.
 * Server Vite dinyalakan otomatis saat `npm run uji:e2e` dijalankan.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Di atas server dev Vite, halaman pertama yang dimuat dalam satu sesi ikut
  // menanggung kompilasi graph modul secara menyeluruh (Vite meng-compile
  // setiap modul hanya saat pertama diminta). navigasi `goto` pertama itulah
  // yang paling lambat — pada mesin dingin bisa melewati 30 detik — sedangkan
  // muatan berikutnya sudah memakai cache dan selesai dalam hitungan detik.
  // Timeout dijaga agak longgar supaya `uji:e2e` tidak gagal semu karena
  // "cold start" dev server di tes yang pertama kali membuka halaman.
  timeout: 60_000,
  // Render halaman berat (mis. papan-papan pembukaan) dan ganti rute klien
  // pada mesin lambat bisa melewati 8 detik; beri kelonggaran agar
  // `uji:e2e` tidak gagal semu karena timing rendering, bukan karena bug.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    // Di luar CI server dev perlu boot dari nol; beri kelonggaran agar
    // "cold start" Vite (terutama instal node_modules dan pre-bundle deps
    // yang menahan request "/" pertama sampai optimizer selesai) tidak
    // keburu timeout sebelum server siap melayani. Mesin lambat/antivirus
    // aktif bisa memakan waktu lebih dari satu menit untuk langkah ini.
    timeout: 180_000,
  },
});
