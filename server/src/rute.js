/**
 * Registrasi seluruh rute HTTP. Handler domain tetap di modul masing-masing.
 */
import { konfigurasi } from "./konfigurasi.js";
import {
  bacaBodi,
  pastikanAdmin,
  catatPercobaanAdmin,
  statusKunciAdmin,
  dapatkanAdminDariRequest,
  pastikanMaster,
  peranPengurus,
  buatCsrfToken,
  terbitkanJwt,
  cocokkanPassword,
} from "./http.js";
import {
  oauthAktif,
  mulaiLogin,
  selesaikanLogin,
  terbitkanTiket,
  intipTiket,
  statistikSesi,
  jalurInternal,
} from "./oauth.js";
import {
  mintaKode,
  periksaKode,
  statistikTantangan,
} from "./verifikasi-profil.js";
import {
  JENIS,
  STATUS,
  untukPublik,
  klasemenTim,
  daftarTurnamen,
  ambilTurnamen,
  buatTurnamen,
  ubahTurnamen,
  hapusTurnamen,
  daftarkanPeserta,
  ajukanKeikutsertaan,
  terimaPengajuan,
  tolakPengajuan,
  keluarkanPeserta,
  catatHasil,
  hapusHasil,
  pindaiPesertaTurnamen,
  ringkasanTurnamen,
  rincianUntukPengurus,
} from "./turnamen.js";
import {
  GalatAplikasi,
  daftarAnggota,
  rosterAnggota,
  segarkanRoster,
  daftarHitamPublik,
  daftarkan,
  blokirAnggota,
  bukaBlokir,
  pindaiFairPlay,
  pindaiFairPlayOtomatis,
  cekNomor,
  kontakAnggota,
  ringkasan,
} from "./keanggotaan.js";
import {
  berita,
  pengumuman,
  ringkasanKonten,
} from "./konten.js";
import {
  kirimPesan,
  daftarPesan,
  tandaiDibaca,
  tandaiSemuaDibaca,
  hapusPesan,
  hapusBanyak,
  ringkasanPesan,
} from "./pesan.js";
import {
  catatRiwayatMasuk,
  daftarRiwayatMasuk,
  hapusRiwayatMasuk,
  bersihkanRiwayatMasuk,
  ringkasanRiwayatMasuk,
} from "./riwayat-masuk.js";
import {
  muatAdminFileKeKonfigurasi,
  bacaAdminFile,
  tulisAdminFile,
  bacaAdminsFile,
  tambahAdmin,
  hapusAdmin,
  ubahAdmin,
} from "./admin-file.js";
import { logAudit, bacaJejakAudit } from "./audit.js";
import { FilterAuditSchema } from "./skema.js";
import { VERSI_API_KANONIK } from "./jalur-api.js";
import { kesehatanSupabase } from "./storage-supabase.js";

const CACHE_PUBLIK = "public, max-age=60";
const CACHE_ANGGOTA = "public, max-age=300, stale-while-revalidate=86400";
/** Snapshot tua tetap boleh dipakai, tetapi jangan disimpan lama di CDN. */
const CACHE_ANGGOTA_USANG = "public, max-age=0, stale-while-revalidate=86400";

