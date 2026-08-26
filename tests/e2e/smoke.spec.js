import { expect, test } from "@playwright/test";

/** Kegagalan JavaScript tak tertangani harus menggagalkan alur pengguna. */
function pantauGalatHalaman(page) {
  const galat = [];
  page.on("pageerror", (error) => galat.push(error.message));
  return () => expect(galat, galat.join("\n")).toEqual([]);
}

/**
 * Hanya panggilan backend sungguhan yang boleh dicegat.
 *
 * PENTING: jangan memakai glob "**\/api/**". Saat pengujian berjalan di atas
 * server dev Vite, modul sumber aplikasi juga disajikan lewat URL — misalnya
 * /src/lib/api/index.js — dan glob itu ikut mencegatnya lalu membalasnya
 * dengan JSON. Modul gagal dimuat, halaman jadi kosong, dan semua pemeriksaan
 * "element(s) not found". Pencocokan berbasis pathname di bawah ini hanya
 * mengenai /api/... yang sesungguhnya.
 */
const JALUR_API = (url) => url.pathname.startsWith("/api/");

/** Formulir pendaftaran anggota (halaman juga memuat form pencarian header). */
const formPendaftaran = (page) =>
  page.locator("form").filter({ has: page.locator('input[name="username"]') });

/** Backend tiruan untuk memverifikasi alur browser tanpa data produksi. */
async function tiruApiPublik(page, onRequest = () => {}) {
  await page.route(JALUR_API, async (route) => {
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
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const token = request.headers()["x-token-admin"];

    if (path === "/api/csrf-token") return json({ token: "csrf-pengurus" });
    // ProtectedRoute memverifikasi token lewat endpoint ringan ini
    // (bukan /ringkasan) — tiru kontraknya: 401 bila token salah, ok bila sah.
    if (path === "/api/pengurus/verifikasi") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({ ok: true });
    }
    // Gerbang masuk memverifikasi token SEKALIGUS mencatat riwayat masuk lewat
    // POST /masuk (lihat Gerbang.jsx & server). Tanpa tiruan ini, catch-all di
    // bawah membalas 200 sehingga token salah tampak berhasil masuk dan pesan
    // "Token pengurus tidak dikenali." tidak pernah muncul.
    if (path === "/api/pengurus/masuk" && request.method() === "POST") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({
        ok: true,
        entri: { id: "masuk-uji", username: "pengurusuji", waktu: "2026-08-25T00:00:00.000Z" },
      });
    }
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

async function tiruApiTurnamen(page) {
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const turnamen = {
      id: "turnamen-uji", nama: "Turnamen Uji Bulanan", jenis: "bulanan", status: "pendaftaran",
      jumlahPeserta: 4, kuota: 32, mulai: "2026-10-20 19:00", tutupDaftar: "2026-10-19 18:00",
      tempo: "10+0", ronde: 5, tempat: "Chess.com", hadiah: "Sertifikat", deskripsi: "Turnamen untuk pengujian browser.",
    };
    if (path === "/api/csrf-token") return json({ token: "csrf-turnamen" });
    if (path === "/api/turnamen" && request.method() === "GET") return json([turnamen]);
    if (path === "/api/turnamen/turnamen-uji" && request.method() === "GET") {
      return json({ ...turnamen, klasemen: [{ username: "pecaturuji", panggilan: "Pecatur Uji", peringkat: 1, main: 3, poin: 3 }] });
    }
    if (path === "/api/turnamen/turnamen-uji/daftar" && request.method() === "POST") {
      const body = request.postDataJSON();
      if (body.username === "nonanggota") return json({ pesan: "Lengkapi data anggota terlebih dahulu.", harusDaftarAnggota: true }, 403);
      return json({ status: "menunggu" }, 201);
    }
    return json({});
  });
}

/**
 * Jaring pengaman global: cegat seluruh permintaan /api/... agar tidak ada
 * yang lolos ke proxy Vite (backend localhost:8787 tidak berjalan di CI).
 *
 * Playwright menjalankan handler rute dengan urutan LIFO (terbalik dari
 * pendaftaran), sehingga handler di beforeEach ini bertindak sebagai cadangan
 * dan dievaluasi paling akhir. Mock spesifik yang dipasang di dalam badan tes
 * (tiruApiPublik dkk.) akan tetap menang karena didaftarkan belakangan.
 */
test.beforeEach(async ({ page }) => {
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });

    if (path === "/api/csrf-token") return json({ token: "csrf-uji" });
    if (path === "/api/auth/cara") return json({ oauth: false, kodeProfil: true, mode: "opsional" });
    if (
      path === "/api/anggota" ||
      path === "/api/daftar-hitam" ||
      path === "/api/turnamen" ||
      path === "/api/berita" ||
      path === "/api/pengumuman" ||
      path === "/api/pengurus/pesan" ||
      path === "/api/pengurus/berita" ||
      path === "/api/pengurus/pengumuman" ||
      path === "/api/pengurus/turnamen"
    ) {
      return json([]);
    }
    return json({});
  });
});

