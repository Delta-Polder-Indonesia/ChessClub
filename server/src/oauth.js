/**
 * Login dengan akun Chess.com (OAuth 2.0 + OpenID Connect) dan tiket verifikasi.
 *
 * Inilah bukti kepemilikan akun yang paling kuat: pendaftar masuk langsung
 * ke chess.com dengan kata sandinya sendiri, lalu Chess.com yang memberi
 * tahu kita siapa dia. Kita tidak pernah melihat kata sandinya.
 *
 * Alur (Authorization Code + PKCE):
 *   1. /api/auth/chess/mulai   -> arahkan pengguna ke oauth.chess.com
 *   2. pengguna login & menyetujui di chess.com
 *   3. /api/auth/chess/kembali -> tukar code jadi token, baca id_token
 *   4. id_token diverifikasi KETAT (lihat verifikasiIdToken)
 *   5. server menerbitkan tiket sekali pakai terikat username
 *
 * Catatan deployment — Vercel Serverless (`api/[...jalur].js`):
 * state OAuth dan tiket TIDAK disimpan di `Map` milik satu proses, karena
 * callback dan pengiriman formulir bisa mendarat di instance berbeda dan
 * /tmp maupun memori proses hilang saat cold start. Keduanya berupa token
 * TANPA KEADAAN: muatan JSON kecil yang ditandatangani HMAC-SHA256
 * (turunan KCI_JWT_SECRET via HKDF) memakai konteks berbeda, sehingga
 *  - valid di instance mana pun, dan
 *  - state tidak dapat dipalsukan, dan
 *  - tiket verifikasi tidak dapat dipalsukan atau ditukar dengan state
 *    (dan sebaliknya), dan
 *  - token CSRF (hex 64 karakter, tanpa titik) tidak pernah sah jadi tiket.
 *
 * Sisa keadaan yang benar-benar perlu dibagikan hanyalah "tiket ini sudah
 * dipakai", dan itu SENGAJA belum dibagikan. Ledger `tiketDipakai` hidup di
 * memori proses, jadi batasnya harus disebut apa adanya:
 *   - sekali pakai = dalam satu instance yang masih hidup;
 *   - TIDAK bertahan cold start / restart;
 *   - TIDAK dibagikan antar-instance, sehingga replay lintas instance masih
 *     MUNGKIN selama tiket belum kedaluwarsa.
 *
 * Kenapa tidak dipaksakan ke penyimpanan bersama: `kci_storage` (Supabase)
 * hanya menyediakan upsert kunci-nilai — menang-last-write, tanpa pembaruan
 * bersyarat — sehingga ledger di atasnya pun tetap bukan "sekali pakai
 * lintas instance" yang sesungguhnya. Menjadikannya benar butuh lapisan baru
 * (Redis SETNX / baris DB dengan constraint unik), yang tidak dibangun di sini
 * karena belum ada bukti kebutuhan: dampak replay dibatasi dua hal, yaitu
 * tiket terikat satu username dan antrean tulis anggota menolak duplikasi
 * username secara atomik — tiket yang sama tidak dapat menghasilkan dua akun.
 * Lihat PANDUAN-VERIFIKASI-AKUN.md §3 dan VERCEL-LIMITATIONS.md.
 *
 * Catatan: client_id harus diminta ke Chess.com lebih dulu melalui
 * https://forms.gle/7Ai8UZCJMZkCVvxn9 (persetujuan manual). Selama belum
 * ada, sistem otomatis memakai jalur cadangan (verifikasi-profil.js).
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";
import { periksaUsername } from "../../src/lib/identitas.js";

const OAUTH_DASAR = "https://oauth.chess.com";

/** Galat verifikasi dengan kode sebab yang AMAN ditampilkan ke pengguna. */
export class GalatVerifikasi extends Error {
  constructor(sebab, pesan) {
    super(pesan);
    this.name = "GalatVerifikasi";
    this.sebab = sebab;
    this.status = 400;
  }
}

