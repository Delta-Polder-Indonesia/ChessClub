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
const _formPendaftaran = (page) =>
  page.locator("form").filter({ has: page.locator('input[name="username"]') });

/** Backend tiruan untuk memverifikasi alur browser tanpa data produksi. */
/**
 * Backend tiruan untuk halaman publik.
 *
 * `state` dipakai bersama tes: kode tantangan "diterbitkan server" dan hanya
 * cocok bila tes memasangnya pada profil tiruan (lihat `tiruProfilChessCom`).
 * Tiket verifikasi selalu berasal dari respons server — tidak pernah dari
 * browser — sehingga kontrak yang diuji sama dengan produksi.
 */
async function tiruApiPublik(page, onRequest = () => {}, state = {}) {
  // State dipakai bersama (bukan salinan): tes memasang kode pada profil
  // tiruan, handler ini membacanya kembali saat memeriksa.
  state.kode ??= "KCI-UJI007";
  state.pemeriksaan ??= 0;
  const tiruan = state;
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    onRequest({ path, method: request.method(), body: request.postDataJSON?.() });
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/api/csrf-token") return json({ token: "csrf-uji" });
    if (path === "/api/auth/cara")
      return json({
        oauth: false,
        kodeProfil: true,
        mode: tiruan.mode || "opsional",
        wajib: tiruan.mode === "wajib",
        tiketBerlakuDetik: 1800,
      });
    if (path === "/api/auth/kode/minta" && request.method() === "POST") {
      const body = request.postDataJSON?.() || {};
      if (body.paksa) tiruan.kode = `KCI-${String(tiruan.pemeriksaan + 7).padStart(6, "0")}`;
      return json({ username: body.username, kode: tiruan.kode, berlakuDetik: 1800, diulang: false });
    }
    if (path === "/api/auth/kode/periksa" && request.method() === "POST") {
      if (tiruan.terpasang !== tiruan.kode)
        return json({ cocok: false, pesan: "Kode belum terbaca di profil Anda." });
      tiruan.pemeriksaan += 1;
      return json({
        cocok: true,
        username: "pecaturuji",
        tiket: `kci1.uji-${tiruan.pemeriksaan}`,
        berlakuDetik: 1800,
        cara: "kode-profil",
      });
    }
    if (path === "/api/auth/pengajuan-manual" && request.method() === "POST") {
      tiruan.pengajuan = request.postDataJSON?.() || {};
      return json({ id: "pj-uji", status: "menunggu", username: "pecaturuji" }, 202);
    }
    if (path === "/api/anggota" && request.method() === "POST") {
      const body = request.postDataJSON?.() || {};
      if (body.tiketVerifikasi && !/^kci1\.uji-/.test(body.tiketVerifikasi))
        return json({ pesan: "Sesi verifikasi telah kedaluwarsa. Silakan ulangi verifikasi akun Chess.com Anda.", perluVerifikasi: true, kodeVerifikasi: "tidak-sah" }, 403);
      tiruan.terkirim = body;
      return json({ username: "pecaturuji" }, 201);
    }
    if (path === "/api/anggota") return json([]);
    if (path === "/api/pesan" && request.method() === "POST") return json({ id: "pesan-uji" }, 201);
    return json({});
  });
}

/** Profil publik Chess.com untuk kartu pemain & verifikasi kode alur daftar. */
const profilChessCom = (username, kode) => ({
  username,
  player_id: 424242,
  status: "basic",
  name: "Pecatur Uji",
  avatar: "",
  location: kode ? `Medan ${kode}` : "Medan",
  bio: "",
  followers: 12,
  joined: 1600000000,
  last_online: 1735689600,
  url: `https://www.chess.com/member/${username}`,
  country: "https://api.chess.com/pub/country/ID",
  league: "Legend",
});

/** Tiru API publik Chess.com yang ditarik langsung dari browser.
    `ambilKode` dipanggil tiap permintaan supaya tes bisa "memasang" kode
    verifikasi pada profil setelah membacanya dari kartu di halaman. */
