/**
 * Login dengan akun Chess.com (OAuth 2.0 + OpenID Connect).
 *
 * Inilah bukti kepemilikan akun yang paling kuat: pendaftar masuk langsung
 * ke chess.com dengan kata sandinya sendiri, lalu Chess.com yang memberi
 * tahu kita siapa dia. Kita tidak pernah melihat kata sandinya.
 *
 * Alur (Authorization Code + PKCE):
 *   1. /api/auth/chess/mulai   -> arahkan pengguna ke oauth.chess.com
 *   2. pengguna login & menyetujui di chess.com
 *   3. /api/auth/chess/kembali -> tukar kode jadi token, baca id_token
 *   4. simpan "tiket verifikasi" berumur pendek untuk dipakai formulir
 *
 * Catatan: client_id harus diminta ke Chess.com lebih dulu melalui
 * https://forms.gle/7Ai8UZCJMZkCVvxn9 (persetujuan manual). Selama belum
 * ada, sistem otomatis memakai jalur cadangan (verifikasi-profil.js).
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";

const OAUTH_DASAR = "https://oauth.chess.com";

/* ------------------------------------------------------- PKCE & state */

const acakUrl = (bita = 32) => crypto.randomBytes(bita).toString("base64url");

/** code_challenge = Base64URL(SHA256(code_verifier)) */
export function buatPkce() {
  const verifier = acakUrl(48); // 64 karakter, dalam rentang 43–128
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

/* --------------------------------------------- penyimpanan sesi singkat */

/**
 * Sesi OAuth yang sedang berjalan (state -> data). Disimpan di memori
 * karena umurnya hanya beberapa menit; kalau server restart di tengah
 * alur, pengguna cukup mengulang login.
 */
const sesi = new Map();
const UMUR_SESI_MS = 10 * 60 * 1000;

/** Tiket hasil verifikasi, ditukar formulir saat mengirim pendaftaran. */
const tiket = new Map();
const UMUR_TIKET_MS = 30 * 60 * 1000;

function bersihkan(peta) {
  const kini = Date.now();
  for (const [k, v] of peta) if (kini > v.kedaluwarsa) peta.delete(k);
}

const jam = setInterval(() => {
  bersihkan(sesi);
  bersihkan(tiket);
}, 60_000);
jam.unref?.();

export function statistikSesi() {
  return { sesiAktif: sesi.size, tiketAktif: tiket.size };
}

/* ------------------------------------------------------------- token */

/** Ambil kunci publik Chess.com untuk memverifikasi tanda tangan JWT. */
let cacheKunci = { nilai: null, kedaluwarsa: 0 };

export async function ambilKunciPublik() {
  if (cacheKunci.nilai && Date.now() < cacheKunci.kedaluwarsa) {
    return cacheKunci.nilai;
  }
  const res = await fetch(`${OAUTH_DASAR}/certs`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Gagal mengambil kunci publik (${res.status}).`);
  const { keys } = await res.json();
  cacheKunci = { nilai: keys, kedaluwarsa: Date.now() + 60 * 60 * 1000 };
  return keys;
}

/**
 * Verifikasi tanda tangan dan isi id_token (JWT RS256).
 *
 * Ini bagian paling penting untuk keamanan: tanpa memeriksa tanda tangan,
 * siapa pun bisa mengarang token dan mengaku sebagai pemain mana pun.
 */
export async function verifikasiIdToken(idToken, { clientId } = {}) {
  const bagian = String(idToken || "").split(".");
  if (bagian.length !== 3) throw new Error("Format id_token tidak valid.");

  const [kepalaB64, muatanB64, tandaB64] = bagian;
  const kepala = JSON.parse(Buffer.from(kepalaB64, "base64url").toString());
  const muatan = JSON.parse(Buffer.from(muatanB64, "base64url").toString());

  if (kepala.alg !== "RS256") {
    throw new Error(`Algoritma token tidak didukung: ${kepala.alg}`);
  }

  const kunci = await ambilKunciPublik();
  const cocok = kunci.find((k) => k.kid === kepala.kid) || kunci[0];
  if (!cocok) throw new Error("Kunci publik tidak ditemukan.");

  const publik = crypto.createPublicKey({ key: cocok, format: "jwk" });
  const sah = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${kepalaB64}.${muatanB64}`),
    publik,
    Buffer.from(tandaB64, "base64url")
  );
  if (!sah) throw new Error("Tanda tangan id_token tidak sah.");

  const kini = Math.floor(Date.now() / 1000);
  if (muatan.exp && kini > muatan.exp) throw new Error("id_token kedaluwarsa.");
  if (muatan.nbf && kini < muatan.nbf - 60)
    throw new Error("id_token belum berlaku.");
  if (clientId && muatan.aud && muatan.aud !== clientId) {
    const daftar = Array.isArray(muatan.aud) ? muatan.aud : [muatan.aud];
    if (!daftar.includes(clientId)) {
      throw new Error("id_token bukan untuk aplikasi ini.");
    }
  }
  return muatan;
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
      { status: 503 }
    );
  }

  const { verifier, challenge } = buatPkce();
  const state = acakUrl(16);

  sesi.set(state, {
    verifier,
    kembaliKe,
    kedaluwarsa: Date.now() + UMUR_SESI_MS,
  });

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
  const data = sesi.get(state);
  if (!data) {
    throw Object.assign(
      new Error("Sesi login tidak dikenal atau sudah kedaluwarsa. Ulangi dari awal."),
      { status: 400 }
    );
  }
  sesi.delete(state); // sekali pakai — cegah serangan pemutaran ulang

  const bodi = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: konfigurasi.oauth.clientId,
    redirect_uri: konfigurasi.oauth.redirectUri,
    code,
    code_verifier: data.verifier,
  });
  if (konfigurasi.oauth.clientSecret) {
    bodi.set("client_secret", konfigurasi.oauth.clientSecret);
  }

  const res = await fetch(`${OAUTH_DASAR}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: bodi,
  });

  if (!res.ok) {
    const teks = await res.text().catch(() => "");
    throw Object.assign(
      new Error(`Chess.com menolak permintaan token (${res.status}). ${teks.slice(0, 200)}`),
      { status: 502 }
    );
  }

  const token = await res.json();
  if (!token.id_token) {
    throw Object.assign(new Error("Chess.com tidak mengirim id_token."), {
      status: 502,
    });
  }

  const muatan = await verifikasiIdToken(token.id_token, {
    clientId: konfigurasi.oauth.clientId,
  });

  const username = String(
    muatan.preferred_username || muatan.username || muatan.sub || ""
  ).toLowerCase();
  if (!username) {
    throw Object.assign(new Error("id_token tidak memuat username."), {
      status: 502,
    });
  }

  return { username, kembaliKe: data.kembaliKe, muatan };
}

/* ------------------------------------------------------------- tiket */

/**
 * Tiket membuktikan "username ini sudah diverifikasi" tanpa perlu
 * menyimpan sesi login. Ditandatangani agar tidak bisa dipalsukan.
 */
export function terbitkanTiket(username, cara = "oauth") {
  const nilai = acakUrl(24);
  tiket.set(nilai, {
    username: username.toLowerCase(),
    cara,
    kedaluwarsa: Date.now() + UMUR_TIKET_MS,
  });
  return { tiket: nilai, berlakuDetik: Math.floor(UMUR_TIKET_MS / 1000) };
}

/** Pakai tiket (sekali pakai). Mengembalikan null bila tidak sah. */
export function pakaiTiket(nilai, username) {
  const data = tiket.get(String(nilai || ""));
  if (!data) return null;
  if (Date.now() > data.kedaluwarsa) {
    tiket.delete(nilai);
    return null;
  }
  if (data.username !== String(username || "").toLowerCase()) return null;
  tiket.delete(nilai);
  return data;
}

/** Periksa tiket tanpa memakainya (untuk pratinjau di formulir). */
export function intipTiket(nilai) {
  const data = tiket.get(String(nilai || ""));
  if (!data || Date.now() > data.kedaluwarsa) return null;
  return { username: data.username, cara: data.cara };
}

export { OAUTH_DASAR };
