import { expect, test } from "@playwright/test";

/*
 * Wawasan Rating sudah dilepas dari tab Ringkasan. Uji ini memastikan kartu
 * tidak kembali muncul setelah PGN diimpor, tanpa mengubah atau menghapus
 * modul analisis rating yang mungkin masih digunakan di bagian lain.
 */
test("kartu Wawasan Rating tidak ditampilkan di Ringkasan", async ({ page }) => {
  test.setTimeout(120_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));

  await page.goto("/program-kami/analisa/papan", { waitUntil: "domcontentloaded" });
  await page.locator('[data-uji="nav-impor"]').click();
  await page.locator('[data-uji="impor-pgn"]').fill(
    "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5",
  );
  await page.locator('[data-uji="kirim-impor"]').dispatchEvent("click");

  await expect(page.getByText("Wawasan rating", { exact: true })).toHaveCount(0);
  expect(galat, galat.join("\n")).toEqual([]);
});