/** Pesan baku untuk pengguna — detail teknis HANYA masuk log server. */
export const PESAN_VERIFIKASI = {
  konfigurasi:
    "Login Chess.com belum diaktifkan pada server ini. Gunakan jalur verifikasi lain.",
  state:
    "Sesi login Chess.com tidak dikenali atau sudah kedaluwarsa. Silakan ulangi verifikasi.",
  "state-kedaluwarsa":
    "Sesi verifikasi telah kedaluwarsa. Silakan ulangi verifikasi akun Chess.com Anda.",
  chesscom:
    "Chess.com menolak permintaan login. Silakan coba beberapa saat lagi.",
  token:
    "Token login dari Chess.com tidak dapat dipercaya. Silakan ulangi verifikasi.",
  username:
    "Chess.com tidak mengirim username yang sah. Silakan ulangi verifikasi.",
  penandatangan:
    "Layanan verifikasi sedang tidak tersedia di server ini. Hubungi pengurus.",
};

export function pesanVerifikasiUntukPengguna(sebab) {
  return PESAN_VERIFIKASI[sebab] || PESAN_VERIFIKASI.token;
}

/* --------------------------------------------------- penanda tangan */

const AWALAN_TOKEN = "kci1";
const KONTEKS = {
  state: "kci/oauth/state/v1",
  tiket: "kci/oauth/tiket/v1",
};

/**
 * Kunci turunan per kegunaan (HKDF). Memakai KCI_JWT_SECRET yang sama,
 * tetapi materi kuncinya berbeda, sehingga satu token tidak pernah sah
 * untuk dua kegunaan.
 */
const kunciCache = new Map();
function kunciUntuk(konteks) {
  if (kunciCache.has(konteks)) return kunciCache.get(konteks);
  const rahasia = konfigurasi.jwtSecret;
  if (!rahasia || String(rahasia).length < 24) {
    throw new GalatVerifikasi(
      "penandatangan",
      "KCI_JWT_SECRET belum dikonfigurasi; penerbitan tiket dihentikan (fail-closed)."
    );
  }
  const kunci = Buffer.from(
    crypto.hkdfSync("sha256", Buffer.from(String(rahasia)), Buffer.alloc(0), Buffer.from(konteks), 32)
  );
  kunciCache.set(konteks, kunci);
  return kunci;
}

function tandaTangani(muatan, konteks) {
  const isi = Buffer.from(JSON.stringify(muatan)).toString("base64url");
  const t = crypto
    .createHmac("sha256", kunciUntuk(konteks))
    .update(`${konteks}.${isi}`)
    .digest("base64url");
  return `${AWALAN_TOKEN}.${isi}.${t}`;
}

