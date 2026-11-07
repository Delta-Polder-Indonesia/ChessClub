import { expect, test } from "@playwright/test";
import { bukuPembukaan as id } from "../../src/lib/terjemahan/id/program.js";
import { bukuPembukaan as en } from "../../src/lib/terjemahan/en/program.js";
import { papan as papanId } from "../../src/lib/terjemahan/id/papan.js";
import { papan as papanEn } from "../../src/lib/terjemahan/en/papan.js";

/** Ganti token {kunci} pada teks kamus, sama seperti fungsi t() aplikasi. */
const ganti = (teks, nilai) => teks.replace(/\{(\w+)\}/g, (_, kunci) => nilai[kunci]);

/**
 * Ukuran papan, bilah evaluasi, dan sidebar mode dari DOM yang sedang tampil.
 * Nilai `-1`/`lebarLayar + 1` menandai elemen yang tidak ditemukan, supaya
 * pemeriksaan batas tetap gagal (bukan lulus diam-diam).
 */
const ukurTataLetak = (page) =>
  page.evaluate(() => {
    const petak = document.querySelector('[data-petak="e2"]');
    const papan = petak?.parentElement?.parentElement;
    const bilahEvaluasi = document.querySelector("[data-bilah-evaluasi]");
    const menuMode = document.querySelector('nav[aria-label]');
    const batasPapan = papan?.getBoundingClientRect();
    const batasBilah = bilahEvaluasi?.getBoundingClientRect();
    return {
      lebarDokumen: document.documentElement.scrollWidth,
      lebarLayar: window.innerWidth,
      kiriPapan: batasPapan?.left ?? -1,
      kananPapan: batasPapan?.right ?? window.innerWidth + 1,
      bilahTerlihat: Boolean(batasBilah?.width && batasBilah?.height),
      kananBilah: batasBilah?.right ?? window.innerWidth + 1,
      menuMeluap: menuMode ? menuMode.scrollWidth > menuMode.clientWidth + 1 : true,
    };
  });

for (const [bahasa, kamus] of [["id", id], ["en", en]]) {
  test(`landing pembukaan: masthead dan katalog pencarian (${bahasa})`, async ({ page }) => {
    // Muatan pertama menanggung kompilasi graph modul Vite pada mesin dingin.
    test.setTimeout(120_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    await page.route((url) => url.pathname.startsWith("/api/"), (route) =>
      route.fulfill({ json: {} }),
    );
    await page.goto("/program-kami/pembukaan", { waitUntil: "domcontentloaded" });

    const lokal = bahasa === "en" ? "en-US" : "id-ID";
    const angka = new Intl.NumberFormat(lokal);

    // Hero dan pembuka editorial.
    await expect(page.getByRole("heading", { name: kamus.judul, exact: true })).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("heading", { name: kamus.introJudul, exact: true })).toBeVisible();

    // Katalog: 72 keluarga teratas, pencarian hidup menurut nama dan ECO.
    const carian = page.getByRole("searchbox", { name: kamus.katalogPlaceholder });
    await expect(carian).toBeVisible();
    const barisKatalog = page.locator("tr[data-katalog]");
    await expect(barisKatalog).toHaveCount(72);
    const jumlahBaris = (n) => ganti(kamus.katalogJumlah, { n: angka.format(n), total: angka.format(72) });
    await expect(page.getByText(jumlahBaris(72))).toBeVisible();
    const teratas = barisKatalog.first();
    await expect(teratas).toContainText("C44");
    await expect(teratas).toContainText("Scotch Game: Lolli Variation");
    await expect(teratas).toContainText(angka.format(22326));
    await expect(teratas).toContainText("53 · 5 · 42");

    await carian.fill("sicilian");
    const nSisilia = await barisKatalog.count();
    expect(nSisilia).toBeGreaterThan(0);
    expect(nSisilia).toBeLessThan(72);
    for (let i = 0; i < nSisilia; i += 1) {
      await expect(barisKatalog.nth(i)).toContainText(/sicilian/i);
    }
    await expect(page.getByText(jumlahBaris(nSisilia))).toBeVisible();

    await carian.fill("D00");
    await expect(barisKatalog).toHaveCount(4);

    await carian.fill("zzz");
    await expect(barisKatalog).toHaveCount(0);
    await expect(page.getByText(ganti(kamus.katalogKosong, { q: "zzz" }))).toBeVisible();

    await carian.fill("");
    await expect(barisKatalog).toHaveCount(72);

    // CTA menuju papan interaktif, kini berada di bawah paragraf pembuka.
    await expect(page.getByRole("link", { name: kamus.ctaUtama, exact: true })).toHaveAttribute("href", "/papan-interaktif");

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(galat).toEqual([]);
  });
}