test("navigasi publik dan pencarian dapat digunakan", async ({ page }) => {
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/Komunitas Catur Indonesia/);

  await page.getByRole("button", { name: "cari" }).click();
  const input = page.getByRole("textbox", { name: "cari" });
  await expect(input).toBeVisible();
  await input.fill("turnamen");
  // Tautan "Turnamen" juga ada di header dan footer; batasi ke hasil overlay
  // pencarian supaya locator tidak ambigu (strict mode violation).
  await page
    .locator("#overlay-pencarian")
    .getByRole("link", { name: "Turnamen", exact: true })
    .click();
  await expect(page).toHaveURL(/\/turnamen$/);
  await expect(page.getByRole("heading", { name: "Turnamen", exact: true })).toBeVisible();
  periksaGalat();
});

test("overlay pencarian dapat ditutup dengan Escape dan mengembalikan fokus", async ({ page }) => {
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/");
  const pemicu = page.getByRole("button", { name: "cari" });
  await pemicu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "cari" })).toBeVisible();
  await expect(page.getByRole("button", { name: "tutup pencarian" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "cari" })).toBeHidden();
  await expect(pemicu).toBeFocused();
  periksaGalat();
});

test("panduan catur memuat bab awal dan bab lain secara progresif", async ({ page }) => {
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/program-kami/sekolah-catur/cara-bermain-catur");
  await expect(page.getByRole("heading", { name: "Cara Bermain Catur", exact: true })).toBeVisible();

  // Bab selain bab pertama sengaja tidak dimuat sampai pembaca memintanya.
  // Kunci pemeriksaan pada SATU bab: `.first()` selalu dihitung ulang, jadi
  // setelah bab ini dimuat tombol bab berikutnya akan menjadi yang pertama
  // dan pemeriksaan "tersembunyi" tidak akan pernah terpenuhi.
  const seksiBab = page
    .locator("section")
    .filter({ has: page.getByRole("button", { name: "Muat bab ini" }) })
    .first();
  const idBab = await seksiBab.getAttribute("id");
  const muatBab = page.locator(`section#${idBab}`).getByRole("button", { name: "Muat bab ini" });
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
  // "About Us" juga muncul sebagai kartu "Akses Cepat" di landing page;
  // batasi ke tautan menu header agar locator tidak ambigu.
  await expect(
    page.locator("header").getByRole("link", { name: "About Us", exact: true })
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  periksaGalat();
});

test("turnamen menampilkan klasemen dan menerima pengajuan anggota", async ({ page }) => {
  await tiruApiTurnamen(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/turnamen/turnamen-bulanan");
  await expect(page.getByRole("heading", { name: "Turnamen Uji Bulanan" })).toBeVisible();

  await page.getByRole("button", { name: "Lihat klasemen" }).click();
  await expect(page.getByText("Pecatur Uji")).toBeVisible();

  await page.getByRole("button", { name: "Daftar sebagai peserta" }).click();
  await page.getByRole("textbox", { name: "Username Chess.com" }).fill("pecaturuji");
  await page.getByRole("button", { name: "Kirim pengajuan" }).click();
  await expect(page.getByText("Pengajuan terkirim dan sedang menunggu persetujuan pengurus.")).toBeVisible();
  periksaGalat();
});

test("turnamen mengarahkan non-anggota ke pendaftaran", async ({ page }) => {
  await tiruApiTurnamen(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/turnamen/turnamen-bulanan");
  await page.getByRole("button", { name: "Daftar sebagai peserta" }).click();
  await page.getByRole("textbox", { name: "Username Chess.com" }).fill("nonanggota");
  await page.getByRole("button", { name: "Kirim pengajuan" }).click();
  await expect(page.getByText("Lengkapi data anggota terlebih dahulu.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Daftar menjadi anggota" })).toHaveAttribute("href", "/pendaftaran-anggota");
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
  // Label tombol kirim adalah "Daftar" (lihat pendaftaran.daftar di i18n).
  await formPendaftaran(page).getByRole("button", { name: "Daftar", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Periksa kembali isian" })
  ).toBeVisible();
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
  await formPendaftaran(page).getByRole("button", { name: "Daftar", exact: true }).click();

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

  await page.getByLabel("Nama Lengkap").fill("Pengunjung Uji");
  await page.getByLabel("Alamat Email").fill("pengunjung@example.test");
  await page.getByLabel("Subjek Pesan").fill("Pertanyaan fitur");
  await page.getByLabel("Isi Pesan").fill("Mohon informasi kegiatan berikutnya.");
  await page.locator('input[name="agreement"]').check();
  // Pada viewport mobile ada tombol navigasi seksi berlabel sama; ambil
  // tombol kirim yang berada di dalam seksi formulirnya.
  await page.locator("#hubungi-kami").getByRole("button", { name: "Kirim Pesan" }).click();

  await expect(page.getByText("Pesan Anda berhasil dikirim!")).toBeVisible();
  const pesan = requests.find((request) => request.path === "/api/pesan" && request.method === "POST");
  expect(pesan?.body).toMatchObject({ nama: "Pengunjung Uji", subjek: "Pertanyaan fitur" });
  periksaGalat();
});

test("menu mobile membuka tautan pendaftaran", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Khusus viewport mobile.");
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/");
  const pemicu = page.getByRole("button", { name: "menu" });
  await pemicu.click();
  await expect(page.getByRole("button", { name: "tutup" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(pemicu).toBeFocused();
  await pemicu.click();
  await expect(page.getByRole("link", { name: "Daftar Anggota" })).toBeVisible();
  await page.getByRole("link", { name: "Daftar Anggota" }).click();
  await expect(page).toHaveURL(/\/pendaftaran-anggota$/);
  periksaGalat();
});
