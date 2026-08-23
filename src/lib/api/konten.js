import { urlApi } from "./core.js";

/* ------------------------------------------------------------- konten */

/** Berita komunitas yang sudah dipublikasikan. */
export async function ambilBeritaPublik() {
  const res = await fetch(urlApi("/api/berita"));
  if (!res.ok) throw new Error("Gagal memuat berita komunitas.");
  return res.json();
}

/** Pengumuman yang sudah dipublikasikan. */
export async function ambilPengumumanPublik() {
  const res = await fetch(urlApi("/api/pengumuman"));
  if (!res.ok) throw new Error("Gagal memuat pengumuman.");
  return res.json();
}

