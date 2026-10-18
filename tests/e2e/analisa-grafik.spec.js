import { expect, test } from "@playwright/test";

// Worker UCI tiruan: berhenti setelah langkah PGN pertama (pencarian ketiga)
// supaya keadaan loading bisa diperiksa tanpa bergantung pada kecepatan WASM.
async function tiruMesin(page) {
  await page.addInitScript(() => {
    let lanjut = false;
    let tertunda = null;
    window.lanjutUjiGrafik = () => {
      lanjut = true;
      tertunda?.();
      tertunda = null;
    };
    window.Worker = class {
      constructor() {
        this.jumlahPencarian = 0;
        this.mati = false;
      }
      postMessage(perintah) {
        if (perintah === "uci") queueMicrotask(() => this.onmessage?.({ data: "uciok" }));
        if (perintah === "isready") queueMicrotask(() => this.onmessage?.({ data: "readyok" }));
        if (perintah.startsWith("go ")) {
          this.jumlahPencarian++;
          const nomor = this.jumlahPencarian;
          const jawab = () => setTimeout(() => {
            if (this.mati) return;
            this.onmessage?.({ data: `info depth 13 multipv 1 score cp ${nomor % 2 ? 120 : -60} pv e2e4` });
            this.onmessage?.({ data: "bestmove e2e4" });
          }, 80);
          if (nomor === 3 && !lanjut) tertunda = jawab;
          else jawab();
        }
      }
      terminate() {
        this.mati = true;
      }
    };
  });
}

function titikGrafik(jalur, jumlah) {
  return [...jalur.matchAll(/\bL ([\d.]+) ([\d.]+)/g)]
    .slice(0, jumlah)
    .map(([, x, y]) => ({ x: Number(x), y: Number(y) }));
}

async function pastikanTidakTerpotong(grafik) {
  const batas = await grafik.evaluate((svg) => {
    const { left, right } = svg.getBoundingClientRect();
    return { left, right, lebarLayar: innerWidth, lebarDokumen: document.documentElement.scrollWidth };
  });
  expect(batas.left).toBeGreaterThanOrEqual(0);
  expect(batas.right).toBeLessThanOrEqual(batas.lebarLayar + 1);
  expect(batas.lebarDokumen).toBeLessThanOrEqual(batas.lebarLayar + 1);
}

test("grafik PGN berisi semua langkah sejak loading, tumbuh tanpa bergeser dan tetap di Ringkasan", async ({ page }, testInfo) => {
  // Angka progres bergantung pada kecepatan mesin uji: worker tiruan baru
  // menjawab ~80 ms per pencarian, dan pada runner CI (2 core, puluhan uji lain
  // berjalan paralel) pencarian pertama bisa membutuhkan detik, bukan milidetik.
  // Toleransinya dinaikkan supaya yang diuji tetap urutan grafik — bukan
  // seberapa cepat mesin uji mampu meniru Stockfish.
  test.setTimeout(150_000);
  await tiruMesin(page);
  await page.goto("/program-kami/analisa/papan");
  await page.locator('[data-uji="nav-impor"]').click();
  await page.locator('[data-uji="impor-pgn"]').fill("1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5");
  // Tombol berada di panel yang masih beranimasi ketika PGN ditempel;
  // dispatchEvent memanggil handler React tanpa menunggu elemen stabil.
  await page.locator('[data-uji="kirim-impor"]').dispatchEvent("click");

  const progres = page.locator('[data-uji="kartu-progres-analisa"]');
  const grafik = page.locator('[data-uji="grafik-analisa"] svg');
  await expect(progres).toContainText("16.7%", { timeout: 90_000 }); // 1 dari 6 langkah PGN
  await expect(grafik).toHaveAttribute("role", "img");
  const pertama = titikGrafik(await grafik.locator('path[fill="#ffffff"]').getAttribute("d"), 7);
  expect(pertama).toHaveLength(7);
  expect(pertama[0].y).not.toBe(48);
  expect(pertama[1].y).not.toBe(48);
  expect(pertama.slice(2).every((p) => p.y === 48)).toBe(true); // belum dinilai
  await pastikanTidakTerpotong(grafik);
  await grafik.evaluate((svg) => { svg.dataset.penandaUji = "grafik-sama"; });

  await page.evaluate(() => window.lanjutUjiGrafik());
  await expect(progres).toHaveCount(0);
  await expect(grafik).toHaveAttribute("role", "button");
  await expect(grafik).toHaveAttribute("data-penanda-uji", "grafik-sama");
  const terakhir = titikGrafik(await grafik.locator('path[fill="#ffffff"]').getAttribute("d"), 7);
  expect(terakhir.map((p) => p.x)).toEqual(pertama.map((p) => p.x));
  expect(terakhir.slice(1).some((p) => p.y !== 48)).toBe(true);
  await pastikanTidakTerpotong(grafik);

  // Lajur nav berpindah pada 516 px; papan/panel berdampingan mulai 1100 px.
  // Memeriksa kedua sisi titik henti ini menangkap pemotongan grafik oleh
  // lebar papan yang dihitung dari <main>, bukan lebar viewport.
  if (testInfo.project.name === "desktop-chromium") {
    for (const lebar of [1100, 1099, 1024, 517, 516]) {
      await page.setViewportSize({ width: lebar, height: 720 });
      await expect.poll(() => grafik.evaluate((svg) => {
        const { left, right } = svg.getBoundingClientRect();
        return left >= 0 && right <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1;
      })).toBe(true);
    }
  }
});