async function tiruProfilChessCom(page, ambilKode = () => null) {
  await page.route("https://api.chess.com/pub/player/*", (route) => {
    const username = decodeURIComponent(
      new URL(route.request().url()).pathname.split("/").pop(),
    );
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(profilChessCom(username, ambilKode())),
    });
  });
}

async function tiruApiPengurus(page) {
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const token = request.headers()["x-token-admin"];

    if (path === "/api/csrf-token") return json({ token: "csrf-pengurus" });
    // Gerbang masuk memakai endpoint publik username + password, lalu
    // menyimpan token yang dikembalikan untuk semua request /api/pengurus/*.
    if (path === "/api/auth/login" && request.method() === "POST") {
      const body = request.postDataJSON();
      if (body.username !== "pengurusuji" || body.password !== "password-uji") {
        return json({ pesan: "Username atau password salah." }, 401);
      }
      return json({ ok: true, token: "token-uji", username: "pengurusuji", role: "master" });
    }
    // ProtectedRoute memverifikasi token lewat endpoint ringan ini
    // (bukan /ringkasan) — tiru kontraknya: 401 bila token salah, ok bila sah.
    if (path === "/api/pengurus/verifikasi") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({ ok: true, username: "pengurusuji", role: "master" });
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

/* ---------------------------------------------- panel konten (berita/pengumuman) */

/**
 * 12 item konten bernomor dengan id stabil (berita-01 … berita-12) — cukup
 * untuk memicu paginasi (pageSize tabel = 10). Judul terurut naik mengikuti
 * nomor supaya hasil sorting deterministik.
 */
function daftarKontenUji(jenis) {
  const label = jenis === "berita" ? "Berita" : "Pengumuman";
  return Array.from({ length: 12 }, (_, i) => {
    const nomor = String(i + 1).padStart(2, "0");
    return {
      id: `${jenis}-${nomor}`,
      judul: `${label} ${nomor}`,
      ringkasan: `Ringkasan ${jenis} nomor ${nomor}.`,
      isi: `Isi ${jenis} nomor ${nomor}.`,
      gambar: null,
      tanggal: `2026-09-${nomor}`,
      status: i % 2 === 0 ? "publik" : "draf",
    };
  });
}

/**
 * Backend tiruan dashboard + panel konten. Endpoint hapus bersifat stateful:
 * item benar-benar hilang dari daftar GET berikutnya, dan id yang diterima
 * dicatat ke `state.terhapus` sehingga tes bisa memastikan hapus massal
 * mengirim ID ITEM (bukan indeks baris — regresi getRowId).
 */
async function tiruApiKonten(page, state) {
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const token = request.headers()["x-token-admin"];

    if (path === "/api/csrf-token") return json({ token: "csrf-uji" });
    if (path === "/api/auth/login" && request.method() === "POST") {
      const body = request.postDataJSON();
      if (body.username === "pengurusuji" && body.password === "password-uji") {
        return json({ token: "token-uji", username: "pengurusuji", role: "master" });
      }
      return json({ pesan: "Username atau password salah." }, 401);
    }
    if (path === "/api/pengurus/verifikasi") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({ ok: true, username: "pengurusuji", role: "master" });
    }
    if (path === "/api/pengurus/ringkasan") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({
        anggota: 12, anggotaTerdata: 4, daftarHitam: 0, otomatis: 0, pengurus: 0,
        pesan: { total: 0, belumDibaca: 0 },
        turnamen: { total: 0, berlangsung: 0, pendaftaran: 0 },
        konten: { berita: state.berita.length, pengumuman: state.pengumuman.length },
        verifikasi: { mode: "opsional", oauthAktif: false },
      });
    }
    if (path === "/api/pengurus/pesan") return json([]);
    if (path === "/api/pengurus/pindai-otomatis") return json({ dijalankan: false });
    if (path === "/api/anggota" || path === "/api/daftar-hitam") return json([]);
    if (path === "/api/pengurus/berita" && request.method() === "GET") return json(state.berita);
    if (path === "/api/pengurus/pengumuman" && request.method() === "GET") return json(state.pengumuman);

    const hapus = /^\/api\/pengurus\/(berita|pengumuman)\/([^/]+)\/hapus$/.exec(path);
    if (hapus && request.method() === "POST") {
      const [, jenis, id] = hapus;
      const daftar = jenis === "berita" ? state.berita : state.pengumuman;
      if (!daftar.some((item) => item.id === id)) {
        return json({ pesan: "Item tidak ditemukan." }, 404);
      }
      state.terhapus.push(id);
      const sisa = daftar.filter((item) => item.id !== id);
      if (jenis === "berita") state.berita = sisa;
      else state.pengumuman = sisa;
      return json({ pesan: "Dihapus." });
    }
    return json({});
  });
}

