import { expect, test } from "@playwright/test";

const PGN_UJI = '[Event "Uji impor"]\n[White "Andini"]\n[Black "Bagas"]\n[Result "*"]\n\n1. e4 *';

async function bukaLayarImporDenganKeyboard(page) {
  const navImpor = page.locator('[data-uji="nav-impor"]');
  await expect(navImpor).toBeVisible();
  await navImpor.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-layar="impor"]')).toBeVisible();
}

test("impor menolak input berbahaya/tidak valid dan tetap muat pada layar sempit", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/program-kami/analisa/papan");
  await bukaLayarImporDenganKeyboard(page);

  const tipeOnline = page.locator('[data-layar="impor"] button[aria-pressed]').filter({ hasText: "Online" });
  await tipeOnline.focus();
  await page.keyboard.press("Enter");
  const tautan = page.locator('[data-uji="impor-online"]');
  await expect(tautan).toBeVisible();
  await tautan.fill("https://lichess.org.attacker.example/abcdefgh");
  await page.locator('[data-uji="kirim-impor"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('[data-uji="galat-impor"]')).toContainText("tautan HTTPS");
  await expect(page.locator('[data-layar="impor"]')).toBeVisible();

  const ukuran = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    dokumen: document.documentElement.scrollWidth,
  }));
  expect(ukuran.dokumen).toBeLessThanOrEqual(ukuran.viewport + 1);

  const tipePgn = page.locator('[data-layar="impor"] button[aria-pressed]').filter({ hasText: "PGN" });
  await tipePgn.focus();
  await page.keyboard.press("Enter");
  const pgn = page.locator('[data-uji="impor-pgn"]');
  await pgn.fill("x".repeat(1024 * 1024 + 1));
  await page.locator('[data-uji="kirim-impor"]').click();
  await expect(page.locator('[data-uji="galat-impor"]')).toContainText("terlalu besar");
});

test("tautan Lichess resmi diimpor, request dibatasi, dan UI kembali ke papan", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    window.Worker = class {
      constructor() { this.dihentikan = false; }
      postMessage(perintah) {
        if (perintah === "uci") queueMicrotask(() => this.onmessage?.({ data: "uciok" }));
        if (perintah === "isready") queueMicrotask(() => this.onmessage?.({ data: "readyok" }));
        if (perintah.startsWith("go ")) setTimeout(() => {
          this.onmessage?.({ data: "info depth 1 multipv 1 score cp 0" });
          this.onmessage?.({ data: "bestmove (none)" });
        }, 30);
        // Engine palsu memberi skor deterministik agar alur parse selesai;
        // tes memvalidasi hasil impor, bukan mutu eval Stockfish.
      }
      terminate() { this.dihentikan = true; }
    };
  });
  await page.route("https://lichess.org/game/export/abcdefgh", (route) => route.fulfill({
    status: 200,
    contentType: "text/plain; charset=utf-8",
    body: PGN_UJI,
  }));
  await page.goto("/program-kami/analisa/papan");
  await bukaLayarImporDenganKeyboard(page);
  await page.locator('[data-layar="impor"] button[aria-pressed]').filter({ hasText: "Online" }).click();
  await page.locator('[data-uji="impor-online"]').fill("https://lichess.org/abcdefgh");
  await page.locator('[data-uji="kirim-impor"]').click();

  await expect(page.locator('[data-layar="impor"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('[data-uji="kartu-progres-analisa"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".analisa-root")).toContainText("Andini");
  await expect(page.locator(".analisa-root")).toContainText("Bagas");
});
