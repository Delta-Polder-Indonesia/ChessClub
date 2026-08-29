/**
 * Konfigurasi server, dibaca dari environment variable.
 *
 * Semua nilai punya bawaan yang aman untuk pengembangan lokal, tetapi
 * beberapa WAJIB diisi di produksi (lihat `periksaProduksi`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const AKAR = path.resolve(DIR, "../..");

/** Vercel menyuntikkan variabel VERCEL otomatis di Serverless Function. */
const DI_VERCEL = Boolean(process.env.VERCEL);

const angka = (v, bawaan) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : bawaan;
};

const daftar = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** URL-ID klub Chess.com hanya boleh berupa slug, bukan URL penuh. */
const slugKlub = (v) => String(v || "blunder-skuad").trim().toLowerCase();

/**
 * Bersihkan nilai rahasia yang ditempel dari dashboard (Vercel/Render).
 *
 * Menyalin-tempel di kolom Environment Variable sangat sering menyisakan
 * spasi atau baris baru di ujung nilai. Bila dibiarkan, password "terlihat"
 * sudah benar di dashboard tetapi setiap login ditolak 401 tanpa petunjuk
 * apa pun. Nilai dikembalikan apa adanya bila memang tidak punya spasi di
 * ujung, sehingga password yang benar-benar ber-spasi tetap utuh di tengah.
 */
const rahasia = (v) => String(v ?? "").trim();

export const konfigurasi = {
  lingkungan: process.env.NODE_ENV || "development",
  produksi: process.env.NODE_ENV === "production",

  port: angka(process.env.PORT, 8787),
  host: process.env.HOST || "0.0.0.0",

  /** Log ringkas request (tanpa body, token, atau data pribadi). Aktifkan
   * di produksi bila log dikirim ke systemd/journal atau observability. */
  logPermintaan: process.env.KCI_LOG_PERMINTAAN === "1",

  /**
   * Jumlah proxy tepercaya di DEPAN server (mis. Cloudflare, Nginx,
   * Render, Load Balancer). Header X-Forwarded-For hanya dihormati
   * bila nilai ini > 0.
   *
   * - 0 (bawaan): server terhubung langsung ke klien. X-Forwarded-For
   *   DIABAIKAN — IP klien diambil dari socket, sehingga penyerang tidak
   *   bisa memalsukan identitas untuk melewati pembatasan laju.
   * - 1: satu proxy tepercaya. IP klien adalah entri PALING KANAN di
   *   X-Forwarded-For (yang ditambahkan proxy tepercaya).
   * - N: N proxy tepercaya. Hitung N entri dari kanan.
   *
   * Jangan naikkan nilai ini tanpa benar-benar ada proxy di depan.
   *
   * Di Vercel Serverless Function, socket SELALU berada di belakang
   * proxy Vercel (remoteAddress = alamat internal), dan Vercel menulis
   * IP klien asli ke X-Forwarded-For. Bawaan otomatis menjadi 1 di sana.
   */
  jumlahProxyTepercaya: angka(
    process.env.KCI_JUMLAH_PROXY,
    DI_VERCEL ? 1 : 0
  ),

  /** Kata rahasia untuk hashing identitas. Wajib di produksi. */
  pepper: process.env.KCI_PEPPER || "",

  /** Token admin legacy untuk endpoint pengurus. Opsional; masih diterima sebagai password alternatif. */
  tokenAdmin: rahasia(process.env.KCI_TOKEN_ADMIN),

  /** Login sederhana untuk dashboard pengurus (umum: username + password).
   *  Bawaan: admin / admin123 — ubah lewat env KCI_ADMIN_USER / KCI_ADMIN_PASSWORD
   *  di produksi. Tetap kompatibel dengan KCI_TOKEN_ADMIN lama. */
  admin: {
    username: (process.env.KCI_ADMIN_USER || "admin").trim().toLowerCase(),
    password: rahasia(process.env.KCI_ADMIN_PASSWORD) || "admin123",
  },

  /** Daftar admin dengan role (master / pengurus). Diisi dari file admins.json saat startup. */
  admins: [],

  /** Asal (origin) yang boleh memanggil API. Kosong = izinkan semua. */
  asalDiizinkan: daftar(process.env.KCI_ASAL_DIIZINKAN),

  /** Lokasi berkas data.
   * Di Vercel hanya /tmp yang dapat ditulis (filesystem lain read-only),
   * jadi bila KCI_DIR_DATA tidak diatur bawaannya otomatis /tmp/kci-data.
   * CATATAN: /tmp bersifat sementara per instance function — untuk data
   * yang harus awet, gunakan disk persisten (Render Starter) atau DB. */
  dirData: process.env.KCI_DIR_DATA || (DI_VERCEL ? "/tmp/kci-data" : path.join(AKAR, "data")),
  get berkasAnggota() {
    return path.join(this.dirData, "anggota.json");
  },
  get berkasHitam() {
    return path.join(this.dirData, "daftar-hitam.json");
  },
  get berkasKontak() {
    return path.join(this.dirData, "rahasia", "kontak.json");
  },
  get berkasJejak() {
    return path.join(this.dirData, "rahasia", "jejak-audit.jsonl");
  },
  get berkasRiwayatMasuk() {
    return path.join(this.dirData, "riwayat-masuk.json");
  },

  /**
   * Login dengan akun Chess.com (OAuth 2.0).
   * client_id diperoleh dengan mengajukan permohonan ke Chess.com:
   * https://forms.gle/7Ai8UZCJMZkCVvxn9
   * Bila kosong, sistem memakai jalur cadangan (kode di profil).
   */
  oauth: {
    clientId: process.env.KCI_CHESS_CLIENT_ID || "",
    clientSecret: process.env.KCI_CHESS_CLIENT_SECRET || "",
    redirectUri: process.env.KCI_CHESS_REDIRECT_URI || "",
    /** Ke mana pengguna dikembalikan setelah login selesai. */
    tujuanSetelahLogin:
      process.env.KCI_TUJUAN_SETELAH_LOGIN ||
      "/pendaftaran-anggota",
  },

  /**
   * Wajibkan bukti kepemilikan akun saat mendaftar.
   * "off"      - tidak diwajibkan (bawaan lama)
   * "opsional" - diverifikasi bila ada tiket, tidak wajib
   * "wajib"    - pendaftaran ditolak tanpa tiket verifikasi
   */
  wajibVerifikasi: process.env.KCI_WAJIB_VERIFIKASI || "opsional",

  /** Chess.com */
  chess: {
    /** Alamat dasar API publik Chess.com.
     * KCI_CHESS_DASAR hanya untuk pengujian (menunjuk server tiruan lokal);
     * jangan diatur di produksi. */
    dasar: process.env.KCI_CHESS_DASAR || "https://api.chess.com/pub",
    ua:
      process.env.KCI_USER_AGENT ||
      "KomunitasCaturIndonesia/1.0 (contact: info@komunitascatur.or.id)",
    tenggangMs: angka(process.env.KCI_CHESS_TIMEOUT, 8000),
    cacheDetik: angka(process.env.KCI_CHESS_CACHE, 300),
    percobaan: angka(process.env.KCI_CHESS_RETRY, 3),

    /**
     * Roster publik ini menjadi sumber anggota yang tampil di situs.
     * Chess.com sendiri memperbarui endpoint anggota klub maksimal setiap
     * 12 jam; cache lokal mengikuti ritme itu agar API tidak dibanjiri.
     */
    klub: {
      slug: slugKlub(process.env.KCI_CHESS_KLUB),
      cacheDetik: angka(process.env.KCI_CHESS_KLUB_CACHE, 12 * 60 * 60),
      profilCacheDetik: angka(
        process.env.KCI_CHESS_KLUB_PROFILE_CACHE,
        60 * 60
      ),
    },
  },

  /** Pembatasan laju permintaan (anti-spam pendaftaran). */
  batas: {
    jendelaMs: angka(process.env.KCI_BATAS_JENDELA, 15 * 60 * 1000),
    maksUmum: angka(process.env.KCI_BATAS_UMUM, 100),
    maksDaftar: angka(process.env.KCI_BATAS_DAFTAR, 5),
  },

  /** Ukuran maksimum badan permintaan.
   * 2 MiB diperlukan agar gambar berita/pengumuman yang sudah dikompresi
   * di browser dapat dikirim sebagai data URL tanpa endpoint unggah terpisah. */
  maksBodiBita: angka(process.env.KCI_MAKS_BODI, 2 * 1024 * 1024),
};