for (const [bahasa, kamus] of [["id", papanId], ["en", papanEn]]) {
  test(`papan interaktif membuka papan lama tanpa meninggalkan workspace (${bahasa})`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const galat = [];
    page.on("pageerror", (error) => galat.push(error.message));
    await page.addInitScript((nilai) => localStorage.setItem("kci-bahasa", nilai), bahasa);
    await page.goto("/papan-interaktif", { waitUntil: "domcontentloaded" });

    const menu = page.getByRole("navigation", { name: kamus.menuMode });
    const analisa = menu.getByRole("link", { name: kamus.menuAnalisa, exact: true });
    await expect(analisa).toHaveAttribute("aria-current", "page");
    // Sidebar adalah tautan rute: lima link internal (Manusia vs Mesin kini rute
    // mandiri dengan sidebar sendiri), semuanya tetap di bawah /papan-interaktif.
    await expect(menu.getByRole("link")).toHaveCount(5);
    const hrefMenu = await menu.getByRole("link").evaluateAll((tautan) => tautan.map((a) => a.getAttribute("href")));
    for (const href of hrefMenu) expect(href.startsWith("/papan-interaktif")).toBe(true);
    await expect(page.locator('a[href="/program-kami/analisa"]')).toHaveCount(0);
    await expect(page.locator("[data-petak]")).toHaveCount(64, { timeout: 30_000 });
    await expect(page.getByRole("tab", { name: kamus.tabBuku })).toBeVisible();
    await expect(page.getByText(kamus.workspacePilih)).toHaveCount(0);
    await expect(page.getByRole("button", { name: kamus.workspaceKembali })).toHaveCount(0);

    // Kontrol dasar di dasar panel (navigasi langkah + tombol aksi) harus
    // dapat dijangkau pengguna di viewport sempit: muat di layar, ATAU berada
    // di dalam wadah yang menggulir secara pengguna (overflow-y auto/scroll).
    // Regresi lama: seluruh rantai wadah memakai overflow-hidden sehingga isi
    // yang lebih tinggi dari layar terpotong tanpa jalan menggulir.
    const jangkauan = await page.evaluate((label) => {
      const tombol = [...document.querySelectorAll("button")].find(
        (b) => b.textContent.trim() === label
      );
      if (!tombol) return { ada: false, jangkau: false, mode: "hilang" };
      const kotak = tombol.getBoundingClientRect();
      if (kotak.top >= 0 && kotak.bottom <= window.innerHeight) {
        return { ada: true, jangkau: true, mode: "muat" };
      }
      let el = tombol.parentElement;
      while (el) {
        if (el.scrollHeight > el.clientHeight + 1) {
          const oy = getComputedStyle(el).overflowY;
          return { ada: true, jangkau: oy === "auto" || oy === "scroll", mode: oy };
        }
        el = el.parentElement;
      }
      return { ada: true, jangkau: false, mode: "terpotong" };
    }, kamus.baru);
    expect(jangkauan.ada, "tombol aksi panel harus ada").toBe(true);
    expect(jangkauan.jangkau, `tombol aksi panel harus dapat dijangkau (${jangkauan.mode})`).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    if (testInfo.project.name === "desktop-chromium") {
      for (const [lebar, tinggi] of [[1366, 768], [1366, 600], [1024, 768]]) {
        await page.setViewportSize({ width: lebar, height: tinggi });
        const ukuran = await page.evaluate(() => {
          const papan = document.querySelector('[data-petak="e2"]').parentElement.parentElement;
          const lajur = papan.closest('div[class*="lg:max-w-"]');
          const batas = papan.getBoundingClientRect();
          return {
            lebarDokumen: document.documentElement.scrollWidth,
            tinggiDokumen: document.documentElement.scrollHeight,
            lebarLayar: innerWidth,
            tinggiLayar: innerHeight,
            atasPapan: batas.top,
            bawahPapan: batas.bottom,
            lajurBergulir: lajur.scrollHeight > lajur.clientHeight + 1,
          };
        });
        expect(ukuran.lebarDokumen).toBeLessThanOrEqual(ukuran.lebarLayar);
        expect(ukuran.tinggiDokumen).toBeLessThanOrEqual(ukuran.tinggiLayar);
        expect(ukuran.atasPapan).toBeGreaterThanOrEqual(0);
        expect(ukuran.bawahPapan).toBeLessThanOrEqual(ukuran.tinggiLayar);
        expect(ukuran.lajurBergulir).toBe(false);
      }
    }

    await page.locator('[data-petak="e2"]').click();
    await page.locator('[data-petak="e4"]').click();
    // Memeriksa bahwa bidak tampil di petak tujuan, lebih dapat diandalkan di CI
    await expect(page.locator('[data-petak="e4"] [data-bidak]')).toHaveCount(1);
    await page.getByRole("tab", { name: kamus.tabBuku }).click();
    await expect(page.getByRole("searchbox", { name: kamus.cariPembukaan })).toBeVisible();

    await menu.getByRole("link", { name: kamus.menuLatihanRepertoar }).click();
    // Chunk Repertoar dimuat malas; di CI (vite dev, worker paralel) transform
    // dingin bisa melewati 15s bawaan — sama seperti papan di baris 82.
    await expect(page.getByRole("heading", { name: kamus.repertoarJudul })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("link", { name: kamus.repertoarJelajahBuku }).click();
    await expect(analisa).toHaveAttribute("aria-current", "page");
    await expect(page.locator("[data-petak]")).toHaveCount(64);
    await expect(page.getByRole("button", { name: kamus.workspaceKembali })).toHaveCount(0);

    // Workspace Analisa, menu mode, dan bilah evaluasi harus tetap berada di
    // dalam viewport sempit. Ini menjaga regresi flex `w-full` yang pernah
    // membuat papan melebar melebihi layar ketika eval bar dipasang di kiri.
    // Diukur di sini, bukan setelah pindah mode: hanya workspace Analisa yang
    // merender [data-bilah-evaluasi] — mode lain memakai spacer selebar bilah.
    const tataLetakWorkspace = await ukurTataLetak(page);
    expect(tataLetakWorkspace.lebarDokumen).toBeLessThanOrEqual(tataLetakWorkspace.lebarLayar);
    expect(tataLetakWorkspace.kiriPapan).toBeGreaterThanOrEqual(0);
    expect(tataLetakWorkspace.kananPapan).toBeLessThanOrEqual(tataLetakWorkspace.lebarLayar);
    expect(tataLetakWorkspace.bilahTerlihat).toBe(true);
    expect(tataLetakWorkspace.kananBilah).toBeLessThanOrEqual(tataLetakWorkspace.kiriPapan);
    expect(tataLetakWorkspace.menuMeluap).toBe(false);

    await menu.getByRole("link", { name: kamus.menuTuring }).click();
    await expect(page).toHaveURL(/\/papan-interaktif\/turing-test/);
    // Chunk Turing dimuat malas. Tanpa penantian ini pemeriksaan di bawah bisa
    // membaca DOM workspace Analisa yang masih terpasang (bilah evaluasinya
    // masih ada) — itulah sumber hasil yang bergantung pada kecepatan chunk.
    await expect(page.getByRole("heading", { name: kamus.turingJudul })).toBeVisible({
      timeout: 30_000,
    });

    // Papan mode juga harus muat di viewport sempit. Halaman Turing sengaja
    // tidak punya bilah evaluasi (papan hanya ditonton); kolom kirinya memakai
    // spacer `w-9` agar papan tetap sejajar dengan mode lain.
    const tataLetakTuring = await ukurTataLetak(page);
    expect(tataLetakTuring.lebarDokumen).toBeLessThanOrEqual(tataLetakTuring.lebarLayar);
    expect(tataLetakTuring.kiriPapan).toBeGreaterThanOrEqual(0);
    expect(tataLetakTuring.kananPapan).toBeLessThanOrEqual(tataLetakTuring.lebarLayar);
    expect(tataLetakTuring.bilahTerlihat).toBe(false);
    expect(tataLetakTuring.menuMeluap).toBe(false);

    // Tautan sidebar mengembalikan pengguna ke workspace Analisa tanpa
    // meninggalkan /papan-interaktif (bukan tautan keluar + reload).
    await analisa.click();
    await expect(page.locator("[data-petak]")).toHaveCount(64);
    await expect(page).toHaveURL(/\/papan-interaktif$/);

    // Kartu konfigurasi pra-partai adalah milik rute Manusia vs Mesin. Turing
    // Test (halaman yang sedang dibuka) sengaja tidak punya warna pemain /
    // level mesin, jadi pindah dulu ke rute itu sebelum memeriksanya.
    await page.goto("/papan-interaktif/manusia-vs-mesin", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-petak]")).toHaveCount(64, { timeout: 30_000 });

    const warnaPemain = page.getByLabel(kamus.pveWarnaPemain);
    const levelMesin = page.getByLabel(kamus.pveLevel);
    await expect(warnaPemain).toBeEnabled();
    await expect(levelMesin).toBeEnabled();

    // Tanda pengguna tetap berfungsi ketika belum bermain dan dapat dipakai
    // saat komputer berpikir. Ini menutup regresi PvE yang sebelumnya tidak
    // meneruskan callback onTandaPetak/onTandaPanah ke papan bersama.
    const asal = await page.locator('[data-petak="e2"]').boundingBox();
    const tujuan = await page.locator('[data-petak="e4"]').boundingBox();
    expect(asal).not.toBeNull();
    expect(tujuan).not.toBeNull();
    await page.mouse.move(asal.x + asal.width / 2, asal.y + asal.height / 2);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(tujuan.x + tujuan.width / 2, tujuan.y + tujuan.height / 2, { steps: 4 });
    await page.mouse.up({ button: "right" });
    await expect(page.locator('[data-arrow="e2e4"]')).toHaveCount(1);

    await page.getByRole("button", { name: kamus.pveMulai, exact: true }).click();
    // Bilah bukan dekorasi: evaluator Stockfish terpisah harus mengganti tanda
    // tunggu dengan skor posisi yang benar-benar diterbitkan worker.
    await expect(page.locator("[data-bilah-evaluasi]")).not.toHaveAttribute("aria-label", /—/, { timeout: 30_000 });
    // Partai berjalan: kartu konfigurasi pra-partai hilang dan panel partai
    // (daftar langkah + navigasi + baris aksi) menggantikannya.
    await expect(page.getByRole("region", { name: kamus.pveKonfigurasi })).toHaveCount(0);
    await expect(warnaPemain).toHaveCount(0);
    await expect(levelMesin).toHaveCount(0);
    await expect(page.getByRole("button", { name: kamus.pveMulai, exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: kamus.pveRiwayat })).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.keAwal })).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.pveMenyerah })).toBeVisible();
    await expect(page.getByRole("button", { name: kamus.simpan })).toBeVisible();
    await expect(page.locator('[data-arrow="e2e4"]')).toHaveCount(0);

    // Tombol + Baru tidak boleh dapat ditekan pada partai kosong. Begitu pemain
    // melangkah, tombol aktif dan mereset papan tanpa kembali ke konfigurasi.
    const partaiBaru = page.getByRole("button", { name: kamus.baru, exact: true });
    await expect(partaiBaru).toBeDisabled();
    await page.locator('[data-petak="e2"]').click();
    await page.locator('[data-petak="e4"]').click();
    await expect(partaiBaru).toBeEnabled();
    await partaiBaru.click();
    await expect(partaiBaru).toBeDisabled();
    await expect(page.getByRole("heading", { name: kamus.pveRiwayat })).toBeVisible();
    await expect(page.locator('[data-petak="e2"] [data-bidak]')).toHaveCount(1);
    await expect(page.locator('[data-petak="e4"] [data-bidak]')).toHaveCount(0);

    await page.getByRole("button", { name: kamus.pveMenyerah }).click();
    await page
      .getByRole("dialog", { name: kamus.pveKonfirmasiMenyerah })
      .getByRole("button", { name: kamus.pveYa })
      .click();
    // Menyerah mengakhiri partai dan menampilkan dialog hasil (seperti skakmat);
    // "Partai baru" baru membawa kembali ke layar pengaturan.
    const dialogSelesai = page.getByRole("dialog", { name: kamus.pveSelesaiJudul });
    await expect(dialogSelesai).toBeVisible();
    await dialogSelesai.getByRole("button", { name: kamus.pvePartaiBaru, exact: true }).click();
    await expect(page.getByRole("button", { name: kamus.pveMulai, exact: true })).toBeVisible();
    await expect(warnaPemain).toBeEnabled();
    await expect(levelMesin).toBeEnabled();
    if (testInfo.project.name === "desktop-chromium") {
      await page.setViewportSize({ width: 1366, height: 600 });
      const ukuran = await page.evaluate(() => {
        const papan = document.querySelector('[data-petak="e2"]').parentElement.parentElement;
        const batas = papan.getBoundingClientRect();
        return {
          tinggiDokumen: document.documentElement.scrollHeight,
          tinggiLayar: innerHeight,
          bawahPapan: batas.bottom,
          lajurBergulir: papan.closest("section").scrollHeight > papan.closest("section").clientHeight + 1,
        };
      });
      expect(ukuran.tinggiDokumen).toBeLessThanOrEqual(ukuran.tinggiLayar);
      expect(ukuran.bawahPapan).toBeLessThanOrEqual(ukuran.tinggiLayar);
      expect(ukuran.lajurBergulir).toBe(false);
    }
    // Tidak ada galat halaman di seluruh alur (workspace -> mode -> PvE).
    expect(galat).toEqual([]);
  });
}

