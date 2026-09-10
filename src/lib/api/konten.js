import { fetchApi } from "./core.js";

/* ------------------------------------------------------------- konten */

/**
 * Ambil daftar konten publik. Semua jenis kegagalan — jaringan, HTTP, atau
 * JSON rusak — dibalas dengan pesan ramah yang sama supaya tidak pernah ada
 * pesan mentah browser yang bocor ke halaman.
 */
async function ambilKontenPublik(jalur, pesanGagal) {
  try {
    const res = await fetchApi(jalur);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    throw new Error(pesanGagal);
  }
}

/** Berita komunitas yang sudah dipublikasikan. */
export async function ambilBeritaPublik() {
  return ambilKontenPublik("/api/berita", "Gagal memuat berita komunitas.");
}

/** Pengumuman yang sudah dipublikasikan. */
export async function ambilPengumumanPublik() {
  return ambilKontenPublik("/api/pengumuman", "Gagal memuat pengumuman.");
}

