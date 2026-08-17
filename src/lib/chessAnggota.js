/**
 * Klien API keanggotaan.
 * Normalisasi/validasi bersama ada di src/lib/identitas.js agar aturan
 * di browser dan di server tidak pernah berbeda.
 */
export {
  normalisasiUsername,
  normalisasiHp,
  hpValid,
  formatHp,
  normalisasiNama,
  normalisasiKota,
  normalisasiTanggal,
  hitungUmur,
  kategoriUmur,
} from "./identitas.js";

/**
 * Alamat dasar API.
 *
 * Kosong (bawaan) = panggil URL relatif "/api/…", yang diteruskan oleh
 * proxy Vite saat pengembangan atau oleh Netlify/Nginx saat produksi.
 *
 * Isi VITE_API_DASAR hanya bila frontend dan backend berada di domain
 * berbeda tanpa proxy — misalnya frontend di GitHub Pages. Dalam kasus itu
 * backend wajib mencantumkan domain frontend pada KCI_ASAL_DIIZINKAN.
 */
const DASAR = (import.meta.env?.VITE_API_DASAR || "").replace(/\/$/, "");
const url = (jalur) => `${DASAR}${jalur}`;

/** Galat yang membawa rincian per-field dari server. */
export class GalatPendaftaran extends Error {
  constructor(pesan, { galat = {}, diblokir = false, alasan = null, status = 0 } = {}) {
    super(pesan);
    this.name = "GalatPendaftaran";
    this.galat = galat;
    this.diblokir = diblokir;
    this.alasan = alasan;
    this.status = status;
  }
}

export async function ambilDaftarAnggota() {
  const res = await fetch(url("/api/anggota"));
  if (!res.ok) throw new Error("Gagal memuat daftar anggota.");
  return res.json();
}

export async function ambilDaftarHitam() {
  const res = await fetch(url("/api/daftar-hitam"));
  if (!res.ok) throw new Error("Gagal memuat daftar larangan.");
  return res.json();
}

/**
 * Kirim formulir pendaftaran lengkap.
 * @param {object} data - username, namaLengkap, panggilan, hp, dana, kota,
 *                        tanggalLahir, email, klub, setuju
 */
export async function daftarDenganChessCom(data) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(url("/api/anggota"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  });
  const hasil = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatPendaftaran(hasil.pesan || "Pendaftaran gagal.", {
      galat: hasil.galat,
      diblokir: hasil.diblokir,
      alasan: hasil.alasan,
    });
  }
  return hasil;
}

/** Jalankan pemindaian fair play (aksi pengurus). */
export async function pindaiFairPlay() {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(url("/api/pengurus/pindai"), {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken },
  });
  if (!res.ok) throw new Error("Pemindaian gagal.");
  return res.json();
}

/* --------------------------------- verifikasi kepemilikan akun Chess.com */

/** Cara verifikasi apa saja yang tersedia di server. */
export async function caraVerifikasi() {
  const res = await fetch(url("/api/auth/cara"));
  if (!res.ok) throw new Error("Gagal memeriksa cara verifikasi.");
  return res.json();
}

/** Ambil URL login Chess.com; pemanggil yang melakukan pengalihan. */
export async function mulaiLoginChess(kembaliKe) {
  const q = kembaliKe ? `?kembali=${encodeURIComponent(kembaliKe)}` : "";
  const res = await fetch(url(`/api/auth/chess/mulai${q}`));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.pesan || "Login Chess.com belum tersedia.");
  return data;
}

/** Minta kode untuk ditempel di profil Chess.com. */
export async function mintaKodeProfil(username) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(url("/api/auth/kode/minta"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.pesan || "Gagal meminta kode.");
  return data;
}

/** Periksa apakah kode sudah terpasang di profil. */
export async function periksaKodeProfil(username) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(url("/api/auth/kode/periksa"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.pesan || "Gagal memeriksa kode.");
  return data;
}

/* ------------------------------------------------------------- pengurus */

/** Token pengurus disimpan di sessionStorage — hilang saat tab ditutup. */
const KUNCI_TOKEN = "kci-token-pengurus";

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

/* ----------------------------------------------------------- CSRF token */

const KUNCI_CSRF = "kci-csrf-token";

/** Ambil CSRF token — generate baru jika belum ada. */
export async function ambilCsrfToken() {
  try {
    const tersimpan = sessionStorage.getItem(KUNCI_CSRF);
    if (tersimpan) return tersimpan;
    // Generate token baru dari server
    const res = await fetch(url("/api/csrf-token"));
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        sessionStorage.setItem(KUNCI_CSRF, data.token);
        return data.token;
      }
    }
  } catch {
    /* abaikan */
  }
  return "";
}

/** Panggilan ke endpoint pengurus, otomatis menyertakan token. */
export async function apiPengurus(jalur, { metode = "GET", bodi } = {}) {
  const headers = {
    "X-Token-Admin": tokenPengurus.ambil(),
  };
  if (bodi) headers["Content-Type"] = "application/json";
  if (metode === "POST") {
    headers["X-CSRF-Token"] = await ambilCsrfToken();
  }
  const res = await fetch(url(`/api/pengurus${jalur}`), {
    method: metode,
    headers,
    body: bodi ? JSON.stringify(bodi) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatPendaftaran(data.pesan || `Gagal (${res.status}).`, {
      galat: data.galat,
      status: res.status,
    });
  }
  return data;
}

/** Daftar jenis turnamen & status yang dikenal server. */
export async function jenisTurnamen() {
  const res = await fetch(url("/api/turnamen/jenis"));
  if (!res.ok) throw new Error("Gagal memuat jenis turnamen.");
  return res.json();
}

/** Turnamen publik, boleh disaring per jenis. */
export async function ambilTurnamenPublik(jenis) {
  const q = jenis ? `?jenis=${encodeURIComponent(jenis)}` : "";
  const res = await fetch(url(`/api/turnamen${q}`));
  if (!res.ok) throw new Error("Gagal memuat turnamen.");
  return res.json();
}

/** Satu turnamen beserta klasemen. */
export async function ambilSatuTurnamen(id) {
  const res = await fetch(url(`/api/turnamen/${encodeURIComponent(id)}`));
  if (!res.ok) throw new Error("Turnamen tidak ditemukan.");
  return res.json();
}

/* ------------------------------------------------------------- konten */

/** Berita komunitas yang sudah dipublikasikan. */
export async function ambilBeritaPublik() {
  const res = await fetch(url("/api/berita"));
  if (!res.ok) throw new Error("Gagal memuat berita komunitas.");
  return res.json();
}

/** Pengumuman yang sudah dipublikasikan. */
export async function ambilPengumumanPublik() {
  const res = await fetch(url("/api/pengumuman"));
  if (!res.ok) throw new Error("Gagal memuat pengumuman.");
  return res.json();
}
