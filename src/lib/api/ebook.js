import { GalatApi, urlApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/* --------------------------------------------------------------- e-book */

/**
 * Tebus kode akses unduhan e-book (publik).
 *
 * Pola sama dengan kirimPesan(): hormati VITE_API_DASAR, sertakan token
 * CSRF, dan ulang sekali bila token kedaluwarsa di sisi server.
 */
export async function tebusUnduhanEbook(data) {
  const kirim = async (csrfToken) => {
    const res = await fetch(urlApi("/api/ebook/tebus"), {
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
    throw new GalatApi(hasil.pesan || "Kode akses tidak bisa ditebus.", {
      status: res.status,
    });
  }
  return hasil;
}
