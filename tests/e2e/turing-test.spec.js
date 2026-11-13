import { test, expect } from "@playwright/test";

/*
 * Smoke test Turing test di Papan Interaktif: tempel PGN, tunggu Stockfish
 * menyiapkan soal, jawab satu soal, lalu pastikan umpan balik tampil.
 */
const PGN = `[Event "Uji A"]
[White "P1"]
[Black "P2"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. O-O O-O 12. Rfe1 *

[Event "Uji B"]
[White "P3"]
[Black "P4"]
[Result "*"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 *
`;

const kamus = {
  id: {
    menu: "Turing test",
    mulai: "Mulai tebak",
    soal: /Soal 1 dari \d+/,
    tanya: "Langkah mana yang dimainkan manusia?",
    hasil: /^(Benar!|Salah\.) Langkah/,
    berikut: /Soal berikutnya|Lihat skor/,
    label: "PGN partai manusia",
  },
  en: {
    menu: "Turing test",
    mulai: "Start guessing",
    soal: /Puzzle 1 of \d+/,
    tanya: "Which move was played by a human?",
    hasil: /^(Correct!|Wrong\.) /,
    berikut: /Next puzzle|See score/,
    label: "Human games PGN",
  },
};

for (const [bahasa, t] of Object.entries(kamus)) {
  test(`turing test: tempel PGN, tebak satu soal, lihat umpan balik (${bahasa})`, async ({ page }) => {
    test.setTimeout(180_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    // Turing test kini halaman mandiri (sidebar sendiri), jadi dibuka langsung
    // dari rutenya — bukan lewat sidebar Workspace yang sudah tidak memuatnya.
    await page.goto("/papan-interaktif/turing-test", { waitUntil: "domcontentloaded" });
    await page.getByLabel(t.label).fill(PGN);
    await page.getByRole("button", { name: t.mulai, exact: true }).click();

    await expect(page.getByText(t.soal)).toBeVisible({ timeout: 150_000 });
    await expect(page.getByText(t.tanya)).toBeVisible();

    // Dua pilihan langkah ada di panel samping section Turing test, bukan
    // di sidebar navigasi yang juga memakai `aside`.
    await page.getByRole("region", { name: t.menu }).locator("aside button").first().click();
    await expect(page.getByRole("status").filter({ hasText: t.hasil })).toBeVisible();
    await expect(page.getByRole("button", { name: t.berikut })).toBeVisible();

    // Pengaturan tampil non-popup di area utama mode, memodifikasi warna papan,
    // dan mempertahankan soal Turing test saat ditutup.
    const labelPengaturan = bahasa === "en" ? "Settings" : "Pengaturan";
    const labelWarna = bahasa === "en" ? "Board color" : "Warna papan";
    await page.getByRole("button", { name: labelPengaturan, exact: true }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    const panelPengaturan = page.locator('[data-panel="mode-pengaturan"]');
    await expect(panelPengaturan).toBeVisible();
    await panelPengaturan.getByLabel(labelWarna).selectOption("wood");
    await page.keyboard.press("Escape");
    await expect(panelPengaturan).toBeHidden();
    await expect(page.getByRole("status").filter({ hasText: t.hasil })).toBeVisible();
    await expect(page.locator('[data-petak="a8"]')).toHaveCSS(
      "background-color",
      "rgb(231, 199, 143)"
    );

    expect(galat, galat.join("\n")).toEqual([]);
  });
}

/*
 * Impor dari Lichess. Permintaan ke lichess.org dicegat (page.route) supaya
 * tes tidak bergantung pada jaringan; respons yang dikirim meniru PGN asli.
 */
test("turing test: ambil partai dari Lichess lalu mulai tebak (id)", async ({ page }) => {
  test.setTimeout(180_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));
  let urlDipanggil = "";
  await page.route(/lichess\.org\/api\/games\/user\//, (route) => {
    urlDipanggil = route.request().url();
    route.fulfill({ status: 200, contentType: "application/x-chess-pgn", body: PGN });
  });
  await page.addInitScript(() => localStorage.setItem("kci-bahasa", "id"));
  await page.goto("/papan-interaktif/turing-test", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Atau ambil dari Lichess (nama pengguna)").fill("uji-pemain");
  await page.getByRole("button", { name: "Ambil partai", exact: true }).click();
  await expect(page.getByLabel("PGN partai manusia")).toHaveValue(/\[Event "Uji A"\]/);
  expect(urlDipanggil).toContain("/api/games/user/uji-pemain?");

  await page.getByRole("button", { name: "Mulai tebak", exact: true }).click();
  await expect(page.getByText(/Soal 1 dari \d+/)).toBeVisible({ timeout: 150_000 });
  expect(galat, galat.join("\n")).toEqual([]);
});

test("turing test: pengguna tidak ditemukan di Lichess menampilkan pesan galat (id)", async ({ page }) => {
  await page.route(/lichess\.org\/api\/games\/user\//, (route) => route.fulfill({ status: 404, body: "" }));
  await page.addInitScript(() => localStorage.setItem("kci-bahasa", "id"));
  await page.goto("/papan-interaktif/turing-test", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Atau ambil dari Lichess (nama pengguna)").fill("tidak-ada-kali");
  await page.getByRole("button", { name: "Ambil partai", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Pengguna tidak ditemukan atau belum punya partai.");
});
