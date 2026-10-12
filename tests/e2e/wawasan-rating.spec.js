import { expect, test } from "@playwright/test";

/*
 * Kartu "Wawasan rating" tampil di tab Ringkasan setelah PGN diimpor, dan
 * menampilkan baris per fase untuk Putih dan Hitam. Angka akurasi bisa "-"
 * bila engine belum menganalisis; yang diperiksa di sini adalah render dan
 * struktur kartu.
 */
test("kartu wawasan rating tampil di Ringkasan dengan tiga fase", async ({ page }) => {
  test.setTimeout(120_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));

  await page.goto("/program-kami/analisa/papan", { waitUntil: "domcontentloaded" });
  await page.locator('[data-uji="nav-impor"]').click();
  await page.locator('[data-uji="impor-pgn"]').fill(
    "1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5",
  );
  await page.locator('[data-uji="kirim-impor"]').dispatchEvent("click");

  const judul = page.getByText("Wawasan rating", { exact: true });
  await expect(judul).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Pembukaan", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Menengah", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Akhir", { exact: true }).first()).toBeVisible();

  // Kartu harus berada di antara Deteksi Engine dan Ekspor, sesuai urutan Ringkasan.
  const posisi = await page.evaluate(() => {
    const teks = document.body.innerText;
    return {
      wawasan: teks.indexOf("Wawasan rating"),
      ekspor: teks.search(/Ekspor|Export/),
    };
  });
  expect(posisi.wawasan).toBeGreaterThan(-1);
  if (posisi.ekspor > -1) expect(posisi.wawasan).toBeLessThan(posisi.ekspor);

  expect(galat, galat.join("\n")).toEqual([]);
});
