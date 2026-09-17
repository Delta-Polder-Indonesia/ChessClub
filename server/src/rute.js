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
  samaAman,
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
  ajukanVerifikasiManual,
  daftarPengajuan as daftarPengajuanVerifikasi,
  setujuiPengajuan as setujuiPengajuanVerifikasi,
  tolakPengajuan as tolakPengajuanVerifikasi,
  catatPersetujuanDiterapkan as catatPersetujuanDiterapkanVerifikasi,
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
  pindaiFairPlayLanjut,
  pindaiFairPlayOtomatis,
  pindaiFairPlayTerjadwal,
  statusPindaiTerakhir,
  cekNomor,
  kontakAnggota,
  ringkasan,
  tandaiAnggotaTerverifikasi,
  verifikasiMandiri,
} from "./keanggotaan.js";
import {
  berita,
  pengumuman,
  ringkasanKonten,
} from "./konten.js";
import {
  bacaSemuaRekor,
  susunPeringkat,
  catatRekorRush,
  anggotaTerdafatar,
} from "./rekor-rush.js";
import {
  buatKodeEbook,
  daftarKodeEbook,
  hapusKodeEbook,
  tebusUnduhanEbook,
  daftarUnduhanEbook,
  mintaKodeEbook,
  daftarMintaEbook,
  terbitkanKodeDariMinta,
  tolakMintaEbook,
} from "./ebook.js";
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
  PANJANG_PASSWORD_MIN,
} from "./admin-file.js";
import { logAudit, bacaJejakAudit } from "./audit.js";
import { FilterAuditSchema } from "./skema.js";
import { VERSI_API_KANONIK } from "./jalur-api.js";
import { kesehatanSupabase } from "./storage-supabase.js";

// Kirim skor Rush dibatasi lebih ketat daripada batas umum (anti-spam).
const BATAS_REKOR_RUSH = 30;
const CACHE_PUBLIK = "public, max-age=60";
const CACHE_ANGGOTA = "public, max-age=300, stale-while-revalidate=86400";
/** Snapshot tua tetap boleh dipakai, tetapi jangan disimpan lama di CDN. */
const CACHE_ANGGOTA_USANG = "public, max-age=0, stale-while-revalidate=86400";

