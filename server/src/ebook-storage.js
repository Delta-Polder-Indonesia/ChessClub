/**
 * Sumber PDF e-book yang hanya boleh dibaca backend.
 *
 * Storage privat adalah sumber PRIORITAS untuk production (koleksi besar
 * tidak perlu ikut setiap deploy). Bila belum dikonfigurasi, proxy tetap
 * boleh memakai berkas statis hasil build / sumber cadangan — lihat
 * api/ebook-preview.js. Sumber privat yang didukung:
 *   1. KCI_EBOOK_PRIVATE_BASE + KCI_EBOOK_PRIVATE_TOKEN (R2/S3/proxy lain)
 *   2. Supabase Storage bucket privat lewat service-role key.
 *
 * URL dan credential ini tidak pernah masuk bundle browser.
 */
import { konfigurasi } from "./konfigurasi.js";
import { namaBerkasEbook } from "../../src/data/ebook-sumber.js";

function nama(namaMentah) {
  return namaBerkasEbook(namaMentah);
}

function headerToken() {
  const token = String(process.env.KCI_EBOOK_PRIVATE_TOKEN || "").trim();
  return token
    ? {
        Authorization: `Bearer ${token}`,
        // Beberapa gateway S3-compatible membaca X-API-Key, sementara
        // endpoint Supabase memakai Authorization + apikey.
        "X-API-Key": token,
      }
    : {};
}

/**
 * Kembalikan kandidat sumber privat dalam bentuk { url, headers }.
 * Array kosong berarti production belum dikonfigurasi dan harus fail-closed.
 */
export function sumberEbookPrivat(namaMentah) {
  const berkas = nama(namaMentah);
  if (!berkas) return [];

  const custom = String(process.env.KCI_EBOOK_PRIVATE_BASE || "")
    .trim()
    .replace(/\/+$/, "");
  if (custom) {
    return [
      {
        url: `${custom}/${encodeURIComponent(berkas)}`,
        headers: headerToken(),
      },
    ];
  }

  const url = String(konfigurasi.supabase.url || "").replace(/\/+$/, "");
  const key = String(konfigurasi.supabase.serviceRole || "").trim();
  if (!url || !key) return [];

  const bucket = String(process.env.KCI_EBOOK_PRIVATE_BUCKET || "ebooks-private")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!bucket) return [];

  return [
    {
      url: `${url}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodeURIComponent(berkas)}`,
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
    },
  ];
}

export function ebookPrivatSiap() {
  return Boolean(
    String(process.env.KCI_EBOOK_PRIVATE_BASE || "").trim() ||
      (konfigurasi.supabase.url && konfigurasi.supabase.serviceRole)
  );
}
