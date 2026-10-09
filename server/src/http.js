/**
 * Utilitas HTTP: jawaban JSON, CORS, pembatasan laju, autentikasi pengurus,
 * CSRF protection, dan router sederhana. Tanpa kerangka kerja eksternal agar
 * server bisa dijalankan hanya dengan Node.
 */
import crypto from "node:crypto";
import zlib from "node:zlib";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { konfigurasi } from "./konfigurasi.js";
import { normalisasiUsername } from "../../src/lib/identitas.js";

/* -------------------------------------------------------------- jawaban */

/**
 * Kirim JSON. Opsi:
 *   req    — jika Accept-Encoding: gzip dan body > 1 KiB, kompres
 *   cache  — nilai Cache-Control (bawaan no-store)
 *   kepala — header tambahan (mis. metadata snapshot roster)
 */
export function kirimJson(res, status, isi, opsi = {}) {
  const teks = JSON.stringify(isi);
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": opsi.cache || "no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "Referrer-Policy": "no-referrer",
    ...(opsi.kepala || {}),
  };

  let badan = teks;
  const terima = String(opsi.req?.headers?.["accept-encoding"] || "");
  if (teks.length > 1024 && /\bgzip\b/i.test(terima)) {
    badan = zlib.gzipSync(teks);
    headers["Content-Encoding"] = "gzip";
    const varyLama = res.getHeader("Vary");
    headers.Vary = varyLama ? `${varyLama}, Accept-Encoding` : "Accept-Encoding";
  }
  headers["Content-Length"] = Buffer.byteLength(badan);
  res.writeHead(status, headers);
  res.end(badan);
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
    "Content-Type, Authorization, X-Token-Admin, X-CSRF-Token, X-Admin-User"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  // Browser frontend dapat menyertakan ID ini saat melaporkan kegagalan.
  res.setHeader("Access-Control-Expose-Headers", "X-Request-Id, Retry-After, X-RateLimit-Remaining, X-Roster-Diperbarui, X-Roster-Segar");
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

/* --------------------------------- anti brute-force endpoint pengurus
 *
 * Token admin adalah satu-satunya pintu ke /api/pengurus/*. Tanpa kunci
 * ini, penyerang bisa menebak token dengan laju 100 percobaan/15 menit/IP
 * (batas umum). Kunci terpisah yang jauh lebih ketat dipasang khusus
 * untuk percobaan gagal, dan kunci ini tidak disetel ulang oleh
 * permintaan sukses — satu IP yang terus gagal tetap terkunci sampai
 * jendelanya kedaluwarsa.
 */

const BATAS_GAGAL_ADMIN = 5;
const JENDELA_GAGAL_ADMIN_MS = 15 * 60 * 1000;

/**
 * Catat satu percobaan autentikasi admin.
 * @param {string} ip
 * @param {boolean} sukses
 * @returns {{ sisaGagal: number, terkunci: boolean, cobaLagiDetik: number }}
 */
export function catatPercobaanAdmin(ip, sukses) {
  const kunci = `admin-gagal|${ip}`;
  const kini = Date.now();
  let data = gagalAdmin.get(kunci);

  if (!data || kini > data.reset) {
    data = { jumlah: 0, reset: kini + JENDELA_GAGAL_ADMIN_MS };
    gagalAdmin.set(kunci, data);
  }

  if (sukses) {
    // Login sah — bersihkan hitungan untuk IP ini.
    gagalAdmin.delete(kunci);
    return { sisaGagal: BATAS_GAGAL_ADMIN, terkunci: false, cobaLagiDetik: 0 };
  }

  data.jumlah += 1;
  const terkunci = data.jumlah >= BATAS_GAGAL_ADMIN;
  return {
    sisaGagal: Math.max(0, BATAS_GAGAL_ADMIN - data.jumlah),
    terkunci,
    cobaLagiDetik: terkunci
      ? Math.ceil((data.reset - kini) / 1000)
      : 0,
  };
}

/** Lihat status kunci admin untuk sebuah IP tanpa mengubah hitungan. */
export function statusKunciAdmin(ip) {
  const kunci = `admin-gagal|${ip}`;
  const kini = Date.now();
  const data = gagalAdmin.get(kunci);
  if (!data || kini > data.reset) {
    return { terkunci: false, cobaLagiDetik: 0 };
  }
  const terkunci = data.jumlah >= BATAS_GAGAL_ADMIN;
  return {
    terkunci,
    cobaLagiDetik: terkunci ? Math.ceil((data.reset - kini) / 1000) : 0,
  };
}

const gagalAdmin = new Map();
const pembersihGagalAdmin = setInterval(() => {
  const kini = Date.now();
  for (const [k, v] of gagalAdmin) if (kini > v.reset) gagalAdmin.delete(k);
}, 60_000);
pembersihGagalAdmin.unref?.();