export function daftarkanRute(router, { mulaiPada }) {
  /**
   * Peringatan operasional yang bisa dibaca manusia maupun monitor eksternal.
   *
   * Tujuannya menutup celah "deployment terlihat sehat padahal longgar":
   * sebelum ini, server yang lupa menyetel KCI_WAJIB_VERIFIKASI atau yang
   * menyimpan data di /tmp tetap menjawab `status: "sehat"` dan tidak ada satu
   * pun layar yang mengatakan ada yang salah. Sekarang kondisi itu disebut
   * eksplisit di `/api/kesehatan` dan di dasbor pengurus.
   *
   * `kode` adalah kunci stabil untuk mesin; `pesan` untuk manusia. Tidak ada
   * nilai rahasia (token, pepper, password) yang ikut dikirim.
   */
  async function peringatanOperasional({ pengajuanMenunggu = 0, supabase = null } = {}) {
    const daftar = [];
    const infoSupabase = supabase || (await kesehatanSupabase());
    const mode = konfigurasi.wajibVerifikasi;

    if (konfigurasi.produksi && mode !== "wajib") {
      daftar.push({
        kode: "verifikasi-tidak-wajib",
        tingkat: "kritis",
        pesan:
          `Produksi berjalan dengan KCI_WAJIB_VERIFIKASI="${mode}". ` +
          "Pendaftaran dapat masuk tanpa bukti kepemilikan akun Chess.com.",
      });
    }
    if (konfigurasi.produksi && !oauthAktif()) {
      daftar.push({
        kode: "oauth-nonaktif",
        tingkat: "peringatan",
        pesan:
          "OAuth Chess.com tidak aktif di produksi (KCI_CHESS_CLIENT_ID / " +
          "KCI_CHESS_REDIRECT_URI kosong). Hanya jalur kode profil yang tersedia.",
      });
    }
    if (!infoSupabase.siap) {
      daftar.push({
        kode: "penyimpanan-sementara",
        tingkat: "kritis",
        pesan:
          "Supabase tidak siap — data ditulis ke penyimpanan sementara /tmp dan " +
          "HILANG saat cold start atau redeploy.",
      });
    }
    if (pengajuanMenunggu > 0) {
      daftar.push({
        kode: "pengajuan-menunggu",
        tingkat: "info",
        pesan:
          `${pengajuanMenunggu} pengajuan verifikasi menunggu pemeriksaan pengurus.`,
      });
    }
    return daftar;
  }

  /* ------------------------------------------------------------ rute publik */

  router.get("/api/kesehatan", async () => {
    // Status integrasi Supabase (terpasang & siap). Menunjukkan apakah data
    // benar-benar akan TERSIMPAN di PostgreSQL atau masih jatuh ke /tmp.
    const supabase = await kesehatanSupabase();
    return {
      status: 200,
      isi: {
        status: "sehat",
        lingkungan: konfigurasi.lingkungan,
        hidupDetik: Math.round((Date.now() - mulaiPada) / 1000),
        waktu: new Date().toISOString(),
        versiApi: VERSI_API_KANONIK,
        supabase,
        verifikasi: {
          mode: konfigurasi.wajibVerifikasi,
          wajib: konfigurasi.wajibVerifikasi === "wajib",
          oauthAktif: oauthAktif(),
        },
        peringatan: await peringatanOperasional({ supabase }),
      },
    };
  });

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

  /**
   * Verifikasi mandiri untuk anggota yang SUDAH terdaftar.
   * POST /api/anggota/verifikasi-diri { username, tiketVerifikasi }
   *
   * Pendaftaran menolak username yang sudah ada (409), jadi tanpa endpoint ini
   * anggota lama yang `terverifikasi:false` tidak punya jalan melengkapi bukti
   * kepemilikan akun. Otorisasinya adalah tiket itu sendiri (HMAC, terikat
   * username, sekali pakai) — lihat `verifikasiMandiri()` untuk penjaga
   * daftar larangan dan status Chess.com yang mencegah endpoint ini dipakai
   * memulihkan akun yang kena ban.
   */
  router.post(
    "/api/anggota/verifikasi-diri",
    async (req, _param, konteks) => {
      const bodi = await bacaBodi(req);
      const hasil = await verifikasiMandiri(
        { username: bodi?.username, tiketVerifikasi: bodi?.tiketVerifikasi },
        konteks
      );
      // Tiket tidak pernah dikembalikan ke klien.
      return { status: 200, isi: hasil };
    },
    { batas: konfigurasi.batas.maksDaftar }
  );

  /* --------------------------------------------- papan peringkat Rush */
  /** Peringkat "Rush Teka-teki" untuk satu durasi (bawaan 5 menit). */
  router.get("/api/rekor-rush", async (req) => {
    const url = new URL(req.url || "", "http://x");
    const durasi = Number(url.searchParams.get("durasi") || 5);
    const daftar = await bacaSemuaRekor();
    return {
      status: 200,
      isi: { durasi, peringkat: susunPeringkat(daftar, durasi) },
      cache: "no-store",
    };
  });

  /**
   * Catat skor Rush — hanya untuk username anggota klub yang terdaftar.
   * CSRF dipastikan otomatis untuk semua POST (lihat permintaan.js).
   */
  router.post(
    "/api/rekor-rush",
    async (req) => {
      const bodi = await bacaBodi(req);
      const username = bodi?.username;
      const skor = Number(bodi?.skor);
      const durasiMenit = Number(bodi?.durasiMenit);
      const anggota = await anggotaTerdafatar(username);
      if (!anggota) {
        return {
          status: 403,
          isi: {
            pesan:
              "Hanya anggota klub terdaftar yang bisa mencatat skor Rush.",
          },
        };
      }
      if (!Number.isFinite(skor) || skor < 0) {
        return { status: 400, isi: { pesan: "Skor tidak sah." } };
      }
      if (durasiMenit !== 3 && durasiMenit !== 5) {
        return { status: 400, isi: { pesan: "Durasi harus 3 atau 5 menit." } };
      }
      const { hasil, peringkat } = await catatRekorRush({
        username,
        skor,
        durasiMenit,
      });
      return { status: hasil.baru ? 201 : 200, isi: { hasil, peringkat } };
    },
    { batas: BATAS_REKOR_RUSH }
  );

  /* ------------------------------------------------- verifikasi akun Chess.com */

  /**
   * Kontrak bagi formulir: cara verifikasi mana yang tersedia dan APAKAH
   * bukti kepemilikan diwajibkan. UI tidak boleh menyimpulkan sendiri —
   * mode dibaca dari server supaya label "wajib" tidak pernah bohong.
   */
  router.get("/api/auth/cara", async () => ({
    status: 200,
    isi: {
      oauth: oauthAktif(),
      kodeProfil: true,
      mode: konfigurasi.wajibVerifikasi,
      wajib: konfigurasi.wajibVerifikasi === "wajib",
      tiketBerlakuDetik: konfigurasi.tiket.umurDetik,
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

    /**
     * Halaman perantara: menaruh hasil ke sessionStorage lalu mengali-
     * hkan. Dua hal yang harus aman di sini:
     *  - data disisipkan ke dalam <script> sebagai JSON yang DIESCAPE, agar
     *    `</script>` dari Chess.com / query string tidak menutup tag dan
     *    menjalankan skrip di asal kita (XSS). Nilai yang dikembalikan
     *    Chess.com adalah input pihak ketiga.
     *  - yang dikirim HANYA kode sebab yang sudah dikenal. Pesan exception
     *    teknis (isi token, pesan HTTP Chess.com) tidak pernah ditempel ke
     *    halaman; itu hanya masuk log server.
     */
    const hasilkanHtml = (data, tujuan = tujuanDasar) => {
      const aman = JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
      const arah = JSON.stringify(jalurInternal(tujuan) || "/");
      return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>Login...</title></head>
<body>
<script>
(function(){
  var data = ${aman};
  try {
    sessionStorage.setItem("kci-hasil-verifikasi", JSON.stringify(data));
  } catch(e) {}
  window.location.replace(${arah});
})();
</script>
</body></html>`;
    };

    /** Penyebab OAuth yang aman ditampilkan — daftar kode, bukan teks bebas. */
    const KODE_SEBAB = new Set([
      "konfigurasi",
      "state",
      "state-kedaluwarsa",
      "chesscom",
      "token",
      "username",
      "penandatangan",
    ]);

    if (galat) {
      // Chess.com mengirim `error` seperti "access_denied" — petakan ke kode
      // kita, jangan teruskan mentah-mentah.
      return { status: 200, html: hasilkanHtml({ sukses: false, sebab: "chesscom" }) };
    }
    if (!kode || !state) {
      return { status: 200, html: hasilkanHtml({ sukses: false, sebab: "state" }) };
    }

    try {
      const { username, kembaliKe } = await selesaikanLogin({ code: kode, state });
      const { tiket, berlakuDetik } = terbitkanTiket(username, "oauth");
      return {
        status: 200,
        html: hasilkanHtml({
          sukses: true,
          username,
          tiket,
          cara: "oauth",
          berlakuDetik,
        }, kembaliKe),
      };
    } catch (e) {
      const sebab = KODE_SEBAB.has(e?.sebab) ? e.sebab : "token";
      console.warn(`[kci] login Chess.com gagal (${sebab}): ${e?.message || e}`);
      return { status: 200, html: hasilkanHtml({ sukses: false, sebab }) };
    }
  });

  router.post(
    "/api/auth/kode/minta",
    async (req) => {
      const bodi = await bacaBodi(req);
      return { status: 200, isi: await mintaKode(bodi.username, { paksa: Boolean(bodi.paksa) }) };
    },
    { batas: 20 }
  );

  /**
   * Pemeriksaan kode dilakukan DI SERVER (baca profil segar + cocokkan kode
   * yang tadi ia terbitkan). Hanya di titik ini tiket "kode-profil" terbit.
   * Browser tidak pernah memutuskan sendiri bahwa ia "terverifikasi".
   */
  router.post(
    "/api/auth/kode/periksa",
    async (req) => {
      const bodi = await bacaBodi(req);
      const hasil = await periksaKode(bodi.username);
      if (!hasil.cocok) return { status: 200, isi: hasil };

      const { tiket, berlakuDetik, kedaluwarsaPada } = terbitkanTiket(hasil.username, "kode-profil");
      return {
        status: 200,
        isi: { ...hasil, tiket, berlakuDetik, kedaluwarsaPada, cara: "kode-profil" },
      };
    },
    { batas: 60 }
  );

  /**
   * Pengajuan verifikasi manual — untuk pendaftar yang tidak dapat menyunting
   * profilnya. Jalur ini SENGAJA tidak pernah menerbitkan tiket: hasilnya
   * selalu "menunggu" sampai pengurus memeriksa dan menyetujui lewat
   * /api/pengurus/pengajuan-verifikasi/:id/setujui.
   */
  router.post(
    "/api/auth/pengajuan-manual",
    async (req, _param, konteks) => {
      const bodi = await bacaBodi(req);
      const hasil = await ajukanVerifikasiManual({
        username: bodi.username,
        catatan: bodi.catatan,
        ip: konteks.ip,
      });
      return { status: 202, isi: hasil };
    },
    { batas: 10 }
  );

  /** Pratinjau tiket milik pendaftar sendiri (cek kedaluwarsa di UI). */
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
    // Pengajuan manual yang menunggu pemeriksaan — jalur manual tidak
    // mengubah status terverifikasi sampai pengajuan ini selesai diperiksa.
    const pengajuanMenunggu = await daftarPengajuanVerifikasi({ status: "menunggu" })
      .then((d) => d.length)
      .catch(() => 0);
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
          wajib: konfigurasi.wajibVerifikasi === "wajib",
          oauthAktif: oauthAktif(),
          ...statistikSesi(),
          ...(await statistikTantangan()),
          pengajuanMenunggu,
          /* Kapan pemindaian ban fair play terakhir berjalan dan apakah
             putarannya tuntas. Tanpa ini pengurus tidak bisa membedakan
             "tidak ada yang kena ban" dari "pemindaian tidak pernah jalan". */
          pindaiTerakhir: await statusPindaiTerakhir().catch(() => ({ pernah: false })),
        },
        peringatan: await peringatanOperasional({ pengajuanMenunggu }).catch(() => []),
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
    // Jejak audit memuat IP, username, dan aksi administratif — selaraskan
    // dengan UI (panel Jejak Audit hanya ada di Pengaturan, khusus master).
    pastikanMaster(req);
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
    // LAYANAN MANDIRI: setiap admin yang login (master maupun pengurus)
    // mengganti kredensial akunnya SENDIRI. Password lama diverifikasi hanya
    // terhadap akun yang sedang login, role tidak pernah diubah, dan akun
    // admin lain tidak bisa disentuh lewat endpoint ini — menutup jalur
    // privilege-escalation pengurus → master.
    pastikanAdmin(req);
    const adminAktif = dapatkanAdminDariRequest(req);
    const bodi = await bacaBodi(req);
    const passLama = String(bodi.passwordLama || "");
    const passBaru = String(bodi.passwordBaru || "");
    const userBaru = String(bodi.usernameBaru || "").trim().toLowerCase();

    if (!passLama || !passBaru) {
      throw new GalatAplikasi(400, "Password lama dan baru wajib diisi.");
    }
    // Ambang sama dengan lapisan penyimpanan (admin-file.js) lewat konstanta
    // bersama — pesan galat jelas 400, bukan 500 dari bcrypt/validasi dalam.
    if (passBaru.length < PANJANG_PASSWORD_MIN) {
      throw new GalatAplikasi(400, `Password baru minimal ${PANJANG_PASSWORD_MIN} karakter.`);
    }
    if (passBaru === "admin123") {
      throw new GalatAplikasi(400, "Password bawaan admin123 tidak diizinkan.");
    }

    await muatAdminFileKeKonfigurasi().catch(() => {});
    const admins = Array.isArray(konfigurasi.admins) ? konfigurasi.admins : [];
    const usernameSendiri = adminAktif?.username || konfigurasi.admin?.username || "";
    const usernameTarget = userBaru || usernameSendiri;
    if (!/^[a-z0-9_-]{3,25}$/.test(usernameTarget)) {
      throw new GalatAplikasi(400, "Username baru tidak valid (3-25 karakter).");
    }
    const rekamSendiri = admins.find((a) => a.username === usernameSendiri) || null;

    // Password lama HARUS cocok dengan kredensial admin yang sedang login
    // (rekamannya di admins.json, atau bawaan env/token lama) — tidak pernah
    // dicocokkan dengan password admin lain.
    let cocok = false;
    if (rekamSendiri?.password) {
      cocok = await cocokkanPassword(passLama, rekamSendiri.password);
    }
    if (!cocok && usernameSendiri === konfigurasi.admin?.username && konfigurasi.admin?.password) {
      cocok = await cocokkanPassword(passLama, konfigurasi.admin.password);
    }
    if (!cocok && konfigurasi.tokenAdmin) {
      // Kompatibel dengan token lama: token lama masih boleh diisi sebagai
      // password lama oleh pemegangnya sendiri.
      cocok = await cocokkanPassword(passLama, konfigurasi.tokenAdmin);
    }
    if (!cocok) {
      await logAudit("password-change", {
        username: usernameTarget,
        ip: konteks.ip,
        status: "failed",
        reason: "password-lama-salah",
      });
      throw new GalatAplikasi(401, "Password lama salah.");
    }

    if (rekamSendiri) {
      // Admin tercatat di admins.json: ubahAdmin mempertahankan role asli
      // dan menolak username baru yang sudah dipakai admin lain.
      await ubahAdmin(usernameSendiri, {
        password: passBaru,
        ...(usernameTarget !== usernameSendiri ? { usernameBaru: usernameTarget } : {}),
      });
    } else {
      // Bootstrap awal: file admins belum ada / admin aktif belum tercatat —
      // tulisAdminFile membuat master pertama (satu-satunya jalur yang boleh
      // menghasilkan role master dari endpoint ini).
      await tulisAdminFile({ username: usernameTarget, password: passBaru });
      if (usernameSendiri === konfigurasi.admin?.username) {
        konfigurasi.admin.username = usernameTarget;
      }
    }

    await logAudit("password-change", {
      username: usernameTarget,
      ip: konteks.ip,
      status: "success",
    });

    return {
      status: 200,
      isi: { ok: true, username: usernameTarget, pesan: "Password berhasil diganti. Login ulang dengan password baru." },
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

  /* "Pindai sekarang" dari dasbor. Menjalankan SATU batch dan melanjutkan
     kursor yang tersimpan, jadi aman terhadap `maxDuration: 60` sekaligus
     benar-benar menyusuri seluruh roster bila ditekan berulang kali. */
  router.post("/api/pengurus/pindai", async (req) => {
    pastikanAdmin(req);
    return { status: 200, isi: await pindaiFairPlayLanjut() };
  });

  router.get("/api/pengurus/pindai-otomatis", async (req) => {
    pastikanAdmin(req);
    const hasil = await pindaiFairPlayOtomatis();
    return {
      status: 200,
      isi: { dijalankan: Boolean(hasil), ...(hasil || {}) },
    };
  });

  /**
   * Pemindaian terjadwal (Vercel Cron -> `vercel.json` `crons`).
   *
   * Mengapa endpoint ini ada: tanpa cron, pemindaian ban fair play HANYA
   * berjalan saat ada pengurus yang membuka dasbor. Di serverless tanpa trafik
   * itu bisa berarti tidak pernah — akun yang memakai engine lalu kena ban
   * tidak pernah terlacak. Cron membuatnya berjalan terjadwal apa pun yang
   * terjadi di sisi pengguna.
   *
   * Jadwalnya sekali sehari (`17 4 * * *`), bukan tiap 6 jam: paket Vercel
   * Hobby MENOLAK deployment dengan cron yang berjalan lebih dari sekali
   * sehari. Supaya sekali sehari tetap cukup, `pindaiFairPlayTerjadwal()`
   * menjalankan batch beruntun sampai roster tuntas atau anggaran waktu habis.
   * Bila proyek sudah di paket Pro, jadwal boleh diperketat ke `17 *\/6 * * *`.
   *
   * Penjaga: header `Authorization: Bearer <KCI_CRON_SECRET>`, dibandingkan
   * konstan-time lewat `samaAman()` (hash dulu, baru timingSafeEqual) supaya
   * panjang dan isi rahasia tidak bocor lewat waktu respons. Vercel Cron
   * mengirim GET; mewajibkan header Authorization juga berarti tautan biasa,
   * prefetch browser, atau perayap tidak dapat memicu pemindaian.
   *
   * Bila `KCI_CRON_SECRET` kosong, endpoint menolak dengan 503 + peringatan
   * log. Sengaja TIDAK "terbuka bila belum disetel": endpoint ini memicu
   * permintaan keluar ke Chess.com dan mengubah data anggota.
   */
  router.get(
    "/api/verifikasi/pindai-jadwal",
    async (req) => {
      const rahasiaDiharapkan = konfigurasi.cronSecret;
      if (!rahasiaDiharapkan) {
        console.warn(
          "[kci] KCI_CRON_SECRET kosong — /api/verifikasi/pindai-jadwal menolak " +
            "semua panggilan (503). Setel KCI_CRON_SECRET di Vercel dan samakan " +
            "dengan CRON_SECRET agar pemindaian terjadwal bisa jalan."
        );
        return {
          status: 503,
          isi: {
            pesan:
              "Pemindaian terjadwal tidak aktif: KCI_CRON_SECRET belum disetel di server.",
            dijalankan: false,
          },
        };
      }

      const header = String(req.headers?.authorization || "");
      const diterima = /^Bearer\s+(.+)$/i.exec(header);
      if (!diterima || !samaAman(diterima[1].trim(), rahasiaDiharapkan)) {
        return {
          status: 401,
          isi: { pesan: "Tidak berwenang.", dijalankan: false },
        };
      }

      const hasil = await pindaiFairPlayTerjadwal();
      return { status: 200, isi: { ok: true, ...hasil } };
    },
    { batas: 12 }
  );

  /* ------------------------------- pengajuan verifikasi manual (jalur pengurus)
   *
   * Pemeriksaan yang sebenarnya terjadi di sini, bukan di browser: pengajuan
   * berstatus "menunggu" sampai pengurus membuka daftar ini, membandingkan
   * kode/profil secara manual, lalu menyetujui atau menolak. Persetujuan
   * MENGIKUTKAN nama pengurus di berkas antrean + jejak audit.
   *
   * Hanya ADA SATU mekanisme yang mengubah status terverifikasi di jalur ini:
   * perpindahan status "menunggu" -> "disetujui" oleh endpoint ini. Endpoint
   * TIDAK lagi menyerahkan tiket verifikasi kepada pengurus. Tiket adalah
   * bukti jalur otomatis (OAuth / kode profil); menyerahkannya di sini akan
   * menciptakan mekanisme kedua yang menghasilkan state sama lewat jalan
   * berbeda (pengurus lalu menyalin tiket ke pendaftar), yang justru lebih
   * mudah salah pakai dan sulit diaudit.
   */
  router.get("/api/pengurus/pengajuan-verifikasi", async (req) => {
    pastikanAdmin(req);
    const url = new URL(req.url, "http://x");
    const status = url.searchParams.get("status") || "menunggu";
    return { status: 200, isi: await daftarPengajuanVerifikasi({ status }) };
  });

  router.post("/api/pengurus/pengajuan-verifikasi/:id/setujui", async (req, param) => {
    pastikanAdmin(req);
    const admin = dapatkanAdminDariRequest(req);
    const entri = await setujuiPengajuanVerifikasi(param.id, {
      pengurus: admin?.username || "pengurus",
    });
    const anggotaDiperbarui = await tandaiAnggotaTerverifikasi(
      entri.username,
      "pengurus"
    ).catch(() => false);
    if (anggotaDiperbarui) {
      // Persetujuan sudah benar-benar diterapkan -> tidak boleh dipakai lagi.
      await catatPersetujuanDiterapkanVerifikasi(entri.id, "pengurus");
    }
    return {
      status: 200,
      isi: {
        ok: true,
        username: entri.username,
        status: "disetujui",
        anggotaDiperbarui,
        // Pendaftar yang formulirnya belum masuk: persetujuan TIDAK dibuang,
        // tetap di antrean dan akan dipakai server saat ia mendaftar (lihat
        // persetujuanSiapDipakai di keanggotaan.js). Tidak ada tiket, tidak
        // ada status, yang bisa disalin-salinkan dari layar ini.
        ...(anggotaDiperbarui
          ? {}
          : {
              petunjuk:
                `Catatan anggota "${entri.username}" belum ada. Persetujuan tetap berlaku dan ` +
                "akan diterapkan otomatis begitu yang bersangkutan mengirim formulir pendaftaran.",
            }),
      },
    };
  });

  router.post("/api/pengurus/pengajuan-verifikasi/:id/tolak", async (req, param) => {
    pastikanAdmin(req);
    const admin = dapatkanAdminDariRequest(req);
    const bodi = await bacaBodi(req).catch(() => ({}));
    const entri = await tolakPengajuanVerifikasi(param.id, {
      pengurus: admin?.username || "pengurus",
      alasan: bodi?.alasan,
    });
    return {
      status: 200,
      isi: { ok: true, username: entri.username, status: "ditolak" },
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

  /* ------------------------------------------------------- e-book */

  // Tebus kode akses untuk membuka unduhan e-book. Publik, tapi dibatasi
  // lajunya karena isi kode bisa ditebak bruteforce bila tanpa batas.
  router.post(
    "/api/ebook/tebus",
    async (req) => {
      const bodi = await bacaBodi(req);
      return { status: 201, isi: await tebusUnduhanEbook(bodi) };
    },
    { batas: 12 }
  );

  // Ajukan kode akses dari popup unduh (publik). Kuota lebih ketat karena
  // ini pintu masuk spam — sama seperti formulir pesan.
  router.post(
    "/api/ebook/minta",
    async (req) => {
      const bodi = await bacaBodi(req);
      return { status: 201, isi: await mintaKodeEbook(bodi) };
    },
    { batas: 5 }
  );

  router.get("/api/pengurus/ebook/kode", async (req) => {
    pastikanAdmin(req);
    return { status: 200, isi: await daftarKodeEbook() };
  });

  router.post("/api/pengurus/ebook/kode", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    const kode = await buatKodeEbook(bodi);
    await logAudit("ebook-kode-buat", {
      resourceId: `${kode.panggilan}:${kode.kode}`,
      status: "success",
    });
    return { status: 201, isi: kode };
  });

  router.post("/api/pengurus/ebook/kode/hapus", async (req) => {
    pastikanAdmin(req);
    const bodi = await bacaBodi(req);
    await hapusKodeEbook(bodi?.kode);
    await logAudit("ebook-kode-hapus", {
      resourceId: String(bodi?.kode || ""),
      status: "success",
    });
    return { status: 200, isi: { pesan: "Kode akses dihapus." } };
  });

  router.get("/api/pengurus/ebook/unduhan", async (req) => {
    pastikanAdmin(req);
    return { status: 200, isi: await daftarUnduhanEbook() };
  });

  router.get("/api/pengurus/ebook/minta", async (req) => {
    pastikanAdmin(req);
    return { status: 200, isi: await daftarMintaEbook() };
  });

  // Setujui permintaan -> kode 1 jam langsung terbit atas nama pengaju.
  router.post("/api/pengurus/ebook/minta/:id/terbitkan", async (req, param) => {
    pastikanAdmin(req);
    const kode = await terbitkanKodeDariMinta(param.id);
    await logAudit("ebook-kode-buat", {
      resourceId: `${kode.panggilan}:${kode.kode}`,
      status: "success",
    });
    return { status: 201, isi: kode };
  });

  router.post("/api/pengurus/ebook/minta/:id/tolak", async (req, param) => {
    pastikanAdmin(req);
    const hasil = await tolakMintaEbook(param.id);
    await logAudit("ebook-minta-tolak", {
      resourceId: param.id,
      status: "success",
    });
    return { status: 200, isi: hasil };
  });
}