/**
 * Pratinjau papan di layar "Tambah jalur" Repertoar.
 *
 * Panel kanan layar pemilihan dulu hanya berisi teks dan ruang kosong; sejak
 * revisi, posisi akhir jalur yang dipilih digambar dengan `PapanStatis`.
 * Uji ini menjaga dua hal sekaligus: klik baris katalog benar-benar memilih
 * jalur, dan papan pratinjau muncul lengkap 64 petak tanpa galat halaman.
 */
test("repertoar: papan pratinjau muncul setelah jalur dipilih", async ({ page }) => {
  // Alur ini memuat katalog 4,4 MB lalu menelusuri tiga layar sekaligus.
  test.setTimeout(180_000);
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));

  // Kunci bahasa dipatok seperti uji lain supaya label tombol dapat diprediksi
  // (peramban CI memakai locale en-US).
  await page.addInitScript(() => localStorage.setItem("kci-bahasa", "id"));
  await page.goto("/papan-interaktif/latihan-repertoar");
  const judul = page.getByRole("heading", { name: papanId.repertoarJudul });
  await expect(judul).toBeVisible({ timeout: 30_000 });

  // Tombol kembali duduk sebaris dengan judul: pusat vertikalnya sejajar judul,
  // di kiri judul, dan deskripsi tepat di bawah judul (bukan di bawah tombol).
  const kepala = page.locator("header").first();
  const tombolKembali = kepala.getByRole("button", { name: papanId.repertoarKembali });
  await expect(tombolKembali).toBeVisible();
  const kotakTombol = await tombolKembali.boundingBox();
  const kotakJudul = await judul.boundingBox();
  const kotakDeskripsi = await page
    .getByText(papanId.repertoarDeskripsi, { exact: false })
    .first()
    .boundingBox();
  const tengahTombol = kotakTombol.y + kotakTombol.height / 2;
  const tengahJudul = kotakJudul.y + kotakJudul.height / 2;
  expect(Math.abs(tengahTombol - tengahJudul)).toBeLessThan(6);
  expect(kotakTombol.x + kotakTombol.width).toBeLessThanOrEqual(kotakJudul.x + 1);
  expect(Math.abs(kotakDeskripsi.x - kotakJudul.x)).toBeLessThan(2);

  await page.getByRole("button", { name: papanId.repertoarTambahJalur }).first().click();

  // Katalog pembukaan ±4 MB: beri waktu lebih longgar daripada bawaan.
  const daftar = page.locator('[data-katalog="pembukaan"] li > button').first();
  await expect(daftar).toBeVisible({ timeout: 60_000 });
  await daftar.click();

  const papan = page.getByRole("img", { name: /Pratinjau posisi jalur|Position preview for the/ });
  await expect(papan).toBeVisible();
  await expect(papan.locator("[data-petak]")).toHaveCount(64);
  // Bidak yang tersisa setelah jalur dijalankan (bisa ada tangkapan).
  expect(await papan.locator('[data-bidak]:not([data-bidak=""])').count()).toBeGreaterThan(20);

  // Simpan jalur → kembali ke katalog berbentuk kartu dengan progres latihan.
  await page.getByRole("button", { name: papanId.repertoarSimpanJalur }).click();
  const kartu = page.locator("[data-kartu-repertoar]").first();
  await expect(kartu).toBeVisible();
  await expect(kartu.getByRole("img", { name: /Pratinjau posisi jalur|Position preview for the/ })).toBeVisible();
  await expect(kartu.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await expect(kartu).toContainText(papanId.repertoarProgresLatihan);
  await expect(kartu.getByRole("button", { name: papanId.repertoarMulaiBelajar })).toBeVisible();

  // Halaman pembukaan gaya "Garis 1/2": papan besar, penunjuk garis, tombol mulai.
  await kartu.getByRole("button", { name: papanId.repertoarMulaiBelajar }).click();
  await expect(
    page.getByRole("img", { name: /Pratinjau posisi jalur|Position preview for the/ }),
  ).toBeVisible();
  await expect(
    page.getByText(papanId.repertoarGaris.replace("{indeks}", "1").replace("{total}", "1")),
  ).toBeVisible();
  await expect(page.getByText(papanId.repertoarProgresLatihan).first()).toBeVisible();
  await expect(page.getByRole("button", { name: papanId.repertoarMulai })).toBeEnabled();

  // Layar latihan: papan sebagai fokus (kiri, 60%) + dasbor latihan (kanan, 40%).
  await page.getByRole("button", { name: papanId.repertoarMulai }).click();
  const dasbor = page.locator("[data-dasbor-latihan]");
  await expect(dasbor).toBeVisible();
  await expect(page.locator("[data-papan-latihan]")).toBeVisible();
  await expect(dasbor.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  for (const label of [
    papanId.repertoarPosisiSaatIni,
    papanId.repertoarAkurasi,
    papanId.repertoarPetunjuk,
    papanId.repertoarRiwayatLangkah,
    papanId.repertoarTarget,
  ]) {
    await expect(dasbor).toContainText(label);
  }

  const kotak = await page.evaluate(() => {
    const ambil = (pemilih) => {
      const el = document.querySelector(pemilih);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, lebar: r.width, tinggi: r.height };
    };
    const bungkus = document.querySelector("[data-bungkus-latihan]");
    return {
      bungkus: ambil("[data-bungkus-latihan]"),
      bungkusLebarIsi: bungkus ? Number.parseFloat(getComputedStyle(bungkus).maxWidth) : 0,
      kolom: ambil("[data-kolom-papan]"),
      papan: ambil("[data-papan-latihan]"),
      dasbor: ambil("[data-dasbor-latihan]"),
      lebarLayar: window.innerWidth,
    };
  });

  // Wadah konten dibatasi 1400 px dan tidak pernah melebihi lebar layar.
  expect(kotak.bungkusLebarIsi).toBeLessThanOrEqual(1400);
  expect(kotak.bungkus.x + kotak.bungkus.lebar).toBeLessThanOrEqual(kotak.lebarLayar + 1);
  expect(kotak.bungkus.x).toBeGreaterThanOrEqual(-1);

  // Papan benar-benar center terhadap kolom kirinya (toleransi 2 px).
  const tengahPapan = kotak.papan.x + kotak.papan.lebar / 2;
  const tengahKolom = kotak.kolom.x + kotak.kolom.lebar / 2;
  expect(Math.abs(tengahPapan - tengahKolom)).toBeLessThanOrEqual(2);

  if (kotak.lebarLayar >= 1024) {
    // Desktop: dua kolom — dasbor di kanan, papan mengisi kolom kiri dengan lega.
    expect(kotak.dasbor.x).toBeGreaterThanOrEqual(kotak.kolom.x + kotak.kolom.lebar - 1);
    expect(kotak.papan.lebar).toBeGreaterThanOrEqual(380);
  } else {
    // Tablet & ponsel: papan prioritas, dasbor pindah ke bawah papan.
    expect(kotak.dasbor.y).toBeGreaterThanOrEqual(kotak.papan.y + kotak.papan.tinggi);
    expect(kotak.papan.lebar).toBeGreaterThanOrEqual(kotak.lebarLayar - 80);
  }

  expect(galat).toEqual([]);
});
