import { GalatApi, urlApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/* --------------------------------------------------------------- pesan */

/**
 * Kirim pesan dari form "Hubungi Kami" (publik).
 * Memakai jalur API yang sama dengan klien lain (menghormati VITE_API_DASAR
 * dan token CSRF) — jangan fetch("/api/...") langsung di halaman.
 *
 * Bila server membalas 403 CSRF, token yang tersimpan dihapus dan
 * permintaan diulang sekali dengan token baru.
 */
export async function kirimPesan(data) {
  const kirim = async (csrfToken) => {
    const res = await fetch(urlApi("/api/pesan"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(data),
    });
    const hasil = await res.json().catch(() => ({}));
    return { res, hasil };
  };

  let csrfToken = await ambilCsrfToken();
  let { res, hasil } = await kirim(csrfToken);

  if (res.status === 403 && /csrf/i.test(hasil.pesan || "")) {
    try {
      sessionStorage.removeItem("kci-csrf-token");
      csrfToken = await ambilCsrfToken();
      ({ res, hasil } = await kirim(csrfToken));
    } catch {
      /* token baru gagal diambil, lanjut ke cek res di bawah */
    }
  }

  if (!res.ok) {
    throw new GalatApi(hasil.pesan || "Gagal mengirim pesan.", {
      status: res.status,
    });
  }
  return hasil;
}