/**
 * Apakah koneksi datang dari loopback mesin yang sama?
 *
 * Dipakai agar mode "tanpa token admin" (hanya untuk pengembangan) hanya
 * berlaku ketika server diakses dari 127.0.0.1/::1. Bila server tanpa
 * token tidak sengaja ter-expose ke jaringan publik, endpoint pengurus
 * tetap tertutup untuk koneksi eksternal.
 */
export function dariLokal(req) {
  const a = req.socket?.remoteAddress || "";
  return a === "127.0.0.1" || a === "::1" || a === "::ffff:127.0.0.1";
}

/**
 * Alamat IP klien, memperhitungkan proxy/CDN di depan server.
 *
 * Catatan keamanan: header X-Forwarded-For bisa dipalsukan klien. Entri
 * PALING KANAN adalah alamat yang disisipkan oleh proxy tepercaya
 * terakhir; entri di sebelah kirinya adalah klaim klien dan TIDAK boleh
 * dipercaya. Karena itu kita ambil paling kanan, bukan paling kiri —
 * mencegah penyerang melewati pembatas laju dengan menyertakan IP acak
 * pada header.
 */
export function alamatIp(req) {
  const socketIp = req.socket?.remoteAddress || "tidak-diketahui";
  const n = konfigurasi.jumlahProxyTepercaya;
  if (!n) return socketIp;

  const teruskan = req.headers["x-forwarded-for"];
  if (typeof teruskan !== "string" || !teruskan.trim()) {
    return socketIp;
  }
  const bagian = teruskan.split(",").map((s) => s.trim()).filter(Boolean);
  if (!bagian.length) return socketIp;
  // n proxy = entri ke-n dari kanan; untuk n=1 itu paling kanan.
  const indeks = bagian.length - n;
  return bagian[indeks] || socketIp;
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

/* ---------------------------------------------------- JWT helpers */

/**
 * Rahasia untuk menandatangani JWT.
 * Wajib berasal dari konfigurasi; tidak ada fallback secret statis.
 * Konfigurasi pengembangan menyediakan secret acak per proses, sedangkan
 * produksi wajib menyediakan KCI_JWT_SECRET melalui environment.
 */
function jwtSecret() {
  const secret = konfigurasi.jwtSecret;
  if (!secret) {
    throw new Error("KCI_JWT_SECRET belum dikonfigurasi; operasi JWT dihentikan.");
  }
  return secret;
}

/** Apakah token tampak seperti JWT (tiga segmen dipisah titik)? */
function _isJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

/** Verifikasi JWT dan kembalikan payload, atau null bila tidak sah. */
function verifyJwt(token) {
  try {
    return jwt.verify(token, jwtSecret(), {
      algorithms: ["HS256"],
      issuer: "kci-server",
    });
  } catch {
    return null;
  }
}

/**
 * Terbitkan JWT untuk admin.
 * `ver` adalah versi kredensial yang disimpan bersama admin; perubahan
 * password, role, atau username menaikkannya sehingga JWT lama tidak lagi
 * diterima walaupun signature dan exp-nya masih sah.
 */
export function terbitkanJwt(username, role = "pengurus", tokenVersion = 0) {
  return jwt.sign(
    {
      sub: username,
      role,
      ver: Number.isInteger(tokenVersion) && tokenVersion >= 0 ? tokenVersion : 0,
      typ: "admin",
    },
    jwtSecret(),
    { algorithm: "HS256", expiresIn: "24h", issuer: "kci-server" }
  );
}

/** Bandingkan plaintext dengan hash bcrypt. */
export async function cocokkanPassword(plain, hash) {
  // Bila hash bukan format bcrypt (bentuk $2b$...), bandingkan langsung
  // (kompatibilitas dengan password plaintext lama).
  if (!hash || !hash.startsWith("$2")) {
    return samaAman(String(plain), String(hash));
  }
  return bcrypt.compare(String(plain), hash);
}

/* ------------------------------------------------------------- keamanan */

/**
 * Bandingkan dua string tanpa membocorkan waktu (anti timing attack).
 * Menggunakan hashing terlebih dahulu agar panjang string tidak bocor,
 * lalu membandingkan hash-nya dengan timingSafeEqual.
 */
export function samaAman(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  if (ha.length !== hb.length) return false;
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Hash bcrypt (prefiks "$2") adalah format PENYIMPANAN password, bukan token
 * login. Menerimanya sebagai X-Token-Admin berarti hash yang bocor (mis. dari
 * cadangan admins.json atau log) bisa langsung dipakai sebagai kredensial,
 * jadi nilai berbentuk hash selalu disaring dari daftar token sah.
 */
function hashBcrypt(nilai) {
  return String(nilai || "").startsWith("$2");
}

/**
 * Apakah ADA kredensial pengurus yang dikonfigurasi (token lama, password
 * env, atau admins dari file) — terlepas dari bentuk penyimpanannya.
 *
 * Diperlukan karena hash bcrypt tidak lagi dihitung sebagai token sah
 * (lihat hashBcrypt): tanpa pemeriksaan ini, server pengembangan yang
 * password env-nya sudah di-hash di memori akan dianggap "tanpa kredensial"
 * dan membuka jalur loopback tanpa token.
 */
function adaKredensialDikonfigurasi() {
  return Boolean(
    konfigurasi.tokenAdmin ||
    konfigurasi.admin?.password ||
    (Array.isArray(konfigurasi.admins) && konfigurasi.admins.some((a) => a?.password))
  );
}

/** Daftar token yang dianggap sah untuk endpoint pengurus. */
function daftarTokenSah() {
  const daftar = [];
  if (konfigurasi.tokenAdmin) daftar.push(konfigurasi.tokenAdmin);
  if (konfigurasi.admin?.password && !hashBcrypt(konfigurasi.admin.password)) {
    daftar.push(konfigurasi.admin.password);
  }
  // semua admin dari file (password ter-hash bcrypt bukan token — lihat hashBcrypt)
  if (Array.isArray(konfigurasi.admins)) {
    for (const a of konfigurasi.admins) {
      if (a?.password && !hashBcrypt(a.password)) daftar.push(a.password);
    }
  }
  return [...new Set(daftar)];
}

/**
 * Dapatkan admin dari request berdasarkan username + token.
 * Mengembalikan { username, role, password } atau null.
 */
export function dapatkanAdminDariRequest(req) {
  const dariHeader = req.headers["x-token-admin"];
  const otorisasi = req.headers.authorization || "";
  const dariBearer = otorisasi.startsWith("Bearer ") ? otorisasi.slice(7) : "";
  const token = dariHeader || dariBearer || "";
  const username = identitasPengurus(req);

  if (!token) return null;

  // 1) Coba sebagai JWT, lalu cocokkan dengan versi admin TERKINI.
  // Signature JWT saja tidak cukup: password/role/username dapat berubah
  // setelah token diterbitkan.
  const muatan = verifyJwt(token);
  if (muatan && muatan.typ === "admin") {
    const sub = String(muatan.sub || "");
    const dariFile = Array.isArray(konfigurasi.admins)
      ? konfigurasi.admins.find((a) => a?.username === sub)
      : null;
    const dariKonfigurasi =
      !dariFile && konfigurasi.admin?.username === sub
        ? { ...konfigurasi.admin, role: "master", tokenVersion: 0 }
        : null;
    const terbaru = dariFile || dariKonfigurasi;
    const versiToken = Number.isInteger(muatan.ver) ? muatan.ver : 0;
    const versiKini = Number.isInteger(terbaru?.tokenVersion)
      ? terbaru.tokenVersion
      : 0;
    if (!terbaru || terbaru.role !== (muatan.role || "pengurus") || versiToken !== versiKini) {
      return null;
    }
    return {
      username: sub,
      role: terbaru.role,
      password: "",
      tokenVersion: versiKini,
    };
  }

  // 2) Kompatibilitas legacy: cek tokenAdmin lama sebagai master fallback
  if (konfigurasi.tokenAdmin && samaAman(token, konfigurasi.tokenAdmin)) {
    return { username: username || "admin", role: "master", password: token };
  }

  // 3) cek di daftar admins (dari file)
  if (Array.isArray(konfigurasi.admins)) {
    // Hash bcrypt bukan token login yang sah (lihat hashBcrypt) — hanya
    // password plaintext lama yang dibandingkan di jalur legacy ini.
    const kandidat = konfigurasi.admins.filter(
      (a) => a?.password && !hashBcrypt(a.password)
    );
    if (username) {
      // Header X-Admin-User diisi: token HANYA boleh cocok dengan password
      // admin ber-username itu. Pencocokan lintas username (token milik
      // admin lain diterima lalu identitas diganti) tidak diizinkan —
      // mencegah login lateral memakai kredensial admin lain.
      for (const a of kandidat) {
        if (a.username === username && samaAman(token, a.password)) return a;
      }
    } else {
      // Tanpa header identitas: token (legacy, non-JWT) yang cocok dengan
      // salah satu admin plaintext menetapkan identitas mengikuti pemiliknya.
      for (const a of kandidat) {
        if (samaAman(token, a.password)) return a;
      }
    }
  }

  // 4) cek konfigurasi.admin tunggal (hash bcrypt tidak pernah jadi token)
  if (
    konfigurasi.admin?.password &&
    !hashBcrypt(konfigurasi.admin.password) &&
    samaAman(token, konfigurasi.admin.password)
  ) {
    const role = konfigurasi.admins?.find((a) => a.username === konfigurasi.admin.username)?.role || "master";
    return { username: konfigurasi.admin.username, password: konfigurasi.admin.password, role };
  }

  return null;
}

export function peranPengurus(req) {
  const admin = dapatkanAdminDariRequest(req);
  return admin?.role || "";
}

/**
 * Pastikan permintaan membawa token pengurus.
 * Token dibaca dari header `X-Token-Admin` atau `Authorization: Bearer …`.
 *
 * Mendukung dua metode:
 *  - Metode lama: KCI_TOKEN_ADMIN (token panjang)
 *  - Metode baru umum: KCI_ADMIN_PASSWORD (bawaan admin123) + multi-admin file
 *
 * Ketika keduanya tidak diatur, endpoint hanya terbuka untuk
 * koneksi dari loopback (127.0.0.1/::1) — itupun hanya di luar produksi.
 */
export function pastikanAdmin(req) {
  const dariHeader = req.headers["x-token-admin"];
  const otorisasi = req.headers.authorization || "";
  const dariBearer = otorisasi.startsWith("Bearer ")
    ? otorisasi.slice(7)
    : "";
  const diberikan = dariHeader || dariBearer;

  if (!diberikan) {
    if (!adaKredensialDikonfigurasi()) {
      if (konfigurasi.produksi) {
        const e = new Error("Endpoint pengurus dinonaktifkan: KCI_TOKEN_ADMIN / KCI_ADMIN_PASSWORD belum diatur.");
        e.status = 503;
        throw e;
      }
      if (!dariLokal(req)) {
        const e = new Error(
          "Token pengurus belum diatur. Akses dari luar loopback ditolak. " +
          "Setel KCI_TOKEN_ADMIN atau KCI_ADMIN_PASSWORD atau jalankan dari server itu sendiri."
        );
        e.status = 503;
        throw e;
      }
      return; // pengembangan lokal tanpa token
    }
    const e = new Error("Token pengurus tidak valid.");
    e.status = 401;
    throw e;
  }

  // 1) Verifikasi signature sekaligus versi kredensial saat ini.
  const adminJwt = dapatkanAdminDariRequest(req);
  const muatan = verifyJwt(diberikan);
  if (muatan && muatan.typ === "admin") {
    if (!adminJwt) {
      const e = new Error("Sesi pengurus sudah dicabut atau kedaluwarsa.");
      e.status = 401;
      throw e;
    }
    return; // JWT sah dan masih memakai versi kredensial terkini.
  }

  // 2) Bukan JWT — coba kompatibilitas legacy (password/token mentah).
  const tokenSah = daftarTokenSah();
  if (!tokenSah.length) {
    const e = new Error("Token pengurus tidak valid.");
    e.status = 401;
    throw e;
  }

  const cocok = tokenSah.some((t) => samaAman(diberikan, t));
  if (!cocok) {
    const e = new Error("Token pengurus tidak valid.");
    e.status = 401;
    throw e;
  }
}

/**
 * Pastikan yang login adalah master admin.
 * Dipakai untuk endpoint pengaturan sensitif.
 */
export function pastikanMaster(req) {
  pastikanAdmin(req);
  const role = peranPengurus(req);
  // jika role kosong (mis. tokenAdmin lama tanpa username), anggap master untuk kompatibilitas
  if (!role) return;
  if (role !== "master") {
    const e = new Error("Akses ditolak: hanya Master Admin yang boleh mengakses pengaturan.");
    e.status = 403;
    throw e;
  }
}

/**
 * Identitas pengurus yang sedang login, dari header X-Admin-User.
 *
 * BUKAN kredensial (otorisasi tetap oleh token), hanya label untuk
 * jejak audit — supaya log aksi pengurus bisa ditelusuri ke username
 * Chess.com orang yang melakukannya. Nilai yang tidak berbentuk
 * username Chess.com dibuang agar tidak bisa dipakai menyisipkan teks
 * liar ke berkas log.
 */
export function identitasPengurus(req) {
  const mentah = req.headers["x-admin-user"];
  if (typeof mentah !== "string" || !mentah) return "";
  const nama = normalisasiUsername(mentah);
  if (!/^[a-z0-9_-]{3,25}$/.test(nama)) return "";
  return nama;
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
        try {
          r.nama.forEach((n, i) => {
            param[n] = decodeURIComponent(cocok[i + 1]);
          });
        } catch {
          // Encoding persen tidak valid -> bukan rute yang sah; coba rute lain
          // supaya server membalas 404, bukan 500.
          continue;
        }
        return { ...r, param };
      }
      return null;
    },
  };
}
