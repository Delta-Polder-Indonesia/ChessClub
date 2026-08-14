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

const angka = (v, bawaan) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : bawaan;
};

const daftar = (v) =>
  String(v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const konfigurasi = {
  lingkungan: process.env.NODE_ENV || "development",
  produksi: process.env.NODE_ENV === "production",

  port: angka(process.env.PORT, 8787),
  host: process.env.HOST || "0.0.0.0",

  /** Kata rahasia untuk hashing identitas. Wajib di produksi. */
  pepper: process.env.KCI_PEPPER || "",

  /** Token admin untuk endpoint pengurus. Wajib di produksi. */
  tokenAdmin: process.env.KCI_TOKEN_ADMIN || "",

  /** Asal (origin) yang boleh memanggil API. Kosong = izinkan semua. */
  asalDiizinkan: daftar(process.env.KCI_ASAL_DIIZINKAN),

  /** Lokasi berkas data. */
  dirData: process.env.KCI_DIR_DATA || path.join(AKAR, "data"),
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
    dasar: "https://api.chess.com/pub",
    ua:
      process.env.KCI_USER_AGENT ||
      "KomunitasCaturIndonesia/1.0 (contact: info@komunitascatur.or.id)",
    tenggangMs: angka(process.env.KCI_CHESS_TIMEOUT, 8000),
    cacheDetik: angka(process.env.KCI_CHESS_CACHE, 300),
    percobaan: angka(process.env.KCI_CHESS_RETRY, 3),
  },

  /** Pembatasan laju permintaan (anti-spam pendaftaran). */
  batas: {
    jendelaMs: angka(process.env.KCI_BATAS_JENDELA, 15 * 60 * 1000),
    maksUmum: angka(process.env.KCI_BATAS_UMUM, 100),
    maksDaftar: angka(process.env.KCI_BATAS_DAFTAR, 5),
  },

  /** Ukuran maksimum badan permintaan. */
  maksBodiBita: angka(process.env.KCI_MAKS_BODI, 64 * 1024),
};

/** Daftar masalah konfigurasi yang fatal di produksi. */
export function periksaProduksi() {
  const masalah = [];
  if (!konfigurasi.produksi) return masalah;

  if (!konfigurasi.pepper || konfigurasi.pepper.length < 16) {
    masalah.push(
      "KCI_PEPPER wajib diisi minimal 16 karakter di produksi. " +
        "Tanpa itu, hash identitas dapat ditebak."
    );
  }
  if (!konfigurasi.tokenAdmin || konfigurasi.tokenAdmin.length < 24) {
    masalah.push(
      "KCI_TOKEN_ADMIN wajib diisi minimal 24 karakter di produksi. " +
        "Tanpa itu, endpoint pengurus terbuka untuk umum."
    );
  }
  if (!konfigurasi.asalDiizinkan.length) {
    masalah.push(
      "KCI_ASAL_DIIZINKAN sebaiknya diisi di produksi, mis. " +
        "https://delta-polder-indonesia.github.io"
    );
  }
  return masalah;
}
