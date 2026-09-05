import { GalatApi, urlApi } from "./core.js";

/* ------------------------------------------------------------- pengurus */

/** Token pengurus disimpan di sessionStorage — hilang saat tab ditutup. */
const KUNCI_TOKEN = "kci-token-pengurus";
const KUNCI_PENGGUNA = "kci-pengguna-pengurus";
const KUNCI_PERAN = "kci-peran-pengurus";

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
      /* mode privat browser */
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

export const peranPengurus = {
  ambil: () => {
    try {
      return sessionStorage.getItem(KUNCI_PERAN) || "";
    } catch {
      return "";
    }
  },
  simpan: (role) => {
    const v = String(role || "").trim().toLowerCase();
    try {
      if (v) sessionStorage.setItem(KUNCI_PERAN, v);
      else sessionStorage.removeItem(KUNCI_PERAN);
    } catch {}
  },
  hapus: () => {
    try {
      sessionStorage.removeItem(KUNCI_PERAN);
    } catch {}
  },
  isMaster: () => {
    try {
      const r = sessionStorage.getItem(KUNCI_PERAN) || "";
      return r === "master";
    } catch {
      return false;
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
 * dibalas 429? Menghormati header Retry-After (detik) bila ada, tapi
 * dibatasi maksimal 5 detik agar antarmuka tidak terasa "macet loading"
 * berlama-lama saat ember rate-limit sedang penuh.
 */
function tungguRateLimit(res) {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter, 5) * 1000;
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
    // Scan otomatis adalah aksi administratif lama yang masih memakai GET.
    // Header custom membuat browser melakukan CORS preflight sehingga
    // link/prefetch GET biasa tidak dapat menjalankannya secara CSRF.
    if (metode === "GET" && jalur === "/pindai-otomatis") {
      headers["X-KCI-Action"] = "auto-scan";
    }
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

/* -------------------------------------------------------- login umum */

/**
 * Login sederhana: username + password -> token.
 * Password produksi diatur melalui KCI_ADMIN_USER / KCI_ADMIN_PASSWORD.
 * Endpoint publik POST /api/auth/login — tidak butuh CSRF wajib, tapi
 * tetap dilindungi rate-limit & brute-force di server.
 */
export async function loginAdmin(username, password) {
  const res = await fetch(urlApi("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatApi(data.pesan || `Gagal login (${res.status}).`, {
      status: res.status,
    });
  }
  return data;
}

/* -------------------------------------------------------- riwayat masuk */

/**
 * Catat aksi login masuk admin ke server.
 * @param {string} username - Akun Chess.com
 */
export async function catatMasukPengurus(username) {
  return apiPengurus("/masuk", {
    metode: "POST",
    bodi: { username },
  });
}

/**
 * Ambil daftar riwayat masuk pengurus.
 */
export async function ambilRiwayatMasuk() {
  return apiPengurus("/riwayat-masuk");
}

/**
 * Hapus satu catatan riwayat masuk berdasarkan ID.
 * @param {string} id
 */
export async function hapusRiwayatMasuk(id) {
  return apiPengurus("/riwayat-masuk/hapus", {
    metode: "POST",
    bodi: { id },
  });
}

/**
 * Bersihkan seluruh riwayat masuk pengurus.
 */
export async function bersihkanRiwayatMasuk() {
  return apiPengurus("/riwayat-masuk/bersihkan", {
    metode: "POST",
  });
}

/**
 * Ambil info admin saat ini (tanpa password).
 */
export async function infoAdmin() {
  return apiPengurus("/admin-info");
}

/**
 * Ganti password admin lewat dashboard.
 */
export async function gantiPasswordAdmin({ passwordLama, passwordBaru, usernameBaru }) {
  return apiPengurus("/ganti-password", {
    metode: "POST",
    bodi: { passwordLama, passwordBaru, usernameBaru },
  });
}

export async function daftarAdmins() {
  return apiPengurus("/admins");
}

export async function tambahAdminBaru({ username, password, role }) {
  return apiPengurus("/admins/tambah", {
    metode: "POST",
    bodi: { username, password, role },
  });
}

export async function hapusAdmin(username) {
  return apiPengurus("/admins/hapus", {
    metode: "POST",
    bodi: { username },
  });
}

export async function ubahAdmin({ username, password, role }) {
  return apiPengurus("/admins/ubah", {
    metode: "POST",
    bodi: { username, password, role },
  });
}