/** Login dashboard lewat gerbang dengan kredensial mock pengurusuji. */
async function masukDashboard(page) {
  await page.goto("/pengurus");
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("password-uji");
  await page.getByRole("button", { name: "Masuk" }).click();
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

test("dashboard pengurus menolak password tidak sah", async ({ page }) => {
  await tiruApiPengurus(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pengurus");
  await expect(page.getByRole("heading", { name: "Dashboard Pengurus" })).toBeVisible();
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("password-salah");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText(/Username atau password salah/)).toBeVisible();
  periksaGalat();
});

test("dashboard pengurus memverifikasi login dan logout dengan aman", async ({ page }) => {
  await tiruApiPengurus(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pengurus");
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("password-uji");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page.getByText("12", { exact: true })).toBeVisible();
  await page.getByTitle("Masuk sebagai pengurusuji").click();
  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  periksaGalat();
});

test("panel konten menghapus massal baris terpilih memakai id item (sorting + paginasi)", async ({ page, isMobile }) => {
  test.skip(isMobile, "Tabel konten dengan paginasi diuji pada viewport desktop.");
  const state = { berita: daftarKontenUji("berita"), pengumuman: daftarKontenUji("pengumuman"), terhapus: [] };
  await tiruApiKonten(page, state);
  const periksaGalat = pantauGalatHalaman(page);
  await masukDashboard(page);

  await page.getByRole("button", { name: "Berita Komunitas" }).click();
  await expect(page.getByText("Berita 01")).toBeVisible();

  // Aktifkan urutan TURUN pada kolom Judul. Urutan naik tak teramati (data
  // mock sudah terurut), jadi dipakai turun: "Berita 12" pindah ke halaman 1
  // dan assertions di bawah memastikan state sorting benar-benar ter-commit
  // sebelum paginasi diklik (menghindari race auto-reset pageIndex).
  // 12 item, pageSize 10 → halaman 2 (desc) berisi Berita 02 & Berita 01.
  const tombolJudul = page.getByRole("button", { name: "Judul" });
  await tombolJudul.click(); // naik
  await tombolJudul.click(); // turun
  await expect(page.getByText("Berita 12")).toBeVisible();

  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(page.getByText("Berita 02")).toBeVisible();

  // Pilih seluruh baris halaman ini lewat checkbox header, lalu hapus massal.
  await page.locator('input[aria-label="Pilih semua"]').check();
  await page.getByRole("button", { name: "Hapus terpilih" }).click();
  await expect(page.getByText("Hapus 2 berita?")).toBeVisible();
  await page.getByRole("button", { name: "Hapus semua" }).click();

  // Regresi getRowId: kunci rowSelection harus id item, bukan indeks baris.
  // Dengan indeks, permintaan terkirim ke /berita/0/hapus & /berita/1/hapus
  // dan mock membalas 404 sehingga tidak ada id yang tercatat.
  await expect.poll(() => [...state.terhapus].sort(), { timeout: 15000 }).toEqual([
    "berita-01",
    "berita-02",
  ]);
  await expect(page.getByText("Berita 02")).toBeHidden();
  await expect(page.getByText("0 dari 10 berita terpilih.")).toBeVisible();
  periksaGalat();
});

test("panel konten menghapus dengan benar saat kolom disembunyikan", async ({ page, isMobile }) => {
  test.skip(isMobile, "Menu kolom dan tabel konten diuji pada viewport desktop.");
  const state = { berita: daftarKontenUji("berita"), pengumuman: daftarKontenUji("pengumuman"), terhapus: [] };
  await tiruApiKonten(page, state);
  const periksaGalat = pantauGalatHalaman(page);
  await masukDashboard(page);

  await page.getByRole("button", { name: "Pengumuman", exact: true }).click();
  await expect(page.getByText("Pengumuman 01")).toBeVisible();

  // Sembunyikan kolom "Gambar" lewat menu Kolom (portal ditutup dengan Escape).
  await page.getByRole("button", { name: "Kolom" }).click();
  await page.getByLabel("Gambar").uncheck();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Gambar" })).toHaveCount(0);

  // Hapus 10 baris halaman pertama.
  await page.locator('input[aria-label="Pilih semua"]').check();
  await page.getByRole("button", { name: "Hapus terpilih" }).click();
  await expect(page.getByText("Hapus 10 pengumuman?")).toBeVisible();
  await page.getByRole("button", { name: "Hapus semua" }).click();
  await expect.poll(() => state.terhapus.length, { timeout: 15000 }).toBe(10);
  await expect(page.getByText("Pengumuman 11")).toBeVisible();

  // Hapus dua sisanya → tabel kosong: baris "belum ada data" harus merentang
  // SELURUH kolom yang masih tampil (5 kolom setelah Gambar disembunyikan).
  await page.locator('input[aria-label="Pilih semua"]').check();
  await page.getByRole("button", { name: "Hapus terpilih" }).click();
  await expect(page.getByText("Hapus 2 pengumuman?")).toBeVisible();
  await page.getByRole("button", { name: "Hapus semua" }).click();
  await expect.poll(() => state.terhapus.length, { timeout: 15000 }).toBe(12);
  await expect(page.getByText(/Belum ada pengumuman/)).toBeVisible();
  await expect(page.locator("tbody td").first()).toHaveAttribute("colspan", "5");
  periksaGalat();
});

test("alur pendaftaran memvalidasi username pada langkah pertama", async ({ page }) => {
  await tiruApiPublik(page);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pendaftaran-anggota");

  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Username Chess.com wajib diisi");
  await expect(page.locator('input[name="username"]')).toHaveAttribute("aria-invalid", "true");
  periksaGalat();
});

test("jalur manual menjadi pengajuan menunggu, bukan verifikasi", async ({ page }) => {
  const state = {};
  await tiruApiPublik(page, () => {}, state);
  await tiruProfilChessCom(page, () => null);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pendaftaran-anggota");

  await page.locator('input[name="username"]').fill("pecaturuji");
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();

  // Kode tantangan berasal dari SERVER (endpoint /api/auth/kode/minta),
  // bukan angka acak buatan browser.
  await expect(page.getByText(/^KCI-[A-Z0-9]{6}$/)).toBeVisible();

  await page.getByRole("button", { name: /Ajukan pemeriksaan manual/i }).click();
  await page.getByLabel(/Catatan untuk pengurus/i).fill("profil saya terkunci");
  await page.getByRole("button", { name: "Kirim Pengajuan", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Pengajuan Diterima" })).toBeVisible();
  await expect(page.getByText(/menunggu/i).first()).toBeVisible();
  // Yang lama: mengetik ulang kode dianggap "Verifikasi Berhasil!" — tidak lagi.
  await expect(page.getByRole("heading", { name: "Verifikasi Berhasil!" })).toHaveCount(0);
  expect(state.pengajuan?.username).toBe("pecaturuji");
  expect(state.pengajuan?.tiketVerifikasi).toBeUndefined();
  periksaGalat();
});

test("alur pendaftaran mengirim tiket server dan menolak tiket palsu", async ({ page }) => {
  const requests = [];
  const state = {};
  await tiruApiPublik(page, (request) => requests.push(request), state);
  let kodeTerpasang = null;
  await tiruProfilChessCom(page, () => kodeTerpasang);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pendaftaran-anggota");

  await page.locator('input[name="username"]').fill("pecaturuji");
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();

  // Tanpa kode terpasang: server menjawab cocok:false dan TIDAK menerbitkan tiket.
  await expect(page.getByText(/^KCI-[A-Z0-9]{6}$/)).toBeVisible();
  const kode = (await page.getByText(/^KCI-[A-Z0-9]{6}$/).textContent()).trim();
  await page.getByRole("button", { name: "Periksa Kode", exact: true }).click();
  await expect(page.getByText(/belum terbaca di profil/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Verifikasi Berhasil!" })).toHaveCount(0);

  // "Pasang" kode pada profil (kolom Location), lalu periksa ulang: server
  // mencocokkan dan mengembalikan tiket yang dipakai formulir.
  kodeTerpasang = kode;
  state.terpasang = kode;
  await page.getByRole("button", { name: "Periksa Kode", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verifikasi Berhasil!" })).toBeVisible();
  await page.getByRole("button", { name: "Lanjutkan Pendaftaran", exact: true }).click();

  const isiLangkah = async (nama, nilai, tombol = "Berikutnya") => {
    await page.locator(`input[name="${nama}"]`).fill(nilai);
    await page.getByRole("button", { name: tombol, exact: true }).click();
  };
  await isiLangkah("namaLengkap", "Pecatur Penguji");
  await isiLangkah("panggilan", "Uji");
  await isiLangkah("tanggalLahir", "1995-05-20");
  await isiLangkah("kota", "Medan", "Lanjutkan");
  await isiLangkah("hp", "081234567890");
  await page.getByRole("button", { name: "Lewati", exact: true }).click();
  await page.getByRole("button", { name: "Lewati", exact: true }).click();
  await page.getByRole("button", { name: "Lewati", exact: true }).click();

  await page.locator('input[name="setuju"]').check();
  await page.getByRole("button", { name: "Kirim Pendaftaran", exact: true }).click();

  await expect(page).toHaveURL(/struktur-grup-catur.*keanggotaan/);
  const pendaftaran = requests.find((request) => request.path === "/api/anggota" && request.method === "POST");
  expect(pendaftaran?.body).toMatchObject({
    username: "pecaturuji",
    kota: "Medan",
    setuju: true,
  });
  // Bukti kepemilikan yang dikirim adalah tiket terbitan server.
  expect(pendaftaran?.body?.tiketVerifikasi).toBe("kci1.uji-1");
  // Field yang dulu dipakai untuk "mengaku" terverifikasi tidak dikirim lagi.
  expect(pendaftaran?.body).not.toHaveProperty("sumber");
  expect(pendaftaran?.body).not.toHaveProperty("kode");
  expect(pendaftaran?.body).not.toHaveProperty("terverifikasi");
  expect(state.terkirim?.tiketVerifikasi).toBe("kci1.uji-1");
  periksaGalat();
});

test("tiket yang tidak dikenali server menghentikan pendaftaran dengan pesan jelas", async ({ page }) => {
  const state = { terkirim: null };
  await tiruApiPublik(page, () => {}, state);
  await tiruProfilChessCom(page, () => null);
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pendaftaran-anggota");

  // Hasil OAuth palsu di sessionStorage: tanpa tiket, status tidak berubah.
  await page.evaluate(() => {
    sessionStorage.setItem(
      "kci-hasil-verifikasi",
      JSON.stringify({ sukses: true, username: "pecaturuji" })
    );
  });
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await page.locator('input[name="username"]').fill("pecaturuji");
  await page.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verifikasi Berhasil!" })).toHaveCount(0);

  // Data sessionStorage yang rusak tidak membuat halaman crash.
  await page.evaluate(() => sessionStorage.setItem("kci-hasil-verifikasi", "{rusak: ja"));
  await page.reload();
  await expect(page.locator('input[name="username"]')).toBeVisible();
  periksaGalat();
});

test("form Hubungi Kami mengirim pesan setelah persetujuan", async ({ page }) => {
  const requests = [];
  await tiruApiPublik(page, (request) => requests.push(request));
  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/hubungi-kami");

  // Label lapangan diambil dari kamus (hubungi.nama/surel/subjek/pesan) sehingga
  // teksnya bisa berubah dan berbeda per bahasa — `name` atribut adalah kontrak
  // stabil antara formulir dan muatan POST /api/pesan, jadi itu yang dipakai.
  await page.locator('input[name="name"]').fill("Pengunjung Uji");
  await page.locator('input[name="email"]').fill("pengunjung@example.test");
  await page.locator('input[name="subject"]').fill("Pertanyaan fitur");
  await page.locator('textarea[name="message"]').fill("Mohon informasi kegiatan berikutnya.");
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

/* ------------------------------------------------ keadaan galat & pulih -- */

/**
 * Tiga uji injeksi kegagalan di bawah ini menjaga regresi audit
 * loading/error state: pesan galat yang ramah + tombol coba lagi yang
 * benar-benar memulihkan tampilan TANPA memuat ulang halaman.
 *
 * Flag `berikutnyaGagal` (bukan penghitung) dipakai karena server dev Vite
 * menjalankan React StrictMode yang dapat menggandakan permintaan awal —
 * jumlah pastinya bukan kontrak yang diuji di sini.
 */
test("galat memuat berita menampilkan pesan dan tombol coba lagi", async ({ page }) => {
  let beritaGagal = true;
  await page.route(JALUR_API, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/berita") {
      if (beritaGagal) return json({}, 500);
      return json([
        {
          id: "berita-uji",
          judul: "Berita Uji Pemulihan",
          tanggal: "2026-09-01",
          ringkasan: "Ringkasan berita uji.",
          isi: "Isi berita uji.",
        },
      ]);
    }
    return route.fallback();
  });

  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/media-dan-informasi/berita-komunitas");

  await expect(
    page.getByText("Berita sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.")
  ).toBeVisible();

  beritaGagal = false;
  await page.getByRole("button", { name: "Coba lagi" }).click();
  await expect(page.getByRole("link", { name: "Berita Uji Pemulihan" })).toBeVisible();
  periksaGalat();
});

test("galat memuat peringkat anggota bisa dimuat ulang", async ({ page }) => {
  let anggotaGagal = true;
  await page.route(JALUR_API, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/anggota") {
      if (anggotaGagal) return json({}, 500);
      return json([
        {
          username: "pecaturuji",
          nama: "Pecatur Uji",
          elo: 1500,
          ratings: { Rapid: { elo: 1500, win: 2, draw: 1, loss: 0 } },
          foto: null,
        },
      ]);
    }
    return route.fallback();
  });
  // Cadangan roster publik Chess.com juga harus dipalsukan gagal — tanpa ini
  // browser mengirim permintaan sungguhan keluar dari lingkungan uji.
  await page.route(/api\.chess\.com\/pub\//, (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
  );

  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/beranda/peringkat");

  await expect(
    page.getByText("Data anggota sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.")
  ).toBeVisible();

  anggotaGagal = false;
  await page.getByRole("button", { name: "Muat ulang" }).click();
  await expect(page.getByText("1 pemain")).toBeVisible();
  await expect(page.getByRole("link", { name: "pecaturuji" })).toBeVisible();
  periksaGalat();
});

test("galat memuat ringkasan dashboard bisa dicoba lagi", async ({ page }) => {
  let ringkasanGagal = true;
  await page.route(JALUR_API, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    const token = request.headers()["x-token-admin"];

    if (path === "/api/csrf-token") return json({ token: "csrf-pengurus" });
    if (path === "/api/auth/login" && request.method() === "POST") {
      return json({ ok: true, token: "token-uji", username: "pengurusuji", role: "master" });
    }
    if (path === "/api/pengurus/verifikasi") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      return json({ ok: true, username: "pengurusuji", role: "master" });
    }
    if (path === "/api/pengurus/ringkasan") {
      if (token !== "token-uji") return json({ pesan: "Token tidak sah." }, 401);
      if (ringkasanGagal) return json({ pesan: "Server sedang sibuk." }, 500);
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

  const periksaGalat = pantauGalatHalaman(page);
  await page.goto("/pengurus");
  await page.locator('input[autocomplete="username"]').fill("pengurusuji");
  await page.locator('input[type="password"]').fill("password-uji");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(
    page.getByText("Ringkasan dashboard gagal dimuat. Periksa koneksi lalu coba lagi.")
  ).toBeVisible();

  ringkasanGagal = false;
  await page.getByRole("button", { name: "Coba Lagi" }).click();
  await expect(
    page.getByText("Ringkasan dashboard gagal dimuat. Periksa koneksi lalu coba lagi.")
  ).toBeHidden();
  await expect(page.getByText("12", { exact: true })).toBeVisible();
  periksaGalat();
});
