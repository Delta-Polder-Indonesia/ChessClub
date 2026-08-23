import { GalatApi, urlApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/* --------------------------------------------------------------- pesan */

/**
 * Kirim pesan dari form "Hubungi Kami" (publik).
 * Memakai jalur API yang sama dengan klien lain (menghormati VITE_API_DASAR
 * dan token CSRF) — jangan fetch("/api/...") langsung di halaman.
 */
export async function kirimPesan(data) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(urlApi("/api/pesan"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  });
  const hasil = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatApi(hasil.pesan || "Gagal mengirim pesan.", {
      status: res.status,
    });
  }
  return hasil;
}