/**
 * Daftar masalah konfigurasi yang fatal di produksi.
 *
 * "Mode produksi" dianggap aktif bila NODE_ENV=production ATAU pengelola
 * sudah menyetel KCI_ASAL_DIIZINKAN (indikasi kuat server akan terpapar
 * publik). Tanpa kedua penanda itu, pepper/token pengembangan masih aman
 * dipakai untuk kerja lokal di loopback.
 */
export function periksaProduksi() {
  const masalah = [];
  const produksi =
    konfigurasi.produksi || konfigurasi.asalDiizinkan.length > 0;
  if (!produksi) return masalah;

  if (!konfigurasi.pepper || konfigurasi.pepper.length < 16) {
    masalah.push(
      "KCI_PEPPER wajib diisi minimal 16 karakter di produksi. " +
        "Tanpa itu, hash identitas dapat ditebak."
    );
  }
  // Password dashboard wajib diganti di produksi. KCI_TOKEN_ADMIN tetap
  // boleh diisi sebagai kompatibilitas legacy, tetapi tidak boleh menjadi
  // alasan membiarkan akun publik admin/admin123 tetap aktif.
  const passOk =
    konfigurasi.admin?.password &&
    konfigurasi.admin.password.length >= 6 &&
    konfigurasi.admin.password !== "admin123";

  if (!passOk) {
    masalah.push(
      "KCI_ADMIN_PASSWORD wajib diisi dengan password kuat (minimal 6 karakter) di produksi. " +
        "Bawaan admin/admin123 hanya untuk lokal/demo."
    );
  }
  if (konfigurasi.tokenAdmin && konfigurasi.tokenAdmin.length < 24) {
    masalah.push("KCI_TOKEN_ADMIN legacy harus minimal 24 karakter bila diisi.");
  }
  if (!konfigurasi.asalDiizinkan.length) {
    masalah.push(
      "KCI_ASAL_DIIZINKAN sebaiknya diisi di produksi, mis. " +
        "https://delta-polder-indonesia.github.io"
    );
  }
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(konfigurasi.chess.klub.slug)) {
    masalah.push(
      "KCI_CHESS_KLUB harus berupa URL-ID Chess.com, mis. blunder-skuad."
    );
  }
  return masalah;
}