export function daftarkanRute(router, { mulaiPada }) {
  /* ------------------------------------------------------------ rute publik */

  router.get("/api/kesehatan", async () => ({
    status: 200,
    isi: {
      status: "sehat",
      lingkungan: konfigurasi.lingkungan,
      hidupDetik: Math.round((Date.now() - mulaiPada) / 1000),
      waktu: new Date().toISOString(),
      versiApi: VERSI_API_KANONIK,
      // Status integrasi Supabase (terpasang & siap). Menunjukkan apakah data
      // benar-benar akan TERSIMPAN di PostgreSQL atau masih jatuh ke /tmp.
      supabase: await kesehatanSupabase(),
    },
  }));

  /** CSRF token untuk request POST. */
  router.get(
    "/api/csrf-token",
    async () => ({ status: 200, isi: { token: buatCsrfToken() } }),
    { batas: 60 }
  );

  /*
   * Daftar anggota dijawab dari snapshot backend sehingga halaman terisi
   * SEKETIKA; bila snapshot sudah tua, penyegaran dari Chess.com berjalan di
   * latar belakang (stale-while-revalidate).
   */
  router.get("/api/anggota", async (req) => {
    const { anggota, diperbaruiPada, segar } = await rosterAnggota();
    return {
      status: 200,
      isi: anggota,
      cache: segar ? CACHE_ANGGOTA : CACHE_ANGGOTA_USANG,
      kepala: {
        "X-Roster-Diperbarui": diperbaruiPada || "",
        "X-Roster-Segar": segar ? "1" : "0",
      },
    };
  });

  /** Metadata snapshot roster — dipakai klien untuk tahu perlu memuat ulang. */
  router.get("/api/anggota/status", async () => {
    const { anggota, diperbaruiPada, segar } = await rosterAnggota();
    return {
      status: 200,
      isi: { jumlah: anggota.length, diperbaruiPada, segar },
      cache: "no-store",
    };
  });

  router.get("/api/daftar-hitam", async () => ({
    status: 200,
    isi: await daftarHitamPublik(),
    cache: CACHE_PUBLIK,
  }));

  router.post(
    "/api/anggota",
    async (req, _param, konteks) => {
      const bodi = await bacaBodi(req);
      const anggota = await daftarkan(bodi, konteks);
      return { status: 201, isi: anggota };
    },
    { batas: konfigurasi.batas.maksDaftar }
  );

  /* ------------------------------------------------- verifikasi akun Chess.com */

  router.get("/api/auth/cara", async () => ({
    status: 200,
    isi: {
      oauth: oauthAktif(),
      kodeProfil: true,
      mode: konfigurasi.wajibVerifikasi,
    },
  }));

  router.get("/api/auth/chess/mulai", async (req) => {
    const url = new URL(req.url, "http://x");
    const kembaliKe = url.searchParams.get("kembali") || undefined;
    const { url: tujuan } = mulaiLogin({ kembaliKe });
    return { status: 200, isi: { url: tujuan } };
  });

  router.get("/api/auth/chess/kembali", async (req) => {
    const url = new URL(req.url, "http://x");
    const galat = url.searchParams.get("error");
    const kode = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const tujuanDasar = konfigurasi.oauth.tujuanSetelahLogin;

    const hasilkanHtml = (data, tujuan = tujuanDasar) => `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Login...</title></head>
<body>
<script>
(function(){
  var data = ${JSON.stringify(data)};
  try {
    sessionStorage.setItem("kci-hasil-verifikasi", JSON.stringify(data));
  } catch(e) {}
  window.location.replace(${JSON.stringify(jalurInternal(tujuan) || "/")});
})();
</script>
</body></html>`;

    if (galat) {
      return { status: 200, html: hasilkanHtml({ sukses: false, sebab: galat }) };
    }
    if (!kode || !state) {
      return { status: 200, html: hasilkanHtml({ sukses: false, sebab: "parameter-kurang" }) };
    }

    try {
      const { username, kembaliKe } = await selesaikanLogin({ code: kode, state });
      const { tiket } = terbitkanTiket(username, "oauth");
      return {
        status: 200,
        html: hasilkanHtml({ sukses: true, username, tiket }, kembaliKe),
      };
    } catch (e) {
      console.error("[kci] gagal menyelesaikan login Chess.com:", e.message);
      return { status: 200, html: hasilkanHtml({ sukses: false, sebab: e.message }) };
    }
  });

  router.post(
    "/api/auth/kode/minta",
    async (req) => {
      const bodi = await bacaBodi(req);
      return { status: 200, isi: await mintaKode(bodi.username) };
    },
    { batas: 20 }
  );

  router.post(
    "/api/auth/kode/periksa",
    async (req) => {
      const bodi = await bacaBodi(req);
      const hasil = await periksaKode(bodi.username);
      if (!hasil.cocok) return { status: 200, isi: hasil };

      const { tiket, berlakuDetik } = terbitkanTiket(hasil.username, "kode-profil");
      return {
        status: 200,
        isi: { ...hasil, tiket, berlakuDetik },
      };
    },
    { batas: 60 }
  );

  router.get("/api/auth/tiket/:nilai", async (_req, param) => {
    const data = intipTiket(param.nilai);
    if (!data) return { status: 404, isi: { pesan: "Tiket tidak berlaku." } };
    return { status: 200, isi: data };
  });

  /**
   * Login dashboard pengurus.
   * POST /api/auth/login  { username, password }
   * -> { token, username, role }
   */
  router.post(
    "/api/auth/login",
    async (req, _param, konteks) => {
      const ip = konteks.ip;
      const userAgent = req.headers["user-agent"] || "";
      const kunciBrute = statusKunciAdmin(ip);
      if (kunciBrute.terkunci) {
        throw new GalatAplikasi(
          429,
          "Terlalu banyak percobaan login yang gagal. Coba lagi dalam " + kunciBrute.cobaLagiDetik + " detik."
        );
      }

      await muatAdminFileKeKonfigurasi().catch(() => {});

      const bodi = await bacaBodi(req);
      const usernameRaw = String(bodi.username || "").trim().toLowerCase();
      const passwordRaw = String(bodi.password || "");

      if (!usernameRaw || !passwordRaw) {
        catatPercobaanAdmin(ip, false);
        await logAudit("admin-login", { ip, userAgent, status: "failed", reason: "kosong" });
        throw new GalatAplikasi(400, "Username dan password wajib diisi.");
      }
      if (!/^[a-z0-9_-]{3,25}$/.test(usernameRaw)) {
        catatPercobaanAdmin(ip, false);
        await logAudit("admin-login", {
          username: usernameRaw,
          ip,
          userAgent,
          status: "failed",
          reason: "username-tidak-valid",
        });
        throw new GalatAplikasi(400, "Username tidak valid (3-25 karakter, huruf/angka/_/-).");
      }

      const tokenAdmin = konfigurasi.tokenAdmin || "";
      let adminDitemukan = null;

      if (Array.isArray(konfigurasi.admins)) {
        const admin = konfigurasi.admins.find((a) => a.username === usernameRaw);
        if (admin && await cocokkanPassword(passwordRaw, admin.password)) {
          adminDitemukan = admin;
        }
      }

      if (!adminDitemukan) {
        const adminUser = konfigurasi.admin?.username || "admin";
        const adminPass = konfigurasi.admin?.password || "admin123";
        if (usernameRaw === adminUser && await cocokkanPassword(passwordRaw, adminPass)) {
          adminDitemukan = { username: adminUser, role: "master" };
        }
      }

      if (!adminDitemukan && tokenAdmin && await cocokkanPassword(passwordRaw, tokenAdmin)) {
        adminDitemukan = { username: usernameRaw, role: "master" };
      }

      if (!adminDitemukan) {
        catatPercobaanAdmin(ip, false);
        await logAudit("admin-login", {
          username: usernameRaw,
          ip,
          userAgent,
          status: "failed",
          reason: "kredensial-salah",
        });
        throw new GalatAplikasi(401, "Username atau password salah.");
      }

      catatPercobaanAdmin(ip, true);
      const usernameCatat = adminDitemukan.username || usernameRaw;
      const roleBalik = adminDitemukan.role || "master";
      const tokenBalik = terbitkanJwt(usernameCatat, roleBalik);

      try {
        await catatRiwayatMasuk({
          username: usernameCatat,
          ip,
          userAgent,
          catatan: "login-" + roleBalik,
        });
      } catch { /* riwayat tidak boleh menggagalkan login */ }

      await logAudit("admin-login", {
        username: usernameCatat,
        ip,
        userAgent,
        status: "success",
      });

      return {
        status: 200,
        isi: {
          ok: true,
          token: tokenBalik,
          username: usernameCatat,
          role: roleBalik,
        },
      };
    },
    { batas: 20 }
  );

  /* ---------------------------------------------------------- rute pengurus */

  async function isiDashboardPengurus(req) {
    pastikanAdmin(req);
    const admin = dapatkanAdminDariRequest(req);
    return {
      status: 200,
      isi: {
        ok: true,
        username: admin?.username || "",
        role: admin?.role || peranPengurus(req) || "pengurus",
        ...(await ringkasan()),
        turnamen: await ringkasanTurnamen(),
        konten: await ringkasanKonten(),
        pesan: await ringkasanPesan(),
        riwayatMasuk: await ringkasanRiwayatMasuk(),
        verifikasi: {
          mode: konfigurasi.wajibVerifikasi,
          oauthAktif: oauthAktif(),
          ...statistikSesi(),
          ...statistikTantangan(),
        },
      },
    };
  }

  router.get("/api/pengurus", isiDashboardPengurus);
  router.get("/api/pengurus/ringkasan", isiDashboardPengurus);

  router.post("/api/pengurus/masuk", async (req, _param, konteks) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    const username = bodi.username || konteks.pengguna || "pengurus";
    const userAgent = req.headers["user-agent"] || "";
    const entri = await catatRiwayatMasuk({
      username,
      ip: konteks.ip,
      userAgent,
      catatan: bodi.catatan,
    });
    await logAudit("dashboard-access", {
      username,
      ip: konteks.ip,
      userAgent,
      status: "success",
    });
    return { status: 200, isi: { ok: true, entri } };
  });

  router.get("/api/pengurus/riwayat-masuk", async (req) => {
    pastikanMaster(req);
    return { status: 200, isi: await daftarRiwayatMasuk() };
  });

  router.post("/api/pengurus/riwayat-masuk/hapus", async (req) => {
    pastikanMaster(req);
    const bodi = await bacaBodi(req);
    if (!bodi.id) {
      throw new GalatAplikasi(400, "ID riwayat harus disertakan.");
    }
    await hapusRiwayatMasuk(bodi.id);
    return { status: 200, isi: { pesan: "Riwayat masuk dihapus." } };
  });

  router.post("/api/pengurus/riwayat-masuk/bersihkan", async (req) => {
    pastikanMaster(req);
    await bersihkanRiwayatMasuk();
    return { status: 200, isi: { pesan: "Semua riwayat masuk dibersihkan." } };
  });

  router.get("/api/pengurus/audit", async (req) => {
    pastikanAdmin(req);
    const url = new URL(req.url, "http://x");
    const parsed = FilterAuditSchema.safeParse({
      limit: url.searchParams.get("limit") || undefined,
      aksi: url.searchParams.get("aksi") || undefined,
      username: url.searchParams.get("username") || undefined,
      sejak: url.searchParams.get("sejak") || undefined,
      hingga: url.searchParams.get("hingga") || undefined,
    });
    const filter = parsed.success ? parsed.data : { limit: 200 };
    return { status: 200, isi: await bacaJejakAudit(filter) };
  });

  router.post("/api/pengurus/ganti-password", async (req, _p, konteks) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    const passLama = String(bodi.passwordLama || "");
    const passBaru = String(bodi.passwordBaru || "");
    const userBaru = String(bodi.usernameBaru || "").trim().toLowerCase() || konfigurasi.admin.username;

    if (!passLama || !passBaru) {
      throw new GalatAplikasi(400, "Password lama dan baru wajib diisi.");
    }
    if (passBaru.length < 6) {
      throw new GalatAplikasi(400, "Password baru minimal 6 karakter.");
    }
    if (!/^[a-z0-9_-]{3,25}$/.test(userBaru)) {
      throw new GalatAplikasi(400, "Username baru tidak valid (3-25 karakter).");
    }

    const aktif = konfigurasi.admin.password;
    const tokenAdmin = konfigurasi.tokenAdmin || "";
    let cocok = false;
    try {
      cocok = await cocokkanPassword(passLama, aktif);
      if (!cocok && tokenAdmin) cocok = await cocokkanPassword(passLama, tokenAdmin);
    } catch {
      cocok = passLama === aktif || (tokenAdmin && passLama === tokenAdmin);
    }
    if (!cocok) {
      await logAudit("password-change", {
        username: userBaru,
        ip: konteks.ip,
        status: "failed",
        reason: "password-lama-salah",
      });
      throw new GalatAplikasi(401, "Password lama salah.");
    }

    await tulisAdminFile({ username: userBaru, password: passBaru });
    konfigurasi.admin.username = userBaru;
    await logAudit("password-change", {
      username: userBaru,
      ip: konteks.ip,
      status: "success",
    });

    return {
      status: 200,
      isi: { ok: true, username: userBaru, pesan: "Password berhasil diganti. Login ulang dengan password baru." },
    };
  });

  router.get("/api/pengurus/admin-info", async (req) => {
    pastikanAdmin(req);
    const file = await bacaAdminFile().catch(() => null);
    const admin = dapatkanAdminDariRequest(req);
    return {
      status: 200,
      isi: {
        username: admin?.username || konfigurasi.admin.username,
        role: admin?.role || peranPengurus(req) || "master",
        adaFile: Boolean(file),
        sumber: file ? "file" : "env/bawaan",
      },
    };
  });

  router.get("/api/pengurus/admins", async (req) => {
    pastikanMaster(req);
    const admins = await bacaAdminsFile() || konfigurasi.admins || [];
    return {
      status: 200,
      isi: admins.map((a) => ({
        username: a.username,
        role: a.role,
        dibuatPada: a.dibuatPada,
        diubahPada: a.diubahPada,
      })),
    };
  });

  router.post("/api/pengurus/admins/tambah", async (req) => {
    pastikanMaster(req);
    const bodi = await bacaBodi(req);
    const username = String(bodi.username || "").trim().toLowerCase();
    const password = String(bodi.password || "");
    const role = String(bodi.role || "pengurus").trim().toLowerCase();
    if (!username || !password) throw new GalatAplikasi(400, "Username dan password wajib diisi.");
    const hasil = await tambahAdmin({ username, password, role });
    await logAudit("admin-tambah", { resourceId: username, status: "success" });
    return {
      status: 201,
      isi: {
        pesan: `Admin "${username}" dengan role "${role}" berhasil ditambahkan.`,
        admins: hasil.map((a) => ({ username: a.username, role: a.role, dibuatPada: a.dibuatPada, diubahPada: a.diubahPada })),
      },
    };
  });

  router.post("/api/pengurus/admins/hapus", async (req) => {
    pastikanMaster(req);
    const bodi = await bacaBodi(req);
    const username = String(bodi.username || "").trim().toLowerCase();
    if (!username) throw new GalatAplikasi(400, "Username wajib diisi.");
    const hasil = await hapusAdmin(username);
    await logAudit("admin-hapus", { resourceId: username, status: "success" });
    return {
      status: 200,
      isi: {
        pesan: `Admin "${username}" dihapus.`,
        admins: hasil.map((a) => ({ username: a.username, role: a.role })),
      },
    };
  });

  router.post("/api/pengurus/admins/ubah", async (req) => {
    pastikanMaster(req);
    const bodi = await bacaBodi(req);
    const username = String(bodi.username || "").trim().toLowerCase();
    const password = bodi.password ? String(bodi.password) : undefined;
    const role = bodi.role ? String(bodi.role).trim().toLowerCase() : undefined;
    if (!username) throw new GalatAplikasi(400, "Username wajib diisi.");
    const hasil = await ubahAdmin(username, { password, role });
    await logAudit("admin-ubah", { resourceId: username, status: "success" });
    return {
      status: 200,
      isi: {
        pesan: `Admin "${username}" diperbarui.`,
        admins: hasil.map((a) => ({ username: a.username, role: a.role })),
      },
    };
  });

  router.get("/api/pengurus/verifikasi", async (req) => {
    pastikanAdmin(req);
    const admin = dapatkanAdminDariRequest(req);
    return { status: 200, isi: { ok: true, username: admin?.username || "", role: admin?.role || peranPengurus(req) || "pengurus" } };
  });

  /** Paksa susun ulang snapshot roster anggota dari Chess.com. */
  router.post("/api/pengurus/segarkan-roster", async (req) => {
    await pastikanAdmin(req);
    const anggota = await segarkanRoster();
    return { status: 200, isi: { jumlah: anggota.length, diperbaruiPada: new Date().toISOString() } };
  });

  router.post("/api/pengurus/pindai", async (req) => {
    pastikanAdmin(req);
    return { status: 200, isi: await pindaiFairPlay() };
  });

  router.get("/api/pengurus/pindai-otomatis", async (req) => {
    pastikanAdmin(req);
    const hasil = await pindaiFairPlayOtomatis();
    return {
      status: 200,
      isi: { dijalankan: Boolean(hasil), ...(hasil || {}) },
    };
  });

  router.post("/api/pengurus/blokir", async (req, _p, konteks) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    if (!bodi.username) {
      throw new GalatAplikasi(400, "Sebutkan username yang akan diblokir.");
    }
    const entri = await blokirAnggota(bodi.username, bodi.keterangan);
    await logAudit("member-block", {
      username: konteks.pengguna,
      resourceId: bodi.username,
      ip: konteks.ip,
      status: "success",
    });
    return { status: 200, isi: entri };
  });

  router.post("/api/pengurus/buka", async (req, _p, konteks) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    if (!bodi.username) {
      throw new GalatAplikasi(400, "Sebutkan username yang akan dibuka.");
    }
    await bukaBlokir(bodi.username);
    await logAudit("member-unblock", {
      username: konteks.pengguna,
      resourceId: bodi.username,
      ip: konteks.ip,
      status: "success",
    });
    return { status: 200, isi: { pesan: `Larangan untuk "${bodi.username}" dicabut.` } };
  });

  router.post("/api/pengurus/cek-nomor", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 200, isi: await cekNomor(bodi.hp) };
  });

  router.get("/api/pengurus/kontak/:username", async (req, param) => {
    pastikanAdmin(req);
    return { status: 200, isi: await kontakAnggota(param.username) };
  });

  /* ------------------------------------------------------------ turnamen */

  router.get("/api/turnamen/jenis", async () => ({
    status: 200,
    isi: { jenis: JENIS, status: STATUS },
    cache: "public, max-age=3600",
  }));

  router.get("/api/turnamen", async (req) => {
    const url = new URL(req.url, "http://x");
    const semua = await daftarTurnamen({
      jenis: url.searchParams.get("jenis") || undefined,
      status: url.searchParams.get("status") || undefined,
    });
    const tampil = semua.filter((t) => t.status !== "draf");
    return { status: 200, isi: tampil.map(untukPublik), cache: CACHE_PUBLIK };
  });

  router.post(
    "/api/turnamen/:id/daftar",
    async (req, param) => {
      const bodi = await bacaBodi(req);
      return { status: 201, isi: await ajukanKeikutsertaan(param.id, bodi) };
    },
    { batas: 10 }
  );

  router.get("/api/turnamen/:id", async (_req, param) => {
    const t = await ambilTurnamen(param.id);
    if (t.status === "draf") {
      throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    }
    return {
      status: 200,
      isi: { ...untukPublik(t), klasemenTim: klasemenTim(t), hasil: t.hasil || [] },
      cache: t.status === "selesai" ? "public, max-age=3600" : CACHE_PUBLIK,
    };
  });

  /* ------------------------------------------------ turnamen — pengurus */

  router.get("/api/pengurus/turnamen", async (req) => {
    pastikanAdmin(req);
    const semua = await daftarTurnamen();
    return {
      status: 200,
      isi: semua.map((t) => ({
        ...untukPublik(t),
        jumlahPengajuan: (t.pengajuan || []).filter((p) => p.status === "menunggu").length,
      })),
    };
  });

  router.get("/api/pengurus/turnamen/:id", async (req, param) => {
    pastikanAdmin(req);
    return { status: 200, isi: await rincianUntukPengurus(param.id) };
  });

  router.post("/api/pengurus/turnamen", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 201, isi: untukPublik(await buatTurnamen(bodi)) };
  });

  router.post("/api/pengurus/turnamen/:id/ubah", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 200, isi: untukPublik(await ubahTurnamen(param.id, bodi)) };
  });

  router.post("/api/pengurus/turnamen/:id/hapus", async (req, param) => {
    pastikanAdmin(req);
    await hapusTurnamen(param.id);
    return { status: 200, isi: { pesan: "Turnamen dihapus." } };
  });

  router.post("/api/pengurus/turnamen/:id/peserta", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 201, isi: await daftarkanPeserta(param.id, bodi) };
  });

  router.post("/api/pengurus/turnamen/:id/pengajuan-terima", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 200, isi: await terimaPengajuan(param.id, bodi.username) };
  });

  router.post("/api/pengurus/turnamen/:id/pengajuan-tolak", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 200, isi: await tolakPengajuan(param.id, bodi) };
  });

  router.post("/api/pengurus/turnamen/:id/peserta-keluar", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    await keluarkanPeserta(param.id, bodi.username);
    return { status: 200, isi: { pesan: "Peserta dikeluarkan." } };
  });

  router.post("/api/pengurus/turnamen/:id/hasil", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 201, isi: await catatHasil(param.id, bodi) };
  });

  router.post("/api/pengurus/turnamen/:id/hasil-hapus", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    await hapusHasil(param.id, bodi.indeks);
    return { status: 200, isi: { pesan: "Hasil dihapus." } };
  });

  router.post("/api/pengurus/turnamen/:id/pindai", async (req, param) => {
    pastikanAdmin(req);
    return { status: 200, isi: await pindaiPesertaTurnamen(param.id) };
  });

  /* ------------------------------------------------------------ konten */

  router.get("/api/berita", async () => {
    const semua = await berita.daftar({ status: "publik" });
    return { status: 200, isi: semua.map(berita.untukPublik), cache: CACHE_PUBLIK };
  });

  router.get("/api/pengumuman", async () => {
    const semua = await pengumuman.daftar({ status: "publik" });
    return { status: 200, isi: semua.map(pengumuman.untukPublik), cache: CACHE_PUBLIK };
  });

  router.get("/api/pengurus/berita", async (req) => {
    pastikanAdmin(req);
    const semua = await berita.daftar();
    return { status: 200, isi: semua.map(berita.untukPublik) };
  });

  router.post("/api/pengurus/berita", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 201, isi: berita.untukPublik(await berita.buat(bodi)) };
  });

  router.post("/api/pengurus/berita/:id/ubah", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 200, isi: berita.untukPublik(await berita.ubah(param.id, bodi)) };
  });

  router.post("/api/pengurus/berita/:id/hapus", async (req, param) => {
    pastikanAdmin(req);
    await berita.hapus(param.id);
    return { status: 200, isi: { pesan: "Berita dihapus." } };
  });

  router.get("/api/pengurus/pengumuman", async (req) => {
    pastikanAdmin(req);
    const semua = await pengumuman.daftar();
    return { status: 200, isi: semua.map(pengumuman.untukPublik) };
  });

  router.post("/api/pengurus/pengumuman", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return { status: 201, isi: pengumuman.untukPublik(await pengumuman.buat(bodi)) };
  });

  router.post("/api/pengurus/pengumuman/:id/ubah", async (req, param) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    return {
      status: 200,
      isi: pengumuman.untukPublik(await pengumuman.ubah(param.id, bodi)),
    };
  });

  router.post("/api/pengurus/pengumuman/:id/hapus", async (req, param) => {
    pastikanAdmin(req);
    await pengumuman.hapus(param.id);
    return { status: 200, isi: { pesan: "Pengumuman dihapus." } };
  });

  /* ---------------------------------------------------------- pesan */

  router.post(
    "/api/pesan",
    async (req) => {
      const bodi = await bacaBodi(req);
      return { status: 201, isi: await kirimPesan(bodi) };
    },
    { batas: 5 }
  );

  router.get("/api/pengurus/pesan", async (req) => {
    pastikanAdmin(req);
    return { status: 200, isi: await daftarPesan() };
  });

  router.post("/api/pengurus/pesan/semua-baca", async (req) => {
    pastikanAdmin(req);
    await tandaiSemuaDibaca();
    return { status: 200, isi: { pesan: "Semua pesan ditandai dibaca." } };
  });

  router.post("/api/pengurus/pesan/:id/baca", async (req, param) => {
    pastikanAdmin(req);
    await tandaiDibaca(param.id);
    return { status: 200, isi: { pesan: "Pesan ditandai sudah dibaca." } };
  });

  router.post("/api/pengurus/pesan/hapus-banyak", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    const { ids } = bodi || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return { status: 400, isi: { pesan: "Tidak ada pesan dipilih." } };
    }
    await hapusBanyak(ids);
    return { status: 200, isi: { pesan: `${ids.length} pesan dihapus.` } };
  });

  router.post("/api/pengurus/pesan/:id/hapus", async (req, param) => {
    pastikanAdmin(req);
    await hapusPesan(param.id);
    return { status: 200, isi: { pesan: "Pesan dihapus." } };
  });
}
