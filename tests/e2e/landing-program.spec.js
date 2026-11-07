import { expect, test } from "@playwright/test";

/**
 * Halaman penjelas (/program-kami/*) untuk setiap alat papan/latihan.
 *
 * Kenapa perlu: halaman-halaman ini adalah PINTU MASUK yang ditaut dari menu
 * Program Kami dan dari kartu "Alat Latihan" di Beranda. Sebelum tanggal
 * refactor mode mandiri, tiga di antaranya belum punya halaman penjelas dan
 * dua lainnya ditaut langsung ke alatnya, sehingga halaman penjelas yang rusak
 * (impor hilang, kunci terjemahan salah) tidak menggagalkan satu uji pun —
 * yang terlihat hanyalah halaman kosong bagi pengunjung.
 *
 * Yang diperiksa sengaja ringan: halaman tampil dengan judul utama, TIDAK ada
 * galat JavaScript, dan ada tautan ke alatnya. Isi alat itu sendiri sudah
 * diuji di spec masing-masing (pembukaan, hand-brain, turing-test, dst.).
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

    // Judul utama halaman isi (hero `HalamanIsi`).
    await expect(page.locator("h1").first()).toBeVisible();

    // Tautan ke alatnya — tombol ajakan di badan halaman, bukan menu.
    await expect(page.locator(`a[href="${alat}"]`).first()).toBeVisible();

    expect(galat, galat.join("\n")).toEqual([]);
  });
}
