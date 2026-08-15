/**
 * Utilitas HTTP: jawaban JSON, CORS, pembatasan laju, autentikasi pengurus,
 * CSRF protection, dan router sederhana. Tanpa kerangka kerja eksternal agar
 * server bisa dijalankan hanya dengan Node.
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";

/* -------------------------------------------------------------- jawaban */

export function kirimJson(res, status, isi) {
  const teks = JSON.stringify(isi);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(teks),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(teks);
}

/* ------------------------------------------------------------------ CORS */

export function pasangCors(req, res) {
  const asal = req.headers.origin;
  const daftar = konfigurasi.asalDiizinkan;

  if (!daftar.length) {
    // Pengembangan: izinkan semua.
    res.setHeader("Access-Control-Allow-Origin", asal || "*");
  } else if (asal && daftar.includes(asal)) {
    res.setHeader("Access-Control-Allow-Origin", asal);
    res.setHeader("Vary", "Origin");
  } else if (asal) {
    return false; // asal tidak diizinkan
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Token-Admin, X-CSRF-Token"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  return true;
}

/* ------------------------------------------------------------ badan data */

export function bacaBodi(req, maks = konfigurasi.maksBodiBita) {
  return new Promise((resolve, reject) => {
    const potongan = [];
    let ukuran = 0;
    let selesai = false;

    const gagal = (pesan, kode) => {
      if (selesai) return;
      selesai = true;
      const e = new Error(pesan);
      e.kode = kode;
      reject(e);
    };

    req.on("data", (c) => {
      ukuran += c.length;
      if (ukuran > maks) {
        gagal("Data terlalu besar.", "TERLALU_BESAR");
        req.destroy();
        return;
      }
      potongan.push(c);
    });

    req.on("end", () => {
      if (selesai) return;
      selesai = true;
      const mentah = Buffer.concat(potongan).toString("utf8");
      if (!mentah.trim()) return resolve({});
      try {
        const data = JSON.parse(mentah);
        if (data === null || typeof data !== "object" || Array.isArray(data)) {
          const e = new Error("Format data harus objek JSON.");
          e.kode = "BUKAN_OBJEK";
          return reject(e);
        }
        resolve(data);
      } catch {
        const e = new Error("Data JSON tidak valid.");
        e.kode = "JSON_RUSAK";
        reject(e);
      }
    });

    req.on("error", (e) => gagal(e.message, "SOKET"));
  });
}

/* --------------------------------------------------------- batas laju */

const ember = new Map(); // kunci -> { jumlah, reset }

export function lewatBatas(kunci, maks, jendelaMs = konfigurasi.batas.jendelaMs) {
  const sekarang = Date.now();
  const item = ember.get(kunci);

  if (!item || sekarang > item.reset) {
    ember.set(kunci, { jumlah: 1, reset: sekarang + jendelaMs });
    return { lolos: true, sisa: maks - 1, reset: sekarang + jendelaMs };
  }
  if (item.jumlah >= maks) {
    return { lolos: false, sisa: 0, reset: item.reset };
  }
  item.jumlah += 1;
  return { lolos: true, sisa: maks - item.jumlah, reset: item.reset };
}

// Bersihkan entri kedaluwarsa berkala agar memori tidak bocor.
const pembersih = setInterval(() => {
  const sekarang = Date.now();
  for (const [k, v] of ember) if (sekarang > v.reset) ember.delete(k);
}, 60_000);
pembersih.unref?.();

export function bersihkanBatas() {
  ember.clear();
}

/** Alamat IP klien, memperhitungkan proxy/CDN di depan server. */
export function alamatIp(req) {
  const teruskan = req.headers["x-forwarded-for"];
  if (typeof teruskan === "string" && teruskan.trim()) {
    return teruskan.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "tidak-diketahui";
}

/* ----------------------------------------------------------- CSRF token */

/** CSRF token per sesi (disimpan di memori, umur 24 jam). */
const csrfToken = new Map(); // token -> { kedaluwarsa }

const CSRF_UMUR_MS = 24 * 60 * 60 * 1000; // 24 jam

const pembersihCsrf = setInterval(() => {
  const kini = Date.now();
  for (const [k, v] of csrfToken) if (kini > v.kedaluwarsa) csrfToken.delete(k);
}, 60_000);
pembersihCsrf.unref?.();

/** Generate CSRF token baru. */
export function buatCsrfToken() {
  const token = crypto.randomBytes(32).toString("hex");
  csrfToken.set(token, { kedaluwarsa: Date.now() + CSRF_UMUR_MS });
  return token;
}

/** Validasi CSRF token. */
export function validasiCsrfToken(token) {
  if (!token || typeof token !== "string") return false;
  const data = csrfToken.get(token);
  if (!data) return false;
  if (Date.now() > data.kedaluwarsa) {
    csrfToken.delete(token);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------- keamanan */

/**
 * Bandingkan dua string tanpa membocorkan waktu (anti timing attack).
 * Menggunakan hashing terlebih dahulu agar panjang string tidak bocor,
 * lalu membandingkan hash-nya dengan timingSafeEqual.
 */
function samaAman(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  if (ha.length !== hb.length) return false;
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Pastikan permintaan membawa token pengurus.
 * Token dibaca dari header `X-Token-Admin` atau `Authorization: Bearer …`.
 */
export function pastikanAdmin(req) {
  const token = konfigurasi.tokenAdmin;

  if (!token) {
    if (konfigurasi.produksi) {
      const e = new Error("Endpoint pengurus dinonaktifkan: KCI_TOKEN_ADMIN belum diatur.");
      e.status = 503;
      throw e;
    }
    return; // pengembangan tanpa token
  }

  const dariHeader = req.headers["x-token-admin"];
  const otorisasi = req.headers.authorization || "";
  const dariBearer = otorisasi.startsWith("Bearer ")
    ? otorisasi.slice(7)
    : "";
  const diberikan = dariHeader || dariBearer;

  if (!diberikan || !samaAman(diberikan, token)) {
    const e = new Error("Token pengurus tidak valid.");
    e.status = 401;
    throw e;
  }
}

/* --------------------------------------------------------------- router */

export function buatRouter() {
  const rute = [];

  const tambah = (metode, pola, penangan, opsi = {}) => {
    // "/api/anggota/:username" -> regex dengan grup bernama
    const nama = [];
    const regex = new RegExp(
      "^" +
        pola.replace(/:([a-zA-Z]+)/g, (_, n) => {
          nama.push(n);
          return "([^/]+)";
        }) +
        "/?$"
    );
    rute.push({ metode, regex, nama, penangan, opsi });
  };

  return {
    get: (p, h, o) => tambah("GET", p, h, o),
    post: (p, h, o) => tambah("POST", p, h, o),
    cari(metode, jalur) {
      for (const r of rute) {
        if (r.metode !== metode) continue;
        const cocok = r.regex.exec(jalur);
        if (!cocok) continue;
        const param = {};
        r.nama.forEach((n, i) => {
          param[n] = decodeURIComponent(cocok[i + 1]);
        });
        return { ...r, param };
      }
      return null;
    },
  };
}