/** Urai + periksa tanda tangan. Mengembalikan null untuk apa pun yang asing. */
function tandaUrai(nilai, konteks) {
  if (typeof nilai !== "string") return null;
  const bagian = nilai.split(".");
  if (bagian.length !== 3 || bagian[0] !== AWALAN_TOKEN) return null;
  const [, isi, t] = bagian;
  if (!isi || !t) return null;
  const harapan = crypto
    .createHmac("sha256", kunciUntuk(konteks))
    .update(`${konteks}.${isi}`)
    .digest();
  const diberi = Buffer.from(t, "base64url");
  if (diberi.length !== harapan.length) return null;
  if (!crypto.timingSafeEqual(harapan, diberi)) return null;
  try {
    const muatan = JSON.parse(Buffer.from(isi, "base64url").toString("utf8"));
    return muatan && typeof muatan === "object" ? muatan : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------- PKCE & state */

const acakUrl = (bita = 32) => crypto.randomBytes(bita).toString("base64url");

/**
 * Hanya terima jalur INTERNAL (relatif, diawali "/") sebagai tujuan
 * kembali — menolak "https://…", "//evil.com", "/\evil.com", dan karakter
 * kontrol, agar parameter `kembali` tidak menjadi celah open redirect.
 */
export function jalurInternal(jalur) {
  if (typeof jalur !== "string" || !jalur) return null;
  if (!jalur.startsWith("/")) return null;
  if (jalur.startsWith("//") || jalur.startsWith("/\\")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(jalur)) return null;
  return jalur;
}

/** fetch dengan tenggang waktu — OAuth tidak boleh menggantung server. */
async function fetchDenganTenggang(alamat, opsi = {}, ms = 8000) {
  const kendali = new AbortController();
  const jam = setTimeout(() => kendali.abort(), ms);
  try {
    return await fetch(alamat, { ...opsi, signal: kendali.signal });
  } finally {
    clearTimeout(jam);
  }
}

/** code_challenge = Base64URL(SHA256(code_verifier)) */
export function buatPkce() {
  const verifier = acakUrl(48); // 64 karakter, dalam rentang 43–128
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

/* ------------------------------------------------- tiket sudah dipakai */

/** jti -> waktu kedaluwarsa (ms). Best effort per proses; lihat catatan di atas. */
const tiketDipakai = new Map();
const MAKS_LEDGER = 20_000;

function catatTiketDipakai(jti, kedaluwarsaMs) {
  if (!jti) return;
  if (tiketDipakai.size >= MAKS_LEDGER) {
    // Buang entri terlama lebih dulu agar ledger tidak tumbuh tanpa batas.
    for (const [k, v] of tiketDipakai) {
      if (v < Date.now()) tiketDipakai.delete(k);
      if (tiketDipakai.size < MAKS_LEDGER * 0.9) break;
      tiketDipakai.delete(k);
    }
  }
  tiketDipakai.set(jti, kedaluwarsaMs);
}

const jam = setInterval(() => {
  const kini = Date.now();
  for (const [k, v] of tiketDipakai) if (kini > v) tiketDipakai.delete(k);
}, 60_000);
jam.unref?.();

export function statistikSesi() {
  return {
    modusTiket: "tanpa-keadaan (HMAC, berlaku lintas instance)",
    tiketDipakaiTercatat: tiketDipakai.size,
    // Dicatat apa adanya: lingkup ledger sekali pakai masih per instance.
    lingkupLedgerTiket: "per-instance (best effort lintas instance)",
  };
}

/* ------------------------------------------------------------- token */

/** Ambil kunci publik Chess.com untuk memverifikasi tanda tangan JWT. */
let cacheKunci = { nilai: null, kedaluwarsa: 0 };

export async function ambilKunciPublik({ paksa = false } = {}) {
  if (!paksa && cacheKunci.nilai && Date.now() < cacheKunci.kedaluwarsa) {
    return cacheKunci.nilai;
  }
  let res;
  try {
    res = await fetchDenganTenggang(`${OAUTH_DASAR}/certs`, {
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    throw new GalatVerifikasi("chesscom", `Gagal mengambil kunci publik: ${e?.message || e}`);
  }
  if (!res.ok) {
    throw new GalatVerifikasi("chesscom", `Gagal mengambil kunci publik (${res.status}).`);
  }
  let keys;
  try {
    ({ keys } = await res.json());
  } catch {
    throw new GalatVerifikasi("chesscom", "Respons kunci publik Chess.com bukan JSON.");
  }
  if (!Array.isArray(keys)) {
    throw new GalatVerifikasi("chesscom", "Respons kunci publik Chess.com tidak sah.");
  }
  cacheKunci = { nilai: keys, kedaluwarsa: Date.now() + 60 * 60 * 1000 };
  return keys;
}

function bacaBagianJson(b64, sebab) {
  try {
    const obj = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new Error("bukan objek");
    return obj;
  } catch {
    throw new GalatVerifikasi(sebab, "Bagian id_token tidak dapat dibaca.");
  }
}

/**
 * Verifikasi tanda tangan dan isi id_token (JWT RS256).
 *
 * Ini bagian paling penting untuk keamanan: tanpa memeriksa tanda tangan,
 * siapa pun bisa mengarang token dan mengaku sebagai pemain mana pun.
 *
 * Semua klaim yang DIWAJIBKAN harus ada: ketiadaan klaim = token ditolak
 * (bukan "dilewati bila tidak ada"). Yang boleh tidak ada hanya `nbf`.
 */
export async function verifikasiIdToken(idToken, { clientId } = {}) {
  if (!clientId || typeof clientId !== "string") {
    throw new GalatVerifikasi("konfigurasi", "client_id OAuth belum dikonfigurasi.");
  }

  const bagian = String(idToken || "").split(".");
  if (bagian.length !== 3) {
    throw new GalatVerifikasi("token", "Format id_token tidak valid.");
  }

  const [kepalaB64, muatanB64, tandaB64] = bagian;
  const kepala = bacaBagianJson(kepalaB64, "token");
  const muatan = bacaBagianJson(muatanB64, "token");

  if (kepala.alg !== "RS256") {
    throw new GalatVerifikasi("token", `Algoritma token tidak didukung: ${kepala.alg ?? "(kosong)"}`);
  }
  if (kepala.typ !== undefined && !/^JWT$/i.test(String(kepala.typ))) {
    throw new GalatVerifikasi("token", "Tipe token bukan JWT.");
  }
  if (typeof kepala.kid !== "string" || !kepala.kid) {
    throw new GalatVerifikasi("token", "id_token tanpa `kid` — kunci mana yang dipakai?");
  }

  const kunci = await ambilKunciPublik();
  // Wajib mencocokkan `kid` dari token. Jangan pernah "fallback" ke kunci
  // pertama: token dengan kid tak dikenal harus ditolak, karena kunci yang
  // salah hanya akan membuat verifikasi tanda tangan kebetulan/loyo.
  const cocok = kunci.find((k) => k && k.kid === kepala.kid);
  if (!cocok) throw new GalatVerifikasi("token", "Kunci publik token tidak dikenal.");

  let publik;
  try {
    publik = crypto.createPublicKey({ key: cocok, format: "jwk" });
  } catch {
    throw new GalatVerifikasi("token", "Kunci publik tidak dapat digunakan.");
  }

  let sah;
  try {
    sah = crypto.verify(
      "RSA-SHA256",
      Buffer.from(`${kepalaB64}.${muatanB64}`),
      publik,
      Buffer.from(tandaB64, "base64url")
    );
  } catch {
    sah = false;
  }
  if (!sah) throw new GalatVerifikasi("token", "Tanda tangan id_token tidak sah.");

  // Issuer WAJIB ada dan wajib Chess.com. Ini mencegah token dari penyedia
  // lain yang kebetulan tanda tangannya lolos dipakai di sini.
  const issuer = typeof muatan.iss === "string" ? muatan.iss.replace(/\/+$/, "") : "";
  if (!issuer) throw new GalatVerifikasi("token", "id_token tanpa `iss`.");
  if (issuer !== OAUTH_DASAR) {
    throw new GalatVerifikasi("token", `Issuer id_token tidak dikenal: ${issuer}`);
  }

  // Audience WAJIB ada dan WAJIB mencakup client_id aplikasi.
  const aud = Array.isArray(muatan.aud) ? muatan.aud : [muatan.aud];
  if (!aud.length || aud.every((a) => typeof a !== "string" || !a)) {
    throw new GalatVerifikasi("token", "id_token tanpa `aud`.");
  }
  if (!aud.includes(clientId)) {
    throw new GalatVerifikasi("token", "id_token bukan untuk aplikasi ini.");
  }

  // exp WAJIB, numerik, dan belum lewat. Umur token juga dibatasi agar token
  // bocor/tersalah-terbit tidak bisa dipakai berhari-hari.
  const kini = Math.floor(Date.now() / 1000);
  if (typeof muatan.exp !== "number" || !Number.isFinite(muatan.exp)) {
    throw new GalatVerifikasi("token", "id_token tanpa `exp`.");
  }
  if (kini > muatan.exp) throw new GalatVerifikasi("state-kedaluwarsa", "id_token kedaluwarsa.");
  if (muatan.exp - kini > konfigurasi.oauth.umurTokenMaksDetik) {
    throw new GalatVerifikasi("token", "id_token berlaku terlalu lama.");
  }
  if (muatan.nbf !== undefined) {
    if (typeof muatan.nbf !== "number" || !Number.isFinite(muatan.nbf)) {
      throw new GalatVerifikasi("token", "`nbf` id_token tidak sah.");
    }
    // Toleransi 60 detik untuk selisih jam server.
    if (kini < muatan.nbf - 60) throw new GalatVerifikasi("token", "id_token belum berlaku.");
  }

  // Identitas utama WAJIB ada.
  if (muatan.sub === undefined || muatan.sub === null || String(muatan.sub).trim() === "") {
    throw new GalatVerifikasi("username", "id_token tanpa `sub`.");
  }

  // Username: ambil, normalisasi dengan aturan kanonik, dan pastikan sah.
  const mentah = muatan.preferred_username ?? muatan.username ?? "";
  const diperiksa = periksaUsername(mentah || String(muatan.sub));
  if (!diperiksa.sah) {
    throw new GalatVerifikasi("username", "id_token memuat username yang tidak sah.");
  }

  return { ...muatan, usernameTerverifikasi: diperiksa.username };
}

/* -------------------------------------------------------------- alur */

export function oauthAktif() {
  return Boolean(konfigurasi.oauth.clientId && konfigurasi.oauth.redirectUri);
}

/** Langkah 1: buat URL untuk mengarahkan pengguna ke Chess.com. */
export function mulaiLogin({ kembaliKe = "/pendaftaran-anggota" } = {}) {
  if (!oauthAktif()) {
    throw Object.assign(
      new Error("Login Chess.com belum diaktifkan pada server ini."),
      { status: 503, sebab: "konfigurasi" }
    );
  }

  const { verifier, challenge } = buatPkce();

  // Validasi di sisi SERVER sebelum disimpan: nilai `kembali` dari query
  // string adalah input pengguna — hanya jalur internal yang diterima.
  const tujuan = jalurInternal(kembaliKe) || "/pendaftaran-anggota";

  // State = token tanpa keadaan berisi verifier PKCE + tujuan + masa berlaku,
  // ditandatangani server. Karena tidak ada `Map` di proses, callback yang
  // mendarat di instance lain (Vercel) tetap dapat memakainya.
  const state = tandaTangani(
    {
      v: verifier,
      r: tujuan,
      x: Math.floor(Date.now() / 1000) + konfigurasi.oauth.umurStateDetik,
    },
    KONTEKS.state
  );

  const params = new URLSearchParams({
    client_id: konfigurasi.oauth.clientId,
    redirect_uri: konfigurasi.oauth.redirectUri,
    response_type: "code",
    scope: "openid profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return { url: `${OAUTH_DASAR}/authorize?${params}`, state };
}

/** Langkah 4: tukar authorization code menjadi token, lalu baca identitas. */
export async function selesaikanLogin({ code, state }) {
  const data = tandaUrai(state, KONTEKS.state);
  if (!data || typeof data.v !== "string" || !data.v) {
    throw new GalatVerifikasi("state", "Sesi login tidak dikenali (state salah atau palsu).");
  }
  if (typeof data.x !== "number" || Date.now() / 1000 > data.x) {
    throw new GalatVerifikasi("state-kedaluwarsa", "Sesi login kedaluwarsa.");
  }
  if (!code || typeof code !== "string") {
    throw new GalatVerifikasi("chesscom", "Authorization code tidak ada.");
  }

  const bodi = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: konfigurasi.oauth.clientId,
    redirect_uri: konfigurasi.oauth.redirectUri,
    code,
    code_verifier: data.v,
  });
  if (konfigurasi.oauth.clientSecret) {
    bodi.set("client_secret", konfigurasi.oauth.clientSecret);
  }

  const res = await fetchDenganTenggang(`${OAUTH_DASAR}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: bodi,
  }).catch(() => {
    throw new GalatVerifikasi("chesscom", "Gagal menghubungi endpoint token Chess.com.");
  });

  if (!res.ok) {
    // Isi jawaban Chess.com hanya masuk log, tidak dikirim ke browser.
    const teks = await res.text().catch(() => "");
    console.warn(
      `[kci] Chess.com menolak pertukaran code (${res.status}): ${teks.slice(0, 200)}`
    );
    throw new GalatVerifikasi("chesscom", `Chess.com menolak permintaan token (${res.status}).`);
  }

  let token;
  try {
    token = await res.json();
  } catch {
    throw new GalatVerifikasi("chesscom", "Respons token Chess.com bukan JSON.");
  }
  if (!token || !token.id_token) {
    throw new GalatVerifikasi("chesscom", "Chess.com tidak mengirim id_token.");
  }

  const muatan = await verifikasiIdToken(token.id_token, {
    clientId: konfigurasi.oauth.clientId,
  });

  return {
    username: muatan.usernameTerverifikasi,
    kembaliKe: jalurInternal(data.r) || konfigurasi.oauth.tujuanSetelahLogin,
    muatan,
  };
}

/* ------------------------------------------------------------- tiket */

/**
 * Tiket membuktikan "username ini sudah diverifikasi server" tanpa perlu
 * menyimpan sesi login. Bentuknya token kecil bertanda tangan HMAC sehingga
 * (a) tidak dapat dipalsukan, (b) terikat pada satu username, (c) tetap sah
 * di instance mana pun, dan (d) hangus setelah umurnya lewat.
 */
export function terbitkanTiket(username, cara = "oauth") {
  const diperiksa = periksaUsername(username);
  if (!diperiksa.sah) {
    throw new GalatVerifikasi("username", "Username tidak sah; tiket tidak dapat diterbitkan.");
  }
  const umurDetik = konfigurasi.tiket.umurDetik;
  const kedaluwarsaPada = Math.floor(Date.now() / 1000) + umurDetik;
  const nilai = tandaTangani(
    {
      u: diperiksa.username,
      c: String(cara || "oauth").slice(0, 24),
      x: kedaluwarsaPada,
      j: acakUrl(12),
    },
    KONTEKS.tiket
  );
  return {
    tiket: nilai,
    berlakuDetik: umurDetik,
    kedaluwarsaPada: new Date(kedaluwarsaPada * 1000).toISOString(),
  };
}

/**
 * Periksa tiket TANPA memakainya.
 * @returns {{sah: boolean, sebab?: string, data?: {username:string, cara:string, jti:string, exp:number}}}
 *   `sebab`: kosong | tidak-sah | kedaluwarsa | sudah-dipakai | username-beda
 */
export function periksaTiket(nilai, username) {
  if (nilai === undefined || nilai === null || nilai === "") {
    return { sah: false, sebab: "kosong" };
  }
  if (typeof nilai !== "string") {
    // Bentuk lain (objek, angka, array) bukan tiket — jangan dibilang kosong.
    return { sah: false, sebab: "tidak-sah" };
  }
  let muatan;
  try {
    muatan = tandaUrai(nilai, KONTEKS.tiket);
  } catch {
    muatan = null;
  }
  if (!muatan || typeof muatan.u !== "string" || typeof muatan.x !== "number") {
    return { sah: false, sebab: "tidak-sah" };
  }
  if (Date.now() / 1000 > muatan.x) {
    return { sah: false, sebab: "kedaluwarsa" };
  }
  if (tiketDipakai.has(muatan.j)) {
    return { sah: false, sebab: "sudah-dipakai" };
  }
  const diminta = periksaUsername(username);
  if (!diminta.sah || diminta.username !== muatan.u) {
    return { sah: false, sebab: "username-beda" };
  }
  return {
    sah: true,
    data: { username: muatan.u, cara: muatan.c || "oauth", jti: muatan.j, exp: muatan.x },
  };
}

/** Tandai tiket sebagai sudah dipakai (sekali pakai). */
export function tandaiTiketDipakai(jti, kedaluwarsaDetik) {
  catatTiketDipakai(
    String(jti || ""),
    (Number.isFinite(kedaluwarsaDetik) ? kedaluwarsaDetik * 1000 : Date.now() + 30 * 60 * 1000)
  );
}

/**
 * Pakai tiket (periksa + langsung tandai dipakai).
 * Mengembalikan muatan tiket, atau null bila tidak sah.
 */
export function pakaiTiket(nilai, username) {
  const hasil = periksaTiket(nilai, username);
  if (!hasil.sah) return null;
  tandaiTiketDipakai(hasil.data.jti, hasil.data.exp);
  return { username: hasil.data.username, cara: hasil.data.cara };
}

/**
 * Periksa tiket tanpa memakainya dan tanpa memeriksa username pemiliknya
 * (pratinjau untuk formulir). Mengembalikan null bila palsu/kedaluwarsa.
 */
export function intipTiket(nilai) {
  if (!nilai || typeof nilai !== "string") return null;
  let dibaca;
  try {
    dibaca = tandaUrai(nilai, KONTEKS.tiket);
  } catch {
    return null;
  }
  if (!dibaca || typeof dibaca.u !== "string" || typeof dibaca.x !== "number") return null;
  if (Date.now() / 1000 > dibaca.x) return null;
  return {
    username: dibaca.u,
    cara: dibaca.c || "oauth",
    sudahDipakai: tiketDipakai.has(dibaca.j),
    kedaluwarsaPada: new Date(dibaca.x * 1000).toISOString(),
  };
}

export { OAUTH_DASAR };
