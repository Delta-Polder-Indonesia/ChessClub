import { GalatApi, urlApi } from "./core.js";

/* ------------------------------------------------------------- pengurus */

/** Token pengurus disimpan di sessionStorage — hilang saat tab ditutup. */
const KUNCI_TOKEN = "kci-token-pengurus";
const KUNCI_PENGGUNA = "kci-pengguna-pengurus";

export const tokenPengurus = {
  ambil: () => {
    try {
      return sessionStorage.getItem(KUNCI_TOKEN) || "";
    } catch {
      return "";
    }
  },
  simpan: (t) => {
    try {
      sessionStorage.setItem(KUNCI_TOKEN, t);
    } catch {
      /* mode privat browser */
    }
  },
  hapus: () => {
    try {
      sessionStorage.removeItem(KUNCI_TOKEN);
    } catch {
      /* abaikan */
    }
  },
};

/**
 * Identitas pengurus yang sedang login — hanya username Chess.com,
 * dipakai untuk label di header dan jejak audit. BUKAN kredensial
 * (otorisasi tetap berdasarkan token).
 */
export const adminPengguna = {
  ambil: () => {
    try {
      return sessionStorage.getItem(KUNCI_PENGGUNA) || "";
    } catch {
      return "";
    }
  },
  simpan: (nama) => {
    const v = String(nama || "").trim().toLowerCase();
    try {
      if (v) sessionStorage.setItem(KUNCI_PENGGUNA, v);
      else sessionStorage.removeItem(KUNCI_PENGGUNA);
    } catch {
      /* abaikan */
    }
  },
  hapus: () => {
    try {
      sessionStorage.removeItem(KUNCI_PENGGUNA);
    } catch {
      /* abaikan */
    }
  },
};

/* ----------------------------------------------------------- CSRF token */

const KUNCI_CSRF = "kci-csrf-token";

/** Ambil CSRF token — generate baru jika belum ada. */
export async function ambilCsrfToken() {
  try {
    const tersimpan = sessionStorage.getItem(KUNCI_CSRF);
    if (tersimpan) return tersimpan;
    return await segarkanCsrfToken();
  } catch {
    /* abaikan */
  }
  return "";
}

/**
 * Paksa server menerbitkan token baru, menimpa yang tersimpan.
 * Dipakai saat token lama ditolak 403 (mis. server di-restart — token
 * CSRF hidup di memori server dan ikut hilang).
 */
async function segarkanCsrfToken() {
  const res = await fetch(urlApi("/api/csrf-token"));
  if (!res.ok) throw new Error("Gagal mengambil CSRF token.");
  const data = await res.json();
  if (!data.token) throw new Error("Respons CSRF token tidak sah.");
  sessionStorage.setItem(KUNCI_CSRF, data.token);
  return data.token;
}

function paksaCsrfBaru() {
  try {
    sessionStorage.removeItem(KUNCI_CSRF);
  } catch {
    /* abaikan */
  }
}

/**
 * Berapa milidetik harus menunggu sebelum mengulang permintaan yang
 * dibalas 429? Menghormati header Retry-After (detik) bila ada.
 */
function tungguRateLimit(res) {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter, 60) * 1000;
  }
  // Default 5 detik bila server tidak memberi tahu.
  return 5000;
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Panggilan ke endpoint pengurus, otomatis menyertakan token.
 *
 * Pemulihan otomatis:
 *  - 403 CSRF  → token lama dihapus, ambil yang baru, ulang SEKALI.
 *  - 429       → hormati Retry-After, tunggu, ulang (maks 2 kali).
 *
 * Ini memulihkan kondisi setelah server di-restart (token CSRF adalah
 * state in-memory di sisi server) maupun pembatasan laju sesaat tanpa
 * pengguna perlu me-refresh tab.
 */
export async function apiPengurus(jalur, { metode = "GET", bodi } = {}) {
  const lakukan = async (csrfSegar) => {
    const headers = {
      "X-Token-Admin": tokenPengurus.ambil(),
      "X-Admin-User": adminPengguna.ambil(),
    };
    if (bodi) headers["Content-Type"] = "application/json";
    if (metode === "POST") {
      headers["X-CSRF-Token"] = csrfSegar || (await ambilCsrfToken());
    }
    const res = await fetch(urlApi(`/api/pengurus${jalur}`), {
      method: metode,
      headers,
      body: bodi ? JSON.stringify(bodi) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  };

  let { res, data } = await lakukan();

  if (res.status === 403 && /csrf/i.test(data.pesan || "") && metode === "POST") {
    paksaCsrfBaru();
    const csrfBaru = await segarkanCsrfToken().catch(() => "");
    if (csrfBaru) {
      ({ res, data } = await lakukan(csrfBaru));
    }
  }

  // Pemulihan 429: tunggu sesuai Retry-After, lalu coba lagi.
  let percobaanUlang = 0;
  while (res.status === 429 && percobaanUlang < 2) {
    await tidur(tungguRateLimit(res));
    ({ res, data } = await lakukan());
    percobaanUlang += 1;
  }

  if (!res.ok) {
    throw new GalatApi(data.pesan || `Gagal (${res.status}).`, {
      galat: data.galat,
      status: res.status,
    });
  }
  return data;
}

