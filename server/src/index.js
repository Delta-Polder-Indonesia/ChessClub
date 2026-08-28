/**
 * Backend Komunitas Catur Indonesia.
 *
 * Jalankan:
 *   node server/src/index.js
 *
 * Variabel lingkungan penting:
 *   PORT                 port dengar (bawaan 8787)
 *   KCI_PEPPER           kata rahasia hashing identitas  (WAJIB di produksi)
 *   KCI_TOKEN_ADMIN      token endpoint pengurus         (WAJIB di produksi)
 *   KCI_ASAL_DIIZINKAN   daftar origin dipisah koma
 */
import http from "node:http";
import { randomUUID } from "node:crypto";
import { konfigurasi, periksaProduksi } from "./konfigurasi.js";
import {
  kirimJson,
  pasangCors,
  bacaBodi,
  lewatBatas,
  alamatIp,
  pastikanAdmin,
  catatPercobaanAdmin,
  statusKunciAdmin,
  identitasPengurus,
  buatRouter,
  buatCsrfToken,
  validasiCsrfToken,
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
  daftarHitamPublik,
  daftarkan,
  blokirAnggota,
  bukaBlokir,
  pindaiFairPlay,
  pindaiFairPlayOtomatis,
  cekNomor,
  kontakAnggota,
  ringkasan,
  catatJejak,
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

const mulaiPada = Date.now();
const router = buatRouter();

/* ------------------------------------------------------------ rute publik */

router.get("/api/kesehatan", async () => ({
  status: 200,
  isi: {
    status: "sehat",
    lingkungan: konfigurasi.lingkungan,
    hidupDetik: Math.round((Date.now() - mulaiPada) / 1000),
    waktu: new Date().toISOString(),
  },
}));

/** CSRF token untuk request POST.
 *  Dibatasi agar penyerang tidak bisa mengisi memori server dengan jutaan
 *  token (tiap token disimpan di Map sampai kedaluwarsa 24 jam). */
router.get(
  "/api/csrf-token",
  async () => ({ status: 200, isi: { token: buatCsrfToken() } }),
  { batas: 60 }
);

// Roster publik klub Chess.com (lihat klub.js), diperkaya profil/rating.
router.get("/api/anggota", async () => ({
  status: 200,
  isi: await daftarAnggota(),
}));

router.get("/api/daftar-hitam", async () => ({
  status: 200,
  isi: await daftarHitamPublik(),
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

/** Cara verifikasi apa saja yang tersedia di server ini. */
router.get("/api/auth/cara", async () => ({
  status: 200,
  isi: {
    oauth: oauthAktif(),
    kodeProfil: true,
    mode: konfigurasi.wajibVerifikasi,
  },
}));

/** Mulai login Chess.com — mengarahkan pengguna ke oauth.chess.com. */
router.get("/api/auth/chess/mulai", async (req) => {
  const url = new URL(req.url, "http://x");
  const kembaliKe = url.searchParams.get("kembali") || undefined;
  const { url: tujuan } = mulaiLogin({ kembaliKe });
  return { status: 200, isi: { url: tujuan } };
});

/** Chess.com mengarahkan pengguna kembali ke sini setelah login.
 * Mengembalikan HTML yang menyimpan hasil ke sessionStorage lalu redirect.
 * Token TIDAK BOLEH ada di URL (bocor ke referrer header & history).
 */
router.get("/api/auth/chess/kembali", async (req, _p, konteks) => {
  const url = new URL(req.url, "http://x");
  const galat = url.searchParams.get("error");
  const kode = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const tujuanDasar = konfigurasi.oauth.tujuanSetelahLogin;

  /**
   * Halaman penutup login: simpan hasil ke sessionStorage lalu redirect.
   * `tujuan` adalah jalur internal yang sudah divalidasi jalurInternal()
   * (dari sesi OAuth atau bawaan env) — tetap di-JSON.stringify agar tidak
   * bisa menyisipkan markup/JavaScript ke dalam HTML.
   */
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

/** Jalur cadangan: minta kode untuk ditempel di profil Chess.com. */
router.post(
  "/api/auth/kode/minta",
  async (req) => {
    const bodi = await bacaBodi(req);
    return { status: 200, isi: await mintaKode(bodi.username) };
  },
  { batas: 20 }
);

/** Jalur cadangan: periksa apakah kode sudah terpasang. */
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

/** Periksa tiket masih berlaku (dipakai formulir saat dimuat ulang). */
router.get("/api/auth/tiket/:nilai", async (_req, param) => {
  const data = intipTiket(param.nilai);
  if (!data) return { status: 404, isi: { pesan: "Tiket tidak berlaku." } };
  return { status: 200, isi: data };
});

/**
 * Login sederhana untuk dashboard pengurus — metode umum username + password.
 * Bawaan: admin / admin123 (ubah via KCI_ADMIN_USER / KCI_ADMIN_PASSWORD).
 * Tetap kompatibel dengan KCI_TOKEN_ADMIN lama sebagai password alternatif.
 *
 * POST /api/auth/login  { username, password }
 * -> { token, username }
 */
router.post(
  "/api/auth/login",
  async (req, _param, konteks) => {
    const ip = konteks.ip;
    const kunciBrute = statusKunciAdmin(ip);
    if (kunciBrute.terkunci) {
      throw new GalatAplikasi(
        429,
        `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${kunciBrute.cobaLagiDetik} detik.`
      );
    }

    const bodi = await bacaBodi(req);
    const usernameRaw = String(bodi.username || "").trim().toLowerCase();
    const passwordRaw = String(bodi.password || "");

    if (!usernameRaw || !passwordRaw) {
      catatPercobaanAdmin(ip, false);
      throw new GalatAplikasi(400, "Username dan password wajib diisi.");
    }

    // Kredensial yang sah: admin.username + admin.password, atau tokenAdmin sebagai password
    const adminUser = konfigurasi.admin?.username || "admin";
    const adminPass = konfigurasi.admin?.password || "admin123";
    const tokenAdmin = konfigurasi.tokenAdmin || "";

    // username harus cocok (admin) — tapi bila tokenAdmin dipakai sebagai login lama,
    // kita izinkan username apa pun yang valid selama password == tokenAdmin (kompatibilitas)
    let usernameCocok = false;
    let passwordCocok = false;

    try {
      const { samaAman } = await import("./http.js");
      if (samaAman(usernameRaw, adminUser)) usernameCocok = true;
      if (samaAman(passwordRaw, adminPass)) passwordCocok = true;
      // kompatibilitas: token lama masih bisa dipakai sebagai password
      if (tokenAdmin && samaAman(passwordRaw, tokenAdmin)) {
        passwordCocok = true;
        // bila login pakai token lama, username lama tetap dianggap cocok bila diisi
        if (usernameRaw.length >= 3) usernameCocok = true;
      }
    } catch {
      // fallback perbandingan biasa bila import gagal
      usernameCocok = usernameRaw === adminUser;
      passwordCocok = passwordRaw === adminPass || (tokenAdmin && passwordRaw === tokenAdmin);
      if (tokenAdmin && passwordRaw === tokenAdmin && usernameRaw.length >= 3) {
        usernameCocok = true;
      }
    }

    if (!usernameCocok || !passwordCocok) {
      catatPercobaanAdmin(ip, false);
      throw new GalatAplikasi(401, "Username atau password salah.");
    }

    catatPercobaanAdmin(ip, true);

    // Token yang dikembalikan adalah password admin (atau tokenAdmin bila itu yang dipakai)
    // — token ini yang akan dikirim di header X-Token-Admin untuk semua /api/pengurus/*
    const tokenBalik = tokenAdmin && passwordRaw === tokenAdmin ? tokenAdmin : adminPass;

    // Catat riwayat masuk
    const userAgent = req.headers["user-agent"] || "";
    const usernameCatat = usernameCocok ? usernameRaw : adminUser;
    try {
      await catatRiwayatMasuk({
        username: usernameCatat,
        ip,
        userAgent,
        catatan: "login-admin-sederhana",
      });
    } catch {
      /* abaikan bila gagal catat */
    }

    return {
      status: 200,
      isi: {
        ok: true,
        token: tokenBalik,
        username: usernameCatat,
      },
    };
  },
  { batas: 20 }
);

/* ---------------------------------------------------------- rute pengurus */

router.get("/api/pengurus/ringkasan", async (req) => {
  pastikanAdmin(req);
  return {
    status: 200,
    isi: {
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
});

/**
 * Catat aksi login / masuk ke dashboard pengurus.
 * Dipanggil oleh Gerbang saat pengguna memasukkan username Chess.com & token.
 */
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
  return { status: 200, isi: { ok: true, entri } };
});

/** Ambil seluruh data riwayat login pengurus. */
router.get("/api/pengurus/riwayat-masuk", async (req) => {
  pastikanAdmin(req);
  return { status: 200, isi: await daftarRiwayatMasuk() };
});

/** Hapus satu entri riwayat masuk. */
router.post("/api/pengurus/riwayat-masuk/hapus", async (req) => {
  pastikanAdmin(req);
  const bodi = await bacaBodi(req);
  if (!bodi.id) {
    throw new GalatAplikasi(400, "ID riwayat harus disertakan.");
  }
  await hapusRiwayatMasuk(bodi.id);
  return { status: 200, isi: { pesan: "Riwayat masuk dihapus." } };
});

/** Bersihkan semua riwayat login pengurus. */
router.post("/api/pengurus/riwayat-masuk/bersihkan", async (req) => {
  pastikanAdmin(req);
  await bersihkanRiwayatMasuk();
  return { status: 200, isi: { pesan: "Semua riwayat masuk dibersihkan." } };
});

/**
 * Pemeriksaan token yang RINGAN: tidak memanggil Chess.com sama sekali.
 * Dipakai ProtectedRoute dan Gerbang untuk membuktikan token — bila
 * api.chess.com sedang padam, dashboard sempat lolos masuk dan kendala
 * hanya muncul di panel yang memang butuh roster (Anggota/ringkasan),
 * bukan mengunci seluruh gerbang login.
 */
router.get("/api/pengurus/verifikasi", async (req) => {
  pastikanAdmin(req);
  return { status: 200, isi: { ok: true } };
});

router.post("/api/pengurus/pindai", async (req) => {
  pastikanAdmin(req);
  return { status: 200, isi: await pindaiFairPlay() };
});

/** Pindai otomatis — hanya jika sudah >6 jam sejak scan terakhir. */
router.get("/api/pengurus/pindai-otomatis", async (req) => {
  pastikanAdmin(req);
  const hasil = await pindaiFairPlayOtomatis();
  return {
    status: 200,
    isi: { dijalankan: Boolean(hasil), ...(hasil || {}) },
  };
});

router.post("/api/pengurus/blokir", async (req) => {
  pastikanAdmin(req);
  const bodi = await bacaBodi(req);
  if (!bodi.username) {
    throw new GalatAplikasi(400, "Sebutkan username yang akan diblokir.");
  }
  const entri = await blokirAnggota(bodi.username, bodi.keterangan);
  return { status: 200, isi: entri };
});

router.post("/api/pengurus/buka", async (req) => {
  pastikanAdmin(req);
  const bodi = await bacaBodi(req);
  if (!bodi.username) {
    throw new GalatAplikasi(400, "Sebutkan username yang akan dibuka.");
  }
  await bukaBlokir(bodi.username);
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

/** Daftar jenis turnamen beserta sifat bawaannya. */
router.get("/api/turnamen/jenis", async () => ({
  status: 200,
  isi: { jenis: JENIS, status: STATUS },
}));

/** Daftar turnamen publik. Bisa disaring: ?jenis=bulanan&status=selesai */
router.get("/api/turnamen", async (req) => {
  const url = new URL(req.url, "http://x");
  const semua = await daftarTurnamen({
    jenis: url.searchParams.get("jenis") || undefined,
    status: url.searchParams.get("status") || undefined,
  });
  // Draf hanya untuk pengurus.
  const tampil = semua.filter((t) => t.status !== "draf");
  return { status: 200, isi: tampil.map(untukPublik) };
});

/** Player mengajukan diri; keputusan akhir tetap berada pada pengurus. */
router.post(
  "/api/turnamen/:id/daftar",
  async (req, param) => {
    const bodi = await bacaBodi(req);
    return { status: 201, isi: await ajukanKeikutsertaan(param.id, bodi) };
  },
  { batas: 10 }
);

/** Satu turnamen beserta klasemennya. */
router.get("/api/turnamen/:id", async (_req, param) => {
  const t = await ambilTurnamen(param.id);
  if (t.status === "draf") {
    throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
  }
  return {
    status: 200,
    isi: { ...untukPublik(t), klasemenTim: klasemenTim(t), hasil: t.hasil || [] },
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

/** Pindai peserta ke Chess.com; yang kena ban dianulir & diblokir. */
router.post("/api/pengurus/turnamen/:id/pindai", async (req, param) => {
  pastikanAdmin(req);
  return { status: 200, isi: await pindaiPesertaTurnamen(param.id) };
});

/* ------------------------------------------------------------ konten */

/** Berita komunitas yang sudah dipublikasikan. */
router.get("/api/berita", async () => {
  const semua = await berita.daftar({ status: "publik" });
  return { status: 200, isi: semua.map(berita.untukPublik) };
});

/** Pengumuman yang sudah dipublikasikan. */
router.get("/api/pengumuman", async () => {
  const semua = await pengumuman.daftar({ status: "publik" });
  return { status: 200, isi: semua.map(pengumuman.untukPublik) };
});

/* ------------------------------------------------ konten — pengurus */

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

/** Kirim pesan dari form "Hubungi Kami" (publik). */
router.post(
  "/api/pesan",
  async (req) => {
    const bodi = await bacaBodi(req);
    return { status: 201, isi: await kirimPesan(bodi) };
  },
  { batas: 5 }
);

/** Ambil semua pesan untuk pengurus. */
router.get("/api/pengurus/pesan", async (req) => {
  pastikanAdmin(req);
  return { status: 200, isi: await daftarPesan() };
});

/** Tandai SEMUA pesan sebagai sudah dibaca. */
router.post("/api/pengurus/pesan/semua-baca", async (req) => {
  pastikanAdmin(req);
  await tandaiSemuaDibaca();
  return { status: 200, isi: { pesan: "Semua pesan ditandai dibaca." } };
});

/** Tandai pesan sebagai sudah dibaca. */
router.post("/api/pengurus/pesan/:id/baca", async (req, param) => {
  pastikanAdmin(req);
  await tandaiDibaca(param.id);
  return { status: 200, isi: { pesan: "Pesan ditandai sudah dibaca." } };
});

/** Hapus beberapa pesan sekaligus. */
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

/** Hapus pesan. */
router.post("/api/pengurus/pesan/:id/hapus", async (req, param) => {
  pastikanAdmin(req);
  await hapusPesan(param.id);
  return { status: 200, isi: { pesan: "Pesan dihapus." } };
});

/* -------------------------------------------------------------- penangan */

async function tangani(req, res) {
  const jalur = (req.url || "/").split("?")[0];
  const metode = req.method || "GET";

  if (!pasangCors(req, res)) {
    return kirimJson(res, 403, { pesan: "Asal permintaan tidak diizinkan." });
  }
  if (metode === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const rute = router.cari(metode, jalur);
  if (!rute) {
    return kirimJson(res, 404, { pesan: "Endpoint tidak ditemukan." });
  }

  // Validasi CSRF untuk request POST.
  // Login admin (/api/auth/login) dikecualikan agar flow sederhana — tetap
  // dilindungi rate-limit & brute-force. Endpoint publik lain tetap wajib CSRF
  // seperti sebelumnya (frontend sudah mengirimnya).
  const bebasCsrf = jalur === "/api/auth/login";

  if (metode === "POST" && !bebasCsrf) {
    const csrfToken = req.headers["x-csrf-token"];
    if (!validasiCsrfToken(csrfToken)) {
      return kirimJson(res, 403, { pesan: "Token CSRF tidak valid." });
    }
  }

  const ip = alamatIp(req);
  const maks = rute.opsi.batas ?? konfigurasi.batas.maksUmum;
  const kunci = `${ip}|${rute.opsi.batas ? jalur : "umum"}`;
  const batas = lewatBatas(kunci, maks);

  res.setHeader("X-RateLimit-Remaining", String(batas.sisa));
  if (!batas.lolos) {
    const detik = Math.ceil((batas.reset - Date.now()) / 1000);
    res.setHeader("Retry-After", String(detik));
    return kirimJson(res, 429, {
      pesan: `Terlalu banyak permintaan. Coba lagi dalam ${detik} detik.`,
    });
  }

  // Kunci tambahan khusus endpoint pengurus: IP yang sudah gagal
  // autentikasi beberapa kali diblokir lebih awal, sebelum sampai ke
  // handler. Pencatatan gagal/sukses dilakukan setelah handler
  // berjalan, agar satu permintaan yang berhasil tidak dihitung gagal.
  if (jalur.startsWith("/api/pengurus/")) {
    const kunci = statusKunciAdmin(ip);
    if (kunci.terkunci) {
      res.setHeader("Retry-After", String(kunci.cobaLagiDetik));
      return kirimJson(res, 429, {
        pesan:
          `Terlalu banyak percobaan token pengurus yang gagal. ` +
          `Coba lagi dalam ${kunci.cobaLagiDetik} detik.`,
      });
    }
  }

  const pengguna = identitasPengurus(req);
  const konteks = { ip, pengguna };

  try {
    const hasil = await rute.penangan(req, rute.param, konteks);
    if (jalur.startsWith("/api/pengurus/")) {
      // Handler selesai tanpa melempar → autentikasi berhasil. Reset
      // hitungan gagal untuk IP ini.
      catatPercobaanAdmin(ip, true);

      // Catat aksi pengubah-data (POST) ke jejak audit. Endpoint baca
      // (/pesan/:id/baca) tidak dicatat agar log tidak penuh.
      if (metode === "POST" && !jalur.endsWith("/baca")) {
        catatJejak(`admin-${metode.toLowerCase()}-${jalur}`, {
          pengguna,
          ip,
        }).catch(() => {
          /* audit tidak boleh menggagalkan permintaan */
        });
      }
    }
    if (hasil.alihkan) {
      res.writeHead(hasil.status || 302, { Location: hasil.alihkan });
      return res.end();
    }
    if (hasil.html) {
      res.writeHead(hasil.status || 200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      return res.end(hasil.html);
    }
    kirimJson(res, hasil.status, hasil.isi);
  } catch (e) {
    // 401 dari endpoint pengurus = percobaan token gagal.
    if (jalur.startsWith("/api/pengurus/") && e?.status === 401) {
      catatPercobaanAdmin(ip, false);
    }
    if (e instanceof GalatAplikasi) {
      return kirimJson(res, e.status, { pesan: e.message, ...e.tambahan });
    }
    if (e.status) {
      return kirimJson(res, e.status, { pesan: e.message });
    }
    if (e.kode === "TERLALU_BESAR") {
      return kirimJson(res, 413, { pesan: e.message });
    }
    if (e.kode === "JSON_RUSAK" || e.kode === "BUKAN_OBJEK") {
      return kirimJson(res, 400, { pesan: e.message });
    }
    // Kegagalan berbicara dengan Chess.com bukan kesalahan logika kita —
    // jawab 502 (Bad Gateway) yang jelas, bukan 500 generik.
    if (e.name === "GalatChess") {
      return kirimJson(res, 502, {
        pesan: e.message || "Chess.com sedang tidak dapat dihubungi.",
      });
    }
    console.error(`[kci] galat tak tertangani id=${req.kciRequestId || "-"} pada ${metode} ${jalur}:`, e);
    kirimJson(res, 500, { pesan: "Kesalahan server." });
  }
}

/* ----------------------------------------------------------------- mulai */

const masalah = periksaProduksi();
if (masalah.length) {
  console.error("\n[kci] Konfigurasi produksi belum lengkap:\n");
  for (const m of masalah) console.error(`  - ${m}`);
  console.error("");
  process.exit(1);
}

if (!konfigurasi.pepper) {
  console.warn(
    "[kci] KCI_PEPPER belum diatur — memakai pepper pengembangan.\n" +
      '      Untuk produksi: export KCI_PEPPER="kalimat-acak-panjang"'
  );
}

if (konfigurasi.admin?.password === "admin123") {
  console.warn(
    "[kci] KCI_ADMIN_PASSWORD masih bawaan admin123 — segera ganti di produksi!\n" +
      '      Setel: export KCI_ADMIN_PASSWORD="password-baru-yang-kuat"'
  );
}

/**
 * Deteksi lingkungan Vercel (Serverless Function).
 *
 * Di serverless TIDAK ADA port untuk didengarkan — Vercel memanggil
 * handler per permintaan. Maka di sana modul ini hanya mengekspor
 * `tangani` (lihat api/[...jalur].js) tanpa membuat server HTTP.
 * Vercel menyuntikkan variabel VERCEL otomatis di semua deployment-nya.
 */
const diVercel = Boolean(process.env.VERCEL);

let server = null;

if (!diVercel) {
  server = http.createServer((req, res) => {
    const mulai = performance.now();
    const requestId = randomUUID();
    req.kciRequestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    // Log terstruktur sengaja tidak memuat query string, body, token, atau IP.
    // Aktifkan dengan KCI_LOG_PERMINTAAN=1 bila journal/log collector tersedia.
    res.on("finish", () => {
      if (!konfigurasi.logPermintaan) return;
      const jalur = (req.url || "/").split("?")[0];
      console.log(JSON.stringify({
        event: "http_request",
        requestId,
        method: req.method || "GET",
        path: jalur,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - mulai),
      }));
    });

    tangani(req, res).catch((e) => {
      console.error(`[kci] galat fatal id=${requestId}:`, e);
      if (!res.headersSent) kirimJson(res, 500, { pesan: "Kesalahan server." });
    });
  });

  server.listen(konfigurasi.port, konfigurasi.host, () => {
    console.log(
      `[kci] Backend berjalan di http://${konfigurasi.host}:${konfigurasi.port}` +
        ` (${konfigurasi.lingkungan})`
    );
    console.log(`[kci] Data: ${konfigurasi.dirData}`);
    if (konfigurasi.asalDiizinkan.length) {
      console.log(`[kci] Asal diizinkan: ${konfigurasi.asalDiizinkan.join(", ")}`);
    }
  });

  /* Matikan dengan rapi agar penulisan berkas tidak terputus di tengah. */
  for (const sinyal of ["SIGINT", "SIGTERM"]) {
    process.on(sinyal, () => {
      console.log(`\n[kci] ${sinyal} diterima, menutup server…`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 5000).unref();
    });
  }
}

export { server, tangani };
